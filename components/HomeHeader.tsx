import { View } from "react-native";

import { AskBar } from "./AskBar";
import { Avatar } from "./Avatar";
import { Text } from "./Text";

export interface HomeHeaderProps {
  name: string;
  avatarUrl: string | null | undefined;
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning,";
  if (hour < 18) return "Good afternoon,";
  return "Good evening,";
}

/** "Ada Lovelace" greets as "Ada". An email greets as the part before the @. */
function getFirstName(name: string): string {
  return name.trim().split(/[\s@]/)[0] || "Traveller";
}

/** The top of Home: the greeting, the avatar, and the AI planning card. */
export function HomeHeader({ name, avatarUrl }: HomeHeaderProps) {
  return (
    <View className="pb-2">
      <View className="mb-5 flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-[15px] text-subtle">{getGreeting(new Date().getHours())}</Text>
          <Text className="text-[32px] font-bold leading-tight tracking-tight text-ink">
            {getFirstName(name)} 👋
          </Text>
        </View>
        <Avatar uri={avatarUrl} name={name} />
      </View>

      <AskBar />
    </View>
  );
}
