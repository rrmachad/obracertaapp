import { useState, useEffect, useCallback } from 'react';
import { Check, Image as ImageIcon, GripVertical, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FotoComLegenda } from '@/types/database';

interface SelecionarFotosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fotos: FotoComLegenda[];
  onConfirm: (fotosSelecionadas: FotoComLegenda[]) => void;
  title?: string;
}

interface FotoComSelecao extends FotoComLegenda {
  selecionada: boolean;
  legendaTemp: string;
  originalIndex: number;
}

export function SelecionarFotosDialog({
  open,
  onOpenChange,
  fotos,
  onConfirm,
  title = 'Selecionar Fotos para PDF',
}: SelecionarFotosDialogProps) {
  const [fotosComSelecao, setFotosComSelecao] = useState<FotoComSelecao[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setFotosComSelecao(
        fotos.map((foto, index) => ({
          ...foto,
          selecionada: true,
          legendaTemp: foto.legenda || '',
          originalIndex: index,
        }))
      );
    }
  }, [open, fotos]);

  const toggleFoto = (index: number) => {
    setFotosComSelecao((prev) =>
      prev.map((foto, i) =>
        i === index ? { ...foto, selecionada: !foto.selecionada } : foto
      )
    );
  };

  const toggleTodas = () => {
    const todasSelecionadas = fotosComSelecao.every((f) => f.selecionada);
    setFotosComSelecao((prev) =>
      prev.map((foto) => ({ ...foto, selecionada: !todasSelecionadas }))
    );
  };

  const atualizarLegenda = (index: number, legenda: string) => {
    setFotosComSelecao((prev) =>
      prev.map((foto, i) =>
        i === index ? { ...foto, legendaTemp: legenda } : foto
      )
    );
  };

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setFotosComSelecao((prev) => {
      const newFotos = [...prev];
      const [draggedItem] = newFotos.splice(draggedIndex, 1);
      newFotos.splice(dropIndex, 0, draggedItem);
      return newFotos;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleConfirm = () => {
    const selecionadas = fotosComSelecao
      .filter((foto) => foto.selecionada)
      .map((foto) => ({
        url: foto.url,
        legenda: foto.legendaTemp,
      }));
    onConfirm(selecionadas);
    onOpenChange(false);
  };

  const quantidadeSelecionada = fotosComSelecao.filter((f) => f.selecionada).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Arraste para reordenar, edite legendas e selecione as fotos para o PDF
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botão selecionar/deselecionar todas */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="selecionar-todas"
                checked={fotosComSelecao.length > 0 && fotosComSelecao.every((f) => f.selecionada)}
                onCheckedChange={toggleTodas}
              />
              <Label htmlFor="selecionar-todas" className="text-sm cursor-pointer">
                Selecionar todas
              </Label>
            </div>
            <span className="text-sm text-muted-foreground">
              {quantidadeSelecionada} de {fotosComSelecao.length} selecionada(s)
            </span>
          </div>

          {/* Dica de reordenação */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md text-xs text-muted-foreground">
            <GripVertical className="w-4 h-4" />
            <span>Arraste as fotos pelo ícone para reordenar</span>
          </div>

          {/* Lista de fotos */}
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-3">
              {fotosComSelecao.map((foto, index) => (
                <div
                  key={`${foto.url}-${index}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex gap-3 p-3 rounded-lg border transition-all ${
                    draggedIndex === index
                      ? 'opacity-50 border-dashed border-primary'
                      : dragOverIndex === index
                      ? 'border-primary border-2 bg-primary/10'
                      : foto.selecionada
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/30 opacity-60'
                  }`}
                >
                  {/* Drag handle */}
                  <div className="flex items-center cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                  </div>

                  {/* Checkbox e imagem */}
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={foto.selecionada}
                      onCheckedChange={() => toggleFoto(index)}
                      className="mt-1"
                    />
                    <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border flex-shrink-0">
                      <img
                        src={foto.url}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                      {foto.selecionada && (
                        <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                        #{index + 1}
                      </div>
                    </div>
                  </div>

                  {/* Campo de legenda */}
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`legenda-${index}`} className="text-xs text-muted-foreground flex items-center gap-1">
                      <Pencil className="w-3 h-3" />
                      Legenda
                    </Label>
                    <Input
                      id={`legenda-${index}`}
                      placeholder="Ex: Vista frontal da obra..."
                      value={foto.legendaTemp}
                      onChange={(e) => atualizarLegenda(index, e.target.value)}
                      disabled={!foto.selecionada}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={quantidadeSelecionada === 0}>
            <ImageIcon className="w-4 h-4 mr-2" />
            Exportar {quantidadeSelecionada} foto(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
