// ============================================================================
// SmartCOI — Compliance Report PDF Generator (Client-Side)
//
// Takes the ComplianceReport JSON from the API and produces a branded PDF
// using jsPDF + jspdf-autotable. Runs client-side for immediate download.
// ============================================================================

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================================================
// Types (mirrors report-client.tsx)
// ============================================================================

interface ReportSummary {
  totalEntities: number;
  compliantCount: number;
  nonCompliantCount: number;
  complianceScore: number;
  totalGaps: number;
  totalExposure: number;
  expiredCount: number;
  expiringIn30Days: number;
  needsSetupCount: number;
  underReviewCount: number;
  missingEndorsementCount: number;
}

interface ReportIssue {
  entityId: string;
  entityName: string;
  type: string;
  severity: 'critical' | 'warning';
  description: string;
}

interface VendorCoverage {
  coverageTypeLabel: string;
  carrierName: string | null;
  limitAmount: number | null;
  limitType: string | null;
  expirationDate: string | null;
  isExpired: boolean;
}

interface VendorRequirement {
  coverageTypeLabel: string;
  minimumLimit: number | null;
  limitType: string | null;
  requiresAdditionalInsured: boolean;
  requiresWaiverOfSubrogation: boolean;
  status: 'met' | 'not_met' | 'missing' | 'not_required';
  gapDescription: string | null;
  dollarGap: number | null;
}

interface VendorBreakdown {
  entityName: string;
  inferredVendorTypeLabel: string | null;
  vendorTypeNeedsReview: boolean;
  complianceStatus: string;
  totalExposure: number;
  coveragesOnFile: VendorCoverage[];
  requirements: VendorRequirement[];
  gaps: Array<{
    coverageTypeLabel: string;
    gapType: string;
    dollarGap: number | null;
    description: string;
  }>;
}

interface CoverageBreakdownItem {
  coverageTypeLabel: string;
  entityCount: number;
  totalExposure: number;
  missingCount: number;
  insufficientCount: number;
}

interface RecommendedAction {
  entityName: string;
  severity: 'critical' | 'warning' | 'info';
  totalExposure: number;
  action: string;
  topGaps: string[];
}

interface NeedsReviewItem {
  entityName: string;
  inferredVendorTypeLabel: string | null;
}

export interface ComplianceReportData {
  generatedAt: string;
  organizationName: string;
  summary: ReportSummary;
  issues: ReportIssue[];
  vendors: VendorBreakdown[];
  coverageBreakdown: CoverageBreakdownItem[];
  recommendedActions: RecommendedAction[];
  needsReview: NeedsReviewItem[];
}

// ============================================================================
// Design constants (matching the existing audit report palette)
// ============================================================================

type RGB = readonly [number, number, number];

const EMERALD: RGB = [5, 150, 105];
const EMERALD_LIGHT: RGB = [236, 253, 245];
const SLATE_900: RGB = [15, 23, 42];
const SLATE_700: RGB = [51, 65, 85];
const SLATE_500: RGB = [100, 116, 139];
const SLATE_200: RGB = [226, 232, 240];
const SLATE_50: RGB = [248, 250, 252];
const WHITE: RGB = [255, 255, 255];
const RED_600: RGB = [220, 38, 38];
const RED_50: RGB = [254, 242, 242];
const AMBER_600: RGB = [217, 119, 6];
const AMBER_50: RGB = [255, 251, 235];

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const ML = 20; // margin left
const MR = 20; // margin right
const MT = 20; // margin top
const MB = 25; // margin bottom
const CW = PAGE_WIDTH - ML - MR; // content width

// ============================================================================
// Helpers
// ============================================================================

function fmtDollars(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function fmtShortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function scoreRGB(score: number): RGB {
  if (score >= 80) return EMERALD;
  if (score >= 50) return AMBER_600;
  return RED_600;
}

function statusLabel(status: string): string {
  switch (status) {
    case 'compliant': return 'Compliant';
    case 'non_compliant': return 'Non-Compliant';
    case 'expired': return 'Expired';
    case 'expiring_soon': return 'Expiring Soon';
    case 'needs_setup': return 'Needs Setup';
    case 'under_review': return 'Under Review';
    default: return 'Pending';
  }
}

// ============================================================================
// PDF drawing primitives
// ============================================================================

function text(
  doc: jsPDF, s: string, x: number, y: number,
  opts?: { size?: number; color?: RGB; bold?: boolean; maxW?: number; align?: 'left' | 'center' | 'right' }
): number {
  doc.setFontSize(opts?.size ?? 10);
  doc.setTextColor(...(opts?.color ?? SLATE_700));
  doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
  if (opts?.maxW) {
    const lines = doc.splitTextToSize(s, opts.maxW);
    doc.text(lines, x, y, { align: opts?.align });
    return y + lines.length * (opts?.size ?? 10) * 0.4;
  }
  doc.text(s, x, y, { align: opts?.align });
  return y + (opts?.size ?? 10) * 0.4;
}

function rect(doc: jsPDF, x: number, y: number, w: number, h: number, c: RGB) {
  doc.setFillColor(...c);
  doc.rect(x, y, w, h, 'F');
}

function hr(doc: jsPDF, y: number): number {
  doc.setDrawColor(...SLATE_200);
  doc.setLineWidth(0.3);
  doc.line(ML, y, PAGE_WIDTH - MR, y);
  return y + 3;
}

function footer(doc: jsPDF) {
  const p = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_500);
  doc.setFont('helvetica', 'normal');
  doc.text(`Page ${p}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: 'center' });
  doc.text('SmartCOI Compliance Report', ML, PAGE_HEIGHT - 10);
  doc.text('Confidential', PAGE_WIDTH - MR, PAGE_HEIGHT - 10, { align: 'right' });
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_HEIGHT - MB) {
    doc.addPage();
    footer(doc);
    return MT;
  }
  return y;
}

function sectionHeader(doc: jsPDF, y: number, title: string): number {
  y = ensureSpace(doc, y, 15);
  rect(doc, ML, y, CW, 10, EMERALD);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text(title, ML + 5, y + 7);
  return y + 15;
}

function statBox(
  doc: jsPDF, x: number, y: number, w: number, h: number,
  value: string, label: string, valColor: RGB = SLATE_900
) {
  rect(doc, x, y, w, h, SLATE_50);
  rect(doc, x, y, w, 1, EMERALD);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...valColor);
  doc.text(value, x + w / 2, y + h / 2 - 1, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_500);
  doc.text(label, x + w / 2, y + h / 2 + 6, { align: 'center' });
}

// ============================================================================
// Page builders
// ============================================================================

function buildHeader(doc: jsPDF, report: ComplianceReportData): number {
  footer(doc);

  // Emerald header bar
  rect(doc, 0, 0, PAGE_WIDTH, 50, EMERALD);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('Compliance Report', PAGE_WIDTH / 2, 22, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(report.organizationName, PAGE_WIDTH / 2, 33, { align: 'center' });
  doc.setFontSize(9);
  doc.text(
    `${fmtDate(report.generatedAt)}  |  Prepared by SmartCOI`,
    PAGE_WIDTH / 2, 42, { align: 'center' }
  );

  // Score + stats grid
  const s = report.summary;
  let y = 60;

  // Compliance score circle
  const cx = PAGE_WIDTH / 2;
  const cy = y + 18;
  const r = 18;
  const ringColor = scoreRGB(s.complianceScore);

  // Background ring
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(4);
  doc.circle(cx, cy, r, 'S');
  // Score ring (draw as arc via thick line)
  doc.setDrawColor(...ringColor);
  doc.setLineWidth(4);
  doc.circle(cx, cy, r, 'S');

  // Score text in center
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ringColor);
  doc.text(`${s.complianceScore}%`, cx, cy + 3, { align: 'center' });

  // Label
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_500);
  doc.text('Compliance Score', cx, cy + r + 8, { align: 'center' });

  y = cy + r + 16;

  // Stats row
  const boxW = CW / 3 - 3;
  const boxH = 22;
  statBox(doc, ML, y, boxW, boxH, String(s.totalGaps), 'Compliance Gaps', RED_600);
  statBox(doc, ML + boxW + 4.5, y, boxW, boxH, fmtDollars(s.totalExposure), 'Dollar Exposure', s.totalExposure > 0 ? RED_600 : EMERALD);
  statBox(doc, ML + (boxW + 4.5) * 2, y, boxW, boxH, `${s.compliantCount}/${s.totalEntities}`, 'Vendors Compliant', EMERALD);

  y += boxH + 8;

  // Second row
  statBox(doc, ML, y, boxW, boxH, String(s.expiredCount), 'Expired', s.expiredCount > 0 ? RED_600 : SLATE_900);
  statBox(doc, ML + boxW + 4.5, y, boxW, boxH, String(s.expiringIn30Days), 'Expiring in 30d', s.expiringIn30Days > 0 ? AMBER_600 : SLATE_900);
  statBox(doc, ML + (boxW + 4.5) * 2, y, boxW, boxH, String(s.missingEndorsementCount), 'Missing Endorsements', s.missingEndorsementCount > 0 ? AMBER_600 : SLATE_900);

  return y + boxH + 10;
}

function buildIssues(doc: jsPDF, y: number, report: ComplianceReportData): number {
  const critical = report.issues.filter((i) => i.severity === 'critical');
  const warnings = report.issues.filter((i) => i.severity === 'warning');

  // ---- Critical issues ----
  y = sectionHeader(doc, y, 'Critical Issues');

  if (critical.length === 0) {
    y = ensureSpace(doc, y, 12);
    rect(doc, ML, y, CW, 10, EMERALD_LIGHT);
    text(doc, 'No critical issues found.', ML + 4, y + 7, { size: 9, color: EMERALD, bold: true });
    y += 15;
  } else {
    for (const issue of critical) {
      y = ensureSpace(doc, y, 14);
      rect(doc, ML, y, CW, 12, RED_50);
      // Red left accent bar
      rect(doc, ML, y, 2, 12, RED_600);
      text(doc, issue.entityName, ML + 6, y + 5, { size: 9, bold: true, color: RED_600 });
      text(doc, issue.description, ML + 6, y + 10, { size: 8, color: SLATE_700, maxW: CW - 10 });
      y += 14;
    }
  }

  y += 3;

  // ---- Warnings ----
  y = sectionHeader(doc, y, 'Warnings');

  if (warnings.length === 0) {
    y = ensureSpace(doc, y, 12);
    rect(doc, ML, y, CW, 10, EMERALD_LIGHT);
    text(doc, 'No warnings found.', ML + 4, y + 7, { size: 9, color: EMERALD, bold: true });
    y += 15;
  } else {
    for (const issue of warnings) {
      y = ensureSpace(doc, y, 14);
      rect(doc, ML, y, CW, 12, AMBER_50);
      rect(doc, ML, y, 2, 12, AMBER_600);
      text(doc, issue.entityName, ML + 6, y + 5, { size: 9, bold: true, color: AMBER_600 });
      text(doc, issue.description, ML + 6, y + 10, { size: 8, color: SLATE_700, maxW: CW - 10 });
      y += 14;
    }
  }

  return y + 3;
}

function buildVendorBreakdown(doc: jsPDF, y: number, report: ComplianceReportData): number {
  y = sectionHeader(doc, y, 'Vendor-by-Vendor Breakdown');

  for (const vendor of report.vendors) {
    // Estimate space: header (10) + coverages table + requirements table
    const covRows = vendor.coveragesOnFile.length;
    const reqRows = vendor.requirements.length;
    const estHeight = 14 + (covRows > 0 ? 8 + covRows * 6 : 0) + (reqRows > 0 ? 8 + reqRows * 6 : 0);
    y = ensureSpace(doc, y, Math.min(estHeight, 60));

    // Vendor header row
    rect(doc, ML, y, CW, 10, SLATE_50);
    const typeLabel = vendor.vendorTypeNeedsReview
      ? 'Unclassified'
      : (vendor.inferredVendorTypeLabel ?? '');
    const status = statusLabel(vendor.complianceStatus);

    text(doc, vendor.entityName, ML + 4, y + 7, { size: 10, bold: true, color: SLATE_900 });
    if (typeLabel) {
      const nameW = doc.getTextWidth(vendor.entityName);
      text(doc, `  [${typeLabel}]`, ML + 4 + nameW + 2, y + 7, { size: 8, color: SLATE_500 });
    }

    // Status badge on right
    const statusColor: RGB = vendor.complianceStatus === 'compliant' ? EMERALD
      : vendor.complianceStatus === 'expired' || vendor.complianceStatus === 'non_compliant' ? RED_600
        : AMBER_600;
    text(doc, status, PAGE_WIDTH - MR - 4, y + 7, { size: 8, bold: true, color: statusColor, align: 'right' });

    // Exposure line
    if (vendor.totalExposure > 0) {
      y += 10;
      text(doc, `Exposure: ${fmtDollars(vendor.totalExposure)}`, ML + 4, y + 4, { size: 8, color: RED_600 });
      y += 2;
    }
    y += 12;

    // Coverages on file table
    if (vendor.coveragesOnFile.length > 0) {
      text(doc, 'Coverages on File', ML + 4, y, { size: 8, bold: true, color: SLATE_500 });
      y += 3;

      autoTable(doc, {
        startY: y,
        margin: { left: ML + 2, right: MR + 2 },
        head: [['Coverage', 'Carrier', 'Limit', 'Expires']],
        body: vendor.coveragesOnFile.map((c) => [
          c.coverageTypeLabel,
          c.carrierName ?? '—',
          c.limitAmount != null ? fmtDollars(c.limitAmount)
            : c.limitType === 'statutory' ? 'Statutory' : '—',
          c.expirationDate
            ? (c.isExpired ? 'EXPIRED ' : '') + fmtShortDate(c.expirationDate)
            : '—',
        ]),
        styles: { fontSize: 7.5, cellPadding: 1.5, textColor: [...SLATE_700] },
        headStyles: {
          fillColor: [...SLATE_200],
          textColor: [...SLATE_700],
          fontStyle: 'bold',
          fontSize: 7,
        },
        alternateRowStyles: { fillColor: [...SLATE_50] },
        columnStyles: {
          0: { cellWidth: 45 },
          2: { halign: 'right', cellWidth: 30 },
          3: { halign: 'right', cellWidth: 30 },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        didParseCell: (data: any) => {
          // Color expired dates red
          if (data.section === 'body' && data.column.index === 3) {
            const val = String(data.cell.raw ?? '');
            if (val.startsWith('EXPIRED')) {
              data.cell.styles.textColor = [...RED_600];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable?.finalY ?? y + 20;
      y += 3;
    }

    // Requirements table
    if (vendor.requirements.length > 0) {
      y = ensureSpace(doc, y, 20);
      text(doc, 'Requirements', ML + 4, y, { size: 8, bold: true, color: SLATE_500 });
      y += 3;

      autoTable(doc, {
        startY: y,
        margin: { left: ML + 2, right: MR + 2 },
        head: [['Coverage', 'Required', 'Status', 'Gap']],
        body: vendor.requirements.map((r) => {
          const endorsements = [
            r.requiresAdditionalInsured ? 'AI' : '',
            r.requiresWaiverOfSubrogation ? 'WoS' : '',
          ].filter(Boolean).join(', ');
          const covLabel = endorsements
            ? `${r.coverageTypeLabel} (+${endorsements})`
            : r.coverageTypeLabel;

          const reqLimit = r.minimumLimit != null ? fmtDollars(r.minimumLimit)
            : r.limitType === 'statutory' ? 'Statutory' : '—';

          const statusIcon = r.status === 'met' ? 'MET'
            : r.status === 'not_met' ? 'NOT MET'
              : r.status === 'missing' ? 'MISSING'
                : 'N/A';

          const gap = (r.status === 'not_met' || r.status === 'missing')
            ? (r.gapDescription ?? 'Not met')
            : '—';

          return [covLabel, reqLimit, statusIcon, gap];
        }),
        styles: { fontSize: 7.5, cellPadding: 1.5, textColor: [...SLATE_700] },
        headStyles: {
          fillColor: [...SLATE_200],
          textColor: [...SLATE_700],
          fontStyle: 'bold',
          fontSize: 7,
        },
        alternateRowStyles: { fillColor: [...SLATE_50] },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { halign: 'right', cellWidth: 25 },
          2: { halign: 'center', cellWidth: 18 },
          3: { cellWidth: 'auto' },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 2) {
            const val = String(data.cell.raw ?? '');
            if (val === 'MET') {
              data.cell.styles.textColor = [...EMERALD];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'NOT MET' || val === 'MISSING') {
              data.cell.styles.textColor = [...RED_600];
              data.cell.styles.fontStyle = 'bold';
            }
          }
          // Highlight gap column in red
          if (data.section === 'body' && data.column.index === 3) {
            const val = String(data.cell.raw ?? '');
            if (val !== '—') {
              data.cell.styles.textColor = [...RED_600];
            }
          }
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable?.finalY ?? y + 20;
      y += 3;
    }

    // Separator between vendors
    y = hr(doc, y);
    y += 2;
  }

  return y;
}

function buildActions(doc: jsPDF, y: number, report: ComplianceReportData): number {
  if (report.recommendedActions.length === 0) return y;

  y = sectionHeader(doc, y, 'Recommended Actions');

  for (let i = 0; i < report.recommendedActions.length; i++) {
    const action = report.recommendedActions[i];
    y = ensureSpace(doc, y, 20);

    // Priority number badge
    const badgeColor: RGB = action.severity === 'critical' ? RED_600
      : action.severity === 'warning' ? AMBER_600 : SLATE_500;
    rect(doc, ML, y, 7, 7, badgeColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text(String(i + 1), ML + 3.5, y + 5.2, { align: 'center' });

    // Action text
    const actionX = ML + 11;
    let exposureText = '';
    if (action.totalExposure > 0) {
      exposureText = `  —  ${fmtDollars(action.totalExposure)} at risk`;
    }
    text(doc, action.entityName + exposureText, actionX, y + 5, {
      size: 9, bold: true, color: SLATE_900, maxW: CW - 15,
    });
    y += 8;
    y = text(doc, action.action, actionX, y, { size: 8, color: SLATE_700, maxW: CW - 15 });

    // Top gaps
    for (const gap of action.topGaps) {
      y = ensureSpace(doc, y, 6);
      y = text(doc, `  •  ${gap}`, actionX + 2, y + 2, { size: 7, color: SLATE_500, maxW: CW - 20 });
    }

    y += 4;
  }

  return y;
}

function buildSummary(doc: jsPDF, y: number, report: ComplianceReportData): number {
  y = sectionHeader(doc, y, 'Summary Statistics');

  const s = report.summary;

  // Stats row
  const boxW = CW / 4 - 3;
  const boxH = 22;
  y = ensureSpace(doc, y, boxH + 5);
  statBox(doc, ML, y, boxW, boxH, String(s.totalEntities), 'Total Vendors');
  statBox(doc, ML + boxW + 4, y, boxW, boxH, `${s.complianceScore}%`, 'Compliant', scoreRGB(s.complianceScore));
  statBox(doc, ML + (boxW + 4) * 2, y, boxW, boxH, String(s.expiredCount), 'Expired', s.expiredCount > 0 ? RED_600 : SLATE_900);
  statBox(doc, ML + (boxW + 4) * 3, y, boxW, boxH, String(s.expiringIn30Days), 'Expiring 30d', s.expiringIn30Days > 0 ? AMBER_600 : SLATE_900);
  y += boxH + 8;

  // Coverage breakdown table
  if (report.coverageBreakdown.length > 0) {
    y = ensureSpace(doc, y, 15);
    text(doc, 'Issue Breakdown by Coverage Type', ML, y, { size: 9, bold: true, color: SLATE_900 });
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR },
      head: [['Coverage Type', 'Vendors Affected', 'Missing', 'Insufficient', 'Exposure']],
      body: report.coverageBreakdown.map((cb) => [
        cb.coverageTypeLabel,
        String(cb.entityCount),
        cb.missingCount > 0 ? String(cb.missingCount) : '—',
        cb.insufficientCount > 0 ? String(cb.insufficientCount) : '—',
        cb.totalExposure > 0 ? fmtDollars(cb.totalExposure) : '—',
      ]),
      styles: { fontSize: 8, cellPadding: 2, textColor: [...SLATE_700] },
      headStyles: {
        fillColor: [...EMERALD],
        textColor: [...WHITE],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      alternateRowStyles: { fillColor: [...SLATE_50] },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right' },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 4) {
          const val = String(data.cell.raw ?? '');
          if (val !== '—') {
            data.cell.styles.textColor = [...RED_600];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable?.finalY ?? y + 20;
    y += 5;
  }

  return y;
}

function buildNeedsReview(doc: jsPDF, y: number, report: ComplianceReportData): number {
  if (report.needsReview.length === 0) return y;

  y = sectionHeader(doc, y, 'Vendors We Couldn\'t Classify');

  text(doc, 'These vendors were auto-classified with low confidence. Review and correct from your SmartCOI dashboard.', ML, y, {
    size: 8, color: SLATE_500, maxW: CW,
  });
  y += 6;

  for (const item of report.needsReview) {
    y = ensureSpace(doc, y, 10);
    rect(doc, ML, y, CW, 8, AMBER_50);
    rect(doc, ML, y, 2, 8, AMBER_600);
    text(doc, item.entityName, ML + 6, y + 5.5, { size: 9, bold: true, color: SLATE_900 });
    text(doc, item.inferredVendorTypeLabel ?? 'Unknown', PAGE_WIDTH - MR - 6, y + 5.5, {
      size: 8, color: AMBER_600, align: 'right',
    });
    y += 10;
  }

  return y;
}

function buildCTA(doc: jsPDF, y: number, report: ComplianceReportData): void {
  y = ensureSpace(doc, y, 40);
  y += 5;
  hr(doc, y);
  y += 8;

  text(doc, `This report is accurate as of ${fmtDate(report.generatedAt)}.`, PAGE_WIDTH / 2, y, {
    size: 9, color: SLATE_700, bold: true, align: 'center',
  });
  y += 6;
  text(
    doc,
    'Certificates expire, vendors change, and new compliance gaps can appear at any time.',
    PAGE_WIDTH / 2, y,
    { size: 8, color: SLATE_500, align: 'center', maxW: CW - 20 }
  );
  y += 7;
  text(
    doc,
    'Activate monitoring at smartcoi.io to get alerts the moment something changes.',
    PAGE_WIDTH / 2, y,
    { size: 8, color: SLATE_500, align: 'center', maxW: CW - 20 }
  );
  y += 10;

  // CTA box
  const ctaW = 70;
  const ctaH = 10;
  const ctaX = PAGE_WIDTH / 2 - ctaW / 2;
  rect(doc, ctaX, y, ctaW, ctaH, EMERALD);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('Start Monitoring — $79/month', PAGE_WIDTH / 2, y + 7, { align: 'center' });
}

// ============================================================================
// Main export
// ============================================================================

export function generateReportPDF(report: ComplianceReportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = buildHeader(doc, report);
  y = buildIssues(doc, y, report);

  doc.addPage();
  footer(doc);
  y = MT;

  y = buildVendorBreakdown(doc, y, report);
  y = buildActions(doc, y, report);
  y = buildSummary(doc, y, report);
  y = buildNeedsReview(doc, y, report);
  buildCTA(doc, y, report);

  // Download
  const orgSlug = report.organizationName.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-');
  const date = report.generatedAt.split('T')[0];
  doc.save(`SmartCOI-Compliance-Report-${orgSlug}-${date}.pdf`);
}
