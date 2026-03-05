import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Check, X, Copy, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFases, useFasesMutations } from '@/hooks/useCronograma';
import { Fase, CronogramaItem } from '@/types/database';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface GerenciarFasesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obraId: string;
  itens: CronogramaItem[];
}

export function GerenciarFasesDialog({ open, onOpenChange, obraId, itens }: GerenciarFasesDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: fases } = useFases(obraId);
  const { createFase, updateFase, deleteFase, reorderFases, duplicateFase, ensureObraFases } = useFasesMutations(obraId);

  const [newPhaseName, setNewPhaseName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingFase, setDeletingFase] = useState<Fase | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Unified drag state (works for both mouse and touch)
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Touch drag state
  const touchStartY = useRef<number>(0);
  const isTouchDragging = useRef(false);

  const handleEnsureObraFases = async () => {
    if (!fases || fases.length === 0) return;
    if (fases[0] && !fases[0].obra_id) {
      setIsInitializing(true);
      try {
        await ensureObraFases();
      } finally {
        setIsInitializing(false);
      }
    }
  };

  const handleAddPhase = async () => {
    if (!newPhaseName.trim()) return;
    await handleEnsureObraFases();
    try {
      await createFase.mutateAsync({ nome: newPhaseName.trim() });
      toast({ title: t('schedule.phaseAdded') });
      setNewPhaseName('');
    } catch {
      toast({ title: t('schedule.errorAddingPhase'), variant: 'destructive' });
    }
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;
    await handleEnsureObraFases();
    try {
      await updateFase.mutateAsync({ id, nome: editingName.trim() });
      toast({ title: t('schedule.phaseRenamed') });
      setEditingId(null);
    } catch {
      toast({ title: t('schedule.errorRenamingPhase'), variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingFase) return;
    try {
      await deleteFase.mutateAsync(deletingFase.id);
      toast({ title: t('schedule.phaseDeleted') });
      setDeletingFase(null);
    } catch {
      toast({ title: t('schedule.errorDeletingPhase'), variant: 'destructive' });
    }
  };

  const handleDuplicate = async (faseId: string) => {
    await handleEnsureObraFases();
    try {
      await duplicateFase.mutateAsync(faseId);
      toast({ title: t('schedule.phaseDuplicated') });
    } catch {
      toast({ title: t('schedule.errorDuplicatingPhase'), variant: 'destructive' });
    }
  };

  // Commit reorder
  const commitReorder = useCallback(async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || !fases) return;
    await handleEnsureObraFases();
    const newOrder = [...fases];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    try {
      await reorderFases.mutateAsync(newOrder.map(f => f.id));
      toast({ title: t('schedule.phaseReordered') });
    } catch {
      toast({ title: t('schedule.errorReorderingPhase'), variant: 'destructive' });
    }
  }, [fases, reorderFases, toast, t]);

  // --- Desktop drag handlers ---
  const handleDragStart = (index: number, e: React.DragEvent<HTMLDivElement>) => {
    setDragIndex(index);
    dragNodeRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.4';
      }
    }, 0);
  };

  const handleDragOver = (index: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = async () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      await commitReorder(dragIndex, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  };

  // --- Touch drag handlers (for mobile) ---
  const getIndexFromTouchY = useCallback((clientY: number): number | null => {
    for (const [idx, el] of itemRefs.current.entries()) {
      const rect = el.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        return idx;
      }
    }
    return null;
  }, []);

  const handleTouchStart = useCallback((index: number, e: React.TouchEvent<HTMLDivElement>) => {
    // Only start drag from the grip handle area
    const target = e.target as HTMLElement;
    const gripHandle = target.closest('[data-grip-handle]');
    if (!gripHandle) return;

    isTouchDragging.current = true;
    touchStartY.current = e.touches[0].clientY;
    setDragIndex(index);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isTouchDragging.current || dragIndex === null) return;
    e.preventDefault(); // Prevent scrolling while dragging

    const clientY = e.touches[0].clientY;
    const overIdx = getIndexFromTouchY(clientY);
    if (overIdx !== null && overIdx !== dragIndex) {
      setDragOverIndex(overIdx);
    }
  }, [dragIndex, getIndexFromTouchY]);

  const handleTouchEnd = useCallback(async () => {
    if (!isTouchDragging.current) return;
    isTouchDragging.current = false;

    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      await commitReorder(dragIndex, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, dragOverIndex, commitReorder]);

  const setItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(index, el);
    } else {
      itemRefs.current.delete(index);
    }
  }, []);

  const getItemCount = (faseId: string) => itens.filter(i => i.fase_id === faseId).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('schedule.managePhases')}</DialogTitle>
          </DialogHeader>

          <div ref={listRef} className="space-y-1 max-h-[60vh] overflow-y-auto">
            {fases?.map((fase, index) => (
              <div
                key={fase.id}
                ref={(el) => setItemRef(index, el)}
                draggable={editingId !== fase.id}
                onDragStart={(e) => handleDragStart(index, e)}
                onDragOver={(e) => handleDragOver(index, e)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => handleTouchStart(index, e)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`flex items-center gap-2 p-3 rounded-lg border bg-card transition-all select-none ${
                  dragOverIndex === index && dragIndex !== index
                    ? 'border-primary ring-2 ring-primary/20'
                    : ''
                } ${dragIndex === index ? 'opacity-40' : ''}`}
              >
                {editingId === fase.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 h-8"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(fase.id)}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRename(fase.id)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div
                      data-grip-handle
                      className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1 -m-1"
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <span className="text-sm text-muted-foreground w-5">{index + 1}.</span>
                    <span className="flex-1 font-medium text-sm truncate">{t(`phases.${fase.nome}`, fase.nome)}</span>
                    <Button
                      size="icon" variant="ghost" className="h-7 w-7 shrink-0"
                      onClick={() => handleDuplicate(fase.id)}
                      disabled={duplicateFase.isPending}
                      title={t('schedule.duplicatePhase')}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-7 w-7 shrink-0"
                      onClick={() => { setEditingId(fase.id); setEditingName(fase.nome); }}
                      title={t('schedule.renamePhase')}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive"
                      onClick={() => setDeletingFase(fase)}
                      title={t('schedule.deletePhase')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add new phase */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input
              value={newPhaseName}
              onChange={(e) => setNewPhaseName(e.target.value)}
              placeholder={t('schedule.newPhaseName')}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAddPhase()}
            />
            <Button
              size="sm"
              onClick={handleAddPhase}
              disabled={!newPhaseName.trim() || createFase.isPending}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t('schedule.addPhase')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingFase} onOpenChange={(o) => !o && setDeletingFase(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('schedule.deletePhase')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('schedule.deletePhaseConfirm')}
              {deletingFase && getItemCount(deletingFase.id) > 0 && (
                <span className="block mt-2 font-semibold text-destructive">
                  {t('schedule.phaseHasItems', { count: getItemCount(deletingFase.id) })}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
