import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFReportOptions {
  title: string;
  subtitle?: string;
  data: any[];
  type: 'progress' | 'financial' | 'resource' | 'satisfaction';
}

export async function generatePDFReport(
  elementId: string,
  options: PDFReportOptions
): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // HTML을 캔버스로 변환
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // 제목 추가
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(options.title, pdfWidth / 2, 20, { align: 'center' });

    if (options.subtitle) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(options.subtitle, pdfWidth / 2, 30, { align: 'center' });
    }

    // 생성 날짜 추가
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('ko-KR');
    pdf.text(`생성일: ${currentDate}`, pdfWidth / 2, 40, { align: 'center' });

    // 차트 이미지 추가
    const imgWidth = pdfWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    if (imgHeight > pdfHeight - 60) {
      // 페이지가 넘칠 경우 여러 페이지로 나누기
      let heightLeft = imgHeight;
      let position = 50;
      let page = 1;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 60);

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
        page++;
      }
    } else {
      pdf.addImage(imgData, 'PNG', 10, 50, imgWidth, imgHeight);
    }

    // 요약 데이터 추가
    if (options.data.length > 0) {
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('요약 데이터', 20, 20);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      let yPosition = 40;

      if (options.type === 'progress') {
        const totalProjects = options.data.length;
        const totalTasks = options.data.reduce((sum, item) => sum + item.totalTasks, 0);
        const completedTasks = options.data.reduce((sum, item) => sum + item.completedTasks, 0);
        const avgProgress = options.data.reduce((sum, item) => sum + item.progressPercentage, 0) / totalProjects;

        pdf.text(`총 프로젝트 수: ${totalProjects}`, 20, yPosition);
        yPosition += 10;
        pdf.text(`총 작업 수: ${totalTasks}`, 20, yPosition);
        yPosition += 10;
        pdf.text(`완료된 작업 수: ${completedTasks}`, 20, yPosition);
        yPosition += 10;
        pdf.text(`평균 진행률: ${avgProgress.toFixed(1)}%`, 20, yPosition);
      } else if (options.type === 'financial') {
        const totalBudget = options.data.reduce((sum, item) => sum + item.budget, 0);
        const totalCost = options.data.reduce((sum, item) => sum + item.actualCost, 0);
        const totalRevenue = options.data.reduce((sum, item) => sum + item.revenue, 0);
        const totalProfit = options.data.reduce((sum, item) => sum + item.profit, 0);

        pdf.text(`총 예산: ${totalBudget.toLocaleString()}원`, 20, yPosition);
        yPosition += 10;
        pdf.text(`총 실제 비용: ${totalCost.toLocaleString()}원`, 20, yPosition);
        yPosition += 10;
        pdf.text(`총 수익: ${totalRevenue.toLocaleString()}원`, 20, yPosition);
        yPosition += 10;
        pdf.text(`총 이익: ${totalProfit.toLocaleString()}원`, 20, yPosition);
      } else if (options.type === 'resource') {
        const totalUsers = options.data.length;
        const totalHours = options.data.reduce((sum, item) => sum + item.totalLoggedHours, 0);
        const avgUtilization = options.data.reduce((sum, item) => sum + item.utilizationRate, 0) / totalUsers;

        pdf.text(`총 사용자 수: ${totalUsers}`, 20, yPosition);
        yPosition += 10;
        pdf.text(`총 작업 시간: ${totalHours}시간`, 20, yPosition);
        yPosition += 10;
        pdf.text(`평균 활용률: ${avgUtilization.toFixed(1)}%`, 20, yPosition);
      } else if (options.type === 'satisfaction') {
        const totalClients = options.data.length;
        const avgSatisfaction = options.data.reduce((sum, item) => sum + item.averageSatisfaction, 0) / totalClients;
        const avgResponseRate = options.data.reduce((sum, item) => sum + item.responseRate, 0) / totalClients;

        pdf.text(`총 고객사 수: ${totalClients}`, 20, yPosition);
        yPosition += 10;
        pdf.text(`평균 만족도: ${avgSatisfaction.toFixed(1)}/5.0`, 20, yPosition);
        yPosition += 10;
        pdf.text(`평균 응답률: ${avgResponseRate.toFixed(1)}%`, 20, yPosition);
      }
    }

    // PDF 저장
    const fileName = `${options.title}_${currentDate.replace(/\./g, '-')}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    throw error;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
} 