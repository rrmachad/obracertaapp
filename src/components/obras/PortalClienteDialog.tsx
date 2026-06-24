import { useState, useEffect, useRef } from 'react';
import { Share2, Copy, Check, ExternalLink, Building2, Phone, CheckCircle2, ChevronRight, ChevronLeft, Upload, Pencil, X } from 'lucide-react';
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

  // Wizard state (first-time setup)
  const [wizardStep, setWizardStep] = useState<0 | 1 | 2 | 3>(0);
  const [empresaNome, setEmpresaNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [savingWizard, setSavingWizard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline brand editing (normal view)
  const [editingBranding, setEditingBranding] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState('');
  const [savingBranding, setSavingBranding] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (open) setAtivo(portalAtivo);
  }, [open, portalAtivo]);

  // Seed edit fields when entering edit mode
  const handleOpenEdit = () => {
    setEditNome(settings?.empresa_nome ?? '');
    setEditWhatsapp(settings?.whatsapp ?? '');
    setEditLogoFile(null);
    setEditLogoPreview(settings?.empresa_logo_url ?? '');
    setEditingBranding(true);
  };

  const handleEditLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEditLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      let logoUrl = settings?.empresa_logo_url;
      if (editLogoFile) {
        logoUrl = await uploadLogo(editLogoFile);
      }
      await updateSettings.mutateAsync({
        empresa_nome: editNome.trim() || undefined,
        whatsapp: editWhatsapp.trim() || undefined,
        ...(logoUrl ? { empresa_logo_url: logoUrl } : {}),
      });
      toast({ title: 'Dados da empresa atualizados!' });
      setEditingBranding(false);
    } catch {
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSavingBranding(false);
    }
  };

  // ── Wizard helpers ───────────────────────────────────────────────────────────

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

  // ── WIZARD STEP 1 ────────────────────────────────────────────────────────────

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
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
            </div>

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

  // ── WIZARD STEP 2 ────────────────────────────────────────────────────────────

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

  // ── WIZARD STEP 3 (success) ──────────────────────────────────────────────────

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
              Você pode atualizar nome, logo e WhatsApp a qualquer momento — clique em "Editar dados da empresa" dentro deste modal.
            </p>
            <Button className="w-full" onClick={() => { setWizardStep(0); }}>
              Concluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── NORMAL VIEW ──────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setEditingBranding(false); onOpenChange(v); }}>
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

        <div className="space-y-5">
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

          {/* Dados da empresa */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/40">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Dados da empresa
              </div>
              {!editingBranding ? (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleOpenEdit}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditingBranding(false)}>
                  <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                </Button>
              )}
            </div>

            {!editingBranding ? (
              /* Read-only summary */
              <div className="px-4 py-3 space-y-1.5">
                {settings?.empresa_logo_url && (
                  <img src={settings.empresa_logo_url} alt="Logo" className="h-8 w-auto object-contain mb-2" />
                )}
                <p className="text-sm">
                  <span className="text-muted-foreground">Nome: </span>
                  {settings?.empresa_nome || <span className="text-muted-foreground italic">não informado</span>}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">WhatsApp: </span>
                  {settings?.whatsapp || <span className="text-muted-foreground italic">não informado</span>}
                </p>
              </div>
            ) : (
              /* Inline edit form */
              <div className="px-4 py-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Logo</Label>
                  <div className="flex items-center gap-3">
                    {editLogoPreview ? (
                      <img src={editLogoPreview} alt="Logo" className="h-10 w-auto object-contain border rounded" />
                    ) : (
                      <div className="h-10 w-20 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground text-xs">
                        sem logo
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => editFileInputRef.current?.click()}>
                      <Upload className="w-3.5 h-3.5 mr-1" /> Alterar
                    </Button>
                    <input ref={editFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleEditLogoChange} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-nome-empresa" className="text-xs">Nome da empresa</Label>
                  <Input
                    id="edit-nome-empresa"
                    placeholder="Ex: Construções Silva"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-whatsapp" className="text-xs">WhatsApp</Label>
                  <Input
                    id="edit-whatsapp"
                    placeholder="Ex: 11999998888"
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    type="tel"
                    className="h-9 text-sm"
                  />
                </div>

                <Button size="sm" className="w-full" onClick={handleSaveBranding} disabled={savingBranding}>
                  {savingBranding ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
