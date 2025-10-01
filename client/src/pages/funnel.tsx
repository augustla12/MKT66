import React, { useState, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  DollarSign,
  Target,
  Users,
  ShoppingCart,
  TrendingUp,
  BarChart,
  Sparkles,
  FileDown,
  Save,
  Settings,
  Activity,
  Zap,
  Brain,
  Loader2
} from 'lucide-react';

// Tipos e Interfaces
interface LaunchInputs {
  investimentoTrafego: number;
  cplEstimado: number;
  listaEmailsExistente: number;
  taxaParticipacaoCPL: number;
  taxaCliquesPaginaVendas: number;
  precoProdutoPrincipal: number;
  taxaConversaoPaginaVendas: number;
  habilitarOrderBump: boolean;
  precoOrderBump: number;
  taxaAdesaoOrderBump: number;
  habilitarUpsell: boolean;
  precoUpsell: number;
  taxaAdesaoUpsell: number;
  taxaPlataforma: number;
  taxaAprovacaoPagamentos: number;
  taxaReembolso: number;
}

interface FunnelStageData {
  label: string;
  value: number;
  conversionRate: number;
  faturamento?: number;
}

// Estado Inicial
const initialState: LaunchInputs = {
  investimentoTrafego: 20000,
  cplEstimado: 2.00,
  listaEmailsExistente: 0,
  taxaParticipacaoCPL: 35,
  taxaCliquesPaginaVendas: 80,
  precoProdutoPrincipal: 990,
  taxaConversaoPaginaVendas: 5,
  habilitarOrderBump: true,
  precoOrderBump: 97,
  taxaAdesaoOrderBump: 35,
  habilitarUpsell: true,
  precoUpsell: 197,
  taxaAdesaoUpsell: 15,
  taxaPlataforma: 7.99,
  taxaAprovacaoPagamentos: 88,
  taxaReembolso: 3,
};

// Componente do Funil 3D Responsivo
const Funnel3D = ({ data, roas }: { data: FunnelStageData[], roas: number }) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatNumber = (value: number) => 
    new Intl.NumberFormat('pt-BR').format(value);

  if (!data || data.length === 0) {
    return <div className="text-center text-gray-400">Dados insuficientes para exibir o funil.</div>;
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 400 600" className="w-full h-full max-w-md">
        <defs>
          <linearGradient id="funnelGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00f6ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0099cc" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="funnelGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0099cc" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#006699" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="funnelGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#006699" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#004466" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="funnelGrad4" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#004466" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#002233" stopOpacity="0.4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Funil Principal */}
        <g className="funnel-container">
          {/* Alcance Potencial */}
          <ellipse cx="200" cy="80" rx="150" ry="25" fill="url(#funnelGrad1)" filter="url(#glow)" />
          <path d="M 50 80 L 80 160 L 320 160 L 350 80 Z" fill="url(#funnelGrad1)" opacity="0.6" />
          
          {/* Engajamento */}
          <ellipse cx="200" cy="160" rx="120" ry="20" fill="url(#funnelGrad2)" filter="url(#glow)" />
          <path d="M 80 160 L 110 240 L 290 240 L 320 160 Z" fill="url(#funnelGrad2)" opacity="0.6" />
          
          {/* Intenção */}
          <ellipse cx="200" cy="240" rx="90" ry="18" fill="url(#funnelGrad3)" filter="url(#glow)" />
          <path d="M 110 240 L 140 320 L 260 320 L 290 240 Z" fill="url(#funnelGrad3)" opacity="0.6" />
          
          {/* Conversão */}
          <ellipse cx="200" cy="320" rx="60" ry="15" fill="url(#funnelGrad4)" filter="url(#glow)" />
          <path d="M 140 320 L 170 400 L 230 400 L 260 320 Z" fill="url(#funnelGrad4)" opacity="0.6" />
          
          {/* Resultado Financeiro */}
          <ellipse cx="200" cy="400" rx="30" ry="12" fill="#00f6ff" filter="url(#glow)" />
          <circle cx="200" cy="450" r="40" fill="none" stroke="#00f6ff" strokeWidth="2" opacity="0.6" />
          <circle cx="200" cy="450" r="50" fill="none" stroke="#0099cc" strokeWidth="1" opacity="0.4" />
        </g>

        {/* Labels e Valores - Atualizados em tempo real */}
        <g className="funnel-labels">
          {/* Alcance Potencial */}
          <text x="200" y="75" textAnchor="middle" fill="#00f6ff" fontSize="12" fontWeight="bold">
            ALCANCE POTENCIAL
          </text>
          <text x="200" y="95" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
            {formatNumber(data[0]?.value || 0)}
          </text>
          <text x="350" y="120" textAnchor="start" fill="#00f6ff" fontSize="10">
            {data[0]?.conversionRate.toFixed(1)}%
          </text>

          {/* Engajamento */}
          <text x="200" y="155" textAnchor="middle" fill="#0099cc" fontSize="12" fontWeight="bold">
            ENGAJAMENTO
          </text>
          <text x="200" y="175" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
            {formatNumber(data[1]?.value || 0)}
          </text>
          <text x="330" y="200" textAnchor="start" fill="#0099cc" fontSize="10">
            {data[1]?.conversionRate.toFixed(1)}%
          </text>

          {/* Intenção */}
          <text x="200" y="235" textAnchor="middle" fill="#006699" fontSize="12" fontWeight="bold">
            INTENÇÃO
          </text>
          <text x="200" y="255" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
            {formatNumber(data[2]?.value || 0)}
          </text>
          <text x="300" y="280" textAnchor="start" fill="#006699" fontSize="10">
            {data[2]?.conversionRate.toFixed(1)}%
          </text>

          {/* Conversão */}
          <text x="200" y="315" textAnchor="middle" fill="#004466" fontSize="12" fontWeight="bold">
            CONVERSÃO
          </text>
          <text x="200" y="335" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
            {formatNumber(data[3]?.value || 0)}
          </text>
          <text x="270" y="360" textAnchor="start" fill="#004466" fontSize="10">
            {data[3]?.conversionRate.toFixed(1)}%
          </text>

          {/* Resultado Financeiro */}
          <text x="200" y="440" textAnchor="middle" fill="#00f6ff" fontSize="14" fontWeight="bold">
            RESULTADO
          </text>
          <text x="200" y="455" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
            FINANCEIRO
          </text>
          <text x="200" y="475" textAnchor="middle" fill="#00f6ff" fontSize="14" fontWeight="bold">
            {formatCurrency(data[3]?.faturamento || 0)}
          </text>
          <text x="200" y="490" textAnchor="middle" fill="white" fontSize="12">
            ROAS: {roas.toFixed(2)}x
          </text>
        </g>
      </svg>
    </div>
  );
};

// Simulação da API do Gemini
const analyzeWithGemini = async (inputs: LaunchInputs, calculations: any): Promise<string> => {
  // Simular delay da API
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const { faturamentoBruto, lucroLiquido, roas, cac } = calculations;
  
  let analysis = `🤖 **ANÁLISE ESTRATÉGICA COM IA**\n\n`;
  
  // Análise do ROAS
  if (roas > 5) {
    analysis += `✅ **ROAS Excelente (${roas.toFixed(2)}x)**: Seu retorno está muito acima da média do mercado (3-4x). Considere aumentar o investimento em tráfego para escalar.\n\n`;
  } else if (roas > 3) {
    analysis += `⚠️ **ROAS Bom (${roas.toFixed(2)}x)**: Está na média do mercado. Há espaço para otimização.\n\n`;
  } else {
    analysis += `🚨 **ROAS Baixo (${roas.toFixed(2)}x)**: Precisa de otimização urgente. Foque em melhorar a conversão ou reduzir o CPL.\n\n`;
  }
  
  // Análise do funil
  if (inputs.taxaParticipacaoCPL < 30) {
    analysis += `📧 **Engajamento Baixo**: Sua taxa de participação nos CPLs (${inputs.taxaParticipacaoCPL}%) está baixa. Melhore seus e-mails de aquecimento e conteúdo gratuito.\n\n`;
  }
  
  if (inputs.taxaConversaoPaginaVendas < 3) {
    analysis += `🎯 **Conversão Baixa**: Taxa de ${inputs.taxaConversaoPaginaVendas}% está abaixo da média (3-5%). Otimize sua página de vendas, oferta e copy.\n\n`;
  }
  
  // Sugestões específicas
  analysis += `💡 **SUGESTÕES DE OTIMIZAÇÃO**:\n\n`;
  
  if (!inputs.habilitarOrderBump) {
    analysis += `• Ative o Order Bump - pode aumentar sua receita em 15-30%\n`;
  }
  
  if (!inputs.habilitarUpsell) {
    analysis += `• Implemente Upsell - potencial de +20% na receita\n`;
  }
  
  if (inputs.cplEstimado > 3) {
    analysis += `• Seu CPL de R$ ${inputs.cplEstimado.toFixed(2)} está alto. Teste novos criativos e públicos\n`;
  }
  
  // Projeção de melhoria
  const melhoriaProjetada = lucroLiquido * 1.3;
  analysis += `\n🚀 **POTENCIAL DE CRESCIMENTO**: Com as otimizações sugeridas, você pode alcançar até R$ ${melhoriaProjetada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de lucro líquido (+30%).`;
  
  return analysis;
};

// Componente Principal
export default function LaunchSimulator() {
  const [inputs, setInputs] = useState<LaunchInputs>(initialState);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleInputChange = (id: keyof LaunchInputs, value: number) => {
    setInputs(prev => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (id: keyof LaunchInputs, checked: boolean) => {
    setInputs(prev => ({ ...prev, [id]: checked }));
  };

  const calculations = useMemo(() => {
    const leadsGerados = inputs.cplEstimado > 0 ? 
      (inputs.investimentoTrafego / inputs.cplEstimado) + inputs.listaEmailsExistente : 
      inputs.listaEmailsExistente;
    
    const leadsAquecidos = leadsGerados * (inputs.taxaParticipacaoCPL / 100);
    const visitantesPaginaVendas = leadsAquecidos * (inputs.taxaCliquesPaginaVendas / 100);
    const vendasRealizadasBrutas = visitantesPaginaVendas * (inputs.taxaConversaoPaginaVendas / 100);
    const vendasAprovadas = vendasRealizadasBrutas * (inputs.taxaAprovacaoPagamentos / 100);
    
    const receitaProdutoPrincipal = vendasAprovadas * inputs.precoProdutoPrincipal;
    const vendasOrderBump = inputs.habilitarOrderBump ? 
      vendasAprovadas * (inputs.taxaAdesaoOrderBump / 100) : 0;
    const receitaOrderBump = vendasOrderBump * inputs.precoOrderBump;
    const vendasUpsell = inputs.habilitarUpsell ? 
      vendasAprovadas * (inputs.taxaAdesaoUpsell / 100) : 0;
    const receitaUpsell = vendasUpsell * inputs.precoUpsell;
    
    const faturamentoBruto = receitaProdutoPrincipal + receitaOrderBump + receitaUpsell;
    const custoTaxas = faturamentoBruto * (inputs.taxaPlataforma / 100);
    const custoReembolso = faturamentoBruto * (inputs.taxaReembolso / 100);
    const lucroLiquido = faturamentoBruto - (inputs.investimentoTrafego + custoTaxas + custoReembolso);
    const roas = inputs.investimentoTrafego > 0 ? faturamentoBruto / inputs.investimentoTrafego : 0;
    const cac = vendasAprovadas > 0 ? inputs.investimentoTrafego / vendasAprovadas : 0;
    const ticketMedio = vendasAprovadas > 0 ? faturamentoBruto / vendasAprovadas : 0;

    return {
      leadsGerados: Math.round(leadsGerados),
      leadsAquecidos: Math.round(leadsAquecidos),
      visitantesPaginaVendas: Math.round(visitantesPaginaVendas),
      vendasRealizadas: Math.round(vendasAprovadas),
      faturamentoBruto,
      lucroLiquido,
      roas,
      cac,
      ticketMedio,
      receitaProdutoPrincipal,
      receitaOrderBump,
      receitaUpsell,
      custoTaxas,
      custoReembolso,
    };
  }, [inputs]);

  const funnelForChart: FunnelStageData[] = [
    { label: 'ALCANCE POTENCIAL', value: calculations.leadsGerados, conversionRate: 100 },
    { label: 'ENGAJAMENTO', value: calculations.leadsAquecidos, conversionRate: inputs.taxaParticipacaoCPL },
    { label: 'INTENÇÃO', value: calculations.visitantesPaginaVendas, conversionRate: inputs.taxaCliquesPaginaVendas },
    { 
      label: 'CONVERSÃO', 
      value: calculations.vendasRealizadas, 
      conversionRate: inputs.taxaConversaoPaginaVendas, 
      faturamento: calculations.faturamentoBruto 
    },
  ];

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeWithGemini(inputs, calculations);
      setAiAnalysis(analysis);
    } catch (error) {
      setAiAnalysis('Erro ao analisar cenário. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportPDF = () => {
    const printContent = document.getElementById('pdf-content');
    if (printContent) {
      const originalContent = document.body.innerHTML;
      const printableContent = `
        <html>
          <head>
            <title>Simulação de Lançamento Digital</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                background: white !important; 
                color: black !important; 
                margin: 20px; 
                line-height: 1.6;
              }
              .pdf-header { 
                text-align: center; 
                border-bottom: 2px solid #333; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
              }
              .pdf-section { 
                margin-bottom: 30px; 
                page-break-inside: avoid; 
              }
              .pdf-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 20px; 
                margin: 20px 0; 
              }
              .pdf-card { 
                border: 1px solid #ddd; 
                padding: 15px; 
                border-radius: 8px; 
                background: #f9f9f9; 
              }
              .pdf-title { 
                font-size: 18px; 
                font-weight: bold; 
                margin-bottom: 10px; 
                color: #333; 
              }
              .pdf-value { 
                font-size: 24px; 
                font-weight: bold; 
                color: #0066cc; 
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0; 
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 12px; 
                text-align: left; 
              }
              th { 
                background-color: #f2f2f2; 
                font-weight: bold; 
              }
              .highlight { 
                background-color: #e6f3ff; 
                font-weight: bold; 
              }
            </style>
          </head>
          <body>
            <div class="pdf-header">
              <h1>Simulação de Lançamento Digital</h1>
              <p>Relatório Profissional - ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            
            <div class="pdf-section">
              <h2>Resumo Executivo</h2>
              <div class="pdf-grid">
                <div class="pdf-card">
                  <div class="pdf-title">Faturamento Bruto</div>
                  <div class="pdf-value">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.faturamentoBruto)}</div>
                </div>
                <div class="pdf-card">
                  <div class="pdf-title">Lucro Líquido</div>
                  <div class="pdf-value">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.lucroLiquido)}</div>
                </div>
                <div class="pdf-card">
                  <div class="pdf-title">ROAS</div>
                  <div class="pdf-value">${calculations.roas.toFixed(2)}x</div>
                </div>
                <div class="pdf-card">
                  <div class="pdf-title">Vendas Realizadas</div>
                  <div class="pdf-value">${calculations.vendasRealizadas}</div>
                </div>
              </div>
            </div>

            <div class="pdf-section">
              <h2>Funil de Conversão</h2>
              <table>
                <thead>
                  <tr>
                    <th>Etapa</th>
                    <th>Quantidade</th>
                    <th>Taxa de Conversão</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Leads Gerados</td>
                    <td>${calculations.leadsGerados.toLocaleString('pt-BR')}</td>
                    <td>100%</td>
                  </tr>
                  <tr>
                    <td>Leads Aquecidos</td>
                    <td>${calculations.leadsAquecidos.toLocaleString('pt-BR')}</td>
                    <td>${inputs.taxaParticipacaoCPL}%</td>
                  </tr>
                  <tr>
                    <td>Visitantes Página de Vendas</td>
                    <td>${calculations.visitantesPaginaVendas.toLocaleString('pt-BR')}</td>
                    <td>${inputs.taxaCliquesPaginaVendas}%</td>
                  </tr>
                  <tr class="highlight">
                    <td>Vendas Realizadas</td>
                    <td>${calculations.vendasRealizadas.toLocaleString('pt-BR')}</td>
                    <td>${inputs.taxaConversaoPaginaVendas}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="pdf-section">
              <h2>Detalhamento Financeiro</h2>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Receita Produto Principal</td>
                    <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.receitaProdutoPrincipal)}</td>
                  </tr>
                  <tr>
                    <td>Receita Order Bump</td>
                    <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.receitaOrderBump)}</td>
                  </tr>
                  <tr>
                    <td>Receita Upsell</td>
                    <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.receitaUpsell)}</td>
                  </tr>
                  <tr class="highlight">
                    <td><strong>Faturamento Bruto</strong></td>
                    <td><strong>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.faturamentoBruto)}</strong></td>
                  </tr>
                  <tr>
                    <td>Investimento em Tráfego</td>
                    <td>-${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inputs.investimentoTrafego)}</td>
                  </tr>
                  <tr>
                    <td>Taxas da Plataforma</td>
                    <td>-${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.custoTaxas)}</td>
                  </tr>
                  <tr>
                    <td>Reembolsos Estimados</td>
                    <td>-${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.custoReembolso)}</td>
                  </tr>
                  <tr class="highlight">
                    <td><strong>Lucro Líquido</strong></td>
                    <td><strong>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.lucroLiquido)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="pdf-section">
              <h2>Parâmetros Utilizados</h2>
              <div class="pdf-grid">
                <div>
                  <h3>Investimento</h3>
                  <p><strong>Tráfego:</strong> ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inputs.investimentoTrafego)}</p>
                  <p><strong>CPL:</strong> ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inputs.cplEstimado)}</p>
                  <p><strong>Lista Existente:</strong> ${inputs.listaEmailsExistente.toLocaleString('pt-BR')} leads</p>
                </div>
                <div>
                  <h3>Conversões</h3>
                  <p><strong>Participação CPL:</strong> ${inputs.taxaParticipacaoCPL}%</p>
                  <p><strong>Cliques Página:</strong> ${inputs.taxaCliquesPaginaVendas}%</p>
                  <p><strong>Conversão:</strong> ${inputs.taxaConversaoPaginaVendas}%</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printableContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Simulador de Lançamento Digital
          </h1>
          <p className="text-center text-slate-400 mt-2 text-lg">
            Planeje, simule e otimize os seus resultados com precisão
          </p>
        </div>
      </div>

      {/* Main Content - 3 Colunas Alinhadas pelo Topo */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Coluna 1: Painel de Controle */}
          <div className="lg:col-span-3">
            <Card className="neumorphism-card h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <Settings className="h-5 w-5" />
                  Painel de Controle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3', 'item-4']}>
                  
                  {/* Investimento e Geração de Leads */}
                  <AccordionItem value="item-1" className="border-slate-600">
                    <AccordionTrigger className="text-cyan-300 hover:text-cyan-200">
                      Investimento e Lead Generation
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Investimento em Tráfego (R$)</Label>
                        <Input
                          type="number"
                          value={inputs.investimentoTrafego}
                          onChange={(e) => handleInputChange('investimentoTrafego', parseFloat(e.target.value) || 0)}
                          className="neumorphism-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">CPL Estimado (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={inputs.cplEstimado}
                          onChange={(e) => handleInputChange('cplEstimado', parseFloat(e.target.value) || 0)}
                          className="neumorphism-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Lista de E-mails Existente</Label>
                        <Input
                          type="number"
                          value={inputs.listaEmailsExistente}
                          onChange={(e) => handleInputChange('listaEmailsExistente', parseFloat(e.target.value) || 0)}
                          className="neumorphism-input"
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Pré-Launch Engagement */}
                  <AccordionItem value="item-2" className="border-slate-600">
                    <AccordionTrigger className="text-cyan-300 hover:text-cyan-200">
                      Pré-Launch Engagement
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-slate-300">Taxa de Participação nos CPLs</Label>
                          <span className="text-cyan-400 font-semibold">{inputs.taxaParticipacaoCPL}%</span>
                        </div>
                        <Slider
                          value={[inputs.taxaParticipacaoCPL]}
                          onValueChange={(values) => handleInputChange('taxaParticipacaoCPL', values[0])}
                          max={100}
                          step={1}
                          className="neumorphism-slider"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-slate-300">Taxa de Cliques p/ Página de Vendas</Label>
                          <span className="text-cyan-400 font-semibold">{inputs.taxaCliquesPaginaVendas}%</span>
                        </div>
                        <Slider
                          value={[inputs.taxaCliquesPaginaVendas]}
                          onValueChange={(values) => handleInputChange('taxaCliquesPaginaVendas', values[0])}
                          max={100}
                          step={1}
                          className="neumorphism-slider"
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Oferta e Conversão */}
                  <AccordionItem value="item-3" className="border-slate-600">
                    <AccordionTrigger className="text-cyan-300 hover:text-cyan-200">
                      Oferta e Conversão
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Preço do Produto Principal (R$)</Label>
                        <Input
                          type="number"
                          value={inputs.precoProdutoPrincipal}
                          onChange={(e) => handleInputChange('precoProdutoPrincipal', parseFloat(e.target.value) || 0)}
                          className="neumorphism-input"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-slate-300">Taxa de Conversão</Label>
                          <span className="text-cyan-400 font-semibold">{inputs.taxaConversaoPaginaVendas}%</span>
                        </div>
                        <Slider
                          value={[inputs.taxaConversaoPaginaVendas]}
                          onValueChange={(values) => handleInputChange('taxaConversaoPaginaVendas', values[0])}
                          max={20}
                          step={0.1}
                          className="neumorphism-slider"
                        />
                      </div>
                      
                      {/* Order Bump */}
                      <div className="border-t border-slate-600 pt-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <Checkbox
                            id="orderBump"
                            checked={inputs.habilitarOrderBump}
                            onCheckedChange={(checked) => handleCheckboxChange('habilitarOrderBump', !!checked)}
                          />
                          <Label htmlFor="orderBump" className="text-slate-300">Habilitar Order Bump</Label>
                        </div>
                        {inputs.habilitarOrderBump && (
                          <div className="space-y-3 ml-6">
                            <div className="space-y-2">
                              <Label className="text-slate-300">Preço Order Bump (R$)</Label>
                              <Input
                                type="number"
                                value={inputs.precoOrderBump}
                                onChange={(e) => handleInputChange('precoOrderBump', parseFloat(e.target.value) || 0)}
                                className="neumorphism-input"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="text-slate-300">Taxa de Adesão</Label>
                                <span className="text-cyan-400 font-semibold">{inputs.taxaAdesaoOrderBump}%</span>
                              </div>
                              <Slider
                                value={[inputs.taxaAdesaoOrderBump]}
                                onValueChange={(values) => handleInputChange('taxaAdesaoOrderBump', values[0])}
                                max={100}
                                step={1}
                                className="neumorphism-slider"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Upsell */}
                      <div className="border-t border-slate-600 pt-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <Checkbox
                            id="upsell"
                            checked={inputs.habilitarUpsell}
                            onCheckedChange={(checked) => handleCheckboxChange('habilitarUpsell', !!checked)}
                          />
                          <Label htmlFor="upsell" className="text-slate-300">Habilitar Upsell</Label>
                        </div>
                        {inputs.habilitarUpsell && (
                          <div className="space-y-3 ml-6">
                            <div className="space-y-2">
                              <Label className="text-slate-300">Preço Upsell (R$)</Label>
                              <Input
                                type="number"
                                value={inputs.precoUpsell}
                                onChange={(e) => handleInputChange('precoUpsell', parseFloat(e.target.value) || 0)}
                                className="neumorphism-input"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="text-slate-300">Taxa de Adesão</Label>
                                <span className="text-cyan-400 font-semibold">{inputs.taxaAdesaoUpsell}%</span>
                              </div>
                              <Slider
                                value={[inputs.taxaAdesaoUpsell]}
                                onValueChange={(values) => handleInputChange('taxaAdesaoUpsell', values[0])}
                                max={100}
                                step={1}
                                className="neumorphism-slider"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Variáveis Financeiras */}
                  <AccordionItem value="item-4" className="border-slate-600">
                    <AccordionTrigger className="text-cyan-300 hover:text-cyan-200">
                      Variáveis Financeiras
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Taxa da Plataforma (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={inputs.taxaPlataforma}
                          onChange={(e) => handleInputChange('taxaPlataforma', parseFloat(e.target.value) || 0)}
                          className="neumorphism-input"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-slate-300">Taxa de Aprovação</Label>
                          <span className="text-cyan-400 font-semibold">{inputs.taxaAprovacaoPagamentos}%</span>
                        </div>
                        <Slider
                          value={[inputs.taxaAprovacaoPagamentos]}
                          onValueChange={(values) => handleInputChange('taxaAprovacaoPagamentos', values[0])}
                          max={100}
                          step={1}
                          className="neumorphism-slider"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-slate-300">Taxa de Reembolso</Label>
                          <span className="text-cyan-400 font-semibold">{inputs.taxaReembolso}%</span>
                        </div>
                        <Slider
                          value={[inputs.taxaReembolso]}
                          onValueChange={(values) => handleInputChange('taxaReembolso', values[0])}
                          max={20}
                          step={0.1}
                          className="neumorphism-slider"
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Funil Visual */}
          <div className="lg:col-span-5 flex items-start justify-center">
            <div className="w-full h-[700px] neumorphism-card p-6 flex items-center justify-center">
              <Funnel3D data={funnelForChart} roas={calculations.roas} />
            </div>
          </div>

          {/* Coluna 3: Outputs & Projections */}
          <div className="lg:col-span-4 space-y-6" id="pdf-content">
            
            {/* Quick Results Dashboard */}
            <Card className="neumorphism-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <Activity className="h-5 w-5" />
                  Resultados Rápidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 neumorphism-inner rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Faturamento Bruto</p>
                    <p className="text-lg font-bold text-green-400">{formatCurrency(calculations.faturamentoBruto)}</p>
                  </div>
                  <div className="text-center p-4 neumorphism-inner rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Lucro Líquido</p>
                    <p className="text-lg font-bold text-blue-400">{formatCurrency(calculations.lucroLiquido)}</p>
                  </div>
                  <div className="text-center p-4 neumorphism-inner rounded-lg">
                    <BarChart className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">ROAS</p>
                    <p className="text-lg font-bold text-purple-400">{calculations.roas.toFixed(2)}x</p>
                  </div>
                  <div className="text-center p-4 neumorphism-inner rounded-lg">
                    <Target className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">CAC</p>
                    <p className="text-lg font-bold text-orange-400">{formatCurrency(calculations.cac)}</p>
                  </div>
                  <div className="text-center p-4 neumorphism-inner rounded-lg">
                    <ShoppingCart className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Ticket Médio</p>
                    <p className="text-lg font-bold text-cyan-400">{formatCurrency(calculations.ticketMedio)}</p>
                  </div>
                  <div className="text-center p-4 neumorphism-inner rounded-lg">
                    <Users className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Vendas</p>
                    <p className="text-lg font-bold text-yellow-400">{calculations.vendasRealizadas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Breakdown */}
            <Card className="neumorphism-card">
              <CardHeader>
                <CardTitle className="text-cyan-400">Detalhamento Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Receita Principal:</span>
                  <span className="text-white font-medium">{formatCurrency(calculations.receitaProdutoPrincipal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Receita Order Bump:</span>
                  <span className="text-green-400 font-medium">+ {formatCurrency(calculations.receitaOrderBump)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Receita Upsell:</span>
                  <span className="text-green-400 font-medium">+ {formatCurrency(calculations.receitaUpsell)}</span>
                </div>
                <hr className="border-slate-600" />
                <div className="flex justify-between font-bold">
                  <span className="text-white">Faturamento Bruto:</span>
                  <span className="text-cyan-400">{formatCurrency(calculations.faturamentoBruto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">- Tráfego:</span>
                  <span className="text-red-400">{formatCurrency(inputs.investimentoTrafego)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">- Taxas:</span>
                  <span className="text-red-400">{formatCurrency(calculations.custoTaxas)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">- Reembolsos:</span>
                  <span className="text-red-400">{formatCurrency(calculations.custoReembolso)}</span>
                </div>
                <hr className="border-slate-600" />
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-white">Lucro Líquido:</span>
                  <span className="text-green-400">{formatCurrency(calculations.lucroLiquido)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Análise de IA */}
            <Card className="neumorphism-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <Brain className="h-5 w-5" />
                  Análise Estratégica com IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleAiAnalysis}
                  disabled={isAnalyzing}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analisar com Gemini AI
                    </>
                  )}
                </Button>
                
                {aiAnalysis && (
                  <div className="neumorphism-inner p-4 rounded-lg">
                    <Textarea
                      value={aiAnalysis}
                      readOnly
                      className="min-h-[200px] bg-transparent border-none resize-none text-sm text-slate-300"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leverage Analysis & Scenarios */}
            <Card className="neumorphism-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <Zap className="h-5 w-5" />
                  Análise de Alavancagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Tabs defaultValue="scenarios" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                    <TabsTrigger value="scenarios" className="text-xs">Cenários</TabsTrigger>
                    <TabsTrigger value="optimization" className="text-xs">Otimização</TabsTrigger>
                  </TabsList>
                  <TabsContent value="scenarios" className="space-y-3 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs neumorphism-button"
                    >
                      Cenário Otimista (+20%)
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs neumorphism-button"
                    >
                      Cenário Pessimista (-20%)
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs neumorphism-button"
                    >
                      Ponto de Equilíbrio
                    </Button>
                  </TabsContent>
                  <TabsContent value="optimization" className="space-y-3 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs neumorphism-button"
                    >
                      Melhorar CPL em 10%
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs neumorphism-button"
                    >
                      Aumentar Conversão +1%
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs neumorphism-button"
                    >
                      Otimizar Order Bump
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                onClick={handleExportPDF}
              >
                <FileDown className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
