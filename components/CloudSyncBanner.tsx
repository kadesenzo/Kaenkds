import React, { useState, useRef } from 'react';
import { Cloud, RefreshCw, Download, Upload, ShieldCheck, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { restoreAllFromCloud, exportBackupJSON, importBackupJSON, saveWorkshopData, getWorkshopData } from '../src/lib/storage';
import { UserSession, Client } from '../types';

interface CloudSyncBannerProps {
  session?: UserSession;
  compact?: boolean;
}

export const CloudSyncBanner: React.FC<CloudSyncBannerProps> = ({ session, compact = false }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tenant = session?.username || 'rafael';
  const clients = getWorkshopData<Client[]>('clients', tenant, []);

  const handleRestore = async () => {
    setIsSyncing(true);
    setStatusMessage('Buscando e mesclando dados do Firebase Firestore...');
    const result = await restoreAllFromCloud(tenant);
    setIsSuccess(result.success);
    setStatusMessage(result.message);
    setIsSyncing(false);
    setTimeout(() => setStatusMessage(null), 6000);
  };

  const handleForceSave = async () => {
    setIsSyncing(true);
    setStatusMessage('Enviando dados locais para a nuvem Firestore...');
    try {
      const currentClients = getWorkshopData('clients', tenant, []);
      const currentVehicles = getWorkshopData('vehicles', tenant, []);
      const currentOrders = getWorkshopData('orders', tenant, []);

      await saveWorkshopData('clients', currentClients, tenant);
      await saveWorkshopData('vehicles', currentVehicles, tenant);
      await saveWorkshopData('orders', currentOrders, tenant);

      setIsSuccess(true);
      setStatusMessage(`Backup na nuvem concluído! ${currentClients.length} clientes e ${currentVehicles.length} veículos salvos com sucesso.`);
    } catch (e: any) {
      setIsSuccess(false);
      setStatusMessage(`Erro ao salvar na nuvem: ${e?.message || 'Falha de conexão.'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleExport = () => {
    exportBackupJSON(tenant);
    setIsSuccess(true);
    setStatusMessage('Arquivo de backup (.JSON) baixado com sucesso!');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSyncing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = await importBackupJSON(content, tenant);
        setIsSuccess(res.success);
        setStatusMessage(res.message);
      }
      setIsSyncing(false);
      setTimeout(() => setStatusMessage(null), 6000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleRestore}
          disabled={isSyncing}
          className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          title="Restaurar clientes e dados do banco de dados na nuvem"
        >
          <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
          <span>Restaurar Nuvem</span>
        </button>
        <button
          onClick={handleExport}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          title="Baixar arquivo de backup de segurança"
        >
          <Download size={12} />
          <span>Backup JSON</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-blue-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 flex items-center gap-1.5">
              <Database size={13} /> BANCO DE DADOS NA NUVEM (FIRESTORE) ATIVO
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white uppercase italic tracking-tight">
            Proteção Permanente de Clientes & Histórico
          </h3>

          <p className="text-xs text-zinc-400 font-medium max-w-2xl">
            Seus clientes e dados são gravados no banco de dados na nuvem. Mesmo se o sistema for atualizado,
            seus clientes continuam protegidos e nunca são apagados.
          </p>

          <div className="flex items-center gap-4 pt-1">
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] font-bold text-zinc-300">
              {clients.length} {clients.length === 1 ? 'Cliente cadastrado' : 'Clientes cadastrados'}
            </div>
            <div className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
              <ShieldCheck size={14} /> 100% Sincronizado
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={handleRestore}
            disabled={isSyncing}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-900/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
            <span>Restaurar da Nuvem</span>
          </button>

          <button
            onClick={handleForceSave}
            disabled={isSyncing}
            className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Cloud size={15} className="text-emerald-400" />
            <span>Salvar na Nuvem</span>
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            title="Baixar arquivo de backup .JSON para guardar no computador ou celular"
          >
            <Download size={15} />
            <span>Exportar Backup</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            title="Importar arquivo de backup .JSON"
          >
            <Upload size={15} />
            <span>Importar</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {statusMessage && (
        <div className={`mt-4 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-300 border ${
          isSuccess 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
};

export default CloudSyncBanner;
