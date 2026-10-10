import { Analytics } from "@vercel/analytics/react";
import { usePathname, useSegments } from "expo-router";

// Vercel only groups page views by route for frameworks it knows, so the
// route pattern is passed by hand: "/trip/[id]" for every trip, with the
// group folders such as "(app)" left out because they are not in the URL.
export function WebAnalytics() {
  const path = usePathname();
  const segments: string[] = useSegments();
  const route = `/${segments.filter((segment) => !segment.startsWith("(")).join("/")}`;

  return <Analytics route={route} path={path} debug={false} />;
}
