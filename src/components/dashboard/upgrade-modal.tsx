'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface UpgradeModalCtx {
  showUpgradeModal: (message?: string) => void;
}

const Ctx = createContext<UpgradeModalCtx>({
  showUpgradeModal: () => {},
});

export function useUpgradeModal() {
  return useContext(Ctx);
}

// ---------------------------------------------------------------------------
// Provider + Modal
// ---------------------------------------------------------------------------

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState<string | null>(null);

  const showUpgradeModal = useCallback((message?: string) => {
    setBody(message ?? null);
    setOpen(true);
  }, []);

  return (
    <Ctx.Provider value={{ showUpgradeModal }}>
      {children}

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="relative z-[100] w-full max-w-md border bg-background p-6 shadow-lg sm:rounded-lg">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-lightest">
                <Lock className="h-7 w-7 text-brand-dark" />
              </div>

              <h2 className="mt-5 text-lg font-semibold leading-none tracking-tight text-foreground">
                Your free trial has ended
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {body ??
                  'Subscribe to SmartCOI to continue automating your COI compliance.'}
              </p>

              <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link
                    href="/dashboard/settings/billing"
                    onClick={() => setOpen(false)}
                  >
                    View Plans
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
