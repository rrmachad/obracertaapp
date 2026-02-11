import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import type { DailyActivity } from '@/hooks/useAdminStats';

interface ActivityChartProps {
  data: DailyActivity[];
  isLoading: boolean;
}

export function ActivityChart({ data, isLoading }: ActivityChartProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {t('admin.weeklyActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const totalSemana = data.reduce((acc, d) => acc + d.count, 0);
  const mediaDiaria = data.length > 0 ? (totalSemana / data.length).toFixed(1) : '0';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              {t('admin.weeklyActivity')}
            </CardTitle>
            <CardDescription>{t('admin.diaryRecordsLast7')}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{totalSemana}</p>
            <p className="text-xs text-muted-foreground">{t('admin.totalAverage', { avg: mediaDiaria })}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis allowDecimals={false} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-2">
                        <p className="text-sm font-medium">{payload[0].payload.date}</p>
                        <p className="text-xs text-muted-foreground">
                          {payload[0].value} {t('admin.records')}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
