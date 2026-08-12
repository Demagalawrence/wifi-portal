/**
 * Application-wide constants.
 *
 * Environment variables follow the Next.js `NEXT_PUBLIC_` convention and are
 * inlined at build time. The NestJS backend preserves the original API contract.
 */

/** Base URL of the NestJS API (includes the trailing `/api`). */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';

/** Public URL of this frontend, used for SEO metadata and canonical tags. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** localStorage key under which the API token is stored. */
export const AUTH_TOKEN_KEY = 'auth_token';

/** localStorage key under which the generated device MAC is cached. */
export const MAC_ADDRESS_KEY = 'portal_mac_address';

/** Format of a valid access code, e.g. `WIFI-ABCDE-12345`. */
export const ACCESS_TOKEN_PATTERN = /^WIFI-[A-Z0-9]{4,12}-[A-Z0-9]{4,12}$/i;

/** Secret keyword typed in the token box to reveal the admin sign-in form. */
export const ADMIN_LOGIN_KEYWORD = 'admin';

/** API request timeout in milliseconds. */
export const REQUEST_TIMEOUT_MS = 20_000;

/** Number of retries for idempotent (GET) requests. */
export const MAX_REQUEST_RETRIES = 2;

/** Delay between request retries in milliseconds. */
export const RETRY_DELAY_MS = 500;

/** Default data limit (MB) assumed when a plan does not declare one. */
export const DEFAULT_DATA_LIMIT_MB = 1024;

/** Default session duration (ms) when a plan cannot be resolved. */
export const DEFAULT_DURATION_MS = 60 * 60 * 1000;

/** Warning thresholds for the session countdown (ms). */
export const WARNING_5_MIN_MS = 5 * 60 * 1000;
export const WARNING_1_MIN_MS = 60 * 1000;

/** Frequently asked questions shown in the support modal. */
export const faqs = [
  {
    question: 'How do I connect to WiFi?',
    answer:
      "Enter your username, select a plan, and complete payment. You'll be automatically connected.",
  },
  {
    question: 'What payment methods are accepted?',
    answer:
      'We accept Airtel Money and MTN Mobile Money for quick and secure payments.',
  },
  {
    question: 'Can I change my plan?',
    answer:
      'Yes, you can upgrade your plan at any time. The remaining time will be credited.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes, we use industry-standard encryption to protect your data and privacy.',
  },
  {
    question: 'What if I run out of data?',
    answer:
      'You can purchase additional data or upgrade to a plan with higher limits.',
  },
];


