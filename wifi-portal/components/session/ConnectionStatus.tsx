'use client';

import {
  WifiIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { useSession } from '@/context/SessionContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/** Live active WiFi session status card. */
export default function ConnectionStatus() {
  const { state, actions } = useSession();
  const { connectionStatus, userSession, remainingTime } = state;

  if (connectionStatus === 'disconnected' && !userSession) return null;

  if (connectionStatus === 'connecting') {
    return (
      <div className="status-alert connecting animate-fade-in mb-6" role="status" aria-live="polite">
        <LoadingSpinner size="small" />
        <div className="status-content">
          <div className="status-title">Authenticating WiFi Connection...</div>
          <div className="status-desc">Registering MAC address with gateway</div>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'connected' && userSession) {
    const formattedRemaining = actions.formatTimeRemaining(remainingTime);

    return (
      <div className="glass-panel p-6 mb-8 border-emerald-500/30 bg-emerald-950/20 animate-fade-in">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <WifiIcon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-emerald-400">WiFi Session Active</span>
                <div className="pulse-indicator">
                  <span />
                  <div className="pulse-dot" />
                </div>
              </div>
              <p className="text-xs text-secondary">
                User: <span className="text-primary font-medium">{userSession.username}</span> • Plan: {userSession.plan.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={actions.handleDisconnect}
            className="btn btn-outline text-xs px-3 py-1.5 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 cursor-pointer"
            style={{ width: 'auto' }}
          >
            <XMarkIcon className="w-4 h-4 mr-1" />
            Disconnect
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <ClockIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-muted">Time Remaining</div>
              <div className="text-base font-bold font-mono text-cyan-400">{formattedRemaining}</div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ArrowDownTrayIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-muted">Data Usage</div>
              <div className="text-base font-bold font-mono text-amber-400">
                {userSession.dataUsed.toFixed(1)} MB / Unlimited
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <SignalIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-muted">Signal Strength</div>
              <div className="text-base font-bold text-emerald-400">Excellent (5G Gateway)</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
