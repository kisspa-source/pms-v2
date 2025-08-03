'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);

interface FinancialData {
  projectId: string;
  projectName: string;
  clientName: string;
  budget: number;
  actualCost: number;
  costVariance: number;
  costVariancePercentage: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  roi: number;
  startDate: string;
  endDate: string;
  status: string;
  monthlyData: Record<string, { hours: number; cost: number }>;
}

interface FinancialChartProps {
  data: FinancialData[];
  type: 'budget' | 'profit' | 'monthly';
}

export default function FinancialChart({ data, type }: FinancialChartProps) {
  if (type === 'budget') {
    const chartData = {
      labels: data.map(item => item.projectName),
      datasets: [
        {
          label: '예산',
          data: data.map(item => item.budget),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          label: '실제 비용',
          data: data.map(item => item.actualCost),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: '예산 대비 실제 비용',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '금액 (원)',
          },
        },
        x: {
          title: {
            display: true,
            text: '프로젝트',
          },
        },
      },
    };

    return <Bar data={chartData} options={options} />;
  }

  if (type === 'profit') {
    const chartData = {
      labels: data.map(item => item.projectName),
      datasets: [
        {
          label: '수익',
          data: data.map(item => item.revenue),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
        {
          label: '이익',
          data: data.map(item => item.profit),
          backgroundColor: 'rgba(168, 85, 247, 0.8)',
          borderColor: 'rgba(168, 85, 247, 1)',
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: '프로젝트별 수익 및 이익',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '금액 (원)',
          },
        },
        x: {
          title: {
            display: true,
            text: '프로젝트',
          },
        },
      },
    };

    return <Bar data={chartData} options={options} />;
  }

  if (type === 'monthly') {
    // 모든 프로젝트의 월별 데이터를 통합
    const monthlyData: Record<string, { cost: number; hours: number }> = {};
    
    data.forEach(project => {
      Object.entries(project.monthlyData).forEach(([month, data]) => {
        if (!monthlyData[month]) {
          monthlyData[month] = { cost: 0, hours: 0 };
        }
        monthlyData[month].cost += data.cost;
        monthlyData[month].hours += data.hours;
      });
    });

    const sortedMonths = Object.keys(monthlyData).sort();

    const chartData = {
      labels: sortedMonths,
      datasets: [
        {
          label: '월별 비용',
          data: sortedMonths.map(month => monthlyData[month].cost),
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1,
        },
        {
          label: '월별 작업 시간',
          data: sortedMonths.map(month => monthlyData[month].hours),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
          yAxisID: 'y1',
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: '월별 비용 및 작업 시간 추이',
        },
      },
      scales: {
        y: {
          type: 'linear' as const,
          display: true,
          position: 'left' as const,
          title: {
            display: true,
            text: '비용 (원)',
          },
        },
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          title: {
            display: true,
            text: '작업 시간 (시간)',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
        x: {
          title: {
            display: true,
            text: '월',
          },
        },
      },
    };

    return <Line data={chartData} options={options} />;
  }

  return null;
} 