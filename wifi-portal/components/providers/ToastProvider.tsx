'use client';

import { Toaster } from 'react-hot-toast';

/** Global toast host. Rendered once in the root layout. */
export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }}
    />
  );
}
