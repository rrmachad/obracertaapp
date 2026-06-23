import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, nome: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    // Detect browser locale and save in user_metadata for email i18n
    const browserLang = navigator.language || 'pt-BR';
    const locale = browserLang.startsWith('es') ? 'es' : browserLang.startsWith('en') ? 'en' : 'pt';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { nome, locale }
      }
    });

    if (!error && data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        nome: nome,
        email: email,
      });

      if (profileError) {
        // Retry once before giving up
        const { error: retryError } = await supabase.from('profiles').insert({
          user_id: data.user.id,
          nome: nome,
          email: email,
        });

        if (retryError) {
          console.error('[Auth] Failed to create profile for user', data.user.id, retryError);
          return {
            error: new Error(
              'Erro ao criar seu perfil. Tente novamente ou entre em contato com o suporte.'
            ),
          };
        }
      }
    }

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Update locale in user_metadata on each login so emails use correct language
    if (!error) {
      const browserLang = navigator.language || 'pt-BR';
      const locale = browserLang.startsWith('es') ? 'es' : browserLang.startsWith('en') ? 'en' : 'pt';
      await supabase.auth.updateUser({ data: { locale } });
    }

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
