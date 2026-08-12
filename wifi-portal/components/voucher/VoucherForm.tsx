'use client';

import { useState, FormEvent } from 'react';
import { TicketIcon, WifiIcon } from '@heroicons/react/24/outline';
import { apiService } from '@/services/api';
import { useSession } from '@/context/SessionContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function VoucherForm() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { actions } = useSession();

  const handleConnectWithToken = async (e: FormEvent) => {
    e.preventDefault();
    const formattedCode = code.trim().toUpperCase();
    if (!formattedCode) {
      setError('Please enter a voucher access code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.connectWithToken(formattedCode);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        await actions.handleConnect();
      }
    } catch {
      setError('Failed to connect with voucher code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="glass-panel p-8 mb-6 animate-fade-in" onSubmit={handleConnectWithToken}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <TicketIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Redeem WiFi Voucher</h2>
          <p className="text-sm text-secondary">Enter your 15-character access token (e.g. WIFI-XXXXX-XXXXX)</p>
        </div>
      </div>

      <div className="form-group mb-6">
        <label htmlFor="voucher-code" className="form-label">
          Access Code / Voucher
        </label>
        <div className="form-input-wrapper">
          <TicketIcon className="form-icon" aria-hidden="true" />
          <input
            id="voucher-code"
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            className={`form-input font-mono uppercase tracking-wider ${error ? 'error' : ''}`}
            placeholder="WIFI-XXXXX-XXXXX"
            autoCapitalize="characters"
          />
        </div>
        {error && <span className="error-text">{error}</span>}
      </div>

      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="btn btn-secondary"
      >
        {loading ? (
          <>
            <LoadingSpinner size="small" />
            Validating Token...
          </>
        ) : (
          <>
            <WifiIcon className="w-5 h-5" />
            Connect via Voucher
          </>
        )}
      </button>
    </form>
  );
}
