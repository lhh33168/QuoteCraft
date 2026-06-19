"use client";

import { HydrationBoundary, type DehydratedState } from "@tanstack/react-query";

type HydrationProviderProps = {
  children: React.ReactNode;
  state: DehydratedState;
};

export function HydrationProvider({ children, state }: HydrationProviderProps) {
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>;
}
