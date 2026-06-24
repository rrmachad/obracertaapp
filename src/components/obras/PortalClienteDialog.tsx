import { useState, useEffect, useRef } from 'react';
import { Share2, Copy, Check, ExternalLink, Building2, Phone, CheckCircle2, ChevronRight, ChevronLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserSettings } from '@/hooks/useUserSettings';

interface PortalClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obraId: string;
  obraNome: string;
  portalAtivo: boolean;
  tokenPortal: string | null;
  onSuccess: () => void;
}

export function PortalClienteDialog({
  open, onOpenChange, obraId, obraNome, portalAtivo, tokenPortal, onSuccess
}: PortalClienteDialogProps) {
  const { toast } = useToast();
  const { settings, updateSettings, uploadLogo } = useUserSettings();

  const [ativo, setAtivo] = useState(portalAtivo);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Wizard state
  const [wizardStep, setWizardStep] = useState<0 | 1 | 2 | 3>(0);
  const [empresaNome, setEmpresaNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [savingWizard, setSavingWizard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const portalUrl = tokenPortal
    ? `${window.location.origin}/portal/${tokenPortal}`
    : '';

  // Detect first activation: portal inactive and no branding configured
  useEffect(() => {
    if (open && !portalAtivo && settings !== undefined && !settings?.empresa_nome && !settings?.empresa_logo_url) {
      setWizardStep(1);
      setEmpresaNome('');
      setWhatsapp('');
      setLogoFile(null);
      setLogoPreview('');
    } else if (open) {
      setWizardStep(0);
    }
  }, [open, portalAtivo, settings]);

  // Sync ativo with prop when dialog reopens
  useEffect(() => {
    if (open) setAtivo(portalAtivo);
  }, [open, portalAtivo]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleWizardFinish = async () => {
    setSavingWizard(true);
    try {
      let logoUrl = settings?.empresa_logo_url;
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      const settingsPayload: { empresa_nome?: string; empresa_logo_url?: string; whatsapp?: string } = {};
      if (empresaNome.trim()) settingsPayload.empresa_nome = empresaNome.trim();
      if (logoUrl) settingsPayload.empresa_logo_url = logoUrl;
      if (whatsapp.trim()) settingsPayload.whatsapp = whatsapp.trim();

      if (Object.keys(settingsPayload).length > 0) {
        await updateSettings.mutateAsync(settingsPayload);
      }

      const { error } = await supabase
        .from('obras')
        .update({ portal_ativo: true } as any)
        .eq('id', obraId);
      if (error) throw error;

      setAtivo(true);
      onSuccess();
      setWizardStep(3);
    } catch {
      toast({ title: 'Erro', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSavingWizard(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('obras')
        .update({ portal_ativo: checked } as any)
        .eq('id', obraId);

      if (error) throw error;
      setAtivo(checked);
      onSuccess();
      toast({
        title: checked ? 'Portal ativado!' : 'Portal desativado',
        description: checked
          ? 'Seu cliente agora pode acompanhar a obra pelo link.'
          : 'O link do portal foi desativado.',
      });
    } catch {
      toast({ title: 'Erro', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Link copiado!' });
  };

  // ── WIZARD ──────────────────────────────────────────────────────────────────

  if (wizardStep === 1) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Configure sua marca — Passo 1 de 2
            </DialogTitle>
            <DialogDescription>
              Seu cliente verá essas informações no portal de "{obraNome}".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo da empresa <span className="text-muted-foreground">(opcional)</span></Label>
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-12 w-auto object-contain border rounded" />
                ) : (
                  <div className="h-12 w-24 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground text-xs">
                    sem logo
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-1" /> Escolher imagem
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
            </div>

            {/* Empresa nome */}
            <div className="space-y-2">
              <Label htmlFor="empresa-nome">Nome da empresa <span className="text-muted-foreground">(opcional)</span></Label>
              <Input
                id="empresa-nome"
                placeholder="Ex: Construções Silva"
                value={empresaNome}
                onChange={(e) => setEmpresaNome(e.target.value)}
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => { setWizardStep(0); onOpenChange(false); }}>
                Pular configuração
              </Button>
              <Button onClick={() => setWizardStep(2)}>
                Próximo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (wizardStep === 2) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              WhatsApp para contato — Passo 2 de 2
            </DialogTitle>
            <DialogDescription>
              Seu cliente verá esse número no portal para entrar em contato.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp <span className="text-muted-foreground">(opcional)</span></Label>
              <Input
                id="whatsapp"
                placeholder="Ex: 11999998888"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                type="tel"
              />
              <p className="text-xs text-muted-foreground">Somente números, incluindo DDD. Sem espaços ou traços.</p>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setWizardStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <Button onClick={handleWizardFinish} disabled={savingWizard}>
                {savingWizard ? 'Ativando...' : 'Ativar Portal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (wizardStep === 3) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Portal ativado!
            </DialogTitle>
            <DialogDescription>
              Compartilhe este link com o dono da obra.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {portalUrl && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Link do Portal</Label>
                <div className="flex gap-2">
                  <Input value={portalUrl} readOnly className="text-xs" />
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Você pode ajustar nome, logo e WhatsApp a qualquer momento nas Configurações da conta.
            </p>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Concluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── NORMAL VIEW (portal já configurado ou não é primeira ativação) ──────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Portal do Cliente
          </DialogTitle>
          <DialogDescription>
            Compartilhe o progresso de "{obraNome}" com seu cliente. Ele verá apenas fotos e avanço — sem dados financeiros.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Portal Ativo</Label>
              <p className="text-sm text-muted-foreground">
                {ativo ? 'Seu cliente pode acessar o link' : 'O portal está desativado'}
              </p>
            </div>
            <Switch checked={ativo} onCheckedChange={handleToggle} disabled={loading} />
          </div>

          {/* Link */}
          {ativo && portalUrl && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Link do Portal</Label>
              <div className="flex gap-2">
                <Input value={portalUrl} readOnly className="text-xs" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                Envie este link pelo WhatsApp para o dono da casa acompanhar o andamento.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
