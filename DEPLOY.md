# Deploying TypeQuest

Two ways to run it. Pick one.

- **A. One server with Docker** (cheapest, you control everything). A small VPS
  with 2 GB RAM is enough.
- **B. Managed hosting** (less to look after): API on Render/Railway/Fly, MySQL
  from the same provider, frontend on Netlify/Vercel/Cloudflare Pages.

## 0. Before either

1. `./mvnw test` passes on your machine (the integration tests need MySQL on
   localhost with user `root`, password `root`, database `typequest_db`).
2. In `frontend/`: `npm ci && npm run lint && npm run build` passes.
3. Check the existing database for duplicate usernames (see README, "Security notes").
4. Decide your two addresses, for example `https://app.example.com` (website) and
   `https://api.example.com` (API). Use HTTPS for both.
5. Have a Brevo (or other SMTP) account with a verified sender address. Confirmation
   and password-reset emails depend on it.

Generate secrets:

```bash
openssl rand -base64 48      # TYPEQUEST_JWT_SECRET
openssl rand -base64 24      # DB_PASSWORD
```

## A. One server with Docker

1. Install Docker and Caddy on the server (Ubuntu: `curl -fsSL https://get.docker.com | sh`, `sudo apt install caddy`).
2. Copy the project to the server (for example `/opt/typequest`) and create `.env` from `.env.example`:

   ```
   DB_PASSWORD=<generated>
   TYPEQUEST_JWT_SECRET=<generated>
   TYPEQUEST_ADMIN_EMAIL=you@example.com
   TYPEQUEST_ADMIN_PASSWORD=<12+ characters>
   MAIL_HOST=smtp-relay.brevo.com
   MAIL_PORT=587
   MAIL_USERNAME=...
   MAIL_PASSWORD=...
   MAIL_FROM=no-reply@example.com
   TYPEQUEST_CORS_ALLOWED_ORIGINS=https://app.example.com
   PASSWORD_RESET_BASE_URL=https://app.example.com/reset-password
   EMAIL_VERIFICATION_BASE_URL=https://app.example.com/verify-email
   TYPEQUEST_TRUSTED_PROXY_HOPS=1
   PUBLIC_API_URL=https://api.example.com
   CONTACT_EMAIL=you@example.com
   ```

3. `docker compose up -d --build`, then `docker compose ps` (all three should become healthy/running).
4. HTTPS: copy `deploy/Caddyfile.example` to `/etc/caddy/Caddyfile`, put your two domains in it, point their DNS at the server, `sudo systemctl reload caddy`.
5. Open `https://api.example.com/actuator/health`. It should say `{"status":"UP"}`.
6. Turn on nightly backups (section "Backups" below).

Update later: `git pull && docker compose up -d --build`. Roll back: check out the
previous version and run the same command. The database volume is untouched.

## B. Managed hosting

**Database:** create a MySQL 8 database and note its host, user and password.

**API** (Render/Railway/Fly with the `Dockerfile` in the repository root, port 8080).
Set these environment variables:

| Variable | Value |
| --- | --- |
| `DB_URL` | `jdbc:mysql://HOST:3306/typequest_db` (add `?sslMode=REQUIRED` if the provider needs TLS) |
| `DB_USERNAME`, `DB_PASSWORD` | from the provider |
| `TYPEQUEST_JWT_SECRET` | generated, 32+ random bytes in Base64 |
| `TYPEQUEST_ADMIN_EMAIL`, `TYPEQUEST_ADMIN_PASSWORD` | your admin account (password 12+ characters) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` | SMTP provider |
| `TYPEQUEST_CORS_ALLOWED_ORIGINS` | your website address, e.g. `https://app.example.com` |
| `PASSWORD_RESET_BASE_URL` | `https://app.example.com/reset-password` |
| `EMAIL_VERIFICATION_BASE_URL` | `https://app.example.com/verify-email` |
| `TYPEQUEST_TRUSTED_PROXY_HOPS` | `1` (the platform's load balancer) |
| `JPA_DDL_AUTO` | `update` |

Set the platform's health check path to `/actuator/health`.

**Frontend** (Netlify/Vercel/Cloudflare Pages): build command `npm run build`, publish
directory `dist`, base directory `frontend`. Build-time variables:
`VITE_API_BASE_URL=https://api.example.com` and `VITE_CONTACT_EMAIL=you@example.com`.
`frontend/public/_redirects` (Netlify, Cloudflare) and `frontend/vercel.json` already
send every path to the app so refreshing `/learn` works.

## After the first start

- [ ] `/actuator/health` says UP.
- [ ] Sign in with the admin email and password. The **Admin** item appears in the menu.
- [ ] Register a normal test account. The confirmation email arrives and its link works.
- [ ] "Forgot password" email arrives and works.
- [ ] Finish a lesson and play one game; XP and the leaderboard update.
- [ ] Settings: change password, change email, delete the test account.
- [ ] Change `JPA_DDL_AUTO` to `validate` once the tables exist, so a typo in code cannot alter your live schema.
- [ ] Put the address of `/actuator/health` into a free uptime monitor (UptimeRobot, Better Stack) so you get an email when the site is down.

## Backups

Server with Docker: `./scripts/backup.sh` writes a compressed dump to `backups/` and
deletes dumps older than 30 days. Schedule it:

```
crontab -e
15 3 * * * cd /opt/typequest && ./scripts/backup.sh >> backups/backup.log 2>&1
```

Also copy `backups/` to another place (a second server, S3/Backblaze, even your own computer
once a week). Restore with `./scripts/restore.sh backups/<file>.sql.gz`. **Do a test restore
into a scratch database once**; a backup you have never restored is only a hope.

Managed database: switch on the provider's automatic backups and note how long it keeps them.

## Logs and errors

- API logs: `docker compose logs -f api` (or the platform's log page).
- Crashes in players' browsers are written to the same log under `typequest.client-errors`;
  search for `Browser error`.
- Unexpected server errors are logged with their stack trace and show the player a generic message.

## Things to know

- The rate limiter and lockout counters live in the API's memory. Run **one** API instance;
  with several, each keeps its own counts (a shared store such as Redis would be the next step).
- Access tokens last 15 minutes. After a password change or reset, other devices lose access when
  their current access token expires.
- The refresh token is kept in `sessionStorage`, so closing the tab signs the player out. Moving
  it to an HttpOnly cookie is possible later but changes the API contract.
- The privacy policy and terms are plain-language starting points. Have someone qualified in your
  country read them, especially if children will use the site.
