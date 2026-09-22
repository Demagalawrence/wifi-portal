'use client';

import type { KeyboardEvent, MouseEvent } from 'react';
import type { Plan } from '@/types';

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  onSelect: (plan: Plan) => void;
}

/** Individual plan selection card. */
export default function PlanCard({ plan, isSelected, onSelect }: PlanCardProps) {
  const formattedPrice = Number(plan.price).toLocaleString();
  const duration = plan.duration_display || plan.duration || plan.name;

  const select = () => onSelect(plan);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      select();
    }
  };

  const handleButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    select();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${plan.name} plan, ${formattedPrice} francs`}
      className={`plan-card ${isSelected ? 'selected' : ''}`}
      onClick={select}
      onKeyDown={handleKeyDown}
    >
      <div className="plan-header">
        <div className="plan-title-row">
          <span className="plan-name">{plan.name}</span>
          <span className="plan-price">{formattedPrice}/-</span>
        </div>
        {duration !== plan.name && (
          <span className="plan-duration text-sm">{duration}</span>
        )}

        <button
          type="button"
          className={`btn plan-pay-btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
          onClick={handleButtonClick}
          aria-label={`Pay for ${plan.name} plan`}
        >
          Pay
        </button>
      </div>
    </div>
  );
}
