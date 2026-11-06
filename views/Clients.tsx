
import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, Phone, FileText, ChevronRight, X, User, MessageCircle, Copy, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client, Vehicle, ServiceOrder, UserSession } from '../types';
import { getWorkshopData, saveWorkshopData, mergeUniqueById } from '../src/lib/storage';

interface ClientsProps {
  role: 'Dono' | 'Funcionário' | 'Recepção' | 'Gerente' | 'Mecânico' | 'Estoque' | string;
  session?: UserSession;
  syncData?: (key: string, data: any) => Promise<void>;
}

const Clients: React.FC<ClientsProps> = ({ role, session, syncData }) => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    document: '',
    observations: ''
  });
  const [newVehicle, setNewVehicle] = useState({
    plate: '',
    model: '',
    brand: '',
    year: '',
    km: ''
  });

  const loadData = () => {
    const loadedClients = getWorkshopData<Client[]>('clients', session?.username, []);
    setClients(loadedClients);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('kaen_storage_updated', loadData);
    return () => window.removeEventListener('kaen_storage_updated', loadData);
  }, [session]);

  const handleSave = async () => {
    if (!newClient.name || !newClient.phone || !newVehicle.plate) {
      alert("ERRO: Nome, Telefone e Placa do Veículo são obrigatórios.");
      return;
    }
    
    const clientId = Math.random().toString(36).substr(2, 9);
    const client: Client = {
      ...newClient,
      id: clientId,
      createdAt: new Date().toISOString()
    };

    const vehicle: Vehicle = {
      id: Math.random().toString(36).substr(2, 9),
      clientId: clientId,
      plate: newVehicle.plate.toUpperCase().trim(),
      model: newVehicle.model.toUpperCase().trim() || 'VEÍCULO',
      brand: newVehicle.brand.toUpperCase().trim() || 'GERAL',
      year: newVehicle.year || 'N/A',
      km: parseFloat(newVehicle.km) || 0
    };

    const currentClients = getWorkshopData<Client[]>('clients', session?.username, []);
    const updatedClients = mergeUniqueById(currentClients, [client]);

    const currentVehicles = getWorkshopData<Vehicle[]>('vehicles', session?.username, []);
    const updatedVehicles = mergeUniqueById(currentVehicles, [vehicle]);

    setClients(updatedClients);
    await saveWorkshopData('clients', updatedClients, session?.username);
    await saveWorkshopData('vehicles', updatedVehicles, session?.username);
    if (syncData) {
      await syncData('clients', updatedClients);
      await syncData('vehicles', updatedVehicles);
    }
    
    setShowModal(false);
    setNewClient({ name: '', phone: '', document: '', observations: '' });
    setNewVehicle({ plate: '', model: '', brand: '', year: '', km: '' });
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (role !== 'Dono') {
      alert("Acesso Negado: Apenas o Administrador pode excluir clientes.");
      return;
    }

    const confirmMessage = `⚠️ ATENÇÃO: Tem certeza que deseja excluir o cliente ${clientName}?\n\nEsta ação excluirá o cadastro local e da nuvem.`;
    
    if (confirm(confirmMessage)) {
      const currentClients = getWorkshopData<Client[]>('clients', session?.username, []);
      const updatedClients = currentClients.filter(c => c.id !== clientId);

      const currentVehicles = getWorkshopData<Vehicle[]>('vehicles', session?.username, []);
      const updatedVehicles = currentVehicles.filter(v => v.clientId !== clientId);

      await saveWorkshopData('clients', updatedClients, session?.username);
      await saveWorkshopData('vehicles', updatedVehicles, session?.username);
      if (syncData) {
        await syncData('clients', updatedClients);
        await syncData('vehicles', updatedVehicles);
      }
      
      setClients(updatedClients);
    }
  };

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.document.includes(searchTerm) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Clientes Cadastrados</h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
            {clients.length} {clients.length === 1 ? 'cliente protegido no banco de dados' : 'clientes protegidos no banco de dados'}
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#FF2D55] px-6 py-3.5 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center space-x-2 hover:bg-[#D11D40] transition-all shadow-xl shadow-red-900/20 active:scale-95 cursor-pointer"
        >
          <UserPlus size={18} />
          <span>Novo Cliente</span>
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-2xl flex items-center shadow-lg">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-zinc-600" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, placa ou contato..." 
            className="w-full bg-transparent border-none py-3.5 pl-12 pr-4 focus:ring-0 text-white font-bold placeholder-zinc-800 outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-[3rem] p-16 text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-600">
            <User size={32} />
          </div>
          <p className="text-zinc-500 font-black uppercase tracking-widest">Nenhum cliente sincronizado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(c => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 hover:border-[#A32121]/50 transition-all group relative overflow-hidden shadow-xl">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-[#FF2D55] transition-all border border-zinc-800">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-white group-hover:text-zinc-100 uppercase tracking-tight text-lg italic">{c.name}</h3>
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">{c.document || 'Sem Documento'}</p>
                  </div>
                </div>
                {role === 'Dono' && (
                  <button 
                    onClick={() => handleDeleteClient(c.id, c.name)}
                    className="p-3 text-zinc-800 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-3xl p-6 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">WhatsApp Principal</span>
                  <a href={`https://wa.me/55${c.phone.replace(/\D/g,'')}`} target="_blank" className="text-[#25D366] hover:scale-125 transition-transform"><MessageCircle size={16} /></a>
                </div>
                <div className="text-xl font-black text-zinc-200">{c.phone}</div>
              </div>

              <button 
                onClick={() => navigate(`/clients/${c.id}`)}
                className="w-full bg-zinc-800 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FF2D55] transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                <FileText size={16} /> Ver Perfil Completo
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cadastro - Otimizado para Mobile */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-md overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl p-5 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative animate-in zoom-in max-h-[92vh] overflow-y-auto my-auto">
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-4 right-4 sm:top-8 sm:right-8 text-zinc-500 hover:text-white p-2 transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 flex items-center gap-3 italic uppercase tracking-tighter">
              <UserPlus className="text-[#FF2D55]" size={26} />
              Novo Cliente Cloud
            </h2>
            
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome Completo *</label>
                    <input 
                      type="text" 
                      value={newClient.name}
                      onChange={(e) => setNewClient({...newClient, name: e.target.value.toUpperCase()})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 text-white focus:border-[#FF2D55] outline-none font-bold placeholder-zinc-800 uppercase text-xs"
                      placeholder="NOME DO CLIENTE"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">WhatsApp / Celular *</label>
                    <input 
                      type="text" 
                      value={newClient.phone}
                      onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 text-white focus:border-[#FF2D55] outline-none font-bold text-xs"
                      placeholder="(13) 99689-2958"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">CPF / CNPJ (Opcional)</label>
                    <input 
                      type="text" 
                      value={newClient.document}
                      onChange={(e) => setNewClient({...newClient, document: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 text-white focus:border-[#FF2D55] outline-none font-bold text-xs"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5 sm:p-7 bg-zinc-950/60 rounded-2xl sm:rounded-[2rem] border border-zinc-800">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF2D55]">Primeiro Veículo do Cliente</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Placa do Veículo *</label>
                    <input 
                      type="text" 
                      value={newVehicle.plate}
                      onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value.toUpperCase()})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-[#FF2D55] outline-none font-black tracking-widest text-xs uppercase"
                      placeholder="ABC-1D23"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Modelo / Veículo</label>
                    <input 
                      type="text" 
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value.toUpperCase()})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-[#FF2D55] outline-none font-bold text-xs uppercase"
                      placeholder="Ex: Honda Civic"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">KM Inicial</label>
                    <input 
                      type="number" 
                      value={newVehicle.km}
                      onChange={(e) => setNewVehicle({...newVehicle, km: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-[#FF2D55] outline-none font-bold text-xs"
                      placeholder="Ex: 85000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Ano / Fab.</label>
                    <input 
                      type="text" 
                      value={newVehicle.year}
                      onChange={(e) => setNewVehicle({...newVehicle, year: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-[#FF2D55] outline-none font-bold text-xs"
                      placeholder="Ex: 2020"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full bg-[#FF2D55] hover:bg-[#D11D40] py-4 sm:py-5 rounded-2xl sm:rounded-[2.5rem] font-black uppercase text-xs tracking-[0.25em] transition-all shadow-2xl shadow-red-900/40 active:scale-[0.98] cursor-pointer text-white"
              >
                Salvar no Banco de Dados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
