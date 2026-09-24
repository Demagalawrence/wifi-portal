'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { WifiIcon } from '@heroicons/react/24/outline';

interface LayoutProps {
  children: ReactNode;
}

/** Application shell: header with navigation, main content, and footer. */
export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="app-header">
        <div className="container header-content">
          <Link href="/" className="logo-container">
            <WifiIcon className="logo-icon" aria-hidden="true" />
            <span className="text-xl font-bold text-gradient">WiFi Hotspot</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md animate-fade-in">{children}</div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="container">
          <p className="text-secondary text-sm">
            Need Support? Call: <span className="text-primary font-medium">0744 219 162</span> or <span className="text-primary font-medium">0702 595 326</span>
          </p>
          <p className="text-muted text-sm mt-1">
            © 2026 WiFi Hotspot Portal • KEE TECHNOLOGY
          </p>
        </div>
      </footer>
    </div>
  );
}
