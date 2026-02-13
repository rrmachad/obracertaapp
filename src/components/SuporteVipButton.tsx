import { MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const VIP_WHATSAPP_NUMBER = '5511999999999';

export function SuporteVipButton() {
  const { plan } = usePlanLimits();
  const { t } = useTranslation();

  const VIP_WHATSAPP_MESSAGE = encodeURIComponent(`Olá! Sou cliente Business do ${t('brand.name')} e preciso de suporte.`);
  const VIP_WHATSAPP_LINK = `https://wa.me/${VIP_WHATSAPP_NUMBER}?text=${VIP_WHATSAPP_MESSAGE}`;

  if (plan !== 'premium') return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={VIP_WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-amber-500 hover:bg-amber-600 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 ring-2 ring-amber-300/50"
          aria-label="Suporte VIP 24h"
        >
          <MessageCircle className="w-7 h-7 text-white" />
          <span className="absolute -top-1 -right-1 text-lg">👑</span>
        </a>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>Suporte VIP 24h</p>
      </TooltipContent>
    </Tooltip>
  );
}