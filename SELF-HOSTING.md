# Running Elfie on your own Mac

This runs everything Elfie needs on one computer: the app, the database, sign-in and
live updates. Your gift lists live on your Mac, nothing pauses, and there's no
monthly bill. Other households reach it over a free, secure link from Tailscale.

It's light: about 400 MB of memory while running. It works on Apple Silicon and Intel
Macs, and on any other machine that runs Docker (the commands are the same).

**You'll need**

- A Mac that stays on (and awake) while people are using Elfie.
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (free for personal use).
- [Tailscale](https://tailscale.com/download) (free personal plan), for access away from home.
- Your data export from Lovable (step 4). Get it **before** you cancel Lovable Cloud.

All commands below are typed into **Terminal** (Applications → Utilities → Terminal).

---

## 1. Install Docker Desktop

Download it, drag it to Applications and open it once. In Docker Desktop's
**Settings → General**, turn on **Start Docker Desktop when you sign in**, so Elfie
comes back by itself after the Mac restarts.

## 2. Get the code

Put it in your home folder (not Desktop or Documents, which macOS keeps scheduled
jobs out of, so automatic backups would fail there):

```bash
cd ~
git clone https://github.com/CapUnc/elfie-gift-tracker-50.git elfie
cd ~/elfie/selfhost
```

The first time, macOS may offer to install "command line developer tools". Say yes,
then run the commands again. If git asks you to sign in, use your GitHub username and
a [personal access token](https://github.com/settings/tokens) as the password, or
clone with the GitHub Desktop app instead.

## 3. Create your secrets (once)

```bash
./setup.sh
```

This writes `selfhost/.env` with random passwords and keys for your database. Keep
that file: the database only opens with those exact secrets. It's never uploaded to
GitHub.

## 4. Bring your data over from Lovable

1. In Lovable open your project, then **More → Cloud → Overview → Advanced settings**.
2. Under **Export project data** click **Export data**, then **Export** on the
   **Database** card, then **Start export**.
3. Lovable emails you when it's ready. Download the file from **More → Cloud → Storage**.
   (Exports are limited to one a day, and disappear when Cloud is removed.)
4. Load it into Elfie:

```bash
./restore.sh ~/Downloads/<the file you downloaded>
```

The first run downloads Supabase (a few GB) and builds the app, so give it several
minutes. When it says **Done**, open <http://localhost:8085> and sign in with your
usual email and password.

What comes across: every account (with its password), every household, recipient,
gift, note and invite code, plus the database rules that keep each household's lists
private. Everyone just needs to sign in once more.

**People who used "Continue with Google"** don't have a password yet. Give them one,
then let them know:

```bash
./set-password.sh their@email.com 'a new password'
```

## 5. Let the other households in (Tailscale Funnel)

Funnel gives your Mac a public `https://` link that works from anywhere, without
touching your router. Use the same link at home and away.

1. Install Tailscale on the Mac (the App Store or the standalone download both work)
   and sign in.
2. In Terminal:

   ```bash
   /Applications/Tailscale.app/Contents/MacOS/Tailscale funnel --bg 8085
   ```

   The first time, it prints a link to approve Funnel for your account. Open it,
   approve, and run the command again.
3. It prints your link, something like `https://your-mac.tail1234.ts.net`. That's the
   address for everyone. A brand-new link can take up to 10 minutes to start working.

`--bg` keeps the link running after restarts. To check it:
`/Applications/Tailscale.app/Contents/MacOS/Tailscale funnel status`.
To turn it off: `... funnel reset`.

Tip: rename the Mac in the [Tailscale admin console](https://login.tailscale.com/admin/machines)
(e.g. to `elfie`) before step 2 for a friendlier link.

## 6. Keep the Mac awake

- **iMac / Mac mini / Mac Studio:** System Settings → Energy → turn on
  **Prevent automatic sleeping when the display is off**.
- **MacBook:** keep it plugged in, then System Settings → Battery → Options → turn on
  **Prevent automatic sleeping on power adapter when the display is off**. Closing
  the lid still puts it to sleep unless an external display is connected.

After a restart, someone has to sign in to the Mac for Docker Desktop (and Elfie) to start.

---

## Everyday use

Run these from `~/elfie/selfhost`.

| To... | Run |
| --- | --- |
| Stop Elfie | `docker compose down` |
| Start it again | `docker compose up -d` |
| Update after pulling new code | `git pull` then `docker compose up -d --build` |
| Back up now | `./backup.sh` (saves to `selfhost/backups/`, keeps the newest 30) |
| Reset someone's password | `./set-password.sh their@email.com 'new password'` |
| See what's running | `docker compose ps` |

**Never run `docker compose down -v`** unless you mean to delete all the data.

**Back up automatically.** Run `crontab -e` and add this line for a backup every night
at 3am (adjust the folder if you put the code somewhere else):

```
0 3 * * * PATH=/usr/local/bin:/opt/homebrew/bin:$HOME/.docker/bin:/usr/bin:/bin $HOME/elfie/selfhost/backup.sh
```

Backups only help if they're somewhere else too: copy `selfhost/backups/` to your NAS
now and then, or let Time Machine pick it up. To recover on a fresh install: steps
1–3, then `./restore.sh backups/<file>`.

**Stop strangers signing up.** Your link is public, so anyone who finds it could create
an account (they would only see an empty household of their own). Once everyone has
signed up, set `DISABLE_SIGNUP=true` in `selfhost/.env` and run `docker compose up -d`.
Set it back to `false` to let someone new join.

## Optional: Google sign-in

Email and password needs no setup. To bring back "Continue with Google":

1. In the [Google Cloud console](https://console.cloud.google.com/apis/credentials),
   create an OAuth client (type: Web application) with
   - authorized JavaScript origin: your link, e.g. `https://your-mac.tail1234.ts.net`
   - authorized redirect URI: your link + `/auth/v1/callback`
2. In `selfhost/.env` set `SITE_URL` to your link, `GOOGLE_ENABLED=true`, and fill in
   `GOOGLE_CLIENT_ID` and `GOOGLE_SECRET`.
3. `docker compose up -d`

Existing Google accounts keep working: Google identifies people the same way
regardless of which OAuth client is used.

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| `docker: command not found` | Docker Desktop isn't running. Open it and wait for it to say it's running. |
| `./restore.sh` says the database already has data | It only loads into an empty install. To start over: `docker compose down -v` (deletes everything), then run it again. |
| The page loads but everything shows errors | You ran `docker compose up` without restoring. Run `./restore.sh` with your export. |
| Everything says "invalid key" or 401 after re-running setup | The app was built with the old key. Run `docker compose up -d --build`. |
| The Tailscale link doesn't open | New links take up to 10 minutes. Check `... funnel status` and that the Mac is awake. |
| Works on the Mac but not on phones | Use the Tailscale link, not `localhost`, on other devices. |
| Someone forgot their password | `./set-password.sh` (there's no mail server, so "reset by email" isn't available). |
| A service keeps restarting | `docker compose logs <service>` (app, db, auth, rest or realtime) shows why. |

---

## Other ways to host

- **Hosted Supabase + just the app at home:** create a project at supabase.com, restore
  the export there (Lovable's guide covers it), put its URL and publishable key in the
  repo-root `.env` (see `.env.example`), and run `docker compose up -d --build` in the
  repo root. Free Supabase projects pause after about a week without use.
- **A NAS or Linux server:** the `selfhost/` setup runs anywhere Docker Compose does.

## How it works (for the curious)

`selfhost/docker-compose.yml` is trimmed from Supabase's official self-hosting setup
(image versions as of October 2026): Postgres 17, auth, the REST API and realtime.
Storage, edge functions, analytics, the connection pooler and the dashboard are left
out because Elfie doesn't use them. The app's nginx (`selfhost/nginx.conf`) also routes
`/auth/v1`, `/rest/v1` and `/realtime/v1` to those services, so the app and its backend
share one address. The app is built with `VITE_SUPABASE_URL` empty, which makes it talk
to whatever address it was opened from (`src/integrations/supabase/client.ts`).

`restore.sh` loads the export's whole `public` schema (tables, data, functions,
policies, triggers, realtime settings) and merges user accounts column by column, so
small Supabase version differences don't matter. Note that `supabase/migrations/` in
this repo is **not** a complete description of the database: Lovable changed the live
schema without committing migrations (for example, the `givers`, `gift_givers` and
`gift_templates` tables). The export is the source of truth.
