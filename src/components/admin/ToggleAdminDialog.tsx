import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Shield, ShieldOff } from 'lucide-react';

interface ToggleAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  makeAdmin: boolean;
  onConfirm: () => void;
  isLoading: boolean;
}

export function ToggleAdminDialog({
  open,
  onOpenChange,
  userName,
  makeAdmin,
  onConfirm,
  isLoading,
}: ToggleAdminDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {makeAdmin ? (
              <Shield className="w-5 h-5 text-amber-500" />
            ) : (
              <ShieldOff className="w-5 h-5 text-muted-foreground" />
            )}
            {makeAdmin ? 'Promover a Administrador' : 'Remover Administrador'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {makeAdmin ? (
              <>
                Tem certeza que deseja promover <strong>{userName}</strong> a administrador?
                Essa pessoa terá acesso total ao painel administrativo, incluindo gestão de usuários, planos e dados do sistema.
              </>
            ) : (
              <>
                Tem certeza que deseja remover o acesso de administrador de <strong>{userName}</strong>?
                Essa pessoa perderá acesso ao painel administrativo e só poderá visualizar suas próprias obras.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processando...' : 'Confirmar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
