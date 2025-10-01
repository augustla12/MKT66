var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc3) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc3 = __getOwnPropDesc(from, key)) || desc3.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/api-rotation.ts
var api_rotation_exports = {};
__export(api_rotation_exports, {
  apiRotation: () => apiRotation,
  withApiRotation: () => withApiRotation
});
import * as fs3 from "fs";
import * as path4 from "path";
function withApiRotation(service, apiCall) {
  return new Promise(async (resolve, reject) => {
    const apiKey = apiRotation.getCurrentKey(service);
    if (!apiKey) {
      reject(new Error(`Nenhuma chave API dispon\xEDvel para ${service}`));
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
var ApiRotationManager, apiRotation;
var init_api_rotation = __esm({
  "server/api-rotation.ts"() {
    "use strict";
    ApiRotationManager = class {
      constructor() {
        this.config = {};
        this.configPath = path4.join(process.cwd(), "api-rotation-config.json");
        this.logPath = path4.join(process.cwd(), "logs", "api-rotation.log");
        this.loadConfig();
        this.initializeFromEnv();
      }
      loadConfig() {
        try {
          if (fs3.existsSync(this.configPath)) {
            const data = fs3.readFileSync(this.configPath, "utf8");
            this.config = JSON.parse(data);
          }
        } catch (error) {
          console.error("Erro ao carregar configura\xE7\xE3o de rota\xE7\xE3o de APIs:", error);
          this.config = {};
        }
      }
      saveConfig() {
        try {
          fs3.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        } catch (error) {
          console.error("Erro ao salvar configura\xE7\xE3o de rota\xE7\xE3o de APIs:", error);
        }
      }
      initializeFromEnv() {
        const services = ["GOOGLE_API_KEY", "GEMINI_API_KEY", "OPENROUTER_API_KEY", "FACEBOOK_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET"];
        for (const service of services) {
          if (!this.config[service]) {
            this.config[service] = {
              keys: [],
              currentIndex: 0,
              maxErrorsBeforeRotation: 3,
              dailyLimit: 1e3
            };
          }
          for (let i = 1; i <= 5; i++) {
            const envKey = `${service}_${i}`;
            const keyValue = process.env[envKey];
            if (keyValue) {
              const existingKeyIndex = this.config[service].keys.findIndex((k) => k.key === keyValue);
              if (existingKeyIndex === -1) {
                this.config[service].keys.push({
                  key: keyValue,
                  isActive: true,
                  lastUsed: /* @__PURE__ */ new Date(),
                  errorCount: 0,
                  dailyUsage: 0,
                  lastResetDate: (/* @__PURE__ */ new Date()).toDateString()
                });
              }
            }
          }
        }
        this.saveConfig();
      }
      log(message) {
        const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
        const logMessage = `[${timestamp2}] API_ROTATION: ${message}
`;
        try {
          const logsDir = path4.dirname(this.logPath);
          if (!fs3.existsSync(logsDir)) {
            fs3.mkdirSync(logsDir, { recursive: true });
          }
          fs3.appendFileSync(this.logPath, logMessage);
        } catch (error) {
          console.error("Erro ao escrever log de rota\xE7\xE3o:", error);
        }
      }
      resetDailyUsageIfNeeded(service) {
        const today = (/* @__PURE__ */ new Date()).toDateString();
        const serviceConfig = this.config[service];
        if (serviceConfig) {
          serviceConfig.keys.forEach((key) => {
            if (key.lastResetDate !== today) {
              key.dailyUsage = 0;
              key.lastResetDate = today;
            }
          });
        }
      }
      getCurrentKey(service) {
        if (!this.config[service] || this.config[service].keys.length === 0) {
          this.log(`Nenhuma chave dispon\xEDvel para o servi\xE7o: ${service}`);
          return null;
        }
        this.resetDailyUsageIfNeeded(service);
        const serviceConfig = this.config[service];
        let attempts = 0;
        const maxAttempts = serviceConfig.keys.length;
        while (attempts < maxAttempts) {
          const currentKey = serviceConfig.keys[serviceConfig.currentIndex];
          if (currentKey && currentKey.isActive && currentKey.errorCount < serviceConfig.maxErrorsBeforeRotation && currentKey.dailyUsage < serviceConfig.dailyLimit) {
            currentKey.lastUsed = /* @__PURE__ */ new Date();
            currentKey.dailyUsage++;
            this.saveConfig();
            this.log(`Usando chave ${serviceConfig.currentIndex + 1} para ${service} (uso di\xE1rio: ${currentKey.dailyUsage}/${serviceConfig.dailyLimit})`);
            return currentKey.key;
          }
          serviceConfig.currentIndex = (serviceConfig.currentIndex + 1) % serviceConfig.keys.length;
          attempts++;
        }
        this.log(`Todas as chaves do servi\xE7o ${service} est\xE3o indispon\xEDveis`);
        return null;
      }
      reportError(service, error) {
        if (!this.config[service]) return;
        const serviceConfig = this.config[service];
        const currentKey = serviceConfig.keys[serviceConfig.currentIndex];
        if (currentKey) {
          currentKey.errorCount++;
          this.log(`Erro reportado para ${service} (chave ${serviceConfig.currentIndex + 1}): ${error.message || error}. Total de erros: ${currentKey.errorCount}`);
          if (currentKey.errorCount >= serviceConfig.maxErrorsBeforeRotation) {
            this.log(`Chave ${serviceConfig.currentIndex + 1} do servi\xE7o ${service} desativada por excesso de erros`);
            currentKey.isActive = false;
            serviceConfig.currentIndex = (serviceConfig.currentIndex + 1) % serviceConfig.keys.length;
          }
          this.saveConfig();
        }
      }
      reportSuccess(service) {
        if (!this.config[service]) return;
        const serviceConfig = this.config[service];
        const currentKey = serviceConfig.keys[serviceConfig.currentIndex];
        if (currentKey && currentKey.errorCount > 0) {
          currentKey.errorCount = Math.max(0, currentKey.errorCount - 1);
          this.log(`Sucesso reportado para ${service} (chave ${serviceConfig.currentIndex + 1}). Erros reduzidos para: ${currentKey.errorCount}`);
          this.saveConfig();
        }
      }
      reactivateKey(service, keyIndex) {
        if (!this.config[service] || !this.config[service].keys[keyIndex]) return;
        this.config[service].keys[keyIndex].isActive = true;
        this.config[service].keys[keyIndex].errorCount = 0;
        this.log(`Chave ${keyIndex + 1} do servi\xE7o ${service} reativada manualmente`);
        this.saveConfig();
      }
      getStatus() {
        const status = {};
        for (const [service, config] of Object.entries(this.config)) {
          status[service] = {
            totalKeys: config.keys.length,
            activeKeys: config.keys.filter((k) => k.isActive).length,
            currentIndex: config.currentIndex,
            keys: config.keys.map((key, index) => ({
              index: index + 1,
              isActive: key.isActive,
              errorCount: key.errorCount,
              dailyUsage: key.dailyUsage,
              lastUsed: key.lastUsed,
              keyPreview: key.key.substring(0, 8) + "..."
            }))
          };
        }
        return status;
      }
    };
    apiRotation = new ApiRotationManager();
  }
});

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import express from "express";

// server/db.ts
import dotenv from "dotenv";

// server/excel-db.ts
import XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
var DB_DIR = path.join(process.cwd(), "database");
var BACKUP_DIR = path.join(DB_DIR, "backups");
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
var ExcelDatabase = class {
  // Adicionado para usar nos métodos de arquivo
  constructor() {
    this.tables = /* @__PURE__ */ new Map();
    this.schemas = /* @__PURE__ */ new Map();
    this.dbPath = DB_DIR;
    this.initializeTables();
  }
  initializeTables() {
    const tableDefinitions = {
      users: {
        id: "number",
        username: "string",
        email: "string",
        password: "string",
        createdAt: "date",
        updatedAt: "date"
      },
      campaigns: {
        id: "number",
        userId: "number",
        name: "string",
        description: "string",
        status: "string",
        platforms: "json",
        objectives: "json",
        budget: "number",
        spent: "number",
        startDate: "date",
        endDate: "date",
        createdAt: "date",
        updatedAt: "date"
      },
      creatives: {
        id: "number",
        userId: "number",
        campaignId: "number",
        filename: "string",
        originalName: "string",
        mimeType: "string",
        size: "number",
        url: "string",
        thumbnailUrl: "string",
        type: "string",
        status: "string",
        createdAt: "date"
      },
      copies: {
        id: "number",
        userId: "number",
        campaignId: "number",
        content: "string",
        phase: "string",
        isFavorite: "boolean",
        tags: "json",
        createdAt: "date"
      },
      landingPages: {
        id: "number",
        userId: "number",
        campaignId: "number",
        name: "string",
        slug: "string",
        content: "string",
        isPublished: "boolean",
        createdAt: "date",
        updatedAt: "date"
      },
      whatsappMessages: {
        id: "number",
        userId: "number",
        contactJid: "string",
        messageId: "string",
        content: "string",
        isFromMe: "boolean",
        timestamp: "date"
      },
      flows: {
        id: "number",
        userId: "number",
        name: "string",
        description: "string",
        elements: "json",
        status: "string",
        isActive: "boolean",
        createdAt: "date",
        updatedAt: "date"
      },
      integrations: {
        id: "number",
        userId: "number",
        platform: "string",
        accessToken: "string",
        refreshToken: "string",
        expiresAt: "date",
        isActive: "boolean",
        createdAt: "date",
        updatedAt: "date"
      },
      chatSessions: {
        id: "number",
        userId: "number",
        title: "string",
        createdAt: "date",
        updatedAt: "date"
      },
      chatMessages: {
        id: "number",
        sessionId: "number",
        sender: "string",
        content: "string",
        attachments: "json",
        createdAt: "date"
      },
      metrics: {
        id: "number",
        campaignId: "number",
        userId: "number",
        date: "date",
        impressions: "number",
        clicks: "number",
        conversions: "number",
        cost: "number",
        revenue: "number",
        leads: "number",
        createdAt: "date"
      }
    };
    for (const [tableName, schema] of Object.entries(tableDefinitions)) {
      this.schemas.set(tableName, schema);
      this.loadTable(tableName);
    }
  }
  loadTable(tableName) {
    const filePath = path.join(this.dbPath, `${tableName}.xlsx`);
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`\u{1F4C4} Arquivo ${tableName}.xlsx n\xE3o existe, criando...`);
        this.createTable(tableName, []);
        return [];
      }
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) return [];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      const schema = this.schemas.get(tableName);
      const convertedData = data.map((row) => {
        const convertedRow = {};
        for (const [key, type] of Object.entries(schema || {})) {
          if (row[key] !== void 0 && row[key] !== null) {
            switch (type) {
              case "number":
                convertedRow[key] = Number(row[key]);
                break;
              case "boolean":
                convertedRow[key] = Boolean(row[key]);
                break;
              case "date":
                convertedRow[key] = new Date(row[key]);
                break;
              case "json":
                convertedRow[key] = typeof row[key] === "string" ? JSON.parse(row[key]) : row[key];
                break;
              default:
                convertedRow[key] = row[key];
            }
          }
        }
        return convertedRow;
      });
      console.log(`\u2705 Tabela ${tableName} carregada com ${convertedData.length} registros`);
      this.tables.set(tableName, convertedData);
      return convertedData;
    } catch (error) {
      console.error(`Erro ao carregar tabela ${tableName}:`, error);
      this.tables.set(tableName, []);
      return [];
    }
  }
  createTable(tableName, data = []) {
    const filePath = path.join(this.dbPath, `${tableName}.xlsx`);
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      fs.writeFileSync(filePath, wbout);
      console.log(`\u2705 Tabela ${tableName} criada em ${filePath}`);
    } catch (error) {
      console.error(`Erro ao criar tabela ${tableName}:`, error);
    }
  }
  saveTable(tableName, data) {
    const filePath = path.join(this.dbPath, `${tableName}.xlsx`);
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      fs.writeFileSync(filePath, wbout);
      console.log(`\u{1F4BE} Tabela ${tableName} salva com ${data.length} registros`);
    } catch (error) {
      console.error(`Erro ao salvar tabela ${tableName}:`, error);
    }
  }
  // Métodos CRUD genéricos
  select(tableName, where) {
    const data = this.tables.get(tableName) || [];
    return where ? data.filter(where) : [...data];
  }
  insert(tableName, values) {
    const data = this.tables.get(tableName) || [];
    const newId = data.length > 0 ? Math.max(...data.map((r) => r.id || 0)) + 1 : 1;
    const newRow = {
      ...values,
      id: newId,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    data.push(newRow);
    this.tables.set(tableName, data);
    this.saveTable(tableName, data);
    return newRow;
  }
  update(tableName, where, values) {
    const data = this.tables.get(tableName) || [];
    const updatedRows = [];
    for (let i = 0; i < data.length; i++) {
      if (where(data[i])) {
        data[i] = { ...data[i], ...values, updatedAt: /* @__PURE__ */ new Date() };
        updatedRows.push(data[i]);
      }
    }
    if (updatedRows.length > 0) {
      this.tables.set(tableName, data);
      this.saveTable(tableName, data);
    }
    return updatedRows;
  }
  delete(tableName, where) {
    const data = this.tables.get(tableName) || [];
    const initialLength = data.length;
    const filteredData = data.filter((row) => !where(row));
    this.tables.set(tableName, filteredData);
    this.saveTable(tableName, filteredData);
    return initialLength - filteredData.length;
  }
  count(tableName, where) {
    const data = this.tables.get(tableName) || [];
    return where ? data.filter(where).length : data.length;
  }
};
var excelDb = new ExcelDatabase();
function getTableName(table) {
  if (typeof table === "string") return table;
  const drizzleNameSymbol = Symbol.for("drizzle:Name");
  if (table && table[drizzleNameSymbol]) {
    return table[drizzleNameSymbol];
  }
  if (table && table._.name) return table._.name;
  if (table && table._) return table._;
  if (table && table.name) return table.name;
  return "unknown";
}
var db = {
  select: () => ({
    from: (tableName) => {
      const name = getTableName(tableName);
      return {
        where: (condition) => ({
          limit: (n) => excelDb.select(name).slice(0, n),
          orderBy: (order) => excelDb.select(name)
        }),
        orderBy: (order) => excelDb.select(name),
        limit: (n) => excelDb.select(name).slice(0, n)
      };
    }
  }),
  insert: (tableName) => ({
    values: (values) => ({
      returning: () => [excelDb.insert(getTableName(tableName), values)]
    })
  }),
  update: (tableName) => ({
    set: (values) => ({
      where: (condition) => ({
        returning: () => excelDb.update(getTableName(tableName), () => true, values)
      })
    })
  }),
  delete: (tableName) => ({
    where: (condition) => excelDb.delete(getTableName(tableName), () => true)
  })
};

// server/db.ts
dotenv.config();
console.log("\u{1F5C3}\uFE0F  Usando banco de dados Excel local");
var db2 = db;

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
var campaignStatusEnum = pgEnum("campaign_status", ["active", "paused", "completed", "draft"]);
var chatSenderEnum = pgEnum("chat_sender", ["user", "agent"]);
var launchPhaseEnum = pgEnum("launch_phase", ["pre_launch", "launch", "post_launch"]);
var flowStatusEnum = pgEnum("flow_status", ["active", "inactive", "draft"]);
var integrationPlatformEnum = pgEnum("integration_platform", ["shopify", "hotmart", "meta", "google"]);
var taskStatusEnum = pgEnum("task_status", ["pending", "in_progress", "completed", "on_hold"]);
var users = pgTable("users", { id: serial("id").primaryKey(), username: text("username").notNull().unique(), email: text("email").notNull().unique(), password: text("password"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull() });
var campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: campaignStatusEnum("status").default("draft").notNull(),
  platforms: jsonb("platforms").$type().default([]).notNull(),
  objectives: jsonb("objectives").$type().default([]).notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  dailyBudget: decimal("daily_budget", { precision: 10, scale: 2 }),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  targetAudience: text("target_audience"),
  industry: text("industry"),
  avgTicket: decimal("avg_ticket", { precision: 10, scale: 2 }),
  isTemplate: boolean("is_template").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var campaignPhases = pgTable("campaign_phases", { id: serial("id").primaryKey(), campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }), name: text("name").notNull(), startDate: timestamp("start_date", { withTimezone: true }), endDate: timestamp("end_date", { withTimezone: true }), order: integer("order").default(0).notNull() });
var campaignTasks = pgTable("campaign_tasks", { id: serial("id").primaryKey(), phaseId: integer("phase_id").notNull().references(() => campaignPhases.id, { onDelete: "cascade" }), name: text("name").notNull(), description: text("description"), status: taskStatusEnum("status").default("pending").notNull(), startDate: timestamp("start_date", { withTimezone: true }), endDate: timestamp("end_date", { withTimezone: true }), assigneeId: integer("assignee_id").references(() => users.id, { onDelete: "set null" }) });
var copies = pgTable("copies", { id: serial("id").primaryKey(), userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "set null" }), title: text("title").notNull(), content: text("content").notNull(), purposeKey: text("purpose_key").notNull(), launchPhase: launchPhaseEnum("launch_phase").notNull(), details: jsonb("details").$type().default({}).notNull(), baseInfo: jsonb("base_info").$type().default({}).notNull(), fullGeneratedResponse: jsonb("full_generated_response").$type().default({}).notNull(), platform: text("platform"), isFavorite: boolean("is_favorite").default(false).notNull(), tags: jsonb("tags").$type().default([]).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).defaultNow().notNull() });
var creatives = pgTable("creatives", { id: serial("id").primaryKey(), userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "set null" }), name: text("name").notNull(), type: text("type", { enum: ["image", "video", "text", "carousel"] }).notNull(), fileUrl: text("file_url"), content: text("content"), status: text("status", { enum: ["approved", "pending", "rejected"] }).default("pending").notNull(), platforms: jsonb("platforms").$type().default([]).notNull(), thumbnailUrl: text("thumbnail_url"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull() });
var metrics = pgTable("metrics", { id: serial("id").primaryKey(), campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }), userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), date: timestamp("date", { withTimezone: true }).notNull(), impressions: integer("impressions").default(0).notNull(), clicks: integer("clicks").default(0).notNull(), conversions: integer("conversions").default(0).notNull(), cost: decimal("cost", { precision: 10, scale: 2 }).default("0").notNull(), revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0").notNull(), leads: integer("leads").default(0).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() });
var whatsappMessages = pgTable("whatsapp_messages", { id: serial("id").primaryKey(), userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), contactNumber: text("contact_number").notNull(), contactName: text("contact_name"), message: text("message").notNull(), direction: text("direction", { enum: ["incoming", "outgoing"] }).notNull(), timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(), isRead: boolean("is_read").default(false).notNull() });
var alerts = pgTable("alerts", { id: serial("id").primaryKey(), userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "set null" }), type: text("type", { enum: ["budget", "performance", "approval", "system"] }).notNull(), title: text("title").notNull(), message: text("message").notNull(), isRead: boolean("is_read").default(false).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() });
var budgets = pgTable("budgets", { id: serial("id").primaryKey(), userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }), totalBudget: decimal("total_budget", { precision: 10, scale: 2 }).notNull(), spentAmount: decimal("spent_amount", { precision: 10, scale: 2 }).default("0").notNull(), period: text("period", { enum: ["daily", "weekly", "monthly", "total"] }).notNull(), startDate: timestamp("start_date", { withTimezone: true }).notNull(), endDate: timestamp("end_date", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() });
var landingPages = pgTable("landing_pages", { id: serial("id").primaryKey(), userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), name: text("name").notNull(), studioProjectId: varchar("studio_project_id", { length: 255 }).unique(), slug: varchar("slug", { length: 255 }).notNull().unique(), description: text("description"), grapesJsData: jsonb("grapes_js_data"), generationOptions: jsonb("generation_options").$type(), status: text("status", { enum: ["draft", "published", "archived"] }).default("draft").notNull(), publicUrl: text("public_url"), publishedAt: timestamp("published_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull() });
var chatSessions = pgTable("chat_sessions", { id: serial("id").primaryKey(), userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), title: text("title").notNull().default("Nova Conversa"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull() });
var chatMessages = pgTable("chat_messages", { id: serial("id").primaryKey(), sessionId: integer("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }), sender: chatSenderEnum("sender").notNull(), text: text("text").notNull(), attachmentUrl: text("attachment_url"), timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull() });
var funnels = pgTable("funnels", { id: serial("id").primaryKey(), userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "set null" }), name: text("name").notNull(), description: text("description"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull() });
var funnelStages = pgTable("funnel_stages", { id: serial("id").primaryKey(), funnelId: integer("funnel_id").notNull().references(() => funnels.id, { onDelete: "cascade" }), name: text("name").notNull(), description: text("description"), order: integer("order").notNull().default(0), config: jsonb("config").$type().default({}), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull() });
var flows = pgTable("flows", { id: serial("id").primaryKey(), userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "set null" }), name: text("name").notNull(), status: flowStatusEnum("status").default("draft").notNull(), elements: jsonb("elements").$type().default({ "nodes": [], "edges": [] }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull() });
var integrations = pgTable("integrations", { id: serial("id").primaryKey(), userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), platform: integrationPlatformEnum("platform").notNull(), credentials: jsonb("credentials").$type().notNull(), metadata: jsonb("metadata").$type(), status: text("status", { enum: ["connected", "disconnected", "error"] }).default("disconnected").notNull(), lastSync: timestamp("last_sync", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull() });
var userRelations = relations(users, ({ many }) => ({ campaigns: many(campaigns), creatives: many(creatives), metrics: many(metrics), whatsappMessages: many(whatsappMessages), copies: many(copies), alerts: many(alerts), budgets: many(budgets), landingPages: many(landingPages), chatSessions: many(chatSessions), funnels: many(funnels), flows: many(flows), integrations: many(integrations), assignedTasks: many(campaignTasks) }));
var campaignRelations = relations(campaigns, ({ one, many }) => ({ user: one(users, { fields: [campaigns.userId], references: [users.id] }), creatives: many(creatives), metrics: many(metrics), copies: many(copies), alerts: many(alerts), budgets: many(budgets), funnels: many(funnels), flows: many(flows), phases: many(campaignPhases) }));
var campaignPhaseRelations = relations(campaignPhases, ({ one, many }) => ({ campaign: one(campaigns, { fields: [campaignPhases.campaignId], references: [campaigns.id] }), tasks: many(campaignTasks) }));
var campaignTaskRelations = relations(campaignTasks, ({ one }) => ({ phase: one(campaignPhases, { fields: [campaignTasks.phaseId], references: [campaignPhases.id] }), assignee: one(users, { fields: [campaignTasks.assigneeId], references: [users.id] }) }));
var creativeRelations = relations(creatives, ({ one }) => ({ user: one(users, { fields: [creatives.userId], references: [users.id] }), campaign: one(campaigns, { fields: [creatives.campaignId], references: [campaigns.id] }) }));
var metricRelations = relations(metrics, ({ one }) => ({ campaign: one(campaigns, { fields: [metrics.campaignId], references: [campaigns.id] }), user: one(users, { fields: [metrics.userId], references: [users.id] }) }));
var whatsappMessageRelations = relations(whatsappMessages, ({ one }) => ({ user: one(users, { fields: [whatsappMessages.userId], references: [users.id] }) }));
var copyRelations = relations(copies, ({ one }) => ({ user: one(users, { fields: [copies.userId], references: [users.id] }), campaign: one(campaigns, { fields: [copies.campaignId], references: [campaigns.id] }) }));
var alertRelations = relations(alerts, ({ one }) => ({ user: one(users, { fields: [alerts.userId], references: [users.id] }), campaign: one(campaigns, { fields: [alerts.campaignId], references: [campaigns.id] }) }));
var budgetRelations = relations(budgets, ({ one }) => ({ user: one(users, { fields: [budgets.userId], references: [users.id] }), campaign: one(campaigns, { fields: [budgets.campaignId], references: [campaigns.id] }) }));
var landingPageRelations = relations(landingPages, ({ one }) => ({ user: one(users, { fields: [landingPages.userId], references: [users.id] }) }));
var chatSessionRelations = relations(chatSessions, ({ one, many }) => ({ user: one(users, { fields: [chatSessions.userId], references: [users.id] }), messages: many(chatMessages) }));
var chatMessageRelations = relations(chatMessages, ({ one }) => ({ session: one(chatSessions, { fields: [chatMessages.sessionId], references: [chatSessions.id] }) }));
var funnelRelations = relations(funnels, ({ one, many }) => ({ user: one(users, { fields: [funnels.userId], references: [users.id] }), campaign: one(campaigns, { fields: [funnels.campaignId], references: [campaigns.id] }), stages: many(funnelStages) }));
var funnelStageRelations = relations(funnelStages, ({ one }) => ({ funnel: one(funnels, { fields: [funnelStages.funnelId], references: [funnels.id] }) }));
var flowRelations = relations(flows, ({ one }) => ({ user: one(users, { fields: [flows.userId], references: [users.id] }), campaign: one(campaigns, { fields: [flows.campaignId], references: [campaigns.id] }) }));
var integrationRelations = relations(integrations, ({ one }) => ({ user: one(users, { fields: [integrations.userId], references: [users.id] }) }));
var FlowElementsSchema = z.object({ nodes: z.array(z.any()).default([]), edges: z.array(z.any()).default([]) }).nullable().optional().default({ nodes: [], edges: [] });
var insertUserSchema = createInsertSchema(users, { email: z.string().email("Email inv\xE1lido."), username: z.string().min(3, "Nome de usu\xE1rio deve ter pelo menos 3 caracteres."), password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres.").optional() }).omit({ id: true, createdAt: true, updatedAt: true });
var insertCampaignSchema = createInsertSchema(campaigns, { name: z.string().min(1, "Nome da campanha \xE9 obrigat\xF3rio."), budget: z.preprocess((val) => typeof val === "string" && val.trim() !== "" ? parseFloat(val) : typeof val === "number" ? val : void 0, z.number({ invalid_type_error: "Or\xE7amento deve ser um n\xFAmero" }).nullable().optional()), dailyBudget: z.preprocess((val) => typeof val === "string" && val.trim() !== "" ? parseFloat(val) : typeof val === "number" ? val : void 0, z.number({ invalid_type_error: "Or\xE7amento di\xE1rio deve ser um n\xFAmero" }).nullable().optional()), avgTicket: z.preprocess((val) => typeof val === "string" && val.trim() !== "" ? parseFloat(val) : typeof val === "number" ? val : void 0, z.number({ invalid_type_error: "Ticket m\xE9dio deve ser um n\xFAmero" }).nullable().optional()), startDate: z.preprocess((arg) => {
  if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  return void 0;
}, z.date().optional().nullable()), endDate: z.preprocess((arg) => {
  if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  return void 0;
}, z.date().optional().nullable()), platforms: z.preprocess((val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter((s) => s);
  return [];
}, z.array(z.string()).default([])), objectives: z.preprocess((val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter((s) => s);
  return [];
}, z.array(z.string()).default([])), isTemplate: z.boolean().optional().default(false) }).omit({ id: true, createdAt: true, updatedAt: true, userId: true });
var insertCreativeSchema = createInsertSchema(creatives, { name: z.string().min(1, "Nome do criativo \xE9 obrigat\xF3rio."), type: z.enum(creatives.type.enumValues), status: z.enum(creatives.status.enumValues).optional(), platforms: z.preprocess((val) => {
  if (Array.isArray(val)) {
    return val;
  }
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}, z.array(z.string()).optional()), fileUrl: z.string().nullable().optional(), thumbnailUrl: z.string().nullable().optional(), campaignId: z.preprocess((val) => {
  if (val === "NONE" || val === null || val === void 0 || val === "") {
    return null;
  }
  const parsed = parseInt(String(val));
  return isNaN(parsed) ? null : parsed;
}, z.number().int().positive().nullable().optional()) }).omit({ id: true, createdAt: true, updatedAt: true, userId: true });
var insertCopySchema = createInsertSchema(copies, {
  title: z.string().min(1, "T\xEDtulo da copy \xE9 obrigat\xF3rio."),
  content: z.string().min(1, "Conte\xFAdo (mainCopy) \xE9 obrigat\xF3rio."),
  purposeKey: z.string().min(1, "Chave da finalidade (purposeKey) \xE9 obrigat\xF3ria."),
  launchPhase: z.enum(launchPhaseEnum.enumValues, {
    required_error: "Fase de lan\xE7amento \xE9 obrigat\xF3ria.",
    invalid_type_error: "Fase de lan\xE7amento inv\xE1lida."
  }),
  details: z.record(z.any()).optional().nullable().default({}),
  baseInfo: z.record(z.any()).optional().nullable().default({}),
  fullGeneratedResponse: z.record(z.any()).optional().nullable().default({}),
  platform: z.string().optional().nullable(),
  isFavorite: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().nullable().default([]),
  campaignId: z.preprocess(
    (val) => {
      if (val === void 0 || val === null || val === "" || String(val).toUpperCase() === "NONE") {
        return null;
      }
      if (typeof val === "string") {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? null : parsed;
      }
      if (typeof val === "number") {
        return val;
      }
      return null;
    },
    z.number().int().positive().nullable().optional()
  )
}).omit({ id: true, userId: true, createdAt: true, lastUpdatedAt: true });
var insertFunnelSchema = createInsertSchema(funnels, { name: z.string().min(1, "O nome do funil \xE9 obrigat\xF3rio."), description: z.string().nullable().optional(), campaignId: z.preprocess((val) => {
  if (val === void 0 || val === null || val === "" || String(val).toUpperCase() === "NONE") {
    return null;
  }
  const parsed = parseInt(String(val));
  return isNaN(parsed) ? null : parsed;
}, z.number().int().positive().nullable().optional()) }).omit({ id: true, createdAt: true, updatedAt: true, userId: true });
var insertFunnelStageSchema = createInsertSchema(funnelStages, { name: z.string().min(1, "O nome da etapa \xE9 obrigat\xF3rio."), description: z.string().nullable().optional(), order: z.number().int().min(0).default(0), config: z.record(z.any()).optional().nullable().default({}), funnelId: z.number().int().positive("ID do funil inv\xE1lido.") }).omit({ id: true, createdAt: true, updatedAt: true });
var landingPageOptionsSchema = z.object({ style: z.enum(["modern", "minimal", "bold", "elegant", "tech", "startup"]).optional(), colorScheme: z.enum(["dark", "light", "gradient", "neon", "earth", "ocean"]).optional(), industry: z.string().optional(), targetAudience: z.string().optional(), primaryCTA: z.string().optional(), secondaryCTA: z.string().optional(), includeTestimonials: z.boolean().optional(), includePricing: z.boolean().optional(), includeStats: z.boolean().optional(), includeFAQ: z.boolean().optional(), animationsLevel: z.enum(["none", "subtle", "moderate", "dynamic"]).optional() }).optional().nullable();
var insertLandingPageSchema = createInsertSchema(landingPages, { name: z.string().min(1, "Nome da landing page \xE9 obrigat\xF3rio."), slug: z.string().min(3, "Slug deve ter pelo menos 3 caracteres.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inv\xE1lido."), grapesJsData: z.record(z.any()).optional().nullable(), studioProjectId: z.string().optional().nullable(), status: z.enum(landingPages.status.enumValues).optional(), generationOptions: landingPageOptionsSchema }).omit({ id: true, createdAt: true, updatedAt: true, userId: true, publicUrl: true, publishedAt: true });
var insertWhatsappMessageSchema = createInsertSchema(whatsappMessages, { contactNumber: z.string().min(1, "N\xFAmero de contato \xE9 obrigat\xF3rio."), message: z.string().min(1, "Mensagem \xE9 obrigat\xF3ria."), direction: z.enum(whatsappMessages.direction.enumValues) }).omit({ id: true, userId: true, timestamp: true, isRead: true });
var insertAlertSchema = createInsertSchema(alerts, { type: z.enum(alerts.type.enumValues), title: z.string().min(1, "T\xEDtulo do alerta \xE9 obrigat\xF3rio."), message: z.string().min(1, "Mensagem do alerta \xE9 obrigat\xF3ria.") }).omit({ id: true, userId: true, createdAt: true, isRead: true });
var insertBudgetSchema = createInsertSchema(budgets, { totalBudget: z.preprocess((val) => typeof val === "string" && val.trim() !== "" ? parseFloat(val) : typeof val === "number" ? val : void 0, z.number({ required_error: "Or\xE7amento total \xE9 obrigat\xF3rio.", invalid_type_error: "Or\xE7amento total deve ser um n\xFAmero." })), spentAmount: z.preprocess((val) => typeof val === "string" && val.trim() !== "" ? parseFloat(val) : typeof val === "number" ? val : void 0, z.number({ invalid_type_error: "Valor gasto deve ser um n\xFAmero." }).default(0).optional()), period: z.enum(budgets.period.enumValues), startDate: z.preprocess((arg) => {
  if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  return void 0;
}, z.date({ required_error: "Data de in\xEDcio \xE9 obrigat\xF3ria." })), endDate: z.preprocess((arg) => {
  if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  return void 0;
}, z.date().optional().nullable()), campaignId: z.preprocess((val) => val === void 0 || val === null || val === "" || String(val).toUpperCase() === "NONE" ? null : parseInt(String(val)), z.number().int().positive().nullable().optional()) }).omit({ id: true, createdAt: true, userId: true });
var insertChatSessionSchema = createInsertSchema(chatSessions, { title: z.string().min(1, "T\xEDtulo da sess\xE3o \xE9 obrigat\xF3rio.").default("Nova Conversa").optional() }).omit({ id: true, createdAt: true, updatedAt: true, userId: true });
var insertChatMessageSchema = createInsertSchema(chatMessages, { text: z.string().min(1, "O texto da mensagem \xE9 obrigat\xF3rio."), sender: z.enum(chatSenderEnum.enumValues), sessionId: z.number().int().positive(), attachmentUrl: z.string().url().optional().nullable() }).omit({ id: true, timestamp: true });
var insertMetricSchema = createInsertSchema(metrics, { campaignId: z.number().int().positive(), userId: z.number().int().positive(), date: z.preprocess((arg) => {
  if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  return void 0;
}, z.date()), impressions: z.number().int().min(0).default(0), clicks: z.number().int().min(0).default(0), conversions: z.number().int().min(0).default(0), cost: z.preprocess((val) => typeof val === "string" && val.trim() !== "" ? parseFloat(val) : typeof val === "number" ? val : 0, z.number().min(0).default(0)), revenue: z.preprocess((val) => typeof val === "string" && val.trim() !== "" ? parseFloat(val) : typeof val === "number" ? val : 0, z.number().min(0).default(0)), leads: z.number().int().min(0).default(0) }).omit({ id: true, createdAt: true });
var insertFlowSchema = createInsertSchema(flows, { name: z.string().min(1, "Nome do fluxo \xE9 obrigat\xF3rio."), status: z.enum(flowStatusEnum.enumValues).default("draft"), elements: FlowElementsSchema, campaignId: z.preprocess((val) => val === void 0 || val === null || val === "" || String(val).toUpperCase() === "NONE" ? null : parseInt(String(val)), z.number().int().positive().nullable().optional()) }).omit({ id: true, createdAt: true, updatedAt: true, userId: true });
var insertIntegrationSchema = createInsertSchema(integrations).omit({ id: true, createdAt: true, updatedAt: true, userId: true });
var insertCampaignPhaseSchema = createInsertSchema(campaignPhases).omit({ id: true });
var insertCampaignTaskSchema = createInsertSchema(campaignTasks, {
  startDate: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return void 0;
  }, z.date().optional().nullable()),
  endDate: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return void 0;
  }, z.date().optional().nullable())
}).omit({ id: true });
var selectUserSchema = createSelectSchema(users);
var selectCampaignSchema = createSelectSchema(campaigns);
var selectCreativeSchema = createSelectSchema(creatives);
var selectCopySchema = createSelectSchema(copies);
var selectMetricSchema = createSelectSchema(metrics);
var selectWhatsappMessageSchema = createSelectSchema(whatsappMessages);
var selectAlertSchema = createSelectSchema(alerts);
var selectBudgetSchema = createSelectSchema(budgets);
var selectLandingPageSchema = createSelectSchema(landingPages);
var selectChatSessionSchema = createSelectSchema(chatSessions);
var selectChatMessageSchema = createSelectSchema(chatMessages);
var selectFunnelSchema = createSelectSchema(funnels);
var selectFunnelStageSchema = createSelectSchema(funnelStages);
var selectFlowSchema = createSelectSchema(flows);
var selectIntegrationSchema = createSelectSchema(integrations);
var selectCampaignPhaseSchema = createSelectSchema(campaignPhases);
var selectCampaignTaskSchema = createSelectSchema(campaignTasks);

// server/routes.ts
import { eq as eq3 } from "drizzle-orm";

// server/multer.config.ts
import multer from "multer";
import path2 from "path";
import fs2 from "fs";
function setupMulter(uploadsPath) {
  const UPLOADS_DIR_NAME2 = path2.basename(uploadsPath);
  const LP_ASSETS_DIR = path2.join(uploadsPath, "lp-assets");
  const CREATIVES_ASSETS_DIR = path2.join(uploadsPath, "creatives-assets");
  const MCP_ATTACHMENTS_DIR = path2.join(uploadsPath, "mcp-attachments");
  [LP_ASSETS_DIR, CREATIVES_ASSETS_DIR, MCP_ATTACHMENTS_DIR].forEach((dir) => {
    if (!fs2.existsSync(dir)) {
      fs2.mkdirSync(dir, { recursive: true });
    }
  });
  const creativesUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, CREATIVES_ASSETS_DIR),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path2.extname(file.originalname));
      }
    }),
    limits: { fileSize: 15 * 1024 * 1024 }
    // Limite de 15MB
  });
  const lpAssetUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, LP_ASSETS_DIR),
      filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_").toLowerCase())
    }),
    limits: { fileSize: 5 * 1024 * 1024 }
    // Limite de 5MB
  });
  const mcpAttachmentUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, MCP_ATTACHMENTS_DIR),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "mcp-attachment-" + uniqueSuffix + path2.extname(file.originalname));
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }
    // Limite de 10MB
  });
  return {
    creativesUpload,
    lpAssetUpload,
    mcpAttachmentUpload
  };
}

// server/services/gemini.service.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// server/config.ts
import dotenv2 from "dotenv";
import path3 from "path";
import { fileURLToPath } from "url";
dotenv2.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path3.dirname(__filename);
function getEnv(varName, aDefault) {
  const value = process.env[varName];
  if (value === void 0 && aDefault === void 0) {
    console.warn(`\u26A0\uFE0F  Vari\xE1vel de ambiente ${varName} n\xE3o definida, usando padr\xE3o.`);
  }
  return value ?? aDefault;
}
var PORT = parseInt(getEnv("PORT", "3001"), 10);
var APP_BASE_URL = getEnv("APP_BASE_URL", `http://localhost:${PORT}`);
var JWT_SECRET = getEnv("JWT_SECRET", "mkt2-local-secret-key-2024");
var DATABASE_URL = getEnv("DATABASE_URL", "local-excel-database");
var DATABASE_AUTH_TOKEN = getEnv("DATABASE_AUTH_TOKEN", "");
var GOOGLE_API_KEY = getEnv("GOOGLE_API_KEY_1", getEnv("GOOGLE_API_KEY", ""));
var GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_1 || "AIzaSyBk7b8Z3Q1X2Y3-example-fallback-key";
var OPENROUTER_API_KEY = getEnv("OPENROUTER_API_KEY_1", getEnv("OPENROUTER_API_KEY", ""));
var GOOGLE_CLIENT_ID = getEnv("GOOGLE_CLIENT_ID", "");
var GOOGLE_CLIENT_SECRET = getEnv("GOOGLE_CLIENT_SECRET_1", getEnv("GOOGLE_CLIENT_SECRET", ""));
var FACEBOOK_CLIENT_ID = getEnv("FACEBOOK_CLIENT_ID", "");
var FACEBOOK_CLIENT_SECRET = getEnv("FACEBOOK_CLIENT_SECRET_1", getEnv("FACEBOOK_CLIENT_SECRET", ""));
var SHOPIFY_CLIENT_ID = getEnv("SHOPIFY_CLIENT_ID", "");
var SHOPIFY_CLIENT_SECRET = getEnv("SHOPIFY_CLIENT_SECRET_1", getEnv("SHOPIFY_CLIENT_SECRET", ""));
var HOTMART_CLIENT_ID = getEnv("HOTMART_CLIENT_ID", "");
var HOTMART_CLIENT_SECRET = getEnv("HOTMART_CLIENT_SECRET_1", getEnv("HOTMART_CLIENT_SECRET", ""));
var GOOGLE_DRIVE_CLIENT_ID = getEnv("GOOGLE_DRIVE_CLIENT_ID", "");
var GOOGLE_DRIVE_CLIENT_SECRET = getEnv("GOOGLE_DRIVE_CLIENT_SECRET_1", getEnv("GOOGLE_DRIVE_CLIENT_SECRET", ""));
var GOOGLE_DRIVE_REDIRECT_URI = getEnv("GOOGLE_DRIVE_REDIRECT_URI", "http://localhost:3001/auth/google-drive/callback");
var GOOGLE_DRIVE_REFRESH_TOKEN = getEnv("GOOGLE_DRIVE_REFRESH_TOKEN", "");
var GOOGLE_DRIVE_FOLDER_ID = getEnv("GOOGLE_DRIVE_FOLDER_ID", "");
var PROJECT_ROOT = path3.resolve(__dirname, "..");
var UPLOADS_DIR_NAME = "uploads";
var DATABASE_DIR_NAME = "database";
var LOGS_DIR_NAME = "logs";
var UPLOADS_PATH = path3.join(PROJECT_ROOT, UPLOADS_DIR_NAME);
var DATABASE_PATH = path3.join(PROJECT_ROOT, DATABASE_DIR_NAME);
var LOGS_PATH = path3.join(PROJECT_ROOT, LOGS_DIR_NAME);
var CLIENT_URL = getEnv("CLIENT_URL", "http://localhost:3000");
var SERVER_URL = getEnv("SERVER_URL", `http://localhost:${PORT}`);
console.log("\u{1F680} MKT2 Local - Configura\xE7\xF5es carregadas");
console.log(`\u{1F4C2} Uploads: ${UPLOADS_PATH}`);
console.log(`\u{1F5C3}\uFE0F  Database: ${DATABASE_PATH}`);
console.log(`\u{1F4DD} Logs: ${LOGS_PATH}`);

// server/services/gemini.service.ts
init_api_rotation();
var GeminiService = class {
  constructor(apiKey) {
    this.genAI = null;
    console.log("[GeminiService] Inicializado com rota\xE7\xE3o de APIs");
  }
  async getGenAI() {
    return withApiRotation("GEMINI_API_KEY", (apiKey) => {
      return Promise.resolve(new GoogleGenerativeAI(apiKey));
    });
  }
  getColorScheme(scheme) {
    const schemes = {
      dark: {
        primary: "bg-slate-900",
        secondary: "bg-gray-800",
        accent: "from-blue-600 to-purple-600",
        text: "text-white",
        textSecondary: "text-gray-300"
      },
      light: {
        primary: "bg-white",
        secondary: "bg-gray-50",
        accent: "from-indigo-500 to-purple-600",
        text: "text-gray-900",
        textSecondary: "text-gray-600"
      },
      gradient: {
        primary: "bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900",
        secondary: "bg-white/10 backdrop-blur-lg",
        accent: "from-cyan-400 to-pink-400",
        text: "text-white",
        textSecondary: "text-gray-200"
      },
      neon: {
        primary: "bg-black",
        secondary: "bg-gray-900",
        accent: "from-green-400 to-cyan-400",
        text: "text-white",
        textSecondary: "text-green-300"
      },
      earth: {
        primary: "bg-amber-50",
        secondary: "bg-orange-100",
        accent: "from-orange-500 to-red-500",
        text: "text-amber-900",
        textSecondary: "text-orange-700"
      },
      ocean: {
        primary: "bg-slate-800",
        secondary: "bg-blue-900",
        accent: "from-blue-400 to-teal-400",
        text: "text-white",
        textSecondary: "text-blue-200"
      }
    };
    return schemes[scheme] || schemes.dark;
  }
  getAdvancedSystemPrompt(options) {
    const colors = this.getColorScheme(options.colorScheme || "dark");
    return `
      Voc\xEA \xE9 um EXPERT FRONTEND ARCHITECT e CONVERSION OPTIMIZATION SPECIALIST, especializado em criar landing pages que convertem visitantes em clientes usando as mais avan\xE7adas t\xE9cnicas de UI/UX, neuromarketing e desenvolvimento web moderno.

      \u{1F3AF} MISS\xC3O CR\xCDTICA: Criar uma landing page que seja visualmente IMPRESSIONANTE, tecnicamente PERFEITA e comercialmente EFICAZ.

      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
      \u{1F4CB} ESPECIFICA\xC7\xD5ES T\xC9CNICAS OBRIGAT\xD3RIAS
      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

      \u2705 **FORMATO DE SA\xCDDA ABSOLUTO**:
      - APENAS c\xF3digo HTML puro, de "<!DOCTYPE html>" at\xE9 "</html>"
      - ZERO texto explicativo, ZERO markdown, ZERO coment\xE1rios externos
      - C\xF3digo deve ser 100% funcional e renderiz\xE1vel imediatamente

      \u2705 **ESTRUTURA HTML5 SEM\xC2NTICA COMPLETA**:
      \`\`\`html
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>[T\xEDtulo Otimizado para SEO]</title>
        <meta name="description" content="[Meta description persuasiva de 150-160 caracteres]">
        <link rel="canonical" href="https://exemplo.com">
        <meta property="og:title" content="[Open Graph Title]">
        <meta property="og:description" content="[OG Description]">
        <meta property="og:image" content="[OG Image URL]">
        <meta name="twitter:card" content="summary_large_image">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                animation: {
                  'fade-in-up': 'fadeInUp 0.6s ease-out',
                  'fade-in-down': 'fadeInDown 0.6s ease-out',
                  'slide-in-left': 'slideInLeft 0.8s ease-out',
                  'slide-in-right': 'slideInRight 0.8s ease-out',
                  'pulse-slow': 'pulse 3s infinite',
                  'bounce-gentle': 'bounceGentle 2s infinite',
                  'glow': 'glow 2s ease-in-out infinite alternate'
                },
                keyframes: {
                  fadeInUp: { '0%': { opacity: '0', transform: 'translateY(30px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
                  fadeInDown: { '0%': { opacity: '0', transform: 'translateY(-30px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
                  slideInLeft: { '0%': { opacity: '0', transform: 'translateX(-30px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
                  slideInRight: { '0%': { opacity: '0', transform: 'translateX(30px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
                  bounceGentle: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' } },
                  glow: { '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' }, '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' } }
                }
              }
            }
          }
        </script>
      </head>
      \`\`\`

      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
      \u{1F3A8} ESPECIFICA\xC7\xD5ES VISUAIS PREMIUM
      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

      \u2705 **DESIGN SYSTEM AVAN\xC7ADO**:
      - **Paleta de Cores**: ${JSON.stringify(colors)}
      - **Tipografia**: Font families modernas (Inter, Poppins, ou similar via Google Fonts)
      - **Espa\xE7amento**: Sistema consistente de spacing (8pt grid)
      - **Sombras**: M\xFAltiplas camadas de sombras para profundidade
      - **Bordas**: Border radius consistente e moderno
      - **Gradientes**: Uso estrat\xE9gico de gradientes para elementos de destaque

      \u2705 **ELEMENTOS VISUAIS OBRIGAT\xD3RIOS**:
      - **Background**: Gradientes complexos, padr\xF5es sutis ou texturas
      - **Glassmorphism**: Efeitos de vidro fosco (backdrop-blur)
      - **Neumorphism**: Sombras internas e externas para elementos
      - **Microintera\xE7\xF5es**: Hover effects, transitions suaves
      - **\xCDcones**: SVGs inline da Lucide Icons (https://lucide.dev/)
      - **Imagens**: Placeholders otimizados do https://placehold.co/

      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
      \u{1F4F1} RESPONSIVIDADE EXTREMA
      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

      \u2705 **BREAKPOINTS OTIMIZADOS**:
      - **Mobile**: sm: (640px+) - Layout vertical, CTAs grandes
      - **Tablet**: md: (768px+) - Layout h\xEDbrido, navega\xE7\xE3o adaptada
      - **Desktop**: lg: (1024px+) - Layout horizontal, hover effects
      - **Large**: xl: (1280px+) - M\xE1ximo aproveitamento do espa\xE7o
      - **Extra Large**: 2xl: (1536px+) - Design premium para telas grandes

      \u2705 **OTIMIZA\xC7\xD5ES MOBILE-FIRST**:
      - Touch targets de 44px m\xEDnimo
      - Texto leg\xEDvel sem zoom (16px+ base)
      - Loading otimizado para conex\xF5es lentas
      - Gestos touch intuitivos

      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
      \u{1F3D7}\uFE0F ARQUITETURA DE SE\xC7\xD5ES OBRIGAT\xD3RIAS
      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
      
      **REQUISITO CR\xCDTICO**: A p\xE1gina gerada DEVE OBRIGATORIAMENTE conter no m\xEDnimo 6 se\xE7\xF5es para garantir uma estrutura completa de lan\xE7amento digital, seguindo a arquitetura abaixo.

      **1. \u{1F51D} HEADER INTELIGENTE**:
      - Logo + navega\xE7\xE3o sticky com backdrop-blur
      - Menu hamburger animado para mobile
      - CTA no header para convers\xE3o imediata
      - Indicador de scroll progress (opcional)

      **2. \u{1F680} HERO SECTION IMPACTANTE**:
      - Headline poderosa (t\xE9cnicas de copywriting)
      - Subheadline que gera urg\xEAncia/desejo
      - Duplo CTA (prim\xE1rio + secund\xE1rio)
      - Hero image/video de alta qualidade
      - Elementos de prova social (logos, n\xFAmeros)
      - Scroll indicator animado

      **3. \u{1F48E} SE\xC7\xC3O DE VALOR \xDANICO**:
      - Value proposition clara e mensur\xE1vel
      - 3-4 benef\xEDcios principais com \xEDcones
      - Before/After ou compara\xE7\xE3o visual
      - Estat\xEDsticas impressionantes

      **4. \u{1F3AF} RECURSOS/FUNCIONALIDADES**:
      - Grid responsivo de features
      - Cada feature com \xEDcone SVG \xFAnico
      - Microcopy persuasivo
      - Hover effects elaborados

      **5. \u{1F4CA} PROVA SOCIAL PODEROSA**:
      - Testimonials com fotos reais (placeholders)
      - Ratings/reviews com estrelas
      - Logos de clientes/parceiros
      - N\xFAmeros de impacto (usu\xE1rios, vendas, etc.)

      **6. \u{1F4B0} SE\xC7\xC3O DE PRE\xC7OS (se aplic\xE1vel)**:
      - Cards de pricing com destaque visual
      - Compara\xE7\xE3o de planos clara
      - Badge "Mais Popular" ou "Melhor Valor"
      - Garantias e pol\xEDticas de reembolso

      **7. \u2753 FAQ ESTRAT\xC9GICO**:
      - Accordion interativo
      - Perguntas que eliminam obje\xE7\xF5es
      - Respostas que refor\xE7am benef\xEDcios

      **8. \u{1F525} CTA FINAL IRRESIST\xCDVEL**:
      - Urg\xEAncia e escassez
      - Benef\xEDcio final destacado
      - M\xFAltiplas op\xE7\xF5es de convers\xE3o
      - Garantias de seguran\xE7a

      **9. \u{1F310} FOOTER COMPLETO**:
      - Links organizados por categorias
      - Redes sociais com \xEDcones SVG
      - Newsletter signup
      - Informa\xE7\xF5es legais e contato

      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
      \u26A1 ANIMA\xC7\xD5ES E MICROINTERA\xC7\xD5ES
      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

      \u2705 **N\xCDVEL DE ANIMA\xC7\xC3O: ${options.animationsLevel || "moderate"}**

      **Anima\xE7\xF5es CSS Personalizadas**:
      - Fade in/out com timings perfeitos
      - Slide animations para revelar conte\xFAdo
      - Hover effects sofisticados
      - Loading states elegantes
      - Scroll-triggered animations (CSS only)

      **Microintera\xE7\xF5es Obrigat\xF3rias**:
      - Bot\xF5es com feedback visual instant\xE2neo
      - Cards com hover lift effect
      - Form inputs com estados de foco
      - Navega\xE7\xE3o com indicadores ativos

      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
      \u{1F4C8} OTIMIZA\xC7\xC3O PARA CONVERS\xC3O
      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

      \u2705 **T\xC9CNICAS DE NEUROMARKETING**:
      - Cores que geram a\xE7\xE3o (vermelho, laranja para CTAs)
      - Escassez e urg\xEAncia nos textos
      - Prova social abundante
      - Hierarquia visual clara (regra F)

      \u2705 **COPYWRITING AVAN\xC7ADO**:
      - Headlines com power words
      - Benef\xEDcios focados no cliente (n\xE3o em features)
      - Linguagem emocional + racional
      - CTAs com verbos de a\xE7\xE3o espec\xEDficos

      \u2705 **UX PATTERNS COMPROVADOS**:
      - Above the fold otimizado
      - Formul\xE1rios simples e diretos
      - Trust signals vis\xEDveis
      - Mobile-first approach

      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
      \u{1F6E1}\uFE0F PERFORMANCE E ACESSIBILIDADE
      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

      **Performance**:
      - Lazy loading para imagens
      - CSS otimizado e minificado
      - Fontes com display: swap
      - Cr\xEDtico CSS inline

      **Acessibilidade**:
      - Contraste WCAG AA compliant
      - Alt texts descritivos
      - Navega\xE7\xE3o por teclado
      - Screen reader friendly

      **SEO**:
      - Meta tags completas
      - Schema markup estruturado
      - URLs sem\xE2nticas
      - Core Web Vitals otimizados

      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
      \u{1F4A1} PERSONALIZA\xC7\xC3O BASEADA NO CONTEXTO
      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

      - **Estilo**: ${options.style || "modern"}
      - **Ind\xFAstria**: ${options.industry || "tecnologia"}
      - **P\xFAblico-alvo**: ${options.targetAudience || "profissionais"}
      - **CTA Prim\xE1rio**: ${options.primaryCTA || "Come\xE7ar Agora"}
      - **CTA Secund\xE1rio**: ${options.secondaryCTA || "Saber Mais"}

      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
      \u{1F3AF} COMANDO FINAL
      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

      Crie uma landing page que seja:
      1. **VISUALMENTE DESLUMBRANTE** - Que fa\xE7a o usu\xE1rio parar e admirar
      2. **TECNICAMENTE PERFEITA** - C\xF3digo limpo, sem\xE2ntico e otimizado  
      3. **COMERCIALMENTE EFICAZ** - Focada 100% em convers\xE3o
      4. **MOBILE-FIRST** - Experi\xEAncia premium em todos os dispositivos
      5. **\xDANICA E MEMOR\xC1VEL** - Que destaque da concorr\xEAncia

      **LEMBRE-SE**: Sua resposta deve come\xE7ar IMEDIATAMENTE com "<!DOCTYPE html>" e terminar com "</html>". Nenhum texto adicional!
    `;
  }
  async createAdvancedLandingPage(prompt, options = {}, reference) {
    const genAI2 = await this.getGenAI();
    const model = genAI2.getGenerativeModel({
      model: "gemini-1.5-pro-latest",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        }
      ]
    });
    const systemPrompt = this.getAdvancedSystemPrompt(options);
    const userPrompt = `
      BRIEFING DO CLIENTE:
      ${prompt}
      
      CONFIGURA\xC7\xD5ES ESPEC\xCDFICAS:
      - Estilo: ${options.style || "modern"}
      - Esquema de Cores: ${options.colorScheme || "dark"}
      - Ind\xFAstria: ${options.industry || "N\xE3o especificada"}
      - P\xFAblico-alvo: ${options.targetAudience || "P\xFAblico geral"}
      - CTA Prim\xE1rio: ${options.primaryCTA || "Come\xE7ar Agora"}
      - CTA Secund\xE1rio: ${options.secondaryCTA || "Saber Mais"}
      - Incluir Depoimentos: ${options.includeTestimonials !== false ? "Sim" : "N\xE3o"}
      - Incluir Pre\xE7os: ${options.includePricing ? "Sim" : "N\xE3o"}
      - Incluir Estat\xEDsticas: ${options.includeStats !== false ? "Sim" : "N\xE3o"}
      - Incluir FAQ: ${options.includeFAQ !== false ? "Sim" : "N\xE3o"}
      - N\xEDvel de Anima\xE7\xF5es: ${options.animationsLevel || "moderate"}
      
      ${reference ? `
      REFER\xCANCIA VISUAL (use como inspira\xE7\xE3o para estrutura e design, mas o conte\xFAdo deve ser baseado no briefing acima):
      ${reference}
      ` : ""}

      EXECUTE AGORA: Crie a landing page mais impressionante e eficaz poss\xEDvel!
    `;
    try {
      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = result.response;
      let htmlContent = response.text();
      const htmlMatch = htmlContent.match(/<!DOCTYPE html>.*<\/html>/is);
      if (htmlMatch) {
        htmlContent = htmlMatch[0];
      } else {
        htmlContent = htmlContent.replace(/```html\n?/g, "").replace(/```/g, "").trim();
        if (!htmlContent.startsWith("<!DOCTYPE html>")) {
          htmlContent = `<!DOCTYPE html>
${htmlContent}`;
        }
      }
      return htmlContent;
    } catch (error) {
      console.error("[GeminiService] Erro ao chamar a API do Gemini:", error);
      throw new Error(`Falha ao gerar landing page: ${error.message}`);
    }
  }
  // Método de compatibilidade com a versão anterior
  async createLandingPageFromPrompt(prompt, reference) {
    return this.createAdvancedLandingPage(prompt, {
      style: "modern",
      colorScheme: "dark",
      animationsLevel: "moderate"
    }, reference);
  }
  // Método para gerar múltiplas variações (Otimizado para execução paralela)
  async generateVariations(prompt, count2 = 3, baseOptions = {}) {
    const styles = ["modern", "minimal", "bold", "elegant", "tech"];
    const colorSchemes = ["dark", "gradient", "neon", "ocean"];
    const animationLevels = ["dynamic", "moderate", "subtle"];
    const variationPromises = Array.from({ length: count2 }, (_, i) => {
      const options = {
        ...baseOptions,
        style: styles[i % styles.length],
        colorScheme: colorSchemes[i % colorSchemes.length],
        animationsLevel: animationLevels[i % animationLevels.length]
      };
      return this.createAdvancedLandingPage(prompt, options);
    });
    try {
      const results = await Promise.allSettled(variationPromises);
      const successfulVariations = [];
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successfulVariations.push(result.value);
        } else {
          console.error(`Erro ao gerar varia\xE7\xE3o ${index + 1}:`, result.reason);
        }
      });
      return successfulVariations;
    } catch (error) {
      console.error("[GeminiService] Erro inesperado ao gerar varia\xE7\xF5es:", error);
      return [];
    }
  }
  // Método para otimizar landing page existente
  async optimizeLandingPage(currentHtml, optimizationGoals = ["conversion", "performance", "accessibility"]) {
    const genAI2 = await this.getGenAI();
    const model = genAI2.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const optimizationPrompt = `
      Voc\xEA \xE9 um especialista em OTIMIZA\xC7\xC3O DE CONVERS\xC3O e PERFORMANCE WEB.
      
      Analise a landing page fornecida e aplique as seguintes otimiza\xE7\xF5es:
      ${optimizationGoals.map((goal) => `- ${goal.toUpperCase()}`).join("\n")}
      
      LANDING PAGE ATUAL:
      ${currentHtml}
      
      OTIMIZA\xC7\xD5ES OBRIGAT\xD3RIAS:
      1. Melhore os CTAs para aumentar convers\xE3o
      2. Otimize a hierarquia visual
      3. Adicione elementos de urg\xEAncia e escassez
      4. Melhore a prova social
      5. Otimize para mobile
      6. Adicione microintera\xE7\xF5es
      7. Melhore o SEO on-page
      8. Otimize a velocidade de carregamento
      
      Retorne APENAS o HTML otimizado, sem explica\xE7\xF5es.
    `;
    try {
      const result = await model.generateContent(optimizationPrompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("[GeminiService] Erro ao otimizar landing page:", error);
      throw new Error(`Falha ao otimizar landing page: ${error.message}`);
    }
  }
  /**
   * ✅ NOVO MÉTODO
   * Gera texto genérico baseado em um prompt.
   * Necessário para corrigir o erro 'geminiService.generateText is not a function'.
   */
  async generateText(prompt) {
    const genAI2 = await this.getGenAI();
    const model = genAI2.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("[GeminiService] Erro ao gerar texto:", error);
      throw new Error(`Falha ao gerar texto: ${error.message}`);
    }
  }
};
var geminiService = new GeminiService(GEMINI_API_KEY);

// server/services/gemini.service.fn.ts
import { GoogleGenerativeAI as GoogleGenerativeAI2 } from "@google/generative-ai";
var FunnelGeminiService = class {
  constructor(apiKey) {
    this.genAI = null;
    console.log("[FunnelGeminiService] Inicializado com rota\xE7\xE3o de APIs");
  }
  async getGenAI() {
    const { withApiRotation: withApiRotation2 } = await Promise.resolve().then(() => (init_api_rotation(), api_rotation_exports));
    return withApiRotation2("GEMINI_API_KEY", (apiKey) => {
      return Promise.resolve(new GoogleGenerativeAI2(apiKey));
    });
  }
  async analyzeFunnelScenario(inputs, calculations) {
    const genAI2 = await this.getGenAI();
    const model = genAI2.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = `
      An\xE1lise de Cen\xE1rio de Lan\xE7amento Digital

      **Contexto:** Voc\xEA \xE9 um especialista em estrat\xE9gia de marketing e lan\xE7amentos digitais. Analise os dados a seguir de uma simula\xE7\xE3o de funil de lan\xE7amento e forne\xE7a 3 insights acion\xE1veis e concisos para o usu\xE1rio. Sua resposta deve ser direta, clara e focada em resultados.

      **DADOS DA SIMULA\xC7\xC3O:**

      **Par\xE2metros de Entrada:**
      - Investimento em Tr\xE1fego: R$ ${inputs.investimentoTr\u00E1fego.toLocaleString("pt-BR")}
      - Custo por Lead (CPL) Estimado: R$ ${inputs.cplEstimado.toFixed(2)}
      - Pre\xE7o do Produto Principal: R$ ${inputs.precoProdutoPrincipal.toFixed(2)}
      - Taxa de Convers\xE3o da P\xE1gina de Vendas: ${inputs.taxaConversaoPaginaVendas}%
      
      **M\xE9tricas Calculadas:**
      - Faturamento Bruto: R$ ${calculations.faturamentoBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      - Lucro L\xEDquido: R$ ${calculations.lucroLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      - ROAS (Retorno sobre Investimento): ${calculations.roas.toFixed(2)}x
      - Custo por Aquisi\xE7\xE3o (CAC): R$ ${calculations.cac.toFixed(2)}
      - Total de Leads Gerados: ${calculations.leadsGerados.toLocaleString("pt-BR")}
      - Total de Vendas Realizadas: ${calculations.vendasRealizadas}

      **SUA TAREFA:**
      Baseado nesses dados, forne\xE7a 3 insights estrat\xE9gicos e acion\xE1veis. Foque nos principais pontos de alavancagem ou nos maiores gargalos do funil. Apresente os insights em formato de lista, de forma clara e objetiva.

      **FORMATO DA RESPOSTA:**
      Use o seguinte formato para cada insight, utilizando markdown para negrito:
      - **[\xC1rea de Foco]:** [Sua an\xE1lise e recomenda\xE7\xE3o direta].

      **Exemplo de Resposta:**
      - **Custo por Aquisi\xE7\xE3o (CAC):** Seu CAC de R$ ${calculations.cac.toFixed(2)} est\xE1 [alto/adequado/baixo] em rela\xE7\xE3o ao pre\xE7o do produto. Para otimizar, concentre-se em melhorar a taxa de convers\xE3o da p\xE1gina de vendas ou reduzir o CPL atrav\xE9s de criativos mais eficazes.
      - **Taxa de Convers\xE3o:** Uma taxa de ${inputs.taxaConversaoPaginaVendas}% \xE9 um bom come\xE7o, mas pequenos aumentos aqui geram grande impacto no lucro. Teste A/B no headline e no CTA da sua p\xE1gina de vendas.
      - **Alavancagem de Lucro:** Seu ROAS de ${calculations.roas.toFixed(2)}x indica que a opera\xE7\xE3o \xE9 lucrativa. O principal caminho para escalar o lucro \xE9 otimizar o CPL, pois cada real economizado na aquisi\xE7\xE3o de leads aumenta diretamente sua margem.
    `;
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("[FunnelGeminiService] Erro ao analisar cen\xE1rio do funil:", error);
      throw new Error(`Falha ao analisar cen\xE1rio: ${error.message}`);
    }
  }
};
var funnelGeminiService = new FunnelGeminiService(GEMINI_API_KEY);

// server/routes.ts
import path7 from "path";
import fs6 from "fs";
import jwt2 from "jsonwebtoken";

// server/services/whatsapp-connection.service.ts
import baileys, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  Browsers,
  isJidBroadcast
} from "@whiskeysockets/baileys";
import pino2 from "pino";
import fs4 from "node:fs";
import path5 from "node:path";
import QRCode from "qrcode";

// server/storage.ts
import { eq, desc, and, or, isNull, asc, ilike } from "drizzle-orm";
import bcrypt from "bcrypt";
var DatabaseStorage = class {
  // ✅ NOVO: Gera um slug único para garantir que não haja conflitos no banco
  async generateUniqueSlug(baseSlug) {
    let slug = baseSlug;
    let counter = 1;
    while (await this.getLandingPageBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }
  // --- Usuários e Autenticação ---
  async getUser(id) {
    const result = await db2.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  async getAllUsers() {
    return db2.select({
      id: users.id,
      username: users.username,
      email: users.email,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).orderBy(asc(users.username));
  }
  async getUserByUsername(username) {
    const result = await db2.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }
  async getUserByEmail(email) {
    const result = await db2.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  async createUser(userData) {
    const passwordToSave = userData.password ? await bcrypt.hash(userData.password, 10) : null;
    const [newUser] = await db2.insert(users).values({
      ...userData,
      password: passwordToSave
    }).returning();
    if (!newUser) throw new Error("Falha ao criar usu\xE1rio.");
    return newUser;
  }
  async validatePassword(password, hashedPassword) {
    if (!hashedPassword) return false;
    return bcrypt.compare(password, hashedPassword);
  }
  // --- Campanhas e Fases ---
  async getCampaigns(userId, limit) {
    const results = await db2.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.createdAt));
    if (limit && results.length > limit) {
      return results.slice(0, limit);
    }
    return results;
  }
  async getCampaign(id, userId) {
    const [campaign] = await db2.select().from(campaigns).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId))).limit(1);
    return campaign;
  }
  async getCampaignWithDetails(id, userId) {
    return await db2.query.campaigns.findFirst({
      where: and(eq(campaigns.id, id), eq(campaigns.userId, userId)),
      with: {
        phases: {
          orderBy: [asc(campaignPhases.order)],
          with: {
            tasks: {
              orderBy: [asc(campaignTasks.startDate), asc(campaignTasks.id)],
              with: {
                assignee: {
                  columns: {
                    id: true,
                    username: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }
  async searchCampaignsByName(userId, nameFragment) {
    if (!nameFragment || nameFragment.trim() === "") return [];
    return db2.select().from(campaigns).where(
      and(
        eq(campaigns.userId, userId),
        ilike(campaigns.name, `%${nameFragment}%`)
      )
    ).orderBy(desc(campaigns.createdAt));
  }
  async createCampaign(campaignData) {
    const [newCampaign] = await db2.insert(campaigns).values(campaignData).returning();
    if (!newCampaign) throw new Error("Falha ao criar campanha.");
    const defaultPhases = ["Planejamento", "Aquisi\xE7\xE3o", "Aquecimento", "Evento", "Carrinho", "Recupera\xE7\xE3o", "Downsell", "Debriefing"];
    for (let i = 0; i < defaultPhases.length; i++) {
      await db2.insert(campaignPhases).values({
        campaignId: newCampaign.id,
        name: defaultPhases[i],
        order: i
      });
    }
    return newCampaign;
  }
  async createCampaignFromTemplate(campaignData, templateId) {
    const template = await db2.query.campaigns.findFirst({
      where: and(eq(campaigns.id, templateId), eq(campaigns.isTemplate, true)),
      with: {
        phases: {
          with: {
            tasks: true
          }
        }
      }
    });
    if (!template) throw new Error("Template n\xE3o encontrado.");
    const newCampaignData = {
      ...campaignData,
      description: campaignData.description || template.description,
      platforms: campaignData.platforms && campaignData.platforms.length > 0 ? campaignData.platforms : template.platforms,
      objectives: campaignData.objectives && campaignData.objectives.length > 0 ? campaignData.objectives : template.objectives,
      targetAudience: campaignData.targetAudience || template.targetAudience,
      industry: campaignData.industry || template.industry,
      isTemplate: false
    };
    const [newCampaign] = await db2.insert(campaigns).values(newCampaignData).returning();
    if (!newCampaign) throw new Error("Falha ao criar campanha a partir do template.");
    if (template.phases) {
      for (const phase of template.phases) {
        const [newPhase] = await db2.insert(campaignPhases).values({
          campaignId: newCampaign.id,
          name: phase.name,
          order: phase.order,
          startDate: newCampaign.startDate,
          endDate: newCampaign.endDate
        }).returning();
        if (phase.tasks) {
          for (const task of phase.tasks) {
            await db2.insert(campaignTasks).values({
              phaseId: newPhase.id,
              name: task.name,
              description: task.description,
              status: "pending",
              assigneeId: task.assigneeId
            });
          }
        }
      }
    }
    return newCampaign;
  }
  async updateCampaign(id, userId, data) {
    const {
      phases,
      ...campaignData
    } = data;
    await db2.transaction(async (tx) => {
      if (Object.keys(campaignData).length > 0) {
        await tx.update(campaigns).set({
          ...campaignData,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
      }
      if (phases) {
        for (const phaseData of phases) {
          if (phaseData.id && phaseData.startDate && phaseData.endDate) {
            await tx.update(campaignPhases).set({
              startDate: phaseData.startDate,
              endDate: phaseData.endDate
            }).where(eq(campaignPhases.id, phaseData.id));
          }
        }
      }
    });
    return await this.getCampaignWithDetails(id, userId);
  }
  async deleteCampaign(id, userId) {
    const result = await db2.delete(campaigns).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
  async getPhaseByName(campaignId, phaseName) {
    const result = await db2.select().from(campaignPhases).where(
      and(
        eq(campaignPhases.campaignId, campaignId),
        ilike(campaignPhases.name, `%${phaseName}%`)
      )
    ).limit(1);
    return result[0];
  }
  async createPhase(campaignId, phaseData) {
    const [newPhase] = await db2.insert(campaignPhases).values({
      campaignId,
      name: phaseData.name,
      order: phaseData.order ?? 0
    }).returning();
    if (!newPhase) throw new Error("Falha ao criar a fase da campanha.");
    return newPhase;
  }
  // --- Tarefas ---
  async createTask(taskData) {
    const [newTask] = await db2.insert(campaignTasks).values(taskData).returning();
    if (!newTask) throw new Error("Falha ao criar tarefa.");
    return newTask;
  }
  async updateTask(id, taskData) {
    const [updatedTask] = await db2.update(campaignTasks).set(taskData).where(eq(campaignTasks.id, id)).returning();
    return updatedTask;
  }
  async deleteTask(id) {
    const result = await db2.delete(campaignTasks).where(eq(campaignTasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // --- Criativos ---
  async getCreatives(userId, campaignId) {
    const conditions = [eq(creatives.userId, userId)];
    if (campaignId !== void 0) {
      conditions.push(campaignId === null ? isNull(creatives.campaignId) : eq(creatives.campaignId, campaignId));
    }
    return db2.select().from(creatives).where(and(...conditions)).orderBy(desc(creatives.createdAt));
  }
  async getCreative(id, userId) {
    const [creative] = await db2.select().from(creatives).where(and(eq(creatives.id, id), eq(creatives.userId, userId))).limit(1);
    return creative;
  }
  async createCreative(creativeData) {
    const [newCreative] = await db2.insert(creatives).values(creativeData).returning();
    if (!newCreative) throw new Error("Falha ao criar criativo.");
    return newCreative;
  }
  async updateCreative(id, creativeData, userId) {
    const [updatedCreative] = await db2.update(creatives).set({
      ...creativeData,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(eq(creatives.id, id), eq(creatives.userId, userId))).returning();
    return updatedCreative;
  }
  async deleteCreative(id, userId) {
    const result = await db2.delete(creatives).where(and(eq(creatives.id, id), eq(creatives.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
  // --- Copies ---
  async getCopies(userId, campaignId, phase, purposeKey, searchTerm) {
    const conditions = [eq(copies.userId, userId)];
    if (campaignId !== void 0) {
      conditions.push(campaignId === null ? isNull(copies.campaignId) : eq(copies.campaignId, campaignId));
    }
    if (phase && phase !== "all") {
      conditions.push(eq(copies.launchPhase, phase));
    }
    if (purposeKey && purposeKey !== "all") {
      conditions.push(eq(copies.purposeKey, purposeKey));
    }
    if (searchTerm && searchTerm.trim() !== "") {
      const searchPattern = `%${searchTerm.toLowerCase()}%`;
      conditions.push(or(ilike(copies.title, searchPattern), ilike(copies.content, searchPattern)));
    }
    return db2.select().from(copies).where(and(...conditions)).orderBy(desc(copies.createdAt));
  }
  async createCopy(copyData) {
    const [newCopy] = await db2.insert(copies).values(copyData).returning();
    if (!newCopy) throw new Error("Falha ao salvar a copy.");
    return newCopy;
  }
  async updateCopy(id, copyData, userId) {
    const [updatedCopy] = await db2.update(copies).set({
      ...copyData,
      lastUpdatedAt: /* @__PURE__ */ new Date()
    }).where(and(eq(copies.id, id), eq(copies.userId, userId))).returning();
    return updatedCopy;
  }
  async deleteCopy(id, userId) {
    const result = await db2.delete(copies).where(and(eq(copies.id, id), eq(copies.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
  // --- Landing Pages ---
  async getLandingPages(userId) {
    return db2.select().from(landingPages).where(eq(landingPages.userId, userId)).orderBy(desc(landingPages.createdAt));
  }
  async getLandingPage(id, userId) {
    const [lp] = await db2.select().from(landingPages).where(and(eq(landingPages.id, id), eq(landingPages.userId, userId))).limit(1);
    return lp;
  }
  async getLandingPageBySlug(slug) {
    const [lp] = await db2.select().from(landingPages).where(eq(landingPages.slug, slug)).limit(1);
    return lp;
  }
  async getLandingPageByStudioProjectId(studioProjectId, userId) {
    const [lp] = await db2.select().from(landingPages).where(and(eq(landingPages.studioProjectId, studioProjectId), eq(landingPages.userId, userId))).limit(1);
    return lp;
  }
  async createLandingPage(lpData, userId) {
    const [newLP] = await db2.insert(landingPages).values({ ...lpData, userId }).returning();
    if (!newLP) throw new Error("Falha ao criar landing page.");
    return newLP;
  }
  async updateLandingPage(id, lpData, userId) {
    const [updatedLP] = await db2.update(landingPages).set({
      ...lpData,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(eq(landingPages.id, id), eq(landingPages.userId, userId))).returning();
    return updatedLP;
  }
  async deleteLandingPage(id, userId) {
    const result = await db2.delete(landingPages).where(and(eq(landingPages.id, id), eq(landingPages.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
  // --- Orçamentos (Budgets) ---
  async getBudgets(userId, campaignId) {
    const conditions = [eq(budgets.userId, userId)];
    if (campaignId !== void 0) {
      conditions.push(campaignId === null ? isNull(budgets.campaignId) : eq(budgets.campaignId, campaignId));
    }
    return db2.select().from(budgets).where(and(...conditions)).orderBy(desc(budgets.createdAt));
  }
  async createBudget(budgetData) {
    const [newBudget] = await db2.insert(budgets).values(budgetData).returning();
    if (!newBudget) throw new Error("Falha ao criar or\xE7amento.");
    return newBudget;
  }
  async updateBudget(id, budgetData, userId) {
    const [updatedBudget] = await db2.update(budgets).set(budgetData).where(and(eq(budgets.id, id), eq(budgets.userId, userId))).returning();
    return updatedBudget;
  }
  // --- Alertas ---
  async getAlerts(userId, onlyUnread) {
    const conditions = [eq(alerts.userId, userId)];
    if (onlyUnread) {
      conditions.push(eq(alerts.isRead, false));
    }
    return db2.select().from(alerts).where(and(...conditions)).orderBy(desc(alerts.createdAt));
  }
  async createAlert(alertData) {
    const [newAlert] = await db2.insert(alerts).values(alertData).returning();
    if (!newAlert) throw new Error("Falha ao criar alerta.");
    return newAlert;
  }
  async markAlertAsRead(id, userId) {
    const result = await db2.update(alerts).set({
      isRead: true
    }).where(and(eq(alerts.id, id), eq(alerts.userId, userId), eq(alerts.isRead, false)));
    return (result.rowCount ?? 0) > 0;
  }
  async markAllAlertsAsRead(userId) {
    const result = await db2.update(alerts).set({
      isRead: true
    }).where(and(eq(alerts.userId, userId), eq(alerts.isRead, false)));
    return (result.rowCount ?? 0) > 0;
  }
  // --- Chat (MCP) ---
  async createChatSession(userId, title = "Nova Conversa") {
    const [newSession] = await db2.insert(chatSessions).values({
      userId,
      title,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    if (!newSession) throw new Error("Falha ao criar sess\xE3o de chat.");
    return newSession;
  }
  async getChatSession(sessionId, userId) {
    const [session] = await db2.select().from(chatSessions).where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))).limit(1);
    return session;
  }
  async getChatSessions(userId) {
    return db2.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt));
  }
  async updateChatSessionTitle(sessionId, userId, newTitle) {
    const [updatedSession] = await db2.update(chatSessions).set({
      title: newTitle,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))).returning();
    return updatedSession;
  }
  async deleteChatSession(sessionId, userId) {
    const result = await db2.delete(chatSessions).where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
  async addChatMessage(messageData) {
    const [newMessage] = await db2.insert(chatMessages).values({
      ...messageData,
      timestamp: /* @__PURE__ */ new Date()
    }).returning();
    if (!newMessage) throw new Error("Falha ao adicionar mensagem.");
    await db2.update(chatSessions).set({
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(chatSessions.id, messageData.sessionId));
    return newMessage;
  }
  async getChatMessages(sessionId, userId) {
    const sessionExists = await db2.query.chatSessions.findFirst({
      where: and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))
    });
    if (!sessionExists) return [];
    return db2.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(asc(chatMessages.timestamp));
  }
  // --- Funis e Fluxos ---
  async getFunnels(userId, campaignId) {
    return db2.query.funnels.findMany({
      where: (funnels2, {
        eq: eq4,
        and: and4,
        isNull: isNull2
      }) => and4(eq4(funnels2.userId, userId), campaignId !== void 0 ? campaignId === null ? isNull2(funnels2.campaignId) : eq4(funnels2.campaignId, campaignId) : void 0),
      with: {
        stages: {
          orderBy: [asc(funnelStages.order)]
        }
      },
      orderBy: [desc(funnels.createdAt)]
    });
  }
  async getFunnel(id, userId) {
    return db2.query.funnels.findFirst({
      where: and(eq(funnels.id, id), eq(funnels.userId, userId)),
      with: {
        stages: {
          orderBy: [asc(funnelStages.order)]
        }
      }
    });
  }
  async createFunnel(funnelData) {
    const [newFunnel] = await db2.insert(funnels).values(funnelData).returning();
    return newFunnel;
  }
  async updateFunnel(id, funnelData, userId) {
    const [updatedFunnel] = await db2.update(funnels).set({
      ...funnelData,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(eq(funnels.id, id), eq(funnels.userId, userId))).returning();
    return updatedFunnel;
  }
  async deleteFunnel(id, userId) {
    const result = await db2.delete(funnels).where(and(eq(funnels.id, id), eq(funnels.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
  async createFunnelStage(stageData) {
    const [newStage] = await db2.insert(funnelStages).values(stageData).returning();
    return newStage;
  }
  async getFlows(userId, campaignId) {
    const conditions = [eq(flows.userId, userId)];
    if (campaignId !== void 0) {
      conditions.push(campaignId === null ? isNull(flows.campaignId) : eq(flows.campaignId, campaignId));
    }
    return db2.select().from(flows).where(and(...conditions)).orderBy(desc(flows.createdAt));
  }
  async getFlow(id, userId) {
    const [flow] = await db2.select().from(flows).where(and(eq(flows.id, id), eq(flows.userId, userId))).limit(1);
    return flow;
  }
  async createFlow(flowData, userId) {
    const dataToInsert = { ...flowData, userId };
    const [newFlow] = await db2.insert(flows).values(dataToInsert).returning();
    if (!newFlow) throw new Error("Falha ao criar o fluxo.");
    return newFlow;
  }
  async updateFlow(id, flowData, userId) {
    const dataToSet = {
      ...flowData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    const [updatedFlow] = await db2.update(flows).set(dataToSet).where(and(eq(flows.id, id), eq(flows.userId, userId))).returning();
    return updatedFlow;
  }
  async deleteFlow(id, userId) {
    const result = await db2.delete(flows).where(and(eq(flows.id, id), eq(flows.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
  // --- WhatsApp (Manual Chat) ---
  async getContacts(userId) {
    const allMessages = await db2.select().from(whatsappMessages).where(eq(whatsappMessages.userId, userId)).orderBy(desc(whatsappMessages.timestamp));
    const contactsMap = /* @__PURE__ */ new Map();
    for (const msg of allMessages) {
      if (!contactsMap.has(msg.contactNumber)) {
        contactsMap.set(msg.contactNumber, {
          contactNumber: msg.contactNumber,
          contactName: msg.contactName || null,
          lastMessage: msg.message,
          timestamp: msg.timestamp,
          unreadCount: 0
        });
      }
      const contact = contactsMap.get(msg.contactNumber);
      if (!msg.isRead && msg.direction === "incoming") {
        contact.unreadCount++;
      }
    }
    return Array.from(contactsMap.values());
  }
  async getMessages(userId, contactNumber) {
    return db2.select().from(whatsappMessages).where(and(
      eq(whatsappMessages.userId, userId),
      eq(whatsappMessages.contactNumber, contactNumber)
    )).orderBy(asc(whatsappMessages.timestamp));
  }
  async createWhatsappMessage(messageData) {
    const [newMessage] = await db2.insert(whatsappMessages).values(messageData).returning();
    if (!newMessage) throw new Error("Falha ao salvar mensagem do WhatsApp.");
    return newMessage;
  }
  // --- Dashboard ---
  async getDashboardData(userId, timeRange) {
    try {
      const campaigns2 = await this.getCampaigns(userId);
      const totalCampaigns = campaigns2.length;
      const activeCampaigns = campaigns2.filter((c) => c.status === "active").length;
      const totalSpent = campaigns2.reduce((sum2, c) => sum2 + (c.spent || 0), 0);
      const totalBudget = campaigns2.reduce((sum2, c) => sum2 + (c.budget || 0), 0);
      return {
        totalCampaigns,
        activeCampaigns,
        totalSpent,
        totalBudget,
        conversions: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        conversionRate: 0,
        metrics: {
          totalCampaigns,
          activeCampaigns,
          totalSpent,
          totalBudget,
          conversions: 0,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          cpc: 0,
          conversionRate: 0
        },
        roiData: {
          totalCostPeriod: `R$ ${totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          labels: [],
          datasets: []
        },
        timeSeriesData: { labels: [], datasets: [] },
        channelPerformanceData: { labels: [], datasets: [] },
        recentCampaigns: campaigns2.slice(0, 5),
        aiInsights: []
      };
    } catch (error) {
      console.error("Erro ao obter dados do dashboard:", error);
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalSpent: 0,
        totalBudget: 0,
        conversions: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        conversionRate: 0
      };
    }
  }
};
var storage = new DatabaseStorage();

// server/flow-executor.ts
import pino from "pino";
var logger = pino({ level: "debug" }).child({ module: "FlowExecutor" });
var contactStates = /* @__PURE__ */ new Map();
function findStartNodeId(elements) {
  if (!elements.nodes || elements.nodes.length === 0) return null;
  const targetNodeIds = new Set(elements.edges.map((edge) => edge.target));
  const startNode = elements.nodes.find((node) => !targetNodeIds.has(node.id));
  return startNode ? startNode.id : null;
}
function findNextNodeId(elements, sourceNodeId, sourceHandleId = "source-bottom") {
  const edge = elements.edges.find((e) => e.source === sourceNodeId && e.sourceHandle === sourceHandleId);
  return edge ? edge.target : null;
}
async function executeNode(userId, contactJid, node, state, whatsappService, flow) {
  logger.info({ userId, contactJid, nodeType: node.type, nodeId: node.id }, "Executando n\xF3.");
  state.currentNodeId = node.id;
  state.waitingForInput = false;
  contactStates.set(contactJid, state);
  let nextNodeId = null;
  switch (node.type) {
    case "textMessage":
      const textMessageData = node.data;
      if (textMessageData && typeof textMessageData.text === "string") {
        await whatsappService.sendMessage(contactJid, { text: textMessageData.text });
      }
      nextNodeId = findNextNodeId(flow.elements, node.id);
      break;
    // ✅ CORREÇÃO: Implementação do nó "Aguardar Input"
    case "waitInput":
      const waitInputData = node.data;
      if (waitInputData.message) {
        await whatsappService.sendMessage(contactJid, { text: waitInputData.message });
      }
      state.waitingForInput = true;
      state.variableToSave = waitInputData.variableName || "userInput";
      contactStates.set(contactJid, state);
      break;
    default:
      logger.warn({ nodeType: node.type, nodeId: node.id }, "Tipo de n\xF3 n\xE3o implementado na execu\xE7\xE3o.");
      break;
  }
  if (nextNodeId) {
    const nextNode = flow.elements.nodes.find((n) => n.id === nextNodeId);
    if (nextNode) {
      await executeNode(userId, contactJid, nextNode, state, whatsappService, flow);
    } else {
      logger.warn({ flowId: flow.id, nextNodeId }, "Pr\xF3ximo n\xF3 n\xE3o encontrado no fluxo.");
    }
  }
}
async function processIncomingMessage(userId, contactJid, message, whatsappService) {
  try {
    const messageText = message.message?.conversation || message.message?.extendedTextMessage?.text || "";
    let currentState = contactStates.get(contactJid);
    const activeFlow = await storage.getActiveFlow(userId);
    if (!activeFlow || !activeFlow.elements) {
      logger.warn({ userId, contactJid }, "Nenhum fluxo ativo ou com elementos encontrado.");
      return;
    }
    if (currentState && currentState.flowId !== activeFlow.id) {
      currentState = void 0;
    }
    if (currentState && currentState.waitingForInput) {
      logger.info({ userId, contactJid, variable: currentState.variableToSave, value: messageText }, "Input do usu\xE1rio recebido e salvo.");
      currentState.variables[currentState.variableToSave] = messageText;
      currentState.waitingForInput = false;
      const lastNodeId = currentState.currentNodeId;
      const nextNodeId = findNextNodeId(activeFlow.elements, lastNodeId, "source-received");
      if (nextNodeId) {
        const nextNode = activeFlow.elements.nodes.find((n) => n.id === nextNodeId);
        if (nextNode) {
          await executeNode(userId, contactJid, nextNode, currentState, whatsappService, activeFlow);
        }
      } else {
        logger.info({ flowId: activeFlow.id }, "Fim do fluxo ap\xF3s input do usu\xE1rio.");
      }
    } else {
      const startNodeId = findStartNodeId(activeFlow.elements);
      if (!startNodeId) {
        logger.error({ flowId: activeFlow.id }, "Fluxo ativo n\xE3o possui um n\xF3 inicial definido.");
        return;
      }
      const newState = {
        flowId: activeFlow.id,
        currentNodeId: startNodeId,
        variables: {},
        waitingForInput: false,
        lastMessageTimestamp: Date.now()
      };
      const startNode = activeFlow.elements.nodes.find((n) => n.id === startNodeId);
      if (startNode) {
        await executeNode(userId, contactJid, startNode, newState, whatsappService, activeFlow);
      }
    }
  } catch (error) {
    logger.error({ userId, contactJid, error }, "Erro geral ao processar mensagem no motor de fluxo.");
  }
}

// server/services/whatsapp-connection.service.ts
var makeWASocket = baileys.default;
var SESSIONS_DIR = path5.join(process.cwd(), "server", "sessions");
if (!fs4.existsSync(SESSIONS_DIR)) {
  fs4.mkdirSync(SESSIONS_DIR, { recursive: true });
}
var logger2 = pino2({ level: "debug" }).child({ class: "WhatsappConnectionService" });
var activeConnections = /* @__PURE__ */ new Map();
var WhatsappConnectionService = class {
  constructor(userId) {
    this.sock = null;
    this.userId = userId;
    this.userSessionDir = path5.join(SESSIONS_DIR, `user_${this.userId}`);
    if (!activeConnections.has(userId)) {
      activeConnections.set(userId, { sock: null, statusDetails: { userId: this.userId, status: "disconnected", qrCode: null } });
    }
  }
  updateGlobalStatus(partialUpdate) {
    const existingEntry = activeConnections.get(this.userId) || { sock: this.sock, statusDetails: {} };
    const newStatus = { ...existingEntry.statusDetails, ...partialUpdate, userId: this.userId };
    activeConnections.set(this.userId, { sock: this.sock, statusDetails: newStatus });
    logger2.info({ userId: this.userId, newStatus: newStatus.status, hasQR: !!newStatus.qrCode }, "Global connection status updated");
  }
  async connectToWhatsApp() {
    const existingConnection = activeConnections.get(this.userId);
    if (existingConnection?.sock) {
      logger2.warn({ userId: this.userId }, "Tentativa de conectar com socket j\xE1 existente.");
      return;
    }
    logger2.info({ userId: this.userId }, "Iniciando conex\xE3o com o WhatsApp...");
    this.updateGlobalStatus({ status: "connecting", qrCode: null, lastError: void 0 });
    try {
      if (!fs4.existsSync(this.userSessionDir)) {
        fs4.mkdirSync(this.userSessionDir, { recursive: true });
      }
      const authInfoPath = path5.join(this.userSessionDir, "auth_info_baileys");
      const { state, saveCreds } = await useMultiFileAuthState(authInfoPath);
      const { version } = await fetchLatestBaileysVersion();
      this.sock = makeWASocket({
        version,
        logger: pino2({ level: "warn" }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.ubuntu("Chrome"),
        generateHighQualityLinkPreview: true
      });
      activeConnections.set(this.userId, {
        sock: this.sock,
        statusDetails: activeConnections.get(this.userId).statusDetails
      });
      this.sock.ev.on("creds.update", saveCreds);
      this.sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
          try {
            const qrDataURL = await QRCode.toDataURL(qr);
            this.updateGlobalStatus({ status: "qr_code_needed", qrCode: qrDataURL });
          } catch (qrError) {
            this.updateGlobalStatus({ status: "qr_code_needed", qrCode: qr });
          }
        }
        if (connection === "close") {
          this.handleConnectionClose(lastDisconnect);
        } else if (connection === "open") {
          this.handleConnectionOpen();
        } else if (connection === "connecting") {
          this.updateGlobalStatus({ status: "connecting" });
        }
      });
      this.sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe || isJidBroadcast(msg.key.remoteJid || "")) {
          return;
        }
        const contactJid = msg.key.remoteJid;
        await processIncomingMessage(this.userId, contactJid, msg, this);
      });
    } catch (error) {
      logger2.error({ userId: this.userId, error: error.message, stack: error.stack }, "Falha cr\xEDtica ao inicializar o WhatsApp.");
      this.updateGlobalStatus({ status: "error", lastError: `Falha na inicializa\xE7\xE3o: ${error.message}` });
      this.cleanup();
    }
  }
  handleConnectionClose(lastDisconnect) {
    const boomError = lastDisconnect?.error;
    const statusCode = boomError?.output?.statusCode;
    logger2.warn({ userId: this.userId, statusCode, error: boomError?.message }, `Conex\xE3o fechada.`);
    if (statusCode === DisconnectReason.loggedOut) {
      logger2.info(`[User ${this.userId}] Usu\xE1rio deslogado. Limpando sess\xE3o.`);
      this.cleanSessionFiles();
      this.updateGlobalStatus({ status: "disconnected_logged_out", qrCode: null });
    } else if (statusCode === DisconnectReason.restartRequired || statusCode === 515) {
      logger2.info(`[User ${this.userId}] Reinicializa\xE7\xE3o necess\xE1ria (StatusCode: ${statusCode}). Tentando reconectar...`);
      this.updateGlobalStatus({ status: "connecting", qrCode: null });
      this.cleanup();
      setTimeout(() => this.connectToWhatsApp(), 5e3);
      return;
    } else {
      const errorMessage = boomError?.message || "Conex\xE3o perdida";
      this.updateGlobalStatus({ status: "error", lastError: errorMessage });
    }
    this.cleanup();
  }
  handleConnectionOpen() {
    const phone = this.sock?.user?.id?.split(":")[0];
    logger2.info(`[User ${this.userId}] Conex\xE3o aberta com sucesso para: ${phone}`);
    this.updateGlobalStatus({ status: "connected", qrCode: null, connectedPhoneNumber: phone, lastError: void 0 });
  }
  cleanup() {
    const currentStatus = activeConnections.get(this.userId)?.statusDetails;
    this.sock = null;
    if (currentStatus) {
      activeConnections.set(this.userId, { sock: null, statusDetails: currentStatus });
    }
  }
  cleanSessionFiles() {
    try {
      if (fs4.existsSync(this.userSessionDir)) {
        fs4.rmSync(this.userSessionDir, { recursive: true, force: true });
      }
    } catch (error) {
      logger2.error({ userId: this.userId, error: error.message }, "Erro ao limpar arquivos de sess\xE3o.");
    }
  }
  async disconnectWhatsApp() {
    const connection = activeConnections.get(this.userId);
    if (connection?.sock) {
      await connection.sock.logout();
    } else {
      this.cleanSessionFiles();
      this.updateGlobalStatus({ status: "disconnected", qrCode: null });
    }
  }
  static getStatus(userId) {
    return activeConnections.get(userId)?.statusDetails || { userId, status: "disconnected", qrCode: null };
  }
  async sendMessage(jid, messagePayload) {
    const connection = activeConnections.get(this.userId);
    if (!connection?.sock || connection.statusDetails.status !== "connected") {
      throw new Error("WhatsApp n\xE3o conectado.");
    }
    return await connection.sock.sendMessage(jid, messagePayload);
  }
};

// server/services/google-drive.service.ts
import { google } from "googleapis";
var GoogleDriveService = class {
  constructor(apiKey) {
    if (!apiKey) {
      console.warn("[GoogleDriveService] API Key do Google n\xE3o fornecida. O servi\xE7o n\xE3o funcionar\xE1.");
      this.drive = null;
      return;
    }
    this.drive = google.drive({
      version: "v3",
      auth: apiKey
    });
  }
  /**
   * Lista os arquivos de uma pasta pública do Google Drive.
   * A pasta DEVE estar compartilhada com "Qualquer pessoa com o link".
   * @param folderId O ID da pasta do Google Drive.
   * @returns Uma lista de arquivos com seus metadados.
   */
  async listFilesFromFolder(folderId) {
    if (!this.drive) {
      throw new Error("Servi\xE7o do Google Drive n\xE3o inicializado. Verifique a API Key.");
    }
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        // Busca arquivos nesta pasta, que não estejam na lixeira
        fields: "files(id, name, thumbnailLink, webViewLink, webContentLink, iconLink)",
        // Campos que queremos receber
        pageSize: 200
        // Limite de 200 arquivos por pasta
      });
      if (!response.data.files) {
        return [];
      }
      return response.data.files;
    } catch (error) {
      console.error(`[GoogleDriveService] Erro ao buscar arquivos da pasta ${folderId}:`, error.message);
      if (error.code === 404) {
        throw new Error("Pasta n\xE3o encontrada. Verifique o ID e as permiss\xF5es de compartilhamento.");
      }
      if (error.code === 403) {
        throw new Error('Acesso negado. A pasta precisa ser compartilhada publicamente ("Qualquer pessoa com o link").');
      }
      throw new Error("Falha ao comunicar com a API do Google Drive.");
    }
  }
};
var googleDriveService = new GoogleDriveService(GOOGLE_API_KEY);

// server/routes.ts
import { ZodError } from "zod";
import { OAuth2Client } from "google-auth-library";

// server/mcp_handler.ts
import { GoogleGenerativeAI as GoogleGenerativeAI3 } from "@google/generative-ai";
import fs5 from "fs";
import path6 from "path";
import mammoth from "mammoth";
import Papa from "papaparse";
import * as XLSX2 from "xlsx";
var genAI = null;
if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI3(GEMINI_API_KEY);
    console.log("[MCP_HANDLER_GEMINI] SDK do Gemini inicializado com sucesso.");
  } catch (error) {
    console.error("[MCP_HANDLER_GEMINI] Falha ao inicializar o SDK do Gemini:", error);
    genAI = null;
  }
}
async function processFile(attachmentUrl) {
  if (!attachmentUrl) return null;
  try {
    const url = new URL(attachmentUrl);
    const relativePath = url.pathname.replace(`/${UPLOADS_DIR_NAME}/`, "");
    const filePath = path6.join(UPLOADS_PATH, relativePath);
    if (!fs5.existsSync(filePath)) {
      console.error(`[MCP_HANDLER] Arquivo n\xE3o encontrado: ${filePath}`);
      return null;
    }
    const fileExtension = path6.extname(filePath).toLowerCase();
    if ([".png", ".jpeg", ".jpg", ".webp"].includes(fileExtension)) {
      const mimeType = `image/${fileExtension.substring(1)}`;
      const imageBuffer = fs5.readFileSync(filePath);
      return { type: "image", content: imageBuffer.toString("base64"), mimeType };
    }
    let textContent = null;
    if (fileExtension === ".pdf") {
      const pdf = (await import("pdf-parse")).default;
      const dataBuffer = fs5.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      textContent = data.text;
    } else if (fileExtension === ".docx") {
      const { value } = await mammoth.extractRawText({ path: filePath });
      textContent = value;
    } else if (fileExtension === ".txt" || fileExtension === ".md") {
      textContent = fs5.readFileSync(filePath, "utf-8");
    }
    if (textContent !== null) {
      return { type: "text", content: textContent };
    }
    let jsonData = null;
    if (fileExtension === ".csv") {
      const fileString = fs5.readFileSync(filePath, "utf-8");
      jsonData = Papa.parse(fileString, { header: true, skipEmptyLines: true }).data;
    } else if (fileExtension === ".xlsx" || fileExtension === ".xls") {
      const workbook = XLSX2.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      jsonData = XLSX2.utils.sheet_to_json(worksheet);
    }
    if (jsonData !== null) {
      return { type: "json", content: JSON.stringify(jsonData, null, 2) };
    }
    console.log(`[MCP_HANDLER] Tipo de arquivo n\xE3o suportado: ${fileExtension}`);
    return null;
  } catch (error) {
    console.error("[MCP_HANDLER] Erro ao processar o anexo:", error);
    return null;
  }
}
async function getCampaignDetailsFromContext(message, fileInfo) {
  if (!genAI) return null;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    let fileContextPrompt = "Nenhum arquivo anexado.";
    if (fileInfo) {
      if (fileInfo.type === "text") {
        fileContextPrompt = `Conte\xFAdo do documento de texto:
${fileInfo.content.substring(0, 4e3)}`;
      } else if (fileInfo.type === "json") {
        fileContextPrompt = `Conte\xFAdo da planilha (em JSON):
${fileInfo.content.substring(0, 4e3)}`;
      } else if (fileInfo.type === "image") {
        fileContextPrompt = "Uma imagem foi anexada. Analise-a para extrair o tema e o p\xFAblico-alvo.";
      }
    }
    const promptForDetails = `
			Com base na conversa e no arquivo anexado, extraia detalhes para criar uma campanha de marketing.
			Mensagem do usu\xE1rio: "${message}"
			Contexto do Arquivo: ${fileContextPrompt}
			
			Extraia as seguintes informa\xE7\xF5es: "name", "description", "objectives", "targetAudience".
			Responda APENAS com um objeto JSON. Se uma informa\xE7\xE3o n\xE3o for encontrada, deixe o campo como nulo.
		`;
    const parts = [{ text: promptForDetails }];
    if (fileInfo?.type === "image") {
      parts.push({ inlineData: { mimeType: fileInfo.mimeType, data: fileInfo.content } });
    }
    const result = await model.generateContent({ contents: [{ role: "user", parts }] });
    const text2 = result.response.text().trim();
    const jsonMatch = text2.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("[MCP_HANDLER_GEMINI] Erro ao extrair detalhes da campanha:", error);
    return null;
  }
}
async function getTaskDetailsFromContext(message, history) {
  if (!genAI) return null;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const historyText = history.map((h) => `${h.sender}: ${h.text}`).join("\n");
    const prompt = `
			Baseado na \xFAltima mensagem do usu\xE1rio e no hist\xF3rico da conversa, extraia os detalhes para CRIAR UMA TAREFA.
			Hist\xF3rico:
			${historyText}
			
			Mensagem do usu\xE1rio: "${message}"

			Extraia as seguintes informa\xE7\xF5es:
			- "name": O nome da tarefa.
			- "campaignName": O nome da campanha onde a tarefa deve ser criada. Use o contexto do hist\xF3rico se o usu\xE1rio disser "nesta campanha" ou algo similar.
			- "phaseName": O nome da fase (ex: 'Planejamento', 'Aquisi\xE7\xE3o'). Se n\xE3o for mencionado, deixe como nulo.
			- "description": Uma descri\xE7\xE3o opcional para a tarefa.

			Responda APENAS com um objeto JSON. Se uma informa\xE7\xE3o n\xE3o for encontrada, deixe o campo como nulo.
		`;
    const result = await model.generateContent(prompt);
    const text2 = result.response.text().trim();
    const jsonMatch = text2.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("[MCP_HANDLER_GEMINI] Erro ao extrair detalhes da tarefa:", error);
    return null;
  }
}
async function handleMCPConversation(userId, message, currentSessionId, attachmentUrl) {
  console.log(`[MCP_HANDLER] User ${userId} disse: "${message || "[Anexo]"}" (Session: ${currentSessionId || "Nova"})`);
  const fileInfo = attachmentUrl ? await processFile(attachmentUrl) : null;
  let activeSession;
  if (currentSessionId) {
    activeSession = await storage.getChatSession(currentSessionId, userId) ?? await storage.createChatSession(userId, "Nova Conversa");
  } else {
    activeSession = await storage.createChatSession(userId, "Nova Conversa");
  }
  const history = await storage.getChatMessages(activeSession.id, userId);
  await storage.addChatMessage({
    sessionId: activeSession.id,
    sender: "user",
    text: message || (attachmentUrl ? `Anexo: ${path6.basename(attachmentUrl)}` : "Mensagem vazia."),
    attachmentUrl: attachmentUrl || null
  });
  let agentReplyText;
  const responsePayload = { sessionId: activeSession.id };
  if (genAI && (message || fileInfo)) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    let fileContextForIntent = "";
    if (fileInfo) {
      fileContextForIntent = `O usu\xE1rio enviou um anexo do tipo '${fileInfo.type}'.`;
      if (fileInfo.type === "text" || fileInfo.type === "json") {
        fileContextForIntent += ` Primeiras linhas do conte\xFAdo: "${fileInfo.content.substring(0, 500)}"`;
      }
    }
    const intentPrompt = `
			Analisando a mensagem do usu\xE1rio, o anexo e o hist\xF3rico, qual \xE9 a inten\xE7\xE3o principal?
			MENSAGEM: "${message}".
			ANEXO: ${fileContextForIntent}
			HIST\xD3RICO RECENTE: ${history.slice(-4).map((h) => h.text).join("; ")}
			
			Responda com uma das seguintes inten\xE7\xF5es: NAVEGAR, CRIAR_CAMPANHA, CRIAR_TAREFA, EXPORTAR_RELATORIO, ou CONVERSA_GERAL.
		`;
    const intentParts = [{ text: intentPrompt }];
    if (fileInfo?.type === "image") {
      intentParts.push({ inlineData: { mimeType: fileInfo.mimeType, data: fileInfo.content } });
    }
    const intentResult = await model.generateContent({ contents: [{ role: "user", parts: intentParts }] });
    const intentResponse = intentResult.response.text().trim();
    console.log(`[MCP_HANDLER] Inten\xE7\xE3o detectada: ${intentResponse}`);
    if (intentResponse.includes("NAVEGAR")) {
      const validRoutes = ["/dashboard", "/campaigns", "/schedule", "/creatives", "/budget", "/landingpages", "/funnel", "/copy", "/metrics", "/alerts", "/whatsapp", "/integrations", "/export"];
      const navigationPrompt = `O usu\xE1rio quer navegar. Qual destas rotas \xE9 a mais apropriada para a mensagem "${message}"? Responda APENAS com a rota da lista. Lista de rotas v\xE1lidas: ${validRoutes.join(", ")}.`;
      const navResult = await model.generateContent(navigationPrompt);
      const navPath = navResult.response.text().trim();
      if (validRoutes.includes(navPath)) {
        agentReplyText = `Claro, abrindo a p\xE1gina de ${navPath.replace("/", "")}...`;
        responsePayload.action = "navigate";
        responsePayload.payload = { path: navPath };
      } else {
        agentReplyText = "Entendi que voc\xEA quer navegar, mas n\xE3o sei para qual p\xE1gina. Pode ser mais espec\xEDfico?";
      }
    } else if (intentResponse.includes("CRIAR_TAREFA")) {
      const taskDetails = await getTaskDetailsFromContext(message, history);
      agentReplyText = await handleCreateTask(userId, taskDetails);
      responsePayload.action = "invalidateQuery";
      responsePayload.payload = { queryKey: ["campaigns", "tasks", "campaignSchedule"] };
    } else if (intentResponse.includes("CRIAR_CAMPANHA")) {
      const campaignDetails = await getCampaignDetailsFromContext(message, fileInfo);
      if (campaignDetails && campaignDetails.name) {
        const newCampaignData = { userId, name: campaignDetails.name, description: campaignDetails.description || null, status: "draft", platforms: [], objectives: Array.isArray(campaignDetails.objectives) ? campaignDetails.objectives : [], targetAudience: campaignDetails.targetAudience || null };
        const createdCampaign = await storage.createCampaign(newCampaignData);
        agentReplyText = `Campanha **"${createdCampaign.name}"** criada com sucesso! Voc\xEA pode edit\xE1-la na p\xE1gina de campanhas.`;
        responsePayload.action = "navigate";
        responsePayload.payload = { path: `/campaigns?id=${createdCampaign.id}` };
      } else {
        agentReplyText = "Entendi que voc\xEA quer criar uma campanha, mas n\xE3o consegui extrair um nome. Poderia me dizer o nome para a campanha?";
      }
    } else {
      const historyForGemini = history.map((msg) => ({ role: msg.sender === "user" ? "user" : "model", parts: [{ text: msg.text }] }));
      const systemPrompt = "Voc\xEA \xE9 ubie, um assistente de IA conciso e proativo. Use Markdown para formatar suas respostas.";
      const userParts = [{ text: `${systemPrompt}
${message}` }];
      if (fileInfo?.type === "image") {
        userParts.push({ inlineData: { mimeType: fileInfo.mimeType, data: fileInfo.content } });
      } else if (fileInfo?.type === "text" || fileInfo?.type === "json") {
        userParts[0].text += `

--- CONTE\xDADO DO ANEXO ---
${fileInfo.content.substring(0, 6e3)}`;
      }
      const chat = model.startChat({ history: historyForGemini });
      const result = await chat.sendMessage(userParts);
      agentReplyText = result.response.text();
    }
  } else {
    agentReplyText = `Recebido. ${!genAI ? "O servi\xE7o de IA n\xE3o est\xE1 configurado." : "Por favor, envie uma mensagem de texto ou anexo v\xE1lido."}`;
  }
  await storage.addChatMessage({
    sessionId: activeSession.id,
    sender: "agent",
    text: agentReplyText
  });
  responsePayload.reply = agentReplyText;
  return responsePayload;
}
async function handleCreateTask(userId, taskDetails) {
  if (!taskDetails || !taskDetails.name) {
    return "Entendi que voc\xEA quer criar uma tarefa, mas n\xE3o consegui identificar o nome dela. Poderia repetir, por favor?";
  }
  if (!taskDetails.campaignName) {
    return "Para qual campanha voc\xEA gostaria de adicionar esta tarefa? Se ela n\xE3o existir, eu posso cri\xE1-la.";
  }
  let finalCampaign;
  let messages = [];
  const foundCampaigns = await storage.searchCampaignsByName(userId, taskDetails.campaignName);
  if (foundCampaigns.length === 0) {
    const campaignData = { name: taskDetails.campaignName, userId, status: "draft", platforms: [], objectives: [], targetAudience: null, isTemplate: false };
    finalCampaign = await storage.createCampaign(campaignData);
    messages.push(`Campanha **"${taskDetails.campaignName}"** n\xE3o encontrada, ent\xE3o criei uma nova para voc\xEA.`);
  } else {
    finalCampaign = foundCampaigns[0];
  }
  const campaignDetails = await storage.getCampaignWithDetails(finalCampaign.id, userId);
  let finalPhase;
  if (taskDetails.phaseName) {
    const existingPhase = campaignDetails?.phases.find((p) => p.name.toLowerCase() === taskDetails.phaseName.toLowerCase());
    if (existingPhase) {
      finalPhase = existingPhase;
    } else {
      finalPhase = await storage.createPhase(finalCampaign.id, { name: taskDetails.phaseName });
      messages.push(`Fase **"${taskDetails.phaseName}"** n\xE3o encontrada, ent\xE3o adicionei \xE0 campanha.`);
    }
  } else {
    if (campaignDetails && campaignDetails.phases.length > 0) {
      finalPhase = campaignDetails.phases.sort((a, b) => a.order - b.order)[0];
    } else {
      finalPhase = await storage.createPhase(finalCampaign.id, { name: "Planejamento", order: 1 });
      messages.push(`Criei uma fase padr\xE3o de **"Planejamento"** para sua tarefa.`);
    }
  }
  try {
    await storage.createTask({
      phaseId: finalPhase.id,
      name: taskDetails.name,
      description: taskDetails.description || null,
      status: "pending",
      assigneeId: userId
    });
    messages.push(`Tarefa **"${taskDetails.name}"** adicionada com sucesso na fase **"${finalPhase.name}"**.`);
    return messages.join("\n");
  } catch (error) {
    console.error("Erro ao salvar tarefa:", error);
    return "Ocorreu um erro ao tentar salvar a tarefa no banco de dados.";
  }
}

// server/routes.ts
import axios from "axios";
import { createServer } from "http";

// server/integrations.ts
import { and as and2, eq as eq2 } from "drizzle-orm";
import jwt from "jsonwebtoken";
var getRedirectUri = (platform) => `${APP_BASE_URL}/api/integrations/${platform}/callback`;
var createStateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "10m" });
};
var verifyStateToken = (token) => {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload.userId !== "number") {
      throw new Error("Invalid token payload");
    }
    return payload;
  } catch (error) {
    console.error("State token verification failed:", error);
    throw new Error("Invalid or expired state token.");
  }
};
var getGoogleAuthUrl = (userId) => {
  const state = createStateToken(userId);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri("google"),
    response_type: "code",
    scope: "https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/analytics.readonly",
    access_type: "offline",
    prompt: "consent",
    state
    // Inclui o token de estado
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};
var handleGoogleCallback = async (code, userId) => {
  const tokenParams = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: getRedirectUri("google"),
    grant_type: "authorization_code"
  });
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString()
  });
  if (!tokenRes.ok) {
    const errorBody = await tokenRes.json();
    console.error("Google token exchange failed:", errorBody);
    throw new Error("Failed to exchange Google code for token");
  }
  const tokens = await tokenRes.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1e3).toISOString();
  await db2.insert(integrations).values({
    userId,
    platform: "google",
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt
  }).onConflictDoUpdate({
    target: [integrations.userId, integrations.platform],
    set: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt
    }
  });
};
var getFacebookAuthUrl = (userId) => {
  const state = createStateToken(userId);
  const params = new URLSearchParams({
    client_id: FACEBOOK_CLIENT_ID,
    redirect_uri: getRedirectUri("facebook"),
    scope: "ads_management,read_insights",
    response_type: "code",
    state
    // Inclui o token de estado
  });
  return `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;
};
var handleFacebookCallback = async (code, userId) => {
  const tokenParams = new URLSearchParams({
    code,
    client_id: FACEBOOK_CLIENT_ID,
    client_secret: FACEBOOK_CLIENT_SECRET,
    redirect_uri: getRedirectUri("facebook")
  });
  const tokenRes = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?${tokenParams.toString()}`);
  if (!tokenRes.ok) {
    const errorBody = await tokenRes.json();
    console.error("Facebook token exchange failed:", errorBody);
    throw new Error("Failed to exchange Facebook code for token");
  }
  const tokens = await tokenRes.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1e3).toISOString();
  await db2.insert(integrations).values({
    userId,
    platform: "facebook",
    accessToken: tokens.access_token,
    expiresAt
  }).onConflictDoUpdate({
    target: [integrations.userId, integrations.platform],
    set: {
      accessToken: tokens.access_token,
      expiresAt
    }
  });
};
var disconnectPlatform = async (platform, userId) => {
  return await db2.delete(integrations).where(and2(
    eq2(integrations.userId, userId),
    eq2(integrations.platform, platform)
  ));
};

// server/routes.ts
async function doRegisterRoutes(app) {
  const { creativesUpload, lpAssetUpload, mcpAttachmentUpload } = setupMulter(UPLOADS_PATH);
  const UPLOADS_DIR_NAME2 = path7.basename(UPLOADS_PATH);
  const LP_ASSETS_DIR = path7.join(UPLOADS_PATH, "lp-assets");
  const CREATIVES_ASSETS_DIR = path7.join(UPLOADS_PATH, "creatives-assets");
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  const publicRouter = express.Router();
  const apiRouter = express.Router();
  const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
  const authenticateToken = async (req, res, next) => {
    const forceBypass = process.env.FORCE_AUTH_BYPASS === "true" || process.env.NODE_ENV === "development";
    if (forceBypass) {
      const user = await storage.getUser(1);
      if (!user) {
        const bypassUser = await storage.createUser({ username: "admin_bypass", email: "admin@example.com", password: "password" });
        req.user = bypassUser;
        return next();
      }
      req.user = user;
      return next();
    }
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token n\xE3o fornecido." });
    try {
      const decoded = jwt2.verify(token, JWT_SECRET);
      const user = await storage.getUser(decoded.userId);
      if (!user) return res.status(401).json({ error: "Usu\xE1rio n\xE3o encontrado." });
      req.user = user;
      next();
    } catch (error) {
      return res.status(403).json({ error: "Token inv\xE1lido ou expirado." });
    }
  };
  const handleZodError = (err, req, res, next) => {
    if (err instanceof ZodError) return res.status(400).json({ error: "Erro de valida\xE7\xE3o.", details: err.errors });
    next(err);
  };
  const handleError = (err, req, res, next) => {
    console.error(err);
    res.status(err.statusCode || 500).json({ error: err.message || "Erro interno do servidor." });
  };
  const whatsappServiceInstances = /* @__PURE__ */ new Map();
  function getWhatsappServiceForUser(userId) {
    if (!whatsappServiceInstances.has(userId)) {
      whatsappServiceInstances.set(userId, new WhatsappConnectionService(userId));
    }
    return whatsappServiceInstances.get(userId);
  }
  publicRouter.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
  publicRouter.post("/auth/register", async (req, res, next) => {
    try {
      const data = insertUserSchema.parse(req.body);
      if (await storage.getUserByEmail(data.email)) {
        return res.status(409).json({ error: "Email j\xE1 cadastrado." });
      }
      const user = await storage.createUser(data);
      const token = jwt2.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.status(201).json({ user: { id: user.id, username: user.username, email: user.email }, token });
    } catch (e) {
      next(e);
    }
  });
  publicRouter.post("/auth/login", async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email e senha s\xE3o obrigat\xF3rios." });
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) return res.status(401).json({ error: "Credenciais inv\xE1lidas." });
      if (!await storage.validatePassword(password, user.password)) return res.status(401).json({ error: "Credenciais inv\xE1lidas." });
      const token = jwt2.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ user: { id: user.id, username: user.username, email: user.email }, token });
    } catch (e) {
      next(e);
    }
  });
  publicRouter.post("/auth/google", async (req, res, next) => {
    try {
      const { credential } = req.body;
      if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: "Google Client ID n\xE3o configurado." });
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload?.email || !payload.name) return res.status(400).json({ error: "Payload do Google inv\xE1lido." });
      let user = await storage.getUserByEmail(payload.email) || await storage.createUser({ email: payload.email, username: payload.name });
      const token = jwt2.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ user: { id: user.id, username: user.username, email: user.email }, token });
    } catch (error) {
      next(new Error("Falha na autentica\xE7\xE3o com Google."));
    }
  });
  publicRouter.get("/landingpages/slug/:slug", async (req, res, next) => {
    try {
      const lp = await storage.getLandingPageBySlug(req.params.slug);
      if (!lp) return res.status(404).json({ error: "P\xE1gina n\xE3o encontrada" });
      res.json(lp);
    } catch (e) {
      next(e);
    }
  });
  publicRouter.get("/integrations/:platform/callback", async (req, res, next) => {
    const { platform } = req.params;
    const { code, state } = req.query;
    if (!code || typeof code !== "string") {
      return res.redirect(`/integrations?error=auth_failed`);
    }
    if (!state || typeof state !== "string") {
      return res.redirect(`/integrations?error=invalid_state`);
    }
    try {
      const { userId } = verifyStateToken(state);
      switch (platform) {
        case "google":
          await handleGoogleCallback(code, userId);
          break;
        case "facebook":
          await handleFacebookCallback(code, userId);
          break;
        default:
          return res.redirect(`/integrations?error=unsupported_platform`);
      }
      return res.redirect("/integrations?success=true");
    } catch (error) {
      console.error(`Failed to handle ${platform} callback:`, error);
      return res.redirect(`/integrations?error=callback_failed`);
    }
  });
  apiRouter.use(authenticateToken);
  apiRouter.get("/integrations", async (req, res, next) => {
    try {
      const userIntegrations = await db2.select({
        platform: integrations.platform
      }).from(integrations).where(eq3(integrations.userId, req.user.id));
      res.json(userIntegrations.map((i) => i.platform));
    } catch (e) {
      next(e);
    }
  });
  apiRouter.get("/integrations/:platform/connect", (req, res) => {
    const { platform } = req.params;
    let authUrl = "";
    try {
      switch (platform) {
        case "google":
          authUrl = getGoogleAuthUrl(req.user.id);
          break;
        case "facebook":
          authUrl = getFacebookAuthUrl(req.user.id);
          break;
        default:
          return res.status(400).json({ error: "Platform not supported" });
      }
      res.redirect(authUrl);
    } catch (error) {
      console.error(`Error getting auth URL for ${platform}:`, error);
      res.status(500).json({ error: "Could not generate authentication URL" });
    }
  });
  apiRouter.delete("/integrations/:platform", async (req, res, next) => {
    try {
      const { platform } = req.params;
      await disconnectPlatform(platform, req.user.id);
      res.json({ success: true });
    } catch (e) {
      console.error(`Failed to disconnect ${req.params.platform}:`, e);
      next(e);
    }
  });
  apiRouter.get("/users", async (req, res, next) => {
    try {
      res.json(await storage.getAllUsers());
    } catch (e) {
      next(e);
    }
  });
  apiRouter.get("/dashboard", async (req, res, next) => {
    try {
      const timeRange = req.query.timeRange;
      const userId = req.user?.id || 1;
      const dashboardData = await storage.getDashboardData(userId, timeRange);
      res.json(dashboardData);
    } catch (e) {
      console.error("Erro na rota dashboard:", e);
      res.status(500).json({ error: "Erro interno do servidor ao obter dados do dashboard" });
    }
  });
  apiRouter.get("/campaigns", async (req, res, next) => {
    try {
      res.json(await storage.getCampaigns(req.user.id));
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/campaigns", async (req, res, next) => {
    try {
      const data = insertCampaignSchema.parse(req.body);
      res.status(201).json(await storage.createCampaign({ ...data, userId: req.user.id }));
    } catch (e) {
      next(e);
    }
  });
  apiRouter.get("/campaigns/:id", async (req, res, next) => {
    try {
      const campaign = await storage.getCampaignWithDetails(parseInt(req.params.id), req.user.id);
      if (!campaign) return res.status(404).json({ error: "Campanha n\xE3o encontrada." });
      res.json(campaign);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.put("/campaigns/:id", async (req, res, next) => {
    try {
      const data = insertCampaignSchema.partial().parse(req.body);
      const updated = await storage.updateCampaign(parseInt(req.params.id), req.user.id, data);
      if (!updated) return res.status(404).json({ error: "Campanha n\xE3o encontrada." });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.delete("/campaigns/:id", async (req, res, next) => {
    try {
      await storage.deleteCampaign(parseInt(req.params.id), req.user.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/campaigns/from-template/:templateId", async (req, res, next) => {
    try {
      const templateId = parseInt(req.params.templateId, 10);
      const data = insertCampaignSchema.parse(req.body);
      const newCampaign = await storage.createCampaignFromTemplate({ ...data, userId: req.user.id }, templateId);
      res.status(201).json(newCampaign);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/campaigns/:campaignId/tasks", async (req, res, next) => {
    try {
      const data = insertCampaignTaskSchema.parse(req.body);
      const task = await storage.createTask(data);
      res.status(201).json(task);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.put("/tasks/:taskId", async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const data = insertCampaignTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(taskId, data);
      res.json(task);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.delete("/tasks/:taskId", async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      await storage.deleteTask(taskId);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });
  apiRouter.get("/creatives", async (req, res, next) => {
    try {
      const campaignIdQuery = req.query.campaignId;
      const campaignId = campaignIdQuery === "null" ? null : campaignIdQuery ? parseInt(campaignIdQuery) : void 0;
      res.json(await storage.getCreatives(req.user.id, campaignId));
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/creatives", creativesUpload.single("file"), async (req, res, next) => {
    try {
      const data = insertCreativeSchema.parse(req.body);
      if (req.file) {
        data.fileUrl = `/${UPLOADS_DIR_NAME2}/creatives-assets/${req.file.filename}`;
        data.thumbnailUrl = null;
      }
      const creative = await storage.createCreative({ ...data, userId: req.user.id });
      res.status(201).json(creative);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.put("/creatives/:id", creativesUpload.single("file"), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const existingCreative = await storage.getCreative(id, userId);
      if (!existingCreative) return res.status(404).json({ error: "Criativo n\xE3o encontrado." });
      let updateData = insertCreativeSchema.partial().parse(req.body);
      if (req.file) {
        updateData.fileUrl = `/${UPLOADS_DIR_NAME2}/creatives-assets/${req.file.filename}`;
        updateData.thumbnailUrl = null;
      }
      const updated = await storage.updateCreative(id, updateData, userId);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.delete("/creatives/:id", async (req, res, next) => {
    try {
      await storage.deleteCreative(parseInt(req.params.id), req.user.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });
  apiRouter.get("/creatives/from-drive/:folderId", async (req, res, next) => {
    try {
      const files = await googleDriveService.listFilesFromFolder(req.params.folderId);
      res.json(files);
    } catch (error) {
      next(error);
    }
  });
  apiRouter.post("/creatives/import-from-drive", async (req, res, next) => {
    try {
      const { campaignId, files } = req.body;
      if (!campaignId || !Array.isArray(files)) return res.status(400).json({ error: "ID da campanha e lista de arquivos s\xE3o obrigat\xF3rios." });
      const createdCreatives = [];
      for (const file of files) {
        if (!file.webContentLink) continue;
        const response = await axios({ method: "get", url: file.webContentLink, responseType: "stream" });
        const newFilename = `gdrive-${Date.now()}${path7.extname(file.name || ".jpg")}`;
        const localFilePath = path7.join(CREATIVES_ASSETS_DIR, newFilename);
        const publicFileUrl = `/${UPLOADS_DIR_NAME2}/creatives-assets/${newFilename}`;
        response.data.pipe(fs6.createWriteStream(localFilePath));
        await new Promise((resolve, reject) => response.data.on("end", resolve).on("error", reject));
        const type = file.mimeType?.startsWith("video") ? "video" : "image";
        const data = insertCreativeSchema.parse({ campaignId, name: file.name, type, fileUrl: publicFileUrl, thumbnailUrl: file.thumbnailLink, status: "pending" });
        createdCreatives.push(await storage.createCreative({ ...data, userId: req.user.id }));
      }
      res.status(201).json({ message: `${createdCreatives.length} criativo(s) importado(s).`, data: createdCreatives });
    } catch (error) {
      next(error);
    }
  });
  apiRouter.get("/copies", async (req, res, next) => {
    try {
      const { campaignId, phase, purpose, search } = req.query;
      res.json(await storage.getCopies(req.user.id, campaignId ? Number(campaignId) : void 0, phase, purpose, search));
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/copies", async (req, res, next) => {
    try {
      const data = insertCopySchema.parse(req.body);
      res.status(201).json(await storage.createCopy({ ...data, userId: req.user.id }));
    } catch (e) {
      next(e);
    }
  });
  apiRouter.delete("/copies/:id", async (req, res, next) => {
    try {
      await storage.deleteCopy(parseInt(req.params.id), req.user.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });
  apiRouter.get("/landingpages", async (req, res, next) => {
    try {
      res.json(await storage.getLandingPages(req.user.id));
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/landingpages", async (req, res, next) => {
    try {
      const { name } = req.body;
      const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const finalSlug = await storage.generateUniqueSlug(slugBase);
      const lpData = insertLandingPageSchema.parse({ ...req.body, slug: finalSlug });
      const newLp = await storage.createLandingPage(lpData, req.user.id);
      res.status(201).json(newLp);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/landingpages/preview-advanced", async (req, res, next) => {
    try {
      const { prompt, reference, options } = req.body;
      if (!prompt) return res.status(400).json({ error: "O prompt \xE9 obrigat\xF3rio." });
      const generatedHtml = await geminiService.createAdvancedLandingPage(prompt, options || {}, reference);
      res.status(200).json({ htmlContent: generatedHtml });
    } catch (e) {
      next(e);
    }
  });
  apiRouter.get("/landingpages/:id", async (req, res, next) => {
    try {
      const lp = await storage.getLandingPage(parseInt(req.params.id), req.user.id);
      if (!lp) return res.status(404).json({ error: "P\xE1gina n\xE3o encontrada." });
      res.json(lp);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.put("/landingpages/:id", async (req, res, next) => {
    try {
      const lpData = insertLandingPageSchema.partial().parse(req.body);
      const updated = await storage.updateLandingPage(parseInt(req.params.id), lpData, req.user.id);
      if (!updated) return res.status(404).json({ error: "P\xE1gina n\xE3o encontrada." });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.delete("/landingpages/:id", async (req, res, next) => {
    try {
      await storage.deleteLandingPage(parseInt(req.params.id), req.user.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/landingpages/generate-variations", async (req, res, next) => {
    try {
      const { prompt, count: count2, options, reference } = req.body;
      if (!prompt) return res.status(400).json({ error: "O prompt \xE9 obrigat\xF3rio para gerar varia\xE7\xF5es." });
      const variations = await geminiService.generateVariations(prompt, count2 || 2, options || {}, reference);
      res.json({ variations });
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/landingpages/optimize", async (req, res, next) => {
    try {
      const { html, goals } = req.body;
      if (!html) return res.status(400).json({ error: "O conte\xFAdo HTML \xE9 obrigat\xF3rio para otimiza\xE7\xE3o." });
      const optimizedHtml = await geminiService.optimizeLandingPage(html, goals);
      res.json({ htmlContent: optimizedHtml });
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/analyze-scenario", authenticateToken, async (req, res) => {
    try {
      const { inputs, calculations } = req.body;
      if (!inputs || !calculations) {
        return res.status(400).json({ message: "Dados de inputs e calculations s\xE3o obrigat\xF3rios." });
      }
      const analysis = await funnelGeminiService.analyzeFunnelScenario(inputs, calculations);
      res.json({ analysis });
    } catch (error) {
      console.error("Erro na rota /analyze-scenario:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      res.status(500).json({ message: "Falha ao analisar o cen\xE1rio", error: errorMessage });
    }
  });
  apiRouter.post("/assets/lp-upload", lpAssetUpload.array("files"), (req, res, next) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) return res.status(400).json({ error: "Nenhum arquivo enviado." });
      const urls = req.files.map((file) => `${APP_BASE_URL}/${UPLOADS_DIR_NAME2}/lp-assets/${file.filename}`);
      res.status(200).json(urls);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/mcp/converse", async (req, res, next) => {
    try {
      const { message, sessionId, attachmentUrl } = req.body;
      const payload = await handleMCPConversation(req.user.id, message, sessionId, attachmentUrl);
      res.json(payload);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/mcp/upload-attachment", mcpAttachmentUpload.single("attachment"), (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado." });
      const publicUrl = `${APP_BASE_URL}/${UPLOADS_DIR_NAME2}/mcp-attachments/${req.file.filename}`;
      res.status(200).json({ url: publicUrl });
    } catch (e) {
      next(e);
    }
  });
  apiRouter.get("/alerts", async (req, res, next) => {
    try {
      const onlyUnread = req.query.unread === "true";
      res.json(await storage.getAlerts(req.user.id, onlyUnread));
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/alerts/:id/read", async (req, res, next) => {
    try {
      const success = await storage.markAlertAsRead(parseInt(req.params.id), req.user.id);
      if (!success) return res.status(404).json({ error: "Alerta n\xE3o encontrado." });
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/alerts/mark-all-read", async (req, res, next) => {
    try {
      await storage.markAllAlertsAsRead(req.user.id);
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  });
  apiRouter.get("/chat/sessions", async (req, res, next) => {
    try {
      res.json(await storage.getChatSessions(req.user.id));
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/chat/sessions", async (req, res, next) => {
    try {
      const data = insertChatSessionSchema.parse(req.body);
      res.status(201).json(await storage.createChatSession(req.user.id, data.title));
    } catch (e) {
      next(e);
    }
  });
  apiRouter.get("/chat/sessions/:sessionId/messages", async (req, res, next) => {
    try {
      res.json(await storage.getChatMessages(parseInt(req.params.sessionId), req.user.id));
    } catch (e) {
      next(e);
    }
  });
  apiRouter.put("/chat/sessions/:sessionId/title", async (req, res, next) => {
    try {
      const updated = await storage.updateChatSessionTitle(parseInt(req.params.sessionId), req.user.id, req.body.title);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.delete("/chat/sessions/:sessionId", async (req, res, next) => {
    try {
      await storage.deleteChatSession(parseInt(req.params.sessionId), req.user.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });
  apiRouter.get("/whatsapp/status", (req, res) => res.json(WhatsappConnectionService.getStatus(req.user.id)));
  apiRouter.post("/whatsapp/connect", async (req, res, next) => {
    try {
      getWhatsappServiceForUser(req.user.id).connectToWhatsApp();
      res.status(202).json({ message: "Iniciando conex\xE3o..." });
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/whatsapp/disconnect", async (req, res, next) => {
    try {
      await getWhatsappServiceForUser(req.user.id).disconnectWhatsApp();
      res.json({ message: "Desconex\xE3o solicitada." });
    } catch (e) {
      next(e);
    }
  });
  apiRouter.get("/whatsapp/contacts", async (req, res, next) => {
    try {
      const contacts = await storage.getContacts(req.user.id);
      res.json(contacts);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.get("/whatsapp/messages", async (req, res, next) => {
    try {
      const { contactNumber } = req.query;
      if (typeof contactNumber !== "string") return res.status(400).json({ error: "N\xFAmero de contato \xE9 obrigat\xF3rio." });
      res.json(await storage.getMessages(req.user.id, contactNumber));
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/whatsapp/messages", async (req, res, next) => {
    try {
      const data = insertWhatsappMessageSchema.parse({ ...req.body, userId: req.user.id, direction: "outgoing" });
      const newMessage = await storage.createWhatsappMessage(data);
      res.status(201).json(newMessage);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.get("/flows", async (req, res, next) => {
    try {
      const flowId = req.query.id ? parseInt(String(req.query.id)) : void 0;
      const campaignId = req.query.campaignId ? parseInt(String(req.query.campaignId)) : void 0;
      if (flowId) {
        const flow = await storage.getFlow(flowId, req.user.id);
        if (!flow) return res.status(404).json({ error: "Fluxo n\xE3o encontrado." });
        return res.json(flow);
      }
      res.json(await storage.getFlows(req.user.id, campaignId));
    } catch (e) {
      next(e);
    }
  });
  apiRouter.post("/flows", async (req, res, next) => {
    try {
      const data = insertFlowSchema.omit({ userId: true }).parse(req.body);
      const newFlow = await storage.createFlow(data, req.user.id);
      res.status(201).json(newFlow);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.put("/flows", async (req, res, next) => {
    try {
      const flowId = req.query.id ? parseInt(String(req.query.id)) : void 0;
      if (!flowId) return res.status(400).json({ error: "ID do fluxo \xE9 obrigat\xF3rio." });
      const data = insertFlowSchema.partial().parse(req.body);
      const updated = await storage.updateFlow(flowId, data, req.user.id);
      if (!updated) return res.status(404).json({ error: "Fluxo n\xE3o encontrado." });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });
  apiRouter.delete("/flows", async (req, res, next) => {
    try {
      const flowId = req.query.id ? parseInt(String(req.query.id)) : void 0;
      if (!flowId) return res.status(400).json({ error: "ID do fluxo \xE9 obrigat\xF3rio." });
      const success = await storage.deleteFlow(flowId, req.user.id);
      if (!success) return res.status(404).json({ error: "Fluxo n\xE3o encontrado." });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });
  app.use("/api", publicRouter, apiRouter);
  app.use(handleZodError);
  app.use(handleError);
  return createServer(app);
}
var RouterSetup = {
  registerRoutes: doRegisterRoutes
};

// server/index.ts
import path9 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// server/services/cron.service.ts
import cron from "node-cron";
var CronService = class {
  constructor() {
    this.tasks = [];
    this.initTasks();
  }
  initTasks() {
    const task = cron.schedule("* * * * *", () => {
      console.log("\u23F0 Executando tarefa agendada a cada minuto:", (/* @__PURE__ */ new Date()).toLocaleString());
    });
    this.tasks.push(task);
  }
  startTasks() {
    console.log("\u25B6\uFE0F Iniciando tarefas agendadas...");
    this.tasks.forEach((task) => task.start());
  }
  stopTasks() {
    console.log("\u23F9\uFE0F Parando tarefas agendadas...");
    this.tasks.forEach((task) => task.stop());
  }
};

// server/logger.ts
import * as fs7 from "fs";
import * as path8 from "path";
var LOG_DIR = path8.join(process.cwd(), "logs");
var LOG_FILE = path8.join(LOG_DIR, "app.log");
if (!fs7.existsSync(LOG_DIR)) {
  fs7.mkdirSync(LOG_DIR, { recursive: true });
}
var Logger = class {
  writeToFile(level, module, message, data) {
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
    const logEntry = {
      timestamp: timestamp2,
      level,
      module,
      message,
      data: data ? JSON.stringify(data, null, 2) : void 0
    };
    const logLine = `[${timestamp2}] ${level.padEnd(7)} [${module.padEnd(15)}] ${message}${data ? "\n" + JSON.stringify(data, null, 2) : ""}
`;
    try {
      fs7.appendFileSync(LOG_FILE, logLine);
    } catch (error) {
      originalConsoleError("Erro ao escrever no arquivo de log:", error);
    }
  }
  debug(module, message, data) {
    this.writeToFile("DEBUG" /* DEBUG */, module, message, data);
    originalConsoleLog(`\u{1F50D} [${module}] ${message}`, data || "");
  }
  info(module, message, data) {
    this.writeToFile("INFO" /* INFO */, module, message, data);
    originalConsoleLog(`\u2139\uFE0F  [${module}] ${message}`, data || "");
  }
  warn(module, message, data) {
    this.writeToFile("WARN" /* WARN */, module, message, data);
    originalConsoleWarn(`\u26A0\uFE0F  [${module}] ${message}`, data || "");
  }
  error(module, message, data) {
    this.writeToFile("ERROR" /* ERROR */, module, message, data);
    originalConsoleError(`\u274C [${module}] ${message}`, data || "");
  }
  success(module, message, data) {
    this.writeToFile("SUCCESS" /* SUCCESS */, module, message, data);
    originalConsoleLog(`\u2705 [${module}] ${message}`, data || "");
  }
  // Método especial para requisições HTTP
  request(method, url, statusCode, responseTime, userAgent) {
    const message = `${method} ${url} - ${statusCode} (${responseTime}ms)`;
    const data = { method, url, statusCode, responseTime, userAgent };
    if (statusCode >= 400) {
      this.error("HTTP", message, data);
    } else {
      this.info("HTTP", message, data);
    }
  }
  // Método para operações de banco de dados
  database(operation, table, duration, recordsAffected) {
    const message = `${operation} on ${table} (${duration}ms)${recordsAffected ? ` - ${recordsAffected} records` : ""}`;
    this.info("DATABASE", message, { operation, table, duration, recordsAffected });
  }
  // Método para APIs externas
  apiCall(service, endpoint, success, duration, error) {
    const message = `${service} ${endpoint} - ${success ? "SUCCESS" : "FAILED"} (${duration}ms)`;
    const data = { service, endpoint, success, duration, error };
    if (success) {
      this.success("API", message, data);
    } else {
      this.error("API", message, data);
    }
  }
  // Método para autenticação
  auth(action, userId, username, success = true) {
    const message = `${action} - ${success ? "SUCCESS" : "FAILED"}${username ? ` (${username})` : ""}`;
    const data = { action, userId, username, success };
    if (success) {
      this.success("AUTH", message, data);
    } else {
      this.warn("AUTH", message, data);
    }
  }
  // Método para upload de arquivos
  upload(filename, size, mimeType, success, error) {
    const message = `Upload ${filename} (${(size / 1024 / 1024).toFixed(2)}MB) - ${success ? "SUCCESS" : "FAILED"}`;
    const data = { filename, size, mimeType, success, error };
    if (success) {
      this.success("UPLOAD", message, data);
    } else {
      this.error("UPLOAD", message, data);
    }
  }
  // Método para WhatsApp
  whatsapp(action, contactJid, messageId, success = true, error) {
    const message = `WhatsApp ${action}${contactJid ? ` to ${contactJid}` : ""}${messageId ? ` (${messageId})` : ""} - ${success ? "SUCCESS" : "FAILED"}`;
    const data = { action, contactJid, messageId, success, error };
    if (success) {
      this.success("WHATSAPP", message, data);
    } else {
      this.error("WHATSAPP", message, data);
    }
  }
  // Método para rotação de APIs
  apiRotation(service, keyIndex, action, reason) {
    const message = `${service} key rotation - ${action} (key ${keyIndex + 1})${reason ? `: ${reason}` : ""}`;
    this.info("API_ROTATION", message, { service, keyIndex, action, reason });
  }
  // Método para inicialização do sistema
  startup(module, message, port) {
    const fullMessage = `${message}${port ? ` on port ${port}` : ""}`;
    this.success("STARTUP", `[${module}] ${fullMessage}`);
  }
  // Método para shutdown do sistema
  shutdown(module, message) {
    this.info("SHUTDOWN", `[${module}] ${message}`);
  }
};
var logger3 = new Logger();
function loggerMiddleware(req, res, next) {
  const startTime = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger3.request(
      req.method,
      req.originalUrl || req.url,
      res.statusCode,
      duration,
      req.get("User-Agent")
    );
  });
  next();
}
var originalConsoleLog = console.log;
var originalConsoleError = console.error;
var originalConsoleWarn = console.warn;

// server/index.ts
import * as fs8 from "fs";
import cors from "cors";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path9.dirname(__filename2);
logger3.startup("SERVER", "Iniciando MKT2 Local Server", PORT);
logger3.info("SYSTEM", "=== MKT2 LOCAL - SERVIDOR BACKEND ===");
logger3.info("SYSTEM", `Vers\xE3o: MKT2 Local v2.8`);
logger3.info("SYSTEM", `Ambiente: ${process.env.NODE_ENV || "development"}`);
logger3.info("SYSTEM", `Porta: ${PORT}`);
logger3.info("SYSTEM", `Client URL: ${CLIENT_URL}`);
logger3.info("SYSTEM", "Log \xFAnico ativo - Hist\xF3rico completo mantido");
async function bootstrap() {
  try {
    const app = express2();
    const dirs = ["uploads", "database", "logs", "sessions"];
    dirs.forEach((dir) => {
      const dirPath = path9.join(__dirname2, "..", dir);
      if (!fs8.existsSync(dirPath)) {
        fs8.mkdirSync(dirPath, { recursive: true });
        logger3.info("FILESYSTEM", `Diret\xF3rio criado: ${dir}`);
      }
    });
    const clientDistPath = path9.join(__dirname2, "public");
    app.use(loggerMiddleware);
    app.use(cors({
      origin: CLIENT_URL || "http://localhost:3000",
      credentials: true
    }));
    app.use(express2.json({
      limit: "50mb",
      // Aumenta o limite para requisições JSON
      parameterLimit: 1e5,
      extended: true
    }));
    app.use(express2.urlencoded({
      limit: "50mb",
      // Aumenta o limite para dados de formulário
      extended: true,
      parameterLimit: 1e5
    }));
    app.use(express2.raw({
      limit: "50mb",
      type: ["application/octet-stream", "image/*", "video/*", "audio/*"]
    }));
    app.use("/uploads", express2.static(UPLOADS_PATH));
    app.get("/health", (req, res) => {
      const healthData = {
        status: "ok",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        version: "1.0.0-local",
        database: "excel",
        uptime: process.uptime()
      };
      logger3.info("HEALTH", "Health check solicitado");
      res.json(healthData);
    });
    app.get("/api-status", (req, res) => {
      try {
        const { apiRotation: apiRotation2 } = (init_api_rotation(), __toCommonJS(api_rotation_exports));
        const status = apiRotation2.getStatus();
        logger3.info("API_STATUS", "Status das APIs solicitado");
        res.json(status);
      } catch (error) {
        logger3.error("API_STATUS", "Erro ao obter status das APIs", error);
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    });
    const server = await RouterSetup.registerRoutes(app);
    if (process.env.NODE_ENV === "production") {
      const possiblePaths = [
        path9.join(__dirname2, "public"),
        // Caminho correto para build: dist/public
        path9.join(__dirname2, "..", "dist", "public"),
        path9.join(process.cwd(), "dist", "public"),
        path9.join(__dirname2, "..", "client", "dist"),
        path9.join(process.cwd(), "client", "dist")
      ];
      let clientDistPath2 = null;
      for (const testPath of possiblePaths) {
        if (fs8.existsSync(testPath) && fs8.existsSync(path9.join(testPath, "index.html"))) {
          clientDistPath2 = testPath;
          break;
        }
      }
      if (clientDistPath2) {
        console.log("[SERVER] \u{1F310} Servindo frontend do build de produ\xE7\xE3o:", clientDistPath2);
        app.use(express2.static(clientDistPath2));
        app.get("*", (req, res) => {
          const indexPath = path9.join(clientDistPath2, "index.html");
          res.sendFile(indexPath);
        });
      } else {
        console.warn("[SERVER] \u26A0\uFE0F  Nenhum diret\xF3rio de build v\xE1lido encontrado. Tentados:", possiblePaths);
        console.log("[SERVER] \u{1F527} Fallback: Servindo em modo desenvolvimento");
      }
    } else {
      console.log("[SERVER] \u{1F527} Modo desenvolvimento: Frontend servido pelo Vite na porta 5000");
    }
    app.use((error, req, res, next) => {
      logger3.error("EXPRESS", `Erro n\xE3o tratado: ${error.message}`, {
        stack: error.stack,
        url: req.url,
        method: req.method
      });
      res.status(500).json({
        error: "Erro interno do servidor",
        message: error.message
      });
    });
    server.listen(PORT, () => {
      logger3.startup("SERVER", `Servidor MKT2 Local iniciado`, PORT);
      logger3.info("SERVER", `\u{1F4CA} Dashboard: ${CLIENT_URL}`);
      logger3.info("SERVER", `\u{1F527} API: http://localhost:${PORT}`);
      logger3.info("SERVER", `\u{1F4DD} Logs: logs/app.log`);
      logger3.info("SERVER", `\u{1F5C3}\uFE0F  Database: Excel (local)`);
      console.log("========================================");
      console.log("    \u{1F680} MKT2 LOCAL SERVER ONLINE!");
      console.log("========================================");
      console.log(`\u{1F4CA} Dashboard: ${CLIENT_URL}`);
      console.log(`\u{1F527} API: http://localhost:${PORT}`);
      console.log(`\u{1F4DD} Logs: logs/app.log`);
      console.log(`\u{1F5C3}\uFE0F  Database: Excel (local)`);
      console.log("========================================");
      const cronService = new CronService();
      cronService.startTasks();
      logger3.info("CRON", "Servi\xE7o de Cron inicializado");
    });
  } catch (error) {
    logger3.error("SERVER", "Falha ao iniciar o servidor", error);
    console.error("\u274C Falha ao iniciar o servidor:", error);
    process.exit(1);
  }
}
process.on("SIGINT", () => {
  logger3.shutdown("SERVER", "Recebido SIGINT, encerrando servidor...");
  process.exit(0);
});
process.on("SIGTERM", () => {
  logger3.shutdown("SERVER", "Recebido SIGTERM, encerrando servidor...");
  process.exit(0);
});
bootstrap();
