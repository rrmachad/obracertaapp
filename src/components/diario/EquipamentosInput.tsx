import { useState } from 'react';
import { Plus, X, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export interface Equipamento {
  nome: string;
  quantidade: number;
}

interface EquipamentosInputProps {
  value: Equipamento[];
  onChange: (equipamentos: Equipamento[]) => void;
  disabled?: boolean;
}

const equipamentosComuns = [
  'Betoneira', 'Retroescavadeira', 'Escavadeira', 'Caminhão basculante',
  'Guincho', 'Grua', 'Compactador', 'Vibrador de concreto',
  'Serra circular', 'Furadeira', 'Martelete', 'Andaime',
  'Bomba de concreto', 'Gerador', 'Compressor', 'Placa vibratória',
  'Nível a laser', 'Topografia', 'Empilhadeira', 'Mini carregadeira',
];

export function EquipamentosInput({ value, onChange, disabled }: EquipamentosInputProps) {
  const { t } = useTranslation();
  const [equipSelecionado, setEquipSelecionado] = useState('');
  const [equipCustom, setEquipCustom] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleAdd = () => {
    const nome = showCustomInput ? equipCustom.trim() : equipSelecionado;
    const qtd = parseInt(quantidade) || 1;
    if (!nome) return;

    const existente = value.find((e) => e.nome.toLowerCase() === nome.toLowerCase());
    if (existente) {
      onChange(value.map((e) => e.nome.toLowerCase() === nome.toLowerCase() ? { ...e, quantidade: e.quantidade + qtd } : e));
    } else {
      onChange([...value, { nome, quantidade: qtd }]);
    }

    setEquipSelecionado('');
    setEquipCustom('');
    setQuantidade('1');
    setShowCustomInput(false);
  };

  const handleRemove = (nome: string) => onChange(value.filter((e) => e.nome !== nome));
  const handleAjustarQuantidade = (nome: string, delta: number) => {
    onChange(value.map((e) => e.nome === nome ? { ...e, quantidade: Math.max(1, e.quantidade + delta) } : e));
  };

  const totalEquipamentos = value.reduce((sum, e) => sum + e.quantidade, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          {t('diary.equipmentOnSite', 'Máquinas e Equipamentos')}
        </Label>
        {totalEquipamentos > 0 && (
          <Badge variant="secondary" className="gap-1">
            {totalEquipamentos} {totalEquipamentos === 1 ? t('diary.unit', 'un.') : t('diary.units', 'un.')}
          </Badge>
        )}
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((equip) => (
            <Badge key={equip.nome} variant="outline" className="py-1.5 px-3 gap-2 text-sm">
              <span className="font-semibold">{equip.quantidade}</span>
              <span>{equip.nome}</span>
              <div className="flex items-center gap-1 ml-1">
                <button type="button" onClick={() => handleAjustarQuantidade(equip.nome, -1)} className="hover:bg-muted rounded p-0.5" disabled={disabled || equip.quantidade <= 1}>
                  <span className="text-xs">−</span>
                </button>
                <button type="button" onClick={() => handleAjustarQuantidade(equip.nome, 1)} className="hover:bg-muted rounded p-0.5" disabled={disabled}>
                  <span className="text-xs">+</span>
                </button>
                <button type="button" onClick={() => handleRemove(equip.nome)} className="hover:bg-destructive/20 rounded p-0.5 ml-1" disabled={disabled}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          {showCustomInput ? (
            <div className="flex gap-2">
              <Input placeholder={t('diary.typeEquipment', 'Digite o equipamento...')} value={equipCustom} onChange={(e) => setEquipCustom(e.target.value)} className="h-10" disabled={disabled} />
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCustomInput(false)} className="shrink-0">{t('common.cancel')}</Button>
            </div>
          ) : (
            <Select value={equipSelecionado} onValueChange={(val) => { if (val === '__other__') { setShowCustomInput(true); setEquipSelecionado(''); } else { setEquipSelecionado(val); } }} disabled={disabled}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t('diary.selectEquipment', 'Selecione o equipamento...')} />
              </SelectTrigger>
              <SelectContent>
                {equipamentosComuns.map((equip) => (<SelectItem key={equip} value={equip}>{equip}</SelectItem>))}
                <SelectItem value="__other__" className="text-primary font-medium">{t('dialogs.otherRole', 'Outro...')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <Input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="w-16 h-10 text-center" placeholder="Qtd" disabled={disabled} />
        <Button type="button" size="icon" className="h-10 w-10 shrink-0" onClick={handleAdd} disabled={disabled || (!equipSelecionado && !equipCustom.trim())}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{t('diary.equipmentExample', 'Ex: 1 Betoneira + 2 Andaimes + 1 Retroescavadeira')}</p>
    </div>
  );
}
