// server/api-rotation.ts
import * as fs from 'fs';
import * as path from 'path';

interface ApiKey {
  key: string;
  isActive: boolean;
  lastUsed: Date;
  errorCount: number;
  dailyUsage: number;
  lastResetDate: string;
}

interface ApiRotationConfig {
  [service: string]: {
    keys: ApiKey[];
    currentIndex: number;
    maxErrorsBeforeRotation: number;
    dailyLimit: number;
  };
}

class ApiRotationManager {
  private config: ApiRotationConfig = {};
  private configPath = path.join(process.cwd(), 'api-rotation-config.json');
  private logPath = path.join(process.cwd(), 'logs', 'api-rotation.log');

  constructor() {
    this.loadConfig();
    this.initializeFromEnv();
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de rotação de APIs:', error);
      this.config = {};
    }
  }

  private saveConfig(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Erro ao salvar configuração de rotação de APIs:', error);
    }
  }

  private initializeFromEnv(): void {
    const services = ['GOOGLE_API_KEY', 'GEMINI_API_KEY', 'OPENROUTER_API_KEY', 'FACEBOOK_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET'];
    
    for (const service of services) {
      if (!this.config[service]) {
        this.config[service] = {
          keys: [],
          currentIndex: 0,
          maxErrorsBeforeRotation: 3,
          dailyLimit: 1000
        };
      }

      // Carregar chaves do .env
      for (let i = 1; i <= 5; i++) {
        const envKey = `${service}_${i}`;
        const keyValue = process.env[envKey];
        
        if (keyValue) {
          const existingKeyIndex = this.config[service].keys.findIndex(k => k.key === keyValue);
          
          if (existingKeyIndex === -1) {
            this.config[service].keys.push({
              key: keyValue,
              isActive: true,
              lastUsed: new Date(),
              errorCount: 0,
              dailyUsage: 0,
              lastResetDate: new Date().toDateString()
            });
          }
        }
      }
    }

    this.saveConfig();
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] API_ROTATION: ${message}\n`;
    
    try {
      const logsDir = path.dirname(this.logPath);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      fs.appendFileSync(this.logPath, logMessage);
    } catch (error) {
      console.error('Erro ao escrever log de rotação:', error);
    }
  }

  private resetDailyUsageIfNeeded(service: string): void {
    const today = new Date().toDateString();
    const serviceConfig = this.config[service];
    
    if (serviceConfig) {
      serviceConfig.keys.forEach(key => {
        if (key.lastResetDate !== today) {
          key.dailyUsage = 0;
          key.lastResetDate = today;
        }
      });
    }
  }

  getCurrentKey(service: string): string | null {
    if (!this.config[service] || this.config[service].keys.length === 0) {
      this.log(`Nenhuma chave disponível para o serviço: ${service}`);
      return null;
    }

    this.resetDailyUsageIfNeeded(service);
    
    const serviceConfig = this.config[service];
    let attempts = 0;
    const maxAttempts = serviceConfig.keys.length;

    while (attempts < maxAttempts) {
      const currentKey = serviceConfig.keys[serviceConfig.currentIndex];
      
      if (currentKey && 
          currentKey.isActive && 
          currentKey.errorCount < serviceConfig.maxErrorsBeforeRotation &&
          currentKey.dailyUsage < serviceConfig.dailyLimit) {
        
        currentKey.lastUsed = new Date();
        currentKey.dailyUsage++;
        this.saveConfig();
        
        this.log(`Usando chave ${serviceConfig.currentIndex + 1} para ${service} (uso diário: ${currentKey.dailyUsage}/${serviceConfig.dailyLimit})`);
        return currentKey.key;
      }

      // Rotacionar para próxima chave
      serviceConfig.currentIndex = (serviceConfig.currentIndex + 1) % serviceConfig.keys.length;
      attempts++;
    }

    this.log(`Todas as chaves do serviço ${service} estão indisponíveis`);
    return null;
  }

  reportError(service: string, error: any): void {
    if (!this.config[service]) return;

    const serviceConfig = this.config[service];
    const currentKey = serviceConfig.keys[serviceConfig.currentIndex];
    
    if (currentKey) {
      currentKey.errorCount++;
      this.log(`Erro reportado para ${service} (chave ${serviceConfig.currentIndex + 1}): ${error.message || error}. Total de erros: ${currentKey.errorCount}`);
      
      if (currentKey.errorCount >= serviceConfig.maxErrorsBeforeRotation) {
        this.log(`Chave ${serviceConfig.currentIndex + 1} do serviço ${service} desativada por excesso de erros`);
        currentKey.isActive = false;
        
        // Rotacionar para próxima chave
        serviceConfig.currentIndex = (serviceConfig.currentIndex + 1) % serviceConfig.keys.length;
      }
      
      this.saveConfig();
    }
  }

  reportSuccess(service: string): void {
    if (!this.config[service]) return;

    const serviceConfig = this.config[service];
    const currentKey = serviceConfig.keys[serviceConfig.currentIndex];
    
    if (currentKey && currentKey.errorCount > 0) {
      currentKey.errorCount = Math.max(0, currentKey.errorCount - 1);
      this.log(`Sucesso reportado para ${service} (chave ${serviceConfig.currentIndex + 1}). Erros reduzidos para: ${currentKey.errorCount}`);
      this.saveConfig();
    }
  }

  reactivateKey(service: string, keyIndex: number): void {
    if (!this.config[service] || !this.config[service].keys[keyIndex]) return;

    this.config[service].keys[keyIndex].isActive = true;
    this.config[service].keys[keyIndex].errorCount = 0;
    this.log(`Chave ${keyIndex + 1} do serviço ${service} reativada manualmente`);
    this.saveConfig();
  }

  getStatus(): any {
    const status: any = {};
    
    for (const [service, config] of Object.entries(this.config)) {
      status[service] = {
        totalKeys: config.keys.length,
        activeKeys: config.keys.filter(k => k.isActive).length,
        currentIndex: config.currentIndex,
        keys: config.keys.map((key, index) => ({
          index: index + 1,
          isActive: key.isActive,
          errorCount: key.errorCount,
          dailyUsage: key.dailyUsage,
          lastUsed: key.lastUsed,
          keyPreview: key.key.substring(0, 8) + '...'
        }))
      };
    }
    
    return status;
  }
}

// Instância singleton
export const apiRotation = new ApiRotationManager();

// Função helper para usar com as APIs
export function withApiRotation<T>(
  service: string,
  apiCall: (apiKey: string) => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const apiKey = apiRotation.getCurrentKey(service);
    
    if (!apiKey) {
      reject(new Error(`Nenhuma chave API disponível para ${service}`));
      return;
    }

    try {
      const result = await apiCall(apiKey);
      apiRotation.reportSuccess(service);
      resolve(result);
    } catch (error) {
      apiRotation.reportError(service, error);
      reject(error);
    }
  });
}