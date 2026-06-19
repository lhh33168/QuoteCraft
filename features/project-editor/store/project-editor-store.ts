"use client";

import { create } from "zustand";
import type { ProjectDetail, QuoteItem } from "@/shared/types/project";

type EditorState = {
  detail: ProjectDetail;
  dirty: boolean;
  saving: boolean;
  lastSavedAt: string | null;
  setProjectField: <K extends keyof ProjectDetail["project"]>(
    key: K,
    value: ProjectDetail["project"][K]
  ) => void;
  updateQuoteItem: (id: string, patch: Partial<QuoteItem>) => void;
  addQuoteItem: () => void;
  removeQuoteItem: (id: string) => void;
  replaceDetail: (detail: ProjectDetail) => void;
  setSaving: (saving: boolean) => void;
  markSaved: (detail?: ProjectDetail) => void;
  total: () => number;
};

export const createProjectEditorStore = (initialState: ProjectDetail) =>
  create<EditorState>((set, get) => ({
    detail: initialState,
    dirty: false,
    saving: false,
    lastSavedAt: null,
    setProjectField: (key, value) =>
      set((state) => ({
        detail: {
          ...state.detail,
          project: {
            ...state.detail.project,
            [key]: value
          }
        },
        dirty: true
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
          },
          dirty: true
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
          },
          dirty: true
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
          },
          dirty: true
        };
      }),
    replaceDetail: (detail) =>
      set({
        detail,
        dirty: false
      }),
    setSaving: (saving) =>
      set({
        saving
      }),
    markSaved: (detail) =>
      set((state) => ({
        detail: detail ?? state.detail,
        dirty: false,
        saving: false,
        lastSavedAt: new Date().toISOString()
      })),
    total: () => get().detail.quoteItems.reduce((sum, item) => sum + item.subtotal, 0)
  }));
