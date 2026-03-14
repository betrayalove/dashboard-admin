import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type?: ToastType;
}

interface ToastsState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

let idCounter = 0;
function nextId() {
  return `toast-${++idCounter}-${Date.now()}`;
}

export const useToastsStore = create<ToastsState>((set) => ({
  toasts: [],

  addToast: (message, type = 'info') =>
    set((s) => {
      const id = nextId();
      const toast: Toast = { id, message, type };
      setTimeout(() => {
        useToastsStore.getState().removeToast(id);
      }, 5000);
      return { toasts: [...s.toasts, toast] };
    }),

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));