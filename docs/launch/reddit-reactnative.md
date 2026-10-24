# r/reactnative

Do not create a new post. The community forbids self-promotion, including promoting your own product. The weekly Show Your Work thread is where a project is allowed. Find the current one and comment there. If that thread is gone, skip this channel.

## Comment

Show your work: a trip planner in React Native and Expo, shipped as a website you add to the home screen.

The UI is Tailwind through NativeWind. One theme file is the source for every colour. `darkMode: "class"` is required on web, because the default `media` mode throws when the runtime tries to set a colour scheme. Fonts are a family per weight, since Outfit ships one file each, and the preset's `sans` name stays the system font if you reuse it.

The part I would redo with more care is scrolling. Signed-in screens scroll inside the root view. The marketing page has to scroll the document, or a phone browser keeps its bars and the page looks inset. Those are two different scroll owners in one app.

https://plan-trip-ai.vercel.app/?ref=reddit-reactnative

https://github.com/heidariomid/ai-trip-planner
