import { Platform, useWindowDimensions } from "react-native";

/** From this width a browser window gets the desktop layout. */
export const WIDE_MIN_WIDTH = 1024;

/**
 * A laptop or desktop browser. A phone, the web app on a home screen, and the
 * native app are never wide, so they keep the layout the app was drawn for.
 */
export function useIsWide(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= WIDE_MIN_WIDTH;
}

/** What a screen holds, which decides how wide it may grow on a desktop. */
export type ContentKind = "grid" | "reading" | "form";

const NARROW: Record<ContentKind, number> = { grid: 420, reading: 420, form: 380 };
const WIDE: Record<ContentKind, number> = { grid: 1040, reading: 720, form: 520 };

/** The width a screen's content is capped at. */
export function useContentWidth(kind: ContentKind): number {
  return useIsWide() ? WIDE[kind] : NARROW[kind];
}

// Two cards to a row, with the gap left between them. An odd last card keeps
// its width instead of stretching across the row.
export const GRID_ITEM_STYLE = { width: "49%" } as const;
export const GRID_ROW_STYLE = { justifyContent: "space-between" } as const;

/** Cards side by side in a list: two on a desktop, one everywhere else. */
export function useGridColumns(): number {
  return useIsWide() ? 2 : 1;
}
