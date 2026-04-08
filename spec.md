# Oho Shawarma Dashboard

## Current State

- Audit images are stored only in browser IndexedDB; they are not accessible cross-device. The backend payload strips image data before sending to stay under the ICP 2MB limit.
- The audit form has an audit date picker that defaults to today but can be edited by the auditor. This user-entered date is used for all analytics (Audit Trend Over Time, reports filtering).
- `AuditSubmission` has an `auditDate` field (user input) and a `submittedAt` field (system ISO timestamp). Analytics currently prefer `auditDate` over `submittedAt`.
- The blob-storage Caffeine component is now selected and ready to be integrated.

## Requested Changes (Diff)

### Add
- Image upload via blob-storage component: compress each image to max 1000KB (JPEG, progressive quality reduction), upload async to blob storage, store the resulting URL in the audit item record.
- `imageUrl` field on `AuditItem` interface to hold the blob storage URL.
- Async upload indicator per image (e.g. spinner or "Uploading..." state while upload is in progress).
- On PDF generation: load images from `imageUrl` (fetch as base64 for jsPDF embedding) instead of `imageBase64` from IndexedDB.

### Modify
- `StartAuditPage`: Remove the audit date picker (the field with `auditDate` state, the date picker popup, and its validation rule). The `submittedAt` field will be set to `new Date().toISOString()` at submission time (already done).
- `createAuditSubmission` in `store.ts`: Remove `auditDate` from the submission payload. `submittedAt` is the sole date recorded.
- `AuditSubmission` interface: Remove `auditDate` field (or keep as optional for backward compat with old records).
- `getAuditReports` in `store.ts`: Replace `sub.auditDate || sub.submittedAt.slice(0,10)` with `sub.submittedAt.slice(0,10)` exclusively.
- `getMaintenanceTrackerData` in `store.ts`: Replace `s.auditDate || s.submittedAt` with `s.submittedAt` exclusively for the `auditDate` row.
- `AnalyticsPage`: Replace all `s.auditDate || s.submittedAt?.slice(0,10)` logic with `s.submittedAt?.slice(0,10)` only.
- `pdf.ts`: Remove the "Audit Date" line that renders `submission.auditDate`; replace with "Submitted" using `new Date(submission.submittedAt).toLocaleDateString("en-IN")`.
- Image handling in `StartAuditPage`: On image selection, compress to max 1000KB, then asynchronously upload to blob storage using `StorageClient`. Store the returned URL as `item.imageUrl`. Show a per-item upload indicator. Keep `imageBase64` for local preview only (do not send to backend).
- `serializeSubmission` in `store.ts`: Strip `imageBase64` (already done), but now include `imageUrl` in the serialized items so the URL persists in the backend payload.
- `pdf.ts`: When rendering images, if `item.imageUrl` exists, fetch it as a data URL and embed; fall back to `item.imageBase64` if available (for offline/local submissions).

### Remove
- Audit date picker UI from `StartAuditPage` (the date state, the date picker open state, the `<Popover>` date picker component, the calendar component, and the validation check for `auditDate`).
- All `auditDate`-based branching in analytics, reports, and maintenance tracker (keep only `submittedAt`).

## Implementation Plan

1. **Backend**: No Motoko changes needed — blob storage is handled by the Caffeine blob-storage component entirely client-side via `StorageClient`. The `AuditSubmission` payload already stores a JSON blob; adding `imageUrl` to items is transparent.

2. **store.ts**:
   - Remove `auditDate` from `AuditSubmission` interface (make optional `auditDate?: string` for backward compat).
   - Update `getAuditReports` to use `submittedAt` only.
   - Update `getMaintenanceTrackerData` to use `submittedAt` only.
   - Add `imageUrl?: string` to `AuditItem` interface.
   - Update `serializeSubmission` to keep `imageUrl` in items (currently strips nothing useful, but ensure `imageUrl` survives serialization).

3. **StartAuditPage.tsx**:
   - Remove `auditDate`, `datePickerOpen`, `selectedDate` state variables.
   - Remove audit date validation from submission handler.
   - Remove audit date picker JSX (the Popover/Calendar block after manager name).
   - Remove `auditDate` from `createAuditSubmission` call.
   - Add image upload flow: on file select, compress to max 1000KB using canvas (quality loop), call `StorageClient.putFile()` async, store returned URL in item via `updateItemImageUrl`. Show per-item upload spinner.
   - Keep local `imageBase64` preview only (not sent to backend).

4. **AnalyticsPage.tsx**: Replace `s.auditDate || s.submittedAt?.slice(0,10)` with `s.submittedAt?.slice(0,10)` in all date parsing.

5. **AuditReportsPage.tsx / MyAuditReportsPage.tsx**: Ensure date column uses `submittedAt` not `auditDate`.

6. **MaintenanceTrackerPage.tsx** / **store.ts**: Use `submittedAt` for the audit date column.

7. **pdf.ts**:
   - Change "Audit Date" label to "Submitted" and use `submittedAt`.
   - Image rendering: if `item.imageUrl` is set, fetch from URL and convert to base64 for jsPDF; fall back to `item.imageBase64` for local-only submissions.
