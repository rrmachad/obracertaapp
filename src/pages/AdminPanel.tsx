import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeft, 
  RefreshCcw,
  Crown,
  LogOut,
  Settings,
  BarChart3,
  Building2,
  Clock,
  History,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StatsOverview } from '@/components/admin/StatsOverview';
import { ActivityChart } from '@/components/admin/ActivityChart';
import { RecentActivityList } from '@/components/admin/RecentActivityList';
import { ObraStatsList } from '@/components/admin/ObraStatsList';
import { ProfileSettings } from '@/components/admin/ProfileSettings';
import { PlanoResumoCard } from '@/components/admin/PlanoResumoCard';
import { UpgradePlanoDialog } from '@/components/admin/UpgradePlanoDialog';
import { AuditLogList } from '@/components/admin/AuditLogList';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { UserMetricsCards } from '@/components/admin/UserMetricsCards';
import { AdminActionLogList } from '@/components/admin/AdminActionLogList';
import { InviteHierarchyList } from '@/components/admin/InviteHierarchyList';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

export function AdminPanel() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { planName } = useSubscription();
  const { stats, obraStats, activityChart, recentActivity, isLoading, refetch } = useAdminStats();
  const { isAdmin, metrics, actionLogs, isLoadingUsers, isLoadingLogs, refetch: refetchUsers } = useAdminUsers();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const handleRefresh = () => {
    refetch();
    if (isAdmin) refetchUsers();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-secondary text-secondary-foreground shadow-md">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="text-secondary-foreground hover:bg-secondary-foreground/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-bold text-lg flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5" />
                  Painel Admin
                </h1>
                <p className="text-xs text-secondary-foreground/70">
                  Visão completa do seu negócio
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUpgradeDialogOpen(true)}
                className="text-secondary-foreground hover:bg-secondary-foreground/10 gap-1.5"
              >
                <Crown className="w-4 h-4" />
                <span className="hidden sm:inline">{planName}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className="text-secondary-foreground hover:bg-secondary-foreground/10"
                title="Atualizar dados"
              >
                <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-secondary-foreground hover:bg-secondary-foreground/10"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'} lg:w-auto lg:inline-flex`}>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="obras" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Obras</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Atividade</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Auditoria</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Usuários</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configurações</span>
            </TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <StatsOverview stats={stats} isLoading={isLoading} />
            
            <div className="grid md:grid-cols-2 gap-6">
              <ActivityChart data={activityChart} isLoading={isLoading} />
              <RecentActivityList activities={recentActivity} isLoading={isLoading} />
            </div>
          </TabsContent>

          {/* Obras */}
          <TabsContent value="obras" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <ObraStatsList obras={obraStats} isLoading={isLoading} />
              </div>
              <div>
                <PlanoResumoCard onUpgradeClick={() => setUpgradeDialogOpen(true)} />
              </div>
            </div>
          </TabsContent>

          {/* Atividade */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <ActivityChart data={activityChart} isLoading={isLoading} />
              </div>
              <div className="md:col-span-2">
                <RecentActivityList activities={recentActivity} isLoading={isLoading} />
              </div>
            </div>
          </TabsContent>

          {/* Auditoria */}
          <TabsContent value="audit" className="space-y-6">
            <AuditLogList />
          </TabsContent>

          {/* Usuários (apenas para admins) */}
          {isAdmin && (
            <TabsContent value="users" className="space-y-6">
              <UserMetricsCards metrics={metrics} isLoading={isLoadingUsers} />
              
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <UserManagementTable />
                </div>
                <div>
                  <AdminActionLogList logs={actionLogs} isLoading={isLoadingLogs} />
                </div>
              </div>

              <InviteHierarchyList />
            </TabsContent>
          )}

          {/* Configurações */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <ProfileSettings />
              <PlanoResumoCard onUpgradeClick={() => setUpgradeDialogOpen(true)} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <UpgradePlanoDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} />
    </div>
  );
}
