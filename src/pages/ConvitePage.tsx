import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HardHat, Eye, EyeOff, Mail, Lock, User, Key, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Analytics } from '@/lib/analytics';

export function ConvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const pinFromUrl = searchParams.get('pin') || '';
  const hasPinInUrl = pinFromUrl.length === 6;

  const [step, setStep] = useState<'validating' | 'enter-pin' | 'register' | 'error'>(
    hasPinInUrl ? 'validating' : 'enter-pin'
  );
  const [pin, setPin] = useState(pinFromUrl);
  const [pinValid, setPinValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Auto-validate PIN from URL
  useEffect(() => {
    if (hasPinInUrl && step === 'validating') {
      validatePin(pinFromUrl);
    }
  }, []);

  const validatePin = async (pinCode: string) => {
    try {
      const { data: invite, error } = await supabase
        .from('user_invites')
        .select('id')
        .eq('pin_code', pinCode)
        .is('used_by', null)
        .maybeSingle();

      if (error || !invite) {
        setStep('error');
        setErrorMessage(t('auth.invalidOrUsedPin', 'Este convite é inválido ou já foi utilizado.'));
        return;
      }

      setPinValid(true);
      setStep('register');
    } catch {
      setStep('error');
      setErrorMessage(t('auth.errorValidatingPin', 'Erro ao validar o convite. Tente novamente.'));
    }
  };

  const handleManualPinSubmit = () => {
    if (pin.length !== 6) return;
    setStep('validating');
    validatePin(pin);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !password.trim()) {
      toast({ title: t('auth.requiredFields'), description: t('auth.fillAllFields'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('claim-invite', {
        body: { pin_code: pin, email, password, nome },
      });

      if (error) {
        let errorMsg = t('auth.tryAgain');
        try {
          const context = (error as any)?.context;
          if (context && typeof context.json === 'function') {
            const body = await context.json();
            errorMsg = body?.error || errorMsg;
          } else {
            errorMsg = error.message || errorMsg;
          }
        } catch {
          errorMsg = error.message || errorMsg;
        }
        toast({ title: t('auth.signupError'), description: errorMsg, variant: 'destructive' });
        if (errorMsg.includes('PIN inválido') || errorMsg.includes('Invalid PIN')) {
          setStep('enter-pin');
          setPin('');
        }
        return;
      }

      if (data?.error) {
        toast({ title: t('auth.signupError'), description: data.error, variant: 'destructive' });
        if (data.error.includes('PIN inválido') || data.error.includes('Invalid PIN')) {
          setStep('enter-pin');
          setPin('');
        }
        return;
      }

      toast({ title: t('auth.accountCreated'), description: t('auth.loggingIn') });
      Analytics.signupCompleted('pin');

      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        toast({ title: t('auth.accountCreated'), description: t('auth.loginAfterCreate') });
        navigate('/auth');
      } else {
        navigate('/dashboard');
      }
    } catch {
      toast({ title: t('auth.error'), description: t('auth.processingInvite'), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher variant="outline" />
      </div>
      <Card className="w-full max-w-md border-2 border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
            <Key className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{t('app.name')}</CardTitle>
            <CardDescription className="text-base">
              {step === 'validating' && t('auth.validatingInvite', 'Validando convite...')}
              {step === 'enter-pin' && t('auth.loginWithPin')}
              {step === 'register' && t('auth.createYourAccount')}
              {step === 'error' && t('auth.inviteError', 'Convite inválido')}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {step === 'validating' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t('auth.validatingInvite', 'Validando convite...')}</p>
            </div>
          )}

          {step === 'enter-pin' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {t('auth.pinDescription')}
              </p>
              <div className="flex justify-center">
                <InputOTP value={pin} onChange={setPin} maxLength={6}>
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
              <Button onClick={handleManualPinSubmit} disabled={pin.length !== 6} className="w-full h-14 text-lg font-semibold">
                {t('auth.continue')}
              </Button>
            </div>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="p-3 bg-primary/10 rounded-lg flex items-center gap-2 justify-center border border-primary/20">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <p className="text-sm font-medium text-primary">{t('auth.inviteValidated', 'Convite válido! Complete seu cadastro.')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-base font-medium">{t('auth.fullName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input id="nome" type="text" placeholder={t('auth.fullNamePlaceholder')} value={nome} onChange={(e) => setNome(e.target.value)} className="pl-10 h-12 text-base" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email" className="text-base font-medium">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input id="invite-email" type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 text-base" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-password" className="text-base font-medium">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input id="invite-password" type={showPassword ? 'text' : 'password'} placeholder={t('auth.createPassword')} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12 text-base" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-14 text-lg font-semibold" disabled={submitting}>
                {submitting ? t('auth.creatingAccount') : t('auth.createAndAccess')}
              </Button>
            </form>
          )}

          {step === 'error' && (
            <div className="space-y-4 text-center py-4">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <Button variant="outline" onClick={() => { setStep('enter-pin'); setPin(''); }} className="w-full">
                {t('auth.tryManualPin', 'Digitar PIN manualmente')}
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="flex items-center gap-1 mx-auto text-primary hover:underline font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('auth.backToLogin')}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
