
import React from 'react';
import { Bell, LogOut, UserCircle, Menu, RefreshCw } from 'lucide-react';
import { SyncStatus } from '../types';

interface HeaderProps {
  onLogout: () => void;
  onToggleSidebar: () => void;
  role: string;
  username: string;
  syncStatus: SyncStatus;
}

const Header: React.FC<HeaderProps> = ({ onLogout, onToggleSidebar, role, username, syncStatus }) => {
  return (
    <header className="h-24 flex items-center justify-between px-6 md:px-12 z-40 bg-transparent sticky top-0">
      <div className="flex items-center gap-6">
        <button 
          onClick={onToggleSidebar}
          className="p-4 glass-card rounded-[1.8rem] text-zinc-300 hover:text-white hover:border-[#FF2D55] transition-all active:scale-90 flex items-center gap-3 group"
        >
          <Menu size={22} />
          <span className="hidden sm:block text-[9px] font-black uppercase tracking-[0.2em] group-hover:text-[#FF2D55]">Workspace</span>
        </button>

        <div className="hidden lg:flex items-center gap-3 px-6 py-3 glass-card rounded-full">
          {syncStatus === SyncStatus.SYNCING ? (
            <RefreshCw size={14} className="text-[#FF2D55] animate-spin" />
          ) : (
            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
          )}
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
            {syncStatus === SyncStatus.SYNCING ? 'Encrypting...' : 'Neural Link Active'}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative p-4 glass-card rounded-full text-zinc-400 hover:text-white transition-all hover:scale-110 active:scale-90 hidden sm:flex items-center justify-center">
          <Bell size={20} />
          <span className="absolute top-4 right-4 w-2 h-2 bg-[#FF2D55] rounded-full ring-4 ring-black"></span>
        </button>

        <div className="flex items-center space-x-4 glass-card px-2 py-2 rounded-full">
          <div className="text-right pl-6 hidden sm:block">
            <p className="text-[11px] font-black text-white uppercase italic leading-none">{username}</p>
            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{role}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 overflow-hidden shadow-inner">
            <UserCircle size={28} />
          </div>
          <button 
            onClick={onLogout}
            className="p-3 text-zinc-500 hover:text-[#FF2D55] hover:scale-110 active:scale-90 transition-all pr-4"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
