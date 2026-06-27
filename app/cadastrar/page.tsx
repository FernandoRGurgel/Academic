'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, Loader2, BookOpen } from 'lucide-react';

export default function CadastrarPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
        
        // Se a sessão foi iniciada automaticamente (confirmação de email desativada no Supabase)
        if (data.session) {
          router.push('/');
          router.refresh();
        }
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar criar a conta. Tente novamente.');
      setLoading(false);
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

      <div className="w-full max-w-md bg-surface p-10 rounded-2xl shadow-lg border border-outline-variant relative z-10 text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-primary text-white rounded-xl flex items-center justify-center mb-6 shadow-md shadow-primary/20">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold font-serif mb-3 text-on-surface">Criar Conta</h1>
          <p className="text-on-surface-variant text-sm px-4">Solicite seu acesso preenchendo as informações abaixo.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-container text-error rounded-xl flex items-start gap-3 border border-error/20 text-sm text-left">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-sans font-medium">{error}</p>
          </div>
        )}

        {success && !error && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-sm text-left font-sans">
            <p className="font-bold mb-1">Cadastro realizado com sucesso!</p>
            <p>Se as confirmações estiverem ativas, verifique sua caixa de entrada para confirmar o e-mail cadastrado antes de fazer login.</p>
          </div>
        )}

        <form className="flex flex-col gap-4 text-left" onSubmit={handleSignUp}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-on-surface">Nome Completo</label>
            <input 
              type="text" 
              required
              disabled={loading || success}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome" 
              className="p-3 w-full border border-outline-variant rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm placeholder:text-outline disabled:opacity-55" 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-on-surface">E-mail</label>
            <input 
              type="email" 
              required
              disabled={loading || success}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@instituicao.edu.br" 
              className="p-3 w-full border border-outline-variant rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm placeholder:text-outline disabled:opacity-55" 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-on-surface">Senha</label>
            <input 
              type="password" 
              required
              disabled={loading || success}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="p-3 w-full border border-outline-variant rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm placeholder:text-outline disabled:opacity-55 tracking-widest" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || success}
            className="bg-primary hover:bg-primary/90 text-white p-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-55 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar Conta'
            )}
          </button>
        </form>

        <div className="mt-6">
          <Link href="/login" className="text-sm text-primary hover:underline font-bold">
            Já possui uma conta? Faça login
          </Link>
        </div>
      </div>
    </main>
  );
}
