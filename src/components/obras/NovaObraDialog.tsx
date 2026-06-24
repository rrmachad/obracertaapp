import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Building2, Camera, Loader2, Crown, AlertTriangle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useObras } from '@/hooks/useObras';
import { useFases, getDefaultItemsForFase } from '@/hooks/useCronograma';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/imageCompression';

interface NovaObraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgradeClick?: () => void;
}

export function NovaObraDialog({ open, onOpenChange, onUpgradeClick }: NovaObraDialogProps) {
  const { t, i18n } = useTranslation();
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [valorReceita, setValorReceita] = useState('');
  const [fotoCapa, setFotoCapa] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { createObra } = useObras();
  const { data: fases } = useFases();
  const { canCreateObra, limits, usage } = usePlanLimits();
  const { toast } = useToast();

  const canCreate = canCreateObra();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setFotoCapa(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !endereco.trim()) {
      toast({
        title: t('novaObra.requiredFields'),
        description: t('novaObra.fillNameAddress'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let fotoUrl: string | undefined;

      if (fotoCapa) {
        const fileExt = fotoCapa.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('obras-fotos').upload(fileName, fotoCapa);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('obras-fotos').getPublicUrl(fileName);
        fotoUrl = publicUrl;
      }

      const parsedReceita = valorReceita ? parseFloat(valorReceita) : undefined;
      const novaObra = await createObra.mutateAsync({
        nome: nome.trim(),
        endereco: endereco.trim(),
        foto_capa: fotoUrl,
        ...(parsedReceita && !isNaN(parsedReceita) ? { valor_receita: parsedReceita } : {}),
      });

      // Create default schedule items using the current language
      if (fases && novaObra) {
        const lang = i18n.language;
        for (const fase of fases) {
          const itensDefault = getDefaultItemsForFase(fase.nome, lang);
          for (let i = 0; i < itensDefault.length; i++) {
            await supabase.from('cronograma_itens').insert({
              obra_id: novaObra.id,
              fase_id: fase.id,
              descricao: itensDefault[i],
              ordem: i,
            });
          }
        }
      }

      toast({
        title: t('novaObra.created'),
        description: t('novaObra.createdDesc', { name: nome }),
      });

      setNome('');
      setEndereco('');
      setValorReceita('');
      setFotoCapa(null);
      setPreviewUrl(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating obra:', error);
      toast({
        title: t('novaObra.error'),
        description: t('novaObra.errorDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="w-6 h-6 text-primary" />
            {t('novaObra.title')}
          </DialogTitle>
          <DialogDescription>
            {t('novaObra.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!canCreate && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <span className="font-semibold">{t('novaObra.limitReached')}</span>
                <span className="block text-sm mt-0.5">
                  {t('novaObra.limitDesc', { used: usage.obrasUsed, max: limits.maxObras })}
                </span>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label className="text-base font-medium">{t('novaObra.photoLabel')}</Label>
            <div 
              className="relative h-32 border-2 border-dashed rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
              onClick={() => document.getElementById('foto-input')?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-sm">{t('novaObra.addPhoto')}</span>
                </div>
              )}
              <input id="foto-input" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={!canCreate} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome" className="text-base font-medium">{t('novaObra.nameLabel')}</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input id="nome" type="text" placeholder={t('novaObra.namePlaceholder')} value={nome} onChange={(e) => setNome(e.target.value)} className="pl-10 h-12 text-base" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco" className="text-base font-medium">{t('novaObra.addressLabel')}</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input id="endereco" type="text" placeholder={t('novaObra.addressPlaceholder')} value={endereco} onChange={(e) => setEndereco(e.target.value)} className="pl-10 h-12 text-base" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor-receita" className="text-base font-medium">Valor do contrato / receita <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="valor-receita"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 150000,00"
                value={valorReceita}
                onChange={(e) => setValorReceita(e.target.value)}
                className="pl-10 h-12 text-base"
                disabled={!canCreate}
              />
            </div>
            <p className="text-xs text-muted-foreground">Usado no Dashboard de Lucratividade para calcular lucro e ROI.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => onOpenChange(false)} disabled={loading}>
              {t('common.cancel')}
            </Button>
            {canCreate ? (
              <Button type="submit" className="flex-1 h-12" disabled={loading}>
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('novaObra.creating')}</>
                ) : (
                  t('novaObra.create')
                )}
              </Button>
            ) : (
              <Button type="button" className="flex-1 h-12" onClick={() => { onOpenChange(false); onUpgradeClick?.(); }}>
                <Crown className="w-4 h-4 mr-2" />
                {t('novaObra.upgrade')}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
