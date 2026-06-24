import { useState } from 'react';
import { Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UpgradePlanoDialog } from '@/components/admin/UpgradePlanoDialog';
import { usePlanLimits } from '@/hooks/usePlanLimits';

interface TrialBannerProps {
  skip?: boolean;
}

export function TrialBanner({ skip = false }: TrialBannerProps) {
  const { isOnTrial, trialDaysLeft } = usePlanLimits();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (skip || !isOnTrial || dismissed) return null;

  const days = trialDaysLeft ?? 0;
  const isUrgent = days <= 1;
  const isWarning = !isUrgent && days <= 3;

  const bannerClass = isUrgent
    ? 'bg-destructive/10 border-destructive/30 text-destructive dark:bg-destructive/20'
    : isWarning
    ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-300'
    : 'bg-primary/5 border-primary/20 text-primary';

  const daysText =
    days === 0 ? 'termina hoje' :
    days === 1 ? 'termina amanhã' :
    `termina em ${days} dias`;

  return (
    <>
      <div className={`border-b px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 ${bannerClass}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Clock className="w-4 h-4 shrink-0" />
          <p className="text-sm font-medium">
            Seu teste grátis <strong>{daysText}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-current hover:bg-current/10 text-inherit"
            onClick={() => setUpgradeOpen(true)}
          >
            Assinar agora
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Fechar aviso de trial"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <UpgradePlanoDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
