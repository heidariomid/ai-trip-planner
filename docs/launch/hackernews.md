# Hacker News

Do not post this until you have decided about password reset (spec 18). If you launch without it, the first comment has to say so. It already does.

Rewrite every sentence yourself before you submit. Hacker News has asked people not to post text a model wrote or edited. This file is notes for that rewrite, not the text to paste.

Show HN wants something people can try. This app requires a free account, and there is no demo login. The landing page is the part they can see without one. Say that in the first line so nobody feels tricked. Do not ask anyone to upvote.

## Title

Show HN: AI Trip Planner – one sentence in, a day-by-day trip out

## First comment, after you rewrite it

I built this because I wanted a plan I could edit, not a chat transcript I had to copy out by hand.

You type where you are going. A Gemini model streams a reply and, at the end, a block of cards: the trip, each day with times, places, bookings, and a packing list. The function strips that block out of the text. The app saves a card only after a tap, with the signed-in user's token. The model has no write access.

The data is Postgres on Supabase. A trip is private to its owner. Sharing adds a member as a viewer or an editor, and row-level security is what enforces it. I checked that as three users in a transaction and rolled it back.

The public app is an Expo web export. You can add it to a phone's home screen. There is no store build. Google sign-in uses the browser, because the native Google module does not run in Expo Go.

Limits, said plainly: the chat and the cover pictures are on free shared allowances, so they can run out for everyone at once. Email confirmation is off, and a forgotten password cannot be recovered yet. There is no demo account. Signing up is free and does not ask for a card.

The landing page, which you can open without an account: https://plan-trip-ai.vercel.app/?ref=hackernews

Source: https://github.com/heidariomid/ai-trip-planner
