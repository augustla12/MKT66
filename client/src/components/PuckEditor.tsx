import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Eye, Code, Loader2, Edit3, Copy, Redo, Undo } from 'lucide-react';

// Helper Component que usa Shadow DOM para isolamento de estilo
const ShadowContent: React.FC<{ htmlContent: string }> = ({ htmlContent }) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hostRef.current) {
      // Se a shadow root ainda não existir, crie uma
      if (!hostRef.current.shadowRoot) {
        hostRef.current.attachShadow({ mode: 'open' });
      }
      // Injete o HTML dentro da shadow root
      hostRef.current.shadowRoot!.innerHTML = htmlContent;
    }
  }, [htmlContent]);

  // Este div atua como o "host" para o nosso Shadow DOM.
  return <div ref={hostRef} style={{ width: '100%', height: '100vh' }}></div>;
};

export interface Data {
  html?: string;
  css?: string;
  components?: any; // Mantido para compatibilidade, mas a lógica focará no HTML
  styles?: any;
  [key: string]: any;
}

interface PuckEditorProps {
  initialData?: Data;
  onSave: (data: Data) => void;
  onBack?: () => void;
}

// Simplificamos a estrutura de componentes para focar em um único bloco de HTML
interface EditorComponent {
  id: string;
  type: 'rawHtml';
  content: string;
}

interface HistoryState {
  content: string;
  timestamp: number;
}

export function PuckEditor({ initialData, onSave, onBack }: PuckEditorProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = useCallback((newContent: string) => {
    const newState: HistoryState = { content: newContent, timestamp: Date.now() };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHtmlContent(history[historyIndex - 1].content);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHtmlContent(history[historyIndex + 1].content);
      setHistoryIndex(historyIndex + 1);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const content = initialData?.html || '<p>Comece a editar o seu código HTML.</p>';
    setHtmlContent(content);
    setHistory([{ content, timestamp: Date.now() }]);
    setHistoryIndex(0);
    setIsLoading(false);
  }, [initialData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data: Data = { 
        html: htmlContent, 
        // A estrutura de componentes é salva com o HTML para manter a consistência
        components: [{ id: 'raw_html_1', type: 'rawHtml', content: htmlContent }]
      };
      await onSave(data);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-gray-950 text-gray-200">
      <header className="flex items-center justify-between p-4 border-b bg-gray-900 border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-4">
          {onBack && <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-300 hover:bg-gray-700 hover:text-white"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>}
          <h1 className="text-xl font-semibold">Editor de Página</h1>
          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0} title="Desfazer"><Undo className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1} title="Refazer"><Redo className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreview}><Eye className="h-4 w-4 mr-2" />Preview</Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salvar
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Painel do Editor de Código à Esquerda */}
        <div className="w-1/2 bg-gray-900 border-r border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-medium text-gray-100">Código HTML</h3>
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(htmlContent)}>
              <Copy className="h-3 w-3 mr-2" /> Copiar
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            <textarea
              className="w-full h-full p-4 font-mono text-sm bg-gray-900 border-none text-gray-200 resize-none outline-none"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              onBlur={() => saveToHistory(htmlContent)} // Salva no histórico ao perder o foco
              placeholder="Digite seu código HTML aqui..."
            />
          </div>
        </div>

        {/* Painel de Visualização à Direita com Shadow DOM */}
        <div className="w-1/2 flex flex-col bg-gray-800">
           <div className="p-3 border-b border-gray-700"><h3 className="font-medium text-gray-100">Visualização em Tempo Real</h3></div>
           <div className="flex-1 overflow-auto p-4 bg-gray-500">
             <div className="bg-white rounded-md shadow-lg w-full h-full">
                <ShadowContent htmlContent={htmlContent} />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
