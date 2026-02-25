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
    title: 'This is your Dashboard',
    description:
      'It shows your portfolio compliance at a glance. Properties with issues appear in the priority queue below.',
  },
  {
    target: 'nav-properties',
    title: 'Properties',
    description:
      'Each property contains your vendors and tenants. Click into a property to manage its entities.',
  },
  {
    target: 'upload-coi',
    title: 'Upload COIs',
    description:
      "Upload a single COI or use Bulk Upload to process your entire vendor portfolio at once. Our AI extracts coverage data and checks it against your requirements.",
  },
  {
    target: 'nav-templates',
    title: 'Templates',
    description:
      'Set up compliance requirement templates to define what coverage each vendor or tenant needs.',
  },
  {
    target: 'nav-notifications',
    title: 'Notifications',
    description:
      'SmartCOI automatically tracks expirations and sends follow-up emails to vendors with gaps.',
  },
  {
    target: 'tutorial-finish',
    title: "You're ready!",
    description:
      'Start by adding your properties and uploading your first COI. Need help? Contact support@smartcoi.io',
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

  useEffect(() => {
    function positionElements() {
      const el = document.querySelector(`[data-tutorial="${target}"]`);
      if (el) {
        // Scroll element into view if needed
        el.scrollIntoView({ behavior: 'instant', block: 'nearest' });

        // Wait a frame for scroll to settle, then measure
        requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const pad = 8;
          setSpotlightStyle({
            position: 'fixed',
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            borderRadius: '8px',
          });

          // Determine if element is in the sidebar (left side of viewport)
          const isSidebarElement = rect.left < 250 && rect.width < 250;

          if (isSidebarElement) {
            // Position tooltip to the right of sidebar elements
            const tooltipLeft = rect.right + pad + 12;
            const tooltipTop = Math.max(16, Math.min(rect.top, window.innerHeight - 250));
            setTooltipStyle({
              position: 'fixed',
              top: tooltipTop,
              left: tooltipLeft,
              zIndex: 10002,
            });
          } else {
            // Position tooltip below the element
            const tooltipTop = rect.bottom + pad + 12;
            const tooltipLeft = Math.max(16, Math.min(rect.left, window.innerWidth - 360));
            setTooltipStyle({
              position: 'fixed',
              top: tooltipTop > window.innerHeight - 200 ? rect.top - 200 : tooltipTop,
              left: tooltipLeft,
              zIndex: 10002,
            });
          }
        });
      } else {
        // Fallback: center on screen (e.g. for "finish" step)
        setSpotlightStyle({ display: 'none' });
        setTooltipStyle({
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10002,
        });
      }
    }

    positionElements();

    // Recalculate on resize
    window.addEventListener('resize', positionElements);
    return () => window.removeEventListener('resize', positionElements);
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
        className="fixed z-[10001] ring-[9999px] ring-black/50"
        style={spotlightStyle}
      />

      {/* Tooltip card */}
      <div
        className="z-[10002] w-[340px] rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
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
