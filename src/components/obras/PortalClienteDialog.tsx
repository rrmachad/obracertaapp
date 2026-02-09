import { useState } from 'react';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';
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
  const [ativo, setAtivo] = useState(portalAtivo);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const portalUrl = tokenPortal 
    ? `${window.location.origin}/portal/${tokenPortal}` 
    : '';

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
    } catch (error) {
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