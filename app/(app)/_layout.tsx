import { Stack } from "expo-router";
import { View } from "react-native";

import { Sidebar } from "../../components/Sidebar";
import { useIsWide } from "../../hooks/useLayout";
import { SavedPlacesProvider } from "../../hooks/useSavedPlaces";

export default function AppLayout() {
  const isWide = useIsWide();

  return (
    <SavedPlacesProvider>
      {/* The same tree at every width, so resizing a window keeps the stack. */}
      <View className="flex-1 flex-row bg-canvas">
        {isWide ? <Sidebar /> : null}
        <View className="flex-1">
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </View>
    </SavedPlacesProvider>
  );
}
