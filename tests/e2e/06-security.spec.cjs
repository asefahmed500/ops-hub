/* PHASE 8 — Security & data integrity (controlled, non-destructive to real users). */
module.exports = async function securitySpec(h, ctx) {
  const { reporter, browser } = ctx;
  const { API_URL, BASE_URL, api, exists, loginViaUI, newRoleContext, stopTracing } = h;

  reporter.phase("PHASE 8 — Security & Data Integrity");
  const role = await newRoleContext(browser, reporter, "security");
  const { page } = role;

  // ---------- unauthenticated API ----------
  for (const ep of ["/state", "/logs", "/rotations", "/mto-tasks", "/goals", "/reviews", "/notifications", "/programme", "/platform/overview", "/audit", "/users"]) {
    const res = await api(page, ep, { token: null });
    reporter.check(`unauthenticated ${ep} returns 401`, res.status === 401, `HTTP ${res.status}`);
  }

  // ---------- login via API to get role tokens ----------
  const hrLogin = await api(page, "/auth/login", { method: "POST", body: { email: "hr@opshub.local", password: "hr123456" }, token: null });
  const nLogin = await api(page, "/auth/login", { method: "POST", body: { email: "nusrat@opshub.local", password: "trainee123" }, token: null });
  const tLogin = await api(page, "/auth/login", { method: "POST", body: { email: "tanvir@opshub.local", password: "trainee123" }, token: null });
  const hrToken = hrLogin.body.token;
  const nToken = nLogin.body.token;
  const tToken = tLogin.body.token;
  reporter.check("seeded role logins via API succeed", !!hrToken && !!nToken && !!tToken, `hr=${hrLogin.status} n=${nLogin.status} t=${tLogin.status}`);

  // ---------- validation ----------
  const noFields = await api(page, "/auth/login", { method: "POST", body: {}, token: null });
  reporter.check("login with empty body rejected", noFields.status === 401, `HTTP ${noFields.status}`);
  const shortPw = await api(page, "/auth/register", { method: "POST", body: {
    companyName: "QA Sec", name: "QA Sec", email: `qa.sec.${Date.now()}@example.test`, password: "short",
  }, token: null });
  reporter.check("short password rejected on registration", shortPw.status === 400, `HTTP ${shortPw.status}`);
  const badReview = await api(page, "/reviews", { method: "POST", token: nToken, body: { traineeId: "usr_tanvir" } });
  reporter.check("trainee cannot create review", badReview.status === 403 || badReview.status === 400, `HTTP ${badReview.status}`);
  const badProgramme = await api(page, "/programme", { method: "PATCH", token: nToken, body: { lengthMonths: 18 } });
  reporter.check("trainee cannot change programme settings", badProgramme.status === 400, `HTTP ${badProgramme.status}`);
  const badUserCreate = await api(page, "/users", { method: "POST", token: nToken, body: { name: "X", email: "x@x.test", password: "Password123" } });
  reporter.check("trainee cannot create users", badUserCreate.status === 403, `HTTP ${badUserCreate.status}`);
  const auditTrainee = await api(page, "/audit", { token: nToken });
  reporter.check("trainee cannot read audit log", auditTrainee.status === 403, `HTTP ${auditTrainee.status}`);
  const auditHr = await api(page, "/audit", { token: hrToken });
  reporter.check("HR can read audit log", auditHr.status === 200 && Array.isArray(auditHr.body), `HTTP ${auditHr.status}`);

  // ---------- IDOR: cross-user operations inside one tenant ----------
  const nState = await api(page, "/state", { token: nToken });
  const tState = await api(page, "/state", { token: tToken });
  const foreignLog = (tState.body.logs || [])[0];
  if (foreignLog) {
    const del = await api(page, `/logs/${foreignLog.id}/delete`, { method: "POST", token: nToken });
    reporter.check("trainee cannot DELETE another trainee's log (IDOR)", del.status === 404 || del.status === 403, `HTTP ${del.status}`);
    const verify = await api(page, "/logs", { token: tToken });
    reporter.check("victim log still exists after IDOR attempt", (verify.body || []).some((l) => l.id === foreignLog.id));
    const patch = await api(page, `/logs/${foreignLog.id}`, { method: "PATCH", token: nToken, body: { text: "PWNED" } });
    reporter.check("trainee cannot UPDATE another trainee's log (IDOR)", patch.status === 404 || patch.status === 403, `HTTP ${patch.status}`);
  } else {
    reporter.skip("log IDOR checks", "no seed log for trainee tanvir");
  }
  const foreignTask = (tState.body.tasks || [])[0];
  if (foreignTask) {
    const del = await api(page, `/mto-tasks/${foreignTask.id}/delete`, { method: "POST", token: nToken });
    reporter.check("trainee cannot DELETE another trainee's task (IDOR)", del.status === 404 || del.status === 403, `HTTP ${del.status}`);
  }
  const foreignGoal = (tState.body.goals || [])[0];
  if (foreignGoal) {
    const del = await api(page, `/goals/${foreignGoal.id}/delete`, { method: "POST", token: nToken });
    reporter.check("trainee cannot DELETE another trainee's goal (IDOR)", del.status === 404 || del.status === 403, `HTTP ${del.status}`);
  }
  reporter.check("trainee state contains only own logs", (nState.body.logs || []).every((l) => l.authorId === "usr_nusrat"), `${nState.body.logs?.length} logs`);
  reporter.check("trainee state contains only own tasks", (nState.body.tasks || []).every((t) => t.ownerId === "usr_nusrat"));

  // ---------- cross-tenant IDOR ----------
  const demoReview = (await api(page, "/reviews", { token: hrToken })).body?.[0];
  const qaTenantHr = ctx.accounts && ctx.accounts.hrEmail;
  if (demoReview && qaTenantHr) {
    const otherHr = await api(page, "/auth/login", { method: "POST", token: null, body: { email: qaTenantHr, password: "QaPass12345" } });
    if (otherHr.status === 201) {
      const cross = await api(page, `/reviews/${demoReview.id}/decide`, { method: "POST", token: otherHr.body.token, body: { outcome: "approved", rating: 5, comment: "cross-tenant attempt" } });
      reporter.check("HR cannot decide another tenant's review", cross.status === 404 || cross.status === 403, `HTTP ${cross.status}`);
    }
  }

  // ---------- XSS / injection safe input ----------
  await loginViaUI(page, "nusrat@opshub.local", "trainee123");
  await page.goto(`${BASE_URL}/log`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  let dialogFired = false;
  page.on("dialog", async (d) => {
    dialogFired = true;
    await d.dismiss();
  });
  const payload = `<img src=x onerror="window.__QA_XSS__=1">`;
  await page.getByPlaceholder("Prepared the campaign report…").fill(payload);
  await page.getByRole("button", { name: "Save log" }).click();
  await page.waitForTimeout(1100);
  const xssFlag = await page.evaluate(() => !!window.__QA_XSS__);
  reporter.check("XSS payload does not execute in UI", !xssFlag && !dialogFired, `flag=${xssFlag} dialog=${dialogFired}`);
  reporter.check("XSS payload stored literally (not sanitized into markup)", await exists(page, page.getByText(payload, { exact: false }), 4000));
  const logsAfter = (await api(page, "/logs")).body || [];
  const xssLog = logsAfter.find((l) => l.text === payload);
  if (xssLog) {
    const cleanup = await api(page, `/logs/${xssLog.id}/delete`, { method: "POST" });
    reporter.check("QA XSS test log cleaned up", cleanup.status === 200 || cleanup.status === 201, `HTTP ${cleanup.status}`);
  }

  // ---------- token hygiene ----------
  const cookies = await page.context().cookies();
  reporter.check("no auth token stored in browser cookies", !cookies.some((c) => /token|session|auth/i.test(c.name)), cookies.map((c) => c.name).join(","));
  const htmlHasToken = (await page.content()).includes(await h.tokenOf(page));
  reporter.check("JWT not embedded in page HTML", !htmlHasToken);

  // ---------- malformed inputs ----------
  const malformed = await page.request.fetch(`${API_URL}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" }, data: "{\"broken\":",
  });
  reporter.check("malformed JSON returns 400", malformed.status() === 400, `HTTP ${malformed.status()}`);

  await stopTracing(role.context, "security");
};
