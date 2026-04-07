'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Building2,
  HardHat,
  Truck,
  Hospital,
  Factory,
  Hotel,
  Store,
  Briefcase,
} from 'lucide-react';
import { INDUSTRY_OPTIONS } from '@/lib/constants/industries';
import type { Industry } from '@/types';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  HardHat,
  Truck,
  Hospital,
  Factory,
  Hotel,
  Store,
  Briefcase,
};

interface StepIndustryProps {
  selected: Industry | null;
  onNext: (industry: Industry) => void;
  onSkip: () => void;
  saving: boolean;
}

export function StepIndustry({ selected, onNext, onSkip, saving }: StepIndustryProps) {
  const [industry, setIndustry] = useState<Industry | null>(selected);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!industry) return;
    onNext(industry);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome to SmartCOI
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What industry are you in? This helps us tailor the experience for you.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {INDUSTRY_OPTIONS.map((option) => {
          const Icon = ICON_MAP[option.icon];
          const isSelected = industry === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setIndustry(option.value)}
              className={`flex flex-col items-center gap-2.5 rounded-xl border-2 bg-white p-5 transition-all ${
                isSelected
                  ? 'border-brand bg-emerald-50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Icon
                className={`h-7 w-7 ${
                  isSelected ? 'text-emerald-600' : 'text-slate-500'
                }`}
              />
              <span
                className={`text-sm font-medium text-center leading-tight ${
                  isSelected ? 'text-emerald-800' : 'text-foreground'
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          size="lg"
          className="w-full font-semibold"
          disabled={saving || !industry}
        >
          {saving ? 'Saving...' : 'Continue'}
        </Button>
        <button
          type="button"
          onClick={onSkip}
          className="text-center text-sm text-muted-foreground hover:text-foreground"
          disabled={saving}
        >
          Skip to Dashboard
        </button>
      </div>
    </form>
  );
}
