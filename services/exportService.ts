
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPDF = async (elementId: string, filename: string = 'document.pdf') => {
    const element = document.getElementById(elementId);
    if (!element) return null;

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        return pdf;
    } catch (error) {
        console.error('PDF Export Error:', error);
        return null;
    }
};

export const downloadPDF = async (elementId: string, filename: string) => {
    const pdf = await exportToPDF(elementId, filename);
    if (pdf) {
        pdf.save(filename);
    }
};

export const shareToWhatsApp = async (elementId: string, message: string = 'Check out this report from Visionary Care HMS') => {
    // Since we are in a web environment, we can't directly send a file to WhatsApp Web via URL
    // But we can trigger a download and then open WhatsApp or share a text link if it was hosted.
    // For a local app, the best UX is providing the text + instruction.
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
};

export const shareToEmail = async (elementId: string, subject: string, body: string) => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
};
