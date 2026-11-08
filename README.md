# UniConnect

A full-stack university collaboration platform for the Kalasalingam student community. UniConnect brings student posts, study notes, academic questions and answers, a faculty directory, and internships/events into one verified workspace.

The application is built as a real client/server system:

- **Frontend:** React 18 + Vite + React Router + Axios + Lucide React, with a custom responsive design system.
- **Backend:** Spring Boot 3.4.5, Java 21, Spring Security, JWT, Spring Data JPA, Bean Validation, Flyway.
- **Database:** MySQL 8 in production; H2 file database for local development and H2 in-memory for tests.
- **Storage:** local disk by default, optional S3-compatible object storage for uploaded notes.

> Student registration is restricted to `@klu.ac.in` email addresses. All authorization is enforced by the backend, not just hidden in the UI.

---

## Table of contents

- [Features](#features)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database and migrations](#database-and-migrations)
- [File storage](#file-storage)
- [API reference](#api-reference)
- [Testing](#testing)
- [Production deployment](#production-deployment)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)

---

## Features

| Module | Capabilities |
| --- | --- |
| Landing page | Responsive marketing page with feature highlights, platform summary, and calls to action. |
| Authentication | University-email registration, login, JWT session restore, logout, protected routes. |
| Dashboard | Personal stats and recent activity for posts, notes, questions, and answers. |
| Student posts | Create, list, search, sort, open, edit, and delete posts. Authors can manage their own posts; admins can moderate. |
| Study notes | Upload files with title, subject, and description; search notes; download files; delete own uploads; admin moderation. |
| Q&A | Ask questions, search, open a detail thread, post answers, delete own answers or question. |
| Faculty directory | Public-to-signed-in directory with search, department filter, and department list. Admins manage records. |
| Opportunities | Internship/workshop/competition/hackathon/event listings with category filter, upcoming-only filter, search, and admin CRUD. |
| Profile | View and update name, department, and academic year. Email, university ID, and role are read-only. |
| Admin | Registered-user directory; moderation deletion of posts, questions, and notes; admin-only faculty and opportunity management. |
| UX | Loading states, empty states, inline validation, toasts, confirmation dialogs, pagination, responsive sidebar, accessible forms. |

### Authorization model

- Anyone can view the landing page and call `POST /api/auth/register` and `POST /api/auth/login`.
- Every other API endpoint requires a valid JWT.
- `ADMIN` can manage faculty and opportunities, list users, and delete any post/question/note.
- `STUDENT` can create content, edit/delete only their own content, and read all shared content.
- Profile updates deliberately exclude email, university ID, and role, preventing privilege escalation.
- Admin routes are protected twice: URL-level (`/api/admin/**`) and method-level (`@PreAuthorize("hasRole('ADMIN')")`).

---

## Project structure

```text
uniconnect/
├── backend/
│   ├── src/main/java/com/uniconnect/
│   │   ├── config/          # Security, admin bootstrap
│   │   ├── controller/      # REST controllers
│   │   ├── dto/             # Request/response records
│   │   ├── entity/          # JPA entities and enums
│   │   ├── exception/       # Centralized error handling
│   │   ├── repository/      # Spring Data repositories
│   │   ├── security/        # JWT filter, user details, JSON 401/403 handlers
│   │   ├── service/         # Business logic and authorization
│   │   └── storage/         # Local and S3 storage implementations
│   ├── src/main/resources/
│   │   ├── application.yml      # Production defaults (MySQL)
│   │   ├── application-dev.yml  # Local H2 + local uploads
│   │   └── db/migration/        # Flyway SQL migrations
│   ├── src/test/            # Spring Boot integration tests
│   ├── database/            # Optional sample data (clearly marked)
│   ├── .env.example
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/      # Shared UI primitives
│   │   ├── context/         # Auth and toast providers
│   │   ├── layouts/         # Authenticated app shell
│   │   ├── pages/           # Route-level pages
│   │   ├── services/        # Axios API modules
│   │   ├── styles/          # Global design system
│   │   └── utils/           # Formatting, constants, API errors
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vercel.json
│   └── package.json
├── scripts/
│   └── smoke-test.ps1       # End-to-end API smoke test
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Prerequisites

| Tool | Version |
| --- | --- |
| Java | 21 or newer |
| Maven | 3.9+ |
| Node.js | 20+ (22 recommended) |
| npm | 10+ |
| MySQL | 8.0+ (production only) |
| Docker | Optional, for the Compose stack |

Local development does **not** require MySQL. It uses an H2 file database under `backend/data/`.

---

## Quick start

### 1. Backend (local, H2)

```powershell
cd uniconnect/backend
Copy-Item .env.example .env
# Edit .env and set at least JWT_SECRET. Optionally set ADMIN_EMAIL / ADMIN_PASSWORD.
mvn spring-boot:run "-Dspring-boot.run.profiles=dev"
```

On macOS/Linux:

```bash
cd uniconnect/backend
cp .env.example .env
# Edit .env, then:
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

The dev profile loads `backend/.env` automatically when present. You can also supply variables through your shell.

- API: `http://localhost:8080/api`
- Health: `http://localhost:8080/api/health`
- Actuator health: `http://localhost:8080/actuator/health`
- H2 console (dev only): `http://localhost:8080/h2-console`
  - JDBC URL: `jdbc:h2:file:./data/uniconnect`
  - User: `sa`, password: empty

### 2. Create an administrator

Set these before the first backend start:

```env
ADMIN_EMAIL=admin@klu.ac.in
ADMIN_PASSWORD=ChooseAStrong@Password123
```

The account is created only if no account with that email exists. Changing the env password later does not overwrite an existing account. The password must meet the normal policy (8–72 characters, upper/lowercase, number, special character).

### 3. Frontend

```powershell
cd uniconnect/frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:5173`.

For local development, set `VITE_API_BASE_URL=/api` to use the Vite proxy, or `http://localhost:8080/api` to call the backend directly. If you use `127.0.0.1` instead of `localhost`, the backend already allows both origins by default.

### 4. Production build

```powershell
cd uniconnect/frontend
npm run build
```

Output is written to `uniconnect/frontend/dist/`.

---

## Environment variables

### Backend (`backend/.env` locally; hosting dashboard in production)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DB_HOST` | Production | `localhost` | MySQL host. |
| `DB_PORT` | Production | `3306` | MySQL port. |
| `DB_NAME` | Production | `uniconnect` | Database name. |
| `DB_USERNAME` | Production | — | Database user. |
| `DB_PASSWORD` | Production | — | Database password. |
| `DB_USE_SSL` | No | `false` | Append SSL mode to JDBC URL. |
| `DB_POOL_SIZE` | No | `10` | Hikari maximum pool size. |
| `JWT_SECRET` | **Yes** | — | HMAC signing secret. Must be at least 32 characters. |
| `JWT_EXPIRATION_MS` | No | `86400000` | Token lifetime (24 hours). |
| `CORS_ALLOWED_ORIGINS` | Production | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed frontend origins. |
| `STORAGE_TYPE` | No | `local` | `local` or `s3`. |
| `UPLOAD_DIR` | No | `./uploads` | Local storage directory. |
| `S3_BUCKET` | When `s3` | — | Bucket name. |
| `S3_REGION` | When `s3` | `auto` | S3 region. |
| `S3_ENDPOINT` | No | — | Custom S3-compatible endpoint. |
| `S3_ACCESS_KEY` | When `s3` | — | Access key. |
| `S3_SECRET_KEY` | When `s3` | — | Secret key. |
| `S3_PATH_PREFIX` | No | `uniconnect` | Key prefix. |
| `ADMIN_EMAIL` | No | — | Initial admin email. |
| `ADMIN_PASSWORD` | No | — | Initial admin password. |
| `ADMIN_FULL_NAME` | No | `UniConnect Administrator` | Initial admin display name. |
| `ADMIN_UNIVERSITY_ID` | No | `ADMIN-001` | Initial admin university ID. |
| `ADMIN_DEPARTMENT` | No | `Administration` | Initial admin department. |
| `PORT` | No | `8080` | HTTP port. |
| `FRONTEND_URL` | No | `http://localhost:5173` | Frontend base URL. |

Generate a secret with:

```bash
openssl rand -base64 48
```

### Frontend

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Yes in production | `/api` | API root ending in `/api`. |

Never commit real `.env` files. They are ignored by `uniconnect/.gitignore`.

---

## Database and migrations

Production uses Flyway:

- `spring.jpa.hibernate.ddl-auto=validate`
- `spring.flyway.enabled=true`
- Migration: `backend/src/main/resources/db/migration/V1__create_schema.sql`

Create a MySQL database and user:

```sql
CREATE DATABASE uniconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'uniconnect'@'%' IDENTIFIED BY 'replace-with-a-strong-password';
GRANT ALL PRIVILEGES ON uniconnect.* TO 'uniconnect'@'%';
FLUSH PRIVILEGES;
```

Then set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, and start the backend. Flyway applies the schema automatically.

The optional file `backend/database/sample-data.sql` contains demo faculty and opportunity rows marked `[SAMPLE]`. It is not applied automatically.

For local development, the `dev` profile disables Flyway and lets Hibernate update the H2 schema.

---

## File storage

Uploads are validated in the backend before storage:

- Maximum size: **20 MB** (request limit 25 MB).
- Allowed extensions: `pdf`, `doc`, `docx`, `ppt`, `pptx`, `xls`, `xlsx`, `txt`, `png`, `jpg`, `jpeg`.
- Filenames are sanitized; files are stored under UUID-based keys.
- Downloads require authentication and preserve the original filename.

### Local storage

Default. Files are stored under `UPLOAD_DIR` (for example `backend/uploads` in dev).

> On Render/Railway/other ephemeral hosts, attach a persistent disk and point `UPLOAD_DIR` at it, or switch to S3.

### S3-compatible storage

```env
STORAGE_TYPE=s3
S3_BUCKET=your-bucket
S3_REGION=auto
S3_ENDPOINT=https://your-s3-endpoint
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_PATH_PREFIX=uniconnect
```

---

## API reference

Base URL: `/api`. All endpoints except auth and health require `Authorization: Bearer <jwt>`.

### Auth and health

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register with a `@klu.ac.in` email. |
| `POST` | `/auth/login` | Public | Log in and receive a JWT. |
| `GET` | `/auth/me` | Authenticated | Current user profile. |
| `GET` | `/health` | Public | Simple API health response. |
| `GET` | `/actuator/health` | Public | Spring Boot health probe. |

### Dashboard, posts, questions

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/dashboard` | Authenticated | User stats and recent activity. |
| `GET` | `/posts?search=&page=&size=&sort=` | Authenticated | Paginated posts (`sort=newest\|oldest`). |
| `GET` | `/posts/{id}` | Authenticated | Post detail. |
| `POST` | `/posts` | Authenticated | Create a post. |
| `PUT` | `/posts/{id}` | Author/Admin | Update a post. |
| `DELETE` | `/posts/{id}` | Author/Admin | Delete a post. |
| `GET` | `/questions?search=&page=&size=` | Authenticated | Paginated questions. |
| `GET` | `/questions/{id}` | Authenticated | Question and answers. |
| `POST` | `/questions` | Authenticated | Ask a question. |
| `POST` | `/questions/{id}/answers` | Authenticated | Post an answer. |
| `DELETE` | `/questions/{id}` | Author/Admin | Delete a question. |
| `DELETE` | `/answers/{id}` | Author/Admin | Delete an answer. |

### Notes, faculty, opportunities, profile

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/notes?search=&page=&size=` | Authenticated | Paginated notes. |
| `POST` | `/notes` | Authenticated | Multipart upload (`title`, `subject`, `description`, `file`). |
| `GET` | `/notes/{id}/download` | Authenticated | Download a note. |
| `DELETE` | `/notes/{id}` | Uploader/Admin | Delete a note and its stored file. |
| `GET` | `/faculty?search=&department=&page=&size=` | Authenticated | Faculty directory. |
| `GET` | `/faculty/departments` | Authenticated | Distinct departments. |
| `POST` | `/faculty` | Admin | Create a faculty record. |
| `PUT` | `/faculty/{id}` | Admin | Update a faculty record. |
| `DELETE` | `/faculty/{id}` | Admin | Delete a faculty record. |
| `GET` | `/opportunities?search=&category=&upcomingOnly=&page=&size=` | Authenticated | Opportunity listings. |
| `GET` | `/opportunities/{id}` | Authenticated | Opportunity detail. |
| `POST` | `/opportunities` | Admin | Create an opportunity. |
| `PUT` | `/opportunities/{id}` | Admin | Update an opportunity. |
| `DELETE` | `/opportunities/{id}` | Admin | Delete an opportunity. |
| `GET` | `/profile` | Authenticated | Own profile. |
| `PUT` | `/profile` | Authenticated | Update name, department, academic year. |

### Admin

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/admin/users?search=&role=&page=&size=` | Admin | User directory. |
| `DELETE` | `/admin/posts/{id}` | Admin | Moderate a post. |
| `DELETE` | `/admin/questions/{id}` | Admin | Moderate a question. |
| `DELETE` | `/admin/notes/{id}` | Admin | Moderate a note. |

### Error format

```json
{
  "timestamp": "2026-11-04T05:41:16Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Please correct the highlighted fields.",
  "path": "/api/auth/register",
  "fieldErrors": {
    "email": "A valid Kalasalingam University email ending in @klu.ac.in is required"
  }
}
```

Validation failures return `400`, authentication failures `401`, authorization failures `403`, conflicts `409`, missing resources `404`, oversize uploads `413`, and unexpected errors `500` without leaking stack traces.

---

## Testing

### Backend integration tests

```powershell
cd uniconnect/backend
mvn test
```

Current result: **13 tests, 0 failures, 0 errors** across `AuthIntegrationTest` (7) and `ContentIntegrationTest` (6).

### API smoke test

With the backend running:

```powershell
cd uniconnect
powershell -ExecutionPolicy Bypass -File scripts/smoke-test.ps1
```

The script verifies 62 checks: health, login/registration validation, JWT rejection, dashboard, full post CRUD, questions/answers, multipart note upload/download, disallowed file types, faculty/opportunity admin-only CRUD, profile protection, admin user listing, moderation deletion, and 401/403/404 handling.

Override the target or admin credentials with parameters or environment variables:

```powershell
$env:UNICONNECT_ADMIN_EMAIL = 'admin@klu.ac.in'
$env:UNICONNECT_ADMIN_PASSWORD = 'your-admin-password'
powershell -ExecutionPolicy Bypass -File scripts/smoke-test.ps1 `
  -BaseUrl http://localhost:8080/api
```

### Frontend build

```powershell
cd uniconnect/frontend
npm run build
```

Current result: successful production build (1,681 modules; approximately 63 kB CSS and 345 kB JS before gzip).

### Manual verification completed

- Landing, login, registration, dashboard, posts, notes, questions, faculty, opportunities, profile, admin users.
- Note upload and download through the real UI and API.
- Student restrictions: no admin navigation, admin route redirects, no admin-only controls.
- Author-only edit/delete controls.
- Zero browser console errors during route-level testing.

---

## Production deployment

### Live deployment (free tier)

The public instance runs entirely on free plans:

| Component | Platform | Notes |
| --- | --- | --- |
| Frontend | Vercel (free) | https://uniconnect-beta-ebon.vercel.app — project root `frontend`, Vite preset, SPA rewrite |
| Backend | Render (free, Docker) | https://uniconnect-platform-api.onrender.com — root `backend`, health check `/actuator/health` |
| Database | TiDB Cloud Starter (free) | MySQL 8.0-compatible, TLS on port `4000`, schema created by Flyway on first boot |

Verified against the live stack: Flyway migration, admin bootstrap and login, dashboard,
admin user directory, CORS preflight with the Vercel origin, and the full API smoke test
(`62 passed, 0 failed`).

Free-tier limits to expect:

- The backend spins down after 15 minutes without traffic; the next request takes ~60 s to wake it.
- The Render filesystem is ephemeral, so uploaded study notes are lost on redeploy or restart.
  Set `STORAGE_TYPE=s3` and the `S3_*` variables to keep uploads (any S3-compatible store).
- Render free provides 512 MB RAM / 0.1 CPU; the JVM runs with `-XX:MaxRAMPercentage=75`.

### Option A — Docker Compose (single host)

```powershell
cd uniconnect
Copy-Item .env.example .env
# Edit .env: set DB_PASSWORD, MYSQL_ROOT_PASSWORD, JWT_SECRET, origins, and optional admin values.
docker compose up --build
```

Services:

- MySQL 8.4 on an internal volume.
- Backend at `http://localhost:8080` (Flyway migrates on startup).
- Frontend (Nginx) at `http://localhost:3000`, proxying `/api` to the backend.
- Uploads persisted in the `uniconnect_uploads` volume.

Set `CORS_ALLOWED_ORIGINS` and `FRONTEND_URL` to the public frontend origin.

### Option B — Vercel frontend + Render/Railway backend + managed MySQL

**Backend (Render/Railway):**

1. Create a MySQL 8 instance and note its connection details.
2. Create a web service from `uniconnect/backend`.
3. Build: `mvn -B clean package -DskipTests`
4. Start: `java -jar target/uniconnect-api-1.0.0.jar`
5. Health check path: `/actuator/health`
6. Set all required environment variables (`DB_*`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, storage settings, optional admin bootstrap).
7. Attach a persistent disk for local uploads (mount it and set `UPLOAD_DIR`), or use S3.
8. Never commit secrets; use the hosting dashboard.

**Frontend (Vercel):**

1. Import the repository and set the project root to `uniconnect/frontend`.
2. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
3. Set `VITE_API_BASE_URL=https://your-backend-host/api`.
4. Deploy. `vercel.json` already rewrites client-side routes to `index.html`.
5. Add the Vercel production URL to the backend's `CORS_ALLOWED_ORIGINS`.

**Production checklist:**

- [ ] `JWT_SECRET` is long, random, and unique per environment.
- [ ] Database credentials are secrets, not source files.
- [ ] `CORS_ALLOWED_ORIGINS` contains only real frontend origins.
- [ ] Flyway migration applied successfully.
- [ ] Admin account created with a strong password.
- [ ] Persistent storage configured for notes.
- [ ] HTTPS enabled on both frontend and backend.
- [ ] Health checks and logs verified.

---

## Security notes

- Passwords are hashed with BCrypt (strength 12).
- JWTs use HMAC-SHA with a required environment secret and 24-hour expiry.
- Security is stateless; CSRF is disabled because the API is token-based and does not use cookies.
- Ownership checks are enforced in services, not only in the UI.
- Admin endpoints require both URL and method authorization.
- Uploads validate extension, size, and sanitized filename. Stored filenames are server-generated.
- Error responses do not expose stack traces or internal messages.
- CORS allows only explicitly configured origins.
- Profile updates cannot change email, university ID, or role.
- `.env` files, uploads, databases, and build artifacts are excluded from Git.

If you add password reset, email verification, or refresh tokens, extend the backend and tests rather than weakening these controls.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `JWT_SECRET` placeholder error on startup | No secret supplied | Set `JWT_SECRET` in `.env` or the environment. |
| Login returns 403 through Vite proxy | Frontend origin not allowed by CORS | Use `localhost:5173` or add your origin to `CORS_ALLOWED_ORIGINS`, then restart the backend. |
| `401` immediately after login | Backend restarted with a different `JWT_SECRET` | Log in again, or keep the secret stable. |
| Admin account not created | Missing email/password, or account already exists | Set both admin variables before first start; use a different email or update the DB manually. |
| Note upload rejected | File type or size not allowed | Use a supported extension and keep the file at or below 20 MB. |
| Uploads disappear after redeploy | Ephemeral filesystem | Attach a persistent disk or configure S3. |
| Flyway validation fails | Entities and migration out of sync | Add a new versioned migration; never edit an applied migration in production. |
| Cannot connect to MySQL | Wrong host/port/credentials or SSL settings | Verify `DB_*` values and network access; set `DB_USE_SSL` appropriately. |

---

## Status

See [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) for the current verification state, completed work, test evidence, and known environment limitations.

---

Built for the Kalasalingam Academy of Research and Education student community.

UniConnect is an independent student project and is not an official university communication channel.
