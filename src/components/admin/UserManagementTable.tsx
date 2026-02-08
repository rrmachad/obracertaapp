import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MoreHorizontal, 
  Shield, 
  ShieldOff, 
  Ban, 
  CheckCircle,
  Building2,
  Crown,
  User,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminUsers, AdminUser } from '@/hooks/useAdminUsers';
import { useAuth } from '@/hooks/useAuth';

const planColors: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  start: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  gold: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  premium: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
};

const planNames: Record<string, string> = {
  free: 'Free',
  start: 'Start',
  gold: 'Gold',
  premium: 'Premium',
};

export function UserManagementTable() {
  const { user: currentUser } = useAuth();
  const { 
    users, 
    isLoadingUsers, 
    updatePlan, 
    toggleBlock, 
    toggleAdmin,
    isUpdatingPlan,
    isTogglingBlock,
    isTogglingAdmin
  } = useAdminUsers();
  
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.empresa?.toLowerCase().includes(search.toLowerCase())
  );

  const handleChangePlan = (user: AdminUser, plan: 'free' | 'start' | 'gold' | 'premium') => {
    updatePlan({ userId: user.user_id, plan, previousPlan: user.plan || 'free' });
  };

  const handleToggleBlock = (user: AdminUser) => {
    toggleBlock({ userId: user.user_id, blocked: !user.blocked });
  };

  const handleToggleAdmin = (user: AdminUser) => {
    toggleAdmin({ userId: user.user_id, makeAdmin: user.role !== 'admin' });
  };

  if (isLoadingUsers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Usuários</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Gestão de Usuários
            </CardTitle>
            <CardDescription>
              {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="hidden md:table-cell">Obras</TableHead>
                <TableHead className="hidden md:table-cell">Cadastro</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className={user.blocked ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.nome}</span>
                          {user.role === 'admin' && (
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {user.email || 'Email não cadastrado'}
                        </span>
                        {user.empresa && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            {user.empresa}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={planColors[user.plan || 'free']}
                      >
                        {planNames[user.plan || 'free']}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm">{user.total_obras}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {user.blocked ? (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="w-3 h-3" />
                          Bloqueado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Ativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            disabled={isUpdatingPlan || isTogglingBlock || isTogglingAdmin}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Crown className="w-4 h-4 mr-2" />
                              Alterar Plano
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem 
                                onClick={() => handleChangePlan(user, 'free')}
                                disabled={user.plan === 'free'}
                              >
                                Free
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleChangePlan(user, 'start')}
                                disabled={user.plan === 'start'}
                              >
                                Start
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleChangePlan(user, 'gold')}
                                disabled={user.plan === 'gold'}
                              >
                                Gold
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleChangePlan(user, 'premium')}
                                disabled={user.plan === 'premium'}
                              >
                                Premium
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          {user.user_id !== currentUser?.id && (
                            <>
                              <DropdownMenuItem onClick={() => handleToggleAdmin(user)}>
                                {user.role === 'admin' ? (
                                  <>
                                    <ShieldOff className="w-4 h-4 mr-2" />
                                    Remover Admin
                                  </>
                                ) : (
                                  <>
                                    <Shield className="w-4 h-4 mr-2" />
                                    Tornar Admin
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem 
                                onClick={() => handleToggleBlock(user)}
                                className={user.blocked ? '' : 'text-destructive'}
                              >
                                {user.blocked ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Desbloquear
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-4 h-4 mr-2" />
                                    Bloquear
                                  </>
                                )}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
