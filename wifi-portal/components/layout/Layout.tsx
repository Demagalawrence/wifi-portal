'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { WifiIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import { faqs } from '@/lib/constants';

interface LayoutProps {
  children: ReactNode;
}

/** Application shell: header with navigation, main content, and footer. */
export default function Layout({ children }: LayoutProps) {
  const [showTerms, setShowTerms] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="app-header">
        <div className="container header-content">
          <Link href="/" className="logo-container">
            <WifiIcon className="logo-icon" aria-hidden="true" />
            <span className="text-xl font-bold text-gradient">WiFi Hotspot</span>
          </Link>
          <div className="nav-links">
            <button
              type="button"
              onClick={() => setShowFAQ(true)}
              className="nav-btn"
              aria-label="Open frequently asked questions"
            >
              <QuestionMarkCircleIcon className="w-5 h-5" aria-hidden="true" />
              <span>Help</span>
            </button>
            <button type="button" onClick={() => setShowTerms(true)} className="nav-btn">
              Terms
            </button>
          </div>
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
            Need Support? Call: <span className="text-primary font-medium">+254 700 000 000</span>
          </p>
          <p className="text-muted text-sm mt-1">
            © 2026 WiFi Hotspot Portal • NestJS & Next.js Edition
          </p>
        </div>
      </footer>

      {/* Terms Modal */}
      <Modal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms & Conditions">
        <div className="text-secondary flex-col gap-4">
          <div className="mb-4">
            <h3 className="text-primary font-medium mb-2">1. Service Terms</h3>
            <p className="text-sm">
              By using our WiFi hotspot service, you agree to comply with all applicable laws and
              regulations.
            </p>
          </div>
          <div className="mb-4">
            <h3 className="text-primary font-medium mb-2">2. Payment</h3>
            <p className="text-sm">
              All payments are processed securely through mobile money providers (M-Pesa, Airtel Money, MTN Mobile Money).
            </p>
          </div>
          <div className="mb-4">
            <h3 className="text-primary font-medium mb-2">3. Usage</h3>
            <p className="text-sm">
              High-speed unlimited access applies for the active plan duration.
            </p>
          </div>
          <button type="button" onClick={() => setShowTerms(false)} className="btn btn-primary">
            I Agree
          </button>
        </div>
      </Modal>

      {/* FAQ Modal */}
      <Modal isOpen={showFAQ} onClose={() => setShowFAQ(false)} title="Frequently Asked Questions">
        <div className="flex-col gap-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="mb-4 pb-4 border-b border-white/10"
            >
              <h3 className="font-medium mb-2 text-primary">{faq.question}</h3>
              <p className="text-secondary text-sm">{faq.answer}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
