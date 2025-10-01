# 🚀 USB MKT PRO - Instalação Windows

## 📋 Pré-requisitos

1. **Node.js 20+** - [Download aqui](https://nodejs.org)
2. **Windows 10/11** - Sistema operacional suportado

## 🔧 Instalação

1. **Extraia** todos os arquivos em uma pasta (ex: `C:\USB-MKT-PRO\`)

2. **Execute** o instalador:
   ```
   install-windows.bat
   ```

3. **Aguarde** a instalação das dependências (pode demorar alguns minutos)

## 🚀 Como Usar

1. **Inicie** o aplicativo:
   ```
   start-app.bat
   ```

2. **Aguarde** as duas janelas abrirem:
   - Backend (porta 12001)
   - Frontend (porta 12000)

3. **Acesse** no navegador:
   ```
   http://localhost:12000
   ```

## 📊 Funcionalidades Testadas

✅ **Dashboard** - Métricas e análises inteligentes
✅ **Campanhas** - Criação e gerenciamento
✅ **Copy & IA** - Geração de textos com IA
✅ **UBIE Chat** - Assistente IA integrado
✅ **Rotação de APIs** - Sistema de backup automático
✅ **Banco Excel** - Armazenamento local

## 🔧 Configuração de APIs

### OpenRouter (Copy & IA)
1. Obtenha sua chave em: https://openrouter.ai
2. Configure no arquivo `.env`:
   ```
   VITE_OPENROUTER_API_KEY=sua_chave_aqui
   ```

### Gemini (Análises)
1. Obtenha sua chave em: https://makersuite.google.com
2. Configure no arquivo `.env`:
   ```
   GEMINI_API_KEY_1=sua_chave_aqui
   GEMINI_API_KEY_2=sua_chave_backup
   ```

## 📁 Estrutura de Arquivos

```
USB-MKT-PRO/
├── install-windows.bat     # Instalador
├── start-app.bat          # Inicializador
├── database/              # Banco Excel
│   └── mkt2_local.xlsx
├── logs/                  # Logs do sistema
├── uploads/               # Arquivos enviados
└── README-WINDOWS.md      # Este arquivo
```

## 🆘 Solução de Problemas

### ❌ "Node.js não encontrado"
- Instale Node.js 20+ de: https://nodejs.org
- Reinicie o terminal após instalação

### ❌ "Erro ao instalar dependências"
- Execute como Administrador
- Verifique conexão com internet
- Tente: `npm cache clean --force`

### ❌ "Porta já em uso"
- Feche outros aplicativos nas portas 12000/12001
- Reinicie o computador se necessário

### ❌ "Banco de dados não encontrado"
- Certifique-se que `database/mkt2_local.xlsx` existe
- Não mova ou renomeie o arquivo

## 📞 Suporte

Para suporte técnico, verifique:
1. **Logs** em `logs/app.log`
2. **Console** nas janelas do Backend/Frontend
3. **Navegador** - F12 para ver erros

---

**Desenvolvido com ❤️ para Marketing Digital**
