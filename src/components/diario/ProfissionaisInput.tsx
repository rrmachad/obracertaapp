import { useState } from 'react';
import { Plus, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface Profissional {
  funcao: string;
  quantidade: number;
}

interface ProfissionaisInputProps {
  value: Profissional[];
  onChange: (profissionais: Profissional[]) => void;
  disabled?: boolean;
}

const funcoesComuns = [
  'Pedreiro',
  'Ajudante',
  'Servente',
  'Mestre de obras',
  'Encarregado',
  'Eletricista',
  'Encanador',
  'Pintor',
  'Ladrilheiro',
  'Azulejista',
  'Carpinteiro',
  'Armador',
  'Gesseiro',
  'Serralheiro',
  'Marmorista',
  'Vidraceiro',
  'Impermeabilizador',
  'Técnico de segurança',
  'Engenheiro',
  'Arquiteto',
];

export function ProfissionaisInput({ value, onChange, disabled }: ProfissionaisInputProps) {
  const [funcaoSelecionada, setFuncaoSelecionada] = useState('');
  const [funcaoCustom, setFuncaoCustom] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleAdd = () => {
    const funcao = showCustomInput ? funcaoCustom.trim() : funcaoSelecionada;
    const qtd = parseInt(quantidade) || 1;

    if (!funcao) return;

    // Verifica se já existe essa função
    const existente = value.find((p) => p.funcao.toLowerCase() === funcao.toLowerCase());
    
    if (existente) {
      // Atualiza a quantidade
      onChange(
        value.map((p) =>
          p.funcao.toLowerCase() === funcao.toLowerCase()
            ? { ...p, quantidade: p.quantidade + qtd }
            : p
        )
      );
    } else {
      // Adiciona novo
      onChange([...value, { funcao, quantidade: qtd }]);
    }

    // Limpa os campos
    setFuncaoSelecionada('');
    setFuncaoCustom('');
    setQuantidade('1');
    setShowCustomInput(false);
  };

  const handleRemove = (funcao: string) => {
    onChange(value.filter((p) => p.funcao !== funcao));
  };

  const handleAjustarQuantidade = (funcao: string, delta: number) => {
    onChange(
      value.map((p) =>
        p.funcao === funcao
          ? { ...p, quantidade: Math.max(1, p.quantidade + delta) }
          : p
      )
    );
  };

  const totalProfissionais = value.reduce((sum, p) => sum + p.quantidade, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium flex items-center gap-2">
          <Users className="w-4 h-4" />
          Profissionais na Obra
        </Label>
        {totalProfissionais > 0 && (
          <Badge variant="secondary" className="gap-1">
            {totalProfissionais} {totalProfissionais === 1 ? 'pessoa' : 'pessoas'}
          </Badge>
        )}
      </div>

      {/* Lista de profissionais adicionados */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((prof) => (
            <Badge
              key={prof.funcao}
              variant="outline"
              className="py-1.5 px-3 gap-2 text-sm"
            >
              <span className="font-semibold">{prof.quantidade}</span>
              <span>{prof.funcao}</span>
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={() => handleAjustarQuantidade(prof.funcao, -1)}
                  className="hover:bg-muted rounded p-0.5"
                  disabled={disabled || prof.quantidade <= 1}
                >
                  <span className="text-xs">−</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAjustarQuantidade(prof.funcao, 1)}
                  className="hover:bg-muted rounded p-0.5"
                  disabled={disabled}
                >
                  <span className="text-xs">+</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(prof.funcao)}
                  className="hover:bg-destructive/20 rounded p-0.5 ml-1"
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </Badge>
          ))}
        </div>
      )}

      {/* Adicionar novo profissional */}
      <div className="flex gap-2">
        <div className="flex-1">
          {showCustomInput ? (
            <div className="flex gap-2">
              <Input
                placeholder="Digite a função..."
                value={funcaoCustom}
                onChange={(e) => setFuncaoCustom(e.target.value)}
                className="h-10"
                disabled={disabled}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomInput(false)}
                className="shrink-0"
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Select
              value={funcaoSelecionada}
              onValueChange={(val) => {
                if (val === '__other__') {
                  setShowCustomInput(true);
                  setFuncaoSelecionada('');
                } else {
                  setFuncaoSelecionada(val);
                }
              }}
              disabled={disabled}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Selecione a função..." />
              </SelectTrigger>
              <SelectContent>
                {funcoesComuns.map((funcao) => (
                  <SelectItem key={funcao} value={funcao}>
                    {funcao}
                  </SelectItem>
                ))}
                <SelectItem value="__other__" className="text-primary font-medium">
                  + Outra função...
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <Input
          type="number"
          min="1"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className="w-16 h-10 text-center"
          placeholder="Qtd"
          disabled={disabled}
        />
        <Button
          type="button"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={handleAdd}
          disabled={disabled || (!funcaoSelecionada && !funcaoCustom.trim())}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Ex: 1 Pedreiro + 2 Ajudantes + 1 Eletricista
      </p>
    </div>
  );
}
