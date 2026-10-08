import { View } from "react-native";

import { useCurrentHour } from "../hooks/useCurrentHour";
import { AskBar } from "./AskBar";
import { Avatar } from "./Avatar";
import { Text } from "./Text";

export interface HomeHeaderProps {
  name: string;
  avatarUrl: string | null | undefined;
  /** An uploaded avatar. Shown instead of `avatarUrl` when set. */
  avatarPath?: string | null;
}

const MORNING_STARTS = 5;
const AFTERNOON_STARTS = 12;
const EVENING_STARTS = 18;

/** From the phone's clock. Before 5 in the morning still counts as the evening. */
export function getGreeting(hour: number): string {
  if (hour >= MORNING_STARTS && hour < AFTERNOON_STARTS) return "Good morning,";
  if (hour >= AFTERNOON_STARTS && hour < EVENING_STARTS) return "Good afternoon,";
  return "Good evening,";
}

/** "Ada Lovelace" greets as "Ada". An email greets as the part before the @. */
function getFirstName(name: string): string {
  return name.trim().split(/[\s@]/)[0] || "Traveller";
}

/** The top of Home: the greeting, the avatar, and the AI planning card. */
export function HomeHeader({ name, avatarUrl, avatarPath }: HomeHeaderProps) {
  const hour = useCurrentHour();

  return (
    <View className="pb-2">
      <View className="mb-4 flex-row items-center justify-between">
        <Text numberOfLines={1} className="flex-1 pr-4 text-[22px] tracking-tight text-subtle">
          {getGreeting(hour)}{" "}
          <Text className="font-bold text-ink">{getFirstName(name)}</Text>
        </Text>
        <Avatar path={avatarPath} uri={avatarUrl} name={name} />
      </View>

      <AskBar />
    </View>
  );
}
