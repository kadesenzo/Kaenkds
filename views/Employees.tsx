
import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, Clock, Wrench, Search, Plus, Trash2, User, X, Check } from 'lucide-react';
import { Employee, UserSession } from '../types';

interface EmployeesProps {
  session?: UserSession;
  syncData?: (key: string, data: any) => Promise<void>;
}

const Employees: React.FC<EmployeesProps> = ({ session, syncData }) => {
  const [staff, setStaff] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    role: 'Mecânico',
    shift: 'Diurno',
  });

  useEffect(() => {
    if (session) {
      const saved = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_employees`) || '[]');
      setStaff(saved);
    }
  }, [session]);

  const handleSave = async () => {
    if (!newEmployee.name || !session || !syncData) return;

    const employee: Employee = {
      id: Math.random().toString(36).substr(2, 9),
      name: newEmployee.name,
      role: newEmployee.role,
      shift: newEmployee.shift,
      services: 0,
      status: 'Ativo',
      createdAt: new Date().toISOString()
    };

    const updatedStaff = [...staff, employee];
    setStaff(updatedStaff);
    await syncData('employees', updatedStaff);
    setShowModal(false);
    setNewEmployee({ name: '', role: 'Mecânico', shift: 'Diurno' });
  };

  const handleDelete = async (id: string) => {
    if (!session || !syncData) return;
    if (confirm("Deseja remover este colaborador da equipe?")) {
      const updated = staff.filter(e => e.id !== id);
      setStaff(updated);
      await syncData('employees', updated);
    }
  };

  const filtered = staff.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Equipe Técnica</h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Gestão de colaboradores ativos em <span className="text-white">{session?.username}</span></p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#FF2D55] px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center space-x-2 hover:bg-[#D11D40] transition-all shadow-xl shadow-red-900/20"
        >
          <Plus size={18} />
          <span>Cadastrar Colaborador</span>
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-2xl flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar funcionário..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none py-3 pl-12 pr-4 focus:ring-0 text-white font-bold placeholder-zinc-700" 
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-[2.5rem] p-16 text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-600">
            <UserCheck size={32} />
          </div>
          <p className="text-zinc-500 font-black uppercase tracking-widest">Base de equipe vazia.</p>
          <p className="text-zinc-600 text-xs mt-1 uppercase">Nenhum funcionário cadastrado no servidor.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-950/80 text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-black">
                  <th className="px-8 py-5">Colaborador</th>
                  <th className="px-8 py-5">Cargo / Acesso</th>
                  <th className="px-8 py-5">Turno</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Data Início</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-11 h-11 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500 border border-zinc-800 group-hover:border-[#FF2D55]/50 transition-all">
                          <User size={22} />
                        </div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{e.name}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-lg text-[10px] font-black uppercase text-zinc-400">
                        {e.role}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Clock size={14} />
                        <span className="text-[10px] font-black uppercase">{e.shift}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-emerald-500">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{e.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-xs text-zinc-500 font-bold uppercase tracking-widest">
                      {new Date(e.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleDelete(e.id)}
                        className="p-3 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Cadastro */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white"><X size={28} /></button>
            
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-[#FF2D55] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-900/20">
                <UserCheck size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Novo Integrante</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Equipe de {session?.username}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome do Colaborador</label>
                <input 
                  type="text" 
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-[#FF2D55] outline-none font-bold placeholder-zinc-800"
                  placeholder="DIGITE O NOME COMPLETO"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Função</label>
                  <select 
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-[#FF2D55] outline-none font-bold"
                  >
                    <option value="Mecânico">Mecânico</option>
                    <option value="Recepção">Recepção</option>
                    <option value="Auxiliar">Auxiliar</option>
                    <option value="Gerente">Gerente</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Turno</label>
                  <select 
                    value={newEmployee.shift}
                    onChange={(e) => setNewEmployee({...newEmployee, shift: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-[#FF2D55] outline-none font-bold"
                  >
                    <option value="Diurno">Diurno</option>
                    <option value="Noturno">Noturno</option>
                    <option value="Flexível">Flexível</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full bg-[#FF2D55] py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-red-900/30 mt-4 active:scale-95 transition-transform"
              >
                Efetivar Contratação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
