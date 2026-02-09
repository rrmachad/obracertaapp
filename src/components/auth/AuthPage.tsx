import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HardHat, Eye, EyeOff, Mail, Lock, User, Key, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AuthPageProps {
  defaultMode?: 'login' | 'signup';
}

type AuthMode = 'login' | 'signup' | 'pin' | 'pin-register';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Erro ao entrar',
            description: error.message === 'Invalid login credentials' 
              ? 'Email ou senha incorretos' 
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Bem-vindo!', description: 'Login realizado com sucesso.' });
          navigate('/dashboard');
        }
      } else if (mode === 'signup') {
        if (!nome.trim()) {
          toast({ title: 'Nome obrigatório', description: 'Por favor, informe seu nome.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, nome);
        if (error) {
          const message = error.message.includes('already registered') ? 'Este email já está cadastrado' : error.message;
          toast({ title: 'Erro ao cadastrar', description: message, variant: 'destructive' });
        } else {
          toast({ title: 'Conta criada!', description: 'Cadastro realizado com sucesso.' });
          navigate('/dashboard');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePinValidate = async () => {
    if (pin.length !== 6) {
      toast({ title: 'PIN inválido', description: 'Digite o PIN de 6 dígitos', variant: 'destructive' });
      return;
    }
    // Move to registration step - PIN will be validated on the server
    setMode('pin-register');
  };

  const handlePinRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !password.trim()) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('claim-invite', {
        body: { pin_code: pin, email, password, nome },
      });

      if (error || data?.error) {
        toast({
          title: 'Erro ao cadastrar',
          description: data?.error || error?.message || 'Tente novamente.',
          variant: 'destructive',
        });
        if (data?.error?.includes('PIN inválido')) {
          setMode('pin');
          setPin('');
        }
        return;
      }

      toast({ title: 'Conta criada!', description: 'Fazendo login...' });
      
      // Auto-login after registration
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        toast({ title: 'Conta criada!', description: 'Faça login com seu email e senha.' });
        setMode('login');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao processar convite.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const renderPinStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Digite o PIN de 6 dígitos fornecido pelo administrador da obra.
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
        Continuar
      </Button>
    </div>
  );

  const renderPinRegisterStep = () => (
    <form onSubmit={handlePinRegister} className="space-y-4">
      <div className="p-3 bg-muted rounded-lg text-center">
        <p className="text-sm text-muted-foreground">PIN: <code className="font-mono font-bold">{pin}</code></p>
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Crie sua conta para acessar a obra compartilhada.
      </p>
      <div className="space-y-2">
        <Label htmlFor="nome" className="text-base font-medium">Nome completo</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input id="nome" type="text" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} className="pl-10 h-12 text-base" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pin-email" className="text-base font-medium">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input id="pin-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 text-base" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pin-password" className="text-base font-medium">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input id="pin-password" type={showPassword ? 'text' : 'password'} placeholder="Crie uma senha" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12 text-base" required minLength={6} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full h-14 text-lg font-semibold" disabled={loading}>
        {loading ? 'Criando conta...' : 'Criar conta e acessar'}
      </Button>
    </form>
  );

  const renderLoginSignupForm = () => (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-base font-medium">Nome completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input id="nome" type="text" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} className="pl-10 h-12 text-base" />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-medium">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 text-base" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-base font-medium">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12 text-base" required minLength={6} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full h-14 text-lg font-semibold" disabled={loading}>
          {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </Button>
      </form>

      <div className="mt-4">
        <Button
          variant="outline"
          className="w-full h-12 text-base"
          onClick={() => { setMode('pin'); setPin(''); }}
        >
          <Key className="w-5 h-5 mr-2" />
          Entrar com PIN de convite
        </Button>
      </div>
    </>
  );

  const getTitle = () => {
    if (mode === 'pin') return 'Entrar com PIN';
    if (mode === 'pin-register') return 'Criar sua conta';
    return mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta grátis';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
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
            <CardTitle className="text-2xl font-bold">Obra Certa</CardTitle>
            <CardDescription className="text-base">{getTitle()}</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          {mode === 'pin' && renderPinStep()}
          {mode === 'pin-register' && renderPinRegisterStep()}
          {(mode === 'login' || mode === 'signup') && renderLoginSignupForm()}

          <div className="mt-6 text-center space-y-2">
            {(mode === 'pin' || mode === 'pin-register') && (
              <button
                type="button"
                onClick={() => { setMode('login'); setPin(''); setEmail(''); setPassword(''); setNome(''); }}
                className="flex items-center gap-1 mx-auto text-primary hover:underline font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao login
              </button>
            )}
            {(mode === 'login' || mode === 'signup') && (
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-primary hover:underline font-medium"
              >
                {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
