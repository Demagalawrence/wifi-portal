/**
 * Centralized API client for the WiFi Hotspot NestJS backend.
 *
 * - Keeps every existing endpoint URL unchanged.
 * - Centralizes API token storage (localStorage) and header injection.
 * - Adds a request timeout and retries for idempotent (GET) requests.
 * - Normalizes responses to the `ApiResponse<T>` contract.
 */
import {
  API_BASE_URL,
  AUTH_TOKEN_KEY,
  MAX_REQUEST_RETRIES,
  REQUEST_TIMEOUT_MS,
  RETRY_DELAY_MS,
} from '@/lib/constants';
import type {
  AccessToken,
  ApiResponse,
  Payment,
  Plan,
  Session,
  User,
} from '@/types';

type PaymentMethod = 'airtel' | 'mtn' | 'mpesa';

interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

/* ---------------------------------- Token ---------------------------------- */

/** Read the API token from localStorage. */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

/** Persist the API token in localStorage. */
export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/** Remove the API token from localStorage. */
export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

/* --------------------------------- Request --------------------------------- */

async function request<T>(
  path: string,
  options: RequestOptions = {},
  retries = MAX_REQUEST_RETRIES
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const method = options.method ?? 'GET';

  try {
    const token = getStoredToken();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
        ...(options.headers ?? {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
      cache: 'no-store',
    });

    const text = await response.text();
    let payload: Record<string, unknown> | null = null;
    if (text) {
      try {
        payload = JSON.parse(text) as Record<string, unknown>;
      } catch {
        // Non-JSON body; leave payload as null.
      }
    }

    if (response.ok) {
      return { data: (payload ?? {}) as T };
    }

    const error =
      (payload && typeof payload.error === 'string' ? payload.error : undefined) ??
      (payload && typeof payload.detail === 'string' ? payload.detail : undefined) ??
      `Request failed (${response.status})`;

    return { error };
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'AbortError';

    // Only retry idempotent requests after a transient failure.
    if (!timedOut && retries > 0 && method === 'GET') {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return request<T>(path, options, retries - 1);
    }

    return {
      error: timedOut
        ? 'Request timed out. Please try again.'
        : 'Network error. Please check your connection.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/* --------------------------------- Service --------------------------------- */

export const apiService = {
  get<T>(path: string): Promise<ApiResponse<T>> {
    return request<T>(path);
  },

  post<T>(path: string, body?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return request<T>(path, { method: 'POST', body });
  },

  put<T>(path: string, body?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return request<T>(path, { method: 'PUT', body });
  },

  /* Health */

  async healthCheck(): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.get<{ status: string; message: string }>('/health/');
  },

  /* Authentication */

  async register(
    username: string,
    password: string,
    phone_number?: string
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    const result = await this.post<{ user: User; token: string }>('/accounts/register/', {
      username,
      password,
      password_confirm: password,
      phone_number,
    });
    if (result.data?.token) setStoredToken(result.data.token);
    return result;
  },

  async login(
    username: string,
    password: string
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    const result = await this.post<{ user: User; token: string }>('/accounts/login/', {
      username,
      password,
    });
    if (result.data?.token) setStoredToken(result.data.token);
    return result;
  },

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const result = await this.post<{ message: string }>('/accounts/logout/');
    clearStoredToken();
    return result;
  },

  async getUserStatus(): Promise<ApiResponse<{ user: User }>> {
    return this.get<{ user: User }>('/accounts/status/');
  },

  /* Plans */

  async getPlans(): Promise<ApiResponse<{ plans: Plan[]; count: number }>> {
    return this.get<{ plans: Plan[]; count: number }>('/plans/');
  },

  async getPlan(planId: string): Promise<ApiResponse<Plan>> {
    return this.get<Plan>(`/plans/${planId}/`);
  },

  /* Payments */

  async initiatePayment(
    planId: string,
    paymentMethod: PaymentMethod,
    phoneNumber: string
  ): Promise<ApiResponse<{ payment: Payment; provider_response: unknown }>> {
    return this.post<{ payment: Payment; provider_response: unknown }>('/payments/initiate/', {
      plan_id: planId,
      payment_method: paymentMethod,
      phone_number: phoneNumber,
    });
  },

  async getPaymentStatus(paymentId: string): Promise<ApiResponse<Payment>> {
    return this.get<Payment>(`/payments/${paymentId}/status/`);
  },

  async getPaymentHistory(): Promise<ApiResponse<{ payments: Payment[]; count: number }>> {
    return this.get<{ payments: Payment[]; count: number }>('/payments/history/');
  },

  async simulatePayment(paymentId: string): Promise<ApiResponse<{ payment: Payment }>> {
    return this.post<{ payment: Payment }>(`/payments/${paymentId}/simulate/`);
  },

  /* Sessions */

  async createSession(
    paymentId: string,
    macAddress?: string
  ): Promise<ApiResponse<{ session: Session; access_token: AccessToken }>> {
    return this.post<{ session: Session; access_token: AccessToken }>('/sessions/create/', {
      payment_id: paymentId,
      mac_address: macAddress,
    });
  },

  async connectWithToken(
    code: string,
    macAddress?: string
  ): Promise<ApiResponse<{ session: Session; access_token: AccessToken }>> {
    return this.post<{ session: Session; access_token: AccessToken }>('/sessions/token/connect/', {
      code,
      mac_address: macAddress,
    });
  },

  async getCurrentSession(): Promise<ApiResponse<Session>> {
    return this.get<Session>('/sessions/current/');
  },

  async getSessionHistory(): Promise<ApiResponse<{ sessions: Session[]; count: number }>> {
    return this.get<{ sessions: Session[]; count: number }>('/sessions/history/');
  },

  async terminateSession(sessionId: string): Promise<ApiResponse<{ session: Session }>> {
    return this.post<{ session: Session }>(`/sessions/${sessionId}/terminate/`);
  },

  /* Admin Dashboard */

  async getAdminMetrics(): Promise<ApiResponse<{ metrics: import('@/types').AdminMetrics }>> {
    return this.get<{ metrics: import('@/types').AdminMetrics }>('/admin/metrics/');
  },

  async generateVoucher(
    planId: string,
    phoneNumber?: string
  ): Promise<ApiResponse<{ access_token: AccessToken; message: string }>> {
    return this.post<{ access_token: AccessToken; message: string }>('/admin/vouchers/generate/', {
      plan_id: planId,
      phone_number: phoneNumber,
    });
  },

  async getAllSessions(): Promise<ApiResponse<{ sessions: Session[]; count: number }>> {
    return this.get<{ sessions: Session[]; count: number }>('/admin/sessions/');
  },

  /* Helpers */

  isAuthenticated(): boolean {
    return getStoredToken() !== null;
  },

  getToken(): string | null {
    return getStoredToken();
  },

  /**
   * Resolve (or auto-create) a portal user derived from a phone number.
   * Login is attempted first, falling back to registration.
   */
  async ensurePortalUser(
    phoneNumber: string
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    const digits = phoneNumber.replace(/\D/g, '');
    const suffix = digits.slice(-9) || Date.now().toString();
    const username = `portal_${suffix}`;
    const password = `portal-${suffix}`;

    const loginResult = await this.login(username, password);
    if (loginResult.data) return loginResult;

    return this.register(username, password, phoneNumber);
  },
};

