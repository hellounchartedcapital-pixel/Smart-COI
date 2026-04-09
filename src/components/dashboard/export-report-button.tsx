'use client';

import { useState, useRef, useEffect } from 'react';
import { FileDown, FileText, Table, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateComplianceCSV, getComplianceReportData } from '@/lib/actions/reports';
import { generateAuditReportPDF } from '@/lib/actions/audit-report';
import { useTerminology } from '@/hooks/useTerminology';
import type { ComplianceReportData } from '@/lib/actions/reports';

function formatReportDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function statusColor(status: string): string {
  switch (status) {
    case 'compliant': return '#059669';
    case 'expiring_soon': return '#d97706';
    case 'expired': return '#dc2626';
    case 'non_compliant': return '#ef4444';
    case 'pending': return '#64748b';
    case 'needs_setup': return '#7c3aed';
    case 'under_review': return '#2563eb';
    default: return '#475569';
  }
}

function generatePDFHtml(data: ComplianceReportData, entityLabel: string, tenantLabel: string | null, locationLabel: string): string {
  const date = formatReportDate(data.generatedAt);

  const propertyRows = data.properties
    .filter((p) => p.entities.length > 0)
    .map((prop) => {
      const entityRows = prop.entities.map((e) => {
        const endorsementColor = (status: string) => {
          if (status === 'Verified') return '#059669';
          if (status === 'Warning') return '#d97706';
          if (status === 'Indicated') return '#475569';
          return '#94a3b8';
        };
        return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${e.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${e.type === 'vendor' ? entityLabel : (tenantLabel ?? entityLabel)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;">
            <span style="color:${statusColor(e.complianceStatus)};font-weight:600;">${statusLabel(e.complianceStatus)}</span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${e.glLimit}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${e.wcLimit}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${e.autoLimit}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${e.umbrellaLimit}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${e.expirationDate}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:${endorsementColor(e.additionalInsuredStatus)};font-weight:500;">${e.additionalInsuredStatus}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:${endorsementColor(e.waiverOfSubStatus)};font-weight:500;">${e.waiverOfSubStatus}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#dc2626;">
            ${e.gaps.length > 0 ? e.gaps.map((g) => `<div style="margin-bottom:2px;">• ${g}</div>`).join('') : '<span style="color:#059669;">—</span>'}
          </td>
        </tr>
      `;}).join('');

      return `
        <div style="margin-bottom:24px;page-break-inside:avoid;">
          <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 4px;padding:8px 0;border-bottom:2px solid #059669;">
            ${prop.name}
          </h3>
          ${prop.address ? `<p style="font-size:12px;color:#64748b;margin:0 0 12px;">${prop.address}</p>` : ''}
          <table style="width:100%;border-collapse:collapse;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Name</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Type</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Status</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">GL</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">WC</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Auto</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Umbrella</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Expiration</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Addl Ins</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Waiver</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Gaps</th>
              </tr>
            </thead>
            <tbody>
              ${entityRows}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Compliance Report — ${data.organizationName}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none !important; }
      @page { margin: 0.5in; size: landscape; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #0f172a; margin: 0; padding: 40px; }
  </style>
</head>
<body>
  <div class="no-print" style="position:fixed;top:16px;right:16px;z-index:100;">
    <button onclick="window.print()" style="background:#059669;color:white;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
      Print / Save as PDF
    </button>
  </div>

  <!-- Header -->
  <div style="margin-bottom:32px;border-bottom:3px solid #059669;padding-bottom:16px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <h1 style="font-size:28px;font-weight:700;color:#0f172a;margin:0 0 4px;">Compliance Report</h1>
        <p style="font-size:16px;color:#475569;margin:0;">${data.organizationName}</p>
      </div>
      <div style="text-align:right;">
        <p style="font-size:13px;color:#64748b;margin:0;">Generated ${date}</p>
      </div>
    </div>
  </div>

  <!-- Compliance Summary -->
  <div style="display:flex;gap:16px;margin-bottom:32px;">
    <div style="flex:1;background:#f8fafc;border-radius:8px;padding:16px;text-align:center;">
      <p style="font-size:28px;font-weight:700;color:#0f172a;margin:0;">${data.totalProperties}</p>
      <p style="font-size:12px;color:#64748b;margin:4px 0 0;">${locationLabel}</p>
    </div>
    <div style="flex:1;background:#f8fafc;border-radius:8px;padding:16px;text-align:center;">
      <p style="font-size:28px;font-weight:700;color:#0f172a;margin:0;">${data.totalVendors}</p>
      <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Entities</p>
    </div>
    ${data.totalTenants > 0 ? `<div style="flex:1;background:#f8fafc;border-radius:8px;padding:16px;text-align:center;">
      <p style="font-size:28px;font-weight:700;color:#0f172a;margin:0;">${data.totalTenants}</p>
      <p style="font-size:12px;color:#64748b;margin:4px 0 0;">${tenantLabel ?? 'Tenants'}</p>
    </div>` : ''}
    <div style="flex:1;background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
      <p style="font-size:28px;font-weight:700;color:#059669;margin:0;">${data.overallComplianceRate != null ? `${data.overallComplianceRate}%` : '—'}</p>
      <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Compliance Rate</p>
    </div>
  </div>

  <!-- Status Breakdown -->
  <div style="margin-bottom:32px;">
    <h2 style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 12px;">Status Breakdown</h2>
    <div style="display:flex;gap:12px;">
      <div style="background:#f0fdf4;border-radius:8px;padding:12px 20px;text-align:center;">
        <p style="font-size:24px;font-weight:700;color:#059669;margin:0;">${data.statusBreakdown.compliant}</p>
        <p style="font-size:11px;color:#64748b;margin:2px 0 0;">Compliant</p>
      </div>
      <div style="background:#fffbeb;border-radius:8px;padding:12px 20px;text-align:center;">
        <p style="font-size:24px;font-weight:700;color:#d97706;margin:0;">${data.statusBreakdown.expiring_soon}</p>
        <p style="font-size:11px;color:#64748b;margin:2px 0 0;">Expiring Soon</p>
      </div>
      <div style="background:#fef2f2;border-radius:8px;padding:12px 20px;text-align:center;">
        <p style="font-size:24px;font-weight:700;color:#dc2626;margin:0;">${data.statusBreakdown.expired}</p>
        <p style="font-size:11px;color:#64748b;margin:2px 0 0;">Expired</p>
      </div>
      <div style="background:#fef2f2;border-radius:8px;padding:12px 20px;text-align:center;">
        <p style="font-size:24px;font-weight:700;color:#ef4444;margin:0;">${data.statusBreakdown.non_compliant}</p>
        <p style="font-size:11px;color:#64748b;margin:2px 0 0;">Non-Compliant</p>
      </div>
      <div style="background:#f8fafc;border-radius:8px;padding:12px 20px;text-align:center;">
        <p style="font-size:24px;font-weight:700;color:#64748b;margin:0;">${data.statusBreakdown.pending}</p>
        <p style="font-size:11px;color:#64748b;margin:2px 0 0;">Pending</p>
      </div>
      ${data.statusBreakdown.needs_setup > 0 ? `<div style="background:#f5f3ff;border-radius:8px;padding:12px 20px;text-align:center;">
        <p style="font-size:24px;font-weight:700;color:#7c3aed;margin:0;">${data.statusBreakdown.needs_setup}</p>
        <p style="font-size:11px;color:#64748b;margin:2px 0 0;">Needs Setup</p>
      </div>` : ''}
      ${data.statusBreakdown.under_review > 0 ? `<div style="background:#eff6ff;border-radius:8px;padding:12px 20px;text-align:center;">
        <p style="font-size:24px;font-weight:700;color:#2563eb;margin:0;">${data.statusBreakdown.under_review}</p>
        <p style="font-size:11px;color:#64748b;margin:2px 0 0;">Under Review</p>
      </div>` : ''}
    </div>
  </div>

  <!-- Per-Property Sections -->
  <h2 style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 16px;">Property Details</h2>
  ${propertyRows}

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="font-size:12px;color:#94a3b8;margin:0;">Generated by SmartCOI — smartcoi.io</p>
  </div>
</body>
</html>`;
}

export function ExportReportButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<'pdf' | 'csv' | 'audit' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { terminology: terms } = useTerminology();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleExportPDF = async () => {
    setLoading('pdf');
    setOpen(false);
    try {
      const data = await getComplianceReportData();
      const html = generatePDFHtml(data, terms.entity, terms.tenant, terms.locationPlural);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success('Report opened — use Print to save as PDF');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(null);
    }
  };

  const handleExportCSV = async () => {
    setLoading('csv');
    setOpen(false);
    try {
      const csv = await generateComplianceCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch {
      toast.error('Failed to generate CSV');
    } finally {
      setLoading(null);
    }
  };

  const handleAuditReport = async () => {
    setLoading('audit');
    setOpen(false);
    try {
      const result = await generateAuditReportPDF();
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      const bytes = Uint8Array.from(atob(result.pdf), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Compliance audit report downloaded');
    } catch {
      toast.error('Failed to generate audit report');
    } finally {
      setLoading(null);
    }
  };

  const loadingText = loading === 'audit' ? 'Generating audit report...' : 'Generating...';

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg text-sm"
        onClick={() => setOpen(!open)}
        disabled={loading !== null}
      >
        <FileDown className="mr-2 h-4 w-4" />
        {loading ? loadingText : 'Export Report'}
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-slate-200 bg-white shadow-lg py-1">
          <button
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={handleExportPDF}
          >
            <FileText className="h-4 w-4 text-slate-400" />
            Export as PDF
          </button>
          <button
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={handleExportCSV}
          >
            <Table className="h-4 w-4 text-slate-400" />
            Export as CSV
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={handleAuditReport}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Compliance Audit
          </button>
        </div>
      )}
    </div>
  );
}
