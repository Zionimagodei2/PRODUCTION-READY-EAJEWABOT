# Task evo-6-7: Evolve Inbox and Send Message Pages

## Agent: main
## Status: COMPLETED

## Summary
Evolved the Inbox and Send Message pages from basic views to full-featured messaging center and message composer.

## Key Changes

### Database
- Added fields to Conversation model: contactPhone, status, isRead, isPinned, isArchived, mediaType, mediaUrl, readAt

### API
- Enhanced `/api/conversations` with search, filter, thread view, and bulk actions (mark-read, pin, archive)
- Created `/api/messages` for thread-specific operations (GET messages, POST new message)

### Inbox Page
- Real conversation data with grouped thread summaries
- Search by name, phone, or message content
- Filter tabs: All, Unread, Groups, Archived
- Thread view with WhatsApp-style chat bubbles and read receipts
- Quick actions: Reply, Mark read/unread, Pin, Archive
- Message input with send button and auto-scroll

### Send Message Page
- Template variables: {name}, {phone}, {company}, {date} with click-to-insert
- Media attachments: Image (thumbnail), Document (filename), Audio (waveform)
- WhatsApp phone mockup preview with real-time updates
- Recipient selection: Contacts (tag groups + individual picker), Groups, Manual phone numbers
- Scheduling: Send Now, Schedule (date/time), Repeat (daily/weekly/monthly)
- Character count with SMS segments, color indicators, and progress bar
- Green-themed consistent styling

## Files Modified
- prisma/schema.prisma
- prisma/seed.ts
- src/app/api/conversations/route.ts
- src/app/api/messages/route.ts (new)
- src/components/app/features/inbox-page.tsx
- src/components/app/features/send-message-page.tsx

## Verification
- Lint: 0 errors
- Dev server: Running on port 3000
