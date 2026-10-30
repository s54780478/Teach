'use client';

import React, { useEffect, useState } from 'react';
import { APP_TOAST_EVENT, type AppToastDetail } from '@/lib/appToast';

export const AppToastHost: React.FC = () => {
  const [toast, setToast] = useState<AppToastDetail | null>(null);

  useEffect(() => {
    const onToast = (e: Event) => {
      const ce = e as CustomEvent<AppToastDetail>;
      if (!ce.detail?.message) return;
      setToast(ce.detail);
      window.setTimeout(() => setToast(null), 3200);
    };
    window.addEventListener(APP_TOAST_EVENT, onToast as EventListener);
    return () => window.removeEventListener(APP_TOAST_EVENT, onToast as EventListener);
  }, []);

  if (!toast) return null;

  const tone =
    toast.variant === 'error'
      ? 'bg-rose-600 text-white'
      : toast.variant === 'success'
        ? 'bg-emerald-600 text-white'
        : 'bg-slate-900 text-white';

  return (
    <div
      className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 px-4 w-full max-w-sm pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div
        className={`${tone} text-sm font-medium px-4 py-3 rounded-2xl shadow-xl text-center`}
      >
        {toast.message}
      </div>
    </div>
  );
};
