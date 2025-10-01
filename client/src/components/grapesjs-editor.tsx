// client/src/components/grapesjs-editor.tsx
import React, { useEffect, useRef } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import grapesjsPresetWebpage from 'grapesjs-preset-webpage';
import grapesjsTailwind from 'grapesjs-tailwind';
import JSZip from 'jszip';

interface GrapesJsEditorProps {
  initialData?: { html: string; css: string };
  onSave: (data: { html: string; css: string }) => void;
  onBack: () => void;
  initialTheme?: 'light' | 'dark';
}

const GrapesJsEditor: React.FC<GrapesJsEditorProps> = ({ initialData, onSave, onBack, initialTheme = 'dark' }) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Função para fazer download do projeto como ZIP
  const downloadProjectAsZip = async (editor: Editor) => {
    const body = editor.Canvas.getBody();

    // Remove classes temporariamente para gerar HTML limpo
    body.classList.remove('dashboard-container', 'dark');

    const html = editor.getHtml();
    const css = editor.getCss();

    // Restaura as classes
    body.classList.add('dashboard-container');
    if (body.getAttribute('data-theme') === 'dark') {
      body.classList.add('dark');
    }

    // Cria o HTML completo
    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minha Página</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
${html}
</body>
</html>`;

    // Cria o arquivo ZIP
    const zip = new JSZip();
    zip.file('index.html', fullHtml);
    zip.file('styles.css', css);

    // Adiciona arquivo README
    const readme = `# Projeto Web

Este projeto foi criado com o Editor Visual.

## Como usar:
1. Abra o arquivo index.html em seu navegador
2. Para fazer modificações, edite os arquivos HTML e CSS
3. O Tailwind CSS já está incluído via CDN

## Estrutura:
- index.html: Estrutura da página
- styles.css: Estilos personalizados

Criado em: ${new Date().toLocaleDateString('pt-BR')}
`;

    zip.file('README.md', readme);

    // Gera e faz download do ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projeto-web-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    let editor: Editor | null = null;

    if (editorContainerRef.current) {
      editor = grapesjs.init({
        container: editorContainerRef.current,
        height: '100vh',
        width: 'auto',
        storageManager: false,
        plugins: [grapesjsPresetWebpage, grapesjsTailwind],
        canvas: {
          styles: ['/editor-styles.css'],
          scripts: ['https://cdn.tailwindcss.com'],
        },
        // Tradução para Português Brasileiro
        i18n: {
          locale: 'pt-br',
          detectLocale: false,
          messages: {
            'pt-br': {
              // Painéis principais
              panels: {
                buttons: {
                  'gjs-open-import-webpage': 'Importar',
                  'gjs-toggle-borders': 'Bordas',
                  'gjs-fullscreen': 'Tela cheia',
                  'gjs-export-zip': 'Exportar',
                  'gjs-edit-on': 'Editar',
                  'gjs-edit-off': 'Parar edição',
                  'gjs-preview': 'Visualizar',
                  'gjs-undo': 'Desfazer',
                  'gjs-redo': 'Refazer',
                  'gjs-device-desktop': 'Desktop',
                  'gjs-device-tablet': 'Tablet',
                  'gjs-device-mobile': 'Mobile',
                }
              },
              // Gerenciador de camadas
              layerManager: {
                category: 'Camadas',
                layers: 'Camadas',
                layer: 'Camada',
                rename: 'Renomear',
                delete: 'Excluir',
                selectAll: 'Selecionar tudo',
                visibility: 'Alternar visibilidade',
                lock: 'Alternar bloqueio',
                noLayers: 'Nenhuma camada disponível',
              },
              // Gerenciador de estilos
              styleManager: {
                category: 'Estilos',
                sectors: {
                  general: 'Geral',
                  layout: 'Layout',
                  typography: 'Tipografia',
                  decorations: 'Decorações',
                  extra: 'Extra',
                  flex: 'Flex',
                  dimension: 'Dimensões',
                },
                properties: {
                  float: 'Flutuação',
                  display: 'Exibição',
                  position: 'Posição',
                  top: 'Topo',
                  right: 'Direita',
                  left: 'Esquerda',
                  bottom: 'Fundo',
                  width: 'Largura',
                  height: 'Altura',
                  'max-width': 'Largura máxima',
                  'max-height': 'Altura máxima',
                  margin: 'Margem',
                  padding: 'Preenchimento',
                  'font-family': 'Família da fonte',
                  'font-size': 'Tamanho da fonte',
                  'font-weight': 'Peso da fonte',
                  'letter-spacing': 'Espaçamento das letras',
                  color: 'Cor',
                  'line-height': 'Altura da linha',
                  'text-align': 'Alinhamento do texto',
                  'text-decoration': 'Decoração do texto',
                  'text-shadow': 'Sombra do texto',
                  border: 'Borda',
                  'border-radius': 'Raio da borda',
                  background: 'Fundo',
                  'background-color': 'Cor de fundo',
                  'background-image': 'Imagem de fundo',
                  'box-shadow': 'Sombra da caixa',
                  opacity: 'Opacidade',
                  transition: 'Transição',
                  transform: 'Transformar',
                  cursor: 'Cursor',
                  'z-index': 'Índice Z',
                }
              },
              // Gerenciador de características
              traitManager: {
                category: 'Características',
                traits: {
                  labels: {
                    id: 'ID',
                    alt: 'Alt',
                    title: 'Título',
                    href: 'Link',
                    target: 'Alvo',
                    type: 'Tipo',
                    value: 'Valor',
                    name: 'Nome',
                    placeholder: 'Placeholder',
                    src: 'Fonte',
                    required: 'Obrigatório',
                    checked: 'Marcado',
                    disabled: 'Desabilitado',
                    multiple: 'Múltiplo',
                    draggable: 'Arrastável',
                    contenteditable: 'Editável',
                    crossorigin: 'Cross Origin',
                    integrity: 'Integridade',
                    onchange: 'Ao mudar',
                    onclick: 'Ao clicar',
                    onload: 'Ao carregar',
                  }
                }
              },
              // Gerenciador de blocos
              blockManager: {
                category: 'Blocos',
                categories: {
                  'Basic': 'Básico',
                  'Layout': 'Layout',
                  'Typography': 'Tipografia',
                  'Media': 'Mídia',
                  'Forms': 'Formulários',
                  'Extra': 'Extra',
                },
                labels: {
                  'column1': 'Coluna 1',
                  'column2': 'Coluna 2',
                  'column3': 'Coluna 3',
                  'text': 'Texto',
                  'link': 'Link',
                  'image': 'Imagem',
                  'video': 'Vídeo',
                  'map': 'Mapa',
                  'button': 'Botão',
                  'divider': 'Divisor',
                  'text-section': 'Seção de texto',
                  'hero': 'Hero',
                  'quote': 'Citação',
                  'grid-items': 'Grade de itens',
                  'list-items': 'Lista de itens',
                  'testimonial': 'Depoimento',
                  'pricing': 'Preços',
                  'form': 'Formulário',
                  'input': 'Campo de entrada',
                  'textarea': 'Área de texto',
                  'select': 'Seleção',
                  'checkbox': 'Caixa de seleção',
                  'radio': 'Botão de rádio',
                  'label': 'Rótulo',
                  'navbar': 'Barra de navegação',
                  'tabs': 'Abas',
                  'header': 'Cabeçalho',
                  'footer': 'Rodapé',
                }
              },
              // Mensagens gerais
              general: {
                name: 'Nome',
                open: 'Abrir',
                close: 'Fechar',
                settings: 'Configurações',
                preferences: 'Preferências',
                loading: 'Carregando...',
                continue: 'Continuar',
                cancel: 'Cancelar',
                save: 'Salvar',
                delete: 'Excluir',
                add: 'Adicionar',
                edit: 'Editar',
                remove: 'Remover',
                duplicate: 'Duplicar',
                copy: 'Copiar',
                paste: 'Colar',
                cut: 'Cortar',
                reset: 'Redefinir',
                ok: 'OK',
                yes: 'Sim',
                no: 'Não',
                on: 'Ligado',
                off: 'Desligado',
                select: 'Selecionar',
                toggle: 'Alternar',
                change: 'Alterar',
                back: 'Voltar',
                next: 'Próximo',
                prev: 'Anterior',
                options: 'Opções',
                fullscreen: 'Tela cheia',
                minimize: 'Minimizar',
                maximize: 'Maximizar',
                height: 'Altura',
                width: 'Largura',
                none: 'Nenhum',
                auto: 'Auto',
                size: 'Tamanho',
                icon: 'Ícone',
                text: 'Texto',
                image: 'Imagem',
                url: 'URL',
                path: 'Caminho',
                id: 'ID',
                class: 'Classe',
                color: 'Cor',
                background: 'Fundo',
                border: 'Borda',
                top: 'Topo',
                bottom: 'Fundo',
                left: 'Esquerda',
                right: 'Direita',
                margin: 'Margem',
                padding: 'Preenchimento',
                content: 'Conteúdo',
                style: 'Estilo',
                styles: 'Estilos',
                custom: 'Personalizado',
                preview: 'Visualizar',
                theme: 'Tema',
                advanced: 'Avançado',
                basic: 'Básico',
                general: 'Geral',
                dimension: 'Dimensão',
                typography: 'Tipografia',
                decorations: 'Decorações',
                extra: 'Extra',
                flex: 'Flex',
                devices: 'Dispositivos',
                desktop: 'Desktop',
                tablet: 'Tablet',
                mobile: 'Mobile',
                component: 'Componente',
                components: 'Componentes',
                layers: 'Camadas',
                block: 'Bloco',
                blocks: 'Blocos',
                assets: 'Assets',
                images: 'Imagens',
                file: 'Arquivo',
                files: 'Arquivos',
                upload: 'Upload',
                download: 'Download',
                import: 'Importar',
                export: 'Exportar',
                clear: 'Limpar',
                refresh: 'Atualizar',
                search: 'Pesquisar',
                filter: 'Filtrar',
                sort: 'Ordenar',
                title: 'Título',
                description: 'Descrição',
                category: 'Categoria',
                categories: 'Categorias',
                tag: 'Tag',
                tags: 'Tags',
                label: 'Rótulo',
                labels: 'Rótulos',
                value: 'Valor',
                values: 'Valores',
                default: 'Padrão',
                new: 'Novo',
                create: 'Criar',
                update: 'Atualizar',
                modify: 'Modificar',
                apply: 'Aplicar',
                confirm: 'Confirmar',
                submit: 'Enviar',
                send: 'Enviar',
                receive: 'Receber',
                show: 'Mostrar',
                hide: 'Ocultar',
                visible: 'Visível',
                invisible: 'Invisível',
                enable: 'Habilitar',
                disable: 'Desabilitar',
                enabled: 'Habilitado',
                disabled: 'Desabilitado',
                active: 'Ativo',
                inactive: 'Inativo',
                public: 'Público',
                private: 'Privado',
                internal: 'Interno',
                external: 'Externo',
                online: 'Online',
                offline: 'Offline',
                available: 'Disponível',
                unavailable: 'Indisponível',
                ready: 'Pronto',
                loading: 'Carregando',
                pending: 'Pendente',
                processing: 'Processando',
                complete: 'Completo',
                incomplete: 'Incompleto',
                success: 'Sucesso',
                error: 'Erro',
                warning: 'Aviso',
                info: 'Informação',
                debug: 'Debug',
                log: 'Log',
                history: 'Histórico',
                version: 'Versão',
                versions: 'Versões',
                backup: 'Backup',
                restore: 'Restaurar',
                sync: 'Sincronizar',
                connect: 'Conectar',
                disconnect: 'Desconectar',
                login: 'Login',
                logout: 'Logout',
                register: 'Registrar',
                signin: 'Entrar',
                signup: 'Cadastrar',
                profile: 'Perfil',
                account: 'Conta',
                user: 'Usuário',
                users: 'Usuários',
                admin: 'Admin',
                permission: 'Permissão',
                permissions: 'Permissões',
                role: 'Função',
                roles: 'Funções',
                access: 'Acesso',
                security: 'Segurança',
                privacy: 'Privacidade',
                terms: 'Termos',
                policy: 'Política',
                license: 'Licença',
                copyright: 'Direitos autorais',
                about: 'Sobre',
                help: 'Ajuda',
                support: 'Suporte',
                contact: 'Contato',
                feedback: 'Feedback',
                report: 'Relatório',
                bug: 'Bug',
                feature: 'Funcionalidade',
                request: 'Solicitação',
                suggestion: 'Sugestão',
                improvement: 'Melhoria',
                enhancement: 'Aprimoramento',
                optimization: 'Otimização',
                performance: 'Performance',
                speed: 'Velocidade',
                quality: 'Qualidade',
                standard: 'Padrão',
                format: 'Formato',
                structure: 'Estrutura',
                organization: 'Organização',
                management: 'Gerenciamento',
                control: 'Controle',
                monitor: 'Monitor',
                track: 'Rastrear',
                measure: 'Medir',
                analyze: 'Analisar',
                evaluate: 'Avaliar',
                compare: 'Comparar',
                contrast: 'Contrastar',
                difference: 'Diferença',
                similarity: 'Similaridade',
                match: 'Correspondência',
                mismatch: 'Incompatibilidade',
                conflict: 'Conflito',
                resolution: 'Resolução',
                solution: 'Solução',
                problem: 'Problema',
                issue: 'Questão',
                challenge: 'Desafio',
                opportunity: 'Oportunidade',
                advantage: 'Vantagem',
                benefit: 'Benefício',
                drawback: 'Desvantagem',
                limitation: 'Limitação',
                restriction: 'Restrição',
                constraint: 'Restrição',
                requirement: 'Requisito',
                specification: 'Especificação',
                detail: 'Detalhe',
                overview: 'Visão geral',
                summary: 'Resumo',
                conclusion: 'Conclusão',
                result: 'Resultado',
                outcome: 'Resultado',
                output: 'Saída',
                input: 'Entrada',
                process: 'Processo',
                procedure: 'Procedimento',
                method: 'Método',
                approach: 'Abordagem',
                strategy: 'Estratégia',
                plan: 'Plano',
                goal: 'Objetivo',
                purpose: 'Propósito',
                objective: 'Objetivo',
                mission: 'Missão',
                vision: 'Visão',
                scope: 'Escopo',
                range: 'Faixa',
                limit: 'Limite',
                boundary: 'Limite',
                edge: 'Borda',
                corner: 'Canto',
                center: 'Centro',
                middle: 'Meio',
                start: 'Início',
                end: 'Fim',
                beginning: 'Início',
                finish: 'Fim',
                first: 'Primeiro',
                last: 'Último',
                previous: 'Anterior',
                current: 'Atual',
                recent: 'Recente',
                latest: 'Mais recente',
                newest: 'Mais novo',
                oldest: 'Mais antigo',
                original: 'Original',
                modified: 'Modificado',
                updated: 'Atualizado',
                changed: 'Alterado',
                unchanged: 'Inalterado',
                stable: 'Estável',
                unstable: 'Instável',
                fixed: 'Fixo',
                flexible: 'Flexível',
                dynamic: 'Dinâmico',
                static: 'Estático',
                interactive: 'Interativo',
                responsive: 'Responsivo',
                adaptive: 'Adaptativo',
                compatible: 'Compatível',
                incompatible: 'Incompatível',
                supported: 'Suportado',
                unsupported: 'Não suportado',
                valid: 'Válido',
                invalid: 'Inválido',
                required: 'Obrigatório',
                optional: 'Opcional',
                recommended: 'Recomendado',
                suggested: 'Sugerido',
                alternative: 'Alternativa',
                option: 'Opção',
                choice: 'Escolha',
                selection: 'Seleção',
                preference: 'Preferência',
                setting: 'Configuração',
                configuration: 'Configuração',
                setup: 'Configuração',
                installation: 'Instalação',
                deployment: 'Implantação',
                maintenance: 'Manutenção',
                operation: 'Operação',
                function: 'Função',
                functionality: 'Funcionalidade',
                capability: 'Capacidade',
                tool: 'Ferramenta',
                utility: 'Utilitário',
                service: 'Serviço',
                resource: 'Recurso',
                asset: 'Asset',
                element: 'Elemento',
                item: 'Item',
                object: 'Objeto',
                entity: 'Entidade',
                instance: 'Instância',
                example: 'Exemplo',
                sample: 'Amostra',
                template: 'Modelo',
                pattern: 'Padrão',
                model: 'Modelo',
                framework: 'Framework',
                library: 'Biblioteca',
                package: 'Pacote',
                module: 'Módulo',
                plugin: 'Plugin',
                extension: 'Extensão',
                addon: 'Complemento',
                widget: 'Widget',
                interface: 'Interface',
                api: 'API',
                endpoint: 'Endpoint',
                link: 'Link',
                connection: 'Conexão',
                relationship: 'Relacionamento',
                association: 'Associação',
                binding: 'Vinculação',
                mapping: 'Mapeamento',
                reference: 'Referência',
                pointer: 'Ponteiro',
                address: 'Endereço',
                location: 'Localização',
                coordinate: 'Coordenada',
                point: 'Ponto',
                area: 'Área',
                region: 'Região',
                zone: 'Zona',
                section: 'Seção',
                part: 'Parte',
                piece: 'Peça',
                fragment: 'Fragmento',
                portion: 'Porção',
                segment: 'Segmento',
                division: 'Divisão',
                group: 'Grupo',
                set: 'Conjunto',
                collection: 'Coleção',
                list: 'Lista',
                array: 'Array',
                table: 'Tabela',
                grid: 'Grade',
                matrix: 'Matriz',
                hierarchy: 'Hierarquia',
                tree: 'Árvore',
                branch: 'Ramo',
                node: 'Nó',
                leaf: 'Folha',
                root: 'Raiz',
                parent: 'Pai',
                child: 'Filho',
                sibling: 'Irmão',
                ancestor: 'Ancestral',
                descendant: 'Descendente',
                relation: 'Relação',
                family: 'Família',
                kind: 'Tipo',
                sort: 'Tipo',
                variety: 'Variedade',
                variant: 'Variante',
                edition: 'Edição',
                release: 'Lançamento',
                build: 'Build',
                revision: 'Revisão',
                iteration: 'Iteração',
                cycle: 'Ciclo',
                phase: 'Fase',
                stage: 'Estágio',
                step: 'Passo',
                level: 'Nível',
                tier: 'Camada',
                rank: 'Classificação',
                grade: 'Grau',
                degree: 'Grau',
                scale: 'Escala',
                measure: 'Medida',
                unit: 'Unidade',
                quantity: 'Quantidade',
                amount: 'Quantidade',
                number: 'Número',
                count: 'Contagem',
                total: 'Total',
                sum: 'Soma',
                average: 'Média',
                minimum: 'Mínimo',
                maximum: 'Máximo',
                threshold: 'Limite',
                extent: 'Extensão',
                reach: 'Alcance',
                coverage: 'Cobertura',
                span: 'Intervalo',
                duration: 'Duração',
                period: 'Período',
                time: 'Tempo',
                date: 'Data',
                timestamp: 'Timestamp',
                moment: 'Momento',
                instant: 'Instante',
                interval: 'Intervalo',
                delay: 'Atraso',
                timeout: 'Timeout',
                schedule: 'Cronograma',
                timeline: 'Linha do tempo',
                calendar: 'Calendário',
                agenda: 'Agenda',
                program: 'Programa',
                project: 'Projeto',
                task: 'Tarefa',
                job: 'Trabalho',
                work: 'Trabalho',
                activity: 'Atividade',
                action: 'Ação',
                technique: 'Técnica',
                way: 'Caminho',
                route: 'Rota',
                direction: 'Direção',
                course: 'Curso',
                flow: 'Fluxo',
                stream: 'Fluxo',
                sequence: 'Sequência',
                order: 'Ordem',
                arrangement: 'Arranjo',
                design: 'Design',
                appearance: 'Aparência',
                look: 'Aparência',
                view: 'Visualização',
                display: 'Exibição',
                presentation: 'Apresentação',
                representation: 'Representação',
                visualization: 'Visualização',
                illustration: 'Ilustração',
                demonstration: 'Demonstração',
                exhibition: 'Exibição',
                exposure: 'Exposição',
                revelation: 'Revelação',
                disclosure: 'Divulgação',
                publication: 'Publicação',
                announcement: 'Anúncio',
                notification: 'Notificação',
                alert: 'Alerta',
                message: 'Mensagem',
                communication: 'Comunicação',
                information: 'Informação',
                data: 'Dados',
                material: 'Material',
                substance: 'Substância',
                matter: 'Matéria',
                subject: 'Assunto',
                topic: 'Tópico',
                question: 'Pergunta',
                inquiry: 'Consulta',
                demand: 'Demanda',
                need: 'Necessidade',
                want: 'Desejo',
                wish: 'Desejo',
                desire: 'Desejo',
                intention: 'Intenção',
                aim: 'Objetivo',
                dream: 'Sonho',
                aspiration: 'Aspiração',
                ambition: 'Ambição',
                hope: 'Esperança',
                expectation: 'Expectativa',
                anticipation: 'Antecipação',
              }
            }
          }
        }
      });

      // ✅ A CORREÇÃO: Usar o evento 'load' para garantir que o editor está pronto.
      editor.on('load', () => {
        const panels = editor!.Panels;

        // Botão Voltar
        panels.addButton('options', {
            id: 'back-button',
            className: 'fa fa-arrow-left',
            command: () => onBack(),
            attributes: { title: 'Voltar' },
        });

        // Botão Salvar (com atualização imediata)
        panels.addButton('options', {
            id: 'save-db',
            className: 'fa fa-floppy-o',
            command: (editorInstance) => {
              const body = editorInstance.Canvas.getBody();
              // Removemos as classes do body antes de salvar o HTML
              body.classList.remove('dashboard-container', 'dark');
              const html = editorInstance.getHtml();
              const css = editorInstance.getCss();

              // Chama o onSave que deve atualizar os dados imediatamente
              onSave({ html, css });

              // Readicionamos as classes para continuar editando
              body.classList.add('dashboard-container');
              if (body.getAttribute('data-theme') === 'dark') {
                  body.classList.add('dark');
              }

              // Feedback visual de salvamento
              const saveBtn = panels.getButton('options', 'save-db');
              const originalClass = saveBtn?.get('className');
              saveBtn?.set('className', 'fa fa-check');
              saveBtn?.set('attributes', { title: 'Salvo!' });

              setTimeout(() => {
                saveBtn?.set('className', originalClass);
                saveBtn?.set('attributes', { title: 'Salvar' });
              }, 2000);
            },
            attributes: { title: 'Salvar' },
        });

        // Botão Download ZIP
        panels.addButton('options', {
            id: 'download-zip',
            className: 'fa fa-download',
            command: (editorInstance) => {
              downloadProjectAsZip(editorInstance);
            },
            attributes: { title: 'Baixar Projeto (ZIP)' },
        });

        // Botão Alternar Tema
        panels.addButton('options', {
            id: 'toggle-theme',
            className: 'fa fa-moon-o',
            command: (editorInstance) => {
              const body = editorInstance.Canvas.getBody();
              const button = panels.getButton('options', 'toggle-theme');
              body.classList.toggle('dark');
              if (body.classList.contains('dark')) {
                button?.set('className', 'fa fa-sun-o');
                body.setAttribute('data-theme', 'dark'); // Armazena o estado
              } else {
                button?.set('className', 'fa fa-moon-o');
                body.setAttribute('data-theme', 'light');
              }
            },
            attributes: { title: 'Alternar Tema' },
        });

        // Configuração inicial do tema e canvas
        const body = editor!.Canvas.getBody();
        body.classList.add('dashboard-container');
        if (initialTheme === 'dark') {
          body.classList.add('dark');
          body.setAttribute('data-theme', 'dark');
          panels.getButton('options', 'toggle-theme')?.set('className', 'fa fa-sun-o');
        } else {
          body.setAttribute('data-theme', 'light');
        }

        // Carrega os dados iniciais
        if (initialData?.html) {
          editor!.setComponents(initialData.html);
          if (initialData.css) {
            editor!.setStyle(initialData.css);
          }
        } else {
          editor!.setComponents(
            `<div style="padding: 4rem;">
                <div class="glass-card-wrapper">
                  <div class="glass-card-content">
                    <h1 class="text-4xl font-bold text-glow-primary">Transforme sua rotina...</h1>
                    <p class="mt-4 text-db-text-secondary">Sustentabilidade nunca foi tão acessível.</p>
                  </div>
                </div>
             </div>`
          );
        }
      });

      // Listener para mudanças em tempo real (opcional - para feedback visual)
      editor.on('component:update', () => {
        // Você pode adicionar algum feedback visual aqui se desejar
        // Por exemplo, mostrar um indicador de "não salvo"
      });
    }

    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [initialData, onSave, onBack, initialTheme]);

  return (
    <div className="h-screen w-full">
      <div ref={editorContainerRef} />
    </div>
  );
};

export default GrapesJsEditor;