import * as React from 'react';
import type { ToastActionElement, ToastProps } from '@/components/ui/toast';

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 2000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type ToastInput = Omit<ToasterToast, 'id' | 'open' | 'onOpenChange'> & { duration?: number };

type State = { toasts: ToasterToast[] };

const listeners: Array<(s: State) => void> = [];
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let state: State = { toasts: [] };
let idCounter = 0;

function nextId() {
  idCounter = (idCounter + 1) % Number.MAX_SAFE_INTEGER;
  return idCounter.toString();
}

function emit() {
  listeners.forEach((l) => l(state));
}

function removeNow(id?: string) {
  if (id == null) {
    state = { toasts: [] };
  } else {
    state = {
      toasts: state.toasts.filter((t) => t.id !== id),
    };
  }
  emit();
}

function queueRemove(id: string) {
  if (timers.has(id)) return;
  const timeout = setTimeout(() => {
    timers.delete(id);
    removeNow(id);
  }, TOAST_REMOVE_DELAY);
  timers.set(id, timeout);
}

function addToast(t: ToasterToast) {
  state = {
    toasts: [t, ...state.toasts].slice(0, TOAST_LIMIT),
  };
  emit();
}

function updateToast(id: string, patch: Partial<ToasterToast>) {
  state = {
    toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  };
  emit();
}

function dismissOne(id: string) {
  const existing = timers.get(id);
  if (existing) {
    clearTimeout(existing);
    timers.delete(id);
  }
  state = {
    toasts: state.toasts.map((t) => (t.id === id ? { ...t, open: false } : t)),
  };
  emit();
  queueRemove(id);
}

function dismissAll() {
  state.toasts.forEach((t) => dismissOne(t.id));
}

export function toast({ duration = 2000, ...props }: ToastInput) {
  const id = nextId();

  addToast({
    ...props,
    id,
    open: true,
    onOpenChange: (open) => {
      if (!open) dismissOne(id);
    },
  });

  if (duration > 0) {
    const timeout = setTimeout(() => dismissOne(id), duration);
    timers.set(id, timeout);
  }

  return {
    id,
    dismiss: () => dismissOne(id),
    update: (patch: Partial<ToasterToast>) => updateToast(id, patch),
  };
}

export function useToast() {
  const [local, setLocal] = React.useState<State>(state);

  React.useEffect(() => {
    listeners.push(setLocal);
    return () => {
      const i = listeners.indexOf(setLocal);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);

  return {
    ...local,
    toast,
    dismiss: (id?: string) => (id ? dismissOne(id) : dismissAll()),
  };
}

export type { ToasterToast, ToastInput as Toast };
