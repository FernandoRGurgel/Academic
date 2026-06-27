'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { DashboardTabs } from '@/components/DashboardTabs';

function WorkCard({ id, title, status, date, daysLeft, isCritical }: any) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={`p-4 border border-outline-variant rounded-lg hover:border-primary transition-colors group relative bg-surface-container-lowest ${menuOpen ? 'z-30' : ''}`}>
      <Link href={`/trabalhos/${id}`} className="absolute inset-0 z-0" aria-label={`Ver detalhes de ${title}`}></Link>
      <div className={`flex justify-between items-start mb-2 relative ${menuOpen ? 'z-40' : 'z-10'}`}>
         <h4 className="font-sans text-sm font-semibold text-primary pointer-events-none">{title}</h4>
         <div className="relative">
           <button 
             onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
             className="p-1 hover:bg-surface-container rounded-md transition-colors"
           >
             <MoreVertical className="w-4 h-4 text-outline" />
           </button>
           {menuOpen && (
             <>
               <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.preventDefault(); setMenuOpen(false); }}></div>
               <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-outline-variant rounded-lg shadow-xl py-1 z-50">
                 <button className="w-full px-4 py-2 text-left text-sm font-medium text-on-surface hover:bg-surface-container-low flex items-center gap-2">
                   <Edit2 className="w-4 h-4" /> Editar o trabalho
                 </button>
                 <button className="w-full px-4 py-2 text-left text-sm font-medium text-error hover:bg-error-container/50 flex items-center gap-2">
                   <Trash2 className="w-4 h-4" /> Excluir
                 </button>
               </div>
             </>
           )}
         </div>
      </div>
      <div className="mb-4 relative z-10 pointer-events-none">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${status === 'Em Elaboração' ? 'bg-secondary-container text-on-secondary-container border-secondary-container' : 'bg-surface-container-high text-on-surface-variant border-outline-variant'}`}>
          {status}
        </span>
      </div>
      <div className="flex items-center justify-between mt-auto relative z-10 pointer-events-none">
         <div className="flex items-center gap-1.5 text-xs font-medium text-secondary">
           <Calendar className="w-3.5 h-3.5" /> {date}
         </div>
         <div className={`flex items-center gap-1.5 text-xs font-bold ${isCritical ? 'text-error' : 'text-on-surface-variant'}`}>
           {isCritical && <Clock className="w-3.5 h-3.5" />} {daysLeft}
         </div>
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const [view, setView] = useState<'dia' | 'semana' | 'mes'>('mes');
  const [selectedDate, setSelectedDate] = useState<number>(3);

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  // Simplified calendar grid for demonstration
  const dates = Array.from({ length: 35 }, (_, i) => {
    if (i < 2) return { date: 29 + i, inactive: true, events: [] };
    if (i > 32) return { date: i - 32, inactive: true, events: [] };
    return { 
      date: i - 1, 
      inactive: false, 
      events: i === 4 
        ? [{ type: 'deadline', text: 'Pedro S. - TCC', time: '09:00' }] 
        : i === 12 
          ? [{ type: 'meeting', text: 'Dr. Paulo - Reunião', time: '14:00' }] 
          : [] 
    };
  });

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-10 py-12 flex flex-col">
       {/* Header */}
       <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-primary tracking-tight mb-1">Agenda Acadêmica</h1>
          <p className="font-sans text-on-surface-variant">Gerencie prazos, entregas e eventos do seu calendário escolar.</p>
        </div>
        <Link href="/trabalhos/novo" className="bg-primary-container text-white px-6 py-2.5 rounded-lg font-sans text-sm font-medium flex items-center gap-2 hover:opacity-90 shadow-sm transition-all">
          <Plus className="w-5 h-5 cursor-pointer" />
          Novo Trabalho
        </Link>
      </div>

       {/* Sub navigation */}
       <DashboardTabs activeTab="agenda" />

       <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-1">
          {/* Calendar View Left */}
          <div className="xl:col-span-8 flex flex-col bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
             {/* Calendar Header */}
             <div className="p-6 border-b border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <h2 className="font-serif text-xl font-semibold text-primary">Outubro 2026</h2>
                   <div className="flex gap-1 ml-4">
                     <button className="p-1.5 hover:bg-surface-container rounded-md transition-colors text-secondary"><ChevronLeft className="w-5 h-5" /></button>
                     <button className="p-1.5 hover:bg-surface-container rounded-md transition-colors text-secondary"><ChevronRight className="w-5 h-5" /></button>
                   </div>
                </div>
                <div className="bg-surface-container-low p-1 rounded-lg border border-outline-variant flex items-center">
                   <button 
                     onClick={() => setView('dia')}
                     className={`px-4 py-1.5 text-xs font-semibold rounded transition-all ${view === 'dia' ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant font-bold' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
                   >
                     Dia
                   </button>
                   <button 
                     onClick={() => setView('semana')}
                     className={`px-4 py-1.5 text-xs font-semibold rounded transition-all ${view === 'semana' ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant font-bold' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
                   >
                     Semana
                   </button>
                   <button 
                     onClick={() => setView('mes')}
                     className={`px-4 py-1.5 text-xs font-semibold rounded transition-all ${view === 'mes' ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant font-bold' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
                   >
                     Mês
                   </button>
                </div>
             </div>
             
             {/* Renderização Condicional do Calendário */}
             {view === 'mes' && (
               <>
                 {/* Grid Cabeçalho */}
                 <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low/50">
                   {days.map(day => (
                     <div key={day} className="py-3 text-center text-[11px] font-bold text-secondary uppercase tracking-wider">{day}</div>
                   ))}
                 </div>
                 {/* Grid Dias */}
                 <div className="grid grid-cols-7 flex-1">
                   {dates.map((d, i) => {
                     const isSelected = d.date === selectedDate && !d.inactive;
                     return (
                       <div 
                         key={i} 
                         onClick={() => !d.inactive && setSelectedDate(d.date)}
                         className={`min-h-[120px] p-2 border-r border-b border-outline-variant/60 hover:bg-surface-container-low transition-colors group cursor-pointer ${
                           d.inactive ? 'bg-surface-container-low/30' : 
                           isSelected ? 'bg-primary-container/10' : ''
                         }`}
                       >
                          <span className={`text-sm font-medium flex items-center justify-center w-6 h-6 rounded-full ${
                            d.inactive ? 'text-outline-variant' : 
                            isSelected ? 'bg-primary text-white font-bold' : 
                            d.date === 4 ? 'text-primary font-bold border border-primary/30' : 'text-on-surface'
                          }`}>
                            {String(d.date).padStart(2, '0')}
                          </span>
                          <div className="mt-2 flex flex-col gap-1">
                            {d.events.map((e, idx) => (
                              <div key={idx} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate ${e.type === 'deadline' ? 'bg-error-container text-on-error-container border border-error/20' : 'bg-primary-fixed text-primary border border-primary-fixed-dim/50'}`}>
                                {e.text}
                              </div>
                            ))}
                          </div>
                       </div>
                     );
                   })}
                 </div>
               </>
             )}

             {view === 'semana' && (
               (() => {
                 const selectedIndex = dates.findIndex(d => d.date === selectedDate && !d.inactive);
                 const weekStartIndex = selectedIndex !== -1 ? Math.floor(selectedIndex / 7) * 7 : 0;
                 const weekDays = dates.slice(weekStartIndex, weekStartIndex + 7);
                 return (
                   <div className="grid grid-cols-7 flex-1 border-t border-outline-variant/60 h-full">
                     {weekDays.map((d, i) => {
                       const isSelected = d.date === selectedDate && !d.inactive;
                       return (
                         <div 
                           key={i} 
                           onClick={() => !d.inactive && setSelectedDate(d.date)}
                           className={`min-h-[350px] p-4 border-r border-b border-outline-variant/60 hover:bg-surface-container-low transition-colors flex flex-col cursor-pointer ${
                             d.inactive ? 'bg-surface-container-low/30' : 
                             isSelected ? 'bg-primary-container/10' : ''
                           }`}
                         >
                           <div className="flex flex-col items-center mb-4">
                             <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">{days[i]}</span>
                             <span className={`text-sm font-semibold flex items-center justify-center w-7 h-7 rounded-full ${
                               d.inactive ? 'text-outline-variant' : 
                               isSelected ? 'bg-primary text-white font-bold' : 
                               d.date === 4 ? 'text-primary font-bold border border-primary' : 'text-on-surface'
                             }`}>
                               {String(d.date).padStart(2, '0')}
                             </span>
                           </div>
                           
                           <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                             {d.events.map((e, idx) => (
                               <div 
                                 key={idx} 
                                 className={`text-xs font-semibold p-2.5 rounded-lg border shadow-sm flex flex-col gap-1 ${
                                   e.type === 'deadline' 
                                     ? 'bg-error-container text-on-error-container border-error/20' 
                                     : 'bg-primary-fixed text-primary border-primary-fixed-dim/50'
                                 }`}
                               >
                                 <span className="font-sans text-[10px] text-outline flex items-center gap-1 font-normal">
                                   <Clock className="w-3 h-3" /> {e.time || 'Sem hora'}
                                 </span>
                                 <span className="truncate">{e.text}</span>
                               </div>
                             ))}
                             {d.events.length === 0 && (
                               <div className="text-[11px] text-outline-variant/50 text-center my-auto pointer-events-none select-none">
                                 Sem eventos
                               </div>
                             )}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 );
               })()
             )}

             {view === 'dia' && (
               (() => {
                 const selectedDayObj = dates.find(d => d.date === selectedDate && !d.inactive) || dates[4];
                 const selectedIndex = dates.findIndex(d => d.date === selectedDate && !d.inactive);
                 const weekStartIndex = selectedIndex !== -1 ? Math.floor(selectedIndex / 7) * 7 : 0;
                 const weekDays = dates.slice(weekStartIndex, weekStartIndex + 7);
                 
                 const getEventForHour = (hour: string) => {
                   return selectedDayObj.events.find(e => e.time === hour);
                 };

                 return (
                   <div className="flex flex-col flex-1 p-6 bg-surface-container-lowest">
                     {/* Mini Week Bar */}
                     <div className="flex justify-between items-center pb-6 border-b border-outline-variant mb-6">
                       <div className="flex gap-2">
                         {weekDays.map((d, i) => {
                           const isSelected = d.date === selectedDate && !d.inactive;
                           return (
                             <button
                               key={i}
                               disabled={d.inactive}
                               onClick={() => setSelectedDate(d.date)}
                               className={`flex flex-col items-center p-2 rounded-lg transition-all min-w-[50px] ${
                                 d.inactive ? 'opacity-30' :
                                 isSelected 
                                   ? 'bg-primary text-white shadow-sm font-bold scale-105' 
                                   : 'hover:bg-surface-container-low text-on-surface'
                               }`}
                             >
                               <span className={`text-[9px] uppercase font-bold ${isSelected ? 'text-white/80' : 'text-secondary'}`}>{days[i]}</span>
                               <span className="text-sm font-semibold mt-1">{String(d.date).padStart(2, '0')}</span>
                             </button>
                           );
                         })}
                       </div>
                       <div className="text-right">
                         <h4 className="font-serif text-base font-semibold text-primary">
                           {days[dates.findIndex(d => d.date === selectedDate && !d.inactive) % 7]}, {selectedDate} de Outubro
                         </h4>
                         <p className="text-xs text-outline">Visualização Diária</p>
                       </div>
                     </div>
                     
                     {/* Timeline */}
                     <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[450px]">
                       {hours.map((hour) => {
                         const event = getEventForHour(hour);
                         return (
                           <div key={hour} className="flex gap-4 items-start group">
                             <div className="text-xs font-bold text-secondary w-12 pt-1 text-right shrink-0">{hour}</div>
                             <div className="flex-1 border-t border-outline-variant/60 mt-3 relative">
                               {event && (
                                 <div className={`absolute top-2 left-0 right-0 p-3 rounded-lg border shadow-sm flex flex-col gap-1 z-10 transition-all hover:-translate-y-0.5 ${
                                   event.type === 'deadline' 
                                     ? 'bg-error-container text-on-error-container border-error/20' 
                                     : 'bg-primary-fixed text-primary border-primary-fixed-dim/50'
                                 }`}>
                                   <div className="flex justify-between items-center">
                                     <span className="text-xs font-bold">{event.text}</span>
                                     <span className="text-[10px] opacity-85 flex items-center gap-1 font-semibold">
                                       <Clock className="w-3 h-3" /> {event.time}
                                     </span>
                                   </div>
                                 </div>
                               )}
                               {!event && (
                                 <div className="h-8 transition-colors group-hover:bg-surface-container-low/20 rounded-md"></div>
                               )}
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 );
               })()
             )}
          </div>

          {/* Right Column: Next Deadlines */}
          <div className="xl:col-span-4 flex flex-col gap-6">
             <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-serif text-lg font-semibold text-primary">Trabalhos e Prazos</h3>
                   <span className="bg-primary-container text-white text-[10px] font-bold px-2.5 py-1 rounded-full">4 Ativos</span>
                </div>

                <div className="space-y-4">
                  <WorkCard 
                    id={1}
                    title="Tese de Mestrado - Cap 2"
                    status="Em Elaboração"
                    date="09 Out"
                    daysLeft="Faltam 4 dias"
                    isCritical={true}
                  />
                  <WorkCard 
                    id={2}
                    title="Artigo: Estruturas Moleculares"
                    status="Revisão"
                    date="15 Out"
                    daysLeft="Faltam 10 dias"
                    isCritical={false}
                  />
                </div>

                <button className="w-full mt-6 py-2.5 border border-dashed border-outline-variant text-secondary text-sm font-semibold rounded-lg hover:bg-surface-container-low transition-colors">
                  Ver Todos os Prazos
                </button>
             </div>


          </div>
       </div>
    </main>
  );
}
