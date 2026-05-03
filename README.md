# Job Tracker

Full-stack job application tracker — React dashboard + Vercel serverless API + Chrome extension + daily stale email alerts.

**Stack:** React · Vite · Tailwind · Vercel Serverless · MongoDB Atlas · JWT · Resend · Chrome MV3

---

## Quick Start (Local Dev)

```bash
# 1. Install dependencies
npm install --prefix client
npm install  # root (serverless function deps)

# 2. Set up environment
cp .env.example .env.local
# Fill in: MONGODB_URI, JWT_SECRET, RESEND_API_KEY, RESEND_FROM, APP_URL, CRON_SECRET

# 3. Install Vercel CLI
npm i -g vercel

# 4. Run locally (Vercel emulates serverless functions)
vercel dev          # starts API on :3001
cd client && npm run dev   # starts React on :3000 (proxies /api → :3001)
```

---

## Deploy to Vercel (Free)

```bash
# Push to GitHub, then:
vercel --prod

# Set these environment variables in the Vercel dashboard:
# MONGODB_URI, JWT_SECRET, RESEND_API_KEY, RESEND_FROM, APP_URL, CRON_SECRET
```

**Free services needed:**
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) — free 512MB cluster
- [Resend](https://resend.com) — free 3,000 emails/month
- [Vercel](https://vercel.com) — free Hobby plan (includes cron jobs)

---

## Chrome Extension

1. Update `API_BASE` in `extension/background.js` to your Vercel URL
2. Update the dashboard link in `extension/popup/popup.html`
3. Open `chrome://extensions` → Enable **Developer mode**
4. Click **Load unpacked** → select the `extension/` folder

**Supported sites:** LinkedIn · Naukri · Internshala · Wellfound · Greenhouse · Lever

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login → sets HttpOnly cookie |
| GET | `/api/auth/me` | Cookie/Bearer | Get current user |
| POST | `/api/auth/me` | — | Logout (clears cookie) |
| GET | `/api/jobs/index` | Yes | List jobs (filter: status, source, search) |
| POST | `/api/jobs/index` | Yes | Create job (duplicate URL → 409) |
| PATCH | `/api/jobs/:id` | Yes | Update status/notes/fields |
| DELETE | `/api/jobs/:id` | Yes | Delete job |
| GET | `/api/cron/stale-check` | CRON_SECRET | Daily stale email (Vercel cron) |

---

## Cron Schedule

Defined in `vercel.json`:
```json
{ "path": "/api/cron/stale-check", "schedule": "0 9 * * *" }
```
Runs at **9:00 AM UTC daily**. Emails users about applications in "Applied" or "In Review" status that haven't been updated in 7 days.

---

## Project Structure

```
job-tracker/
├── api/            # Vercel serverless functions
│   ├── _lib/       # Shared: MongoDB, auth, models, resend
│   ├── auth/       # register.js, login.js, me.js
│   ├── jobs/       # index.js, [id].js
│   └── cron/       # stale-check.js
├── client/         # React + Vite SPA
│   └── src/
│       ├── lib/    # api.js, AuthContext.jsx
│       ├── pages/  # LoginPage, DashboardPage
│       └── components/  # FilterBar, JobTable, JobRow, EditModal, AddJobModal
├── extension/      # Chrome Extension MV3
│   ├── background.js
│   ├── content-scripts/detector.js
│   └── popup/
└── vercel.json     # Build + cron + rewrites config
```

See **INTERVIEW_NOTES.md** for deep-dive architecture explanation.
