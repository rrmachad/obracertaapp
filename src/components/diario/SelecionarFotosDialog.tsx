import { useState, useEffect, useCallback } from 'react';
import { Check, Image as ImageIcon, GripVertical, Pencil, Loader2, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FotoComLegenda } from '@/types/database';
import { useTranslation } from 'react-i18next';

interface SelecionarFotosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fotos: FotoComLegenda[];
  onConfirm: (fotosSelecionadas: FotoComLegenda[]) => void;
  title?: string;
  isLoading?: boolean;
}

interface FotoComSelecao extends FotoComLegenda {
  selecionada: boolean;
  legendaTemp: string;
  originalIndex: number;
}

export function SelecionarFotosDialog({ open, onOpenChange, fotos, onConfirm, title, isLoading = false }: SelecionarFotosDialogProps) {
  const { t } = useTranslation();
  const displayTitle = title || t('dialogs.selectPhotos');
  const [fotosComSelecao, setFotosComSelecao] = useState<FotoComSelecao[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setFotosComSelecao(fotos.map((foto, index) => ({ ...foto, selecionada: true, legendaTemp: foto.legenda || '', originalIndex: index })));
    }
  }, [open, fotos]);

  const toggleFoto = (index: number) => setFotosComSelecao((prev) => prev.map((foto, i) => i === index ? { ...foto, selecionada: !foto.selecionada } : foto));
  const toggleTodas = () => { const all = fotosComSelecao.every((f) => f.selecionada); setFotosComSelecao((prev) => prev.map((foto) => ({ ...foto, selecionada: !all }))); };
  const atualizarLegenda = (index: number, legenda: string) => setFotosComSelecao((prev) => prev.map((foto, i) => i === index ? { ...foto, legendaTemp: legenda } : foto));

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => { setDraggedIndex(index); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', index.toString()); }, []);
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (draggedIndex !== null && draggedIndex !== index) setDragOverIndex(index); }, [draggedIndex]);
  const handleDragLeave = useCallback(() => setDragOverIndex(null), []);
  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) { setDraggedIndex(null); setDragOverIndex(null); return; }
    setFotosComSelecao((prev) => { const n = [...prev]; const [d] = n.splice(draggedIndex, 1); n.splice(dropIndex, 0, d); return n; });
    setDraggedIndex(null); setDragOverIndex(null);
  }, [draggedIndex]);
  const handleDragEnd = useCallback(() => { setDraggedIndex(null); setDragOverIndex(null); }, []);

  const handleConfirm = () => { onConfirm(fotosComSelecao.filter((f) => f.selecionada).map((f) => ({ url: f.url, legenda: f.legendaTemp }))); onOpenChange(false); };
  const quantidadeSelecionada = fotosComSelecao.filter((f) => f.selecionada).length;
  const hasFotos = fotosComSelecao.length > 0;

  return (
    <Dialog open={open} onOpenChange={(value) => !isLoading && onOpenChange(value)}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary" />{displayTitle}</DialogTitle>
          <DialogDescription>{hasFotos ? t('dialogs.dragToReorder') : t('dialogs.noPhotosText')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasFotos ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="selecionar-todas" checked={fotosComSelecao.length > 0 && fotosComSelecao.every((f) => f.selecionada)} onCheckedChange={toggleTodas} disabled={isLoading} />
                  <Label htmlFor="selecionar-todas" className="text-sm cursor-pointer">{t('dialogs.selectAll')}</Label>
                </div>
                <span className="text-sm text-muted-foreground">{t('dialogs.selectedOf', { selected: quantidadeSelecionada, total: fotosComSelecao.length })}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md text-xs text-muted-foreground">
                <GripVertical className="w-4 h-4" /><span>{t('dialogs.dragHint')}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">{t('dialogs.pdfTextOnly')}</p>
            </div>
          )}

          {hasFotos && (
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-3">
                {fotosComSelecao.map((foto, index) => (
                  <div key={`${foto.url}-${index}`} draggable={!isLoading} onDragStart={(e) => handleDragStart(e, index)} onDragOver={(e) => handleDragOver(e, index)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, index)} onDragEnd={handleDragEnd}
                    className={`flex gap-3 p-3 rounded-lg border transition-all ${draggedIndex === index ? 'opacity-50 border-dashed border-primary' : dragOverIndex === index ? 'border-primary border-2 bg-primary/10' : foto.selecionada ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 opacity-60'}`}>
                    <div className="flex items-center cursor-grab active:cursor-grabbing"><GripVertical className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /></div>
                    <div className="flex items-start gap-2">
                      <Checkbox checked={foto.selecionada} onCheckedChange={() => toggleFoto(index)} className="mt-1" disabled={isLoading} />
                      <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border flex-shrink-0">
                        <img src={foto.url} alt={`${t('diary.photo')} ${index + 1}`} className="w-full h-full object-cover" draggable={false} />
                        {foto.selecionada && <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-primary-foreground" /></div>}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">#{index + 1}</div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={`legenda-${index}`} className="text-xs text-muted-foreground flex items-center gap-1"><Pencil className="w-3 h-3" />{t('dialogs.caption')}</Label>
                      <Input id={`legenda-${index}`} placeholder={t('dialogs.captionPlaceholder')} value={foto.legendaTemp} onChange={(e) => atualizarLegenda(index, e.target.value)} disabled={!foto.selecionada || isLoading} className="h-8 text-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('dialogs.generatingPdf')}</>) : hasFotos ? (<><ImageIcon className="w-4 h-4 mr-2" />{quantidadeSelecionada > 0 ? t('dialogs.exportPhotos', { count: quantidadeSelecionada }) : t('dialogs.exportWithoutPhotos')}</>) : (<><FileText className="w-4 h-4 mr-2" />{t('dialogs.exportPdf')}</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
