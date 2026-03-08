import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PdfColumn {
  key: string;
  label: string;
}

interface PdfSummaryItem {
  label: string;
  value: string;
}

interface ExportPdfOptions {
  title: string;
  subtitle?: string;
  summary?: PdfSummaryItem[];
  columns: PdfColumn[];
  data: Record<string, any>[];
  fileName: string;
}

export function exportToPDF({ title, subtitle, summary, columns, data, fileName }: ExportPdfOptions) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, y, { align: "center" });
  y += 8;

  // Subtitle
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(subtitle, pageWidth / 2, y, { align: "center" });
    doc.setTextColor(0);
    y += 10;
  }

  // Summary cards
  if (summary && summary.length > 0) {
    const cardWidth = (pageWidth - 30) / summary.length;
    summary.forEach((item, i) => {
      const x = 15 + i * cardWidth;
      doc.setDrawColor(200);
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(x, y, cardWidth - 5, 22, 3, 3, "FD");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(item.label, x + (cardWidth - 5) / 2, y + 8, { align: "center" });
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(item.value, x + (cardWidth - 5) / 2, y + 17, { align: "center" });
    });
    y += 30;
  }

  // Table
  if (data.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [columns.map(c => c.label)],
      body: data.map(row => columns.map(c => String(row[c.key] ?? ""))),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [41, 41, 41], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 15, right: 15 },
    });
  } else {
    doc.setFontSize(11);
    doc.setTextColor(150);
    doc.text("No data available", pageWidth / 2, y + 10, { align: "center" });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`${fileName}.pdf`);
}
