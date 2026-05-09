
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  PlusSquare, 
  FileText, 
  Package, 
  UserCheck,
  Settings,
  Wrench,
  ChevronRight,
  DollarSign,
  Smartphone,
  X,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  role: 'Dono' | 'Funcionário' | 'Recepção';
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, isOpen, onClose }) => {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['Dono', 'Funcionário', 'Recepção'] },
    { name: 'Terminal Mecânico', icon: Smartphone, path: '/terminal', roles: ['Dono', 'Funcionário'] },
    { name: 'Criar Nota', icon: PlusSquare, path: '/orders/new', roles: ['Dono', 'Recepção', 'Funcionário'] },
    { name: 'Notas Geradas', icon: FileText, path: '/orders', roles: ['Dono', 'Recepção', 'Funcionário'] },
    { name: 'Cobranças', icon: DollarSign, path: '/billing', roles: ['Dono', 'Recepção'] },
    { name: 'Clientes', icon: Users, path: '/clients', roles: ['Dono', 'Recepção'] },
    { name: 'Veículos', icon: Car, path: '/vehicles', roles: ['Dono', 'Recepção', 'Funcionário'] },
    { name: 'Estoque', icon: Package, path: '/inventory', roles: ['Dono', 'Recepção'] },
    { name: 'Equipe', icon: UserCheck, path: '/employees', roles: ['Dono'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-[150] w-72 bg-[#0A0A0A] border-r border-[#1F1F1F] transition-all duration-300 transform
    md:relative md:translate-x-0
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <aside className={sidebarClasses}>
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#E11D48] rounded-2xl flex items-center justify-center glow-red">
            <Wrench className="text-white w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter text-white leading-none">KAEN<span className="text-[#E11D48]">PRO</span></span>
            <span className="text-[8px] font-black uppercase text-zinc-600 tracking-[0.2em] mt-1">Elite Management</span>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="md:hidden p-2 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 mt-4 px-4 space-y-1 overflow-y-auto no-scrollbar pb-10">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group
              ${isActive 
                ? 'bg-[#E11D48] text-white active-glow' 
                : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-100'}
            `}
          >
            {/* Wrap children in a function to access isActive state from NavLink context */}
            {({ isActive }) => (
              <>
                <div className="flex items-center space-x-4">
                  <item.icon size={20} className={isActive ? 'text-white' : 'text-zinc-600 group-hover:text-[#E11D48]'} />
                  <span className="font-black text-[10px] uppercase tracking-[0.15em]">{item.name}</span>
                </div>
                {isActive && <ChevronRight size={14} className="opacity-50" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 mt-auto border-t border-[#1F1F1F] bg-[#080808]">
        <div className="flex items-center space-x-3 p-4 rounded-2xl hover:bg-zinc-900 transition-colors cursor-pointer text-zinc-600 group">
          <div className="p-2 bg-zinc-900 rounded-lg group-hover:text-white transition-colors">
            <Settings size={18} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Painel de Ajustes</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
