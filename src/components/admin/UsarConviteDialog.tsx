import { useState } from 'react';
import { Key } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useUserInvites } from '@/hooks/useUserInvites';

interface UsarConviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obraId: string;
  onSuccess: () => void;
}

export function UsarConviteDialog({
  open,
  onOpenChange,
  obraId,
  onSuccess,
}: UsarConviteDialogProps) {
  const { toast } = useToast();
  const { useInvite } = useUserInvites(obraId);
  const [pin, setPin] = useState('');

  const handleSubmit = async () => {
    if (pin.length !== 6) {
      toast({
        title: 'PIN inválido',
        description: 'Digite o PIN de 6 dígitos',
        variant: 'destructive',
      });
      return;
    }

    try {
      await useInvite.mutateAsync(pin);
      toast({
        title: 'Acesso concedido!',
        description: 'Você agora tem acesso a esta obra.',
      });
      setPin('');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: 'PIN inválido',
        description: 'O PIN não é válido ou já foi utilizado.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Entrar com PIN
          </DialogTitle>
          <DialogDescription>
            Digite o PIN de 6 dígitos fornecido pelo administrador para acessar esta obra.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-center">
            <InputOTP
              value={pin}
              onChange={setPin}
              maxLength={6}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={pin.length !== 6 || useInvite.isPending}
            className="w-full"
          >
            {useInvite.isPending ? 'Verificando...' : 'Acessar Obra'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
