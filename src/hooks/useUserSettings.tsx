import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserSettings {
  id: string;
  user_id: string;
  empresa_logo_url?: string;
  empresa_nome?: string;
  whatsapp?: string;
  created_at: string;
  updated_at: string;
}

export function useUserSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['user_settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserSettings | null;
    },
    enabled: !!user,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: { empresa_logo_url?: string; empresa_nome?: string; whatsapp?: string }) => {
      // First try to update existing settings
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('user_settings')
          .update(updates)
          .eq('user_id', user!.id)
          .select()
          .single();
        
        if (error) throw error;
        return data as UserSettings;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('user_settings')
          .insert({
            user_id: user!.id,
            ...updates
          })
          .select()
          .single();
        
        if (error) throw error;
        return data as UserSettings;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_settings'] });
    },
  });

  const uploadLogo = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    // Compress and resize image
    const compressedFile = await compressImage(file);
    
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `${user.id}/logo.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('obras-fotos')
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('obras-fotos')
      .getPublicUrl(fileName);

    // Add timestamp to bust cache
    return `${publicUrl}?t=${Date.now()}`;
  };

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    updateSettings,
    uploadLogo,
  };
}

// Helper function to compress image
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 400;
        const maxHeight = 200;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          'image/png',
          0.85
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
