import { ChevronDown } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { colors } from "../lib/theme";
import { AskBar } from "./AskBar";
import { Avatar } from "./Avatar";
import { Chip } from "./Chip";
import { DestinationStrip } from "./DestinationStrip";
import { Text } from "./Text";

export const HOME_TABS = ["My Plan", "Explore"] as const;
export type HomeTab = (typeof HOME_TABS)[number];

export const PLAN_FILTERS = ["All Plans", "Active"] as const;
export type PlanFilter = (typeof PLAN_FILTERS)[number];

export interface HomeHeaderProps {
  name: string;
  avatarUrl: string | null | undefined;
  tab: HomeTab;
  onTabChange: (tab: HomeTab) => void;
  planFilter: PlanFilter;
  onPlanFilterChange: (filter: PlanFilter) => void;
}

interface FilterControlProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** A quiet filter on the list, not a tab: text and a chevron, no capsule. */
function FilterControl({ label, selected, onPress }: FilterControlProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="h-11 flex-row items-center"
    >
      <Text
        className={`mr-1 text-[13px] font-medium ${selected ? "text-ink" : "text-muted"}`}
      >
        {label}
      </Text>
      <ChevronDown size={14} color={selected ? colors.ink : colors.muted} />
    </Pressable>
  );
}

export function HomeHeader({
  name,
  avatarUrl,
  tab,
  onTabChange,
  planFilter,
  onPlanFilterChange,
}: HomeHeaderProps) {
  return (
    <View className="pb-5">
      <View className="mb-6 flex-row items-start justify-between">
        <Text className="flex-1 pr-4 text-[32px] font-bold leading-tight tracking-tight text-ink">
          Let's plan your next adventure
        </Text>
        <Avatar uri={avatarUrl} name={name} />
      </View>

      <DestinationStrip />

      <View className="mt-6">
        <AskBar />
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <View className="flex-row gap-2">
          {HOME_TABS.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={item === tab}
              onPress={() => onTabChange(item)}
            />
          ))}
        </View>

        <View className="flex-row gap-3">
          {PLAN_FILTERS.map((item) => (
            <FilterControl
              key={item}
              label={item}
              selected={item === planFilter}
              onPress={() => onPlanFilterChange(item)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
