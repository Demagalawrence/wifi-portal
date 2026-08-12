interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const sizeMap = {
  small: '1rem',
  medium: '2rem',
  large: '3rem',
} as const;

/** Accessible loading indicator. */
export default function LoadingSpinner({
  size = 'medium',
  color = 'var(--color-primary)',
}: LoadingSpinnerProps) {
  const spinnerSize = sizeMap[size];

  return (
    <div
      className="spinner"
      style={{
        width: spinnerSize,
        height: spinnerSize,
        borderLeftColor: color,
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
