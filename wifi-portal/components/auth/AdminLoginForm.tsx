'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import { apiService } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/** Admin username/password login form for the admin gateway. */
export default function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);

    if (!username.trim() || !password) {
      setError('Username and password are required');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.login(username.trim(), password);
      if (result.error) {
        setError(result.error);
        return;
      }

      const role = result.data?.user?.role;
      if (role !== 'admin') {
        setError('This account does not have admin privileges.');
        return;
      }

      router.replace('/admin');
    } catch {
      setError('Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="glass-panel p-8" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col items-center gap-2 mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <LockClosedIcon className="w-6 h-6 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gradient">Admin Sign In</h1>
        <p className="text-secondary text-sm">
          Enter your admin credentials to manage the hotspot.
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="admin-username" className="form-label">
          Username
        </label>
        <div className="form-input-wrapper">
          <UserIcon className="form-icon" aria-hidden="true" />
          <input
            id="admin-username"
            type="text"
            autoComplete="username"
            spellCheck={false}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(undefined);
            }}
            className={`form-input ${error ? 'error' : ''}`}
            placeholder="admin"
            aria-invalid={error ? true : undefined}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="admin-password" className="form-label">
          Password
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
              setError(undefined);
            }}
            className={`form-input ${error ? 'error' : ''}`}
            placeholder="••••••••"
            aria-invalid={error ? true : undefined}
          />
        </div>
      </div>

      {error && (
        <span className="error-text" role="alert">
          {error}
        </span>
      )}

      <button type="submit" disabled={isLoading} className="btn btn-secondary mt-4 w-full">
        {isLoading ? (
          <>
            <LoadingSpinner size="small" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}
