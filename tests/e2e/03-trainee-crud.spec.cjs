/* PHASES 5-8 — Trainee CRUD, API chain, notifications, export, security of own data. */
module.exports = async function traineeCrudSpec(h, ctx) {
  const { reporter, browser } = ctx;
  const { BASE_URL, api, exists, loginViaUI, newRoleContext, stopTracing } = h;

  reporter.phase("PHASE 5 — Trainee CRUD & Database Verification");
  const role = await newRoleContext(browser, reporter, "trainee-crud");
  const { page } = role;
  await loginViaUI(page, "nusrat@opshub.local", "trainee123");
  const stamp = Date.now().toString().slice(-6);
  const marker = `QA_LOG_${stamp}`;

  // ---------- LOGS: CREATE ----------
  await page.goto(`${BASE_URL}/log`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const saveDisabledBefore = await page.getByRole("button", { name: "Save log" }).isDisabled();
  reporter.check("save log disabled with empty text", saveDisabledBefore);
  await page.getByPlaceholder("Prepared the campaign report…").fill(marker);
  await page.getByText("Marketing", { exact: true }).first().click();
  const tagOn = await page.locator("text=Marketing").first().getAttribute("class");
  reporter.check("tag chip becomes active when clicked", !!tagOn && /accent/.test(tagOn), tagOn || "");
  await page.getByRole("button", { name: "Save log" }).click();
  await page.waitForTimeout(1200);
  const stateAfterCreate = await api(page, "/state");
  const created = (stateAfterCreate.body.logs || []).find((l) => l.text === marker);
  reporter.check("log created via UI appears in API state", !!created, `status=${stateAfterCreate.status}`);
  reporter.check("created log keeps selected tag", !!created && (created.tags || []).includes("Marketing"), JSON.stringify(created?.tags));
  reporter.check("created log belongs to signed-in trainee", !!created && created.authorId === "usr_nusrat", created?.authorId);
  reporter.check("created log visible in UI", await exists(page, page.getByText(marker, { exact: false }), 5000));

  // ---------- READ / PERSISTENCE ----------
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1400);
  reporter.check("log persists after browser refresh", await exists(page, page.getByText(marker, { exact: false }), 5000));
  const afterReload = await api(page, "/logs");
  reporter.check("log persists in database/API after refresh", (afterReload.body || []).some((l) => l.text === marker));

  // ---------- DELETE with cancel ----------
  await page.getByText(marker, { exact: false }).first().click();
  await page.waitForTimeout(500);
  reporter.check("log detail modal opens", await exists(page, page.getByRole("button", { name: "Delete log" }), 3000));
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.waitForTimeout(400);
  const stillThere = await api(page, "/logs");
  reporter.check("cancel/close does not delete log", (stillThere.body || []).some((l) => l.text === marker));

  // ---------- TASKS: CREATE (expected form, no fake default) ----------
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const beforeTasks = (await api(page, "/mto-tasks")).body || [];
  await page.getByRole("button", { name: "+ Add task" }).click();
  await page.waitForTimeout(900);
  const formOpened = await exists(page, page.getByPlaceholder(/task title/i), 2500);
  reporter.check("add task opens a title form (not a fake default task)", formOpened, formOpened ? "" : "click created 'New task' directly");
  if (formOpened) {
    await page.getByPlaceholder(/task title/i).fill(`QA task ${stamp}`);
    await page.getByRole("button", { name: /add task|create task|save/i }).last().click();
  }
  await page.waitForTimeout(1100);
  const afterTasks = (await api(page, "/mto-tasks")).body || [];
  const newTask = afterTasks.find((t) => t.title === `QA task ${stamp}`);
  reporter.check("task created with user-entered title", !!newTask, `before=${beforeTasks.length} after=${afterTasks.length}`);

  // ---------- TASKS: TOGGLE ----------
  if (newTask) {
    const row = page.getByText(`QA task ${stamp}`, { exact: false }).first();
    await row.click({ force: true });
    let toggled = null;
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(400);
      toggled = ((await api(page, "/mto-tasks")).body || []).find((t) => t.id === newTask.id);
      if (toggled && toggled.done !== newTask.done) break;
    }
    reporter.check("task toggle persisted to API", !!toggled && toggled.done !== newTask.done, `done=${toggled?.done}`);
  }

  // ---------- GOALS: CREATE + PROGRESS ----------
  await page.goto(`${BASE_URL}/growth`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1100);
  await page.getByText("+ Add", { exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByPlaceholder("e.g. Presentation skills").fill(`QA goal ${stamp}`);
  await page.getByRole("button", { name: "Add goal" }).click();
  await page.waitForTimeout(1100);
  let goals = (await api(page, "/goals")).body || [];
  const goal = goals.find((g) => g.title === `QA goal ${stamp}`);
  reporter.check("goal created via UI persists in API", !!goal, `count=${goals.length}`);
  if (goal) {
    const card = page.getByText(`QA goal ${stamp}`, { exact: false }).first();
    const cardBox = await card.boundingBox();
    if (cardBox) {
      await page.mouse.click(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height + 40);
    }
    const plus = page.getByRole("button", { name: "+10% progress" }).last();
    await plus.click();
    await page.waitForTimeout(900);
    goals = (await api(page, "/goals")).body || [];
    const updated = goals.find((g) => g.id === goal.id);
    reporter.check("goal progress +10% persisted", !!updated && updated.progress >= 10, `progress=${updated?.progress}`);
  }

  // ---------- ROTATION OBJECTIVE TOGGLE ----------
  await page.goto(`${BASE_URL}/rotation`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1100);
  const rotationBefore = (await api(page, "/rotations")).body || [];
  const active = rotationBefore.find((r) => r.status === "active");
  reporter.check("API has an active rotation", !!active, active?.name || "none");
  if (active) {
    await page.getByText(active.name, { exact: false }).first().click();
    await page.waitForTimeout(500);
    const obj = active.objectives[0];
    if (obj) {
      await page.getByText(obj.title, { exact: false }).first().click();
      await page.waitForTimeout(900);
      const rotationAfter = (await api(page, "/rotations")).body || [];
      const changed = rotationAfter.find((r) => r.id === active.id);
      const newObj = changed?.objectives?.find((o) => o.id === obj.id);
      reporter.check("objective toggle persisted to API", !!newObj && newObj.done !== obj.done, `done=${newObj?.done}`);
    }
    await page.getByRole("button", { name: "Close", exact: true }).click();
  }

  // ---------- EXPORT CSV (real download) ----------
  await page.goto(`${BASE_URL}/growth`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const dlPromise = page.waitForEvent("download", { timeout: 12000 }).catch(() => null);
  await page.getByRole("button", { name: /Export my logs \(CSV\)/ }).click();
  const download = await dlPromise;
  reporter.check("CSV export triggers real download", !!download, download ? download.suggestedFilename() : "no download event");
  if (download) {
    const fs = require("fs");
    const p = await download.path();
    const csv = p ? fs.readFileSync(p, "utf8") : "";
    reporter.check("CSV contains header and log rows", csv.includes("date,author,text,tags") && csv.includes(marker), `${csv.split("\n").length} lines`);
  }

  // ---------- NOTIFICATIONS ----------
  const bell = page.locator('[class*="rounded-full"]').filter({ has: page.locator("svg") }).first();
  await bell.click({ force: true });
  await page.waitForTimeout(500);
  const notifText = await page.locator("body").innerText();
  reporter.check("notification sheet opens from bell", /Notification|notification|Mark all/i.test(notifText), notifText.slice(0, 120));
  const markAll = page.getByText("Mark all read", { exact: true }).first();
  if (await exists(page, markAll, 2000)) {
    await markAll.click();
    await page.waitForTimeout(900);
    const notifs = (await api(page, "/notifications")).body || [];
    reporter.check("mark all read persists via API", notifs.every((n) => n.read), `${notifs.filter((n) => !n.read).length} unread remain`);
  }

  // ---------- ME: role restriction + sign out ----------
  await page.goto(`${BASE_URL}/me`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const beforeLang = (await api(page, "/programme")).body;
  const switches = page.getByRole("switch");
  if (await switches.count()) {
    await switches.first().click({ force: true });
    await page.waitForTimeout(700);
    const afterLang = (await api(page, "/programme")).body;
    reporter.check("trainee cannot change workspace language", beforeLang.language === afterLang.language, `${beforeLang.language} → ${afterLang.language}`);
  }

  ctx.sessions = ctx.sessions || {};
  ctx.sessions.trainee = role;
  await stopTracing(role.context, "trainee-crud");
};
