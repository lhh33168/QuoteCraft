"use client";

import { useDeferredValue, useEffect, useState } from "react";

type MealSlot = "breakfast" | "lunch" | "dinner";

type MealInputs = Record<MealSlot, string>;
type CartState = Record<string, number>;
type CheckedIngredients = Record<string, boolean>;
type CustomGroceryState = Record<string, number>;

type Dish = {
  id: string;
  slot: MealSlot;
  name: string;
  prepTime: string;
  difficulty: string;
  tag: string;
  description: string;
  ingredients: string[];
  cookNote: string;
};

const STORAGE_KEY = "quotecraft-home-cooking";

const mealConfig: Record<
  MealSlot,
  {
    label: string;
    subtitle: string;
    accent: string;
    accentSoft: string;
    heroTitle: string;
  }
> = {
  breakfast: {
    label: "早餐",
    subtitle: "简单快手，先把早上安排好",
    accent: "#ff7a59",
    accentSoft: "#fff1ea",
    heroTitle: "晨间备餐"
  },
  lunch: {
    label: "午餐",
    subtitle: "中午认真吃一顿",
    accent: "#18a058",
    accentSoft: "#e8f8ef",
    heroTitle: "今天主菜"
  },
  dinner: {
    label: "晚餐",
    subtitle: "晚上好好做饭",
    accent: "#2f6fed",
    accentSoft: "#edf3ff",
    heroTitle: "收工开做"
  }
};

const defaultInputs: MealInputs = {
  breakfast: ["豆浆油条", "小笼包", "煎蛋三明治", "皮蛋瘦肉粥", "牛肉面"].join("\n"),
  lunch: ["黄焖鸡米饭", "番茄牛腩饭", "猪脚饭", "麻辣烫", "寿司拼盘"].join("\n"),
  dinner: ["烤鱼", "火锅", "韩式拌饭", "炒粉", "轻食沙拉"].join("\n")
};

const dishTags = ["家常", "快手", "囤货友好", "一锅出", "高复购"];
const dishDescriptions = [
  "适合自己做，准备量不用太大。",
  "思路简单，买完菜就能开做。",
  "适合工作日，不想太折腾时做。",
  "配菜弹性大，冰箱里有什么就能改。"
];
const cookNotes = [
  "先把主料和配菜都洗切好，下锅时会轻松很多。",
  "这道菜适合一次多备一点，第二天热一下也能吃。",
  "如果今天赶时间，可以先把食材分装好再开火。",
  "口味可以边做边调，不用一次下太重。"
];

const keywordIngredientMap: Array<{ keyword: string; ingredients: string[] }> = [
  { keyword: "鸡", ingredients: ["鸡腿肉", "姜", "蒜"] },
  { keyword: "牛", ingredients: ["牛肉", "洋葱", "黑胡椒"] },
  { keyword: "鱼", ingredients: ["鱼", "姜", "葱"] },
  { keyword: "火锅", ingredients: ["火锅底料", "肥牛卷", "生菜"] },
  { keyword: "粥", ingredients: ["大米", "葱花", "鸡蛋"] },
  { keyword: "面", ingredients: ["挂面", "青菜", "鸡蛋"] },
  { keyword: "饭", ingredients: ["米饭", "鸡蛋", "青菜"] },
  { keyword: "三明治", ingredients: ["吐司", "鸡蛋", "生菜"] },
  { keyword: "沙拉", ingredients: ["生菜", "玉米", "沙拉汁"] },
  { keyword: "寿司", ingredients: ["寿司米", "海苔", "黄瓜"] },
  { keyword: "麻辣烫", ingredients: ["丸子", "豆皮", "青菜"] },
  { keyword: "炒粉", ingredients: ["米粉", "鸡蛋", "豆芽"] }
];

function parseMealOptions(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,，、]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function getDishIngredients(dishName: string) {
  const ingredients = new Set<string>();

  for (const entry of keywordIngredientMap) {
    if (dishName.includes(entry.keyword)) {
      for (const ingredient of entry.ingredients) {
        ingredients.add(ingredient);
      }
    }
  }

  if (ingredients.size === 0) {
    ["葱", "姜", "蒜", "青菜"].forEach((ingredient) => ingredients.add(ingredient));
  }

  return Array.from(ingredients);
}

function createDish(slot: MealSlot, name: string, index: number): Dish {
  return {
    id: `${slot}-${index}-${name}`,
    slot,
    name,
    prepTime: `${15 + index * 5} 分钟`,
    difficulty: index % 3 === 0 ? "简单" : index % 3 === 1 ? "普通" : "稍微费点工夫",
    tag: dishTags[(index + name.length) % dishTags.length],
    description: dishDescriptions[(index + name.length) % dishDescriptions.length],
    ingredients: getDishIngredients(name),
    cookNote: cookNotes[(index + name.length) % cookNotes.length]
  };
}

export function MealWheelPage() {
  const [mealInputs, setMealInputs] = useState<MealInputs>(defaultInputs);
  const [cart, setCart] = useState<CartState>({});
  const [checkedIngredients, setCheckedIngredients] = useState<CheckedIngredients>({});
  const [customGrocery, setCustomGrocery] = useState<CustomGroceryState>({});
  const [activeMeal, setActiveMeal] = useState<MealSlot>("lunch");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [isHydrated, setIsHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [detailDish, setDetailDish] = useState<Dish | null>(null);
  const [detailServings, setDetailServings] = useState(1);
  const [customIngredientInput, setCustomIngredientInput] = useState("");
  const modalOpen = cartOpen || detailDish !== null;

  useEffect(() => {
    try {
      const cachedValue = window.localStorage.getItem(STORAGE_KEY);

      if (cachedValue) {
        const parsed = JSON.parse(cachedValue) as Partial<{
          mealInputs: MealInputs;
          cart: CartState;
          checkedIngredients: CheckedIngredients;
          customGrocery: CustomGroceryState;
        }>;

        if (parsed.mealInputs) {
          setMealInputs({
            breakfast: typeof parsed.mealInputs.breakfast === "string" ? parsed.mealInputs.breakfast : defaultInputs.breakfast,
            lunch: typeof parsed.mealInputs.lunch === "string" ? parsed.mealInputs.lunch : defaultInputs.lunch,
            dinner: typeof parsed.mealInputs.dinner === "string" ? parsed.mealInputs.dinner : defaultInputs.dinner
          });
        }

        if (parsed.cart) {
          setCart(parsed.cart);
        }

        if (parsed.checkedIngredients) {
          setCheckedIngredients(parsed.checkedIngredients);
        }

        if (parsed.customGrocery) {
          setCustomGrocery(parsed.customGrocery);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        mealInputs,
        cart,
        checkedIngredients,
        customGrocery
      })
    );
  }, [cart, checkedIngredients, customGrocery, isHydrated, mealInputs]);

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    const previousBodyOverflow = window.document.body.style.overflow;
    const previousHtmlOverflow = window.document.documentElement.style.overflow;

    window.document.body.style.overflow = "hidden";
    window.document.documentElement.style.overflow = "hidden";

    return () => {
      window.document.body.style.overflow = previousBodyOverflow;
      window.document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [modalOpen]);

  const catalog = (Object.keys(mealConfig) as MealSlot[]).reduce<Record<MealSlot, Dish[]>>(
    (result, slot) => {
      result[slot] = parseMealOptions(mealInputs[slot]).map((item, index) => createDish(slot, item, index));
      return result;
    },
    {
      breakfast: [],
      lunch: [],
      dinner: []
    }
  );

  const allDishes = Object.values(catalog).flat();
  const activeConfig = mealConfig[activeMeal];
  const activeDishes = catalog[activeMeal].filter((dish) => !deferredSearch.trim() || dish.name.includes(deferredSearch.trim()));

  const cartItems = Object.entries(cart)
    .map(([dishId, count]) => {
      const dish = allDishes.find((item) => item.id === dishId);

      if (!dish || count <= 0) {
        return null;
      }

      return {
        dish,
        count
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const cartCount = cartItems.reduce((sum, item) => sum + item.count, 0);
  const distinctDishCount = cartItems.length;

  const selectedCountByMeal = (Object.keys(mealConfig) as MealSlot[]).reduce<Record<MealSlot, number>>(
    (result, slot) => {
      result[slot] = cartItems
        .filter((item) => item.dish.slot === slot)
        .reduce((sum, item) => sum + item.count, 0);
      return result;
    },
    {
      breakfast: 0,
      lunch: 0,
      dinner: 0
    }
  );

  const emptyMealSlots = (Object.keys(selectedCountByMeal) as MealSlot[]).filter((slot) => selectedCountByMeal[slot] === 0);

  const autoGroceryMap = new Map<string, number>();

  for (const item of cartItems) {
    for (const ingredient of item.dish.ingredients) {
      autoGroceryMap.set(ingredient, (autoGroceryMap.get(ingredient) ?? 0) + item.count);
    }
  }

  const groceryMap = new Map<string, number>(autoGroceryMap);

  for (const [name, count] of Object.entries(customGrocery)) {
    if (count > 0) {
      groceryMap.set(name, (groceryMap.get(name) ?? 0) + count);
    }
  }

  const groceryItems = Array.from(groceryMap.entries()).map(([name, count]) => ({
    name,
    count,
    autoCount: autoGroceryMap.get(name) ?? 0,
    customCount: customGrocery[name] ?? 0
  }));

  const checkedCount = groceryItems.filter((item) => checkedIngredients[item.name]).length;

  function updateMealInput(slot: MealSlot, value: string) {
    setMealInputs((current) => ({
      ...current,
      [slot]: value
    }));
  }

  function resetMealInput(slot: MealSlot) {
    updateMealInput(slot, defaultInputs[slot]);
  }

  function clearMealInput(slot: MealSlot) {
    updateMealInput(slot, "");
  }

  function changeCartCount(dishId: string, nextCount: number) {
    setCart((current) => {
      if (nextCount <= 0) {
        const nextCart = { ...current };
        delete nextCart[dishId];
        return nextCart;
      }

      return {
        ...current,
        [dishId]: nextCount
      };
    });
  }

  function clearCart() {
    setCart({});
    setCheckedIngredients({});
    setCustomGrocery({});
  }

  function toggleIngredient(name: string) {
    setCheckedIngredients((current) => ({
      ...current,
      [name]: !current[name]
    }));
  }

  function openDishDetail(dish: Dish) {
    setDetailDish(dish);
    setDetailServings(1);
  }

  function addDishFromDetail() {
    if (!detailDish) {
      return;
    }

    changeCartCount(detailDish.id, (cart[detailDish.id] ?? 0) + detailServings);
  }

  function addCustomIngredient() {
    const name = customIngredientInput.trim();

    if (!name) {
      return;
    }

    setCustomGrocery((current) => ({
      ...current,
      [name]: (current[name] ?? 0) + 1
    }));
    setCustomIngredientInput("");
  }

  function changeCustomGroceryCount(name: string, nextCount: number) {
    setCustomGrocery((current) => {
      if (nextCount <= 0) {
        const nextState = { ...current };
        delete nextState[name];
        return nextState;
      }

      return {
        ...current,
        [name]: nextCount
      };
    });
  }

  return (
    <>
      <main className="min-h-screen px-3 py-4 pb-32 sm:px-5 sm:pb-36 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#f7c27b_0%,#ef8f5a_35%,#f6d9a2_100%)] text-white shadow-[0_26px_80px_rgba(227,124,66,0.24)]">
            <div className="px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/18 px-3 py-1 text-xs font-semibold tracking-[0.18em] backdrop-blur">
                    <span>自己做饭</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                    <span>外卖平台交互版</span>
                  </div>
                  <h1 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">像点外卖一样选菜，然后自己去买菜做饭</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/84 sm:text-base">
                    左边切早中晚分类，中间先看菜品详情再加入清单，底部和右下角都能打开一个购物车风格的清单弹窗。
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <SummaryCard label="已选菜品" value={`${distinctDishCount} 道`} />
                  <SummaryCard label="计划份数" value={`${cartCount} 份`} />
                  <SummaryCard label="采购进度" value={groceryItems.length > 0 ? `${checkedCount}/${groceryItems.length}` : "还没生成"} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <label className="flex min-h-14 items-center gap-3 rounded-[22px] bg-white px-4 text-ink shadow-[0_14px_30px_rgba(130,48,10,0.08)]">
                  <span className="text-lg">搜</span>
                  <input
                    className="w-full border-0 bg-transparent outline-none"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="搜今天想做的菜，比如牛肉面、火锅、黄焖鸡"
                    value={search}
                  />
                </label>

                <div className="rounded-[22px] bg-white/18 px-4 py-3 text-sm text-white/92 backdrop-blur">
                  {emptyMealSlots.length > 0
                    ? `还差 ${emptyMealSlots.length} 个餐段没安排：${emptyMealSlots.map((slot) => mealConfig[slot].label).join("、")}`
                    : "今天三餐都已经安排上了，可以开始按清单买菜。"}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_320px]">
            <aside className="rounded-[32px] border border-black/5 bg-white/90 p-3 shadow-soft backdrop-blur sm:p-4 lg:sticky lg:top-4 lg:self-start">
              <div className="px-2 pb-3 pt-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">分类</p>
                <h2 className="mt-2 text-xl font-semibold text-ink">早中晚菜单</h2>
              </div>

              <div className="space-y-2">
                {(Object.keys(mealConfig) as MealSlot[]).map((slot) => {
                  const config = mealConfig[slot];
                  const isActive = slot === activeMeal;

                  return (
                    <button
                      className={`w-full rounded-[24px] px-4 py-4 text-left transition ${
                        isActive
                          ? "text-white shadow-[0_18px_36px_rgba(21,33,29,0.14)]"
                          : "bg-[#fafaf6] text-ink hover:bg-[#f5f6f1]"
                      }`}
                      key={slot}
                      onClick={() => setActiveMeal(slot)}
                      style={isActive ? { background: `linear-gradient(135deg, ${config.accent} 0%, #15211d 100%)` } : undefined}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className={`text-base font-semibold ${isActive ? "text-white" : "text-ink"}`}>{config.label}</p>
                          <p className={`mt-1 text-xs ${isActive ? "text-white/72" : "text-muted"}`}>{config.heroTitle}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isActive ? "bg-white/14 text-white" : "bg-black/[0.05] text-muted"}`}>
                          {selectedCountByMeal[slot]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="rounded-[32px] border border-black/5 bg-white/90 p-4 shadow-soft backdrop-blur sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">菜品列表</p>
                  <h2 className="mt-2 text-2xl font-semibold text-ink">{activeConfig.label}想做什么</h2>
                </div>
                <div className="rounded-[24px] px-4 py-3 text-sm text-ink" style={{ backgroundColor: activeConfig.accentSoft }}>
                  <span className="font-semibold">{activeConfig.heroTitle}</span>
                  <span className="ml-2 text-muted">{activeConfig.subtitle}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                {activeDishes.length > 0 ? (
                  activeDishes.map((dish) => {
                    const count = cart[dish.id] ?? 0;

                    return (
                      <article
                        className="rounded-[28px] border border-black/6 bg-[linear-gradient(180deg,#fffdfa_0%,#f9fbf9_100%)] p-4 shadow-[0_14px_30px_rgba(20,35,30,0.06)]"
                        key={dish.id}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <button className="min-w-0 flex-1 text-left" onClick={() => openDishDetail(dish)} type="button">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-semibold text-ink">{dish.name}</h3>
                              <span
                                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                                style={{ backgroundColor: activeConfig.accentSoft, color: activeConfig.accent }}
                              >
                                {dish.tag}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-7 text-muted">{dish.description}</p>
                            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted">
                              <span>准备 {dish.prepTime}</span>
                              <span>难度 {dish.difficulty}</span>
                              <span>点开看详情</span>
                            </div>
                          </button>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              className="rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-semibold text-ink"
                              onClick={() => openDishDetail(dish)}
                              type="button"
                            >
                              查看详情
                            </button>

                            {count > 0 ? (
                              <div className="flex items-center gap-3 rounded-full bg-ink px-3 py-2 text-white">
                                <button className="text-lg" onClick={() => changeCartCount(dish.id, count - 1)} type="button">
                                  -
                                </button>
                                <span className="min-w-8 text-center text-sm font-semibold">{count} 份</span>
                                <button className="text-lg" onClick={() => changeCartCount(dish.id, count + 1)} type="button">
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                className="rounded-full px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(21,33,29,0.14)]"
                                onClick={() => changeCartCount(dish.id, 1)}
                                style={{ backgroundColor: activeConfig.accent }}
                                type="button"
                              >
                                加入清单
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-[28px] border border-dashed border-black/10 bg-[#fafaf6] px-4 py-12 text-center text-sm text-muted">
                    这个分类下没搜到匹配菜品，换个关键词试试。
                  </div>
                )}
              </div>
            </section>

            <section className="hidden rounded-[32px] border border-black/5 bg-white/92 p-4 shadow-soft backdrop-blur xl:block xl:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">菜单维护</p>
                  <h2 className="mt-2 text-2xl font-semibold text-ink">自己常做的菜</h2>
                </div>
                <button
                  className="rounded-full bg-black/[0.05] px-4 py-2 text-sm font-semibold text-ink"
                  onClick={() => resetMealInput(activeMeal)}
                  type="button"
                >
                  恢复当前分类
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {(Object.keys(mealConfig) as MealSlot[]).map((slot) => {
                  const config = mealConfig[slot];

                  return (
                    <section
                      className="rounded-[24px] border border-black/6 bg-[#fcfcfa] p-4"
                      key={slot}
                      style={slot === activeMeal ? { boxShadow: `0 0 0 2px ${config.accentSoft} inset` } : undefined}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">{config.label}</p>
                          <p className="mt-1 text-xs text-muted">{config.subtitle}</p>
                        </div>
                        <button
                          className="rounded-full bg-black/[0.05] px-3 py-1.5 text-xs font-semibold text-ink"
                          onClick={() => clearMealInput(slot)}
                          type="button"
                        >
                          清空
                        </button>
                      </div>

                      <textarea
                        className="mt-3 min-h-[100px] w-full resize-y rounded-[18px] border border-black/8 bg-white px-3 py-2.5 text-sm leading-7 text-ink outline-none transition placeholder:text-[#8a978f] focus:border-transparent focus:ring-2 focus:ring-pine/20"
                        onChange={(event) => updateMealInput(slot, event.target.value)}
                        placeholder={`例如：${slot === "breakfast" ? "豆浆油条" : slot === "lunch" ? "黄焖鸡米饭" : "烤鱼"}`}
                        value={mealInputs[slot]}
                      />
                    </section>
                  );
                })}
              </div>
            </section>
          </section>
        </div>
      </main>

      <button
        className="fixed bottom-28 right-4 z-30 hidden h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#15211d_0%,#2f6fed_100%)] text-white shadow-[0_20px_40px_rgba(21,33,29,0.3)] lg:flex"
        onClick={() => setCartOpen(true)}
        type="button"
      >
        <span className="text-center text-xs font-semibold leading-5">
          清单
          <br />
          {cartCount}
        </span>
      </button>

      <div className="app-safe-bottom fixed bottom-0 left-0 right-0 z-30 px-3 pb-3">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-[26px] bg-[#15211d] px-4 py-3 text-white shadow-[0_20px_40px_rgba(21,33,29,0.3)]">
          <div>
            <p className="text-xs text-white/64">已加入 {distinctDishCount} 道菜 · 共 {cartCount} 份</p>
            <p className="mt-1 text-lg font-semibold">
              {emptyMealSlots.length > 0 ? `还差 ${emptyMealSlots.length} 个餐段没安排` : `待买 ${groceryItems.length} 样食材`}
            </p>
          </div>
          <button
            className="rounded-full bg-[#ffb764] px-5 py-3 text-sm font-semibold text-[#15211d] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={cartItems.length === 0}
            onClick={() => setCartOpen(true)}
            type="button"
          >
            查看清单
          </button>
        </div>
      </div>

      {detailDish ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-3 pb-3 pt-10 sm:items-center sm:px-6 sm:py-6">
          <button aria-label="关闭菜品详情" className="absolute inset-0" onClick={() => setDetailDish(null)} type="button" />
          <section className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[32px] bg-white shadow-[0_30px_80px_rgba(12,18,15,0.28)]">
            <div
              className="px-5 py-5 text-white sm:px-6"
              style={{ background: `linear-gradient(135deg, ${mealConfig[detailDish.slot].accent} 0%, #15211d 100%)` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/72">{mealConfig[detailDish.slot].label}</p>
                  <h2 className="mt-2 text-3xl font-semibold">{detailDish.name}</h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/82">{detailDish.description}</p>
                </div>
                <button
                  className="rounded-full bg-white/14 px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => setDetailDish(null)}
                  type="button"
                >
                  关闭
                </button>
              </div>
            </div>

            <div className="grid gap-0 sm:grid-cols-[1.05fr_0.95fr]">
              <div className="border-b border-black/6 px-5 py-5 sm:border-b-0 sm:border-r sm:px-6">
                <div className="flex flex-wrap gap-2">
                  <DetailBadge label={detailDish.tag} tone="dark" />
                  <DetailBadge label={`准备 ${detailDish.prepTime}`} />
                  <DetailBadge label={`难度 ${detailDish.difficulty}`} />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-ink">要买这些</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detailDish.ingredients.map((ingredient) => (
                    <span className="rounded-full bg-black/[0.05] px-3 py-1.5 text-sm font-medium text-ink" key={ingredient}>
                      {ingredient}
                    </span>
                  ))}
                </div>

                <h3 className="mt-5 text-lg font-semibold text-ink">做饭提醒</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{detailDish.cookNote}</p>
              </div>

              <div className="px-5 py-5 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">当前状态</p>
                <div className="mt-3 rounded-[24px] bg-[linear-gradient(180deg,#fff9ef_0%,#fffdf8_100%)] p-4">
                  <p className="text-sm text-muted">已加入清单</p>
                  <p className="mt-2 text-3xl font-semibold text-ink">{cart[detailDish.id] ?? 0} 份</p>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-semibold text-ink">这次加入几份</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[1, 2, 3].map((serving) => (
                      <button
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          detailServings === serving ? "bg-ink text-white" : "bg-black/[0.05] text-ink"
                        }`}
                        key={serving}
                        onClick={() => setDetailServings(serving)}
                        type="button"
                      >
                        {serving} 人份
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-full bg-ink px-3 py-3 text-white">
                  <button
                    className="text-lg disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={(cart[detailDish.id] ?? 0) <= 0}
                    onClick={() => changeCartCount(detailDish.id, (cart[detailDish.id] ?? 0) - 1)}
                    type="button"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold">{cart[detailDish.id] ?? 0} 份</span>
                  <button className="text-lg" onClick={addDishFromDetail} type="button">
                    +
                  </button>
                </div>

                <button
                  className="mt-4 inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#15211d_0%,#2f6fed_100%)] px-5 text-base font-semibold text-white shadow-[0_18px_32px_rgba(21,33,29,0.18)]"
                  onClick={() => {
                    addDishFromDetail();
                    setCartOpen(true);
                  }}
                  type="button"
                >
                  加 {detailServings} 份并查看购物车
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {cartOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-3 pb-3 pt-10 sm:items-center sm:px-6 sm:py-6">
          <button aria-label="关闭清单弹窗" className="absolute inset-0" onClick={() => setCartOpen(false)} type="button" />
          <section className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_30px_80px_rgba(12,18,15,0.28)]">
            <div className="border-b border-black/6 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">购物车弹窗</p>
                  <h2 className="mt-2 text-2xl font-semibold text-ink">今天做饭清单</h2>
                  <p className="mt-2 text-sm text-muted">像外卖平台一样集中看已选菜品，但这里是给自己买菜做饭用的。</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-full bg-black/[0.05] px-4 py-2 text-sm font-semibold text-ink"
                    onClick={clearCart}
                    type="button"
                  >
                    清空
                  </button>
                  <button
                    className="rounded-full bg-black/[0.05] px-4 py-2 text-sm font-semibold text-ink"
                    onClick={() => setCartOpen(false)}
                    type="button"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="min-h-0 overflow-y-auto border-b border-black/6 px-5 py-4 lg:border-b-0 lg:border-r lg:px-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-ink">已选菜品</h3>
                  <span className="rounded-full bg-black/[0.04] px-3 py-1.5 text-sm text-muted">{cartCount} 份</span>
                </div>

                <div className="mt-4 space-y-3">
                  {cartItems.length > 0 ? (
                    cartItems.map((item) => (
                      <div className="rounded-[22px] border border-black/6 bg-[#fcfcfa] p-4" key={item.dish.id}>
                        <div className="flex items-start justify-between gap-3">
                          <button className="text-left" onClick={() => openDishDetail(item.dish)} type="button">
                            <p className="font-semibold text-ink">{item.dish.name}</p>
                            <p className="mt-1 text-sm text-muted">
                              {mealConfig[item.dish.slot].label} · {item.dish.prepTime}
                            </p>
                          </button>
                          <span className="rounded-full bg-black/[0.04] px-3 py-1 text-xs font-semibold text-muted">{item.dish.tag}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-sm text-muted">{item.dish.ingredients.join(" · ")}</p>
                          <div className="flex items-center gap-3 rounded-full bg-ink px-3 py-2 text-white">
                            <button className="text-lg" onClick={() => changeCartCount(item.dish.id, item.count - 1)} type="button">
                              -
                            </button>
                            <span className="min-w-8 text-center text-sm font-semibold">{item.count} 份</span>
                            <button className="text-lg" onClick={() => changeCartCount(item.dish.id, item.count + 1)} type="button">
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-black/10 bg-[#fafaf6] px-4 py-10 text-center text-sm text-muted">
                      还没加入菜品，先回列表挑几道想做的。
                    </div>
                  )}
                </div>
              </div>

              <div className="min-h-0 overflow-y-auto px-5 py-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-ink">买菜清单</h3>
                  <span className="rounded-full bg-black/[0.04] px-3 py-1.5 text-sm text-muted">
                    {groceryItems.length > 0 ? `${checkedCount}/${groceryItems.length}` : "未生成"}
                  </span>
                </div>

                <div className="mt-4 rounded-[18px] border border-black/6 bg-[#fcfcfa] p-3">
                  <p className="text-sm font-semibold text-ink">手动补一项</p>
                  <div className="mt-3 flex gap-2">
                    <input
                      className="min-w-0 flex-1 rounded-full border border-black/8 bg-white px-4 py-2.5 text-sm text-ink outline-none"
                      onChange={(event) => setCustomIngredientInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCustomIngredient();
                        }
                      }}
                      placeholder="比如可乐、酸奶、一次性手套"
                      value={customIngredientInput}
                    />
                    <button
                      className="rounded-full bg-[#15211d] px-4 py-2.5 text-sm font-semibold text-white"
                      onClick={addCustomIngredient}
                      type="button"
                    >
                      添加
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {groceryItems.length > 0 ? (
                    groceryItems.map((item) => {
                      const checked = !!checkedIngredients[item.name];

                      return (
                        <button
                          className={`flex w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition ${
                            checked ? "border-transparent bg-[#edf7ef] text-[#3f7250]" : "border-black/6 bg-[#fcfcfa] text-ink"
                          }`}
                          key={item.name}
                          onClick={() => toggleIngredient(item.name)}
                          type="button"
                        >
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              checked ? "bg-[#18a058] text-white" : "bg-black/[0.06] text-muted"
                            }`}
                          >
                            {checked ? "✓" : ""}
                          </span>
                          <span className="flex-1 text-sm font-medium">{item.name}</span>
                          {item.customCount > 0 ? (
                            <span className="rounded-full bg-[#fff1ea] px-2 py-1 text-[11px] font-semibold text-[#d96c46]">
                              自填
                            </span>
                          ) : null}
                          <span className="text-xs text-muted">x{item.count}</span>
                          {item.customCount > 0 ? (
                            <span className="flex items-center gap-2 rounded-full bg-black/[0.05] px-2 py-1 text-xs text-ink">
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  changeCustomGroceryCount(item.name, item.customCount - 1);
                                }}
                                type="button"
                              >
                                -
                              </button>
                              <span>{item.customCount}</span>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  changeCustomGroceryCount(item.name, item.customCount + 1);
                                }}
                                type="button"
                              >
                                +
                              </button>
                            </span>
                          ) : null}
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-black/10 bg-[#fafaf6] px-4 py-10 text-center text-sm text-muted">
                      先选几道菜，这里才会生成对应食材。
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-[24px] bg-[linear-gradient(180deg,#fff9ef_0%,#fffdf8_100%)] p-4">
                  <p className="text-sm font-semibold text-ink">整理结果</p>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    今天一共选了 {distinctDishCount} 道菜，计划做 {cartCount} 份，需要采购 {groceryItems.length} 样基础食材。
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-white/14 px-4 py-3 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/64">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function DetailBadge({ label, tone = "light" }: { label: string; tone?: "light" | "dark" }) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-sm font-medium ${
        tone === "dark" ? "bg-[#15211d] text-white" : "bg-black/[0.05] text-ink"
      }`}
    >
      {label}
    </span>
  );
}
