# UniConnect — Project Status

**Last updated:** 2026-11-04  
**Status:** ✅ Implementation complete — locally verified and deployment-ready  
**Location:** `uniconnect/` (the pre-existing project in the workspace root was not modified)

---

## 1. Summary

UniConnect is a complete full-stack university collaboration platform with a React/Vite frontend, Spring Boot API, JWT authentication, MySQL production schema, role-based authorization, file uploads, and an admin console.

All core modules are implemented against real APIs with persistent storage. No mock authentication, fake API responses, or placeholder buttons remain in the core flows.

| Area | Status |
| --- | --- |
| Backend implementation | ✅ Complete |
| Frontend implementation | ✅ Complete |
| Backend automated tests | ✅ 13/13 passing |
| API end-to-end smoke tests | ✅ 62/62 passing |
| Manual browser verification | ✅ Core flows verified |
| Frontend production build | ✅ Passing |
| Documentation | ✅ README + this status file |
| Docker/Compose configuration | ✅ Written; not build-tested locally (Docker unavailable) |
| MySQL runtime verification | ✅ Verified against the live TiDB Cloud cluster (Flyway + JPA `validate`) |
| Cloud deployment | ✅ Live: Vercel frontend + Render backend + TiDB Cloud Starter (free tier) |

---

## 2. Completed modules

### Public and authentication
- Responsive landing page with feature, workflow, and platform sections.
- Registration restricted to `@klu.ac.in`.
- Password policy: 8–72 characters, uppercase, lowercase, number, special character.
- BCrypt password hashing (strength 12).
- JWT login, session restore via `/auth/me`, logout, protected routes.
- Duplicate email/university ID handling with `409` responses.
- JSON `401`/`403` responses from Spring Security.

### Student experience
- Dashboard with post/note/question/answer counts and recent activity.
- Posts: create, paginated list, search, sort, detail, edit/delete by author, admin moderation.
- Study notes: multipart upload, validation, search, authenticated download, delete own upload.
- Q&A: create questions, answer threads, delete own answers/questions.
- Faculty directory: search, department filter, department list, contact details.
- Opportunities: category/search/upcoming filters, detail links, deadline display.
- Profile: edit name, department, academic year; email, university ID, and role protected.

### Administration
- Initial admin bootstrapped only from `ADMIN_EMAIL` + `ADMIN_PASSWORD`.
- Registered-user directory with search and role filter.
- Admin-only faculty creation, editing, and deletion.
- Admin-only opportunity creation, editing, and deletion.
- Moderation deletion for posts, questions, and notes.
- Admin navigation shown only to administrators; student access to `/admin/users` redirects to the dashboard.

### Platform and UI
- Centralized design system in `frontend/src/styles/global.css`.
- Responsive breakpoints at 1180, 1024, 960, 760, and 560 px.
- Sidebar shell with mobile navigation, user summary, role badge, logout.
- Reusable components: buttons, form controls, modal, confirm dialog, empty state, pagination, toast, avatar, badge, loading.
- Form validation, server field errors, loading indicators, empty states, toasts, and confirmation dialogs.
- Accessible labels, focus states, semantic navigation, and sensible heading structure.
- Lucide React icons throughout.

---

## 3. Backend verification

### Automated integration tests

Command:

```powershell
cd uniconnect/backend
mvn test
```

Result:

```text
AuthIntegrationTest     Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
ContentIntegrationTest  Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
Total                   13 tests, 0 failures, 0 errors
```

Coverage includes authentication, registration validation, JWT rejection, protected routes, role enforcement, ownership checks, content CRUD, uploads, and moderated admin actions.

### API smoke test

Command:

```powershell
cd uniconnect
powershell -ExecutionPolicy Bypass -File scripts/smoke-test.ps1
```

Final result: **62 passed, 0 failed.**

Verified groups:

| Group | Checks |
| --- | --- |
| Health | API health and `UP` status |
| Authentication | Wrong password, admin login, registration, duplicate email, wrong email domain, `/auth/me`, missing token, tampered token |
| Dashboard | Authenticated dashboard and counts |
| Posts | Create, search, detail, update, validation, delete, 404 after delete |
| Q&A | Question, list/search, detail, answer, answer delete, question delete |
| Notes | Multipart upload, filename persistence, search, download, byte-for-byte content match, disallowed file type, delete |
| Faculty | Admin create/update/delete, student list, department list, student create denied (`403`) |
| Opportunities | Admin create/update/delete, student list, student create denied (`403`) |
| Profile | Read/update, protected role and email unchanged |
| Admin | User listing, student denied (`403`), moderation delete, deleted resource returns `404` |
| Errors | Unknown resource `404`, malformed JSON `400`, unauthenticated admin `401` |

### Runtime configuration verified
- Backend started with the `dev` profile on port `8080`.
- H2 file database and local upload storage initialized successfully.
- Admin bootstrap created the configured administrator once.
- Health endpoint returned `UP`.
- CORS verified for both `http://localhost:5173` and `http://127.0.0.1:5173`.

---

## 4. Frontend verification

### Build

```powershell
cd uniconnect/frontend
npm run build
```

Result:

```text
✓ 1681 modules transformed
dist/index.html                  0.75 kB
dist/assets/index-*.css         62.88 kB (gzip 11.79 kB)
dist/assets/index-*.js         345.33 kB (gzip 103.95 kB)
✓ built successfully
```

### Browser verification (real backend, no mocks)

| Flow | Result |
| --- | --- |
| Landing page load | ✅ Correct content, no console errors |
| Admin login through form | ✅ JWT stored, dashboard loaded |
| Student login through form | ✅ Student navigation and data loaded |
| Dashboard | ✅ Stats, activity, quick actions, profile summary |
| Create post | ✅ Modal, validation, API create, toast, list refresh |
| Post detail and edit | ✅ Detail route, author edit, updated content persisted |
| Student ownership UI | ✅ Student sees no edit/delete on another user's post |
| Note upload | ✅ File chooser simulation, multipart POST, list refresh |
| Note download | ✅ Authenticated blob download captured with correct 65-byte content |
| Ask question and answer | ✅ Question and answer persisted through the UI |
| Faculty create/edit | ✅ Admin-only controls, API persistence, toast |
| Opportunity create | ✅ Category/deadline form, listing and toast |
| Admin users page | ✅ Four accounts listed with IDs, roles, departments, and join dates |
| Profile update | ✅ Name/department/year update reflected in sidebar and profile |
| Protected fields | ✅ No editable email, university ID, or role fields |
| Student admin route | ✅ `/admin/users` redirected to `/dashboard` |
| Student admin controls | ✅ No Add faculty or Add opportunity buttons |
| Console errors | ✅ None observed during route-level testing |

---

## 5. Security verification

- [x] JWT required for every non-public endpoint.
- [x] Tampered/missing tokens rejected with `401`.
- [x] Student access to admin APIs rejected with `403`.
- [x] Admin-only faculty/opportunity mutations enforced server-side.
- [x] Ownership enforced for post, note, question, and answer mutations.
- [x] Profile update cannot change email, university ID, or role.
- [x] Password policy enforced on registration and admin bootstrap.
- [x] BCrypt strength 12.
- [x] No default admin credentials in source.
- [x] No hardcoded database/JWT secrets; environment variables only.
- [x] Upload extension and size validation.
- [x] Filename sanitization and server-generated storage keys.
- [x] Centralized error handling without stack traces.
- [x] CORS restricted to configured origins.
- [x] `.env`, uploads, local databases, `node_modules`, `dist`, and `target` ignored by Git.

---

## 6. Deployment readiness

### Live public deployment (free tier)

| Component | Platform | URL / configuration |
| --- | --- | --- |
| Frontend | Vercel (free) | https://uniconnect-beta-ebon.vercel.app — root `frontend`, Vite preset, SPA rewrite |
| Backend | Render (free, Docker) | https://uniconnect-platform-api.onrender.com — root `backend`, health check `/actuator/health` |
| Database | TiDB Cloud Starter (free) | MySQL 8.0-compatible, TLS port `4000`, schema applied by Flyway on boot |

Deployment results:

- Docker image built and started on Render; `/actuator/health` returns `UP`.
- Flyway applied `V1__create_schema.sql` on TiDB; Hibernate `ddl-auto: validate` accepted the schema.
- Admin account bootstrapped from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- CORS preflight and login succeed from the Vercel origin; other origins get `403`.
- Live API smoke test: `62 passed, 0 failed`.
- Browser check: login, dashboard, and admin user directory render real data with no console errors.

Artifacts used:

- `backend/Dockerfile` — multi-stage Maven/JRE image, non-root runtime.
- `frontend/Dockerfile` — Node build + Nginx runtime.
- `frontend/nginx.conf` — SPA fallback, `/api` proxy, gzip, upload size.
- `docker-compose.yml` — MySQL 8.4, backend, frontend, health checks, persistent volumes.
- `frontend/vercel.json` — SPA rewrites.
- `.env.example` files for backend, frontend, and Compose.
- `README.md` — setup, API, security, deployment, and troubleshooting.

**Free-tier caveats:** the backend sleeps after 15 minutes idle (~60 s cold start), the Render
filesystem is ephemeral (uploads disappear on restart unless `STORAGE_TYPE=s3` is configured),
and the instance has 512 MB RAM / 0.1 CPU.

---

## 7. Known limitations

1. **Free-tier cold starts.** The Render backend spins down after 15 minutes without traffic.
2. **Ephemeral uploads on the free plan.** Uploaded notes live on the container filesystem and are lost on redeploy/restart. Set `STORAGE_TYPE=s3` plus `S3_*` variables (any S3-compatible provider) to persist them.
3. **Email verification and password reset are not implemented.** Registration validates the university domain but does not send a verification email. This was outside the requested core scope.
4. **Email verification and password reset are not implemented.** Registration validates the university domain but does not send a verification email. This was outside the requested core scope.
5. **Admin password rotation is manual.** The bootstrap only creates an absent admin account; it does not overwrite an existing password.
6. **Sample faculty/opportunity SQL is optional.** It is not auto-loaded in production.

---

## 8. Recommended next steps

1. Configure S3-compatible storage (`STORAGE_TYPE=s3`, `S3_*`) so uploaded notes survive restarts on the free plan.
2. Optionally add email verification, password reset, and refresh-token rotation.
3. Add automated frontend component/E2E tests if ongoing UI changes are expected.

---

## 9. Final assessment

The UniConnect platform is **functionally complete** for the requested scope and is **live in production** on free hosting. Core backend and frontend flows are implemented, automated and manual verification passed locally and against the deployed stack, and the production build succeeds.
