'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to monitoring service
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 text-red-600 mx-auto mb-4 text-4xl">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Chyba aplikácie
        </h1>
        <p className="text-gray-600 mb-6">
          Vyskytla sa neočakávaná chyba. Skúste opäť alebo sa vráťte domov.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Skúsiť znova
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Domov
          </button>
        </div>
      </div>
    </div>
  );
}
