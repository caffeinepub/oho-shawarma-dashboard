# Oho Shawarma Dashboard

## Current State
- Login page shows title "Internal Dashboard" as subtitle
- Sidebar has full logo and "Internal Dashboard" label
- Sidebar colors use ebony clay (#26282E equivalent in OKLCH)
- Primary buttons use yellow but different shade
- Dark mode toggle exists in header
- Dark mode preference not persisted on page load

## Requested Changes (Diff)

### Add
- Logo_small-1.png (50x50) in the sidebar top-left corner
- Dark mode toggle button in sidebar (already exists in header, ensure it's accessible)

### Modify
- Login page subtitle: "Internal Dashboard" → "Oho Shawarma Auditing Dashboard"
- Sidebar label: "Internal Dashboard" → "Auditing Dashboard"
- Sidebar logo: use Logo_small-1.png (50x50)
- Sidebar background: #361e14 (brown)
- Sidebar text: #ffffff (white)
- Sidebar hover: background #fdbc0c, text #361e14
- Primary buttons: #fdbc0c yellow, text #361e14 brown
- Load dark mode preference from localStorage on app init

### Remove
- Nothing removed

## Implementation Plan
1. Update index.css OKLCH tokens for sidebar and primary colors
2. Update LoginPage.tsx subtitle text
3. Update Layout.tsx sidebar logo (Logo_small-1.png), label text, persist/load dark mode from localStorage
