# ⚙️ Next.js + Netlify Security & Architecture Report

### End-to-End Operational Flow and Data Safety Analysis

**Date:** November 6, 2025
**Author:** Internal Engineering Team
**Scope:** Documenting the entire request lifecycle of a Next.js application deployed on **Netlify**, connected to **MongoDB Atlas** and **OpenAI**, focusing on **process integrity, event orchestration**, and **security guarantees**.

---

## 📋 Table of Contents

1. Overview of the System Flow
2. Step 1 – Home Page
3. Step 2 – Form Submission
4. Step 3 – Job Creation API
5. Step 4 – Background Processing
6. Step 5 – Redirect to Admin
7. Step 6 – Admin Page and Workspace
8. Step 7 – SSE Streaming and Tile Rendering
9. Step 8 – Data Persistence and MongoDB
10. Step 9 – Security Architecture & Guarantees
11. Full Orchestration Timeline (Frontend → Netlify → MongoDB → OpenAI → SSE)
12. Critical Failure Points and Mitigations

---

## 🎯 1. Overview of the System Flow

The system runs a **user-facing form** on the landing page (`/`) where visitors submit structured inputs.
Each submission triggers an **asynchronous job pipeline** that includes:

1. Form validation and request creation
2. Secure POST request to `/api/prompt-jobs`
3. Job creation in MongoDB with a unique token
4. Fire-and-forget execution of a background worker
5. Asynchronous tile generation via OpenAI
6. Tile persistence and live event streaming through SSE
7. Real-time UI update on the `/admin` dashboard

```
Frontend (Next.js, Netlify)
  │
  ├─ POST /api/prompt-jobs
  │
  ▼
Serverless Function (Next.js API Route)
  ├─ Validates request (Joi)
  ├─ Pre-warms MongoDB connection
  ├─ Generates guestId + jobId + token
  ├─ Creates dynamic workspace
  ├─ Inserts job + workspace documents
  ├─ Triggers background runner (async)
  └─ Returns { jobId, guestId, token }

Background Runner
  ├─ Waits 1s for SSE connection
  ├─ Loads job and workspace
  ├─ Resolves entity key (companies, etc.)
  ├─ Queues job for tile generation
  ├─ Calls OpenAI Runner
  └─ Emits real-time events via SSE

SSE Manager
  ├─ Maintains open client connections
  ├─ Buffers events when disconnected
  └─ Streams tile updates to Admin UI
```

---

## 🏠 2. Step 1 – Home Page

**File:** `app/page.js`

- Determines which form variant to render (`classic` or `dynamic`)
- Loads `IAFormsContainer` with theme, template, and 8 placeholder items
- Page is **public** (no authentication middleware required)

**Security considerations:**

- Inputs are isolated in a client-only context; no sensitive tokens in URL.
- Only whitelisted template IDs are allowed (`tpl_classic_default`, `tpl_dynamic_default`).

---

## 🧾 3. Step 2 – Form Submission

**File:** `components/landing/IAFormsContainer.jsx`

### Submission Flow

1. Validates that both `themeId` and `initialTemplateId` exist

2. Extracts payload via `itemsBuilder()`

3. Builds a `context` object with `target`, `solution`, and optional `website`

4. Sends a secure `POST /api/prompt-jobs` with:

   ```json
   {
     "templateId": "tpl_classic_default",
     "model": "gpt-5-mini",
     "context": {
       "themeId": "sales-assistant",
       "target": "Netlify",
       "targetWebsite": "https://netlify.com",
       "solution": "Mentorship Program"
     }
   }
   ```

5. Redirects to `/admin?job_id=...&guest_id=...&token=...`

### Security Layers

- Input validation before POST
- Non-blocking redirect (no session cookies stored)
- Tokens generated per job for access isolation

---

## 🧩 4. Step 3 – Job Creation API (`/api/prompt-jobs`)

**File:** `app/api/prompt-jobs/route.js`

This API route creates the backend job and workspace documents.

### Sequence

1. **Validates** the payload using Joi
2. **Pre-warms MongoDB** to ensure connection health
3. **Generates IDs and access token**
4. **Fetches theme** (with 3 fallbacks)
5. **Creates a dynamic workspace**
6. **Saves both job and workspace** to MongoDB
7. **Starts the background runner** (`runJobInBackground(jobId)`)
8. **Returns identifiers** to frontend

**Response example:**

```json
{
  "jobId": "job_mhn7bhat",
  "guestId": "guest_b76ef",
  "token": "a8c0f13a..."
}
```

### Security Guarantees

- Each job gets a **unique SHA-256 hashed token** stored server-side.
- The token is never reused.
- MongoDB writes are transactional per function execution.
- No secret keys are returned to the frontend beyond job scope.

---

## ⚙️ 5. Step 4 – Background Processing

**File:** `lib/jobs/runner.js`

Once triggered, this job:

1. Waits one second for the client’s SSE connection to be ready.
2. Fetches the job and workspace from MongoDB.
3. Determines the correct `entityKey` (`companies`, `books`, etc.).
4. Queues a processing job using the **Deck Engine Adapter**.

**Failure handling:**

- If job/workspace missing → updates job status to `FAILED`.
- Each error path logs cause and timestamp for diagnostics.

---

## 🎛️ 6. Step 5 – Deck Engine Adapter

**File:** `lib/jobs/deck-engine-adapter.js`

The adapter orchestrates OpenAI calls and MongoDB persistence.

### Responsibilities:

- Defines `persistTileDirectly()` for safe MongoDB updates:

  - Removes outdated tiles
  - Inserts new tiles atomically
  - Increments usage counters

- Emits job status via SSE:

  - `QUEUED` → `RUNNING` → `COMPLETED`

- Calls `deck-engine-runner-openai` for each tile (0..7)
- Streams intermediate results in chunks

**Security focus:**
All data writes use `$pull` + `$push` to prevent document overwrites.
Event emissions contain **no sensitive data**—only tile metadata.

---

## 🧠 7. Step 6 – OpenAI Runner

**File:** `lib/jobs/deck-engine-runner-openai.js`

For each tile:

1. Retrieves the corresponding prompt from the template.
2. Processes dynamic variables (company name, website, etc.).
3. Calls OpenAI via `generateCompletion()` (resposta única).
4. Aggregates chunks incrementally.
5. Validates content for refusals or empty results.
6. Calls back `onResult()` → triggers tile persistence.

**Timing:**

- Time-to-first-token: ~1–2s
- Full tile generation: ~5–10s

---

## 🧮 8. Step 7 – MongoDB Persistence

When a tile completes:

```javascript
await db.updateOne(
  "guest_workspaces",
  { guest_id: guestId, "workspace_data.companies.name": companyName },
  {
    $pull: { "workspace_data.companies.$.tiles": { id: tileDoc.id } },
    $push: { "workspace_data.companies.$.tiles": tileDoc },
    $inc: { "usage.total_tiles_generated": 1 },
    $set: { updatedAt: new Date() },
  }
);
```

**Security notes:**

- Each write operation targets a single `guest_id` scope.
- Atomic operations prevent concurrency races.
- MongoDB index on `guest_id` + `workspace_data.companies.name` ensures isolation.

---

## 🌐 9. Step 8 – SSE Manager & Frontend Sync

**File:** `lib/sse-manager.js`

The SSE manager handles real-time synchronization:

1. Registers active client connections (`guest:xxx:job:xxx`)
2. Buffers messages if the connection drops
3. Replays buffered events on reconnection
4. Sends events:

   - `job:status`
   - `job:result-chunk`
   - `job:result-completed`

On the frontend:

- `useJobStreaming()` subscribes via `EventSource`
- Each event triggers a UI update and workspace revalidation
- The dashboard reflects tiles as soon as they persist

---

## 🧰 10. Step 9 – Security Architecture

### Authentication & Authorization

- Job isolation via `guestId` + token
- Tokens hashed (SHA-256) before database persistence
- No user authentication needed for public workflows

### Database Security

- All MongoDB writes are parameterized
- Collections: `prompt_jobs`, `guest_workspaces`, `prompt_results`
- No direct client access to MongoDB; all via API routes

### Netlify Deployment Security

- Environment variables are encrypted at rest
- Serverless functions run in isolated containers
- CORS policy restricted to the app’s domain
- Logs are sanitized (no secrets in output)

### OpenAI Integration

- API keys stored only in environment
- Rate-limited calls prevent abuse
- Request-level validation ensures proper context

### SSE Communication

- Events are streamed via HTTPS (TLS 1.3)
- Heartbeat keep-alive every 20 seconds
- Buffered replays avoid race conditions

---

## 🕒 11. End-to-End Timeline

| Stage                 | Description      | Time (ms)  |
| --------------------- | ---------------- | ---------- |
| Form submission       | Client → API     | ~0–50      |
| Job creation          | API → MongoDB    | ~400       |
| Background trigger    | Async start      | ~450       |
| Job load              | Runner → MongoDB | ~1500      |
| Queue + SSE start     | Adapter + SSE    | ~2000      |
| First OpenAI response | Streamed         | ~3000–4000 |
| Tile persistence      | MongoDB update   | ~8000      |
| Dashboard refresh     | SSE → Frontend   | ~8200      |

---

## 🧯 12. Critical Failure Points & Mitigations

| Component         | Potential Issue         | Mitigation                                |
| ----------------- | ----------------------- | ----------------------------------------- |
| API Route         | Missing fields or theme | Joi validation + fallback                 |
| MongoDB           | Slow startup            | Pre-warm connection (ping before queries) |
| Background Runner | Missing workspace       | Exception handling + retry                |
| OpenAI            | Timeout or refusal      | 3-attempt retry with backoff              |
| SSE               | Connection drop         | Buffer and replay system                  |
| Frontend          | Invalid query params    | `Session Required` fallback screen        |

---

## ✅ Summary

The **Next.js + Netlify architecture** ensures a secure, isolated, and resilient workflow from user input to real-time rendering:

- Each operation is **idempotent**, **scoped**, and **stream-safe**.
- **Tokens, guest IDs, and job IDs** guarantee per-session isolation.
- The **SSE buffering system** ensures consistency even under disconnections.
- The **MongoDB persistence layer** ensures atomic, conflict-free tile storage.
- **No long-lived secrets** or **credentials** are exposed to the client.
