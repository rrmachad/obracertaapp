import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Play,
  MessageCircle,
  Hammer,
  ShieldCheck,
  FileText,
  Calculator,
  Receipt
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
import { AnimatedSection } from '@/hooks/useScrollAnimation';

const WHATSAPP_NUMBER = '5511999999999'; // Altere para o número real
const WHATSAPP_MESSAGE = encodeURIComponent('Olá! Vim pelo site Obra Certa e gostaria de saber mais.');
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

const painPoints = [
  {
    pain: 'Estoque furado e compras de emergência caras',
    solution: 'Controle exato de entrada e saída de materiais',
    painIcon: AlertTriangle,
    solutionIcon: Package,
  },
  {
    pain: 'Paga adiantado, perde o controle dos "vales" e o empreiteiro abandona a obra?',
    solution: 'Pagamento por Medição Física. O sistema calcula o avanço, desconta os vales automaticamente e aplica a Retenção Técnica antes de você tirar um centavo do bolso.',
    painIcon: DollarSign,
    solutionIcon: ShieldCheck,
  },
  {
    pain: 'Cliente cobrando prazos e você perdido',
    solution: 'Cronograma visual e Relatório Diário de Obra automático',
    painIcon: X,
    solutionIcon: BarChart3,
  },
  {
    pain: 'Anotações em papel de pão que somem',
    solution: 'Tudo na nuvem, acessível de qualquer lugar',
    painIcon: X,
    solutionIcon: CheckCircle,
  },
];

const steps = [
  {
    icon: Home,
    title: 'Cadastre sua Obra',
    description: 'Defina as fases do projeto — já temos templates prontos!',
  },
  {
    icon: Truck,
    title: 'Controle o Estoque',
    description: 'Adicione materiais e gerencie entradas/saídas com 2 cliques.',
  },
  {
    icon: LineChart,
    title: 'Gere Relatórios',
    description: 'Exporte PDFs profissionais e impressione seu cliente.',
  },
];

const features = [
  {
    icon: Building2,
    title: 'Gestão Multi-Obra',
    description: 'Controle vários canteiros na mesma tela.',
  },
  {
    icon: Bell,
    title: 'Alertas de Estoque',
    description: 'O app avisa quando o cimento vai acabar.',
  },
  {
    icon: Users,
    title: 'Acesso de Equipe',
    description: 'Seu mestre de obras lança o diário, você aprova.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Financeiro Completo',
    description: 'Acompanhe Previsto x Realizado de cada fase. Saldo de retenção e total pago em tempo real.',
  },
];

const plans = [
  {
    name: 'Iniciante',
    price: 'R$ 0',
    period: '',
    description: 'Sua porta de entrada para a organização digital.',
    badge: null,
    features: [
      { text: 'Gestão de 1 Obra', included: true },
      { text: 'Cronograma e Estoque Básicos', included: true },
      { text: '⚠️ Ideal apenas para testar o sistema.', included: true, warning: true },
    ],
    cta: 'Testar Grátis',
    popular: false,
    premium: false,
    variant: 'outline' as const,
  },
  {
    name: 'Autônomo',
    price: 'R$ 29',
    period: ',90/mês',
    description: 'Para quem quer acabar com o papel e a bagunça no canteiro.',
    badge: '🚀 OPERACIONAL',
    features: [
      { text: '🚀 Obras Ilimitadas', included: true },
      { text: '📝 Diário de Obra Digital: Adeus caderninho.', included: true },
      { text: '🧱 Controle de Estoque: Saiba o que tem na obra.', included: true },
      { text: '📅 Cronograma Físico: Acompanhe o avanço.', included: true },
    ],
    cta: 'Organizar Minhas Obras',
    popular: false,
    premium: false,
    variant: 'outline' as const,
  },
  {
    name: 'Construtora',
    price: 'R$ 59',
    period: ',90/mês',
    description: 'Pare de perder dinheiro com empreiteiros e materiais.',
    badge: '🛡️ FINANCEIRO',
    features: [
      { text: 'Tudo do Plano Autônomo', included: true },
      { text: '💰 Medições: Pague apenas o executado.', included: true },
      { text: '📉 Desconto Automático de Vales', included: true },
      { text: '🛡️ Retenção Técnica (5%): Garantia automática.', included: true },
      { text: '👥 3 Usuários', included: true },
    ],
    cta: 'Blindar Meu Caixa',
    popular: false,
    premium: false,
    variant: 'outline' as const,
  },
  {
    name: 'Business',
    price: 'R$ 99',
    period: ',90/mês',
    description: 'Escale sua construtora e encante seus clientes.',
    badge: '👑 GESTÃO TOTAL',
    features: [
      { text: 'Tudo do Plano Construtora', included: true },
      { text: '📱 Portal do Cliente: Link público para o dono da casa acompanhar o progresso.', included: true, highlight: true },
      { text: '🛒 Módulo de Compras: Listas unificadas para cotação.', included: true },
      { text: '👥 Usuários Ilimitados', included: true },
      { text: '📊 Dashboard de Lucratividade', included: true },
      { text: '🤝 Suporte VIP 24h', included: true },
    ],
    cta: 'Escalar Meu Negócio',
    popular: true,
    premium: true,
    variant: 'default' as const,
  },
];

const testimonials = [
  {
    name: 'João Silva',
    role: 'Empreiteiro em Belo Horizonte',
    content: 'Antes eu perdia 20% do material. Com o Obra Certa, o desperdício zerou. Só isso já pagou o app.',
    avatar: '👷',
  },
  {
    name: 'Marcos Oliveira',
    role: 'Engenheiro Civil',
    content: 'O relatório diário em PDF me salvou de processos. É muito profissional. Meus clientes ficam impressionados.',
    avatar: '👨‍💼',
  },
  {
    name: 'Carlos Mendes',
    role: 'Engenheiro Civil',
    content: 'Antes eu me perdia nas contas e pagava o pedreiro duas vezes. Com o sistema de Medição do Obra Certa, o desconto dos vales é automático. Só pago o que foi medido. Economizei R$ 5.000 só no mês passado.',
    avatar: '👨‍🔧',
  },
];

const faqs = [
  {
    question: 'Funciona sem internet?',
    answer: 'Sim! O app funciona offline e sincroniza automaticamente quando você conectar à internet. Perfeito para canteiros sem Wi-Fi.',
  },
  {
    question: 'É difícil de usar?',
    answer: 'Não! O Obra Certa foi feito para ser usado com uma mão só, no canteiro de obras. Botões grandes, interface simples, sem complicação.',
  },
  {
    question: 'Serve para reformas pequenas?',
    answer: 'Sim, qualquer tipo de obra! Desde uma reforma de banheiro até um condomínio de alto padrão. O sistema se adapta ao seu projeto.',
  },
  {
    question: 'Como funciona o sistema de medição e retenção técnica?',
    answer: 'Você define o valor do contrato de mão de obra por fase ou item no cronograma. A cada medição, informa o percentual executado e o sistema calcula automaticamente o valor bruto, desconta os adiantamentos (vales) pendentes e aplica a retenção técnica (padrão 5%, mas você pode personalizar). O resultado é o valor líquido exato a pagar, sem surpresas.',
  },
  {
    question: 'Preciso instalar algum programa?',
    answer: 'Não! O Obra Certa funciona direto no navegador do celular ou computador. Basta acessar, criar sua conta e começar.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim, sem burocracia. Você pode cancelar sua assinatura quando quiser, sem taxa de cancelamento.',
  },
];

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

export function LandingPage() {
  const counterRef = useRef<HTMLDivElement>(null);
  const [countersVisible, setCountersVisible] = useState(false);

  useEffect(() => {
    const el = counterRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setCountersVisible(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Floating WhatsApp Button */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
        aria-label="Falar no WhatsApp"
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
            <span className="text-xl font-bold">Obra Certa</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#como-funciona" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Como Funciona
            </a>
            <a href="#demo" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Veja em Ação
            </a>
            <a href="#precos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dúvidas
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/auth?mode=signup" className="hidden sm:block">
              <Button size="sm">Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 overflow-hidden">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection animation="fadeUp" className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-6 gap-2 px-4 py-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                +500 obras gerenciadas
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                Pare de Jogar Dinheiro Fora no{' '}
                <span className="text-primary">Canteiro de Obras</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                A ferramenta definitiva para gerenciar estoque, <strong>controlar pagamentos por medição</strong> e 
                profissionalizar sua construtora. Elimine furos de caixa com adiantamentos e retenções automáticas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="gap-2 text-lg px-8 h-14 w-full sm:w-auto">
                    Começar Grátis Agora
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center lg:justify-start gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Sem cartão de crédito
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Pronto em 2 minutos
                </span>
              </p>
            </AnimatedSection>
            
            {/* App Mockup */}
            <AnimatedSection animation="fadeLeft" delay={200} className="relative mx-auto lg:mx-0">
              <div className="relative w-72 h-[580px] mx-auto">
                {/* Phone Frame */}
                <div className="absolute inset-0 bg-secondary rounded-[3rem] shadow-2xl" />
                <div className="absolute inset-2 bg-background rounded-[2.5rem] overflow-hidden">
                  {/* Screen Content */}
                  <div className="p-4 pt-12">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Bom dia, João</p>
                        <p className="font-bold">Suas Obras</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-primary/10" />
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-primary/10 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Em andamento</p>
                        <p className="text-2xl font-bold text-primary">3</p>
                      </div>
                      <div className="bg-accent/20 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Progresso médio</p>
                        <p className="text-2xl font-bold text-accent-foreground">67%</p>
                      </div>
                    </div>
                    
                    {/* Obra Card */}
                    <div className="bg-card border rounded-xl p-3 mb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">Residencial Aurora</p>
                          <p className="text-xs text-muted-foreground">Fase: Acabamento</p>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">85%</Badge>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>
                    
                    <div className="bg-card border rounded-xl p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">Casa João Paulo</p>
                          <p className="text-xs text-muted-foreground">Fase: Estrutura</p>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-accent/20 text-accent-foreground">45%</Badge>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-secondary rounded-full" />
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Pain vs Solution Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <AnimatedSection animation="fadeUp" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Sua obra não precisa ser uma <span className="text-primary">dor de cabeça</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Chega de estresse. Veja como o Obra Certa transforma seu dia a dia.
            </p>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {painPoints.map((item, index) => (
              <AnimatedSection key={index} animation="fadeUp" delay={index * 100}>
                <Card className="overflow-hidden h-full">
                  <CardContent className="p-0">
                    {/* Pain */}
                    <div className="bg-destructive/10 p-6 border-b border-destructive/20">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                          <item.painIcon className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-destructive mb-1">O Problema:</p>
                          <p className="font-semibold">{item.pain}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <div className="flex justify-center -my-3 relative z-10">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <ChevronDown className="w-5 h-5 text-primary-foreground" />
                      </div>
                    </div>
                    
                    {/* Solution */}
                    <div className="bg-primary/5 p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <item.solutionIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary mb-1">A Solução:</p>
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

      {/* Video Demo Section */}
      <section id="demo" className="py-16">
        <div className="container">
          <AnimatedSection animation="fadeUp" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Veja o Obra Certa <span className="text-primary">em Ação</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Um tour rápido de 2 minutos mostrando as principais funcionalidades
            </p>
          </AnimatedSection>
          
          <AnimatedSection animation="scaleUp" delay={200} className="max-w-4xl mx-auto">
            <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden shadow-2xl border">
              {/* Video Placeholder - Replace with actual video embed */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <div className="text-center">
                  <button 
                    className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-4 mx-auto shadow-lg hover:scale-110 transition-transform"
                    onClick={() => {
                      // TODO: Implement video modal or replace with YouTube embed
                      window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
                    }}
                  >
                    <Play className="w-8 h-8 ml-1" />
                  </button>
                  <p className="text-lg font-semibold">Assistir Demonstração</p>
                  <p className="text-sm text-muted-foreground">2 minutos</p>
                </div>
              </div>
              
              {/* Decorative app screenshots */}
              <div className="absolute top-4 left-4 w-32 h-48 bg-card rounded-xl shadow-lg opacity-30 -rotate-6" />
              <div className="absolute bottom-4 right-4 w-32 h-48 bg-card rounded-xl shadow-lg opacity-30 rotate-6" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="como-funciona" className="py-16 bg-muted/30">
        <div className="container">
          <AnimatedSection animation="fadeUp" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para usar em <span className="text-primary">3 passos</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Sem complicação. Sem treinamento. É só começar.
            </p>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <AnimatedSection key={index} animation="fadeUp" delay={index * 150} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <step.icon className="w-10 h-10 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
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
              O Fim do "Caderninho" de <span className="text-primary">Adiantamentos</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Profissionalize sua relação com empreiteiros e evite pagar mais do que foi executado.
            </p>
          </AnimatedSection>

          {/* Animated stat counters */}
          <div ref={counterRef} className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            {[
              { value: 100, suffix: '%', label: 'Cálculo automático' },
              { value: 5, suffix: '%', label: 'Retenção padrão' },
              { value: 0, suffix: '', label: 'Erros de pagamento', prefix: '' },
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
              { icon: Calculator, title: 'Cálculo Automático', text: 'Você insere a % feita, o app diz exatamente o valor líquido a pagar.' },
              { icon: Receipt, title: 'Controle de Vales', text: 'O sistema abate automaticamente qualquer adiantamento pendente na hora da medição.' },
              { icon: ShieldCheck, title: 'Retenção Técnica', text: 'Seguramos 5% (ou quanto você definir) de cada pagamento como garantia de entrega.' },
              { icon: FileText, title: 'Extrato em PDF', text: 'Gere relatórios financeiros detalhados por fase com um clique.' },
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
              Tudo que você precisa, <span className="text-primary">nada que não precisa</span>
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

      {/* Pricing Section */}
      <section id="precos" className="py-16 bg-muted/30">
        <div className="container">
          <AnimatedSection animation="fadeUp" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Quanto custa <span className="text-primary">perder dinheiro</span> em obra?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cada vale sem controle, cada medição no achismo, é dinheiro que sai do seu bolso. Escolha o plano que blinda seu caixa.
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
                      <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-2">Preço promocional de lançamento</p>
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
                    
                    <Link to="/auth?mode=signup" className="block mt-auto">
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
      <section className="py-16">
        <div className="container">
          <AnimatedSection animation="fadeUp" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Quem usa, <span className="text-primary">recomenda</span>
            </h2>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <AnimatedSection key={index} animation="fadeUp" delay={index * 100}>
                <Card className="overflow-hidden h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                    <p className="text-lg mb-6 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-bold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
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
              Dúvidas <span className="text-primary">Frequentes</span>
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
              Assuma o controle total do seu estoque e do seu dinheiro
            </h2>
            <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
              Chega de planilhas, papéis perdidos e furos de caixa. Comece agora, é grátis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?mode=signup">
                <Button size="lg" variant="default" className="gap-2 text-lg px-8 h-14">
                  Criar Conta Gratuita
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="secondary" className="gap-2 text-lg px-8 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white border-0">
                  <MessageCircle className="w-5 h-5" />
                  Falar no WhatsApp
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
              <span className="font-bold">Obra Certa</span>
            </div>
            
            <p className="text-sm opacity-60">
              © {new Date().getFullYear()} Obra Certa. Todos os direitos reservados.
            </p>
            
            <div className="flex gap-6">
              <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                Termos de Uso
              </a>
              <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                Privacidade
              </a>
              <a 
                href={WHATSAPP_LINK}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm opacity-60 hover:opacity-100 transition-opacity"
              >
                Suporte WhatsApp
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
