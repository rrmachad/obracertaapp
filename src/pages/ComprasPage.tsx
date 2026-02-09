import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, ChevronRight, ShoppingCart, Download, AlertTriangle, Package, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { FeatureBlockedOverlay } from '@/components/FeatureBlockedOverlay';
import { SuporteVipButton } from '@/components/SuporteVipButton';
import jsPDF from 'jspdf';

interface MaterialNecessidade {
  id: string;
  nome: string;
  unidade: string;
  categoria: string | null;
  qtd_atual: number;
  qtd_minima: number;
  qtd_faltante: number;
  obra_nome: string;
  obra_id: string;
}

export function ComprasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { limits } = usePlanLimits();
  const [searchTerm, setSearchTerm] = useState('');

  const materiaisQuery = useQuery({
    queryKey: ['compras-necessidades', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Fetch user obras
      const { data: obras, error: obrasError } = await supabase
        .from('obras')
        .select('id, nome')
        .eq('user_id', user.id);
      if (obrasError) throw obrasError;
      if (!obras?.length) return [];

      // Fetch all materials below minimum
      const obraIds = obras.map(o => o.id);
      const { data: materiais, error } = await supabase
        .from('materiais')
        .select('*')
        .in('obra_id', obraIds);
      if (error) throw error;

      const obraMap = Object.fromEntries(obras.map(o => [o.id, o.nome]));
      
      return (materiais || [])
        .filter(m => m.qtd_atual < m.qtd_minima)
        .map(m => ({
          id: m.id,
          nome: m.nome,
          unidade: m.unidade,
          categoria: m.categoria,
          qtd_atual: Number(m.qtd_atual),
          qtd_minima: Number(m.qtd_minima),
          qtd_faltante: Number(m.qtd_minima) - Number(m.qtd_atual),
          obra_nome: obraMap[m.obra_id] || 'Obra desconhecida',
          obra_id: m.obra_id,
        })) as MaterialNecessidade[];
    },
    enabled: !!user?.id,
  });

  const necessidades = materiaisQuery.data || [];

  // Group by category
  const grouped = useMemo(() => {
    const filtered = necessidades.filter(m =>
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.categoria || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const groups: Record<string, MaterialNecessidade[]> = {};
    filtered.forEach(m => {
      const cat = m.categoria || 'Sem Categoria';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    });
    return groups;
  }, [necessidades, searchTerm]);

  const totalItens = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    
    doc.setFontSize(18);
    doc.text('Lista de Cotação de Materiais', 20, 25);
    doc.setFontSize(10);
    doc.text(`Gerado em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`, 20, 33);
    doc.text(`${totalItens} itens necessários`, 20, 39);
    
    let y = 50;
    
    Object.entries(grouped).forEach(([categoria, itens]) => {
      if (y > 260) { doc.addPage(); y = 20; }
      
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(categoria, 20, y);
      y += 8;
      
      // Header
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Material', 20, y);
      doc.text('Qtd Necessária', 110, y);
      doc.text('Unidade', 150, y);
      doc.text('Obra', 170, y);
      y += 2;
      doc.line(20, y, 190, y);
      y += 5;
      
      doc.setFont('helvetica', 'normal');
      itens.forEach(item => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(item.nome, 20, y);
        doc.text(String(item.qtd_faltante), 110, y);
        doc.text(item.unidade, 150, y);
        doc.text(item.obra_nome.substring(0, 20), 170, y);
        y += 6;
      });
      
      y += 4;
    });
    
    doc.save(`cotacao-materiais-${now.toISOString().slice(0, 10)}.pdf`);
  };

  if (!limits.canAccessCompras) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="container flex h-14 items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-bold">Módulo de Compras</h1>
          </div>
        </header>
        <FeatureBlockedOverlay featureKey="compras" onUpgradeClick={() => navigate('/dashboard')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-bold">Módulo de Compras</h1>
          </div>
          {totalItens > 0 && (
            <Button onClick={exportPDF} size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
          )}
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav className="container py-3">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Home className="w-3.5 h-3.5" />
              Dashboard
            </button>
          </li>
          <li><ChevronRight className="w-3.5 h-3.5" /></li>
          <li className="text-foreground font-medium">Compras</li>
        </ol>
      </nav>

      <main className="container pb-8">
        {/* Summary card */}
        <Card className="mb-6">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="font-bold text-lg">{totalItens} {totalItens === 1 ? 'material' : 'materiais'} abaixo do mínimo</p>
                <p className="text-sm text-muted-foreground">Em todas as suas obras</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar material ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Grouped list */}
        {materiaisQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : totalItens === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-1">Estoque em dia!</h3>
              <p className="text-muted-foreground">Nenhum material está abaixo do estoque mínimo.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([categoria, itens]) => (
              <Card key={categoria}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{categoria}</span>
                    <Badge variant="secondary">{itens.length} {itens.length === 1 ? 'item' : 'itens'}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {itens.map(item => (
                      <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{item.nome}</p>
                          <p className="text-xs text-muted-foreground">{item.obra_nome}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-destructive">
                            Precisa: {item.qtd_faltante} {item.unidade}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Atual: {item.qtd_atual} / Min: {item.qtd_minima}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <SuporteVipButton />
    </div>
  );
}