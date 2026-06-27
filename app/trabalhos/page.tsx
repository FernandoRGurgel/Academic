'use client';

import { useState, useEffect } from 'react';
import { MoreVertical, Plus, Calendar, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Card = {
  id: string;
  title: string;
  student: string;
  date: string;
  priority: string;
  initials: string;
};

type Column = { name: string; items: Card[] };
type Columns = Record<string, Column>;

const COLUMN_DEFS: Columns = {
  'aguardando-inicio':   { name: 'Aguardando início',    items: [] },
  'levantamento-dados':  { name: 'Levantamento de dados', items: [] },
  'em-elaboracao':       { name: 'Em elaboração',         items: [] },
  'em-revisao':          { name: 'Em revisão',            items: [] },
  'entregue':            { name: 'Entregue',              items: [] },
  'finalizado':          { name: 'Finalizado',            items: [] },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  const parts = name.trim().split(' ');
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

// ─── Página Kanban ────────────────────────────────────────────────────────────
export default function KanbanPage() {
  const { user, loading: authLoading } = useAuth();
  const [columns, setColumns] = useState<Columns>(structuredClone(COLUMN_DEFS));
  const [loadingData, setLoadingData] = useState(true);
  const [isBrowser, setIsBrowser] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Evitar hydration mismatch no DnD
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // ─── Carregar trabalhos do Supabase ────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const fetchTrabalhos = async () => {
      setLoadingData(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('trabalhos')
          .select('id, cliente_nome, tipo, titulo, data, column_id, critico, prioridade')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) { console.error('Erro ao carregar trabalhos:', error); return; }

        const newColumns: Columns = structuredClone(COLUMN_DEFS);

        (data ?? []).forEach(t => {
          const col = t.column_id || 'aguardando-inicio';
          if (!newColumns[col]) return;

          const priority = t.critico ? 'Crítica' : (t.prioridade || 'Baixa');
          const prazo = t.data ? formatDate(t.data) : '—';

          newColumns[col].items.push({
            id: t.id,
            title: `${t.tipo}${t.titulo ? ' — ' + t.titulo : ''}`,
            student: t.cliente_nome,
            date: prazo,
            priority,
            initials: getInitials(t.cliente_nome),
          });
        });

        setColumns(newColumns);
      } catch (e) {
        console.error('Erro ao buscar trabalhos:', e);
      } finally {
        setLoadingData(false);
      }
    };

    fetchTrabalhos();
  }, [user]);

  // ─── Drag & Drop ────────────────────────────────────────────────────────────
  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newColumns = { ...columns };

    if (source.droppableId !== destination.droppableId) {
      const srcItems = [...newColumns[source.droppableId].items];
      const dstItems = [...newColumns[destination.droppableId].items];
      const [moved] = srcItems.splice(source.index, 1);
      dstItems.splice(destination.index, 0, moved);
      newColumns[source.droppableId] = { ...newColumns[source.droppableId], items: srcItems };
      newColumns[destination.droppableId] = { ...newColumns[destination.droppableId], items: dstItems };

      // Persistir nova coluna no Supabase
      try {
        const supabase = createClient();
        await supabase.from('trabalhos').update({ column_id: destination.droppableId }).eq('id', moved.id);
      } catch (e) {
        console.error('Erro ao atualizar coluna do trabalho:', e);
      }
    } else {
      const items = [...newColumns[source.droppableId].items];
      const [moved] = items.splice(source.index, 1);
      items.splice(destination.index, 0, moved);
      newColumns[source.droppableId] = { ...newColumns[source.droppableId], items };
    }

    setColumns(newColumns);
  };

  // ─── Excluir trabalho ────────────────────────────────────────────────────────
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Tem certeza que deseja excluir este trabalho? Esta ação não pode ser desfeita.')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('trabalhos').delete().eq('id', cardId);
      if (error) { console.error('Erro ao excluir trabalho:', error); return; }
    } catch (e) {
      console.error('Erro ao excluir trabalho:', e);
      return;
    }

    // Remover do estado local
    const newColumns = { ...columns };
    for (const colId in newColumns) {
      newColumns[colId] = {
        ...newColumns[colId],
        items: newColumns[colId].items.filter(item => item.id !== cardId),
      };
    }
    setColumns(newColumns);
  };

  // ─── Renderização ────────────────────────────────────────────────────────────
  if (authLoading || loadingData) {
    return (
      <div className="flex h-screen items-center justify-center font-sans text-on-surface-variant gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span>Carregando quadro de produção...</span>
      </div>
    );
  }

  if (!isBrowser) return null;

  const allItems = Object.entries(columns).flatMap(([colId, col]) =>
    col.items.map(item => ({ ...item, columnId: colId, columnName: col.name }))
  );

  return (
    <main className="flex-1 w-full bg-surface-container-low min-h-screen py-12 overflow-x-hidden">
      {/* Header */}
      <section className="max-w-[1280px] w-full mx-auto px-10 mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-primary tracking-tight mb-1">Quadro de Produção</h1>
            <p className="font-sans text-on-surface-variant">Acompanhamento visual do fluxo de elaboração acadêmica.</p>
          </div>
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center bg-surface-container-high p-1 rounded-lg border border-outline-variant w-fit">
              <button
                onClick={() => setViewMode('list')}
                className={`px-6 py-2 font-sans text-sm transition-colors rounded-md ${viewMode === 'list' ? 'font-bold bg-surface-container-lowest text-primary shadow-sm border border-outline-variant' : 'font-medium text-secondary hover:text-primary'}`}
              >Lista</button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-6 py-2 font-sans text-sm transition-colors rounded-md ${viewMode === 'kanban' ? 'font-bold bg-surface-container-lowest text-primary shadow-sm border border-outline-variant' : 'font-medium text-secondary hover:text-primary'}`}
              >Kanban</button>
            </div>
            <Link
              href="/trabalhos/novo"
              className="px-5 py-2.5 bg-primary text-white font-sans text-sm font-semibold rounded-lg hover:bg-primary/90 transition-opacity shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Novo Trabalho
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-[1280px] w-full mx-auto px-10 pb-16">

        {/* ─── Kanban ─────────────────────────────────────────────────────────── */}
        {viewMode === 'kanban' && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-6 gap-4 pb-6 items-start w-full">
              {Object.entries(columns).map(([columnId, column]) => (
                <div key={columnId} className="flex flex-col min-w-0">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-sans text-[11px] lg:text-xs font-bold text-primary flex items-center gap-1.5 truncate">
                      <span className="truncate">{column.name}</span>
                      <span className="bg-surface-container-highest text-on-surface-variant px-1.5 py-0.5 rounded-full text-[10px] shrink-0">{column.items.length}</span>
                    </h3>
                  </div>

                  <Droppable droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex flex-col gap-3 min-h-[150px] p-1.5 -mx-1.5 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-surface-container-highest' : ''}`}
                      >
                        {column.items.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-surface-container-lowest border border-outline-variant p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow relative group hover:z-20 ${snapshot.isDragging ? 'shadow-lg border-primary rotate-2' : ''} ${item.priority === 'Crítica' ? 'border-l-4 border-l-error' : ''}`}
                              >
                                <Link href={`/trabalhos/${item.id}`} className="absolute inset-0 z-0" aria-label={`Ver ${item.title}`} />
                                <div className="flex justify-between items-start mb-3 relative z-30">
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider pointer-events-none ${
                                    item.priority === 'Crítica' ? 'bg-error-container text-on-error-container' :
                                    item.priority === 'Alta' ? 'bg-primary-fixed text-primary' :
                                    'bg-surface-container-high text-on-surface-variant'
                                  }`}>{item.priority}</span>
                                  <div className="relative group/menu">
                                    <button
                                      className="pointer-events-auto p-1 -m-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                                    >
                                      <MoreVertical className="w-4 h-4 text-outline hover:text-primary" />
                                    </button>
                                    <div className="absolute right-0 top-full w-36 bg-surface border border-outline-variant rounded-lg shadow-xl py-1 z-50 opacity-0 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:pointer-events-auto transition-opacity duration-300 before:absolute before:content-[''] before:-top-3 before:left-0 before:w-full before:h-3 focus-within:opacity-100 focus-within:pointer-events-auto">
                                      <Link
                                        href={`/trabalhos/${item.id}`}
                                        className="block w-full px-4 py-2 text-left text-xs font-medium text-on-surface hover:bg-surface-container-low"
                                        onClick={e => e.stopPropagation()}
                                      >
                                        Ver detalhes
                                      </Link>
                                      <button
                                        className="w-full px-4 py-2 text-left text-xs font-medium text-error hover:bg-error-container/50"
                                        onClick={e => { e.preventDefault(); e.stopPropagation(); handleDeleteCard(item.id); }}
                                      >
                                        Excluir
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <h4 className="font-sans text-sm font-bold text-primary mb-1 relative z-10 pointer-events-none line-clamp-2">{item.title}</h4>
                                <p className="text-secondary text-xs mb-4 relative z-10 pointer-events-none">{item.student}</p>
                                <div className="flex justify-between items-center pt-3 border-t border-outline-variant relative z-10 pointer-events-none">
                                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-medium">{item.date}</span>
                                  </div>
                                  <div className="w-6 h-6 rounded-full bg-primary-container text-primary flex items-center justify-center text-[10px] font-bold">
                                    {item.initials}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {column.items.length === 0 && !snapshot.isDraggingOver && (
                          <div className="border-2 border-dashed border-outline-variant rounded-xl h-24 flex items-center justify-center bg-surface-container-low/50">
                            <p className="text-outline-variant text-sm font-medium">Solte cartões aqui</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}

        {/* ─── Lista ──────────────────────────────────────────────────────────── */}
        {viewMode === 'list' && (
          <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/80 text-on-surface-variant text-sm border-b border-outline-variant">
                    <th className="p-4 font-medium">Trabalho</th>
                    <th className="p-4 font-medium">Cliente</th>
                    <th className="p-4 font-medium">Fase</th>
                    <th className="p-4 font-medium">Prazo</th>
                    <th className="p-4 font-medium">Prioridade</th>
                    <th className="p-4 font-medium w-[50px]">Ação</th>
                  </tr>
                </thead>
                <tbody className="text-base text-on-surface divide-y divide-outline-variant">
                  {allItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-on-surface-variant font-medium text-sm">
                        Nenhum trabalho cadastrado. <Link href="/trabalhos/novo" className="text-primary underline">Cadastrar agora</Link>
                      </td>
                    </tr>
                  )}
                  {allItems.map(item => (
                    <tr key={item.id} className="hover:bg-surface-container-lowest transition-colors relative group hover:z-20">
                      <td className="p-4">
                        <Link href={`/trabalhos/${item.id}`} className="absolute inset-0 z-0" />
                        <span className="font-semibold text-primary relative z-10 pointer-events-none line-clamp-1">{item.title}</span>
                      </td>
                      <td className="p-4 relative z-10 pointer-events-none">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-container text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                            {item.initials}
                          </div>
                          <span className="text-secondary text-sm">{item.student}</span>
                        </div>
                      </td>
                      <td className="p-4 relative z-10 pointer-events-none">
                        <span className="px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-md text-xs font-semibold">{item.columnName}</span>
                      </td>
                      <td className="p-4 relative z-10 pointer-events-none font-medium whitespace-nowrap">{item.date}</td>
                      <td className="p-4 relative z-10 pointer-events-none">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                          item.priority === 'Crítica' ? 'bg-error-container text-on-error-container' :
                          item.priority === 'Alta' ? 'bg-primary-fixed text-primary' :
                          'bg-surface-container-high text-on-surface-variant'
                        }`}>{item.priority}</span>
                      </td>
                      <td className="p-4 relative z-10">
                        <div className="relative group/menu">
                          <button className="p-1 hover:bg-surface-container rounded-md transition-colors" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                            <MoreVertical className="w-4 h-4 text-outline" />
                          </button>
                          <div className="absolute right-0 top-full w-36 bg-surface border border-outline-variant rounded-lg shadow-xl py-1 z-50 opacity-0 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:pointer-events-auto transition-opacity duration-300 before:absolute before:content-[''] before:-top-3 before:left-0 before:w-full before:h-3 focus-within:opacity-100 focus-within:pointer-events-auto">
                            <Link href={`/trabalhos/${item.id}`} className="block w-full px-4 py-2 text-left text-xs font-medium text-on-surface hover:bg-surface-container-low" onClick={e => e.stopPropagation()}>
                              Ver detalhes
                            </Link>
                            <button
                              className="w-full px-4 py-2 text-left text-xs font-medium text-error hover:bg-error-container/50"
                              onClick={e => { e.preventDefault(); e.stopPropagation(); handleDeleteCard(item.id); }}
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
