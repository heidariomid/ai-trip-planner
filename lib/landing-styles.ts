import { Platform } from "react-native";

import { colors } from "./theme";

// The landing page is the one screen that only exists in a browser, so it may
// use what a native view cannot: a mesh of soft colour, glass, and motion.
// Those live here as plain CSS, written from the theme's tokens, and are added
// to the page once. Nothing in the app itself uses these classes.

const STYLE_ID = "landing-styles";
// `ink` as channels, for a shadow that needs its own opacity.
const INK = "26, 28, 61";
const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";

const CSS = `
.lp-mesh {
  background:
    radial-gradient(55% 45% at 8% 4%, ${colors["sky-soft"]} 0%, transparent 70%),
    radial-gradient(50% 42% at 96% 10%, ${colors["peach-soft"]} 0%, transparent 70%),
    radial-gradient(40% 36% at 55% 70%, ${colors["accent-soft"]} 0%, transparent 72%),
    ${colors.canvas};
}
.lp-wash {
  background: linear-gradient(135deg, ${colors["sky-soft"]} 0%, ${colors.surface} 48%, ${colors["peach-soft"]} 100%);
}
.lp-cloud {
  background:
    radial-gradient(70% 90% at 50% 0%, ${colors.surface} 0%, transparent 70%),
    linear-gradient(180deg, ${colors.surface} 0%, ${colors.canvas} 100%);
  box-shadow:
    0 1px 0 ${colors.surface} inset,
    0 0 0 1px ${colors.surface},
    0 50px 90px -40px rgba(${INK}, 0.22);
}
.lp-seal {
  box-shadow: 0 0 0 1px ${colors.line}, 0 16px 30px -12px rgba(${INK}, 0.28);
}
.lp-glass {
  background: rgba(255, 255, 255, 0.72);
  -webkit-backdrop-filter: saturate(160%) blur(18px);
  backdrop-filter: saturate(160%) blur(18px);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.8) inset, 0 10px 30px -12px rgba(${INK}, 0.18);
}
.lp-phone {
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.12) inset,
    0 70px 120px -40px rgba(${INK}, 0.45),
    0 30px 60px -30px rgba(${INK}, 0.35);
}
.lp-card {
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 24px 48px -24px rgba(${INK}, 0.16);
  transition: transform 0.45s ${EASE}, box-shadow 0.45s ${EASE};
}
.lp-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 40px 70px -30px rgba(${INK}, 0.28);
}
.lp-press {
  transition: transform 0.25s ${EASE}, box-shadow 0.25s ${EASE}, background-color 0.25s ${EASE};
}
.lp-press:hover { transform: translateY(-2px); }
.lp-press:active { transform: translateY(0) scale(0.98); }
.lp-link { transition: color 0.2s ease; }
.lp-link:hover { color: ${colors.ink}; }

.lp-reveal {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.9s ${EASE}, transform 0.9s ${EASE};
}
.lp-reveal.lp-in { opacity: 1; transform: none; }
.lp-d1 { transition-delay: 90ms; }
.lp-d2 { transition-delay: 180ms; }
.lp-d3 { transition-delay: 270ms; }
.lp-d4 { transition-delay: 360ms; }

@keyframes lp-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-14px); }
}
.lp-float { animation: lp-float 7s ease-in-out infinite; }
.lp-float-late { animation: lp-float 9s ease-in-out -3s infinite; }

@keyframes lp-pop {
  from { opacity: 0; transform: translateY(14px) scale(0.97); }
  to { opacity: 1; transform: none; }
}
.lp-pop { animation: lp-pop 0.5s ${EASE} both; }

@keyframes lp-dot {
  0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-3px); }
}
.lp-dot { animation: lp-dot 1.2s ease-in-out infinite; }
.lp-dot-2 { animation-delay: 0.15s; }
.lp-dot-3 { animation-delay: 0.3s; }

@keyframes lp-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.lp-marquee { width: max-content; animation: lp-marquee 42s linear infinite; }
.lp-marquee-mask {
  -webkit-mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
  mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
}

/* A section stops a little below the floating nav, not under it. */
.lp-anchor { scroll-margin-top: 24px; }

.lp-zoom { overflow: hidden; }
.lp-zoom .lp-zoom-picture { transition: transform 0.9s ${EASE}; }
.lp-zoom:hover .lp-zoom-picture { transform: scale(1.07); }
.lp-shade {
  background: linear-gradient(180deg, transparent 40%, rgba(${INK}, 0.72) 100%);
}

@media (prefers-reduced-motion: reduce) {
  .lp-reveal { opacity: 1; transform: none; transition: none; }
  .lp-float, .lp-float-late, .lp-marquee, .lp-pop, .lp-dot { animation: none; }
  .lp-card, .lp-press, .lp-zoom .lp-zoom-picture { transition: none; }
}
`;

/** Adds the landing page's CSS to the document, once. Does nothing off the web. */
export function ensureLandingStyles(): void {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}
