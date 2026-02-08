import { useState, useEffect } from 'react';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Save, Loader2, Sun, Cloud, CloudRain, CloudSun } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DiarioLog, ClimaTipo } from '@/types/database';
import { ProfissionaisInput, Profissional } from './ProfissionaisInput';
import { cn } from '@/lib/utils';

interface EditarDiarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registro: DiarioLog;
  onSave: (updates: {
    data?: string;
    clima?: ClimaTipo;
    atividades_realizadas?: string;
    observacoes?: string;
    profissionais?: Profissional[];
  }, motivo?: string) => Promise<void>;
  requiresMotivo?: boolean;
}

const climaOptions: { value: ClimaTipo; label: string; icon: React.ReactNode }[] = [
  { value: 'ensolarado', label: 'Ensolarado', icon: <Sun className="w-5 h-5" /> },
  { value: 'parcialmente_nublado', label: 'Parc. Nublado', icon: <CloudSun className="w-5 h-5" /> },
  { value: 'nublado', label: 'Nublado', icon: <Cloud className="w-5 h-5" /> },
  { value: 'chuvoso', label: 'Chuvoso', icon: <CloudRain className="w-5 h-5" /> },
];

export function EditarDiarioDialog({
  open,
  onOpenChange,
  registro,
  onSave,
  requiresMotivo = true,
}: EditarDiarioDialogProps) {
  const [data, setData] = useState<Date>();
  const [clima, setClima] = useState<ClimaTipo>('ensolarado');
  const [atividades, setAtividades] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (registro) {
      // Parse date string to Date object
      const [y, m, d] = registro.data.split('-').map(Number);
      setData(new Date(y, m - 1, d));
      setClima(registro.clima);
      setAtividades(registro.atividades_realizadas);
      setObservacoes(registro.observacoes || '');
      // Parse profissionais from JSON
      const profs = Array.isArray(registro.profissionais) 
        ? (registro.profissionais as Profissional[])
        : [];
      setProfissionais(profs);
      setMotivo('');
    }
  }, [registro]);

  const handleSave = async () => {
    if (!atividades.trim()) return;
    if (requiresMotivo && !motivo.trim()) return;

    setSaving(true);
    try {
      const updates: {
        data?: string;
        clima?: ClimaTipo;
        atividades_realizadas?: string;
        observacoes?: string;
        profissionais?: Profissional[];
      } = {};

      const newDataStr = data ? format(data, 'yyyy-MM-dd') : registro.data;
      if (newDataStr !== registro.data) updates.data = newDataStr;
      if (clima !== registro.clima) updates.clima = clima;
      if (atividades !== registro.atividades_realizadas) updates.atividades_realizadas = atividades;
      if (observacoes !== (registro.observacoes || '')) updates.observacoes = observacoes || undefined;
      
      // Check if profissionais changed
      const originalProfs = Array.isArray(registro.profissionais) 
        ? (registro.profissionais as Profissional[])
        : [];
      const profsChanged = JSON.stringify(profissionais) !== JSON.stringify(originalProfs);
      if (profsChanged) updates.profissionais = profissionais;

      await onSave(updates, motivo.trim());
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Registro do Diário</DialogTitle>
          <DialogDescription>
            Faça as alterações necessárias. Todas as modificações serão registradas no log de auditoria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Data */}
          <div className="space-y-2">
            <Label>Data do Registro</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !data && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data ? format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data}
                  onSelect={setData}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Clima */}
          <div className="space-y-2">
            <Label>Clima</Label>
            <div className="grid grid-cols-2 gap-2">
              {climaOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={clima === option.value ? 'default' : 'outline'}
                  className={`h-12 flex items-center gap-2 justify-start ${
                    clima === option.value ? '' : 'text-muted-foreground'
                  }`}
                  onClick={() => setClima(option.value)}
                >
                  {option.icon}
                  <span className="text-sm">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Atividades */}
          <div className="space-y-2">
            <Label htmlFor="edit-atividades">Atividades Realizadas</Label>
            <Textarea
              id="edit-atividades"
              value={atividades}
              onChange={(e) => setAtividades(e.target.value)}
              className="min-h-24"
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="edit-observacoes">Observações</Label>
            <Textarea
              id="edit-observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="min-h-20"
            />
          </div>

          {/* Profissionais */}
          <ProfissionaisInput
            value={profissionais}
            onChange={setProfissionais}
          />

          {/* Motivo da alteração */}
          {requiresMotivo && (
            <div className="space-y-2">
              <Label htmlFor="motivo" className="text-primary font-medium">
                Motivo da Alteração *
              </Label>
              <Textarea
                id="motivo"
                placeholder="Descreva o motivo desta alteração..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="min-h-16 border-primary/50"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !atividades.trim() || (requiresMotivo && !motivo.trim())}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
