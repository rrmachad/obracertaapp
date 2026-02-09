import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Crown, User, ChevronDown, ChevronRight, Trash2, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface InvitedUser {
  access_id: string;
  user_id: string;
  nome: string;
  email: string | null;
  role: string;
  obra_nome: string;
  obra_id: string;
  created_at: string;
}

interface LicenseOwner {
  user_id: string;
  nome: string;
  email: string | null;
  plan: string | null;
  invited_users: InvitedUser[];
}

export function InviteHierarchyList() {
  const { toast } = useToast();
  const [expandedOwners, setExpandedOwners] = useState<Set<string>>(new Set());

  const { data: hierarchy, isLoading, refetch } = useQuery({
    queryKey: ['admin-invite-hierarchy'],
    queryFn: async () => {
      // Fetch all obra_access records with granted_by
      const { data: accessRecords, error: accessError } = await supabase
        .from('obra_access')
        .select('*')
        .order('created_at', { ascending: false });

      if (accessError) throw accessError;

      // Get all unique user IDs (invited users + granted_by)
      const allUserIds = [
        ...new Set([
          ...(accessRecords || []).map(a => a.user_id),
          ...(accessRecords || []).filter(a => a.granted_by).map(a => a.granted_by!),
        ])
      ];

      if (allUserIds.length === 0) return [];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nome, email');

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Fetch subscriptions for license owners
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('user_id, plan');

      const subMap = new Map(subscriptions?.map(s => [s.user_id, s.plan]) || []);

      // Fetch obra names
      const obraIds = [...new Set((accessRecords || []).map(a => a.obra_id))];
      const { data: obras } = await supabase
        .from('obras')
        .select('id, nome, user_id')
        .in('id', obraIds);

      const obraMap = new Map(obras?.map(o => [o.id, o]) || []);

      // Group invited users by license owner (granted_by or obra owner)
      const ownerMap = new Map<string, LicenseOwner>();

      for (const access of accessRecords || []) {
        const obra = obraMap.get(access.obra_id);
        const ownerId = access.granted_by || obra?.user_id;
        if (!ownerId) continue;

        // Skip if the access record is for the owner themselves
        if (access.user_id === ownerId) continue;

        if (!ownerMap.has(ownerId)) {
          const ownerProfile = profileMap.get(ownerId);
          ownerMap.set(ownerId, {
            user_id: ownerId,
            nome: ownerProfile?.nome || 'Desconhecido',
            email: ownerProfile?.email || null,
            plan: subMap.get(ownerId) || 'free',
            invited_users: [],
          });
        }

        const invitedProfile = profileMap.get(access.user_id);
        ownerMap.get(ownerId)!.invited_users.push({
          access_id: access.id,
          user_id: access.user_id,
          nome: invitedProfile?.nome || 'Sem nome',
          email: invitedProfile?.email || null,
          role: access.role,
          obra_nome: obra?.nome || 'Obra desconhecida',
          obra_id: access.obra_id,
          created_at: access.created_at,
        });
      }

      return Array.from(ownerMap.values()).sort((a, b) => b.invited_users.length - a.invited_users.length);
    },
  });

  const toggleOwner = (ownerId: string) => {
    setExpandedOwners(prev => {
      const next = new Set(prev);
      if (next.has(ownerId)) next.delete(ownerId);
      else next.add(ownerId);
      return next;
    });
  };

  const handleRevokeAccess = async (accessId: string) => {
    if (!confirm('Tem certeza que deseja revogar este acesso?')) return;
    const { error } = await supabase.from('obra_access').delete().eq('id', accessId);
    if (error) {
      toast({ title: 'Erro ao revogar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Acesso revogado' });
      refetch();
    }
  };

  const planNames: Record<string, string> = {
    free: 'Iniciante',
    start: 'Profissional',
    gold: 'Construtora',
    premium: 'Empresarial',
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hierarquia de Convites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Convidados por Dono de Licença
        </CardTitle>
        <CardDescription>
          Visualize e gerencie os usuários convidados agrupados pelo proprietário da licença.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(!hierarchy || hierarchy.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum convite registrado ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {hierarchy.map((owner) => (
              <Collapsible
                key={owner.user_id}
                open={expandedOwners.has(owner.user_id)}
                onOpenChange={() => toggleOwner(owner.user_id)}
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg border hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <Crown className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium text-sm">{owner.nome}</p>
                        {owner.email && (
                          <p className="text-xs text-muted-foreground">{owner.email}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {planNames[owner.plan || 'free']}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {owner.invited_users.length} convidado{owner.invited_users.length !== 1 ? 's' : ''}
                      </Badge>
                      {expandedOwners.has(owner.user_id) ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-6 mt-2 space-y-2 border-l-2 border-primary/20 pl-4">
                    {owner.invited_users.map((invited) => (
                      <div
                        key={invited.access_id}
                        className="flex items-center justify-between p-2.5 rounded-lg border bg-background"
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{invited.nome}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {invited.email && <span>{invited.email}</span>}
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {invited.obra_nome}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {invited.role}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevokeAccess(invited.access_id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}