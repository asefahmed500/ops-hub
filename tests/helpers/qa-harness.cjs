/* Reusable Playwright QA harness for MTO Compass.
 * Launches a REAL headed Chromium, captures console/network errors,
 * screenshots, traces, and records assertions into a JSON report.
 */
const fs = require("fs");
const path = require("path");

const GLOBAL_PLAYWRIGHT =
  "C:\\Users\\Asef\\AppData\\Roaming\\npm\\node_modules\\@playwright\\cli\\node_modules\\playwright";

function loadPlaywright() {
  for (const candidate of ["playwright", "@playwright/test", GLOBAL_PLAYWRIGHT]) {
    try {
      return require(candidate);
    } catch (_) {
      /* try next */
    }
  }
  throw new Error(
    "Playwright not found. Install with: npm install -D @playwright/test && npx playwright install chromium",
  );
}

const ROOT = path.resolve(__dirname, "..", "..");
const REPORT_DIR = path.join(ROOT, "tests", "reports");
const SHOT_DIR = path.join(REPORT_DIR, "screenshots");
const TRACE_DIR = path.join(REPORT_DIR, "traces");
const BASE_URL = process.env.QA_BASE_URL || "http://localhost:3100";
const API_URL = process.env.QA_API_URL || "http://localhost:3101";

for (const dir of [REPORT_DIR, SHOT_DIR, TRACE_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

class Reporter {
  constructor() {
    this.cases = [];
    this.events = [];
    this.currentPhase = "setup";
    this.startedAt = new Date().toISOString();
  }

  phase(name) {
    this.currentPhase = name;
    console.log(`\n=== ${name} ===`);
  }

  check(name, ok, detail = "") {
    const entry = {
      phase: this.currentPhase,
      name,
      status: ok ? "PASS" : "FAIL",
      detail: typeof detail === "string" ? detail : JSON.stringify(detail),
      at: new Date().toISOString(),
    };
    this.cases.push(entry);
    console.log(`${ok ? "  PASS" : "  FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
    return ok;
  }

  skip(name, reason) {
    this.cases.push({
      phase: this.currentPhase,
      name,
      status: "BLOCKED",
      detail: reason,
      at: new Date().toISOString(),
    });
    console.log(`  SKIP  ${name} — ${reason}`);
  }

  event(kind, detail) {
    this.events.push({ kind, phase: this.currentPhase, at: new Date().toISOString(), detail });
  }

  async screenshot(page, name) {
    const safe = name.replace(/[^a-z0-9_-]/gi, "_").slice(0, 90);
    const file = path.join(SHOT_DIR, `${Date.now()}_${safe}.png`);
    try {
      await page.screenshot({ path: file, fullPage: true, animations: "disabled" });
      return path.relative(ROOT, file);
    } catch (e) {
      this.event("screenshot-error", `${name}: ${e.message}`);
      return null;
    }
  }

  summary() {
    const counts = { PASS: 0, FAIL: 0, BLOCKED: 0, NOT_TESTED: 0 };
    for (const c of this.cases) counts[c.status] = (counts[c.status] || 0) + 1;
    return {
      startedAt: this.startedAt,
      finishedAt: new Date().toISOString(),
      counts,
      cases: this.cases,
      events: this.events,
    };
  }

  save() {
    const data = this.summary();
    fs.writeFileSync(path.join(REPORT_DIR, "qa-results.json"), JSON.stringify(data, null, 2));
    const md = [
      "# APPLICATION QA REPORT — MTO Compass",
      "",
      `Generated: ${data.finishedAt}`,
      "",
      `Total cases: ${data.cases.length} | PASSED: ${data.counts.PASS} | FAILED: ${data.counts.FAIL} | BLOCKED: ${data.counts.BLOCKED}`,
      "",
      "## Cases",
      ...data.cases.map(
        (c) => `- **[${c.status}]** ${c.phase} :: ${c.name}${c.detail ? ` — ${c.detail}` : ""}`,
      ),
      "",
      "## Browser events",
      ...data.events.map((e) => `- ${e.kind} (${e.phase}): ${typeof e.detail === "string" ? e.detail : JSON.stringify(e.detail)}`),
    ].join("\n");
    fs.writeFileSync(path.join(REPORT_DIR, "qa-report.md"), md);
    return data;
  }
}

/** Attach console/network diagnostics to a page. */
function instrumentPage(page, reporter, label) {
  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error" || type === "warning") {
      reporter.event(`console-${type}`, `[${label}] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => reporter.event("pageerror", `[${label}] ${err.message}`));
  page.on("requestfailed", (req) =>
    reporter.event("requestfailed", `[${label}] ${req.method()} ${req.url()} — ${req.failure()?.errorText || ""}`),
  );
  page.on("response", (res) => {
    if (res.status() >= 400) {
      reporter.event(`http-${res.status()}`, `[${label}] ${res.request().method()} ${res.url()}`);
    }
  });
}

async function launch(viewport = { width: 1440, height: 1000 }) {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ headless: false, args: ["--start-maximized"] });
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  return { browser, context };
}

async function newRoleContext(browser, reporter, label, viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  const page = await context.newPage();
  instrumentPage(page, reporter, label);
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  return { context, page, label };
}

async function stopTracing(context, label) {
  const file = path.join(TRACE_DIR, `${label.replace(/[^a-z0-9_-]/gi, "_")}.zip`);
  try {
    await context.tracing.stop({ path: file });
  } catch (_) {
    /* context may be closed */
  }
  return path.relative(ROOT, file);
}

/** Sign in through the real UI. */
async function loginViaUI(page, email, password) {
  // Start each login from a clean session so AuthGate does not redirect away.
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.removeItem("opshub_session"));
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: "domcontentloaded" });
  const emailInput = page.getByPlaceholder("name@company.com");
  await emailInput.waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(600); // let React attach handlers
  await emailInput.fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  const submit = page.getByRole("button", { name: "Sign in", exact: true });
  await submit.click();
  try {
    await page.waitForURL((url) => !url.pathname.includes("sign-in"), { timeout: 12000 });
  } catch (_) {
    await submit.click().catch(() => {});
    await page.waitForURL((url) => !url.pathname.includes("sign-in"), { timeout: 15000 });
  }
  await page.waitForTimeout(1200);
}

async function tokenOf(page) {
  return page.evaluate(() => localStorage.getItem("opshub_session"));
}

/** Authenticated API call through the browser's request context. */
async function api(page, endpoint, options = {}) {
  const token = options.token !== undefined ? options.token : await tokenOf(page);
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await page.request.fetch(`${API_URL}/api${endpoint}`, {
    method: options.method || "GET",
    headers,
    data: options.body,
  });
  let body = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status(), body, headers: res.headers() };
}

/** Click the confirm button inside a RN Modal overlay (not the page button behind it). */
async function clickConfirm(page, label) {
  const overlay = page.locator('[class*="bg-black"]').last();
  await overlay.waitFor({ state: "visible", timeout: 5000 });
  const btn = overlay.getByText(label, { exact: true }).last();
  await btn.click({ force: true, timeout: 8000 });
}

/** Wait for a selector to exist, returning false instead of throwing. */
async function exists(page, locator, timeout = 8000) {
  try {
    await locator.first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  fs,
  path,
  ROOT,
  BASE_URL,
  API_URL,
  Reporter,
  loadPlaywright,
  launch,
  newRoleContext,
  stopTracing,
  instrumentPage,
  loginViaUI,
  tokenOf,
  api,
  exists,
  clickConfirm,
};
