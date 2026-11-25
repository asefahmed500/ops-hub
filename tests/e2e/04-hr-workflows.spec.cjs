/* PHASES 5-8 — HR admin workflows, reviews, reports, settings. */
module.exports = async function hrWorkflowsSpec(h, ctx) {
  const { reporter, browser } = ctx;
  const { BASE_URL, api, exists, loginViaUI, newRoleContext, stopTracing } = h;

  reporter.phase("PHASE 5-7 — HR Workflows & Advanced Features");
  const role = await newRoleContext(browser, reporter, "hr-workflows");
  const { page } = role;
  await loginViaUI(page, "hr@opshub.local", "hr123456");
  const stamp = Date.now().toString().slice(-6);

  // ---------- OVERVIEW vs API ----------
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const state = await api(page, "/state");
  reporter.check("HR state endpoint returns reports + trainees", state.status === 200 && !!state.body.reports && Array.isArray(state.body.trainees), `reports=${!!state.body.reports}`);
  const body = await page.locator("body").innerText();
  reporter.check("HR overview shows real trainee count", body.includes(String(state.body.trainees.length)), `${state.body.trainees.length}`);

  // ---------- TRAINEES SEARCH ----------
  await page.goto(`${BASE_URL}/trainees`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1100);
  const search = page.getByPlaceholder("Search trainee or department");
  await search.fill("Nusrat");
  await page.waitForTimeout(500);
  let listText = await page.locator("body").innerText();
  reporter.check("trainee search filters by name", listText.includes("Nusrat") && !listText.includes("Tanvir"), listText.slice(0, 120));
  await search.fill("Finance");
  await page.waitForTimeout(500);
  listText = await page.locator("body").innerText();
  reporter.check("trainee search filters by department", listText.includes("Tanvir") && !listText.includes("Nusrat"), listText.slice(0, 120));
  await search.fill("");
  await page.waitForTimeout(400);

  // ---------- REMINDER -> NOTIFICATION ----------
  await page.getByText("Nusrat Jahan", { exact: false }).first().click();
  await page.waitForTimeout(500);
  const reminderBtn = page.getByRole("button", { name: "Send reminder" });
  reporter.check("trainee detail sheet opens with reminder action", await exists(page, reminderBtn, 3000));
  if (await exists(page, reminderBtn, 1000)) {
    await reminderBtn.click();
    await page.waitForTimeout(700);
    const notice = await exists(page, page.getByText(/Reminder sent/i), 3000);
    reporter.check("reminder confirmation shown", notice);
    const tCtx = ctx.sessions && ctx.sessions.trainee;
    if (tCtx) {
      const traineeNotifs = await api(tCtx.page, "/notifications");
      reporter.check("reminder creates notification in trainee account", (traineeNotifs.body || []).some((n) => n.title === "Reminder from HR"), `count=${traineeNotifs.body?.length}`);
    }
  }

  // ---------- CREATE REVIEW VIA UI ----------
  await page.goto(`${BASE_URL}/trainees`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1100);
  const fab = page.locator("text=+").last();
  await fab.click();
  await page.waitForTimeout(400);
  const reviewSheet = await exists(page, page.getByText("New review", { exact: true }), 3000);
  reporter.check("new review sheet opens from FAB", reviewSheet);
  if (reviewSheet) {
    await page.getByText("Nusrat Jahan", { exact: true }).last().click();
    await page.getByRole("button", { name: "Create review" }).click();
    await page.waitForTimeout(1100);
    const reviews = (await api(page, "/reviews")).body || [];
    reporter.check("review created and stored in API", reviews.some((r) => r.traineeName === "Nusrat Jahan" && r.kind === "evaluation"), `count=${reviews.length}`);
  }

  // ---------- REVIEW DECISION (approve) ----------
  await page.goto(`${BASE_URL}/reviews`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1100);
  const before = (await api(page, "/reviews")).body || [];
  const pending = before.find((r) => r.status === "pending");
  reporter.check("HR has a pending review to decide", !!pending, pending?.traineeName || "none");
  if (pending) {
    await page.getByRole("button", { name: "Open review" }).first().click();
    await page.waitForTimeout(400);
    const approve = page.getByRole("button", { name: "Approve", exact: true });
    const disabledBeforeRating = await approve.isDisabled();
    reporter.check("approve disabled until rating chosen", disabledBeforeRating);
    // Stars expose an accessibility label ("4 stars") on web.
    const star = page.getByLabel("4 stars");
    await star.waitFor({ state: "visible", timeout: 5000 });
    await star.click({ force: true });
    await page.waitForTimeout(250);
    await page.getByPlaceholder("Feedback for the trainee…").fill(`QA approved ${stamp}`);
    await approve.click();
    await page.waitForTimeout(1100);
    const after = (await api(page, "/reviews")).body || [];
    const decided = after.find((r) => r.id === pending.id);
    reporter.check("review approval persisted with rating + comment", !!decided && decided.status === "approved" && !!decided.rating && decided.comment.includes(stamp), JSON.stringify(decided).slice(0, 220));
  }

  // ---------- REPORTS ----------
  await page.goto(`${BASE_URL}/reports`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1100);
  const reports = (await api(page, "/reports")).body;
  reporter.check("reports API returns weekly + dept analytics", !!reports && Array.isArray(reports.weeklyLogs) && Array.isArray(reports.deptProgress));
  const dlPromise = page.waitForEvent("download", { timeout: 12000 }).catch(() => null);
  await page.getByRole("button", { name: "Export logs (CSV)" }).click();
  const dl = await dlPromise;
  reporter.check("HR CSV export downloads", !!dl, dl ? dl.suggestedFilename() : "no download");

  // ---------- SETTINGS ----------
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const tenant = await api(page, "/auth/tenants/me");
  reporter.check("HR sees invite code from API", tenant.status === 200 && !!tenant.body.inviteCode, tenant.body?.inviteCode);
  const inviteFromUi = await page.locator("body").innerText();
  reporter.check("invite code rendered in settings UI", inviteFromUi.includes(tenant.body.inviteCode), tenant.body?.inviteCode);
  const beforeProg = (await api(page, "/programme")).body;
  await page.getByText("18 mo", { exact: true }).click();
  await page.waitForTimeout(900);
  const afterProg = (await api(page, "/programme")).body;
  reporter.check("programme length change persisted", afterProg.lengthMonths === 18, `${beforeProg.lengthMonths} → ${afterProg.lengthMonths}`);
  const switches = page.getByRole("switch");
  if ((await switches.count()) >= 2) {
    const beforeExport = afterProg.traineesExport;
    await switches.nth(1).click({ force: true });
    await page.waitForTimeout(900);
    const afterExport = (await api(page, "/programme")).body;
    reporter.check("trainees-export toggle persisted", afterExport.traineesExport !== beforeExport, `${beforeExport} → ${afterExport.traineesExport}`);
    await switches.nth(1).click({ force: true });
    await page.waitForTimeout(700);
  }

  await stopTracing(role.context, "hr-workflows");
};
