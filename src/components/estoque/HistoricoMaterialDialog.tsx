import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownCircle, ArrowUpCircle, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Material } from '@/types/database';
import { translateMaterialName } from '@/lib/translateMaterial';
import { isUnidadeInteira } from './NovoMaterialDialog';

interface Movimentacao {
  id: string;
  material_id: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  observacao?: string | null;
  data: string;
  created_at: string;
}

function formatQty(qtd: number, unidade: string): string {
  return isUnidadeInteira(unidade) ? Math.round(qtd).toString() : qtd.toFixed(2);
}

function useHistoricoMaterial(materialId: string | null) {
  return useQuery({
    queryKey: ['historico-material', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimentacao_estoque')
        .select('*')
        .eq('material_id', materialId!)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Movimentacao[];
    },
    enabled: !!materialId,
  });
}

interface Props {
  material: Material | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HistoricoMaterialDialog({ material, open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: movimentacoes, isLoading } = useHistoricoMaterial(material?.id ?? null);

  const dateLocale = lang.startsWith('pt') ? ptBR : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            {material ? translateMaterialName(material.nome, lang) : ''}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{t('inventory.movementHistory')}</p>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : !movimentacoes?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="w-10 h-10 mb-3 opacity-40" />
              <p className="font-medium text-sm">{t('inventory.noMovements')}</p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {movimentacoes.map((mov) => {
                const isEntrada = mov.tipo === 'entrada';
                const dataFormatada = format(
                  parseISO(mov.created_at),
                  "dd MMM yyyy, HH:mm",
                  { locale: dateLocale }
                );
                return (
                  <div
                    key={mov.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    {isEntrada ? (
                      <ArrowUpCircle className="w-8 h-8 text-primary shrink-0" />
                    ) : (
                      <ArrowDownCircle className="w-8 h-8 text-destructive shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isEntrada ? 'default' : 'destructive'}
                          className="text-xs shrink-0"
                        >
                          {isEntrada ? t('inventory.entry') : t('inventory.exit')}
                        </Badge>
                        <span className="font-semibold">
                          {isEntrada ? '+' : '-'}{formatQty(mov.quantidade, material?.unidade ?? 'un')} {material?.unidade}
                        </span>
                      </div>
                      {mov.observacao && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{mov.observacao}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">{dataFormatada}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
