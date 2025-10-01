import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const DB_DIR = './data';
const BACKUP_DIR = './data/backups';

// Criar diretórios se não existirem
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function createExcelFile(tableName, data) {
  const filePath = path.join(DB_DIR, `${tableName}.xlsx`);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
  XLSX.writeFile(workbook, filePath);
  console.log(`✅ Arquivo ${tableName}.xlsx criado com ${data.length} registros`);
}

// Criar usuário mock
const users = [{
  id: 1,
  name: 'Usuário Teste',
  email: 'teste@exemplo.com',
  password: 'hash123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}];

// Criar campanhas mock
const campaigns = [
  {
    id: 1,
    userId: 1,
    name: 'Campanha Google Ads',
    status: 'active',
    platform: 'google',
    budget: 1000,
    startDate: new Date('2025-09-01').toISOString(),
    endDate: new Date('2025-12-31').toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    userId: 1,
    name: 'Campanha Meta Ads',
    status: 'active',
    platform: 'meta',
    budget: 800,
    startDate: new Date('2025-09-01').toISOString(),
    endDate: new Date('2025-12-31').toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    userId: 1,
    name: 'Campanha TikTok Ads',
    status: 'paused',
    platform: 'tiktok',
    budget: 500,
    startDate: new Date('2025-09-01').toISOString(),
    endDate: new Date('2025-12-31').toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Criar métricas mock dos últimos 30 dias
const metrics = [];
const today = new Date();
let metricId = 1;

for (let i = 0; i < 30; i++) {
  const date = new Date(today);
  date.setDate(date.getDate() - i);
  
  // Métricas para cada campanha ativa
  [1, 2].forEach(campaignId => {
    metrics.push({
      id: metricId++,
      userId: 1,
      campaignId: campaignId,
      date: date.toISOString(),
      impressions: Math.floor(Math.random() * 10000) + 1000,
      clicks: Math.floor(Math.random() * 500) + 50,
      conversions: Math.floor(Math.random() * 20) + 1,
      cost: Math.floor(Math.random() * 100) + 20,
      revenue: Math.floor(Math.random() * 300) + 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });
}

console.log('🚀 Criando dados mock...');

try {
  createExcelFile('users', users);
  createExcelFile('campaigns', campaigns);
  createExcelFile('metrics', metrics);
  
  console.log(`📊 Total de métricas: ${metrics.length}`);
  console.log('🎉 Dados mock criados com sucesso!');
} catch (error) {
  console.error('❌ Erro ao criar dados mock:', error);
}