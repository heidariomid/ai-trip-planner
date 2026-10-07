import { useSafeAreaInsets } from "react-native-safe-area-context";

export const TAB_BAR_HEIGHT = 68;

const MIN_BOTTOM_INSET = 12;
const GAP_BELOW_BAR = 0;
const GAP_ABOVE_BAR = 12;

/** Distance from the bottom of the screen to the bottom of the floating bar. */
export function useTabBarOffset(): number {
  const { bottom } = useSafeAreaInsets();
  return Math.max(bottom, MIN_BOTTOM_INSET) + GAP_BELOW_BAR;
}

/** Bottom padding a tab's content needs so its last row clears the bar. */
export function useTabBarClearance(): number {
  return useTabBarOffset() + TAB_BAR_HEIGHT + GAP_ABOVE_BAR;
}
