# Smart Waste Tracker

## Authentication & Authorization

- Uses NextAuth.js with a credentials provider and MongoDB adapter. Users in the `users` collection must include `email`, `password` (bcrypt hash), `name`, and `role` (`user` or `admin`).
- Set required environment variables in a local `.env` file (never commit secrets). Provide teammates with a sanitized `.env.example` that includes:
  ```
  MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/waste_tracker
  MONGODB_DB=waste_tracker
  NEXTAUTH_SECRET=replace-with-strong-random-string
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=replace-with-browser-key
  ```
  Optional helpers for seeding:
  ```
  ADMIN_EMAIL=admin@example.com
  ADMIN_PASSWORD=ChangeMe123!
  ADMIN_NAME=Admin
  ```
- Generate a secure `NEXTAUTH_SECRET` (e.g., `openssl rand -base64 32`) and keep it outside version control.

## Seed an Admin User

1. Copy `.env.example` to `.env.local` and fill in the values.
2. Run `npm install`.
3. Execute the admin seed script:
   ```bash
   node scripts/seed-admin.mjs
   ```
   The script upserts an admin account using the email/password from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Protecting Admin Routes

- Middleware enforces admin-only access to `/dashboard` and `/analytics`, redirecting unauthorized users to `/login`.
- API routes that mutate reports verify the active session server-side and return `401`/`403` when needed.

## Frontend Hints

- Use `useSession()` to toggle admin-only UI (e.g., hide Dashboard link when `session.user.role !== 'admin'`).
- When redirected to `/login?error=unauthorized`, a toast prompts the user to authenticate as an admin. 
