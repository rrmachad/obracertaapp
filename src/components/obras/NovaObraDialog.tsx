import { useState } from 'react';
import { MapPin, Building2, Camera, Loader2 } from 'lucide-react';
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
import { useFases, useCronogramaItens, defaultItemsByFase } from '@/hooks/useCronograma';
import { supabase } from '@/integrations/supabase/client';

interface NovaObraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovaObraDialog({ open, onOpenChange }: NovaObraDialogProps) {
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [fotoCapa, setFotoCapa] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { createObra } = useObras();
  const { data: fases } = useFases();
  const { toast } = useToast();

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
      let fotoUrl: string | undefined;

      // Upload da foto se houver
      if (fotoCapa) {
        const fileExt = fotoCapa.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('obras-fotos')
          .upload(fileName, fotoCapa);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('obras-fotos')
          .getPublicUrl(fileName);
        
        fotoUrl = publicUrl;
      }

      // Criar a obra
      const novaObra = await createObra.mutateAsync({
        nome: nome.trim(),
        endereco: endereco.trim(),
        foto_capa: fotoUrl,
      });

      // Criar itens do cronograma padrão para cada fase
      if (fases && novaObra) {
        for (const fase of fases) {
          const itensDefault = defaultItemsByFase[fase.nome] || [];
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
        title: 'Obra criada!',
        description: `"${nome}" foi adicionada com sucesso.`,
      });

      // Limpar form e fechar
      setNome('');
      setEndereco('');
      setFotoCapa(null);
      setPreviewUrl(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar obra:', error);
      toast({
        title: 'Erro ao criar obra',
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
            <Building2 className="w-6 h-6 text-primary" />
            Nova Obra
          </DialogTitle>
          <DialogDescription>
            Cadastre uma nova obra para acompanhar seu progresso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Foto de capa */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Foto do terreno/obra</Label>
            <div 
              className="relative h-32 border-2 border-dashed rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
              onClick={() => document.getElementById('foto-input')?.click()}
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
                id="foto-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome" className="text-base font-medium">
              Nome da obra
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="nome"
                type="text"
                placeholder="Ex: Casa Residencial Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco" className="text-base font-medium">
              Endereço
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="endereco"
                type="text"
                placeholder="Rua, número, bairro"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
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
                  Criando...
                </>
              ) : (
                'Criar Obra'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
