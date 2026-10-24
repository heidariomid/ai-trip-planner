# r/expo

A release announcement with no build notes gets a cold reception here. Lead with the two paths.

## Title

Shipping an Expo Router app as a website, and the two Google sign-in paths that required

## Body

I have been building a trip planner on SDK 57 and Expo Router, and the public version is the web export on Vercel, added to a phone's home screen. There is no dev build and no store listing. Expo Go is how I still run it on a phone.

Two things from that setup:

Google sign-in cannot be the native Google module, because that module is not in Expo Go. It is the browser flow. On a phone, `skipBrowserRedirect` plus `openAuthSessionAsync`, and the redirect has to be a custom scheme. An `exp://` URL whose host is the LAN IP is rejected by GoTrue before the allow list is read, and the phone then tries to open localhost. On web, opening a popup after an `await` gets blocked, so web lets the page redirect and reads the session from the URL. One button, and the web path is skipped in the linking handler so the two do not race.

The other one is the landing page. The app scrolls inside a fixed `#root`, so a phone browser never tucks its bars. The landing page is portaled onto `document.body` so the page itself scrolls. A fixed full-width background made Safari paint the status-bar strip a solid colour, so the mesh scrolls with the page instead.

Happy to go into either one. The app, if you want the context:

https://plan-trip-ai.vercel.app/?ref=reddit-expo

https://github.com/heidariomid/ai-trip-planner
