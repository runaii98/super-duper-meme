import { useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

export interface ToastState {
  toasts: Toast[];
}

export interface ToastOptions {
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] });

  const toast = ({
    title,
    message,
    type = 'info',
    duration = 3000,
  }: ToastOptions) => {
    const id = Math.random().toString(36).substring(2);
    const newToast: Toast = {
      id,
      type,
      title,
      message,
      duration,
    };

    setState((prev) => ({
      toasts: [...prev.toasts, newToast],
    }));

    setTimeout(() => {
      setState((prev) => ({
        toasts: prev.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  };

  return {
    toast,
    toasts: state.toasts,
  };
} 