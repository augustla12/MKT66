// server/services/gemini.service.fn.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from '../config';

class FunnelGeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(apiKey?: string) {
    console.log('[FunnelGeminiService] Inicializado com rotação de APIs');
  }

  private async getGenAI(): Promise<GoogleGenerativeAI> {
    const { withApiRotation } = await import('../api-rotation');
    return withApiRotation('GEMINI_API_KEY', (apiKey: string) => {
      return Promise.resolve(new GoogleGenerativeAI(apiKey));
    });
  }

  public async analyzeFunnelScenario(inputs: any, calculations: any): Promise<string> {
    const genAI = await this.getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `
      Análise de Cenário de Lançamento Digital

      **Contexto:** Você é um especialista em estratégia de marketing e lançamentos digitais. Analise os dados a seguir de uma simulação de funil de lançamento e forneça 3 insights acionáveis e concisos para o usuário. Sua resposta deve ser direta, clara e focada em resultados.

      **DADOS DA SIMULAÇÃO:**

      **Parâmetros de Entrada:**
      - Investimento em Tráfego: R$ ${inputs.investimentoTráfego.toLocaleString('pt-BR')}
      - Custo por Lead (CPL) Estimado: R$ ${inputs.cplEstimado.toFixed(2)}
      - Preço do Produto Principal: R$ ${inputs.precoProdutoPrincipal.toFixed(2)}
      - Taxa de Conversão da Página de Vendas: ${inputs.taxaConversaoPaginaVendas}%
      
      **Métricas Calculadas:**
      - Faturamento Bruto: R$ ${calculations.faturamentoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      - Lucro Líquido: R$ ${calculations.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      - ROAS (Retorno sobre Investimento): ${calculations.roas.toFixed(2)}x
      - Custo por Aquisição (CAC): R$ ${calculations.cac.toFixed(2)}
      - Total de Leads Gerados: ${calculations.leadsGerados.toLocaleString('pt-BR')}
      - Total de Vendas Realizadas: ${calculations.vendasRealizadas}

      **SUA TAREFA:**
      Baseado nesses dados, forneça 3 insights estratégicos e acionáveis. Foque nos principais pontos de alavancagem ou nos maiores gargalos do funil. Apresente os insights em formato de lista, de forma clara e objetiva.

      **FORMATO DA RESPOSTA:**
      Use o seguinte formato para cada insight, utilizando markdown para negrito:
      - **[Área de Foco]:** [Sua análise e recomendação direta].

      **Exemplo de Resposta:**
      - **Custo por Aquisição (CAC):** Seu CAC de R$ ${calculations.cac.toFixed(2)} está [alto/adequado/baixo] em relação ao preço do produto. Para otimizar, concentre-se em melhorar a taxa de conversão da página de vendas ou reduzir o CPL através de criativos mais eficazes.
      - **Taxa de Conversão:** Uma taxa de ${inputs.taxaConversaoPaginaVendas}% é um bom começo, mas pequenos aumentos aqui geram grande impacto no lucro. Teste A/B no headline e no CTA da sua página de vendas.
      - **Alavancagem de Lucro:** Seu ROAS de ${calculations.roas.toFixed(2)}x indica que a operação é lucrativa. O principal caminho para escalar o lucro é otimizar o CPL, pois cada real economizado na aquisição de leads aumenta diretamente sua margem.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error: any) {
      console.error('[FunnelGeminiService] Erro ao analisar cenário do funil:', error);
      throw new Error(`Falha ao analisar cenário: ${error.message}`);
    }
  }
}

export const funnelGeminiService = new FunnelGeminiService(GEMINI_API_KEY);
