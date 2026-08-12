'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { KeyIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { ADMIN_LOGIN_KEYWORD } from '@/lib/constants';
import { useSession } from '@/context/SessionContext';
import { apiService } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/**
 * WiFi access code entry form for the public portal.
 *
 * Regular users enter a WIFI token to connect. Typing the secret admin
 * keyword reveals the password field so staff can sign in to the gateway.
 */
export default function LoginForm() {
  const { state, actions } = useSession();
  const router = useRouter();
  const error = state.errors.username;

  const [password, setPassword] = useState('');
  const [adminError, setAdminError] = useState<string | undefined>();
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const isAdminMode =
    state.username.trim().toLowerCase() === ADMIN_LOGIN_KEYWORD.toLowerCase();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isAdminMode) {
      setAdminError(undefined);
      if (!password) {
        setAdminError('Enter the admin password to continue');
        return;
      }

      setIsAdminLoading(true);
      try {
        const result = await apiService.login(ADMIN_LOGIN_KEYWORD, password);
        if (result.error) {
          setAdminError(result.error);
          return;
        }
        if (result.data?.user?.role !== 'admin') {
          setAdminError('This account does not have admin privileges.');
          return;
        }
        router.push('/admin');
      } catch {
        setAdminError('Unable to sign in. Please try again.');
      } finally {
        setIsAdminLoading(false);
      }
      return;
    }

    actions.handleConnect();
  };

  const handleInputChange = (value: string) => {
    actions.setUsername(value);
    if (error) actions.setErrors({ ...state.errors, username: undefined });
    setAdminError(undefined);
  };

  return (
    <form className="glass-panel p-8 mb-6" onSubmit={handleSubmit} noValidate>
      <h1 className="text-3xl text-center mb-8">Get Connected</h1>

      <div className="form-group">
        <label htmlFor="access-token" className="form-label">
          Token Number
        </label>
        <div className="form-input-wrapper">
          <KeyIcon className="form-icon" aria-hidden="true" />
          <input
            id="access-token"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={state.username}
            onChange={(e) => handleInputChange(e.target.value)}
            className={`form-input ${error ? 'error' : ''}`}
            placeholder="WIFI-XXXXX-XXXXX"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'access-token-error' : undefined}
          />
        </div>
        {error && (
          <span id="access-token-error" className="error-text" role="alert">
            {error}
          </span>
        )}
      </div>

      {isAdminMode && (
        <div className="form-group animate-fade-in">
          <label htmlFor="admin-password" className="form-label">
            Admin Password
          </label>
          <div className="form-input-wrapper">
            <LockClosedIcon className="form-icon" aria-hidden="true" />
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setAdminError(undefined);
              }}
              className={`form-input ${adminError ? 'error' : ''}`}
              placeholder="••••••••"
              aria-invalid={adminError ? true : undefined}
            />
          </div>
          {adminError && (
            <span className="error-text" role="alert">
              {adminError}
            </span>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={state.isLoading || isAdminLoading}
        className="btn btn-secondary mt-4"
      >
        {state.isLoading || isAdminLoading ? (
          <>
            <LoadingSpinner size="small" />
            {isAdminMode ? 'Signing in...' : 'Connecting...'}
          </>
        ) : isAdminMode ? (
          'Sign In'
        ) : (
          'Connect'
        )}
      </button>
    </form>
  );
}
