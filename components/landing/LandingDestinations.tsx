import { MapPin } from "lucide-react-native";
import { Image, View, type ImageSourcePropType } from "react-native";

import { colors } from "../../lib/theme";
import { Text } from "../Text";
import { Container, SectionHeader } from "./LandingShared";
import { Reveal } from "./Reveal";

interface Destination {
  place: string;
  country: string;
  picture: ImageSourcePropType;
}

// The five curated plans the app ships with.
const DESTINATIONS: Destination[] = [
  {
    place: "Swiss Alps",
    country: "Switzerland",
    picture: require("../../assets/explore/alps.jpg"),
  },
  {
    place: "Dubai",
    country: "United Arab Emirates",
    picture: require("../../assets/explore/dubai.jpg"),
  },
  {
    place: "Chicago",
    country: "United States",
    picture: require("../../assets/explore/chicago.jpg"),
  },
  {
    place: "Los Angeles",
    country: "United States",
    picture: require("../../assets/explore/los-angeles.jpg"),
  },
  {
    place: "Lake Tahoe",
    country: "United States",
    picture: require("../../assets/explore/tahoe.jpg"),
  },
];

const FILL = { width: "100%", height: "100%" } as const;

/** The ready-made plans, as pictures. */
export function LandingDestinations() {
  return (
    <Container className="pt-24 lg:pt-36">
      <Reveal>
        <SectionHeader
          eyebrow="Explore"
          title="Or start from a plan that is already made."
          lead="Curated plans open day by day. Copy one, pick your dates, and it is your trip, ready to change."
        />
      </Reveal>

      <View className="mt-12 flex-row flex-wrap justify-between lg:mt-16 lg:flex-nowrap lg:gap-4">
        {DESTINATIONS.map((destination, index) => (
          <Reveal
            key={destination.place}
            delay={Math.min(index, 4) as 0 | 1 | 2 | 3 | 4}
            className={`mb-4 h-[220px] lg:mb-0 lg:h-[420px] lg:w-auto lg:flex-1 ${
              index === 0 ? "w-full" : "w-[48.2%]"
            }`}
          >
            <View className="lp-zoom lp-card flex-1 rounded-[28px] bg-ink">
              <View className="lp-zoom-picture absolute inset-0">
                <Image
                  source={destination.picture}
                  resizeMode="cover"
                  style={FILL}
                  accessibilityLabel={destination.place}
                />
              </View>
              <View className="lp-shade absolute inset-0" />
              <View className="absolute bottom-0 left-0 right-0 p-5">
                <Text className="text-[20px] font-semibold tracking-tight text-white">
                  {destination.place}
                </Text>
                <View className="mt-1 flex-row items-center">
                  <MapPin size={12} color={colors.surface} />
                  <Text numberOfLines={1} className="ml-1 flex-1 text-[13px] text-white/80">
                    {destination.country}
                  </Text>
                </View>
              </View>
            </View>
          </Reveal>
        ))}
      </View>
    </Container>
  );
}
