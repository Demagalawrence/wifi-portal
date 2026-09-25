'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CurrencyDollarIcon,
  WifiIcon,
  UserGroupIcon,
  TicketIcon,
  CreditCardIcon,
  ArrowLeftIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '@/services/api';
import type { AdminMetrics, Session, Plan } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState('24-hours');
  const [generatedVoucher, setGeneratedVoucher] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [metricsRes, sessionsRes, plansRes] = await Promise.all([
        apiService.getAdminMetrics(),
        apiService.getAllSessions(),
        apiService.getPlans(),
      ]);

      if (metricsRes.data?.metrics) {
        setMetrics(metricsRes.data.metrics);
      }
      if (sessionsRes.data?.sessions) {
        setSessions(sessionsRes.data.sessions);
      }
      if (plansRes.data?.plans) {
        setPlans(plansRes.data.plans);
      }
    } catch (err) {
      console.error('Failed to load admin metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const result = await apiService.getUserStatus();
        if (result.error || result.data?.user?.role !== 'admin') {
          router.replace('/admin/login');
          return;
        }
        setCheckingAuth(false);
        fetchDashboardData();
      } catch {
        router.replace('/admin/login');
      }
    };
    checkAdmin();
  }, [router]);

  const handleGenerateVoucher = async () => {
    setGenerating(true);
    setCopied(false);
    try {
      const res = await apiService.generateVoucher(selectedPlanId);
      if (res.data?.access_token?.code) {
        setGeneratedVoucher(res.data.access_token.code);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to generate voucher', err);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Admin Header */}
      <header className="app-header">
        <div className="container header-content">
          <div className="flex items-center gap-4">
            <Link href="/" className="nav-btn text-muted hover:text-primary">
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back to Portal</span>
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <h1 className="text-xl font-bold text-gradient">Admin Gateway</h1>
          </div>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="nav-btn text-xs hover:text-primary cursor-pointer"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="container flex-1 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Title */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Netify Management</h2>
              <p className="text-secondary text-sm mt-1">
                Real-time dashboard for metrics, session monitoring, and voucher generation.
              </p>
            </div>
            <div className="pulse-indicator">
              <span />
              <div className="pulse-dot" />
            </div>
          </div>

          {checkingAuth || (loading && !metrics) ? (
            <div className="glass-panel p-12 text-center">
              <LoadingSpinner size="large" />
              <p className="text-secondary mt-4">
                {checkingAuth ? 'Verifying admin access...' : 'Loading system analytics...'}
              </p>
            </div>
          ) : (
            <>
              {/* Stat Cards Grid */}
              <div className="admin-grid">
                <div className="stat-card">
                  <div className="stat-icon text-emerald-400 bg-emerald-500/10">
                    <CurrencyDollarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="stat-val text-emerald-400">
                      KES {(metrics?.total_revenue ?? 0).toLocaleString()}
                    </div>
                    <div className="stat-lbl">Total Revenue</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon text-cyan-400 bg-cyan-500/10">
                    <WifiIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="stat-val text-cyan-400">{metrics?.active_sessions ?? 0}</div>
                    <div className="stat-lbl">Active Sessions</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon text-amber-400 bg-amber-500/10">
                    <UserGroupIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="stat-val text-amber-400">{metrics?.total_users ?? 0}</div>
                    <div className="stat-lbl">Total Users</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon text-purple-400 bg-purple-500/10">
                    <TicketIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="stat-val text-purple-400">{metrics?.active_vouchers ?? 0}</div>
                    <div className="stat-lbl">Active Vouchers</div>
                  </div>
                </div>
              </div>

              {/* Voucher Generator Tool */}
              <div className="glass-panel p-6 mb-8 border-primary/20 bg-primary/5">
                <div className="flex items-center gap-3 mb-4">
                  <SparklesIcon className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold">Generate Access Voucher</h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 form-group mb-0 w-full">
                    <label htmlFor="plan-select" className="form-label">
                      Select WiFi Plan
                    </label>
                    <select
                      id="plan-select"
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="form-input bg-slate-900 border-white/10"
                      style={{ paddingLeft: '1rem' }}
                    >
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} ({plan.duration_display || plan.duration}) - KES {plan.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateVoucher}
                    disabled={generating}
                    className="btn btn-primary w-full sm:w-auto px-6"
                  >
                    {generating ? (
                      <>
                        <LoadingSpinner size="small" />
                        Generating...
                      </>
                    ) : (
                      'Generate Code'
                    )}
                  </button>
                </div>

                {generatedVoucher && (
                  <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-primary/30 flex items-center justify-between animate-fade-in">
                    <div>
                      <div className="text-xs text-muted">New Access Voucher Code:</div>
                      <div className="text-2xl font-mono font-bold text-primary tracking-widest mt-1">
                        {generatedVoucher}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedVoucher)}
                      className="btn btn-outline text-xs px-4 py-2 cursor-pointer"
                      style={{ width: 'auto' }}
                    >
                      {copied ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircleIcon className="w-4 h-4" /> Copied!
                        </span>
                      ) : (
                        'Copy Code'
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Sessions Overview Table */}
              <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <CreditCardIcon className="w-5 h-5 text-primary" />
                    WiFi Sessions & Device Connections
                  </h3>
                  <span className="text-xs text-muted">{sessions.length} recorded</span>
                </div>

                {sessions.length === 0 ? (
                  <p className="text-secondary text-sm text-center py-8">No sessions recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-muted">
                          <th className="pb-3 font-medium">User</th>
                          <th className="pb-3 font-medium">Plan</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">MAC Address</th>
                          <th className="pb-3 font-medium">Remaining / Start</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {sessions.map((s) => (
                          <tr key={s.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 font-medium text-primary">{s.user_username}</td>
                            <td className="py-3 text-secondary">{s.plan_name}</td>
                            <td className="py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  s.is_active || s.status === 'active'
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'bg-slate-500/15 text-slate-400'
                                }`}
                              >
                                {s.status}
                              </span>
                            </td>
                            <td className="py-3 text-mono text-muted font-mono text-xs">
                              {s.mac_address || 'Unassigned'}
                            </td>
                            <td className="py-3 text-xs text-secondary">
                              {s.is_active ? (
                                <span className="font-mono text-emerald-400">
                                  {s.time_remaining}
                                </span>
                              ) : (
                                new Date(s.start_time).toLocaleString()
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Admin Footer */}
      <footer className="app-footer">
        <div className="container">
          <p className="text-muted text-xs">
            Admin Gateway • NestJS API Backend (`/api/admin/*`) & Next.js 15
          </p>
        </div>
      </footer>
    </div>
  );
}
