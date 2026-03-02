import { useState, useEffect } from 'react';
import { MapPin, Building2, Camera, Loader2, Pencil, ShieldCheck, Ruler, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useObras } from '@/hooks/useObras';
import { supabase } from '@/integrations/supabase/client';
import { Obra, SistemaMedidas } from '@/types/database';

interface EditarObraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obra: Obra;
  onSuccess?: () => void;
}

export function EditarObraDialog({ open, onOpenChange, obra, onSuccess }: EditarObraDialogProps) {
  const [nome, setNome] = useState(obra.nome);
  const [endereco, setEndereco] = useState(obra.endereco);
  const [retencao, setRetencao] = useState(String(obra.retencao_tecnica_percentual ?? 5));
  const [sistemaMedidas, setSistemaMedidas] = useState<SistemaMedidas>(obra.sistema_medidas ?? 'metrico');
  const [fotoCapa, setFotoCapa] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(obra.foto_capa);
  const [removedFoto, setRemovedFoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const { updateObra } = useObras();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Atualiza o formulário quando a obra muda
  useEffect(() => {
    setNome(obra.nome);
    setEndereco(obra.endereco);
    setRetencao(String(obra.retencao_tecnica_percentual ?? 5));
    setSistemaMedidas(obra.sistema_medidas ?? 'metrico');
    setPreviewUrl(obra.foto_capa);
    setFotoCapa(null);
    setRemovedFoto(false);
  }, [obra]);

  const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setFotoCapa(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    }
  };

  const handleRemoveFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRemoveConfirm(true);
  };

  const confirmRemoveFoto = () => {
    setPreviewUrl(null);
    setFotoCapa(null);
    setRemovedFoto(true);
    setShowRemoveConfirm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !endereco.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome e endereço da obra.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let fotoUrl: string | null | undefined = obra.foto_capa ?? undefined;

      // Foto removida pelo usuário
      if (removedFoto && !fotoCapa) {
        fotoUrl = null;
      }

      // Upload da nova foto se houver
      if (fotoCapa) {
        const fileExt = fotoCapa.name.split('.').pop();
        const fileName = `${obra.user_id}/${obra.id}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('obras-fotos')
          .upload(fileName, fotoCapa, { upsert: true });

        if (uploadError) {
          console.error('Upload error details:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('obras-fotos')
          .getPublicUrl(fileName);
        
        fotoUrl = publicUrl;
      }

      // Atualizar a obra
      await updateObra.mutateAsync({
        id: obra.id,
        nome: nome.trim(),
        endereco: endereco.trim(),
        foto_capa: fotoUrl,
        retencao_tecnica_percentual: parseFloat(retencao) || 5,
        sistema_medidas: sistemaMedidas,
      } as any);

      toast({
        title: 'Obra atualizada!',
        description: `"${nome}" foi atualizada com sucesso.`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar obra:', error);
      toast({
        title: 'Erro ao atualizar obra',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Pencil className="w-6 h-6 text-primary" />
            Editar Obra
          </DialogTitle>
          <DialogDescription>
            Atualize as informações da obra.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pb-2">
          {/* Foto de capa */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Foto do terreno/obra</Label>
            <div 
              className="relative h-32 border-2 border-dashed rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
              onClick={() => document.getElementById('foto-edit-input')?.click()}
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveFoto}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-md hover:bg-destructive/90 transition-colors z-10"
                    title="Remover foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-sm">Toque para adicionar foto</span>
                </div>
              )}
              <input
                id="foto-edit-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome-edit" className="text-base font-medium">
              Nome da obra
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="nome-edit"
                type="text"
                placeholder="Ex: Casa Residencial Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco-edit" className="text-base font-medium">
              Endereço
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="endereco-edit"
                type="text"
                placeholder="Rua, número, bairro"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retencao-edit" className="text-base font-medium">
              Retenção Técnica (%)
            </Label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="retencao-edit"
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="5"
                value={retencao}
                onChange={(e) => setRetencao(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <p className="text-xs text-muted-foreground">Percentual retido em cada medição (padrão: 5%)</p>
          </div>

          {/* Sistema de Medidas */}
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              {t('measurementSystem.title')}
            </Label>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {sistemaMedidas === 'metrico' ? t('measurementSystem.metric') : t('measurementSystem.imperial')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {sistemaMedidas === 'metrico' ? t('measurementSystem.metricUnits') : t('measurementSystem.imperialUnits')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t('measurementSystem.metric')}</span>
                <Switch
                  checked={sistemaMedidas === 'imperial'}
                  onCheckedChange={(checked) => setSistemaMedidas(checked ? 'imperial' : 'metrico')}
                />
                <span className="text-xs text-muted-foreground">{t('measurementSystem.imperial')}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t('measurementSystem.description')}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover foto de capa?</AlertDialogTitle>
          <AlertDialogDescription>
            A foto de capa será removida da obra. Você pode adicionar uma nova foto depois.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmRemoveFoto} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
