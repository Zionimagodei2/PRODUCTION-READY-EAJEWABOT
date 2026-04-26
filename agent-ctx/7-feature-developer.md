# Task 7 - Feature Developer: Make scraped links/contacts clickable/visitable

## Summary
Made all scraped links, phone numbers, and addresses clickable in the Group Extractor and Lead Scraper pages.

## Changes Made

### group-extractor-page.tsx
- Added `Phone` and `MessageSquare` to lucide-react imports
- Made invite link text clickable (`<span>` → `<a>` with href, target="_blank")
- Added "Open in WhatsApp" button for each group invite link
- Made extracted contact phone numbers clickable with `tel:` protocol
- Added "Chat on WhatsApp" button for each extracted contact (opens `https://wa.me/{phone}`)
- Added "Call" button for each extracted contact (opens `tel:{phone}`)
- Added `flex-wrap` to action buttons container

### lead-scraper-page.tsx
- Made phone numbers clickable with `tel:` protocol
- Added "Chat on WhatsApp" button next to each phone number
- Added "Call" button next to each phone number
- Made addresses clickable with Google Maps link (`https://maps.google.com/?q={encodedAddress}`)
- Verified existing WhatsApp links and source links already working

## Lint Status
- All lint checks pass, zero errors
- Dev server compiles cleanly
