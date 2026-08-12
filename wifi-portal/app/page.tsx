import type { Metadata } from 'next';
import Portal from '@/components/portal/Portal';

export const metadata: Metadata = {
  title: 'Connect to WiFi',
  description:
    'Enter your WiFi access code or buy a new plan to get connected instantly.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return <Portal />;
}
