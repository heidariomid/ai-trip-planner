import { SpeedInsights } from "@vercel/speed-insights/react";
import { useSegments } from "expo-router";

// Vercel only groups speed metrics by route for frameworks it knows, so the
// route pattern is passed by hand: "/trip/[id]" for every trip, with the
// group folders such as "(app)" left out because they are not in the URL.
export function WebSpeedInsights() {
  const segments: string[] = useSegments();
  const route = `/${segments.filter((segment) => !segment.startsWith("(")).join("/")}`;

  return <SpeedInsights route={route} debug={false} />;
}
