import { useTranslation } from 'react-i18next';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Shield, ShieldOff } from 'lucide-react';

interface ToggleAdminDialogProps { open: boolean; onOpenChange: (open: boolean) => void; userName: string; makeAdmin: boolean; onConfirm: () => void; isLoading: boolean; }

export function ToggleAdminDialog({ open, onOpenChange, userName, makeAdmin, onConfirm, isLoading }: ToggleAdminDialogProps) {
  const { t } = useTranslation();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {makeAdmin ? <Shield className="w-5 h-5 text-amber-500" /> : <ShieldOff className="w-5 h-5 text-muted-foreground" />}
            {makeAdmin ? t('admin.promoteAdmin') : t('admin.removeAdminTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {makeAdmin
              ? t('admin.promoteConfirm', { name: userName }).replace('<1>', '').replace('</1>', '')
              : t('admin.removeAdminConfirm', { name: userName }).replace('<1>', '').replace('</1>', '')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>{isLoading ? t('admin.processing') : t('common.confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
