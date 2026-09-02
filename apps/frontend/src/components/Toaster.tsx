'use client';

import React, { useState, useEffect } from 'react';

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  type: ToastType;
  text: string;
}

const Toaster = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Exponer una forma de añadir toasts globalmente o a través de props
  // Para ser lazy, añadiremos una función al objeto window temporalmente 
  // o usaremos un emisor de eventos simple si fuera necesario.
  // Pero lo más simple es usar un evento de ventana.
  useEffect(() => {
    const handleAddToast = (e: any) => {
      const { type, text } = e.detail;
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, text }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };
    window.addEventListener('add-toast', handleAddToast);
    return () => window.removeEventListener('add-toast', handleAddToast);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-xl shadow-lg border flex items-center space-x-3 transition-opacity duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span className="text-sm font-medium">{toast.text}</span>
        </div>
      ))}
    </div>
  );
};

export const showToast = (type: ToastType, text: string) => {
  window.dispatchEvent(new CustomEvent('add-toast', { detail: { type, text } }));
};

export default Toaster;
