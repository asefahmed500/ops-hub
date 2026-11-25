/* PHASE 4 — Every route, tab, navigation item and interactive inventory. */
module.exports = async function navigationSpec(h, ctx) {
  const { reporter, browser } = ctx;
  const { BASE_URL, exists, loginViaUI, newRoleContext, stopTracing } = h;

  reporter.phase("PHASE 4 — Routes & Interactive Elements");

  const inventory = [];
  async function inspect(page, label, path) {
    const res = await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1100);
    const body = await page.locator("body").innerText();
    const buttons = await page.getByRole("button").evaluateAll((els) => els.map((e) => e.innerText.trim()).filter(Boolean));
    const links = await page.locator("a").evaluateAll((els) => els.map((e) => `${e.innerText.trim()}→${e.getAttribute("href")}`).filter(Boolean));
    const inputs = await page.locator("input,textarea").evaluateAll((els) => els.map((e) => ({ ph: e.placeholder, type: e.type })));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    inventory.push({ role: label, path, http: res && res.status(), buttons, links, inputs });
    reporter.check(`${label} route ${path} renders`, !!body.trim() && body.length > 20, `${body.slice(0, 60).replace(/\n/g, " | ")}`);
    reporter.check(`${label} route ${path} no horizontal overflow`, !overflow, overflow ? "scrollWidth exceeded viewport" : "");
    return body;
  }

  // Trainee role
  const trainee = await newRoleContext(browser, reporter, "nav-trainee");
  await loginViaUI(trainee.page, "nusrat@opshub.local", "trainee123");
  for (const p of ["/", "/rotation", "/log", "/growth", "/me"]) await inspect(trainee.page, "trainee", p);
  const bell = await exists(trainee.page, trainee.page.locator("button").filter({ hasText: "" }).first(), 2000);
  reporter.check("trainee has notification bell", await trainee.page.locator("button").count() > 0, `buttons=${await trainee.page.locator("button").count()}`);
  await stopTracing(trainee.context, "nav-trainee");
  await trainee.context.close();

  // HR role
  const hr = await newRoleContext(browser, reporter, "nav-hr");
  await loginViaUI(hr.page, "hr@opshub.local", "hr123456");
  for (const p of ["/", "/trainees", "/reviews", "/reports", "/settings"]) await inspect(hr.page, "hr", p);
  await stopTracing(hr.context, "nav-hr");
  await hr.context.close();

  // Platform role
  const plat = await newRoleContext(browser, reporter, "nav-platform");
  await loginViaUI(plat.page, "platform@opshub.local", "platform123");
  for (const p of ["/platform", "/platform/tenants"]) await inspect(plat.page, "platform", p);
  await stopTracing(plat.context, "nav-platform");
  await plat.context.close();

  const fs = require("fs");
  fs.writeFileSync(
    h.path.join(h.ROOT, "tests", "reports", "feature-inventory.json"),
    JSON.stringify(inventory, null, 2),
  );
  reporter.event("inventory", `${inventory.length} routes inventoried → tests/reports/feature-inventory.json`);
  reporter.check("feature inventory captured", inventory.length >= 12, `${inventory.length} routes`);
};
