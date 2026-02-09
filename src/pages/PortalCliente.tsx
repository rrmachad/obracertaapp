import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Hammer, MessageCircle, Camera, CheckCircle, Clock, Circle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WHATSAPP_NUMBER = '5511999999999';
const WHATSAPP_MESSAGE = encodeURIComponent('Olá! Vim pelo Portal da Obra e gostaria de mais informações.');
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

const statusIcons: Record<string, React.ReactNode> = {
  concluido: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  em_andamento: <Clock className="w-5 h-5 text-primary" />,
  pendente: <Circle className="w-5 h-5 text-muted-foreground" />,
};

const statusLabels: Record<string, string> = {
  concluido: 'Concluída',
  em_andamento: 'Em Andamento',
  pendente: 'Pendente',
};

export function PortalCliente() {
  const { token } = useParams<{ token: string }>();

  // Fetch obra by token
  const obraQuery = useQuery({
    queryKey: ['portal-obra', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obras_portal' as any)
        .select('*')
        .eq('token_portal', token)
        .eq('portal_ativo', true)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!token,
  });

  // Fetch cronograma
  const cronogramaQuery = useQuery({
    queryKey: ['portal-cronograma', obraQuery.data?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cronograma_portal' as any)
        .select('*')
        .eq('obra_id', obraQuery.data.id)
        .order('fase_ordem' as any, { ascending: true })
        .order('ordem' as any, { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!obraQuery.data?.id,
  });

  // Fetch photos
  const fotosQuery = useQuery({
    queryKey: ['portal-fotos', obraQuery.data?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fotos_portal' as any)
        .select('*')
        .eq('obra_id', obraQuery.data.id)
        .order('data', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!obraQuery.data?.id,
  });

  if (obraQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!obraQuery.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <Hammer className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Portal não encontrado</h1>
        <p className="text-muted-foreground">O link do portal pode estar inativo ou incorreto.</p>
      </div>
    );
  }

  const obra = obraQuery.data;

  // Group cronograma items by fase
  const fases = (cronogramaQuery.data || []).reduce((acc: any[], item: any) => {
    let fase = acc.find((f: any) => f.fase_id === item.fase_id);
    if (!fase) {
      fase = { fase_id: item.fase_id, nome: item.fase_nome, icone: item.fase_icone, ordem: item.fase_ordem, itens: [] };
      acc.push(fase);
    }
    fase.itens.push(item);
    return acc;
  }, []).sort((a: any, b: any) => a.ordem - b.ordem);

  // Extract all photos
  const allPhotos: { url: string; data: string; atividade: string }[] = [];
  (fotosQuery.data || []).forEach((entry: any) => {
    const fotos = entry.fotos as any[];
    if (fotos) {
      fotos.forEach((url: string) => {
        allPhotos.push({ url, data: entry.data, atividade: entry.atividades_realizadas });
      });
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {/* WhatsApp button */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        aria-label="Falar com o Engenheiro"
        title="Falar com o Engenheiro"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </a>

      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Hammer className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">{obra.nome}</h1>
            <p className="text-sm text-muted-foreground">{obra.endereco}</p>
          </div>
        </div>
      </header>

      {/* Cover photo */}
      {obra.foto_capa && (
        <div className="h-48 md:h-64 bg-muted">
          <img src={obra.foto_capa} alt={obra.nome} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Progress */}
      <div className="container py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Progresso Geral</h2>
              <span className="text-2xl font-extrabold text-primary">{obra.progresso}%</span>
            </div>
            <Progress value={obra.progresso} className="h-4" />
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <div className="container pb-6">
        <h2 className="text-lg font-bold mb-4">Etapas da Obra</h2>
        <div className="space-y-2">
          {fases.map((fase: any, index: number) => {
            const totalItens = fase.itens.length;
            const concluidos = fase.itens.filter((i: any) => i.status === 'concluido').length;
            const emAndamento = fase.itens.some((i: any) => i.status === 'em_andamento');
            const faseStatus = concluidos === totalItens ? 'concluido' : emAndamento ? 'em_andamento' : 'pendente';
            const porcentagem = totalItens > 0 ? Math.round((concluidos / totalItens) * 100) : 0;

            return (
              <div key={fase.fase_id} className="relative flex gap-4">
                {/* Timeline line */}
                {index < fases.length - 1 && (
                  <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-border" />
                )}
                
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {statusIcons[faseStatus]}
                </div>

                {/* Content */}
                <Card className="flex-1 mb-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{fase.nome}</h3>
                      <Badge variant={faseStatus === 'concluido' ? 'default' : 'secondary'} className="text-xs">
                        {statusLabels[faseStatus]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{concluidos}/{totalItens} itens</span>
                      <span>·</span>
                      <span>{porcentagem}%</span>
                    </div>
                    <Progress value={porcentagem} className="h-2 mt-2" />
                  </CardContent>
                </Card>
              </div>
            );
          })}
          {fases.length === 0 && (
            <p className="text-muted-foreground text-center py-8">Nenhuma etapa cadastrada ainda.</p>
          )}
        </div>
      </div>

      {/* Photo Gallery */}
      {allPhotos.length > 0 && (
        <div className="container pb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Galeria de Fotos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allPhotos.map((photo, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                <img 
                  src={photo.url} 
                  alt={`Foto da obra - ${photo.atividade}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-xs text-white">
                    {format(parseISO(photo.data), "dd 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>Acompanhamento de obra fornecido por <strong>Obra Certa</strong></p>
      </footer>
    </div>
  );
}