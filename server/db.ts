// server/db.ts
import dotenv from 'dotenv';
dotenv.config();

// Importar o adaptador Excel em vez do PostgreSQL
import { db as excelDb } from './excel-db';
import * as schema from '../shared/schema';

console.log('🗃️  Usando banco de dados Excel local');

// Exportar o adaptador Excel como se fosse o Drizzle
export const db = excelDb;
