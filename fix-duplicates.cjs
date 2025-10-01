const fs = require('fs');

// Ler o arquivo
const filePath = 'client/src/components/grapesjs-editor.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Lista de chaves duplicadas para remover (manter apenas a primeira ocorrência)
const duplicatesToRemove = [
  'custom: \'Personalizado\',',
  'loading: \'Carregando\',',
  'feature: \'Funcionalidade\',',
  'asset: \'Asset\',',
  'component: \'Componente\',',
  'control: \'Controle\',',
  'url: \'URL\',',
  'position: \'Posição\',',
  'structure: \'Estrutura\',',
  'class: \'Classe\',',
  'type: \'Tipo\',',
  'sort: \'Tipo\',',
  'version: \'Versão\',',
  'layer: \'Camada\',',
  'measure: \'Medida\',',
  'limit: \'Limite\',',
  'boundary: \'Limite\',',
  'range: \'Faixa\',',
  'scope: \'Escopo\',',
  'plan: \'Plano\',',
  'operation: \'Operação\',',
  'process: \'Processo\',',
  'procedure: \'Procedimento\',',
  'method: \'Método\',',
  'approach: \'Abordagem\',',
  'path: \'Caminho\',',
  'organization: \'Organização\',',
  'layout: \'Layout\',',
  'style: \'Estilo\',',
  'theme: \'Tema\',',
  'show: \'Mostrar\',',
  'release: \'Lançamento\',',
  'warning: \'Aviso\',',
  'content: \'Conteúdo\',',
  'issue: \'Questão\',',
  'request: \'Solicitação\',',
  'requirement: \'Requisito\',',
  'purpose: \'Propósito\',',
  'goal: \'Objetivo\',',
  'target: \'Alvo\',',
  'objective: \'Objetivo\',',
  'mission: \'Missão\',',
  'vision: \'Visão\','
];

// Remover duplicatas (manter apenas a primeira ocorrência)
duplicatesToRemove.forEach(duplicate => {
  const regex = new RegExp(`\\s*${duplicate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
  let firstFound = false;
  content = content.replace(regex, (match) => {
    if (!firstFound) {
      firstFound = true;
      return match; // Manter a primeira ocorrência
    }
    return ''; // Remover duplicatas
  });
});

// Escrever o arquivo corrigido
fs.writeFileSync(filePath, content);
console.log('Duplicatas removidas com sucesso!');