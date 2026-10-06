import { ActivityIndicator, Pressable, Text, View } from "react-native";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
  /** Stretch to the container. Off by default — a centred capsule reads lighter. */
  fullWidth?: boolean;
}

const CONTAINER = {
  primary: "bg-accent active:bg-accent-deep",
  secondary: "border border-white/90 bg-[#FFFAF3]/80 active:bg-[#FFFAF3]",
} as const;

const LABEL = {
  primary: "text-white",
  secondary: "text-ink",
} as const;

const SHADOW = {
  primary: {
    shadowColor: "#C2410C",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  secondary: {
    shadowColor: "#5C3A24",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const isBlocked = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      disabled={isBlocked}
      onPress={onPress}
      style={SHADOW[variant]}
      className={`h-12 flex-row items-center justify-center rounded-full px-8 ${
        fullWidth ? "w-full" : "self-center"
      } ${CONTAINER[variant]} ${isBlocked ? "opacity-45" : ""}`}
    >
      {loading ? (
        <View className="mr-2">
          <ActivityIndicator
            size="small"
            color={variant === "primary" ? "#ffffff" : "#2B1A12"}
          />
        </View>
      ) : null}
      <Text className={`text-[16px] font-semibold tracking-tight ${LABEL[variant]}`}>
        {label}
      </Text>
    </Pressable>
  );
}
