import { Stack } from "expo-router";

import { SavedPlacesProvider } from "../../hooks/useSavedPlaces";

export default function AppLayout() {
  return (
    <SavedPlacesProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SavedPlacesProvider>
  );
}
