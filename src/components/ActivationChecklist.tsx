import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle, ChevronRight, Rocket } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useActivationProgress } from '@/hooks/useActivationProgress';
import { useAuth } from '@/hooks/useAuth';

interface ActivationChecklistProps {
  /** Não exibir para usuários convidados, apenas donos de conta */
  skip?: boolean;
  onNovaObra: () => void;
}

const STORAGE_PREFIX = 'activation-checklist-done';

export function ActivationChecklist({ skip = false, onNovaObra }: ActivationChecklistProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useActivationProgress(!skip);

  const storageKey = user ? `${STORAGE_PREFIX}-${user.id}` : STORAGE_PREFIX;
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(storageKey) === 'true');
  // Só mostra a mensagem de conclusão se o card chegou a aparecer incompleto nesta sessão
  const sawIncompleteRef = useRef(false);

  const hasObra = data?.hasObra ?? false;
  const hasValorCronograma = data?.hasValorCronograma ?? false;
  const hasDiario = data?.hasDiario ?? false;
  const hasMedicao = data?.hasMedicao ?? false;
  const primeiraObraId = data?.primeiraObraId ?? null;

  const steps = [
    {
      key: 'obra',
      done: hasObra,
      onClick: () => onNovaObra(),
    },
    {
      key: 'valores',
      done: hasValorCronograma,
      onClick: primeiraObraId
        ? () => navigate(`/obra/${primeiraObraId}?tab=cronograma&destacar=sem-valor`)
        : undefined,
    },
    {
      key: 'diario',
      done: hasDiario,
      onClick: primeiraObraId
        ? () => navigate(`/obra/${primeiraObraId}?tab=diario`)
        : undefined,
    },
    {
      key: 'medicao',
      done: hasMedicao,
      onClick: primeiraObraId
        ? () =>
            navigate(
              hasValorCronograma
                ? `/obra/${primeiraObraId}?tab=financeiro`
                : `/obra/${primeiraObraId}?tab=cronograma&destacar=sem-valor`
            )
        : undefined,
    },
  ];

  const doneCount = steps.filter(s => s.done).length;
  const allDone = doneCount === steps.length;

  useEffect(() => {
    if (skip || isLoading || !data || dismissed) return;
    if (!allDone) {
      sawIncompleteRef.current = true;
    } else {
      localStorage.setItem(storageKey, 'true');
      // Usuário que já tinha tudo feito antes do checklist existir: some sem mensagem
      if (!sawIncompleteRef.current) setDismissed(true);
    }
  }, [skip, isLoading, data, allDone, dismissed, storageKey]);

  if (skip || dismissed || isLoading || !data) return null;
  if (allDone && !sawIncompleteRef.current) return null;

  if (allDone) {
    return (
      <div className="mb-4 rounded-lg border border-success/30 bg-success/5 p-4 flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
        <div>
          <p className="font-semibold text-sm">{t('activation.completedTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('activation.completedDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-lg border border-primary/20 bg-card p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Rocket className="w-4 h-4 text-primary" />
          {t('activation.title')}
        </h3>
        <span className="text-xs text-muted-foreground shrink-0">
          {t('activation.progress', { done: doneCount })}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{t('activation.subtitle')}</p>
      <Progress value={(doneCount / steps.length) * 100} className="h-2 mb-3" />
      <div className="space-y-1">
        {steps.map((step, i) =>
          step.done ? (
            <div key={step.key} className="flex items-center gap-3 p-2 rounded-md">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              <span className="text-sm text-muted-foreground line-through">
                {t(`activation.step_${step.key}`)}
              </span>
            </div>
          ) : (
            <button
              key={step.key}
              onClick={step.onClick}
              disabled={!step.onClick}
              className="w-full flex items-center gap-3 p-2 rounded-md text-left hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium flex-1">
                {i + 1}. {t(`activation.step_${step.key}`)}
              </span>
              {step.onClick && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>
          )
        )}
      </div>
    </div>
  );
}
