"use client";

import { useEffect, useRef, useState } from "react";

type MealSlot = "breakfast" | "lunch" | "dinner";

type MealInputs = Record<MealSlot, string>;

const STORAGE_KEY = "quotecraft-meal-wheel";

const mealConfig: Record<
  MealSlot,
  {
    label: string;
    caption: string;
    accent: string;
    softAccent: string;
  }
> = {
  breakfast: {
    label: "早餐",
    caption: "清醒一点，今天先吃什么",
    accent: "#ff7a59",
    softAccent: "rgba(255, 122, 89, 0.16)"
  },
  lunch: {
    label: "午餐",
    caption: "中午别纠结，直接转出来",
    accent: "#2d7c68",
    softAccent: "rgba(45, 124, 104, 0.16)"
  },
  dinner: {
    label: "晚餐",
    caption: "下班以后，命运帮你点餐",
    accent: "#254e70",
    softAccent: "rgba(37, 78, 112, 0.16)"
  }
};

const defaultInputs: MealInputs = {
  breakfast: ["豆浆油条", "小笼包", "煎蛋三明治", "皮蛋瘦肉粥", "牛肉面"].join("\n"),
  lunch: ["黄焖鸡", "番茄牛腩饭", "猪脚饭", "麻辣烫", "寿司"].join("\n"),
  dinner: ["烤鱼", "火锅", "韩式拌饭", "炒粉", "轻食沙拉"].join("\n")
};

const wheelColors = ["#f78c6b", "#ffbf69", "#7bc8a4", "#5aa9e6", "#7f95d1", "#f4b6c2"];

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

function buildWheelGradient(optionCount: number) {
  if (optionCount === 0) {
    return "conic-gradient(from -90deg, rgba(255,255,255,0.8) 0deg 360deg)";
  }

  const segmentAngle = 360 / optionCount;
  const segments = Array.from({ length: optionCount }, (_, index) => {
    const start = segmentAngle * index;
    const end = segmentAngle * (index + 1);
    return `${wheelColors[index % wheelColors.length]} ${start}deg ${end}deg`;
  });

  return `conic-gradient(from -90deg, ${segments.join(", ")})`;
}

export function MealWheelPage() {
  const [mealInputs, setMealInputs] = useState<MealInputs>(defaultInputs);
  const [activeMeal, setActiveMeal] = useState<MealSlot>("breakfast");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const spinTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const cachedValue = window.localStorage.getItem(STORAGE_KEY);

      if (cachedValue) {
        const parsed = JSON.parse(cachedValue) as Partial<MealInputs>;
        setMealInputs({
          breakfast: typeof parsed.breakfast === "string" ? parsed.breakfast : defaultInputs.breakfast,
          lunch: typeof parsed.lunch === "string" ? parsed.lunch : defaultInputs.lunch,
          dinner: typeof parsed.dinner === "string" ? parsed.dinner : defaultInputs.dinner
        });
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }

    return () => {
      if (spinTimerRef.current !== null) {
        window.clearTimeout(spinTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mealInputs));
  }, [isHydrated, mealInputs]);

  const activeOptions = parseMealOptions(mealInputs[activeMeal]);
  const segmentAngle = activeOptions.length > 0 ? 360 / activeOptions.length : 360;
  const selectedConfig = mealConfig[activeMeal];

  function updateMealInput(slot: MealSlot, value: string) {
    setMealInputs((current) => ({
      ...current,
      [slot]: value
    }));

    if (slot === activeMeal) {
      setSelectedItem(null);
    }
  }

  function resetMealInput(slot: MealSlot) {
    updateMealInput(slot, defaultInputs[slot]);
  }

  function clearMealInput(slot: MealSlot) {
    updateMealInput(slot, "");
  }

  function handleSpin() {
    if (isSpinning || activeOptions.length === 0) {
      return;
    }

    const targetIndex = Math.floor(Math.random() * activeOptions.length);
    const targetItem = activeOptions[targetIndex];
    const targetCenter = -(targetIndex * segmentAngle + segmentAngle / 2);
    const currentRotation = ((rotation % 360) + 360) % 360;
    const normalizedTarget = ((targetCenter % 360) + 360) % 360;
    const delta = (normalizedTarget - currentRotation + 360) % 360;
    const nextRotation = rotation + 6 * 360 + delta;

    if (spinTimerRef.current !== null) {
      window.clearTimeout(spinTimerRef.current);
    }

    setIsSpinning(true);
    setSelectedItem(null);
    setRotation(nextRotation);

    spinTimerRef.current = window.setTimeout(() => {
      setSelectedItem(targetItem);
      setIsSpinning(false);
    }, 4200);
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[34px] border border-black/6 bg-[linear-gradient(135deg,rgba(255,248,239,0.96)_0%,rgba(244,248,244,0.98)_55%,rgba(240,246,251,0.98)_100%)] shadow-soft">
          <div className="grid gap-8 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/6 bg-white/72 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7d73] backdrop-blur">
                <span>QuoteCraft 临时首页</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff7a59]" />
                <span>登录页已隐藏</span>
              </div>
              <h1 className="mt-5 max-w-2xl font-display text-4xl leading-tight text-ink sm:text-5xl lg:text-6xl">
                转盘点餐
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-muted sm:text-base">
                把早中晚想吃的都填进去，纠结的时候直接开转。转到哪个，今天就吃哪个。
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-ink">
                <div className="rounded-full border border-black/6 bg-white/80 px-4 py-2 shadow-[0_8px_24px_rgba(22,38,33,0.06)]">
                  支持换行、逗号、顿号分隔
                </div>
                <div className="rounded-full border border-black/6 bg-white/80 px-4 py-2 shadow-[0_8px_24px_rgba(22,38,33,0.06)]">
                  自动保存在当前设备
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/65 bg-white/78 p-5 shadow-[0_18px_50px_rgba(20,35,30,0.08)] backdrop-blur-sm sm:p-6">
              <div className="flex flex-wrap gap-3">
                {(
                  Object.keys(mealConfig) as MealSlot[]
                ).map((slot) => {
                  const optionsCount = parseMealOptions(mealInputs[slot]).length;
                  const config = mealConfig[slot];
                  const isActive = slot === activeMeal;

                  return (
                    <button
                      className={`flex min-w-[110px] flex-1 items-center justify-between rounded-[22px] border px-4 py-3 text-left transition duration-200 ${
                        isActive
                          ? "border-transparent bg-ink text-white shadow-[0_14px_32px_rgba(21,33,29,0.16)]"
                          : "border-black/6 bg-white text-ink hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(21,33,29,0.08)]"
                      }`}
                      disabled={isSpinning}
                      key={slot}
                      onClick={() => {
                        setActiveMeal(slot);
                        setSelectedItem(null);
                      }}
                      type="button"
                    >
                      <span>
                        <span className="block text-sm font-semibold">{config.label}</span>
                        <span className={`mt-1 block text-xs ${isActive ? "text-white/72" : "text-muted"}`}>
                          {config.caption}
                        </span>
                      </span>
                      <span
                        className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-bold ${
                          isActive ? "bg-white/14 text-white" : "bg-black/[0.05] text-muted"
                        }`}
                      >
                        {optionsCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                className="mt-5 rounded-[24px] border border-black/6 px-4 py-4 text-sm text-ink"
                style={{ backgroundColor: selectedConfig.softAccent }}
              >
                正在选择 <span className="font-semibold">{selectedConfig.label}</span>
                <span className="ml-2 text-muted">{selectedConfig.caption}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
          <article className="rounded-[34px] border border-black/6 bg-white/84 p-5 shadow-soft backdrop-blur-sm sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">今天吃什么</p>
                <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">{selectedConfig.label}转盘</h2>
              </div>
              <div
                className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                style={{ color: selectedConfig.accent, backgroundColor: selectedConfig.softAccent }}
              >
                {activeOptions.length} 个选项
              </div>
            </div>

            <div className="relative mx-auto mt-8 aspect-square w-full max-w-[420px]">
              <div className="absolute left-1/2 top-0 z-20 h-0 w-0 -translate-x-1/2 border-x-[18px] border-b-[30px] border-x-transparent border-b-[#ff7a59] drop-shadow-[0_10px_18px_rgba(255,122,89,0.35)]" />

              <div className="absolute inset-0 rounded-full border-[10px] border-white bg-[#f7f3eb] shadow-[inset_0_0_0_1px_rgba(21,33,29,0.06),0_30px_65px_rgba(20,35,30,0.12)]" />

              <div
                className="absolute inset-[18px] rounded-full border border-white/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)]"
                style={{
                  background: buildWheelGradient(activeOptions.length),
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? "transform 4200ms cubic-bezier(0.12, 0.82, 0.18, 1)" : "none"
                }}
              >
                {activeOptions.length > 0 ? (
                  activeOptions.map((option, index) => {
                    const angle = index * segmentAngle + segmentAngle / 2 - 90;
                    const labelSize = activeOptions.length >= 12 ? "10px" : activeOptions.length >= 8 ? "11px" : "12px";

                    return (
                      <div
                        className="absolute left-1/2 top-1/2 w-[39%] origin-left -translate-y-1/2"
                        key={`${option}-${index}`}
                        style={{ transform: `rotate(${angle}deg)` }}
                      >
                        <div className="flex justify-end pr-4">
                          <span
                            className="max-w-[110px] truncate rounded-full bg-white/78 px-2.5 py-1 text-center font-semibold text-[#17344f] shadow-[0_6px_16px_rgba(21,33,29,0.08)] backdrop-blur-sm"
                            style={{
                              fontSize: labelSize,
                              transform: `rotate(${-angle}deg)`
                            }}
                            title={option}
                          >
                            {option}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center px-10 text-center text-sm leading-7 text-muted">
                    先在右侧填几个想吃的，再来开转。
                  </div>
                )}
              </div>

              <div className="absolute left-1/2 top-1/2 z-10 flex h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-[10px] border-white bg-[linear-gradient(180deg,#fffdf8_0%,#f2f7f4_100%)] text-center shadow-[0_18px_34px_rgba(21,33,29,0.12)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                  {selectedConfig.label}
                </span>
                <span className="mt-2 px-4 text-sm font-semibold leading-6 text-ink">
                  {selectedItem ?? (isSpinning ? "转盘加速中" : "准备开吃")}
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="rounded-[24px] border border-black/6 bg-[#f8fbf8] px-4 py-4 text-sm leading-7 text-ink">
                {selectedItem ? (
                  <>
                    今天的 <span className="font-semibold">{selectedConfig.label}</span> 就决定是
                    <span className="mx-2 inline-flex rounded-full bg-ink px-3 py-1 text-white">{selectedItem}</span>
                    了。
                  </>
                ) : (
                  <>点一下转盘按钮，让它替你做决定。</>
                )}
              </div>
              <button
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#17344f_0%,#184d3f_56%,#ff7a59_100%)] px-7 text-base font-semibold text-white shadow-[0_18px_34px_rgba(21,33,29,0.18)] transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSpinning || activeOptions.length === 0}
                onClick={handleSpin}
                type="button"
              >
                {isSpinning ? "转盘旋转中..." : `帮我选${selectedConfig.label}`}
              </button>
            </div>
          </article>

          <article className="rounded-[34px] border border-black/6 bg-white/84 p-5 shadow-soft backdrop-blur-sm sm:p-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">菜单编辑</p>
                <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">把想吃的先存起来</h2>
              </div>
              <p className="text-sm leading-7 text-muted">一行一个，或者直接用逗号分隔也可以。</p>
            </div>

            <div className="mt-6 grid gap-4">
              {(Object.keys(mealConfig) as MealSlot[]).map((slot) => {
                const config = mealConfig[slot];
                const items = parseMealOptions(mealInputs[slot]);
                const isActive = slot === activeMeal;

                return (
                  <section
                    className={`rounded-[28px] border p-4 transition duration-200 sm:p-5 ${
                      isActive
                        ? "border-transparent bg-[linear-gradient(180deg,rgba(249,251,249,0.96)_0%,rgba(241,247,244,0.98)_100%)] shadow-[0_16px_36px_rgba(21,33,29,0.08)]"
                        : "border-black/6 bg-[#fcfcfa]"
                    }`}
                    key={slot}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-[0_10px_22px_rgba(21,33,29,0.14)]"
                          style={{ backgroundColor: config.accent }}
                        >
                          {config.label.slice(0, 1)}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-ink">{config.label}</h3>
                          <p className="text-sm text-muted">{config.caption}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-medium text-ink"
                          onClick={() => resetMealInput(slot)}
                          type="button"
                        >
                          恢复示例
                        </button>
                        <button
                          className="rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-medium text-ink"
                          onClick={() => clearMealInput(slot)}
                          type="button"
                        >
                          清空
                        </button>
                      </div>
                    </div>

                    <textarea
                      className="mt-4 min-h-[132px] w-full resize-y rounded-[22px] border border-black/8 bg-white px-4 py-3 text-sm leading-7 text-ink outline-none transition duration-200 placeholder:text-[#8a978f] focus:border-transparent focus:ring-2 focus:ring-pine/20"
                      onChange={(event) => updateMealInput(slot, event.target.value)}
                      placeholder={`例如：${config.label === "早餐" ? "豆浆油条" : config.label === "午餐" ? "黄焖鸡" : "火锅"}`}
                      value={mealInputs[slot]}
                    />

                    <div className="mt-4 flex flex-wrap gap-2">
                      {items.length > 0 ? (
                        items.map((item) => (
                          <button
                            className={`rounded-full px-3 py-1.5 text-sm font-medium transition duration-200 ${
                              isActive ? "bg-ink text-white" : "bg-black/[0.04] text-ink hover:bg-black/[0.07]"
                            }`}
                            key={item}
                            onClick={() => {
                              setActiveMeal(slot);
                              setSelectedItem(item);
                            }}
                            type="button"
                          >
                            {item}
                          </button>
                        ))
                      ) : (
                        <span className="text-sm text-muted">还没添加菜品。</span>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
