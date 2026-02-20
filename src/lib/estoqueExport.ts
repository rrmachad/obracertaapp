import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Material } from '@/types/database';

interface ExportOptions {
  obraNome: string;
  empresaNome?: string;
  logoUrl?: string;
  translateName: (nome: string) => string;
  formatQty: (qtd: number, unidade: string) => string;
  labels: {
    title: string;
    material: string;
    unit: string;
    currentQty: string;
    minQty: string;
    status: string;
    low: string;
    ok: string;
    generatedAt: string;
    page: string;
    of: string;
  };
}

function addLogoToPDF(
  doc: jsPDF,
  logoUrl: string,
  x: number,
  y: number,
  maxW: number,
  maxH: number
): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const ratio = Math.min(maxW / img.width, maxH / img.height);
      try {
        doc.addImage(img, 'PNG', x, y, img.width * ratio, img.height * ratio);
        resolve(y + img.height * ratio + 6);
      } catch {
        resolve(y);
      }
    };
    img.onerror = () => resolve(y);
    img.src = logoUrl;
  });
}

export async function exportEstoquePDF(
  materiais: Material[],
  options: ExportOptions
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const colWidths = [75, 22, 30, 30, 22]; // nome, unidade, atual, mínima, status
  const rowH = 8;
  let y = 20;

  // Logo
  if (options.logoUrl) {
    y = await addLogoToPDF(doc, options.logoUrl, margin, y, 35, 20);
  }

  // Empresa
  if (options.empresaNome) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(options.empresaNome, pageWidth / 2, y, { align: 'center' });
    doc.setTextColor(0);
    y += 6;
  }

  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(options.labels.title.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(12);
  doc.text(options.obraNome.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text(
    `${options.labels.generatedAt}: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  doc.setTextColor(0);
  y += 10;

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Cabeçalho da tabela
  const headers = [
    options.labels.material,
    options.labels.unit,
    options.labels.currentQty,
    options.labels.minQty,
    options.labels.status,
  ];

  doc.setFillColor(40, 40, 40);
  doc.rect(margin, y - 5, pageWidth - margin * 2, rowH, 'F');
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  let xCursor = margin + 2;
  headers.forEach((h, i) => {
    doc.text(h, xCursor, y);
    xCursor += colWidths[i];
  });
  doc.setTextColor(0);
  y += 5;

  // Linhas de dados
  materiais.forEach((m, idx) => {
    // Nova página se necessário
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    const isLow = m.qtd_atual < m.qtd_minima;

    if (idx % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, y - 5, pageWidth - margin * 2, rowH, 'F');
    }

    if (isLow) {
      doc.setFillColor(255, 240, 240);
      doc.rect(margin, y - 5, pageWidth - margin * 2, rowH, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0);

    const nome = options.translateName(m.nome);
    const nomeClipped = nome.length > 38 ? nome.slice(0, 36) + '...' : nome;

    xCursor = margin + 2;
    const row = [
      nomeClipped,
      m.unidade,
      options.formatQty(m.qtd_atual, m.unidade),
      options.formatQty(m.qtd_minima, m.unidade),
    ];

    row.forEach((cell, i) => {
      doc.text(String(cell), xCursor, y);
      xCursor += colWidths[i];
    });

    // Status badge simulado
    if (isLow) {
      doc.setTextColor(180, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(options.labels.low, xCursor, y);
    } else {
      doc.setTextColor(0, 130, 0);
      doc.text(options.labels.ok, xCursor, y);
    }
    doc.setTextColor(0);

    // Linha divisória sutil
    doc.setDrawColor(220);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);

    y += rowH;
  });

  // Resumo
  y += 6;
  const totalLow = materiais.filter(m => m.qtd_atual < m.qtd_minima).length;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`Total: ${materiais.length} | ${options.labels.low}: ${totalLow}`, margin, y);

  // Numeração de páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text(
      `${options.labels.page} ${i} ${options.labels.of} ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
    doc.setTextColor(0);
  }

  doc.save(`estoque-${options.obraNome.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function exportEstoqueXLSX(
  materiais: Material[],
  options: ExportOptions
): void {
  const rows = materiais.map(m => ({
    [options.labels.material]: options.translateName(m.nome),
    [options.labels.unit]: m.unidade,
    [options.labels.currentQty]: m.qtd_atual,
    [options.labels.minQty]: m.qtd_minima,
    [options.labels.status]: m.qtd_atual < m.qtd_minima ? options.labels.low : options.labels.ok,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Larguras de coluna
  ws['!cols'] = [
    { wch: 40 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, options.labels.title);
  XLSX.writeFile(
    wb,
    `estoque-${options.obraNome.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
  );
}
