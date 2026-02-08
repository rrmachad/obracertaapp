import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DiarioLog, ClimaTipo, Profissional, FotoComLegenda } from '@/types/database';

const climaLabels: Record<ClimaTipo, string> = {
  ensolarado: 'Ensolarado',
  parcialmente_nublado: 'Parcialmente nublado',
  nublado: 'Nublado',
  chuvoso: 'Chuvoso',
};

// Helper function to add text with word wrap
function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

// Helper function to add logo to PDF
async function addLogoToPDF(
  doc: jsPDF,
  logoUrl: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number
): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
      const width = img.width * ratio;
      const height = img.height * ratio;
      
      try {
        doc.addImage(img, 'PNG', x, y, width, height);
        resolve(y + height + 10);
      } catch {
        // If image fails to add, just return current y
        resolve(y);
      }
    };
    img.onerror = () => {
      resolve(y);
    };
    img.src = logoUrl;
  });
}

export interface PDFOptions {
  logoUrl?: string;
  empresaNome?: string;
}

interface DailyReportData {
  data: string;
  clima: ClimaTipo;
  atividades_realizadas: string;
  observacoes?: string | null;
  profissionais?: Profissional[] | null;
  fotos?: FotoComLegenda[] | null;
}

// Helper function to load image as base64
async function loadImageAsBase64(url: string): Promise<{ data: string; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const data = canvas.toDataURL('image/jpeg', 0.8);
          resolve({ data, width: img.width, height: img.height });
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Helper function to add photos to PDF with captions
async function addPhotosToPDF(
  doc: jsPDF,
  photos: FotoComLegenda[],
  startY: number,
  margin: number,
  maxWidth: number,
  pageHeight: number,
  lineHeight: number
): Promise<number> {
  if (!photos || photos.length === 0) return startY;

  let y = startY;
  const photoMaxWidth = (maxWidth - 10) / 2; // Two photos per row with gap
  const photoMaxHeight = 60;
  const captionHeight = 12; // Space for caption

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('FOTOS', margin, y);
  y += lineHeight;

  let photoX = margin;
  let rowMaxHeight = 0;
  const captionsForRow: { x: number; y: number; width: number; text: string }[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const imageData = await loadImageAsBase64(photo.url);

    if (imageData) {
      // Calculate scaled dimensions
      const ratio = Math.min(photoMaxWidth / imageData.width, photoMaxHeight / imageData.height);
      const scaledWidth = imageData.width * ratio;
      const scaledHeight = imageData.height * ratio;
      const totalHeight = scaledHeight + (photo.legenda ? captionHeight : 0);

      // Check if we need a new page
      if (y + totalHeight > pageHeight - 30) {
        // Add captions before page break
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        captionsForRow.forEach((cap) => {
          if (cap.text) {
            const lines = doc.splitTextToSize(cap.text, cap.width);
            doc.text(lines[0] || '', cap.x, cap.y);
          }
        });
        captionsForRow.length = 0;

        doc.addPage();
        y = 20;
        photoX = margin;
        rowMaxHeight = 0;
      }

      // Add the image
      try {
        doc.addImage(imageData.data, 'JPEG', photoX, y, scaledWidth, scaledHeight);
        rowMaxHeight = Math.max(rowMaxHeight, scaledHeight);

        // Store caption for later (after row is complete)
        if (photo.legenda) {
          captionsForRow.push({
            x: photoX,
            y: y + scaledHeight + 4,
            width: scaledWidth,
            text: photo.legenda,
          });
        }

        // Move to next position
        if (i % 2 === 0) {
          photoX = margin + photoMaxWidth + 10;
        } else {
          // End of row - add captions
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(80);
          captionsForRow.forEach((cap) => {
            if (cap.text) {
              const lines = doc.splitTextToSize(cap.text, cap.width);
              doc.text(lines[0] || '', cap.x, cap.y);
            }
          });
          doc.setTextColor(0);
          captionsForRow.length = 0;

          photoX = margin;
          y += rowMaxHeight + (captionsForRow.length > 0 ? captionHeight : 5);
          rowMaxHeight = 0;
        }
      } catch {
        // Skip image if it fails to add
      }
    }
  }

  // If last row had an odd number of photos, add remaining captions and move y down
  if (photos.length % 2 !== 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(80);
    captionsForRow.forEach((cap) => {
      if (cap.text) {
        const lines = doc.splitTextToSize(cap.text, cap.width);
        doc.text(lines[0] || '', cap.x, cap.y);
      }
    });
    doc.setTextColor(0);
    y += rowMaxHeight + captionHeight;
  }

  return y + lineHeight;
}

interface ReportStats {
  diasTrabalhados: number;
  totalProfissionais: number;
  profissionais: Record<string, number>;
  clima: Record<ClimaTipo, number>;
}

interface WeeklyReportData {
  obraNome: string;
  periodo: { inicio: Date; fim: Date };
  estatisticas: ReportStats;
  registros: DiarioLog[];
}

export interface MonthlyReportData {
  obraNome: string;
  mes: Date;
  estatisticas: ReportStats & { diasNoMes: number };
  registros: DiarioLog[];
}

// Generate PDF for a single daily report
export async function generateDailyReportPDF(
  registro: DailyReportData,
  obraNome: string,
  options?: PDFOptions
): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 7;
  let y = 20;

  // Add logo if provided
  if (options?.logoUrl) {
    y = await addLogoToPDF(doc, options.logoUrl, margin, y, 40, 25);
  }

  // Company name
  if (options?.empresaNome) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128);
    doc.text(options.empresaNome, pageWidth / 2, y, { align: 'center' });
    doc.setTextColor(0);
    y += 8;
  }

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('DIÁRIO DE OBRA', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(14);
  doc.text(obraNome.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Date and Weather
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const dataFormatada = format(
    new Date(registro.data + 'T12:00:00'),
    "EEEE, dd 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  );
  doc.text(`Data: ${dataFormatada}`, margin, y);
  y += lineHeight;

  doc.text(`Clima: ${climaLabels[registro.clima]}`, margin, y);
  y += lineHeight * 2;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Activities
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ATIVIDADES REALIZADAS', margin, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  y = addWrappedText(doc, registro.atividades_realizadas, margin, y, maxWidth, lineHeight);
  y += lineHeight;

  // Professionals
  if (registro.profissionais && registro.profissionais.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('PROFISSIONAIS', margin, y);
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    const totalProfissionais = registro.profissionais.reduce((sum, p) => sum + p.quantidade, 0);
    doc.text(`Total: ${totalProfissionais} profissionais`, margin, y);
    y += lineHeight;

    registro.profissionais.forEach((prof) => {
      doc.text(`• ${prof.quantidade} ${prof.funcao}`, margin + 5, y);
      y += lineHeight;
    });
    y += lineHeight / 2;
  }

  // Observations
  if (registro.observacoes) {
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES', margin, y);
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    y = addWrappedText(doc, registro.observacoes, margin, y, maxWidth, lineHeight);
    y += lineHeight;
  }

  // Photos
  if (registro.fotos && registro.fotos.length > 0) {
    const pageHeight = doc.internal.pageSize.getHeight();
    y = await addPhotosToPDF(doc, registro.fotos, y, margin, maxWidth, pageHeight, lineHeight);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  return doc;
}

// Generate PDF for weekly report
export async function generateWeeklyReportPDF(
  data: WeeklyReportData,
  options?: PDFOptions
): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 7;
  let y = 20;

  // Add logo if provided
  if (options?.logoUrl) {
    y = await addLogoToPDF(doc, options.logoUrl, margin, y, 40, 25);
  }

  // Company name
  if (options?.empresaNome) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128);
    doc.text(options.empresaNome, pageWidth / 2, y, { align: 'center' });
    doc.setTextColor(0);
    y += 8;
  }

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO SEMANAL', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(14);
  doc.text(data.obraNome.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Período: ${format(data.periodo.inicio, 'dd/MM/yyyy')} a ${format(data.periodo.fim, 'dd/MM/yyyy')}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 15;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Statistics
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO DA SEMANA', margin, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.text(`• Dias trabalhados: ${data.estatisticas.diasTrabalhados} de 7`, margin, y);
  y += lineHeight;
  doc.text(`• Total de presenças: ${data.estatisticas.totalProfissionais}`, margin, y);
  y += lineHeight * 1.5;

  // Professionals breakdown
  if (Object.keys(data.estatisticas.profissionais).length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('EFETIVO DA SEMANA', margin, y);
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    Object.entries(data.estatisticas.profissionais).forEach(([funcao, qtd]) => {
      doc.text(`• ${funcao}: ${qtd} presença(s)`, margin, y);
      y += lineHeight;
    });
    y += lineHeight / 2;
  }

  // Weather summary
  doc.setFont('helvetica', 'bold');
  doc.text('CLIMA DA SEMANA', margin, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  Object.entries(data.estatisticas.clima)
    .filter(([, count]) => count > 0)
    .forEach(([clima, count]) => {
      doc.text(`• ${climaLabels[clima as ClimaTipo]}: ${count} dia(s)`, margin, y);
      y += lineHeight;
    });
  y += lineHeight;

  // Line separator
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Daily activities
  doc.setFont('helvetica', 'bold');
  doc.text('ATIVIDADES DIÁRIAS', margin, y);
  y += lineHeight * 1.5;

  data.registros.forEach((registro, regIdx) => {
    // Check if we need a new page
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 20;
    }

    const dataFormatada = format(
      new Date(registro.data + 'T12:00:00'),
      "EEEE, dd/MM",
      { locale: ptBR }
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${dataFormatada.toUpperCase()} - ${climaLabels[registro.clima]}`, margin, y);
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y = addWrappedText(doc, registro.atividades_realizadas, margin, y, maxWidth, 6);

    if (registro.observacoes) {
      doc.setFont('helvetica', 'italic');
      y = addWrappedText(doc, `Obs: ${registro.observacoes}`, margin, y, maxWidth, 6);
    }

    y += lineHeight;
  });

  // Add photos section at the end
  const registrosComFotos = data.registros.filter(r => r.fotos && r.fotos.length > 0);
  if (registrosComFotos.length > 0) {
    doc.addPage();
    y = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRO FOTOGRÁFICO', pageWidth / 2, y, { align: 'center' });
    y += lineHeight * 2;

    for (const registro of registrosComFotos) {
      if (y > pageHeight - 80) {
        doc.addPage();
        y = 20;
      }

      const dataFormatada = format(
        new Date(registro.data + 'T12:00:00'),
        "dd/MM/yyyy",
        { locale: ptBR }
      );

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(dataFormatada, margin, y);
      y += lineHeight;

      y = await addPhotosToPDF(doc, registro.fotos, y, margin, maxWidth, pageHeight, lineHeight);
      y += lineHeight / 2;
    }
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  return doc;
}

// Generate PDF for monthly report
export async function generateMonthlyReportPDF(
  data: MonthlyReportData,
  options?: PDFOptions
): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 7;
  let y = 20;

  // Add logo if provided
  if (options?.logoUrl) {
    y = await addLogoToPDF(doc, options.logoUrl, margin, y, 40, 25);
  }

  // Company name
  if (options?.empresaNome) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128);
    doc.text(options.empresaNome, pageWidth / 2, y, { align: 'center' });
    doc.setTextColor(0);
    y += 8;
  }

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO MENSAL', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(14);
  doc.text(data.obraNome.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(
    format(data.mes, "MMMM 'de' yyyy", { locale: ptBR }).toUpperCase(),
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 15;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Statistics
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO DO MÊS', margin, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.text(`• Dias trabalhados: ${data.estatisticas.diasTrabalhados} de ${data.estatisticas.diasNoMes}`, margin, y);
  y += lineHeight;
  doc.text(`• Total de presenças: ${data.estatisticas.totalProfissionais}`, margin, y);
  y += lineHeight * 1.5;

  // Professionals breakdown
  if (Object.keys(data.estatisticas.profissionais).length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('EFETIVO DO MÊS', margin, y);
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    Object.entries(data.estatisticas.profissionais).forEach(([funcao, qtd]) => {
      doc.text(`• ${funcao}: ${qtd} presença(s)`, margin, y);
      y += lineHeight;
    });
    y += lineHeight / 2;
  }

  // Weather summary
  doc.setFont('helvetica', 'bold');
  doc.text('CLIMA DO MÊS', margin, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  Object.entries(data.estatisticas.clima)
    .filter(([, count]) => count > 0)
    .forEach(([clima, count]) => {
      doc.text(`• ${climaLabels[clima as ClimaTipo]}: ${count} dia(s)`, margin, y);
      y += lineHeight;
    });
  y += lineHeight;

  // Line separator
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Daily activities
  doc.setFont('helvetica', 'bold');
  doc.text('ATIVIDADES DIÁRIAS', margin, y);
  y += lineHeight * 1.5;

  data.registros.forEach((registro) => {
    // Check if we need a new page
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 20;
    }

    const dataFormatada = format(
      new Date(registro.data + 'T12:00:00'),
      "EEEE, dd/MM",
      { locale: ptBR }
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${dataFormatada.toUpperCase()} - ${climaLabels[registro.clima]}`, margin, y);
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y = addWrappedText(doc, registro.atividades_realizadas, margin, y, maxWidth, 6);

    if (registro.observacoes) {
      doc.setFont('helvetica', 'italic');
      y = addWrappedText(doc, `Obs: ${registro.observacoes}`, margin, y, maxWidth, 6);
    }

    y += lineHeight;
  });

  // Add photos section at the end
  const registrosComFotos = data.registros.filter(r => r.fotos && r.fotos.length > 0);
  if (registrosComFotos.length > 0) {
    doc.addPage();
    y = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRO FOTOGRÁFICO', pageWidth / 2, y, { align: 'center' });
    y += lineHeight * 2;

    for (const registro of registrosComFotos) {
      if (y > pageHeight - 80) {
        doc.addPage();
        y = 20;
      }

      const dataFormatada = format(
        new Date(registro.data + 'T12:00:00'),
        "dd/MM/yyyy",
        { locale: ptBR }
      );

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(dataFormatada, margin, y);
      y += lineHeight;

      y = await addPhotosToPDF(doc, registro.fotos, y, margin, maxWidth, pageHeight, lineHeight);
      y += lineHeight / 2;
    }
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  return doc;
}

// Download PDF file
export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}

// Generate shareable text for daily report
export function generateDailyShareText(
  registro: DailyReportData,
  obraNome: string
): string {
  const linhas: string[] = [];
  const dataFormatada = format(
    new Date(registro.data + 'T12:00:00'),
    "EEEE, dd/MM/yyyy",
    { locale: ptBR }
  );

  linhas.push(`📋 DIÁRIO DE OBRA - ${obraNome.toUpperCase()}`);
  linhas.push(`📅 ${dataFormatada}`);
  linhas.push(`🌤️ Clima: ${climaLabels[registro.clima]}`);
  linhas.push('');
  linhas.push('📝 ATIVIDADES:');
  linhas.push(registro.atividades_realizadas);

  if (registro.profissionais && registro.profissionais.length > 0) {
    linhas.push('');
    linhas.push('👷 PROFISSIONAIS:');
    registro.profissionais.forEach((prof) => {
      linhas.push(`• ${prof.quantidade} ${prof.funcao}`);
    });
  }

  if (registro.observacoes) {
    linhas.push('');
    linhas.push('📌 OBSERVAÇÕES:');
    linhas.push(registro.observacoes);
  }

  return linhas.join('\n');
}

// Generate shareable text for weekly report
export function generateWeeklyShareText(data: WeeklyReportData): string {
  const linhas: string[] = [];

  linhas.push(`📋 RELATÓRIO SEMANAL - ${data.obraNome.toUpperCase()}`);
  linhas.push(`Período: ${format(data.periodo.inicio, 'dd/MM/yyyy')} a ${format(data.periodo.fim, 'dd/MM/yyyy')}`);
  linhas.push('');
  linhas.push('═'.repeat(30));
  linhas.push('');
  linhas.push(`📅 RESUMO:`);
  linhas.push(`• Dias trabalhados: ${data.estatisticas.diasTrabalhados} de 7`);
  linhas.push(`• Total de presenças: ${data.estatisticas.totalProfissionais}`);
  linhas.push('');

  if (Object.keys(data.estatisticas.profissionais).length > 0) {
    linhas.push(`👷 EFETIVO DA SEMANA:`);
    Object.entries(data.estatisticas.profissionais).forEach(([funcao, qtd]) => {
      linhas.push(`• ${funcao}: ${qtd} presença(s)`);
    });
    linhas.push('');
  }

  linhas.push(`🌤️ CLIMA:`);
  Object.entries(data.estatisticas.clima)
    .filter(([, count]) => count > 0)
    .forEach(([clima, count]) => {
      linhas.push(`• ${climaLabels[clima as ClimaTipo]}: ${count} dia(s)`);
    });
  linhas.push('');
  linhas.push('═'.repeat(30));
  linhas.push('');
  linhas.push('📝 ATIVIDADES DIÁRIAS:');

  data.registros.forEach((registro) => {
    const diaFormatado = format(
      new Date(registro.data + 'T12:00:00'),
      "EEEE, dd/MM",
      { locale: ptBR }
    );
    linhas.push('');
    linhas.push(`📌 ${diaFormatado.toUpperCase()}`);
    linhas.push(registro.atividades_realizadas);
    if (registro.observacoes) {
      linhas.push(`Obs: ${registro.observacoes}`);
    }
  });

  return linhas.join('\n');
}

// Generate shareable text for monthly report
export function generateMonthlyShareText(data: MonthlyReportData): string {
  const linhas: string[] = [];

  linhas.push(`📋 RELATÓRIO MENSAL - ${data.obraNome.toUpperCase()}`);
  linhas.push(`${format(data.mes, "MMMM 'de' yyyy", { locale: ptBR }).toUpperCase()}`);
  linhas.push('');
  linhas.push('═'.repeat(30));
  linhas.push('');
  linhas.push(`📅 RESUMO:`);
  linhas.push(`• Dias trabalhados: ${data.estatisticas.diasTrabalhados} de ${data.estatisticas.diasNoMes}`);
  linhas.push(`• Total de presenças: ${data.estatisticas.totalProfissionais}`);
  linhas.push('');

  if (Object.keys(data.estatisticas.profissionais).length > 0) {
    linhas.push(`👷 EFETIVO DO MÊS:`);
    Object.entries(data.estatisticas.profissionais).forEach(([funcao, qtd]) => {
      linhas.push(`• ${funcao}: ${qtd} presença(s)`);
    });
    linhas.push('');
  }

  linhas.push(`🌤️ CLIMA:`);
  Object.entries(data.estatisticas.clima)
    .filter(([, count]) => count > 0)
    .forEach(([clima, count]) => {
      linhas.push(`• ${climaLabels[clima as ClimaTipo]}: ${count} dia(s)`);
    });
  linhas.push('');
  linhas.push('═'.repeat(30));
  linhas.push('');
  linhas.push('📝 ATIVIDADES DIÁRIAS:');

  data.registros.forEach((registro) => {
    const diaFormatado = format(
      new Date(registro.data + 'T12:00:00'),
      "EEEE, dd/MM",
      { locale: ptBR }
    );
    linhas.push('');
    linhas.push(`📌 ${diaFormatado.toUpperCase()}`);
    linhas.push(registro.atividades_realizadas);
    if (registro.observacoes) {
      linhas.push(`Obs: ${registro.observacoes}`);
    }
  });

  return linhas.join('\n');
}

// Share via Web Share API
export async function shareContent(
  title: string,
  text: string,
  url?: string
): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return true;
    } catch (error) {
      // User cancelled or share failed
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  }
  return false;
}

// Check if Web Share API is available
export function canShare(): boolean {
  return typeof navigator.share === 'function';
}

// Share via WhatsApp (fallback)
export function shareViaWhatsApp(text: string) {
  const encodedText = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encodedText}`, '_blank');
}

// Share via Email (fallback)
export function shareViaEmail(subject: string, body: string) {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  window.location.href = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
}
