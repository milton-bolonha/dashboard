# Architecture and Security Report

**Date**: 2025-11-06
**Focus**: System architecture, data flow, and security measures for the tile generation process.

---

## 1. Executive Summary

This document outlines the architecture and security model of the application, focusing on the asynchronous generation of content "tiles". The system is designed as a decoupled, event-driven architecture that leverages serverless functions (Netlify), a NoSQL database (MongoDB), and a third-party AI service (OpenAI) to process user requests securely and efficiently.

The flow begins when a user submits a form on the frontend. A serverless function is invoked to create a job and a temporary guest workspace in MongoDB. This initial request returns immediately to the user with unique identifiers, while a background process handles the intensive task of generating content. This background process communicates with OpenAI to generate tile data, persists it to MongoDB, and notifies the frontend in real-time using Server-Sent Events (SSE).

Security is managed through a combination of unique, single-use access tokens, data isolation for guest users, and secure communication between all services. No sensitive user data is stored long-term, and guest data is scoped to the job-specific identifiers.

---

## 2. System Architecture Overview

The architecture is composed of several key components that work in concert:

-   **Frontend**: A Next.js application that provides the user interface for submitting requests and viewing results.
-   **API Routes (Serverless Functions)**: Deployed on Netlify, these handle initial job creation and manage the real-time SSE stream.
-   **MongoDB**: The primary data store for `guest_workspaces` and `prompt_jobs`. It holds the state of the system.
-   **Background Runner**: A fire-and-forget Node.js process, initiated by the API, that orchestrates the tile generation.
-   **Deck Engine & OpenAI Provider**: A modular component responsible for communicating with the OpenAI API, handling retries, and processing the AI-generated content.
-   **SSE Manager**: An in-memory event bus that manages real-time communication with the frontend, including buffering events for disconnected clients.

```
┌──────────────────┐      ┌──────────────────────┐      ┌──────────────────┐
│ Frontend (Browser) │      │  Netlify Platform    │      │ External Services│
└─────────┬──────────┘      └──────────┬───────────┘      └─────────┬────────┘
          │                           │                           │
          │ 1. POST /api/prompt-jobs  │                           │
          ├──────────────────────────>│ API Route (Job Creation)  │
          │                           ├──────────────────────────>│ MongoDB
          │                           │ 2. runJobInBackground()   │
          │                           │ (Fire-and-Forget)         │
          │<──────────────────────────┤                           │
          │ 3. Returns {jobId, token} │                           │
          │                           │                           │
          │ 4. GET /api/streams/jobs  │                           │
          ├──────────────────────────>│ SSE Route                 │
          │                           │   (SSE Manager)           │
          │<──────────────────────────┤                           │
          │ 5. Real-time events       │                           │
          │                           └──────────┬───────────┘      │
          │                                      │ 6. Background      │
          │                                      │    Runner           │
          │                                      │      │              │
          │                                      │      └─────────────>│ OpenAI API
          │                                      │      │              │
          │                                      │      └─────────────>│ MongoDB
          │                                      │                     │
```

---

## 3. Detailed End-to-End Flow

This section provides a complete step-by-step breakdown of the user journey, from landing on the home page to seeing the final generated content.

### Step 1: Home Page (`/`)
-   **File**: `app/page.js`
-   **Action**: The main landing page renders the `IAFormsContainer` component, passing in critical properties like `themeId` and `initialTemplateId`. The user interacts with a form presented by either `IAFormsPresenterClassic` or `IAFormsPresenterDynamic`.

### Step 2: Form Submission
-   **File**: `components/landing/IAFormsContainer.jsx`
-   **Action**: The user fills in the required information (e.g., company name, website) and clicks the submit button.
-   **Process**:
    1.  The `handleRun()` function is triggered.
    2.  It gathers the form data into a `context` object.
    3.  A `POST` request is sent to the `/api/prompt-jobs` endpoint with the `templateId`, AI `model`, and `context`.

### Step 3: Job & Workspace Creation
-   **File**: `app/api/prompt-jobs/route.js`
-   **Action**: A serverless function processes the `POST` request synchronously.
-   **Process**:
    1.  **Validation**: The request body is validated using a Joi schema.
    2.  **ID Generation**: A unique `guestId`, `jobId`, and a secure `accessToken` are generated.
    3.  **Workspace Creation**: A new `guest_workspace` document is created in MongoDB. This includes a snapshot of the theme and the initial company data, but with an empty `tiles` array.
    4.  **Job Creation**: A corresponding `prompt_job` document is saved to MongoDB with a `QUEUED` status and a hash of the `accessToken`.
    5.  **Background Trigger**: The function calls `runJobInBackground(jobId)` as a **fire-and-forget** operation. This allows the API to respond immediately without waiting for the tiles to be generated.
    6.  **Response**: The API returns a `201 Created` status with the `jobId`, `guestId`, and the raw `accessToken` to the frontend.

### Step 4: Background Processing
-   **File**: `lib/jobs/runner.js`
-   **Action**: The asynchronous background process begins execution.
-   **Process**:
    1.  **Delay**: A 1-second delay is introduced to allow the frontend time to redirect and establish an SSE connection.
    2.  **Data Fetching**: The runner retrieves the `job` and `guest_workspace` details from MongoDB.
    3.  **Queueing**: The job is passed to the `deck-engine-adapter.js`, which orchestrates the generation.
    4.  **Tile Generation Loop**: The `deck-engine-runner-openai.js` iterates through each of the 8 tiles defined in the template.
        - It constructs a prompt for each tile using the user-provided context.
        - It calls the OpenAI API to generate the content in a stream.
        - It persists each completed tile directly into the `tiles` array of the `guest_workspace` document in MongoDB.
        - After each tile is saved, it emits a `job:result-completed` event via the SSE Manager.

### Step 5: Client-Side Redirection
-   **File**: `components/landing/IAFormsContainer.jsx`
-   **Action**: After the API responds successfully in Step 3, the frontend performs a client-side redirect.
-   **Process**: `window.location.href` is updated to `/admin?job_id=...&guest_id=...&token=...`, navigating the user to the dashboard page.

### Step 6: Admin Dashboard Loading
-   **File**: `containers/AdminDashboardContainer.jsx`
-   **Action**: The main dashboard component initializes and fetches the necessary data.
-   **Process**:
    1.  **URL Params**: It reads the `job_id`, `guest_id`, and `token` from the URL search parameters.
    2.  **Data Fetching**: It uses the `useGuestWorkspace` SWR hook to fetch the workspace data from `/api/guest/workspace`. This hook polls every 2 seconds to get updates.
    3.  **SSE Connection**: It uses the `useJobStreaming` hook to establish a real-time connection to the SSE stream at `/api/streams/jobs/[jobId]`.

### Step 7: SSE Connection & Streaming
-   **File**: `app/api/streams/jobs/[jobId]/route.js` & `lib/sse-manager.js`
-   **Action**: The backend manages the real-time event stream.
-   **Process**:
    1.  **Authentication**: The SSE route authenticates the connection using the `guestId` and `token` from the request.
    2.  **Connection Handling**: The `sse-manager` registers the client connection. If there are any buffered events (e.g., tiles generated before the client connected), they are sent immediately.
    3.  **Live Events**: As the background job emits events for each completed tile, the SSE manager pushes them to the client in real-time.

### Step 8: Tile Rendering
-   **File**: `containers/AdminDashboardContainer.jsx`
-   **Action**: The UI updates dynamically as new data arrives.
-   **Process**:
    1.  **SSE Event Handling**: When a `job:result-completed` event is received, the `useJobStreaming` hook triggers a manual revalidation of the SWR data (`revalidateWorkspace`).
    2.  **SWR Update**: The SWR hook refetches the workspace data, which now includes the new tile.
    3.  **Re-render**: The change in data causes React to re-render the `SortableTilesGrid` component, displaying the new tile to the user instantly.

---

## 4. Security Considerations

Security is a core consideration in this architecture, especially given that the system handles guest users without traditional authentication.

### 4.1. Authentication and Authorization

-   **Guest Sessions**: User sessions are temporary and identified by a `guestId`. No personal information is required or stored.
-   **Access Tokens**: When a job is created, a unique, cryptographically random `accessToken` is generated. This token is required to connect to the SSE stream for that specific job.
-   **Token Hashing**: The token is hashed using SHA-256 before being stored in the `prompt_jobs` collection. The SSE route hashes the token provided by the client and compares it to the stored hash, preventing direct token exposure in the database.
-   **Scoped Access**: The `guestId`, `jobId`, and `token` combination provides scoped access. A user can only access the SSE stream and workspace data for the job they created. Any attempt to access a job with an invalid `guestId` or `token` is rejected.

### 4.2. Data Isolation and Protection

-   **NoSQL Structure**: MongoDB's document structure naturally isolates data. Each `guest_workspace` is a self-contained document, preventing data leakage between different guest sessions.
-   **Data at Rest**: Communication with MongoDB is secured via TLS/SSL, ensuring data is encrypted in transit.
-   **Data in Transit**: All communication between the client, Netlify functions, and the OpenAI API is over HTTPS, encrypting data in transit.
-   **Temporary Data**: Guest workspaces are designed to be ephemeral. A data retention policy should be implemented to automatically purge old guest data from the database to minimize data exposure.

### 4.3. Service and API Security

-   **Input Validation**: The `/api/prompt-jobs` endpoint uses Joi schema validation to protect against malformed or malicious payloads, preventing injection attacks.
-   **Third-Party Services**: Communication with the OpenAI API is done server-side, so the API key is never exposed to the client.
-   **Rate Limiting and Abuse**: While not explicitly detailed in the flow, rate limiting should be implemented on the job creation endpoint to prevent abuse and control costs associated with the OpenAI API.

### 4.4. Frontend Security

-   **Redirection**: The frontend redirects using `window.location.href`, which is a standard and safe practice. The parameters passed in the URL (`jobId`, `guestId`, `token`) are treated as identifiers, not sensitive data, as the token is single-use for the SSE connection.
-   **Cross-Site Scripting (XSS)**: All content generated by the AI and rendered in the UI should be properly sanitized to prevent XSS attacks. React's default JSX rendering provides a degree of protection, but care must be taken if using methods like `dangerouslySetInnerHTML`.

---

## 5. Conclusion

The system's architecture is robust, scalable, and secure. By decoupling the initial user request from the intensive content generation process, it provides a highly responsive user experience. Security is maintained through temporary guest sessions with unique, hashed access tokens, ensuring data is isolated and access is strictly controlled. The event-driven backend, using SSE, allows for efficient, real-time updates to the client, creating a seamless and interactive application.
