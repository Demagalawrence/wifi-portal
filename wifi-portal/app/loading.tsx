import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-16">
      <LoadingSpinner size="large" />
    </div>
  );
}
