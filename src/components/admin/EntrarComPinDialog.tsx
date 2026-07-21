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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

interface EntrarComPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EntrarComPinDialog({
  open,
  onOpenChange,
  onSuccess,
}: EntrarComPinDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (pin.length !== 6) {
      toast({
        title: 'PIN inválido',
        description: 'Digite o PIN de 6 dígitos',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Resgate server-side (RPC SECURITY DEFINER): valida o PIN, marca o
      // convite como usado e cria o obra_access, tudo no servidor.
      const { data, error } = await supabase.rpc('redeem_invite' as any, { p_pin: pin });
      const result = data as { success: boolean; error?: string; obra_id?: string } | null;

      if (error || !result || !result.success) {
        const code = result?.error;
        const description =
          code === 'already_has_access'
            ? 'Você já tem acesso a esta obra.'
            : code === 'expired'
            ? 'Este convite expirou. Solicite um novo ao administrador.'
            : 'O PIN não é válido ou já foi utilizado.';
        toast({ title: 'PIN inválido', description, variant: 'destructive' });
        return;
      }

      toast({
        title: 'Acesso concedido!',
        description: 'Você agora tem acesso à obra compartilhada.',
      });

      setPin('');
      onOpenChange(false);

      // Invalidar queries para atualizar lista de obras
      queryClient.invalidateQueries({ queryKey: ['obras'] });

      onSuccess?.();
    } catch (error) {
      console.error('Error using invite:', error);
      toast({
        title: 'PIN inválido',
        description: 'O PIN não é válido ou já foi utilizado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
            Digite o PIN de 6 dígitos fornecido pelo administrador para acessar uma obra compartilhada.
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
            disabled={pin.length !== 6 || loading}
            className="w-full"
          >
            {loading ? 'Verificando...' : 'Acessar Obra'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
