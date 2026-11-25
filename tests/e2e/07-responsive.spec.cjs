/* PHASE 9 — Responsive layouts across four viewports. */
module.exports = async function responsiveSpec(h, ctx) {
  const { reporter, browser } = ctx;
  const { BASE_URL, loginViaUI } = h;

  reporter.phase("PHASE 9 — Responsive UI");
  const viewports = [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "laptop", width: 1366, height: 768 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    h.instrumentPage(page, reporter, `responsive-${vp.name}`);
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    let overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    reporter.check(`${vp.name} ${vp.width}x${vp.height}: sign-in no horizontal overflow`, !overflow, overflow ? "overflow" : "");
    await reporter.screenshot(page, `responsive-${vp.name}-signin`);

    await loginViaUI(page, "nusrat@opshub.local", "trainee123");
    for (const p of ["/", "/log", "/growth"]) {
      await page.goto(`${BASE_URL}${p}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(900);
      overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
      reporter.check(`${vp.name}: trainee ${p} no horizontal overflow`, !overflow, overflow ? "overflow" : "");
    }
    await reporter.screenshot(page, `responsive-${vp.name}-trainee`);

    await loginViaUI(page, "hr@opshub.local", "hr123456");
    await page.goto(`${BASE_URL}/reviews`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    reporter.check(`${vp.name}: HR reviews no horizontal overflow`, !overflow, overflow ? "overflow" : "");
    await reporter.screenshot(page, `responsive-${vp.name}-hr`);

    await loginViaUI(page, "platform@opshub.local", "platform123");
    await page.goto(`${BASE_URL}/platform/tenants`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    reporter.check(`${vp.name}: platform tenants no horizontal overflow`, !overflow, overflow ? "overflow" : "");
    await reporter.screenshot(page, `responsive-${vp.name}-platform`);
    await context.close();
  }
};
