# Oho Shawarma Dashboard

## Current State
- Audit form submits with a generic error toast listing categories of missing items (e.g. "3 parameters unanswered") but does not name specific sections or parameters.
- PDF typography is uneven: Remarks/Follow-up labels are 11pt, parameter labels are 10pt, Compliance Score Summary header and table rows use mixed sizes.
- PDF section header fill colour is brand brown (#361e14) with brand yellow text.

## Requested Changes (Diff)

### Add
- Audit form: Track which specific parameters are missing when submit is attempted. Highlight each missing parameter row with a red border and light red background. Auto-expand accordion sections that contain missing items. Toast message lists each missing item as "[Section Name] > [Parameter Label]".
- Audit form: Clear the highlight on a parameter as soon as the auditor provides an answer.

### Modify
- PDF: Remarks label + content → 10pt (down from 11pt) to match parameter font size for visual balance.
- PDF: Follow-up Action label + content → 10pt (down from 11pt).
- PDF: Compliance Score Summary header row → 10pt bold (up from 9pt).
- PDF: Section scores table header row → 8pt bold (up from 7pt).
- PDF: Section scores table body rows → 8pt (up from 7.5pt).
- PDF: All section header fill colour changed from #361e14 (brand brown) to #26283B (Ebony Clay). Section header text remains white (#ffffff).

### Remove
- Nothing removed.

## Implementation Plan
1. **StartAuditPage.tsx**: Add `missingKeys` state (Set of `sectionId:itemId` strings). On submit attempt, populate set from unanswered items. Pass set down and apply red highlight styles to matching parameter rows. Add `openSections` state to force-expand sections with missing items by including their IDs in the Accordion `value`. Clear a key from the set when `updateItemValue` is called for that item. Update toast to list "Section > Parameter" for each missing item.
2. **pdf.ts**: Update all section header `setFillColor` calls to use `hexToRgb('#26283B')` and set text to white [255,255,255]. Update Remarks block font size to 10. Update Follow-up block font size to 10. Increase Score Summary header to 10pt, table headers to 8pt, table rows to 8pt.
