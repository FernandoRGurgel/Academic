'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, Suspense } from 'react';
import { Filter, Search, Plus, History, Edit, Trash2, Building, BookOpen, Users, X, GraduationCap } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { initDemoData } from '@/lib/initDemoData';
import { createClient } from '@/lib/supabase/client';

function CadastroContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'clientes' | 'instituicoes' | 'cursos' | 'orientadores'>('clientes');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;
  
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativos' | 'Inativos'>('Todos');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  
  // Filtros Avançados
  const [filterClientName, setFilterClientName] = useState('');
  const [filterClientEmail, setFilterClientEmail] = useState('');
  const [filterClientInst, setFilterClientInst] = useState('');
  const [filterClientCourse, setFilterClientCourse] = useState('');
  const [filterInstName, setFilterInstName] = useState('');
  const [filterInstType, setFilterInstType] = useState('');
  const [filterInstLocation, setFilterInstLocation] = useState('');
  const [filterCourseName, setFilterCourseName] = useState('');
  const [filterCourseDegree, setFilterCourseDegree] = useState('');
  const [filterAdvisorName, setFilterAdvisorName] = useState('');
  const [filterAdvisorEmail, setFilterAdvisorEmail] = useState('');
  const [filterAdvisorInst, setFilterAdvisorInst] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  const searchParams = useSearchParams();

  const [clients, setClients] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      initDemoData(user.id, user.email);
      
      // Carregar cache local como contingência inicial instantânea
      const savedClients = localStorage.getItem(`cadastro_clientes_${user.id}`);
      if (savedClients) setClients(JSON.parse(savedClients));
      
      const savedInst = localStorage.getItem(`cadastro_instituicoes_${user.id}`);
      if (savedInst) setInstitutions(JSON.parse(savedInst));

      const savedCourses = localStorage.getItem(`cadastro_cursos_${user.id}`);
      if (savedCourses) setCourses(JSON.parse(savedCourses));

      const savedAdvisors = localStorage.getItem(`cadastro_orientadores_${user.id}`);
      if (savedAdvisors) setAdvisors(JSON.parse(savedAdvisors));

      // Sincronizar dados de forma assíncrona do Supabase
      const syncFromSupabase = async () => {
        try {
          const supabase = createClient();

          // 1. Clientes
          const { data: dbClients, error: errClients } = await supabase
            .from('clientes')
            .select('*')
            .order('created_at', { ascending: false });

          if (!errClients && dbClients) {
            const mappedClients = dbClients.map(c => ({
              id: c.id,
              initials: c.initials,
              name: c.name,
              email: c.email,
              institution: c.institution,
              course: c.course,
              status: c.status,
              date: new Date(c.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
              isoDate: new Date(c.date).toISOString().split('T')[0],
              bgClass: c.status === 'Ativo' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-dim text-on-surface',
              statusClass: c.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'
            }));
            setClients(mappedClients);
            localStorage.setItem(`cadastro_clientes_${user.id}`, JSON.stringify(mappedClients));
          }

          // 2. Instituições
          const { data: dbInsts, error: errInsts } = await supabase
            .from('instituicoes')
            .select('*')
            .order('created_at', { ascending: false });

          if (!errInsts && dbInsts) {
            const mappedInsts = dbInsts.map(i => ({
              id: i.id,
              initials: i.initials,
              name: i.name,
              type: i.type,
              location: i.location,
              status: i.status,
              date: new Date(i.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
              isoDate: new Date(i.date).toISOString().split('T')[0],
              bgClass: i.status === 'Ativo' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-dim text-on-surface',
              statusClass: i.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'
            }));
            setInstitutions(mappedInsts);
            localStorage.setItem(`cadastro_instituicoes_${user.id}`, JSON.stringify(mappedInsts));
          }

          // 3. Cursos
          const { data: dbCourses, error: errCourses } = await supabase
            .from('cursos')
            .select('*')
            .order('created_at', { ascending: false });

          if (!errCourses && dbCourses) {
            const mappedCourses = dbCourses.map(c => ({
              id: c.id,
              initials: c.initials,
              name: c.name,
              degree: c.degree,
              status: c.status,
              date: new Date(c.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
              isoDate: new Date(c.date).toISOString().split('T')[0],
              bgClass: c.status === 'Ativo' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-dim text-on-surface',
              statusClass: c.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'
            }));
            setCourses(mappedCourses);
            localStorage.setItem(`cadastro_cursos_${user.id}`, JSON.stringify(mappedCourses));
          }

          // 4. Orientadores
          const { data: dbAdvisors, error: errAdvisors } = await supabase
            .from('orientadores')
            .select('*')
            .order('created_at', { ascending: false });

          if (!errAdvisors && dbAdvisors) {
            const mappedAdvisors = dbAdvisors.map(a => ({
              id: a.id,
              initials: a.initials,
              name: a.name,
              email: a.email,
              institution: a.institution,
              status: a.status,
              date: new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
              isoDate: new Date(a.date).toISOString().split('T')[0],
              bgClass: a.status === 'Ativo' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-dim text-on-surface',
              statusClass: a.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'
            }));
            setAdvisors(mappedAdvisors);
            localStorage.setItem(`cadastro_orientadores_${user.id}`, JSON.stringify(mappedAdvisors));
          }
        } catch (err) {
          console.error('Erro ao sincronizar cadastros com o Supabase:', err);
        }
      };

      syncFromSupabase();
    }
  }, [user]);

  const updateClients = (newClients: any[]) => {
    setClients(newClients);
    if (user?.id) {
      localStorage.setItem(`cadastro_clientes_${user.id}`, JSON.stringify(newClients));
    }
  };

  const updateInstitutions = (newInstitutions: any[]) => {
    setInstitutions(newInstitutions);
    if (user?.id) {
      localStorage.setItem(`cadastro_instituicoes_${user.id}`, JSON.stringify(newInstitutions));
    }
  };

  const updateCourses = (newCourses: any[]) => {
    setCourses(newCourses);
    if (user?.id) {
      localStorage.setItem(`cadastro_cursos_${user.id}`, JSON.stringify(newCourses));
    }
  };

  const updateAdvisors = (newAdvisors: any[]) => {
    setAdvisors(newAdvisors);
    if (user?.id) {
      localStorage.setItem(`cadastro_orientadores_${user.id}`, JSON.stringify(newAdvisors));
    }
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'clientes' || tab === 'instituicoes' || tab === 'cursos' || tab === 'orientadores') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
    setStatusFilter('Todos');
    setFilterClientName('');
    setFilterClientEmail('');
    setFilterClientInst('');
    setFilterClientCourse('');
    setFilterInstName('');
    setFilterInstType('');
    setFilterInstLocation('');
    setFilterCourseName('');
    setFilterCourseDegree('');
    setFilterAdvisorName('');
    setFilterAdvisorEmail('');
    setFilterAdvisorInst('');
    setFilterStartDate('');
    setFilterEndDate('');
  }, [activeTab]);

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'isoDate', direction: 'desc' });
  const [editingItem, setEditingItem] = useState<any>(null);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, type: 'clientes' | 'instituicoes' | 'cursos' | 'orientadores') => {
    const deleteFromSupabase = async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from(type)
          .delete()
          .eq('id', id);
        if (error) {
          console.error(`Erro ao deletar ${type} no Supabase:`, error);
        }
      } catch (err) {
        console.error(`Erro de conexão ao deletar ${type} no Supabase:`, err);
      }
    };
    deleteFromSupabase();

    if (type === 'clientes') {
      const next = clients.filter(c => c.id !== id);
      updateClients(next);
    } else if (type === 'instituicoes') {
      const next = institutions.filter(i => i.id !== id);
      updateInstitutions(next);
    } else if (type === 'cursos') {
      const next = courses.filter(c => c.id !== id);
      updateCourses(next);
    } else {
      const next = advisors.filter(a => a.id !== id);
      updateAdvisors(next);
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    const isoDateStr = now.toISOString().split('T')[0];
    
    if (activeTab === 'clientes') {
      const name = formData.get('name') as string || 'Novo Cliente';
      const email = formData.get('email') as string || 'novo@cliente.com';
      const institution = formData.get('institution') as string || 'Instituição';
      const course = formData.get('course') as string || 'Curso';
      
      const parts = name.split(' ');
      const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();

      const clientId = editingItem?.id || crypto.randomUUID();

      const newClient = {
        id: clientId,
        initials,
        name,
        email,
        institution,
        course,
        status: editingItem?.status || 'Ativo',
        date: editingItem?.date || dateStr,
        isoDate: editingItem?.isoDate || isoDateStr,
        bgClass: editingItem?.bgClass || 'bg-primary-container text-on-primary-container',
        statusClass: editingItem?.statusClass || 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };

      const saveToSupabase = async () => {
        try {
          const supabase = createClient();
          const dbData = {
            id: clientId,
            user_id: user?.id,
            initials,
            name,
            email,
            institution,
            course,
            status: newClient.status,
            date: new Date(newClient.isoDate).toISOString()
          };

          const { error } = await supabase
            .from('clientes')
            .upsert(dbData, { onConflict: 'id' });

          if (error) {
            console.error('Erro ao salvar cliente no Supabase:', error);
          }
        } catch (err) {
          console.error('Erro de conexão ao salvar cliente no Supabase:', err);
        }
      };
      saveToSupabase();

      if (editingItem) {
        const next = clients.map(c => c.id === editingItem.id ? newClient : c);
        updateClients(next);
      } else {
        const next = [newClient, ...clients];
        updateClients(next);
      }
    } else if (activeTab === 'instituicoes') {
      const name = formData.get('name') as string || 'Nova Instituição';
      const rawInitials = formData.get('initials') as string || '';
      let initials = rawInitials || name.substring(0, 2).toUpperCase();
      if (initials.length > 2) initials = initials.substring(0, 2);
      const type = formData.get('type') as string || 'Pública';
      const location = formData.get('location') as string || 'Local';

      const instId = editingItem?.id || crypto.randomUUID();

      const newInst = {
        id: instId,
        initials,
        name,
        type,
        location,
        status: editingItem?.status || 'Ativo',
        date: editingItem?.date || dateStr,
        isoDate: editingItem?.isoDate || isoDateStr,
        bgClass: editingItem?.bgClass || 'bg-primary-container text-on-primary-container',
        statusClass: editingItem?.statusClass || 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };

      const saveToSupabase = async () => {
        try {
          const supabase = createClient();
          const dbData = {
            id: instId,
            user_id: user?.id,
            initials,
            name,
            type,
            location,
            status: newInst.status,
            date: new Date(newInst.isoDate).toISOString()
          };

          const { error } = await supabase
            .from('instituicoes')
            .upsert(dbData, { onConflict: 'id' });

          if (error) {
            console.error('Erro ao salvar instituição no Supabase:', error);
          }
        } catch (err) {
          console.error('Erro de conexão ao salvar instituição no Supabase:', err);
        }
      };
      saveToSupabase();

      if (editingItem) {
        const next = institutions.map(i => i.id === editingItem.id ? newInst : i);
        updateInstitutions(next);
      } else {
        const next = [newInst, ...institutions];
        updateInstitutions(next);
      }
    } else if (activeTab === 'cursos') {
      const name = formData.get('name') as string || 'Novo Curso';
      const degree = formData.get('degree') as string || 'Graduação';
      
      const parts = name.split(' ');
      const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();

      const courseId = editingItem?.id || crypto.randomUUID();

      const newCourse = {
        id: courseId,
        initials,
        name,
        degree,
        status: editingItem?.status || 'Ativo',
        date: editingItem?.date || dateStr,
        isoDate: editingItem?.isoDate || isoDateStr,
        bgClass: editingItem?.bgClass || 'bg-primary-container text-on-primary-container',
        statusClass: editingItem?.statusClass || 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };

      const saveToSupabase = async () => {
        try {
          const supabase = createClient();
          const dbData = {
            id: courseId,
            user_id: user?.id,
            initials,
            name,
            degree,
            status: newCourse.status,
            date: new Date(newCourse.isoDate).toISOString()
          };

          const { error } = await supabase
            .from('cursos')
            .upsert(dbData, { onConflict: 'id' });

          if (error) {
            console.error('Erro ao salvar curso no Supabase:', error);
          }
        } catch (err) {
          console.error('Erro de conexão ao salvar curso no Supabase:', err);
        }
      };
      saveToSupabase();

      if (editingItem) {
        const next = courses.map(c => c.id === editingItem.id ? newCourse : c);
        updateCourses(next);
      } else {
        const next = [newCourse, ...courses];
        updateCourses(next);
      }
    } else if (activeTab === 'orientadores') {
      const name = formData.get('name') as string || 'Novo Orientador';
      const email = formData.get('email') as string || '';
      const institution = formData.get('institution') as string || '';
      
      const parts = name.split(' ');
      const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();

      const advisorId = editingItem?.id || crypto.randomUUID();

      const newAdvisor = {
        id: advisorId,
        initials,
        name,
        email,
        institution,
        status: editingItem?.status || 'Ativo',
        date: editingItem?.date || dateStr,
        isoDate: editingItem?.isoDate || isoDateStr,
        bgClass: editingItem?.bgClass || 'bg-primary-container text-on-primary-container',
        statusClass: editingItem?.statusClass || 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };

      const saveToSupabase = async () => {
        try {
          const supabase = createClient();
          const dbData = {
            id: advisorId,
            user_id: user?.id,
            initials,
            name,
            email,
            institution,
            status: newAdvisor.status,
            date: new Date(newAdvisor.isoDate).toISOString()
          };

          const { error } = await supabase
            .from('orientadores')
            .upsert(dbData, { onConflict: 'id' });

          if (error) {
            console.error('Erro ao salvar orientador no Supabase:', error);
          }
        } catch (err) {
          console.error('Erro de conexão ao salvar orientador no Supabase:', err);
        }
      };
      saveToSupabase();

      if (editingItem) {
        const next = advisors.map(a => a.id === editingItem.id ? newAdvisor : a);
        updateAdvisors(next);
      } else {
        const next = [newAdvisor, ...advisors];
        updateAdvisors(next);
      }
    }
    
    setEditingItem(null);
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-sans text-on-surface-variant gap-3">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
        <span>Carregando cadastros...</span>
      </div>
    );
  }

  const sortedData = <T extends Record<string, any>>(data: T[]): T[] => {
    const sortableItems = [...data];
    sortableItems.sort((a, b) => {
      // Allow specific sort fields per entity types
      const key = sortConfig.key;
      let aVal = a[key] || '';
      let bVal = b[key] || '';

      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortableItems;
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchTerm || 
                          client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.institution.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.course.toLowerCase().includes(searchTerm.toLowerCase());
                          
    const matchesStatus = statusFilter === 'Todos' || 
                          (statusFilter === 'Ativos' && client.status === 'Ativo') ||
                          (statusFilter === 'Inativos' && client.status !== 'Ativo');

    const matchesName = !filterClientName || client.name.toLowerCase().includes(filterClientName.toLowerCase());
    const matchesEmail = !filterClientEmail || client.email.toLowerCase().includes(filterClientEmail.toLowerCase());
    const matchesInst = !filterClientInst || client.institution === filterClientInst;
    const matchesCourse = !filterClientCourse || client.course === filterClientCourse;
    
    const matchesStartDate = !filterStartDate || client.isoDate >= filterStartDate;
    const matchesEndDate = !filterEndDate || client.isoDate <= filterEndDate;

    return matchesSearch && matchesStatus && matchesName && matchesEmail && matchesInst && matchesCourse && matchesStartDate && matchesEndDate;
  });

  const filteredInstitutions = institutions.filter(inst => {
    const matchesSearch = !searchTerm || 
                          inst.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inst.location.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inst.type.toLowerCase().includes(searchTerm.toLowerCase());
                          
    const matchesStatus = statusFilter === 'Todos' || 
                          (statusFilter === 'Ativos' && inst.status === 'Ativo') ||
                          (statusFilter === 'Inativos' && inst.status !== 'Ativo');

    const matchesName = !filterInstName || inst.name.toLowerCase().includes(filterInstName.toLowerCase());
    const matchesType = !filterInstType || inst.type === filterInstType;
    const matchesLocation = !filterInstLocation || inst.location.toLowerCase().includes(filterInstLocation.toLowerCase());
    
    const matchesStartDate = !filterStartDate || inst.isoDate >= filterStartDate;
    const matchesEndDate = !filterEndDate || inst.isoDate <= filterEndDate;

    return matchesSearch && matchesStatus && matchesName && matchesType && matchesLocation && matchesStartDate && matchesEndDate;
  });

  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchTerm || 
                          course.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          course.degree.toLowerCase().includes(searchTerm.toLowerCase());
                          
    const matchesStatus = statusFilter === 'Todos' || 
                          (statusFilter === 'Ativos' && course.status === 'Ativo') ||
                          (statusFilter === 'Inativos' && course.status !== 'Ativo');

    const matchesName = !filterCourseName || course.name.toLowerCase().includes(filterCourseName.toLowerCase());
    const matchesDegree = !filterCourseDegree || course.degree === filterCourseDegree;
    
    const matchesStartDate = !filterStartDate || course.isoDate >= filterStartDate;
    const matchesEndDate = !filterEndDate || course.isoDate <= filterEndDate;

    return matchesSearch && matchesStatus && matchesName && matchesDegree && matchesStartDate && matchesEndDate;
  });

  const filteredAdvisors = advisors.filter(adv => {
    const matchesSearch = !searchTerm || 
                          adv.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (adv.email && adv.email.toLowerCase().includes(searchTerm.toLowerCase())) || 
                          (adv.institution && adv.institution.toLowerCase().includes(searchTerm.toLowerCase()));
                          
    const matchesStatus = statusFilter === 'Todos' || 
                          (statusFilter === 'Ativos' && adv.status === 'Ativo') ||
                          (statusFilter === 'Inativos' && adv.status !== 'Ativo');

    const matchesName = !filterAdvisorName || adv.name.toLowerCase().includes(filterAdvisorName.toLowerCase());
    const matchesEmail = !filterAdvisorEmail || (adv.email && adv.email.toLowerCase().includes(filterAdvisorEmail.toLowerCase()));
    const matchesInst = !filterAdvisorInst || adv.institution === filterAdvisorInst;
    
    const matchesStartDate = !filterStartDate || adv.isoDate >= filterStartDate;
    const matchesEndDate = !filterEndDate || adv.isoDate <= filterEndDate;

    return matchesSearch && matchesStatus && matchesName && matchesEmail && matchesInst && matchesStartDate && matchesEndDate;
  });

  const clientsData = sortedData(filteredClients);
  const institutionsData = sortedData(filteredInstitutions);
  const coursesData = sortedData(filteredCourses);
  const advisorsData = sortedData(filteredAdvisors);

  const getPaginatedData = <T extends any>(data: T[]): T[] => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const paginatedClients = getPaginatedData(clientsData);
  const paginatedInstitutions = getPaginatedData(institutionsData);
  const paginatedCourses = getPaginatedData(coursesData);
  const paginatedAdvisors = getPaginatedData(advisorsData);

  const currentTotal = activeTab === 'clientes' 
    ? filteredClients.length 
    : activeTab === 'instituicoes' 
      ? filteredInstitutions.length 
      : activeTab === 'cursos'
        ? filteredCourses.length
        : filteredAdvisors.length;

  const totalPages = Math.ceil(currentTotal / ITEMS_PER_PAGE) || 1;

  const startRecord = currentTotal === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endRecord = Math.min(currentPage * ITEMS_PER_PAGE, currentTotal);

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-10 py-12 flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-primary tracking-tight mb-1">Cadastros Gerais</h1>
          <p className="font-sans text-on-surface-variant">Gerencie a base de clientes, instituições e cursos do sistema.</p>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-sans text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Novo {activeTab === 'clientes' ? 'Cliente' : activeTab === 'instituicoes' ? 'Instituição' : activeTab === 'cursos' ? 'Curso' : 'Orientador'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-outline-variant pb-px overflow-x-auto">
        <button 
          onClick={() => { setActiveTab('clientes'); setSearchTerm(''); setCurrentPage(1); }}
          className={`flex items-center gap-2 px-6 py-3 font-sans text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'clientes' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface hover:border-outline-variant'}`}
        >
          <Users className="w-4 h-4" /> Clientes
        </button>
        <button 
          onClick={() => { setActiveTab('instituicoes'); setSearchTerm(''); setCurrentPage(1); }}
          className={`flex items-center gap-2 px-6 py-3 font-sans text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'instituicoes' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface hover:border-outline-variant'}`}
        >
          <Building className="w-4 h-4" /> Instituições
        </button>
        <button 
          onClick={() => { setActiveTab('cursos'); setSearchTerm(''); setCurrentPage(1); }}
          className={`flex items-center gap-2 px-6 py-3 font-sans text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'cursos' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface hover:border-outline-variant'}`}
        >
          <BookOpen className="w-4 h-4" /> Cursos
        </button>
        <button 
          onClick={() => { setActiveTab('orientadores'); setSearchTerm(''); setCurrentPage(1); }}
          className={`flex items-center gap-2 px-6 py-3 font-sans text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'orientadores' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface hover:border-outline-variant'}`}
        >
          <GraduationCap className="w-4 h-4" /> Orientadores
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-end">
        <div className="lg:col-span-5 flex flex-col gap-2">
          <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Buscar</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder={`Buscar ${activeTab}...`} 
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/20 bg-surface-container-lowest text-sm placeholder:text-outline"
            />
          </div>
        </div>
        
        <div className="lg:col-span-4 flex flex-col gap-2">
          <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Status</label>
          <div className="flex gap-1 p-1 bg-surface-container-low rounded-lg border border-outline-variant">
            <button 
              onClick={() => { setStatusFilter('Todos'); setCurrentPage(1); }}
              className={`flex-1 py-1.5 rounded text-sm font-medium transition-all ${statusFilter === 'Todos' ? 'bg-primary text-white shadow-sm font-semibold' : 'text-secondary hover:bg-surface-container-lowest'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => { setStatusFilter('Ativos'); setCurrentPage(1); }}
              className={`flex-1 py-1.5 rounded text-sm font-medium transition-all ${statusFilter === 'Ativos' ? 'bg-primary text-white shadow-sm font-semibold' : 'text-secondary hover:bg-surface-container-lowest'}`}
            >
              Ativos
            </button>
            <button 
              onClick={() => { setStatusFilter('Inativos'); setCurrentPage(1); }}
              className={`flex-1 py-1.5 rounded text-sm font-medium transition-all ${statusFilter === 'Inativos' ? 'bg-primary text-white shadow-sm font-semibold' : 'text-secondary hover:bg-surface-container-lowest'}`}
            >
              Inativos
            </button>
          </div>
        </div>
        
        <div className="lg:col-span-3 flex justify-end">
          <button 
            onClick={() => setIsFilterDrawerOpen(true)}
            className={`flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2.5 transition-all rounded-lg border ${
              isFilterDrawerOpen || filterClientName || filterClientEmail || filterClientInst || filterClientCourse || filterInstName || filterInstType || filterInstLocation || filterCourseName || filterCourseDegree || filterAdvisorName || filterAdvisorEmail || filterAdvisorInst || filterStartDate || filterEndDate
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Table Layer */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th 
                  className="px-6 py-4 font-sans text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-container transition-colors"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center gap-1">
                    {activeTab === 'clientes' ? 'Nome' : activeTab === 'instituicoes' ? 'Instituição' : activeTab === 'cursos' ? 'Curso' : 'Nome'}
                    {sortConfig.key === 'name' && <span className="text-[10px] text-primary">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-sans text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-container transition-colors"
                  onClick={() => requestSort(activeTab === 'clientes' ? 'institution' : activeTab === 'instituicoes' ? 'type' : activeTab === 'cursos' ? 'degree' : 'institution')}
                >
                  <div className="flex items-center gap-1">
                    {activeTab === 'clientes' ? 'Instituição / Curso' : activeTab === 'instituicoes' ? 'Tipo / Local' : activeTab === 'cursos' ? 'Grau' : 'Instituição de Origem'}
                    {(sortConfig.key === 'institution' || sortConfig.key === 'type' || sortConfig.key === 'degree') && <span className="text-[10px] text-primary">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-sans text-xs font-semibold text-secondary uppercase tracking-wider text-center cursor-pointer hover:bg-surface-container transition-colors"
                  onClick={() => requestSort('status')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Status
                    {sortConfig.key === 'status' && <span className="text-[10px] text-primary">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-sans text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-container transition-colors"
                  onClick={() => requestSort('isoDate')}
                >
                  <div className="flex items-center gap-1">
                    Data Registro
                    {sortConfig.key === 'isoDate' && <span className="text-[10px] text-primary">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th className="px-6 py-4 font-sans text-xs font-semibold text-secondary uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant bg-surface-container-lowest">
              {activeTab === 'clientes' && paginatedClients.map((client, idx) => (
                <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${client.bgClass}`}>
                        {client.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-primary">{client.name}</span>
                        <span className="text-xs text-secondary mt-0.5">{client.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-on-surface text-sm font-medium">{client.institution}</span>
                      <span className="text-xs text-secondary mt-0.5">{client.course}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${client.statusClass}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-secondary text-sm font-medium">{client.date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-outline">
                      <button className="p-2 hover:bg-surface-container hover:text-primary rounded-md transition-colors" title="Editar" onClick={() => handleEdit(client)}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-error-container hover:text-error rounded-md transition-colors" title="Excluir" onClick={() => handleDelete(client.id, 'clientes')}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {activeTab === 'instituicoes' && paginatedInstitutions.map((inst, idx) => (
                <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${inst.bgClass}`}>
                        {inst.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-primary">{inst.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-on-surface text-sm font-medium">{inst.type}</span>
                      <span className="text-xs text-secondary mt-0.5">{inst.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${inst.statusClass}`}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-secondary text-sm font-medium">{inst.date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-outline">
                      <button className="p-2 hover:bg-surface-container hover:text-primary rounded-md transition-colors" title="Editar" onClick={() => handleEdit(inst)}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-error-container hover:text-error rounded-md transition-colors" title="Excluir" onClick={() => handleDelete(inst.id, 'instituicoes')}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {activeTab === 'cursos' && paginatedCourses.map((course, idx) => (
                <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${course.bgClass}`}>
                        {course.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-primary">{course.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-on-surface text-sm font-medium">{course.degree}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${course.statusClass}`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-secondary text-sm font-medium">{course.date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-outline">
                      <button className="p-2 hover:bg-surface-container hover:text-primary rounded-md transition-colors" title="Editar" onClick={() => handleEdit(course)}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-error-container hover:text-error rounded-md transition-colors" title="Excluir" onClick={() => handleDelete(course.id, 'cursos')}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {activeTab === 'orientadores' && paginatedAdvisors.map((adv, idx) => (
                <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${adv.bgClass}`}>
                        {adv.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-primary">{adv.name}</span>
                        {adv.email && <span className="text-xs text-secondary mt-0.5">{adv.email}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-on-surface text-sm font-medium">{adv.institution || 'Não informada'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${adv.statusClass}`}>
                      {adv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-secondary text-sm font-medium">{adv.date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-outline">
                      <button className="p-2 hover:bg-surface-container hover:text-primary rounded-md transition-colors" title="Editar" onClick={() => handleEdit(adv)}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-error-container hover:text-error rounded-md transition-colors" title="Excluir" onClick={() => handleDelete(adv.id, 'orientadores')}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination bg */}
        <div className="px-6 py-4 bg-surface border-t border-outline-variant flex justify-between items-center">
          <span className="text-sm font-medium text-secondary">
            Mostrando {startRecord}-{endRecord} de {currentTotal} registros
          </span>
          <div className="flex gap-2">
             <button 
               onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
               disabled={currentPage === 1}
               className="px-3 py-1.5 rounded border border-outline-variant text-secondary hover:bg-surface-container-low text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
             >
               Anterior
             </button>
             <button 
               onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
               disabled={currentPage === totalPages}
               className="px-3 py-1.5 rounded border border-outline-variant text-secondary hover:bg-surface-container-low text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
             >
               Próxima
             </button>
          </div>
        </div>
      </div>

      {/* Modal Cadastro */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        title={`${editingItem ? 'Editar' : 'Novo'} ${activeTab === 'clientes' ? 'Cliente' : activeTab === 'instituicoes' ? 'Instituição' : activeTab === 'cursos' ? 'Curso' : 'Orientador'}`}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
          {activeTab === 'clientes' && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Nome Completo</label>
                <input name="name" type="text" defaultValue={editingItem?.name || ''} placeholder="Nome do cliente" required className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">E-mail</label>
                <input name="email" type="email" defaultValue={editingItem?.email || ''} placeholder="E-mail de contato" className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Instituição Vinculada</label>
                <select name="institution" defaultValue={editingItem?.institution || ''} className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                  <option value="">Selecione uma instituição...</option>
                  {institutions.map((inst, idx) => (
                    <option key={idx} value={inst.name}>{inst.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Curso Vinculado</label>
                <select name="course" defaultValue={editingItem?.course || ''} className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                  <option value="">Selecione um curso...</option>
                  {courses.map((course, idx) => (
                    <option key={idx} value={course.name}>{course.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {activeTab === 'instituicoes' && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Nome da Instituição</label>
                <input name="name" type="text" defaultValue={editingItem?.name || ''} placeholder="Nome completo" required className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Sigla</label>
                <input name="initials" type="text" defaultValue={editingItem?.initials || ''} placeholder="Ex: USP, UFRJ" className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Tipo</label>
                <select name="type" defaultValue={editingItem?.type || 'Pública'} className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                  <option>Pública</option>
                  <option>Privada</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Localização</label>
                <input name="location" type="text" defaultValue={editingItem?.location || ''} placeholder="Cidade, UF" className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
            </>
          )}

          {activeTab === 'cursos' && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Nome do Curso</label>
                <input name="name" type="text" defaultValue={editingItem?.name || ''} placeholder="Nome do curso" required className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Grau / Nível</label>
                <select name="degree" defaultValue={editingItem?.degree || 'Graduação (Bacharelado)'} className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                  <option>Graduação (Bacharelado)</option>
                  <option>Graduação (Licenciatura)</option>
                  <option>Especialização / Lato Sensu</option>
                  <option>Mestrado</option>
                  <option>Doutorado</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Área de Conhecimento</label>
                <input name="area" type="text" defaultValue={editingItem?.area || ''} placeholder="Ex: Exatas, Humanas, Saúde..." className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
            </>
          )}

          {activeTab === 'orientadores' && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Nome Completo</label>
                <input name="name" type="text" defaultValue={editingItem?.name || ''} placeholder="Nome do orientador" required className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">E-mail</label>
                <input name="email" type="email" defaultValue={editingItem?.email || ''} placeholder="E-mail de contato" className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Instituição de Origem</label>
                <select name="institution" defaultValue={editingItem?.institution || ''} className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                  <option value="">Selecione uma instituição...</option>
                  {institutions.map((inst, idx) => (
                    <option key={idx} value={inst.name}>{inst.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          
          <div className="mt-4 flex justify-end gap-3">
            <button 
              onClick={() => { setIsModalOpen(false); setEditingItem(null); }}
              className="px-5 py-2.5 bg-surface text-on-surface border border-outline-variant font-sans text-sm font-semibold rounded-lg hover:bg-surface-container-low transition-colors"
              type="button"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 bg-primary text-white font-sans text-sm font-semibold rounded-lg hover:bg-primary/90 transition-opacity shadow-sm"
            >
              Salvar Cadastro
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Lateral (Drawer) de Filtros */}
      {isFilterDrawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setIsFilterDrawerOpen(false)}
            className="fixed inset-0 bg-black/40 z-50 transition-opacity animate-in fade-in duration-200"
          ></div>
          
          {/* Drawer Container */}
          <div className="fixed right-0 top-0 h-full w-96 bg-surface shadow-2xl border-l border-outline-variant z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-outline-variant flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-primary animate-in fade-in duration-100">Filtros Avançados</h3>
                <p className="text-xs text-secondary mt-0.5">Filtrando {activeTab === 'clientes' ? 'Clientes' : activeTab === 'instituicoes' ? 'Instituições' : activeTab === 'cursos' ? 'Cursos' : 'Orientadores'}</p>
              </div>
              <button 
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-1.5 hover:bg-surface-container rounded-md transition-colors text-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Drawer Body - Rolável */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'clientes' && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Nome do Cliente</label>
                    <input 
                      type="text" 
                      value={filterClientName} 
                      onChange={(e) => { setFilterClientName(e.target.value); setCurrentPage(1); }} 
                      placeholder="Filtrar por nome" 
                      className="p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">E-mail</label>
                    <input 
                      type="text" 
                      value={filterClientEmail} 
                      onChange={(e) => { setFilterClientEmail(e.target.value); setCurrentPage(1); }} 
                      placeholder="Filtrar por e-mail" 
                      className="p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Instituição</label>
                    <select 
                      value={filterClientInst} 
                      onChange={(e) => { setFilterClientInst(e.target.value); setCurrentPage(1); }} 
                      className="p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                    >
                      <option value="">Todas as instituições</option>
                      {Array.from(new Set(clients.map(c => c.institution))).map((inst, idx) => (
                        <option key={idx} value={inst}>{inst}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Curso</label>
                    <select 
                      value={filterClientCourse} 
                      onChange={(e) => { setFilterClientCourse(e.target.value); setCurrentPage(1); }} 
                      className="p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                    >
                      <option value="">Todos os cursos</option>
                      {Array.from(new Set(clients.map(c => c.course))).map((course, idx) => (
                        <option key={idx} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              
              {activeTab === 'instituicoes' && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Nome da Instituição</label>
                    <input 
                      type="text" 
                      value={filterInstName} 
                      onChange={(e) => { setFilterInstName(e.target.value); setCurrentPage(1); }} 
                      placeholder="Filtrar por nome" 
                      className="p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Tipo</label>
                    <select 
                      value={filterInstType} 
                      onChange={(e) => { setFilterInstType(e.target.value); setCurrentPage(1); }} 
                      className="p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                    >
                      <option value="">Todos os tipos</option>
                      <option value="Pública">Pública</option>
                      <option value="Privada">Privada</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Localização</label>
                    <input 
                      type="text" 
                      value={filterInstLocation} 
                      onChange={(e) => { setFilterInstLocation(e.target.value); setCurrentPage(1); }} 
                      placeholder="Filtrar por cidade/estado" 
                      className="p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                    />
                  </div>
                </>
              )}
              
              {activeTab === 'cursos' && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Nome do Curso</label>
                    <input 
                      type="text" 
                      value={filterCourseName} 
                      onChange={(e) => { setFilterCourseName(e.target.value); setCurrentPage(1); }} 
                      placeholder="Filtrar por nome" 
                      className="p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Grau</label>
                    <select 
                      value={filterCourseDegree} 
                      onChange={(e) => { setFilterCourseDegree(e.target.value); setCurrentPage(1); }} 
                      className="p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                    >
                      <option value="">Todos os graus</option>
                      <option value="Bacharelado">Bacharelado</option>
                      <option value="Licenciatura">Licenciatura</option>
                      <option value="Mestrado">Mestrado</option>
                      <option value="Doutorado">Doutorado</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'orientadores' && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Nome do Orientador</label>
                    <input 
                      type="text" 
                      value={filterAdvisorName} 
                      onChange={(e) => { setFilterAdvisorName(e.target.value); setCurrentPage(1); }} 
                      placeholder="Filtrar por nome" 
                      className="p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">E-mail</label>
                    <input 
                      type="text" 
                      value={filterAdvisorEmail} 
                      onChange={(e) => { setFilterAdvisorEmail(e.target.value); setCurrentPage(1); }} 
                      placeholder="Filtrar por e-mail" 
                      className="p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Instituição de Origem</label>
                    <select 
                      value={filterAdvisorInst} 
                      onChange={(e) => { setFilterAdvisorInst(e.target.value); setCurrentPage(1); }} 
                      className="p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                    >
                      <option value="">Todas as instituições</option>
                      {Array.from(new Set(advisors.map(a => a.institution).filter(Boolean))).map((inst, idx) => (
                        <option key={idx} value={inst}>{inst}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              
              {/* Filtro de Período de Registro */}
              <div className="border-t border-outline-variant pt-6 space-y-4">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">Período de Registro</h4>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-semibold text-secondary">A partir de</label>
                  <input 
                    type="date" 
                    value={filterStartDate} 
                    onChange={(e) => { setFilterStartDate(e.target.value); setCurrentPage(1); }} 
                    className="p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-semibold text-secondary">Até</label>
                  <input 
                    type="date" 
                    value={filterEndDate} 
                    onChange={(e) => { setFilterEndDate(e.target.value); setCurrentPage(1); }} 
                    className="p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                  />
                </div>
              </div>
            </div>
            
            {/* Drawer Footer */}
            <div className="p-6 border-t border-outline-variant flex items-center justify-between gap-4 bg-surface-container-low">
              <button 
                onClick={() => {
                  setFilterClientName('');
                  setFilterClientEmail('');
                  setFilterClientInst('');
                  setFilterClientCourse('');
                  setFilterInstName('');
                  setFilterInstType('');
                  setFilterInstLocation('');
                  setFilterCourseName('');
                  setFilterCourseDegree('');
                  setFilterAdvisorName('');
                  setFilterAdvisorEmail('');
                  setFilterAdvisorInst('');
                  setFilterStartDate('');
                  setFilterEndDate('');
                  setCurrentPage(1);
                }}
                className="text-xs font-bold text-error hover:underline transition-all py-2"
              >
                Limpar Tudo
              </button>
              
              <button 
                onClick={() => setIsFilterDrawerOpen(false)}
                className="px-5 py-2.5 bg-primary text-white font-sans text-sm font-semibold rounded-lg hover:bg-primary/90 transition-opacity shadow-sm"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center font-sans text-on-surface-variant">Carregando formulários de cadastro...</div>}>
      <CadastroContent />
    </Suspense>
  );
}
