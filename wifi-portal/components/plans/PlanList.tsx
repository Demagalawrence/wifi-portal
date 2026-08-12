'use client';

import { useSession } from '@/context/SessionContext';
import PlanCard from './PlanCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/** List of available WiFi plans. */
export default function PlanList() {
  const { state, actions } = useSession();
  const { plans, selectedPlan, isLoadingPlans, planLoadError } = state;

  return (
    <section className="glass-panel p-8 mb-6" aria-labelledby="plans-heading">
      <h2 id="plans-heading" className="text-2xl text-center mb-6">
        Choose a Plan
      </h2>

      {isLoadingPlans && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {!isLoadingPlans && planLoadError && (
        <p className="error-text text-center" role="alert">
          {planLoadError}
        </p>
      )}

      {!isLoadingPlans && !planLoadError && plans.length === 0 && (
        <p className="text-secondary text-center">No active plans are available.</p>
      )}

      <div className="plans-grid">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlan?.id === plan.id}
            onSelect={actions.handlePay}
          />
        ))}
      </div>
    </section>
  );
}
