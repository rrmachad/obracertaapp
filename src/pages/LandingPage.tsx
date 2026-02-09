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
  Wifi,
  WifiOff,
  Hand,
  Hammer,
  ChevronDown
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

const painPoints = [
  {
    pain: 'Estoque furado e compras de emergência caras',
    solution: 'Controle exato de entrada e saída de materiais',
    painIcon: AlertTriangle,
    solutionIcon: Package,
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
    icon: DollarSign,
    title: 'Controle Financeiro',
    description: 'Saiba exatamente quanto já gastou em cada fase.',
  },
];

const plans = [
  {
    name: 'Iniciante',
    price: 'Grátis',
    period: '',
    description: 'Para testar o sistema',
    features: ['1 obra ativa', '10 registros de diário', 'Controle básico de estoque', '1 usuário'],
    cta: 'Comece sem pagar nada',
    popular: false,
  },
  {
    name: 'Profissional',
    price: 'R$ 29',
    period: ',90/mês',
    description: 'Para profissionais autônomos',
    features: ['Obras ilimitadas', 'Diários ilimitados', 'Estoque completo', '2 usuários', 'Relatórios PDF', 'Suporte por email'],
    cta: 'Escolher Profissional',
    popular: true,
  },
  {
    name: 'Construtora',
    price: 'R$ 59',
    period: ',90/mês',
    description: 'Para equipes e construtoras',
    features: ['Tudo do Profissional', 'Até 5 usuários', 'Acesso multi-usuário', 'Controle de permissões', 'Suporte prioritário'],
    cta: 'Escolher Construtora',
    popular: false,
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
    question: 'Preciso instalar algum programa?',
    answer: 'Não! O Obra Certa funciona direto no navegador do celular ou computador. Basta acessar, criar sua conta e começar.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim, sem burocracia. Você pode cancelar sua assinatura quando quiser, sem taxa de cancelamento.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
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
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-6 gap-2 px-4 py-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                +500 obras gerenciadas
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                Pare de Jogar Dinheiro Fora no{' '}
                <span className="text-primary">Canteiro de Obras</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                A ferramenta mais simples para gerenciar estoque, controlar o cronograma e 
                profissionalizar sua construtora. Do <strong>"Minha Casa Minha Vida"</strong> ao <strong>Alto Padrão</strong>.
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
            </div>
            
            {/* App Mockup */}
            <div className="relative mx-auto lg:mx-0">
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
            </div>
          </div>
        </div>
      </section>

      {/* Pain vs Solution Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Sua obra não precisa ser uma <span className="text-primary">dor de cabeça</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Chega de estresse. Veja como o Obra Certa transforma seu dia a dia.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((item, index) => (
              <Card key={index} className="overflow-hidden">
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
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="como-funciona" className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para usar em <span className="text-primary">3 passos</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Sem complicação. Sem treinamento. É só começar.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa, <span className="text-primary">nada que não precisa</span>
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planos que cabem no seu <span className="text-primary">bolso</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Comece grátis. Cresça quando precisar.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.popular ? 'border-2 border-primary shadow-xl scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Mais Escolhido
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6 pt-8">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                  
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/auth?mode=signup" className="block">
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? 'default' : 'outline'}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Quem usa, <span className="text-primary">recomenda</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="overflow-hidden">
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
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Dúvidas <span className="text-primary">Frequentes</span>
            </h2>
          </div>
          
          <div className="max-w-2xl mx-auto">
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
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-secondary text-secondary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tome o controle da sua construtora hoje
          </h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Chega de planilhas, papéis perdidos e estresse. Comece agora, é grátis.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" variant="default" className="gap-2 text-lg px-8 h-14">
              Criar Conta Gratuita
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
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
                href="https://wa.me/5500000000000" 
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
