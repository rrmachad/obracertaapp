import { useState, useRef } from 'react';
import { Camera, X, Loader2, ImagePlus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FotoComLegenda } from '@/types/database';

interface FotoUploadProps {
  fotos: FotoComLegenda[];
  onFotosChange: (fotos: FotoComLegenda[]) => void;
  obraId: string;
  disabled?: boolean;
}

// Comprime imagem para economizar dados em redes de canteiro
async function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => resolve(blob || file),
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function FotoUpload({ fotos, onFotosChange, obraId, disabled }: FotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newFotos: FotoComLegenda[] = [...fotos];

    try {
      for (const file of Array.from(files)) {
        // Comprime a imagem
        const compressedBlob = await compressImage(file);
        
        // Gera nome único
        const fileName = `${obraId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        
        // Upload para Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('diario-fotos')
          .upload(fileName, compressedBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
          });

        if (uploadError) throw uploadError;

        // Pega URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('diario-fotos')
          .getPublicUrl(fileName);

        newFotos.push({ url: publicUrl, legenda: '' });
      }

      onFotosChange(newFotos);
      
      toast({
        title: 'Foto(s) adicionada(s)',
        description: `${files.length} foto(s) carregada(s) com sucesso.`,
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível carregar a(s) foto(s). Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Limpa o input para permitir selecionar a mesma foto novamente
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newFotos = fotos.filter((_, i) => i !== index);
    onFotosChange(newFotos);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleLegendaChange = (index: number, legenda: string) => {
    const newFotos = fotos.map((foto, i) =>
      i === index ? { ...foto, legenda } : foto
    );
    onFotosChange(newFotos);
  };

  const toggleEditLegenda = (index: number) => {
    setEditingIndex(editingIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {/* Grid de fotos */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {fotos.map((foto, index) => (
            <div key={index} className="space-y-2">
              <div className="relative aspect-square rounded-lg overflow-hidden border border-border">
                <img
                  src={foto.url}
                  alt={foto.legenda || `Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Botões de ação */}
                <div className="absolute top-1 right-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => toggleEditLegenda(index)}
                    className="p-1.5 bg-primary text-primary-foreground rounded-full shadow-md hover:bg-primary/90 transition-colors"
                    disabled={disabled}
                    title="Adicionar legenda"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-md hover:bg-destructive/90 transition-colors"
                    disabled={disabled}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {/* Indicador de legenda */}
                {foto.legenda && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-xs text-white line-clamp-2">{foto.legenda}</p>
                  </div>
                )}
              </div>
              {/* Campo de legenda expandido */}
              {editingIndex === index && (
                <Input
                  placeholder="Digite uma legenda..."
                  value={foto.legenda}
                  onChange={(e) => handleLegendaChange(index, e.target.value)}
                  className="text-sm h-8"
                  autoFocus
                  onBlur={() => setEditingIndex(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setEditingIndex(null);
                    }
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Botões de upload */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handleUpload}
          className="hidden"
          disabled={disabled || uploading}
        />
        
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Carregando...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5 mr-2" />
              Tirar Foto
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12"
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.removeAttribute('capture');
              inputRef.current.click();
              // Restaura capture para próxima vez
              setTimeout(() => {
                inputRef.current?.setAttribute('capture', 'environment');
              }, 100);
            }
          }}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Carregando...
            </>
          ) : (
            <>
              <ImagePlus className="w-5 h-5 mr-2" />
              Galeria
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        As fotos são comprimidas automaticamente. Toque em ✏️ para adicionar legendas.
      </p>
    </div>
  );
}
