import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Crown, 
  Ban, 
  Shield, 
  History,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminActionLog } from '@/hooks/useAdminUsers';

interface AdminActionLogListProps {
  logs: AdminActionLog[];
  isLoading?: boolean;
}

const actionIcons: Record<string, React.ReactNode> = {
  change_plan: <Crown className="w-4 h-4" />,
  toggle_block: <Ban className="w-4 h-4" />,
  toggle_admin: <Shield className="w-4 h-4" />,
};

const actionLabels: Record<string, string> = {
  change_plan: 'Alterou plano',
  toggle_block: 'Bloqueio/Desbloqueio',
  toggle_admin: 'Alterou admin',
};

function formatActionDetails(actionType: string, details: Record<string, unknown> | null): string {
  if (!details) return '';
  
  switch (actionType) {
    case 'change_plan':
      return `${details.from || '?'} → ${details.to || '?'}`;
    case 'toggle_block':
      return details.blocked ? 'Bloqueado' : 'Desbloqueado';
    case 'toggle_admin':
      return details.made_admin ? 'Promovido a admin' : 'Removido de admin';
    default:
      return JSON.stringify(details);
  }
}

export function AdminActionLogList({ logs, isLoading }: AdminActionLogListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Log de Ações</CardTitle>
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
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Log de Ações Administrativas
        </CardTitle>
        <CardDescription>
          Últimas {logs.length} ações realizadas por administradores
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma ação registrada ainda</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    {actionIcons[log.action_type] || <History className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{log.admin_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {actionLabels[log.action_type] || log.action_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Usuário: <span className="font-medium">{log.target_name}</span>
                      {log.action_details && (
                        <span className="ml-2">
                          ({formatActionDetails(log.action_type, log.action_details)})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
