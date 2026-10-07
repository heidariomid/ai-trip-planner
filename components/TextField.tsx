import { forwardRef, useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";

import { colors } from "../lib/theme";
import { Text } from "./Text";

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

// Taken from the props rather than named directly: React Native renamed these
// event types in 0.86.
type FocusHandler = NonNullable<TextInputProps["onFocus"]>;
type BlurHandler = NonNullable<TextInputProps["onBlur"]>;

function borderFor(isFocused: boolean, hasError: boolean) {
  if (hasError) return "border-red-300 bg-canvas";
  if (isFocused) return "border-accent bg-surface";
  return "border-canvas bg-canvas";
}

export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField({ label, error, onFocus, onBlur, ...inputProps }, ref) {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus: FocusHandler = (event) => {
      setIsFocused(true);
      onFocus?.(event);
    };

    const handleBlur: BlurHandler = (event) => {
      setIsFocused(false);
      onBlur?.(event);
    };

    return (
      <View className="mb-3.5">
        <Text className="mb-1.5 ml-1 text-[13px] font-medium text-subtle">
          {label}
        </Text>
        <TextInput
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`h-[50px] rounded-2xl border px-4 font-regular text-[16px] text-ink ${borderFor(
            isFocused,
            Boolean(error),
          )}`}
          placeholderTextColor={colors.muted}
          {...inputProps}
        />
        {error ? (
          <Text className="ml-1 mt-1.5 text-[13px] text-red-600">{error}</Text>
        ) : null}
      </View>
    );
  },
);
