# How tutors log in

FeesUp uses **email + password** authentication. There is no separate admin panel — each tutor
signs up once and only sees their own students.

## For users (tutors)

1. Open the app → you land on **Login** (`/login`) if not signed in.
2. **New tutor:** click **Create an account** → enter name, email, password (min 8 chars) → you
   are logged in automatically and sent to the dashboard.
3. **Returning tutor:** enter the same email and password → **Log in**.
4. **Log out:** Dashboard or Settings → **Log out** (token is cleared from the browser).

## For developers (local)

```bash
docker compose up -d
cd backend && cp .env.example .env   # set JWT_SECRET
npm install && npx prisma db push && npm run seed && npm run dev

cd frontend && cp .env.example .env
npm install && npm run dev           # http://localhost:5173
```

**Demo account** (after `npm run seed`):

| Field    | Value              |
|----------|--------------------|
| Email    | `demo@feesup.app`  |
| Password | `password123`      |

The login page shows these credentials in development and a **Fill demo credentials** button.

## API (for Lovable or other frontends)

| Method | Endpoint            | Body                          | Response        |
|--------|---------------------|-------------------------------|-----------------|
| POST   | `/api/auth/signup`  | `{ name, email, password }`   | `{ token, tutor }` |
| POST   | `/api/auth/login`   | `{ email, password }`         | `{ token, tutor }` |
| GET    | `/api/auth/me`      | Bearer JWT                    | `{ tutor }`     |

Store the `token` and send `Authorization: Bearer <token>` on all other `/api/*` calls.

Full reference: `docs/API.md` and `backend/openapi.yaml`.

## Production notes

- Set a strong `JWT_SECRET` on Render (see `docs/SECURITY.md`).
- Password reset is **not implemented yet** — tutors must remember their password or create a
  new account with a different email (or you add reset later).
- Frontend `VITE_API_URL` must point at your deployed API; CORS `FRONTEND_ORIGIN` must include
  your frontend URL.
