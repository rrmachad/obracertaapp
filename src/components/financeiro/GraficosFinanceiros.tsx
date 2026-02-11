import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Medicao, CronogramaItem } from '@/types/database';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { Fase } from '@/types/database';
import { useCurrency } from '@/hooks/useCurrency';

interface FaseComparativa {
  nome: string;
  contratado: number;
  concluido: number;
  pago: number;
}

interface GraficosFinanceirosProps {
  medicoes: Medicao[];
  fasesComparativas?: FaseComparativa[];
}

export function GraficosFinanceiros({ medicoes, fasesComparativas }: GraficosFinanceirosProps) {
  const { t } = useTranslation();
  const { formatCurrency: formatCurrencyFull } = useCurrency();

  const chartData = useMemo(() => {
    return [...medicoes]
      .sort((a, b) => new Date(a.data_medicao).getTime() - new Date(b.data_medicao).getTime())
      .map((m, i) => ({
        nome: `${t('financial.billingLabel')} ${i + 1}`,
        data: new Date(m.data_medicao).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }),
        bruto: Number(m.valor_bruto_medido),
        retido: Number(m.valor_retencao_tecnica),
        liquido: Number(m.valor_liquido_a_pagar),
        percentual: Number(m.percentual_atual),
      }));
  }, [medicoes, t]);

  const cumulativeData = useMemo(() => {
    let acumBruto = 0;
    let acumPago = 0;
    return chartData.map(d => {
      acumBruto += d.bruto;
      acumPago += d.liquido;
      return { ...d, acumBruto, acumPago };
    });
  }, [chartData]);

  const formatCurrencyShort = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return formatCurrencyFull(v);
  };

  const hasFaseData = fasesComparativas && fasesComparativas.length > 0;

  return (
    <div className="space-y-4">
      {hasFaseData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              {t('financial.comparativeByPhase')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ResponsiveContainer width="100%" height={Math.max(200, fasesComparativas!.length * 50)}>
              <BarChart
                data={fasesComparativas}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatCurrencyShort} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 10 }} width={90} />
                <Tooltip
                  formatter={(value: number) => formatCurrencyFull(value)}
                  labelStyle={{ fontSize: 12, fontWeight: 600 }}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="contratado" name={t('financial.contracted')} fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="concluido" name={t('financial.completed')} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="pago" name={t('financial.paid')} fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {medicoes.length >= 2 && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {t('financial.evolutionByBilling')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCurrencyShort} />
                  <Tooltip
                    formatter={(value: number) => formatCurrencyFull(value)}
                    labelStyle={{ fontSize: 12 }}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="bruto" name={t('financial.grossLabel')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="liquido" name={t('financial.netLabel')} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {t('financial.cumulative')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={cumulativeData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCurrencyShort} />
                  <Tooltip
                    formatter={(value: number) => formatCurrencyFull(value)}
                    labelStyle={{ fontSize: 12 }}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Line type="monotone" dataKey="acumBruto" name={t('financial.totalMeasured')} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="acumPago" name={t('financial.totalPaidChart')} stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
