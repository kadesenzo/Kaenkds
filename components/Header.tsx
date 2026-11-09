import React, { useState, useEffect } from 'react';
import { LogOut, Menu, RefreshCw, LayoutDashboard, Wrench, Users, Shield, Smartphone, Lock, ShieldAlert, X, Cloud } from 'lucide-react';
import { SyncStatus } from '../types';

interface HeaderProps {
  onLogout: (forgetDevice?: boolean) => void;
  onToggleSidebar: () => void;
  role: string;
  username: string;
  syncStatus: SyncStatus;
  workspaceMode: 'PRINCIPAL' | 'MECANICO' | 'RECEPCAO' | 'ADMIN';
  onWorkspaceModeChange: (mode: 'PRINCIPAL' | 'MECANICO' | 'RECEPCAO' | 'ADMIN') => void;
  tenant?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  onLogout, onToggleSidebar, role, username, syncStatus, 
  workspaceMode, onWorkspaceModeChange, tenant
}) => {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Listen to live presence updates from SSE connection
  useEffect(() => {
    // Initial fetch of presence as safe startup check
    const fetchPresence = async () => {
      try {
        const tenantCode = tenant || "rafael";
        const res = await fetch(`/api/presence/${tenantCode}`);
        if (res.ok) {
          const list = await res.json();
          setOnlineUsers(list);
        }
      } catch (err) {
        // quiet fail
      }
    };
    fetchPresence();

    const handlePresenceUpdate = (e: Event) => {
      const sessions = (e as CustomEvent).detail;
      if (Array.isArray(sessions)) {
        setOnlineUsers(sessions);
      }
    };
    
    window.addEventListener('kaen_presence_updated', handlePresenceUpdate);
    return () => {
      window.removeEventListener('kaen_presence_updated', handlePresenceUpdate);
    };
  }, []);

  // Filter available workspaces dynamically based on the user's role
  const allWorkspaces = [
    { mode: 'PRINCIPAL', label: 'Principal', icon: LayoutDashboard, color: 'hover:text-[#FF2D55]', roles: ['Dono', 'Funcionário', 'Recepção'] },
    { mode: 'MECANICO', label: 'Oficina / Pista', icon: Wrench, color: 'hover:text-amber-500', roles: ['Dono', 'Funcionário'] },
    { mode: 'RECEPCAO', label: 'Recepção', icon: Users, color: 'hover:text-emerald-500', roles: ['Dono', 'Recepção'] },
    { mode: 'ADMIN', label: 'Admin', icon: Shield, color: 'hover:text-red-500', roles: ['Dono'] }
  ];

  const allowedWorkspaces = allWorkspaces.filter(ws => ws.roles.includes(role));

  return (
    <header className="h-auto min-h-24 md:h-28 flex flex-col md:flex-row items-center justify-between px-4 md:px-12 z-40 bg-black/45 backdrop-blur-md border-b border-white/5 sticky top-0 gap-3 py-3 md:py-0 mb-4 md:mb-6 w-full">
      <div className="flex flex-row items-center gap-2 sm:gap-4 w-full md:w-auto justify-between md:justify-start">
        <button 
          onClick={onToggleSidebar}
          className="p-2 sm:p-3.5 bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 rounded-2xl text-zinc-300 hover:text-white hover:border-[#FF2D55] transition-all active:scale-95 flex items-center gap-2 group"
        >
          <Menu size={16} />
          <span className="hidden sm:block text-[8px] font-black uppercase tracking-[0.2em] group-hover:text-[#FF2D55]">Menu</span>
        </button>

        {/* WORKSPACE MODE SEGMENTED BAR */}
        <div className="bg-zinc-950/80 border border-white/5 p-0.5 sm:p-1 rounded-2xl flex items-center gap-0.5 sm:gap-1 shadow-inner overflow-hidden max-w-full">
          {allowedWorkspaces.map(it => {
            const ActiveIcon = it.icon;
            const isSelected = workspaceMode === it.mode;
            return (
              <button
                key={it.mode}
                onClick={() => onWorkspaceModeChange(it.mode as any)}
                className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all duration-300 flex items-center gap-1 sm:gap-2 group/btn
                ${isSelected 
                  ? 'bg-white text-black font-black shadow-md scale-102' 
                  : `text-zinc-500 hover:bg-white/5 ${it.color}`}`}
                title={it.label}
              >
                <ActiveIcon size={12} className={isSelected ? 'text-black' : 'text-zinc-550 group-hover/btn:scale-110 transition-transform'} />
                <span className="hidden lg:block text-[8px] sm:text-[9px] font-black uppercase tracking-wider">{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6 w-full md:w-auto justify-between sm:justify-end">
        {/* Pulsing online people indicator */}
        {onlineUsers.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/70 border border-white/5 rounded-full text-zinc-400 max-w-[180px] sm:max-w-none">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
            <span className="text-[7.5px] font-black uppercase tracking-wider leading-none truncate" title={onlineUsers.map(s => s.realUsername).join(", ")}>
              {onlineUsers.length} ON: {onlineUsers.map(s => s.realUsername.split(" ")[0]).slice(0, 2).join(", ")}{onlineUsers.length > 2 ? "..." : ""}
            </span>
          </div>
        )}

        <button 
          onClick={() => {
            window.dispatchEvent(new CustomEvent('kaen_force_cloud_backup'));
          }}
          className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 bg-zinc-900/60 hover:bg-zinc-800 rounded-full border border-white/5 hover:border-emerald-500/40 transition-all cursor-pointer group active:scale-95"
          title="Nuvem Firebase Firestore ativa. Clique para forçar backup instantâneo de todos os dados da oficina."
        >
          {syncStatus === SyncStatus.SYNCING ? (
            <RefreshCw size={11} className="text-[#FF2D55] animate-spin" />
          ) : (
            <Cloud size={12} className="text-emerald-400 group-hover:scale-110 transition-transform" />
          )}
          <span className="text-[8px] font-black uppercase tracking-[0.15em] text-zinc-300 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === SyncStatus.SYNCING ? 'bg-amber-400' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`}></span>
            <span className="hidden sm:inline">{syncStatus === SyncStatus.SYNCING ? 'Sincronizando...' : 'Nuvem Conectada'}</span>
            <span className="sm:hidden">{syncStatus === SyncStatus.SYNCING ? '...' : 'Nuvem'}</span>
          </span>
        </button>

        <div className="flex items-center space-x-2 sm:space-x-4 bg-zinc-900/50 px-2 py-1.5 rounded-full border border-white/5 ml-auto sm:ml-0">
          <div className="text-right pl-3 hidden sm:block">
            <p className="text-[9px] sm:text-[10px] font-black text-white uppercase italic leading-none">{username}</p>
            <p className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{role}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 overflow-hidden font-black text-[10px] sm:text-xs uppercase italic shadow-inner">
            {username.slice(0, 2)}
          </div>
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="p-2 sm:p-2.5 text-zinc-500 hover:text-[#FF2D55] hover:scale-105 active:scale-95 transition-all text-right"
            title="Encerrar Sessão / Opções de Segurança"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Logout Security Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0D0D0E] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-6 relative text-left">
            <button 
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-[#FF2D55] rounded-2xl flex items-center justify-center shrink-0">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="text-base font-black uppercase italic tracking-wider text-white">ENCERRAR SESSÃO</h3>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Gestão de Dispositivos Confiáveis</p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Como você deseja sair deste terminal da Auto Mecânica Kaen?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout(false);
                }}
                className="w-full p-4 bg-zinc-900/80 hover:bg-zinc-800/90 border border-white/5 hover:border-white/20 rounded-2xl transition-all text-left flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-300 group-hover:text-white shrink-0">
                  <Lock size={18} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-white tracking-wide">Bloquear Sessão</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5">Mantém este dispositivo salvo como confiável para reabertura rápida.</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout(true);
                }}
                className="w-full p-4 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40 rounded-2xl transition-all text-left flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-[#FF2D55] shrink-0">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-red-400 tracking-wide">Desconectar e Esquecer este Aparelho</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5">Remove este aparelho da lista segura. Próximo acesso exigirá a senha novamente.</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowLogoutModal(false)}
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5"
            >
              Cancelar e Continuar Trabalhando
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
