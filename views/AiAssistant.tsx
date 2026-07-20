import React, { useState, useEffect } from 'react';
import { 
  Sparkles, MessageSquare, Copy, Check, Info,
  Send, User, AlertTriangle, HelpCircle, Phone, ArrowRight
} from 'lucide-react';
import { Client } from '../types';

interface AiAssistantProps {
  session?: any;
  syncData?: any;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ session }) => {
  const [loading, setLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Client list from LocalStorage for CRM matching
  const [clients, setClients] = useState<Client[]>([]);

  // CRM Personalizado State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [crmMessageType, setCrmMessageType] = useState<'feedback' | 'maintenance' | 'cobrança'>('maintenance');
  const [customDetail, setCustomDetail] = useState('');
  const [crmResult, setCrmResult] = useState<any>(null);

  useEffect(() => {
    if (session) {
      const loadClients = () => {
        const tenant = session.username;
        const localClients = JSON.parse(localStorage.getItem(`kaenpro_${tenant}_clients`) || '[]');
        setClients(localClients);
      };
      loadClients();
      window.addEventListener('kaen_storage_updated', loadClients);
      return () => window.removeEventListener('kaen_storage_updated', loadClients);
    }
  }, [session]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const generateCrmMessage = async () => {
    if (!selectedClientId) {
      alert("Por favor, selecione um cliente da lista.");
      return;
    }
    setLoading(true);
    try {
      const matchedClient = clients.find(c => c.id === selectedClientId);
      const payload = {
        clientName: matchedClient?.name || 'Cliente Especial',
        clientPhone: matchedClient?.phone || '',
        messageType: crmMessageType,
        details: customDetail
      };

      const response = await fetch('/api/gemini/crm-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        setCrmResult(data);
      } else {
        alert(data.error || 'Falha na comunicação com o motor de inteligência artificial.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao conectar com o servidor de inteligência artificial.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen text-white p-2 md:p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header Visual Style */}
      <div className="flex flex-col md:flex-row items-add md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-emerald-500 text-black rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-white/10 animate-pulse">
            <MessageSquare size={28} className="text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-[0.3em] bg-zinc-900 border border-white/10 text-emerald-400 px-2.5 py-1 rounded-full uppercase">SaaS NOTIFICATION ENGINE</span>
              <span className="text-[10px] font-black tracking-widest text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-500/10">ONLINE</span>
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase mt-1 leading-none">
              CRM Notificações via WhatsApp <span className="text-emerald-400">KAEN AI</span>
            </h1>
          </div>
        </div>
        <p className="text-[10px] leading-relaxed max-w-xs text-zinc-500 font-bold uppercase tracking-widest text-left md:text-right">
          Crie avisos magnéticos de revisão pendente, contatos qualificados de pós-venda ou cobranças humanizadas elegantes pré-formatadas para disparar via WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Input Configuration Column */}
        <div className="lg:col-span-2 glass-card p-8 rounded-[3rem] border border-white/10 flex flex-col space-y-6 bg-zinc-950/40">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <h3 className="text-xs font-black uppercase text-emerald-400 tracking-widest flex items-center gap-2">
              <Sparkles size={14} /> Seleção e Parâmetros
            </h3>
            <span className="text-[9px] font-black text-zinc-650 bg-black px-2 py-1 rounded">GEMINI 3.5</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Selecionar Cliente Proprietário</label>
              <select 
                value={selectedClientId} 
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:border-emerald-400 outline-none font-bold"
              >
                <option value="">-- SELECIONAR DA BASE DE CLIENTES --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id} className="bg-zinc-950 text-white">
                    {c.name.toUpperCase()} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Natureza da Mensagem CRM</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  type="button"
                  onClick={() => setCrmMessageType('maintenance')}
                  className={`p-3 rounded-xl border font-black text-[9px] uppercase tracking-wider text-center transition-all ${crmMessageType === 'maintenance' ? 'bg-emerald-500/20 border-emerald-400 text-white' : 'bg-[#050505] border-white/10 text-zinc-500'}`}
                >
                  Manutenção / Alerta
                </button>
                <button 
                  type="button"
                  onClick={() => setCrmMessageType('feedback')}
                  className={`p-3 rounded-xl border font-black text-[9px] uppercase tracking-wider text-center transition-all ${crmMessageType === 'feedback' ? 'bg-emerald-500/20 border-emerald-400 text-white' : 'bg-[#050505] border-white/10 text-zinc-500'}`}
                >
                  Qualidade / Feedback
                </button>
                <button 
                  type="button"
                  onClick={() => setCrmMessageType('cobrança')}
                  className={`p-3 rounded-xl border font-black text-[9px] uppercase tracking-wider text-center transition-all ${crmMessageType === 'cobrança' ? 'bg-emerald-500/20 border-emerald-400 text-white' : 'bg-[#050505] border-white/10 text-zinc-500'}`}
                >
                  Cobrança Elegante
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Detalhes do Serviço ou Valores (Opcional)</label>
              <textarea 
                value={customDetail} 
                onChange={(e) => setCustomDetail(e.target.value)}
                rows={4}
                className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 text-xs text-white focus:border-emerald-400 outline-none font-bold leading-relaxed resize-none"
                placeholder="Exemplo para manutenção: 'Trocou pastilha há 6 meses, sugerir re-inspeção'. Exemplo para cobrança: 'Valor pendente R$ 450 referindo-se à OS #1024'."
              />
            </div>

            <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-1.5">
              <span className="text-[8px] font-black text-emerald-400 tracking-widest uppercase flex items-center gap-1.5">
                <Info size={10} /> Disparo Direto e Prático
              </span>
              <p className="text-[9px] text-zinc-500 leading-relaxed font-bold uppercase">
                A IA vai escrever uma mensagem adaptada ao cliente do banco de dados, utilizando excelentes gatilhos éticos. Você poderá copiar ou disparar direto no WhatsApp do cliente com 1 clique.
              </p>
            </div>

            <button 
              onClick={generateCrmMessage}
              disabled={loading}
              className="w-full bg-emerald-400 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed py-4 rounded-xl text-black font-black text-xs uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-3 animate-pulse"
            >
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div> : <Sparkles size={14} />}
              <span>{loading ? 'MODELANDO COM IA...' : 'GERAR MENSAGEM VIA IA'}</span>
            </button>
          </div>
        </div>

        {/* Right Preview Column (Result of Generation) */}
        <div className="lg:col-span-3 flex flex-col space-y-6">
          <div className="glass-card p-8 rounded-[3rem] border border-white/10 flex-1 flex flex-col bg-zinc-950/30">
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-zinc-400 pb-4 border-b border-white/5 mb-6 flex items-center justify-between">
              <span>PREVIEW DA MENSAGEM CRM</span>
              <span className="bg-emerald-400/10 border border-emerald-500/30 text-emerald-400 text-[7px] font-extrabold px-2 py-0.5 rounded">MODO DISPARO PRONTO</span>
            </h3>

            {/* Empty State */}
            {!crmResult && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center border border-white/5">
                  <MessageSquare className="text-zinc-700 animate-bounce" size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Aguardando Confirmação</p>
                  <p className="text-[9px] font-bold text-zinc-500 max-w-sm uppercase mt-1 leading-relaxed">
                    Escolha um cliente da sua oficina no formulário lateral, selecione o tipo do contato, adicione qualquer detalhe rápido e clique para disparar o motor inteligente.
                  </p>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-5">
                <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                <div className="space-y-1.5 animate-pulse">
                  <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Processando Inteligência Artificial</p>
                  <p className="text-[9px] font-black text-zinc-650 uppercase tracking-widest">Ajustando tom humanizado e argumentos técnicos...</p>
                </div>
              </div>
            )}

            {/* CRM Personalizado Outcome View */}
            {!loading && crmResult && (
              <div className="space-y-6 flex-1 overflow-y-auto max-h-[70vh] pr-2 no-scrollbar animate-in fade-in duration-300">
                <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-5 relative">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-[9px] font-black text-emerald-400 border border-emerald-400/30 bg-emerald-400/5 px-3 py-1 rounded-full uppercase tracking-widest">
                      NOTIFICAÇÃO CUSTOMIZADA
                    </span>
                    <button 
                      onClick={() => handleCopy(crmResult.message || '', 'crm')}
                      className="text-zinc-500 hover:text-white bg-zinc-950 hover:bg-zinc-900 p-2 rounded-lg transition-all active:scale-95 cursor-pointer"
                    >
                      {copiedText === 'crm' ? <Check className="text-emerald-400" size={14} /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div className="space-y-1 bg-black/40 p-4 rounded-xl border border-white/5 text-xs text-zinc-400">
                    <div className="flex items-center gap-2 font-black mb-1 uppercase text-[8px] tracking-widest text-emerald-400">
                      <User size={10} /> DETALHES DO DESTRINATÁRIO
                    </div>
                    <p className="font-extrabold uppercase text-zinc-300">Cliente: {crmResult.clientName || 'Cliente Especial'}</p>
                    {crmResult.playerPhone && <p className="font-mono text-zinc-400">WhatsApp: {crmResult.playerPhone}</p>}
                    <p className="uppercase text-[9px] font-bold">Natureza: {crmResult.type === 'maintenance' ? 'Manutenção Preventiva' : crmResult.type === 'feedback' ? 'Qualidade & Feedback' : 'Cobrança Programada'}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Aviso Formatado para WhatsApp (Letra Estilo Cobrança)</h4>
                    <pre className="bg-black/70 p-6 rounded-2xl border border-[#FF2D55]/20 text-xs text-[#FF2D55] leading-relaxed whitespace-pre-wrap font-mono select-all font-medium tracking-wide border-dashed">
                      {crmResult.message}
                    </pre>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleCopy(crmResult.message || '', 'crm')}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-white/5 cursor-pointer"
                    >
                      <Copy size={12} />
                      <span>{copiedText === 'crm' ? 'Copiado!' : 'Copiar Texto'}</span>
                    </button>
                    {crmResult.playerPhone ? (
                      <a 
                        href={`https://api.whatsapp.com/send?phone=${crmResult.playerPhone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(crmResult.message || '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-[#25D366] hover:bg-[#20ba5a] py-4 rounded-xl font-black uppercase text-[10px] tracking-widest text-black flex items-center justify-center gap-2"
                      >
                        <Send size={12} />
                        <span>Disparar WhatsApp</span>
                      </a>
                    ) : (
                      <button 
                        disabled
                        className="w-full bg-zinc-800 text-zinc-500 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 cursor-not-allowed"
                        title="Cliente sem telefone cadastrado"
                      >
                        <AlertTriangle size={12} />
                        <span>Sem Telefone</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
