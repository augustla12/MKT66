// server/logger.ts
import * as fs from 'fs';
import * as path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

// Garantir que o diretório de logs existe
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

class Logger {
  private writeToFile(level: LogLevel, module: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      module,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined
    };

    const logLine = `[${timestamp}] ${level.padEnd(7)} [${module.padEnd(15)}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;

    try {
      fs.appendFileSync(LOG_FILE, logLine);
    } catch (error) {
      originalConsoleError('Erro ao escrever no arquivo de log:', error);
    }
  }

  debug(module: string, message: string, data?: any): void {
    this.writeToFile(LogLevel.DEBUG, module, message, data);
    originalConsoleLog(`🔍 [${module}] ${message}`, data || '');
  }

  info(module: string, message: string, data?: any): void {
    this.writeToFile(LogLevel.INFO, module, message, data);
    originalConsoleLog(`ℹ️  [${module}] ${message}`, data || '');
  }

  warn(module: string, message: string, data?: any): void {
    this.writeToFile(LogLevel.WARN, module, message, data);
    originalConsoleWarn(`⚠️  [${module}] ${message}`, data || '');
  }

  error(module: string, message: string, data?: any): void {
    this.writeToFile(LogLevel.ERROR, module, message, data);
    originalConsoleError(`❌ [${module}] ${message}`, data || '');
  }

  success(module: string, message: string, data?: any): void {
    this.writeToFile(LogLevel.SUCCESS, module, message, data);
    originalConsoleLog(`✅ [${module}] ${message}`, data || '');
  }

  // Método especial para requisições HTTP
  request(method: string, url: string, statusCode: number, responseTime: number, userAgent?: string): void {
    const message = `${method} ${url} - ${statusCode} (${responseTime}ms)`;
    const data = { method, url, statusCode, responseTime, userAgent };
    
    if (statusCode >= 400) {
      this.error('HTTP', message, data);
    } else {
      this.info('HTTP', message, data);
    }
  }

  // Método para operações de banco de dados
  database(operation: string, table: string, duration: number, recordsAffected?: number): void {
    const message = `${operation} on ${table} (${duration}ms)${recordsAffected ? ` - ${recordsAffected} records` : ''}`;
    this.info('DATABASE', message, { operation, table, duration, recordsAffected });
  }

  // Método para APIs externas
  apiCall(service: string, endpoint: string, success: boolean, duration: number, error?: string): void {
    const message = `${service} ${endpoint} - ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`;
    const data = { service, endpoint, success, duration, error };
    
    if (success) {
      this.success('API', message, data);
    } else {
      this.error('API', message, data);
    }
  }

  // Método para autenticação
  auth(action: string, userId?: number, username?: string, success: boolean = true): void {
    const message = `${action} - ${success ? 'SUCCESS' : 'FAILED'}${username ? ` (${username})` : ''}`;
    const data = { action, userId, username, success };
    
    if (success) {
      this.success('AUTH', message, data);
    } else {
      this.warn('AUTH', message, data);
    }
  }

  // Método para upload de arquivos
  upload(filename: string, size: number, mimeType: string, success: boolean, error?: string): void {
    const message = `Upload ${filename} (${(size / 1024 / 1024).toFixed(2)}MB) - ${success ? 'SUCCESS' : 'FAILED'}`;
    const data = { filename, size, mimeType, success, error };
    
    if (success) {
      this.success('UPLOAD', message, data);
    } else {
      this.error('UPLOAD', message, data);
    }
  }

  // Método para WhatsApp
  whatsapp(action: string, contactJid?: string, messageId?: string, success: boolean = true, error?: string): void {
    const message = `WhatsApp ${action}${contactJid ? ` to ${contactJid}` : ''}${messageId ? ` (${messageId})` : ''} - ${success ? 'SUCCESS' : 'FAILED'}`;
    const data = { action, contactJid, messageId, success, error };
    
    if (success) {
      this.success('WHATSAPP', message, data);
    } else {
      this.error('WHATSAPP', message, data);
    }
  }

  // Método para rotação de APIs
  apiRotation(service: string, keyIndex: number, action: string, reason?: string): void {
    const message = `${service} key rotation - ${action} (key ${keyIndex + 1})${reason ? `: ${reason}` : ''}`;
    this.info('API_ROTATION', message, { service, keyIndex, action, reason });
  }

  // Método para inicialização do sistema
  startup(module: string, message: string, port?: number): void {
    const fullMessage = `${message}${port ? ` on port ${port}` : ''}`;
    this.success('STARTUP', `[${module}] ${fullMessage}`);
  }

  // Método para shutdown do sistema
  shutdown(module: string, message: string): void {
    this.info('SHUTDOWN', `[${module}] ${message}`);
  }
}

// Instância singleton
export const logger = new Logger();

// Middleware para Express
export function loggerMiddleware(req: any, res: any, next: any): void {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.request(
      req.method,
      req.originalUrl || req.url,
      res.statusCode,
      duration,
      req.get('User-Agent')
    );
  });
  
  next();
}

// Salvar referências originais do console
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;