# Task 4b: Mock Data Eliminator - Inbox & Broadcasts

## Summary
Removed ALL hardcoded mock data from 3 feature pages and replaced with real API data fetching.

## Files Modified
1. `src/components/app/features/inbox-page.tsx` - Replaced mockConversations with /api/conversations fetch, grouping by contactId
2. `src/components/app/features/broadcast-lists-page.tsx` - Replaced mockLists with /api/contacts fetch, real contact selection, real campaign creation
3. `src/components/app/features/contact-groups-page.tsx` - Replaced mockGroups with dynamic tag-based grouping from real contacts

## Key Changes
- All 3 pages now have loading states (Loader2 spinner) and error states
- Inbox: conversations grouped by contactId, unread computed from direction='incoming'
- Broadcast Lists: contacts selected individually or by tag, Send creates real campaign
- Contact Groups: groups auto-generated from contact tags, smart segments computed from real data
- No Prisma schema changes, no new npm packages, no new API routes needed

## Lint Status
- All checks pass, zero errors
