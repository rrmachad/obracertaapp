import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Fase, CronogramaItem, ItemStatus } from '@/types/database';

export function useFases() {
  return useQuery({
    queryKey: ['fases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fases')
        .select('*')
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return data as Fase[];
    },
  });
}

export function useCronogramaItens(obraId: string) {
  const queryClient = useQueryClient();

  const itensQuery = useQuery({
    queryKey: ['cronograma', obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cronograma_itens')
        .select('*')
        .eq('obra_id', obraId)
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return data as CronogramaItem[];
    },
    enabled: !!obraId,
  });

  const createItem = useMutation({
    mutationFn: async (item: { obra_id: string; fase_id: string; descricao: string }) => {
      const { data, error } = await supabase
        .from('cronograma_itens')
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data as CronogramaItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronograma', obraId] });
      queryClient.invalidateQueries({ queryKey: ['obras'] });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CronogramaItem> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates };
      
      if (updates.status === 'concluido') {
        updateData.data_conclusao = new Date().toISOString().split('T')[0];
      }
      
      const { data, error } = await supabase
        .from('cronograma_itens')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as CronogramaItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronograma', obraId] });
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.invalidateQueries({ queryKey: ['obra'] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cronograma_itens')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronograma', obraId] });
      queryClient.invalidateQueries({ queryKey: ['obras'] });
    },
  });

  return {
    itens: itensQuery.data ?? [],
    isLoading: itensQuery.isLoading,
    error: itensQuery.error,
    createItem,
    updateItem,
    deleteItem,
  };
}

// Itens padrão para cada fase MCMV — chave = nome da fase no banco (pt-BR)
// Valor = objeto com traduções por idioma
interface DefaultItems {
  'pt-BR': string[];
  'en-US': string[];
  'es-ES': string[];
}

const defaultItemsByFaseI18n: Record<string, DefaultItems> = {
  'Serviços Preliminares': {
    'pt-BR': [
      'Limpeza do terreno',
      'Locação da obra',
      'Instalações provisórias (água, luz, tapume)',
      'Barracão de obra',
    ],
    'en-US': [
      'Site clearing',
      'Site layout',
      'Temporary facilities (water, power, fencing)',
      'Site office',
    ],
    'es-ES': [
      'Limpieza del terreno',
      'Replanteo de obra',
      'Instalaciones provisionales (agua, luz, cerco)',
      'Caseta de obra',
    ],
  },
  'Fundação': {
    'pt-BR': [
      'Escavação',
      'Compactação do solo',
      'Sapatas',
      'Vigas baldrame',
      'Impermeabilização da fundação',
    ],
    'en-US': [
      'Excavation',
      'Soil compaction',
      'Footings',
      'Grade beams',
      'Foundation waterproofing',
    ],
    'es-ES': [
      'Excavación',
      'Compactación del suelo',
      'Zapatas',
      'Vigas de cimentación',
      'Impermeabilización de cimientos',
    ],
  },
  'Estrutura': {
    'pt-BR': [
      'Alvenaria de embasamento',
      'Alvenaria de elevação',
      'Cintas e vergas',
      'Pilares',
      'Laje',
    ],
    'en-US': [
      'Base masonry',
      'Wall masonry',
      'Lintels and bond beams',
      'Columns',
      'Slab',
    ],
    'es-ES': [
      'Albañilería de base',
      'Albañilería de elevación',
      'Dinteles y cintas',
      'Columnas',
      'Losa',
    ],
  },
  'Cobertura': {
    'pt-BR': [
      'Estrutura do telhado (madeiramento)',
      'Colocação das telhas',
      'Cumeeiras',
      'Calhas e rufos',
    ],
    'en-US': [
      'Roof framing',
      'Roof tile installation',
      'Ridge caps',
      'Gutters and flashings',
    ],
    'es-ES': [
      'Estructura del techo',
      'Colocación de tejas',
      'Cumbreras',
      'Canaletas y babetas',
    ],
  },
  'Instalações': {
    'pt-BR': [
      'Instalação elétrica (tubulação)',
      'Passagem de fios',
      'Instalação hidráulica',
      'Instalação de esgoto',
      'Caixas de passagem',
    ],
    'en-US': [
      'Electrical conduit installation',
      'Wiring',
      'Plumbing installation',
      'Sewage installation',
      'Junction boxes',
    ],
    'es-ES': [
      'Instalación eléctrica (tubería)',
      'Cableado',
      'Instalación hidráulica',
      'Instalación de desagüe',
      'Cajas de paso',
    ],
  },
  'Acabamento': {
    'pt-BR': [
      'Chapisco',
      'Reboco',
      'Contrapiso',
      'Revestimento cerâmico',
      'Pintura',
      'Instalação de louças',
      'Instalação de esquadrias',
      'Limpeza final',
    ],
    'en-US': [
      'Scratch coat',
      'Plastering',
      'Screed',
      'Tile installation',
      'Painting',
      'Fixture installation',
      'Door & window installation',
      'Final cleaning',
    ],
    'es-ES': [
      'Revoque grueso',
      'Revoque fino',
      'Contrapiso',
      'Revestimiento cerámico',
      'Pintura',
      'Instalación de sanitarios',
      'Instalación de carpinterías',
      'Limpieza final',
    ],
  },
};

/**
 * Returns the default items for a given phase name, in the specified language.
 * Falls back to pt-BR if the language is not found.
 */
export function getDefaultItemsForFase(faseNome: string, language: string): string[] {
  const items = defaultItemsByFaseI18n[faseNome];
  if (!items) return [];
  return items[language as keyof DefaultItems] || items['pt-BR'];
}

// Legacy export for backward compatibility
export const defaultItemsByFase: Record<string, string[]> = Object.fromEntries(
  Object.entries(defaultItemsByFaseI18n).map(([key, val]) => [key, val['pt-BR']])
);
