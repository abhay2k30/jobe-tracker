# Job Tracker — Interview Defence Notes

> A full-stack job application tracker with a React dashboard, Vercel serverless backend, MongoDB Atlas, Chrome extension for auto-logging, and daily stale-check emails via Resend.

---

## 1. Project Overview (30-second pitch)

"I built a job application tracker that solves a real problem I had — forgetting which companies I applied to and which ones went stale. It has three parts: a **React dashboard** to view and manage applications, a **Chrome extension** that auto-detects apply-button clicks on LinkedIn, Naukri, Internshala, Wellfound, Greenhouse, and Lever and logs the application without any manual input, and a **daily cron email** that alerts you if an application hasn't been updated in 7 days. Everything runs for free on Vercel — frontend, backend (serverless functions), and cron jobs — with MongoDB Atlas as the database."

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Vercel                              │
│                                                          │
│  ┌────────────────┐    ┌─────────────────────────────┐  │
│  │ React (Vite)   │    │ Serverless Functions (Node)  │  │
│  │ /client/dist   │    │ /api/auth/login.js           │  │
│  │                │    │ /api/auth/register.js        │  │
│  │ - Dashboard    │◄──►│ /api/auth/me.js              │  │
│  │ - Login        │    │ /api/jobs/index.js           │  │
│  │ - Modals       │    │ /api/jobs/[id].js            │  │
│  └────────────────┘    │ /api/cron/stale-check.js     │  │
│                        └─────────────┬───────────────┘  │
│                                      │                   │
│  Vercel Cron: 0 9 * * * ────────────►│ /api/cron/stale  │
└──────────────────────────────────────┼───────────────────┘
                                       │
              ┌────────────────────────┼────────────────┐
              │                        │                │
      ┌───────▼──────┐        ┌────────▼──────┐  ┌──────▼───┐
      │ MongoDB Atlas │        │ Resend (email)│  │ Chrome   │
      │ Free Tier    │        │ Free Tier     │  │ Extension│
      └──────────────┘        └───────────────┘  └──────────┘
```

**Why Vercel Serverless instead of Express?**
Render's free tier sleeps after 15 minutes of inactivity — 30-60 second cold starts kill UX. Vercel serverless functions cold-start in ~200ms and never sleep. Plus cron jobs are built-in on the free (Hobby) plan.

---

## 3. Tech Stack & Why Each Choice

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + Vite | Fast HMR in dev, optimised build output |
| Styling | Tailwind CSS | Utility-first, no CSS files to maintain |
| Routing | React Router v6 | Industry standard, nested routes |
| Backend | Vercel Serverless Functions (Node.js ESM) | Free, no sleep, built-in cron |
| Database | MongoDB + Mongoose | Flexible schema, Atlas free tier |
| Auth | JWT in HttpOnly cookies | Secure, cross-request persistence |
| Email | Resend | Simple API, 3k free emails/month |
| Extension | Chrome MV3 | Latest manifest version, service workers |

---

## 4. Authentication Flow — How It Works

### Web Dashboard
1. User submits email + password → POST `/api/auth/login`
2. Server verifies password with **bcrypt** (`bcrypt.compare`)
3. Server signs a **JWT** with `userId`, `email`, `name` — expires in 7 days
4. JWT is set as an **HttpOnly cookie** — JS cannot read it, prevents XSS theft
5. Every subsequent API request sends the cookie automatically (`credentials: 'include'`)
6. Server middleware reads cookie → `jwt.verify()` → extracts `userId`

### Chrome Extension
- Extension is a **different origin** — cookies don't travel cross-origin
- After login via popup, the JWT token is stored in **`chrome.storage.local`** (sandboxed per extension, not accessible to web pages)
- Every request from background.js includes `Authorization: Bearer <token>`
- Same `requireAuth()` middleware handles both — checks cookie first, then `Authorization` header

**Why not localStorage for the web dashboard?**
HttpOnly cookies are immune to XSS attacks. localStorage can be read by injected scripts.

---

## 5. Database Design

### User Schema
```js
{ email, password (bcrypt hashed), name, createdAt }
```

### Job Schema
```js
{
  userId,       // ObjectId ref to User — all queries filtered by this
  company,      // String
  role,         // String
  url,          // String — unique per user (duplicate prevention)
  status,       // enum: Applied | In Review | Interview | Offer | Rejected | Withdrawn
  source,       // enum: LinkedIn | Naukri | Internshala | Wellfound | Greenhouse | Lever | Manual
  appliedAt,    // Date
  lastUpdated,  // Date — auto-updated on every save via pre-hook
  notes,        // String max 2000 chars
  staleSent,    // Boolean — prevents repeat stale emails
}
```

**Key design decisions:**
- `lastUpdated` is set by a Mongoose **pre-save hook** — you never forget to update it manually
- `staleSent` flag prevents spamming the user — resets to `false` when status changes
- Duplicate prevention: unique index on `{ userId, url }` — same URL can't be logged twice per user
- `userId` is indexed for fast per-user queries

---

## 6. Serverless Functions — Key Patterns

### Connection Caching (Critical for Serverless)
```js
// Naive approach — creates a new connection per invocation → WRONG
await mongoose.connect(MONGODB_URI);

// Correct — cache on global to reuse across warm invocations
let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

if (!cached.conn) {
  cached.promise = mongoose.connect(MONGODB_URI);
  cached.conn = await cached.promise;
}
```
In serverless, functions are frozen between requests but the Node.js process is reused ("warm"). Caching on `global` means you don't pay the ~300ms MongoDB handshake on every request.

### Function Structure
Each file under `/api/**` exports a single `handler(req, res)` function. Vercel routes based on file path:
- `/api/jobs/index.js` → handles `GET /api/jobs` and `POST /api/jobs`
- `/api/jobs/[id].js` → handles `PATCH /api/jobs/:id` and `DELETE /api/jobs/:id`
- `/api/cron/stale-check.js` → called by Vercel cron at `0 9 * * *` (9am UTC daily)

---

## 7. Chrome Extension — How It Works

### Manifest V3 Architecture
- **`background.js`** — Service worker. Lives in the background, handles API calls, Chrome notifications, and stores the auth token in `chrome.storage.local`
- **`content-scripts/detector.js`** — Injected into job listing pages. Watches for apply-button clicks using MutationObserver (for SPAs)
- **`popup/`** — The 340px UI when you click the extension icon

### Auto-Detection Flow
```
User visits linkedin.com/jobs/* 
  → content script injected
  → waitForElement('[aria-label="Submit application"]')
  → MutationObserver watches DOM for dynamic loads (LinkedIn is a SPA)
  → User clicks Submit → setTimeout 1500ms (wait for request to complete)
  → chrome.runtime.sendMessage({ type: 'LOG_JOB', payload: { company, role, url, source } })
  → background.js receives message → POST /api/jobs with Bearer token
  → Chrome notification: "✅ Application Logged! — Google SWE"
```

### Why MutationObserver?
LinkedIn, Naukri, Wellfound are **Single Page Applications** — the page doesn't reload when you navigate between jobs. A simple `document.querySelector` on page load would miss dynamically added buttons. MutationObserver watches the DOM for changes and re-attaches listeners.

### WeakSet for Duplicate Listeners
```js
const attachedButtons = new WeakSet();
function attachOnce(btn, handler) {
  if (attachedButtons.has(btn)) return; // already attached
  attachedButtons.add(btn);
  btn.addEventListener('click', handler);
}
```
Without this, re-running the observer on SPA navigation would attach multiple click listeners to the same button → multiple API calls per click.

### Duplicate Application Prevention
Two layers:
1. **Client-side**: `WeakSet` prevents double-click from firing twice
2. **Server-side**: MongoDB returns 409 if `{ userId, url }` pair already exists → extension shows "Already Tracked" notification

---

## 8. Cron Job — Stale Email System

**Schedule:** `0 9 * * *` — runs at 9am UTC every day (configured in `vercel.json`)

**Security:** Vercel cron calls the endpoint with `Authorization: Bearer <CRON_SECRET>`. If this header doesn't match the environment variable, the function returns 401. This prevents anyone from triggering the cron manually.

**Logic:**
```
1. Find all jobs where:
   - status is "Applied" OR "In Review" (still open, not resolved)
   - lastUpdated < 7 days ago (gone stale)
   - staleSent is false (haven't emailed about this yet)

2. Group stale jobs by userId

3. Fetch all affected users in ONE query (not N+1)

4. For each user → send Resend email with table of stale jobs

5. Mark those jobs: staleSent = true
   (won't email again until the user changes status → staleSent resets to false)
```

**Why `staleSent`?**
Without it, the cron would email you every day about the same stale job. The flag ensures you get one nudge. When you update the status (e.g., mark as Rejected), `staleSent` resets, so if it goes stale again in a future state, you'd be notified again.

---

## 9. Frontend Architecture

### State Management
No Redux or Zustand — kept simple with React's built-in tools:
- **`AuthContext`** — global user state, login/logout methods, session restore on page load
- **`useState` + `useCallback`** in Dashboard — local job list state with filter-aware fetch
- Optimistic updates for status changes — UI updates immediately, API call in background

### Routing
```
/ (PublicRoute)      → LoginPage   — redirects to /dashboard if already logged in
/dashboard (ProtectedRoute) → DashboardPage — redirects to / if not logged in
```

### Filter System
Filters are controlled state passed down to the fetch function:
```js
const [filters, setFilters] = useState({ status: '', source: '', search: '' });

function handleFilterChange(newFilters) {
  setFilters(newFilters);
  fetchJobs(newFilters); // re-fetch with new filters immediately
}
```
Filtering happens **server-side** (MongoDB `$regex` query) — not client-side array filtering. This scales correctly even with thousands of jobs.

---

## 10. Deployment — Step by Step

```bash
# 1. Push to GitHub
git init && git add . && git commit -m "init"
git remote add origin https://github.com/you/job-tracker
git push -u origin main

# 2. Connect to Vercel
# vercel.com → Import Project → select repo

# 3. Set Environment Variables in Vercel dashboard:
MONGODB_URI      = mongodb+srv://...
JWT_SECRET       = <long random string>
RESEND_API_KEY   = re_...
RESEND_FROM      = Job Tracker <notify@yourdomain.com>
APP_URL          = https://your-app.vercel.app
CRON_SECRET      = <random string>

# 4. Deploy → Vercel auto-runs:
#    cd client && npm install && npm run build
#    Serves client/dist as static files
#    Deploys api/** as serverless functions

# 5. Load extension in Chrome:
#    chrome://extensions → Developer mode → Load unpacked → select /extension
#    Update API_BASE in background.js to your Vercel URL
```

---

## 11. Common Interview Questions & Answers

**Q: Why not use Next.js since it's already Vercel-native?**
A: The original version was Next.js. I rebuilt it in React + Vite to demonstrate understanding of the separation between frontend and backend. Next.js bundles both — here I explicitly structured the serverless API layer and the static React SPA separately, which also means the frontend could be hosted anywhere (Netlify, Cloudflare Pages) independently of the backend.

**Q: How do you prevent a user from accessing another user's jobs?**
A: Every API handler calls `requireAuth()` first which extracts and verifies the JWT. The `userId` from the decoded token is then used in every MongoDB query: `Job.find({ _id: id, userId: decoded.userId })`. Even if someone knows a job's ObjectId, they can't access or modify it without owning it.

**Q: What happens if Resend is down during cron?**
A: The `sendStaleEmail` call is wrapped in try/catch per user. If it fails, we log the error and increment an `errors` counter, but continue processing other users. We deliberately don't mark `staleSent = true` if the email failed, so they'll be retried on the next cron run.

**Q: How does the extension work on LinkedIn which is a SPA?**
A: LinkedIn uses React internally and navigates without full page reloads. The content script attaches a `MutationObserver` on `document.body` that watches for URL changes and re-runs `watchLinkedInModal()` each time. This re-scans the new page's DOM for the apply button and attaches a listener.

**Q: Why JWT and not sessions?**
A: Sessions require server-side storage (Redis, DB) to persist state. Serverless functions are stateless — there's no persistent memory between invocations. JWTs encode the user data in the token itself, so any serverless function can verify auth without querying a session store.

**Q: How would you scale this?**
A: Currently it's read-heavy (dashboards) so MongoDB Atlas handles it fine. At scale I'd add: Redis caching for per-user job counts, pagination on the jobs endpoint (currently returns all), rate limiting on auth endpoints (brute-force protection), and move the cron to a dedicated queue system (BullMQ) for reliability.

**Q: What's the difference between the cookie and Bearer token auth?**
A: The web dashboard uses HttpOnly cookies — automatically attached by the browser, not readable by JS (XSS safe). The Chrome extension can't use cookies because it runs on a different origin (`chrome-extension://...`). Instead it stores the JWT in `chrome.storage.local` (sandboxed, not accessible to web pages) and sends it as a `Bearer` token in the `Authorization` header. The backend `requireAuth()` checks both: cookie first, then header.

---

## 12. Things You Deliberately Chose Not To Do (and why)

| Feature | Why skipped |
|---------|------------|
| Rate limiting | Would need Redis or a KV store — adds cost; acceptable for a personal project |
| Email verification | Adds friction for a personal tool; not needed for MVP |
| Pagination | Dataset is small per user; full list is fine |
| WebSockets / real-time | Overkill — no concurrent editing, polling/refresh is fine |
| TypeScript | Would be correct choice at scale; chose JS for speed |
| Testing | Should add Jest + React Testing Library; skipped for MVP |

---

## 13. Folder Structure Reference

```
job-tracker/
├── vercel.json              # Build config + cron schedule + rewrites
├── package.json             # Root — shared backend dependencies
├── .env.example             # All required env vars documented
│
├── api/                     # Vercel serverless functions
│   ├── _lib/                # Shared utilities (underscore = not a route)
│   │   ├── mongodb.js       # Connection caching
│   │   ├── auth.js          # JWT sign/verify, cookie helpers, requireAuth
│   │   ├── User.js          # Mongoose User model
│   │   ├── Job.js           # Mongoose Job model
│   │   └── resend.js        # Stale email HTML template + send
│   ├── auth/
│   │   ├── register.js      # POST /api/auth/register
│   │   ├── login.js         # POST /api/auth/login
│   │   └── me.js            # GET /api/auth/me + POST /api/auth/logout
│   ├── jobs/
│   │   ├── index.js         # GET /api/jobs + POST /api/jobs
│   │   └── [id].js          # PATCH /api/jobs/:id + DELETE /api/jobs/:id
│   └── cron/
│       └── stale-check.js   # GET /api/cron/stale-check (Vercel cron)
│
├── client/                  # React + Vite SPA
│   ├── index.html
│   ├── vite.config.js       # Proxy /api → localhost:3001 in dev
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx          # Router + ProtectedRoute + PublicRoute
│       ├── lib/
│       │   ├── api.js       # Thin fetch wrapper for all API calls
│       │   └── AuthContext.jsx  # Global auth state + login/logout
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   └── DashboardPage.jsx
│       └── components/
│           ├── FilterBar.jsx    # Status + source dropdowns + search
│           ├── JobTable.jsx     # Table wrapper + empty state
│           ├── JobRow.jsx       # Single row with inline status select
│           ├── EditModal.jsx    # Notes editing modal
│           └── AddJobModal.jsx  # Add application form modal
│
└── extension/               # Chrome Extension (MV3)
    ├── manifest.json
    ├── background.js        # Service worker — API calls + notifications
    ├── content-scripts/
    │   └── detector.js      # Injected into job sites — MutationObserver
    ├── popup/
    │   ├── popup.html
    │   ├── popup.css
    │   └── popup.js         # Login UI + mini job list + stats
    └── icons/
        ├── icon16.png
        ├── icon48.png
        └── icon128.png
```
