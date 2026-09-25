import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import AdminLoginForm from '@/components/auth/AdminLoginForm';

export const metadata: Metadata = {
  title: 'Admin Sign In',
  description: 'Sign in to the Netify admin gateway.',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="app-header">
        <div className="container header-content">
          <div className="flex items-center gap-4">
            <Link href="/" className="nav-btn text-muted hover:text-primary">
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back to Portal</span>
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <h1 className="text-xl font-bold text-gradient flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-primary" />
              Admin Gateway
            </h1>
          </div>
        </div>
      </header>

      <main className="container flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md animate-fade-in">
          <AdminLoginForm />
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p className="text-muted text-xs">
            Admin Gateway • Authorized personnel only
          </p>
        </div>
      </footer>
    </div>
  );
}
