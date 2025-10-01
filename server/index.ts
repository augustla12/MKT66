import 'dotenv/config';
import express from 'express';
import { RouterSetup } from './routes';
import { UPLOADS_PATH, PORT, CLIENT_URL } from './config';
import path from 'path';
import { fileURLToPath } from 'url';
import { CronService } from './services/cron.service';
import { logger, loggerMiddleware } from './logger';
import * as fs from 'fs';
import cors from 'cors';

// Correção para __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar logger
logger.startup('SERVER', 'Iniciando MKT2 Local Server', PORT);
logger.info('SYSTEM', '=== MKT2 LOCAL - SERVIDOR BACKEND ===');
logger.info('SYSTEM', `Versão: MKT2 Local v2.8`);
logger.info('SYSTEM', `Ambiente: ${process.env.NODE_ENV || 'development'}`);
logger.info('SYSTEM', `Porta: ${PORT}`);
logger.info('SYSTEM', `Client URL: ${CLIENT_URL}`);
logger.info('SYSTEM', 'Log único ativo - Histórico completo mantido');

async function bootstrap() {
  try {
    const app = express();

    // Criar diretórios necessários
    const dirs = ['uploads', 'database', 'logs', 'sessions'];
    dirs.forEach(dir => {
      const dirPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info('FILESYSTEM', `Diretório criado: ${dir}`);
      }
    });

    // CORREÇÃO: O caminho correto para os arquivos do cliente é dentro do próprio diretório 'dist'
    const clientDistPath = path.join(__dirname, 'public');

    // Middleware de logging
    app.use(loggerMiddleware);

    // CORS
    app.use(cors({
      origin: CLIENT_URL || 'http://localhost:3000',
      credentials: true
    }));

    // Middlewares com limites aumentados para payloads grandes
    app.use(express.json({ 
      limit: '50mb',  // Aumenta o limite para requisições JSON
      parameterLimit: 100000,
      extended: true 
    }));

    app.use(express.urlencoded({ 
      limit: '50mb',  // Aumenta o limite para dados de formulário
      extended: true,
      parameterLimit: 100000
    }));

    // Middleware adicional para requisições raw (se necessário)
    app.use(express.raw({ 
      limit: '50mb',
      type: ['application/octet-stream', 'image/*', 'video/*', 'audio/*']
    }));

    // Servir arquivos de upload estaticamente
    app.use('/uploads', express.static(UPLOADS_PATH));

    // Rota de health check
    app.get('/health', (req, res) => {
      const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0-local',
        database: 'excel',
        uptime: process.uptime()
      };

      logger.info('HEALTH', 'Health check solicitado');
      res.json(healthData);
    });

    // Rota para status das APIs
    app.get('/api-status', (req, res) => {
      try {
        const { apiRotation } = require('./api-rotation');
        const status = apiRotation.getStatus();
        logger.info('API_STATUS', 'Status das APIs solicitado');
        res.json(status);
      } catch (error) {
        logger.error('API_STATUS', 'Erro ao obter status das APIs', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // Registrar rotas da API
    const server = await RouterSetup.registerRoutes(app);

    // Servir arquivos estáticos em produção
    if (process.env.NODE_ENV === 'production') {
      const possiblePaths = [
        path.join(__dirname, 'public'), // Caminho correto para build: dist/public
        path.join(__dirname, '..', 'dist', 'public'),
        path.join(process.cwd(), 'dist', 'public'),
        path.join(__dirname, '..', 'client', 'dist'),
        path.join(process.cwd(), 'client', 'dist')
      ];

      let clientDistPath = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath) && fs.existsSync(path.join(testPath, 'index.html'))) {
          clientDistPath = testPath;
          break;
        }
      }

      if (clientDistPath) {
        console.log('[SERVER] 🌐 Servindo frontend do build de produção:', clientDistPath);
        app.use(express.static(clientDistPath));

        // Fallback para SPA
        app.get('*', (req, res) => {
          const indexPath = path.join(clientDistPath, 'index.html');
          res.sendFile(indexPath);
        });
      } else {
        console.warn('[SERVER] ⚠️  Nenhum diretório de build válido encontrado. Tentados:', possiblePaths);
        console.log('[SERVER] 🔧 Fallback: Servindo em modo desenvolvimento');
      }
    } else {
      console.log('[SERVER] 🔧 Modo desenvolvimento: Frontend servido pelo Vite na porta 5000');
    }

    // Tratamento de erros global
    app.use((error: any, req: any, res: any, next: any) => {
      logger.error('EXPRESS', `Erro não tratado: ${error.message}`, {
        stack: error.stack,
        url: req.url,
        method: req.method
      });

      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    });

    server.listen(PORT, () => {
      logger.startup('SERVER', `Servidor MKT2 Local iniciado`, PORT);
      logger.info('SERVER', `📊 Dashboard: ${CLIENT_URL}`);
      logger.info('SERVER', `🔧 API: http://localhost:${PORT}`);
      logger.info('SERVER', `📝 Logs: logs/app.log`);
      logger.info('SERVER', `🗃️  Database: Excel (local)`);

      console.log('========================================');
      console.log('    🚀 MKT2 LOCAL SERVER ONLINE!');
      console.log('========================================');
      console.log(`📊 Dashboard: ${CLIENT_URL}`);
      console.log(`🔧 API: http://localhost:${PORT}`);
      console.log(`📝 Logs: logs/app.log`);
      console.log(`🗃️  Database: Excel (local)`);
      console.log('========================================');

      // Inicializar tarefas agendadas
      const cronService = new CronService();
      cronService.startTasks();
      logger.info('CRON', 'Serviço de Cron inicializado');
    });

  } catch (error) {
    logger.error('SERVER', 'Falha ao iniciar o servidor', error);
    console.error('❌ Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Tratamento de sinais de encerramento
process.on('SIGINT', () => {
  logger.shutdown('SERVER', 'Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.shutdown('SERVER', 'Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

bootstrap();