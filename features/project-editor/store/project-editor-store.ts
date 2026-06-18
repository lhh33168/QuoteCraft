"use client";

import { create } from "zustand";
import type { ProjectDetail, QuoteItem } from "@/shared/types/project";

type EditorState = {
  detail: ProjectDetail;
  setProjectField: <K extends keyof ProjectDetail["project"]>(
    key: K,
    value: ProjectDetail["project"][K]
  ) => void;
  updateQuoteItem: (id: string, patch: Partial<QuoteItem>) => void;
  addQuoteItem: () => void;
  removeQuoteItem: (id: string) => void;
  total: () => number;
};

export const createProjectEditorStore = (initialState: ProjectDetail) =>
  create<EditorState>((set, get) => ({
    detail: initialState,
    setProjectField: (key, value) =>
      set((state) => ({
        detail: {
          ...state.detail,
          project: {
            ...state.detail.project,
            [key]: value
          }
        }
      })),
    updateQuoteItem: (id, patch) =>
      set((state) => {
        const quoteItems = state.detail.quoteItems.map((item) => {
          if (item.id !== id) {
            return item;
          }

          const next = { ...item, ...patch };
          next.subtotal = Number(next.unitPrice) * Number(next.quantity);
          return next;
        });

        return {
          detail: {
            ...state.detail,
            project: {
              ...state.detail.project,
              totalPrice: quoteItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)
            },
            quoteItems
          }
        };
      }),
    addQuoteItem: () =>
      set((state) => {
        const quoteItems = [
          ...state.detail.quoteItems,
          {
            id: `item-${state.detail.quoteItems.length + 1}`,
            name: "新报价项",
            description: "",
            category: "other",
            unitPrice: 0,
            quantity: 1,
            unit: "项",
            subtotal: 0,
            sortOrder: state.detail.quoteItems.length + 1,
            isPreset: false
          } satisfies QuoteItem
        ];

        return {
          detail: {
            ...state.detail,
            quoteItems
          }
        };
      }),
    removeQuoteItem: (id) =>
      set((state) => {
        const quoteItems = state.detail.quoteItems.filter((item) => item.id !== id);

        return {
          detail: {
            ...state.detail,
            project: {
              ...state.detail.project,
              totalPrice: quoteItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)
            },
            quoteItems
          }
        };
      }),
    total: () => get().detail.quoteItems.reduce((sum, item) => sum + item.subtotal, 0)
  }));
