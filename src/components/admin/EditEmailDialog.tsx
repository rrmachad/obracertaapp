import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditEmailDialogProps { open: boolean; onOpenChange: (open: boolean) => void; currentEmail: string | null; userName: string; onSave: (email: string) => void; isLoading?: boolean; }

export function EditEmailDialog({ open, onOpenChange, currentEmail, userName, onSave, isLoading = false }: EditEmailDialogProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState(currentEmail || '');
  const [error, setError] = useState<string | null>(null);

  const emailSchema = z.string().trim().email({ message: t('admin.invalidEmail') }).max(255, { message: t('admin.emailTooLong') });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setError(null); const result = emailSchema.safeParse(email); if (!result.success) { setError(result.error.errors[0].message); return; } onSave(result.data); };
  const handleOpenChange = (newOpen: boolean) => { if (!newOpen) { setEmail(currentEmail || ''); setError(null); } onOpenChange(newOpen); };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="w-5 h-5" />{t('admin.editEmailTitle')}</DialogTitle>
          <DialogDescription>{t('admin.editEmailDesc', { name: userName }).replace('<1>', '').replace('</1>', '')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('admin.newEmail')}</Label>
              <Input id="email" type="email" placeholder={t('admin.newEmailPlaceholder')} value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} className={error ? 'border-destructive' : ''} />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? t('common.saving') : t('common.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
