// server/excel-db.ts
import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const DB_DIR = path.join(process.cwd(), 'database');
const BACKUP_DIR = path.join(DB_DIR, 'backups');

// Garantir que os diretórios existam
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

interface TableSchema {
  [key: string]: any;
}

class ExcelDatabase {
  private tables: Map<string, any[]> = new Map();
  private schemas: Map<string, TableSchema> = new Map();
  private dbPath: string = DB_DIR; // Adicionado para usar nos métodos de arquivo

  constructor() {
    this.initializeTables();
  }

  private initializeTables() {
    const tableDefinitions = {
      users: {
        id: 'number',
        username: 'string',
        email: 'string',
        password: 'string',
        createdAt: 'date',
        updatedAt: 'date'
      },
      campaigns: {
        id: 'number',
        userId: 'number',
        name: 'string',
        description: 'string',
        status: 'string',
        platforms: 'json',
        objectives: 'json',
        budget: 'number',
        spent: 'number',
        startDate: 'date',
        endDate: 'date',
        createdAt: 'date',
        updatedAt: 'date'
      },
      creatives: {
        id: 'number',
        userId: 'number',
        campaignId: 'number',
        filename: 'string',
        originalName: 'string',
        mimeType: 'string',
        size: 'number',
        url: 'string',
        thumbnailUrl: 'string',
        type: 'string',
        status: 'string',
        createdAt: 'date'
      },
      copies: {
        id: 'number',
        userId: 'number',
        campaignId: 'number',
        content: 'string',
        phase: 'string',
        isFavorite: 'boolean',
        tags: 'json',
        createdAt: 'date'
      },
      landingPages: {
        id: 'number',
        userId: 'number',
        campaignId: 'number',
        name: 'string',
        slug: 'string',
        content: 'string',
        isPublished: 'boolean',
        createdAt: 'date',
        updatedAt: 'date'
      },
      whatsappMessages: {
        id: 'number',
        userId: 'number',
        contactJid: 'string',
        messageId: 'string',
        content: 'string',
        isFromMe: 'boolean',
        timestamp: 'date'
      },
      flows: {
        id: 'number',
        userId: 'number',
        name: 'string',
        description: 'string',
        elements: 'json',
        status: 'string',
        isActive: 'boolean',
        createdAt: 'date',
        updatedAt: 'date'
      },
      integrations: {
        id: 'number',
        userId: 'number',
        platform: 'string',
        accessToken: 'string',
        refreshToken: 'string',
        expiresAt: 'date',
        isActive: 'boolean',
        createdAt: 'date',
        updatedAt: 'date'
      },
      chatSessions: {
        id: 'number',
        userId: 'number',
        title: 'string',
        createdAt: 'date',
        updatedAt: 'date'
      },
      chatMessages: {
        id: 'number',
        sessionId: 'number',
        sender: 'string',
        content: 'string',
        attachments: 'json',
        createdAt: 'date'
      },
      metrics: {
        id: 'number',
        campaignId: 'number',
        userId: 'number',
        date: 'date',
        impressions: 'number',
        clicks: 'number',
        conversions: 'number',
        cost: 'number',
        revenue: 'number',
        leads: 'number',
        createdAt: 'date'
      }
    };

    // Inicializar esquemas e carregar dados existentes
    for (const [tableName, schema] of Object.entries(tableDefinitions)) {
      this.schemas.set(tableName, schema);
      this.loadTable(tableName);
    }
  }

  private loadTable(tableName: string): any[] {
    const filePath = path.join(this.dbPath, `${tableName}.xlsx`);

    try {
      if (!fs.existsSync(filePath)) {
        console.log(`📄 Arquivo ${tableName}.xlsx não existe, criando...`);
        this.createTable(tableName, []);
        return [];
      }

      // Use readFileSync with proper buffer handling
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) return [];

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Converter tipos de dados
      const schema = this.schemas.get(tableName);
      const convertedData = data.map((row: any) => {
        const convertedRow: any = {};
        for (const [key, type] of Object.entries(schema || {})) {
          if (row[key] !== undefined && row[key] !== null) {
            switch (type) {
              case 'number':
                convertedRow[key] = Number(row[key]);
                break;
              case 'boolean':
                convertedRow[key] = Boolean(row[key]);
                break;
              case 'date':
                convertedRow[key] = new Date(row[key]);
                break;
              case 'json':
                convertedRow[key] = typeof row[key] === 'string' ? JSON.parse(row[key]) : row[key];
                break;
              default:
                convertedRow[key] = row[key];
            }
          }
        }
        return convertedRow;
      });

      console.log(`✅ Tabela ${tableName} carregada com ${convertedData.length} registros`);
      this.tables.set(tableName, convertedData); // Armazena os dados convertidos
      return convertedData;
    } catch (error) {
      console.error(`Erro ao carregar tabela ${tableName}:`, error);
      this.tables.set(tableName, []); // Garante que a tabela seja inicializada mesmo em caso de erro
      return [];
    }
  }

  private createTable(tableName: string, data: any[] = []): void {
    const filePath = path.join(this.dbPath, `${tableName}.xlsx`);

    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

      // Use writeFileSync with buffer
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      fs.writeFileSync(filePath, wbout);
      console.log(`✅ Tabela ${tableName} criada em ${filePath}`);
    } catch (error) {
      console.error(`Erro ao criar tabela ${tableName}:`, error);
    }
  }

  private saveTable(tableName: string, data: any[]): void {
    const filePath = path.join(this.dbPath, `${tableName}.xlsx`);

    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

      // Use writeFileSync with buffer
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      fs.writeFileSync(filePath, wbout);
      console.log(`💾 Tabela ${tableName} salva com ${data.length} registros`);
    } catch (error) {
      console.error(`Erro ao salvar tabela ${tableName}:`, error);
    }
  }

  // Métodos CRUD genéricos
  select(tableName: string, where?: (row: any) => boolean): any[] {
    const data = this.tables.get(tableName) || [];
    return where ? data.filter(where) : [...data];
  }

  insert(tableName: string, values: any): any {
    const data = this.tables.get(tableName) || [];
    const newId = data.length > 0 ? Math.max(...data.map(r => r.id || 0)) + 1 : 1;
    const newRow = {
      ...values,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    data.push(newRow);
    this.tables.set(tableName, data);
    this.saveTable(tableName, data); // Passa os dados atualizados para saveTable
    return newRow;
  }

  update(tableName: string, where: (row: any) => boolean, values: any): any[] {
    const data = this.tables.get(tableName) || [];
    const updatedRows: any[] = [];

    for (let i = 0; i < data.length; i++) {
      if (where(data[i])) {
        data[i] = { ...data[i], ...values, updatedAt: new Date() };
        updatedRows.push(data[i]);
      }
    }

    if (updatedRows.length > 0) {
      this.tables.set(tableName, data);
      this.saveTable(tableName, data); // Passa os dados atualizados para saveTable
    }

    return updatedRows;
  }

  delete(tableName: string, where: (row: any) => boolean): number {
    const data = this.tables.get(tableName) || [];
    const initialLength = data.length;
    const filteredData = data.filter(row => !where(row));

    this.tables.set(tableName, filteredData);
    this.saveTable(tableName, filteredData); // Passa os dados filtrados para saveTable

    return initialLength - filteredData.length;
  }

  count(tableName: string, where?: (row: any) => boolean): number {
    const data = this.tables.get(tableName) || [];
    return where ? data.filter(where).length : data.length;
  }
}

// Instância singleton
export const excelDb = new ExcelDatabase();

// Função para extrair nome da tabela
function getTableName(table: any): string {
  if (typeof table === 'string') return table;

  // Para objetos de tabela do Drizzle ORM - usar o símbolo correto
  const drizzleNameSymbol = Symbol.for('drizzle:Name');
  if (table && table[drizzleNameSymbol]) {
    return table[drizzleNameSymbol];
  }

  // Fallbacks
  if (table && table._.name) return table._.name;
  if (table && table._) return table._;
  if (table && table.name) return table.name;

  return 'unknown';
}

// Adaptador para manter compatibilidade com o storage.ts
export const db = {
  select: () => ({
    from: (tableName: any) => {
      const name = getTableName(tableName);
      return {
        where: (condition: any) => ({
          limit: (n: number) => excelDb.select(name).slice(0, n),
          orderBy: (order: any) => excelDb.select(name)
        }),
        orderBy: (order: any) => excelDb.select(name),
        limit: (n: number) => excelDb.select(name).slice(0, n)
      };
    }
  }),
  insert: (tableName: any) => ({
    values: (values: any) => ({
      returning: () => [excelDb.insert(getTableName(tableName), values)]
    })
  }),
  update: (tableName: any) => ({
    set: (values: any) => ({
      where: (condition: any) => ({
        returning: () => excelDb.update(getTableName(tableName), () => true, values)
      })
    })
  }),
  delete: (tableName: any) => ({
    where: (condition: any) => excelDb.delete(getTableName(tableName), () => true)
  })
};