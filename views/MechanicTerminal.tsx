
import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Car, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Search, 
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  X,
  Share2,
  Check,
  Fuel,
  HelpCircle,
  FileText,
  DollarSign,
  Smartphone,
  ChevronRight,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client, Vehicle, OSItem, ServiceOrder, OSStatus, PaymentStatus, VehicleChecklist, UserSession } from '../types';

interface MechanicTerminalProps {
  session?: UserSession;
  syncData?: (key: string, data: any) => Promise<void>;
}

const MechanicTerminal: React.FC<MechanicTerminalProps> = ({ session, syncData }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'SERVICE' | 'CHECKLIST'>('SERVICE');
  const [showInstructions, setShowInstructions] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  const [search, setSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  const [serviceDescription, setServiceDescription] = useState('');
  const [items, setItems] = useState<OSItem[]>([]);
  const [labor, setLabor] = useState(0);
  const [currentKm, setCurrentKm] = useState('');

  const [checklist, setChecklist] = useState({
    fuelLevel: '1/2',
    damages: [] as string[],
    items: {
      'Faróis': true,
      'Lanternas': true,
      'Pneus': true,
      'Estepe': true,
      'Vidros': true,
      'Retrovisores': true,
      'Limpador': true,
      'Painel': true,
      'Interior': true,
      'Vazamentos': false
    } as Record<string, boolean>,
    observations: ''
  });

  const [showChecklistResult, setShowChecklistResult] = useState<VehicleChecklist | null>(null);

  useEffect(() => {
    if (session) {
      setVehicles(JSON.parse(localStorage.getItem(`kaenpro_${session.username}_vehicles`) || '[]'));
      setClients(JSON.parse(localStorage.getItem(`kaenpro_${session.username}_clients`) || '[]'));
    }
  }, [session]);

  const filteredVehicles = search.length > 1 ? vehicles.filter(v => 
    v.plate.toLowerCase().includes(search.toLowerCase()) ||
    v.model.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const handleSelectVehicle = (v: Vehicle) => {
    setSelectedVehicle(v);
    setCurrentKm(v.km.toString());
    setSearch('');
  };

  const toggleDamage = (area: string) => {
    setChecklist(prev => ({
      ...prev,
      damages: prev.damages.includes(area) 
        ? prev.damages.filter(a => a !== area) 
        : [...prev.damages, area]
    }));
  };

  const handleFinalizeService = async () => {
    if (!selectedVehicle || !serviceDescription || !session || !syncData) {
      alert("ERRO: Selecione um veículo e descreva o serviço.");
      return;
    }
    
    const owner = clients.find(c => c.id === selectedVehicle.clientId);
    const newOs: ServiceOrder = {
      id: Math.random().toString(36).substr(2, 9),
      osNumber: `TEC-${Date.now().toString().slice(-6)}`,
      clientId: selectedVehicle.clientId,
      clientName: owner?.name || 'Cliente Genérico',
      vehicleId: selectedVehicle.id,
      vehiclePlate: selectedVehicle.plate,
      vehicleModel: selectedVehicle.model,
      vehicleKm: currentKm,
      problem: serviceDescription,
      items,
      laborValue: labor,
      discount: 0,
      totalValue: (items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0)) + labor,
      status: OSStatus.FINALIZADO,
      paymentStatus: PaymentStatus.PENDENTE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const savedOrders = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
    const updatedOrders = [...savedOrders, newOs];
    await syncData('orders', updatedOrders);
    
    // Update KM in vehicle as well
    const updatedVehicles = vehicles.map(v => v.id === selectedVehicle.id ? {...v, km: parseFloat(currentKm) || v.km} : v);
    await syncData('vehicles', updatedVehicles);

    alert("SERVIÇO REGISTRADO NA NUVEM! O administrador poderá gerar a nota agora.");
    navigate('/orders');
  };

  const DamageArea = ({ id, label, className }: { id: string, label: string, className: string }) => (
    <button 
      onClick={() => toggleDamage(id)}
      className={`absolute ${className} rounded-xl border-2 text-[8px] font-black uppercase flex items-center justify-center p-2 transition-all duration-300
      ${checklist.damages.includes(id) 
        ? 'bg-[#E11D48] border-white text-white active-glow scale-110 z-10' 
        : 'bg-[#0F0F0F] border-[#1F1F1F] text-zinc-600 opacity-60 hover:opacity-100'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32 animate-in fade-in duration-500 px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Terminal <span className="text-[#E11D48]">Pro</span></h1>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Controle operacional mobile</p>
        </div>
        <button 
          onClick={() => setShowInstructions(true)}
          className="w-12 h-12 bg-[#0F0F0F] border border-[#1F1F1F] text-zinc-500 rounded-2xl flex items-center justify-center hover:text-white transition-all"
        >
          <HelpCircle size={22} />
        </button>
      </div>

      {/* Tabs - Grandes para touch */}
      <div className="bg-[#0F0F0F] p-2 rounded-3xl border border-[#1F1F1F] flex gap-2 shadow-2xl">
        <button 
          onClick={() => setActiveTab('SERVICE')}
          className={`flex-1 py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex flex-col items-center justify-center gap-2
          ${activeTab === 'SERVICE' ? 'bg-[#E11D48] text-white active-glow' : 'text-zinc-600 hover:text-zinc-300'}`}
        >
          <Wrench size={24} />
          <span>Serviço</span>
        </button>
        <button 
          onClick={() => setActiveTab('CHECKLIST')}
          className={`flex-1 py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex flex-col items-center justify-center gap-2
          ${activeTab === 'CHECKLIST' ? 'bg-[#E11D48] text-white active-glow' : 'text-zinc-600 hover:text-zinc-300'}`}
        >
          <ClipboardList size={24} />
          <span>Checklist</span>
        </button>
      </div>

      {!selectedVehicle ? (
        <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-8 rounded-[2.5rem] shadow-xl space-y-8">
          <div className="text-center">
            <h2 className="text-xl font-black uppercase tracking-tighter mb-2 italic">Acessar Veículo</h2>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Placa ou Modelo para começar</p>
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ex: ABC-1234..."
              className="w-full bg-[#050505] border-2 border-[#1F1F1F] rounded-[2rem] px-8 py-7 text-xl text-white font-black placeholder-zinc-800 focus:border-[#E11D48] outline-none transition-all uppercase tracking-widest text-center"
            />
            
            {filteredVehicles.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-4 bg-[#0F0F0F] border border-[#1F1F1F] rounded-[2rem] overflow-hidden z-50 shadow-2xl max-h-[300px] overflow-y-auto">
                {filteredVehicles.map(v => (
                  <button 
                    key={v.id} 
                    onClick={() => handleSelectVehicle(v)} 
                    className="w-full p-6 flex items-center justify-between hover:bg-zinc-900 border-b border-[#1F1F1F] last:border-none active:bg-[#E11D48] group"
                  >
                    <div className="text-left">
                      <p className="font-black text-white uppercase text-lg group-active:text-white">{v.plate}</p>
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest group-active:text-white/70">{v.model}</p>
                    </div>
                    <ChevronRight size={20} className="text-[#E11D48] group-active:text-white" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-6 opacity-30 pt-10">
            <Smartphone size={40} className="text-zinc-600" />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 text-center leading-relaxed">
              Desenvolvido para máxima rapidez<br/>dentro da oficina.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
           {/* Context Card */}
           <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-6 rounded-[2rem] flex items-center justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-24 bg-[#E11D48]/5 -skew-x-12 translate-x-10 pointer-events-none"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 bg-[#050505] rounded-2xl flex items-center justify-center border border-[#E11D48]/30 text-[#E11D48] shadow-inner">
                <Car size={32} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white leading-none uppercase italic tracking-tighter">{selectedVehicle.model}</h2>
                <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-black text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 uppercase tracking-widest">Placa: {selectedVehicle.plate}</span>
                    <span className="text-[10px] font-black text-[#E11D48] uppercase tracking-widest">{selectedVehicle.km.toLocaleString()} KM</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setSelectedVehicle(null)} 
              className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-600 hover:text-white border border-zinc-900 active:scale-90 transition-transform"
            >
              <X size={20} />
            </button>
          </div>

          {activeTab === 'SERVICE' ? (
            <div className="space-y-6">
               <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-8 rounded-[2.5rem] shadow-xl space-y-8">
                <div>
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 block ml-2">Serviço Realizado (Prontuário)</label>
                  <textarea 
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="O QUE VOCÊ FEZ NO CARRO? (Ex: Troca de óleo, pastilhas, etc)"
                    rows={6}
                    className="w-full bg-[#050505] border-2 border-[#1F1F1F] rounded-[2rem] p-6 text-sm text-white focus:border-[#E11D48] outline-none placeholder-zinc-800 font-bold leading-relaxed shadow-inner"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 block ml-2">Valor Mão de Obra</label>
                    <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 font-black text-lg italic">R$</span>
                        <input 
                            type="number" 
                            value={labor || ''} 
                            onChange={(e) => setLabor(parseFloat(e.target.value) || 0)} 
                            placeholder="0,00" 
                            className="w-full bg-[#050505] border-2 border-[#1F1F1F] rounded-2xl pl-16 pr-6 py-5 text-white font-black text-2xl focus:border-[#E11D48] outline-none" 
                        />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 block ml-2">Quilometragem Atual</label>
                    <input 
                        type="number" 
                        value={currentKm} 
                        onChange={(e) => setCurrentKm(e.target.value)} 
                        placeholder="000.000" 
                        className="w-full bg-[#050505] border-2 border-[#1F1F1F] rounded-2xl px-6 py-5 text-white font-black text-2xl focus:border-[#E11D48] outline-none" 
                    />
                  </div>
                </div>
                
                <button 
                  onClick={handleFinalizeService} 
                  className="w-full bg-[#E11D48] py-8 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-red-900/20 active:scale-95 transition-all active-glow"
                >
                  <CheckCircle2 size={28} /> Confirmar Entrega
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-8 rounded-[2.5rem] shadow-xl">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3 italic">
                        <AlertTriangle size={22} className="text-amber-500" /> 
                        Mapeamento Visual
                    </h3>
                    <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">{checklist.damages.length} Avarias</span>
                </div>
                
                <div className="relative w-full aspect-[16/10] bg-[#050505] rounded-[2.5rem] border border-[#1F1F1F] overflow-hidden mb-8 shadow-inner flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none scale-150 grayscale invert">
                    <Car size={350} />
                  </div>
                  
                  {/* Hotspots */}
                  <DamageArea id="diant-esq" label="D.E" className="top-[15%] left-[15%]" />
                  <DamageArea id="diant-dir" label="D.D" className="top-[15%] right-[15%]" />
                  <DamageArea id="capo" label="Capô" className="top-[45%] left-[20%]" />
                  <DamageArea id="teto" label="Teto" className="top-[45%] left-[50%] -translate-x-1/2" />
                  <DamageArea id="traseira" label="Tras" className="top-[45%] right-[10%]" />
                  <DamageArea id="tras-esq" label="T.E" className="bottom-[15%] left-[15%]" />
                  <DamageArea id="tras-dir" label="T.D" className="bottom-[15%] right-[15%]" />
                </div>
                
                <p className="text-[9px] text-zinc-700 font-black uppercase text-center tracking-[0.2em] italic">Selecione as áreas para marcar batidas ou riscos</p>
              </div>

              {/* Fuel Selector */}
              <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-8 rounded-[2.5rem] shadow-xl">
                 <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 italic"><Fuel size={14} className="text-[#E11D48]" /> Nível de Combustível</h3>
                 <div className="grid grid-cols-4 gap-3">
                    {['Res', '1/4', '1/2', 'Cheio'].map(lvl => (
                      <button 
                        key={lvl}
                        onClick={() => setChecklist(p => ({...p, fuelLevel: lvl}))}
                        className={`py-5 rounded-2xl text-xs font-black border-2 transition-all duration-300 active:scale-90
                        ${checklist.fuelLevel === lvl ? 'bg-white text-black border-white shadow-xl glow-white' : 'bg-[#050505] text-zinc-700 border-[#1F1F1F]'}`}
                      >
                        {lvl}
                      </button>
                    ))}
                 </div>
              </div>

              <button 
                onClick={() => alert("Checklist salvo! Utilize 'Gerar Nota' para imprimir o relatório completo.")}
                className="w-full bg-[#E11D48] py-8 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-red-900/20 active:scale-95 transition-all active-glow"
              >
                <CheckCircle2 size={28} /> Finalizar Checklist
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MechanicTerminal;
