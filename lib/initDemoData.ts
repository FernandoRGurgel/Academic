export function initDemoData(userId: string, email: string) {
  const isDemo = false; // Desativado para esvaziar a base de dados mocados
  
  const dbTrabalhosKey = `dashboard_trabalhos_${userId}`;
  const kanbanKey = `kanban_trabalhos_${userId}`;
  const receitasKey = `financeiro_receitas_${userId}`;
  const despesasKey = `financeiro_despesas_${userId}`;
  const clientesKey = `cadastro_clientes_${userId}`;
  const instKey = `cadastro_instituicoes_${userId}`;
  const cursosKey = `cadastro_cursos_${userId}`;

  // Detecta se os dados mockados de demonstração antigos estão no localStorage
  let hasMockData = false;
  const existingTrabalhos = localStorage.getItem(dbTrabalhosKey);
  if (existingTrabalhos) {
    try {
      const trabalhos = JSON.parse(existingTrabalhos);
      if (trabalhos.some((t: any) => t.id === 1 || t.id === 2 || t.id === 100)) {
        hasMockData = true;
      }
    } catch (e) {}
  }

  // 1. Dashboard
  if (localStorage.getItem(dbTrabalhosKey) === null || hasMockData) {
    if (isDemo) {
      const dbTrabalhos = [
        { id: 1, clienteNome: 'Marcos Valério', tipo: 'Tese de Doutorado', data: 'Hoje, 14:00', valor: 450, status: 'Aguardando pagamento', tempo: '24h', critico: true, progress: 85, isAcessivel: true },
        { id: 2, clienteNome: 'Ana Clara', tipo: 'Artigo Científico', data: '15 Out 2026', valor: 1200, status: 'Entregues', tempo: 'Finalizado', critico: false, progress: 100, isAcessivel: true },
        { id: 3, clienteNome: 'Juliana Mendes', tipo: 'TCC', data: '18 Out 2026', valor: 800, status: 'Em andamento', tempo: '10 dias', critico: false, progress: 40, isAcessivel: true },
        { id: 4, clienteNome: 'Pedro Silva', tipo: 'Dissertação de Mestrado', data: '22 Out 2026', valor: 3500, status: 'Em atraso', tempo: 'Atrasado', critico: true, progress: 95, isAcessivel: true },
        { id: 5, clienteNome: 'Carla Dias', tipo: 'Tradução', data: '25 Out 2026', valor: 600, status: 'Em andamento', tempo: '2 dias', critico: false, progress: 50, isAcessivel: true },
        { id: 6, clienteNome: 'Maria Silva', tipo: 'Formatação ABNT', data: '26 Out 2026', valor: 250, status: 'Aguardando pagamento', tempo: '5 dias', critico: false, progress: 20, isAcessivel: true },
        { id: 7, clienteNome: 'Roberto Justus', tipo: 'Artigo Científico', data: '20 Out 2026', valor: 1500, status: 'Em revisão', tempo: '2 dias', critico: true, progress: 90, isAcessivel: true },
        { id: 8, clienteNome: 'Sofia Almeida', tipo: 'TCC', data: '10 Nov 2026', valor: 900, status: 'Em andamento', tempo: '20 dias', critico: false, progress: 10, isAcessivel: true },
        ...Array.from({ length: 60 }).map((_, i) => ({ id: 100 + i, clienteNome: `Cliente ${i}`, tipo: 'TCC', data: 'Passado', valor: 800, status: 'Entregues', tempo: '-', critico: false, progress: 100, isAcessivel: false })),
        ...Array.from({ length: 15 }).map((_, i) => ({ id: 200 + i, clienteNome: `Cliente Andamento ${i}`, tipo: 'Artigo Científico', data: 'Futuro', valor: 1000, status: 'Em andamento', tempo: '-', critico: false, progress: 50, isAcessivel: false })),
        ...Array.from({ length: 50 }).map((_, i) => ({ id: 300 + i, clienteNome: `Antigo ${i}`, tipo: 'Tese de Doutorado', data: 'Passado', valor: 2000, status: 'Entregues', tempo: '-', critico: false, progress: 100, isAcessivel: false })),
      ];
      localStorage.setItem(dbTrabalhosKey, JSON.stringify(dbTrabalhos));
    } else {
      localStorage.setItem(dbTrabalhosKey, JSON.stringify([]));
    }
  }

  // 2. Kanban
  if (localStorage.getItem(kanbanKey) === null || hasMockData) {
    if (isDemo) {
      const initialColumns = {
        'aguardando-inicio': {
          name: 'Aguardando inicio',
          items: [
            { id: 't1', title: 'Tese de Doutorado - Eng. Software', student: 'Ricardo Mendes', date: '15/10/2026', priority: 'Crítica', initials: 'RM' },
            { id: 't2', title: 'Artigo Científico - Bioética', student: 'Ana Paula Silva', date: '20/11/2026', priority: 'Média', initials: 'JS' },
          ],
        },
        'levantamento-dados': {
          name: 'Levantamento de dados',
          items: [
            { id: 't3', title: 'Monografia - Direito Penal', student: 'Lucas Ferreira', date: '05/11/2026', priority: 'Alta', initials: 'LF', image: 'https://picsum.photos/seed/lucas/100/100' },
          ],
        },
        'em-elaboracao': {
          name: 'Em elaboração',
          items: [
            { id: 't4', title: 'Dissertação de Mestrado - IA', student: 'Carlos Gomes', date: '28/10/2026', priority: 'Alta', initials: 'CG' },
            { id: 't5', title: 'TCC - Arquitetura Sustentável', student: 'Mariana Costa', date: '12/12/2026', priority: 'Média', initials: 'MC' },
          ],
        },
        'em-revisao': { name: 'Em revisão', items: [] },
        'entregue': { name: 'Entregue', items: [] },
        'finalizado': { name: 'Finalizado', items: [] },
      };
      localStorage.setItem(kanbanKey, JSON.stringify(initialColumns));
    } else {
      const emptyColumns = {
        'aguardando-inicio': { name: 'Aguardando inicio', items: [] },
        'levantamento-dados': { name: 'Levantamento de dados', items: [] },
        'em-elaboracao': { name: 'Em elaboração', items: [] },
        'em-revisao': { name: 'Em revisão', items: [] },
        'entregue': { name: 'Entregue', items: [] },
        'finalizado': { name: 'Finalizado', items: [] },
      };
      localStorage.setItem(kanbanKey, JSON.stringify(emptyColumns));
    }
  }

  // 3. Financeiro - Receitas
  if (localStorage.getItem(receitasKey) === null || hasMockData) {
    if (isDemo) {
      const receitas = [
        { id: '1', date: '21 Jun 2026', client: 'Lucas Ferreira', origin: 'Monografia - Direito Penal', totalValue: 2000, currentInstallment: 1, totalInstallments: 2, value: 1000, status: 'Pago', type: 'receita' },
        { id: '2', date: '15 Jul 2026', client: 'Ana Paula Silva', origin: 'Artigo Científico - Bioética', totalValue: 1500, currentInstallment: 1, totalInstallments: 1, value: 1500, status: 'Aguardando', type: 'receita' },
        { id: '3', date: '10 Ago 2026', client: 'Carlos Gomes', origin: 'Dissertação de Mestrado', totalValue: 4000, currentInstallment: 2, totalInstallments: 4, value: 1000, status: 'Atrasado', type: 'receita' },
      ];
      localStorage.setItem(receitasKey, JSON.stringify(receitas));
    } else {
      localStorage.setItem(receitasKey, JSON.stringify([]));
    }
  }

  // 4. Financeiro - Despesas
  if (localStorage.getItem(despesasKey) === null || hasMockData) {
    if (isDemo) {
      const despesas = [
        { id: '4', date: '05 Jun 2026', description: 'Assinatura Software Anti-Plágio', value: 350, status: 'Pago', category: 'Software' },
        { id: '5', date: '20 Jun 2026', description: 'Revisão Ortográfica - Mariana', value: 800, status: 'Aguardando', category: 'Serviços' },
      ];
      localStorage.setItem(despesasKey, JSON.stringify(despesas));
    } else {
      localStorage.setItem(despesasKey, JSON.stringify([]));
    }
  }

  // 5. Cadastro - Clientes
  if (localStorage.getItem(clientesKey) === null || hasMockData) {
    if (isDemo) {
      const clients = [
        { id: 'c1', initials: 'DR', name: 'Dr. Ricardo Oliveira', email: 'ricardo.o@universidade.edu', institution: 'USP - São Paulo', course: 'Doutorado em Bioinformática', status: 'Ativo', date: '12 Jan 2024', isoDate: '2024-01-12', bgClass: 'bg-primary-container text-on-primary-container', statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        { id: 'c2', initials: 'AM', name: 'Ana Martins', email: 'ana.martins@prospect.com', institution: 'PUC-RJ', course: 'Mestrado em Economia', status: 'Prospecto', date: '05 Fev 2024', isoDate: '2024-02-05', bgClass: 'bg-surface-dim text-on-surface', statusClass: 'bg-surface-container-highest text-on-surface-variant border-outline-variant' },
        { id: 'c3', initials: 'GS', name: 'Gabriel Silva', email: 'gabriel.silva@aluno.it', institution: 'Unicamp', course: 'Graduação em Eng. Mecânica', status: 'Inativo', date: '20 Nov 2023', isoDate: '2023-11-20', bgClass: 'bg-surface-container-high text-on-surface-variant', statusClass: 'bg-error-container text-error border-error/20' },
        { id: 'c4', initials: 'PS', name: 'Patricia Souza', email: 'patricia.souza@gmail.com', institution: 'UFMG', course: 'Mestrado em Computação', status: 'Ativo', date: '15 Mar 2024', isoDate: '2024-03-15', bgClass: 'bg-primary-container text-on-primary-container', statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        { id: 'c5', initials: 'MS', name: 'Marcos Santos', email: 'marcos.santos@ufrj.br', institution: 'UFRJ', course: 'Doutorado em Physics', status: 'Ativo', date: '22 Mar 2024', isoDate: '2024-03-22', bgClass: 'bg-primary-container text-on-primary-container', statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        { id: 'c6', initials: 'BL', name: 'Beatriz Lima', email: 'beatriz.lima@unb.br', institution: 'Unicamp', course: 'Graduação em Biologia', status: 'Inativo', date: '10 Dez 2023', isoDate: '2023-12-10', bgClass: 'bg-surface-container-high text-on-surface-variant', statusClass: 'bg-error-container text-error border-error/20' },
        { id: 'c7', initials: 'RC', name: 'Rodrigo Costa', email: 'rodrigo.costa@usp.br', institution: 'USP - São Paulo', course: 'Mestrado em Matemática', status: 'Prospecto', date: '02 Abr 2024', isoDate: '2024-04-02', bgClass: 'bg-surface-dim text-on-surface', statusClass: 'bg-surface-container-highest text-on-surface-variant border-outline-variant' },
        { id: 'c8', initials: 'CR', name: 'Camila Rocha', email: 'camila.rocha@puc.br', institution: 'PUC-RJ', course: 'Graduação em Direito', status: 'Ativo', date: '11 Jan 2024', isoDate: '2024-01-11', bgClass: 'bg-primary-container text-on-primary-container', statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
      ];
      localStorage.setItem(clientesKey, JSON.stringify(clients));
    } else {
      localStorage.setItem(clientesKey, JSON.stringify([]));
    }
  }

  // 6. Cadastro - Instituições
  if (localStorage.getItem(instKey) === null || hasMockData) {
    if (isDemo) {
      const institutions = [
        { id: 'i1', initials: 'US', name: 'Universidade de São Paulo (USP)', type: 'Pública', location: 'São Paulo, SP', status: 'Ativo', date: '10 Jan 2024', isoDate: '2024-01-10', bgClass: 'bg-primary-container text-on-primary-container', statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        { id: 'i2', initials: 'UC', name: 'Universidade Estadual de Campinas (UNICAMP)', type: 'Pública', location: 'Campinas, SP', status: 'Ativo', date: '15 Jan 2024', isoDate: '2024-01-15', bgClass: 'bg-primary-container text-on-primary-container', statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        { id: 'i3', initials: 'UR', name: 'Universidade Federal do Rio de Janeiro (UFRJ)', type: 'Pública', location: 'Rio de Janeiro, RJ', status: 'Ativo', date: '18 Jan 2024', isoDate: '2024-01-18', bgClass: 'bg-primary-container text-on-primary-container', statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      ];
      localStorage.setItem(instKey, JSON.stringify(institutions));
    } else {
      localStorage.setItem(instKey, JSON.stringify([]));
    }
  }

  // 7. Cadastro - Cursos
  if (localStorage.getItem(cursosKey) === null || hasMockData) {
    if (isDemo) {
      const courses = [
        { id: 'cur1', initials: 'ES', name: 'Engenharia de Software', degree: 'Bacharelado', duration: '8 semestres', status: 'Ativo', date: '05 Jan 2024', isoDate: '2024-01-05', bgClass: 'bg-primary-container text-on-primary-container', statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        { id: 'cur2', initials: 'BI', name: 'Bioinformática', degree: 'Doutorado', duration: '8 semestres', status: 'Ativo', date: '12 Jan 2024', isoDate: '2024-01-12', bgClass: 'bg-primary-container text-on-primary-container', statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      ];
      localStorage.setItem(cursosKey, JSON.stringify(courses));
    } else {
      localStorage.setItem(cursosKey, JSON.stringify([]));
    }
  }

  // 8. Perfil inicial
  const profileKey = `profile_data_${userId}`;
  if (localStorage.getItem(profileKey) === null) {
    if (email === 'scheilahaese37@gmail.com') {
      localStorage.setItem(profileKey, JSON.stringify({
        name: 'Scheila Haese',
        email: 'scheilahaese37@gmail.com',
        userType: 'administrador',
        title: 'Assessoria Acadêmica Especializada',
        bio: 'Especialista em formatação ABNT, revisão ortográfica e assessoria acadêmica para TCCs, Dissertações e Teses.'
      }));
    } else if (email === 'fernandogurgel.fg@gmail.com') {
      localStorage.setItem(profileKey, JSON.stringify({
        name: 'Fernando Roque Gurgel',
        email: 'fernandogurgel.fg@gmail.com',
        userType: 'administrador',
        title: 'Assessoria Acadêmica Especializada',
        bio: 'Especialista em formatação ABNT, revisão ortográfica e assessoria acadêmica para TCCs, Dissertações e Teses.'
      }));
    }
  }
}
