
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, Wrench, ShieldCheck, Clock, 
  Car, Star, Calendar, MessageCircle, MapPin, 
  ArrowRight, Smartphone, CheckCircle2, ChevronRight,
  Settings, UserCheck, Activity, BarChart3, Info,
  Search, Shield, Zap, Camera, FileText, Check, AlertCircle, RefreshCw,
  Sparkles, Layers, ExternalLink, Award, CheckCircle, ChevronDown, Flame
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showBooking, setShowBooking] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
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
                  <button onClick={() => navigate('/login')} className="flex items-center gap-5 group text-left">
                     <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-all border border-white/5">
                        <FileText size={24}/>
                     </div>
                     <div>
                        <p className="font-black uppercase italic tracking-tighter text-sm">Dossiê do Projeto</p>
                        <p className="text-[9px] text-zinc-500 uppercase font-bold">Plano Oficial & PDF</p>
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

      {/* NAVBAR FLUTUANTE ULTRA-CLEAN */}
      <div className="fixed top-4 left-0 w-full z-[100] px-4 sm:px-8 flex justify-center">
        <nav className="w-full max-w-7xl glass-nav rounded-full px-5 sm:px-8 py-3.5 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF4D2D] to-[#FF2D55] rounded-xl flex items-center justify-center shadow-lg border border-white/20">
              <Wrench size={20} className="text-white" />
            </div>
            <div>
              <span className="font-display text-xl font-black tracking-tight text-white block leading-none">KAEN</span>
              <span className="text-[8px] font-extrabold text-zinc-400 uppercase tracking-[0.2em] block">AUTO MECÂNICA</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-[12px] font-bold text-white hover:text-[#FF4D2D] transition-colors relative py-1">
              Início
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF4D2D] rounded-full"></span>
            </button>
            <a href="#sobre" className="text-[12px] font-medium text-zinc-400 hover:text-white transition-colors">Sobre Nós</a>
            <a href="#servicos" className="text-[12px] font-medium text-zinc-400 hover:text-white transition-colors">Serviços</a>
            <button onClick={() => navigate('/login')} className="text-[12px] font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
              <span>Dossiê Oficial</span>
            </button>
            <button 
              onClick={() => setShowVersionsModal(true)} 
              className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 px-3 py-1 rounded-full transition-all flex items-center gap-1.5"
            >
              <Sparkles size={12} />
              <span>v2.6.4</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowBooking(true)}
              className="bg-gradient-to-r from-[#FF5E36] to-[#FF2D55] text-white px-6 sm:px-8 py-2.5 rounded-full font-bold text-xs sm:text-sm tracking-wide shadow-[0_10px_25px_rgba(255,77,45,0.4)] active:scale-95 transition-all hover:opacity-95 flex items-center gap-2"
            >
              <span>Agende uma Visita</span>
              <ArrowRight size={14} />
            </button>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-11 h-11 glass-card rounded-full flex items-center justify-center text-white hover:border-[#FF2D55] transition-all group"
              title="Acessar Sistema"
            >
              <Menu size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </nav>
      </div>

      {/* SEÇÃO HERO CINEMÁTICA ESTILO CASA NOVA */}
      <section className="relative min-h-screen flex flex-col justify-between pt-36 pb-16 px-4 sm:px-8 overflow-hidden">
        {/* FOTOGRAFIA CINEMÁTICA DE FUNDO COM OVERLAYS SUTIS */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/kaen_auto_mecanica_1788564247450.jpg" 
            alt="Auto Mecânica Kaen - Oficina Especializada em Registro SP" 
            className="w-full h-full object-cover object-center scale-105 animate-in fade-in zoom-in-95 duration-1000"
            referrerPolicy="no-referrer"
          />
          {/* Gradients para contraste perfeito */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-transparent to-black/60" />
        </div>
        
        {/* TIPOGRAFIA GIGANTE EM DESTAQUE NO TOPO (ESTILO "CASA NOVA") */}
        <div className="relative z-10 w-full text-center mt-6 md:mt-12 pointer-events-none">
          <h1 className="font-display font-black text-[22vw] md:text-[14.5rem] tracking-tight leading-none uppercase select-none bg-gradient-to-b from-[#FFA751] via-[#FF5E36] to-[#E61F48] bg-clip-text text-transparent drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] opacity-95">
            KAEN
          </h1>
        </div>

        {/* CONTAINER INFERIOR: OVERLAY ESQUERDO + CARDS FLUTUANTES DIREITO */}
        <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mt-auto pt-12">
          
          {/* BOTTOM LEFT: HEADLINE + TEXTO DESCRITIVO + PROVA SOCIAL */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
              Descubra uma mecânica selecionada com sofisticação e precisão.
            </h2>
            <p className="text-sm sm:text-base text-zinc-200 font-medium leading-relaxed max-w-xl drop-shadow">
              Na Auto Mecânica Kaen, conectamos você aos melhores padrões de engenharia automotiva para <strong className="text-[#FF7A50] font-bold">viver e acelerar</strong> com segurança total.
            </p>

            {/* AVATAR SOCIAL PROOF (IGUAL À IMAGEM DE REFERÊNCIA) */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex -space-x-3 items-center">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" 
                  alt="Cliente Kaen" 
                  className="w-11 h-11 rounded-full object-cover border-2 border-black shadow-lg"
                  referrerPolicy="no-referrer"
                />
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120" 
                  alt="Cliente Kaen" 
                  className="w-11 h-11 rounded-full object-cover border-2 border-black shadow-lg"
                  referrerPolicy="no-referrer"
                />
                <img 
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120" 
                  alt="Cliente Kaen" 
                  className="w-11 h-11 rounded-full object-cover border-2 border-black shadow-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <p className="text-sm font-extrabold text-white leading-tight flex items-center gap-1.5">
                  <span>+2.500 Clientes Satisfeitos</span>
                  <span className="text-amber-400">★★★★★</span>
                </p>
                <p className="text-[11px] text-zinc-300 font-medium">Registro/SP • Rua Joaquim Marques Alves, 765</p>
              </div>
            </div>
          </div>

          {/* BOTTOM RIGHT: CARD INFORMATIVO COM LOCALIZAÇÃO E CONTATO */}
          <div className="lg:col-span-5 flex flex-col gap-3 w-full sm:max-w-md lg:ml-auto">
            
            {/* CARD BRANCO/TRANSLÚCIDO COM LOCALIZAÇÃO */}
            <div className="bg-white text-zinc-900 p-6 rounded-3xl shadow-2xl space-y-4 text-left border border-white/60">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-extrabold text-xl text-black tracking-tight leading-tight">Auto Mecânica Kaen</h3>
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
                    Aberto Hoje
                  </span>
                </div>
                <p className="text-xs text-zinc-600 font-semibold">Rua Joaquim Marques Alves, 765</p>
                <p className="text-[11px] text-zinc-400 font-medium">Centro / Registro, São Paulo - SP</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                <button 
                  onClick={() => setShowBooking(true)}
                  className="flex-1 bg-gradient-to-r from-[#FF5E36] to-[#FF2D55] text-white py-3.5 px-4 rounded-xl font-black uppercase text-[11px] tracking-wider shadow-md hover:opacity-95 active:scale-95 transition-all text-center cursor-pointer"
                >
                  Agendar Visita
                </button>
                <a 
                  href="https://maps.google.com/?q=Rua+Joaquim+Marques+Alves+765+Registro+SP" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 py-3.5 px-4 rounded-xl font-extrabold text-[11px] transition-all flex items-center justify-center gap-1.5"
                  title="Ver no Google Maps"
                >
                  <MapPin size={14} className="text-[#FF4D2D]" />
                  <span>Mapa</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SEÇÃO SOBRE NÓS: ALTA ENGENHARIA AUTOMOTIVA */}
      <section id="sobre" className="py-28 px-4 sm:px-8 bg-zinc-950 border-t border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 text-left">
            <span className="text-[#FF4D2D] font-extrabold uppercase tracking-[0.3em] text-xs">A OFICINA • PADRÃO HOMOLOGADO</span>
            <h2 className="font-display text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              Excelência, precisão e respeito pelo seu veículo.
            </h2>
            <p className="text-zinc-300 font-medium text-sm sm:text-base leading-relaxed">
              Fundada em Registro/SP, a Auto Mecânica Kaen estabeleceu um novo patamar técnico na região. Aliamos diagnóstico computadorizado de padrão internacional a uma postura de absoluta honestidade e transparência com o cliente.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-zinc-900/60 border border-white/5 p-5 rounded-2xl">
                <p className="text-3xl font-display font-black text-[#FF4D2D]">100%</p>
                <p className="text-xs font-bold text-zinc-300 mt-1">Laudos Fotográficos</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Você vê cada detalhe antes de autorizar.</p>
              </div>
              <div className="bg-zinc-900/60 border border-white/5 p-5 rounded-2xl">
                <p className="text-3xl font-display font-black text-white">90 Dias</p>
                <p className="text-xs font-bold text-zinc-300 mt-1">Garantia Técnica Kaen</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Em peças homologadas e mão de obra.</p>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 sm:p-10 shadow-2xl space-y-6 text-left">
              <div className="w-14 h-14 rounded-2xl bg-[#FF4D2D]/10 border border-[#FF4D2D]/30 flex items-center justify-center text-[#FF4D2D]">
                <MapPin size={28} />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-black text-[#FF4D2D] uppercase tracking-widest block">REGISTRO / SP</span>
                <h4 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Rua Joaquim Marques Alves, 765</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Atendimento especializado de segunda a sexta, das 08h às 18h.
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-3 text-xs text-zinc-300">
                  <Clock size={16} className="text-[#FF4D2D] shrink-0" />
                  <span>Horário: Segunda a Sexta, das 08h às 18h</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-300">
                  <ShieldCheck size={16} className="text-[#FF4D2D] shrink-0" />
                  <span>Oficina credenciada com diagnósticos computadorizados e laudos técnicos</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-3">
                <a 
                  href="https://maps.google.com/?q=Rua+Joaquim+Marques+Alves+765+Registro+SP" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/15 text-white py-3 px-5 rounded-xl font-bold text-xs flex items-center gap-2 border border-white/10 transition-all"
                >
                  <MapPin size={14} className="text-[#FF4D2D]" />
                  <span>Ver Rota no Google Maps</span>
                </a>
                <button
                  onClick={() => setShowBooking(true)}
                  className="bg-[#FF4D2D] hover:bg-[#ff3814] text-white py-3 px-5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#FF4D2D]/20 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Agendar Atendimento</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO SERVIÇOS ESPECIALIZADOS */}
      <section id="servicos" className="py-28 px-4 sm:px-8 bg-black border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[#FF4D2D] font-extrabold uppercase tracking-[0.3em] text-xs">PORTFÓLIO DE ESPECIALIDADES</span>
            <h2 className="font-display text-4xl sm:text-5xl font-black text-white tracking-tight">O Que Fazemos de Melhor</h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed">
              Equipamentos de telemetria e calibração computadorizada para veículos nacionais, importados e esportivos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              {
                title: "Diagnóstico Eletrônico",
                desc: "Varredura completa por scanner automotivo dedicado, leitura de falhas de injeção, sensores e calibração de módulos.",
                icon: Zap,
                badge: "Scanner Avançado"
              },
              {
                title: "Revisão Preventiva & SMR",
                desc: "Checklist com 120 itens, troca de fluidos por especificação de montadora, correias e filtros.",
                icon: ShieldCheck,
                badge: "Homologado"
              },
              {
                title: "Freios & Suspensão",
                desc: "Substituição de pastilhas cerâmicas, discos de freio, amortecedores, buchas e alinhamento de alta precisão.",
                icon: Wrench,
                badge: "Segurança Total"
              },
              {
                title: "Câmbio & Transmissão",
                desc: "Troca completa do fluido de transmissão automática por diálise computadorizada com filtro original.",
                icon: Activity,
                badge: "Diálise 100%"
              }
            ].map((srv, idx) => {
              const IconComp = srv.icon;
              return (
                <div key={idx} className="bg-zinc-950/80 border border-white/5 hover:border-[#FF4D2D]/40 p-6 rounded-3xl transition-all duration-300 flex flex-col justify-between group">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="w-12 h-12 bg-white/5 group-hover:bg-[#FF4D2D] text-white rounded-2xl flex items-center justify-center transition-all">
                        <IconComp size={22} />
                      </div>
                      <span className="text-[9px] font-bold text-zinc-400 bg-white/5 px-2.5 py-1 rounded-full">{srv.badge}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-[#FF4D2D] transition-colors">{srv.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">{srv.desc}</p>
                  </div>
                  <button 
                    onClick={() => setShowBooking(true)}
                    className="mt-6 text-[11px] font-bold text-[#FF4D2D] flex items-center gap-1.5 hover:gap-2.5 transition-all group-hover:underline"
                  >
                    <span>Solicitar Orçamento</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-4 sm:px-8 border-t border-white/5 bg-zinc-950">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-gradient-to-br from-[#FF4D2D] to-[#FF2D55] rounded-2xl flex items-center justify-center shadow-lg">
                  <Wrench size={24} className="text-white" />
               </div>
               <div>
                  <span className="font-display text-2xl font-black text-white">KAEN</span>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Auto Mecânica de Precisão • Registro/SP</p>
               </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-xs text-zinc-400 font-medium">
               <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors">Início</button>
               <a href="#sobre" className="hover:text-white transition-colors">Sobre</a>
               <a href="#servicos" className="hover:text-white transition-colors">Serviços</a>
               <button onClick={() => setShowBooking(true)} className="hover:text-white transition-colors">Agendar</button>
               <button onClick={() => setShowVersionsModal(true)} className="hover:text-[#FF4D2D] transition-colors font-bold text-amber-400">Versões (v2.6.4)</button>
               <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Painel Interno</button>
            </div>

            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
               © {new Date().getFullYear()} AUTO MECÂNICA KAEN • TODOS OS DIREITOS RESERVADOS
            </p>
         </div>
      </footer>

      {/* MODAL DE AGENDAMENTO */}
      {showBooking && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
           <div className="w-full max-w-xl bg-zinc-950 border border-white/10 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative">
              <button onClick={() => setShowBooking(false)} className="absolute top-8 right-8 text-zinc-400 hover:text-white transition-all">
                <X size={28}/>
              </button>
              
              <div className="text-center mb-8">
                 <span className="text-[#FF4D2D] font-black text-[10px] uppercase tracking-[0.3em] block mb-1">ATENDIMENTO KAEN</span>
                 <h2 className="font-display text-3xl font-black text-white">Agendar Revisão</h2>
                 <p className="text-xs text-zinc-400 font-medium mt-1">Reserve seu horário com os nossos especialistas técnicos</p>
              </div>

              <form onSubmit={handleBooking} className="space-y-4">
                 <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block ml-2">Nome Completo</label>
                    <input required type="text" placeholder="EX: RAFAEL SILVA" value={bookingForm.name} onChange={(e) => setBookingForm({...bookingForm, name: e.target.value.toUpperCase()})} className="w-full bg-black border border-white/10 rounded-xl px-5 py-3.5 text-white text-xs font-bold uppercase outline-none focus:border-[#FF4D2D] transition-all"/>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block ml-2">WhatsApp</label>
                       <input required type="tel" placeholder="(11) 99999-9999" value={bookingForm.phone} onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-5 py-3.5 text-white text-xs font-bold outline-none focus:border-[#FF4D2D] transition-all"/>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block ml-2">Veículo / Modelo</label>
                       <input required type="text" placeholder="EX: HONDA CIVIC 2.0" value={bookingForm.vehicle} onChange={(e) => setBookingForm({...bookingForm, vehicle: e.target.value.toUpperCase()})} className="w-full bg-black border border-white/10 rounded-xl px-5 py-3.5 text-white text-xs font-bold uppercase outline-none focus:border-[#FF4D2D] transition-all"/>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block ml-2">Data Desejada</label>
                       <input required type="date" value={bookingForm.date} onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-5 py-3.5 text-white text-xs font-bold outline-none focus:border-[#FF4D2D] transition-all"/>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block ml-2">Horário Preferencial</label>
                       <input required type="time" value={bookingForm.time} onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-5 py-3.5 text-white text-xs font-bold outline-none focus:border-[#FF4D2D] transition-all"/>
                    </div>
                 </div>

                 <button type="submit" className="w-full bg-gradient-to-r from-[#FF5E36] to-[#FF2D55] text-white py-4 rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg hover:opacity-95 active:scale-95 transition-all mt-4">
                   Confirmar Agendamento no WhatsApp ↗
                 </button>
               </form>
           </div>
        </div>
      )}

      {/* MODAL DE VERSÕES DO SISTEMA (VERSÕES ETC) */}
      {showVersionsModal && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-zinc-950 border border-white/10 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl relative max-h-[88vh] overflow-y-auto">
            <button onClick={() => setShowVersionsModal(false)} className="absolute top-8 right-8 text-zinc-400 hover:text-white transition-all">
              <X size={26}/>
            </button>

            <div className="text-left mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">SISTEMA ATUALIZADO</span>
              </div>
              <h3 className="font-display text-3xl font-black text-white tracking-tight">Arquitetura & Versões do Sistema</h3>
              <p className="text-xs text-zinc-400 font-medium mt-1">
                Histórico de releases oficiais e funcionalidades implementadas no software da Auto Mecânica Kaen.
              </p>
            </div>

            <div className="space-y-6 text-left">
              {[
                {
                  version: "v2.6.4 (Release Atual)",
                  date: "Setembro 2026",
                  highlight: true,
                  title: "Design Cinemático & Experiência de Luxo",
                  items: [
                    "Novo visual inspirado em arquitetura de alto padrão com fotos em alta resolução da oficina.",
                    "Tipografia display Outfit e Plus Jakarta Sans com contraste matemático.",
                    "Cards flutuantes de box com efeito vidro (glassmorphism) e tags 'Em Destaque'.",
                    "Prova social com +2.500 clientes atendidos e avaliação 5 estrelas em Registro/SP."
                  ]
                },
                {
                  version: "v2.6.0",
                  date: "Agosto 2026",
                  highlight: false,
                  title: "Dossiê Executivo Oficial & Gerador de PDF",
                  items: [
                    "Inclusão dos 23 Capítulos Estratégicos de padronização mecânica.",
                    "Compilação de Laudo Técnico e Orçamento em PDF A4 sem corte de margens.",
                    "Marca oficial unificada exclusivamente como 'AUTO MECÂNICA KAEN'."
                  ]
                },
                {
                  version: "v2.5.0",
                  date: "Julho 2026",
                  highlight: false,
                  title: "Sincronização em Tempo Real (SSE) & Presença",
                  items: [
                    "Canal Server-Sent Events (SSE) sem travar requisições de banco.",
                    "Rastreamento de operadores conectados em simultâneo (Dono + Recepção + Pista).",
                    "Atualização automática de status de veículos sem precisar recarregar a tela."
                  ]
                },
                {
                  version: "v2.0.0",
                  date: "Junho 2026",
                  highlight: false,
                  title: "Portal do Cliente & Assinatura Eletrônica",
                  items: [
                    "Consulta pública da Ordem de Serviço por placa do veículo.",
                    "Visualização de fotos de componentes avariados registradas no elevador.",
                    "Assinatura digital e autorização de orçamento com validade legal via smartphone."
                  ]
                },
                {
                  version: "v1.5.0",
                  date: "Maio 2026",
                  highlight: false,
                  title: "Terminal Móvel de Pista (PWA)",
                  items: [
                    "Layout otimizado para celulares e tablets dos mecânicos no pátio.",
                    "Checklist semafórico ágil (Verde, Amarelo, Vermelho) para agilizar diagnósticos."
                  ]
                },
                {
                  version: "v1.0.0",
                  date: "Março 2026",
                  highlight: false,
                  title: "Núcleo Operacional Kaen",
                  items: [
                    "Controle de clientes, veículos, estoque com alerta mínimo e fluxo de caixa DRE."
                  ]
                }
              ].map((ver, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border ${ver.highlight ? 'bg-[#FF4D2D]/5 border-[#FF4D2D]/30' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-black uppercase tracking-wider ${ver.highlight ? 'text-[#FF4D2D]' : 'text-zinc-300'}`}>
                      {ver.version}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold">{ver.date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">{ver.title}</h4>
                  <ul className="space-y-1.5 text-xs text-zinc-400 font-medium">
                    {ver.items.map((it, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2">
                        <span className="text-[#FF4D2D] font-bold">•</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                BUILD: 2026.09-REV4 • HOST: CLOUD RUN DEDICADO
              </span>
              <button 
                onClick={() => setShowVersionsModal(false)}
                className="bg-white text-black text-xs font-black uppercase tracking-wider px-6 py-2.5 rounded-xl hover:bg-zinc-200 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
