import { useEffect, useRef, useState } from 'react';
import { Analytics } from '@/lib/analytics';
import testimonialRoberto from '@/assets/testimonial-roberto.jpg';
import testimonialMarcos from '@/assets/testimonial-marcos-new.jpg';
import testimonialCarlos from '@/assets/testimonial-carlos-new.jpg';
import { Link } from 'react-router-dom';
import screenDashboard from '@/assets/screen-dashboard.jpg';
import screenMeuPlano from '@/assets/screen-meu-plano.jpg';
import screenCronograma from '@/assets/screen-cronograma.jpg';
import screenFinanceiro from '@/assets/screen-financeiro.jpg';
import screenEstoque from '@/assets/screen-estoque.jpg';
import screenDiario from '@/assets/screen-diario.jpg';
import screenPortalConfig from '@/assets/screen-portal-config.jpg';
import screenPortalProgresso from '@/assets/screen-portal-progresso.jpg';
import screenAdmin from '@/assets/screen-admin.jpg';
import screenLucratividade from '@/assets/screen-lucratividade.jpg';
import { useTranslation } from 'react-i18next';
import { 
  ArrowRight, 
  CheckCircle, 
  Building2, 
  Package, 
  BarChart3,
  Star,
  Home,
  Truck,
  LineChart,
  AlertTriangle,
  X,
  Users,
  Bell,
  DollarSign,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  MessageCircle,
  Hammer,
  ShieldCheck,
  FileText,
  Calculator,
  Receipt,
  Smartphone,
  ShoppingCart,
  PieChart,
  TrendingUp,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AnimatedSection } from '@/hooks/useScrollAnimation';

const WHATSAPP_NUMBER = '5511999999999';

function CountUp({ target, active }: { target: number; active: boolean }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (target === 0) { setValue(0); return; }
    let start = 0;
    const duration = 1500;
    const step = Math.max(1, Math.floor(target / (duration / 30)));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(start);
    }, 30);
    return () => clearInterval(timer);
  }, [active, target]);
  return <>{value}</>;
}

/* ─── Business Phone Mockup ─── */
function PhoneMockup() {
  const { t } = useTranslation();
  return (
    <div className="relative w-72 h-[600px] mx-auto animate-[float_6s_ease-in-out_infinite]">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>

      <div className="absolute inset-0 bg-foreground/90 rounded-[3rem] shadow-2xl ring-1 ring-foreground/20" />
      <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

      <div className="absolute inset-[6px] bg-background rounded-[2.6rem] overflow-hidden">
        <div className="p-4 pt-14 h-full flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground">{t('landing.phoneMockupGreeting')}</p>
              <p className="text-sm font-bold">{t('landing.phoneMockupCompany')}</p>
            </div>
            <div className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
            </div>
          </div>

          <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-medium text-muted-foreground">{t('landing.phoneMockupProfitability')}</p>
              <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-0">+22%</Badge>
            </div>
            <div className="flex items-end gap-[3px] h-10">
              {[30, 45, 35, 55, 50, 65, 60, 75, 70, 85, 80, 92].map((h, i) => (
                <div key={i} className="flex-1 bg-primary/60 rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className="bg-card border rounded-xl p-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-xs">{t('landing.phoneMockupProjectName')}</p>
                <p className="text-[10px] text-muted-foreground">{t('landing.phoneMockupPhase')}</p>
              </div>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                {t('landing.phoneMockupOnTime')}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: '65%' }} />
              </div>
              <span className="text-[10px] font-bold text-primary">65%</span>
            </div>
          </div>

          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Smartphone className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold">{t('landing.phoneMockupPortal')}</p>
                <p className="text-[9px] text-muted-foreground">{t('landing.phoneMockupVisited')}</p>
              </div>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-foreground">5</p>
              <p className="text-[9px] text-muted-foreground">{t('landing.phoneMockupActiveProjects')}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-foreground">12</p>
              <p className="text-[9px] text-muted-foreground">{t('landing.phoneMockupCollaborators')}</p>
            </div>
          </div>

          <div className="flex-1" />
        </div>

        <div className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-primary shadow-lg flex items-center justify-center">
          <span className="text-primary-foreground text-2xl font-light">+</span>
        </div>
      </div>

      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-foreground/90 rounded-full" />
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl" />
    </div>
  );
}

const APP_SCREENS_KEYS = [
  { src: screenDashboard, labelKey: 'carousel.minhasObras' },
  { src: screenMeuPlano, labelKey: 'carousel.meuPlano' },
  { src: screenCronograma, labelKey: 'carousel.cronograma' },
  { src: screenFinanceiro, labelKey: 'carousel.financeiro' },
  { src: screenEstoque, labelKey: 'carousel.estoque' },
  { src: screenDiario, labelKey: 'carousel.diarioDeObra' },
  { src: screenPortalConfig, labelKey: 'carousel.portalDoCliente' },
  { src: screenPortalProgresso, labelKey: 'carousel.progressoDaObra' },
  { src: screenAdmin, labelKey: 'carousel.painelAdmin' },
  { src: screenLucratividade, labelKey: 'carousel.lucratividade' },
];

function AppScreensCarousel() {
  const { t } = useTranslation();
  const total = APP_SCREENS_KEYS.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : true);
  const SWIPE_THRESHOLD = 50;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % total);
    }, 2800);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPaused, total]);

  const goNext = () => {
    setCurrentIndex(prev => (prev + 1) % total);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 4000);
  };

  const goPrev = () => {
    setCurrentIndex(prev => (prev - 1 + total) % total);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 4000);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    setTimeout(() => setIsPaused(false), 4000);
  };

  // Desktop 3D ciranda
  const getCardStyleDesktop = (i: number): React.CSSProperties => {
    const angleStep = 360 / total;
    const rawAngle = ((i - currentIndex) * angleStep + 360) % 360;
    const angle = rawAngle > 180 ? rawAngle - 360 : rawAngle;
    const angleRad = (angle * Math.PI) / 180;
    const rx = 420;
    const rz = 180;
    const x = Math.sin(angleRad) * rx;
    const z = Math.cos(angleRad) * rz - rz;
    const scale = 0.55 + 0.45 * ((Math.cos(angleRad) + 1) / 2);
    const opacity = 0.35 + 0.65 * ((Math.cos(angleRad) + 1) / 2);
    const zIndex = Math.round(scale * 100);
    return {
      transform: `translateX(${x}px) translateZ(${z}px) scale(${scale})`,
      opacity,
      zIndex,
      transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1), opacity 0.7s ease',
      position: 'absolute',
      width: '280px',
      left: '50%',
      top: '50%',
      marginLeft: '-140px',
      marginTop: '-250px',
      cursor: 'pointer',
    };
  };

  const isFront = (i: number) => i === currentIndex;
  const dots = (
    <div className="flex justify-center gap-2 mt-4">
      {APP_SCREENS_KEYS.map((_, i) => (
        <button
          key={i}
          onClick={() => { setCurrentIndex(i); setIsPaused(true); setTimeout(() => setIsPaused(false), 4000); }}
          className={`rounded-full transition-all duration-300 ${
            i === currentIndex ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-muted-foreground/40 hover:bg-muted-foreground/70'
          }`}
          aria-label={`Screenshot ${i + 1}`}
        />
      ))}
    </div>
  );

  // ── Mobile: flat peek carousel ──────────────────────────────────────────────
  if (isMobile) {
    const prev = (currentIndex - 1 + total) % total;
    const next = (currentIndex + 1) % total;
    return (
      <div
        className="w-full py-8"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="flex items-center justify-center gap-3 px-4">
          {/* Previous peek */}
          <div
            className="flex-shrink-0 rounded-xl overflow-hidden border border-border/30 opacity-40 cursor-pointer"
            style={{ width: '72px', height: '128px' }}
            onClick={goPrev}
          >
            <img src={APP_SCREENS_KEYS[prev].src} alt="" className="w-full h-full object-cover object-top" draggable={false} />
          </div>

          {/* Active card */}
          <div className="flex-shrink-0 rounded-2xl overflow-hidden border border-primary/60 shadow-2xl shadow-primary/20" style={{ width: '220px', height: '390px' }}>
            <img
              src={APP_SCREENS_KEYS[currentIndex].src}
              alt={t(APP_SCREENS_KEYS[currentIndex].labelKey)}
              className="w-full h-full object-cover object-top"
              draggable={false}
            />
          </div>

          {/* Next peek */}
          <div
            className="flex-shrink-0 rounded-xl overflow-hidden border border-border/30 opacity-40 cursor-pointer"
            style={{ width: '72px', height: '128px' }}
            onClick={goNext}
          >
            <img src={APP_SCREENS_KEYS[next].src} alt="" className="w-full h-full object-cover object-top" draggable={false} />
          </div>
        </div>

        <p className="text-center text-sm font-semibold text-primary mt-3 tracking-wide">
          {t(APP_SCREENS_KEYS[currentIndex].labelKey)}
        </p>

        <div className="flex justify-center items-center gap-3 mt-2">
          <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
            <ChevronLeft className="w-3 h-3" /> deslize <ChevronRight className="w-3 h-3" />
          </span>
        </div>
        {dots}
      </div>
    );
  }

  // ── Desktop: 3D ciranda ─────────────────────────────────────────────────────
  return (
    <div
      className="relative w-full py-12 flex justify-center"
      style={{ perspective: '1200px', minHeight: '580px' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div style={{ position: 'relative', width: '380px', height: '500px', transformStyle: 'preserve-3d' }}>
        {APP_SCREENS_KEYS.map((screen, i) => (
          <div key={i} style={getCardStyleDesktop(i)} onClick={() => setCurrentIndex(i)}>
            <div
              className={`rounded-2xl overflow-hidden border shadow-2xl bg-card ${
                isFront(i) ? 'border-primary/60 shadow-primary/20' : 'border-border/40'
              }`}
              style={{ height: '500px' }}
            >
              <img src={screen.src} alt={t(screen.labelKey)} className="w-full h-full object-cover object-top" draggable={false} />
            </div>
            {isFront(i) && (
              <p className="text-center text-sm font-semibold text-primary mt-3 tracking-wide">{t(screen.labelKey)}</p>
            )}
          </div>
        ))}
      </div>

      <button onClick={goPrev} className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-50 items-center justify-center w-11 h-11 rounded-full bg-background/80 border border-border shadow-lg backdrop-blur-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200" aria-label="Screenshot anterior">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={goNext} className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-50 items-center justify-center w-11 h-11 rounded-full bg-background/80 border border-border shadow-lg backdrop-blur-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200" aria-label="Próxima screenshot">
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-2 left-0 right-0">
        {dots}
      </div>
    </div>
  );
}


export function LandingPage() {
  const { t } = useTranslation();
  const counterRef = useRef<HTMLDivElement>(null);
  const [countersVisible, setCountersVisible] = useState(false);

  const WHATSAPP_MESSAGE = encodeURIComponent(t('landing.whatsappMessage'));
  const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

  useEffect(() => {
    const el = counterRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setCountersVisible(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const painPoints = [
    { pain: t('landing.pain1'), solution: t('landing.solution1'), painIcon: AlertTriangle, solutionIcon: Package },
    { pain: t('landing.pain2'), solution: t('landing.solution2'), painIcon: DollarSign, solutionIcon: ShieldCheck },
    { pain: t('landing.pain3'), solution: t('landing.solution3'), painIcon: X, solutionIcon: BarChart3 },
    { pain: t('landing.pain4'), solution: t('landing.solution4'), painIcon: X, solutionIcon: CheckCircle },
  ];

  const steps = [
    { icon: Home, title: t('landing.step1Title'), description: t('landing.step1Desc') },
    { icon: Truck, title: t('landing.step2Title'), description: t('landing.step2Desc') },
    { icon: LineChart, title: t('landing.step3Title'), description: t('landing.step3Desc') },
  ];

  const features = [
    { icon: Building2, title: t('landing.feat1Title'), description: t('landing.feat1Desc') },
    { icon: Bell, title: t('landing.feat2Title'), description: t('landing.feat2Desc') },
    { icon: Users, title: t('landing.feat3Title'), description: t('landing.feat3Desc') },
    { icon: BarChart3, title: t('landing.feat4Title'), description: t('landing.feat4Desc') },
  ];

  const plans = [
    {
      name: t('landing.plan1Name'), price: t('landing.plan1Price'), period: t('landing.plan1Period'),
      description: t('landing.plan1Desc'), badge: null,
      features: [
        { text: t('landing.plan1Feat1'), included: true },
        { text: t('landing.plan1Feat2'), included: true },
        { text: t('landing.plan1Feat3'), included: true, warning: true },
      ],
      cta: t('landing.plan1Cta'), popular: false, premium: false, variant: 'outline' as const,
    },
    {
      name: t('landing.plan2Name'), price: t('landing.plan2Price'), period: t('landing.plan2Period'),
      description: t('landing.plan2Desc'), badge: t('landing.plan2Badge'),
      features: [
        { text: t('landing.plan2Feat1'), included: true },
        { text: t('landing.plan2Feat2'), included: true },
        { text: t('landing.plan2Feat3'), included: true },
        { text: t('landing.plan2Feat4'), included: true },
      ],
      cta: t('landing.plan2Cta'), popular: false, premium: false, variant: 'outline' as const,
    },
    {
      name: t('landing.plan3Name'), price: t('landing.plan3Price'), period: t('landing.plan3Period'),
      description: t('landing.plan3Desc'), badge: t('landing.plan3Badge'),
      features: [
        { text: t('landing.plan3Feat1'), included: true },
        { text: t('landing.plan3Feat2'), included: true },
        { text: t('landing.plan3Feat3'), included: true },
        { text: t('landing.plan3Feat4'), included: true },
        { text: t('landing.plan3Feat5'), included: true },
      ],
      cta: t('landing.plan3Cta'), popular: false, premium: false, variant: 'outline' as const,
    },
    {
      name: t('landing.plan4Name'), price: t('landing.plan4Price'), period: t('landing.plan4Period'),
      description: t('landing.plan4Desc'), badge: t('landing.plan4Badge'),
      features: [
        { text: t('landing.plan4Feat1'), included: true },
        { text: t('landing.plan4Feat2'), included: true, highlight: true },
        { text: t('landing.plan4Feat3'), included: true },
        { text: t('landing.plan4Feat4'), included: true },
        { text: t('landing.plan4Feat5'), included: true },
        { text: t('landing.plan4Feat6'), included: true },
      ],
      cta: t('landing.plan4Cta'), popular: true, premium: true, variant: 'default' as const,
    },
  ];

  const testimonials = [
    { name: t('landing.test1Name'), role: t('landing.test1Role'), content: t('landing.test1Content'), photo: testimonialRoberto, stars: 5 },
    { name: t('landing.test2Name'), role: t('landing.test2Role'), content: t('landing.test2Content'), photo: testimonialMarcos, stars: 5 },
    { name: t('landing.test3Name'), role: t('landing.test3Role'), content: t('landing.test3Content'), photo: testimonialCarlos, stars: 5 },
  ];

  const faqs = [
    { question: t('landing.faq1Q'), answer: t('landing.faq1A') },
    { question: t('landing.faq2Q'), answer: t('landing.faq2A') },
    { question: t('landing.faq3Q'), answer: t('landing.faq3A') },
    { question: t('landing.faq4Q'), answer: t('landing.faq4A') },
    { question: t('landing.faq5Q'), answer: t('landing.faq5A') },
    { question: t('landing.faq6Q'), answer: t('landing.faq6A') },
  ];

  return (
    <div className="min-h-screen bg-background" itemScope itemType="https://schema.org/WebPage">
      {/* Floating WhatsApp Button */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => Analytics.clickWhatsapp('floating')}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
        aria-label={t('landing.whatsappAriaLabel')}
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </a>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Hammer className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">{t('brand.name')}</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#como-funciona" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.navHowItWorks')}
            </a>
            <a href="#demo" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.navDemo')}
            </a>
            <a href="#precos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.navPricing')}
            </a>
            <a href="#depoimentos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.navTestimonials')}
            </a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.navFaq')}
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link to="/auth" onClick={() => Analytics.clickNavLogin()}>
              <Button variant="ghost" size="sm">{t('nav.login')}</Button>
            </Link>
            <Link to="/auth?mode=signup" className="hidden sm:block" onClick={() => Analytics.clickNavSignup()}>
              <Button size="sm">{t('nav.signup')}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════ HERO SECTION ═══════ */}
      <section className="py-16 md:py-24 overflow-hidden" aria-label="Introdução">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection animation="fadeUp" className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-6 gap-2 px-4 py-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                {t('landing.heroBadge')}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                {t('landing.heroTitle1')}{' '}
                <span className="text-primary">{t('landing.heroHighlight1')}</span>,{' '}
                <span className="text-primary">{t('landing.heroHighlight2')}</span>{' '}
                {'& '}
                <span className="text-violet-600 dark:text-violet-400">{t('landing.heroHighlight3')}</span>.
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                {t('landing.heroSubtitle')}
              </p>

              <div className="flex flex-col gap-3 mb-8 max-w-sm sm:max-w-md mx-auto lg:mx-0">
                <div className="flex items-start gap-2 text-sm font-medium">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{t('landing.heroBullet1')}</span>
                </div>
                <div className="flex items-start gap-2 text-sm font-medium">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{t('landing.heroBullet2')}</span>
                </div>
                <div className="flex items-start gap-2 text-sm font-medium">
                  <CheckCircle className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
                  <span><strong>{t('landing.heroBullet3New')}</strong> {t('landing.heroBullet3')}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/auth?mode=signup" onClick={() => Analytics.clickStartFree('hero')}>
                  <Button size="lg" className="gap-2 text-lg px-8 h-14 w-full sm:w-auto">
                    {t('landing.heroCta')}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center lg:justify-start gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  {t('landing.heroNoCreditCard')}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  {t('landing.heroReady')}
                </span>
              </p>
            </AnimatedSection>
            
            <AnimatedSection animation="fadeLeft" delay={200} className="relative mx-auto lg:mx-0">
              <PhoneMockup />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Pain vs Solution Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <AnimatedSection animation="fadeUp" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('landing.painTitle')} <span className="text-primary">{t('landing.painTitleHighlight')}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('landing.painSubtitle')}
            </p>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {painPoints.map((item, index) => (
              <AnimatedSection key={index} animation="fadeUp" delay={index * 100}>
                <Card className="overflow-hidden h-full">
                  <CardContent className="p-0">
                    <div className="bg-destructive/10 p-6 border-b border-destructive/20">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                          <item.painIcon className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-destructive mb-1">{t('landing.painLabel')}</p>
                          <p className="font-semibold">{item.pain}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center -my-3 relative z-10">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <ChevronDown className="w-5 h-5 text-primary-foreground" />
                      </div>
                    </div>
                    
                    <div className="bg-primary/5 p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <item.solutionIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary mb-1">{t('landing.solutionLabel')}</p>
                          <p className="font-semibold">{item.solution}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* App Screenshots Carousel Section */}
      <section id="demo" className="py-16 overflow-x-hidden">
        <div className="container">
          <AnimatedSection animation="fadeUp" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('landing.demoTitle')} <span className="text-primary">{t('landing.demoTitleHighlight')}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('landing.demoSubtitle')}
            </p>
          </AnimatedSection>
        </div>

        {/* Infinite auto-scroll carousel */}
        <AppScreensCarousel />
      </section>

      {/* How It Works Section */}
      <section id="como-funciona" className="py-16 bg-muted/30">
        <div className="container">
          <AnimatedSection animation="fadeUp" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('landing.stepsTitle')} <span className="text-primary">{t('landing.stepsTitleHighlight')}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('landing.stepsSubtitle')}
            </p>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <AnimatedSection key={index} animation="fadeUp" delay={index * 150}>
                {/* Mobile: número à esquerda + ícone + texto em linha */}
                <div className="flex items-start gap-4 md:hidden">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                    {index + 1}
                  </div>
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </div>
                {/* Desktop: centralizado com número no canto do ícone */}
                <div className="hidden md:flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <step.icon className="w-10 h-10 text-primary" />
                    </div>
                    <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Blindagem Financeira Section */}
      <section className="py-16">
        <div className="container">
          <AnimatedSection animation="fadeUp" className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('landing.financialTitle')} <span className="text-primary">{t('landing.financialTitleHighlight')}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.financialSubtitle')}
            </p>
          </AnimatedSection>

          <div ref={counterRef} className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            {[
              { value: 100, suffix: '%', label: t('landing.stat1Label') },
              { value: 5, suffix: '%', label: t('landing.stat2Label') },
              { value: 0, suffix: '', label: t('landing.stat3Label') },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl md:text-5xl font-extrabold text-primary">
                  <CountUp target={stat.value} active={countersVisible} />{stat.suffix}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Calculator, title: t('landing.finCard1Title'), text: t('landing.finCard1Text') },
              { icon: Receipt, title: t('landing.finCard2Title'), text: t('landing.finCard2Text') },
              { icon: ShieldCheck, title: t('landing.finCard3Title'), text: t('landing.finCard3Text') },
              { icon: FileText, title: t('landing.finCard4Title'), text: t('landing.finCard4Text') },
            ].map((item, index) => (
              <AnimatedSection key={index} animation="scaleUp" delay={index * 100}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.text}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <AnimatedSection animation="fadeUp" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('landing.featuresTitle')} <span className="text-primary">{t('landing.featuresTitleHighlight')}</span>
            </h2>
          </AnimatedSection>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <AnimatedSection key={index} animation="scaleUp" delay={index * 100}>
                <Card className="text-center hover:shadow-lg transition-shadow h-full">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ DIFERENCIAIS BUSINESS SECTION ═══════ */}
      <section className="py-16 bg-violet-500/5 border-y border-violet-500/10">
        <div className="container">
          <AnimatedSection animation="fadeUp" className="text-center mb-12">
            <Badge className="mb-4 bg-violet-600 text-white border-0 px-4 py-1.5">
              {t('landing.businessBadge')}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('landing.businessTitle')}{' '}
              <span className="text-violet-600 dark:text-violet-400">{t('landing.businessTitleHighlight')}</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.businessSubtitle')}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Share2, title: t('landing.biz1Title'), description: t('landing.biz1Desc') },
              { icon: ShoppingCart, title: t('landing.biz2Title'), description: t('landing.biz2Desc') },
              { icon: PieChart, title: t('landing.biz3Title'), description: t('landing.biz3Desc') },
            ].map((item, index) => (
              <AnimatedSection key={index} animation="scaleUp" delay={index * 150}>
                <Card className="h-full border-violet-500/20 hover:shadow-xl hover:shadow-violet-500/5 transition-all">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-6">
                      <item.icon className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection animation="fadeUp" delay={500} className="text-center mt-10">
            <Link to="/portal/demo">
              <Button variant="outline" className="gap-2 border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10">
                <Smartphone className="w-4 h-4" />
                {t('landing.bizPortalDemo')}
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-16 bg-muted/30">
        <div className="container">
          <AnimatedSection animation="fadeUp" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('landing.pricingTitle')} <span className="text-primary">{t('landing.pricingTitleHighlight')}</span> {t('landing.pricingTitleEnd')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.pricingSubtitle')}
            </p>
          </AnimatedSection>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch">
            {plans.map((plan, index) => (
              <AnimatedSection key={index} animation="fadeUp" delay={index * 100}>
                <Card 
                  className={`relative h-full flex flex-col transition-all ${
                    plan.premium 
                      ? 'border-2 border-violet-500 shadow-2xl lg:scale-105 ring-2 ring-violet-400/30 bg-gradient-to-b from-violet-500/5 to-transparent' 
                      : ''
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className={`px-4 py-1 whitespace-nowrap ${
                        plan.premium 
                          ? 'bg-violet-600 text-white animate-pulse shadow-lg shadow-violet-500/30' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  {plan.premium && (
                    <div className="absolute -top-1 -right-1">
                      <span className="text-2xl">🔥</span>
                    </div>
                  )}
                  <CardContent className="p-6 pt-8 flex flex-col flex-1">
                    <h3 className={`text-xl font-bold mb-2 ${plan.premium ? 'text-violet-600 dark:text-violet-400' : ''}`}>{plan.name}</h3>
                    <div className="mb-1">
                      <span className="text-4xl font-extrabold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    {plan.premium && (
                      <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-2">{t('landing.promoLabel')}</p>
                    )}
                    <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                    
                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className={`flex items-start gap-2 text-sm ${
                          !feature.included ? 'text-muted-foreground line-through' : ''
                        } ${'highlight' in feature && feature.highlight ? 'font-bold' : ''}`}>
                          {feature.included ? (
                            <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.premium ? 'text-violet-500' : 'text-primary'}`} />
                          ) : (
                            <X className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                          )}
                          <span>{feature.text}</span>
                        </li>
                      ))}
                    </ul>
                    
                     <Link to="/auth?mode=signup" className="block mt-auto" onClick={() => Analytics.clickPlanCta(plan.name)}>
                      <Button 
                        className={`w-full ${plan.premium ? 'text-lg py-6 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25' : ''}`}
                        variant={plan.premium ? 'default' : plan.variant}
                        size="lg"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-16 bg-muted/20" aria-label="Depoimentos de clientes">
        <div className="container">
          <AnimatedSection animation="fadeUp" className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 gap-1 px-4 py-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              ))}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('landing.testimonialsTitle')} <span className="text-primary">{t('landing.testimonialsTitleHighlight')}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {t('landing.testimonialsSubtitle')}
            </p>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <AnimatedSection key={index} animation="fadeUp" delay={index * 120}>
                <Card className="overflow-hidden h-full hover:shadow-xl transition-shadow duration-300 border-border/50">
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Stars */}
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: testimonial.stars }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                      ))}
                    </div>

                    {/* Quote */}
                    <div className="relative flex-1 mb-6">
                      <span className="absolute -top-2 -left-1 text-5xl leading-none text-primary/20 font-serif select-none">"</span>
                      <p className="text-base leading-relaxed text-muted-foreground pl-4 italic">
                        {testimonial.content}
                      </p>
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                      <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/20 flex-shrink-0">
                        <img
                          src={testimonial.photo}
                          alt={`Foto de ${testimonial.name}, ${testimonial.role}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          width={48}
                          height={48}
                        />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-muted/30">
        <div className="container">
          <AnimatedSection animation="fadeUp" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('landing.faqTitle')} <span className="text-primary">{t('landing.faqTitleHighlight')}</span>
            </h2>
          </AnimatedSection>
          
          <AnimatedSection animation="fadeUp" delay={100} className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`} 
                  className="border rounded-lg px-6 bg-card"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-secondary text-secondary-foreground">
        <div className="container text-center">
          <AnimatedSection animation="scaleUp">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('landing.ctaTitle')}
            </h2>
            <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
              {t('landing.ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?mode=signup" onClick={() => Analytics.clickStartFree('final_cta')}>
                <Button size="lg" variant="default" className="gap-2 text-lg px-8 h-14">
                  {t('landing.ctaButton')}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" onClick={() => Analytics.clickWhatsapp('final_cta')}>
                <Button size="lg" variant="secondary" className="gap-2 text-lg px-8 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white border-0">
                  <MessageCircle className="w-5 h-5" />
                  {t('landing.ctaWhatsapp')}
                </Button>
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-secondary text-secondary-foreground border-t border-secondary-foreground/10">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Hammer className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold">{t('brand.name')}</span>
            </div>
            
            <p className="text-sm opacity-60">
              © {new Date().getFullYear()} {t('brand.name')}. {t('landing.footerRights')}
            </p>
            
            <div className="flex gap-6">
              <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                {t('landing.footerTerms')}
              </a>
              <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                {t('landing.footerPrivacy')}
              </a>
              <a 
                href={WHATSAPP_LINK}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm opacity-60 hover:opacity-100 transition-opacity"
              >
                {t('landing.footerSupport')}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}