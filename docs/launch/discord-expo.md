# Expo Discord

Post in `#showcase`. Do not drop the link in `#help` or a general channel.

## Message

Showcase: a trip planner on Expo SDK 57 that ships as a website, not a store binary.

One Router codebase. `npx expo export -p web` is what Vercel builds. On a phone you add it to the home screen and it opens full screen, with its own storage, separate from the browser tab.

The part that took the longest was Google sign-in. Native has to open the browser and come back through a custom scheme, because an `exp://` address with a LAN IP is rejected. Web has to redirect the whole page, because a popup opened after an `await` gets blocked. The same button, two paths.

The assistant streams from an Edge Function. Keys stay on the server. A tap is what saves a day into the trip.

https://plan-trip-ai.vercel.app/?ref=discord-expo

https://github.com/heidariomid/ai-trip-planner
