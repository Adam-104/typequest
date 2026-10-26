# TypeQuest

Typing lessons, games, XP, achievements and a leaderboard.

- `src/` – Spring Boot API (Java, MySQL, JWT)
- `frontend/` – React + Vite app

## Run locally

Backend: set the variables from `.env.example`, then `./mvnw spring-boot:run`.

Frontend:

```bash
cd frontend
cp .env.example .env     # VITE_API_BASE_URL=http://localhost:8080
npm install
npm run dev
```

`.env` must live in `frontend/` (not `frontend/src/`) or Vite will not read it.

## Upgrading an existing database

`game_results.game_type` used to be a native MySQL `ENUM`. It is now a
`VARCHAR` so new games never need a migration. For an existing database run once:

```sql
ALTER TABLE game_results MODIFY game_type VARCHAR(50) NOT NULL;
```

A fresh database needs nothing.

## Deploying

See **[DEPLOY.md](DEPLOY.md)** for the full checklist (Docker, managed hosting, backups, monitoring). In short:

Set `TYPEQUEST_CORS_ALLOWED_ORIGINS` to your frontend URL, build the frontend
with `VITE_API_BASE_URL` pointing at the API, and keep `JPA_SHOW_SQL=false`.

## Security notes

- **Rate limiting** covers login, forgot-password (5 per 15 min per IP),
  register (20) and reset-password (10). Behind a reverse proxy set
  `TYPEQUEST_TRUSTED_PROXY_HOPS` (1 on Render/Railway/Heroku) so each player is
  counted by their real IP; with the default `0` the `X-Forwarded-For` header
  is ignored, so it cannot be faked.
- **Passwords** must be 12–72 characters everywhere (BCrypt ignores anything
  past 72 bytes). Existing shorter passwords still work for login.
- **Usernames** are unique, ignoring capitalisation. Before the first start of
  this version, check the existing data for clashes (the database refuses to add
  the unique constraint if there are any):

  ```sql
  SELECT LOWER(username), COUNT(*) FROM users GROUP BY LOWER(username) HAVING COUNT(*) > 1;
  ```

  Rename any rows it lists, then start the app (`ddl-auto=update` adds the
  constraint). In production consider `JPA_DDL_AUTO=validate` plus a migration tool.
- **Password reset** signs the user out on every device (all refresh tokens are
  revoked) and clears any login lockout. An access token already issued stays
  valid for up to 15 minutes.
