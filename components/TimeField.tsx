import { Clock } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";

import { buildTime, formatTime, parseTime } from "../lib/dates";
import { colors } from "../lib/theme";
import { Button } from "./Button";
import { Card } from "./Card";
import { Text } from "./Text";

export interface TimeFieldProps {
  label: string;
  /** `HH:MM`, or null when nothing is chosen. */
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string;
  /** Adds a way to clear the time again. */
  optional?: boolean;
  disabled?: boolean;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as const;
const PERIODS = ["AM", "PM"] as const;
const DEFAULT_TIME = "09:00";
const PER_ROW = 6;

interface OptionGridProps {
  options: readonly number[];
  selected: number;
  format: (option: number) => string;
  describe: (option: number) => string;
  onSelect: (option: number) => void;
}

function OptionGrid({ options, selected, format, describe, onSelect }: OptionGridProps) {
  const rows = [options.slice(0, PER_ROW), options.slice(PER_ROW)];

  return (
    <View>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row">
          {row.map((option) => {
            const isSelected = option === selected;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityLabel={describe(option)}
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelect(option)}
                className="h-11 flex-1 items-center justify-center"
              >
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full ${
                    isSelected ? "bg-accent" : ""
                  }`}
                >
                  <Text
                    className={`text-[15px] ${
                      isSelected ? "font-semibold text-white" : "text-ink"
                    }`}
                  >
                    {format(option)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

interface TimePickerProps {
  initial: string;
  optional: boolean;
  onDone: (value: string | null) => void;
}

function TimePicker({ initial, optional, onDone }: TimePickerProps) {
  const start = parseTime(initial);
  const [hour, setHour] = useState(start.hour % 12 === 0 ? 12 : start.hour % 12);
  // The picker steps by five minutes, so an odd minute snaps down to its step.
  const [minute, setMinute] = useState(start.minute - (start.minute % 5));
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(start.hour < 12 ? "AM" : "PM");

  const value = buildTime((hour % 12) + (period === "PM" ? 12 : 0), minute);

  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[20px] font-semibold tracking-tight text-ink">
          {formatTime(value)}
        </Text>
        <View className="flex-row rounded-full bg-canvas p-1">
          {PERIODS.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: item === period }}
              onPress={() => setPeriod(item)}
              className={`h-9 items-center justify-center rounded-full px-4 ${
                item === period ? "bg-surface" : ""
              }`}
            >
              <Text
                className={`text-[14px] font-medium ${
                  item === period ? "text-ink" : "text-subtle"
                }`}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text className="mb-1 text-[13px] text-subtle">Hour</Text>
      <OptionGrid
        options={HOURS}
        selected={hour}
        format={String}
        describe={(option) => `${option} o'clock`}
        onSelect={setHour}
      />

      <Text className="mb-1 mt-3 text-[13px] text-subtle">Minute</Text>
      <OptionGrid
        options={MINUTES}
        selected={minute}
        format={(option) => String(option).padStart(2, "0")}
        describe={(option) => `${option} minutes`}
        onSelect={setMinute}
      />

      <View className="mt-5 flex-row justify-end gap-3">
        {optional ? (
          <Button label="No time" variant="secondary" onPress={() => onDone(null)} />
        ) : null}
        <Button label="Done" onPress={() => onDone(value)} />
      </View>
    </View>
  );
}

/** A time shown like a filled input. Tapping it opens an hour and minute picker. */
export function TimeField({
  label,
  value,
  onChange,
  error,
  optional = false,
  disabled = false,
}: TimeFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const text = value ? formatTime(value) : optional ? "Optional" : "Choose";

  function handleDone(next: string | null) {
    onChange(next);
    setIsOpen(false);
  }

  return (
    <View className="mb-3.5 flex-1">
      <Text className="mb-1.5 ml-1 text-[13px] font-medium text-subtle">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value ? formatTime(value) : "not set"}`}
        disabled={disabled}
        onPress={() => setIsOpen(true)}
        className={`h-[50px] flex-row items-center justify-between rounded-2xl border bg-canvas px-4 outline-none ${
          error ? "border-red-300" : "border-canvas focus:border-accent"
        }`}
      >
        <Text className={`text-[16px] ${value ? "text-ink" : "text-muted"}`}>{text}</Text>
        <Clock size={18} color={colors.muted} />
      </Pressable>
      {error ? <Text className="ml-1 mt-1.5 text-[13px] text-red-600">{error}</Text> : null}

      {/* A modal, so the picker sits above the card and the keyboard, never behind them. */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 items-center justify-center px-5">
          <Pressable
            accessibilityLabel="Close the time picker"
            onPress={() => setIsOpen(false)}
            className="absolute bottom-0 left-0 right-0 top-0 bg-ink/40"
          />
          <View className="w-full max-w-[380px]">
            <Card>
              <TimePicker
                initial={value ?? DEFAULT_TIME}
                optional={optional}
                onDone={handleDone}
              />
            </Card>
          </View>
        </View>
      </Modal>
    </View>
  );
}
