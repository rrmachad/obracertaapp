import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle, 
  Building2, 
  ClipboardList, 
  Package, 
  BarChart3,
  Shield,
  Users,
  Smartphone,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';

const features = [
  {
    icon: ClipboardList,
    title: 'Diário de Obra Digital',
    description: 'Registre atividades, clima, equipe e fotos diariamente. Gere relatórios PDF profissionais com um clique.',
  },
  {
    icon: Package,
    title: 'Controle de Estoque',
    description: 'Gerencie materiais, entradas e saídas. Receba alertas de estoque baixo e evite paradas na obra.',
  },
  {
    icon: BarChart3,
    title: 'Cronograma Visual',
    description: 'Acompanhe o progresso de cada etapa da obra. Visualize fases concluídas e pendentes em tempo real.',
  },
  {
    icon: Users,
    title: 'Gestão de Equipe',
    description: 'Convide colaboradores com diferentes níveis de acesso. Controle quem pode ver e editar cada obra.',
  },
  {
    icon: Shield,
    title: 'Segurança com PIN',
    description: 'Proteja edições de registros antigos com PIN. Mantenha a integridade dos dados da obra.',
  },
  {
    icon: Smartphone,
    title: '100% Responsivo',
    description: 'Use no canteiro de obras pelo celular ou no escritório pelo computador. Sempre sincronizado.',
  },
];

const plans = [
  {
    name: 'Iniciante',
    price: 'Grátis',
    description: 'Para começar a organizar suas obras',
    features: ['1 obra ativa', '10 diários por obra', '10 materiais no estoque', '1 usuário'],
    popular: false,
  },
  {
    name: 'Profissional',
    price: 'R$ 49',
    period: '/mês',
    description: 'Para profissionais autônomos',
    features: ['Obras ilimitadas', 'Diários ilimitados', 'Estoque ilimitado', '2 usuários', 'Relatórios PDF'],
    popular: false,
  },
  {
    name: 'Construtora',
    price: 'R$ 99',
    period: '/mês',
    description: 'Para pequenas construtoras',
    features: ['Obras ilimitadas', 'Diários ilimitados', 'Estoque ilimitado', '3 usuários', 'Relatórios PDF', 'Suporte prioritário'],
    popular: true,
  },
  {
    name: 'Empresarial',
    price: 'R$ 199',
    period: '/mês',
    description: 'Para empresas em crescimento',
    features: ['Obras ilimitadas', 'Diários ilimitados', 'Estoque ilimitado', '5 usuários', 'Relatórios PDF', 'Suporte dedicado'],
    popular: false,
  },
];

const testimonials = [
  {
    name: 'Carlos Silva',
    role: 'Engenheiro Civil',
    content: 'O Obra Certa revolucionou a forma como gerencio minhas obras. Agora tenho tudo na palma da mão.',
    rating: 5,
  },
  {
    name: 'Ana Rodrigues',
    role: 'Arquiteta',
    content: 'Finalmente um sistema simples e eficiente. Meus clientes adoram receber os relatórios profissionais.',
    rating: 5,
  },
  {
    name: 'Roberto Oliveira',
    role: 'Mestre de Obras',
    content: 'Uso direto no canteiro pelo celular. Nunca mais esqueci de registrar uma entrega de material.',
    rating: 5,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">Obra Certa</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Depoimentos
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="gap-2">
                Começar Grátis
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-current" />
              Mais de 500 obras gerenciadas
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Gerencie suas obras com{' '}
              <span className="text-primary">precisão e simplicidade</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Diário de obra digital, controle de estoque e cronograma em um só lugar. 
              Tudo que você precisa para manter suas obras organizadas e profissionais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="gap-2 text-lg px-8">
                  Começar Grátis
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Conhecer Recursos
                </Button>
              </a>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              ✓ Sem cartão de crédito &nbsp; ✓ Configuração em 2 minutos &nbsp; ✓ Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para gerenciar obras
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas profissionais pensadas para engenheiros, arquitetos e construtores
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planos para cada tamanho de operação
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comece grátis e evolua conforme sua necessidade
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : 'border'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Mais Popular
                    </span>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
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
                  <Link to="/auth?mode=signup">
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.price === 'Grátis' ? 'Começar Grátis' : 'Escolher Plano'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Profissionais da construção civil confiam no Obra Certa
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center bg-primary rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Pronto para organizar suas obras?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Comece gratuitamente hoje e veja a diferença na gestão dos seus projetos.
            </p>
            <Link to="/auth?mode=signup">
              <Button size="lg" variant="secondary" className="gap-2 text-lg px-8">
                Criar Conta Grátis
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              <span className="font-semibold">Obra Certa</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Obra Certa. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacidade
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
