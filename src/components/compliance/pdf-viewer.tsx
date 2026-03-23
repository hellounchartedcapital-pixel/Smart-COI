'use client';

import { useState, useEffect } from 'react';
import { getCOISignedUrl } from '@/lib/actions/certificates';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, Loader2, FileX, FileText } from 'lucide-react';

interface PdfViewerProps {
  certificateId: string | null;
}

export function PdfViewer({ certificateId }: PdfViewerProps) {
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
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm font-medium text-foreground">No certificate uploaded</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload a COI to view the document here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 bg-slate-50">
        <span className="text-xs font-medium text-muted-foreground">
          Certificate Document
        </span>
        {pdfUrl && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              asChild
            >
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 h-3 w-3" />
                Open in New Tab
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              asChild
            >
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" download={`coi-${certificateId}.pdf`}>
                <Download className="mr-1 h-3 w-3" />
                Download COI
              </a>
            </Button>
          </div>
        )}
      </div>
      {/* PDF content area */}
      <div className="relative bg-slate-50" style={{ height: '600px' }}>
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
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
            title="COI Document"
            className="h-full w-full"
          />
        )}
      </div>
    </div>
  );
}
