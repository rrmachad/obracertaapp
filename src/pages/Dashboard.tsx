import { useState } from 'react';
import { HardHat, Plus, LogOut, Search, Crown, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ObraCard } from '@/components/obras/ObraCard';
import { NovaObraDialog } from '@/components/obras/NovaObraDialog';
import { UpgradePlanoDialog } from '@/components/admin/UpgradePlanoDialog';
import { EntrarComPinDialog } from '@/components/admin/EntrarComPinDialog';
import { PlanoResumoCard } from '@/components/admin/PlanoResumoCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useObras } from '@/hooks/useObras';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

export function Dashboard() {
  const { obras, isLoading } = useObras();
  const { signOut, user } = useAuth();
  const { planName, plan } = useSubscription();
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
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <HardHat className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Obra Certa</h1>
                <p className="text-xs text-secondary-foreground/70">Gestão de Obras Descomplicada</p>
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
                <Badge variant="outline" className="border-secondary-foreground/30 text-secondary-foreground">
                  {planName}
                </Badge>
              </Button>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPinDialogOpen(true)}
                className="text-secondary-foreground hover:bg-secondary-foreground/10"
                title="Entrar com PIN"
              >
                <Key className="w-5 h-5" />
              </Button>
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

      <main className="container py-4 pb-24">
        {/* Card de resumo do plano */}
        <PlanoResumoCard onUpgradeClick={() => setUpgradeDialogOpen(true)} />

        {/* Barra de busca */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar obras..."
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
              {searchTerm ? 'Nenhuma obra encontrada' : 'Nenhuma obra cadastrada'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Tente outro termo de busca' : 'Comece adicionando sua primeira obra'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setDialogOpen(true)} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Nova Obra
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredObras.map((obra) => (
              <ObraCard key={obra.id} obra={obra} />
            ))}
          </div>
        )}
      </main>

      {/* FAB - Botão flutuante */}
      <Button
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Plus className="w-8 h-8" />
      </Button>

      <NovaObraDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onUpgradeClick={() => setUpgradeDialogOpen(true)}
      />
      <UpgradePlanoDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} />
      <EntrarComPinDialog open={pinDialogOpen} onOpenChange={setPinDialogOpen} />
    </div>
  );
}
