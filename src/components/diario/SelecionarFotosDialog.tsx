import { useState, useEffect } from 'react';
import { Check, Image as ImageIcon } from 'lucide-react';
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
}

export function SelecionarFotosDialog({
  open,
  onOpenChange,
  fotos,
  onConfirm,
  title = 'Selecionar Fotos para PDF',
}: SelecionarFotosDialogProps) {
  const [fotosComSelecao, setFotosComSelecao] = useState<FotoComSelecao[]>([]);

  useEffect(() => {
    if (open) {
      setFotosComSelecao(
        fotos.map((foto) => ({
          ...foto,
          selecionada: true,
          legendaTemp: foto.legenda || '',
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
            Selecione as fotos e adicione legendas opcionais para incluir no PDF
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

          {/* Lista de fotos */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {fotosComSelecao.map((foto, index) => (
                <div
                  key={index}
                  className={`flex gap-3 p-3 rounded-lg border transition-colors ${
                    foto.selecionada
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/30 opacity-60'
                  }`}
                >
                  {/* Checkbox e imagem */}
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={foto.selecionada}
                      onCheckedChange={() => toggleFoto(index)}
                      className="mt-1"
                    />
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border border-border flex-shrink-0">
                      <img
                        src={foto.url}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {foto.selecionada && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Campo de legenda */}
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`legenda-${index}`} className="text-xs text-muted-foreground">
                      Legenda (opcional)
                    </Label>
                    <Input
                      id={`legenda-${index}`}
                      placeholder="Ex: Vista frontal da obra..."
                      value={foto.legendaTemp}
                      onChange={(e) => atualizarLegenda(index, e.target.value)}
                      disabled={!foto.selecionada}
                      className="h-9 text-sm"
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
