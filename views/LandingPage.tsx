
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
import KaenLogo from '../components/KaenLogo';
import { saveWorkshopFieldToCloud } from '../src/lib/firebase';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showBooking, setShowBooking] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    name: '', phone: '', vehicle: '', date: '', time: '', service: 'Revisão Preventiva'
  });

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = `Olá! Sou ${bookingForm.name}. Vi o site da Kaen e gostaria de agendar um(a) ${bookingForm.service} para o dia ${bookingForm.date} às ${bookingForm.time} no meu ${bookingForm.vehicle}.`;
    const phone = '5513996892958'; 
    
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
    const updatedApps = [...savedApps, newApp];
    localStorage.setItem('kaen_appointments', JSON.stringify(updatedApps));

    // Persist immediately to cloud endpoints and Firestore
    try {
      await fetch('/api/public/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp)
      });
    } catch (err) {
      console.warn("Cloud appointment sync fallback:", err);
    }
    try {
      await saveWorkshopFieldToCloud('kaenpro_rafael_appointments', updatedApps);
      await saveWorkshopFieldToCloud('kaen_appointments', updatedApps);
    } catch (err) {
      // offline fallback
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    setShowBooking(false);
  };

  return (
    <div className="bg-black text-white min-h-screen selection:bg-[#FF2D55] selection:text-white font-['Inter'] overflow-x-hidden">
      
      {/* BACKDROP DO MENU MOBILE */}
      {isMenuOpen && (
        <div 
          onClick={() => setIsMenuOpen(false)} 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[190] animate-in fade-in duration-300" 
          aria-hidden="true"
        />
      )}

      {/* MENU LATERAL (DRAWER) COM NAVEGAÇÃO COMPLETA */}
      <div className={`fixed inset-y-0 right-0 z-[200] w-[85vw] max-w-[340px] glass-card border-l border-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto ${isMenuOpen ? 'translate-x-0 shadow-[-50px_0_100px_rgba(0,0,0,0.9)]' : 'translate-x-full'}`}>
        <div>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <KaenLogo variant="horizontal" className="h-7 w-auto" />
            <button 
              onClick={() => setIsMenuOpen(false)} 
              className="p-2 hover:text-[#FF2D55] transition-colors rounded-xl bg-white/5 hover:bg-white/10 active:scale-95" 
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3">NAVEGAÇÃO DO SITE</p>
              <nav className="flex flex-col gap-2">
                <button 
                  onClick={() => { setIsMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-left text-sm font-bold text-white transition-all"
                >
                  <span>Início</span>
                  <ArrowRight size={14} className="text-zinc-500" />
                </button>
                <a 
                  href="#sobre" 
                  onClick={() => setIsMenuOpen(false)} 
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-left text-sm font-bold text-zinc-300 hover:text-white transition-all"
                >
                  <span>Sobre Nós</span>
                  <ArrowRight size={14} className="text-zinc-500" />
                </a>
                <a 
                  href="#servicos" 
                  onClick={() => setIsMenuOpen(false)} 
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-left text-sm font-bold text-zinc-300 hover:text-white transition-all"
                >
                  <span>Serviços Especializados</span>
                  <ArrowRight size={14} className="text-zinc-500" />
                </a>
                <button 
                  onClick={() => { setIsMenuOpen(false); setShowBooking(true); }} 
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FF4D2D]/15 border border-[#FF4D2D]/30 text-left text-sm font-black text-[#FF4D2D] hover:bg-[#FF4D2D] hover:text-white transition-all mt-1"
                >
                  <span>Agendar Atendimento</span>
                  <Calendar size={15} />
                </button>
              </nav>
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3">ÁREA OPERACIONAL</p>
              <nav className="flex flex-col gap-2.5">
                <button 
                  onClick={() => { setIsMenuOpen(false); navigate('/login'); }} 
                  className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-white/5 text-left group transition-all"
                >
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-[#FF2D55] text-white transition-all shrink-0">
                    <UserCheck size={18}/>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-white leading-tight">Painel Administrativo</p>
                    <p className="text-[9px] text-zinc-500 font-semibold">Login Dono & Recepção</p>
                  </div>
                </button>
                <button 
                  onClick={() => { setIsMenuOpen(false); navigate('/terminal'); }} 
                  className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-white/5 text-left group transition-all"
                >
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-blue-600 text-white transition-all shrink-0">
                    <Smartphone size={18}/>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-white leading-tight">Terminal Mecânico</p>
                    <p className="text-[9px] text-zinc-500 font-semibold">Lançamento de Pista</p>
                  </div>
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5">
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">
            AUTO MECÂNICA KAEN<br/>REGISTRO - SÃO PAULO
          </p>
        </div>
      </div>

      {/* NAVBAR FLUTUANTE ULTRA-CLEAN E 100% RESPONSIVA */}
      <div className="fixed top-3 sm:top-4 left-0 w-full z-[100] px-3 sm:px-8 flex justify-center">
        <nav className="w-full max-w-7xl glass-nav rounded-full px-3.5 sm:px-8 py-2.5 sm:py-3.5 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <KaenLogo variant="horizontal" className="h-7 sm:h-9 md:h-10 w-auto" />
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

          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setShowBooking(true)}
              className="bg-gradient-to-r from-[#FF5E36] to-[#FF2D55] text-white px-3 sm:px-7 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm tracking-wide shadow-[0_10px_25px_rgba(255,77,45,0.4)] active:scale-95 transition-all hover:opacity-95 flex items-center gap-1.5 sm:gap-2 shrink-0"
            >
              <span className="hidden sm:inline">Agende uma Visita</span>
              <span className="sm:hidden">Agendar</span>
              <ArrowRight size={13} className="shrink-0" />
            </button>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-9 h-9 sm:w-11 sm:h-11 glass-card rounded-full flex items-center justify-center text-white hover:border-[#FF2D55] transition-all group shrink-0"
              title="Acessar Menu"
              aria-label="Abrir Menu"
            >
              <Menu size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </nav>
      </div>

      {/* SEÇÃO HERO CINEMÁTICA ESTILO CASA NOVA */}
      <section className="relative min-h-[92vh] sm:min-h-screen flex flex-col justify-between pt-24 sm:pt-36 pb-12 sm:pb-16 px-4 sm:px-8 overflow-hidden">
        {/* FOTOGRAFIA CINEMÁTICA DE FUNDO COM OVERLAYS SUTIS */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/kaen_auto_mecanica_1788564247450.jpg" 
            alt="Auto Mecânica Kaen - Oficina Especializada em Registro SP" 
            className="w-full h-full object-cover object-center scale-105 animate-in fade-in zoom-in-95 duration-1000"
            referrerPolicy="no-referrer"
          />
          {/* Gradients para contraste perfeito */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/65" />
        </div>
        
        {/* LOGO OFICIAL KAEN EM DESTAQUE NO TOPO DA HERO */}
        <div className="relative z-10 w-full text-center mt-6 sm:mt-10 md:mt-14 pointer-events-none flex flex-col items-center">
          <KaenLogo variant="horizontal" className="h-16 sm:h-24 md:h-32 lg:h-36 w-auto drop-shadow-[0_20px_45px_rgba(0,0,0,0.95)]" />
          <p className="text-[10px] sm:text-xs font-black text-white/80 uppercase tracking-[0.35em] mt-3 sm:mt-4 drop-shadow">
            CENTRO AUTOMOTIVO DE ALTA PRECISÃO • REGISTRO/SP
          </p>
        </div>

        {/* CONTAINER INFERIOR: OVERLAY ESQUERDO + CARDS FLUTUANTES DIREITO */}
        <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-end mt-8 sm:mt-auto pt-6 sm:pt-12">
          
          {/* BOTTOM LEFT: HEADLINE + TEXTO DESCRITIVO + PROVA SOCIAL */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-left">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
              Descubra uma mecânica selecionada com sofisticação e precisão.
            </h2>
            <p className="text-xs sm:text-base text-zinc-200 font-medium leading-relaxed max-w-xl drop-shadow">
              Na Auto Mecânica Kaen, conectamos você aos melhores padrões de engenharia automotiva para <strong className="text-[#FF7A50] font-bold">viver e acelerar</strong> com segurança total.
            </p>

            {/* AVATAR SOCIAL PROOF */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
              <div className="flex -space-x-3 items-center">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" 
                  alt="Cliente Kaen" 
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-black shadow-lg"
                  referrerPolicy="no-referrer"
                />
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120" 
                  alt="Cliente Kaen" 
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-black shadow-lg"
                  referrerPolicy="no-referrer"
                />
                <img 
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120" 
                  alt="Cliente Kaen" 
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-black shadow-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-white leading-tight flex items-center gap-1.5">
                  <span>+2.500 Clientes Satisfeitos</span>
                  <span className="text-amber-400">★★★★★</span>
                </p>
                <p className="text-[10px] sm:text-[11px] text-zinc-300 font-medium">Registro/SP • Rua Joaquim Marques Alves, 765</p>
              </div>
            </div>
          </div>

          {/* BOTTOM RIGHT: CARD INFORMATIVO COM LOCALIZAÇÃO E CONTATO */}
          <div className="lg:col-span-5 flex flex-col gap-3 w-full sm:max-w-md lg:ml-auto">
            
            {/* CARD BRANCO/TRANSLÚCIDO COM LOCALIZAÇÃO */}
            <div className="bg-white text-zinc-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl space-y-3 sm:space-y-4 text-left border border-white/60">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-extrabold text-lg sm:text-xl text-black tracking-tight leading-tight">Auto Mecânica Kaen</h3>
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
                  className="flex-1 bg-gradient-to-r from-[#FF5E36] to-[#FF2D55] text-white py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl font-black uppercase text-[10px] sm:text-[11px] tracking-wider shadow-md hover:opacity-95 active:scale-95 transition-all text-center cursor-pointer"
                >
                  Agendar Visita
                </button>
                <a 
                  href="https://maps.google.com/?q=Rua+Joaquim+Marques+Alves+765+Registro+SP" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 py-3 sm:py-3.5 px-3.5 sm:px-4 rounded-xl font-extrabold text-[10px] sm:text-[11px] transition-all flex items-center justify-center gap-1.5"
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
      <section id="sobre" className="py-16 sm:py-28 px-4 sm:px-8 bg-zinc-950 border-t border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          <div className="lg:col-span-6 space-y-4 sm:space-y-6 text-left">
            <span className="text-[#FF4D2D] font-extrabold uppercase tracking-[0.3em] text-[10px] sm:text-xs">A OFICINA • PADRÃO HOMOLOGADO</span>
            <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Excelência, precisão e respeito pelo seu veículo.
            </h2>
            <p className="text-zinc-300 font-medium text-xs sm:text-base leading-relaxed">
              Fundada em Registro/SP, a Auto Mecânica Kaen estabeleceu um novo patamar técnico na região. Aliamos diagnóstico computadorizado de padrão internacional a uma postura de absoluta honestidade e transparência com o cliente.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 sm:pt-4">
              <div className="bg-zinc-900/60 border border-white/5 p-4 sm:p-5 rounded-2xl">
                <p className="text-2xl sm:text-3xl font-display font-black text-[#FF4D2D]">100%</p>
                <p className="text-xs font-bold text-zinc-200 mt-1">Laudos Fotográficos</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Você vê cada detalhe antes de autorizar.</p>
              </div>
              <div className="bg-zinc-900/60 border border-white/5 p-4 sm:p-5 rounded-2xl">
                <p className="text-2xl sm:text-3xl font-display font-black text-white">90 Dias</p>
                <p className="text-xs font-bold text-zinc-200 mt-1">Garantia Técnica Kaen</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Em peças homologadas e mão de obra.</p>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-10 shadow-2xl space-y-4 sm:space-y-6 text-left">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FF4D2D]/10 border border-[#FF4D2D]/30 flex items-center justify-center text-[#FF4D2D]">
                <MapPin size={24} className="sm:size-28" />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <span className="text-[10px] sm:text-xs font-black text-[#FF4D2D] uppercase tracking-widest block">REGISTRO / SP</span>
                <h4 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">Rua Joaquim Marques Alves, 765</h4>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Atendimento especializado de segunda a sexta, das 08h às 18h.
                </p>
              </div>

              <div className="pt-3 sm:pt-4 border-t border-white/10 space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-zinc-300">
                  <Clock size={16} className="text-[#FF4D2D] shrink-0" />
                  <span>Horário: Segunda a Sexta, das 08h às 18h</span>
                </div>
                <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-zinc-300">
                  <ShieldCheck size={16} className="text-[#FF4D2D] shrink-0" />
                  <span>Oficina credenciada com diagnósticos computadorizados e laudos</span>
                </div>
              </div>

              <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <a 
                  href="https://maps.google.com/?q=Rua+Joaquim+Marques+Alves+765+Registro+SP" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/15 text-white py-3 px-4 sm:px-5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all text-center w-full sm:w-auto"
                >
                  <MapPin size={14} className="text-[#FF4D2D] shrink-0" />
                  <span>Ver Rota no Google Maps</span>
                </a>
                <button
                  onClick={() => setShowBooking(true)}
                  className="bg-[#FF4D2D] hover:bg-[#ff3814] text-white py-3 px-4 sm:px-5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#FF4D2D]/20 active:scale-95 transition-all cursor-pointer text-center w-full sm:w-auto"
                >
                  <span>Agendar Atendimento</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO SERVIÇOS ESPECIALIZADOS */}
      <section id="servicos" className="py-16 sm:py-28 px-4 sm:px-8 bg-black border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[#FF4D2D] font-extrabold uppercase tracking-[0.3em] text-[10px] sm:text-xs">PORTFÓLIO DE ESPECIALIDADES</span>
            <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight">O Que Fazemos de Melhor</h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed">
              Equipamentos de telemetria e calibração computadorizada para veículos nacionais, importados e esportivos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
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
                <div key={idx} className="bg-zinc-950/80 border border-white/5 hover:border-[#FF4D2D]/40 p-5 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 flex flex-col justify-between group">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 group-hover:bg-[#FF4D2D] text-white rounded-xl sm:rounded-2xl flex items-center justify-center transition-all">
                        <IconComp size={20} />
                      </div>
                      <span className="text-[9px] font-bold text-zinc-400 bg-white/5 px-2.5 py-1 rounded-full">{srv.badge}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-[#FF4D2D] transition-colors">{srv.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">{srv.desc}</p>
                  </div>
                  <button 
                    onClick={() => setShowBooking(true)}
                    className="mt-5 sm:mt-6 text-[11px] font-bold text-[#FF4D2D] flex items-center gap-1.5 hover:gap-2.5 transition-all group-hover:underline"
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

      {/* FOOTER COM LOGO OFICIAL KAEN */}
      <footer className="py-12 sm:py-20 px-4 sm:px-8 border-t border-white/5 bg-zinc-950">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start">
              <KaenLogo variant="horizontal" className="h-8 sm:h-10 md:h-12 w-auto" />
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs text-zinc-400 font-medium">
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

      {/* MODAL DE AGENDAMENTO (OTIMIZADO PARA MOBILE COM SCROLL SUAVE) */}
      {showBooking && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300 overflow-y-auto">
           <div className="w-full max-w-xl bg-zinc-950 border border-white/10 p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
              <button 
                onClick={() => setShowBooking(false)} 
                className="absolute top-5 right-5 sm:top-8 sm:right-8 text-zinc-400 hover:text-white transition-all p-1"
                aria-label="Fechar"
              >
                <X size={24}/>
              </button>
              
              <div className="text-center mb-6 sm:mb-8">
                 <span className="text-[#FF4D2D] font-black text-[10px] uppercase tracking-[0.3em] block mb-1">ATENDIMENTO KAEN</span>
                 <h2 className="font-display text-2xl sm:text-3xl font-black text-white">Agendar Revisão</h2>
                 <p className="text-xs text-zinc-400 font-medium mt-1">Reserve seu horário com os nossos especialistas técnicos</p>
              </div>

              <form onSubmit={handleBooking} className="space-y-3 sm:space-y-4">
                 <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block ml-2">Nome Completo</label>
                    <input required type="text" placeholder="EX: RAFAEL SILVA" value={bookingForm.name} onChange={(e) => setBookingForm({...bookingForm, name: e.target.value.toUpperCase()})} className="w-full bg-black border border-white/10 rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 text-white text-xs font-bold uppercase outline-none focus:border-[#FF4D2D] transition-all"/>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block ml-2">WhatsApp</label>
                       <input required type="tel" placeholder="(11) 99999-9999" value={bookingForm.phone} onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 text-white text-xs font-bold outline-none focus:border-[#FF4D2D] transition-all"/>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block ml-2">Veículo / Modelo</label>
                       <input required type="text" placeholder="EX: HONDA CIVIC 2.0" value={bookingForm.vehicle} onChange={(e) => setBookingForm({...bookingForm, vehicle: e.target.value.toUpperCase()})} className="w-full bg-black border border-white/10 rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 text-white text-xs font-bold uppercase outline-none focus:border-[#FF4D2D] transition-all"/>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block ml-2">Data Desejada</label>
                       <input required type="date" value={bookingForm.date} onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 text-white text-xs font-bold outline-none focus:border-[#FF4D2D] transition-all"/>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block ml-2">Horário Preferencial</label>
                       <input required type="time" value={bookingForm.time} onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 text-white text-xs font-bold outline-none focus:border-[#FF4D2D] transition-all"/>
                    </div>
                 </div>

                 <button type="submit" className="w-full bg-gradient-to-r from-[#FF5E36] to-[#FF2D55] text-white py-3.5 sm:py-4 rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg hover:opacity-95 active:scale-95 transition-all mt-3 sm:mt-4 cursor-pointer">
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
