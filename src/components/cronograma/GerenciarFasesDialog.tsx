import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Check, X } from 'lucide-react';
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
  const { createFase, updateFase, deleteFase, reorderFases, ensureObraFases } = useFasesMutations(obraId);

  const [newPhaseName, setNewPhaseName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingFase, setDeletingFase] = useState<Fase | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const handleEnsureObraFases = async () => {
    if (!fases || fases.length === 0) return;
    // Check if fases are global (no obra_id)
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

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!fases) return;
    await handleEnsureObraFases();
    const newOrder = [...fases];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newOrder.length) return;
    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    try {
      await reorderFases.mutateAsync(newOrder.map(f => f.id));
      toast({ title: t('schedule.phaseReordered') });
    } catch {
      toast({ title: t('schedule.errorReorderingPhase'), variant: 'destructive' });
    }
  };

  const getItemCount = (faseId: string) => itens.filter(i => i.fase_id === faseId).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('schedule.managePhases')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {fases?.map((fase, index) => (
              <div key={fase.id} className="flex items-center gap-2 p-3 rounded-lg border bg-card">
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
                    <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                    <span className="flex-1 font-medium text-sm">{t(`phases.${fase.nome}`, fase.nome)}</span>
                    <Button
                      size="icon" variant="ghost" className="h-8 w-8"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0 || isInitializing}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-8 w-8"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === (fases?.length ?? 0) - 1 || isInitializing}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-8 w-8"
                      onClick={() => { setEditingId(fase.id); setEditingName(fase.nome); }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                      onClick={() => setDeletingFase(fase)}
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
