'use client';

import { useState, useRef, useEffect, use } from 'react';
import {
  ArrowLeft, Clock, User, CheckCircle2, AlertTriangle,
  FileText, FileStack, BookOpen, PenTool, Plus,
  GripVertical, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/Modal';
import { FinancePaymentFields } from '@/components/FinancePaymentFields';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface WorkData {
  id: string;
  tipo: string;
  titulo?: string;
  cliente_nome: string;
  instituicao?: string;
  curso?: string;
  orientador_nome?: string;
  data?: string;
  status?: string;
  prioridade?: string;
  progress?: number;
  column_id?: string;
  critico?: boolean;
  created_at?: string;
}

interface Parcela {
  id: string;
  numero: number;
  valor: number;
  due_date: string | null;
  status: string;
}

interface FinanceiroData {
  id: string;
  payment_condition: string;
  total_value: number;
  down_payment: number;
  first_due_date: string | null;
  installment_count: number;
  interval_days: number;
  parcelas: Parcela[];
}

interface Stage {
  id: string;
  title: string;
  description: string;
  status: string;
  plannedDate?: string;
  onTime?: boolean;
}

interface ProjectFile {
  id: string;
  name: string;
  date: string;
  type: string;
  file?: File;
}

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function WorkDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [trabalho, setTrabalho] = useState<WorkData | null>(null);
  const [loadingWork, setLoadingWork] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);

  // Estados do modal financeiro
  const [paymentCondition, setPaymentCondition] = useState('À vista');
  const [totalValue, setTotalValue] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [installmentValues, setInstallmentValues] = useState<string[]>([]);
  const [installmentCount, setInstallmentCount] = useState(2);
  const [intervalDays, setIntervalDays] = useState(30);
  const [firstDueDate, setFirstDueDate] = useState('');

  // Dados financeiros já registrados
  const [financeiroData, setFinanceiroData] = useState<FinanceiroData | null>(null);
  const [receitasTrabalho, setReceitasTrabalho] = useState<any[]>([]);

  // Carregar financeiro do Supabase
  const fetchFinanceiro = async (trabalhoId: string) => {
    try {
      const supabase = createClient();

      // Carregar receitas associadas a este trabalho
      const { data: recs } = await supabase
        .from('receitas')
        .select('*')
        .eq('trabalho_id', trabalhoId)
        .order('current_installment', { ascending: true });

      if (recs) {
        setReceitasTrabalho(recs);
      } else {
        setReceitasTrabalho([]);
      }

      const { data: fin } = await supabase
        .from('financeiro')
        .select('*, financeiro_parcelas(*)')
        .eq('trabalho_id', trabalhoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fin) {
        setFinanceiroData({
          id: fin.id,
          payment_condition: fin.payment_condition,
          total_value: fin.total_value,
          down_payment: fin.down_payment,
          first_due_date: fin.first_due_date,
          installment_count: fin.installment_count,
          interval_days: fin.interval_days,
          parcelas: (fin.financeiro_parcelas || []).sort((a: Parcela, b: Parcela) => a.numero - b.numero),
        });
      } else {
        setFinanceiroData(null);
      }
    } catch (e) {
      console.error('Erro ao carregar financeiro:', e);
    }
  };

  const handleOpenFinanceModal = () => {
    if (financeiroData) {
      setPaymentCondition(financeiroData.payment_condition);
      setTotalValue(financeiroData.total_value.toString());
      setDownPayment(financeiroData.down_payment.toString());
      setInstallmentCount(financeiroData.installment_count);
      setIntervalDays(financeiroData.interval_days);
      setFirstDueDate(financeiroData.first_due_date ? financeiroData.first_due_date.split('T')[0] : '');
      
      const vals = financeiroData.parcelas.map(p => p.valor.toString());
      setInstallmentValues(vals);
    } else {
      setPaymentCondition('À vista');
      setTotalValue('');
      setDownPayment('');
      setInstallmentCount(2);
      setIntervalDays(30);
      setFirstDueDate('');
      setInstallmentValues([]);
    }
    setIsFinanceModalOpen(true);
  };

  // Arquivos: começa vazio (sem dados mockados)
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Etapas: começa vazio (sem dados mockados)
  const [stages, setStages] = useState<Stage[]>([]);

  const draggedItemRef = useRef<number | null>(null);

  // Carregar trabalho do Supabase pelo ID
  useEffect(() => {
    if (!user?.id || !id) return;

    const fetchWork = async () => {
      setLoadingWork(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('trabalhos')
          .select('*, orientadores(name)')
          .eq('id', id)
          .single();

        if (error || !data) {
          console.error('Erro ao carregar trabalho:', error);
          setLoadingWork(false);
          return;
        }

        setTrabalho({
          id: data.id,
          tipo: data.tipo || 'Trabalho Acadêmico',
          titulo: data.titulo || '',
          cliente_nome: data.cliente_nome || '—',
          instituicao: data.instituicao || '',
          curso: data.curso || '',
          orientador_nome: data.orientadores?.name || '',
          data: data.data,
          status: data.status,
          prioridade: data.prioridade,
          progress: data.progress ?? 0,
          column_id: data.column_id,
          critico: data.critico,
          created_at: data.created_at
        });
      } catch (e) {
        console.error('Erro ao buscar trabalho:', e);
      } finally {
        setLoadingWork(false);
      }
    };

    fetchWork();
    fetchFinanceiro(id);
  }, [user, id]);

  const handleAddFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newFile: ProjectFile = {
        id: Math.random().toString(),
        name: file.name,
        date:
          new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) +
          ', ' +
          new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        type: file.name.split('.').pop() || 'file',
        file
      };
      setFiles(prev => [...prev, newFile]);
    }
  };

  const handleDownload = (file: ProjectFile) => {
    let url: string;
    if (file.file) {
      url = URL.createObjectURL(file.file);
    } else {
      const blob = new Blob(['Arquivo: ' + file.name], { type: 'text/plain' });
      url = URL.createObjectURL(blob);
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    draggedItemRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const draggedItem = draggedItemRef.current;
    if (draggedItem === null || draggedItem === index) return;
    setStages(prev => {
      const next = [...prev];
      const [moved] = next.splice(draggedItem, 1);
      next.splice(index, 0, moved);
      return next;
    });
    draggedItemRef.current = index;
  };

  const handleDragEnd = () => {
    draggedItemRef.current = null;
  };

  const toggleStageStatus = (stageId: string, plannedDateStr?: string) => {
    setStages(prev =>
      prev.map(stage => {
        if (stage.id !== stageId) return stage;
        if (stage.status === 'Concluído') {
          return { ...stage, status: 'Pendente', onTime: undefined };
        }
        let onTime = true;
        if (plannedDateStr) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const [year, month, day] = plannedDateStr.split('-');
          const planned = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          planned.setHours(0, 0, 0, 0);
          onTime = today <= planned;
        }
        return { ...stage, status: 'Concluído', onTime };
      })
    );
  };

  const handleSaveStage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    let finalDesc = description;
    if (date) {
      const formattedDate = new Date(date).toLocaleDateString('pt-BR');
      finalDesc = finalDesc
        ? `${finalDesc} (Planejado para ${formattedDate})`
        : `Planejado para ${formattedDate}`;
    }

    setStages(prev => [
      ...prev,
      { id: Math.random().toString(), title, description: finalDesc, status: 'Pendente', plannedDate: date || undefined }
    ]);
    setIsModalOpen(false);
    (e.target as HTMLFormElement).reset();
  };

  // ─── Estados de carregamento e erro ──────────────────────────────────────────
  if (authLoading || loadingWork) {
    return (
      <div className="flex h-screen items-center justify-center font-sans text-on-surface-variant gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span>Carregando trabalho...</span>
      </div>
    );
  }

  if (!trabalho) {
    return (
      <div className="flex h-screen items-center justify-center font-sans text-on-surface-variant flex-col gap-4">
        <p className="text-lg font-semibold">Trabalho não encontrado.</p>
        <button onClick={() => router.back()} className="text-primary underline text-sm">
          Voltar
        </button>
      </div>
    );
  }

  // ─── Derivar informações de exibição ─────────────────────────────────────────
  const prazoFormatado = trabalho.data
    ? new Date(trabalho.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const prazoEhPassado = trabalho.data ? new Date(trabalho.data) < new Date() : false;

  const completedCount = stages.filter(s => s.status === 'Concluído').length;
  const progressoCalculado =
    stages.length > 0 ? Math.round((completedCount / stages.length) * 100) : (trabalho.progress ?? 0);

  const statusLabel =
    trabalho.column_id === 'aguardando-inicio' ? 'Aguardando Início'
    : trabalho.column_id === 'levantamento-dados' ? 'Levantamento de Dados'
    : trabalho.column_id === 'em-elaboracao' ? 'Em Elaboração'
    : trabalho.column_id === 'em-revisao' ? 'Em Revisão'
    : trabalho.column_id === 'entregue' ? 'Entregue'
    : trabalho.column_id === 'finalizado' ? 'Finalizado'
    : trabalho.status || 'Em Andamento';

  const criadoEm = trabalho.created_at
    ? new Date(trabalho.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-10 py-12">
      {/* Header & Back Navigation */}
      <header className="mb-10">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-serif text-3xl font-semibold text-on-surface tracking-tight">
                {trabalho.tipo}
              </h1>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface text-xs font-bold rounded-md">
                ID: #{trabalho.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            {trabalho.titulo && (
              <p className="font-sans text-lg text-on-surface-variant mb-4">{trabalho.titulo}</p>
            )}

            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1.5 bg-primary-container text-primary-fixed border border-primary/20 rounded-md text-xs font-semibold flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> {statusLabel.toUpperCase()}
              </span>
              {trabalho.critico && (
                <span className="px-3 py-1.5 bg-error-container text-on-error-container border border-error/20 rounded-md text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> PRIORIDADE ALTA
                </span>
              )}
              {criadoEm && (
                <span className="px-3 py-1.5 border border-outline-variant rounded-md text-xs font-semibold flex items-center gap-2 text-on-surface-variant">
                  Criado em {criadoEm}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:items-center">
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 bg-surface text-on-surface border border-outline-variant font-sans text-sm font-semibold rounded-lg hover:bg-surface-container-low transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <PenTool className="w-4 h-4" /> Editar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left/Main Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Key Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-surface border border-outline-variant rounded-xl shadow-sm flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary" /> Cliente
              </span>
              <span className="font-serif text-xl font-medium text-on-surface">{trabalho.cliente_nome}</span>
              {(trabalho.curso || trabalho.instituicao) && (
                <span className="text-sm text-on-surface-variant">
                  {trabalho.curso || ''}{trabalho.curso && trabalho.instituicao ? ' — ' : ''}{trabalho.instituicao || ''}
                </span>
              )}
            </div>

            <div className="p-5 bg-surface border border-outline-variant rounded-xl shadow-sm flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-primary" /> Orientador(a)
              </span>
              {trabalho.orientador_nome ? (
                <span className="font-serif text-xl font-medium text-on-surface">{trabalho.orientador_nome}</span>
              ) : (
                <span className="text-sm text-on-surface-variant italic">Não informado</span>
              )}
            </div>

            <div className="p-5 bg-surface border border-outline-variant rounded-xl shadow-sm flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Clock className={`w-4 h-4 ${prazoEhPassado ? 'text-error' : 'text-primary'}`} /> Prazo de Entrega
              </span>
              <span className="font-serif text-xl font-medium text-on-surface">{prazoFormatado}</span>
              {prazoEhPassado && (
                <span className="text-sm font-medium text-error">Prazo encerrado</span>
              )}
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-surface border border-outline-variant rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="font-serif text-xl font-semibold text-on-surface mb-2">Progresso Geral</h2>
                <p className="text-sm text-on-surface-variant font-medium">
                  {stages.length === 0
                    ? 'Nenhuma etapa cadastrada ainda.'
                    : `${completedCount} de ${stages.length} etapas concluídas.`}
                </p>
              </div>
              <span className="font-serif text-3xl font-bold text-primary">{progressoCalculado}%</span>
            </div>

            <div className="w-full bg-surface-container-high h-2.5 rounded-full mb-8 overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${progressoCalculado}%` }} />
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Etapas do Trabalho</h3>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg font-sans text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Nova Etapa
              </button>
            </div>

            {stages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant border-2 border-dashed border-outline-variant rounded-xl gap-3">
                <CheckCircle2 className="w-8 h-8 opacity-40" />
                <p className="text-sm font-medium">Nenhuma etapa adicionada ainda.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-primary text-sm font-semibold hover:underline"
                >
                  Adicionar primeira etapa
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    draggable
                    onDragStart={e => handleDragStart(e, index)}
                    onDragOver={e => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex gap-4 items-start p-4 rounded-lg cursor-grab active:cursor-grabbing transition-colors hover:bg-surface-container-low/50 ${
                      stage.status === 'Concluído'
                        ? 'bg-surface-container-low border border-outline-variant/50'
                        : stage.status === 'Em Andamento'
                        ? 'bg-primary/5 border border-primary/20 relative overflow-hidden'
                        : ''
                    }`}
                  >
                    {stage.status === 'Em Andamento' && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    )}
                    <div className="mt-0.5" onClick={() => toggleStageStatus(stage.id, stage.plannedDate)}>
                      {stage.status === 'Concluído' ? (
                        <CheckCircle2 className={`w-5 h-5 cursor-pointer hover:opacity-80 ${stage.onTime === false ? 'text-red-500' : 'text-emerald-500'}`} />
                      ) : stage.status === 'Em Andamento' ? (
                        <Clock className="w-5 h-5 text-primary animate-pulse cursor-pointer hover:opacity-80" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-outline-variant cursor-pointer hover:border-primary" />
                      )}
                    </div>
                    <div className={`flex-1 ${stage.status === 'Pendente' ? 'opacity-60' : ''}`}>
                      <div className="flex justify-between items-center">
                        <span className={`font-semibold flex items-center gap-2 ${stage.status === 'Em Andamento' ? 'text-primary' : 'text-on-surface'}`}>
                          <GripVertical className="w-4 h-4 text-on-surface-variant/50 cursor-grab" />
                          {index + 1}. {stage.title}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                          stage.status === 'Concluído'
                            ? 'text-emerald-600 bg-emerald-100 border border-emerald-200'
                            : stage.status === 'Em Andamento'
                            ? 'text-primary-fixed bg-primary-container'
                            : 'text-on-surface-variant bg-surface-container font-semibold'
                        }`}>
                          {stage.status}
                        </span>
                      </div>
                      {stage.description && (
                        <p className="text-sm text-on-surface-variant mt-1 ml-6">{stage.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6">

          {/* Finance */}
          <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
            <h3 className="font-sans text-sm font-bold text-on-surface flex items-center gap-2 mb-4 w-full">
              Financeiro
            </h3>

            {receitasTrabalho.length > 0 && (() => {
              const totalReceita = receitasTrabalho.reduce((sum, r) => sum + r.value, 0);
              const totalPago = receitasTrabalho.filter(r => r.status?.startsWith('Pago')).reduce((sum, r) => sum + r.value, 0);
              const percentRecebido = totalReceita > 0 ? Math.round((totalPago / totalReceita) * 100) : 0;
              const saldoAReceber = Math.max(0, totalReceita - totalPago);
              
              return (
                <div className="w-full mb-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col gap-3.5">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Receita Total</span>
                      <span className="font-serif text-lg font-bold text-on-surface">
                        {formatCurrency(totalReceita)}
                      </span>
                    </div>
                    <div className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 rounded font-bold">
                      {receitasTrabalho.filter(r => r.status?.startsWith('Pago')).length} / {receitasTrabalho.length} Parc.
                    </div>
                  </div>

                  {/* Recebido */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant">
                      <span>Recebido</span>
                      <span>{percentRecebido}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentRecebido}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/60">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-secondary uppercase tracking-wider">Valor Recebido</span>
                      <span className="text-xs font-bold text-emerald-600">
                        {formatCurrency(totalPago)}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] font-bold text-secondary uppercase tracking-wider">Saldo a Receber</span>
                      <span className="text-xs font-bold text-primary">
                        {formatCurrency(saldoAReceber)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <button
              onClick={handleOpenFinanceModal}
              className="w-full py-2.5 border border-primary text-primary font-sans text-sm font-semibold rounded-lg hover:bg-primary/5 transition-colors"
            >
              {receitasTrabalho.length > 0 ? 'Editar Financeiro' : 'Adicionar Financeiro'}
            </button>
          </div>

          {/* Files */}
          <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="font-sans text-sm font-bold text-on-surface flex items-center gap-2 mb-6">
              <FileStack className="w-4 h-4 text-primary" /> Arquivos do Projeto
            </h3>

            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant gap-2 border-2 border-dashed border-outline-variant rounded-xl">
                <FileText className="w-7 h-7 opacity-40" />
                <p className="text-xs font-medium">Nenhum arquivo anexado.</p>
              </div>
            ) : (
              <ul className="flex flex-col w-full gap-3 mb-4">
                {files.map(file => (
                  <li
                    key={file.id}
                    onClick={() => handleDownload(file)}
                    className="p-3 border border-outline-variant rounded-lg hover:border-primary/50 transition-colors flex justify-between items-center cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${file.type === 'xlsx' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{file.name}</p>
                        <p className="text-xs text-on-surface-variant">{file.date}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            <button
              onClick={handleAddFileClick}
              className="mt-4 text-xs font-bold text-primary tracking-wider uppercase hover:underline inline-flex justify-center"
            >
              Adicionar Arquivo
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Nova Etapa */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Etapa">
        <form onSubmit={handleSaveStage} className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface">Título da etapa</label>
            <input
              type="text"
              name="title"
              placeholder="Ex: Revisão Bibliográfica"
              required
              className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface">
              Descrição <span className="text-on-surface-variant font-normal">(Opcional)</span>
            </label>
            <textarea
              name="description"
              placeholder="Descreva os detalhes da etapa"
              rows={3}
              className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface">Data planejada</label>
            <input
              type="date"
              name="date"
              className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 bg-surface text-on-surface border border-outline-variant font-sans text-sm font-semibold rounded-lg hover:bg-surface-container-low transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary text-white font-sans text-sm font-semibold rounded-lg hover:bg-primary/90 transition-opacity shadow-sm"
            >
              Salvar Etapa
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Financeiro */}
      <Modal isOpen={isFinanceModalOpen} onClose={() => setIsFinanceModalOpen(false)} title={financeiroData ? "Editar Financeiro" : "Adicionar Financeiro"}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!user?.id || !trabalho?.id) return;

            const parseCurr = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;

            try {
              const supabase = createClient();

              // Deletar registros financeiros antigos do mesmo trabalho para evitar duplicidade
              if (financeiroData?.id) {
                await supabase
                  .from('financeiro')
                  .delete()
                  .eq('trabalho_id', trabalho.id);

                await supabase
                  .from('receitas')
                  .delete()
                  .eq('trabalho_id', trabalho.id);
              }

              // 1. Inserir registro principal
              const { data: fin, error: finErr } = await supabase
                .from('financeiro')
                .insert({
                  user_id: user.id,
                  trabalho_id: trabalho.id,
                  payment_condition: paymentCondition,
                  total_value: parseCurr(totalValue),
                  down_payment: parseCurr(downPayment),
                  first_due_date: firstDueDate || null,
                  interval_days: intervalDays,
                  installment_count: paymentCondition === 'A prazo' ? installmentCount : 1,
                })
                .select('id')
                .single();

              if (finErr || !fin) {
                console.error('Erro ao salvar financeiro:', finErr);
                return;
              }

              // 2. Inserir parcelas (quando parcelado) + receitas no módulo financeiro
              const totalNum = parseCurr(totalValue);
              const downNum = parseCurr(downPayment);

              if (paymentCondition === 'A prazo' && installmentCount > 0) {
                const remaining = totalNum - downNum;
                const defaultPerInstall = remaining / installmentCount;

                const parcelas = Array.from({ length: installmentCount }, (_, i) => {
                  const valor = installmentValues[i]
                    ? parseCurr(installmentValues[i])
                    : defaultPerInstall;

                  let dueDate: string | null = null;
                  if (firstDueDate) {
                    const base = new Date(firstDueDate);
                    base.setDate(base.getDate() + i * intervalDays);
                    dueDate = base.toISOString().split('T')[0];
                  }

                  return {
                    financeiro_id: fin.id,
                    numero: i + 1,
                    valor,
                    due_date: dueDate,
                    status: 'Pendente',
                  };
                });

                const { error: parcelasErr } = await supabase
                  .from('financeiro_parcelas')
                  .insert(parcelas);

                if (parcelasErr) {
                  console.error('Erro ao salvar parcelas:', parcelasErr);
                }

                // 3. Inserir receitas no módulo financeiro (uma por parcela)
                const receitasParcelas = parcelas.map((p, i) => ({
                  user_id: user.id,
                  trabalho_id: trabalho!.id,
                  date: p.due_date ? new Date(p.due_date).toISOString() : new Date().toISOString(),
                  client: trabalho!.cliente_nome,
                  origin: `${trabalho!.tipo}${trabalho!.titulo ? ' - ' + trabalho!.titulo : ''}`,
                  total_value: totalNum,
                  current_installment: i + 1,
                  total_installments: installmentCount,
                  value: p.valor,
                  status: 'Aguardando',
                }));

                const { error: recErr } = await supabase
                  .from('receitas')
                  .insert(receitasParcelas);

                if (recErr) {
                  console.error('Erro ao criar receitas no módulo financeiro:', recErr);
                }

              } else {
                // À vista: inserir uma única receita
                const { error: recErr } = await supabase
                  .from('receitas')
                  .insert({
                    user_id: user.id,
                    trabalho_id: trabalho!.id,
                    date: firstDueDate ? new Date(firstDueDate).toISOString() : new Date().toISOString(),
                    client: trabalho!.cliente_nome,
                    origin: `${trabalho!.tipo}${trabalho!.titulo ? ' - ' + trabalho!.titulo : ''}`,
                    total_value: totalNum,
                    current_installment: 1,
                    total_installments: 1,
                    value: totalNum,
                    status: 'Aguardando',
                  });

                if (recErr) {
                  console.error('Erro ao criar receita no módulo financeiro:', recErr);
                }
              }
            } catch (err) {
              console.error('Erro ao salvar financeiro:', err);
            }

            // Recarregar os dados na tela
            await fetchFinanceiro(trabalho.id);
            setIsFinanceModalOpen(false);
          }}
          className="p-6 flex flex-col gap-5"
        >
          <FinancePaymentFields
            paymentCondition={paymentCondition}
            setPaymentCondition={setPaymentCondition}
            totalValue={totalValue}
            setTotalValue={setTotalValue}
            downPayment={downPayment}
            setDownPayment={setDownPayment}
            installmentValues={installmentValues}
            setInstallmentValues={setInstallmentValues}
            installmentCount={installmentCount}
            setInstallmentCount={setInstallmentCount}
            intervalDays={intervalDays}
            setIntervalDays={setIntervalDays}
            firstDueDate={firstDueDate}
            setFirstDueDate={setFirstDueDate}
          />
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFinanceModalOpen(false)}
              className="px-5 py-2.5 bg-surface text-on-surface border border-outline-variant font-sans text-sm font-semibold rounded-lg hover:bg-surface-container-low transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary text-white font-sans text-sm font-semibold rounded-lg hover:bg-primary/90 transition-opacity shadow-sm"
            >
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
