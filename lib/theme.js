// The one place colours and shadows are defined. tailwind.config.js reads this
// for `className`, and components import it for the few props that only take a
// raw value (ActivityIndicator colour, placeholder colour, shadow objects).
// CommonJS because tailwind.config.js has to `require` it.

const colors = {
  accent: "#0F766E",
  "accent-deep": "#0B5A53",
  "accent-soft": "#D9EFEB",
  ink: "#1A1C3D",
  subtle: "#74778F",
  muted: "#B7B9C9",
  canvas: "#F3F3F8",
  surface: "#FFFFFF",
  line: "#E8E8F0",
  // The two ends of the wash on the AI planning card. Used nowhere else.
  "sky-soft": "#E3F0FE",
  "peach-soft": "#FFEBDD",
  // A saved place's heart. Used nowhere else.
  heart: "#E5484D",
};

// Shadows are style objects: NativeWind has no utility that maps cleanly to
// both platforms.
const shadows = {
  card: {
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  soft: {
    shadowColor: colors.ink,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  accent: {
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};

module.exports = { colors, shadows };
