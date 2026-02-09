import { useState } from 'react';
import { Users, Plus, Copy, Trash2, Shield, User, Check, Crown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUserInvites, AppRole } from '@/hooks/useUserInvites';
import { useSubscription } from '@/hooks/useSubscription';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GerenciarAcessosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obraId: string;
  obraNome: string;
}

export function GerenciarAcessosDialog({
  open,
  onOpenChange,
  obraId,
  obraNome,
}: GerenciarAcessosDialogProps) {
  const { toast } = useToast();
  const { invites, accessList, createInvite, cancelInvite, revokeAccess, updateAccessRole, isLoading } = useUserInvites(obraId);
  const { plan, planName, maxUsers } = useSubscription();
  const [newRole, setNewRole] = useState<AppRole>('user');
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  const totalUsers = accessList.length + 1; // +1 para o dono
  const canAddMoreUsers = totalUsers < maxUsers;
  const pendingInvites = invites.length;

  const handleCreateInvite = async () => {
    if (!canAddMoreUsers) {
      toast({
        title: 'Limite de usuários atingido',
        description: `Seu plano ${planName} permite apenas ${maxUsers} usuário(s). Faça upgrade para adicionar mais.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const invite = await createInvite.mutateAsync(newRole);
      toast({
        title: 'Convite criado!',
        description: `PIN: ${invite.pin_code} - Compartilhe com o usuário`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao criar convite',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    toast({
      title: 'PIN copiado!',
      description: 'Compartilhe com o usuário para dar acesso.',
    });
    setTimeout(() => setCopiedPin(null), 2000);
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInvite.mutateAsync(inviteId);
      toast({
        title: 'Convite cancelado',
      });
    } catch (error) {
      toast({
        title: 'Erro ao cancelar',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    if (!confirm('Tem certeza que deseja remover o acesso deste usuário?')) return;
    
    try {
      await revokeAccess.mutateAsync(accessId);
      toast({ title: 'Acesso revogado' });
    } catch (error) {
      toast({ title: 'Erro ao revogar acesso', variant: 'destructive' });
    }
  };

  const handleChangeRole = async (accessId: string, role: AppRole) => {
    try {
      await updateAccessRole.mutateAsync({ accessId, role });
      toast({ title: 'Permissão atualizada' });
    } catch (error) {
      toast({ title: 'Erro ao alterar permissão', variant: 'destructive' });
    }
  };

  const getRoleIcon = (role: AppRole) => {
    return role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  const getRoleBadgeClass = (role: AppRole) => {
    return role === 'admin' 
      ? 'bg-primary text-primary-foreground' 
      : 'bg-muted text-muted-foreground';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gerenciar Acessos
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{obraNome}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info do plano */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>Plano: <strong>{planName}</strong></span>
              <span>{totalUsers}/{maxUsers} usuários</span>
            </div>
            {!canAddMoreUsers && (
              <p className="text-xs text-warning mt-1">
                Limite atingido. Faça upgrade para adicionar mais usuários.
              </p>
            )}
          </div>

          {/* Criar novo convite */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Criar Novo Convite</h3>
            <div className="flex gap-2">
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Usuário</span>
                    </div>
                  </SelectItem>
                  {plan === 'premium' && (
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span>Admin</span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleCreateInvite}
                disabled={!canAddMoreUsers || createInvite.isPending}
              >
                <Plus className="w-4 h-4 mr-1" />
                Gerar PIN
              </Button>
            </div>
            {plan !== 'premium' && (
              <p className="text-xs text-muted-foreground">
                Upgrade para Premium para criar convites de Admin.
              </p>
            )}
          </div>

          {/* Convites pendentes */}
          {pendingInvites > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Convites Pendentes ({pendingInvites})</h3>
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div 
                    key={invite.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={getRoleBadgeClass(invite.role)}>
                        {getRoleIcon(invite.role)}
                        <span className="ml-1 capitalize">{invite.role}</span>
                      </Badge>
                      <code className="text-lg font-mono font-bold tracking-wider">
                        {invite.pin_code}
                      </code>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyPin(invite.pin_code)}
                      >
                        {copiedPin === invite.pin_code ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancelInvite(invite.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Compartilhe o PIN com o usuário. Ele será válido até ser utilizado.
              </p>
            </div>
          )}

          {/* Usuários com acesso */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Usuários com Acesso</h3>
            <div className="space-y-2">
              {/* Dono da obra */}
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-primary" />
                  <span className="font-medium">Você (Proprietário)</span>
                </div>
                <Badge className="bg-primary text-primary-foreground">
                  Admin
                </Badge>
              </div>
              
              {accessList.map((access) => (
                <div 
                  key={access.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getRoleIcon(access.role)}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {access.user_nome || 'Usuário convidado'}
                      </span>
                      {access.user_email && (
                        <span className="text-xs text-muted-foreground truncate">{access.user_email}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={access.role}
                      onValueChange={(v) => handleChangeRole(access.id, v as AppRole)}
                    >
                      <SelectTrigger className="w-[110px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>Usuário</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            <span>Admin</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevokeAccess(access.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {accessList.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum usuário convidado ainda
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
