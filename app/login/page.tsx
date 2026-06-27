'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos.' 
          : signInError.message
        );
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError('Ocorreu um erro ao tentar entrar. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
      }
    } catch (err) {
      setError('Falha ao iniciar autenticação com o Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-container-lowest relative overflow-hidden h-[calc(100vh-4rem)]">
      {/* Background Graphic */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px]">
          <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM3.46 9L12 4.34 20.54 9 12 13.66 3.46 9zM4.09 14.28L12 18.5l7.91-4.22v3.31l-7.91 4.22-7.91-4.22v-3.31z" />
        </svg>
      </div>

      <div className="w-full max-w-md bg-surface p-10 rounded-2xl shadow-lg border border-outline-variant relative z-10">
        
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-primary text-white rounded-xl flex items-center justify-center mb-6 shadow-md shadow-primary/20">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold font-serif mb-3 text-on-surface">Bem-vindo de volta!</h1>
          <p className="text-on-surface-variant text-sm px-4">
            Acesse sua conta para gerenciar seu progresso acadêmico.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-container text-error rounded-xl flex items-start gap-3 border border-error/20 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-sans font-medium">{error}</p>
          </div>
        )}

        <form className="flex flex-col gap-5" onSubmit={handleLogin}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-on-surface">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-on-surface-variant" />
              </div>
              <input 
                type="email" 
                required
                disabled={loading || googleLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@instituicao.edu.br" 
                className="pl-10 p-3 w-full border border-outline-variant rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm placeholder:text-outline disabled:opacity-55" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-on-surface">Senha</label>
              <Link href="#" className="text-xs font-bold text-primary hover:underline">
                Esqueceu sua senha?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-on-surface-variant" />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                required
                disabled={loading || googleLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="pl-10 pr-10 p-3 w-full border border-outline-variant rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm placeholder:text-outline tracking-widest disabled:opacity-55" 
              />
              <button 
                type="button" 
                disabled={loading || googleLoading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface disabled:opacity-55"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1 mb-2">
            <input type="checkbox" id="remember" className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" />
            <label htmlFor="remember" className="text-xs font-medium text-on-surface-variant cursor-pointer">
              Lembrar-me neste dispositivo
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading || googleLoading}
            className="bg-primary hover:bg-primary/90 text-white p-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-55"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                Entrar <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center my-6 gap-3">
          <div className="h-px flex-1 bg-outline-variant"></div>
          <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">ou</span>
          <div className="h-px flex-1 bg-outline-variant"></div>
        </div>

        <button 
          type="button" 
          disabled={loading || googleLoading}
          onClick={handleGoogleLogin}
          className="w-full bg-surface border border-outline-variant hover:bg-surface-container-low text-on-surface p-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-3 text-sm shadow-sm disabled:opacity-55"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Continuar com Google
        </button>
      </div>
      
      <div className="mt-8 text-center text-sm font-medium text-on-surface-variant relative z-10">
        Não tem uma conta? <Link href="/cadastrar" className="text-primary hover:underline ml-1 font-bold">Solicite acesso à secretaria</Link>
      </div>
    </main>
  );
}