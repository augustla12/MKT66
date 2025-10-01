// client/src/components/flow/NodeContextMenu.tsx
import React from 'react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { popoverContentStyle } from './utils';
import { NodeContextMenuProps } from '@/types/zapTypes';
import { Copy, Trash2, StickyNote, PowerOff, CopyPlus } from 'lucide-react';

// Classes de estilo replicadas para manter a consistência visual
const ContextMenuItemClass = "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";
const ContextMenuSeparatorClass = "-mx-1 my-1 h-px bg-border";
const ContextMenuShortcutClass = "ml-auto text-xs tracking-widest text-muted-foreground";

interface FullNodeContextMenuProps extends NodeContextMenuProps {
  onClose: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const NodeContextMenu: React.FC<FullNodeContextMenuProps> = ({ id, top, left, onClose, onDelete, onDuplicate }) => {
  const { toast } = useToast();

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id)
      .then(() => toast({ title: 'ID do Nó Copiado!', description: id }))
      .catch(() => toast({ title: 'Erro', description: 'Não foi possível copiar o ID.', variant: 'destructive' }));
    onClose();
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(id);
    onClose();
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
    onClose();
  };

  const handleActionPlaceholder = (e: React.MouseEvent, actionName: string) => {
    e.stopPropagation();
    toast({ title: 'Ação Futura', description: `A ação "${actionName}" ainda não foi implementada.`});
    onClose();
  };

  return (
    // Backdrop para fechar o menu ao clicar fora
    <div 
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999 }} 
      onMouseDown={onClose}
      onContextMenu={(e) => e.preventDefault()} // Impede o menu de contexto do navegador
    >
      <div
        className={cn("w-56 z-[1000] p-1 rounded-lg", popoverContentStyle)} // Usando o estilo do popover
        style={{ position: 'absolute', top: `${top}px`, left: `${left}px` }}
        onMouseDown={(e) => e.stopPropagation()} // Impede que o clique no menu o feche
      >
        <div className={ContextMenuItemClass} onClick={handleDuplicate}>
          <CopyPlus className="mr-2 h-4 w-4" />
          <span>Duplicar Nó</span>
          <span className={ContextMenuShortcutClass}>Ctrl+D</span>
        </div>
        <div className={ContextMenuItemClass} onClick={handleCopyId}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copiar ID do Nó</span>
        </div>
        
        <div className={ContextMenuSeparatorClass} />
        
        <div className={cn(ContextMenuItemClass, "opacity-50 cursor-not-allowed")} onClick={(e) => handleActionPlaceholder(e, 'Desativar Nó')}>
            <PowerOff className="mr-2 h-4 w-4" />
            Desativar Nó
        </div>
        <div className={cn(ContextMenuItemClass, "opacity-50 cursor-not-allowed")} onClick={(e) => handleActionPlaceholder(e, 'Adicionar Anotação')}>
            <StickyNote className="mr-2 h-4 w-4" />
            Adicionar Anotação
        </div>
        
        <div className={ContextMenuSeparatorClass} />
        
        <div className={cn(ContextMenuItemClass, "text-destructive focus:text-destructive focus:bg-destructive/10")} onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Deletar Nó</span>
          <span className={ContextMenuShortcutClass}>Del</span>
        </div>
      </div>
    </div>
  );
};

export default NodeContextMenu;
