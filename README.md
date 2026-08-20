# Personal Task Manager — TaskFlow

A self-hosted, production-grade personal task manager built with Next.js 14, PostgreSQL, Redis, and MinIO.

## Features

- ✅ **Task Management** — CRUD, subtasks, projects, tags, priorities, due dates
- 📅 **Google Calendar Sync** — two-way sync between tasks and Calendar events
- 📝 **Markdown Editor** — per-task notes with edit/preview toggle
- 📎 **File Attachments** — stored permanently on self-hosted MinIO (S3-compatible)
- 📄 **PDF Export** — export task notes to styled PDF via Puppeteer
- 🔔 **Real Push Notifications** — Web Push to phone even when app is closed
- 📧 **Email Digest** — daily digest of pending/overdue tasks
- 🌙 **Dark Mode** — full glassmorphism dark UI
- 📱 **PWA** — installable as a home screen app

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend/API | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Auth | NextAuth.js v5, Google OAuth |
| Database | PostgreSQL + Prisma ORM |
| File Storage | MinIO (self-hosted, S3-compatible) |
| Background Jobs | Redis + BullMQ |
| Push Notifications | Web Push API (VAPID) + Service Worker |
| Email | Nodemailer / Gmail API |
| PDF | Puppeteer |
| Containers | Docker Compose |

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/CyberSparkx/personal-task-tracker.git
cd personal-task-tracker
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in your Google OAuth credentials and other values
```

### 3. Start with Docker Compose

```bash
docker compose up -d
```

This starts: PostgreSQL, Redis, MinIO, the Next.js app, and the background worker.

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Open the app

Visit [http://localhost:3000](http://localhost:3000) and sign in with Google.

## Development (without Docker)

```bash
# Start only the backing services
docker compose up postgres redis minio -d

# Run the app locally
npm run dev
```

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

Key ones:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from [Google Cloud Console](https://console.cloud.google.com)
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — generate with `npx web-push generate-vapid-keys`

---

*Built by [CyberSparkx](https://github.com/CyberSparkx)*
