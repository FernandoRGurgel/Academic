'use client';

import { useState, useEffect, Suspense } from 'react';
import {
  Plus, DollarSign, TrendingUp, TrendingDown,
  Pencil, Trash2, Loader2
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { FinancePaymentFields } from '@/components/FinancePaymentFields';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Receita {
  id: string;
  date: string;
  client: string;
  origin: string;
  total_value: number;
  current_installment: number;
  total_installments: number;
  value: number;
  status: string;
  trabalho_id?: string;
}

interface ReceitaUI extends Receita {
  ui_status?: 'Aguardando' | 'Pago';
  ui_payment_date?: string;
}

interface Despesa {
  id: string;
  date: string;
  description: string;
  value: number;
  status: string;
  category?: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(isoDate: string) {
  try {
    if (!isoDate) return '';
    if (isoDate.includes('-') && !isoDate.includes('T')) {
      const [year, month, day] = isoDate.split('-');
      return `${day}/${month}/${year}`;
    }
    const d = new Date(isoDate);
    if (isoDate.includes('T')) {
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    return isoDate;
  } catch {
    return isoDate;
  }
}

function parseStatus(status: string) {
  if (!status) return { display: 'Aguardando', type: 'Aguardando', date: '' };
  
  if (status.includes('|')) {
    const [type, date] = status.split('|');
    return {
      display: type,
      type, // 'Pago no prazo' ou 'Pago em atraso'
      date
    };
  }
  
  return { display: status, type: status, date: '' };
}

function renderStatusBadge(status: string) {
  const parsed = parseStatus(status);
  
  if (parsed.type === 'Pago no prazo') {
    return (
      <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
        Pago no prazo ({formatDate(parsed.date)})
      </span>
    );
  }
  
  if (parsed.type === 'Pago em atraso') {
    return (
      <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-error-container text-error">
        Pago em atraso ({formatDate(parsed.date)})
      </span>
    );
  }
  
  if (parsed.type === 'Pago') {
    return (
      <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
        Pago
      </span>
    );
  }
  
  if (parsed.type === 'Aguardando') {
    return (
      <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-surface-container-highest text-on-surface-variant">
        Aguardando
      </span>
    );
  }
  
  return (
    <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-error-container text-error">
      {parsed.type}
    </span>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
function FinanceiroContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'receitas' | 'despesas'>('receitas');
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Estados do modal de nova transação manual
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentCondition, setPaymentCondition] = useState('À vista');
  const [totalValue, setTotalValue] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [installmentValues, setInstallmentValues] = useState<string[]>([]);
  const [installmentCount, setInstallmentCount] = useState(2);
  const [intervalDays, setIntervalDays] = useState(30);
  const [firstDueDate, setFirstDueDate] = useState('');
  const [novaTransacaoTipo, setNovaTransacaoTipo] = useState<'receita' | 'despesa'>('receita');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');

  // Estados adicionais para edição
  const [editingItem, setEditingItem] = useState<Receita | Despesa | null>(null);
  const [editingType, setEditingType] = useState<'receita' | 'despesa' | null>(null);
  const [statusTransacao, setStatusTransacao] = useState('Aguardando');
  const [paymentDate, setPaymentDate] = useState('');
  const [editingInstallments, setEditingInstallments] = useState<ReceitaUI[]>([]);

  const handleStartEdit = (item: any, type: 'receita' | 'despesa') => {
    setEditingItem(item);
    setEditingType(type);
    setNovaTransacaoTipo(type);
    setNovaDescricao(type === 'receita' ? item.client : item.description);
    setNovaCategoria(type === 'receita' ? (item.origin || '') : (item.category || ''));
    
    const parsed = parseStatus(item.status);
    setStatusTransacao(parsed.type === 'Pago no prazo' || parsed.type === 'Pago em atraso' ? 'Pago' : parsed.type);
    setPaymentDate(parsed.date || new Date().toISOString().split('T')[0]);

    if (type === 'receita' && item.total_installments > 1) {
      // Carregar todas as parcelas pertencentes ao mesmo lançamento
      let siblings: ReceitaUI[] = [];
      if (item.trabalho_id) {
        siblings = receitas.filter(r => r.trabalho_id === item.trabalho_id);
      } else {
        siblings = receitas.filter(r => 
          r.client === item.client && 
          r.origin === item.origin && 
          r.total_value === item.total_value && 
          r.total_installments === item.total_installments
        );
      }
      siblings.sort((a, b) => a.current_installment - b.current_installment);

      // Mapear com campos temporários da UI
      const mapped = siblings.map(sib => {
        const p = parseStatus(sib.status);
        return {
          ...sib,
          ui_status: (p.type === 'Pago no prazo' || p.type === 'Pago em atraso' ? 'Pago' : p.type) as 'Aguardando' | 'Pago',
          ui_payment_date: p.date || new Date().toISOString().split('T')[0]
        };
      });
      
      setEditingInstallments(mapped);
      setTotalValue(item.total_value.toString());
      setFirstDueDate('');
    } else {
      setEditingInstallments([]);
      setTotalValue(item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setFirstDueDate(item.date ? item.date.split('T')[0] : '');
    }
    
    setIsModalOpen(true);
  };

  const handleUpdateInstallmentField = (index: number, field: keyof ReceitaUI, val: any) => {
    setEditingInstallments(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setEditingType(null);
    setEditingInstallments([]);
    setTotalValue('');
    setDownPayment('');
    setInstallmentValues([]);
    setInstallmentCount(2);
    setIntervalDays(30);
    setFirstDueDate('');
    setPaymentDate('');
    setNovaDescricao('');
    setNovaCategoria('');
    setPaymentCondition('À vista');
    setStatusTransacao('Aguardando');
  };

  // ─── Carregar dados do Supabase ──────────────────────────────────────────────
  const fetchData = async () => {
    if (!user?.id) return;
    setLoadingData(true);
    try {
      const supabase = createClient();

      const { data: dbReceitas } = await supabase
        .from('receitas')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (dbReceitas) setReceitas(dbReceitas);

      const { data: dbDespesas } = await supabase
        .from('despesas')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (dbDespesas) setDespesas(dbDespesas);
    } catch (e) {
      console.error('Erro ao carregar dados financeiros:', e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'receitas' || tab === 'despesas') setActiveTab(tab);
  }, [searchParams]);

  // ─── Deletar receita ─────────────────────────────────────────────────────────
  const handleDeleteReceita = async (id: string) => {
    try {
      const supabase = createClient();
      await supabase.from('receitas').delete().eq('id', id);
      setReceitas(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error('Erro ao excluir receita:', e);
    }
  };

  // ─── Deletar despesa ─────────────────────────────────────────────────────────
  const handleDeleteDespesa = async (id: string) => {
    try {
      const supabase = createClient();
      await supabase.from('despesas').delete().eq('id', id);
      setDespesas(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      console.error('Erro ao excluir despesa:', e);
    }
  };

  // ─── Salvar nova transação manual ────────────────────────────────────────────
  const handleSaveTransacao = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id) return;

    const parseCurr = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;
    const totalNum = parseCurr(totalValue);

    try {
      const supabase = createClient();

      if (editingItem) {
        // Modo Edição
        if (editingType === 'receita' && editingInstallments.length > 0) {
          // Salvar todas as parcelas atualizadas
          for (const inst of editingInstallments) {
            let dbStatus = inst.ui_status;
            if (inst.ui_status === 'Pago') {
              const dueDateStr = inst.date ? inst.date.split('T')[0] : '';
              const payDateStr = inst.ui_payment_date || '';
              if (payDateStr && dueDateStr && payDateStr <= dueDateStr) {
                dbStatus = `Pago no prazo|${payDateStr}`;
              } else {
                dbStatus = `Pago em atraso|${payDateStr}`;
              }
            }

            await supabase
              .from('receitas')
              .update({
                client: novaDescricao || 'Manual',
                origin: novaCategoria || 'Transação manual',
                value: inst.value,
                date: inst.date ? new Date(inst.date).toISOString() : new Date().toISOString(),
                status: dbStatus,
              })
              .eq('id', inst.id);
          }
        } else {
          // Transação simples (receita única ou despesa)
          let dbStatus = statusTransacao;
          if (statusTransacao === 'Pago') {
            if (paymentDate && firstDueDate && paymentDate <= firstDueDate) {
              dbStatus = `Pago no prazo|${paymentDate}`;
            } else {
              dbStatus = `Pago em atraso|${paymentDate}`;
            }
          }

          if (editingType === 'receita') {
            await supabase
              .from('receitas')
              .update({
                client: novaDescricao || 'Manual',
                origin: novaCategoria || 'Transação manual',
                value: totalNum,
                date: firstDueDate ? new Date(firstDueDate).toISOString() : new Date().toISOString(),
                status: dbStatus,
              })
              .eq('id', editingItem.id);
          } else {
            await supabase
              .from('despesas')
              .update({
                description: novaDescricao || 'Despesa',
                category: novaCategoria || null,
                value: totalNum,
                date: firstDueDate ? new Date(firstDueDate).toISOString() : new Date().toISOString(),
                status: dbStatus,
              })
              .eq('id', editingItem.id);
          }
        }
      } else {
        // Modo Criação
        if (novaTransacaoTipo === 'receita') {
          if (paymentCondition === 'A prazo' && installmentCount > 0) {
            const downNum = parseCurr(downPayment);
            const remaining = totalNum - downNum;
            const defaultPerInstall = remaining / installmentCount;

            const rows = Array.from({ length: installmentCount }, (_, i) => {
              const valor = installmentValues[i] ? parseCurr(installmentValues[i]) : defaultPerInstall;
              let dueDate = firstDueDate;
              if (firstDueDate) {
                const base = new Date(firstDueDate);
                base.setDate(base.getDate() + i * intervalDays);
                dueDate = base.toISOString().split('T')[0];
              }
              return {
                user_id: user.id,
                date: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
                client: novaDescricao || 'Manual',
                origin: novaCategoria || 'Transação manual',
                total_value: totalNum,
                current_installment: i + 1,
                total_installments: installmentCount,
                value: valor,
                status: 'Aguardando',
              };
            });
            await supabase.from('receitas').insert(rows);
          } else {
            await supabase.from('receitas').insert({
              user_id: user.id,
              date: firstDueDate ? new Date(firstDueDate).toISOString() : new Date().toISOString(),
              client: novaDescricao || 'Manual',
              origin: novaCategoria || 'Transação manual',
              total_value: totalNum,
              current_installment: 1,
              total_installments: 1,
              value: totalNum,
              status: 'Aguardando',
            });
          }
        } else {
          // Despesa
          await supabase.from('despesas').insert({
            user_id: user.id,
            date: firstDueDate ? new Date(firstDueDate).toISOString() : new Date().toISOString(),
            description: novaDescricao || 'Despesa',
            value: totalNum,
            status: 'Aguardando',
            category: novaCategoria || null,
          });
        }
      }

      // Recarregar dados
      await fetchData();
    } catch (err) {
      console.error('Erro ao salvar transação:', err);
    }

    handleCloseModal();
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (authLoading || loadingData) {
    return (
      <div className="flex h-[80vh] items-center justify-center font-sans text-on-surface-variant gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span>Carregando financeiro...</span>
      </div>
    );
  }

  // ─── Totais ───────────────────────────────────────────────────────────────────
  const totalReceitas = receitas.reduce((sum, r) => sum + r.value, 0);
  const totalDespesas = despesas.reduce((sum, d) => sum + d.value, 0);
  const saldoEstimado = totalReceitas - totalDespesas;

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-10 py-12 flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-primary tracking-tight mb-1">Controle Financeiro</h1>
          <p className="font-sans text-on-surface-variant">Acompanhe recebimentos, pagamentos e conciliações do sistema.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-sans text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-5 h-5" /> Nova Transação
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="font-semibold text-sm">Total de Receitas</span>
            <div className="p-2 bg-emerald-100 rounded text-emerald-700"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <span className="font-serif text-3xl font-bold text-on-surface">{formatCurrency(totalReceitas)}</span>
        </div>
        <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="font-semibold text-sm">Total de Despesas</span>
            <div className="p-2 bg-error-container text-on-error-container rounded"><TrendingDown className="w-5 h-5" /></div>
          </div>
          <span className="font-serif text-3xl font-bold text-on-surface">{formatCurrency(totalDespesas)}</span>
        </div>
        <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="font-semibold text-sm">Saldo Estimado</span>
            <div className="p-2 bg-primary/10 rounded text-primary"><DollarSign className="w-5 h-5" /></div>
          </div>
          <span className={`font-serif text-3xl font-bold ${saldoEstimado >= 0 ? 'text-primary' : 'text-error'}`}>
            {formatCurrency(saldoEstimado)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-outline-variant pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('receitas')}
          className={`flex items-center gap-2 px-6 py-3 font-sans text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'receitas' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface hover:border-outline-variant'}`}
        >
          <TrendingUp className="w-4 h-4" /> Receitas
        </button>
        <button
          onClick={() => setActiveTab('despesas')}
          className={`flex items-center gap-2 px-6 py-3 font-sans text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'despesas' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface hover:border-outline-variant'}`}
        >
          <TrendingDown className="w-4 h-4" /> Despesas
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4 font-sans text-xs font-semibold text-secondary uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-4 font-sans text-xs font-semibold text-secondary uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 font-sans text-xs font-semibold text-secondary uppercase tracking-wider text-right">Valor</th>
                <th className="px-6 py-4 font-sans text-xs font-semibold text-secondary uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 font-sans text-xs font-semibold text-secondary uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {/* Receitas */}
              {activeTab === 'receitas' && receitas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-on-surface-variant text-sm">
                    Nenhuma receita registrada. Adicione um financeiro em um trabalho para gerar receitas automaticamente.
                  </td>
                </tr>
              )}
              {activeTab === 'receitas' && receitas.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-sm text-secondary">{formatDate(item.date)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{item.client}</span>
                      <span className="text-xs text-secondary mt-0.5">
                        {item.origin}
                        {item.total_installments > 1 && ` (Parc. ${item.current_installment}/${item.total_installments})`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-serif font-semibold text-emerald-600">
                    {formatCurrency(item.value)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {renderStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleStartEdit(item, 'receita')}
                        className="p-2 hover:bg-surface-container-high hover:text-primary rounded-md transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReceita(item.id)}
                        className="p-2 hover:bg-error-container hover:text-error rounded-md transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Despesas */}
              {activeTab === 'despesas' && despesas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-on-surface-variant text-sm">
                    Nenhuma despesa registrada ainda.
                  </td>
                </tr>
              )}
              {activeTab === 'despesas' && despesas.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-sm text-secondary">{formatDate(item.date)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">{item.description}</span>
                      <span className="text-xs text-secondary mt-0.5">{item.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-serif font-semibold text-error">
                    {formatCurrency(item.value)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {renderStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleStartEdit(item, 'despesa')}
                        className="p-2 hover:bg-surface-container-high hover:text-primary rounded-md transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDespesa(item.id)}
                        className="p-2 hover:bg-error-container hover:text-error rounded-md transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova/Editar Transação */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Editar Transação' : 'Nova Transação'}>
        <form onSubmit={handleSaveTransacao} className="p-6 flex flex-col gap-5">
          {/* Tipo */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface">Tipo</label>
            <select
              value={novaTransacaoTipo}
              onChange={e => setNovaTransacaoTipo(e.target.value as 'receita' | 'despesa')}
              disabled={!!editingItem}
              className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-60"
            >
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface">
              {novaTransacaoTipo === 'receita' ? 'Cliente' : 'Descrição'}
            </label>
            <input
              type="text"
              required
              value={novaDescricao}
              onChange={e => setNovaDescricao(e.target.value)}
              placeholder={novaTransacaoTipo === 'receita' ? 'Nome do cliente' : 'Ex: Assinatura de software'}
              className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Categoria / Origem */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface">
              {novaTransacaoTipo === 'receita' ? 'Origem' : 'Categoria'}
              <span className="text-on-surface-variant font-normal ml-1">(Opcional)</span>
            </label>
            <input
              type="text"
              value={novaCategoria}
              onChange={e => setNovaCategoria(e.target.value)}
              placeholder={novaTransacaoTipo === 'receita' ? 'Ex: Doutorado em Educação' : 'Ex: Software, Equipamento'}
              className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Caso 1: Criação de Receita (com campos complexos de parcelamento) */}
          {novaTransacaoTipo === 'receita' && !editingItem && (
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
          )}

          {/* Caso 2: Edição de Lançamento Parcelado (exibe lista de parcelas) */}
          {editingItem && editingInstallments.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-outline-variant pt-4 mt-2">
              <span className="text-sm font-bold text-primary">Parcelas do Lançamento</span>
              <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
                {editingInstallments.map((inst, index) => (
                  <div key={inst.id} className="flex flex-col gap-2 p-3 bg-surface-container-low rounded-lg border border-outline-variant">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-on-surface-variant">
                        Parcela {inst.current_installment} de {inst.total_installments}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Valor da Parcela */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-secondary">Valor</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant font-semibold">R$</span>
                          <input
                            type="text"
                            required
                            className="w-full p-2 pl-7 text-xs rounded border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary outline-none"
                            value={inst.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            onChange={e => {
                              const digits = e.target.value.replace(/\D/g, '');
                              const num = digits ? parseInt(digits, 10) / 100 : 0;
                              handleUpdateInstallmentField(index, 'value', num);
                            }}
                          />
                        </div>
                      </div>

                      {/* Vencimento da Parcela */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-secondary">Vencimento</label>
                        <input
                          type="date"
                          required
                          className="w-full p-2 text-xs rounded border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary outline-none"
                          value={inst.date ? inst.date.split('T')[0] : ''}
                          onChange={e => handleUpdateInstallmentField(index, 'date', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-1">
                      {/* Status da Parcela */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-secondary">Status</label>
                        <select
                          className="w-full p-2 text-xs rounded border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary outline-none"
                          value={inst.ui_status || 'Aguardando'}
                          onChange={e => handleUpdateInstallmentField(index, 'ui_status', e.target.value as 'Aguardando' | 'Pago')}
                        >
                          <option value="Aguardando">Aguardando</option>
                          <option value="Pago">Pago</option>
                        </select>
                      </div>

                      {/* Data de Pagamento da Parcela (condicional) */}
                      {inst.ui_status === 'Pago' && (
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-secondary">Data de Pagamento</label>
                          <input
                            type="date"
                            required
                            className="w-full p-2 text-xs rounded border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary outline-none"
                            value={inst.ui_payment_date || ''}
                            onChange={e => handleUpdateInstallmentField(index, 'ui_payment_date', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Caso 3: Criação de Despesa OU Edição de Transação Simples (Receita única ou Despesa) */}
          {((novaTransacaoTipo === 'despesa' && !editingItem) || (editingItem && editingInstallments.length === 0)) && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Valor <span className="text-error">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold text-sm">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="0,00"
                    value={totalValue}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, '');
                      if (!digits) { setTotalValue(''); return; }
                      const num = parseInt(digits, 10) / 100;
                      setTotalValue(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                    }}
                    className="p-3 pl-10 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Data do Vencimento</label>
                <input
                  type="date"
                  required
                  value={firstDueDate}
                  onChange={e => setFirstDueDate(e.target.value)}
                  className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
            </>
          )}

          {/* Status e Data de Pagamento para Transações Simples (Apenas no modo de edição) */}
          {editingItem && editingInstallments.length === 0 && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Status</label>
                <select
                  value={statusTransacao}
                  onChange={e => setStatusTransacao(e.target.value)}
                  className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="Aguardando">Aguardando</option>
                  <option value="Pago">Pago</option>
                </select>
              </div>

              {statusTransacao === 'Pago' && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-on-surface">Data de Pagamento</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              )}
            </>
          )}

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCloseModal}
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

export default function FinanceiroPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center font-sans text-on-surface-variant gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span>Carregando dados financeiros...</span>
      </div>
    }>
      <FinanceiroContent />
    </Suspense>
  );
}
