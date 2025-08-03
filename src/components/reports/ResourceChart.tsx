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
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

interface ResourceData {
  userId: string;
  userName: string;
  email: string;
  role: string;
  totalLoggedHours: number;
  averageWeeklyHours: number;
  utilizationRate: number;
  overtimeWeeks: number;
  projectHours: Record<string, { projectName: string; hours: number; tasks: number }>;
  skillUtilization: { development: number; design: number; planning: number };
  totalProjects: number;
  startDate: string | null;
  endDate: string | null;
}

interface ResourceChartProps {
  data: ResourceData[];
  type: 'utilization' | 'overtime' | 'skills' | 'project';
}

export default function ResourceChart({ data, type }: ResourceChartProps) {
  if (type === 'utilization') {
    const chartData = {
      labels: data.map(item => item.userName),
      datasets: [
        {
          label: '활용률 (%)',
          data: data.map(item => item.utilizationRate),
          backgroundColor: data.map(item => {
            if (item.utilizationRate >= 80) return 'rgba(34, 197, 94, 0.8)';
            if (item.utilizationRate >= 60) return 'rgba(59, 130, 246, 0.8)';
            return 'rgba(239, 68, 68, 0.8)';
          }),
          borderColor: data.map(item => {
            if (item.utilizationRate >= 80) return 'rgba(34, 197, 94, 1)';
            if (item.utilizationRate >= 60) return 'rgba(59, 130, 246, 1)';
            return 'rgba(239, 68, 68, 1)';
          }),
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
          text: '팀원별 리소스 활용률',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: '활용률 (%)',
          },
        },
        x: {
          title: {
            display: true,
            text: '팀원',
          },
        },
      },
    };

    return <Bar data={chartData} options={options} />;
  }

  if (type === 'overtime') {
    const chartData = {
      labels: data.map(item => item.userName),
      datasets: [
        {
          label: '평균 주간 작업시간',
          data: data.map(item => item.averageWeeklyHours),
          backgroundColor: data.map(item => {
            if (item.averageWeeklyHours > 40) return 'rgba(239, 68, 68, 0.8)';
            if (item.averageWeeklyHours > 35) return 'rgba(245, 158, 11, 0.8)';
            return 'rgba(34, 197, 94, 0.8)';
          }),
          borderColor: data.map(item => {
            if (item.averageWeeklyHours > 40) return 'rgba(239, 68, 68, 1)';
            if (item.averageWeeklyHours > 35) return 'rgba(245, 158, 11, 1)';
            return 'rgba(34, 197, 94, 1)';
          }),
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
          text: '팀원별 평균 주간 작업시간',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '시간',
          },
        },
        x: {
          title: {
            display: true,
            text: '팀원',
          },
        },
      },
    };

    return <Bar data={chartData} options={options} />;
  }

  if (type === 'skills') {
    // 모든 사용자의 스킬 데이터를 통합
    const totalSkills = data.reduce((acc, user) => {
      acc.development += user.skillUtilization.development;
      acc.design += user.skillUtilization.design;
      acc.planning += user.skillUtilization.planning;
      return acc;
    }, { development: 0, design: 0, planning: 0 });

    const chartData = {
      labels: ['개발', '디자인', '기획'],
      datasets: [
        {
          label: '스킬별 활용 시간',
          data: [totalSkills.development, totalSkills.design, totalSkills.planning],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(34, 197, 94, 0.8)',
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(34, 197, 94, 1)',
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
          text: '팀 전체 스킬 활용 현황',
        },
      },
    };

    return <Doughnut data={chartData} options={options} />;
  }

  if (type === 'project') {
    // 모든 사용자의 프로젝트별 시간을 통합
    const projectHours: Record<string, number> = {};
    
    data.forEach(user => {
      Object.entries(user.projectHours).forEach(([projectId, data]) => {
        if (!projectHours[data.projectName]) {
          projectHours[data.projectName] = 0;
        }
        projectHours[data.projectName] += data.hours;
      });
    });

    const sortedProjects = Object.entries(projectHours)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // 상위 10개 프로젝트만 표시

    const chartData = {
      labels: sortedProjects.map(([name]) => name),
      datasets: [
        {
          label: '프로젝트별 총 작업시간',
          data: sortedProjects.map(([, hours]) => hours),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
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
          text: '프로젝트별 총 작업시간 (상위 10개)',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '시간',
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

  return null;
} 