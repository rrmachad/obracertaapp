import { useState } from 'react';
import { Download, Mail, MessageCircle, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface CompartilharPDFDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfDoc: jsPDF | null;
  filename: string;
  titulo: string;
}

export function CompartilharPDFDialog({
  open,
  onOpenChange,
  pdfDoc,
  filename,
  titulo,
}: CompartilharPDFDialogProps) {
  const [sharing, setSharing] = useState<'download' | 'whatsapp' | 'email' | null>(null);
  const [done, setDone] = useState<'download' | 'whatsapp' | 'email' | null>(null);
  const { toast } = useToast();

  const handleDownload = () => {
    if (!pdfDoc) return;
    setSharing('download');
    
    try {
      pdfDoc.save(filename);
      setDone('download');
      toast({
        title: "PDF baixado!",
        description: "O relatório foi salvo no seu dispositivo.",
      });
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível baixar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSharing(null);
    }
  };

  const handleWhatsApp = async () => {
    if (!pdfDoc) return;
    setSharing('whatsapp');
    
    try {
      // Gerar blob do PDF
      const pdfBlob = pdfDoc.output('blob');
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });

      // Verificar se pode compartilhar arquivos
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: titulo,
          text: `📋 ${titulo}`,
        });
        setDone('whatsapp');
        toast({
          title: "PDF compartilhado!",
          description: "O relatório foi enviado com sucesso.",
        });
      } else {
        // Fallback: baixar e instruir o usuário
        pdfDoc.save(filename);
        toast({
          title: "PDF baixado!",
          description: "Abra o WhatsApp e envie o arquivo baixado como anexo.",
        });
        setDone('whatsapp');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Erro ao compartilhar via WhatsApp:', error);
        // Fallback: baixar
        pdfDoc.save(filename);
        toast({
          title: "PDF baixado!",
          description: "Abra o WhatsApp e envie o arquivo baixado como anexo.",
        });
        setDone('whatsapp');
      }
    } finally {
      setSharing(null);
    }
  };

  const handleEmail = async () => {
    if (!pdfDoc) return;
    setSharing('email');
    
    try {
      // Gerar blob do PDF
      const pdfBlob = pdfDoc.output('blob');
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });

      // Verificar se pode compartilhar arquivos
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: titulo,
          text: `📋 ${titulo}`,
        });
        setDone('email');
        toast({
          title: "PDF compartilhado!",
          description: "O relatório foi enviado com sucesso.",
        });
      } else {
        // Fallback: baixar e instruir o usuário
        pdfDoc.save(filename);
        toast({
          title: "PDF baixado!",
          description: "Abra seu email e anexe o arquivo baixado.",
        });
        setDone('email');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Erro ao compartilhar via Email:', error);
        // Fallback: baixar
        pdfDoc.save(filename);
        toast({
          title: "PDF baixado!",
          description: "Abra seu email e anexe o arquivo baixado.",
        });
        setDone('email');
      }
    } finally {
      setSharing(null);
    }
  };

  const handleClose = () => {
    setDone(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">PDF Gerado!</DialogTitle>
          <DialogDescription className="text-center">
            O que deseja fazer com o relatório?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button
            variant={done === 'download' ? 'secondary' : 'default'}
            size="lg"
            className="w-full justify-start gap-3 h-14"
            onClick={handleDownload}
            disabled={sharing !== null}
          >
            {sharing === 'download' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : done === 'download' ? (
              <Check className="w-5 h-5 text-primary" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <div className="flex flex-col items-start">
              <span className="font-medium">Baixar PDF</span>
              <span className="text-xs opacity-70">Salvar no dispositivo</span>
            </div>
          </Button>

          <Button
            variant={done === 'whatsapp' ? 'secondary' : 'outline'}
            size="lg"
            className="w-full justify-start gap-3 h-14"
            onClick={handleWhatsApp}
            disabled={sharing !== null}
          >
            {sharing === 'whatsapp' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : done === 'whatsapp' ? (
              <Check className="w-5 h-5 text-primary" />
            ) : (
              <MessageCircle className="w-5 h-5" />
            )}
            <div className="flex flex-col items-start">
              <span className="font-medium">Enviar via WhatsApp</span>
              <span className="text-xs opacity-70">Compartilhar o PDF</span>
            </div>
          </Button>

          <Button
            variant={done === 'email' ? 'secondary' : 'outline'}
            size="lg"
            className="w-full justify-start gap-3 h-14"
            onClick={handleEmail}
            disabled={sharing !== null}
          >
            {sharing === 'email' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : done === 'email' ? (
              <Check className="w-5 h-5 text-primary" />
            ) : (
              <Mail className="w-5 h-5" />
            )}
            <div className="flex flex-col items-start">
              <span className="font-medium">Enviar por Email</span>
              <span className="text-xs opacity-70">Compartilhar o PDF</span>
            </div>
          </Button>
        </div>

        <Button
          variant="ghost"
          className="mt-2"
          onClick={handleClose}
        >
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
