import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Hammer,
  MessageCircle,
  Camera,
  CheckCircle,
  Clock,
  Circle,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Building2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DEFAULT_WHATSAPP_MESSAGE = 'Olá! Vim pelo Portal da Obra e gostaria de mais informações.';

const statusIcons: Record<string, React.ReactNode> = {
  concluido: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  em_andamento: <Clock className="w-5 h-5 text-amber-500" />,
  pendente: <Circle className="w-5 h-5 text-muted-foreground" />,
};

const statusLabels: Record<string, string> = {
  concluido: 'Concluída',
  em_andamento: 'Em Andamento',
  pendente: 'Pendente',
};

interface PhotoItem {
  url: string;
  legenda?: string;
  data: string;
  atividade: string;
}

export function PortalCliente() {
  const { token } = useParams<{ token: string }>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Uma única RPC gateada por token traz obra + branding + cronograma + fotos.
  // O anon não tem mais acesso direto às tabelas base — todo o portal
  // público passa por get_portal_data, validando o token no servidor.
  const portalQuery = useQuery({
    queryKey: ['portal-data', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_portal_data' as any, { p_token: token });
      if (error) throw error;
      return data as any; // objeto { obra, branding, cronograma, fotos } ou null
    },
    enabled: !!token,
    retry: 1,
  });

  // --- Loading ---
  if (portalQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-muted-foreground text-sm">Carregando portal…</p>
      </div>
    );
  }

  // --- Erro de rede (distinto de "não encontrado") ---
  if (portalQuery.isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <Building2 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Não foi possível carregar o portal</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          Verifique sua conexão e tente novamente.
        </p>
        <button
          onClick={() => portalQuery.refetch()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // --- Not Found ---
  if (!portalQuery.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <Building2 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Portal não encontrado</h1>
        <p className="text-muted-foreground max-w-md">
          O link do portal pode estar inativo ou incorreto. Entre em contato com o responsável pela obra.
        </p>
      </div>
    );
  }

  const portalData = portalQuery.data;
  const obra = portalData.obra;

  // Group cronograma by fase
  const fases = ((portalData.cronograma as any[]) || [])
    .reduce((acc: any[], item: any) => {
      let fase = acc.find((f: any) => f.fase_id === item.fase_id);
      if (!fase) {
        fase = { fase_id: item.fase_id, nome: item.fase_nome, icone: item.fase_icone, ordem: item.fase_ordem, itens: [] };
        acc.push(fase);
      }
      fase.itens.push(item);
      return acc;
    }, [])
    .sort((a: any, b: any) => a.ordem - b.ordem);

  // Extract photos — handle both string URLs and {url, legenda} objects
  const allPhotos: PhotoItem[] = [];
  ((portalData.fotos as any[]) || []).forEach((entry: any) => {
    const fotos = entry.fotos as any[];
    if (fotos && Array.isArray(fotos)) {
      fotos.forEach((foto: any) => {
        if (typeof foto === 'string') {
          allPhotos.push({ url: foto, data: entry.data, atividade: entry.atividades_realizadas });
        } else if (foto && typeof foto === 'object' && foto.url) {
          allPhotos.push({
            url: foto.url,
            legenda: foto.legenda || undefined,
            data: entry.data,
            atividade: entry.atividades_realizadas,
          });
        }
      });
    }
  });

  const currentPhoto = lightboxIndex !== null ? allPhotos[lightboxIndex] : null;

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightboxIndex === null) return;
    if (direction === 'prev') {
      setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : allPhotos.length - 1);
    } else {
      setLightboxIndex(lightboxIndex < allPhotos.length - 1 ? lightboxIndex + 1 : 0);
    }
  };

  // Stats
  const totalFases = fases.length;
  const fasesConcluidas = fases.filter((f: any) => f.itens.every((i: any) => i.status === 'concluido')).length;

  // Branding
  const branding = portalData.branding;
  const whatsappNumber = branding?.whatsapp?.replace(/\D/g, '') || '';
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(DEFAULT_WHATSAPP_MESSAGE)}`
    : '';

  return (
    <div className="min-h-screen bg-background">
      {/* WhatsApp FAB */}
      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 group"
          aria-label="Falar com o Engenheiro"
          title="Falar com o Engenheiro"
        >
          <MessageCircle className="w-7 h-7 text-white" />
          <span className="absolute right-full mr-3 bg-card text-foreground text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border">
            Falar com o Engenheiro
          </span>
        </a>
      )}

      {/* Hero Header */}
      <header className="relative">
        {obra.foto_capa ? (
          <div className="relative h-56 md:h-72 lg:h-80">
            <img src={obra.foto_capa} alt={obra.nome} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="container">
                <div className="flex items-center gap-3 mb-1">
                  {branding?.empresa_logo_url ? (
                    <img src={branding.empresa_logo_url} alt={branding.empresa_nome || 'Logo'} className="h-8 max-w-[120px] object-contain" />
                  ) : (
                    <Building2 className="w-4 h-4 text-white/80" />
                  )}
                  <span className="text-white/80 text-sm">{branding?.empresa_nome || 'Portal do Cliente'}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">{obra.nome}</h1>
                <div className="flex items-center gap-2 mt-1 text-white/70 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{obra.endereco}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-primary/10 border-b">
            <div className="container py-8">
              <div className="flex items-center gap-3 mb-1">
                {branding?.empresa_logo_url ? (
                  <img src={branding.empresa_logo_url} alt={branding.empresa_nome || 'Logo'} className="h-8 max-w-[120px] object-contain" />
                ) : (
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-muted-foreground text-sm">{branding?.empresa_nome || 'Portal do Cliente'}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{obra.nome}</h1>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4" />
                <span>{obra.endereco}</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Progress Card */}
      <div className="container -mt-6 relative z-10 pb-6" style={obra.foto_capa ? {} : { marginTop: '1.5rem' }}>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold">Progresso Geral</h2>
                <p className="text-sm text-muted-foreground">
                  {fasesConcluidas} de {totalFases} etapas concluídas
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-primary">{obra.progresso ?? 0}%</span>
              </div>
            </div>
            <Progress value={obra.progresso ?? 0} className="h-3" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="container pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline - Left Column */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Etapas da Obra
            </h2>

            {fases.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhuma etapa cadastrada ainda.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-0">
                {fases.map((fase: any, index: number) => {
                  const totalItens = fase.itens.length;
                  const concluidos = fase.itens.filter((i: any) => i.status === 'concluido').length;
                  const emAndamento = fase.itens.some((i: any) => i.status === 'em_andamento');
                  const faseStatus = concluidos === totalItens ? 'concluido' : emAndamento ? 'em_andamento' : 'pendente';
                  const porcentagem = totalItens > 0 ? Math.round((concluidos / totalItens) * 100) : 0;
                  const isLast = index === fases.length - 1;

                  return (
                    <div key={fase.fase_id} className="relative flex gap-4 pb-4">
                      {/* Timeline connector */}
                      {!isLast && (
                        <div
                          className={`absolute left-[18px] top-10 bottom-0 w-0.5 ${
                            faseStatus === 'concluido' ? 'bg-emerald-300' : 'bg-border'
                          }`}
                        />
                      )}

                      {/* Status icon */}
                      <div className="flex-shrink-0 mt-1 z-10 bg-background rounded-full">
                        {statusIcons[faseStatus]}
                      </div>

                      {/* Card */}
                      <Card
                        className={`flex-1 transition-all ${
                          faseStatus === 'em_andamento' ? 'ring-2 ring-amber-400/50 shadow-md' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-sm md:text-base">{fase.nome}</h3>
                            <Badge
                              variant={faseStatus === 'concluido' ? 'default' : 'secondary'}
                              className={`text-xs ${
                                faseStatus === 'concluido'
                                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20'
                                  : faseStatus === 'em_andamento'
                                  ? 'bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20'
                                  : ''
                              }`}
                            >
                              {statusLabels[faseStatus]}
                            </Badge>
                          </div>

                          <Progress value={porcentagem} className="h-2 mb-2" />

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {concluidos}/{totalItens} itens concluídos
                            </span>
                            <span className="font-medium">{porcentagem}%</span>
                          </div>

                          {/* Sub-items for in-progress */}
                          {faseStatus === 'em_andamento' && (
                            <div className="mt-3 pt-3 border-t space-y-1.5">
                              {fase.itens.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-2 text-xs">
                                  <div className="flex-shrink-0">
                                    {item.status === 'concluido' ? (
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : item.status === 'em_andamento' ? (
                                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                                    ) : (
                                      <Circle className="w-3.5 h-3.5 text-muted-foreground/50" />
                                    )}
                                  </div>
                                  <span
                                    className={
                                      item.status === 'concluido'
                                        ? 'line-through text-muted-foreground'
                                        : 'text-foreground'
                                    }
                                  >
                                    {item.descricao}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Photo Gallery - Right Column */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Galeria de Fotos
              {allPhotos.length > 0 && (
                <Badge variant="secondary" className="text-xs ml-1">
                  {allPhotos.length}
                </Badge>
              )}
            </h2>

            {allPhotos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Nenhuma foto publicada ainda.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {allPhotos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setLightboxIndex(index)}
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <img
                      src={photo.url}
                      alt={photo.legenda || `Foto da obra`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-[10px] text-white/90 truncate">
                        {format(parseISO(photo.data), "dd 'de' MMM", { locale: ptBR })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 bg-black/95 border-0 overflow-hidden [&>button]:hidden">
          {currentPhoto && (
            <div className="relative flex flex-col">
              {/* Close */}
              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Navigation */}
              {allPhotos.length > 1 && (
                <>
                  <button
                    onClick={() => navigateLightbox('prev')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => navigateLightbox('next')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image */}
              <div className="flex items-center justify-center min-h-[50vh] max-h-[80vh]">
                <img
                  src={currentPhoto.url}
                  alt={currentPhoto.legenda || 'Foto da obra'}
                  className="max-w-full max-h-[75vh] object-contain"
                />
              </div>

              {/* Info bar */}
              <div className="bg-black/80 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    {currentPhoto.legenda && (
                      <p className="text-sm font-medium mb-1">{currentPhoto.legenda}</p>
                    )}
                    <p className="text-xs text-white/60">
                      {format(parseISO(currentPhoto.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      {currentPhoto.atividade && ` — ${currentPhoto.atividade}`}
                    </p>
                  </div>
                  <span className="text-xs text-white/40">
                    {lightboxIndex !== null ? lightboxIndex + 1 : 0}/{allPhotos.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        {branding?.empresa_logo_url && (
          <img src={branding.empresa_logo_url} alt={branding.empresa_nome || 'Logo'} className="h-6 mx-auto mb-2 object-contain opacity-60" />
        )}
        <p>
          {branding?.empresa_nome ? (
            <>Acompanhamento de obra por <strong className="text-foreground">{branding.empresa_nome}</strong></>
          ) : (
            <>Acompanhamento de obra fornecido por <strong className="text-foreground">Obra Certa</strong></>
          )}
        </p>
      </footer>
    </div>
  );
}
