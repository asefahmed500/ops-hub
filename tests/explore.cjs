/* One-off browser exploration: dump the live DOM of a URL. */
const h = require("./helpers/qa-harness.cjs");

(async () => {
  const url = process.argv[2] || `${h.BASE_URL}/sign-in`;
  const { browser, context } = await h.launch();
  const page = await context.newPage();
  const logs = [];
  page.on("console", (m) => logs.push(`${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => logs.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
  page.on("response", (r) => {
    if (r.status() >= 400) logs.push(`http${r.status()}: ${r.request().method()} ${r.url()}`);
  });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3500);
  console.log("URL:", page.url());
  console.log("TITLE:", await page.title());
  console.log("BODY TEXT:\n", (await page.locator("body").innerText()).slice(0, 6000));
  console.log("INPUTS:\n", JSON.stringify(await page.locator("input,textarea").evaluateAll((els) =>
    els.map((e) => ({ tag: e.tagName, ph: e.placeholder, type: e.type, aria: e.getAttribute("aria-label"), value: e.value }))), null, 2));
  console.log("BUTTONS:\n", JSON.stringify(await page.getByRole("button").evaluateAll((els) =>
    els.map((e) => ({ text: e.innerText, aria: e.getAttribute("aria-label") }))), null, 2));
  console.log("LINKS:\n", JSON.stringify(await page.locator("a").evaluateAll((els) =>
    els.map((e) => ({ text: e.innerText, href: e.getAttribute("href") }))), null, 2));
  console.log("LOGS:\n", logs.join("\n"));
  const shot = await h.Reporter.prototype.screenshot.call({ event: () => {} }, page, "explore");
  console.log("SCREENSHOT:", shot);
  await browser.close();
})();
