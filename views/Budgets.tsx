import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle2, XCircle, Clock, Send, MessageCircle, 
  Search, Eye, ShieldCheck, DollarSign, Wrench, Package, ArrowRight,
  ExternalLink, Copy, Check
} from 'lucide-react';
import { ServiceOrder, OSStatus, PaymentStatus, UserSession } from '../types';

interface BudgetsProps {
  session?: UserSession;
  syncData?: (key: string, data: any) => Promise<void>;
}

export const Budgets: React.FC<BudgetsProps> = ({ session, syncData }) => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AGUARDANDO' | 'APROVADO' | 'RECUSADO'>('ALL');
  const [selectedBudget, setSelectedBudget] = useState<ServiceOrder | null>(null);
  const [showApprovalPortal, setShowApprovalPortal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const tenant = session?.username || 'rafael';

  useEffect(() => {
    const loadData = () => {
      const savedOrders = localStorage.getItem(`kaenpro_${tenant}_orders`) || localStorage.getItem('kaenpro_rafael_orders');
      if (savedOrders) {
        try {
          setOrders(JSON.parse(savedOrders));
        } catch (e) {
          console.error(e);
        }
      }
    };

    loadData();
    window.addEventListener('kaen_storage_updated', loadData);
    return () => window.removeEventListener('kaen_storage_updated', loadData);
  }, [tenant]);

  // Derived budget list (orders with quote items or status relating to diagnosis/budget)
  const budgetList = orders.filter(os => {
    const matchesSearch = 
      os.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.vehicleModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.osNumber?.includes(searchTerm);

    if (!matchesSearch) return false;

    if (statusFilter === 'AGUARDANDO') {
      return os.status === OSStatus.ORCAMENTO_ENVIADO || os.status === OSStatus.AGUARDANDO_APROVACAO || (!os.budgetApproved && os.status !== OSStatus.CANCELADO);
    }
    if (statusFilter === 'APROVADO') {
      return os.budgetApproved || os.status === OSStatus.EM_SERVICO || os.status === OSStatus.FINALIZADO || os.status === OSStatus.PRONTO;
    }
    if (statusFilter === 'RECUSADO') {
      return os.status === OSStatus.CANCELADO;
    }

    return true;
  });

  const handleUpdateStatus = async (osId: string, newStatus: 'APROVADO' | 'RECUSADO') => {
    const updated = orders.map(os => {
      if (os.id === osId) {
        if (newStatus === 'APROVADO') {
          return {
            ...os,
            budgetApproved: true,
            approvedAt: new Date().toISOString(),
            status: OSStatus.EM_SERVICO,
            updatedAt: new Date().toISOString()
          };
        } else {
          return {
            ...os,
            budgetApproved: false,
            status: OSStatus.CANCELADO,
            updatedAt: new Date().toISOString()
          };
        }
      }
      return os;
    });

    setOrders(updated);
    localStorage.setItem(`kaenpro_${tenant}_orders`, JSON.stringify(updated));
    localStorage.setItem(`kaenpro_rafael_orders`, JSON.stringify(updated));
    if (syncData) {
      await syncData('orders', updated);
    }
    window.dispatchEvent(new CustomEvent('kaen_storage_updated'));
  };

  const handleSendWhatsApp = (os: ServiceOrder) => {
    const phone = (os.clientPhone || '').replace(/\D/g, '');
    const peçasList = os.items.filter(i => i.type === 'PART');
    const serviçosList = os.items.filter(i => i.type === 'SERVICE');

    let text = `Olá, *${os.clientName}*! 👋\n\n`;
    text += `A *Auto Mecânica KAEN* realizou a avaliação técnica completa do seu *${os.vehicleModel}* (Placa: *${os.vehiclePlate}*).\n\n`;
    text += `📋 *Diagnóstico / Problema Encontrado:*\n${os.problem || 'Revisão preventiva e diagnóstico geral'}\n\n`;

    if (peçasList.length > 0) {
      text += `🔩 *Peças Necessárias:*\n`;
      peçasList.forEach(p => {
        text += `• ${p.description} (${p.quantity}x) — R$ ${(p.quantity * p.unitPrice).toFixed(2)}\n`;
      });
      text += `\n`;
    }

    if (serviçosList.length > 0 || os.laborValue > 0) {
      text += `🔧 *Mão de Obra e Serviços Especializados:*\n`;
      serviçosList.forEach(s => {
        text += `• ${s.description} — R$ ${(s.quantity * s.unitPrice).toFixed(2)}\n`;
      });
      if (os.laborValue > 0 && serviçosList.length === 0) {
        text += `• Serviços de Manutenção e Instalação — R$ ${os.laborValue.toFixed(2)}\n`;
      }
      text += `\n`;
    }

    text += `💰 *VALOR TOTAL DO INVESTIMENTO: R$ ${os.totalValue.toFixed(2)}*\n`;
    text += `⏱️ *Garantia:* 90 dias de garantia técnica em peças e mão de obra.\n\n`;
    text += `Para autorizar o início dos serviços com prioridade na oficina, basta responder esta mensagem com *AUTORIZADO* ou abrir o link do laudo digital!\n\n`;
    text += `_Auto Mecânica Kaen • Excelência e Transparência_`;

    const cleanPhone = phone.length >= 10 ? (phone.startsWith('55') ? phone : `55${phone}`) : '';
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');

    // Update order status to budget sent if pending
    if (!os.budgetApproved && os.status !== OSStatus.EM_SERVICO) {
      const updated = orders.map(item => item.id === os.id ? { ...item, status: OSStatus.ORCAMENTO_ENVIADO } : item);
      setOrders(updated);
      localStorage.setItem(`kaenpro_${tenant}_orders`, JSON.stringify(updated));
      if (syncData) syncData('orders', updated);
    }
  };

  const copyApprovalText = (os: ServiceOrder) => {
    const text = `Orçamento da Auto Mecânica KAEN para ${os.vehicleModel} (${os.vehiclePlate}): Total R$ ${os.totalValue.toFixed(2)}. Status: ${os.budgetApproved ? 'Aprovado' : 'Aguardando Aprovação'}.`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full max-w-[1200px] space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-zinc-950/80 border border-white/5 rounded-3xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-[#FF2D55] text-xs font-black uppercase tracking-widest">
            <DollarSign size={16} />
            <span>Módulo de Gestão Financeira Comercial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1 italic">
            Orçamentos & Aprovação Digital
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Transforme diagnósticos da pista em propostas comerciais de alta conversão para WhatsApp com 1 clique.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-zinc-900/90 border border-white/5 rounded-2xl text-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Total Orçados</span>
            <span className="text-lg font-black text-white">{orders.length}</span>
          </div>
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 block">Aprovados</span>
            <span className="text-lg font-black text-emerald-400">
              {orders.filter(o => o.budgetApproved || o.status === OSStatus.EM_SERVICO).length}
            </span>
          </div>
          <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block">Aguardando</span>
            <span className="text-lg font-black text-amber-400">
              {orders.filter(o => !o.budgetApproved && o.status !== OSStatus.CANCELADO && o.status !== OSStatus.FINALIZADO).length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por cliente, placa, modelo ou número da OS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-white/5 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF2D55] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-zinc-950 border border-white/5 rounded-2xl w-full md:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'AGUARDANDO', label: '⏳ Aguardando' },
            { id: 'APROVADO', label: '🟢 Aprovados' },
            { id: 'RECUSADO', label: '🔴 Recusados' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap
                ${statusFilter === tab.id ? 'bg-[#FF2D55] text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Budget List */}
      <div className="space-y-3">
        {budgetList.length === 0 ? (
          <div className="p-12 text-center bg-zinc-950/40 border border-dashed border-white/10 rounded-3xl space-y-3">
            <FileText size={32} className="mx-auto text-zinc-600" />
            <p className="text-sm font-bold text-zinc-400">Nenhum orçamento encontrado com esses filtros</p>
            <p className="text-xs text-zinc-600">Crie uma nova OS ou receba um carro na recepção para gerar orçamentos.</p>
          </div>
        ) : (
          budgetList.map(os => {
            const isApproved = os.budgetApproved || os.status === OSStatus.EM_SERVICO || os.status === OSStatus.FINALIZADO || os.status === OSStatus.PRONTO;
            const isRefused = os.status === OSStatus.CANCELADO;
            const isPending = !isApproved && !isRefused;

            return (
              <div 
                key={os.id}
                className="p-5 bg-zinc-950/70 hover:bg-zinc-900/60 border border-white/5 hover:border-white/10 rounded-3xl transition-all duration-300 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                    isApproved ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    isRefused ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    {isApproved ? <CheckCircle2 size={22} /> : isRefused ? <XCircle size={22} /> : <Clock size={22} />}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-zinc-500">#{os.osNumber}</span>
                      <h3 className="text-sm font-black text-white uppercase tracking-tight truncate">{os.clientName}</h3>
                      <span className="text-xs font-mono font-bold text-[#FF2D55] bg-[#FF2D55]/10 px-2 py-0.5 rounded-lg">
                        {os.vehiclePlate}
                      </span>
                      <span className="text-xs text-zinc-400">{os.vehicleModel}</span>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-1">
                      {os.problem || 'Diagnóstico padrão e manutenção preventiva.'}
                    </p>

                    <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-medium">
                      <span>{os.items?.length || 0} itens listados</span>
                      <span>•</span>
                      <span>Mão de obra: R$ {(os.laborValue || 0).toFixed(2)}</span>
                      <span>•</span>
                      <span>Atualizado em: {new Date(os.updatedAt || os.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* Right Area: Price and Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
                  <div className="text-left lg:text-right">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">Total Orçamento</span>
                    <span className="text-lg font-black text-white">
                      R$ {os.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="mt-0.5">
                      {isApproved && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Aprovado Digitalmente
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Aguardando Resposta
                        </span>
                      )}
                      {isRefused && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          Recusado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendWhatsApp(os)}
                      title="Enviar Orçamento via WhatsApp"
                      className="p-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 rounded-2xl transition-all duration-200 active:scale-95 flex items-center gap-1.5"
                    >
                      <MessageCircle size={16} />
                      <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">WhatsApp</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedBudget(os);
                        setShowApprovalPortal(true);
                      }}
                      title="Abrir Portal de Aprovação Digital"
                      className="p-3 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 rounded-2xl transition-all duration-200 active:scale-95 flex items-center gap-1.5"
                    >
                      <Eye size={16} />
                      <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Ver / Aprovar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Portal de Aprovação Digital do Cliente */}
      {showApprovalPortal && selectedBudget && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            {/* Top Close */}
            <button
              onClick={() => setShowApprovalPortal(false)}
              className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white rounded-xl bg-zinc-900/50"
            >
              <XCircle size={20} />
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF2D55] bg-[#FF2D55]/10 px-3 py-1 rounded-full">
                Portal de Aprovação Digital do Cliente
              </span>
              <h2 className="text-2xl font-black uppercase italic tracking-tight text-white">
                Auto Mecânica KAEN
              </h2>
              <p className="text-xs text-zinc-400">
                Olá, <strong className="text-white">{selectedBudget.clientName}</strong>! A KAEN realizou a avaliação técnica do seu veículo.
              </p>
            </div>

            {/* Vehicle Card */}
            <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Veículo Avaliado</span>
                <p className="text-sm font-black text-white uppercase">{selectedBudget.vehicleModel}</p>
                <p className="text-xs font-mono text-[#FF2D55] font-bold">{selectedBudget.vehiclePlate}</p>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">OS Referência</span>
                <p className="text-sm font-mono font-bold text-zinc-300">#{selectedBudget.osNumber}</p>
                <p className="text-[9px] text-zinc-500">{new Date(selectedBudget.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            {/* Problem & Diagnosis */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Problema Relatado / Diagnóstico</span>
              <div className="p-3 bg-black border border-white/5 rounded-xl text-xs text-zinc-300">
                {selectedBudget.problem || 'Revisão técnica preventiva nos componentes de segurança e performance.'}
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Itens e Serviços Orçados</span>
              <div className="space-y-1.5">
                {selectedBudget.items.map((item, index) => (
                  <div key={index} className="p-3 bg-zinc-900/40 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`p-1 rounded text-[8px] font-black ${item.type === 'PART' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {item.type === 'PART' ? 'PEÇA' : 'SERVIÇO'}
                      </span>
                      <span className="text-zinc-200 font-bold">{item.description}</span>
                      <span className="text-zinc-500 text-[10px]">({item.quantity}x)</span>
                    </div>
                    <span className="font-mono font-bold text-white">
                      R$ {(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
                  </div>
                ))}
                {selectedBudget.laborValue > 0 && (
                  <div className="p-3 bg-zinc-900/40 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded text-[8px] font-black bg-blue-500/10 text-blue-400">SERVIÇO</span>
                      <span className="text-zinc-200 font-bold">Mão de Obra e Instalações Mecânicas</span>
                    </div>
                    <span className="font-mono font-bold text-white">
                      R$ {selectedBudget.laborValue.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Total Highlight */}
            <div className="p-5 bg-gradient-to-r from-zinc-900 to-black border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block">Total do Orçamento</span>
                <p className="text-xs text-zinc-500">Garantia legal de 90 dias em peças e mão de obra</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white font-mono">
                  R$ {selectedBudget.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  handleUpdateStatus(selectedBudget.id, 'APROVADO');
                  setShowApprovalPortal(false);
                }}
                className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-black uppercase text-xs tracking-widest transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 size={18} />
                <span>[ APROVAR ORÇAMENTO ]</span>
              </button>

              <button
                onClick={() => {
                  handleUpdateStatus(selectedBudget.id, 'RECUSADO');
                  setShowApprovalPortal(false);
                }}
                className="py-4 px-6 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl font-black uppercase text-xs tracking-widest transition-all duration-200"
              >
                Recusar
              </button>

              <button
                onClick={() => copyApprovalText(selectedBudget)}
                className="py-4 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-2xl font-black uppercase text-xs transition-all flex items-center justify-center gap-1.5"
                title="Copiar resumo do orçamento"
              >
                {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                <span className="text-[10px]">{copiedLink ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
