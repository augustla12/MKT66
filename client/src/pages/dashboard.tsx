import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, BarChart, PieChart } from '@/components/charts';
import { apiRequest } from '@/lib/api';
import {
  TrendingUp, Eye, MousePointer, CreditCard, Users, Download, AlertTriangle, Loader2,
  DollarSign, Activity, PlayCircle, PauseCircle, CheckCircle, Clock, ChevronRight,
  BarChart3, PieChart as PieChartIcon, Sparkles, Target, BarChartHorizontal
} from 'lucide-react';

// Interfaces para garantir a tipagem dos dados vindos da API
interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string | string[];
}
interface GenericChartData {
  labels: string[];
  datasets: ChartDataset[];
}
interface DashboardMetrics {
  activeCampaigns: number;
  totalCostPeriod: number;
  conversions: number;
  impressions: number;
  clicks: number;
  avgROI: number;
  ctr: number;
  cpc: number;
  cpa: number;
  cvr: number;
  cpm: number;
}
interface RecentCampaign {
  id: number;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget: number | string;
  spent: number | null;
  clicks: number | null;
  conversions: number | null;
}
interface DashboardAPIData {
  metrics: DashboardMetrics;
  recentCampaigns: RecentCampaign[];
  aiInsights: string[];
  timeSeriesData: GenericChartData;
  channelPerformanceData: GenericChartData;
  roiData: GenericChartData;
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('30d');

  const { data: dashboardData, isLoading, error } = useQuery<DashboardAPIData>({
    queryKey: ['dashboardData', timeRange],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/dashboard?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Falha ao carregar os dados do dashboard.');
      return response.json();
    },
    // Mantém os dados antigos enquanto busca novos para uma experiência mais suave
    placeholderData: (previousData) => previousData,
  });

  // Funções de formatação
  const formatCurrency = (value?: number | string | null) => {
    if (value == null || isNaN(Number(value))) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  };
  const formatNumber = (value?: number | null) => new Intl.NumberFormat('pt-BR').format(value ?? 0);
  const formatPercentage = (value?: number | null) => `${(value ?? 0).toFixed(2)}%`;

  const getStatusBadge = (status: string) => {
    const config = {
      active: { bg: 'bg-green-500/20', text: 'text-green-400', icon: PlayCircle, label: 'Ativo' },
      paused: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: PauseCircle, label: 'Pausado' },
      completed: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: CheckCircle, label: 'Concluído' },
      draft: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: Clock, label: 'Rascunho' }
    }[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: Clock, label: 'Rascunho' };
    const IconComponent = config.icon;
    return <Badge className={`border-transparent text-xs ${config.bg} ${config.text}`}><IconComponent className="w-3 h-3 mr-1" />{config.label}</Badge>;
  };

  if (isLoading && !dashboardData) {
    return <div className="flex items-center justify-center h-full p-6"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-4 text-muted-foreground">Carregando dashboard...</p></div>;
  }

  if (error) {
    return <div className="flex flex-col items-center justify-center h-full text-center p-4"><AlertTriangle className="w-16 h-16 text-destructive mb-4" /><h2 className="text-2xl font-semibold text-destructive mb-2">Erro ao Carregar</h2><p className="text-muted-foreground mb-4">{(error as Error).message}</p><Button onClick={() => window.location.reload()} className="mt-6 neu-button-primary">Tentar Novamente</Button></div>;
  }

  // Desestruturação segura com valores padrão para evitar o erro 'map of undefined'
  const { 
    metrics = {} as DashboardMetrics, 
    recentCampaigns = [], 
    aiInsights = [], 
    timeSeriesData = {labels:[], datasets:[]}, 
    channelPerformanceData = {labels:[], datasets:[]}, 
    roiData = {labels:[], datasets:[]} 
  } = dashboardData || {};

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div><h1 className="text-2xl md:text-3xl font-bold text-glow-primary">Dashboard Inteligente</h1><p className="text-muted-foreground mt-1">Visão geral e proativa da performance de suas campanhas.</p></div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}><SelectTrigger className="w-full md:w-[180px] neu-input"><SelectValue placeholder="Período" /></SelectTrigger><SelectContent className="neu-card"><SelectItem value="7d">7 dias</SelectItem><SelectItem value="30d">30 dias</SelectItem><SelectItem value="90d">90 dias</SelectItem></SelectContent></Select>
          <Button variant="outline" className="neu-button"><Download className="w-4 h-4 mr-2" />Exportar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        <Card className="neu-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-glow-primary">Investimento</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(metrics?.totalCostPeriod)}</div></CardContent></Card>
        <Card className="neu-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-glow-primary">ROI</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{metrics?.avgROI?.toFixed(2) || '0.00'}x</div></CardContent></Card>
        <Card className="neu-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-glow-primary">Conversões</CardTitle><CreditCard className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatNumber(metrics?.conversions)}</div></CardContent></Card>
        <Card className="neu-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-glow-primary">Cliques</CardTitle><MousePointer className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatNumber(metrics?.clicks)}</div></CardContent></Card>
        <Card className="neu-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-glow-primary">Impressões</CardTitle><Eye className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatNumber(metrics?.impressions)}</div></CardContent></Card>
        <Card className="neu-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-glow-primary">CPA</CardTitle><Target className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(metrics?.cpa)}</div></CardContent></Card>
        <Card className="neu-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-glow-primary">CPC</CardTitle><MousePointer className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(metrics?.cpc)}</div></CardContent></Card>
        <Card className="neu-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-glow-primary">CVR</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatPercentage(metrics?.cvr)}</div></CardContent></Card>
        <Card className="neu-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-glow-primary">CTR</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatPercentage(metrics?.ctr)}</div></CardContent></Card>
        <Card className="neu-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-glow-primary">CPM</CardTitle><BarChartHorizontal className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(metrics?.cpm)}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <Card className="neu-card xl:col-span-3">
              <CardHeader><CardTitle className="flex items-center gap-2 text-glow-primary"><Sparkles /> Análise Inteligente</CardTitle></CardHeader>
              <CardContent>
                  <ul className="space-y-3 text-muted-foreground">
                      {aiInsights.map((insight, index) => <li key={index} className="flex items-start gap-3"><Sparkles className="w-4 h-4 mt-1 text-primary flex-shrink-0" /><span>{insight}</span></li>)}
                  </ul>
              </CardContent>
          </Card>
          <Card className="neu-card xl:col-span-2">
              <CardHeader><CardTitle className="flex items-center gap-2 text-glow-primary"><Activity /> Campanhas Ativas</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCampaigns.filter(c => c.status === 'active').length > 0 ? recentCampaigns.filter(c => c.status === 'active').map(campaign => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 neu-card-inset rounded-lg">
                      <span className="font-semibold text-sm">{campaign.name}</span>
                      {getStatusBadge(campaign.status)}
                    </div>
                  )) : <p className="text-center text-muted-foreground py-4">Nenhuma campanha ativa.</p>}
                </div>
              </CardContent>
          </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="neu-card"><CardHeader><CardTitle className="flex items-center gap-2 text-glow-primary"><PieChartIcon /> Investimento por Plataforma</CardTitle></CardHeader><CardContent className="h-80">{channelPerformanceData?.labels?.length > 0 ? <PieChart data={channelPerformanceData} /> : <div className="flex items-center justify-center h-full text-muted-foreground">Dados indisponíveis.</div>}</CardContent></Card>
        <Card className="neu-card"><CardHeader><CardTitle className="flex items-center gap-2 text-glow-primary"><BarChart3 /> ROI por Plataforma</CardTitle></CardHeader><CardContent className="h-80">{roiData?.labels?.length > 0 ? <BarChart data={roiData} /> : <div className="flex items-center justify-center h-full text-muted-foreground">Dados indisponíveis.</div>}</CardContent></Card>
      </div>

      <Card className="neu-card">
          <CardHeader><CardTitle className="text-glow-primary">Performance das Campanhas Recentes</CardTitle><CardDescription>Resumo detalhado das últimas campanhas.</CardDescription></CardHeader>
          <CardContent className="overflow-x-auto">
              <div className="min-w-[700px]">
                  <div className="grid grid-cols-6 gap-4 p-2 font-semibold text-muted-foreground border-b border-border">
                      <div className="col-span-2">Campanha</div><div>Status</div><div>Investido</div><div>Cliques</div><div>Conversões</div>
                  </div>
                  <div className="space-y-2 mt-2">
                      {recentCampaigns.length > 0 ? recentCampaigns.map((c) => (
                          <div key={c.id} className="grid grid-cols-6 gap-4 items-center p-3 neu-card-inset rounded-lg">
                              <div className="col-span-2 font-semibold text-foreground">{c.name}</div>
                              <div>{getStatusBadge(c.status)}</div>
                              <div>{formatCurrency(c.spent)}</div>
                              <div>{formatNumber(c.clicks)}</div>
                              <div>{formatNumber(c.conversions)}</div>
                          </div>
                      )) : <p className="text-center text-muted-foreground py-6">Nenhuma campanha recente para exibir.</p>}
                  </div>
              </div>
          </CardContent>
      </Card>
    </div>
  );
}