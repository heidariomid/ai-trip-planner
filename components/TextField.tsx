import { forwardRef, useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";

import { hasPersian, isRightToLeft, RIGHT_TO_LEFT } from "../lib/persian";
import { colors } from "../lib/theme";
import { Text } from "./Text";

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  /** Quiet text on the right of the label, such as a character count. */
  hint?: string;
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
  function TextField({ label, error, hint, onFocus, onBlur, ...inputProps }, ref) {
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
        <View className="mb-1.5 ml-1 flex-row items-center justify-between">
          <Text className="text-[13px] font-medium text-subtle">{label}</Text>
          {hint ? <Text className="mr-1 text-[13px] text-muted">{hint}</Text> : null}
        </View>
        <TextInput
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          textAlignVertical={inputProps.multiline ? "top" : "center"}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          className={`rounded-2xl border px-4 ${
            hasPersian(inputProps.value) ? "font-fa-regular" : "font-regular"
          } text-[16px] text-ink caret-accent outline-none ${
            inputProps.multiline ? "h-24 py-3" : "h-[50px]"
          } ${borderFor(
            isFocused,
            Boolean(error),
          )}`}
          placeholderTextColor={colors.muted}
          {...inputProps}
          style={isRightToLeft(inputProps.value) ? [inputProps.style, RIGHT_TO_LEFT] : inputProps.style}
        />
        {error ? (
          <Text className="ml-1 mt-1.5 text-[13px] text-red-600">{error}</Text>
        ) : null}
      </View>
    );
  },
);
