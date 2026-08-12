/**
 * Pure helper functions shared across the application.
 */
import {
  DEFAULT_DATA_LIMIT_MB,
  DEFAULT_DURATION_MS,
  MAC_ADDRESS_KEY,
} from '@/lib/constants';
import type { Plan, Session, UserSession } from '@/types';

/** Remove whitespace from a phone number. */
export function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\s/g, '');
}

/** Validate a phone number: optional leading `+`, 10-15 digits. */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  return /^\+?[0-9]{10,15}$/.test(normalizePhoneNumber(phoneNumber));
}

/** Prefer an API-provided error message, falling back to a default. */
export function formatApiError(fallback: string, error?: string): string {
  return error || fallback;
}

/** Format a millisecond duration as `Nh Mm Ss`. */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return 'Expired';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** Resolve a plan's duration in milliseconds. */
export function getDurationInMs(plan: Plan): number {
  if (plan.duration_hours) {
    return plan.duration_hours * 60 * 60 * 1000;
  }

  if (!plan.duration) {
    return DEFAULT_DURATION_MS;
  }

  const unit = plan.duration.slice(-1);
  const value = parseInt(plan.duration.slice(0, -1), 10);

  switch (unit) {
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'w':
      return value * 7 * 24 * 60 * 60 * 1000;
    case 'm':
      return value * 30 * 24 * 60 * 60 * 1000;
    default:
      return DEFAULT_DURATION_MS;
  }
}

/** Resolve a human-readable data limit into megabytes. */
export function getDataLimitInMB(limit: string): number {
  if (limit === 'Unlimited') return Infinity;
  const value = parseInt(limit, 10);
  if (limit.includes('GB')) return value * 1024;
  if (limit.includes('MB')) return value;
  return DEFAULT_DATA_LIMIT_MB;
}

/**
 * Return the persisted device MAC, generating and caching a random one the
 * first time it is requested. The backend treats it as a stable device id.
 */
export function getDeviceMacAddress(): string {
  if (typeof window === 'undefined') return '';

  const storedMacAddress = window.localStorage.getItem(MAC_ADDRESS_KEY);
  if (storedMacAddress) return storedMacAddress;

  const randomMacAddress = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  ).join(':');

  window.localStorage.setItem(MAC_ADDRESS_KEY, randomMacAddress);
  return randomMacAddress;
}

/** Convert a backend session payload into the client-side session model. */
export function mapApiSessionToUserSession(
  apiSession: Session,
  planOverride?: Plan,
  macAddressOverride?: string
): UserSession {
  const plan: Plan = planOverride || {
    id: apiSession.plan,
    name: apiSession.plan_name,
    price: 0,
    duration_display: apiSession.plan_duration,
  };

  return {
    username: apiSession.user_username,
    plan,
    startTime: new Date(apiSession.start_time),
    endTime: new Date(apiSession.end_time),
    dataUsed: apiSession.data_used,
    dataLimit: getDataLimitInMB(plan.dataLimit || '1GB'),
    isActive: apiSession.is_active,
    macAddress: macAddressOverride || apiSession.mac_address || '',
    apiSessionId: apiSession.id,
    deviceRestrictions: {
      allowHotspot: false,
      allowTethering: false,
      maxDevices: 1,
    },
  };
}
