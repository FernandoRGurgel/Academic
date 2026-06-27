'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, Bell, User, Settings, LogOut, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState('https://picsum.photos/seed/academic/100/100');
  const [profileName, setProfileName] = useState('Usuário');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadSavedImage = () => {
      if (user?.id) {
        const saved = localStorage.getItem(`profileImage_${user.id}`);
        if (saved) {
          setProfileImage(saved);
        } else {
          setProfileImage(`https://picsum.photos/seed/${user.id}/100/100`);
        }
      } else {
        setProfileImage('https://picsum.photos/seed/academic/100/100');
      }
    };
    loadSavedImage();
    window.addEventListener('profileImageUpdated', loadSavedImage);
    return () => window.removeEventListener('profileImageUpdated', loadSavedImage);
  }, [user]);

  useEffect(() => {
    const loadProfileData = () => {
      if (user?.id) {
        const saved = localStorage.getItem(`profile_data_${user.id}`);
        if (saved) {
          try {
            const data = JSON.parse(saved);
            if (data.name) {
              setProfileName(data.name);
              return;
            }
          } catch (e) {}
        }
        setProfileName(user?.user_metadata?.full_name || 'Usuário');
      } else {
        setProfileName('Usuário');
      }
    };
    loadProfileData();
    window.addEventListener('profileUpdated', loadProfileData);
    return () => window.removeEventListener('profileUpdated', loadProfileData);
  }, [user]);

  useEffect(() => {
    const supabase = createClient();
    
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    fetchUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    setShowProfile(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      if (pathname === '/' && (searchParams.has('q') || searchParams.has('cliente') || searchParams.has('tipo'))) {
        router.push('/');
      }
    }
  }, [searchQuery, searchParams, pathname, router]);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Dashboard', href: '/' },
    { name: 'Trabalhos', href: '/trabalhos' },
    { name: 'Financeiro', href: '/financeiro' },
    { name: 'Cadastro', href: '/cadastro' },
  ];

  const isAuthRoute = pathname === '/login' || pathname === '/cadastrar';

  // Mocked search data matching all actual database items across all screens
  const searchData = [
    // --- Trabalhos ---
    { id: 1, type: 'Trabalho', title: 'Tese de Doutorado - Eng. Software', entity: 'Ricardo Mendes', context: 'Fase: Aguardando início', url: '/trabalhos' },
    { id: 2, type: 'Trabalho', title: 'Artigo Científico - Bioética', entity: 'Ana Paula Silva', context: 'Fase: Aguardando início', url: '/trabalhos' },
    { id: 3, type: 'Trabalho', title: 'Monografia - Direito Penal', entity: 'Lucas Ferreira', context: 'Fase: Levantamento de dados', url: '/trabalhos' },
    { id: 4, type: 'Trabalho', title: 'Dissertação de Mestrado - IA', entity: 'Carlos Gomes', context: 'Fase: Em elaboração', url: '/trabalhos' },
    { id: 5, type: 'Trabalho', title: 'TCC - Arquitetura Sustentável', entity: 'Mariana Costa', context: 'Fase: Em elaboração', url: '/trabalhos' },
    
    // --- Clientes ---
    { id: 6, type: 'Cliente', title: 'Dr. Ricardo Oliveira', entity: 'USP - São Paulo', context: 'Doutorado em Bioinformática', url: '/cadastro?tab=clientes' },
    { id: 7, type: 'Cliente', title: 'Ana Martins', entity: 'PUC-RJ', context: 'Mestrado em Economia', url: '/cadastro?tab=clientes' },
    { id: 8, type: 'Cliente', title: 'Gabriel Silva', entity: 'Unicamp', context: 'Graduação em Eng. Mecânica', url: '/cadastro?tab=clientes' },

    // --- Instituições ---
    { id: 9, type: 'Instituição', title: 'Universidade de São Paulo (USP)', entity: 'Pública', context: 'São Paulo, SP', url: '/cadastro?tab=instituicoes' },
    { id: 10, type: 'Instituição', title: 'Universidade Estadual de Campinas (UNICAMP)', entity: 'Pública', context: 'Campinas, SP', url: '/cadastro?tab=instituicoes' },

    // --- Cursos ---
    { id: 11, type: 'Curso', title: 'Engenharia de Software', entity: 'Bacharelado', context: 'Status: Ativo', url: '/cadastro?tab=cursos' },
    { id: 12, type: 'Curso', title: 'Bioinformática', entity: 'Doutorado', context: 'Status: Ativo', url: '/cadastro?tab=cursos' },

    // --- Financeiro (Receitas) ---
    { id: 13, type: 'Receita', title: 'Lucas Ferreira', entity: 'Monografia - Direito Penal', context: 'Valor: R$ 1.000,00 - Status: Pago', url: '/financeiro?tab=receitas' },
    { id: 14, type: 'Receita', title: 'Ana Paula Silva', entity: 'Artigo Científico - Bioética', context: 'Valor: R$ 1.500,00 - Status: Aguardando', url: '/financeiro?tab=receitas' },
    { id: 15, type: 'Receita', title: 'Carlos Gomes', entity: 'Dissertação de Mestrado', context: 'Valor: R$ 1.000,00 - Status: Atrasado', url: '/financeiro?tab=receitas' },

    // --- Financeiro (Despesas) ---
    { id: 16, type: 'Despesa', title: 'Assinatura Software Anti-Plágio', entity: 'Software', context: 'Valor: R$ 350,00 - Status: Pago', url: '/financeiro?tab=despesas' },
    { id: 17, type: 'Despesa', title: 'Revisão Ortográfica - Mariana', entity: 'Serviços', context: 'Valor: R$ 800,00 - Status: Aguardando', url: '/financeiro?tab=despesas' },

    // --- Dados Legados para Retrocompatibilidade ---
    { id: 101, type: 'Trabalho', title: 'TCC - Análise de Dados', entity: 'Maria Silva', context: 'Engenharia de Software', url: '/?cliente=Maria Silva' },
    { id: 102, type: 'Cliente', title: 'Pedro Henrique', entity: 'UFRJ', context: 'Medicina', url: '/?cliente=Pedro Henrique' },
    { id: 103, type: 'Instituição', title: 'USP - Universidade de São Paulo', entity: '', context: '', url: '/?q=USP' },
    { id: 104, type: 'Curso', title: 'Direito Penal', entity: '', context: 'PUC-RS', url: '/?q=Direito Penal' },
    { id: 105, type: 'Trabalho', title: 'Dissertação - Impactos Ambientais', entity: 'João Costa', context: 'Biologia', url: '/?cliente=João Costa' },
    { id: 106, type: 'Tipo de Trabalho', title: 'Artigo Científico', entity: '', context: '', url: '/?tipo=Artigo Científico' },
    { id: 107, type: 'Cliente', title: 'Marcelo Sousa', entity: 'UFSC', context: 'Administração', url: '/?cliente=Marcelo Sousa' },
    { id: 108, type: 'Trabalho', title: 'Artigo - Inteligência Artificial', entity: 'Ana Clara', context: 'Ciência da Computação', url: '/?cliente=Ana Clara&tipo=Artigo Científico' },
    { id: 109, type: 'Cliente', title: 'Marcos Valério', entity: '', context: '', url: '/?cliente=Marcos Valério' }
  ];

  const searchResults = searchQuery.trim() === '' ? [] : searchData.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.entity.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.context.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isAuthRoute) {
    return (
      <nav className="bg-surface-container-lowest fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center w-full px-10 max-w-[1280px] mx-auto h-16">
          <span className="font-serif text-2xl font-bold text-primary">Academic</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-surface border-b border-outline-variant fixed top-0 left-0 right-0 z-50">
      <div className="flex justify-between items-center w-full px-10 max-w-[1280px] mx-auto h-16">
        <div className="flex items-center gap-6">
          <span className="font-serif text-2xl font-bold text-primary">Academic</span>
          <div className="hidden md:flex gap-6 ml-12 h-16">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`font-sans text-sm font-medium flex items-center border-b-2 px-1 transition-colors ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-primary hover:border-outline-variant'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative group" ref={searchRef}>
            <div className={`hidden md:flex bg-surface-container-low items-center px-3 py-1.5 rounded-lg border transition-colors ${isSearching ? 'border-primary ring-1 ring-primary' : 'border-outline-variant'}`}>
              <Search className="w-4 h-4 text-outline mr-2" />
              <input 
                type="text" 
                placeholder="Buscar registros..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim().length > 0) {
                    router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
                    setIsSearching(false);
                  }
                }}
                onFocus={() => setIsSearching(true)}
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-48 text-on-surface placeholder:text-outline"
              />
            </div>
            {isSearching && searchQuery.trim().length > 0 && (
              <div className="absolute top-full mt-2 w-[350px] bg-surface border border-outline-variant rounded-xl shadow-xl p-3 right-0 z-50 max-h-96 overflow-y-auto">
                <p className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider px-2">
                  Resultados para &quot;{searchQuery}&quot;
                </p>
                {searchResults.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {searchResults.map((result) => (
                      <Link 
                        key={result.id} 
                        href={result.url}
                        onClick={() => setIsSearching(false)}
                        className="flex flex-col p-2 hover:bg-surface-container-lowest rounded-lg transition-colors border border-transparent hover:border-outline-variant"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-on-surface">{result.title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {result.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          {result.entity && <span>{result.entity}</span>}
                          {result.entity && result.context && <span>•</span>}
                          {result.context && <span>{result.context}</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-surface-container-lowest rounded-lg border border-dashed border-outline-variant">
                    <Search className="w-6 h-6 text-outline mx-auto mb-2" />
                    <p className="text-sm font-medium text-on-surface">Nenhum resultado encontrado.</p>
                    <p className="text-xs text-on-surface-variant mt-1">Tente buscar por um termo diferente.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              className="p-2 hover:bg-surface-container-low transition-colors rounded-full relative ml-2"
            >
              <Bell className="w-5 h-5 text-secondary" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-surface"></span>
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                  <h3 className="font-semibold text-on-surface">Notificações</h3>
                  <button className="text-xs text-primary hover:underline font-medium">Marcar lidas</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div 
                    onClick={() => {
                      router.push('/financeiro?tab=receitas');
                      setShowNotifications(false);
                    }}
                    className="p-4 border-b border-outline-variant hover:bg-surface-container-lowest transition-colors cursor-pointer bg-primary/5"
                  >
                    <p className="text-sm font-medium text-on-surface">Pagamento recebido</p>
                    <p className="text-xs text-on-surface-variant mt-1">O pagamento de &quot;Lucas Ferreira&quot; foi confirmado.</p>
                    <p className="text-xs text-primary font-medium mt-2">Há 2 horas</p>
                  </div>
                  <div 
                    onClick={() => {
                      router.push('/trabalhos');
                      setShowNotifications(false);
                    }}
                    className="p-4 border-b border-outline-variant hover:bg-surface-container-lowest transition-colors cursor-pointer"
                  >
                    <p className="text-sm font-medium text-on-surface">Prazo crítico</p>
                    <p className="text-xs text-on-surface-variant mt-1">&quot;Revisão TCC - Pedro S.&quot; vence em 24h.</p>
                    <p className="text-xs text-on-surface-variant font-medium mt-2">Ontem</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          
          <div className="relative ml-2" ref={profileRef}>
            <button 
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant ring-2 ring-primary/10 hover:ring-primary/30 transition-all cursor-pointer focus:outline-none"
            >
              <Image 
                src={profileImage} 
                alt="User profile" 
                width={32} 
                height={32} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>
            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
                  <p className="font-semibold text-on-surface truncate">{profileName}</p>
                  <p className="text-xs text-on-surface-variant truncate">{user?.email || ''}</p>
                </div>
                <div className="p-2">
                  <Link href="/perfil" onClick={() => setShowProfile(false)} className="w-full text-left px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container rounded-lg transition-colors flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Meu Perfil
                  </Link>
                  <Link href="/configuracoes" onClick={() => setShowProfile(false)} className="w-full text-left px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container rounded-lg transition-colors flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Configurações
                  </Link>
                </div>
                <div className="p-2 border-t border-outline-variant">
                  <button 
                    onClick={handleSignOut} 
                    className="w-full text-left px-3 py-2 text-sm font-medium text-error hover:bg-error-container/50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair da Conta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-[100] bg-surface border border-outline-variant rounded-xl shadow-xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom flex-row">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <p className="text-sm font-medium text-on-surface">{toastMessage}</p>
        </div>
      )}
    </nav>
  );
}
