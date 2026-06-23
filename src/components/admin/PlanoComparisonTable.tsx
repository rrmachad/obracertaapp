import { Check, X, Crown, Rocket, Star, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubscription, SubscriptionPlan } from '@/hooks/useSubscription';
import { useCurrency } from '@/hooks/useCurrency';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface PlanoComparisonTableProps {
  onSelectPlan?: (plan: SubscriptionPlan) => void;
  compact?: boolean;
}

interface FeatureRow {
  name: string;
  category: string;
  free: string | boolean;
  start: string | boolean;
  gold: string | boolean;
  premium: string | boolean;
}

const features: FeatureRow[] = [
  // Obras
  { category: 'Obras', name: 'Obras Ativas', free: '1', start: 'Ilimitadas', gold: 'Ilimitadas', premium: 'Ilimitadas' },
  { category: 'Obras', name: 'Gestão de Fases', free: true, start: true, gold: true, premium: true },
  { category: 'Obras', name: 'Cronograma Detalhado', free: true, start: true, gold: true, premium: true },

  // Diário de Obra
  { category: 'Diário de Obra', name: 'Registros Diários', free: '10/obra', start: 'Ilimitados', gold: 'Ilimitados', premium: 'Ilimitados' },
  { category: 'Diário de Obra', name: 'Upload de Fotos', free: true, start: true, gold: true, premium: true },
  { category: 'Diário de Obra', name: 'Gestão de Profissionais', free: true, start: true, gold: true, premium: true },

  // Estoque
  { category: 'Estoque', name: 'Materiais Cadastrados', free: '10/obra', start: 'Ilimitados', gold: 'Ilimitados', premium: 'Ilimitados' },
  { category: 'Estoque', name: 'Controle de Movimentação', free: 'Básico', start: 'Completo', gold: 'Completo', premium: 'Completo' },
  { category: 'Estoque', name: 'Alertas de Estoque Baixo', free: false, start: true, gold: true, premium: true },

  // Blindagem Financeira
  { category: 'Blindagem Financeira', name: 'Medições (Pague o executado)', free: false, start: false, gold: true, premium: true },
  { category: 'Blindagem Financeira', name: 'Desconto Automático de Vales', free: false, start: false, gold: true, premium: true },
  { category: 'Blindagem Financeira', name: 'Retenção Técnica (5%)', free: false, start: false, gold: true, premium: true },

  // Relatórios
  { category: 'Relatórios', name: 'Relatórios em PDF', free: false, start: true, gold: true, premium: true },
  { category: 'Relatórios', name: 'Relatório Semanal', free: false, start: true, gold: true, premium: true },
  { category: 'Relatórios', name: 'Relatório Mensal', free: false, start: true, gold: true, premium: true },

  // Equipe
  { category: 'Equipe', name: 'Usuários Inclusos', free: '1', start: '1', gold: '3', premium: 'Ilimitados' },
  { category: 'Equipe', name: 'Convites por PIN', free: false, start: false, gold: true, premium: true },

  // Construtora — features that come with gold
  { category: 'Construtora', name: 'Portal do Cliente', free: false, start: false, gold: true, premium: true },
  { category: 'Construtora', name: 'Dashboard de Lucratividade', free: false, start: false, gold: true, premium: true },
];

const planInfo: Record<SubscriptionPlan, { name: string; price: number; priceBRL: number; icon?: React.ReactNode }> = {
  free: { name: 'Iniciante', price: 0, priceBRL: 0 },
  start: { name: 'Autônomo', price: 19.90, priceBRL: 19.90, icon: <Rocket className="w-4 h-4" /> },
  gold: { name: 'Construtora', price: 37.90, priceBRL: 37.90, icon: <ShieldCheck className="w-4 h-4" /> },
  premium: { name: 'Business', price: 79.90, priceBRL: 99.90, icon: <Crown className="w-4 h-4" /> },
};

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-5 h-5 text-success mx-auto" />
    ) : (
      <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
}

export function PlanoComparisonTable({ onSelectPlan, compact = false }: PlanoComparisonTableProps) {
  const { plan: currentPlan } = useSubscription();
  const { formatCurrency } = useCurrency();
  const { i18n } = useTranslation();
  const isBRL = i18n.language === 'pt-BR';
  const planKeys: SubscriptionPlan[] = ['free', 'start', 'gold', 'premium'];

  const categories = [...new Set(features.map(f => f.category))];
  // Show only Autônomo and Construtora to new users; legacy plans kept in planKeys for data completeness
  const visiblePlanKeys: SubscriptionPlan[] = ['start', 'gold'];
  const displayPlanKeys = planKeys.filter(k => visiblePlanKeys.includes(k));

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="text-left p-3 bg-muted/50 font-medium text-sm min-w-[180px]">
              Funcionalidade
            </th>
            {displayPlanKeys.map((plan) => {
              const info = planInfo[plan];
              const isCurrent = plan === currentPlan;
              const isPopular = plan === 'gold';
              
              return (
                <th
                  key={plan}
                  className={cn(
                    'p-3 text-center min-w-[120px]',
                    isPopular && 'bg-primary/10',
                    isCurrent && 'bg-primary/5'
                  )}
                >
                  <div className="flex flex-col items-center gap-1">
                    {isPopular && (
                      <Badge className="bg-primary text-[10px] px-2 py-0.5 mb-1">
                        Gestão Total
                      </Badge>
                    )}
                    {isCurrent && !isPopular && (
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 mb-1">
                        Atual
                      </Badge>
                    )}
                    <div className="flex items-center gap-1.5 font-semibold">
                      {info.icon}
                      {info.name}
                    </div>
                    <div className="text-lg font-bold">
                      {info.price === 0 ? 'Grátis' : formatCurrency(isBRL ? info.priceBRL : info.price)}
                      {info.price > 0 && <span className="text-xs font-normal text-muted-foreground">/mês</span>}
                    </div>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {categories.map((category, catIdx) => {
            const categoryFeatures = features.filter(f => f.category === category);
            
            return (
              <>
                {!compact && (
                  <tr key={`cat-${catIdx}`}>
                    <td
                      colSpan={5}
                      className="p-2 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      {category}
                    </td>
                  </tr>
                )}
                {categoryFeatures.map((feature, idx) => (
                  <tr
                    key={`${category}-${idx}`}
                    className="border-b border-border/50 hover:bg-muted/30 transition-all duration-200"
                  >
                    <td className="p-3 text-sm">{feature.name}</td>
                    {displayPlanKeys.map((plan) => {
                      const isPopular = plan === 'gold';
                      const isCurrent = plan === currentPlan;

                      return (
                        <td
                          key={plan}
                          className={cn(
                            'p-3 text-center',
                            isPopular && 'bg-primary/5',
                            isCurrent && 'bg-primary/5'
                          )}
                        >
                          <FeatureValue value={feature[plan]} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            );
          })}
        </tbody>
        {onSelectPlan && (
          <tfoot>
            <tr>
              <td className="p-3"></td>
              {displayPlanKeys.map((plan) => {
                const isCurrent = plan === currentPlan;
                const isPopular = plan === 'gold';
                const isDowngrade = planKeys.indexOf(plan) < planKeys.indexOf(currentPlan);

                return (
                  <td key={plan} className={cn('p-3', isPopular && 'bg-primary/5')}>
                    <Button
                      variant={isCurrent ? 'outline' : isPopular ? 'default' : 'secondary'}
                      size="sm"
                      className="w-full"
                      disabled={isCurrent || isDowngrade}
                      onClick={() => onSelectPlan(plan)}
                    >
                      {isCurrent ? 'Atual' : isDowngrade ? 'Downgrade' : 'Escolher'}
                    </Button>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
