'use client';

import { useState } from 'react';
import { useSession } from '@/context/SessionContext';
import Layout from '@/components/layout/Layout';
import LoginForm from '@/components/auth/LoginForm';
import PlanList from '@/components/plans/PlanList';
import PaymentForm from '@/components/payment/PaymentForm';
import ConnectionStatus from '@/components/session/ConnectionStatus';
import VoucherForm from '@/components/voucher/VoucherForm';

/**
 * Client entry point for the WiFi captive portal.
 *
 * Provides tabbed navigation between purchasing packages and redeeming access vouchers.
 */
export default function Portal() {
  const { state } = useSession();
  const [activeTab, setActiveTab] = useState<'plans' | 'voucher'>('plans');

  return (
    <Layout>
      <ConnectionStatus />

      {!state.isConnected && !state.userSession && (
        <>
          <LoginForm />

          {!state.selectedPlan && (
            <div className="tabs-header">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
                onClick={() => setActiveTab('plans')}
              >
                Buy WiFi Package
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'voucher' ? 'active' : ''}`}
                onClick={() => setActiveTab('voucher')}
              >
                Redeem Voucher Code
              </button>
            </div>
          )}

          {activeTab === 'plans' && !state.selectedPlan && <PlanList />}
          {activeTab === 'plans' && state.selectedPlan && <PaymentForm />}
          {activeTab === 'voucher' && <VoucherForm />}
        </>
      )}
    </Layout>
  );
}
