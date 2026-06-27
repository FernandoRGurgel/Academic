'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

export default function NovoTrabalhoPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Estados das listas de opções
  const [clients, setClients] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);

  // Estados dos campos do formulário
  const [tipo, setTipo] = useState('Artigo Científico');
  const [titulo, setTitulo] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [instituicao, setInstituicao] = useState('');
  const [curso, setCurso] = useState('');
  const [orientadorId, setOrientadorId] = useState('');
  const [prazo, setPrazo] = useState('');
  const [prioridade, setPrioridade] = useState('Baixa');
  const [fase, setFase] = useState('Aguardando início');
  const [observacoes, setObservacoes] = useState('');

  // Carregar dados de Cliente, Instituição, Curso e Orientador do Supabase + localStorage
  useEffect(() => {
    if (user?.id) {
      // Carregar cache local de contingência
      const savedClients = localStorage.getItem(`cadastro_clientes_${user.id}`);
      if (savedClients) setClients(JSON.parse(savedClients));

      const savedInsts = localStorage.getItem(`cadastro_instituicoes_${user.id}`);
      if (savedInsts) setInstitutions(JSON.parse(savedInsts));

      const savedCourses = localStorage.getItem(`cadastro_cursos_${user.id}`);
      if (savedCourses) setCourses(JSON.parse(savedCourses));

      const savedAdvisors = localStorage.getItem(`cadastro_orientadores_${user.id}`);
      if (savedAdvisors) setAdvisors(JSON.parse(savedAdvisors));

      // Sincronizar dados reais do Supabase
      const fetchAuxData = async () => {
        try {
          const supabase = createClient();

          const { data: dbClients } = await supabase
            .from('clientes')
            .select('name')
            .order('name');
          if (dbClients) setClients(dbClients);

          const { data: dbInsts } = await supabase
            .from('instituicoes')
            .select('name')
            .order('name');
          if (dbInsts) setInstitutions(dbInsts);

          const { data: dbCourses } = await supabase
            .from('cursos')
            .select('name')
            .order('name');
          if (dbCourses) setCourses(dbCourses);

          const { data: dbAdvisors } = await supabase
            .from('orientadores')
            .select('id, name')
            .order('name');
          if (dbAdvisors) setAdvisors(dbAdvisors);
        } catch (e) {
          console.error('Erro ao carregar dados de cadastro do Supabase:', e);
        }
      };

      fetchAuxData();
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome) {
      alert('Por favor, selecione um cliente.');
      return;
    }

    const statusMap: { [key: string]: string } = {
      'Aguardando início': 'Aguardando pagamento',
      'Levantamento de dados': 'Em andamento',
      'Em elaboração': 'Em andamento',
      'Em revisão': 'Em revisão',
      'Entregue': 'Entregues',
      'Finalizado': 'Entregues'
    };

    const columnIdMap: { [key: string]: string } = {
      'Aguardando início': 'aguardando-inicio',
      'Levantamento de dados': 'levantamento-dados',
      'Em elaboração': 'em-elaboracao',
      'Em revisão': 'em-revisao',
      'Entregue': 'entregue',
      'Finalizado': 'finalizado'
    };

    const status = statusMap[fase] || 'Em andamento';
    const columnId = columnIdMap[fase] || 'aguardando-inicio';

    // Determinar progresso de acordo com a fase
    let progress = 0;
    if (fase === 'Levantamento de dados') progress = 20;
    else if (fase === 'Em elaboração') progress = 50;
    else if (fase === 'Em revisão') progress = 80;
    else if (fase === 'Entregue') progress = 100;
    else if (fase === 'Finalizado') progress = 100;

    // Calcular dias restantes
    let tempo = '-';
    if (prazo) {
      const diffTime = new Date(prazo).getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        tempo = 'Atrasado';
      } else if (diffDays === 0) {
        tempo = 'Hoje';
      } else if (diffDays === 1) {
        tempo = '24h';
      } else {
        tempo = `${diffDays} dias`;
      }
    }

    const trabalhoId = crypto.randomUUID();

    const novoTrabalho = {
      id: trabalhoId,
      clienteNome,
      tipo,
      data: prazo ? new Date(prazo).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Hoje, 14:00',
      valor: 800,
      status,
      tempo,
      critico: prioridade === 'Crítica' || prioridade === 'Alta',
      progress,
      isAcessivel: true,
      columnId
    };

    // 1. Gravar no Supabase
    if (user?.id) {
      try {
        const supabase = createClient();
        const dbData: Record<string, any> = {
          id: trabalhoId,
          user_id: user.id,
          cliente_nome: clienteNome,
          tipo,
          titulo: titulo || null,
          instituicao: instituicao || null,
          curso: curso || null,
          prioridade: prioridade || null,
          data: prazo ? new Date(prazo).toISOString() : new Date().toISOString(),
          valor: 800.00,
          status,
          tempo,
          critico: prioridade === 'Crítica' || prioridade === 'Alta',
          progress,
          column_id: columnId
        };
        if (orientadorId) dbData.orientador_id = orientadorId;

        const { error } = await supabase
          .from('trabalhos')
          .insert(dbData);

        if (error) {
          console.error('Erro ao salvar trabalho no Supabase:', error);
        }
      } catch (err) {
        console.error('Erro de conexão ao salvar trabalho no Supabase:', err);
      }
    }

    // 2. Gravar no localStorage do Dashboard
    if (user?.id) {
      const savedTrabalhos = localStorage.getItem(`dashboard_trabalhos_${user.id}`);
      let trabalhosList = [];
      if (savedTrabalhos) {
        trabalhosList = JSON.parse(savedTrabalhos);
      }
      trabalhosList = [novoTrabalho, ...trabalhosList];
      localStorage.setItem(`dashboard_trabalhos_${user.id}`, JSON.stringify(trabalhosList));

      // 3. Atualizar o Kanban localstorage
      const savedKanban = localStorage.getItem(`kanban_trabalhos_${user.id}`);
      if (savedKanban) {
        try {
          const kanban = JSON.parse(savedKanban);
          if (kanban[columnId]) {
            const parts = clienteNome.split(' ');
            const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : clienteNome.substring(0, 2).toUpperCase();

            kanban[columnId].items.push({
              id: trabalhoId,
              title: `${tipo}${titulo ? ' - ' + titulo : ''}`,
              student: clienteNome,
              date: prazo ? new Date(prazo).toLocaleDateString('pt-BR') : 'Hoje',
              priority: prioridade,
              initials
            });
            localStorage.setItem(`kanban_trabalhos_${user.id}`, JSON.stringify(kanban));
          }
        } catch (e) {
          console.error('Erro ao atualizar Kanban no localStorage:', e);
        }
      }
    }

    router.push(`/trabalhos/${trabalhoId}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-sans text-on-surface-variant gap-3">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
        <span>Carregando...</span>
      </div>
    );
  }

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-10 py-12">
      {/* Header & Back Navigation */}
      <header className="mb-10">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Quadro de Produção
        </button>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-on-surface tracking-tight mb-1">Novo Trabalho Acadêmico</h1>
            <p className="font-sans text-on-surface-variant">Cadastre as informações de um novo projeto para acompanhamento.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => router.back()} className="px-5 py-2.5 bg-surface text-on-surface border border-outline-variant font-sans text-sm font-semibold rounded-lg hover:bg-surface-container-low transition-colors text-center">
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="px-5 py-2.5 bg-primary text-white font-sans text-sm font-semibold rounded-lg hover:bg-primary/90 transition-opacity shadow-sm flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Salvar Trabalho
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="bg-surface border border-outline-variant rounded-xl shadow-sm p-8 max-w-4xl mx-auto">
        <form onSubmit={handleSave} className="space-y-8 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Tipo de Trabalho</label>
                <select 
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option>Artigo Científico</option>
                  <option>Dissertação de Mestrado</option>
                  <option>Tese de Doutorado</option>
                  <option>Monografia / TCC</option>
                  <option>Fichamento</option>
                  <option>Formatação ABNT</option>
                </select>
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Título do Trabalho (Opcional)</label>
                <input 
                  type="text" 
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Impacto da Inteligência Artificial..." 
                  className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50" 
                />
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Estudante (Cliente)</label>
                <select 
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  required
                  className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="">Selecione um cliente...</option>
                  {clients.map((c, idx) => (
                    <option key={idx} value={c.name}>{c.name}</option>
                  ))}
                </select>
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Instituição</label>
                <select 
                  value={instituicao}
                  onChange={(e) => setInstituicao(e.target.value)}
                  className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="">Selecione uma instituição...</option>
                  {institutions.map((i, idx) => (
                    <option key={idx} value={i.name}>{i.name}</option>
                  ))}
                </select>
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Curso</label>
                <select 
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="">Selecione um curso...</option>
                  {courses.map((c, idx) => (
                    <option key={idx} value={c.name}>{c.name}</option>
                  ))}
                </select>
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Orientador(a) (Opcional)</label>
                <select
                  value={orientadorId}
                  onChange={(e) => setOrientadorId(e.target.value)}
                  className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="">Selecione um orientador...</option>
                  {advisors.map((adv, idx) => (
                    <option key={idx} value={adv.id}>{adv.name}</option>
                  ))}
                </select>
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Prazo de Entrega</label>
                <input 
                  type="date" 
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                />
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Prioridade</label>
                <select 
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value)}
                  className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option>Baixa</option>
                  <option>Média</option>
                  <option>Alta</option>
                  <option>Crítica</option>
                </select>
             </div>
             <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-on-surface">Fase Atual</label>
                <select 
                  value={fase}
                  onChange={(e) => setFase(e.target.value)}
                  className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option>Aguardando início</option>
                  <option>Levantamento de dados</option>
                  <option>Em elaboração</option>
                  <option>Em revisão</option>
                  <option>Entregue</option>
                  <option>Finalizado</option>
                </select>
             </div>
          </div>

          <div className="flex flex-col gap-2">
             <label className="text-sm font-semibold text-on-surface">Observações e Requisitos</label>
             <textarea 
               rows={4} 
               value={observacoes}
               onChange={(e) => setObservacoes(e.target.value)}
               placeholder="Informações adicionais sobre formatação, restrições ou detalhes metodológicos..." 
               className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50 resize-none"
             />
          </div>
        </form>
      </div>
    </main>
  );
}
