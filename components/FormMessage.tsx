import { Text, View } from "react-native";

export interface FormMessageProps {
  message: string | null | undefined;
  tone?: "error" | "info";
}

const CONTAINER = {
  error: "border-red-200/80 bg-red-50/80",
  info: "border-amber-200/80 bg-amber-50/80",
} as const;

const TEXT = {
  error: "text-red-700",
  info: "text-amber-900",
} as const;

export function FormMessage({ message, tone = "error" }: FormMessageProps) {
  if (!message) return null;

  return (
    <View className={`mb-4 rounded-2xl border px-4 py-3 ${CONTAINER[tone]}`}>
      <Text className={`text-[13px] leading-5 ${TEXT[tone]}`}>{message}</Text>
    </View>
  );
}
