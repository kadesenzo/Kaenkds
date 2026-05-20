
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, Sparkles, Loader2, Calendar, 
  TrendingUp, Activity, AlertTriangle, CheckCircle2,
  DollarSign, Wrench, Package, ArrowRight, Smartphone, MessageCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ServiceOrder, OSStatus, UserSession, Appointment } from '../types';

const Dashboard: React.FC<{ session?: UserSession }> = ({ session }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (session) {
      const load = () => {
        const savedOrders = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
        const savedApps = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_appointments`) || '[]');
        setOrders(savedOrders);
        setAppointments(savedApps);
      };
      
      load();
      window.addEventListener('kaen_storage_updated', load);
      return () => window.removeEventListener('kaen_storage_updated', load);
    }
  }, [session]);

  const financialStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const calculateTotals = (data: ServiceOrder[]) => {
      const labor = data.reduce((acc, curr) => acc + curr.laborValue, 0);
      const total = data.reduce((acc, curr) => acc + curr.totalValue, 0);
      return { labor, parts: total - labor, total };
    };

    const daily = calculateTotals(orders.filter(o => o.createdAt.startsWith(today)));
    const all = calculateTotals(orders);
    const estimatedGain = appointments.filter(a => a.status === 'Agendado' || a.status === 'Pendente').length * 550;

    return { daily, all, estimatedGain };
  }, [orders, appointments]);

  const robotInsights = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const insights = [];
    
    const pendingApps = appointments.filter(a => a.date === today && a.status === 'Pendente');
    if (pendingApps.length > 0) {
      insights.push({ type: 'warning', text: `Detectamos ${pendingApps.length} agendamentos pendentes para HOJE!`, icon: <AlertTriangle size={18}/> });
    }

    if (financialStats.daily.total === 0 && appointments.length < 3) {
      insights.push({ type: 'danger', text: "Fluxo diário baixo. Robô sugere disparar lembretes via WhatsApp.", icon: <Activity size={18}/> });
    }

    const lateOrders = orders.filter(o => o.status === OSStatus.EM_ANDAMENTO && new Date(o.createdAt) < new Date(Date.now() - 86400000));
    if (lateOrders.length > 0) {
      insights.push({ type: 'info', text: `${lateOrders.length} ordens de serviço pendentes há mais de 24h. Verificar atrasos.`, icon: <Clock size={18}/> });
    }

    return insights;
  }, [appointments, financialStats, orders]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 p-6 md:p-14 pb-48 w-full max-w-[1400px]">
      
      {/* MANAGEMENT HEADER */}
      <div className="w-full glass-card p-12 rounded-[4rem] border border-white/5 relative overflow-hidden group shadow-2xl">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
            <div>
               <div className="flex items-center gap-5 mb-5">
                  <div className="w-14 h-14 bg-[#FF2D55] rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20">
                     <Activity size={28} />
                  </div>
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter text-left">PAINEL DE <span className="text-[#FF2D55]">GESTÃO</span></h2>
               </div>
               <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] italic text-left">Visão geral da performance e fluxo da oficina</p>
            </div>
            <div className="flex gap-5">
               <button onClick={() => navigate('/orders/new')} className="bg-[#FF2D55] px-10 py-5 rounded-full font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-3">
                  <PlusCircle size={20}/> Nova Nota
               </button>
               <button onClick={() => navigate('/calendar')} className="bg-white text-black px-10 py-5 rounded-full font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-3">
                  <Calendar size={20}/> Ver Agenda
               </button>
            </div>
         </div>

         {/* Resumo Rápido */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14 border-t border-white/5 pt-12">
            <div className="flex items-center gap-5 bg-black/50 p-6 rounded-[2.5rem] border border-white/5">
               <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500">
                  <Clock size={18}/>
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Em Execução</p>
                  <p className="text-xl font-black text-white italic">{orders.filter(o => o.status === OSStatus.EM_ANDAMENTO).length} Serviços</p>
               </div>
            </div>
            <div className="flex items-center gap-5 bg-black/50 p-6 rounded-[2.5rem] border border-white/5">
               <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500">
                  <Calendar size={18}/>
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Agendados Hoje</p>
                  <p className="text-xl font-black text-white italic">{appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length} Veículos</p>
               </div>
            </div>
            <div className="flex items-center gap-5 bg-black/50 p-6 rounded-[2.5rem] border border-white/5">
               <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 size={18}/>
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Finalizados (Mês)</p>
                  <p className="text-xl font-black text-white italic">{orders.filter(o => o.status === OSStatus.FINALIZADO).length} Notas</p>
               </div>
            </div>
         </div>
      </div>

      {/* FINANCE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="glass-card p-12 rounded-[3.5rem] border border-white/5 shadow-2xl">
            <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-[10px] mb-8 italic text-left">MOVIMENTAÇÃO HOJE</p>
            <div className="space-y-8">
               <div className="flex justify-between items-center p-8 bg-blue-500/5 border border-blue-500/10 rounded-[2.5rem] shadow-inner">
                  <div className="text-left">
                     <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2 italic">MÃO DE OBRA</p>
                     <p className="text-3xl font-black italic">R$ {financialStats.daily.labor.toLocaleString('pt-BR')}</p>
                  </div>
                  <Wrench className="text-blue-500/30" size={40} />
               </div>
               <div className="flex justify-between items-center p-8 bg-[#FF2D55]/5 border border-[#FF2D55]/10 rounded-[2.5rem] shadow-inner">
                  <div className="text-left">
                     <p className="text-[9px] font-black text-[#FF2D55] uppercase tracking-widest mb-2 italic">PEÇAS & PRODUTOS</p>
                     <p className="text-3xl font-black italic">R$ {financialStats.daily.parts.toLocaleString('pt-BR')}</p>
                  </div>
                  <Package className="text-[#FF2D55]/30" size={40} />
               </div>
            </div>
         </div>

         <div className="glass-card p-12 rounded-[3.5rem] border border-white/5 bg-gradient-to-br from-zinc-900/50 to-transparent shadow-2xl">
            <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-[10px] mb-8 italic text-left">PERFORMANCE ACUMULADA</p>
            <div className="space-y-4 mb-14 text-left">
               <p className="text-6xl font-black italic text-white tracking-tighter leading-none">R$ {financialStats.all.total.toLocaleString('pt-BR')}</p>
               <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest italic flex items-center gap-3 bg-emerald-500/5 py-2 px-4 rounded-full w-fit">
                  <TrendingUp size={16}/> CRESCIMENTO DE 14.5% 
               </p>
            </div>
            <div className="grid grid-cols-2 gap-5 text-left">
               <div className="p-7 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[9px] font-black text-zinc-500 uppercase mb-2">Peças</p>
                  <p className="text-lg font-black italic">R$ {financialStats.all.parts.toLocaleString('pt-BR')}</p>
               </div>
               <div className="p-7 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[9px] font-black text-zinc-500 uppercase mb-2">Serviços</p>
                  <p className="text-lg font-black italic">R$ {financialStats.all.labor.toLocaleString('pt-BR')}</p>
               </div>
            </div>
         </div>

         <div className="glass-card p-12 rounded-[3.5rem] border border-emerald-500/20 bg-emerald-500/5 shadow-2xl">
            <div className="flex justify-between items-start mb-8">
               <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] italic">PREVISÃO (IA)</p>
               <Sparkles className="text-emerald-500/40" size={24} />
            </div>
            <div className="space-y-4 text-left">
               <p className="text-5xl font-black italic text-white tracking-tighter leading-none">~R$ {financialStats.estimatedGain.toLocaleString('pt-BR')}</p>
               <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest italic leading-relaxed">
                  Estimativa baseada em agendamentos futuros e solicitações pendentes.
               </p>
            </div>
            <div className="mt-14 pt-14 border-t border-emerald-500/10">
               <button onClick={() => navigate('/calendar')} className="w-full bg-emerald-500 text-black py-6 rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-all italic shadow-xl">
                  Otimizar Agenda <ArrowRight size={20}/>
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
