'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ACCESS_TOKEN_PATTERN,
  WARNING_1_MIN_MS,
  WARNING_5_MIN_MS,
} from '@/lib/constants';
import {
  formatApiError,
  formatTimeRemaining,
  getDeviceMacAddress,
  getDurationInMs,
  isValidPhoneNumber,
  mapApiSessionToUserSession,
  normalizePhoneNumber,
} from '@/lib/utils';
import { apiService } from '@/services/api';
import type {
  ConnectionStatus,
  FormErrors,
  PaymentMethodType,
  Plan,
  SessionActions,
  SessionState,
  UserSession,
} from '@/types';

/**
 * Business logic for the WiFi portal.
 *
 * Returns a single `{ state, actions }` bundle consumed by `SessionProvider`.
 * All API communication flows through `apiService`.
 */
export function useWifiSession(): { state: SessionState; actions: SessionActions } {
  const [token, setToken] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [planLoadError, setPlanLoadError] = useState<string | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [remainingTime, setRemainingTime] = useState(0);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPlans = async () => {
      setIsLoadingPlans(true);
      setPlanLoadError(undefined);

      const result = await apiService.getPlans();
      if (!isMounted) return;

      if (result.data) {
        setPlans(result.data.plans);
      } else {
        setPlanLoadError(formatApiError('Could not load plans from the backend.', result.error));
      }

      setIsLoadingPlans(false);
    };

    loadPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDisconnect = useCallback(() => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }

    if (userSession?.apiSessionId) {
      apiService.terminateSession(userSession.apiSessionId).catch(() => {
        toast.error('Could not terminate the backend session.');
      });
    }

    setUserSession(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setToken('');
    setRemainingTime(0);
    toast.success('Disconnected from WiFi');
  }, [userSession]);

  useEffect(() => {
    if (!userSession || !userSession.isActive) return undefined;

    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }

    const updateRemainingTime = () => {
      const remaining = userSession.endTime.getTime() - Date.now();

      if (remaining <= 0) {
        handleDisconnect();
        toast.error('Your session has expired. Please purchase a new plan to continue.');
        return;
      }

      setRemainingTime(remaining);

      if (remaining <= WARNING_5_MIN_MS && remaining > WARNING_5_MIN_MS - 30_000) {
        toast('Your session will expire in 5 minutes.', {
          icon: '!',
          duration: 5000,
        });
      }

      if (remaining <= WARNING_1_MIN_MS && remaining > WARNING_1_MIN_MS - 10_000) {
        toast('Your session will expire in 1 minute.', {
          icon: '!',
          duration: 5000,
        });
      }
    };

    updateRemainingTime();
    sessionTimerRef.current = setInterval(updateRemainingTime, 1000);

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [userSession, handleDisconnect]);

  const validateTokenForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!token.trim()) {
      newErrors.username = 'Token is required';
    } else if (!ACCESS_TOKEN_PATTERN.test(token.trim())) {
      newErrors.username = 'Invalid token format. Token must be in format: WIFI-XXXXX-XXXXX';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePaymentForm = (): boolean => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return false;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return false;
    }

    if (!phoneNumber.trim()) {
      setErrors((current) => ({ ...current, phoneNumber: 'Phone number is required' }));
      toast.error('Please enter your phone number');
      return false;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      const phoneError = 'Please enter a valid phone number, including country code if needed';
      setErrors((current) => ({ ...current, phoneNumber: phoneError }));
      toast.error(phoneError);
      return false;
    }

    setErrors((current) => ({ ...current, phoneNumber: undefined }));
    return true;
  };

  const handleConnect = async () => {
    if (!validateTokenForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);
    setConnectionStatus('connecting');

    try {
      const macAddress = getDeviceMacAddress();
      const currentSession = await apiService.connectWithToken(token.trim().toUpperCase(), macAddress);

      if (!currentSession.data) {
        throw new Error(formatApiError('No active paid session was found for this token.', currentSession.error));
      }

      const session = mapApiSessionToUserSession(currentSession.data.session);
      setToken(currentSession.data.access_token.code);
      setUserSession(session);
      setIsConnected(true);
      setConnectionStatus('connected');
      toast.success('Connected to your WiFi session.');
    } catch (error) {
      setConnectionStatus('error');
      toast.error(error instanceof Error ? error.message : 'Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePay = (plan: Plan) => {
    setSelectedPlan(plan);
    toast.success(`Selected ${plan.name} plan`);
  };

  const handlePayment = async () => {
    if (!validatePaymentForm() || !selectedPlan || !paymentMethod) {
      return;
    }

    setIsLoading(true);

    try {
      const account = await apiService.ensurePortalUser(phoneNumber);
      if (!account.data) {
        throw new Error(formatApiError('Could not create or login the portal user.', account.error));
      }

      const initiated = await apiService.initiatePayment(
        selectedPlan.id,
        paymentMethod,
        normalizePhoneNumber(phoneNumber)
      );
      if (!initiated.data) {
        throw new Error(formatApiError('Payment initiation failed.', initiated.error));
      }

      let payment = initiated.data.payment;

      if (payment.status !== 'completed') {
        const simulated = await apiService.simulatePayment(payment.id);
        if (!simulated.data) {
          throw new Error(formatApiError('Payment is waiting for provider confirmation.', simulated.error));
        }
        payment = simulated.data.payment;
      }

      const macAddress = getDeviceMacAddress();
      const sessionResult = await apiService.createSession(payment.id, macAddress);
      if (!sessionResult.data) {
        throw new Error(formatApiError('Could not create WiFi session.', sessionResult.error));
      }

      const session = mapApiSessionToUserSession(sessionResult.data.session, selectedPlan, macAddress);

      setToken(sessionResult.data.access_token.code);
      setUserSession(session);
      setIsConnected(true);
      setConnectionStatus('connected');
      setRemainingTime(session.endTime.getTime() - Date.now());
      toast.success(`Payment confirmed. Access code: ${sessionResult.data.access_token.code}`);
    } catch (error) {
      setConnectionStatus('error');
      toast.error(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateDeviceRestrictions = (session: UserSession, currentMAC: string): boolean => {
    if (session.macAddress && session.macAddress !== currentMAC) {
      toast.error('Device not authorized. This session is registered to a different device.');
      return false;
    }

    return true;
  };

  return {
    state: {
      username: token,
      plans,
      selectedPlan,
      paymentMethod,
      phoneNumber,
      isLoading,
      isLoadingPlans,
      planLoadError,
      isConnected,
      userSession,
      errors,
      connectionStatus,
      remainingTime,
    },
    actions: {
      setUsername: setToken,
      setSelectedPlan,
      setPaymentMethod,
      setPhoneNumber,
      setErrors,
      handleConnect,
      handlePay,
      handleDisconnect,
      handlePayment,
      formatTimeRemaining,
      validateDeviceRestrictions,
      getDurationInMs,
    },
  };
}
