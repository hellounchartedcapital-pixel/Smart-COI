'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const TUTORIAL_KEY = 'smartcoi_has_seen_tutorial';

interface TutorialStep {
  target: string; // data-tutorial attribute value
  title: string;
  description: string;
}

const STEPS: TutorialStep[] = [
  {
    target: 'dashboard-overview',
    title: 'Portfolio Health',
    description:
      'Your overall compliance rate across all properties. Click the status pills to filter the action queue below.',
  },
  {
    target: 'properties-section',
    title: 'Properties',
    description:
      'See compliance status at a glance for each property. Click any property card to view its vendors, tenants, and certificates.',
  },
  {
    target: 'action-queue',
    title: 'Action Queue',
    description:
      'Your daily to-do list — everything that needs attention. Request updated COIs or upload new ones directly from here.',
  },
  {
    target: 'activity-feed',
    title: 'Activity Feed',
    description:
      'See what\u2019s happening automatically in the background — uploads, compliance checks, notifications sent, and more.',
  },
  {
    target: 'upload-coi',
    title: 'Upload COI',
    description:
      'Add new certificates of insurance here. Upload for an existing vendor or tenant, create a new one, or bulk upload multiple COIs at once.',
  },
];

export function useTutorial() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TUTORIAL_KEY)) {
        setShow(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const startTutorial = useCallback(() => setShow(true), []);
  const closeTutorial = useCallback(() => {
    setShow(false);
    try {
      localStorage.setItem(TUTORIAL_KEY, '1');
    } catch {
      // ignore
    }
  }, []);

  return { showTutorial: show, startTutorial, closeTutorial };
}

interface DashboardTutorialProps {
  active: boolean;
  onClose: () => void;
}

export function DashboardTutorial({ active, onClose }: DashboardTutorialProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (active) setStep(0);
  }, [active]);

  if (!active) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function handleNext() {
    if (isLast) {
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  }

  function handlePrev() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <TutorialOverlay
      step={step}
      totalSteps={STEPS.length}
      target={current.target}
      title={current.title}
      description={current.description}
      isLast={isLast}
      onNext={handleNext}
      onPrev={handlePrev}
      onClose={onClose}
    />
  );
}

function TutorialOverlay({
  step,
  totalSteps,
  target,
  title,
  description,
  isLast,
  onNext,
  onPrev,
  onClose,
}: {
  step: number;
  totalSteps: number;
  target: string;
  title: string;
  description: string;
  isLast: boolean;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    let cancelled = false;

    const el = document.querySelector(`[data-tutorial="${target}"]`);
    if (!el) {
      // Fallback: center tooltip on screen (e.g. "finish" step)
      setSpotlightStyle({ display: 'none' });
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10002,
      });
      setReady(true);
      return;
    }

    // Scroll the element into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Wait 500ms for scroll to settle, then measure
    const timer = setTimeout(() => {
      if (cancelled) return;
      positionFromElement(el);
      setReady(true);
    }, 500);

    function positionFromElement(element: Element) {
      const rect = element.getBoundingClientRect();
      const pad = 8;
      setSpotlightStyle({
        position: 'fixed',
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        borderRadius: '8px',
      });

      // Determine if element is in the sidebar (left side, narrow)
      const isSidebarElement = rect.left < 250 && rect.width < 250;

      if (isSidebarElement) {
        setTooltipStyle({
          position: 'fixed',
          top: Math.max(16, Math.min(rect.top, window.innerHeight - 250)),
          left: rect.right + pad + 12,
          zIndex: 10002,
        });
      } else {
        const tooltipTop = rect.bottom + pad + 12;
        setTooltipStyle({
          position: 'fixed',
          top: tooltipTop > window.innerHeight - 200 ? rect.top - 200 : tooltipTop,
          left: Math.max(16, Math.min(rect.left, window.innerWidth - 360)),
          zIndex: 10002,
        });
      }
    }

    function handleResize() {
      const el2 = document.querySelector(`[data-tutorial="${target}"]`);
      if (el2) positionFromElement(el2);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [target, step]);

  return (
    <>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 z-[10000] bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Spotlight cutout */}
      <div
        className="fixed z-[10001] ring-[9999px] ring-black/50 transition-all duration-300"
        style={spotlightStyle}
      />

      {/* Tooltip card */}
      <div
        className={`z-[10002] w-[340px] rounded-lg border border-slate-200 bg-white p-5 shadow-xl transition-opacity duration-200 ${ready ? 'opacity-100' : 'opacity-0'}`}
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {step + 1} of {totalSteps}
            </p>
            <h3 className="mt-1 text-sm font-semibold text-foreground">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === step ? 'bg-brand' : 'bg-slate-200'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onPrev}>
                Back
              </Button>
            )}
            <Button size="sm" className="h-7 text-xs" onClick={onNext}>
              {isLast ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
