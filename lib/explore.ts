import type { Tables } from "../types/database.types";
import { addDays } from "./dates";
import { toReadableError } from "./errors";
import { getExploreImageFile } from "./explore-images";
import { supabase } from "./supabase";
import { sortActivities, type ItineraryDay } from "./trip-detail";
import { createTrip, type CreateTripResult } from "./trips";

type PlanColumns = Pick<
  Tables<"explore_plans">,
  "id" | "title" | "destination" | "description" | "rough_cost" | "tags" | "category" | "image_key"
>;

export type ExplorePlan = PlanColumns & {
  /** Counted from the plan's day rows, never stored. */
  dayCount: number;
  /** Counted from the plan's activity rows, never stored. */
  placeCount: number;
};

export type ExplorePlanDetail = PlanColumns & {
  /** In the shape a trip's days have, with no calendar date. */
  days: ItineraryDay[];
};

export interface ExplorePlansResult {
  success: boolean;
  data: ExplorePlan[];
  error: string | null;
}

export interface ExplorePlanResult {
  success: boolean;
  /** Null with `success` true means there is no such plan. */
  data: ExplorePlanDetail | null;
  error: string | null;
}

const LIST_FAILED = "We couldn't load the plans. Pull down to try again.";
const PLAN_FAILED = "We couldn't load this plan. Please try again.";

const PLAN_COLUMNS = "id, title, destination, description, rough_cost, tags, category, image_key";
const ACTIVITY_COLUMNS = "id, day_id, sort_order, starts_at, ends_at, place, activity, notes";

/** "Dubai, United Arab Emirates" as a place and the country after it. */
export function splitDestination(destination: string): { place: string; country: string } {
  const [place, ...rest] = destination.split(",");
  return { place: place.trim(), country: rest.join(",").trim() };
}

/** The last day of a copy: the start plus the day count, minus one. */
export function getCopyEndDate(startDate: string, dayCount: number): string {
  return addDays(startDate, Math.max(dayCount, 1) - 1);
}

/** Readable by any signed-in user. */
export async function listExplorePlans(): Promise<ExplorePlansResult> {
  try {
    const { data, error } = await supabase
      .from("explore_plans")
      .select(`${PLAN_COLUMNS}, explore_plan_days(explore_plan_activities(count))`)
      .order("sort_order", { ascending: true });

    if (error) {
      return { success: false, data: [], error: toReadableError("explore", error, LIST_FAILED) };
    }

    const plans = data.map(({ explore_plan_days, ...plan }) => ({
      ...plan,
      dayCount: explore_plan_days.length,
      placeCount: explore_plan_days.reduce(
        (total, day) => total + (day.explore_plan_activities[0]?.count ?? 0),
        0,
      ),
    }));
    return { success: true, data: plans, error: null };
  } catch (error) {
    return { success: false, data: [], error: toReadableError("explore", error, LIST_FAILED) };
  }
}

export async function getExplorePlan(planId: string): Promise<ExplorePlanResult> {
  try {
    const { data, error } = await supabase
      .from("explore_plans")
      .select(
        `${PLAN_COLUMNS}, explore_plan_days(id, day_number, explore_plan_activities(${ACTIVITY_COLUMNS}))`,
      )
      .eq("id", planId)
      .maybeSingle();

    if (error) {
      return { success: false, data: null, error: toReadableError("explore", error, PLAN_FAILED) };
    }
    if (!data) return { success: true, data: null, error: null };

    const { explore_plan_days, ...plan } = data;
    const days = explore_plan_days
      .map(({ explore_plan_activities, ...day }) => ({
        ...day,
        date: null,
        // A plan's activities cannot be ticked. The flag is only there so they
        // fit the shape a trip's activities have.
        activities: sortActivities(
          explore_plan_activities.map((activity) => ({ ...activity, is_done: false })),
        ),
      }))
      .sort((a, b) => a.day_number - b.day_number);

    return { success: true, data: { ...plan, days }, error: null };
  } catch (error) {
    return { success: false, data: null, error: toReadableError("explore", error, PLAN_FAILED) };
  }
}

/**
 * Copies a plan into a trip the traveller owns. One `create_trip` call writes
 * the trip, its days, and the plan's activities, so a copy is never half made.
 * The plan's picture is then uploaded into the traveller's own folder as the
 * trip's cover. The trip never points at the plan's file, so the cover can be
 * replaced or deleted like any other. If the upload fails the trip stays, with
 * no cover.
 */
export async function copyExplorePlan(
  userId: string,
  plan: ExplorePlanDetail,
  source: string,
  startDate: string,
): Promise<CreateTripResult> {
  const activities = plan.days.flatMap((day) =>
    day.activities.map((activity) => ({
      day_number: day.day_number,
      starts_at: activity.starts_at,
      ends_at: activity.ends_at,
      place: activity.place,
      activity: activity.activity,
      notes: activity.notes,
    })),
  );

  const cover = await getExploreImageFile(plan.image_key);

  return createTrip(userId, {
    title: plan.title,
    source,
    destination: plan.destination,
    startDate,
    endDate: getCopyEndDate(startDate, plan.days.length),
    description: plan.description ?? "",
    travelerCount: 1,
    cover,
    activities,
  });
}
