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
Once your tables exist, you can also set `JPA_DDL_AUTO` to `none` in Render to make each start a few
seconds faster. Set it back to `update` when a release adds a new table or column.

**Never share a database URI or password.** If one appears in a log or a chat, reset it in Aiven.
