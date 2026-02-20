// Google Analytics event tracking utility
// Measurement ID: G-ETSWDYPE8P

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type GtagEvent = {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: unknown;
};

export function trackEvent(
  eventName: string,
  params?: GtagEvent
): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

// Predefined conversion events
export const Analytics = {
  /** Clique no botão "Começar Grátis" ou "Criar Conta" na landing page */
  clickStartFree: (location: string = 'hero') => {
    trackEvent('click_start_free', {
      event_category: 'conversion',
      event_label: location,
    });
  },

  /** Clique no botão de plano específico na seção de preços */
  clickPlanCta: (planName: string) => {
    trackEvent('click_plan_cta', {
      event_category: 'conversion',
      event_label: planName,
    });
  },

  /** Cadastro concluído com sucesso */
  signupCompleted: (method: 'email' | 'pin' = 'email') => {
    trackEvent('sign_up', {
      event_category: 'conversion',
      event_label: method,
      method,
    });
  },

  /** Login concluído com sucesso */
  loginCompleted: () => {
    trackEvent('login', {
      event_category: 'engagement',
      method: 'email',
    });
  },

  /** Clique no botão de WhatsApp */
  clickWhatsapp: (location: string = 'floating') => {
    trackEvent('click_whatsapp', {
      event_category: 'engagement',
      event_label: location,
    });
  },

  /** Clique no header para login */
  clickNavLogin: () => {
    trackEvent('click_nav_login', {
      event_category: 'navigation',
    });
  },

  /** Clique no header para signup */
  clickNavSignup: () => {
    trackEvent('click_nav_signup', {
      event_category: 'navigation',
    });
  },
};
