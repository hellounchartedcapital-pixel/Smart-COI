'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

const TUTORIAL_KEY = 'smartcoi_has_seen_tutorial';

// ============================================================================
// Tour step definitions (6 steps)
// ============================================================================

interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
}

const STEPS: TourStep[] = [
  {
    target: 'health-pills',
    title: 'Portfolio Health',
    description:
      'Your overall compliance rate across all properties. Click the status pills to filter the action queue below.',
  },
  {
    target: 'action-queue',
    title: 'Action Queue',
    description:
      'Vendors and tenants that need your attention — expired certificates, missing coverage, and compliance gaps. Handle items directly from here.',
  },
  {
    target: 'upload-coi',
    title: 'Upload Certificates',
    description:
      'Upload certificates of insurance here. Our AI will automatically extract coverage details and match them to the right vendor.',
  },
  {
    target: 'row-actions',
    title: 'Quick Actions',
    description:
      'Request a certificate directly from a vendor via email, or upload one you\'ve already received — right from the action queue.',
  },
  {
    target: 'portfolio-snapshot',
    title: 'Portfolio Snapshot',
    description:
      'A quick summary of your portfolio — total properties, vendors, tenants, your compliance score, and upcoming expirations.',
  },
  {
    target: 'sidebar-nav',
    title: 'Navigation',
    description:
      'Manage your properties and vendors, set up insurance requirement templates, and configure compliance notifications from here.',
  },
];

// ============================================================================
// Hook: useTutorial
// ============================================================================

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

// ============================================================================
// Main tour component
// ============================================================================

interface DashboardTutorialProps {
  active: boolean;
  onClose: () => void;
}

export function DashboardTutorial({ active, onClose }: DashboardTutorialProps) {
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (active) setStep(0);
  }, [active]);

  const handleNext = useCallback(() => {
    if (step === STEPS.length - 1) {
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  }, [step, onClose]);

  const handlePrev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  if (!active || !mounted) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return createPortal(
    <TourOverlay
      step={step}
      totalSteps={STEPS.length}
      target={current.target}
      title={current.title}
      description={current.description}
      isLast={isLast}
      onNext={handleNext}
      onPrev={handlePrev}
      onSkip={onClose}
    />,
    document.body
  );
}

// ============================================================================
// Tooltip placement logic
// ============================================================================

type Placement = 'top' | 'bottom' | 'left' | 'right';

const TOOLTIP_GAP = 14;
const TOOLTIP_WIDTH = 340;
const TOOLTIP_APPROX_HEIGHT = 200;

function computePlacement(
  rect: DOMRect,
  preferredOrder: Placement[] = ['bottom', 'top', 'right', 'left']
): Placement {
  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceLeft = rect.left;
  const spaceRight = window.innerWidth - rect.right;

  const fits: Record<Placement, boolean> = {
    top: spaceAbove > TOOLTIP_APPROX_HEIGHT + TOOLTIP_GAP,
    bottom: spaceBelow > TOOLTIP_APPROX_HEIGHT + TOOLTIP_GAP,
    left: spaceLeft > TOOLTIP_WIDTH + TOOLTIP_GAP,
    right: spaceRight > TOOLTIP_WIDTH + TOOLTIP_GAP,
  };

  for (const p of preferredOrder) {
    if (fits[p]) return p;
  }
  return 'bottom'; // fallback
}

function computeTooltipPosition(
  rect: DOMRect,
  placement: Placement
): { top: number; left: number } {
  let top = 0;
  let left = 0;

  switch (placement) {
    case 'bottom':
      top = rect.bottom + TOOLTIP_GAP;
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case 'top':
      top = rect.top - TOOLTIP_GAP - TOOLTIP_APPROX_HEIGHT;
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - TOOLTIP_APPROX_HEIGHT / 2;
      left = rect.right + TOOLTIP_GAP;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - TOOLTIP_APPROX_HEIGHT / 2;
      left = rect.left - TOOLTIP_GAP - TOOLTIP_WIDTH;
      break;
  }

  // Clamp within viewport
  left = Math.max(12, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - 12));
  top = Math.max(12, Math.min(top, window.innerHeight - TOOLTIP_APPROX_HEIGHT - 12));

  return { top, left };
}

// ============================================================================
// Overlay + highlight ring + tooltip
// ============================================================================

function TourOverlay({
  step,
  totalSteps,
  target,
  title,
  description,
  isLast,
  onNext,
  onPrev,
  onSkip,
}: {
  step: number;
  totalSteps: number;
  target: string;
  title: string;
  description: string;
  isLast: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const [placement, setPlacement] = useState<Placement>('bottom');
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReady(false);
    let cancelled = false;

    const el = document.querySelector(`[data-tour="${target}"]`);
    if (!el) {
      // Element not found — show tooltip centered
      setRect(null);
      setReady(true);
      return;
    }

    // Scroll element into view smoothly
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Give scroll time to finish, then measure
    const timer = setTimeout(() => {
      if (cancelled) return;
      measure(el);
      setReady(true);
    }, 350);

    function measure(element: Element) {
      const r = element.getBoundingClientRect();
      setRect(r);

      // For sidebar elements, prefer placing tooltip to the right
      const isSidebar = r.left < 280 && r.width < 280;
      const p = computePlacement(
        r,
        isSidebar ? ['right', 'bottom', 'top', 'left'] : ['bottom', 'top', 'right', 'left']
      );
      setPlacement(p);
    }

    function handleResize() {
      const el2 = document.querySelector(`[data-tour="${target}"]`);
      if (el2) measure(el2);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [target, step]);

  // Compute positions
  const tooltipPos = rect
    ? computeTooltipPosition(rect, placement)
    : { top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - TOOLTIP_WIDTH / 2 };

  const highlightPad = 8;

  return (
    <>
      {/* Very subtle page dimming — 10% opacity, page stays visible */}
      <div
        className="fixed inset-0 z-[10000] bg-white/10 backdrop-blur-[0.5px]"
        onClick={onSkip}
        aria-hidden
      />

      {/* Highlight ring around target element */}
      {rect && (
        <div
          className="fixed z-[10001] pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: rect.top - highlightPad,
            left: rect.left - highlightPad,
            width: rect.width + highlightPad * 2,
            height: rect.height + highlightPad * 2,
            borderRadius: '16px',
            boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25), 0 0 20px 4px rgba(16, 185, 129, 0.1)',
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className={`fixed z-[10002] transition-all duration-300 ease-out ${ready ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: TOOLTIP_WIDTH,
        }}
      >
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-200/50">
          {/* Step counter */}
          <p className="text-[11px] font-medium text-slate-400">
            {step + 1} of {totalSteps}
          </p>

          {/* Title */}
          <h3 className="mt-1.5 text-sm font-semibold text-slate-900">
            {title}
          </h3>

          {/* Description */}
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
            {description}
          </p>

          {/* Navigation */}
          <div className="mt-5 flex items-center justify-between">
            {/* Step dots */}
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === step
                      ? 'w-4 bg-emerald-500'
                      : i < step
                        ? 'w-1.5 bg-emerald-300'
                        : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={onPrev}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={onNext}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                {isLast ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>

          {/* Skip tour link */}
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={onSkip}
              className="text-[11px] text-slate-400 transition-colors hover:text-slate-600"
            >
              Skip tour
            </button>
          </div>
        </div>

        {/* Arrow pointing to the target */}
        {rect && <TooltipArrow placement={placement} />}
      </div>
    </>
  );
}

// ============================================================================
// Tooltip arrow
// ============================================================================

function TooltipArrow({ placement }: { placement: Placement }) {
  const base = 'absolute w-3 h-3 bg-white border-slate-200/80 rotate-45';

  switch (placement) {
    case 'bottom':
      return (
        <div
          className={`${base} border-l border-t`}
          style={{ top: -6, left: '50%', marginLeft: -6 }}
        />
      );
    case 'top':
      return (
        <div
          className={`${base} border-r border-b`}
          style={{ bottom: -6, left: '50%', marginLeft: -6 }}
        />
      );
    case 'right':
      return (
        <div
          className={`${base} border-l border-b`}
          style={{ top: '50%', left: -6, marginTop: -6 }}
        />
      );
    case 'left':
      return (
        <div
          className={`${base} border-r border-t`}
          style={{ top: '50%', right: -6, marginTop: -6 }}
        />
      );
  }
}
