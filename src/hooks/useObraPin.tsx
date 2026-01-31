import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ObraPin {
  id: string;
  obra_id: string;
  pin_hash: string;
  created_at: string;
  updated_at: string;
}

// Função simples de hash para PIN (não usar para dados sensíveis críticos)
function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `pin_${Math.abs(hash).toString(36)}_${pin.length}`;
}

export function useObraPin(obraId: string) {
  const queryClient = useQueryClient();

  const pinQuery = useQuery({
    queryKey: ['obra-pin', obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obra_pin')
        .select('*')
        .eq('obra_id', obraId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ObraPin | null;
    },
    enabled: !!obraId,
  });

  const createPin = useMutation({
    mutationFn: async (pin: string) => {
      const { data, error } = await supabase
        .from('obra_pin')
        .insert({
          obra_id: obraId,
          pin_hash: hashPin(pin),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as ObraPin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra-pin', obraId] });
    },
  });

  const updatePin = useMutation({
    mutationFn: async (pin: string) => {
      const { data, error } = await supabase
        .from('obra_pin')
        .update({ pin_hash: hashPin(pin) })
        .eq('obra_id', obraId)
        .select()
        .single();
      
      if (error) throw error;
      return data as ObraPin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra-pin', obraId] });
    },
  });

  const validatePin = (inputPin: string): boolean => {
    if (!pinQuery.data) return false;
    return pinQuery.data.pin_hash === hashPin(inputPin);
  };

  const hasPin = !!pinQuery.data;

  return {
    pin: pinQuery.data,
    hasPin,
    isLoading: pinQuery.isLoading,
    createPin,
    updatePin,
    validatePin,
  };
}
