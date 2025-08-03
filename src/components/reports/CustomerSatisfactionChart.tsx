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
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface CustomerSatisfactionData {
  clientId: string;
  clientName: string;
  projectCount: number;
  averageSatisfaction: number;
  satisfactionHistory: Array<{
    date: string;
    score: number;
    feedback: string;
  }>;
  projectSatisfaction: Array<{
    projectName: string;
    score: number;
    feedback: string;
  }>;
  responseRate: number;
  lastSurveyDate: string;
}

interface CustomerSatisfactionChartProps {
  data: CustomerSatisfactionData[];
  type: 'overview' | 'trend' | 'project' | 'distribution';
}

export default function CustomerSatisfactionChart({ data, type }: CustomerSatisfactionChartProps) {
  if (type === 'overview') {
    const chartData = {
      labels: data.map(item => item.clientName),
      datasets: [
        {
          label: '평균 만족도',
          data: data.map(item => item.averageSatisfaction),
          backgroundColor: data.map(item => {
            if (item.averageSatisfaction >= 4.5) return 'rgba(34, 197, 94, 0.8)';
            if (item.averageSatisfaction >= 4.0) return 'rgba(59, 130, 246, 0.8)';
            if (item.averageSatisfaction >= 3.5) return 'rgba(245, 158, 11, 0.8)';
            return 'rgba(239, 68, 68, 0.8)';
          }),
          borderColor: data.map(item => {
            if (item.averageSatisfaction >= 4.5) return 'rgba(34, 197, 94, 1)';
            if (item.averageSatisfaction >= 4.0) return 'rgba(59, 130, 246, 1)';
            if (item.averageSatisfaction >= 3.5) return 'rgba(245, 158, 11, 1)';
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
          text: '고객사별 평균 만족도',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 5,
          title: {
            display: true,
            text: '만족도 점수 (1-5)',
          },
        },
        x: {
          title: {
            display: true,
            text: '고객사',
          },
        },
      },
    };

    return <Bar data={chartData} options={options} />;
  }

  if (type === 'trend') {
    // 모든 고객사의 만족도 히스토리를 통합하여 시간순으로 정렬
    const allHistory = data.flatMap(client => 
      client.satisfactionHistory.map(item => ({
        ...item,
        clientName: client.clientName,
      }))
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 월별 평균 만족도 계산
    const monthlyData = allHistory.reduce((acc, item) => {
      const month = new Date(item.date).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { scores: [], count: 0 };
      }
      acc[month].scores.push(item.score);
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, { scores: number[]; count: number }>);

    const sortedMonths = Object.keys(monthlyData).sort();
    const averageScores = sortedMonths.map(month => {
      const scores = monthlyData[month].scores;
      return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    const chartData = {
      labels: sortedMonths,
      datasets: [
        {
          label: '월별 평균 만족도',
          data: averageScores,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
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
          text: '만족도 추이',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 5,
          title: {
            display: true,
            text: '만족도 점수',
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

  if (type === 'project') {
    // 모든 프로젝트의 만족도를 통합
    const allProjects = data.flatMap(client => 
      client.projectSatisfaction.map(item => ({
        ...item,
        clientName: client.clientName,
      }))
    ).sort((a, b) => b.score - a.score);

    const topProjects = allProjects.slice(0, 10); // 상위 10개 프로젝트

    const chartData = {
      labels: topProjects.map(item => `${item.projectName} (${item.clientName})`),
      datasets: [
        {
          label: '프로젝트 만족도',
          data: topProjects.map(item => item.score),
          backgroundColor: topProjects.map(item => {
            if (item.score >= 4.5) return 'rgba(34, 197, 94, 0.8)';
            if (item.score >= 4.0) return 'rgba(59, 130, 246, 0.8)';
            if (item.score >= 3.5) return 'rgba(245, 158, 11, 0.8)';
            return 'rgba(239, 68, 68, 0.8)';
          }),
          borderColor: topProjects.map(item => {
            if (item.score >= 4.5) return 'rgba(34, 197, 94, 1)';
            if (item.score >= 4.0) return 'rgba(59, 130, 246, 1)';
            if (item.score >= 3.5) return 'rgba(245, 158, 11, 1)';
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
          text: '프로젝트별 만족도 (상위 10개)',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 5,
          title: {
            display: true,
            text: '만족도 점수',
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

  if (type === 'distribution') {
    // 만족도 분포 계산
    const allScores = data.flatMap(client => 
      client.satisfactionHistory.map(item => item.score)
    );

    const distribution = {
      '매우 만족 (4.5-5.0)': allScores.filter(score => score >= 4.5).length,
      '만족 (4.0-4.4)': allScores.filter(score => score >= 4.0 && score < 4.5).length,
      '보통 (3.5-3.9)': allScores.filter(score => score >= 3.5 && score < 4.0).length,
      '불만족 (3.0-3.4)': allScores.filter(score => score >= 3.0 && score < 3.5).length,
      '매우 불만족 (1.0-2.9)': allScores.filter(score => score < 3.0).length,
    };

    const chartData = {
      labels: Object.keys(distribution),
      datasets: [
        {
          data: Object.values(distribution),
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(107, 114, 128, 0.8)',
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(107, 114, 128, 1)',
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
          text: '만족도 분포',
        },
      },
    };

    return <Doughnut data={chartData} options={options} />;
  }

  return null;
} 