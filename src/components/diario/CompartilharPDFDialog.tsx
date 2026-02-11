import { useState } from 'react';
import { Download, Mail, MessageCircle, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';

interface CompartilharPDFDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfDoc: jsPDF | null;
  filename: string;
  titulo: string;
}

export function CompartilharPDFDialog({ open, onOpenChange, pdfDoc, filename, titulo }: CompartilharPDFDialogProps) {
  const { t } = useTranslation();
  const [sharing, setSharing] = useState<'download' | 'whatsapp' | 'email' | null>(null);
  const [done, setDone] = useState<'download' | 'whatsapp' | 'email' | null>(null);
  const { toast } = useToast();

  const handleDownload = () => {
    if (!pdfDoc) return;
    setSharing('download');
    try {
      pdfDoc.save(filename);
      setDone('download');
      toast({ title: t('dialogs.pdfDownloaded'), description: t('dialogs.savedToDevice') });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({ title: t('dialogs.errorDownloading'), description: t('dialogs.couldNotDownload'), variant: 'destructive' });
    } finally {
      setSharing(null);
    }
  };

  const handleShare = async (type: 'whatsapp' | 'email') => {
    if (!pdfDoc) return;
    setSharing(type);
    try {
      const pdfBlob = pdfDoc.output('blob');
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: titulo, text: `📋 ${titulo}` });
        setDone(type);
        toast({ title: t('dialogs.pdfShared'), description: t('dialogs.sharedSuccess') });
      } else {
        pdfDoc.save(filename);
        toast({ title: t('dialogs.pdfDownloaded'), description: type === 'whatsapp' ? t('dialogs.openWhatsAppFallback') : t('dialogs.openEmailFallback') });
        setDone(type);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        pdfDoc.save(filename);
        toast({ title: t('dialogs.pdfDownloaded'), description: type === 'whatsapp' ? t('dialogs.openWhatsAppFallback') : t('dialogs.openEmailFallback') });
        setDone(type);
      }
    } finally {
      setSharing(null);
    }
  };

  const handleClose = () => { setDone(null); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{t('dialogs.pdfGenerated')}</DialogTitle>
          <DialogDescription className="text-center">{t('dialogs.whatToDo')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button variant={done === 'download' ? 'secondary' : 'default'} size="lg" className="w-full justify-start gap-3 h-14" onClick={handleDownload} disabled={sharing !== null}>
            {sharing === 'download' ? <Loader2 className="w-5 h-5 animate-spin" /> : done === 'download' ? <Check className="w-5 h-5 text-primary" /> : <Download className="w-5 h-5" />}
            <div className="flex flex-col items-start">
              <span className="font-medium">{t('dialogs.downloadPdf')}</span>
              <span className="text-xs opacity-70">{t('dialogs.saveToDevice')}</span>
            </div>
          </Button>

          <Button variant={done === 'whatsapp' ? 'secondary' : 'outline'} size="lg" className="w-full justify-start gap-3 h-14" onClick={() => handleShare('whatsapp')} disabled={sharing !== null}>
            {sharing === 'whatsapp' ? <Loader2 className="w-5 h-5 animate-spin" /> : done === 'whatsapp' ? <Check className="w-5 h-5 text-primary" /> : <MessageCircle className="w-5 h-5" />}
            <div className="flex flex-col items-start">
              <span className="font-medium">{t('dialogs.sendWhatsApp')}</span>
              <span className="text-xs opacity-70">{t('dialogs.sharePdf')}</span>
            </div>
          </Button>

          <Button variant={done === 'email' ? 'secondary' : 'outline'} size="lg" className="w-full justify-start gap-3 h-14" onClick={() => handleShare('email')} disabled={sharing !== null}>
            {sharing === 'email' ? <Loader2 className="w-5 h-5 animate-spin" /> : done === 'email' ? <Check className="w-5 h-5 text-primary" /> : <Mail className="w-5 h-5" />}
            <div className="flex flex-col items-start">
              <span className="font-medium">{t('dialogs.sendEmail')}</span>
              <span className="text-xs opacity-70">{t('dialogs.sharePdf')}</span>
            </div>
          </Button>
        </div>

        <Button variant="ghost" className="mt-2" onClick={handleClose}>{t('common.close')}</Button>
      </DialogContent>
    </Dialog>
  );
}
