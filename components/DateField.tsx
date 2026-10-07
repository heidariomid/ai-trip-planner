import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";

import { formatDate, formatMonth, fromISODate, toISODate, todayISO } from "../lib/dates";
import { colors } from "../lib/theme";
import { Card } from "./Card";
import { Text } from "./Text";

export interface DateFieldProps {
  label: string;
  /** `YYYY-MM-DD`. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const DAYS_PER_WEEK = 7;

/** The days of a month, padded with nulls so the first lands on its weekday. */
function buildWeeks(year: number, month: number): (string | null)[][] {
  const leading = new Date(year, month, 1).getDay();
  const dayCount = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: leading }, () => null);

  for (let day = 1; day <= dayCount; day += 1) {
    cells.push(toISODate(new Date(year, month, day)));
  }
  while (cells.length % DAYS_PER_WEEK !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += DAYS_PER_WEEK) {
    weeks.push(cells.slice(index, index + DAYS_PER_WEEK));
  }
  return weeks;
}

interface CalendarProps {
  value: string;
  onSelect: (value: string) => void;
}

function Calendar({ value, onSelect }: CalendarProps) {
  const selected = fromISODate(value);
  const [shown, setShown] = useState({
    year: selected.getFullYear(),
    month: selected.getMonth(),
  });
  const today = todayISO();

  function shiftMonth(by: number) {
    const next = new Date(shown.year, shown.month + by, 1);
    setShown({ year: next.getFullYear(), month: next.getMonth() });
  }

  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => shiftMonth(-1)}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-canvas"
        >
          <ChevronLeft size={20} color={colors.ink} />
        </Pressable>
        <Text className="text-[16px] font-semibold text-ink">
          {formatMonth(shown.year, shown.month)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => shiftMonth(1)}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-canvas"
        >
          <ChevronRight size={20} color={colors.ink} />
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAYS.map((day, index) => (
          <View key={index} className="h-8 flex-1 items-center justify-center">
            <Text className="text-[13px] text-subtle">{day}</Text>
          </View>
        ))}
      </View>

      {buildWeeks(shown.year, shown.month).map((week, weekIndex) => (
        <View key={weekIndex} className="flex-row">
          {week.map((day, dayIndex) => {
            if (!day) return <View key={dayIndex} className="h-11 flex-1" />;

            const isSelected = day === value;
            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityLabel={formatDate(day)}
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelect(day)}
                className="h-11 flex-1 items-center justify-center"
              >
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full ${
                    isSelected ? "bg-accent" : ""
                  }`}
                >
                  <Text
                    className={`text-[15px] ${
                      isSelected
                        ? "font-semibold text-white"
                        : day === today
                          ? "font-semibold text-accent"
                          : "text-ink"
                    }`}
                  >
                    {fromISODate(day).getDate()}
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

/** A date shown like a filled input. Tapping it opens a month calendar. */
export function DateField({ label, value, onChange, error, disabled = false }: DateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  function handleSelect(next: string) {
    onChange(next);
    setIsOpen(false);
  }

  return (
    <View className="mb-3.5 flex-1">
      <Text className="mb-1.5 ml-1 text-[13px] font-medium text-subtle">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${formatDate(value)}`}
        disabled={disabled}
        onPress={() => setIsOpen(true)}
        className={`h-[50px] flex-row items-center justify-between rounded-2xl border bg-canvas px-4 outline-none ${
          error ? "border-red-300" : "border-canvas focus:border-accent"
        }`}
      >
        <Text className="text-[16px] text-ink">{formatDate(value)}</Text>
        <CalendarDays size={18} color={colors.muted} />
      </Pressable>
      {error ? <Text className="ml-1 mt-1.5 text-[13px] text-red-600">{error}</Text> : null}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 items-center justify-center px-5">
          <Pressable
            accessibilityLabel="Close the calendar"
            onPress={() => setIsOpen(false)}
            className="absolute bottom-0 left-0 right-0 top-0 bg-ink/40"
          />
          <View className="w-full max-w-[380px]">
            <Card>
              <Calendar value={value} onSelect={handleSelect} />
            </Card>
          </View>
        </View>
      </Modal>
    </View>
  );
}
