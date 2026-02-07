import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, getDaysInMonth, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiarioLog, ClimaTipo, Profissional } from '@/types/database';
import { TrendingUp, Users, Cloud, BarChart3 } from 'lucide-react';

interface GraficosComparativosProps {
  registros: DiarioLog[];
  obraNome: string;
}

function parseDateOnlyAsLocal(dateStr: string) {
  const safe = dateStr?.split('T')[0] ?? '';
  const [y, m, d] = safe.split('-').map((v) => Number(v));
  if (!y || !m || !d) return new Date(dateStr);
  return new Date(y, m - 1, d);
}

const COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  muted: 'hsl(var(--muted))',
  accent: 'hsl(var(--accent))',
  success: '#22c55e',
  warning: '#f59e0b',
  info: '#3b82f6',
};

const climaColors: Record<ClimaTipo, string> = {
  ensolarado: '#fbbf24',
  parcialmente_nublado: '#60a5fa',
  nublado: '#9ca3af',
  chuvoso: '#3b82f6',
};

const climaLabels: Record<ClimaTipo, string> = {
  ensolarado: 'Ensolarado',
  parcialmente_nublado: 'Parc. Nublado',
  nublado: 'Nublado',
  chuvoso: 'Chuvoso',
};

export function GraficosComparativos({ registros, obraNome }: GraficosComparativosProps) {
  // Calculate data for the last 6 months
  const dadosMensais = useMemo(() => {
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const mesBase = subMonths(new Date(), i);
      const inicio = startOfMonth(mesBase);
      const fim = endOfMonth(mesBase);
      
      const registrosMes = registros.filter(r => {
        const data = parseDateOnlyAsLocal(r.data);
        return data >= inicio && data <= fim;
      });

      const totalProfissionais = registrosMes.reduce((sum, r) => {
        return sum + (r.profissionais?.reduce((s, p) => s + p.quantidade, 0) || 0);
      }, 0);

      meses.push({
        mes: format(mesBase, 'MMM', { locale: ptBR }),
        mesCompleto: format(mesBase, "MMM 'de' yyyy", { locale: ptBR }),
        diasTrabalhados: registrosMes.length,
        diasNoMes: getDaysInMonth(mesBase),
        totalProfissionais,
        produtividade: registrosMes.length > 0 
          ? Math.round((registrosMes.length / getDaysInMonth(mesBase)) * 100) 
          : 0,
      });
    }
    return meses;
  }, [registros]);

  // Calculate data for the last 4 weeks
  const dadosSemanais = useMemo(() => {
    const semanas = [];
    for (let i = 3; i >= 0; i--) {
      const semanaBase = subWeeks(new Date(), i);
      const inicio = startOfWeek(semanaBase, { weekStartsOn: 1 });
      const fim = endOfWeek(semanaBase, { weekStartsOn: 1 });
      
      const registrosSemana = registros.filter(r => {
        const data = parseDateOnlyAsLocal(r.data);
        return data >= inicio && data <= fim;
      });

      const totalProfissionais = registrosSemana.reduce((sum, r) => {
        return sum + (r.profissionais?.reduce((s, p) => s + p.quantidade, 0) || 0);
      }, 0);

      semanas.push({
        semana: `Sem ${4 - i}`,
        periodo: `${format(inicio, 'dd/MM')} - ${format(fim, 'dd/MM')}`,
        diasTrabalhados: registrosSemana.length,
        totalProfissionais,
      });
    }
    return semanas;
  }, [registros]);

  // Climate distribution (last 3 months)
  const dadosClima = useMemo(() => {
    const inicio = startOfMonth(subMonths(new Date(), 2));
    const registrosRecentes = registros.filter(r => {
      const data = parseDateOnlyAsLocal(r.data);
      return data >= inicio;
    });

    const contagem: Record<ClimaTipo, number> = {
      ensolarado: 0,
      parcialmente_nublado: 0,
      nublado: 0,
      chuvoso: 0,
    };

    registrosRecentes.forEach(r => {
      contagem[r.clima]++;
    });

    return Object.entries(contagem)
      .filter(([, count]) => count > 0)
      .map(([clima, value]) => ({
        name: climaLabels[clima as ClimaTipo],
        value,
        color: climaColors[clima as ClimaTipo],
      }));
  }, [registros]);

  // Professional distribution (all time)
  const dadosProfissionais = useMemo(() => {
    const totais: Record<string, number> = {};
    
    registros.forEach(r => {
      r.profissionais?.forEach(p => {
        totais[p.funcao] = (totais[p.funcao] || 0) + p.quantidade;
      });
    });

    return Object.entries(totais)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([funcao, total]) => ({
        funcao,
        total,
      }));
  }, [registros]);

  // Productivity trend
  const tendenciaProdutividade = useMemo(() => {
    if (dadosMensais.length < 2) return null;
    const ultimoMes = dadosMensais[dadosMensais.length - 1];
    const penultimoMes = dadosMensais[dadosMensais.length - 2];
    
    if (penultimoMes.produtividade === 0) return null;
    
    const variacao = ultimoMes.produtividade - penultimoMes.produtividade;
    return {
      variacao,
      positivo: variacao >= 0,
    };
  }, [dadosMensais]);

  if (registros.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum registro para gerar gráficos.</p>
          <p className="text-sm mt-1">Adicione registros ao diário para ver estatísticas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Produtividade</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">
                {dadosMensais[dadosMensais.length - 1]?.produtividade || 0}%
              </span>
              {tendenciaProdutividade && (
                <span className={`text-xs ml-2 ${tendenciaProdutividade.positivo ? 'text-success' : 'text-destructive'}`}>
                  {tendenciaProdutividade.positivo ? '+' : ''}{tendenciaProdutividade.variacao}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Este mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Presenças</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">
                {dadosMensais[dadosMensais.length - 1]?.totalProfissionais || 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="produtividade" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="produtividade" className="text-xs">Produtividade</TabsTrigger>
          <TabsTrigger value="clima" className="text-xs">Clima</TabsTrigger>
          <TabsTrigger value="equipe" className="text-xs">Equipe</TabsTrigger>
        </TabsList>

        {/* Productivity Chart */}
        <TabsContent value="produtividade" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Dias Trabalhados por Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosMensais}>
                    <defs>
                      <linearGradient id="colorDias" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fontSize: 10 }} 
                      className="fill-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      className="fill-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value, name) => [
                        `${value} dias`,
                        'Dias trabalhados'
                      ]}
                      labelFormatter={(label, payload) => payload[0]?.payload?.mesCompleto}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="diasTrabalhados" 
                      stroke={COLORS.primary} 
                      fillOpacity={1} 
                      fill="url(#colorDias)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Weekly comparison */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium mb-2">Últimas 4 semanas</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosSemanais}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="semana" 
                        tick={{ fontSize: 10 }} 
                        className="fill-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        className="fill-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value) => [`${value} dias`, 'Trabalhados']}
                        labelFormatter={(label, payload) => payload[0]?.payload?.periodo}
                      />
                      <Bar 
                        dataKey="diasTrabalhados" 
                        fill={COLORS.primary}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weather Chart */}
        <TabsContent value="clima" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                Distribuição de Clima (últimos 3 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosClima.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosClima}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {dadosClima.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value) => [`${value} dia(s)`, '']}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px' }}
                        formatter={(value) => value}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Sem dados de clima disponíveis
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Chart */}
        <TabsContent value="equipe" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Presenças por Função (histórico)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosProfissionais.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={dadosProfissionais} 
                      layout="vertical"
                      margin={{ left: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        type="number" 
                        tick={{ fontSize: 10 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis 
                        type="category" 
                        dataKey="funcao" 
                        tick={{ fontSize: 10 }}
                        className="fill-muted-foreground"
                        width={65}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value) => [`${value} presenças`, '']}
                      />
                      <Bar 
                        dataKey="total" 
                        fill={COLORS.info}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nenhum profissional registrado
                </p>
              )}
              
              {/* Monthly workforce trend */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium mb-2">Evolução Mensal de Presenças</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dadosMensais}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="mes" 
                        tick={{ fontSize: 10 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        className="fill-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value) => [`${value} presenças`, '']}
                        labelFormatter={(label, payload) => payload[0]?.payload?.mesCompleto}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalProfissionais" 
                        stroke={COLORS.success}
                        strokeWidth={2}
                        dot={{ fill: COLORS.success, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
