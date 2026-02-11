import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteUserDialogProps { open: boolean; onOpenChange: (open: boolean) => void; userName: string; userEmail: string | null; onConfirm: () => void; isLoading: boolean; }

export function DeleteUserDialog({ open, onOpenChange, userName, userEmail, onConfirm, isLoading }: DeleteUserDialogProps) {
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState('');
  const confirmationWord = t('admin.confirmWord');
  const isConfirmed = confirmText === confirmationWord;
  const handleOpenChange = (newOpen: boolean) => { if (!newOpen) setConfirmText(''); onOpenChange(newOpen); };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" />{t('admin.deleteUserTitle')}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>{t('admin.deleteUserAbout')}</p>
              <div className="bg-muted p-3 rounded-md"><p className="font-medium">{userName}</p><p className="text-sm text-muted-foreground">{userEmail || t('admin.emailNotRegistered')}</p></div>
              <p className="text-destructive font-medium">{t('admin.deleteIrreversible')}</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>{t('admin.deleteAllWorks')}</li><li>{t('admin.deleteAllDiaries')}</li><li>{t('admin.deleteAllMaterials')}</li><li>{t('admin.deleteAllSchedule')}</li><li>{t('admin.deleteAccount')}</li>
              </ul>
              <div className="pt-2">
                <Label htmlFor="confirm-text">{t('admin.typeToConfirm', { word: confirmationWord }).replace('<1>', '').replace('</1>', '')}</Label>
                <Input id="confirm-text" value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} placeholder={confirmationWord} className="mt-2" disabled={isLoading} />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); onConfirm(); }} disabled={!isConfirmed || isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('admin.deleting')}</>) : t('admin.deleteUser')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
