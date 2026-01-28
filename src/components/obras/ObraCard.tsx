import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Obra, ObraStatus } from '@/types/database';

interface ObraCardProps {
  obra: Obra;
}

const statusConfig: Record<ObraStatus, { label: string; className: string }> = {
  planejamento: { label: 'Planejamento', className: 'bg-muted text-muted-foreground' },
  em_andamento: { label: 'Em Andamento', className: 'bg-primary text-primary-foreground' },
  concluida: { label: 'Concluída', className: 'bg-success text-success-foreground' },
  pausada: { label: 'Pausada', className: 'bg-warning text-warning-foreground' },
};

export function ObraCard({ obra }: ObraCardProps) {
  const navigate = useNavigate();
  const status = statusConfig[obra.status];

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50 active:scale-[0.98]"
      onClick={() => navigate(`/obra/${obra.id}`)}
    >
      <CardContent className="p-0">
        {/* Foto de capa */}
        <div className="relative h-32 bg-muted overflow-hidden rounded-t-lg">
          {obra.foto_capa ? (
            <img 
              src={obra.foto_capa} 
              alt={obra.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <div className="text-4xl font-bold text-primary/40">
                {obra.nome.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          <Badge className={`absolute top-2 right-2 ${status.className}`}>
            {status.label}
          </Badge>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{obra.nome}</h3>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{obra.endereco}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold text-primary">{obra.progresso}%</span>
            </div>
            <Progress value={obra.progresso} className="h-3" />
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Criada em {new Date(obra.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
