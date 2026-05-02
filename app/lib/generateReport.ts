import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';

export const generateReport = async (
  element: HTMLElement,
  filename: string = 'airsona_report.pdf'
): Promise<boolean> => {
  try {
    const canvas = await toCanvas(element, {
      pixelRatio: 2, // High resolution
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    
    // A4 dimensions
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const totalPdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = totalPdfHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalPdfHeight);
    heightLeft -= pageHeight;

    // Subsequent pages
    while (heightLeft > 0) {
      position = position - pageHeight; // Shift the image up
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalPdfHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};
