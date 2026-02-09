import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userEmail: string | null;
  onConfirm: () => void;
  isLoading: boolean;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  userName,
  userEmail,
  onConfirm,
  isLoading,
}: DeleteUserDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  
  const confirmationWord = 'EXCLUIR';
  const isConfirmed = confirmText === confirmationWord;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText('');
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Excluir Usuário Permanentemente
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Você está prestes a excluir permanentemente o usuário:
              </p>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-medium">{userName}</p>
                <p className="text-sm text-muted-foreground">{userEmail || 'Email não cadastrado'}</p>
              </div>
              <p className="text-destructive font-medium">
                Esta ação é irreversível e irá:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Excluir todas as obras criadas pelo usuário</li>
                <li>Excluir todos os diários de obra</li>
                <li>Excluir todos os materiais e movimentações de estoque</li>
                <li>Excluir todos os itens de cronograma</li>
                <li>Remover a conta do usuário permanentemente</li>
              </ul>
              <div className="pt-2">
                <Label htmlFor="confirm-text">
                  Digite <span className="font-bold">{confirmationWord}</span> para confirmar:
                </Label>
                <Input
                  id="confirm-text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder={confirmationWord}
                  className="mt-2"
                  disabled={isLoading}
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={!isConfirmed || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir Usuário'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
