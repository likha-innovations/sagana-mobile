import { create } from "zustand";

// The measured height includes text scaling and the bottom safe area.
export const useTabBarHeight = create<{
  height: number;
  setHeight: (height: number) => void;
}>((set) => ({
  height: 0,
  setHeight: (height) => set({ height }),
}));
