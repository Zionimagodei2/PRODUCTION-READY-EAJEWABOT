---
Task ID: 1
Agent: main
Task: Fix critical visual bugs and get preview rendering

Work Log:
- Read all critical files: framer-shim.tsx, floating-nav.tsx, header.tsx, page.tsx, feature-router.tsx, wa-connection-page.tsx, wa-connection-modal.tsx
- Identified root cause of site shaking: framer-shim was applying CSS transitions on mount, causing layout reflow
- Fixed framer-shim: Only apply CSS transitions after first user interaction (hover/tap), not on mount
- Fixed page.tsx: Removed AnimatePresence/motion wrappers around tab content that caused layout shifts
- Fixed feature-router.tsx: Removed AnimatePresence/motion wrappers around feature pages
- Fixed header.tsx: Removed framer-shim imports (AnimatePresence, motion), simplified to static rendering, decongested items
- Fixed floating-nav.tsx: Removed env(safe-area-inset-bottom) calc that could cause positioning issues, simplified positioning
- Fixed WA Connection: Already converted to independent full page (wa-connection-page.tsx) in previous rounds
- Fixed next.config.ts: Added `allowedDevOrigins: ["*.space-z.ai"]` to allow cross-origin requests from preview panel
- Cleared .next cache and restarted dev server multiple times
- Verified: GET / returns HTTP 200, no compilation errors, no cross-origin blocking

Stage Summary:
- Site shaking fix: Removed CSS transitions on mount from framer-shim (only apply after user interaction)
- FAB visibility: Simplified positioning to `bottom: 1.25rem; right: 1rem` without safe-area calculations
- Header decongestion: Removed AnimatePresence/motion, simplified layout, made connection pill compact
- WA Connection: Already an independent full page accessible via `setActiveFeature('wa-connection')`
- Preview fix: The main reason preview wasn't working was cross-origin blocking — Next.js 16 blocks `/_next/*` assets from different origins in dev mode. Fixed by adding `allowedDevOrigins: ["*.space-z.ai"]`
- Dev server: Compiles and serves correctly but exits when idle (needs keep-alive mechanism)
