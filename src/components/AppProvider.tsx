"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Couple, Profile } from "@/lib/types";

export interface AppContextValue {
  userId: string;
  email: string;
  profile: Profile;
  couple: Couple;
  members: Profile[];
  partner: Profile | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ value, children }: { value: AppContextValue; children: ReactNode }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp doit être utilisé dans AppProvider");
  return ctx;
}

export function useMemberName(id: string | null | undefined): string {
  const { members } = useApp();
  return members.find((m) => m.id === id)?.display_name ?? "?";
}
