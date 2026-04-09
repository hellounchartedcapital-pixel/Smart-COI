// ============================================================================
// SmartCOI — Compliance Audit PDF Report Generator
//
// Takes a RiskQuantificationResult plus org metadata and returns a PDF buffer.
// Uses jsPDF + jspdf-autotable for server-side PDF generation (Vercel-compatible).
// ============================================================================

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  RiskQuantificationResult,
  EntityRiskBreakdown,
  CoverageGap,
} from '@/lib/compliance/risk-quantification';

// ============================================================================
// Types
// ============================================================================

export interface AuditReportOrgMetadata {
  orgName: string;
  /** ISO date string (YYYY-MM-DD) for the audit date */
  auditDate: string;
  /** Industry label for display (e.g., "Property Management") */
  industryLabel?: string;
  /** Terminology: what entities are called (e.g., "Vendors", "Subcontractors") */
  entityLabel?: string;
}

// ============================================================================
// Design constants
// ============================================================================

const EMERALD = [5, 150, 105] as const; // #059669
const EMERALD_LIGHT = [236, 253, 245] as const; // #ecfdf5
const SLATE_900 = [15, 23, 42] as const; // #0f172a
const SLATE_700 = [51, 65, 85] as const; // #334155
const SLATE_500 = [100, 116, 139] as const; // #64748b
const SLATE_200 = [226, 232, 240] as const; // #e2e8f0
const SLATE_50 = [248, 250, 252] as const; // #f8fafc
const WHITE = [255, 255, 255] as const;
const RED_600 = [220, 38, 38] as const; // #dc2626
const AMBER_600 = [217, 119, 6] as const; // #d97706

const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 25;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

type RGB = readonly [number, number, number];

// ============================================================================
// Helpers
// ============================================================================

function formatDollars(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getRiskLevel(entity: EntityRiskBreakdown): {
  label: string;
  color: RGB;
} {
  if (entity.isExpired || entity.totalExposure > 500_000) {
    return { label: 'EXPIRED', color: RED_600 };
  }
  if (entity.isPartiallyExpired) {
    return { label: 'COVERAGE LAPSE', color: RED_600 };
  }
  if (entity.totalExposure > 100_000 || entity.hasUnquantifiableRisk) {
    return { label: 'WARNING', color: AMBER_600 };
  }
  return { label: 'MINOR', color: SLATE_500 };
}

function getGapStatusLabel(gap: CoverageGap): string {
  switch (gap.gapType) {
    case 'missing':
      return 'Missing';
    case 'missing_unquantifiable':
      return 'Missing (Statutory)';
    case 'insufficient':
      return 'Insufficient';
    case 'endorsement':
      return 'Endorsement Missing';
    default:
      return 'Gap';
  }
}

function toTitleCase(str: string): string {
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================================
// PDF Drawing Helpers
// ============================================================================

/** Draw text and return the Y position after it */
function drawText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: {
    fontSize?: number;
    color?: RGB;
    fontStyle?: 'normal' | 'bold' | 'italic';
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
  }
): number {
  const fontSize = options?.fontSize ?? 10;
  const color = options?.color ?? SLATE_700;
  const fontStyle = options?.fontStyle ?? 'normal';

  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  doc.setFont('helvetica', fontStyle);

  if (options?.maxWidth) {
    const lines = doc.splitTextToSize(text, options.maxWidth);
    doc.text(lines, x, y, { align: options?.align });
    return y + lines.length * fontSize * 0.4;
  }

  doc.text(text, x, y, { align: options?.align });
  return y + fontSize * 0.4;
}

/** Draw a horizontal rule */
function drawHR(doc: jsPDF, y: number, color: RGB = SLATE_200): number {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  return y + 3;
}

/** Draw a filled rectangle */
function drawRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  color: RGB
): void {
  doc.setFillColor(...color);
  doc.rect(x, y, w, h, 'F');
}

/** Draw a stat box (used in executive summary grid) */
function drawStatBox(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  value: string,
  label: string,
  valueColor: RGB = SLATE_900
): void {
  // Background
  drawRect(doc, x, y, w, h, SLATE_50);
  // Border top accent
  drawRect(doc, x, y, w, 1, EMERALD);

  // Value
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...valueColor);
  doc.text(value, x + w / 2, y + h / 2 - 1, { align: 'center' });

  // Label
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_500);
  doc.text(label, x + w / 2, y + h / 2 + 6, { align: 'center' });
}

/** Check if we need a new page, add one if so */
function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_HEIGHT - MARGIN_BOTTOM) {
    doc.addPage();
    addPageFooter(doc);
    return MARGIN_TOP;
  }
  return y;
}

/** Add page number footer to the current page */
function addPageFooter(doc: jsPDF): void {
  const pageNum = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_500);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Page ${pageNum}`,
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - 10,
    { align: 'center' }
  );
  doc.text(
    'SmartCOI Compliance Audit Report',
    MARGIN_LEFT,
    PAGE_HEIGHT - 10
  );
  doc.text(
    'Confidential',
    PAGE_WIDTH - MARGIN_RIGHT,
    PAGE_HEIGHT - 10,
    { align: 'right' }
  );
}

/** Draw a section header with emerald background */
function drawSectionHeader(
  doc: jsPDF,
  y: number,
  title: string
): number {
  y = ensureSpace(doc, y, 15);
  drawRect(doc, MARGIN_LEFT, y, CONTENT_WIDTH, 10, EMERALD);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text(title, MARGIN_LEFT + 5, y + 7);
  return y + 15;
}

// ============================================================================
// Page builders
// ============================================================================

function buildExecutiveSummary(
  doc: jsPDF,
  result: RiskQuantificationResult,
  meta: AuditReportOrgMetadata
): void {
  addPageFooter(doc);

  // ---- Header bar ----
  drawRect(doc, 0, 0, PAGE_WIDTH, 55, EMERALD);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('Certificate of Insurance', PAGE_WIDTH / 2, 20, {
    align: 'center',
  });
  doc.text('Compliance Audit Report', PAGE_WIDTH / 2, 30, {
    align: 'center',
  });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(meta.orgName, PAGE_WIDTH / 2, 40, { align: 'center' });
  doc.text(
    `${formatDate(meta.auditDate)}  |  Prepared by SmartCOI Compliance Services`,
    PAGE_WIDTH / 2,
    48,
    { align: 'center' }
  );

  // ---- Compliance score ----
  let y = 70;

  // Score circle background
  const scoreX = PAGE_WIDTH / 2;
  const scoreY = y + 20;
  const scoreRadius = 22;

  // Outer ring
  doc.setDrawColor(...EMERALD);
  doc.setLineWidth(2.5);
  doc.circle(scoreX, scoreY, scoreRadius, 'S');

  // Inner fill
  const scoreColor: RGB =
    result.complianceRate >= 80
      ? EMERALD
      : result.complianceRate >= 50
        ? AMBER_600
        : RED_600;

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${result.complianceRate}%`, scoreX, scoreY + 3, {
    align: 'center',
  });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_500);
  doc.text('COMPLIANCE RATE', scoreX, scoreY + 11, { align: 'center' });

  y = scoreY + scoreRadius + 10;

  // ---- Stats grid (2 rows x 3 cols) ----
  const boxW = (CONTENT_WIDTH - 10) / 3;
  const boxH = 25;
  const gap = 5;
  const gridX = MARGIN_LEFT;

  // Row 1
  drawStatBox(doc, gridX, y, boxW, boxH, String(result.entityCount), 'Total Entities');
  drawStatBox(
    doc,
    gridX + boxW + gap,
    y,
    boxW,
    boxH,
    String(result.nonCompliantCount),
    'Non-Compliant',
    result.nonCompliantCount > 0 ? RED_600 : SLATE_900
  );
  drawStatBox(
    doc,
    gridX + 2 * (boxW + gap),
    y,
    boxW,
    boxH,
    String(result.expiredCount),
    'Expired',
    result.expiredCount > 0 ? RED_600 : SLATE_900
  );

  y += boxH + gap;

  // Row 2
  drawStatBox(
    doc,
    gridX,
    y,
    boxW,
    boxH,
    String(result.expiringIn30Days),
    'Expiring in 30 Days',
    result.expiringIn30Days > 0 ? AMBER_600 : SLATE_900
  );
  drawStatBox(
    doc,
    gridX + boxW + gap,
    y,
    boxW,
    boxH,
    String(result.missingEndorsementCount),
    'Missing Endorsements',
    result.missingEndorsementCount > 0 ? AMBER_600 : SLATE_900
  );
  drawStatBox(
    doc,
    gridX + 2 * (boxW + gap),
    y,
    boxW,
    boxH,
    `${result.entityCount - result.nonCompliantCount}`,
    'Fully Compliant',
    EMERALD
  );

  y += boxH + 12;

  const hasRealExposure = result.totalExposureGap > 0;
  const hasExpiredOrEndorsement = result.expiredCount > 0 || result.missingEndorsementCount > 0;

  if (hasRealExposure) {
    // ---- Dollar exposure is meaningful — show prominently ----
    drawRect(doc, MARGIN_LEFT, y, CONTENT_WIDTH, 22, SLATE_50);
    drawRect(doc, MARGIN_LEFT, y, 3, 22, EMERALD); // left accent

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE_500);
    doc.text('ESTIMATED UNINSURED EXPOSURE', MARGIN_LEFT + 10, y + 7);

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...RED_600);
    doc.text(formatDollars(result.totalExposureGap), MARGIN_LEFT + 10, y + 18);

    y += 30;
  } else if (hasExpiredOrEndorsement) {
    // ---- $0 dollar exposure but real risks exist — show risk metrics as headline ----
    const boxHeight = 28;
    drawRect(doc, MARGIN_LEFT, y, CONTENT_WIDTH, boxHeight, SLATE_50);
    drawRect(doc, MARGIN_LEFT, y, 3, boxHeight, RED_600); // red accent

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE_500);
    doc.text('KEY RISK AREAS', MARGIN_LEFT + 10, y + 7);

    // Build headline risk items
    const riskParts: string[] = [];
    if (result.expiredCount > 0) {
      riskParts.push(`${result.expiredCount} Expired Certificate${result.expiredCount > 1 ? 's' : ''}`);
    }
    if (result.missingEndorsementCount > 0) {
      riskParts.push(`${result.missingEndorsementCount} Missing Endorsement${result.missingEndorsementCount > 1 ? 's' : ''}`);
    }
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...RED_600);
    doc.text(riskParts.join('   |   '), MARGIN_LEFT + 10, y + 19);

    // Secondary note
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE_500);
    doc.text('No coverage limit shortfalls identified', MARGIN_LEFT + 10, y + 25);

    y += boxHeight + 8;
  } else {
    // ---- Fully compliant — small green note ----
    drawRect(doc, MARGIN_LEFT, y, CONTENT_WIDTH, 14, EMERALD_LIGHT);
    drawRect(doc, MARGIN_LEFT, y, 3, 14, EMERALD);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...EMERALD);
    doc.text('All insurance requirements are currently met', MARGIN_LEFT + 10, y + 9);

    y += 22;
  }

  // ---- Explanatory paragraph ----
  const compliantPct = result.complianceRate;
  const entityLabel = meta.entityLabel ?? 'entities';
  let paragraph =
    `This audit reviewed ${result.entityCount} ${entityLabel} across your organization` +
    (meta.industryLabel ? ` (${meta.industryLabel})` : '') +
    `. ${compliantPct}% are currently in full compliance with your insurance requirements. `;

  if (hasRealExposure) {
    paragraph +=
      `${result.nonCompliantCount} ${entityLabel} have one or more coverage gaps, ` +
      `representing an estimated ${formatDollars(result.totalExposureGap)} in uninsured exposure. `;
  } else if (result.nonCompliantCount > 0 && result.missingEndorsementCount > 0) {
    const endorsementTypes = new Set<string>();
    for (const detail of result.endorsementGapDetails) {
      for (const e of detail.missingEndorsements) endorsementTypes.add(e);
    }
    const endorsementList = [...endorsementTypes].join(', ');
    paragraph +=
      `${result.missingEndorsementCount} ${entityLabel} are missing critical endorsements` +
      (endorsementList ? ` (${endorsementList})` : '') +
      `. While no coverage limit shortfalls were identified, missing endorsements mean your ` +
      `organization may not be protected as an additional insured party in the event of a claim. `;
  } else if (result.nonCompliantCount > 0) {
    paragraph += `${result.nonCompliantCount} ${entityLabel} have one or more compliance gaps. `;
  } else {
    paragraph += 'All entities are currently meeting their insurance requirements. ';
  }

  if (result.expiredCount > 0) {
    paragraph += `${result.expiredCount} certificate${result.expiredCount > 1 ? 's have' : ' has'} expired coverage and require${result.expiredCount === 1 ? 's' : ''} immediate attention. `;
  }
  if (result.expiringIn30Days > 0) {
    paragraph += `${result.expiringIn30Days} certificates will expire within the next 30 days.`;
  }

  y = drawText(doc, paragraph, MARGIN_LEFT, y, {
    fontSize: 9.5,
    color: SLATE_700,
    maxWidth: CONTENT_WIDTH,
  });
}

function buildPortfolioOverview(
  doc: jsPDF,
  result: RiskQuantificationResult,
  meta: AuditReportOrgMetadata
): void {
  doc.addPage();
  addPageFooter(doc);

  let y = MARGIN_TOP;
  y = drawSectionHeader(doc, y, 'Portfolio Overview');

  // ---- Compliance Breakdown Table ----
  y = drawText(doc, 'Compliance Status Distribution', MARGIN_LEFT, y, {
    fontSize: 11,
    fontStyle: 'bold',
    color: SLATE_900,
  });
  y += 3;

  const compliantCount = result.entityCount - result.nonCompliantCount;
  const noCertCount = result.perEntityBreakdown.filter(
    (e) => e.complianceStatus === 'pending'
  ).length;
  const nonCompliant = result.nonCompliantCount - result.expiredCount - noCertCount;

  const pct = (n: number) =>
    result.entityCount > 0
      ? ((n / result.entityCount) * 100).toFixed(1) + '%'
      : '0%';

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
    head: [['Status', 'Count', 'Percentage']],
    body: [
      ['Compliant', String(compliantCount), pct(compliantCount)],
      ['Non-Compliant', String(nonCompliant > 0 ? nonCompliant : 0), pct(nonCompliant > 0 ? nonCompliant : 0)],
      ['Expired', String(result.expiredCount), pct(result.expiredCount)],
      ['No Certificate', String(noCertCount), pct(noCertCount)],
    ],
    headStyles: {
      fillColor: [...EMERALD],
      textColor: [...WHITE],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [...SLATE_700],
    },
    alternateRowStyles: {
      fillColor: [...SLATE_50],
    },
    styles: {
      cellPadding: 3,
      lineColor: [...SLATE_200],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 40, halign: 'center' },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 12;

  // ---- Endorsement Gap Summary ----
  if (result.endorsementGapDetails.length > 0) {
    y = ensureSpace(doc, y, 40);
    y = drawText(doc, 'Endorsement Gaps', MARGIN_LEFT, y, {
      fontSize: 11,
      fontStyle: 'bold',
      color: SLATE_900,
    });
    y += 3;

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
      head: [['Entity', 'Type', 'Missing Endorsements']],
      body: result.endorsementGapDetails.map((d) => [
        d.entityName,
        d.entityType.charAt(0).toUpperCase() + d.entityType.slice(1),
        d.missingEndorsements.join(', '),
      ]),
      headStyles: {
        fillColor: [...EMERALD],
        textColor: [...WHITE],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [...SLATE_700],
      },
      alternateRowStyles: {
        fillColor: [...SLATE_50],
      },
      styles: {
        cellPadding: 3,
        lineColor: [...SLATE_200],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 30 },
        2: { cellWidth: 80 },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // ---- Coverage Type Breakdown ----
  y = ensureSpace(doc, y, 40);
  y = drawText(doc, 'Gaps by Coverage Type', MARGIN_LEFT, y, {
    fontSize: 11,
    fontStyle: 'bold',
    color: SLATE_900,
  });
  y += 3;

  if (result.perCoverageTypeBreakdown.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
      head: [
        [
          'Coverage Type',
          'Entities Affected',
          'Missing',
          'Insufficient',
          'Endorsement Gaps',
          'Total Exposure',
        ],
      ],
      body: result.perCoverageTypeBreakdown.map((ct) => [
        ct.coverageTypeLabel,
        String(ct.entityCount),
        String(ct.missingCount),
        String(ct.insufficientCount),
        String(ct.endorsementGapCount),
        ct.totalExposure > 0 ? formatDollars(ct.totalExposure) : 'N/A',
      ]),
      headStyles: {
        fillColor: [...EMERALD],
        textColor: [...WHITE],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [...SLATE_700],
      },
      alternateRowStyles: {
        fillColor: [...SLATE_50],
      },
      styles: {
        cellPadding: 2.5,
        lineColor: [...SLATE_200],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'right' },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 12;
  } else {
    y = drawText(doc, 'No coverage gaps identified.', MARGIN_LEFT, y, {
      fontSize: 9,
      color: SLATE_500,
    });
    y += 8;
  }

  // ---- Expiration Timeline ----
  y = ensureSpace(doc, y, 40);
  y = drawText(doc, 'Expiration Timeline', MARGIN_LEFT, y, {
    fontSize: 11,
    fontStyle: 'bold',
    color: SLATE_900,
  });
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
    head: [['Time Window', 'Certificates Expiring']],
    body: [
      ['Next 30 Days', String(result.expiringIn30Days)],
      ['Next 60 Days', String(result.expiringIn60Days)],
      ['Next 90 Days', String(result.expiringIn90Days)],
      ['Already Expired', String(result.expiredCount)],
    ],
    headStyles: {
      fillColor: [...EMERALD],
      textColor: [...WHITE],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [...SLATE_700],
    },
    alternateRowStyles: {
      fillColor: [...SLATE_50],
    },
    styles: {
      cellPadding: 3,
      lineColor: [...SLATE_200],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 50, halign: 'center' },
    },
  });
}

function buildEntityDetails(
  doc: jsPDF,
  result: RiskQuantificationResult,
  meta: AuditReportOrgMetadata
): void {
  const nonCompliantEntities = result.perEntityBreakdown.filter(
    (e) => e.coverageGaps.length > 0 || e.isExpired || e.isPartiallyExpired
  );

  if (nonCompliantEntities.length === 0) return;

  doc.addPage();
  addPageFooter(doc);

  let y = MARGIN_TOP;
  y = drawSectionHeader(doc, y, 'Entity Detail — Non-Compliant');

  const entityLabel = meta.entityLabel ?? 'entities';
  y = drawText(
    doc,
    `The following ${nonCompliantEntities.length} ${entityLabel} have compliance gaps requiring attention.`,
    MARGIN_LEFT,
    y,
    { fontSize: 9, color: SLATE_500 }
  );
  y += 5;

  for (const entity of nonCompliantEntities) {
    // Check if we need a new page (need ~60mm minimum for entity header + small table)
    if (y > PAGE_HEIGHT - MARGIN_BOTTOM - 60) {
      doc.addPage();
      addPageFooter(doc);
      y = MARGIN_TOP;
    }

    const risk = getRiskLevel(entity);

    // Entity header bar
    drawRect(doc, MARGIN_LEFT, y, CONTENT_WIDTH, 16, EMERALD_LIGHT);
    drawRect(doc, MARGIN_LEFT, y, 3, 16, EMERALD);

    // Entity name
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...SLATE_900);
    doc.text(entity.entityName, MARGIN_LEFT + 8, y + 6);

    // Entity type + property
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE_500);
    const entityInfo = [
      toTitleCase(entity.entityType),
      entity.propertyName ? `at ${entity.propertyName}` : null,
    ]
      .filter(Boolean)
      .join(' ');
    doc.text(entityInfo, MARGIN_LEFT + 8, y + 12);

    // Risk level badge
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...risk.color);
    doc.text(risk.label, PAGE_WIDTH - MARGIN_RIGHT - 5, y + 6, {
      align: 'right',
    });

    // Exposure amount
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE_700);
    const entityHasEndorsementGaps = entity.coverageGaps.some((g) => g.gapType === 'endorsement');
    const exposureText =
      entity.totalExposure > 0
        ? `Exposure: ${formatDollars(entity.totalExposure)}`
        : entity.hasUnquantifiableRisk
          ? 'Exposure: Unquantifiable'
          : entityHasEndorsementGaps
            ? 'Endorsement Gaps'
            : '';
    if (exposureText) {
      doc.text(exposureText, PAGE_WIDTH - MARGIN_RIGHT - 5, y + 12, {
        align: 'right',
      });
    }

    y += 20;

    // Coverage gaps table
    if (entity.coverageGaps.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN_LEFT + 3, right: MARGIN_RIGHT },
        head: [['Coverage Type', 'Required', 'Found', 'Gap', 'Status']],
        body: entity.coverageGaps.map((gap) => [
          gap.coverageTypeLabel,
          gap.requiredLimit != null
            ? formatDollars(gap.requiredLimit)
            : gap.limitType === 'statutory'
              ? 'Statutory'
              : 'N/A',
          gap.foundLimit != null ? formatDollars(gap.foundLimit) : 'None',
          gap.dollarGap != null ? formatDollars(gap.dollarGap) : '—',
          getGapStatusLabel(gap),
        ]),
        headStyles: {
          fillColor: [...SLATE_700],
          textColor: [...WHITE],
          fontStyle: 'bold',
          fontSize: 7.5,
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [...SLATE_700],
        },
        alternateRowStyles: {
          fillColor: [...SLATE_50],
        },
        styles: {
          cellPadding: 2,
          lineColor: [...SLATE_200],
          lineWidth: 0.15,
        },
        columnStyles: {
          0: { cellWidth: 38 },
          1: { halign: 'right', cellWidth: 28 },
          2: { halign: 'right', cellWidth: 28 },
          3: { halign: 'right', cellWidth: 28 },
          4: { cellWidth: 32 },
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 3;
    }

    // Expiration detail — show when entity has expired coverages but no gap rows cover it
    if (entity.coverageGaps.length === 0 && (entity.isExpired || entity.isPartiallyExpired)) {
      y = ensureSpace(doc, y, 15);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...RED_600);
      if (entity.isExpired) {
        doc.text('All coverages on this certificate have expired.', MARGIN_LEFT + 5, y);
      } else {
        const expiredList = entity.expiredCoverageTypes.join(', ');
        const expText = `Expired coverage: ${expiredList}`;
        const lines = doc.splitTextToSize(expText, CONTENT_WIDTH - 10);
        doc.text(lines, MARGIN_LEFT + 5, y);
        y += (lines.length - 1) * 3.5;
      }
      if (entity.earliestExpiration) {
        y += 4;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...SLATE_500);
        doc.text(`Earliest expiration: ${formatShortDate(entity.earliestExpiration)}`, MARGIN_LEFT + 5, y);
      }
      y += 4;
    }

    // Missing endorsements — extract specific endorsement types from gap descriptions
    const endorsementGaps = entity.coverageGaps.filter(
      (g) => g.gapType === 'endorsement'
    );
    if (endorsementGaps.length > 0) {
      y = ensureSpace(doc, y, 10);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...AMBER_600);
      const missingTypes: string[] = [];
      for (const g of endorsementGaps) {
        const desc = g.gapDescription;
        if (desc.includes('Additional Insured')) missingTypes.push(`Additional Insured (${g.coverageTypeLabel})`);
        else if (desc.includes('Waiver of Subrogation')) missingTypes.push(`Waiver of Subrogation (${g.coverageTypeLabel})`);
        else if (desc.includes('Primary')) missingTypes.push(`Primary & Non-Contributory (${g.coverageTypeLabel})`);
        else missingTypes.push(g.coverageTypeLabel);
      }
      const endorsementText = 'Endorsement Missing: ' + missingTypes.join(', ');
      const lines = doc.splitTextToSize(endorsementText, CONTENT_WIDTH - 10);
      doc.text(lines, MARGIN_LEFT + 5, y);
      y += lines.length * 3.5;
    }

    y += 6;
  }
}

function buildExpirationCalendar(
  doc: jsPDF,
  result: RiskQuantificationResult
): void {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const ninetyDaysOut = new Date(
    now.getTime() + 90 * 24 * 60 * 60 * 1000
  );

  // Collect entities with expirations in the next 90 days
  const expiringEntities = result.perEntityBreakdown
    .filter((e) => {
      if (!e.earliestExpiration) return false;
      const expDate = new Date(e.earliestExpiration + 'T00:00:00');
      return expDate <= ninetyDaysOut;
    })
    .sort((a, b) => {
      const dateA = a.earliestExpiration ?? '';
      const dateB = b.earliestExpiration ?? '';
      return dateA.localeCompare(dateB);
    });

  doc.addPage();
  addPageFooter(doc);

  let y = MARGIN_TOP;
  y = drawSectionHeader(doc, y, 'Expiration Calendar — Next 90 Days');

  if (expiringEntities.length === 0) {
    y = drawText(
      doc,
      'No certificates expiring within the next 90 days.',
      MARGIN_LEFT,
      y,
      { fontSize: 10, color: SLATE_500 }
    );
    return;
  }

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
    head: [['Expiration Date', 'Entity', 'Type', 'Property', 'Status']],
    body: expiringEntities.map((e) => {
      const expDate = e.earliestExpiration
        ? new Date(e.earliestExpiration + 'T00:00:00')
        : null;
      const isExpired = expDate ? expDate < now : false;
      return [
        e.earliestExpiration ? formatShortDate(e.earliestExpiration) : '—',
        e.entityName,
        toTitleCase(e.entityType),
        e.propertyName ?? '—',
        isExpired ? 'EXPIRED' : 'Expiring',
      ];
    }),
    headStyles: {
      fillColor: [...EMERALD],
      textColor: [...WHITE],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [...SLATE_700],
    },
    alternateRowStyles: {
      fillColor: [...SLATE_50],
    },
    styles: {
      cellPadding: 2.5,
      lineColor: [...SLATE_200],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 45 },
      2: { cellWidth: 30 },
      3: { cellWidth: 40 },
      4: { cellWidth: 25, halign: 'center' },
    },
    didParseCell: (data) => {
      // Color expired rows red
      if (data.section === 'body' && data.column.index === 4) {
        if (data.cell.raw === 'EXPIRED') {
          data.cell.styles.textColor = [RED_600[0], RED_600[1], RED_600[2]];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [AMBER_600[0], AMBER_600[1], AMBER_600[2]];
        }
      }
    },
  });
}

function buildRecommendations(
  doc: jsPDF,
  result: RiskQuantificationResult
): void {
  doc.addPage();
  addPageFooter(doc);

  let y = MARGIN_TOP;
  y = drawSectionHeader(doc, y, 'Recommendations & Priority Actions');

  y = drawText(
    doc,
    'The following actions are prioritized by risk exposure. Expired certificates and highest-dollar gaps are listed first.',
    MARGIN_LEFT,
    y,
    { fontSize: 9, color: SLATE_500, maxWidth: CONTENT_WIDTH }
  );
  y += 5;

  if (result.topPriorityActions.length === 0) {
    y = drawText(
      doc,
      'No priority actions — all entities are currently compliant.',
      MARGIN_LEFT,
      y,
      { fontSize: 10, color: EMERALD, fontStyle: 'bold' }
    );
  } else {
    for (let i = 0; i < result.topPriorityActions.length; i++) {
      const action = result.topPriorityActions[i];
      y = ensureSpace(doc, y, 35);

      // Priority number badge
      drawRect(doc, MARGIN_LEFT, y, 8, 8, EMERALD);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...WHITE);
      doc.text(String(i + 1), MARGIN_LEFT + 4, y + 6, { align: 'center' });

      // Entity name and exposure
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...SLATE_900);
      doc.text(action.entityName, MARGIN_LEFT + 12, y + 6);

      const exposureLabel =
        action.totalExposure > 0
          ? formatDollars(action.totalExposure) + ' exposure'
          : action.hasUnquantifiableRisk
            ? 'Unquantifiable risk'
            : '';

      if (exposureLabel) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...RED_600);
        doc.text(exposureLabel, PAGE_WIDTH - MARGIN_RIGHT, y + 6, {
          align: 'right',
        });
      }

      y += 11;

      // Action description
      y = drawText(doc, action.action, MARGIN_LEFT + 12, y, {
        fontSize: 8.5,
        color: SLATE_700,
        maxWidth: CONTENT_WIDTH - 15,
      });
      y += 1;

      // Top gaps
      for (const gapDesc of action.topGaps) {
        y = ensureSpace(doc, y, 6);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...SLATE_500);
        const lines = doc.splitTextToSize('• ' + gapDesc, CONTENT_WIDTH - 20);
        doc.text(lines, MARGIN_LEFT + 15, y);
        y += lines.length * 3.5;
      }

      y += 5;

      // Divider between actions
      if (i < result.topPriorityActions.length - 1) {
        y = drawHR(doc, y, SLATE_200);
        y += 2;
      }
    }
  }

  // ---- Footer CTA ----
  y = ensureSpace(doc, y, 45);
  y += 10;
  drawHR(doc, y, EMERALD);
  y += 8;

  y = drawText(
    doc,
    'Continuous Compliance Monitoring',
    PAGE_WIDTH / 2,
    y,
    {
      fontSize: 13,
      fontStyle: 'bold',
      color: EMERALD,
      align: 'center',
    }
  );
  y += 4;

  y = drawText(
    doc,
    'This report provides a point-in-time snapshot. For real-time compliance tracking,',
    PAGE_WIDTH / 2,
    y,
    { fontSize: 9, color: SLATE_700, align: 'center' }
  );
  y += 1;
  y = drawText(
    doc,
    'automated notifications, and continuous monitoring, visit smartcoi.io',
    PAGE_WIDTH / 2,
    y,
    { fontSize: 9, color: SLATE_700, align: 'center' }
  );
  y += 6;

  y = drawText(doc, 'Contact: contact@smartcoi.io', PAGE_WIDTH / 2, y, {
    fontSize: 9,
    fontStyle: 'bold',
    color: EMERALD,
    align: 'center',
  });
}

// ============================================================================
// Main export
// ============================================================================

/**
 * Generate a compliance audit PDF report.
 *
 * Returns a Buffer containing the PDF document.
 *
 * @param result - Output from `quantifyRisk()`
 * @param meta - Organization metadata for the report header
 */
export function generateComplianceAuditReport(
  result: RiskQuantificationResult,
  meta: AuditReportOrgMetadata
): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Build each section
  buildExecutiveSummary(doc, result, meta);
  buildPortfolioOverview(doc, result, meta);
  buildEntityDetails(doc, result, meta);
  buildExpirationCalendar(doc, result);
  buildRecommendations(doc, result);

  // Add page footers to all pages (re-apply since addPage calls above
  // only add footers to new pages, not retroactively)
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Clear and re-draw footer with total page count
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_500);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${totalPages}`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - 10,
      { align: 'center' }
    );
    doc.text(
      'SmartCOI Compliance Audit Report',
      MARGIN_LEFT,
      PAGE_HEIGHT - 10
    );
    doc.text(
      'Confidential',
      PAGE_WIDTH - MARGIN_RIGHT,
      PAGE_HEIGHT - 10,
      { align: 'right' }
    );
  }

  // Return as Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
