import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportNoteToPdf(title: string, contentHtml: string): Promise<void> {
  // Create a temporary container with styled markdown content
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.padding = '40px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1a1a1a';
  container.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif';
  container.style.fontSize = '14px';
  container.style.lineHeight = '1.7';
  container.innerHTML = `
    <style>
      .pdf-content h1 { font-size: 28px; font-weight: 700; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
      .pdf-content h2 { font-size: 22px; font-weight: 600; margin: 20px 0 8px; }
      .pdf-content h3 { font-size: 18px; font-weight: 600; margin: 16px 0 6px; }
      .pdf-content p { margin: 0 0 12px; }
      .pdf-content ul, .pdf-content ol { margin: 0 0 12px; padding-left: 24px; }
      .pdf-content li { margin-bottom: 4px; }
      .pdf-content code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: 'JetBrains Mono', monospace; }
      .pdf-content pre { background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 0 0 12px; overflow-x: auto; }
      .pdf-content pre code { background: transparent; padding: 0; }
      .pdf-content blockquote { border-left: 3px solid #7c3aed; padding-left: 16px; margin: 12px 0; color: #6b7280; font-style: italic; }
      .pdf-content a { color: #7c3aed; text-decoration: none; }
      .pdf-content table { width: 100%; border-collapse: collapse; margin: 0 0 12px; }
      .pdf-content th, .pdf-content td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
      .pdf-content th { background: #f9fafb; font-weight: 600; }
      .pdf-content hr { margin: 20px 0; border: none; border-top: 1px solid #e5e7eb; }
      .pdf-content img { max-width: 100%; border-radius: 8px; }
    </style>
    <div class="pdf-content">${contentHtml}</div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF('p', 'mm', 'a4');

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const safeName = title.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'note';
    pdf.save(`${safeName}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
