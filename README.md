# OfflineFirst

Education without internet.

Addresses UN SDGs **4** (Quality Education), **9** (Infrastructure), and **10** (Reduced Inequalities).

## The problem
300 million students have no internet access. Most edtech requires connectivity. OfflineFirst doesn't.

## How it works
1. Lessons sync to devices when internet is briefly available.
2. Devices share content with each other over local WiFi using WebRTC (no internet needed).
3. Students complete quizzes offline; scores sync when connectivity returns.
4. Teachers monitor all devices and results from a live dashboard.

## Quick start

### Backend
```
cd server
npm install
npm run dev
```
Server runs on `http://localhost:3001`.

### Frontend
```
cd client
npm install
npm run dev
```
App runs on `http://localhost:5173`.

## Demo instructions
1. Open the app on two devices on the same WiFi network.
2. Disconnect from the internet on both.
3. Lessons still load from the local IndexedDB / service worker cache.
4. Complete a quiz. The score saves to IndexedDB.
5. Reconnect one device. Scores sync to the server.
6. Switch to **Teacher View** in the sidebar to see the dashboard.

## Deploy
One-process deploy (Express serves the API and the built React app):
```
npm run build
NODE_ENV=production npm start
```
See [DEPLOYMENT.md](DEPLOYMENT.md) for Render / Railway / Fly.io / Docker / VPS step-by-step.

## Production hardening

Out of the box, OfflineFirst is fully open: anyone can flip to Teacher view and edit lessons. To lock down a real deployment, set these env vars on your host:

| Var | What it does |
|---|---|
| `TEACHER_PIN` | 4 to 10 digit PIN. Teacher view, lesson writes, and backup/restore all require it. |
| `AUTH_SECRET` | 32+ random hex bytes. Signs the teacher session token. Persist across deploys to keep sessions alive. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `ALLOWED_ORIGINS` | Comma-separated list, e.g. `https://offlinefirst.org`. Locks CORS to your domain. |
| `SCHOOL_NAME` | Display name for the school. Pre-fills the onboarding flow and shows in the sidebar. |

When `TEACHER_PIN` is set:
- The role-switch button opens a PIN modal instead of flipping freely.
- `POST/PUT/DELETE /api/lessons` returns 401 without a teacher token.
- `GET /api/admin/export` and `POST /api/admin/import` require teacher auth.
- Score sync rate-limits at 60 calls/min/IP.

Manual backup is one click in **Settings → Data and backups → Export JSON**. Restore via Import.

## Daily auto-backup

The server writes a JSON snapshot of the entire database every `BACKUP_INTERVAL_HOURS` hours (default `24`) to `BACKUP_DIR` (default `<DB_PATH parent>/backups`). The last 14 are kept; older ones are pruned.

Set the four S3 env vars (`S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`) to upload each backup to any S3-compatible store (AWS S3, Cloudflare R2, Backblaze B2, MinIO). Uses a built-in SigV4 signer (no `aws-sdk` dependency).

Set `BACKUP_INTERVAL_HOURS=0` to disable.

## Multi-tenancy: one deploy per school

OfflineFirst intentionally does not have row-level tenancy. The recommended model for serving multiple schools is **one deploy per school**:

- Each school gets its own Render service (or Fly app, or Pi).
- Each deploy has its own `TEACHER_PIN`, `AUTH_SECRET`, `ALLOWED_ORIGINS`, `BACKUP_DIR`, `SCHOOL_NAME`.
- Data is fully isolated at the host level. No schema for "tenant_id", no risk of one school seeing another's scores.
- Costs are linear and predictable: Render Starter at $7/mo per school, or one $5/mo Pi at the school for true zero-internet deployments.

Use Render's Blueprint feature to spin up a new school in about 3 minutes by importing `render.yaml` against a fresh service name, then setting that school's env vars.

## Onboarding (first run)

On first launch the app shows an 8-step wizard that captures: role (student or teacher), school, display name, language, text size, grade level (student) or subject list (teacher), and optional pairing with a nearby device. The profile is stored in IndexedDB and survives reloads. Users can replay onboarding any time from **Settings → Preferences → Restart setup**.

## SDG alignment
- **SDG 4**: Delivers structured curriculum (lessons + quizzes) to zero-connectivity environments.
- **SDG 9**: Mesh sync layer creates resilient educational infrastructure from existing consumer devices.
- **SDG 10**: Targets the exact population excluded from mainstream edtech, the 2.7 billion without internet.

## Tech stack
React, Vite, Tailwind, Node.js, Express, SQLite, PeerJS (WebRTC), IndexedDB, PWA Service Worker.
