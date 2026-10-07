import { Mic, Sparkles } from "lucide-react-native";
import { View } from "react-native";

import { colors, shadows } from "../lib/theme";
import { Text } from "./Text";

/**
 * Drawn, not wired. It is not an input, so there is nothing to submit; the
 * assistant arrives in spec 11.
 */
export function AskBar() {
  return (
    <View>
      <View
        style={shadows.soft}
        className="h-14 flex-row items-center rounded-full bg-surface px-5"
      >
        <Sparkles size={20} color={colors.ink} />
        <Text className="ml-3 flex-1 text-[15px] text-muted">Ask me here…</Text>
        <Mic size={20} color={colors.muted} />
      </View>
      <Text className="ml-1 mt-3 text-[13px] text-subtle">
        Type your dream destination and we'll handle the plan.
      </Text>
    </View>
  );
}
