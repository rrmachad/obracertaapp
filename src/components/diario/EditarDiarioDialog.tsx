import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Save, Loader2, Sun, Cloud, CloudRain, CloudSun } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DiarioLog, ClimaTipo, Equipamento } from '@/types/database';
import { ProfissionaisInput, Profissional } from './ProfissionaisInput';
import { EquipamentosInput } from './EquipamentosInput';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

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
    equipamentos?: Equipamento[];
  }, motivo?: string) => Promise<void>;
  requiresMotivo?: boolean;
}

export function EditarDiarioDialog({ open, onOpenChange, registro, onSave, requiresMotivo = true }: EditarDiarioDialogProps) {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<Date>();
  const [clima, setClima] = useState<ClimaTipo>('ensolarado');
  const [atividades, setAtividades] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);

  const dateFnsLocale = i18n.language === 'en-US' ? enUS : i18n.language === 'es-ES' ? es : ptBR;

  const climaOptions: { value: ClimaTipo; label: string; icon: React.ReactNode }[] = [
    { value: 'ensolarado', label: t('diary.sunny'), icon: <Sun className="w-5 h-5" /> },
    { value: 'parcialmente_nublado', label: t('diary.partlyCloudy'), icon: <CloudSun className="w-5 h-5" /> },
    { value: 'nublado', label: t('diary.cloudy'), icon: <Cloud className="w-5 h-5" /> },
    { value: 'chuvoso', label: t('diary.rainy'), icon: <CloudRain className="w-5 h-5" /> },
  ];

  useEffect(() => {
    if (registro) {
      const [y, m, d] = registro.data.split('-').map(Number);
      setData(new Date(y, m - 1, d));
      setClima(registro.clima);
      setAtividades(registro.atividades_realizadas);
      setObservacoes(registro.observacoes || '');
      const profs = Array.isArray(registro.profissionais) ? (registro.profissionais as Profissional[]) : [];
      setProfissionais(profs);
      const equips = Array.isArray(registro.equipamentos) ? (registro.equipamentos as Equipamento[]) : [];
      setEquipamentos(equips);
      setMotivo('');
    }
  }, [registro]);

  const handleSave = async () => {
    if (!atividades.trim()) return;
    if (requiresMotivo && !motivo.trim()) return;

    setSaving(true);
    try {
      const updates: { data?: string; clima?: ClimaTipo; atividades_realizadas?: string; observacoes?: string; profissionais?: Profissional[]; equipamentos?: Equipamento[] } = {};
      const newDataStr = data ? format(data, 'yyyy-MM-dd') : registro.data;
      if (newDataStr !== registro.data) updates.data = newDataStr;
      if (clima !== registro.clima) updates.clima = clima;
      if (atividades !== registro.atividades_realizadas) updates.atividades_realizadas = atividades;
      if (observacoes !== (registro.observacoes || '')) updates.observacoes = observacoes || undefined;
      const originalProfs = Array.isArray(registro.profissionais) ? (registro.profissionais as Profissional[]) : [];
      if (JSON.stringify(profissionais) !== JSON.stringify(originalProfs)) updates.profissionais = profissionais;
      const originalEquips = Array.isArray(registro.equipamentos) ? (registro.equipamentos as Equipamento[]) : [];
      if (JSON.stringify(equipamentos) !== JSON.stringify(originalEquips)) updates.equipamentos = equipamentos;
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
          <DialogTitle>{t('dialogs.editDiary')}</DialogTitle>
          <DialogDescription>{t('dialogs.editDiaryDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('dialogs.recordDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !data && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data ? format(data, 'PPP', { locale: dateFnsLocale }) : t('dialogs.selectDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={data} onSelect={setData} disabled={(date) => date > new Date()} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>{t('diary.weather')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {climaOptions.map((option) => (
                <Button key={option.value} type="button" variant={clima === option.value ? 'default' : 'outline'}
                  className={`h-12 flex items-center gap-2 justify-start ${clima === option.value ? '' : 'text-muted-foreground'}`}
                  onClick={() => setClima(option.value)}>
                  {option.icon}
                  <span className="text-sm">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-atividades">{t('dialogs.activitiesPerformed')}</Label>
            <Textarea id="edit-atividades" value={atividades} onChange={(e) => setAtividades(e.target.value)} className="min-h-24" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-observacoes">{t('diary.observations')}</Label>
            <Textarea id="edit-observacoes" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="min-h-20" />
          </div>

          <ProfissionaisInput value={profissionais} onChange={setProfissionais} />

          <EquipamentosInput value={equipamentos} onChange={setEquipamentos} />

          {requiresMotivo && (
            <div className="space-y-2">
              <Label htmlFor="motivo" className="text-primary font-medium">{t('dialogs.changeReason')}</Label>
              <Textarea id="motivo" placeholder={t('dialogs.changeReasonPlaceholder')} value={motivo} onChange={(e) => setMotivo(e.target.value)} className="min-h-16 border-primary/50" />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !atividades.trim() || (requiresMotivo && !motivo.trim())}>
            {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.saving')}</>) : (<><Save className="w-4 h-4 mr-2" />{t('dialogs.saveChanges')}</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
