/**
 * Shared application types.
 *
 * These types are consumed by the API client, hooks, context and UI components.
 * They mirror the Django REST Framework payloads for the WiFi Hotspot backend.
 */

/** Feature offered as part of a plan. */
export interface PlanFeature {
  feature_name: string;
  is_included: boolean;
}

/** A WiFi pricing plan returned by the backend. */
export interface Plan {
  id: string;
  name: string;
  price: number | string;
  duration?: string;
  duration_hours?: number;
  duration_display?: string;
  description?: string;
  dataLimit?: string;
  features?: Array<string | PlanFeature>;
  is_active?: boolean;
  sort_order?: number;
}

/** Authenticated user returned by the accounts API. */
export interface User {
  id: string;
  username: string;
  role?: string;
  email?: string;
  phone_number?: string;
  is_active_session: boolean;
  is_authenticated: boolean;
}

/** Payment record returned by the payments API. */
export interface Payment {
  id: string;
  user: string;
  user_username: string;
  plan: string;
  plan_name: string;
  plan_duration: string;
  amount: number | string;
  payment_method: string;
  phone_number: string;
  transaction_id?: string;
  status: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

/** WiFi session returned by the sessions API. */
export interface Session {
  id: string;
  user: string;
  user_username: string;
  plan: string;
  plan_name: string;
  plan_duration: string;
  payment: string;
  mac_address?: string;
  ip_address?: string;
  status: string;
  start_time: string;
  end_time: string;
  data_used: number;
  last_activity: string;
  is_active: boolean;
  time_remaining: string;
  duration_used: string;
  created_at: string;
  updated_at: string;
}

/** WiFi access token (WIFI-XXXXX-XXXXX) returned by the sessions API. */
export interface AccessToken {
  id: string;
  code: string;
  user: string;
  user_username: string;
  plan: string;
  plan_name: string;
  plan_duration: string;
  payment: string;
  session?: string;
  phone_number: string;
  mac_address?: string;
  status: string;
  expires_at: string;
  regenerated_from?: string;
  created_at: string;
  updated_at: string;
}

/** Client-side representation of an active WiFi session. */
export interface UserSession {
  username: string;
  plan: Plan;
  startTime: Date;
  endTime: Date;
  dataUsed: number;
  dataLimit: number;
  isActive: boolean;
  macAddress: string;
  apiSessionId?: string;
  deviceRestrictions: {
    allowHotspot: boolean;
    allowTethering: boolean;
    maxDevices: number;
  };
}

/** Validation errors keyed by form field. */
export interface FormErrors {
  username?: string;
  phoneNumber?: string;
  paymentMethod?: string;
}

/** Lifecycle status of the user's connection. */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/** Supported mobile money providers. */
export type PaymentMethodType = 'airtel' | 'mtn' | 'mpesa' | null;

/** Admin Dashboard summary metrics. */
export interface AdminMetrics {
  total_revenue: number;
  active_sessions: number;
  total_users: number;
  total_payments: number;
  active_vouchers: number;
}

/** Normalized result of an API call. */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

/** State exposed by the session context. */
export interface SessionState {
  username: string;
  plans: Plan[];
  selectedPlan: Plan | null;
  paymentMethod: PaymentMethodType;
  phoneNumber: string;
  isLoading: boolean;
  isLoadingPlans: boolean;
  planLoadError?: string;
  isConnected: boolean;
  userSession: UserSession | null;
  errors: FormErrors;
  connectionStatus: ConnectionStatus;
  remainingTime: number;
}

/** Actions exposed by the session context. */
export interface SessionActions {
  setUsername: (username: string) => void;
  setSelectedPlan: (plan: Plan | null) => void;
  setPaymentMethod: (method: PaymentMethodType) => void;
  setPhoneNumber: (number: string) => void;
  setErrors: (errors: FormErrors) => void;
  handleConnect: () => Promise<void>;
  handlePay: (plan: Plan) => void;
  handleDisconnect: () => void;
  handlePayment: () => Promise<void>;
  formatTimeRemaining: (milliseconds: number) => string;
  validateDeviceRestrictions: (session: UserSession, currentMAC: string) => boolean;
  getDurationInMs: (plan: Plan) => number;
}

