# Oho Shawarma Dashboard

## Current State
All audit data (submissions and reports) is stored in browser `localStorage` via `store.ts`. This means audit records created on one device are invisible on any other device. The ICP backend canister exists but only stores user profiles and outlets — no audit data.

## Requested Changes (Diff)

### Add
- `submitAuditSubmission`, `getAllAuditSubmissions`, `getAuditSubmissionById`, `deleteAuditSubmission`, `deleteAuditSubmissionsByOutlet` methods to the Motoko backend canister
- `StoredAuditSubmission` type in Motoko: stores id, auditId, outletName, auditorId, auditorName, submittedAt, score (Nat), payload (JSON blob with full submission data)
- `StoredAuditSubmission` TypeScript type in `backend.d.ts`
- Async actor singleton helper in `store.ts` for canister calls

### Modify
- `store.ts`: all audit functions become async, delegating to the ICP canister instead of localStorage
  - `createAuditSubmission()` → serializes and calls `actor.submitAuditSubmission()`
  - `getAuditSubmissions()` → calls `actor.getAllAuditSubmissions()` and deserializes
  - `getAuditReports()` → derives AuditReport objects from backend submissions
  - `getMyAuditSubmissions(auditorId)` → fetches all, filters by auditorId client-side
  - `getAuditSubmissionById(id)` → calls `actor.getAuditSubmissionById(id)`
  - `getMaintenanceTrackerData()` → derives from backend submissions
  - `clearTestOutletData()` → calls `actor.deleteAuditSubmissionsByOutlet()`
  - Remove all localStorage keys for audits (AUDITS_KEY, SUBMISSIONS_KEY)
- Pages updated to use async loading patterns (useEffect + useState instead of sync initializers):
  - `AuditReportsPage.tsx`
  - `MyAuditReportsPage.tsx`
  - `AnalyticsPage.tsx`
  - `MaintenanceTrackerPage.tsx`
  - `AuditSummaryPage.tsx`

### Remove
- `localStorage.setItem/getItem` calls for `oho_audits` and `oho_audit_submissions` keys
- `initAudits()`, `initSubmissions()`, `saveAudits()`, `saveSubmissions()` localStorage helpers
- `StorageEvent` listener on `window` in AnalyticsPage (localStorage events no longer used)

## Implementation Plan
1. ✅ Update `main.mo` with audit storage methods (no auth check — app uses its own email/password auth)
2. Update `backend.d.ts` to add `StoredAuditSubmission` type and new canister methods to `backendInterface`
3. Rewrite audit functions in `store.ts` to be async and delegate to canister via `createActorWithConfig()`
4. Update each affected page to load data asynchronously with useEffect, show loading states, and refresh from backend after submission
5. Keep localStorage for users/outlets/session — do NOT change auth system
6. Keep IndexedDB for image blobs — do NOT change image handling
