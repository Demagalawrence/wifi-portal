import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="glass-panel p-8 mb-6 text-center">
      <h1 className="text-3xl mb-4">Page not found</h1>
      <p className="text-secondary mb-6">The page you are looking for does not exist.</p>
      <Link href="/" className="btn btn-primary">
        Back to home
      </Link>
    </div>
  );
}
