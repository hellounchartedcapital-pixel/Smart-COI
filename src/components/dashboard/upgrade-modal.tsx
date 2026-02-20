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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-lightest">
              <Lock className="h-7 w-7 text-brand-dark" />
            </div>
            <DialogTitle className="mt-3">
              Your free trial has ended
            </DialogTitle>
            <DialogDescription>
              {body ??
                'Subscribe to SmartCOI to continue automating your COI compliance.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
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
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}
