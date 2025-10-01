import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getEnv(varName: string, aDefault?: string): string {
  const value = process.env[varName];
  if (value === undefined && aDefault === undefined) {
      console.warn(`⚠️  Variável de ambiente ${varName} não definida, usando padrão.`);
  }
  return value ?? aDefault!;
}

// --- Configurações Gerais ---
export const PORT = parseInt(getEnv('PORT', '3001'), 10);
export const APP_BASE_URL = getEnv('APP_BASE_URL', `http://localhost:${PORT}`);

// --- Autenticação e Segurança ---
export const JWT_SECRET = getEnv('JWT_SECRET', 'mkt2-local-secret-key-2024');

// --- Banco de Dados (Desabilitado para versão local) ---
export const DATABASE_URL = getEnv('DATABASE_URL', 'local-excel-database');
export const DATABASE_AUTH_TOKEN = getEnv('DATABASE_AUTH_TOKEN', '');

// --- Chaves de API com Rotação ---
export const GOOGLE_API_KEY = getEnv('GOOGLE_API_KEY_1', getEnv('GOOGLE_API_KEY', ''));
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_1 || 'AIzaSyBk7b8Z3Q1X2Y3-example-fallback-key';
export const OPENROUTER_API_KEY = getEnv('OPENROUTER_API_KEY_1', getEnv('OPENROUTER_API_KEY', ''));

// --- Configurações para Integrações (OAuth) com Rotação ---
export const GOOGLE_CLIENT_ID = getEnv('GOOGLE_CLIENT_ID', '');
export const GOOGLE_CLIENT_SECRET = getEnv('GOOGLE_CLIENT_SECRET_1', getEnv('GOOGLE_CLIENT_SECRET', ''));
export const FACEBOOK_CLIENT_ID = getEnv('FACEBOOK_CLIENT_ID', '');
export const FACEBOOK_CLIENT_SECRET = getEnv('FACEBOOK_CLIENT_SECRET_1', getEnv('FACEBOOK_CLIENT_SECRET', ''));

// Integrações adicionais
export const SHOPIFY_CLIENT_ID = getEnv('SHOPIFY_CLIENT_ID', '');
export const SHOPIFY_CLIENT_SECRET = getEnv('SHOPIFY_CLIENT_SECRET_1', getEnv('SHOPIFY_CLIENT_SECRET', ''));
export const HOTMART_CLIENT_ID = getEnv('HOTMART_CLIENT_ID', '');
export const HOTMART_CLIENT_SECRET = getEnv('HOTMART_CLIENT_SECRET_1', getEnv('HOTMART_CLIENT_SECRET', ''));

// Google Drive
export const GOOGLE_DRIVE_CLIENT_ID = getEnv('GOOGLE_DRIVE_CLIENT_ID', '');
export const GOOGLE_DRIVE_CLIENT_SECRET = getEnv('GOOGLE_DRIVE_CLIENT_SECRET_1', getEnv('GOOGLE_DRIVE_CLIENT_SECRET', ''));
export const GOOGLE_DRIVE_REDIRECT_URI = getEnv('GOOGLE_DRIVE_REDIRECT_URI', 'http://localhost:3001/auth/google-drive/callback');
export const GOOGLE_DRIVE_REFRESH_TOKEN = getEnv('GOOGLE_DRIVE_REFRESH_TOKEN', '');
export const GOOGLE_DRIVE_FOLDER_ID = getEnv('GOOGLE_DRIVE_FOLDER_ID', '');

// --- Configuração de Caminhos Locais ---
export const PROJECT_ROOT = path.resolve(__dirname, '..');
export const UPLOADS_DIR_NAME = "uploads";
export const DATABASE_DIR_NAME = "database";
export const LOGS_DIR_NAME = "logs";

// Caminhos locais
export const UPLOADS_PATH = path.join(PROJECT_ROOT, UPLOADS_DIR_NAME);
export const DATABASE_PATH = path.join(PROJECT_ROOT, DATABASE_DIR_NAME);
export const LOGS_PATH = path.join(PROJECT_ROOT, LOGS_DIR_NAME);

// URLs para cliente
export const CLIENT_URL = getEnv('CLIENT_URL', 'http://localhost:3000');
export const SERVER_URL = getEnv('SERVER_URL', `http://localhost:${PORT}`);

console.log('🚀 MKT2 Local - Configurações carregadas');
console.log(`📂 Uploads: ${UPLOADS_PATH}`);
console.log(`🗃️  Database: ${DATABASE_PATH}`);
console.log(`📝 Logs: ${LOGS_PATH}`);