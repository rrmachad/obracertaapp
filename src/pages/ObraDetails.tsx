import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Calendar, Package, ClipboardList, MoreVertical, Trash2, Pencil, Users, Home, ChevronRight, DollarSign, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useObra, useObras } from '@/hooks/useObras';
import { useToast } from '@/hooks/use-toast';
import { CronogramaTab } from '@/components/cronograma/CronogramaTab';
import { EstoqueTab } from '@/components/estoque/EstoqueTab';
import { DiarioTab } from '@/components/diario/DiarioTab';
import { FinanceiroTab } from '@/components/financeiro/FinanceiroTab';
import { EditarObraDialog } from '@/components/obras/EditarObraDialog';
import { GerenciarAcessosDialog } from '@/components/admin/GerenciarAcessosDialog';
import { UpgradePlanoDialog } from '@/components/admin/UpgradePlanoDialog';
import { PortalClienteDialog } from '@/components/obras/PortalClienteDialog';
import { FeatureBlockedOverlay } from '@/components/FeatureBlockedOverlay';
import { useObraAccess } from '@/hooks/useUserInvites';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { ObraStatus } from '@/types/database';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function ObraDetails() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: obra, isLoading, refetch } = useObra(id!);
  const { deleteObra, updateObra } = useObras();
  const { canManageUsers, isAdmin } = useObraAccess(id!);
  const { limits } = usePlanLimits();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [acessosDialogOpen, setAcessosDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [portalDialogOpen, setPortalDialogOpen] = useState(false);

  // Dynamic browser tab title with obra name
  useEffect(() => {
    if (obra) {
      document.title = `${t('brand.name')} - ${obra.nome}`;
    }
    return () => {
      document.title = `${t('brand.name')} - ${t('app.tagline')}`;
    };
  }, [obra, t, i18n.language]);
  const statusConfig: Record<ObraStatus, { label: string; className: string }> = {
    planejamento: { label: t('status.planning'), className: 'bg-muted text-muted-foreground' },
    em_andamento: { label: t('status.inProgress'), className: 'bg-primary text-primary-foreground' },
    concluida: { label: t('status.completed'), className: 'bg-success text-success-foreground' },
    pausada: { label: t('status.paused'), className: 'bg-warning text-warning-foreground' },
  };

  const handleDelete = async () => {
    if (!obra) return;
    if (!confirm(t('obra.deleteConfirm', { name: obra.nome }))) return;

    try {
      await deleteObra.mutateAsync(obra.id);
      toast({ title: t('obra.deleted'), description: obra.nome });
      navigate('/dashboard');
    } catch (error) {
      toast({ title: t('obra.deleteError'), description: t('obra.tryAgain'), variant: 'destructive' });
    }
  };

  const handleStatusChange = async (status: ObraStatus) => {
    if (!obra) return;
    try {
      await updateObra.mutateAsync({ id: obra.id, status });
      refetch();
      toast({ title: t('obra.statusUpdated'), description: statusConfig[status].label });
    } catch (error) {
      toast({ title: t('obra.updateError'), description: t('obra.tryAgain'), variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-lg text-muted-foreground mb-4">{t('obra.notFound')}</p>
        <Button onClick={() => navigate('/dashboard')}>{t('obra.backToHome')}</Button>
      </div>
    );
  }

  const status = statusConfig[obra.status];

  return (
    <div className="min-h-screen bg-background">
      {/* Header com foto */}
      <header className="relative">
        <div className="h-40 bg-muted">
          {obra.foto_capa ? (
            <img src={obra.foto_capa} alt={obra.nome} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30" />
          )}
        </div>

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <Button variant="default" size="icon" onClick={() => navigate('/dashboard')} className="bg-primary shadow-lg hover:bg-primary/90">
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </Button>

          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="ghost" className="bg-primary/80 text-primary-foreground shadow-lg hover:bg-primary/90" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="icon" className="bg-primary shadow-lg hover:bg-primary/90">
                  <MoreVertical className="w-5 h-5 text-primary-foreground" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Pencil className="w-4 h-4 mr-2" /> {t('obra.editWork')}
              </DropdownMenuItem>
              {canManageUsers && (
                <DropdownMenuItem onClick={() => setAcessosDialogOpen(true)}>
                  <Users className="w-4 h-4 mr-2" /> {t('obra.manageAccess')}
                </DropdownMenuItem>
              )}
              {limits.canAccessPortal && (
                <DropdownMenuItem onClick={() => setPortalDialogOpen(true)}>
                  <Share2 className="w-4 h-4 mr-2" /> {t('obra.clientPortal')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusChange('planejamento')}>{t('obra.markPlanning')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('em_andamento')}>{t('obra.markInProgress')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('pausada')}>{t('obra.pauseWork')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('concluida')}>{t('obra.markCompleted')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> {t('obra.deleteWork')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>

        <div className="container -mt-8 relative z-10">
          <div className="bg-card rounded-lg shadow-lg p-4 border">
            <div className="flex items-start justify-between mb-2">
              <h1 className="font-bold text-xl flex-1">{obra.nome}</h1>
              <Badge className={status.className}>{status.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{obra.endereco}</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('obra.overallProgress')}</span>
                <span className="font-bold text-primary">{obra.progresso}%</span>
              </div>
              <Progress value={obra.progresso} className="h-3" />
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav className="container py-3">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span>{t('breadcrumb.dashboard')}</span>
            </button>
          </li>
          <li><ChevronRight className="w-3.5 h-3.5" /></li>
          <li className="text-foreground font-medium truncate max-w-[200px]">{obra.nome}</li>
        </ol>
      </nav>

      {/* Tabs */}
      <main className="container pb-4">
        <Tabs defaultValue="cronograma" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-14">
            <TabsTrigger value="cronograma" className="flex flex-col gap-0.5 h-full">
              <ClipboardList className="w-5 h-5" />
              <span className="text-xs">{t('tabs.schedule')}</span>
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex flex-col gap-0.5 h-full">
              <DollarSign className="w-5 h-5" />
              <span className="text-xs">{t('tabs.financial')}</span>
            </TabsTrigger>
            <TabsTrigger value="estoque" className="flex flex-col gap-0.5 h-full">
              <Package className="w-5 h-5" />
              <span className="text-xs">{t('tabs.inventory')}</span>
            </TabsTrigger>
            <TabsTrigger value="diario" className="flex flex-col gap-0.5 h-full">
              <Calendar className="w-5 h-5" />
              <span className="text-xs">{t('tabs.diary')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cronograma" className="mt-4">
            <CronogramaTab obraId={obra.id} />
          </TabsContent>
          <TabsContent value="financeiro" className="mt-4">
            {limits.canAccessFinanceiro ? (
              <FinanceiroTab obraId={obra.id} retencaoPercentual={obra.retencao_tecnica_percentual ?? 5} obraNome={obra.nome} isAdmin={isAdmin} />
            ) : (
              <FeatureBlockedOverlay featureKey="financeiro" onUpgradeClick={() => setUpgradeDialogOpen(true)} />
            )}
          </TabsContent>
          <TabsContent value="estoque" className="mt-4">
            <EstoqueTab obraId={obra.id} sistemaMedidas={(obra as any).sistema_medidas ?? 'metrico'} onUpgradeClick={() => setUpgradeDialogOpen(true)} />
          </TabsContent>
          <TabsContent value="diario" className="mt-4">
            <DiarioTab obraId={obra.id} onUpgradeClick={() => setUpgradeDialogOpen(true)} />
          </TabsContent>
        </Tabs>
      </main>

      {obra && (
        <>
          <EditarObraDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} obra={obra} onSuccess={refetch} />
          <GerenciarAcessosDialog open={acessosDialogOpen} onOpenChange={setAcessosDialogOpen} obraId={obra.id} obraNome={obra.nome} />
          <UpgradePlanoDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} />
          <PortalClienteDialog
            open={portalDialogOpen}
            onOpenChange={setPortalDialogOpen}
            obraId={obra.id}
            obraNome={obra.nome}
            portalAtivo={(obra as any).portal_ativo ?? false}
            tokenPortal={(obra as any).token_portal ?? null}
            onSuccess={refetch}
          />
        </>
      )}
    </div>
  );
}
