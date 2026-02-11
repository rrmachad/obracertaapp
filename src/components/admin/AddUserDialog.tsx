import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { email: string; password: string; nome: string; plan: 'free' | 'start' | 'gold' | 'premium' }) => void;
  isLoading: boolean;
}

export function AddUserDialog({ open, onOpenChange, onSave, isLoading }: AddUserDialogProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [plan, setPlan] = useState<'free' | 'start' | 'gold' | 'premium'>('free');

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (email.trim() && password.trim() && nome.trim()) onSave({ email: email.trim(), password, nome: nome.trim(), plan }); };
  const handleClose = () => { if (!isLoading) { setEmail(''); setPassword(''); setNome(''); setPlan('free'); onOpenChange(false); } };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" />{t('admin.addNewUser')}</DialogTitle>
          <DialogDescription>{t('admin.addUserDesc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="nome">{t('admin.fullName')}</Label><Input id="nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder={t('admin.namePlaceholder')} required disabled={isLoading} /></div>
          <div className="space-y-2"><Label htmlFor="email">{t('admin.emailLabel')}</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('admin.emailPlaceholder')} required disabled={isLoading} /></div>
          <div className="space-y-2"><Label htmlFor="password">{t('admin.passwordLabel')}</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('admin.passwordPlaceholder')} minLength={6} required disabled={isLoading} /></div>
          <div className="space-y-2">
            <Label htmlFor="plan">{t('admin.planLabel')}</Label>
            <Select value={plan} onValueChange={(v: 'free' | 'start' | 'gold' | 'premium') => setPlan(v)} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder={t('admin.selectPlan')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free">{t('admin.planFree')}</SelectItem>
                <SelectItem value="start">{t('admin.planPro')}</SelectItem>
                <SelectItem value="gold">{t('admin.planBuilder')}</SelectItem>
                <SelectItem value="premium">{t('admin.planEnterprise')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('admin.creating')}</>) : t('admin.createUser')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
