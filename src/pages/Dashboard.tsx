import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HardHat, Plus, LogOut, Search, Crown, Key, LayoutDashboard, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ObraCard } from '@/components/obras/ObraCard';
import { NovaObraDialog } from '@/components/obras/NovaObraDialog';
import { UpgradePlanoDialog } from '@/components/admin/UpgradePlanoDialog';
import { EntrarComPinDialog } from '@/components/admin/EntrarComPinDialog';
import { PlanoResumoCard } from '@/components/admin/PlanoResumoCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SuporteVipButton } from '@/components/SuporteVipButton';
import { useObras } from '@/hooks/useObras';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useEstoqueAlertas } from '@/hooks/useEstoqueAlertas';

export function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { obras, isLoading, isInvitedUser, ownerUserId } = useObras();
  const { signOut, user } = useAuth();
  const { planName, plan } = useSubscription(isInvitedUser ? ownerUserId : undefined);
  const { limits } = usePlanLimits();
  const { data: estoqueAlertas = {} } = useEstoqueAlertas(obras.map(o => o.id));
  const totalAlertas = Object.values(estoqueAlertas).reduce((acc, n) => acc + n, 0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredObras = obras.filter(obra =>
    obra.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obra.endereco.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-secondary text-secondary-foreground shadow-md">
        <div className="container py-3">
          {/* Linha 1: Logo + ações principais */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <HardHat className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-base leading-tight">{t('app.name')}</h1>
                <p className="text-[10px] text-secondary-foreground/70 hidden sm:block">{t('app.tagline')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isInvitedUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUpgradeDialogOpen(true)}
                  className="text-secondary-foreground hover:bg-secondary-foreground/10 gap-1 px-1.5 h-8"
                >
                  <Crown className="w-4 h-4 shrink-0" />
                  <Badge variant="outline" className="border-secondary-foreground/30 text-secondary-foreground text-[10px] px-1.5">
                    {planName}
                  </Badge>
                </Button>
              )}
              {isInvitedUser && (
                <Badge variant="outline" className="border-secondary-foreground/30 text-secondary-foreground text-[10px] px-1.5">
                  {t('nav.team')} · {planName}
                </Badge>
              )}
              <LanguageSwitcher variant="ghost" className="text-secondary-foreground hover:bg-secondary-foreground/10" />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-secondary-foreground hover:bg-secondary-foreground/10 w-8 h-8"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Linha 2: Ícones de navegação */}
          <div className="flex items-center gap-1 mt-2 -mb-1 overflow-x-auto">
            {!isInvitedUser && limits.canAccessCompras && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/compras')}
                className="text-secondary-foreground hover:bg-secondary-foreground/10 gap-1.5 h-8 px-2 shrink-0 text-xs"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden xs:inline">{t('nav.purchases')}</span>
              </Button>
            )}
            {!isInvitedUser && limits.canAccessDashboardLucratividade && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/lucratividade')}
                className="text-secondary-foreground hover:bg-secondary-foreground/10 gap-1.5 h-8 px-2 shrink-0 text-xs"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden xs:inline">{t('nav.profitability')}</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/estoque-alertas')}
              className="text-secondary-foreground hover:bg-secondary-foreground/10 gap-1.5 h-8 px-2 shrink-0 text-xs relative"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden xs:inline">Alertas</span>
              {totalAlertas > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {totalAlertas}
                </span>
              )}
            </Button>
            {!isInvitedUser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-secondary-foreground hover:bg-secondary-foreground/10 gap-1.5 h-8 px-2 shrink-0 text-xs"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden xs:inline">{t('nav.admin')}</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPinDialogOpen(true)}
              className="text-secondary-foreground hover:bg-secondary-foreground/10 gap-1.5 h-8 px-2 shrink-0 text-xs"
            >
              <Key className="w-4 h-4" />
              <span className="hidden xs:inline">{t('nav.pin')}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-4 pb-24">
        {/* Card de resumo do plano */}
        <PlanoResumoCard onUpgradeClick={() => setUpgradeDialogOpen(true)} ownerUserId={isInvitedUser ? ownerUserId : undefined} isInvitedUser={isInvitedUser} />

        {/* Barra de busca */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('dashboard.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Lista de obras */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredObras.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <HardHat className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {searchTerm ? t('dashboard.noWorksFound') : isInvitedUser ? t('dashboard.waitingAccess') : t('dashboard.noWorksRegistered')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? t('dashboard.tryAnotherSearch') : isInvitedUser ? t('dashboard.askOwner') : t('dashboard.startAdding')}
            </p>
            {!searchTerm && !isInvitedUser && (
              <Button onClick={() => setDialogOpen(true)} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                {t('dashboard.newWork')}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredObras.map((obra) => (
              <ObraCard key={obra.id} obra={obra} lowStockCount={estoqueAlertas[obra.id] ?? 0} />
            ))}
          </div>
        )}
      </main>

      {/* FAB - Botão flutuante */}
      {!isInvitedUser && (
        <Button
          onClick={() => setDialogOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg z-50"
          size="icon"
        >
          <Plus className="w-8 h-8" />
        </Button>
      )}

      <NovaObraDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onUpgradeClick={() => setUpgradeDialogOpen(true)}
      />
      <UpgradePlanoDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} />
      <EntrarComPinDialog open={pinDialogOpen} onOpenChange={setPinDialogOpen} />
      <SuporteVipButton />
    </div>
  );
}
