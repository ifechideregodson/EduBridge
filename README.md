# EduBridge

EduBridge is a Next.js learning platform for Nigerian learners preparing for JAMB UTME and WAEC.

## Current implementation

- PostgreSQL schema for accounts, subjects, questions, exams, attempts, answer records, progress and tutor messages.
- Student registration and login using bcrypt password hashing and signed HTTP-only session cookies.
- Server-side student, teacher and administrator role checks.
- Teacher question creation and exam publishing APIs.
- Server-marked CBT submissions and persisted subject progress.
- AI tutor API (requires a server-side OpenAI API key).
- Offline practice question cache using IndexedDB, plus a static app-shell service worker.

The repository is under active development. Run the checks and complete the setup below before treating a deployment as production-ready.

## Local development

Requirements: Node.js 20+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env
# Edit .env with your PostgreSQL URL and a random AUTH_SECRET of at least 32 characters.
npx prisma db push
npm run db:seed
npm run dev
```

The seed command creates the standard subject list. To create or refresh the initial administrator, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 12 characters) in the environment before running the seed. Keep these credentials private. Never expose `AUTH_SECRET`, `DATABASE_URL`, or `OPENAI_API_KEY` to browser code or commit real values.

## Vercel + PostgreSQL

1. Import this repository into Vercel and select the Next.js framework.
2. Create a PostgreSQL database (for example, Neon or Vercel Postgres) and copy its pooled/runtime connection URL into the Vercel environment variable `DATABASE_URL`. If your provider gives a separate direct connection URL for schema changes, follow that provider's Prisma guidance.
3. Set `AUTH_SECRET` to a long random secret (32+ characters).
4. Optionally set `OPENAI_API_KEY` and `OPENAI_MODEL` to enable the tutor. The API key must remain server-side.
5. Deploy. Apply the schema to the production database from a trusted terminal/CI environment with `npx prisma db push`; do not run schema changes from an unauthenticated public endpoint.
6. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in a secure environment and run `npm run db:seed` once to create the first admin, then remove those bootstrap values from runtime configuration if no longer needed.
7. Sign in at `/login`. Student accounts can self-register; teacher/admin roles must be assigned by an administrator.

## Main routes

- `/login` — sign in or register
- `/student` — learner dashboard and published exams
- `/exams/[id]` — timed CBT exam
- `/practice/offline` — cached practice questions after a successful download
- `/tutor` — AI tutor
- `/teacher` — teacher question management
- `/admin` — user roles and platform counts

## Important limitations

- The service worker caches the public app shell only; authenticated dashboards and exam pages are not cached.
- Offline practice questions are saved on the current device in IndexedDB. Offline answers are practice-only and do not sync as official exam attempts.
- The AI tutor needs an active provider API key and may incur usage charges.
- Add rate limiting, email verification/password reset, audit logging, backups, privacy/legal pages and monitoring before a public production launch.
