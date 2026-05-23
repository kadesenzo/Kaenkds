
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
  User,
  Camera,
  UserPlus
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
    observations: '',
    photos: [] as { label: string; url: string }[]
  });

  const [showChecklistResult, setShowChecklistResult] = useState<VehicleChecklist | null>(null);

  // States for Quick Registration of Client & Vehicle
  const [showRegisterClientModal, setShowRegisterClientModal] = useState(false);
  const [showRegisterVehicleModal, setShowRegisterVehicleModal] = useState(false);

  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientDoc, setNewClientDoc] = useState('');
  const [newClientObs, setNewClientObs] = useState('');

  const [vPlate, setVPlate] = useState('');
  const [vModel, setVModel] = useState('');
  const [vBrand, setVBrand] = useState('');
  const [vYear, setVYear] = useState('');
  const [vKm, setVKm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');

  const handleRegisterClientAndVehicle = async () => {
    if (!newClientName || !newClientPhone || !vPlate || !vModel || !session || !syncData) {
      alert("ERRO: Nome, WhatsApp, Placa e Modelo do Veículo são obrigatórios.");
      return;
    }

    const clientId = Math.random().toString(36).substr(2, 9);
    const clientObj: Client = {
      id: clientId,
      name: newClientName,
      phone: newClientPhone,
      document: newClientDoc || '',
      observations: newClientObs || '',
      createdAt: new Date().toISOString()
    };

    const vehicleId = Math.random().toString(36).substr(2, 9);
    const vehicleObj: Vehicle = {
      id: vehicleId,
      clientId: clientId,
      plate: vPlate.toUpperCase().trim(),
      model: vModel.trim(),
      brand: vBrand.trim() || '',
      year: vYear.trim() || '',
      km: parseFloat(vKm) || 0
    };

    const updatedClients = [...clients, clientObj];
    setClients(updatedClients);
    await syncData('clients', updatedClients);

    const updatedVehicles = [...vehicles, vehicleObj];
    setVehicles(updatedVehicles);
    await syncData('vehicles', updatedVehicles);

    // Reset fields
    setNewClientName('');
    setNewClientPhone('');
    setNewClientDoc('');
    setNewClientObs('');
    setVPlate('');
    setVModel('');
    setVBrand('');
    setVYear('');
    setVKm('');

    setShowRegisterClientModal(false);

    // Auto-select the newly registered vehicle
    handleSelectVehicle(vehicleObj);
    alert(`Cliente e Veículo cadastrados com sucesso! Iniciando atendimento para ${vehicleObj.plate}.`);
  };

  const handleRegisterVehicleOnly = async () => {
    if (!selectedClientId || !vPlate || !vModel || !session || !syncData) {
      alert("ERRO: Selecione um Cliente, e preencha Placa e Modelo do Veículo.");
      return;
    }

    const vehicleObj: Vehicle = {
      id: Math.random().toString(36).substr(2, 9),
      clientId: selectedClientId,
      plate: vPlate.toUpperCase().trim(),
      model: vModel.trim(),
      brand: vBrand.trim() || '',
      year: vYear.trim() || '',
      km: parseFloat(vKm) || 0
    };

    const updatedVehicles = [...vehicles, vehicleObj];
    setVehicles(updatedVehicles);
    await syncData('vehicles', updatedVehicles);

    // Reset fields
    setSelectedClientId('');
    setVPlate('');
    setVModel('');
    setVBrand('');
    setVYear('');
    setVKm('');

    setShowRegisterVehicleModal(false);

    // Auto-select the newly registered vehicle
    handleSelectVehicle(vehicleObj);
    alert(`Veículo cadastrado e vinculado ao cliente! Iniciando atendimento para ${vehicleObj.plate}.`);
  };

  useEffect(() => {
    if (session) {
      const load = () => {
        setVehicles(JSON.parse(localStorage.getItem(`kaenpro_${session.username}_vehicles`) || '[]'));
        setClients(JSON.parse(localStorage.getItem(`kaenpro_${session.username}_clients`) || '[]'));
      };
      
      load();
      window.addEventListener('kaen_storage_updated', load);
      return () => window.removeEventListener('kaen_storage_updated', load);
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

    if (session) {
      const savedOrders: ServiceOrder[] = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
      const activeOrderForVehicle = savedOrders.find(o => o.vehicleId === v.id && o.status !== OSStatus.FINALIZADO && o.status !== OSStatus.CANCELADO);
      if (activeOrderForVehicle && activeOrderForVehicle.checklist) {
        setChecklist({
          fuelLevel: activeOrderForVehicle.checklist.fuelLevel || '1/2',
          damages: activeOrderForVehicle.checklist.damages || [],
          items: activeOrderForVehicle.checklist.items || {
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
          },
          observations: activeOrderForVehicle.checklist.observations || '',
          photos: activeOrderForVehicle.checklist.photos || []
        });
        return;
      }
    }

    // Default reset if no active order checklist found
    setChecklist({
      fuelLevel: '1/2',
      damages: [],
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
      },
      observations: '',
      photos: []
    });
  };

  const toggleDamage = (area: string) => {
    setChecklist(prev => ({
      ...prev,
      damages: prev.damages.includes(area) 
        ? prev.damages.filter(a => a !== area) 
        : [...prev.damages, area]
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setChecklist(prev => ({
            ...prev,
            photos: [
              ...(prev.photos || []),
              { label: file.name.split('.')[0] || 'Foto do Veículo', url: reader.result as string }
            ]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const updatePhotoLabel = (index: number, label: string) => {
    setChecklist(prev => {
      const updatedPhotos = [...(prev.photos || [])];
      updatedPhotos[index] = { ...updatedPhotos[index], label };
      return { ...prev, photos: updatedPhotos };
    });
  };

  const removePhoto = (index: number) => {
    setChecklist(prev => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index)
    }));
  };

  const handleFinalizeChecklist = async () => {
    if (!selectedVehicle || !session || !syncData) {
      alert("ERRO: Escolha um veículo primeiro.");
      return;
    }
    
    const savedOrders: ServiceOrder[] = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
    const activeOrderIndex = savedOrders.findIndex(o => o.vehicleId === selectedVehicle.id && o.status !== OSStatus.FINALIZADO && o.status !== OSStatus.CANCELADO);
    
    if (activeOrderIndex !== -1) {
      // Attach/update checklist on the active budget / progress order!
      savedOrders[activeOrderIndex].checklist = {
        fuelLevel: checklist.fuelLevel,
        damages: checklist.damages,
        items: checklist.items,
        observations: checklist.observations,
        photos: checklist.photos
      };
      
      // Seed root level OS photos as well so client landing page gallery receives them nicely
      if (checklist.photos && checklist.photos.length > 0) {
        savedOrders[activeOrderIndex].photos = checklist.photos;
      }
      
      await syncData('orders', savedOrders);
      alert("Relatório Fotográfico e checklist salvos com sucesso na nuvem do cliente!");
    } else {
      alert("Checklist salvo localmente! Ele será anexado e enviado aos serviços quando você clicar em 'Confirmar Entrega' na aba de Serviço.");
    }
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
      updatedAt: new Date().toISOString(),
      checklist: {
        fuelLevel: checklist.fuelLevel,
        damages: checklist.damages,
        items: checklist.items,
        observations: checklist.observations,
        photos: checklist.photos
      },
      photos: checklist.photos && checklist.photos.length > 0 ? checklist.photos : undefined
    };
    
    const savedOrders = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
    const updatedOrders = [...savedOrders, newOs];
    await syncData('orders', updatedOrders);
    
    // Update KM in vehicle as well
    const updatedVehicles = vehicles.map(v => v.id === selectedVehicle.id ? {...v, km: parseFloat(currentKm) || v.km} : v);
    await syncData('vehicles', updatedVehicles);

    alert("SERVIÇO REGISTRADO NA NUVEM! O checklist, fotos e informações operacionais foram sincronizados.");
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

          <div className="border-t border-[#1F1F1F] pt-8 space-y-6">
            <div className="text-center">
              <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-1">Não encontrou o veículo na lista?</p>
              <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">Seja o primeiro a registrá-lo no banco de dados sincronizado.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  setVPlate(search.toUpperCase());
                  setShowRegisterClientModal(true);
                }}
                className="bg-zinc-950 hover:bg-zinc-900 border border-[#1F1F1F] hover:border-[#E11D48]/50 text-white font-black uppercase text-[10px] tracking-widest py-5 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all cursor-pointer group active:scale-95"
              >
                <UserPlus size={16} className="text-[#E11D48] group-hover:scale-125 transition-all" />
                <span>Novo Cliente + Carro</span>
              </button>
              <button 
                onClick={() => {
                  setVPlate(search.toUpperCase());
                  setShowRegisterVehicleModal(true);
                }}
                className="bg-zinc-950 hover:bg-zinc-900 border border-[#1F1F1F] hover:border-[#E11D48]/50 text-white font-black uppercase text-[10px] tracking-widest py-5 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all cursor-pointer group active:scale-95"
              >
                <Car size={16} className="text-[#E11D48] group-hover:scale-125 transition-all" />
                <span>Novo Carro Avulso</span>
              </button>
            </div>
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

              {/* Dynamic Photo Uploader & Gallery */}
              <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-8 rounded-[2.5rem] shadow-xl space-y-6">
                 <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                     <Camera size={14} className="text-[#E11D48]" /> Relatório Fotográfico do Box
                   </h3>
                   <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">
                     {checklist.photos?.length || 0} Fotos
                   </span>
                 </div>

                 <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#1F1F1F] hover:border-[#E11D48]/50 p-8 rounded-[2rem] cursor-pointer hover:bg-zinc-950/40 transition-all group">
                   <div className="w-14 h-14 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-600 group-hover:text-[#E11D48] border border-zinc-900 shadow-inner group-hover:scale-110 transition-transform">
                     <Camera size={24} />
                   </div>
                   <div className="mt-4 text-center">
                     <span className="text-xs font-black text-white uppercase tracking-wider block">Tirar ou Anexar Fotos</span>
                     <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1 block">Tire fotos do veículo em tempo real</span>
                   </div>
                   <input 
                     type="file" 
                     multiple 
                     accept="image/*" 
                     onChange={handlePhotoUpload} 
                     className="hidden" 
                   />
                 </label>

                 {checklist.photos && checklist.photos.length > 0 && (
                   <div className="grid grid-cols-2 gap-4">
                     {checklist.photos.map((ph, idx) => (
                       <div key={idx} className="relative group rounded-2xl overflow-hidden border border-[#1F1F1F]">
                         <img src={ph.url} alt={ph.label} className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col justify-end p-2.5">
                           <input 
                             type="text" 
                             value={ph.label} 
                             onChange={(e) => updatePhotoLabel(idx, e.target.value)}
                             placeholder="Ex: Risco para-choque..." 
                             className="bg-black/60 border border-white/5 rounded px-2 py-1 text-[9px] text-white font-bold uppercase focus:border-[#E11D48] outline-none"
                           />
                         </div>
                         <button 
                           type="button" 
                           onClick={() => removePhoto(idx)} 
                           className="absolute top-2 right-2 w-8 h-8 bg-black/80 hover:bg-[#E11D48] text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors border border-white/5 active:scale-95 z-20"
                         >
                           <Trash2 size={12} />
                         </button>
                       </div>
                     ))}
                   </div>
                 )}
              </div>

              <button 
                onClick={handleFinalizeChecklist}
                className="w-full bg-[#E11D48] py-8 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-red-900/20 active:scale-95 transition-all active-glow"
              >
                <CheckCircle2 size={28} /> Finalizar Checklist
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Cadastro de Cliente + Veículo */}
      {showRegisterClientModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0F0F0F] border border-[#1F1F1F] w-full max-w-xl p-8 rounded-[2.5rem] shadow-2xl relative my-8 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowRegisterClientModal(false)} 
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-all cursor-pointer w-10 h-10 flex items-center justify-center bg-zinc-950 border border-[#1F1F1F] rounded-xl active:scale-90"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-black mb-6 flex items-center gap-3 italic uppercase tracking-tighter">
              <UserPlus className="text-[#E11D48]" size={24} />
              Novo Cliente + Veículo
            </h2>
            
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
              {/* Informações do Cliente */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E11D48] flex items-center gap-2">
                  <User size={12} /> Informações do Proprietário
                </h3>
                
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome Completo *</label>
                  <input 
                    type="text" 
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#E11D48] outline-none font-bold placeholder-zinc-850"
                    placeholder="NOME COMPLETO DO CLIENTE"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">WhatsApp / Telefone *</label>
                    <input 
                      type="text" 
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#E11D48] outline-none font-bold"
                      placeholder="Ex: (11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">CPF / CNPJ (Opcional)</label>
                    <input 
                      type="text" 
                      value={newClientDoc}
                      onChange={(e) => setNewClientDoc(e.target.value)}
                      className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#E11D48] outline-none font-bold"
                      placeholder="Ex: 123.456.789-00"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Observações (Opcional)</label>
                  <input 
                    type="text" 
                    value={newClientObs}
                    onChange={(e) => setNewClientObs(e.target.value)}
                    className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#E11D48] outline-none font-bold"
                    placeholder="Ex: Prefere atendimento via whatsapp..."
                  />
                </div>
              </div>

              {/* Informações do Veículo */}
              <div className="space-y-4 pt-6 border-t border-[#1F1F1F]">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E11D48] flex items-center gap-2">
                  <Car size={12} /> Dados do Veículo
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Placa *</label>
                    <input 
                      type="text" 
                      value={vPlate}
                      onChange={(e) => setVPlate(e.target.value.toUpperCase())}
                      className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#E11D48] outline-none font-black tracking-widest uppercase"
                      placeholder="ABC-1234"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Modelo *</label>
                    <input 
                      type="text" 
                      value={vModel}
                      onChange={(e) => setVModel(e.target.value)}
                      className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#E11D48] outline-none font-bold"
                      placeholder="Ex: Corolla XEI"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Marca</label>
                    <input 
                      type="text" 
                      value={vBrand}
                      onChange={(e) => setVBrand(e.target.value)}
                      className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#E11D48] outline-none font-bold"
                      placeholder="Toyota"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Ano</label>
                    <input 
                      type="text" 
                      value={vYear}
                      onChange={(e) => setVYear(e.target.value)}
                      className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#E11D48] outline-none font-bold"
                      placeholder="2018"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">KM Atual</label>
                    <input 
                      type="number" 
                      value={vKm}
                      onChange={(e) => setVKm(e.target.value)}
                      className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#E11D48] outline-none font-bold"
                      placeholder="95000"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleRegisterClientAndVehicle}
                className="w-full bg-[#E11D48] py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-[#D11D40] transition-all cursor-pointer shadow-2xl shadow-red-900/20 active:scale-95"
              >
                Salvar e Iniciar Atendimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro de Veículo Avulso */}
      {showRegisterVehicleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0F0F0F] border border-[#1F1F1F] w-full max-w-xl p-8 rounded-[2.5rem] shadow-2xl relative my-8 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowRegisterVehicleModal(false)} 
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-all cursor-pointer w-10 h-10 flex items-center justify-center bg-zinc-950 border border-[#1F1F1F] rounded-xl active:scale-90"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-black mb-6 flex items-center gap-3 italic uppercase tracking-tighter">
              <Car className="text-[#E11D48]" size={24} />
              Registrar Outro Veículo
            </h2>
            
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Proprietário (Cliente Cadastrado) *</label>
                  <select 
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#E11D48] outline-none font-bold"
                  >
                    <option value="" className="text-zinc-650">SELECIONE O PROPRIETÁRIO...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#0F0F0F] text-white">
                        {c.name.toUpperCase()} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  {clients.length === 0 && (
                    <p className="text-[8px] font-bold uppercase text-amber-500 mt-1">Nenhum cliente cadastrado ainda. Use a opção "Novo Cliente + Carro".</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Placa *</label>
                    <input 
                      type="text" 
                      value={vPlate}
                      onChange={(e) => setVPlate(e.target.value.toUpperCase())}
                      className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#E11D48] outline-none font-black tracking-widest uppercase"
                      placeholder="ABC-1234"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Modelo *</label>
                    <input 
                      type="text" 
                      value={vModel}
                      onChange={(e) => setVModel(e.target.value)}
                      className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#E11D48] outline-none font-bold"
                      placeholder="Ex: Civic Touring"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Marca</label>
                    <input 
                      type="text" 
                      value={vBrand}
                      onChange={(e) => setVBrand(e.target.value)}
                      className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#E11D48] outline-none font-bold"
                      placeholder="Honda"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Ano</label>
                    <input 
                      type="text" 
                      value={vYear}
                      onChange={(e) => setVYear(e.target.value)}
                      className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#E11D48] outline-none font-bold"
                      placeholder="2020"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">KM Atual</label>
                    <input 
                      type="number" 
                      value={vKm}
                      onChange={(e) => setVKm(e.target.value)}
                      className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#E11D48] outline-none font-bold"
                      placeholder="45000"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleRegisterVehicleOnly}
                className="w-full bg-[#E11D48] py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-[#D11D40] transition-all cursor-pointer shadow-2xl shadow-red-900/20 active:scale-95"
              >
                Salvar e Iniciar Atendimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MechanicTerminal;
