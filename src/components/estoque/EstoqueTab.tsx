import { useState } from 'react';
import { Package, Plus, Minus, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMateriais } from '@/hooks/useMateriais';
import { useToast } from '@/hooks/use-toast';
import { NovoMaterialDialog } from './NovoMaterialDialog';
import { Material } from '@/types/database';

interface EstoqueTabProps {
  obraId: string;
}

export function EstoqueTab({ obraId }: EstoqueTabProps) {
  const { materiais, isLoading, ajustarQuantidade, deleteMaterial } = useMateriais(obraId);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAjuste = async (id: string, delta: number) => {
    try {
      await ajustarQuantidade.mutateAsync({ id, delta });
      toast({
        title: delta > 0 ? 'Quantidade aumentada' : 'Quantidade diminuída',
        description: `${Math.abs(delta)} unidade(s)`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao ajustar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (material: Material) => {
    if (!confirm(`Remover "${material.nome}" do estoque?`)) return;
    
    try {
      await deleteMaterial.mutateAsync(material.id);
      toast({
        title: 'Material removido',
        description: material.nome,
      });
    } catch (error) {
      toast({
        title: 'Erro ao remover',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Botão adicionar */}
      <Button
        onClick={() => setDialogOpen(true)}
        className="w-full h-14 text-base font-semibold"
      >
        <Plus className="w-5 h-5 mr-2" />
        Adicionar Material
      </Button>

      {/* Lista de materiais */}
      {materiais.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum material cadastrado</p>
            <p className="text-sm">Adicione materiais para controlar seu estoque</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {materiais.map((material) => {
            const isLow = material.qtd_atual < material.qtd_minima;
            
            return (
              <Card 
                key={material.id} 
                className={`border-2 ${isLow ? 'border-destructive/50 bg-destructive/5' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold truncate">{material.nome}</h4>
                        {isLow && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Baixo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Mínimo: {material.qtd_minima} {material.unidade}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Botão diminuir */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-12 h-12 rounded-lg"
                        onClick={() => handleAjuste(material.id, -1)}
                        disabled={material.qtd_atual <= 0}
                      >
                        <Minus className="w-5 h-5" />
                      </Button>

                      {/* Quantidade atual */}
                      <div className="w-20 text-center">
                        <div className={`text-2xl font-bold ${isLow ? 'text-destructive' : ''}`}>
                          {material.qtd_atual}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {material.unidade}
                        </div>
                      </div>

                      {/* Botão aumentar */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-12 h-12 rounded-lg"
                        onClick={() => handleAjuste(material.id, 1)}
                      >
                        <Plus className="w-5 h-5" />
                      </Button>

                      {/* Botão excluir */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(material)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NovoMaterialDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        obraId={obraId}
      />
    </div>
  );
}
