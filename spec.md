# Oho Shawarma Dashboard

## Current State
Full-stack audit management app with React frontend and Motoko backend. PWA support not yet added. Audit form has no refresh/navigation guard.

## Requested Changes (Diff)

### Add
- PWA manifest using the Oho Shawarma circular logo as the app icon (multiple sizes)
- Service worker registration for PWA installability
- Refresh/navigation guard on the audit form: if any field has been touched, intercept browser refresh/tab close with a custom modal showing "If you refresh, data will be lost" with Ok and Cancel buttons

### Modify
- `index.html` to reference the PWA manifest and theme color
- Audit form component to track dirty state and show warning dialog on refresh/unload attempt

### Remove
- Nothing

## Implementation Plan
1. Generate PWA icon sizes (192x192 and 512x512) from the existing Oho Shawarma logo
2. Create `public/manifest.json` with app name, icons, theme color (#361e14), background color
3. Register a minimal service worker in `public/sw.js`
4. Update `index.html` to link manifest and register SW
5. In the audit form component, track `isDirty` state (set to true on first field change, false after successful submit)
6. Use `beforeunload` event listener to intercept browser refresh
7. Show a custom in-app modal (not browser default) with message and Ok/Cancel buttons — Ok proceeds with reload, Cancel stays on page
