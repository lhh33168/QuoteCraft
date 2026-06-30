import type { Metadata } from "next";
import { MealWheelPage } from "@/features/meal-wheel/components/meal-wheel-page";

export const metadata: Metadata = {
  title: "转盘点餐 | QuoteCraft",
  description: "把早餐、午餐、晚餐候选填进去，转到哪个吃哪个。"
};

export default function HomePage() {
  return <MealWheelPage />;
}
