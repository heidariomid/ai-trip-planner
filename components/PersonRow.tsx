import { Ellipsis } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { getRoleLabel, type MemberRole, type TripPerson } from "../lib/members";
import { colors, shadows } from "../lib/theme";
import { Avatar } from "./Avatar";
import { Text } from "./Text";

export interface PersonRowProps {
  person: TripPerson;
  /** True for the owner looking at a member: the row opens to change or remove them. */
  canManage: boolean;
  isOpen: boolean;
  /** True while a change to this person is being saved. */
  isBusy: boolean;
  onToggleOpen: () => void;
  onChangeRole: (role: MemberRole) => void;
  onRemove: () => void;
}

const ROLES: readonly MemberRole[] = ["viewer", "editor"];

/** One person on a trip: avatar, name, and role. The owner can open a member's row. */
export function PersonRow({
  person,
  canManage,
  isOpen,
  isBusy,
  onToggleOpen,
  onChangeRole,
  onRemove,
}: PersonRowProps) {
  return (
    <View style={shadows.soft} className="mb-3 rounded-2xl bg-surface px-4 py-3">
      <View className="flex-row items-center">
        <Avatar path={person.avatarPath} uri={person.avatarUrl} name={person.name} size={44} />
        <View className="ml-3 flex-1">
          <Text numberOfLines={1} className="text-[15px] font-medium leading-5 text-ink">
            {person.isYou ? `${person.name} (You)` : person.name}
          </Text>
          <Text className="mt-0.5 text-[13px] text-subtle">{getRoleLabel(person.role)}</Text>
        </View>
        {canManage ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Change or remove ${person.name}`}
            accessibilityState={{ expanded: isOpen }}
            onPress={onToggleOpen}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-canvas"
          >
            <Ellipsis size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {canManage && isOpen ? (
        <View className={`mt-3 flex-row flex-wrap items-center gap-2 ${isBusy ? "opacity-45" : ""}`}>
          {ROLES.map((role) => {
            const isSelected = person.role === role;
            return (
              <Pressable
                key={role}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected, disabled: isBusy }}
                disabled={isBusy || isSelected}
                onPress={() => onChangeRole(role)}
                className={`h-11 justify-center rounded-full px-4 ${
                  isSelected ? "bg-accent-soft" : "bg-canvas"
                }`}
              >
                <Text
                  className={`text-[14px] font-medium ${isSelected ? "text-accent" : "text-subtle"}`}
                >
                  {getRoleLabel(role)}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${person.name} from the trip`}
            disabled={isBusy}
            onPress={onRemove}
            className="ml-auto h-11 justify-center pl-3 active:opacity-60"
          >
            <Text className="text-[14px] font-medium text-ink">Remove</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
