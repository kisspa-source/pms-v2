'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ProgressData {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  progressPercentage: number;
  totalLoggedHours: number;
  startDate: string;
  endDate: string;
  status: string;
  teamSize: number;
}

interface ProgressChartProps {
  data: ProgressData[];
  type: 'bar' | 'doughnut';
}

export default function ProgressChart({ data, type }: ProgressChartProps) {
  if (type === 'bar') {
    const chartData = {
      labels: data.map(item => item.projectName),
      datasets: [
        {
          label: '완료된 작업',
          data: data.map(item => item.completedTasks),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
        {
          label: '진행 중인 작업',
          data: data.map(item => item.inProgressTasks),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          label: '지연된 작업',
          data: data.map(item => item.overdueTasks),
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
          text: '프로젝트별 작업 현황',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '작업 수',
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

  if (type === 'doughnut') {
    const totalCompleted = data.reduce((sum, item) => sum + item.completedTasks, 0);
    const totalInProgress = data.reduce((sum, item) => sum + item.inProgressTasks, 0);
    const totalOverdue = data.reduce((sum, item) => sum + item.overdueTasks, 0);

    const chartData = {
      labels: ['완료', '진행 중', '지연'],
      datasets: [
        {
          data: [totalCompleted, totalInProgress, totalOverdue],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom' as const,
        },
        title: {
          display: true,
          text: '전체 작업 현황',
        },
      },
    };

    return <Doughnut data={chartData} options={options} />;
  }

  return null;
} 