import { View } from "react-native";

import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Screen } from "../../../components/Screen";

export default function TripsScreen() {
  return (
    <Screen title="My Trips">
      <View className="flex-1 justify-center">
        <EmptyState message="You have no trips yet. Create one and it will show up here.">
          <Button label="Create a trip" onPress={() => undefined} disabled />
        </EmptyState>
      </View>
    </Screen>
  );
}
