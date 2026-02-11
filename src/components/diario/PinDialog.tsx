import { useState } from 'react';
import { Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

interface PinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValidPin: () => void;
  validatePin: (pin: string) => boolean;
  mode: 'validate' | 'create' | 'change';
  onCreatePin?: (pin: string) => Promise<void>;
}

export function PinDialog({ open, onOpenChange, onValidPin, validatePin, mode, onCreatePin }: PinDialogProps) {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleValidate = () => {
    if (validatePin(pin)) { setError(''); setPin(''); onValidPin(); onOpenChange(false); }
    else { setError(t('dialogs.incorrectPin')); }
  };

  const handleCreate = async () => {
    if (pin.length < 4 || pin.length > 6) { setError(t('dialogs.pinLength')); return; }
    if (!/^\d+$/.test(pin)) { setError(t('dialogs.pinOnlyNumbers')); return; }
    if (pin !== confirmPin) { setError(t('dialogs.pinsMismatch')); return; }
    setLoading(true);
    try { await onCreatePin?.(pin); setPin(''); setConfirmPin(''); setError(''); onOpenChange(false); }
    catch { setError(t('dialogs.errorCreatingPin')); }
    finally { setLoading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); mode === 'validate' ? handleValidate() : handleCreate(); };
  const isCreateMode = mode === 'create' || mode === 'change';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCreateMode ? (<><KeyRound className="h-5 w-5 text-primary" />{mode === 'create' ? t('dialogs.createPin') : t('dialogs.changePin')}</>) : (<><Lock className="h-5 w-5 text-primary" />{t('dialogs.authRequired')}</>)}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode ? t('dialogs.pinCreateDesc') : t('dialogs.pinValidateDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">{isCreateMode ? t('dialogs.newPin') : 'PIN'}</Label>
            <div className="relative">
              <Input id="pin" type={showPin ? 'text' : 'password'} placeholder="••••••" value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                maxLength={6} className="pr-10 text-center text-xl tracking-widest" autoFocus />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPin(!showPin)}>
                {showPin ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>

          {isCreateMode && (
            <div className="space-y-2">
              <Label htmlFor="confirmPin">{t('dialogs.confirmPin')}</Label>
              <Input id="confirmPin" type={showPin ? 'text' : 'password'} placeholder="••••••" value={confirmPin}
                onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                maxLength={6} className="text-center text-xl tracking-widest" />
            </div>
          )}

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={loading || !pin}>
              {loading ? t('common.saving') : isCreateMode ? t('dialogs.savePin') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
