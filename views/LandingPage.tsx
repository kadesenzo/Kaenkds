
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, Wrench, ShieldCheck, Clock, 
  Car, Star, Calendar, MessageCircle, MapPin, 
  ArrowRight, Smartphone, CheckCircle2, ChevronRight,
  Settings, UserCheck, Activity, BarChart3, Info,
  Search, Shield, Zap, Camera, FileText, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { ServiceOrder, OSStatus } from '../types';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showBooking, setShowBooking] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Tracking Portal states
  const [searchTenant, setSearchTenant] = useState('rafael');
  const [searchPlate, setSearchPlate] = useState('');
  const [trackingOrder, setTrackingOrder] = useState<ServiceOrder | null>(null);
  const [allOrdersInSearch, setAllOrdersInSearch] = useState<ServiceOrder[]>([]);
  const [isSearchingTrack, setIsSearchingTrack] = useState(false);
  const [trackError, setTrackError] = useState('');
  
  // Signature States  
  const [showSignModal, setShowSignModal] = useState(false);
  const [clientSignature, setClientSignature] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);

  // Active Photo state
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const [bookingForm, setBookingForm] = useState({
    name: '', phone: '', vehicle: '', date: '', time: '', service: 'Revisão Preventiva'
  });

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const message = `Olá! Sou ${bookingForm.name}. Vi o site da Kaen e gostaria de agendar um(a) ${bookingForm.service} para o dia ${bookingForm.date} às ${bookingForm.time} no meu ${bookingForm.vehicle}.`;
    const phone = '5511999999999'; 
    
    const savedApps = JSON.parse(localStorage.getItem('kaen_appointments') || '[]');
    const newApp = {
      id: Math.random().toString(36).substr(2, 9),
      ...bookingForm,
      clientName: bookingForm.name,
      vehiclePlate: 'SITE-SOLICITADO',
      status: 'Pendente',
      attemptsCount: 1,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('kaen_appointments', JSON.stringify([...savedApps, newApp]));

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    setShowBooking(false);
  };

  const handleSearchTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPlate) {
      setTrackError("Por favor, digite a placa do veículo.");
      return;
    }
    setIsSearchingTrack(true);
    setTrackError("");
    setTrackingOrder(null);
    
    try {
      const targetId = searchTenant.toLowerCase().trim() || "rafael";
      const res = await fetch(`/api/sync/${targetId}`);
      if (!res.ok) {
        setTrackError("Oficina não encontrada ou inativa no sistema Kaen.");
        setIsSearchingTrack(false);
        return;
      }
      
      const data = await res.json();
      const ordersList = (data.orders && Array.isArray(data.orders)) ? data.orders : [];
      setAllOrdersInSearch(ordersList);
      
      const normalizedPlate = searchPlate.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
      const match = ordersList.find((o: any) => {
        const op = String(o.vehiclePlate || "").toUpperCase().replace(/[^A-Z0-9]/g, '');
        return op.includes(normalizedPlate);
      });
      
      if (match) {
        setTrackingOrder(match);
      } else {
        setTrackError(`Nenhum veículo ativo com a placa "${searchPlate.toUpperCase()}" localizado nesta oficina.`);
      }
    } catch (err) {
      setTrackError("Erro ao consultar base de dados em tempo real. Verifique sua conexão.");
    } finally {
      setIsSearchingTrack(false);
    }
  };

  const handleApproveBudget = async () => {
    if (!trackingOrder || !clientSignature.trim()) return;
    setIsSubmittingApproval(true);
    
    const updatedOrder: ServiceOrder = {
      ...trackingOrder,
      status: 'EM_ANDAMENTO' as any,
      problem: `${trackingOrder.problem || ''}\n[ORÇAMENTO AUTORIZADO DIGITALMENTE POR: ${clientSignature.toUpperCase()} EM ${new Date().toLocaleString('pt-BR')}]`,
      updatedAt: new Date().toISOString()
    };
    
    const updatedList = allOrdersInSearch.map(o => o.id === trackingOrder.id ? updatedOrder : o);
    
    try {
      const tenant = searchTenant.toLowerCase().trim() || 'rafael';
      const res = await fetch(`/api/sync/${tenant}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedList)
      });
      
      if (res.ok) {
        setTrackingOrder(updatedOrder);
        setApprovalSuccess(true);
        setTimeout(() => {
          setShowSignModal(false);
          setApprovalSuccess(false);
          setClientSignature('');
        }, 2000);
      } else {
        alert("Falha ao sincronizar assinatura eletrônica.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de comunicação com o servidor.");
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen selection:bg-[#FF2D55] selection:text-white font-['Inter']">
      
      {/* MENU LATERAL (DRAWER) */}
      <div className={`fixed inset-y-0 right-0 z-[200] w-[320px] glass-card border-l border-white/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] p-10 flex flex-col ${isMenuOpen ? 'translate-x-0 shadow-[-50px_0_100px_rgba(0,0,0,0.9)]' : 'translate-x-full'}`}>
         <button onClick={() => setIsMenuOpen(false)} className="self-end p-3 hover:text-[#FF2D55] transition-colors mb-12">
            <X size={32} />
         </button>
         
         <div className="space-y-12">
            <div>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 italic mb-6">SISTEMA INTERNO</p>
               <nav className="flex flex-col gap-6">
                  <button onClick={() => navigate('/login')} className="flex items-center gap-5 group text-left">
                     <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-[#FF2D55] transition-all border border-white/5">
                        <UserCheck size={24}/>
                     </div>
                     <div>
                        <p className="font-black uppercase italic tracking-tighter text-sm">Entrar no Painel</p>
                        <p className="text-[9px] text-zinc-500 uppercase font-bold">Gestão & Dashboards</p>
                     </div>
                  </button>
                  <button onClick={() => navigate('/terminal')} className="flex items-center gap-5 group text-left">
                     <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-all border border-white/5">
                        <Smartphone size={24}/>
                     </div>
                     <div>
                        <p className="font-black uppercase italic tracking-tighter text-sm">Terminal Mecânico</p>
                        <p className="text-[9px] text-zinc-500 uppercase font-bold">Lançamento de Pista</p>
                     </div>
                  </button>
               </nav>
            </div>

            <div className="pt-12 border-t border-white/5">
               <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest leading-relaxed">
                  KAEN NETWORK V26<br/>ALTA PERFORMANCE AUTOMOTIVA
               </p>
            </div>
         </div>
      </div>

      {/* NAVBAR PRINCIPAL */}
      <nav className="fixed top-0 left-0 w-full z-[100] px-8 py-6 flex justify-between items-center bg-black/60 backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#FF2D55] rounded-xl flex items-center justify-center shadow-lg border border-white/20">
            <Wrench size={24} className="text-white" />
          </div>
          <span className="text-2xl font-black italic uppercase tracking-tighter">KAEN</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-14">
          {['Serviços', 'A Oficina', 'Tecnologia'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(' ', '')}`} className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors italic">{item}</a>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <button 
            onClick={() => setShowBooking(true)}
            className="hidden sm:block bg-white text-black px-10 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all hover:bg-[#FF2D55] hover:text-white"
          >
            Agendar Agora
          </button>
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center text-white hover:border-[#FF2D55] transition-all group"
            title="Acessar Sistema"
          >
            <Menu size={28} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>
      </nav>

      {/* SEÇÃO HERO */}
      <section className="relative pt-64 pb-32 px-8 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,45,85,0.1)_0%,transparent_70%)] pointer-events-none"></div>
        
        <div className="bg-white/5 border border-white/10 px-8 py-3 rounded-full mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
           <span className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-400 italic">Mecânica de Precisão & Alta Performance</span>
        </div>

        <h1 className="text-[14vw] md:text-[11rem] font-black italic uppercase tracking-tighter leading-[0.75] mb-14 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          BEYOND<br/><span className="text-[#FF2D55]">LIMITS</span>
        </h1>

        <p className="max-w-2xl text-zinc-500 font-bold uppercase tracking-widest text-sm md:text-lg italic mb-20 leading-relaxed">
          Na KAEN, não apenas consertamos veículos, elevamos sua máquina ao seu máximo potencial. Diagnóstico avançado e engenharia de precisão.
        </p>

        <div className="flex flex-col md:flex-row gap-8">
           <button 
            onClick={() => setShowBooking(true)}
            className="px-24 py-9 bg-[#FF2D55] text-white rounded-[3.5rem] font-black uppercase text-xs tracking-[0.4em] italic shadow-[0_40px_100px_rgba(255,45,85,0.4)] active:scale-95 transition-all"
           >
             Fazer Agendamento
           </button>
           <button 
            onClick={() => {
              document.getElementById('tracking-portal-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-24 py-9 bg-zinc-900 text-white rounded-[3.5rem] font-black uppercase text-xs tracking-[0.4em] italic hover:bg-white/10 border border-white/5 transition-all"
           >
             Acompanhar Veículo
           </button>
        </div>

        <div className="mt-32 flex flex-wrap justify-center gap-16 md:gap-24 text-zinc-700 font-black text-[11px] uppercase tracking-[0.5em] italic opacity-50">
           <div className="flex flex-col items-center gap-5"><Settings size={32}/> Diagnóstico Scanner</div>
           <div className="flex flex-col items-center gap-5"><Shield size={32}/> Garantia Kaen</div>
           <div className="flex flex-col items-center gap-5"><Clock size={32}/> Entrega Expressa</div>
           <div className="flex flex-col items-center gap-5"><Activity size={32}/> Performance</div>
        </div>
      </section>

      {/* CLIENT PORTAL: REAL-TIME VEHICLE TRACKING AND APPROVAL */}
      <section id="tracking-portal-section" className="py-24 px-4 sm:px-8 bg-zinc-950 border-t border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_left,rgba(255,45,85,0.03)_0%,transparent_60%)] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="text-center space-y-3 mb-12">
            <span className="text-[#FF2D55] font-black uppercase tracking-[0.5em] text-[10px] italic">ÁREA DO CLIENTE KAEN</span>
            <h2 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter">ACOMPANHAMENTO LIVE</h2>
            <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">CONECTE-SE DIRETAMENTE AO BOX DE SERVIÇO DO SEU VEÍCULO</p>
          </div>

          {!trackingOrder ? (
            <div className="w-full max-w-xl bg-zinc-900/60 border border-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative">
              <form onSubmit={handleSearchTracking} className="space-y-6">
                <div className="space-y-2 text-left">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block ml-4">CÓDIGO DA OFICINA AUTORIZADA</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="EX: rafael, ofic_kaen..."
                    value={searchTenant} 
                    onChange={(e) => setSearchTenant(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} 
                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-xs text-white placeholder-zinc-700 tracking-wider font-bold uppercase outline-none focus:border-[#FF2D55] transition-all"
                  />
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block ml-4">PLACA DO SEU VEÍCULO</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="EX: ABC1234 OU BRA2E19"
                    value={searchPlate} 
                    onChange={(e) => setSearchPlate(e.target.value.toUpperCase())} 
                    className="w-full bg-black border border-[#FF2D55]/30 rounded-2xl px-6 py-4 text-xs text-white placeholder-zinc-700 tracking-wider font-extrabold outline-none focus:border-[#FF2D55] transition-all"
                  />
                </div>

                {trackError && (
                  <div className="bg-[#FF2D55]/10 border border-[#FF2D55]/20 text-[#FF2D55] text-[10px] p-4 rounded-xl font-bold uppercase italic text-center animate-in fade-in duration-200">
                    ✕ {trackError}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isSearchingTrack}
                  className="w-full bg-[#FF2D55] text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] italic shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isSearchingTrack ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                  <span>CONSULTAR SATÉLITE KAEN</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="w-full space-y-8 animate-in fade-in duration-700">
              <div className="flex justify-between items-center w-full">
                <span className="text-[9px] text-[#FF2D55] font-black tracking-widest bg-[#FF2D55]/5 border border-[#FF2D55]/15 px-4 py-1.5 rounded-full uppercase">
                  ● CONEXÃO SEGURA ATIVA
                </span>
                <button 
                  onClick={() => {
                    setTrackingOrder(null);
                    setSearchPlate('');
                  }} 
                  className="text-zinc-500 hover:text-white transition-all text-[9.5px] font-black tracking-widest uppercase italic border border-white/10 rounded-full px-5 py-2 hover:bg-white/5"
                >
                  ← BUSCAR OUTRA PLACA
                </button>
              </div>

              {/* Status Header Card */}
              <div className="bg-zinc-900/40 border border-white/10 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden text-left">
                <div className="space-y-2">
                  <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest block">FICHA INTEGRADA DO VEÍCULO</span>
                  <h3 className="text-3xl font-black italic uppercase text-white tracking-widest">{trackingOrder.vehicleModel}</h3>
                  <div className="flex items-center gap-4 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    <span>Placa: <strong className="text-white bg-white/5 px-2.5 py-1 rounded border border-white/10 text-center">{trackingOrder.vehiclePlate}</strong></span>
                    <span>km: <strong className="text-zinc-350">{trackingOrder.vehicleKm || '---'} KM</strong></span>
                  </div>
                </div>

                {/* Progress Wheel Gauge */}
                <div className="flex items-center gap-4 bg-zinc-950 p-5 rounded-3xl border border-white/5 shrink-0">
                  <div className="relative w-14 h-14 flex items-center justify-center rounded-full bg-[#FF2D55]/5 border border-[#FF2D55]/20">
                    <span className="text-[14px] font-black italic text-white leading-none">
                      {trackingOrder.status === OSStatus.EM_ANDAMENTO ? '65%' : trackingOrder.status === OSStatus.FINALIZADO ? '100%' : '30%'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-zinc-650 block uppercase tracking-widest leading-none font-sans">STATUS DE PROGRESSO</span>
                    <p className="text-xs font-black italic text-[#FF2D55] uppercase mt-1">
                      {trackingOrder.status === OSStatus.EM_ANDAMENTO && '🟢 SERVIÇO EM EXECUÇÃO'}
                      {trackingOrder.status === OSStatus.FINALIZADO && '✅ VEÍCULO CONCLUÍDO'}
                      {trackingOrder.status !== OSStatus.EM_ANDAMENTO && trackingOrder.status !== OSStatus.FINALIZADO && '🟡 AGUARDANDO AUTORIZAÇÃO'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Technical Checklist Progress bar */}
              <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] text-left space-y-6">
                <h4 className="text-[10px] font-black tracking-widest text-zinc-500 uppercase italic">Checklist Cronológico das Etapas</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                  {[
                    { title: "ENTRADA & RECON", desc: "Vistoria e check-in", completed: true },
                    { title: "DIAGNÓSTICO OBD", desc: "Mapeamento eletrônico", completed: true },
                    { title: "MÃO NA MASSA", desc: "Troca e reparos ativos", completed: trackingOrder.status === OSStatus.EM_ANDAMENTO || trackingOrder.status === OSStatus.FINALIZADO, active: trackingOrder.status === OSStatus.EM_ANDAMENTO },
                    { title: "APROVAÇÃO FINAL", desc: "Teste de rodagem torque", completed: trackingOrder.status === OSStatus.FINALIZADO, active: trackingOrder.status === OSStatus.FINALIZADO },
                    { title: "HIGIENE & ENTREGA", desc: "Lavagem final e chaves", completed: trackingOrder.status === OSStatus.FINALIZADO }
                  ].map((st, idx) => {
                    const isDone = st.completed;
                    const isActive = st.active;
                    return (
                      <div key={idx} className={`p-4 rounded-2xl border transition-all duration-300 relative ${isDone ? 'bg-[#FF2D55]/5 border-[#FF2D55]/25 text-white' : 'bg-black/40 border-white/5 text-zinc-655'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[9px] font-black tracking-widest italic">{`0${idx + 1}`}</span>
                          {isDone ? (
                            <Check size={14} className="text-[#FF2D55]" />
                          ) : (
                            <Clock size={14} className="text-zinc-800 animate-pulse" />
                          )}
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-tight mt-1 ${isDone ? 'text-white' : 'text-zinc-655'}`}>{st.title}</p>
                        <p className="text-[8.5px] text-zinc-500 leading-tight block mt-0.5 font-medium">{st.desc}</p>
                        
                        {isActive && (
                          <span className="absolute bottom-1 right-2 w-1.5 h-1.5 rounded-full bg-[#FF2D55] animate-ping"></span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Photos Gallery */}
              <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] text-left space-y-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#FF2D55] italic flex items-center gap-2">
                  <Camera size={14} /> FOTOS E DIAGNÓSTICO DO BOX
                </span>
                <p className="text-[10px] text-zinc-400 font-medium">Toque nas fotos abaixo registradas pelo especialista para inspecionar os componentes analisados durante a reparação:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(trackingOrder.checklist?.photos && trackingOrder.checklist.photos.length > 0
                    ? trackingOrder.checklist.photos
                    : (trackingOrder.photos && trackingOrder.photos.length > 0
                      ? trackingOrder.photos
                      : [
                          { label: "Velas de Ignição Gastas", url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=400" },
                          { label: "Análise Fluido de Freio", url: "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=400" },
                          { label: "Desgaste Pastilha Dianteira", url: "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&q=80&w=400" },
                          { label: "Vazamento Cárter Motor", url: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=400" }
                        ]
                    )
                  ).map((ph, idx) => (
                    <button 
                      key={idx}
                      type="button"
                      onClick={() => setActivePhotoUrl(ph.url)}
                      className="group relative h-28 rounded-2xl overflow-hidden border border-white/5 hover:border-[#FF2D55] transition-all bg-zinc-950 text-center animate-in fade-in duration-300"
                    >
                      <img src={ph.url} alt={ph.label} className="w-full h-full object-cover opacity-60 group-hover:opacity-95 transition-all group-hover:scale-105" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2 text-left">
                        <span className="text-[7.5px] font-black text-white uppercase tracking-tight leading-tight">{ph.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Itemized Budget approval block */}
              <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] text-left space-y-6">
                <span className="text-[9px] font-black tracking-widest text-[#FF2D55] uppercase italic flex items-center gap-2">
                  <FileText size={14} /> DETALHAMENTO DE PEÇAS & MÃO DE OBRA
                </span>
                
                <table className="w-full text-[10px] text-zinc-400">
                  <thead>
                    <tr className="border-b border-white/10 uppercase tracking-widest font-black text-[9px] text-zinc-500">
                      <th className="py-2.5 text-left">Especificação</th>
                      <th className="py-2.5 text-center">Qtde</th>
                      <th className="py-2.5 text-right">Preço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackingOrder.items.map((it, iIdx) => (
                      <tr key={iIdx} className="border-b border-white/5">
                        <td className="py-3 font-black text-white uppercase italic">{it.description}</td>
                        <td className="py-3 text-center text-zinc-300 font-extrabold">{it.quantity}</td>
                        <td className="py-3 text-right text-zinc-300 font-extrabold">R$ {(it.quantity * it.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {trackingOrder.laborValue > 0 && (
                      <tr className="border-b border-white/5">
                        <td className="py-3 font-black text-white uppercase italic">SMR - Mão de Obra Consultiva Especializada</td>
                        <td className="py-3 text-center text-zinc-300 font-extrabold">1</td>
                        <td className="py-3 text-right text-zinc-300 font-extrabold">R$ {trackingOrder.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Subtotals & Total info */}
                <div className="pt-4 flex justify-between items-center bg-black/40 p-5 rounded-2xl border border-white/5">
                  <div>
                    <span className="text-[8px] text-zinc-500 block uppercase tracking-widest font-sans">VALOR GERAL ATUALIZADO</span>
                    <p className="text-xs font-semibold text-zinc-400">Sujeito a garantia e nota homologada de 90 dias.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-[#FF2D55] italic tracking-tighter">
                      R$ {trackingOrder.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Signature actions checklist */}
                {trackingOrder.status !== OSStatus.EM_ANDAMENTO && trackingOrder.status !== OSStatus.FINALIZADO ? (
                  <div className="pt-4 flex flex-col sm:flex-row gap-4">
                    <button 
                      type="button"
                      onClick={() => setShowSignModal(true)}
                      className="flex-1 bg-[#FF2D55] text-white py-4 rounded-xl font-black uppercase text-[10.5px] tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all italic text-center"
                    >
                      ✓ REVISAR E ASSINAR ORÇAMENTO DIGITALMENTE
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        window.open(`https://wa.me/5511987654321?text=${encodeURIComponent(`Olá! Gostaria de esclarecer dúvidas sobre o orçamento do veículo placa ${trackingOrder.vehiclePlate}`)}`, '_blank')
                      }}
                      className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-4 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest border border-white/10 transition-all italic"
                    >
                      SOLICITAR AJUDA DO TÉCNICO
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-center p-5 rounded-2xl space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest block leading-none">✓ AUTORIZAÇÃO DE EXECUÇÃO DETECTADA COM SUCESSO</span>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                      Esta Ordem de Serviço foi autorizada digitalmente via canais eletrônicos integrados. Os mecânicos estão operando o reparo ativamente no pátio.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SEÇÃO INFORMATIVA: TECNOLOGIA */}
      <section id="tecnologia" className="py-40 px-8 bg-[#050505] border-y border-white/5 relative">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-32 items-center">
            <div className="space-y-12 text-left">
               <p className="text-[#FF2D55] font-black uppercase tracking-[0.5em] text-[11px] italic">NOSSA ENGENHARIA</p>
               <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">PRECISÃO<br/>ABSOLUTA</h2>
               <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest leading-relaxed italic">
                  Utilizamos protocolos de manutenção europeus para garantir que cada sensor, componente e ajuste do seu veículo opere em perfeita harmonia.
               </p>
               <div className="grid grid-cols-1 gap-10">
                  <div className="flex items-start gap-6 group">
                     <div className="p-4 bg-white/5 rounded-2xl text-[#FF2D55] border border-white/5 group-hover:bg-[#FF2D55] group-hover:text-white transition-all"><Zap size={24}/></div>
                     <div>
                        <p className="text-sm font-black uppercase tracking-widest italic text-white mb-2">Checklist Digital V26</p>
                        <p className="text-[11px] text-zinc-600 font-bold uppercase tracking-tight leading-relaxed">Inspeção completa em 120 pontos críticos com relatório fotográfico enviado diretamente para seu WhatsApp.</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-6 group">
                     <div className="p-4 bg-white/5 rounded-2xl text-[#FF2D55] border border-white/5 group-hover:bg-[#FF2D55] group-hover:text-white transition-all"><ShieldCheck size={24}/></div>
                     <div>
                        <p className="text-sm font-black uppercase tracking-widest italic text-white mb-2">Garantia Blindada</p>
                        <p className="text-[11px] text-zinc-600 font-bold uppercase tracking-tight leading-relaxed">Segurança total em cada peça instalada e serviço executado, com rastreabilidade completa via nuvem.</p>
                     </div>
                  </div>
               </div>
            </div>
            <div className="relative group">
               <div className="absolute inset-0 bg-[#FF2D55]/20 rounded-[4rem] blur-[120px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>
               <div className="relative bg-zinc-900/40 border border-white/10 p-16 rounded-[4.5rem] flex flex-col gap-12 backdrop-blur-3xl">
                  <div className="p-12 bg-black/40 rounded-[3rem] border border-white/5">
                     <p className="text-7xl font-black italic tracking-tighter text-[#FF2D55] mb-2 leading-none">100%</p>
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic text-center">Transparência Técnica</p>
                  </div>
                  <div className="p-12 bg-black/40 rounded-[3rem] border border-white/5">
                     <p className="text-7xl font-black italic tracking-tighter text-white mb-2 leading-none">+5k</p>
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic text-center">Clientes Satisfeitos</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* FOOTER */}
      <footer className="py-32 px-8 border-t border-white/5 bg-black">
         <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-12">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-[#FF2D55] rounded-2xl flex items-center justify-center shadow-lg">
                  <Wrench size={28} className="text-white" />
               </div>
               <span className="text-3xl font-black italic uppercase tracking-tighter">KAEN</span>
            </div>
            <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.8em] italic">
               PRECISION • PERFORMANCE • BEYOND LIMITS • 2024
            </p>
         </div>
      </footer>

      {/* MODAL DE AGENDAMENTO */}
      {showBooking && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="w-full max-w-2xl bg-[#0a0a0b] border border-white/10 p-14 rounded-[4.5rem] shadow-2xl relative">
              <button onClick={() => setShowBooking(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-white transition-all"><X size={44}/></button>
              
              <div className="text-center mb-14">
                 <h2 className="text-5xl font-black italic uppercase tracking-tighter text-[#FF2D55] mb-3 leading-none">AGENDAMENTO</h2>
                 <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest italic">Reserve seu lugar no protocolo de elite KAEN</p>
              </div>

              <form onSubmit={handleBooking} className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-6 italic text-left block">Nome Completo</label>
                    <input required type="text" placeholder="EX: RAFAEL ENZO" value={bookingForm.name} onChange={(e) => setBookingForm({...bookingForm, name: e.target.value.toUpperCase()})} className="w-full bg-zinc-950 border border-white/5 rounded-3xl px-10 py-6 text-white text-sm font-black uppercase outline-none focus:border-[#FF2D55] transition-all"/>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6 text-left">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-6 italic">WhatsApp</label>
                       <input required type="tel" placeholder="(11) 99999-9999" value={bookingForm.phone} onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})} className="w-full bg-zinc-950 border border-white/5 rounded-3xl px-10 py-6 text-white text-sm font-black outline-none focus:border-[#FF2D55] transition-all"/>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-6 italic">Seu Veículo</label>
                       <input required type="text" placeholder="EX: BMW M3" value={bookingForm.vehicle} onChange={(e) => setBookingForm({...bookingForm, vehicle: e.target.value.toUpperCase()})} className="w-full bg-zinc-950 border border-white/5 rounded-3xl px-10 py-6 text-white text-sm font-black uppercase outline-none focus:border-[#FF2D55] transition-all"/>
                    </div>
                 </div>

                 <button type="submit" className="w-full bg-[#FF2D55] py-9 rounded-[3rem] font-black uppercase text-sm tracking-[0.5em] italic shadow-2xl active:scale-95 transition-all mt-6">Confirmar Agendamento</button>
               </form>

               {/* SIGNATURE MODAL */}
               {showSignModal && trackingOrder && (
                 <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
                   <div className="w-full max-w-lg bg-[#0c0c0e] border border-white/10 p-10 rounded-[3.5rem] shadow-2xl relative text-center">
                     <button type="button" onClick={() => setShowSignModal(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-all"><X size={32}/></button>
                     
                     <div className="mb-8">
                       <span className="text-[#FF2D55] font-black text-[9px] uppercase tracking-[0.4em] block mb-2">VALIDAÇÃO ELETRÔNICA</span>
                       <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter">ASSINATURA DO CLIENTE</h3>
                       <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{trackingOrder.vehicleModel} • PLACA {trackingOrder.vehiclePlate}</p>
                     </div>

                     <div className="space-y-6">
                       <p className="text-[11px] text-zinc-400 font-medium leading-relaxed font-sans">
                         Ao assinar com seu nome completo abaixo, você declara autorizar a execução das peças e mão de obra descritas no orçamento técnico em conformidade com as diretrizes da oficina.
                       </p>

                       <div className="space-y-3 text-left">
                         <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block ml-6">Nome Completo do Responsável</label>
                         <input 
                           type="text"
                           required
                           placeholder="EX: CLAUDIO S. VALENÇA"
                           value={clientSignature}
                           onChange={(e) => setClientSignature(e.target.value.toUpperCase())}
                           className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-xs text-white placeholder-zinc-805 font-black uppercase outline-none focus:border-[#FF2D55] transition-all"
                         />
                       </div>

                       {approvalSuccess ? (
                         <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] p-4 rounded-xl font-bold uppercase tracking-widest animate-in zoom-in duration-300">
                           ✓ ORÇAMENTO AUTORIZADO E ENVIADO COM SUCESSO!
                         </div>
                       ) : (
                         <button 
                           type="button"
                           disabled={isSubmittingApproval || !clientSignature.trim()}
                           onClick={handleApproveBudget}
                           className="w-full bg-[#FF2D55] text-white py-5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                         >
                           {isSubmittingApproval ? <RefreshCw className="animate-spin" size={16} /> : null}
                           <span>CONFIRMAR ASSINATURA ELETRÔNICA</span>
                         </button>
                       )}
                     </div>
                   </div>
                 </div>
               )}

               {/* FULLSCREEN PHOTO ZOOM MODAL */}
               {activePhotoUrl && (
                 <div className="fixed inset-0 z-[270] flex items-center justify-center p-4 bg-black/99 backdrop-blur-3xl animate-in fade-in duration-200">
                   <div className="relative max-w-3xl w-full h-full max-h-[85vh] flex flex-col items-center justify-center">
                     <button 
                       type="button"
                       onClick={() => setActivePhotoUrl(null)} 
                       className="absolute -top-14 right-0 text-zinc-400 hover:text-white transition-all text-[11px] font-black flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2.5"
                     >
                       <X size={16} /> FECHAR VISUALIZAÇÃO
                     </button>
                     <img src={activePhotoUrl} alt="Enlarged Diagnostics View" className="w-full h-full object-contain rounded-3xl border border-white/10 shadow-2xl" />
                   </div>
                 </div>
               )}
           </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
