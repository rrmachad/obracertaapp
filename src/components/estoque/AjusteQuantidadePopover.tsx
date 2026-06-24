import { useState } from 'react';
import { Plus, Minus, Hash, MessageSquare, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AjusteQuantidadePopoverProps {
  onAjuste: (delta: number, observacao?: string, precoUnitario?: number) => Promise<void>;
  tipo: 'entrada' | 'saida';
  disabled?: boolean;
  unidade: string;
  qtdAtual: number;
}

const QUICK_VALUES = [1, 5, 10, 25, 50, 100];

export function AjusteQuantidadePopover({
  onAjuste,
  tipo,
  disabled,
  unidade,
  qtdAtual,
}: AjusteQuantidadePopoverProps) {
  const [open, setOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [observacao, setObservacao] = useState('');
  const [precoUnitario, setPrecoUnitario] = useState('');
  const [loading, setLoading] = useState(false);

  const isEntrada = tipo === 'entrada';
  const Icon = isEntrada ? Plus : Minus;
  const multiplier = isEntrada ? 1 : -1;

  const parsedPreco = isEntrada && precoUnitario ? parseFloat(precoUnitario) : undefined;

  const handleClose = () => {
    setOpen(false);
    setCustomValue('');
    setObservacao('');
    setPrecoUnitario('');
  };

  const handleQuickAjuste = async (value: number) => {
    if (tipo === 'saida' && value > qtdAtual) return;
    setLoading(true);
    try {
      await onAjuste(value * multiplier, observacao.trim() || undefined, parsedPreco && !isNaN(parsedPreco) ? parsedPreco : undefined);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAjuste = async () => {
    const value = parseFloat(customValue);
    if (isNaN(value) || value <= 0) return;
    if (tipo === 'saida' && value > qtdAtual) return;
    setLoading(true);
    try {
      await onAjuste(value * multiplier, observacao.trim() || undefined, parsedPreco && !isNaN(parsedPreco) ? parsedPreco : undefined);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={(o) => { if (!o) handleClose(); else setOpen(true); }}>
      <PopoverTrigger asChild>
        <Button
          variant={isEntrada ? 'default' : 'outline'}
          size="icon"
          className={`w-12 h-12 rounded-lg transition-all ${isEntrada ? 'bg-primary hover:bg-primary/90' : 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive'}`}
          disabled={disabled || loading}
        >
          <Icon className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-3"
        align="center"
        side="top"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Icon className={`w-4 h-4 ${isEntrada ? 'text-primary' : 'text-destructive'}`} />
            <span>{isEntrada ? 'Adicionar ao estoque' : 'Retirar do estoque'}</span>
          </div>

          {/* Botões rápidos */}
          <div className="grid grid-cols-3 gap-2">
            {QUICK_VALUES.map((value) => {
              const isDisabled = tipo === 'saida' && value > qtdAtual;
              return (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  className={`h-10 font-semibold ${isEntrada ? 'hover:bg-primary/10 hover:border-primary' : 'hover:bg-destructive/10 hover:border-destructive'}`}
                  onClick={() => handleQuickAjuste(value)}
                  disabled={loading || isDisabled}
                >
                  {isEntrada ? '+' : '-'}{value}
                </Button>
              );
            })}
          </div>

          {/* Separador */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-popover px-2 text-muted-foreground">ou quantidade personalizada</span>
            </div>
          </div>

          {/* Input personalizado */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Qtd"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="pl-9 pr-12"
                min={0}
                max={tipo === 'saida' ? qtdAtual : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomAjuste();
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {unidade}
              </span>
            </div>
            <Button
              variant={isEntrada ? 'default' : 'destructive'}
              size="icon"
              onClick={handleCustomAjuste}
              disabled={loading || !customValue || parseFloat(customValue) <= 0}
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Preço unitário — só para entrada */}
          {isEntrada && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Preço unitário (opcional) — usado no cálculo de custo</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={precoUnitario}
                  onChange={(e) => setPrecoUnitario(e.target.value)}
                  className="pl-9 text-sm"
                  min={0}
                  step="0.01"
                />
              </div>
            </div>
          )}

          {/* Campo de observação */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Observação (opcional)</span>
            </div>
            <Textarea
              placeholder="Ex: compra NF 1234, consumo fundação..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="text-sm resize-none min-h-0 h-16"
              maxLength={200}
            />
          </div>

          {tipo === 'saida' && (
            <p className="text-xs text-muted-foreground text-center">
              Disponível: {qtdAtual} {unidade}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
