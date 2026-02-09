import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMedicoes, useAdiantamentos } from '@/hooks/useMedicoes';
import { useCronogramaItens, useFases } from '@/hooks/useCronograma';
import { NovaMedicaoDialog } from './NovaMedicaoDialog';
import { NovoAdiantamentoDialog } from './NovoAdiantamentoDialog';
import { EditarMedicaoDialog } from './EditarMedicaoDialog';
import { GraficosFinanceiros } from './GraficosFinanceiros';
import { Calculator, Plus, Wallet, ShieldCheck, ArrowDownCircle, Trash2, FileDown, Pencil, CheckCircle2, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Medicao } from '@/types/database';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import jsPDF from 'jspdf';

interface FinanceiroTabProps {
  obraId: string;
  retencaoPercentual: number;
  obraNome: string;
  isAdmin?: boolean;
}

export function FinanceiroTab({ obraId, retencaoPercentual, obraNome, isAdmin }: FinanceiroTabProps) {
  const { medicoes, isLoading: loadingMedicoes, deleteMedicao } = useMedicoes(obraId);
  const { adiantamentos, pendentes, isLoading: loadingAdiantamentos, deleteAdiantamento } = useAdiantamentos(obraId);
  const { itens, isLoading: loadingItens, updateItem } = useCronogramaItens(obraId);
  const { data: fases } = useFases();
  const { toast } = useToast();

  const [medicaoDialogOpen, setMedicaoDialogOpen] = useState(false);
  const [adiantamentoDialogOpen, setAdiantamentoDialogOpen] = useState(false);
  const [editMedicao, setEditMedicao] = useState<Medicao | null>(null);

  const formatCurrency = (v: number) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totalMedido = medicoes.reduce((s, m) => s + Number(m.valor_bruto_medido), 0);
  const totalPago = medicoes.reduce((s, m) => s + Number(m.valor_liquido_a_pagar), 0);
  const saldoRetencao = medicoes.reduce((s, m) => s + Number(m.valor_retencao_tecnica), 0);
  const totalAdiantamentosPendentes = pendentes.reduce((s, a) => s + Number(a.valor), 0);

  // Computed values from completed cronograma items
  const valorTotalContrato = itens.reduce((s, i) => s + (Number(i.valor_contrato_mao_de_obra) || 0), 0);
  const valorConcluido = itens
    .filter(i => i.status === 'concluido')
    .reduce((s, i) => s + (Number(i.valor_contrato_mao_de_obra) || 0), 0);
  const valorPendente = valorTotalContrato - valorConcluido;

  // Group completed values by phase
  const valoresPorFase = fases?.map(fase => {
    const itensFase = itens.filter(i => i.fase_id === fase.id);
    const total = itensFase.reduce((s, i) => s + (Number(i.valor_contrato_mao_de_obra) || 0), 0);
    const concluido = itensFase
      .filter(i => i.status === 'concluido')
      .reduce((s, i) => s + (Number(i.valor_contrato_mao_de_obra) || 0), 0);
    return { fase, total, concluido, pendente: total - concluido, itensFase };
  }).filter(f => f.total > 0) ?? [];

  // Contract overrun alerts (admin only)
  const alertasEstouro = isAdmin ? valoresPorFase
    .filter(f => f.total > 0 && totalPago > 0)
    .map(f => {
      // Check if payments for this phase exceed the phase contract
      const medicoesFase = medicoes.filter(m => m.fase_id === f.fase.id);
      const pagoFase = medicoesFase.reduce((s, m) => s + Number(m.valor_liquido_a_pagar), 0);
      if (pagoFase > f.total) {
        return { fase: f.fase.nome, total: f.total, pago: pagoFase, excesso: pagoFase - f.total };
      }
      return null;
    }).filter(Boolean) : [];

  // Global overrun
  const globalOverrun = isAdmin && valorTotalContrato > 0 && totalPago > valorTotalContrato
    ? { total: valorTotalContrato, pago: totalPago, excesso: totalPago - valorTotalContrato }
    : null;

  const handleUpdateItemValor = async (itemId: string, valor: number | null) => {
    try {
      await updateItem.mutateAsync({ id: itemId, valor_contrato_mao_de_obra: valor as any });
      toast({ title: 'Valor atualizado!' });
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

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

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('EXTRATO FINANCEIRO', pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.setFontSize(12);
    doc.text(obraNome.toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} | Retencao Tecnica: ${retencaoPercentual}%`, pageWidth / 2, y, { align: 'center' });
    doc.setTextColor(0);
    y += 12;

    // Contract summary
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('VALORES DO CONTRATO', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    [
      ['Valor Total do Contrato', formatCurrency(valorTotalContrato)],
      ['Valor Concluido (A Pagar)', formatCurrency(valorConcluido)],
      ['Valor Pendente', formatCurrency(valorPendente)],
    ].forEach(([label, value]) => {
      doc.text(`${label}:`, margin, y);
      doc.text(value, pageWidth - margin, y, { align: 'right' });
      y += 6;
    });
    y += 4;

    if (valoresPorFase.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('COMPARATIVO POR FASE', margin, y);
      y += 8;

      // Table header
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 4, maxWidth, 7, 'F');
      const fCols = [margin, margin + 45, margin + 80, margin + 115, margin + 145];
      doc.text('Fase', fCols[0], y);
      doc.text('Contratado', fCols[1], y);
      doc.text('Concluido', fCols[2], y);
      doc.text('Pago', fCols[3], y);
      doc.text('% Exec.', fCols[4], y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      valoresPorFase.forEach(f => {
        if (y > 265) { doc.addPage(); y = 20; }
        const medicoesFase = medicoes.filter(m => m.fase_id === f.fase.id);
        const pagoFase = medicoesFase.reduce((s, m) => s + Number(m.valor_liquido_a_pagar), 0);
        const pctExec = f.total > 0 ? Math.round((f.concluido / f.total) * 100) : 0;

        doc.text(f.fase.nome.substring(0, 20), fCols[0], y);
        doc.text(formatCurrency(f.total), fCols[1], y);
        doc.text(formatCurrency(f.concluido), fCols[2], y);
        doc.text(formatCurrency(pagoFase), fCols[3], y);

        // Mini progress bar
        const barX = fCols[4];
        const barW = 20;
        doc.setFillColor(230, 230, 230);
        doc.rect(barX, y - 3, barW, 4, 'F');
        if (pctExec > 0) {
          doc.setFillColor(34, 139, 34);
          doc.rect(barX, y - 3, (barW * pctExec) / 100, 4, 'F');
        }
        doc.text(`${pctExec}%`, barX + barW + 2, y);
        y += 6;
      });

      // Totals row
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y - 4, maxWidth, 7, 'F');
      const totalContrato = valoresPorFase.reduce((s, f) => s + f.total, 0);
      const totalConcluidoFases = valoresPorFase.reduce((s, f) => s + f.concluido, 0);
      const totalPagoFases = valoresPorFase.reduce((s, f) => {
        const mf = medicoes.filter(m => m.fase_id === f.fase.id);
        return s + mf.reduce((ss, m) => ss + Number(m.valor_liquido_a_pagar), 0);
      }, 0);
      doc.text('TOTAL', fCols[0], y);
      doc.text(formatCurrency(totalContrato), fCols[1], y);
      doc.text(formatCurrency(totalConcluidoFases), fCols[2], y);
      doc.text(formatCurrency(totalPagoFases), fCols[3], y);
      y += 10;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO DE PAGAMENTOS', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    [
      ['Total Medido (Bruto)', formatCurrency(totalMedido)],
      ['Total Pago (Liquido)', formatCurrency(totalPago)],
      ['Saldo de Retencao Tecnica', formatCurrency(saldoRetencao)],
      ['Adiantamentos Pendentes', formatCurrency(totalAdiantamentosPendentes)],
    ].forEach(([label, value]) => {
      doc.text(`${label}:`, margin, y);
      doc.text(value, pageWidth - margin, y, { align: 'right' });
      y += 6;
    });
    y += 6;

    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    if (medicoes.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('HISTORICO DE MEDICOES', margin, y);
      y += 8;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 4, maxWidth, 7, 'F');
      const cols = [margin, margin + 25, margin + 55, margin + 85, margin + 115, margin + 145];
      doc.text('Data', cols[0], y);
      doc.text('% Ant.', cols[1], y);
      doc.text('% Atual', cols[2], y);
      doc.text('Bruto', cols[3], y);
      doc.text('Retido', cols[4], y);
      doc.text('Liquido', cols[5], y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      medicoes.forEach(m => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(new Date(m.data_medicao).toLocaleDateString('pt-BR'), cols[0], y);
        doc.text(`${Number(m.percentual_anterior)}%`, cols[1], y);
        doc.text(`${Number(m.percentual_atual)}%`, cols[2], y);
        doc.text(formatCurrency(Number(m.valor_bruto_medido)), cols[3], y);
        doc.text(formatCurrency(Number(m.valor_retencao_tecnica)), cols[4], y);
        doc.text(formatCurrency(Number(m.valor_liquido_a_pagar)), cols[5], y);
        y += 5;
      });
      y += 8;
    }

    if (adiantamentos.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('ADIANTAMENTOS (VALES)', margin, y);
      y += 8;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 4, maxWidth, 7, 'F');
      doc.text('Data', margin, y);
      doc.text('Descricao', margin + 25, y);
      doc.text('Valor', margin + 100, y);
      doc.text('Status', margin + 135, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      adiantamentos.forEach(a => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(new Date(a.data).toLocaleDateString('pt-BR'), margin, y);
        doc.text((a.descricao || '—').substring(0, 40), margin + 25, y);
        doc.text(formatCurrency(Number(a.valor)), margin + 100, y);
        doc.text(a.abatido_em_medicao_id ? 'Abatido' : 'Pendente', margin + 135, y);
        y += 5;
      });
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(`Pagina ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    }

    doc.save(`extrato-financeiro-${obraNome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    toast({ title: 'PDF exportado com sucesso!' });
  };

  if (loadingMedicoes || loadingAdiantamentos || loadingItens) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contract overrun alerts (admin only) */}
      {isAdmin && globalOverrun && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Estouro de Contrato Global</AlertTitle>
          <AlertDescription>
            O total pago ({formatCurrency(globalOverrun.pago)}) excedeu o valor do contrato ({formatCurrency(globalOverrun.total)}) em {formatCurrency(globalOverrun.excesso)}.
          </AlertDescription>
        </Alert>
      )}
      {isAdmin && alertasEstouro.map((alerta, i) => alerta && (
        <Alert key={i} variant="destructive" className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Estouro: {alerta.fase}</AlertTitle>
          <AlertDescription className="text-warning">
            Pago {formatCurrency(alerta.pago)} de {formatCurrency(alerta.total)} — excesso de {formatCurrency(alerta.excesso)}.
          </AlertDescription>
        </Alert>
      ))}

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
        <Button variant="outline" size="icon" onClick={handleExportPDF} title="Exportar PDF">
          <FileDown className="w-4 h-4" />
        </Button>
      </div>

      {/* Contract value cards with editable items */}
      {valorTotalContrato > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Valores do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-bold">{formatCurrency(valorTotalContrato)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Concluído</p>
                <p className="text-sm font-bold text-success">{formatCurrency(valorConcluido)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendente</p>
                <p className="text-sm font-bold text-warning">{formatCurrency(valorPendente)}</p>
              </div>
            </div>

            {/* Phase breakdown with editable values */}
            {valoresPorFase.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-primary/10">
                {valoresPorFase.map(f => {
                  const pct = f.total > 0 ? Math.round((f.concluido / f.total) * 100) : 0;
                  const concluidoItens = f.itensFase.filter(i => i.status === 'concluido');
                  return (
                    <div key={f.fase.id} className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="flex-1 truncate font-medium">{f.fase.nome}</span>
                        <Badge variant={pct === 100 ? 'default' : 'outline'} className="text-[10px] px-1.5">
                          {pct}%
                        </Badge>
                        <span className="text-muted-foreground w-24 text-right">
                          {formatCurrency(f.concluido)} / {formatCurrency(f.total)}
                        </span>
                      </div>
                      {/* Editable completed items */}
                      {concluidoItens.length > 0 && (
                        <div className="pl-3 space-y-0.5">
                          {concluidoItens.map(item => (
                            <div key={item.id} className="flex items-center gap-2 text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                              <span className="flex-1 truncate text-muted-foreground">{item.descricao}</span>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="text-primary hover:underline text-[11px] font-medium whitespace-nowrap">
                                    {Number(item.valor_contrato_mao_de_obra) > 0
                                      ? formatCurrency(Number(item.valor_contrato_mao_de_obra))
                                      : 'Definir valor'}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56" align="end">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Valor — {item.descricao}</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="R$ 0,00"
                                      defaultValue={item.valor_contrato_mao_de_obra ?? ''}
                                      onBlur={(e) => {
                                        const val = parseFloat(e.target.value) || null;
                                        handleUpdateItemValor(item.id, val);
                                      }}
                                    />
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Valor Concluído</span>
            </div>
            <p className="text-lg font-bold text-success">{formatCurrency(valorConcluido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Pago</span>
            </div>
            <p className="text-lg font-bold text-primary">{formatCurrency(totalPago)}</p>
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
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditMedicao(m)}>
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
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

      {/* Charts */}
      <GraficosFinanceiros
        medicoes={medicoes}
        fasesComparativas={valoresPorFase.map(f => {
          const medicoesFase = medicoes.filter(m => m.fase_id === f.fase.id);
          const pagoFase = medicoesFase.reduce((s, m) => s + Number(m.valor_liquido_a_pagar), 0);
          return {
            nome: f.fase.nome,
            contratado: f.total,
            concluido: f.concluido,
            pago: pagoFase,
          };
        })}
      />

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
      {editMedicao && (
        <EditarMedicaoDialog
          open={!!editMedicao}
          onOpenChange={(o) => { if (!o) setEditMedicao(null); }}
          medicao={editMedicao}
          obraId={obraId}
          retencaoPercentual={retencaoPercentual}
        />
      )}
    </div>
  );
}
