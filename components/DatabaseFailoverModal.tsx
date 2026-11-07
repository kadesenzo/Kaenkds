import React, { useState, useEffect } from 'react';
import { 
  Database, X, Shield, RefreshCw, CheckCircle2, AlertTriangle, 
  ArrowRight, Copy, Check, ExternalLink, Zap, Cloud, HardDrive, Share2
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  isSupabaseConfigured, 
  testSupabaseConnection, 
  replicateSupabaseToOriginalFirestore,
  replicateOriginalToSupabase,
  SUPABASE_SETUP_SQL 
} from '../src/lib/supabase';
import { isQuotaExhausted, getQuotaUpgradeUrl } from '../src/lib/firebase';
import { getWorkshopData } from '../src/lib/storage';

interface DatabaseFailoverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DatabaseFailoverModal: React.FC<DatabaseFailoverModalProps> = ({ isOpen, onClose }) => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [isReplicatingToOriginal, setIsReplicatingToOriginal] = useState(false);
  const [replicationResult, setReplicationResult] = useState<string | null>(null);
  
  const [isMirroringToSupabase, setIsMirroringToSupabase] = useState(false);
  const [mirrorResult, setMirrorResult] = useState<string | null>(null);

  const [copiedSql, setCopiedSql] = useState(false);
  const [firestoreQuotaExhausted, setFirestoreQuotaExhausted] = useState(false);

  // Load configuration
  useEffect(() => {
    if (!isOpen) return;
    const cfg = getSupabaseConfig();
    setSupabaseUrl(cfg.url);
    setSupabaseKey(cfg.anonKey);
    setIsConfigured(cfg.isConfigured);
    setFirestoreQuotaExhausted(isQuotaExhausted());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      alert("Por favor, preencha a URL e a Chave Anon do seu projeto Supabase.");
      return;
    }
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setIsConfigured(true);
    setTestResult({ success: true, message: "Configuração do Supabase salva com sucesso no sistema!" });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Temporarily save to test
      saveSupabaseConfig(supabaseUrl, supabaseKey);
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (res.success) setIsConfigured(true);
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleReplicateToOriginal = async () => {
    setIsReplicatingToOriginal(true);
    setReplicationResult(null);
    try {
      const res = await replicateSupabaseToOriginalFirestore();
      if (res.success) {
        setReplicationResult(`✅ SUCESSO: ${res.clientsCount} clientes, ${res.vehiclesCount} veículos e ${res.ordersCount} notas repassados com sucesso ao Firestore Original!`);
        window.dispatchEvent(new CustomEvent('kaen_storage_updated'));
      } else {
        setReplicationResult(`❌ ${res.message}`);
      }
    } catch (e: any) {
      setReplicationResult(`❌ Erro: ${e.message || String(e)}`);
    } finally {
      setIsReplicatingToOriginal(false);
    }
  };

  const handleMirrorToSupabase = async () => {
    setIsMirroringToSupabase(true);
    setMirrorResult(null);
    try {
      const res = await replicateOriginalToSupabase();
      if (res.success) {
        setMirrorResult(`✅ SUCESSO: ${res.totalSynced} registros espelhados com sucesso no Supabase!`);
      } else {
        setMirrorResult(`❌ ${res.message}`);
      }
    } catch (e: any) {
      setMirrorResult(`❌ Erro: ${e.message || String(e)}`);
    } finally {
      setIsMirroringToSupabase(false);
    }
  };

  const totalClients = getWorkshopData<any[]>('clients', 'rafael', []).length;
  const totalOrders = getWorkshopData<any[]>('orders', 'rafael', []).length;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#0D0D0E] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[92vh] overflow-y-auto no-scrollbar text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF2D55] to-emerald-500 text-white flex items-center justify-center shadow-lg">
              <Database size={24} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#FF2D55] block">MULTI-BANCO DE DADOS & FAILOVER</span>
              <h2 className="text-lg sm:text-xl font-black uppercase italic tracking-wider text-white">
                Firestore (Original) & Supabase (Reserva)
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white rounded-full bg-white/5 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Overview explanation */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-zinc-300 leading-relaxed space-y-1">
          <p className="font-bold text-white flex items-center gap-1.5">
            <Zap size={14} className="text-emerald-400" /> Como funciona a troca e passagem de dados:
          </p>
          <p className="text-zinc-400 text-[11px]">
            1. Quando o <strong>Firestore</strong> atinge a cota diária, o sistema continua funcionando e grava tudo no <strong>Supabase</strong> (banco reserva) e no servidor local.
          </p>
          <p className="text-zinc-400 text-[11px]">
            2. Quando a cota do Firestore resetar ou você quiser, basta clicar em <strong>"Repassar ao Original"</strong> para transferir todos os novos cadastros e notas do Supabase para o Firestore original sem perder nada!
          </p>
        </div>

        {/* Database Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* BANCO 1: FIRESTORE */}
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud size={16} className="text-[#FF2D55]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">1. Firestore (Original)</h3>
              </div>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${firestoreQuotaExhausted ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                {firestoreQuotaExhausted ? 'Cota Atingida (Reserva Ativo)' : '100% Conectado'}
              </span>
            </div>
            
            <p className="text-[11px] text-zinc-400">
              Banco principal na nuvem Google. Armazena clientes, ordens e histórico.
            </p>

            <div className="text-[10px] space-y-1 text-zinc-500 font-mono">
              <p>Total na Base: <span className="text-white font-bold">{totalClients} Clientes</span> • <span className="text-white font-bold">{totalOrders} Notas</span></p>
            </div>

            <a 
              href={getQuotaUpgradeUrl()} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-[#FF2D55] hover:underline pt-1"
            >
              <span>Ver Cota no Firebase Console</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* BANCO 2: SUPABASE */}
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">2. Supabase (Reserva)</h3>
              </div>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isConfigured ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'}`}>
                {isConfigured ? 'Conectado / Reserva Ativo' : 'Aguardando Chave'}
              </span>
            </div>

            <p className="text-[11px] text-zinc-400">
              PostgreSQL na nuvem para absorver cadastros quando o original estiver no limite.
            </p>

            <div className="text-[10px] space-y-1 text-zinc-500 font-mono">
              <p>Status: <span className={isConfigured ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{isConfigured ? 'Pronto para Gravar e Espelhar' : 'Preencha os campos abaixo'}</span></p>
            </div>
          </div>
        </div>

        {/* Supabase Connection Form */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Database size={15} /> CONECTAR SEU PROJETO SUPABASE:
            </h4>
            <button
              onClick={handleCopySql}
              className="text-[9px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1 px-2.5 py-1 bg-white/5 rounded-lg border border-white/10 cursor-pointer"
              title="Copie o script SQL para colar no Supabase SQL Editor"
            >
              {copiedSql ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedSql ? 'SQL Copiado!' : 'Copiar SQL da Tabela'}</span>
            </button>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400 ml-1">
                URL DO PROJETO SUPABASE (Project URL)
              </label>
              <input 
                type="text" 
                value={supabaseUrl} 
                onChange={(e) => setSupabaseUrl(e.target.value)} 
                placeholder="https://xyzcompany.supabase.co" 
                className="w-full bg-black/70 border border-white/15 p-3 rounded-xl text-white font-mono text-xs outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400 ml-1">
                CHAVE PÚBLICA ANON (anon public key)
              </label>
              <input 
                type="text" 
                value={supabaseKey} 
                onChange={(e) => setSupabaseKey(e.target.value)} 
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                className="w-full bg-black/70 border border-white/15 p-3 rounded-xl text-white font-mono text-xs outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={handleSaveConfig}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-900/30"
              >
                SALVAR CREDENCIAIS DO SUPABASE
              </button>

              <button
                onClick={handleTestConnection}
                disabled={isTesting || !supabaseUrl || !supabaseKey}
                className="py-3 px-5 bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-zinc-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isTesting ? <RefreshCw size={14} className="animate-spin text-emerald-400" /> : <Shield size={14} />}
                <span>TESTAR CONEXÃO</span>
              </button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl border text-xs font-bold flex items-start gap-2 ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                {testResult.success ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* TWO-WAY REPLICATION BRIDGE */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-zinc-900 to-black border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-[#FF2D55]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              PONTE DE REPLICAÇÃO & PASSAGEM DE DADOS:
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* ACTION 1: PASS FROM SUPABASE TO ORIGINAL */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400 block">
                  PASSAR AO ORIGINAL
                </span>
                <h5 className="text-sm font-black uppercase italic text-white mt-0.5">
                  Repassar Supabase ➔ Firestore
                </h5>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                  Pega todas as informações novas gravadas no Supabase durante o período de reserva e grava de volta no Firestore original.
                </p>
              </div>

              <button
                onClick={handleReplicateToOriginal}
                disabled={isReplicatingToOriginal}
                className="w-full py-3 bg-[#FF2D55] hover:bg-[#D11D40] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isReplicatingToOriginal ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                <span>PASSAR INFOS AO ORIGINAL</span>
              </button>
            </div>

            {/* ACTION 2: MIRROR TO SUPABASE */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400 block">
                  ESPELHAMENTO COMPLETO
                </span>
                <h5 className="text-sm font-black uppercase italic text-white mt-0.5">
                  Firestore ➔ Copiar p/ Supabase
                </h5>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                  Envia todos os clientes, veículos e notas atuais para o Supabase para que a reserva fique 100% idêntica ao original.
                </p>
              </div>

              <button
                onClick={handleMirrorToSupabase}
                disabled={isMirroringToSupabase || !isConfigured}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isMirroringToSupabase ? <RefreshCw size={14} className="animate-spin text-emerald-400" /> : <HardDrive size={14} />}
                <span>ESPELHAR NO SUPABASE</span>
              </button>
            </div>
          </div>

          {replicationResult && (
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-zinc-200">
              {replicationResult}
            </div>
          )}

          {mirrorResult && (
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-zinc-200">
              {mirrorResult}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DatabaseFailoverModal;
