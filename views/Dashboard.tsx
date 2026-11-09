
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, Sparkles, Loader2, Calendar, 
  TrendingUp, Activity, AlertTriangle, CheckCircle2,
  DollarSign, Wrench, Package, ArrowRight, Smartphone, MessageCircle,
  Clock, Car, FileText, Check, ShieldCheck, Share2, Eye, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ServiceOrder, OSStatus, UserSession, Appointment, Part } from '../types';

const Dashboard: React.FC<{ session?: UserSession }> = ({ session }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    if (session) {
      const load = () => {
        const savedOrders = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
        const savedApps = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_appointments`) || '[]');
        const savedParts = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_parts`) || '[]');
        setOrders(savedOrders);
        setAppointments(savedApps);
        setParts(savedParts);
      };
      
      load();
      window.addEventListener('kaen_storage_updated', load);
      return () => window.removeEventListener('kaen_storage_updated', load);
    }
  }, [session]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Carros recebidos hoje
    const receivedToday = orders.filter(o => o.createdAt && o.createdAt.startsWith(today)).length;
    
    // 2. Em manutenção (Em diagnóstico, Em serviço, Em Execução)
    const inMaintenance = orders.filter(o => 
      o.status === OSStatus.EM_DIAGNOSTICO || 
      o.status === OSStatus.EM_SERVICO || 
      o.status === OSStatus.EM_ANDAMENTO
    ).length;

    // 3. Aguardando aprovação (Orçamento enviado, Aguardando aprovação, Orçamento)
    const awaitingApproval = orders.filter(o => 
      o.status === OSStatus.AGUARDANDO_APROVACAO || 
      o.status === OSStatus.ORCAMENTO_ENVIADO || 
      o.status === OSStatus.ORCAMENTO
    ).length;

    // 4. Prontos (Pronto, Finalização)
    const readyCars = orders.filter(o => 
      o.status === OSStatus.PRONTO || 
      o.status === OSStatus.FINALIZACAO
    ).length;

    // 5. Faturamento do dia
    const todayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(today));
    const dailyLabor = todayOrders.reduce((acc, curr) => acc + (curr.laborValue || 0), 0);
    const dailyTotal = todayOrders.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
    const dailyParts = dailyTotal - dailyLabor;

    // Faturamento geral acumulado
    const totalRevenue = orders.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

    // 6. Peças utilizadas
    const totalPartsUsed = orders.reduce((acc, curr) => {
      const pItems = (curr.items || []).filter(i => i.type === 'PART');
      return acc + pItems.reduce((pAcc, pCurr) => pAcc + (pCurr.quantity || 1), 0);
    }, 0);

    // 7. Orçamentos pendentes
    const pendingBudgets = orders.filter(o => 
      !o.budgetApproved && (
        o.status === OSStatus.AGUARDANDO_DIAGNOSTICO || 
        o.status === OSStatus.ORCAMENTO_ENVIADO || 
        o.status === OSStatus.AGUARDANDO_APROVACAO || 
        o.status === OSStatus.ORCAMENTO
      )
    ).length;

    const estimatedGain = appointments.filter(a => a.status === 'Agendado' || a.status === 'Pendente').length * 550;

    return { 
      receivedToday, 
      inMaintenance, 
      awaitingApproval, 
      readyCars, 
      dailyTotal, 
      dailyLabor, 
      dailyParts, 
      totalRevenue, 
      totalPartsUsed, 
      pendingBudgets, 
      estimatedGain 
    };
  }, [orders, appointments]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders.slice(0, 8);
    return orders.filter(o => o.status === statusFilter).slice(0, 8);
  }, [orders, statusFilter]);

  const statusConfigs = [
    { label: 'Aguardando diagnóstico', key: OSStatus.AGUARDANDO_DIAGNOSTICO, color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    { label: 'Em diagnóstico', key: OSStatus.EM_DIAGNOSTICO, color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    { label: 'Orçamento enviado', key: OSStatus.ORCAMENTO_ENVIADO, color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
    { label: 'Aguardando aprovação', key: OSStatus.AGUARDANDO_APROVACAO, color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    { label: 'Em serviço', key: OSStatus.EM_SERVICO, color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
    { label: 'Finalização', key: OSStatus.FINALIZACAO, color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
    { label: 'Pronto', key: OSStatus.PRONTO, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { label: 'Entregue', key: OSStatus.ENTREGUE, color: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 p-4 md:p-10 pb-48 w-full max-w-[1400px] mx-auto">
      
      {/* MANAGEMENT HEADER */}
      <div className="w-full glass-card p-8 md:p-12 rounded-[3.5rem] border border-white/5 relative overflow-hidden group shadow-2xl">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
            <div>
               <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-[#FF2D55] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#FF2D55]/30 border border-white/20">
                     <Activity size={28} />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-left text-white leading-none">
                      PAINEL OPERACIONAL <span className="text-[#FF2D55]">KAEN</span>
                    </h2>
                    <p className="text-zinc-500 font-bold uppercase tracking-[0.25em] text-[10px] italic text-left mt-1.5">
                      SISTEMA INTEGRADO DE GESTÃO AUTOMOTIVA PROFISSIONAL
                    </p>
                  </div>
               </div>
            </div>
            <div className="flex flex-wrap gap-3">
               <button onClick={() => navigate('/orders/new')} className="bg-[#FF2D55] hover:bg-[#FF2D55]/90 text-white px-8 py-4 rounded-full font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-3 italic">
                  <PlusCircle size={18}/> Emitir Nota / OS
               </button>
               <button onClick={() => navigate('/terminal')} className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-3 border border-white/10 italic">
                  <Smartphone size={18}/> Terminal Mecânico
               </button>
               <button onClick={() => navigate('/ai-marketing')} className="bg-white text-black px-8 py-4 rounded-full font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-3 italic">
                  <Sparkles size={18} className="text-[#FF2D55]"/> CRM & Marketing
               </button>
            </div>
         </div>

         {/* 7 KPIS DO SISTEMA KAEN */}
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mt-10 border-t border-white/5 pt-8">
            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-left">
               <div className="flex items-center justify-between text-zinc-500 mb-1">
                 <span className="text-[9px] font-black uppercase tracking-wider">Recebidos Hoje</span>
                 <Car size={14} className="text-blue-400" />
               </div>
               <p className="text-2xl font-black text-white italic">{stats.receivedToday}</p>
               <span className="text-[8px] font-bold text-zinc-500 uppercase">Novas Entradas</span>
            </div>

            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-left">
               <div className="flex items-center justify-between text-zinc-500 mb-1">
                 <span className="text-[9px] font-black uppercase tracking-wider">Em Manutenção</span>
                 <Wrench size={14} className="text-amber-400" />
               </div>
               <p className="text-2xl font-black text-amber-400 italic">{stats.inMaintenance}</p>
               <span className="text-[8px] font-bold text-zinc-500 uppercase">Boxes Ativos</span>
            </div>

            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-left">
               <div className="flex items-center justify-between text-zinc-500 mb-1">
                 <span className="text-[9px] font-black uppercase tracking-wider">Aguard. Aprovação</span>
                 <Clock size={14} className="text-purple-400" />
               </div>
               <p className="text-2xl font-black text-purple-400 italic">{stats.awaitingApproval}</p>
               <span className="text-[8px] font-bold text-zinc-500 uppercase">Orçamentos no Zap</span>
            </div>

            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-left">
               <div className="flex items-center justify-between text-zinc-500 mb-1">
                 <span className="text-[9px] font-black uppercase tracking-wider">Veículos Prontos</span>
                 <CheckCircle2 size={14} className="text-emerald-400" />
               </div>
               <p className="text-2xl font-black text-emerald-400 italic">{stats.readyCars}</p>
               <span className="text-[8px] font-bold text-zinc-500 uppercase">Avisar Retirada</span>
            </div>

            <div className="bg-black/60 p-4 rounded-2xl border border-[#FF2D55]/20 text-left">
               <div className="flex items-center justify-between text-zinc-500 mb-1">
                 <span className="text-[9px] font-black uppercase tracking-wider text-[#FF2D55]">Faturamento Hoje</span>
                 <DollarSign size={14} className="text-[#FF2D55]" />
               </div>
               <p className="text-xl font-black text-[#FF2D55] italic truncate">R$ {stats.dailyTotal.toLocaleString('pt-BR')}</p>
               <span className="text-[8px] font-bold text-zinc-500 uppercase">M.O + Peças</span>
            </div>

            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-left">
               <div className="flex items-center justify-between text-zinc-500 mb-1">
                 <span className="text-[9px] font-black uppercase tracking-wider">Peças Usadas</span>
                 <Package size={14} className="text-cyan-400" />
               </div>
               <p className="text-2xl font-black text-white italic">{stats.totalPartsUsed}</p>
               <span className="text-[8px] font-bold text-zinc-500 uppercase">Baixa no Estoque</span>
            </div>

            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-left">
               <div className="flex items-center justify-between text-zinc-500 mb-1">
                 <span className="text-[9px] font-black uppercase tracking-wider">Orçam. Pendentes</span>
                 <FileText size={14} className="text-orange-400" />
               </div>
               <p className="text-2xl font-black text-orange-400 italic">{stats.pendingBudgets}</p>
               <span className="text-[8px] font-bold text-zinc-500 uppercase">Aguardando Ação</span>
            </div>
         </div>
      </div>

      {/* 4 PILARES DA ESTRUTURA KAEN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pilar 1: Operação */}
        <div onClick={() => navigate('/terminal')} className="glass-card p-6 rounded-[2.5rem] border border-white/5 hover:border-[#FF2D55]/40 transition-all cursor-pointer group text-left relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
            <Wrench size={20} />
          </div>
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">1. OPERAÇÃO OFICINA</p>
          <h3 className="text-lg font-black text-white uppercase italic mt-1 group-hover:text-blue-400 transition-colors">Boxes & Terminal</h3>
          <p className="text-[11px] text-zinc-400 mt-2 font-medium">Recepção, Diagnóstico com Scanner, Boxes com Elevador, Estoque e Lavagem/Entrega.</p>
          <div className="mt-4 flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-wider">
            <span>Acessar Boxes</span> <ChevronRight size={14} />
          </div>
        </div>

        {/* Pilar 2: Sistema */}
        <div onClick={() => navigate('/orders')} className="glass-card p-6 rounded-[2.5rem] border border-white/5 hover:border-[#FF2D55]/40 transition-all cursor-pointer group text-left relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
            <FileText size={20} />
          </div>
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">2. SISTEMA & OS</p>
          <h3 className="text-lg font-black text-white uppercase italic mt-1 group-hover:text-amber-400 transition-colors">Fluxo em 8 Status</h3>
          <p className="text-[11px] text-zinc-400 mt-2 font-medium">Acompanhe do diagnóstico à entrega com fotos antes/depois e checklist de 10 itens.</p>
          <div className="mt-4 flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-wider">
            <span>Ver Todas as OS</span> <ChevronRight size={14} />
          </div>
        </div>

        {/* Pilar 3: Vendas & CRM */}
        <div onClick={() => navigate('/ai-marketing')} className="glass-card p-6 rounded-[2.5rem] border border-white/5 hover:border-[#FF2D55]/40 transition-all cursor-pointer group text-left relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
            <MessageCircle size={20} />
          </div>
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">3. CRM & WHATSAPP</p>
          <h3 className="text-lg font-black text-white uppercase italic mt-1 group-hover:text-emerald-400 transition-colors">Automação & Pós-Venda</h3>
          <p className="text-[11px] text-zinc-400 mt-2 font-medium">Aprovação de orçamento com 1 clique, aviso de carro pronto e régua 1d, 7d, 30d e 6m.</p>
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
            <span>Abrir Central Zap</span> <ChevronRight size={14} />
          </div>
        </div>

        {/* Pilar 4: Marca & Marketing */}
        <div onClick={() => navigate('/ai-marketing')} className="glass-card p-6 rounded-[2.5rem] border border-white/5 hover:border-[#FF2D55]/40 transition-all cursor-pointer group text-left relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-[#FF2D55]/10 text-[#FF2D55] flex items-center justify-center mb-4 border border-[#FF2D55]/20">
            <Sparkles size={20} />
          </div>
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">4. MARCA & MARKETING</p>
          <h3 className="text-lg font-black text-white uppercase italic mt-1 group-hover:text-[#FF2D55] transition-colors">Instagram & Reels</h3>
          <p className="text-[11px] text-zinc-400 mt-2 font-medium">Grade semanal (Seg a Sáb), roteiros de Reels com Gancho➔Solução e guia de uniformes.</p>
          <div className="mt-4 flex items-center gap-2 text-[#FF2D55] text-[10px] font-black uppercase tracking-wider">
            <span>Ver Planejador</span> <ChevronRight size={14} />
          </div>
        </div>
      </div>

      {/* WORKFLOW STATUS FILTER & CARDS */}
      <div className="glass-card p-8 md:p-10 rounded-[3rem] border border-white/5 space-y-6 text-left">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
              ESTEIRA DE SERVIÇOS POR STATUS
            </h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
              Selecione uma fase para filtrar os veículos em tempo real
            </p>
          </div>
          <button onClick={() => setStatusFilter('ALL')} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${statusFilter === 'ALL' ? 'bg-white text-black border-white' : 'bg-black text-zinc-500 border-white/10'}`}>
            Ver Todos ({orders.length})
          </button>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-2">
          {statusConfigs.map(s => {
            const count = orders.filter(o => o.status === s.key).length;
            const isSelected = statusFilter === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setStatusFilter(isSelected ? 'ALL' : s.key)}
                className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-2 ${s.color} ${isSelected ? 'ring-2 ring-white scale-105 shadow-lg' : 'opacity-80 hover:opacity-100'}`}
              >
                <span>● {s.label}</span>
                <span className="bg-black/50 px-2 py-0.5 rounded-full text-[9px] font-mono">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Orders in selected filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full py-12 text-center text-zinc-600">
              <Car size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs font-black uppercase tracking-widest">Nenhum veículo nesta etapa no momento.</p>
            </div>
          ) : (
            filteredOrders.map(o => (
              <div key={o.id} className="bg-black/50 p-5 rounded-3xl border border-white/5 hover:border-[#FF2D55]/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[9px] font-black text-zinc-500 tracking-wider">OS #{o.osNumber}</span>
                    <span className="text-[9px] font-mono text-zinc-600">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p className="text-xl font-black text-white italic tracking-tight">{o.vehiclePlate}</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{o.vehicleModel}</p>
                  <p className="text-[10px] text-zinc-500 mt-2 line-clamp-1"><strong className="text-zinc-400">Cliente:</strong> {o.clientName}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#FF2D55]">R$ {o.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  <button onClick={() => navigate('/orders')} className="text-[9px] font-black uppercase tracking-wider text-zinc-400 hover:text-white flex items-center gap-1">
                    Abrir <ChevronRight size={12}/>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FINANCE & PREVISION ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="glass-card p-8 rounded-[3rem] border border-white/5 shadow-2xl text-left">
            <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px] mb-6 italic">MOVIMENTAÇÃO HOJE</p>
            <div className="space-y-4">
               <div className="flex justify-between items-center p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                  <div>
                     <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 italic">MÃO DE OBRA</p>
                     <p className="text-2xl font-black italic text-white">R$ {stats.dailyLabor.toLocaleString('pt-BR')}</p>
                  </div>
                  <Wrench className="text-blue-500/30" size={32} />
               </div>
               <div className="flex justify-between items-center p-5 bg-[#FF2D55]/5 border border-[#FF2D55]/10 rounded-2xl">
                  <div>
                     <p className="text-[9px] font-black text-[#FF2D55] uppercase tracking-widest mb-1 italic">PEÇAS & PRODUTOS</p>
                     <p className="text-2xl font-black italic text-white">R$ {stats.dailyParts.toLocaleString('pt-BR')}</p>
                  </div>
                  <Package className="text-[#FF2D55]/30" size={32} />
               </div>
            </div>
         </div>

         <div className="glass-card p-8 rounded-[3rem] border border-white/5 bg-gradient-to-br from-zinc-900/50 to-transparent shadow-2xl text-left">
            <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px] mb-6 italic">FATURAMENTO TOTAL ACUMULADO</p>
            <div className="space-y-3 mb-6">
               <p className="text-4xl md:text-5xl font-black italic text-white tracking-tighter leading-none">R$ {stats.totalRevenue.toLocaleString('pt-BR')}</p>
               <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic flex items-center gap-2 bg-emerald-500/10 py-1.5 px-3 rounded-full w-fit border border-emerald-500/20">
                  <TrendingUp size={14}/> CRESCIMENTO ATIVO
               </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Total Notas</p>
                  <p className="text-lg font-black italic text-white">{orders.length} OS</p>
               </div>
               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Ticket Médio</p>
                  <p className="text-lg font-black italic text-white">
                    R$ {orders.length > 0 ? (stats.totalRevenue / orders.length).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '0'}
                  </p>
               </div>
            </div>
         </div>

         <div className="glass-card p-8 rounded-[3rem] border border-emerald-500/20 bg-emerald-500/5 shadow-2xl text-left">
            <div className="flex justify-between items-start mb-6">
               <p className="text-emerald-400 font-black uppercase tracking-[0.3em] text-[10px] italic">ESTIMATIVA IA & AGENDA</p>
               <Sparkles className="text-emerald-400" size={20} />
            </div>
            <div className="space-y-3">
               <p className="text-4xl font-black italic text-white tracking-tighter leading-none">~R$ {stats.estimatedGain.toLocaleString('pt-BR')}</p>
               <p className="text-[11px] font-medium text-zinc-400 leading-relaxed">
                  Estimativa calculada sobre {appointments.length} agendamentos futuros e revisões preventivas programadas.
               </p>
            </div>
            <div className="mt-8 pt-6 border-t border-emerald-500/10">
               <button onClick={() => navigate('/calendar')} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all italic shadow-xl">
                  Abrir Agenda <ArrowRight size={16}/>
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
