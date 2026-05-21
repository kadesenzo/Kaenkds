import React, { useState, useEffect } from 'react';
import { LogOut, Menu, RefreshCw, LayoutDashboard, Wrench, Users, Shield, Smartphone } from 'lucide-react';
import { SyncStatus } from '../types';

interface HeaderProps {
  onLogout: () => void;
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

        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-zinc-900/45 rounded-full border border-white/5">
          {syncStatus === SyncStatus.SYNCING ? (
            <RefreshCw size={12} className="text-[#FF2D55] animate-spin" />
          ) : (
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          )}
          <span className="text-[8px] font-black uppercase tracking-[0.15em] text-zinc-400">
            {syncStatus === SyncStatus.SYNCING ? 'Sincronizando...' : 'Conectado'}
          </span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 bg-zinc-900/50 px-2 py-1.5 rounded-full border border-white/5 ml-auto sm:ml-0">
          <div className="text-right pl-3 hidden sm:block">
            <p className="text-[9px] sm:text-[10px] font-black text-white uppercase italic leading-none">{username}</p>
            <p className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{role}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 overflow-hidden font-black text-[10px] sm:text-xs uppercase italic shadow-inner">
            {username.slice(0, 2)}
          </div>
          <button 
            onClick={onLogout}
            className="p-2 sm:p-2.5 text-zinc-500 hover:text-[#FF2D55] hover:scale-105 active:scale-95 transition-all text-right"
            title="Sair do Workspace"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
