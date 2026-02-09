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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Download, FileJson, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ExportUserDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userEmail: string | null;
}

type ExportFormat = 'json' | 'csv' | 'excel';

interface ExportData {
  exportInfo: {
    exportedAt: string;
    exportedBy: string;
    targetUserId: string;
  };
  profile: Record<string, unknown> | null;
  subscription: Record<string, unknown> | null;
  roles: Record<string, unknown>[] | null;
  settings: Record<string, unknown> | null;
  obras: Array<{
    id: string;
    nome: string;
    endereco: string;
    status: string;
    progresso: number;
    created_at: string;
    diarios: Array<Record<string, unknown>>;
    materiais: Array<Record<string, unknown>>;
    cronograma: Array<Record<string, unknown>>;
  }>;
  estatisticas: {
    totalObras: number;
    totalDiarios: number;
    totalMateriais: number;
    totalCronogramaItens: number;
  };
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
  const [format, setFormat] = useState<ExportFormat>('json');

  const sanitizeFileName = (name: string) => {
    return name.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
  };

  const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, string> => {
    const result: Record<string, string> = {};
    
    for (const key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}_${key}` : key;
      
      if (value === null || value === undefined) {
        result[newKey] = '';
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
      } else if (Array.isArray(value)) {
        result[newKey] = JSON.stringify(value);
      } else {
        result[newKey] = String(value);
      }
    }
    
    return result;
  };

  const exportAsJSON = (data: ExportData, fileName: string) => {
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    downloadFile(blob, `${fileName}.json`);
  };

  const exportAsCSV = (data: ExportData, fileName: string) => {
    const workbook = XLSX.utils.book_new();

    // Profile sheet
    if (data.profile) {
      const profileData = [flattenObject(data.profile)];
      const profileSheet = XLSX.utils.json_to_sheet(profileData);
      XLSX.utils.book_append_sheet(workbook, profileSheet, 'Perfil');
    }

    // Subscription sheet
    if (data.subscription) {
      const subscriptionData = [flattenObject(data.subscription)];
      const subscriptionSheet = XLSX.utils.json_to_sheet(subscriptionData);
      XLSX.utils.book_append_sheet(workbook, subscriptionSheet, 'Assinatura');
    }

    // Obras sheet
    if (data.obras && data.obras.length > 0) {
      const obrasData = data.obras.map(obra => ({
        id: obra.id,
        nome: obra.nome,
        endereco: obra.endereco,
        status: obra.status,
        progresso: obra.progresso,
        created_at: obra.created_at,
        total_diarios: obra.diarios?.length || 0,
        total_materiais: obra.materiais?.length || 0,
        total_cronograma: obra.cronograma?.length || 0,
      }));
      const obrasSheet = XLSX.utils.json_to_sheet(obrasData);
      XLSX.utils.book_append_sheet(workbook, obrasSheet, 'Obras');

      // Diários sheet (all diaries combined)
      const allDiarios = data.obras.flatMap(obra => 
        (obra.diarios || []).map(diario => ({
          obra_nome: obra.nome,
          ...flattenObject(diario as Record<string, unknown>)
        }))
      );
      if (allDiarios.length > 0) {
        const diariosSheet = XLSX.utils.json_to_sheet(allDiarios);
        XLSX.utils.book_append_sheet(workbook, diariosSheet, 'Diarios');
      }

      // Materiais sheet
      const allMateriais = data.obras.flatMap(obra => 
        (obra.materiais || []).map(material => ({
          obra_nome: obra.nome,
          ...flattenObject(material as Record<string, unknown>)
        }))
      );
      if (allMateriais.length > 0) {
        const materiaisSheet = XLSX.utils.json_to_sheet(allMateriais);
        XLSX.utils.book_append_sheet(workbook, materiaisSheet, 'Materiais');
      }

      // Cronograma sheet
      const allCronograma = data.obras.flatMap(obra => 
        (obra.cronograma || []).map(item => ({
          obra_nome: obra.nome,
          ...flattenObject(item as Record<string, unknown>)
        }))
      );
      if (allCronograma.length > 0) {
        const cronogramaSheet = XLSX.utils.json_to_sheet(allCronograma);
        XLSX.utils.book_append_sheet(workbook, cronogramaSheet, 'Cronograma');
      }
    }

    // Estatísticas sheet
    const statsData = [{
      total_obras: data.estatisticas.totalObras,
      total_diarios: data.estatisticas.totalDiarios,
      total_materiais: data.estatisticas.totalMateriais,
      total_cronograma_itens: data.estatisticas.totalCronogramaItens,
      exportado_em: data.exportInfo.exportedAt,
    }];
    const statsSheet = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estatisticas');

    // Generate CSV (single sheet with all data flattened)
    const csvContent = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet([
      { secao: 'PERFIL', ...flattenObject(data.profile || {}) },
      { secao: 'ASSINATURA', ...flattenObject(data.subscription || {}) },
      ...data.obras.map(obra => ({
        secao: 'OBRA',
        obra_nome: obra.nome,
        obra_endereco: obra.endereco,
        obra_status: obra.status,
        obra_progresso: obra.progresso,
      })),
    ]));

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `${fileName}.csv`);
  };

  const exportAsExcel = (data: ExportData, fileName: string) => {
    const workbook = XLSX.utils.book_new();

    // Profile sheet
    if (data.profile) {
      const profileData = [flattenObject(data.profile)];
      const profileSheet = XLSX.utils.json_to_sheet(profileData);
      XLSX.utils.book_append_sheet(workbook, profileSheet, 'Perfil');
    }

    // Subscription sheet
    if (data.subscription) {
      const subscriptionData = [flattenObject(data.subscription)];
      const subscriptionSheet = XLSX.utils.json_to_sheet(subscriptionData);
      XLSX.utils.book_append_sheet(workbook, subscriptionSheet, 'Assinatura');
    }

    // Obras sheet
    if (data.obras && data.obras.length > 0) {
      const obrasData = data.obras.map(obra => ({
        id: obra.id,
        nome: obra.nome,
        endereco: obra.endereco,
        status: obra.status,
        progresso: obra.progresso,
        created_at: obra.created_at,
        total_diarios: obra.diarios?.length || 0,
        total_materiais: obra.materiais?.length || 0,
        total_cronograma: obra.cronograma?.length || 0,
      }));
      const obrasSheet = XLSX.utils.json_to_sheet(obrasData);
      XLSX.utils.book_append_sheet(workbook, obrasSheet, 'Obras');

      // Diários sheet
      const allDiarios = data.obras.flatMap(obra => 
        (obra.diarios || []).map(diario => ({
          obra_nome: obra.nome,
          ...flattenObject(diario as Record<string, unknown>)
        }))
      );
      if (allDiarios.length > 0) {
        const diariosSheet = XLSX.utils.json_to_sheet(allDiarios);
        XLSX.utils.book_append_sheet(workbook, diariosSheet, 'Diarios');
      }

      // Materiais sheet
      const allMateriais = data.obras.flatMap(obra => 
        (obra.materiais || []).map(material => ({
          obra_nome: obra.nome,
          ...flattenObject(material as Record<string, unknown>)
        }))
      );
      if (allMateriais.length > 0) {
        const materiaisSheet = XLSX.utils.json_to_sheet(allMateriais);
        XLSX.utils.book_append_sheet(workbook, materiaisSheet, 'Materiais');
      }

      // Cronograma sheet
      const allCronograma = data.obras.flatMap(obra => 
        (obra.cronograma || []).map(item => ({
          obra_nome: obra.nome,
          ...flattenObject(item as Record<string, unknown>)
        }))
      );
      if (allCronograma.length > 0) {
        const cronogramaSheet = XLSX.utils.json_to_sheet(allCronograma);
        XLSX.utils.book_append_sheet(workbook, cronogramaSheet, 'Cronograma');
      }
    }

    // Estatísticas sheet
    const statsData = [{
      total_obras: data.estatisticas.totalObras,
      total_diarios: data.estatisticas.totalDiarios,
      total_materiais: data.estatisticas.totalMateriais,
      total_cronograma_itens: data.estatisticas.totalCronogramaItens,
      exportado_em: data.exportInfo.exportedAt,
    }];
    const statsSheet = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estatisticas');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadFile(blob, `${fileName}.xlsx`);
  };

  const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-export-user-data', {
        body: { userId },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const exportData = data.data as ExportData;
      const fileName = `dados-usuario-${sanitizeFileName(userName)}-${new Date().toISOString().split('T')[0]}`;

      switch (format) {
        case 'json':
          exportAsJSON(exportData, fileName);
          break;
        case 'csv':
          exportAsCSV(exportData, fileName);
          break;
        case 'excel':
          exportAsExcel(exportData, fileName);
          break;
      }

      setExportComplete(true);
      toast({
        title: "Dados exportados",
        description: `O arquivo ${format.toUpperCase()} foi baixado com sucesso.`,
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
      setFormat('json');
    }
    onOpenChange(newOpen);
  };

  const formatLabels = {
    json: { label: 'JSON', description: 'Formato completo para backup/importação', icon: FileJson },
    csv: { label: 'CSV', description: 'Compatível com Excel, dados simplificados', icon: FileSpreadsheet },
    excel: { label: 'Excel', description: 'Planilha com múltiplas abas organizadas', icon: FileSpreadsheet },
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
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
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Label className="text-sm font-medium">Formato de exportação:</Label>
          <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)} className="space-y-3">
            {(Object.keys(formatLabels) as ExportFormat[]).map((key) => {
              const { label, description, icon: Icon } = formatLabels[key];
              return (
                <div key={key} className="flex items-start space-x-3">
                  <RadioGroupItem value={key} id={key} className="mt-1" />
                  <Label htmlFor={key} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <p className="font-medium mb-1">Dados incluídos:</p>
            <ul className="list-disc list-inside text-xs space-y-0.5">
              <li>Perfil e configurações</li>
              <li>Obras com diários e materiais</li>
              <li>Cronogramas e estatísticas</li>
            </ul>
          </div>

          {exportComplete && (
            <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 p-2 rounded-md">
              <CheckCircle className="w-4 h-4" />
              Exportação concluída com sucesso!
            </div>
          )}
        </div>

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
                Exportar {formatLabels[format].label}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
