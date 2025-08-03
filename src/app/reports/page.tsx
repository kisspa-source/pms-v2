'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ProgressChart from '@/components/reports/ProgressChart';
import FinancialChart from '@/components/reports/FinancialChart';
import ResourceChart from '@/components/reports/ResourceChart';
import CustomerSatisfactionChart from '@/components/reports/CustomerSatisfactionChart';
import { generatePDFReport, formatCurrency, formatPercentage } from '@/lib/pdf-generator';
import { format } from 'date-fns';

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

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'progress' | 'financial' | 'resource' | 'satisfaction'>('progress');
  const [startDate, setStartDate] = useState(format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // 진행률 보고서 데이터 조회
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['progress-report', startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/reports/progress?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch progress data');
      const result = await response.json();
      return result.data as ProgressData[];
    },
    enabled: reportType === 'progress',
  });

  // 재무 보고서 데이터 조회
  const { data: financialData, isLoading: financialLoading } = useQuery({
    queryKey: ['financial-report', startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/reports/financial?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch financial data');
      const result = await response.json();
      return result.data as FinancialData[];
    },
    enabled: reportType === 'financial',
  });

  // 리소스 보고서 데이터 조회
  const { data: resourceData, isLoading: resourceLoading } = useQuery({
    queryKey: ['resource-report', startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/reports/resource?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch resource data');
      const result = await response.json();
      return result.data as ResourceData[];
    },
    enabled: reportType === 'resource',
  });

  // 고객 만족도 보고서 데이터 조회
  const { data: satisfactionData, isLoading: satisfactionLoading } = useQuery({
    queryKey: ['satisfaction-report', startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/reports/satisfaction?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch satisfaction data');
      const result = await response.json();
      return result.data as CustomerSatisfactionData[];
    },
    enabled: reportType === 'satisfaction',
  });

  const isLoading = progressLoading || financialLoading || resourceLoading || satisfactionLoading;

  const handlePDFExport = async () => {
    const elementId = 'report-chart';
    const options = {
      title: `${reportType === 'progress' ? '진행률' : reportType === 'financial' ? '재무' : reportType === 'resource' ? '리소스' : '고객 만족도'} 보고서`,
      subtitle: `${startDate} ~ ${endDate}`,
      data: reportType === 'progress' ? progressData || [] : 
            reportType === 'financial' ? financialData || [] : 
            reportType === 'resource' ? resourceData || [] :
            satisfactionData || [],
      type: reportType,
    };

    try {
      await generatePDFReport(elementId, options);
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성에 실패했습니다.');
    }
  };

  const renderProgressReport = () => {
    if (!progressData || progressData.length === 0) {
      return <div className="text-center text-gray-500">데이터가 없습니다.</div>;
    }

    const totalProjects = progressData.length;
    const totalTasks = progressData.reduce((sum, item) => sum + item.totalTasks, 0);
    const completedTasks = progressData.reduce((sum, item) => sum + item.completedTasks, 0);
    const avgProgress = progressData.reduce((sum, item) => sum + item.progressPercentage, 0) / totalProjects;

    return (
      <div className="space-y-6">
        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-600">총 프로젝트</div>
            <div className="text-2xl font-bold">{totalProjects}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">총 작업</div>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">완료된 작업</div>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">평균 진행률</div>
            <div className="text-2xl font-bold text-blue-600">{avgProgress.toFixed(1)}%</div>
          </Card>
        </div>

        {/* 차트 */}
        <div id="report-chart" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">프로젝트별 작업 현황</h3>
            <ProgressChart data={progressData} type="bar" />
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">전체 작업 현황</h3>
            <ProgressChart data={progressData} type="doughnut" />
          </Card>
        </div>
      </div>
    );
  };

  const renderFinancialReport = () => {
    if (!financialData || financialData.length === 0) {
      return <div className="text-center text-gray-500">데이터가 없습니다.</div>;
    }

    const totalBudget = financialData.reduce((sum, item) => sum + item.budget, 0);
    const totalCost = financialData.reduce((sum, item) => sum + item.actualCost, 0);
    const totalRevenue = financialData.reduce((sum, item) => sum + item.revenue, 0);
    const totalProfit = financialData.reduce((sum, item) => sum + item.profit, 0);

    return (
      <div className="space-y-6">
        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-600">총 예산</div>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">총 비용</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalCost)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">총 수익</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">총 이익</div>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalProfit)}</div>
          </Card>
        </div>

        {/* 차트 */}
        <div id="report-chart" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">예산 대비 실제 비용</h3>
            <FinancialChart data={financialData} type="budget" />
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">프로젝트별 수익 및 이익</h3>
            <FinancialChart data={financialData} type="profit" />
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">월별 비용 및 작업 시간 추이</h3>
            <FinancialChart data={financialData} type="monthly" />
          </Card>
        </div>
      </div>
    );
  };

  const renderResourceReport = () => {
    if (!resourceData || resourceData.length === 0) {
      return <div className="text-center text-gray-500">데이터가 없습니다.</div>;
    }

    const totalUsers = resourceData.length;
    const totalHours = resourceData.reduce((sum, item) => sum + item.totalLoggedHours, 0);
    const avgUtilization = resourceData.reduce((sum, item) => sum + item.utilizationRate, 0) / totalUsers;

    return (
      <div className="space-y-6">
        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-600">총 사용자</div>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">총 작업 시간</div>
            <div className="text-2xl font-bold">{totalHours}시간</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">평균 활용률</div>
            <div className="text-2xl font-bold text-blue-600">{avgUtilization.toFixed(1)}%</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">오버타임 주</div>
            <div className="text-2xl font-bold text-orange-600">
              {resourceData.reduce((sum, item) => sum + item.overtimeWeeks, 0)}
            </div>
          </Card>
        </div>

        {/* 차트 */}
        <div id="report-chart" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">팀원별 리소스 활용률</h3>
            <ResourceChart data={resourceData} type="utilization" />
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">팀원별 평균 주간 작업시간</h3>
            <ResourceChart data={resourceData} type="overtime" />
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">팀 전체 스킬 활용 현황</h3>
            <ResourceChart data={resourceData} type="skills" />
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">프로젝트별 총 작업시간</h3>
            <ResourceChart data={resourceData} type="project" />
          </Card>
        </div>

        {/* 사용자별 상세 정보 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">사용자별 리소스 활용률</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">사용자</th>
                  <th className="text-left p-2">역할</th>
                  <th className="text-left p-2">총 작업 시간</th>
                  <th className="text-left p-2">평균 주간 시간</th>
                  <th className="text-left p-2">활용률</th>
                  <th className="text-left p-2">오버타임 주</th>
                </tr>
              </thead>
              <tbody>
                {resourceData.map((user) => (
                  <tr key={user.userId} className="border-b hover:bg-gray-50">
                    <td className="p-2">{user.userName}</td>
                    <td className="p-2">{user.role}</td>
                    <td className="p-2">{user.totalLoggedHours}시간</td>
                    <td className="p-2">{user.averageWeeklyHours}시간</td>
                    <td className="p-2">{formatPercentage(user.utilizationRate)}</td>
                    <td className="p-2">{user.overtimeWeeks}주</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const renderSatisfactionReport = () => {
    if (!satisfactionData || satisfactionData.length === 0) {
      return <div className="text-center text-gray-500">데이터가 없습니다.</div>;
    }

    const totalClients = satisfactionData.length;
    const avgSatisfaction = satisfactionData.reduce((sum, item) => sum + item.averageSatisfaction, 0) / totalClients;
    const avgResponseRate = satisfactionData.reduce((sum, item) => sum + item.responseRate, 0) / totalClients;

    return (
      <div className="space-y-6">
        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-600">총 고객사</div>
            <div className="text-2xl font-bold">{totalClients}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">평균 만족도</div>
            <div className="text-2xl font-bold text-green-600">{avgSatisfaction.toFixed(1)}/5.0</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">평균 응답률</div>
            <div className="text-2xl font-bold text-blue-600">{avgResponseRate.toFixed(1)}%</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">총 프로젝트</div>
            <div className="text-2xl font-bold text-purple-600">
              {satisfactionData.reduce((sum, item) => sum + item.projectCount, 0)}
            </div>
          </Card>
        </div>

        {/* 차트 */}
        <div id="report-chart" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">고객사별 평균 만족도</h3>
            <CustomerSatisfactionChart data={satisfactionData} type="overview" />
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">만족도 추이</h3>
            <CustomerSatisfactionChart data={satisfactionData} type="trend" />
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">프로젝트별 만족도</h3>
            <CustomerSatisfactionChart data={satisfactionData} type="project" />
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">만족도 분포</h3>
            <CustomerSatisfactionChart data={satisfactionData} type="distribution" />
          </Card>
        </div>

        {/* 고객사별 상세 정보 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">고객사별 만족도 상세</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">고객사</th>
                  <th className="text-left p-2">프로젝트 수</th>
                  <th className="text-left p-2">평균 만족도</th>
                  <th className="text-left p-2">응답률</th>
                  <th className="text-left p-2">최근 조사일</th>
                </tr>
              </thead>
              <tbody>
                {satisfactionData.map((client) => (
                  <tr key={client.clientId} className="border-b hover:bg-gray-50">
                    <td className="p-2">{client.clientName}</td>
                    <td className="p-2">{client.projectCount}개</td>
                    <td className="p-2">{client.averageSatisfaction}/5.0</td>
                    <td className="p-2">{formatPercentage(client.responseRate)}</td>
                    <td className="p-2">{new Date(client.lastSurveyDate).toLocaleDateString('ko-KR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">보고서 및 분석</h1>
        <p className="text-gray-600">프로젝트 진행률, 재무 현황, 리소스 활용률을 분석하고 보고서를 생성합니다.</p>
      </div>

      {/* 필터 및 컨트롤 */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label>보고서 유형</Label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
            >
              <option value="progress">진행률 보고서</option>
              <option value="financial">재무 분석 보고서</option>
              <option value="resource">리소스 활용률 보고서</option>
              <option value="satisfaction">고객 만족도 보고서</option>
            </select>
          </div>
          <div>
            <Label>시작일</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label>종료일</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <Button onClick={handlePDFExport} className="w-full">
              PDF 다운로드
            </Button>
          </div>
        </div>
      </Card>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      )}

      {/* 보고서 내용 */}
      {!isLoading && (
        <>
          {reportType === 'progress' && renderProgressReport()}
          {reportType === 'financial' && renderFinancialReport()}
          {reportType === 'resource' && renderResourceReport()}
          {reportType === 'satisfaction' && renderSatisfactionReport()}
        </>
      )}
    </div>
  );
} 