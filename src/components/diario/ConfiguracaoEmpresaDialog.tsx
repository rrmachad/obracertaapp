import { useState } from 'react';
import { Upload, Building2, Loader2, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface ConfiguracaoEmpresaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfiguracaoEmpresaDialog({ open, onOpenChange }: ConfiguracaoEmpresaDialogProps) {
  const { t } = useTranslation();
  const { settings, updateSettings, uploadLogo, isLoading } = useUserSettings();
  const { toast } = useToast();
  
  const [empresaNome, setEmpresaNome] = useState(settings?.empresa_nome || '');
  const [logoPreview, setLogoPreview] = useState<string | null>(settings?.empresa_logo_url || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useState(() => {
    if (settings) {
      setEmpresaNome(settings.empresa_nome || '');
      setLogoPreview(settings.empresa_logo_url || null);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: t('dialogs.fileTooLarge'), description: t('dialogs.fileTooLargeDesc'), variant: 'destructive' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({ title: t('dialogs.invalidFormat'), description: t('dialogs.selectImage'), variant: 'destructive' });
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => { setLogoPreview(event.target?.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => { setLogoFile(null); setLogoPreview(null); };

  const handleSave = async () => {
    setSaving(true);
    try {
      let logoUrl = logoPreview;
      if (logoFile) { logoUrl = await uploadLogo(logoFile); }
      await updateSettings.mutateAsync({ empresa_nome: empresaNome.trim() || undefined, empresa_logo_url: logoUrl || undefined });
      toast({ title: t('dialogs.configSaved'), description: t('dialogs.configSavedDesc') });
      onOpenChange(false);
    } catch {
      toast({ title: t('common.error'), description: t('common.tryAgain'), variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {t('dialogs.companyConfig')}
          </DialogTitle>
          <DialogDescription>{t('dialogs.companyConfigDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>{t('dialogs.companyLogo')}</Label>
            {logoPreview ? (
              <div className="relative border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-center">
                  <img src={logoPreview} alt="Logo preview" className="max-h-24 max-w-full object-contain" />
                </div>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={handleRemoveLogo}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
                {logoFile && <div className="absolute bottom-2 right-2"><CheckCircle className="w-4 h-4 text-primary" /></div>}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground text-center">{t('dialogs.clickToUpload')}</span>
                <span className="text-xs text-muted-foreground mt-1">{t('dialogs.fileLimit')}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
            {logoPreview && (
              <label className="flex items-center justify-center text-sm text-primary cursor-pointer hover:underline">
                <Upload className="w-4 h-4 mr-1" />{t('dialogs.changeLogo')}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="empresa-nome">{t('dialogs.companyName')}</Label>
            <Input id="empresa-nome" placeholder={t('dialogs.companyNamePlaceholder')} value={empresaNome} onChange={(e) => setEmpresaNome(e.target.value)} />
            <p className="text-xs text-muted-foreground">{t('dialogs.appearsInPdf')}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.saving')}</>) : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
