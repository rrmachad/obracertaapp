import { useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Calendar, Users, Cloud, ChevronLeft, ChevronRight, Download, Sun, CloudSun, CloudRain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DiarioLog, ClimaTipo } from '@/types/database';

interface RelatorioSemanalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registros: DiarioLog[];
  obraNome: string;
}

const climaIcons: Record<ClimaTipo, React.ReactNode> = {
  ensolarado: <Sun className="w-4 h-4 text-primary" />,
  parcialmente_nublado: <CloudSun className="w-4 h-4 text-primary" />,
  nublado: <Cloud className="w-4 h-4 text-muted-foreground" />,
  chuvoso: <CloudRain className="w-4 h-4 text-primary" />,
};

const climaLabels: Record<ClimaTipo, string> = {
  ensolarado: 'Ensolarado',
  parcialmente_nublado: 'Parcialmente nublado',
  nublado: 'Nublado',
  chuvoso: 'Chuvoso',
};

function parseDateOnlyAsLocal(dateStr: string) {
  const safe = dateStr?.split('T')[0] ?? '';
  const [y, m, d] = safe.split('-').map((v) => Number(v));
  if (!y || !m || !d) return new Date(dateStr);
  return new Date(y, m - 1, d);
}

export function RelatorioSemanalDialog({ 
  open, 
  onOpenChange, 
  registros, 
  obraNome 
}: RelatorioSemanalDialogProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  // Calcular intervalo da semana
  const semanaAtual = useMemo(() => {
    const baseDate = subWeeks(new Date(), weekOffset);
    const inicio = startOfWeek(baseDate, { weekStartsOn: 1 }); // Segunda
    const fim = endOfWeek(baseDate, { weekStartsOn: 1 }); // Domingo
    return { inicio, fim };
  }, [weekOffset]);

  // Filtrar registros da semana
  const registrosSemana = useMemo(() => {
    return registros.filter(r => {
      const dataRegistro = parseDateOnlyAsLocal(r.data);
      return dataRegistro >= semanaAtual.inicio && dataRegistro <= semanaAtual.fim;
    });
  }, [registros, semanaAtual]);

  // Dias da semana com registro
  const diasSemana = useMemo(() => {
    const dias = eachDayOfInterval({ start: semanaAtual.inicio, end: semanaAtual.fim });
    return dias.map(dia => {
      const registro = registrosSemana.find(r => 
        isSameDay(parseDateOnlyAsLocal(r.data), dia)
      );
      return { dia, registro };
    });
  }, [semanaAtual, registrosSemana]);

  // Estatísticas da semana
  const estatisticas = useMemo(() => {
    const totalProfissionais: Record<string, number> = {};
    let totalDias = 0;
    const climaContagem: Record<ClimaTipo, number> = {
      ensolarado: 0,
      parcialmente_nublado: 0,
      nublado: 0,
      chuvoso: 0,
    };

    registrosSemana.forEach(registro => {
      totalDias++;
      climaContagem[registro.clima]++;
      
      registro.profissionais?.forEach(prof => {
        totalProfissionais[prof.funcao] = 
          (totalProfissionais[prof.funcao] || 0) + prof.quantidade;
      });
    });

    return {
      diasTrabalhados: totalDias,
      diasSemRegistro: 7 - totalDias,
      profissionais: totalProfissionais,
      clima: climaContagem,
      totalProfissionais: Object.values(totalProfissionais).reduce((a, b) => a + b, 0),
    };
  }, [registrosSemana]);

  // Gerar texto do relatório para copiar/exportar
  const gerarTextoRelatorio = () => {
    const linhas: string[] = [];
    
    linhas.push(`📋 RELATÓRIO SEMANAL - ${obraNome.toUpperCase()}`);
    linhas.push(`Período: ${format(semanaAtual.inicio, "dd/MM/yyyy")} a ${format(semanaAtual.fim, "dd/MM/yyyy")}`);
    linhas.push('');
    linhas.push('═'.repeat(40));
    linhas.push('');
    
    linhas.push(`📅 RESUMO:`);
    linhas.push(`• Dias trabalhados: ${estatisticas.diasTrabalhados} de 7`);
    linhas.push(`• Total de profissionais: ${estatisticas.totalProfissionais} presença(s)`);
    linhas.push('');
    
    if (Object.keys(estatisticas.profissionais).length > 0) {
      linhas.push(`👷 EFETIVO DA SEMANA:`);
      Object.entries(estatisticas.profissionais).forEach(([funcao, qtd]) => {
        linhas.push(`• ${funcao}: ${qtd} presença(s)`);
      });
      linhas.push('');
    }
    
    linhas.push(`🌤️ CLIMA:`);
    Object.entries(estatisticas.clima)
      .filter(([, count]) => count > 0)
      .forEach(([clima, count]) => {
        linhas.push(`• ${climaLabels[clima as ClimaTipo]}: ${count} dia(s)`);
      });
    linhas.push('');
    
    linhas.push('═'.repeat(40));
    linhas.push('');
    linhas.push('📝 ATIVIDADES DIÁRIAS:');
    linhas.push('');
    
    diasSemana.forEach(({ dia, registro }) => {
      const diaFormatado = format(dia, "EEEE, dd/MM", { locale: ptBR });
      if (registro) {
        linhas.push(`📌 ${diaFormatado.toUpperCase()}`);
        linhas.push(registro.atividades_realizadas);
        if (registro.observacoes) {
          linhas.push(`Obs: ${registro.observacoes}`);
        }
        linhas.push('');
      } else {
        linhas.push(`⬜ ${diaFormatado} - Sem registro`);
        linhas.push('');
      }
    });
    
    return linhas.join('\n');
  };

  const copiarRelatorio = () => {
    const texto = gerarTextoRelatorio();
    navigator.clipboard.writeText(texto);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-6 h-6 text-primary" />
            Relatório Semanal
          </DialogTitle>
          <DialogDescription>
            Resumo consolidado das atividades da semana
          </DialogDescription>
        </DialogHeader>

        {/* Navegação de semana */}
        <div className="flex items-center justify-between py-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset(w => w + 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="text-center">
            <p className="font-semibold">
              {format(semanaAtual.inicio, "dd/MM")} - {format(semanaAtual.fim, "dd/MM/yyyy")}
            </p>
            <p className="text-sm text-muted-foreground">
              {weekOffset === 0 ? 'Esta semana' : 
               weekOffset === 1 ? 'Semana passada' : 
               `${weekOffset} semanas atrás`}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset(w => w - 1)}
            disabled={weekOffset === 0}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">
                {estatisticas.diasTrabalhados}
              </div>
              <p className="text-sm text-muted-foreground">Dias trabalhados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">
                {estatisticas.totalProfissionais}
              </div>
              <p className="text-sm text-muted-foreground">Presenças</p>
            </CardContent>
          </Card>
        </div>

        {/* Profissionais da semana */}
        {Object.keys(estatisticas.profissionais).length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Efetivo da Semana
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {Object.entries(estatisticas.profissionais).map(([funcao, qtd]) => (
                  <Badge key={funcao} variant="secondary">
                    {qtd}× {funcao}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clima da semana */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              Clima da Semana
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {Object.entries(estatisticas.clima)
                .filter(([, count]) => count > 0)
                .map(([clima, count]) => (
                  <Badge key={clima} variant="outline" className="gap-1">
                    {climaIcons[clima as ClimaTipo]}
                    {count} dia(s)
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Dias da semana */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Dias da Semana
          </h4>
          <div className="grid grid-cols-7 gap-1">
            {diasSemana.map(({ dia, registro }) => (
              <div 
                key={dia.toISOString()}
                className={`text-center p-2 rounded-lg text-sm ${
                  registro 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                <div className="font-medium">
                  {format(dia, "EEE", { locale: ptBR })}
                </div>
                <div className="text-lg font-bold">
                  {format(dia, "dd")}
                </div>
                {registro && (
                  <div className="mt-1">
                    {climaIcons[registro.clima]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Botão exportar */}
        <Button onClick={copiarRelatorio} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Copiar Relatório
        </Button>
      </DialogContent>
    </Dialog>
  );
}
