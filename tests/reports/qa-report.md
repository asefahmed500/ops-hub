# APPLICATION QA REPORT — MTO Compass

Generated: 2026-11-25T00:59:49.723Z

Total cases: 163 | PASSED: 163 | FAILED: 0 | BLOCKED: 0

## Cases
- **[PASS]** setup :: environment: API healthy and web reachable — API 200, web 200
- **[PASS]** PHASE 3 — Authentication & Authorization :: public page loads: /welcome — HTTP 200
- **[PASS]** PHASE 3 — Authentication & Authorization :: public page loads: /sign-in — HTTP 200
- **[PASS]** PHASE 3 — Authentication & Authorization :: public page loads: /sign-up — HTTP 200
- **[PASS]** PHASE 3 — Authentication & Authorization :: public page loads: /join — HTTP 200
- **[PASS]** PHASE 3 — Authentication & Authorization :: public page loads: /forgot-password — HTTP 200
- **[PASS]** PHASE 3 — Authentication & Authorization :: sign-in empty validation shows both errors — email=true password=true
- **[PASS]** PHASE 3 — Authentication & Authorization :: invalid password shows server error
- **[PASS]** PHASE 3 — Authentication & Authorization :: invalid credentials keep user on sign-in — http://localhost:3100/sign-in
- **[PASS]** PHASE 3 — Authentication & Authorization :: unauthenticated /platform redirects to sign-in — http://localhost:3100/sign-in
- **[PASS]** PHASE 3 — Authentication & Authorization :: malformed email rejected by client validation
- **[PASS]** PHASE 3 — Authentication & Authorization :: sign-in does not advertise unsupported phone login
- **[PASS]** PHASE 3 — Authentication & Authorization :: HR login routes to HR workspace — http://localhost:3100/
- **[PASS]** PHASE 3 — Authentication & Authorization :: HR /auth/me returns hr role — {"active":true,"createdAt":"2026-11-02T18:32:59.078Z","id":"usr_hr","tenantId":"tnt_demo","name":"Mr. Rahman","email":"hr@opshub.local","role":"hr","companyName":"MTO Compass Demo"}
- **[PASS]** PHASE 3 — Authentication & Authorization :: session persists after reload — http://localhost:3100/
- **[PASS]** PHASE 3 — Authentication & Authorization :: JWT stored in localStorage — len=220
- **[PASS]** PHASE 3 — Authentication & Authorization :: sign out returns to sign-in — http://localhost:3100/sign-in
- **[PASS]** PHASE 3 — Authentication & Authorization :: token cleared on sign out — token=null
- **[PASS]** PHASE 3 — Authentication & Authorization :: company registration shows invite code step
- **[PASS]** PHASE 3 — Authentication & Authorization :: invite code has expected format — MTO-QA-1313
- **[PASS]** PHASE 3 — Authentication & Authorization :: new HR enters own workspace — http://localhost:3100/
- **[PASS]** PHASE 3 — Authentication & Authorization :: duplicate email registration rejected
- **[PASS]** PHASE 3 — Authentication & Authorization :: invalid invite code rejected
- **[PASS]** PHASE 3 — Authentication & Authorization :: trainee join lands in trainee workspace — http://localhost:3100/
- **[PASS]** PHASE 3 — Authentication & Authorization :: joined account role is trainee — {"id":"usr_mwveiy3vmxz4y7","tenantId":"tnt_mwvei91ij0aey4","name":"QA Trainee","email":"qa.trainee.7462346@example.test","dept":"QA Dept","role":"trainee","acti
- **[PASS]** PHASE 3 — Authentication & Authorization :: trainee cannot open /platform UI — http://localhost:3100/
- **[PASS]** PHASE 3 — Authentication & Authorization :: two roles can be signed in simultaneously — hr=Overview
HR · MTO programme · MTO Compas trainee=Hi, Nusrat
3
Wednesday 25 November · MTO
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: trainee route / renders — Hi, Nusrat | 3 | Wednesday 25 November · MTO · Marketing | Rotatio
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: trainee route / no horizontal overflow
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: trainee route /rotation renders — Rotation | 3 | 12-month programme | Rotation | 1 · Finance | Done | Jan 
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: trainee route /rotation no horizontal overflow
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: trainee route /log renders — Log | 3 | Daily work log | Log | What did you work on? | Tags | Marketin
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: trainee route /log no horizontal overflow
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: trainee route /growth renders — Growth | 3 | Goals & feedback | Growth | Learning goals | + Add | Excel 
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: trainee route /growth no horizontal overflow
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: trainee route /me renders — Me | 3 | Profile | Me | NJ | Nusrat Jahan | MTO | MTO · Marketing · MTO Co
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: trainee route /me no horizontal overflow
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: trainee has notification bell — buttons=1
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: hr route / renders — Overview | HR · MTO programme · MTO Compass Demo | Overview | 5 | Ac
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: hr route / no horizontal overflow
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: hr route /trainees renders — Trainees | 5 active | NJ | Nusrat Jahan | Marketing · Wk 12 | 52 | % | MA | 
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: hr route /trainees no horizontal overflow
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: hr route /reviews renders — Reviews | Pending (2) | Decided | Nusrat Jahan | Due Fri | Marketing ·
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: hr route /reviews no horizontal overflow
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: hr route /reports renders — Reports | Programme insights | Reports | 5 | Trainees | 3 | Logs this we
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: hr route /reports no horizontal overflow
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: hr route /settings renders — Settings | Admin | Settings | Company | MTO Compass Demo | Invite code
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: hr route /settings no horizontal overflow
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: platform route /platform renders — Platform | Sign out | Platform operator console | OpsHub estate | Co
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: platform route /platform no horizontal overflow
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: platform route /platform/tenants renders — Companies | QA Compass 7462346 | active | qa-compass-7462346 · 2 m
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: platform route /platform/tenants no horizontal overflow
- **[PASS]** PHASE 4 — Routes & Interactive Elements :: feature inventory captured — 12 routes
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: save log disabled with empty text
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: tag chip becomes active when clicked — css-text-146c3p1 text-xs leading-4 font-normal text-accent-foreground
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: log created via UI appears in API state — status=200
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: created log keeps selected tag — ["Marketing"]
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: created log belongs to signed-in trainee — usr_nusrat
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: created log visible in UI
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: log persists after browser refresh
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: log persists in database/API after refresh
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: log detail modal opens
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: cancel/close does not delete log
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: add task opens a title form (not a fake default task)
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: task created with user-entered title — before=6 after=7
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: task toggle persisted to API — done=true
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: goal created via UI persists in API — count=6
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: goal progress +10% persisted — progress=10
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: API has an active rotation — Marketing
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: objective toggle persisted to API — done=true
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: CSV export triggers real download — my-logs-export.csv
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: CSV contains header and log rows — 10 lines
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: notification sheet opens from bell — Growth
3
Goals & feedback
Growth
Learning goals
+ Add
Excel for business
70%
+10% progress
Business writing (Bangla/Engl
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: mark all read persists via API — 0 unread remain
- **[PASS]** PHASE 5 — Trainee CRUD & Database Verification :: trainee cannot change workspace language — en → en
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: HR state endpoint returns reports + trainees — reports=true
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: HR overview shows real trainee count — 5
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: trainee search filters by name — Trainees
5 active
NJ
Nusrat Jahan
Marketing · Wk 12
58
%
+
Overview
Trainees
Reviews
Reports
Settings
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: trainee search filters by department — Trainees
5 active
TH
Tanvir Hasan
Finance · Wk 12
25
%
+
Overview
Trainees
Reviews
Reports
Settings
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: trainee detail sheet opens with reminder action
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: reminder confirmation shown
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: reminder creates notification in trainee account — count=9
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: new review sheet opens from FAB
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: review created and stored in API — count=7
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: HR has a pending review to decide — Nusrat Jahan
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: approve disabled until rating chosen
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: review approval persisted with rating + comment — {"traineeId":"usr_nusrat","traineeName":"Nusrat Jahan","dept":"Marketing","kind":"evaluation","due":"Due Fri","status":"approved","rating":4,"comment":"QA approved 816503","id":"rvw_mwveqiehixsvid","tenantId":"tnt_demo",
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: reports API returns weekly + dept analytics
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: HR CSV export downloads — mto-logs-export.csv
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: HR sees invite code from API — MTO-DEMO-2026
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: invite code rendered in settings UI — MTO-DEMO-2026
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: programme length change persisted — 18 → 18
- **[PASS]** PHASE 5-7 — HR Workflows & Advanced Features :: trainees-export toggle persisted — true → false
- **[PASS]** PHASE 4-8 — Platform Console & Tenant Lifecycle :: platform overview API works — {"tenants":{"total":26,"active":24,"suspended":2},"users":58,"logs":13,"rotations":100,"reviews":16,"pendingReviews":6}
- **[PASS]** PHASE 4-8 — Platform Console & Tenant Lifecycle :: platform UI shows real "Companies" from API — API=26
- **[PASS]** PHASE 4-8 — Platform Console & Tenant Lifecycle :: platform UI shows real "Users" from API — API=58
- **[PASS]** PHASE 4-8 — Platform Console & Tenant Lifecycle :: platform UI shows real "Rotations" from API — API=100
- **[PASS]** PHASE 4-8 — Platform Console & Tenant Lifecycle :: platform UI shows real "Reviews" from API — API=16
- **[PASS]** PHASE 4-8 — Platform Console & Tenant Lifecycle :: platform UI shows real "Pending reviews" from API — API=6
- **[PASS]** PHASE 4-8 — Platform Console & Tenant Lifecycle :: tenants API returns counts — count=26
- **[PASS]** PHASE 4-8 — Platform Console & Tenant Lifecycle :: tenant row shows real member count — users=2
- **[PASS]** PHASE 4-8 — Platform Console & Tenant Lifecycle :: throwaway tenant created for lifecycle test
- **[PASS]** PHASE 4-8 — Platform Console & Tenant Lifecycle :: new tenant visible to platform console — QA Lifecycle 7927971
- **[PASS]** PHASE 4-8 — Platform Console & Tenant Lifecycle :: tenant suspended via UI + confirm — suspended
- **[PASS]** PHASE 4-8 — Platform Console & Tenant Lifecycle :: suspended tenant user is blocked from login — HTTP 401
- **[PASS]** PHASE 4-8 — Platform Console & Tenant Lifecycle :: tenant reactivated via UI — active
- **[PASS]** PHASE 4-8 — Platform Console & Tenant Lifecycle :: reactivated tenant user can sign in again — HTTP 201
- **[PASS]** PHASE 4-8 — Platform Console & Tenant Lifecycle :: HR denied platform API — HTTP 403
- **[PASS]** PHASE 8 — Security & Data Integrity :: unauthenticated /state returns 401 — HTTP 401
- **[PASS]** PHASE 8 — Security & Data Integrity :: unauthenticated /logs returns 401 — HTTP 401
- **[PASS]** PHASE 8 — Security & Data Integrity :: unauthenticated /rotations returns 401 — HTTP 401
- **[PASS]** PHASE 8 — Security & Data Integrity :: unauthenticated /mto-tasks returns 401 — HTTP 401
- **[PASS]** PHASE 8 — Security & Data Integrity :: unauthenticated /goals returns 401 — HTTP 401
- **[PASS]** PHASE 8 — Security & Data Integrity :: unauthenticated /reviews returns 401 — HTTP 401
- **[PASS]** PHASE 8 — Security & Data Integrity :: unauthenticated /notifications returns 401 — HTTP 401
- **[PASS]** PHASE 8 — Security & Data Integrity :: unauthenticated /programme returns 401 — HTTP 401
- **[PASS]** PHASE 8 — Security & Data Integrity :: unauthenticated /platform/overview returns 401 — HTTP 401
- **[PASS]** PHASE 8 — Security & Data Integrity :: unauthenticated /audit returns 401 — HTTP 401
- **[PASS]** PHASE 8 — Security & Data Integrity :: unauthenticated /users returns 401 — HTTP 401
- **[PASS]** PHASE 8 — Security & Data Integrity :: seeded role logins via API succeed — hr=201 n=201 t=201
- **[PASS]** PHASE 8 — Security & Data Integrity :: login with empty body rejected — HTTP 401
- **[PASS]** PHASE 8 — Security & Data Integrity :: short password rejected on registration — HTTP 400
- **[PASS]** PHASE 8 — Security & Data Integrity :: trainee cannot create review — HTTP 403
- **[PASS]** PHASE 8 — Security & Data Integrity :: trainee cannot change programme settings — HTTP 400
- **[PASS]** PHASE 8 — Security & Data Integrity :: trainee cannot create users — HTTP 403
- **[PASS]** PHASE 8 — Security & Data Integrity :: trainee cannot read audit log — HTTP 403
- **[PASS]** PHASE 8 — Security & Data Integrity :: HR can read audit log — HTTP 200
- **[PASS]** PHASE 8 — Security & Data Integrity :: trainee cannot DELETE another trainee's log (IDOR) — HTTP 404
- **[PASS]** PHASE 8 — Security & Data Integrity :: victim log still exists after IDOR attempt
- **[PASS]** PHASE 8 — Security & Data Integrity :: trainee cannot UPDATE another trainee's log (IDOR) — HTTP 404
- **[PASS]** PHASE 8 — Security & Data Integrity :: trainee state contains only own logs — 9 logs
- **[PASS]** PHASE 8 — Security & Data Integrity :: trainee state contains only own tasks
- **[PASS]** PHASE 8 — Security & Data Integrity :: HR cannot decide another tenant's review — HTTP 404
- **[PASS]** PHASE 8 — Security & Data Integrity :: XSS payload does not execute in UI — flag=false dialog=false
- **[PASS]** PHASE 8 — Security & Data Integrity :: XSS payload stored literally (not sanitized into markup)
- **[PASS]** PHASE 8 — Security & Data Integrity :: QA XSS test log cleaned up — HTTP 201
- **[PASS]** PHASE 8 — Security & Data Integrity :: no auth token stored in browser cookies
- **[PASS]** PHASE 8 — Security & Data Integrity :: JWT not embedded in page HTML
- **[PASS]** PHASE 8 — Security & Data Integrity :: malformed JSON returns 400 — HTTP 400
- **[PASS]** PHASE 9 — Responsive UI :: desktop 1440x1000: sign-in no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: desktop: trainee / no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: desktop: trainee /log no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: desktop: trainee /growth no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: desktop: HR reviews no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: desktop: platform tenants no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: laptop 1366x768: sign-in no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: laptop: trainee / no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: laptop: trainee /log no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: laptop: trainee /growth no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: laptop: HR reviews no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: laptop: platform tenants no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: tablet 768x1024: sign-in no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: tablet: trainee / no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: tablet: trainee /log no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: tablet: trainee /growth no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: tablet: HR reviews no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: tablet: platform tenants no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: mobile 390x844: sign-in no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: mobile: trainee / no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: mobile: trainee /log no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: mobile: trainee /growth no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: mobile: HR reviews no horizontal overflow
- **[PASS]** PHASE 9 — Responsive UI :: mobile: platform tenants no horizontal overflow

## Browser events
- http-401 (PHASE 3 — Authentication & Authorization): [auth-flow] POST http://localhost:3101/api/auth/login
- console-error (PHASE 3 — Authentication & Authorization): [auth-flow] Failed to load resource: the server responded with a status of 401 (Unauthorized)
- http-409 (PHASE 3 — Authentication & Authorization): [auth-flow] POST http://localhost:3101/api/auth/register
- console-error (PHASE 3 — Authentication & Authorization): [auth-flow] Failed to load resource: the server responded with a status of 409 (Conflict)
- http-400 (PHASE 3 — Authentication & Authorization): [auth-flow] POST http://localhost:3101/api/auth/join
- console-error (PHASE 3 — Authentication & Authorization): [auth-flow] Failed to load resource: the server responded with a status of 400 (Bad Request)
- http-403 (PHASE 3 — Authentication & Authorization): [auth-flow] GET http://localhost:3101/api/platform/overview
- console-error (PHASE 3 — Authentication & Authorization): [auth-flow] Failed to load resource: the server responded with a status of 403 (Forbidden)
- inventory (PHASE 4 — Routes & Interactive Elements): 12 routes inventoried → tests/reports/feature-inventory.json