'use client';

import { useState, useEffect } from 'react';
import { getCOISignedUrl } from '@/lib/actions/certificates';
import { Loader2, FileX } from 'lucide-react';

interface SplitPanelViewProps {
  certificateId: string | null;
  children: React.ReactNode;
}

export function SplitPanelView({
  certificateId,
  children,
}: SplitPanelViewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!certificateId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getCOISignedUrl(certificateId)
      .then(({ url }) => {
        if (!cancelled) setPdfUrl(url);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load PDF');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [certificateId]);

  if (!certificateId) {
    return (
      <div className="grid h-full lg:grid-cols-1">
        <div className="overflow-y-auto">{children}</div>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-12rem)] lg:grid-cols-2 gap-0 rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Left: PDF viewer */}
      <div className="flex flex-col border-r border-slate-200 bg-slate-50 min-h-[400px]">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">
            Certificate Document
          </span>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand hover:underline"
            >
              Open in new tab
            </a>
          )}
        </div>
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <FileX className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}
          {pdfUrl && !loading && (
            <iframe
              src={pdfUrl}
              title="COI Document"
              className="h-full w-full"
              style={{ minHeight: '500px' }}
            />
          )}
          {!certificateId && !loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              No document available
            </div>
          )}
        </div>
      </div>

      {/* Right: Compliance panel */}
      <div className="overflow-y-auto">{children}</div>
    </div>
  );
}
