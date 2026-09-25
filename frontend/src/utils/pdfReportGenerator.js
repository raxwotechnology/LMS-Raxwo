import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Universal High-Quality PDF Report Generator for Wisdom LMS Admin
 * Produces crisp, branded, professional A4 PDF reports with institute headers,
 * metadata summary cards, beautifully styled data tables, and dynamic pagination.
 *
 * @param {Object} options
 * @param {string} options.title - Report title (e.g. "Student Registration Directory")
 * @param {string} [options.subtitle] - Optional subtitle / description
 * @param {string} options.filename - Desired PDF filename (without or with .pdf)
 * @param {Array<string>} options.headers - Array of table header strings
 * @param {Array<Array<any>>} options.rows - 2D array of row data
 * @param {'portrait'|'landscape'|'auto'} [options.orientation='auto'] - Page orientation
 * @param {Array<string|{label: string, value: string|number}>} [options.filterInfo] - Active filters
 * @param {Array<{label: string, value: string|number, color?: string}>} [options.summaryCards] - Top KPI summary stats
 * @param {Object} [options.columnStyles] - Custom column styling overrides
 * @param {string} [options.generatedBy='Wisdom Admin'] - User who generated the report
 */
export const generatePdfReport = ({
  title = 'Wisdom LMS Report',
  subtitle = '',
  filename = 'report',
  headers = [],
  rows = [],
  orientation = 'auto',
  filterInfo = [],
  summaryCards = [],
  columnStyles = {},
  generatedBy = 'Wisdom Admin'
}) => {
  try {
    // 1. Determine orientation: Wide tables (> 6 columns) default to landscape for readability
    const resolvedOrientation =
      orientation === 'auto'
        ? headers.length > 6
          ? 'landscape'
          : 'portrait'
        : orientation;

    const doc = new jsPDF({
      orientation: resolvedOrientation,
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 14;
    const marginRight = 14;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Palette: Wisdom Institute Palette
    const primaryNavy = [11, 16, 36];     // #0b1024
    const brandBlue = [3, 105, 161];      // #0369a1
    const accentSky = [56, 189, 248];     // #38bdf8
    const darkGray = [30, 41, 59];        // #1e293b
    const mutedGray = [100, 116, 139];    // #64748b
    const lightBorder = [226, 232, 240];  // #e2e8f0

    // Top Brand Accent Bar
    doc.setFillColor(...brandBlue);
    doc.rect(0, 0, pageWidth, 4, 'F');
    doc.setFillColor(...accentSky);
    doc.rect(0, 3.2, pageWidth, 0.8, 'F');

    let currentY = 12;

    // 2. Organization Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...primaryNavy);
    doc.text('WISDOM INSTITUTE OF HIGHER EDUCATION', marginLeft, currentY);

    // Organization Tagline
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...mutedGray);
    doc.text(
      'Learning Management System (LMS) • Official Administrative Document',
      marginLeft,
      currentY + 4.5
    );

    // Right-aligned Generation Metadata
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...brandBlue);
    doc.text(`CONFIDENTIAL REPORT`, pageWidth - marginRight, currentY, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mutedGray);
    doc.text(
      `Generated: ${formattedDate} at ${formattedTime}`,
      pageWidth - marginRight,
      currentY + 4.2,
      { align: 'right' }
    );
    doc.text(`Issuer: ${generatedBy}`, pageWidth - marginRight, currentY + 8, {
      align: 'right'
    });

    currentY += 12;

    // Separator line
    doc.setDrawColor(...lightBorder);
    doc.setLineWidth(0.4);
    doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);

    currentY += 6;

    // 3. Report Title Banner
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...brandBlue);
    doc.text(title.toUpperCase(), marginLeft, currentY);

    if (subtitle) {
      currentY += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...mutedGray);
      doc.text(subtitle, marginLeft, currentY);
    }

    currentY += 5;

    // 4. Filter / Scope Strip (if provided)
    if (filterInfo && filterInfo.length > 0) {
      const filterStrings = filterInfo.map((f) =>
        typeof f === 'string' ? f : `${f.label}: ${f.value}`
      );
      const filterLine = `Scope / Filters: ${filterStrings.join('   |   ')}`;

      doc.setFillColor(241, 245, 249); // #f1f5f9
      doc.roundedRect(marginLeft, currentY, contentWidth, 7, 1.5, 1.5, 'F');
      doc.setDrawColor(...lightBorder);
      doc.roundedRect(marginLeft, currentY, contentWidth, 7, 1.5, 1.5, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...brandBlue);
      doc.text('FILTERS ACTIVE:', marginLeft + 3, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkGray);
      doc.text(filterStrings.join('   •   '), marginLeft + 28, currentY + 4.5);

      currentY += 10;
    }

    // 5. Summary KPI Cards (if provided)
    if (summaryCards && summaryCards.length > 0) {
      const cardCount = summaryCards.length;
      const cardGap = 4;
      const cardWidth = (contentWidth - (cardCount - 1) * cardGap) / cardCount;
      const cardHeight = 13;

      summaryCards.forEach((card, idx) => {
        const cardX = marginLeft + idx * (cardWidth + cardGap);

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
        doc.setDrawColor(...lightBorder);
        doc.setLineWidth(0.3);
        doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');

        // Card Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...mutedGray);
        doc.text(card.label.toUpperCase(), cardX + 3, currentY + 4.5);

        // Card Value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(...(card.color === 'green' ? [22, 163, 74] : card.color === 'red' ? [220, 38, 38] : brandBlue));
        doc.text(String(card.value ?? '0'), cardX + 3, currentY + 10);
      });

      currentY += cardHeight + 5;
    }

    // Records Count Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...mutedGray);
    doc.text(`Total Records: ${rows.length}`, marginLeft, currentY);
    currentY += 3;

    // 6. Auto-detect numeric / currency columns to align right
    const autoColumnStyles = { ...columnStyles };
    if (headers && rows.length > 0) {
      headers.forEach((h, colIdx) => {
        if (!autoColumnStyles[colIdx]) {
          const lowerH = String(h).toLowerCase();
          const isNumericHeader =
            lowerH.includes('lkr') ||
            lowerH.includes('fee') ||
            lowerH.includes('price') ||
            lowerH.includes('amount') ||
            lowerH.includes('salary') ||
            lowerH.includes('revenue') ||
            lowerH.includes('total') ||
            lowerH.includes('marks') ||
            lowerH.includes('count');

          if (isNumericHeader) {
            autoColumnStyles[colIdx] = { halign: 'right' };
          }
        }
      });
    }

    // 7. Render AutoTable
    autoTable(doc, {
      startY: currentY,
      head: [headers],
      body: rows,
      theme: 'grid',
      margin: { left: marginLeft, right: marginRight, bottom: 18 },
      headStyles: {
        fillColor: brandBlue,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: resolvedOrientation === 'landscape' ? 8 : 8.5,
        halign: 'left',
        valign: 'middle',
        cellPadding: 2.6
      },
      bodyStyles: {
        textColor: darkGray,
        fontSize: resolvedOrientation === 'landscape' ? 7.5 : 8,
        cellPadding: 2.2,
        valign: 'middle',
        overflow: 'linebreak'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // #f8fafc
      },
      styles: {
        font: 'helvetica',
        lineColor: lightBorder,
        lineWidth: 0.2
      },
      columnStyles: autoColumnStyles,
      didDrawPage: () => {
        // Top mini-bar on subsequent pages
        const pageNum = doc.internal.getNumberOfPages();
        if (pageNum > 1) {
          doc.setFillColor(...brandBlue);
          doc.rect(0, 0, pageWidth, 2.5, 'F');
        }
      }
    });

    // 8. Add Uniform Footer on Every Page
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Separator line
      doc.setDrawColor(...lightBorder);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, pageHeight - 11, pageWidth - marginRight, pageHeight - 11);

      // Left Footer text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...mutedGray);
      doc.text(
        'Wisdom LMS • Confidential Institutional Record • Not for Public Circulation',
        marginLeft,
        pageHeight - 6.5
      );

      // Right Footer text (Page X of Y)
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - marginRight,
        pageHeight - 6.5,
        { align: 'right' }
      );
    }

    // 9. Save PDF file
    const safeFilename = filename.toLowerCase().endsWith('.pdf')
      ? filename
      : `${filename}.pdf`;

    doc.save(safeFilename);
    return true;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
};

export default generatePdfReport;
