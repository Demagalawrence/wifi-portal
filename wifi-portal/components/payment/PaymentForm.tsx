'use client';

import type { FormEvent } from 'react';
import { PhoneIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { useSession } from '@/context/SessionContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/** Payment form: M-Pesa / Airtel / MTN provider selection + phone number. */
export default function PaymentForm() {
  const { state, actions } = useSession();
  const { selectedPlan, paymentMethod, phoneNumber, isLoading, errors } = state;
  const error = errors.phoneNumber;

  if (!selectedPlan) return null;

  const formattedPrice = Number(selectedPlan.price).toLocaleString();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    actions.handlePayment();
  };

  return (
    <form className="glass-panel p-8 mb-6 animate-fade-in" onSubmit={handleSubmit} noValidate>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Complete Payment</h2>
          <p className="text-sm text-secondary">
            Selected: <span className="text-primary font-medium">{selectedPlan.name}</span> ({selectedPlan.duration_display || selectedPlan.duration})
          </p>
        </div>
        <button
          type="button"
          onClick={() => actions.setSelectedPlan(null)}
          className="text-sm text-muted hover:text-primary transition-colors cursor-pointer"
        >
          Change Plan
        </button>
      </div>

      <fieldset className="mb-6">
        <legend className="form-label">Select Payment Provider</legend>
        <div className="payment-grid-3">
          <button
            type="button"
            onClick={() => actions.setPaymentMethod('mpesa')}
            className={`btn btn-mpesa ${paymentMethod === 'mpesa' ? 'selected' : ''}`}
            aria-pressed={paymentMethod === 'mpesa'}
          >
            M-Pesa
          </button>
          <button
            type="button"
            onClick={() => actions.setPaymentMethod('airtel')}
            className={`btn btn-airtel ${paymentMethod === 'airtel' ? 'selected' : ''}`}
            aria-pressed={paymentMethod === 'airtel'}
          >
            Airtel Money
          </button>
          <button
            type="button"
            onClick={() => actions.setPaymentMethod('mtn')}
            className={`btn btn-mtn ${paymentMethod === 'mtn' ? 'selected' : ''}`}
            aria-pressed={paymentMethod === 'mtn'}
          >
            MTN Mobile
          </button>
        </div>
      </fieldset>

      <div className="form-group mb-6">
        <label htmlFor="phone-number" className="form-label">
          Mobile Money Phone Number
        </label>
        <div className="form-input-wrapper">
          <PhoneIcon className="form-icon" aria-hidden="true" />
          <input
            id="phone-number"
            type="tel"
            value={phoneNumber}
            onChange={(e) => {
              actions.setPhoneNumber(e.target.value);
              if (error) actions.setErrors({ ...errors, phoneNumber: undefined });
            }}
            className={`form-input ${error ? 'error' : ''}`}
            placeholder="e.g. 0712345678"
            autoComplete="tel"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'phone-number-error' : undefined}
          />
        </div>
        {error && (
          <span id="phone-number-error" className="error-text" role="alert">
            {error}
          </span>
        )}
      </div>

      <div className="p-4 mb-6 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-secondary flex items-start gap-3">
        <DevicePhoneMobileIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-primary mb-1">Instant STK Push Prompt</p>
          <p>
            A payment prompt will be sent to your phone. Enter your Mobile Money PIN to activate your WiFi session instantly.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !paymentMethod || !phoneNumber}
        className="btn btn-primary"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="small" />
            Sending Payment Prompt...
          </>
        ) : (
          `Pay KES ${formattedPrice}/- & Connect`
        )}
      </button>
    </form>
  );
}
