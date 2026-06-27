'use client';

import { useState, useEffect, Suspense } from 'react';
import {
  Users, FileStack, CheckCircle2, AlertTriangle, TrendingUp,
  AlertCircle, Clock, Filter, X, ChevronRight, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardTabs } from '@/components/DashboardTabs';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Trabalho {
  id: string;
  cliente_nome: string;
  tipo: string;
  titulo?: string;
  data: string;
  status: string;
  column_id: string;
  critico: boolean;
  progress: number;
  tempo?: string;
  prioridade?: string;
}

interface Receita {
  id: string;
  client: string;
  origin: string;
  date: string;
  value: number;
  total_value: number;
  current_installment: number;
  total_installments: number;
  status: string;
  trabalho_id?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
};

const isAtrasado = (trabalho: Trabalho) => {
  if (!trabalho.data) return false;
  const prazo = new Date(trabalho.data);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  prazo.setHours(0, 0, 0, 0);
  return (
    prazo < hoje &&
    trabalho.column_id !== 'entregue' &&
    trabalho.column_id !== 'finalizado'
  );
};

const diasRestantes = (iso: string): string => {
  if (!iso) return '-';
  const diff = new Date(iso).getTime() - new Date().getTime();
  const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (dias < 0) return 'Atrasado';
  if (dias === 0) return 'Hoje';
  if (dias === 1) return '1 dia';
  return `${dias} dias`;
};

// ─── Componente ───────────────────────────────────────────────────────────────
function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [profileName, setProfileName] = useState('Usuário');
  const [loadingData, setLoadingData] = useState(true);

  const [filters, setFilters] = useState({
    status: 'Todos os status',
    tipo: 'Todos os tipos',
    cliente: '',
    dataInicio: '',
    dataFim: '',
    financeiroPendentes: false,
    financeiroPagos: false,
    financeiroInadimplentes: false,
  });

  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  // ─── Carregar dados do Supabase ────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    // Nome do perfil
    const savedProfile = localStorage.getItem(`profile_data_${user.id}`);
    if (savedProfile) {
      try {
        const p = JSON.parse(savedProfile);
        setProfileName(p.name || user.user_metadata?.full_name || 'Usuário');
      } catch { setProfileName(user.user_metadata?.full_name || 'Usuário'); }
    } else {
      setProfileName(user.user_metadata?.full_name || 'Usuário');
    }

    const fetchAll = async () => {
      setLoadingData(true);
      try {
        const supabase = createClient();

        // Trabalhos
        const { data: dbTrabalhos } = await supabase
          .from('trabalhos')
          .select('id, cliente_nome, tipo, titulo, data, status, column_id, critico, progress, tempo, prioridade')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (dbTrabalhos) setTrabalhos(dbTrabalhos);

        // Total de clientes únicos
        const { data: dbClientes } = await supabase
          .from('clientes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Contar por count da query
        const { count: clienteCount } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setTotalClientes(clienteCount ?? 0);

        // Receitas
        const { data: dbReceitas } = await supabase
          .from('receitas')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true });

        if (dbReceitas) setReceitas(dbReceitas);

      } catch (e) {
        console.error('Erro ao carregar dados do dashboard:', e);
      } finally {
        setLoadingData(false);
      }
    };

    fetchAll();
  }, [user]);

  const handleApplyFilters = () => { setAppliedFilters(filters); setIsFilterOpen(false); };
  const handleClearFilters = () => {
    const clear = { status: 'Todos os status', tipo: 'Todos os tipos', cliente: '', dataInicio: '', dataFim: '', financeiroPendentes: false, financeiroPagos: false, financeiroInadimplentes: false };
    setFilters(clear); setAppliedFilters(clear); setIsFilterOpen(false); router.replace('/');
  };

  // ─── Filtragem ────────────────────────────────────────────────────────────
  const trabalhosFiltrados = trabalhos.filter(t => {
    const searchQ = searchParams.get('q') || '';
    const searchCliente = searchParams.get('cliente') || '';
    const searchTipo = searchParams.get('tipo') || '';

    if (searchQ && !t.cliente_nome.toLowerCase().includes(searchQ.toLowerCase()) && !t.tipo.toLowerCase().includes(searchQ.toLowerCase())) return false;
    if (searchCliente && !t.cliente_nome.toLowerCase().includes(searchCliente.toLowerCase())) return false;
    if (searchTipo && t.tipo !== searchTipo) return false;

    if (appliedFilters.status !== 'Todos os status') {
      const statusMap: Record<string, string[]> = {
        'Em andamento': ['levantamento-dados', 'em-elaboracao'],
        'Em revisão': ['em-revisao'],
        'Aguardando pagamento': ['aguardando-inicio'],
        'Entregues': ['entregue', 'finalizado'],
      };
      const allowed = statusMap[appliedFilters.status];
      if (allowed && !allowed.includes(t.column_id)) return false;
    }

    if (appliedFilters.tipo !== 'Todos os tipos' && t.tipo !== appliedFilters.tipo) return false;
    if (appliedFilters.cliente && !t.cliente_nome.toLowerCase().includes(appliedFilters.cliente.toLowerCase())) return false;

    if (appliedFilters.dataInicio && t.data && new Date(t.data) < new Date(appliedFilters.dataInicio)) return false;
    if (appliedFilters.dataFim && t.data && new Date(t.data) > new Date(appliedFilters.dataFim)) return false;

    return true;
  });

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  const emAndamento = trabalhosFiltrados.filter(t =>
    ['levantamento-dados', 'em-elaboracao', 'em-revisao'].includes(t.column_id)
  ).length;

  const entregues = trabalhosFiltrados.filter(t =>
    ['entregue', 'finalizado'].includes(t.column_id)
  ).length;

  const emAtraso = trabalhosFiltrados.filter(isAtrasado).length;

  // ─── Financeiro ───────────────────────────────────────────────────────────
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const aReceber = receitas
    .filter(r => r.status !== 'Pago' && new Date(r.date) >= hoje)
    .reduce((acc, r) => acc + r.value, 0);

  const recebidos = receitas
    .filter(r => r.status === 'Pago')
    .reduce((acc, r) => acc + r.value, 0);

  const inadimplencia = receitas
    .filter(r => r.status !== 'Pago' && new Date(r.date) < hoje)
    .reduce((acc, r) => acc + r.value, 0);

  // Próximos vencimentos: receitas pendentes ordenadas por data
  const proximosVencimentos = receitas
    .filter(r => r.status !== 'Pago')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  // Prazos críticos: trabalhos com prazo próximo ou atrasado
  const prazoCriticos = trabalhosFiltrados
    .filter(t => t.data && !['entregue', 'finalizado'].includes(t.column_id))
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(0, 5)
    .map(t => ({
      id: t.id,
      titulo: `${t.tipo}${t.titulo ? ' — ' + t.titulo : ''} · ${t.cliente_nome}`,
      tempo: diasRestantes(t.data),
      progress: t.progress ?? 0,
      critico: isAtrasado(t) || t.critico,
    }));

  const hasActiveFilters = appliedFilters.status !== 'Todos os status' ||
    appliedFilters.tipo !== 'Todos os tipos' || appliedFilters.cliente !== '' ||
    appliedFilters.dataInicio !== '' || appliedFilters.dataFim !== '' ||
    appliedFilters.financeiroPendentes || appliedFilters.financeiroPagos || appliedFilters.financeiroInadimplentes;

  if (authLoading || loadingData) {
    return (
      <div className="flex h-[80vh] items-center justify-center font-sans text-on-surface-variant gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span>Carregando painel...</span>
      </div>
    );
  }

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-10 py-12 relative">

      {/* Header */}
      <header className="mb-12 flex justify-between items-start">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-on-surface tracking-tight mb-1">Olá, {profileName}</h1>
          <p className="font-sans text-on-surface-variant">Central de monitoramento de alta performance acadêmica.</p>
        </div>
        <button
          onClick={() => setIsFilterOpen(true)}
          className={`p-2.5 bg-surface border rounded-xl hover:bg-surface-container-low transition-colors shadow-sm relative ${hasActiveFilters ? 'border-primary text-primary' : 'border-outline-variant text-on-surface-variant'}`}
          aria-label="Filtros"
        >
          <Filter className="w-5 h-5" />
          {hasActiveFilters && <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full border-2 border-surface" />}
        </button>
      </header>

      {/* Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          <div className="relative w-full max-w-sm bg-surface h-full shadow-2xl flex flex-col border-l border-outline-variant animate-in slide-in-from-right-96 fade-in duration-300">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-primary" />
                <h2 className="font-serif text-xl font-semibold text-on-surface">Filtros</h2>
              </div>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-surface-container-low rounded-full text-on-surface-variant transition-colors" aria-label="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-on-surface">Status do Trabalho</label>
                <select className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary outline-none transition-all" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                  <option>Todos os status</option>
                  <option>Em andamento</option>
                  <option>Em revisão</option>
                  <option>Aguardando pagamento</option>
                  <option>Entregues</option>
                </select>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-on-surface">Tipo de Trabalho</label>
                <select className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary outline-none transition-all" value={filters.tipo} onChange={e => setFilters({ ...filters, tipo: e.target.value })}>
                  <option>Todos os tipos</option>
                  <option>Artigo Científico</option>
                  <option>Tese de Doutorado</option>
                  <option>Dissertação de Mestrado</option>
                  <option>TCC</option>
                  <option>Formatação ABNT</option>
                  <option>Tradução</option>
                </select>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-on-surface">Cliente</label>
                <input type="text" placeholder="Pesquisar por nome..." className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary outline-none transition-all" value={filters.cliente} onChange={e => setFilters({ ...filters, cliente: e.target.value })} />
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-on-surface">Prazo de Entrega</label>
                <div className="flex gap-3 items-center">
                  <input type="date" className="flex-1 p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary outline-none transition-all" value={filters.dataInicio} onChange={e => setFilters({ ...filters, dataInicio: e.target.value })} />
                  <span className="text-on-surface-variant">a</span>
                  <input type="date" className="flex-1 p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary outline-none transition-all" value={filters.dataFim} onChange={e => setFilters({ ...filters, dataFim: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-outline-variant bg-surface-container-lowest flex gap-4">
              <button onClick={handleClearFilters} className="flex-1 py-3 rounded-lg border border-outline-variant text-on-surface-variant font-semibold hover:bg-surface-container-low transition-colors">Limpar</button>
              <button onClick={handleApplyFilters} className="flex-1 py-3 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity shadow-sm">Aplicar Filtros</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <DashboardTabs activeTab="painel" />

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-surface border border-outline-variant p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="font-sans text-sm font-medium text-on-surface-variant">Clientes Cadastrados</span>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="font-serif text-[40px] font-semibold text-on-surface leading-tight">{totalClientes.toString().padStart(2, '0')}</div>
          <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Total cadastrado</div>
        </div>

        <div className="bg-surface border border-outline-variant p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="font-sans text-sm font-medium text-on-surface-variant">Trabalhos em Andamento</span>
            <FileStack className="w-5 h-5 text-primary" />
          </div>
          <div className="font-serif text-[40px] font-semibold text-on-surface leading-tight">{emAndamento.toString().padStart(2, '0')}</div>
          <div className="mt-2 text-xs font-medium text-on-surface-variant">Incluindo em revisão</div>
        </div>

        <div className="bg-surface border border-outline-variant p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="font-sans text-sm font-medium text-on-surface-variant">Trabalhos Entregues</span>
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </div>
          <div className="font-serif text-[40px] font-semibold text-on-surface leading-tight">{entregues.toString().padStart(2, '0')}</div>
          <div className="mt-2 text-xs font-medium text-emerald-600">Total filtrado</div>
        </div>

        <div className="bg-error-container border border-error/20 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="font-sans text-sm font-medium text-on-error-container">Trabalhos em Atraso</span>
            <AlertTriangle className="w-5 h-5 text-error" />
          </div>
          <div className="font-serif text-[40px] font-semibold text-error leading-tight">{emAtraso.toString().padStart(2, '0')}</div>
          <div className="mt-2 text-xs font-semibold text-error">{emAtraso > 0 ? 'Requer ação imediata' : 'Sem atrasos'}</div>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* Left Column: Finance */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <h2 className="font-serif text-2xl font-medium text-on-surface">Visão Financeira</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* A Receber */}
            <div className="bg-surface border border-outline-variant p-6 rounded-xl shadow-sm">
              <p className="font-sans text-sm font-medium text-on-surface-variant mb-2">A Receber</p>
              <p className="font-serif text-2xl font-medium text-on-surface">{formatCurrency(aReceber)}</p>
              <div className="h-1.5 bg-surface-container-high rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: aReceber > 0 ? '75%' : '0%' }} />
              </div>
            </div>

            {/* Recebidos */}
            <div className="bg-surface border border-outline-variant p-6 rounded-xl shadow-sm">
              <p className="font-sans text-sm font-medium text-on-surface-variant mb-2">Recebidos</p>
              <p className="font-serif text-2xl font-medium text-on-surface">{formatCurrency(recebidos)}</p>
              <div className="h-1.5 bg-surface-container-high rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: recebidos > 0 ? '100%' : '0%' }} />
              </div>
            </div>

            {/* Inadimplência */}
            <div className="bg-error-container border border-error/20 p-6 rounded-xl shadow-sm">
              <p className="font-sans text-sm font-medium text-on-error-container mb-2">Inadimplência</p>
              <p className="font-serif text-2xl font-medium text-error">{formatCurrency(inadimplencia)}</p>
              <p className="text-[12px] font-semibold text-error mt-4 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Valor total em atrasos
              </p>
            </div>
          </div>

          {/* Próximos Vencimentos */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm mt-2">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
              <h3 className="font-sans text-sm font-bold text-on-surface">Próximos Vencimentos</h3>
              <Link href="/financeiro" className="text-xs text-primary hover:underline font-bold uppercase tracking-wider">Ver todos</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/80 text-on-surface-variant text-sm border-b border-outline-variant">
                    <th className="p-4 font-medium">Cliente</th>
                    <th className="p-4 font-medium">Vencimento</th>
                    <th className="p-4 font-medium">Valor</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="text-base text-on-surface">
                  {proximosVencimentos.length > 0 ? proximosVencimentos.map(rec => {
                    const atrasado = new Date(rec.date) < hoje && rec.status !== 'Pago';
                    return (
                      <tr key={rec.id} className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors">
                        <td className="p-4">
                          <span className="font-semibold">{rec.client}</span>
                          <span className="block text-xs text-on-surface-variant">{rec.origin}{rec.total_installments > 1 ? ` (Parc. ${rec.current_installment}/${rec.total_installments})` : ''}</span>
                        </td>
                        <td className={`p-4 whitespace-nowrap font-medium ${atrasado ? 'text-error' : ''}`}>{formatDate(rec.date)}</td>
                        <td className="p-4 font-semibold">{formatCurrency(rec.value)}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                            rec.status === 'Pago' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            atrasado ? 'bg-error-container text-on-error-container' :
                            'bg-surface-container text-on-surface-variant'
                          }`}>
                            {atrasado && rec.status !== 'Pago' ? 'Em atraso' : rec.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {rec.trabalho_id ? (
                            <Link href={`/trabalhos/${rec.trabalho_id}`} className="p-2 inline-flex hover:bg-surface-container-high rounded-lg text-primary transition-colors" title="Ver Trabalho">
                              <ChevronRight className="w-5 h-5" />
                            </Link>
                          ) : (
                            <Link href="/financeiro" className="p-2 inline-flex hover:bg-surface-container-high rounded-lg text-primary transition-colors" title="Ver Financeiro">
                              <ChevronRight className="w-5 h-5" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-on-surface-variant font-medium text-sm">
                        Nenhum vencimento pendente encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Operations */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <h2 className="font-serif text-2xl font-medium text-on-surface">Prazos e Operação</h2>

          <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-sans text-sm font-bold text-on-surface">Prazos Críticos</h3>
            </div>

            <div className="space-y-3">
              {prazoCriticos.length > 0 ? prazoCriticos.map(prazo => (
                <Link
                  key={prazo.id}
                  href={`/trabalhos/${prazo.id}`}
                  className={`block p-3 border rounded-lg flex flex-col gap-2 transition-colors ${
                    prazo.critico
                      ? 'bg-error-container/30 border-error/20 hover:bg-error-container/50'
                      : 'border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-sm font-semibold text-on-surface line-clamp-2">{prazo.titulo}</span>
                    <span className={`text-xs font-semibold whitespace-nowrap ml-2 ${prazo.critico ? 'text-error' : 'text-on-surface-variant'}`}>{prazo.tempo}</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${prazo.critico ? 'bg-error/20' : 'bg-surface-container-high'}`}>
                    <div className={`h-full rounded-full transition-all ${prazo.critico ? 'bg-error' : 'bg-primary'}`} style={{ width: `${prazo.progress}%` }} />
                  </div>
                </Link>
              )) : (
                <div className="p-4 text-center text-on-surface-variant font-medium text-sm border border-dashed border-outline-variant rounded-lg">
                  Nenhum prazo crítico no momento. 🎉
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-on-surface-variant">
        <div className="flex items-center gap-3">
          <span className="font-serif font-semibold text-primary">Academic</span>
          <span>&copy; 2026 Academic Assessoria. Enterprise Edition.</span>
        </div>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-primary transition-colors">Termos de Uso</Link>
          <Link href="#" className="hover:text-primary transition-colors">Privacidade</Link>
          <Link href="#" className="hover:text-primary transition-colors">Suporte</Link>
        </div>
      </footer>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center font-sans text-on-surface-variant gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span>Carregando painel...</span>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}