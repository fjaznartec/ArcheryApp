import { jsPDF } from 'jspdf';
import { Sesion, Ejercicio, Usuario } from '../types';

/**
 * Generates and downloads a polished PDF workout card for a specific training session.
 */
export function generateSessionPDF(
  session: Sesion,
  exercisesList: Ejercicio[],
  assignedName: string,
  usuariosList?: Usuario[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  let currentY = 15;

  // Helper to draw clean lines
  const drawLine = (y: number, color = '#cbd5e1', thickness = 0.2) => {
    doc.setDrawColor(color);
    doc.setLineWidth(thickness);
    doc.line(marginX, y, pageWidth - marginX, y);
  };

  // Helper to add new page and reset Y if overflow
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 15;
      drawHeader(true); // Draw mini header on consecutive pages
    }
  };

  const drawHeader = (isSubPage = false) => {
    // Top primary Accent bar
    doc.setFillColor('#1e1b4b'); // deep indigo-950
    doc.rect(0, 0, pageWidth, isSubPage ? 4 : 8, 'F');

    // Archery target ring stripes for branding on the first page
    if (!isSubPage) {
      const colors = ['#eab308', '#ef4444', '#3b82f6', '#0f172a', '#f8fafc']; // Gold, Red, Blue, Dark, White
      const barHeight = 1.2;
      colors.forEach((col, idx) => {
        doc.setFillColor(col);
        doc.rect(marginX + (idx * 5), 10, 5, barHeight, 'F');
      });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor('#6366f1'); // Indigo-500
      doc.text('ARCHERY APP - Sesion de Entrenamiento', marginX, 16);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor('#64748b'); // Gray-500
      doc.text(`Documento de Entrenamiento • RefID: ${session.id}`, pageWidth - marginX, 16, { align: 'right' });

      currentY = 24;
    } else {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor('#6366f1');
      doc.text('ARCHERY APP — Sesion de Entrenamiento', marginX, 10);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor('#94a3b8');
      doc.text(`Sesión: ${session.titulo}`, pageWidth - marginX, 10, { align: 'right' });
      
      drawLine(13, '#e2e8f0');
      currentY = 20;
    }
  };

  // 1. Draw Initial Header
  drawHeader();

  // 2. Title Section
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor('#0f172a'); // slate-900
  const titleLines = doc.splitTextToSize(session.titulo || 'Sesión sin título', pageWidth - marginX * 2);
  doc.text(titleLines, marginX, currentY);
  currentY += (titleLines.length * 8) + 2;

  // Find Técnico Principal & Técnico Auxiliar names from usuariosList
  const tp = (usuariosList || []).find(u => u.rol === 'tecnico_principal');
  const nameTP = tp ? `${tp.nombre} ${tp.apellidos}` : 'Francisco Javier Antón';

  const ta = (usuariosList || []).find(u => u.rol === 'tecnico_auxiliar');
  const nameTA = ta ? `${ta.nombre} ${ta.apellidos}` : 'Marta Sánchez (Auxiliar)';

  // Subtitle/Meta Section Box
  ensureSpace(45);
  doc.setFillColor('#f8fafc'); // slate-50
  doc.setDrawColor('#e2e8f0');
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, currentY, pageWidth - marginX * 2, 38, 3, 3, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor('#475569'); // slate-600
  
  // Column 1 Info
  doc.text('TIPO DE ENTRENAMIENTO:', marginX + 5, currentY + 6);
  doc.text('FECHA PROGRAMADA:', marginX + 5, currentY + 13);
  doc.text('ASIGNADO A:', marginX + 5, currentY + 20);
  doc.text('TÉCNICO PRINCIPAL:', marginX + 5, currentY + 27);
  doc.text('TÉCNICO AUXILIAR:', marginX + 5, currentY + 34);

  // Column 1 Values
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor('#1e3a8a'); // Dark blue
  doc.text(session.tipo_entrenamiento.toUpperCase(), marginX + 55, currentY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor('#0f172a');
  doc.text(session.fecha_asignada, marginX + 55, currentY + 13);
  doc.text(assignedName, marginX + 55, currentY + 20);
  doc.text(nameTP, marginX + 55, currentY + 27);
  doc.text(nameTA, marginX + 55, currentY + 34);

  // Column 2 Info & Badges inside box
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor('#475569');
  doc.text('INTENSIDAD:', marginX + 115, currentY + 6);
  doc.text('FLECHAS TOTALES EST.:', marginX + 115, currentY + 13);

  // Column 2 Values
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(session.intensidad > 75 ? '#b91c1c' : '#047857'); // Red or Green
  doc.text(`${session.intensidad}%`, marginX + 160, currentY + 6);

  // calculate total estimated arrows
  const matchedEjercicios = session.ejercicios_ids?.map(eid => exercisesList.find(e => e.id === eid)).filter(Boolean) as Ejercicio[];
  const totalArrows = matchedEjercicios.reduce((acc, ej) => acc + (ej.intensidad_flechas_repeticion || 0), 0);
  
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor('#1e1b4b');
  doc.text(`${totalArrows} flechas`, marginX + 160, currentY + 13);

  currentY += 44;

  // 3. Comments block (if exists)
  if (session.comentarios) {
    const cleanComment = session.comentarios.replace(/[\n\r]+/g, ' ');
    const wrappedComments = doc.splitTextToSize(`"${cleanComment}"`, pageWidth - marginX * 2 - 10);
    const boxHeight = (wrappedComments.length * 4.5) + 8;
    
    ensureSpace(boxHeight + 5);

    doc.setFillColor('#fffbeb'); // warm amber background
    doc.setDrawColor('#fde68a');
    doc.roundedRect(marginX, currentY, pageWidth - marginX * 2, boxHeight, 2, 2, 'FD');

    doc.setFont('Helvetica', 'oblique');
    doc.setFontSize(8.5);
    doc.setTextColor('#92400e'); // Amber-800
    doc.text(wrappedComments, marginX + 5, currentY + 6);

    currentY += boxHeight + 8;
  } else {
    currentY += 4;
  }

  // 4. Exercises Title Section
  ensureSpace(12);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor('#0f172a');
  doc.text('PLAN DE TRABAJO Y EJERCICIOS', marginX, currentY);
  currentY += 5;
  drawLine(currentY, '#cbd5e1', 0.4);
  currentY += 6;

  // 5. Render Exercises list
  if (matchedEjercicios.length === 0) {
    ensureSpace(15);
    doc.setFont('Helvetica', 'oblique');
    doc.setFontSize(10);
    doc.setTextColor('#94a3b8');
    doc.text('No hay ejercicios asignados a esta sesión.', marginX + 4, currentY + 4);
    currentY += 15;
  } else {
    matchedEjercicios.forEach((ej, idx) => {
      // Custom card height check
      const cleanDesc = ej.descripcion || 'Sin descripción detallada por el técnico.';
      const wrappedDesc = doc.splitTextToSize(cleanDesc, pageWidth - marginX * 2 - 20);
      const exerciseCardHeight = 22 + (wrappedDesc.length * 4.5);

      ensureSpace(exerciseCardHeight + 5);

      // Card Container
      doc.setFillColor('#ffffff');
      doc.setDrawColor('#f1f5f9');
      doc.setLineWidth(1);
      doc.roundedRect(marginX, currentY, pageWidth - marginX * 2, exerciseCardHeight, 2, 2, 'FD');

      // Left Accent Strip (Idx based / Archery Colors)
      const accentColors = ['#eab308', '#ef4444', '#3b82f6', '#0f172a', '#10b981'];
      const stripColor = accentColors[idx % accentColors.length];
      doc.setFillColor(stripColor);
      doc.rect(marginX, currentY, 2.5, exerciseCardHeight, 'F');

      // Index and Name
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor('#1e293b');
      doc.text(`${idx + 1}. ${ej.nombre}`, marginX + 6, currentY + 6);

      // Category Pill / Badge (estimated x coordinate depending on text width)
      const typeBadge = ej.tipo_ejercicio || 'Otros';
      const textWidth = doc.getTextWidth(`${idx + 1}. ${ej.nombre}`);
      const badgeX = Math.min(marginX + textWidth + 10, pageWidth - 60);

      // Draw Badge background
      doc.setFillColor('#eff6ff');
      doc.roundedRect(badgeX, currentY + 2.5, 30, 4.5, 1, 1, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor('#1d4ed8');
      doc.text(typeBadge, badgeX + 15, currentY + 5.7, { align: 'center' });

      // Exercise Meta Info (Duration, Reps)
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor('#64748b');
      
      const metaText = `Duración: ${ej.duracion} min  |  Series/Repeticiones: ${ej.densidad_repeticiones || 'No especificado'}`;
      doc.text(metaText, marginX + 6, currentY + 11);

      // Description text
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor('#475569');
      doc.text(wrappedDesc, marginX + 6, currentY + 17);

      // Right Arrow count badge
      const rightBoxX = pageWidth - marginX - 25;
      doc.setFillColor('#f0fdf4');
      doc.setDrawColor('#dcfce7');
      doc.setLineWidth(0.2);
      doc.roundedRect(rightBoxX, currentY + 3, 20, 10, 1, 1, 'FD');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor('#15803d');
      doc.text('EST. FLECHAS', rightBoxX + 10, currentY + 6.2, { align: 'center' });
      doc.setFontSize(9.5);
      doc.text(`${ej.intensidad_flechas_repeticion || 0}`, rightBoxX + 10, currentY + 11, { align: 'center' });

      currentY += exerciseCardHeight + 5;
    });
  }

  // Draw Bottom signature / metadata
  ensureSpace(28);
  currentY += 4;
  drawLine(currentY, '#cbd5e1', 0.4);
  currentY += 6;

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor('#475569');
  doc.text('INSTRUCCIONES GENERALES DE EJECUCIÓN:', marginX, currentY);
  currentY += 4;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor('#64748b');
  const instructions = [
    '• Calienta meticulosamente al menos 10 minutos antes de comenzar las series de tiro real.',
    '• Mantén el plano de enfoque visual de tus dianas según lo pactado con tu técnico.',
    '• Registra tu puntaje o volumen total de flechas en el contador diario de flechas de tu panel.',
    '• En caso de dolor, fatiga o molestia articular, suspende inmediatamente el entrenamiento.'
  ];
  instructions.forEach(lines => {
    doc.text(lines, marginX, currentY);
    currentY += 3.5;
  });

  // Stamp / Watermark
  const dateStr = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Clean footer with total pages counting
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor('#94a3b8');
    
    // Bottom border
    drawLine(pageHeight - 12, '#f1f5f9');
    
    doc.text(
      `Generado por ArcheryApp el ${dateStr} • Descargado para deportistas federados`, 
      marginX, 
      pageHeight - 8
    );
    doc.text(
      `Página ${i} de ${pageCount}`, 
      pageWidth - marginX, 
      pageHeight - 8, 
      { align: 'right' }
    );
  }

  // Trigger browser download dialog
  const fileName = `Sesion_Entrenamiento_${session.titulo.replace(/\s+/g, '_')}_${session.fecha_asignada}.pdf`;
  doc.save(fileName);
}
