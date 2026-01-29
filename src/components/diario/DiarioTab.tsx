import { useState } from 'react';
import { Sun, Cloud, CloudRain, CloudSun, Calendar, Save, Loader2, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useDiario } from '@/hooks/useDiario';
import { useToast } from '@/hooks/use-toast';
import { ClimaTipo } from '@/types/database';
import { FotoUpload } from './FotoUpload';

interface DiarioTabProps {
  obraId: string;
}

const climaOptions: { value: ClimaTipo; label: string; icon: React.ReactNode }[] = [
  { value: 'ensolarado', label: 'Ensolarado', icon: <Sun className="w-6 h-6" /> },
  { value: 'parcialmente_nublado', label: 'Parcialmente nublado', icon: <CloudSun className="w-6 h-6" /> },
  { value: 'nublado', label: 'Nublado', icon: <Cloud className="w-6 h-6" /> },
  { value: 'chuvoso', label: 'Chuvoso', icon: <CloudRain className="w-6 h-6" /> },
];

export function DiarioTab({ obraId }: DiarioTabProps) {
  const { registros, isLoading, createDiario } = useDiario(obraId);
  const { toast } = useToast();

  const [clima, setClima] = useState<ClimaTipo>('ensolarado');
  const [atividades, setAtividades] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!atividades.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Descreva as atividades realizadas hoje.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      await createDiario.mutateAsync({
        obra_id: obraId,
        clima,
        atividades_realizadas: atividades.trim(),
        observacoes: observacoes.trim() || undefined,
        fotos: fotos,
      });

      toast({
        title: 'Relatório salvo!',
        description: `Diário de ${new Date().toLocaleDateString('pt-BR')} registrado.`,
      });

      // Limpar form
      setAtividades('');
      setObservacoes('');
      setFotos([]);
      setClima('ensolarado');
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getClimaIcon = (climaValue: ClimaTipo) => {
    const option = climaOptions.find(c => c.value === climaValue);
    return option?.icon;
  };

  const getClimaLabel = (climaValue: ClimaTipo) => {
    const option = climaOptions.find(c => c.value === climaValue);
    return option?.label;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulário do dia */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            Registro de Hoje - {new Date().toLocaleDateString('pt-BR')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seletor de clima */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Clima</Label>
            <div className="grid grid-cols-2 gap-2">
              {climaOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={clima === option.value ? 'default' : 'outline'}
                  className={`h-14 flex items-center gap-2 justify-start ${
                    clima === option.value ? '' : 'text-muted-foreground'
                  }`}
                  onClick={() => setClima(option.value)}
                >
                  {option.icon}
                  <span className="text-sm">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Atividades */}
          <div className="space-y-2">
            <Label htmlFor="atividades" className="text-base font-medium">
              O que foi feito hoje?
            </Label>
            <Textarea
              id="atividades"
              placeholder="Descreva as atividades realizadas..."
              value={atividades}
              onChange={(e) => setAtividades(e.target.value)}
              className="min-h-28 text-base"
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-base font-medium">
              Observações (opcional)
            </Label>
            <Textarea
              id="observacoes"
              placeholder="Problemas, pendências, materiais utilizados..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="min-h-20 text-base"
            />
          </div>

          {/* Upload de fotos */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Fotos da Obra</Label>
            <FotoUpload
              fotos={fotos}
              onFotosChange={setFotos}
              obraId={obraId}
              disabled={saving}
            />
          </div>

          {/* Botão salvar */}
          <Button
            onClick={handleSave}
            className="w-full h-14 text-lg font-semibold"
            disabled={saving || !atividades.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Salvar Relatório
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Histórico */}
      {registros.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Histórico</h3>
          {registros.map((registro) => (
            <Collapsible key={registro.id}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-primary">
                          {getClimaIcon(registro.clima)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {new Date(registro.data).toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getClimaLabel(registro.clima)}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Atividades:</p>
                      <p className="whitespace-pre-wrap">{registro.atividades_realizadas}</p>
                    </div>
                    {registro.observacoes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Observações:</p>
                        <p className="whitespace-pre-wrap">{registro.observacoes}</p>
                      </div>
                    )}
                    {registro.fotos && registro.fotos.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <ImageIcon className="w-4 h-4" />
                          Fotos ({registro.fotos.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {registro.fotos.map((foto, index) => (
                            <a
                              key={index}
                              href={foto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="aspect-square rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity"
                            >
                              <img
                                src={foto}
                                alt={`Foto ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
