
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Car, PlusSquare, FileText, Package, UserCheck,
  Settings, Wrench, ChevronRight, DollarSign, Smartphone, X, PieChart, CalendarDays, Sparkles,
  BookOpen, ClipboardCheck, Truck, BarChart3, Megaphone, Star, Repeat, MessageCircle,
  Camera, Lock
} from 'lucide-react';
import KaenLogo from './KaenLogo';

interface SidebarProps {
  role: 'Dono' | 'Funcionário' | 'Recepção' | 'Gerente' | 'Mecânico' | 'Estoque' | string;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, isOpen, onClose }) => {
  const menuItems = [
    { category: 'OPERACIONAL', items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['Dono', 'Funcionário', 'Recepção'] },
      { name: 'Agenda', icon: CalendarDays, path: '/calendar', roles: ['Dono', 'Recepção', 'Funcionário'] },
      { name: 'Ordens de Serviço', icon: Wrench, path: '/orders', roles: ['Dono', 'Recepção', 'Funcionário'] },
      { name: 'Checklists Pátio', icon: ClipboardCheck, path: '/checklists', roles: ['Dono', 'Recepção', 'Funcionário'] },
      { name: 'Terminal Mecânico', icon: Smartphone, path: '/terminal', roles: ['Dono', 'Funcionário'] },
      { name: 'Nova OS / Entrada', icon: PlusSquare, path: '/orders/new', roles: ['Dono', 'Recepção', 'Funcionário'] },
    ]},
    { category: 'COMERCIAL & CRM', items: [
      { name: 'Orçamentos & Aprovação', icon: DollarSign, path: '/budgets', roles: ['Dono', 'Recepção', 'Funcionário'] },
      { name: 'Clientes', icon: Users, path: '/clients', roles: ['Dono', 'Recepção'] },
      { name: 'Veículos', icon: Car, path: '/vehicles', roles: ['Dono', 'Recepção', 'Funcionário'] },
      { name: 'WhatsApp Hub', icon: MessageCircle, path: '/whatsapp', roles: ['Dono', 'Recepção', 'Funcionário'] },
      { name: 'Pós-Venda & Lembretes', icon: Repeat, path: '/after-sales', roles: ['Dono', 'Recepção'] },
      { name: 'Avaliações Google', icon: Star, path: '/reviews', roles: ['Dono', 'Recepção'] },
      { name: 'Marketing & Funil', icon: Megaphone, path: '/marketing', roles: ['Dono', 'Recepção'] },
    ]},
    { category: 'GESTÃO & FINANCEIRO', items: [
      { name: 'Financeiro', icon: PieChart, path: '/financial', roles: ['Dono'] },
      { name: 'Relatórios & Lucro', icon: BarChart3, path: '/reports', roles: ['Dono'] },
      { name: 'Cobranças', icon: DollarSign, path: '/billing', roles: ['Dono', 'Recepção'] },
      { name: 'Estoque de Peças', icon: Package, path: '/inventory', roles: ['Dono', 'Recepção'] },
      { name: 'Fornecedores', icon: Truck, path: '/suppliers', roles: ['Dono', 'Recepção'] },
      { name: 'Equipe KAEN', icon: UserCheck, path: '/employees', roles: ['Dono'] },
    ]},
    { category: 'INTELIGÊNCIA & ARQUIVOS', items: [
      { name: 'IA KAEN Assistente', icon: Sparkles, path: '/ai-marketing', roles: ['Dono', 'Recepção', 'Funcionário'] },
      { name: 'Central de Fotos', icon: Camera, path: '/gallery', roles: ['Dono', 'Recepção', 'Funcionário'] },
      { name: 'Dossiê do Sistema (PDF)', icon: BookOpen, path: '/project-dossier', roles: ['Dono', 'Recepção', 'Funcionário'] },
      { name: 'Usuários & Permissões', icon: Lock, path: '/users', roles: ['Dono'] },
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
        fixed inset-y-0 left-0 sm:inset-y-4 sm:left-4 z-[150] w-[85vw] sm:w-[21rem] glass-card rounded-r-[2.5rem] sm:rounded-[3rem] lg:rounded-[3.5rem] transition-all duration-500 transform ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col overflow-hidden shadow-[0_50px_120px_rgba(0,0,0,0.9)] border-white/10
        ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-[125%] opacity-0 pointer-events-none lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto'}
        lg:relative lg:inset-y-0 lg:left-0 lg:m-8 lg:mr-0
      `}>
        <div className="p-6 sm:p-8 lg:p-12 flex items-center justify-between flex-shrink-0 border-b border-white/5 lg:border-none">
          <div className="flex items-center">
            <KaenLogo variant="horizontal" className="h-9 sm:h-10 w-auto" />
          </div>
          <button onClick={onClose} className="p-2.5 sm:p-3 bg-white/5 hover:bg-[#FF2D55] rounded-xl text-zinc-400 hover:text-white transition-all active:scale-90 lg:hidden cursor-pointer" aria-label="Fechar Menu">
            <X size={20}/>
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
        
        <div className="p-8 border-t border-white/5 bg-zinc-950/20">
           <NavLink 
             to="/settings" 
             onClick={onClose}
             className={({ isActive }) => `
               flex items-center gap-4 cursor-pointer transition-colors group
               ${isActive ? 'text-[#FF2D55]' : 'text-zinc-500 hover:text-white'}
             `}
           >
              <Settings size={20} className="group-hover:rotate-45 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Ajustes & Configurações</span>
           </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
