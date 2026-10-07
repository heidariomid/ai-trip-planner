export interface ExplorePlan {
  id: string;
  title: string;
  days: number;
  cost: string;
  places: number;
  tags: string[];
}

// Static until spec 6 seeds the real plans in the database.
export const EXPLORE_PLANS: ExplorePlan[] = [
  {
    id: "tokyo",
    title: "Explore Tokyo city in 5 days",
    days: 5,
    cost: "$1,000",
    places: 5,
    tags: ["Architecture", "Nature"],
  },
  {
    id: "kyoto",
    title: "Kyoto temples and tea in 3 days",
    days: 3,
    cost: "$650",
    places: 6,
    tags: ["Culture", "Food"],
  },
  {
    id: "alps",
    title: "The Swiss Alps by train in 7 days",
    days: 7,
    cost: "$2,400",
    places: 8,
    tags: ["Nature", "Scenic"],
  },
  {
    id: "lisbon",
    title: "Lisbon on foot in 4 days",
    days: 4,
    cost: "$800",
    places: 7,
    tags: ["Food", "History"],
  },
];
