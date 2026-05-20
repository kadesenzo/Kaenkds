
import React from 'react';
import { Bell, LogOut, UserCircle, Menu, RefreshCw, LayoutDashboard, Wrench, Users, Shield } from 'lucide-react';
import { SyncStatus } from '../types';

interface HeaderProps {
  onLogout: () => void;
  onToggleSidebar: () => void;
  role: string;
  username: string;
  syncStatus: SyncStatus;
  workspaceMode: 'PRINCIPAL' | 'MECANICO' | 'RECEPCAO' | 'ADMIN';
  onWorkspaceModeChange: (mode: 'PRINCIPAL' | 'MECANICO' | 'RECEPCAO' | 'ADMIN') => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onLogout, onToggleSidebar, role, username, syncStatus, 
  workspaceMode, onWorkspaceModeChange 
}) => {
  return (
    <header className="h-28 flex flex-col md:flex-row items-center justify-between px-6 md:px-12 z-40 bg-black/45 backdrop-blur-md border-b border-white/5 sticky top-0 gap-4 py-4 md:py-0 mb-6">
      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
        <button 
          onClick={onToggleSidebar}
          className="p-3.5 glass-card rounded-[1.4rem] text-zinc-300 hover:text-white hover:border-[#FF2D55] transition-all active:scale-95 flex items-center gap-3 group"
        >
          <Menu size={18} />
          <span className="hidden sm:block text-[8px] font-black uppercase tracking-[0.2em] group-hover:text-[#FF2D55]">Menu</span>
        </button>

        {/* WORKSPACE MODE SEGMENTED BAR */}
        <div className="bg-zinc-950/80 border border-white/5 p-1 rounded-2xl flex items-center gap-1 shadow-inner">
          {[
            { mode: 'PRINCIPAL', label: 'Principal', icon: LayoutDashboard, color: 'hover:text-[#FF2D55]' },
            { mode: 'MECANICO', label: 'Oficina / Mecânico', icon: Wrench, color: 'hover:text-amber-500' },
            { mode: 'RECEPCAO', label: 'Recepção', icon: Users, color: 'hover:text-emerald-500' },
            { mode: 'ADMIN', label: 'Admin', icon: Shield, color: 'hover:text-red-500' }
          ].map(it => {
            const ActiveIcon = it.icon;
            const isSelected = workspaceMode === it.mode;
            return (
              <button
                key={it.mode}
                onClick={() => onWorkspaceModeChange(it.mode as any)}
                className={`px-3 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 group/btn
                ${isSelected 
                  ? 'bg-white text-black font-black shadow-lg scale-102' 
                  : `text-zinc-500 hover:bg-white/5 ${it.color}`}`}
                title={it.label}
              >
                <ActiveIcon size={14} className={isSelected ? 'text-black' : 'text-zinc-500 group-hover/btn:scale-110 transition-transform'} />
                <span className="hidden lg:block text-[9px] font-black uppercase tracking-wider">{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center space-x-6 w-full md:w-auto justify-end">
        <div className="hidden lg:flex items-center gap-3 px-6 py-3 glass-card rounded-full">
          {syncStatus === SyncStatus.SYNCING ? (
            <RefreshCw size={14} className="text-[#FF2D55] animate-spin" />
          ) : (
            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
          )}
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
            {syncStatus === SyncStatus.SYNCING ? 'Sincronizando...' : 'Conexão Segura Ativa'}
          </span>
        </div>

        <div className="flex items-center space-x-4 glass-card px-2 py-2 rounded-full">
          <div className="text-right pl-6 hidden sm:block">
            <p className="text-[11px] font-black text-white uppercase italic leading-none">{username}</p>
            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 overflow-hidden shadow-inner font-black text-xs uppercase italic">
            {username.slice(0, 2)}
          </div>
          <button 
            onClick={onLogout}
            className="p-3 text-zinc-500 hover:text-[#FF2D55] hover:scale-110 active:scale-90 transition-all pr-4"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
