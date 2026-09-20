# Running Elfie on your own server (NAS)

Elfie is a static front-end plus a Supabase backend (database + auth + realtime).
To run it at home you need both halves.

---

## 1. Bring up a backend

Elfie talks to Supabase. Two options:

- **Keep using a hosted Supabase project** — simplest; nothing to maintain.
- **Self-host Supabase on the NAS** — follow the official self-hosting Docker guide
  (`supabase/docker` repo). It gives you Postgres, auth (GoTrue), the API gateway
  (Kong), and realtime in one compose stack.

Then create the schema by replaying the migrations in `supabase/migrations/`
**in filename order**:

```bash
for f in supabase/migrations/*.sql; do
  psql "$DATABASE_URL" -f "$f"
done
```

They create every table, index, row-level-security policy, function and trigger.
They do **not** create data — you start with an empty household.

---

## 2. Configure sign-in

The app supports Google sign-in and email + password.

**Email + password** works out of the box once the auth service is running. If you
don't want confirmation emails (no SMTP at home), turn on auto-confirm in your
auth settings — otherwise nobody can finish signing up.

**Google sign-in** needs, in the Google Cloud console for your OAuth client:

- Authorised JavaScript origin: `https://elfie.your-nas-host` (your real URL)
- Authorised redirect URI: `<your-backend-url>/auth/v1/callback`

And in your auth service config: the Google client ID + secret, plus your app URL
as the **Site URL** and in **Additional redirect URLs**. Skipping this is the most
common reason the first sign-in fails after a move.

---

## 3. Configure the app

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and
`VITE_SUPABASE_PROJECT_ID` from your backend. These are **build-time** values —
Vite bakes them into the bundle, so rebuild after any change.

The publishable (anon) key is meant to be public; row level security protects the
data. Never put the `service_role` key in this file.

---

## 4. Run it

### Docker (recommended)

```bash
docker compose up -d --build
```

Serves the app on port `8085`. `Dockerfile` builds the static bundle and
`nginx.conf` serves it with SPA routing and sane cache headers.

### Without Docker

```bash
npm ci
npm run build
# serve the ./dist folder with any static web server
```

---

## 5. Reverse proxy notes

If you put the app behind your NAS reverse proxy (nginx, Traefik, Caddy):

- **Websockets must pass through.** Live updates between family members use a
  websocket connection to the backend. Without `Upgrade`/`Connection: upgrade`
  headers, changes only appear after a page refresh.
- Serve over HTTPS. Google sign-in requires it, and it keeps sessions working.
- Everything under `/` must fall back to `index.html` (already handled inside the
  container's nginx config).

A commented example of proxying the backend on the same origin is at the bottom of
`nginx.conf`.

---

## 6. Backups

Your gifts live in Postgres, not in this repo. Schedule a dump:

```bash
pg_dump "$DATABASE_URL" > /volume1/backups/elfie-$(date +%F).sql
```

Keep a few weeks of them. Restoring is `psql "$DATABASE_URL" -f <file>.sql`.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Blank page, console errors about `undefined` URL | `.env` missing or app built before it was filled in |
| Sign-in redirects to the wrong address | Site URL / redirect URLs not updated to your NAS domain |
| "Unsupported provider" | Google provider not enabled in the auth service |
| Changes only show after refresh | Websockets blocked by the reverse proxy |
| Refreshing a sub-page gives 404 | Static server isn't falling back to `index.html` |
