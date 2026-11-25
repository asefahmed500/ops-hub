/* PHASE 3 — Authentication and authorization through the real UI. */
module.exports = async function authSpec(h, ctx) {
  const { reporter, browser } = ctx;
  const { BASE_URL, api, loginViaUI, newRoleContext, stopTracing, exists } = h;

  reporter.phase("PHASE 3 — Authentication & Authorization");
  const role = await newRoleContext(browser, reporter, "auth-flow");
  const { page } = role;

  // --- public pages load ---
  for (const path of ["/welcome", "/sign-in", "/sign-up", "/join", "/forgot-password"]) {
    const res = await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    reporter.check(`public page loads: ${path}`, res && res.status() < 400, `HTTP ${res && res.status()}`);
  }

  // --- empty-field validation ---
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForTimeout(300);
  const emailErr = await exists(page, page.getByText("Enter your work email"), 3000);
  const passErr = await exists(page, page.getByText("Enter your password"), 3000);
  reporter.check("sign-in empty validation shows both errors", emailErr && passErr, `email=${emailErr} password=${passErr}`);

  // --- invalid credentials ---
  await page.getByPlaceholder("name@company.com").fill("hr@opshub.local");
  await page.getByPlaceholder("••••••••").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const invalid = await exists(page, page.getByText("Invalid email or password"), 8000);
  reporter.check("invalid password shows server error", invalid, invalid ? "" : await page.locator("body").innerText());
  reporter.check("invalid credentials keep user on sign-in", page.url().includes("sign-in"), page.url());

  // --- direct protected URL while unauthenticated ---
  await page.goto(`${BASE_URL}/platform`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);
  reporter.check("unauthenticated /platform redirects to sign-in", page.url().includes("sign-in"), page.url());

  // --- email-format validation (no unsupported phone-login claim) ---
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("name@company.com").fill("not-an-email");
  await page.getByPlaceholder("••••••••").fill("hr123456");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const badEmail = await exists(page, page.getByText("Enter your work email"), 3000);
  reporter.check("malformed email rejected by client validation", badEmail, badEmail ? "" : "no validation error");
  reporter.check("sign-in does not advertise unsupported phone login", !(await page.locator("body").innerText()).includes("Phone or work email"));

  // --- valid HR login + role routing ---
  await loginViaUI(page, "hr@opshub.local", "hr123456");
  reporter.check("HR login routes to HR workspace", (await page.locator("body").innerText()).includes("Overview"), page.url());
  const hrMe = await api(page, "/auth/me");
  reporter.check("HR /auth/me returns hr role", hrMe.status === 200 && hrMe.body.role === "hr", JSON.stringify(hrMe.body).slice(0, 200));

  // --- session persistence ---
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);
  reporter.check("session persists after reload", !(await page.locator("body").innerText()).includes("Welcome back"), page.url());
  const token = await h.tokenOf(page);
  reporter.check("JWT stored in localStorage", !!token && token.split(".").length === 3, `len=${token ? token.length : 0}`);

  // --- sign out ---
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await h.clickConfirm(page, "Sign out");
  await page.waitForTimeout(1500);
  reporter.check("sign out returns to sign-in", page.url().includes("sign-in"), page.url());
  reporter.check("token cleared on sign out", !(await h.tokenOf(page)), `token=${await h.tokenOf(page)}`);

  // --- register company via UI ---
  await page.goto(`${BASE_URL}/sign-up`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("e.g. Square Group").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(700);
  const stamp = Date.now().toString().slice(-7);
  const company = `QA Compass ${stamp}`;
  const hrEmail = `qa.hr.${stamp}@example.test`;
  await page.getByPlaceholder("e.g. Square Group").fill(company);
  await page.getByPlaceholder("e.g. Mr. Rahman").fill("QA Administrator");
  await page.getByPlaceholder("name@company.com").fill(hrEmail);
  await page.getByPlaceholder("Min. 8 characters").fill("QaPass12345");
  await page.getByRole("button", { name: "Create programme" }).click();
  const inviteShown = await exists(page, page.getByText("Your invite code"), 10000);
  reporter.check("company registration shows invite code step", inviteShown, inviteShown ? "" : (await page.locator("body").innerText()).slice(0, 300));
  let inviteCode = null;
  if (inviteShown) {
    const bodyText = await page.locator("body").innerText();
    const match = bodyText.match(/MTO-[A-Z0-9]+-\d{4}/);
    inviteCode = match ? match[0] : null;
    reporter.check("invite code has expected format", !!inviteCode, inviteCode || bodyText.slice(0, 300));
    await page.getByRole("button", { name: "Enter workspace" }).click();
    await page.waitForTimeout(1800);
    reporter.check("new HR enters own workspace", (await page.locator("body").innerText()).includes("Overview"), page.url());
  }

  // --- duplicate registration rejected (leave the new HR session first) ---
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.removeItem("opshub_session"));
  await page.goto(`${BASE_URL}/sign-up`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("e.g. Square Group").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(700);
  await page.getByPlaceholder("e.g. Square Group").fill(company);
  await page.getByPlaceholder("e.g. Mr. Rahman").fill("QA Administrator");
  await page.getByPlaceholder("name@company.com").fill(hrEmail);
  await page.getByPlaceholder("Min. 8 characters").fill("QaPass12345");
  await page.getByRole("button", { name: "Create programme" }).click();
  const dup = await exists(page, page.getByText(/already exists/i), 8000);
  reporter.check("duplicate email registration rejected", dup);

  // --- invalid invite code ---
  await page.goto(`${BASE_URL}/join`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("MTO-XXXX-0000").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(700);
  await page.getByPlaceholder("MTO-XXXX-0000").fill("MTO-BOGUS-0000");
  await page.getByPlaceholder("Nusrat Jahan").fill("QA Trainee");
  await page.getByPlaceholder("name@company.com").fill(`qa.trainee.bad.${stamp}@example.test`);
  await page.getByPlaceholder("Min. 8 characters").fill("QaPass12345");
  await page.getByRole("button", { name: "Continue" }).click();
  const badCode = await exists(page, page.getByText(/code not recognized/i), 8000);
  reporter.check("invalid invite code rejected", badCode);

  // --- valid join via UI ---
  const traineeEmail = `qa.trainee.${stamp}@example.test`;
  await page.goto(`${BASE_URL}/join`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("MTO-XXXX-0000").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(700);
  await page.getByPlaceholder("MTO-XXXX-0000").fill(inviteCode || "MTO-DEMO-2026");
  await page.getByPlaceholder("Nusrat Jahan").fill("QA Trainee");
  await page.getByPlaceholder("name@company.com").fill(traineeEmail);
  await page.getByPlaceholder("e.g. Marketing").fill("QA Dept");
  await page.getByPlaceholder("Min. 8 characters").fill("QaPass12345");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForTimeout(2000);
  const joined = (await page.locator("body").innerText()).includes("Rotation");
  reporter.check("trainee join lands in trainee workspace", joined, page.url());
  const traineeMe = await api(page, "/auth/me");
  reporter.check("joined account role is trainee", traineeMe.status === 200 && traineeMe.body.role === "trainee", JSON.stringify(traineeMe.body).slice(0, 160));

  // --- direct cross-role URL redirect ---
  await page.goto(`${BASE_URL}/platform`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);
  reporter.check("trainee cannot open /platform UI", page.url().includes("(trainee)") || page.url() === `${BASE_URL}/` || !page.url().includes("platform"), page.url());

  // --- multiple simultaneous sessions ---
  const hrCtx = await newRoleContext(browser, reporter, "hr-session");
  await loginViaUI(hrCtx.page, "hr@opshub.local", "hr123456");
  const tCtx = await newRoleContext(browser, reporter, "trainee-session");
  await loginViaUI(tCtx.page, "nusrat@opshub.local", "trainee123");
  const hrText = await hrCtx.page.locator("body").innerText();
  const tText = await tCtx.page.locator("body").innerText();
  reporter.check("two roles can be signed in simultaneously", hrText.includes("Overview") && tText.includes("Rotation"), `hr=${hrText.slice(0, 40)} trainee=${tText.slice(0, 40)}`);

  ctx.accounts = { stamp, company, hrEmail, traineeEmail, inviteCode };
  ctx.sessions = { hrCtx, tCtx };
  await stopTracing(role.context, "auth-flow");
};
