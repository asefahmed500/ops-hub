/* PHASES 4-8 — Platform operator console, tenant lifecycle, RBAC. */
module.exports = async function platformSpec(h, ctx) {
  const { reporter, browser } = ctx;
  const { BASE_URL, api, exists, loginViaUI, newRoleContext, stopTracing } = h;

  reporter.phase("PHASE 4-8 — Platform Console & Tenant Lifecycle");
  const role = await newRoleContext(browser, reporter, "platform-console");
  const { page } = role;
  await loginViaUI(page, "platform@opshub.local", "platform123");

  await page.goto(`${BASE_URL}/platform`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const overview = await api(page, "/platform/overview");
  reporter.check("platform overview API works", overview.status === 200, JSON.stringify(overview.body).slice(0, 200));
  const body = await page.locator("body").innerText();
  for (const [label, value] of [
    ["Companies", overview.body.tenants?.total],
    ["Users", overview.body.users],
    ["Rotations", overview.body.rotations],
    ["Reviews", overview.body.reviews],
    ["Pending reviews", overview.body.pendingReviews],
  ]) {
    reporter.check(`platform UI shows real "${label}" from API`, body.includes(label) && body.includes(String(value)), `API=${value}`);
  }

  await page.goto(`${BASE_URL}/platform/tenants`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const tenants = await api(page, "/platform/tenants");
  reporter.check("tenants API returns counts", tenants.status === 200 && Array.isArray(tenants.body) && tenants.body.length > 0, `count=${tenants.body?.length}`);
  const first = tenants.body[0];
  const tenantText = await page.locator("body").innerText();
  reporter.check("tenant row shows real member count", tenantText.includes(String(first.users)), `users=${first.users}`);

  // Create an isolated throwaway workspace via UI to test suspend/activate safely.
  // A fresh context is required: a signed-in platform admin is redirected away from /sign-up.
  const regCtx = await newRoleContext(browser, reporter, "platform-registration");
  const regPage = regCtx.page;
  await regPage.goto(`${BASE_URL}/sign-up`, { waitUntil: "domcontentloaded" });
  await regPage.getByPlaceholder("e.g. Square Group").waitFor({ state: "visible", timeout: 15000 });
  await regPage.waitForTimeout(700); // allow React handlers to attach
  const stamp = Date.now().toString().slice(-7);
  const tempName = `QA Lifecycle ${stamp}`;
  const tempEmail = `qa.lifecycle.${stamp}@example.test`;
  await regPage.getByPlaceholder("e.g. Square Group").fill(tempName);
  await regPage.getByPlaceholder("e.g. Mr. Rahman").fill("QA Lifecycle Admin");
  await regPage.getByPlaceholder("name@company.com").fill(tempEmail);
  await regPage.getByPlaceholder("Min. 8 characters").fill("QaPass12345");
  await regPage.getByRole("button", { name: "Create programme" }).click();
  await page.waitForTimeout(300);
  const codeShown = await exists(regPage, regPage.getByRole("button", { name: "Enter workspace" }), 6000);
  reporter.check("throwaway tenant created for lifecycle test", codeShown);
  await stopTracing(regCtx.context, "platform-registration");
  await regCtx.context.close();

  await loginViaUI(page, "platform@opshub.local", "platform123");
  const allTenants = (await api(page, "/platform/tenants")).body || [];
  const target = allTenants.find((t) => t.name === tempName);
  reporter.check("new tenant visible to platform console", !!target, tempName);
  if (target) {
    await page.goto(`${BASE_URL}/platform/tenants`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const row = page.getByText(tempName, { exact: true }).first();
    const card = row.locator("xpath=ancestor::*[contains(@class,'card') or contains(@class,'Card')][1]");
    const suspendBtn = page.getByText("Suspend", { exact: true }).first();
    await suspendBtn.click();
    await page.waitForTimeout(400);
    await h.clickConfirm(page, "Suspend");
    await page.waitForTimeout(1100);
    const suspended = ((await api(page, "/platform/tenants")).body || []).find((t) => t.id === target.id);
    reporter.check("tenant suspended via UI + confirm", suspended?.status === "suspended", suspended?.status);

    // HR from suspended tenant cannot sign in
    const blocked = await api(page, "/auth/login", { method: "POST", body: { email: tempEmail, password: "QaPass12345" }, token: null });
    reporter.check("suspended tenant user is blocked from login", blocked.status === 401, `HTTP ${blocked.status}`);

    // Reactivate
    await page.goto(`${BASE_URL}/platform/tenants`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1100);
    await page.getByText("Activate", { exact: true }).first().click();
    await page.waitForTimeout(400);
    await h.clickConfirm(page, "Activate");
    await page.waitForTimeout(1100);
    const active = ((await api(page, "/platform/tenants")).body || []).find((t) => t.id === target.id);
    reporter.check("tenant reactivated via UI", active?.status === "active", active?.status);
    const restored = await api(page, "/auth/login", { method: "POST", body: { email: tempEmail, password: "QaPass12345" }, token: null });
    reporter.check("reactivated tenant user can sign in again", restored.status === 201, `HTTP ${restored.status}`);
  }

  // RBAC on platform API
  const hrCtx = await newRoleContext(browser, reporter, "platform-rbac-hr");
  await loginViaUI(hrCtx.page, "hr@opshub.local", "hr123456");
  const hrPlat = await api(hrCtx.page, "/platform/overview");
  reporter.check("HR denied platform API", hrPlat.status === 403, `HTTP ${hrPlat.status}`);
  await stopTracing(hrCtx.context, "platform-rbac-hr");
  await hrCtx.context.close();

  await stopTracing(role.context, "platform-console");
  ctx.sessions = ctx.sessions || {};
  ctx.sessions.platform = role;
};
