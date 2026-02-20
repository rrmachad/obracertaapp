import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const currencyConfig: Record<string, { locale: string; currency: string }> = {
  'pt-BR': { locale: 'pt-BR', currency: 'BRL' },
  'en-US': { locale: 'en-US', currency: 'USD' },
  'es-ES': { locale: 'es-ES', currency: 'USD' },
};

export function useCurrency() {
  const { i18n } = useTranslation();

  const formatCurrency = useCallback((value: number) => {
    const config = currencyConfig[i18n.language] || currencyConfig['pt-BR'];
    return value.toLocaleString(config.locale, {
      style: 'currency',
      currency: config.currency,
    });
  }, [i18n.language]);

  return { formatCurrency };
}
