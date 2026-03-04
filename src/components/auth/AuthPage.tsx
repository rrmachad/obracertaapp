import { useState } from 'react';
import { Analytics } from '@/lib/analytics';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HardHat, Eye, EyeOff, Mail, Lock, User, Key, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface AuthPageProps {
  defaultMode?: 'login' | 'signup';
}

type AuthMode = 'login' | 'signup' | 'pin' | 'pin-register' | 'forgot';

export function AuthPage({ defaultMode = 'login' }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: t('auth.loginError'),
            description: error.message === 'Invalid login credentials' 
              ? t('auth.invalidCredentials') 
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({ title: t('auth.welcome'), description: t('auth.loginSuccess') });
          navigate('/dashboard');
        }
      } else if (mode === 'signup') {
        if (!nome.trim()) {
          toast({ title: t('auth.nameRequired'), description: t('auth.nameRequiredDesc'), variant: 'destructive' });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, nome);
        if (error) {
          const message = error.message.includes('already registered') ? t('auth.alreadyRegistered') : error.message;
          toast({ title: t('auth.signupError'), description: message, variant: 'destructive' });
        } else {
          Analytics.signupCompleted('email');
          toast({ title: t('auth.accountCreated'), description: t('auth.signupSuccess') });
          navigate('/dashboard');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePinValidate = async () => {
    if (pin.length !== 6) {
      toast({ title: t('auth.invalidPin'), description: t('auth.enterPin'), variant: 'destructive' });
      return;
    }
    setMode('pin-register');
  };

  const handlePinRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !password.trim()) {
      toast({ title: t('auth.requiredFields'), description: t('auth.fillAllFields'), variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('claim-invite', {
        body: { pin_code: pin, email, password, nome },
      });

      if (error) {
        let errorMessage = t('auth.tryAgain');
        try {
          const context = (error as any)?.context;
          if (context && typeof context.json === 'function') {
            const body = await context.json();
            errorMessage = body?.error || errorMessage;
          } else {
            errorMessage = error.message || errorMessage;
          }
        } catch {
          errorMessage = error.message || errorMessage;
        }
        
        toast({
          title: t('auth.signupError'),
          description: errorMessage,
          variant: 'destructive',
        });
        if (errorMessage.includes('PIN inválido') || errorMessage.includes('Invalid PIN')) {
          setMode('pin');
          setPin('');
        }
        return;
      }

      if (data?.error) {
        toast({
          title: t('auth.signupError'),
          description: data.error,
          variant: 'destructive',
        });
        if (data.error.includes('PIN inválido') || data.error.includes('Invalid PIN')) {
          setMode('pin');
          setPin('');
        }
        return;
      }

      toast({ title: t('auth.accountCreated'), description: t('auth.loggingIn') });
      Analytics.signupCompleted('pin');
      
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        toast({ title: t('auth.accountCreated'), description: t('auth.loginAfterCreate') });
        setMode('login');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast({ title: t('auth.error'), description: t('auth.processingInvite'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const renderPinStep = () => (
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
      <Button onClick={handlePinValidate} disabled={pin.length !== 6} className="w-full h-14 text-lg font-semibold">
        {t('auth.continue')}
      </Button>
    </div>
  );

  const renderPinRegisterStep = () => (
    <form onSubmit={handlePinRegister} className="space-y-4">
      <div className="p-3 bg-muted rounded-lg text-center">
        <p className="text-sm text-muted-foreground">PIN: <code className="font-mono font-bold">{pin}</code></p>
      </div>
      <p className="text-sm text-muted-foreground text-center">
        {t('auth.pinRegisterDescription')}
      </p>
      <div className="space-y-2">
        <Label htmlFor="nome" className="text-base font-medium">{t('auth.fullName')}</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input id="nome" type="text" placeholder={t('auth.fullNamePlaceholder')} value={nome} onChange={(e) => setNome(e.target.value)} className="pl-10 h-12 text-base" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pin-email" className="text-base font-medium">{t('auth.email')}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input id="pin-email" type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 text-base" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pin-password" className="text-base font-medium">{t('auth.password')}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input id="pin-password" type={showPassword ? 'text' : 'password'} placeholder={t('auth.createPassword')} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12 text-base" required minLength={6} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full h-14 text-lg font-semibold" disabled={loading}>
        {loading ? t('auth.creatingAccount') : t('auth.createAndAccess')}
      </Button>
    </form>
  );

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: t('auth.error'), description: t('auth.enterEmail'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: t('auth.error'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: t('auth.resetEmailSent'), description: t('auth.resetEmailSentDesc') });
        setMode('login');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderForgotPasswordForm = () => (
    <form onSubmit={handleForgotPassword} className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">{t('auth.forgotPasswordDesc')}</p>
      <div className="space-y-2">
        <Label htmlFor="forgot-email" className="text-base font-medium">{t('auth.email')}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input id="forgot-email" type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 text-base" required />
        </div>
      </div>
      <Button type="submit" className="w-full h-14 text-lg font-semibold" disabled={loading}>
        {loading ? t('auth.waiting') : t('auth.sendResetLink')}
      </Button>
    </form>
  );

  const renderLoginSignupForm = () => (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-base font-medium">{t('auth.fullName')}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input id="nome" type="text" placeholder={t('auth.fullNamePlaceholder')} value={nome} onChange={(e) => setNome(e.target.value)} className="pl-10 h-12 text-base" />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-medium">{t('auth.email')}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input id="email" type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 text-base" required />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-base font-medium">{t('auth.password')}</Label>
            {mode === 'login' && (
              <button type="button" onClick={() => setMode('forgot')} className="text-sm text-primary hover:underline">
                {t('auth.forgotPassword')}
              </button>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input id="password" type={showPassword ? 'text' : 'password'} placeholder={t('auth.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12 text-base" required minLength={6} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full h-14 text-lg font-semibold" disabled={loading}>
          {loading ? t('auth.waiting') : mode === 'login' ? t('auth.login') : t('auth.createAccount')}
        </Button>
      </form>

      <div className="mt-4">
        <Button
          variant="outline"
          className="w-full h-12 text-base"
          onClick={() => { setMode('pin'); setPin(''); }}
        >
          <Key className="w-5 h-5 mr-2" />
          {t('auth.enterWithPin')}
        </Button>
      </div>
    </>
  );

  const getTitle = () => {
    if (mode === 'pin') return t('auth.loginWithPin');
    if (mode === 'pin-register') return t('auth.createYourAccount');
    if (mode === 'forgot') return t('auth.forgotPasswordTitle');
    return mode === 'login' ? t('auth.loginTitle') : t('auth.signupTitle');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher variant="outline" />
      </div>
      <Card className="w-full max-w-md border-2 border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
            {mode === 'pin' || mode === 'pin-register' ? (
              <Key className="w-10 h-10 text-primary-foreground" />
            ) : (
              <HardHat className="w-10 h-10 text-primary-foreground" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{t('app.name')}</CardTitle>
            <CardDescription className="text-base">{getTitle()}</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          {mode === 'pin' && renderPinStep()}
          {mode === 'pin-register' && renderPinRegisterStep()}
          {mode === 'forgot' && renderForgotPasswordForm()}
          {(mode === 'login' || mode === 'signup') && renderLoginSignupForm()}

          <div className="mt-6 text-center space-y-2">
            {(mode === 'pin' || mode === 'pin-register' || mode === 'forgot') && (
              <button
                type="button"
                onClick={() => { setMode('login'); setPin(''); setEmail(''); setPassword(''); setNome(''); }}
                className="flex items-center gap-1 mx-auto text-primary hover:underline font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.backToLogin')}
              </button>
            )}
            {(mode === 'login' || mode === 'signup') && (
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-primary hover:underline font-medium"
              >
                {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
