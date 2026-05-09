
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, Wrench, ShieldCheck, Clock, 
  Car, Star, Calendar, MessageCircle, MapPin, 
  ArrowRight, Smartphone, CheckCircle2, ChevronRight,
  Settings, UserCheck, Activity, BarChart3, Info,
  Search, Shield, Zap
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showBooking, setShowBooking] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
           <button className="px-24 py-9 bg-zinc-900 text-white rounded-[3.5rem] font-black uppercase text-xs tracking-[0.4em] italic hover:bg-white/10 border border-white/5 transition-all">
             Conhecer Serviços
           </button>
        </div>

        <div className="mt-32 flex flex-wrap justify-center gap-16 md:gap-24 text-zinc-700 font-black text-[11px] uppercase tracking-[0.5em] italic opacity-50">
           <div className="flex flex-col items-center gap-5"><Settings size={32}/> Diagnóstico Scanner</div>
           <div className="flex flex-col items-center gap-5"><Shield size={32}/> Garantia Kaen</div>
           <div className="flex flex-col items-center gap-5"><Clock size={32}/> Entrega Expressa</div>
           <div className="flex flex-col items-center gap-5"><Activity size={32}/> Performance</div>
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
           </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
