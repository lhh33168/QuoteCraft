import type { Metadata } from "next";
import { MealWheelPage } from "@/features/meal-wheel/components/meal-wheel-page";

export const metadata: Metadata = {
  title: "做饭清单 | QuoteCraft",
  description: "像点外卖一样挑选早中晚想做的菜，再统一查看买菜清单。"
};

export default function HomePage() {
  return <MealWheelPage />;
}
