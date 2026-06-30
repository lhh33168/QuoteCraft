import type { Metadata } from "next";
import { MealWheelPage } from "@/features/meal-wheel/components/meal-wheel-page";

export const metadata: Metadata = {
  title: "自己做饭 | QuoteCraft",
  description: "先决定早餐、午餐、晚餐做什么，再生成自己的买菜清单。"
};

export default function HomePage() {
  return <MealWheelPage />;
}
