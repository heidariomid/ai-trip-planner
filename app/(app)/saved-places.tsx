import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, Heart } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { FormMessage } from "../../components/FormMessage";
import { RoundButton } from "../../components/RoundButton";
import { Text } from "../../components/Text";
import { useContentWidth } from "../../hooks/useLayout";
import { useSavedPlaces } from "../../hooks/useSavedPlaces";
import { openInMaps } from "../../lib/maps";
import type { SavedPlace } from "../../lib/saved-places";
import { colors, shadows } from "../../lib/theme";

const CONTENT_STYLE = {
  width: "100%",
  maxWidth: 420,
  alignSelf: "center",
  paddingHorizontal: 20,
  paddingTop: 16,
  paddingBottom: 40,
} as const;

/** "Custard tarts since 1837 · Lisbon, Portugal", or whichever of the two there is. */
function describe(place: SavedPlace): string {
  return [place.label, place.city].filter(Boolean).join(" · ");
}

/** The places the traveller put a heart on in the chat, newest first. */
export default function SavedPlacesScreen() {
  const maxWidth = useContentWidth("reading");
  const router = useRouter();
  const { places, isLoading, error, refresh, toggle } = useSavedPlaces();
  const [removeError, setRemoveError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/profile");
  }

  async function remove(place: SavedPlace) {
    setRemoveError(null);
    setRemoveError(await toggle(place));
  }

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <FlatList
          data={places}
          keyExtractor={(place) => place.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ ...CONTENT_STYLE, maxWidth }}
          ListHeaderComponent={
            <View>
              <RoundButton icon={ArrowLeft} accessibilityLabel="Go back" onPress={close} />
              <Text className="mb-5 mt-5 text-[32px] font-bold leading-tight tracking-tight text-ink">
                Saved places
              </Text>
              <FormMessage message={removeError ?? error} />
            </View>
          }
          renderItem={({ item }) => {
            const detail = describe(item);
            return (
              <View
                style={shadows.soft}
                className="mb-3 flex-row items-center rounded-2xl bg-surface"
              >
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`Open ${item.name} in Maps`}
                  onPress={() => void openInMaps(item.name, item.city)}
                  className="min-h-[64px] flex-1 justify-center rounded-2xl py-3 pl-4 pr-2 active:bg-canvas"
                >
                  <Text numberOfLines={2} className="text-[15px] font-medium leading-5 text-ink">
                    {item.name}
                  </Text>
                  {detail ? (
                    <Text numberOfLines={2} className="mt-1 text-[13px] leading-[18px] text-subtle">
                      {detail}
                    </Text>
                  ) : null}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.name} from saved places`}
                  onPress={() => void remove(item)}
                  className="mr-1 h-11 w-11 items-center justify-center rounded-full active:bg-canvas"
                >
                  <Heart size={20} color={colors.heart} fill={colors.heart} />
                </Pressable>
              </View>
            );
          }}
          ListEmptyComponent={
            isLoading ? (
              <View className="py-10">
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : error ? null : (
              <EmptyState message="Nothing saved yet. Tap the heart on a place the assistant recommends and it will be kept here.">
                <Button label="Ask the assistant" onPress={() => router.push("/chat")} />
              </EmptyState>
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}
