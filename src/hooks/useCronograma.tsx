import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Fase, CronogramaItem, ItemStatus } from '@/types/database';
import { notifyCronogramaConcluido } from '@/lib/notifications';

export function useFases(obraId?: string) {
  return useQuery({
    queryKey: ['fases', obraId],
    queryFn: async () => {
      if (obraId) {
        // First check if obra has its own phases
        const { data: obraFases, error: obraError } = await supabase
          .from('fases')
          .select('*')
          .eq('obra_id', obraId)
          .order('ordem', { ascending: true });
        
        if (obraError) throw obraError;
        
        if (obraFases && obraFases.length > 0) {
          return obraFases as Fase[];
        }
      }
      
      // Fallback to global phases (obra_id is null)
      const { data, error } = await supabase
        .from('fases')
        .select('*')
        .is('obra_id', null)
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return data as Fase[];
    },
  });
}

export function useFasesMutations(obraId: string) {
  const queryClient = useQueryClient();

  const ensureObraFases = async (): Promise<Fase[]> => {
    // Check if obra already has its own phases
    const { data: existing } = await supabase
      .from('fases')
      .select('*')
      .eq('obra_id', obraId)
      .order('ordem', { ascending: true });

    if (existing && existing.length > 0) return existing as Fase[];

    // Copy global phases to this obra
    const { data: globalFases } = await supabase
      .from('fases')
      .select('*')
      .is('obra_id', null)
      .order('ordem', { ascending: true });

    if (!globalFases || globalFases.length === 0) return [];

    const newFases = globalFases.map(f => ({
      nome: f.nome,
      descricao: f.descricao,
      icone: f.icone,
      ordem: f.ordem,
      obra_id: obraId,
    }));

    const { data: inserted, error } = await supabase
      .from('fases')
      .insert(newFases)
      .select();

    if (error) throw error;

    // Re-map cronograma_itens from global fase ids to new obra fase ids
    const globalToNew = new Map<string, string>();
    globalFases.forEach((gf, i) => {
      if (inserted && inserted[i]) {
        globalToNew.set(gf.id, inserted[i].id);
      }
    });

    // Update existing cronograma_itens to point to new obra-specific fases
    const { data: itens } = await supabase
      .from('cronograma_itens')
      .select('id, fase_id')
      .eq('obra_id', obraId);

    if (itens) {
      for (const item of itens) {
        const newFaseId = globalToNew.get(item.fase_id);
        if (newFaseId) {
          await supabase
            .from('cronograma_itens')
            .update({ fase_id: newFaseId })
            .eq('id', item.id);
        }
      }
    }

    return (inserted as Fase[]) || [];
  };

  const createFase = useMutation({
    mutationFn: async ({ nome, icone }: { nome: string; icone?: string }) => {
      // Ensure obra has its own phases first
      const obraFases = await ensureObraFases();
      const maxOrdem = obraFases.reduce((max, f) => Math.max(max, f.ordem), 0);

      const { data, error } = await supabase
        .from('fases')
        .insert({
          nome,
          icone: icone || null,
          ordem: maxOrdem + 1,
          obra_id: obraId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Fase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fases', obraId] });
    },
  });

  const updateFase = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Fase> & { id: string }) => {
      await ensureObraFases();
      const { data, error } = await supabase
        .from('fases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Fase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fases', obraId] });
    },
  });

  const deleteFase = useMutation({
    mutationFn: async (id: string) => {
      // Delete associated cronograma items first
      await supabase
        .from('cronograma_itens')
        .delete()
        .eq('fase_id', id)
        .eq('obra_id', obraId);

      const { error } = await supabase
        .from('fases')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fases', obraId] });
      queryClient.invalidateQueries({ queryKey: ['cronograma', obraId] });
    },
  });

  const reorderFases = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await ensureObraFases();
      for (let i = 0; i < orderedIds.length; i++) {
        await supabase
          .from('fases')
          .update({ ordem: i + 1 })
          .eq('id', orderedIds[i]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fases', obraId] });
    },
  });

  return { createFase, updateFase, deleteFase, reorderFases, ensureObraFases };
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
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        updateData.data_conclusao = `${year}-${month}-${day}`;
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cronograma', obraId] });
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.invalidateQueries({ queryKey: ['obra'] });
      if (variables.status === 'concluido') {
        notifyCronogramaConcluido(obraId, data.descricao);
      }
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

export function getDefaultItemsForFase(faseNome: string, language: string): string[] {
  const items = defaultItemsByFaseI18n[faseNome];
  if (!items) return [];
  return items[language as keyof DefaultItems] || items['pt-BR'];
}

export const defaultItemsByFase: Record<string, string[]> = Object.fromEntries(
  Object.entries(defaultItemsByFaseI18n).map(([key, val]) => [key, val['pt-BR']])
);
