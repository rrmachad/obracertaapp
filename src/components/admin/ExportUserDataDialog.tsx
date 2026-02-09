import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, FileJson, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ExportUserDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userEmail: string | null;
}

export function ExportUserDataDialog({
  open,
  onOpenChange,
  userId,
  userName,
  userEmail,
}: ExportUserDataDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-export-user-data', {
        body: { userId },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      // Criar e baixar o arquivo JSON
      const exportContent = JSON.stringify(data.data, null, 2);
      const blob = new Blob([exportContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `dados-usuario-${userName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportComplete(true);
      toast({
        title: "Dados exportados",
        description: "O arquivo JSON foi baixado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setExportComplete(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5" />
            Exportar Dados do Usuário
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3">
              <p>
                Exportar todos os dados associados ao usuário:
              </p>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-medium">{userName}</p>
                <p className="text-sm text-muted-foreground">{userEmail || 'Email não cadastrado'}</p>
              </div>
              <p className="text-sm">
                O arquivo JSON incluirá:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Perfil e configurações</li>
                <li>Todas as obras e seus dados</li>
                <li>Diários de obra com fotos</li>
                <li>Materiais e movimentações de estoque</li>
                <li>Cronogramas e itens</li>
                <li>Histórico de alterações</li>
              </ul>
              {exportComplete && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-500/10 p-2 rounded-md">
                  <CheckCircle className="w-4 h-4" />
                  Exportação concluída com sucesso!
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isExporting}>
            {exportComplete ? 'Fechar' : 'Cancelar'}
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar JSON
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
