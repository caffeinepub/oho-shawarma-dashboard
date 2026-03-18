# Oho Shawarma Dashboard

## Current State
- Full-stack audit dashboard with Admin and Auditor roles
- Data stored in localStorage/IndexedDB (frontend-only)
- Brand CSS classes: `.btn-brand` (brown #361e14 bg, white text), `.icon-brand` (brown), `.th-brand` / `.tr-brand-header` (yellow bg, brown text for table headers in light mode)
- `AuditSubmission` interface has: id, auditId, outletId, outletName, auditorId, auditorName, sections, score, sectionScores, overallRemarks, auditorSignature, managerSignature, managerName, auditDate
- `AuditItem` interface has: id, label, value, remarks, followUpAction, imageBase64
- Fire extinguisher param is `food-handling-safety` section, index 4 (id: `food-handling-safety-item-4`)
- AuditReportsPage: "Audit Date" and "Score" th headers missing `th-brand` class
- UsersPage icons all use `icon-brand` class (same brown color for all)
- Buttons across dashboard use `btn-brand` (brown bg, white text)
- Login page: card with logo, shadow-lg, flat look

## Requested Changes (Diff)

### Add
- `fireExtinguisherExpiryDate` field to `AuditSubmission` interface in store.ts
- Date picker UI for the fire extinguisher parameter in StartAuditPage (only for that specific item)
- Auditor name displayed above the auditor signature pad in StartAuditPage
- "Expiry Dates" button in AuditReportsPage header area (admin only); clicking opens a modal/panel showing all audits with outlet name, parameter name "Fire extinguisher", expiry date
- Login page: warm gradient background, glowing card with box-shadow depth, brand accent border

### Modify
- `btn-brand` CSS class: change from brown (#361e14) background to brand yellow (#fdbc0c) background with brown (#361e14) text in light mode. Dark mode keeps standard neutral.
- All button elements using `btn-brand` will auto-update from CSS change
- Table headers in AuditReportsPage: add `th-brand` class to "Audit Date" and "Score" `<TableHead>` elements
- UsersPage action icons: per-icon color using inline style (not icon-brand class):
  - Key (KeyRound): flat green `#22c55e`
  - Pencil (edit): flat blue `#3b82f6`
  - Eraser: flat purple `#a855f7` 
  - Trash (Trash2): flat red `#ef4444`
  - Deactivate (PowerOff): flat dark gray `#6b7280`
- All text that is currently black in light mode across Dashboard, AuditReports, Outlets, Users pages → brand brown #361e14 (light mode only, not dark mode, not sidebar)
- Store the fireExtinguisherExpiryDate in the submission when creating audit

### Remove
- Nothing removed

## Implementation Plan
1. Update `index.css`: change `.btn-brand` to use `#fdbc0c` bg / `#361e14` text in light mode
2. Update `store.ts`: add `fireExtinguisherExpiryDate?: string` to `AuditSubmission` interface
3. Update `StartAuditPage.tsx`:
   - Add auditor name display above auditor signature pad (use session.name)
   - Add special date picker for fire extinguisher item (food-handling-safety-item-4) — stores expiry date in component state
   - Pass `fireExtinguisherExpiryDate` in the submission call
4. Update `AuditReportsPage.tsx`:
   - Add `th-brand` class to Audit Date and Score headers
   - Add "Expiry Dates" button in the action bar
   - Add modal showing outlet name, "Fire extinguisher", expiry date from all submissions that have the date set
5. Update `UsersPage.tsx`: replace icon-brand on action icons with per-icon inline style colors
6. Update `LoginPage.tsx`: add gradient background, deeper card shadow, glow effect, brand accent
7. Apply brand brown text to dashboard pages (light mode only) for any hardcoded black text classes
