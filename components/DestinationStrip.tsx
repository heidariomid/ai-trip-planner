import { FlatList, Image, type ImageSourcePropType } from "react-native";

const SCENES: ImageSourcePropType[] = [
  require("../assets/scenes/scene3.jpg"),
  require("../assets/scenes/scene1.jpeg"),
  require("../assets/scenes/scene6.jpg"),
  require("../assets/scenes/scene4.jpeg"),
  require("../assets/scenes/scene2.jpeg"),
  require("../assets/scenes/scene5.jpg"),
];

// A style object, not classes: on web a class does not override the intrinsic
// size of a bundled image.
const SCENE_SIZE = { width: 80, height: 104 };

/** Decorative destination art. It bleeds past the side padding of its screen. */
export function DestinationStrip() {
  return (
    <FlatList
      horizontal
      data={SCENES}
      keyExtractor={(_, index) => String(index)}
      showsHorizontalScrollIndicator={false}
      className="-mx-5"
      contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      renderItem={({ item }) => (
        <Image
          source={item}
          resizeMode="cover"
          style={SCENE_SIZE}
          className="rounded-2xl"
          accessible={false}
        />
      )}
    />
  );
}
