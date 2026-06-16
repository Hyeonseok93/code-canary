import { create } from 'zustand';

interface UIState {
  isSystemError: boolean;
  setSystemError: (error: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSystemError: false,
  setSystemError: (error) => set({ isSystemError: error })
}));
