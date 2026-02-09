import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMedicoes, useAdiantamentos } from '@/hooks/useMedicoes';
import { NovaMedicaoDialog } from './NovaMedicaoDialog';
import { NovoAdiantamentoDialog } from './NovoAdiantamentoDialog';
import { Calculator, Plus, Wallet, ShieldCheck, ArrowDownCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FinanceiroTabProps {
  obraId: string;
  retencaoPercentual: number;
}

export function FinanceiroTab({ obraId, retencaoPercentual }: FinanceiroTabProps) {
  const { medicoes, isLoading: loadingMedicoes, deleteMedicao } = useMedicoes(obraId);
  const { adiantamentos, pendentes, isLoading: loadingAdiantamentos, deleteAdiantamento } = useAdiantamentos(obraId);
  const { toast } = useToast();

  const [medicaoDialogOpen, setMedicaoDialogOpen] = useState(false);
  const [adiantamentoDialogOpen, setAdiantamentoDialogOpen] = useState(false);

  const formatCurrency = (v: number) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totalMedido = medicoes.reduce((s, m) => s + Number(m.valor_bruto_medido), 0);
  const totalPago = medicoes.reduce((s, m) => s + Number(m.valor_liquido_a_pagar), 0);
  const saldoRetencao = medicoes.reduce((s, m) => s + Number(m.valor_retencao_tecnica), 0);
  const totalAdiantamentosPendentes = pendentes.reduce((s, a) => s + Number(a.valor), 0);

  const handleDeleteMedicao = async (id: string) => {
    if (!confirm('Excluir esta medição?')) return;
    try {
      await deleteMedicao.mutateAsync(id);
      toast({ title: 'Medição excluída' });
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    }
  };

  const handleDeleteAdiantamento = async (id: string) => {
    if (!confirm('Excluir este adiantamento?')) return;
    try {
      await deleteAdiantamento.mutateAsync(id);
      toast({ title: 'Adiantamento excluído' });
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    }
  };

  if (loadingMedicoes || loadingAdiantamentos) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={() => setMedicaoDialogOpen(true)} className="flex-1">
          <Calculator className="w-4 h-4 mr-2" />
          Nova Medição
        </Button>
        <Button variant="outline" onClick={() => setAdiantamentoDialogOpen(true)} className="flex-1">
          <Plus className="w-4 h-4 mr-2" />
          Novo Adiantamento
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Pago</span>
            </div>
            <p className="text-lg font-bold text-success">{formatCurrency(totalPago)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-warning" />
              <span className="text-xs text-muted-foreground">Saldo Retenção</span>
            </div>
            <p className="text-lg font-bold text-warning">{formatCurrency(saldoRetencao)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Medido</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(totalMedido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Vales Pendentes</span>
            </div>
            <p className="text-lg font-bold text-destructive">{formatCurrency(totalAdiantamentosPendentes)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Medicoes table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Histórico de Medições</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {medicoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma medição registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Medido</TableHead>
                    <TableHead className="text-right">Retido</TableHead>
                    <TableHead className="text-right">Vales</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicoes.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm">
                        {new Date(m.data_medicao).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(Number(m.valor_bruto_medido))}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-warning border-warning text-xs">
                          {formatCurrency(Number(m.valor_retencao_tecnica))}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(m.valor_adiantamentos_descontados) > 0 ? (
                          <Badge variant="outline" className="text-destructive border-destructive text-xs">
                            {formatCurrency(Number(m.valor_adiantamentos_descontados))}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-success text-success-foreground text-xs">
                          {formatCurrency(Number(m.valor_liquido_a_pagar))}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteMedicao(m.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adiantamentos list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Adiantamentos (Vales)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {adiantamentos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum adiantamento registrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adiantamentos.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm">{new Date(a.data).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-sm">{a.descricao || '—'}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(Number(a.valor))}</TableCell>
                      <TableCell>
                        {a.abatido_em_medicao_id ? (
                          <Badge className="bg-success/15 text-success border-success/30 text-xs">Abatido</Badge>
                        ) : (
                          <Badge variant="outline" className="text-destructive border-destructive text-xs">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!a.abatido_em_medicao_id && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteAdiantamento(a.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <NovaMedicaoDialog
        open={medicaoDialogOpen}
        onOpenChange={setMedicaoDialogOpen}
        obraId={obraId}
        retencaoPercentual={retencaoPercentual}
      />
      <NovoAdiantamentoDialog
        open={adiantamentoDialogOpen}
        onOpenChange={setAdiantamentoDialogOpen}
        obraId={obraId}
      />
    </div>
  );
}
