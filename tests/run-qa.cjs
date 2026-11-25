/* Autonomous end-to-end QA runner.
 * Usage: node tests/run-qa.cjs [phase-name]
 * Launches a visible Chromium and executes every spec in tests/e2e.
 */
const h = require("./helpers/qa-harness.cjs");
const path = require("path");

const SPECS = [
  "01-auth.spec.cjs",
  "02-navigation.spec.cjs",
  "03-trainee-crud.spec.cjs",
  "04-hr-workflows.spec.cjs",
  "05-platform.spec.cjs",
  "06-security.spec.cjs",
  "07-responsive.spec.cjs",
];

(async () => {
  const reporter = new h.Reporter();
  const only = process.argv[2];
  const { browser, context } = await h.launch();
  const ctx = { reporter, browser, context, accounts: {}, sessions: {} };

  console.log(`QA target: ${h.BASE_URL} (API ${h.API_URL})`);
  try {
    const health = await context.request.get(`${h.API_URL}/api/health`);
    if (health.status() !== 200) throw new Error(`API health ${health.status()}`);
    const web = await context.request.get(`${h.BASE_URL}/sign-in`);
    if (!web.ok()) throw new Error(`Web app not ready: HTTP ${web.status()}`);
    reporter.check("environment: API healthy and web reachable", true, `API ${health.status()}, web ${web.status()}`);
  } catch (e) {
    reporter.check("environment: API healthy and web reachable", false, e.message);
    reporter.save();
    await browser.close();
    process.exit(1);
  }

  for (const spec of SPECS) {
    if (only && !spec.includes(only)) continue;
    try {
      const fn = require(path.join(__dirname, "e2e", spec));
      await fn(h, ctx);
    } catch (e) {
      reporter.check(`spec crashed: ${spec}`, false, `${e.message}\n${(e.stack || "").split("\n").slice(1, 4).join("\n")}`);
      console.error(e);
    }
  }

  await browser.close();
  const data = reporter.save();
  console.log(`\nRESULTS: ${data.counts.PASS} passed / ${data.counts.FAIL} failed / ${data.counts.BLOCKED} blocked`);
  console.log(`Report: ${h.path.join(h.ROOT, "tests", "reports", "qa-report.md")}`);
  process.exitCode = data.counts.FAIL > 0 ? 1 : 0;
})();
