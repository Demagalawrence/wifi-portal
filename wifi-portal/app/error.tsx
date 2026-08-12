'use client';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="glass-panel p-8 mb-6 text-center" role="alert">
      <h2 className="text-2xl mb-4">Something went wrong</h2>
      <p className="text-secondary mb-6">{error.message}</p>
      <button type="button" className="btn btn-primary" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
