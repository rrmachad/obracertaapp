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
      // Buscar convite pelo PIN (sem filtrar por obra_id)
      const { data: invite, error: findError } = await supabase
        .from('user_invites')
        .select('*')
        .eq('pin_code', pin)
        .is('used_by', null)
        .maybeSingle();

      if (findError || !invite) {
        throw new Error('PIN inválido ou já utilizado');
      }

      // Marcar convite como usado
      const { error: updateError } = await supabase
        .from('user_invites')
        .update({
          used_by: user.id,
          used_at: new Date().toISOString(),
        })
        .eq('id', invite.id);

      if (updateError) throw updateError;

      // Criar acesso à obra
      const { error: accessError } = await supabase
        .from('obra_access')
        .insert({
          obra_id: invite.obra_id,
          user_id: user.id,
          role: invite.role,
          granted_by: invite.invited_by,
        });

      if (accessError) throw accessError;

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
