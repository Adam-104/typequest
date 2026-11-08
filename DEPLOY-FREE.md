# Deploy TypeQuest for free

Frontend on Vercel, backend on Render, MySQL on Aiven. No domain and no credit card.
You get addresses like `https://typequest.vercel.app` with HTTPS included.

**Free-tier trade-offs (read once):**
- Render's free service sleeps after 15 minutes without visitors. The first request
  after that takes 30 to 60 seconds. Everything works; it is only slow once.
- It has 512 MB of memory. The Dockerfile is tuned for that, but a busy day could still
  run it out of memory. If that happens often, that is the moment to pay for a bigger plan.
- Aiven's free MySQL (1 GB) may be powered off after a long idle period. You get a
  notice, and you switch it back on from its dashboard.
- Free plans change. Check each site's current limits before you rely on them.

## 1. Push the code to GitHub
Your repo is `Adam-104/typequest`. Commit and push the project, with `frontend/` inside it.
Never commit a real `.env` file.

## 2. Database (Aiven)
1. Sign up at aiven.io, create a service: **MySQL → Free plan**.
2. When it is running, open it and copy the **Host**, **Port**, **User** and **Password**.
3. Your `DB_URL` is:
   `jdbc:mysql://HOST:PORT/typequest?sslMode=REQUIRED`
   (Use the **Host** and **Port** fields from Aiven. Do not paste Aiven's "Service URI" that
   starts with `mysql://`; Java cannot read it and the app will fail to start.)
   `DB_USERNAME` is the user (usually `avnadmin`) and `DB_PASSWORD` the password.

## 3. Email (Brevo, free 300 emails a day)
1. Sign up at brevo.com and verify your own email address as the sender (Senders & IP).
2. **Important: Render's free plan blocks the SMTP ports (25, 465, 587), so SMTP mail times out there.**
   Use Brevo's HTTP API instead: SMTP & API → **API keys → Generate a new API key**. Copy it (it starts with
   `xkeysib-`) and set `BREVO_API_KEY` in Render. `MAIL_FROM` = your verified sender address.
   `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME` and `MAIL_PASSWORD` are then not needed.
3. Locally (or on a paid host) you can leave `BREVO_API_KEY` empty and use SMTP (`MAIL_*`) as before.

## 4. Backend (Render)
1. Sign up at render.com with GitHub. **New → Blueprint**, pick the repo
   (it reads `render.yaml`). Or **New → Web Service → Docker → Free**.
2. Fill the values it asks for:
   - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` from step 2
   - `BREVO_API_KEY` and `MAIL_FROM` from step 3
   - `TYPEQUEST_ADMIN_EMAIL` and `TYPEQUEST_ADMIN_PASSWORD` (12+ characters): your admin login
   - `TYPEQUEST_CORS_ALLOWED_ORIGINS`, `PASSWORD_RESET_BASE_URL`,
     `EMAIL_VERIFICATION_BASE_URL`: leave a placeholder for now, set them in step 6.
3. Deploy. The first build takes several minutes.
   Your API address is shown at the top, like `https://typequest-api.onrender.com`.
   Check `https://typequest-api.onrender.com/actuator/health`. It should say `UP`.

## 5. Frontend (Vercel)
1. Sign up at vercel.com with GitHub. **Add New → Project**, pick the repo.
2. Set **Root Directory** to `frontend`. The framework is Vite.
3. Environment variables:
   - `VITE_API_BASE_URL` = your Render address (no slash at the end)
   - `VITE_CONTACT_EMAIL` = an email people can write to (shown on the privacy page)
4. Deploy. You get `https://something.vercel.app`.

## 6. Connect them
Back in Render, set (use your real Vercel address):
- `TYPEQUEST_CORS_ALLOWED_ORIGINS` = `https://something.vercel.app`
- `PASSWORD_RESET_BASE_URL` = `https://something.vercel.app/reset-password`
- `EMAIL_VERIFICATION_BASE_URL` = `https://something.vercel.app/verify-email`

Save; Render redeploys.

## 7. Check it
Open the Vercel address: register, confirm the email, play a game, log out and in again,
then log in with the admin email and open `/admin`.

## Keeping it awake (optional)
A free monitor such as UptimeRobot can open `/actuator/health` every 5 minutes so the
first visitor does not wait. Render's 750 free hours a month cover one service running all month.

## Later
When you have a domain, add it in Vercel and Render, then update the three URLs in step 6.

## Troubleshooting

**"Failed to fetch" and a CORS error in the browser console.**
The backend only accepts the website addresses listed in `TYPEQUEST_CORS_ALLOWED_ORIGINS`.
Vercel gives every deployment its own address (like `typequest-abc123-yourname.vercel.app`) on top
of your main address. List the main one, and a pattern for the others:

```
https://typequest-xxxx.vercel.app,https://typequest-*-yourname.vercel.app
```

(`*` matches any text, so each new deployment is accepted.) Save in Render and wait for the redeploy.

**Friends are asked to log in to Vercel.**
That is Vercel's *Deployment Protection*, and it applies to the deployment-specific addresses.
Share your **production domain** instead: Vercel → your project → Settings → Domains.
If it is still protected, turn off *Vercel Authentication* in Settings → Deployment Protection.

**The app is very slow the first time.**
Free Render services sleep after 15 minutes. The site wakes the server as soon as someone opens it, and
the login page shows a "waking up" hint. To avoid the wait, make a free UptimeRobot monitor for
`https://YOUR-API.onrender.com/actuator/health` every 5 minutes.
Tables are managed by Flyway (`src/main/resources/db/migration`). The first deploy with Flyway marks your existing
database as version 1 without changing it. Once the app has started successfully with that deploy, set
`JPA_DDL_AUTO` to `validate` in Render (Environment) and redeploy: Hibernate then only checks the tables.
If validate ever refuses to start, the log names the column that differs from the code.

**Never share a database URI or password.** If one appears in a log or a chat, reset it in Aiven.

## Moving the API to another region (Singapore)

Why: the Aiven database is in Bangalore (DigitalOcean, `blr`). An API in Oregon pays about a quarter of a second for every database round trip, so a simple page took over 2 seconds in the first benchmark. Singapore is the closest Render region to Bangalore. Render cannot move an existing service, so you create a second one and switch over. Do not change `region` in `render.yaml` for the existing service.

1. Render: **New +**, **Web Service**, pick `Adam-104/typequest`. Name `typequest-api-sg`, **Region: Singapore**, Runtime **Docker**, Instance type **Free**, Health Check Path `/actuator/health`.
2. **Environment**: copy every variable from the old `typequest-api` service (same names, same values). Keep the same `TYPEQUEST_JWT_SECRET` so signed-in players stay signed in. Set `JPA_DDL_AUTO` to `validate`. Optionally add these to the end of `DB_URL`, joined with `&`:
   `cacheServerConfiguration=true&elideSetAutoCommits=true&useLocalSessionState=true&alwaysSendSetIsolation=false&readOnlyPropagatesToServer=false&useLocalTransactionState=true`
3. Wait for the deploy, then open `https://<new-address>/actuator/health`. It should say `UP`.
4. Measure it before switching:
   `node scripts/api-benchmark.mjs https://<new-address> you@example.com YourPassword`
   Compare with the Oregon numbers. `/api/lessons` should be much faster.
5. Switch the frontend: in Vercel set `VITE_API_BASE_URL` to the new address (no slash at the end), then **Redeploy** (the value is baked in at build time). `TYPEQUEST_CORS_ALLOWED_ORIGINS`, `PASSWORD_RESET_BASE_URL` and `EMAIL_VERIFICATION_BASE_URL` point at the website, so they do not change.
6. Point the UptimeRobot monitor at the new `/actuator/health`.
7. When the site works on the new API, suspend or delete the old `typequest-api` service.

Free hours: Render gives the free plan about 750 instance hours a month for the whole workspace. Two services kept awake at the same time would use them twice as fast, so do not ping both. Suspend the old one soon after the switch.

