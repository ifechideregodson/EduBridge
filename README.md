# EduBridge

EduBridge is an education platform for Nigerian learners preparing for JAMB UTME and WAEC. The initial application foundation is being built for student practice, timed CBT exams, progress tracking, offline-friendly learning, teacher/admin tools, and optional AI tutoring.

## Stack

- Next.js App Router and TypeScript
- Tailwind CSS
- Offline-ready client features planned with IndexedDB
- Deployable to Vercel or a compatible Node.js host

## Local development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm start
```

Configure any future database and AI credentials only through server-side environment variables. Never commit secrets.

## Project status

This repository was empty at project start. Features that need a database, authentication provider, or AI key must be configured and tested before being treated as production-ready.
