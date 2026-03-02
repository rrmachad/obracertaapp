import { useState, useRef } from 'react';
import { Camera, X, Loader2, ImagePlus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { FotoComLegenda } from '@/types/database';
import { compressImageToBlob } from '@/lib/imageCompression';

interface FotoUploadProps {
  fotos: FotoComLegenda[];
  onFotosChange: (fotos: FotoComLegenda[]) => void;
  obraId: string;
  disabled?: boolean;
}

// compressImage moved to @/lib/imageCompression

export function FotoUpload({ fotos, onFotosChange, obraId, disabled }: FotoUploadProps) {
  const { t } = useTranslation();
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
        const compressedBlob = await compressImageToBlob(file);
        const fileName = `${obraId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const { error: uploadError } = await supabase.storage.from('diario-fotos').upload(fileName, compressedBlob, { contentType: 'image/jpeg', cacheControl: '3600' });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('diario-fotos').getPublicUrl(fileName);
        newFotos.push({ url: publicUrl, legenda: '' });
      }
      onFotosChange(newFotos);
      toast({ title: t('dialogs.photoAdded'), description: t('dialogs.photosUploaded', { count: files.length }) });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: t('dialogs.uploadError'), description: t('dialogs.couldNotUpload'), variant: 'destructive' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    onFotosChange(fotos.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleLegendaChange = (index: number, legenda: string) => {
    onFotosChange(fotos.map((foto, i) => i === index ? { ...foto, legenda } : foto));
  };

  return (
    <div className="space-y-3">
      {fotos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {fotos.map((foto, index) => (
            <div key={index} className="space-y-2">
              <div className="relative aspect-square rounded-lg overflow-hidden border border-border">
                <img src={foto.url} alt={foto.legenda || `${t('diary.photo')} ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute top-1 right-1 flex gap-1">
                  <button type="button" onClick={() => setEditingIndex(editingIndex === index ? null : index)} className="p-1.5 bg-primary text-primary-foreground rounded-full shadow-md hover:bg-primary/90 transition-colors" disabled={disabled} title={t('dialogs.addCaption')}>
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => handleRemove(index)} className="p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-md hover:bg-destructive/90 transition-colors" disabled={disabled}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {foto.legenda && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-xs text-white line-clamp-2">{foto.legenda}</p>
                  </div>
                )}
              </div>
              {editingIndex === index && (
                <Input placeholder={t('dialogs.typeCaption')} value={foto.legenda} onChange={(e) => handleLegendaChange(index, e.target.value)} className="text-sm h-8" autoFocus
                  onBlur={() => setEditingIndex(null)} onKeyDown={(e) => { if (e.key === 'Enter') setEditingIndex(null); }} />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple onChange={handleUpload} className="hidden" disabled={disabled || uploading} />
        <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => inputRef.current?.click()} disabled={disabled || uploading}>
          {uploading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />{t('dialogs.uploading')}</>) : (<><Camera className="w-5 h-5 mr-2" />{t('dialogs.takePhoto')}</>)}
        </Button>
        <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => {
          if (inputRef.current) { inputRef.current.removeAttribute('capture'); inputRef.current.click(); setTimeout(() => { inputRef.current?.setAttribute('capture', 'environment'); }, 100); }
        }} disabled={disabled || uploading}>
          {uploading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />{t('dialogs.uploading')}</>) : (<><ImagePlus className="w-5 h-5 mr-2" />{t('dialogs.gallery')}</>)}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">{t('dialogs.photosCompressHint')}</p>
    </div>
  );
}
