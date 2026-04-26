# Task 8: Fix WhatsApp connection crash - add error handling

## Agent: Error Handling Developer

## Summary
Fixed the WhatsApp connection modal to prevent browser crashes when the WA service is unavailable, and enhanced the API route with proper timeout handling and error messages.

## Files Modified
1. `/home/z/my-project/src/components/app/modals/wa-connection-modal.tsx` - Complete error handling overhaul
2. `/home/z/my-project/src/app/api/whatsapp/route.ts` - Timeout, error messages, health check

## Key Changes

### wa-connection-modal.tsx
- Added 'error' step type for dedicated error state
- 30-second connection timeout
- Max 20 polls (~60s) limit
- 3 consecutive error threshold stops polling
- AbortController for all fetch requests (cancellable on modal close)
- QR code canvas try/catch with fallback message
- Retry button with error recovery
- isMountedRef prevents setState on unmounted component
- Proper cleanup in useEffect (clears intervals, timeouts, aborts requests)

### api/whatsapp/route.ts
- 5-second timeout on all waFetch calls via AbortController
- HTTP status-specific error messages (401, 404, 429, 500, 503)
- Health check endpoint: GET /api/whatsapp?action=health
- Input validation for POST actions
- Better error messages referencing port 3003
- Proper TypeScript return type on waFetch

## Verification
- `bun run lint` passes with zero errors
- Dev server compiles cleanly
- No runtime errors
