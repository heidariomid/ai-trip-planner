import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddButton } from "../../../components/AddButton";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { FormMessage } from "../../../components/FormMessage";
import { Text } from "../../../components/Text";
import { TripCard } from "../../../components/TripCard";
import { useTabBarClearance } from "../../../hooks/useTabBar";
import { useTrips } from "../../../hooks/useTrips";
import { colors } from "../../../lib/theme";

const ADD_BUTTON_CLEARANCE = 72;

export default function TripsScreen() {
  const router = useRouter();
  const { trips, isLoading, isRefreshing, error, refresh } = useTrips();
  const tabBarClearance = useTabBarClearance();
  const hasTrips = trips.length > 0;

  function openForm() {
    router.push("/create-trip");
  }

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <FlatList
          data={trips}
          keyExtractor={(trip) => trip.id}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={refresh}
          contentContainerStyle={{
            width: "100%",
            maxWidth: 420,
            alignSelf: "center",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: tabBarClearance + (hasTrips ? ADD_BUTTON_CLEARANCE : 0),
          }}
          ListHeaderComponent={
            <View>
              <Text className="mb-6 text-[32px] font-bold leading-tight tracking-tight text-ink">
                My Trips
              </Text>
              <FormMessage message={error} />
            </View>
          }
          renderItem={({ item }) => (
            <View className="mb-4">
              <TripCard trip={item} />
            </View>
          )}
          ListEmptyComponent={
            isLoading ? (
              <View className="py-10">
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : error ? null : (
              <EmptyState message="You have no trips yet. Create one and it will show up here.">
                <Button label="Create a trip" onPress={openForm} />
              </EmptyState>
            )
          }
        />

        {hasTrips ? (
          <View
            style={{ bottom: tabBarClearance, pointerEvents: "box-none" }}
            className="absolute left-0 right-0 items-center px-5"
          >
            <View className="w-full max-w-[380px] items-end">
              <AddButton accessibilityLabel="Create a trip" onPress={openForm} />
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}
