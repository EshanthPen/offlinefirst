# OfflineFirst — Deployment Guide

Everything you need to ship OfflineFirst to the public internet.

The repo is set up to deploy as a **single Node service**: the Express server serves the API at `/api/*` and the built React app for everything else. One process, one URL, one HTTPS cert.

---

## 0. Prerequisites

- [Git](https://git-scm.com/) and a GitHub account (every host below pulls from GitHub).
- Node 18+ locally (for testing the build).
- The repo pushed to GitHub:
  ```
  cd /Users/eshanthpenumatsa/offlinefirst
  git init
  git add .
  git commit -m "OfflineFirst MVP"
  gh repo create offlinefirst --public --source=. --push
  ```

---

## 1. Smoke test the production build locally

Always do this before pushing to a host — it catches 95% of deploy failures.

```bash
cd /Users/eshanthpenumatsa/offlinefirst
npm run build          # installs deps + builds client
NODE_ENV=production npm start
```

Open `http://localhost:3001` — you should see the student home page served by Express.

If that works, your deploy will work.

---

## 2. Option A — Render (recommended, free tier)

**Why:** zero-config detection of `render.yaml`, free HTTPS, no credit card needed for the free plan.

### Steps
1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** → **Blueprint**.
3. Pick the `offlinefirst` repo. Render reads [`render.yaml`](render.yaml) and proposes the service.
4. Click **Apply**.
5. Wait ~3 minutes for build + deploy. Render gives you `https://offlinefirst-<hash>.onrender.com`.

### Free-tier caveats
- The service **spins down after 15 min idle** (~30s cold start on first hit).
- Free tier has **no persistent disk** — SQLite lives on ephemeral storage and resets when the dyno recycles. The server **re-seeds the 3 sample lessons automatically on cold start**, so the demo still works. Student scores from previous sessions will be lost.
- For a real classroom deployment, upgrade to a **Starter plan ($7/mo)** to keep the 1 GB disk declared in `render.yaml`. The data then survives across restarts.

### Custom domain
Settings → **Custom Domains** → add your domain → set the CNAME Render gives you. HTTPS is auto-provisioned.

---

## 3. Option B — Railway

**Why:** great DX, $5/mo of free credit, persistent volumes work on free tier.

```bash
npm i -g @railway/cli
railway login
cd /Users/eshanthpenumatsa/offlinefirst
railway init
railway up
```

In the Railway dashboard:
- **Settings → Variables**: set `NODE_ENV=production`, `DB_PATH=/data/offlinefirst.db`.
- **Settings → Volumes**: mount a volume at `/data`.
- **Settings → Networking**: click **Generate Domain** to get an HTTPS URL.

---

## 4. Option C — Fly.io (best for global edge + free persistent volumes)

```bash
brew install flyctl
fly auth signup            # or fly auth login
cd /Users/eshanthpenumatsa/offlinefirst
fly launch                  # detects the Dockerfile; say YES to deploy now
fly volumes create data --size 1 --region <your-region>
fly deploy
```

The included `Dockerfile` sets `DB_PATH=/data/offlinefirst.db` and declares `/data` as a volume mount — Fly handles the rest.

---

## 5. Option D — VPS (DigitalOcean / Hetzner / Linode)

Use this when you want full control, a static IP, or self-hosted PeerJS signaling.

```bash
# On the server (Ubuntu 22.04+)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx
sudo npm i -g pm2

git clone https://github.com/<you>/offlinefirst.git
cd offlinefirst
npm run build

DB_PATH=/var/lib/offlinefirst.db NODE_ENV=production pm2 start server/index.js --name offlinefirst
pm2 startup    # follow the printed command
pm2 save
```

Then put nginx in front for HTTPS:
```nginx
# /etc/nginx/sites-available/offlinefirst
server {
    listen 80;
    server_name your.domain;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/offlinefirst /etc/nginx/sites-enabled/
sudo certbot --nginx -d your.domain
```

---

## 6. Option E — Docker (any container host)

```bash
cd /Users/eshanthpenumatsa/offlinefirst
docker build -t offlinefirst .
docker run -d -p 3001:3001 -v offlinefirst_data:/data --name offlinefirst offlinefirst
```

Deploy that image to any container platform: Google Cloud Run, AWS App Runner, Azure Container Apps, Coolify, Dokploy, etc.

---

## 7. Split deploy (advanced) — Vercel frontend + Render backend

Only do this if you want the frontend on a global CDN. Most users should skip — the single-deploy approach is simpler.

1. **Render**: deploy just the `server/` directory as a Web Service. Build command `cd server && npm ci`. Start `node server/index.js`.
2. **Vercel**: import the repo, set **Root Directory** to `client`. Add `VITE_API_URL=https://<your-render-url>` as an env var.
3. Update `client/src/sync.js` and any other `fetch('/api/...')` calls to prefix with `import.meta.env.VITE_API_URL` when set:
   ```js
   const API = import.meta.env.VITE_API_URL || '';
   fetch(`${API}/api/sync/bundle?...`)
   ```
4. Add CORS allowlist on the backend:
   ```js
   app.use(cors({ origin: 'https://your-vercel-domain.vercel.app' }));
   ```

---

## 8. Post-deploy smoke test

After any deploy, hit these to confirm health:

```bash
HOST=https://your-deploy.onrender.com
curl $HOST/api/health                    # → {"status":"ok",...}
curl $HOST/api/lessons | head -c 200     # → JSON array
curl -o /dev/null -w "%{http_code}\n" $HOST/sw.js   # → 200
```

Then open `$HOST/` in a browser. You should:
1. See the **Student Home** with 3 seeded lessons.
2. See the **SYNCED** indicator in the top right (green dot).
3. Be able to open a lesson, complete a quiz, and see your score on the Progress page.
4. Toggle to **Teacher View** — Network Dashboard should list your device under "CONNECTED DEVICES" within 30 seconds.

---

## 9. PWA / offline behavior in production

The service worker only registers over HTTPS (or localhost). All the hosts above provide HTTPS by default. After the first visit:
- Lessons, quizzes, and the app shell are cached.
- The user can disconnect from the internet, reload, and continue working.
- Scores save to IndexedDB and sync when connectivity returns.

To verify after deploy: load the app, open DevTools → **Application → Service Workers**, confirm it's activated. Then DevTools → **Network → Offline**, reload — the app still loads.

---

## 10. Peer-to-peer sync in production

PeerJS uses the **public PeerJS Cloud** signaling server (`0.peerjs.com`) by default. This works out of the box but:
- It has a rate limit (~50 peers per minute per origin).
- It's a third-party dependency.

For real classroom deployments, run your own [PeerServer](https://github.com/peers/peerjs-server):
```bash
npm install -g peer
peerjs --port 9000 --key offlinefirst
```
Then update `client/src/sync.js`:
```js
peer = new Peer(deviceId, {
  host: 'your.peerserver.com',
  port: 9000,
  path: '/',
  secure: true,
  ...
});
```

---

## 11. Backing up the SQLite database

SSH into your host (or use the host's shell):
```bash
# Copy the live DB to a safe location
sqlite3 /var/data/offlinefirst.db ".backup '/var/data/backup-$(date +%F).db'"

# Or just download the file
scp user@host:/var/data/offlinefirst.db ./backup.db
```

For Render/Railway/Fly: their dashboards have file browsers or `exec` access into the container.

---

## 12. Cost summary

| Host | Free tier | Persistent disk | Cold start | Recommended for |
|---|---|---|---|---|
| Render | ✅ | ❌ (paid only) | 30s after idle | Demo, competition submission |
| Railway | $5/mo credit | ✅ | None | Small classroom pilot |
| Fly.io | ✅ | ✅ (3 GB free) | None | Multi-region, real deployments |
| VPS ($5/mo) | ❌ | ✅ | None | Production, custom domain, P2P signaling |

---

## 13. Files included for deployment

| File | Purpose |
|---|---|
| `package.json` (root) | `build` and `start` scripts the host calls |
| `render.yaml` | Render Blueprint — auto-detected on import |
| `Dockerfile` | Multi-stage build for any container host |
| `.dockerignore` | Keeps `node_modules` and DB out of the image |
| `.env.example` | All supported environment variables |
| `server/db.js` | Reads `DB_PATH` env var for the SQLite location |
| `server/index.js` | Serves `client/dist/` when present (single-deploy mode) |

You don't need to edit any of these for a basic deploy — the defaults work everywhere.
