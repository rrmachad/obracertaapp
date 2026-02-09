import { useState, useEffect } from 'react';
import { MapPin, Building2, Camera, Loader2, Pencil, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useObras } from '@/hooks/useObras';
import { supabase } from '@/integrations/supabase/client';
import { Obra } from '@/types/database';

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
  const [fotoCapa, setFotoCapa] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(obra.foto_capa);
  const [loading, setLoading] = useState(false);

  const { updateObra } = useObras();
  const { toast } = useToast();

  // Atualiza o formulário quando a obra muda
  useEffect(() => {
    setNome(obra.nome);
    setEndereco(obra.endereco);
    setRetencao(String(obra.retencao_tecnica_percentual ?? 5));
    setPreviewUrl(obra.foto_capa);
    setFotoCapa(null);
  }, [obra]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoCapa(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
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
      let fotoUrl: string | undefined = obra.foto_capa ?? undefined;

      // Upload da nova foto se houver
      if (fotoCapa) {
        const fileExt = fotoCapa.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('obras-fotos')
          .upload(fileName, fotoCapa);

        if (uploadError) throw uploadError;

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
      });

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Pencil className="w-6 h-6 text-primary" />
            Editar Obra
          </DialogTitle>
          <DialogDescription>
            Atualize as informações da obra.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Foto de capa */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Foto do terreno/obra</Label>
            <div 
              className="relative h-32 border-2 border-dashed rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
              onClick={() => document.getElementById('foto-edit-input')?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
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
  );
}
