
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Car, PlusSquare, FileText, Package, UserCheck,
  Settings, Wrench, ChevronRight, DollarSign, Smartphone, X, PieChart, CalendarDays
} from 'lucide-react';

interface SidebarProps {
  role: 'Dono' | 'Funcionário' | 'Recepção';
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, isOpen, onClose }) => {
  const menuItems = [
    { category: 'OPERACIONAL', items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['Dono', 'Funcionário', 'Recepção'] },
      { name: 'Agenda Pro', icon: CalendarDays, path: '/calendar', roles: ['Dono', 'Recepção', 'Funcionário'] },
      { name: 'Terminal Mecânico', icon: Smartphone, path: '/terminal', roles: ['Dono', 'Funcionário'] },
    ]},
    { category: 'VENDAS', items: [
      { name: 'Emitir Nota', icon: PlusSquare, path: '/orders/new', roles: ['Dono', 'Recepção', 'Funcionário'] },
      { name: 'Notas / OS', icon: FileText, path: '/orders', roles: ['Dono', 'Recepção', 'Funcionário'] },
    ]},
    { category: 'FINANCEIRO', items: [
      { name: 'Fluxo de Caixa', icon: PieChart, path: '/financial', roles: ['Dono'] },
      { name: 'Cobranças', icon: DollarSign, path: '/billing', roles: ['Dono', 'Recepção'] },
    ]},
    { category: 'CADASTROS', items: [
      { name: 'Clientes', icon: Users, path: '/clients', roles: ['Dono', 'Recepção'] },
      { name: 'Veículos', icon: Car, path: '/vehicles', roles: ['Dono', 'Recepção', 'Funcionário'] },
      { name: 'Estoque', icon: Package, path: '/inventory', roles: ['Dono', 'Recepção'] },
      { name: 'Equipe KAEN', icon: UserCheck, path: '/employees', roles: ['Dono'] },
    ]},
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[140] animate-in fade-in duration-500 lg:hidden" 
          onClick={onClose} 
        />
      )}

      <aside className={`
        fixed inset-y-8 left-8 z-[150] w-[21rem] glass-card rounded-[3.5rem] transition-all duration-700 transform ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col overflow-hidden shadow-[0_50px_120px_rgba(0,0,0,0.9)] border-white/10
        ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-[125%] opacity-0 pointer-events-none lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto'}
        lg:relative lg:inset-y-0 lg:left-0 lg:m-8 lg:mr-0
      `}>
        <div className="p-12 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-5">
            <div className="w-14 h-14 bg-[#FF2D55] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF2D55]/30 border border-white/20">
              <Wrench className="text-white w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">KAEN</span>
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em] mt-1 italic">BEYOND LIMITS</span>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-white/5 hover:bg-[#FF2D55] rounded-2xl text-zinc-500 hover:text-white transition-all active:scale-90 lg:hidden">
            <X size={24}/>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-8 space-y-8 no-scrollbar pb-16">
          {menuItems.map((cat) => {
            const filteredItems = cat.items.filter(item => item.roles.includes(role));
            if (filteredItems.length === 0) return null;

            return (
              <div key={cat.category} className="space-y-3">
                <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em] ml-7 italic">{cat.category}</p>
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <NavLink
                      key={item.path} to={item.path} onClick={onClose}
                      className={({ isActive }) => `
                        flex items-center justify-between px-7 py-4 rounded-[2.5rem] transition-all duration-500 group relative
                        ${isActive 
                          ? 'bg-[#FF2D55] text-white shadow-[0_20px_50px_rgba(255,45,85,0.3)]' 
                          : 'text-zinc-500 hover:bg-white/5 hover:text-white'}
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center space-x-5">
                            <item.icon size={20} className={isActive ? 'text-white' : 'text-zinc-600 group-hover:text-[#FF2D55]'} />
                            <span className="font-black text-[10px] uppercase tracking-[0.2em] italic">{item.name}</span>
                          </div>
                          {isActive && <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></div>}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        
        <div className="p-10 border-t border-white/5 bg-zinc-950/20">
           <div className="flex items-center gap-4 text-zinc-700 hover:text-zinc-400 cursor-pointer transition-colors group">
              <Settings size={20} className="group-hover:rotate-45 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Ajustes KAEN</span>
           </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
