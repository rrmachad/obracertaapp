import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Package, ClipboardList, MoreVertical, Trash2, Pencil, Users } from 'lucide-react';
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
import { EditarObraDialog } from '@/components/obras/EditarObraDialog';
import { GerenciarAcessosDialog } from '@/components/admin/GerenciarAcessosDialog';
import { UpgradePlanoDialog } from '@/components/admin/UpgradePlanoDialog';
import { useObraAccess } from '@/hooks/useUserInvites';
import { ObraStatus } from '@/types/database';

const statusConfig: Record<ObraStatus, { label: string; className: string }> = {
  planejamento: { label: 'Planejamento', className: 'bg-muted text-muted-foreground' },
  em_andamento: { label: 'Em Andamento', className: 'bg-primary text-primary-foreground' },
  concluida: { label: 'Concluída', className: 'bg-success text-success-foreground' },
  pausada: { label: 'Pausada', className: 'bg-warning text-warning-foreground' },
};

export function ObraDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: obra, isLoading, refetch } = useObra(id!);
  const { deleteObra, updateObra } = useObras();
  const { canManageUsers } = useObraAccess(id!);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [acessosDialogOpen, setAcessosDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!obra) return;
    if (!confirm(`Tem certeza que deseja excluir "${obra.nome}"? Esta ação não pode ser desfeita.`)) return;

    try {
      await deleteObra.mutateAsync(obra.id);
      toast({
        title: 'Obra excluída',
        description: obra.nome,
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (status: ObraStatus) => {
    if (!obra) return;
    try {
      await updateObra.mutateAsync({ id: obra.id, status });
      refetch();
      toast({
        title: 'Status atualizado',
        description: statusConfig[status].label,
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
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
        <p className="text-lg text-muted-foreground mb-4">Obra não encontrada</p>
        <Button onClick={() => navigate('/')}>Voltar ao início</Button>
      </div>
    );
  }

  const status = statusConfig[obra.status];

  return (
    <div className="min-h-screen bg-background">
      {/* Header com foto */}
      <header className="relative">
        {/* Foto de capa */}
        <div className="h-40 bg-muted">
          {obra.foto_capa ? (
            <img 
              src={obra.foto_capa} 
              alt={obra.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30" />
          )}
        </div>

        {/* Botões sobre a foto */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <Button
            variant="default"
            size="icon"
            onClick={() => navigate('/')}
            className="bg-primary shadow-lg hover:bg-primary/90"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="icon"
                className="bg-primary shadow-lg hover:bg-primary/90"
              >
                <MoreVertical className="w-5 h-5 text-primary-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar Obra
              </DropdownMenuItem>
              {canManageUsers && (
                <DropdownMenuItem onClick={() => setAcessosDialogOpen(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  Gerenciar Acessos
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusChange('planejamento')}>
                Marcar como Planejamento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('em_andamento')}>
                Marcar como Em Andamento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('pausada')}>
                Pausar Obra
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('concluida')}>
                Marcar como Concluída
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Obra
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Info da obra */}
        <div className="container -mt-8 relative z-10">
          <div className="bg-card rounded-lg shadow-lg p-4 border">
            <div className="flex items-start justify-between mb-2">
              <h1 className="font-bold text-xl flex-1">{obra.nome}</h1>
              <Badge className={status.className}>{status.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{obra.endereco}</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso geral</span>
                <span className="font-bold text-primary">{obra.progresso}%</span>
              </div>
              <Progress value={obra.progresso} className="h-3" />
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <main className="container py-4">
        <Tabs defaultValue="cronograma" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-14">
            <TabsTrigger value="cronograma" className="flex flex-col gap-0.5 h-full">
              <ClipboardList className="w-5 h-5" />
              <span className="text-xs">Cronograma</span>
            </TabsTrigger>
            <TabsTrigger value="estoque" className="flex flex-col gap-0.5 h-full">
              <Package className="w-5 h-5" />
              <span className="text-xs">Estoque</span>
            </TabsTrigger>
            <TabsTrigger value="diario" className="flex flex-col gap-0.5 h-full">
              <Calendar className="w-5 h-5" />
              <span className="text-xs">Diário</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cronograma" className="mt-4">
            <CronogramaTab obraId={obra.id} />
          </TabsContent>

          <TabsContent value="estoque" className="mt-4">
            <EstoqueTab obraId={obra.id} onUpgradeClick={() => setUpgradeDialogOpen(true)} />
          </TabsContent>

          <TabsContent value="diario" className="mt-4">
            <DiarioTab obraId={obra.id} onUpgradeClick={() => setUpgradeDialogOpen(true)} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog de edição */}
      {obra && (
        <>
          <EditarObraDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            obra={obra}
            onSuccess={refetch}
          />
          <GerenciarAcessosDialog
            open={acessosDialogOpen}
            onOpenChange={setAcessosDialogOpen}
            obraId={obra.id}
            obraNome={obra.nome}
          />
          <UpgradePlanoDialog
            open={upgradeDialogOpen}
            onOpenChange={setUpgradeDialogOpen}
          />
        </>
      )}
    </div>
  );
}
