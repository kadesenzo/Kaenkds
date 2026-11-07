import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Wrench, ChevronLeft, X,
  User, Search, Loader2, Check, ImageIcon, Car, Info, Download, Phone, Package, Camera, Sparkles, Gauge, Zap,
  Printer, Share2, CheckCircle2, ArrowRight, RotateCcw, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client, Vehicle, OSItem, OSStatus, ServiceOrder, PaymentStatus, UserSession, Part } from '../types';
import html2canvas from 'html2canvas';
import Invoice from '../components/Invoice';
import PatioCheckinModal from '../components/PatioCheckinModal';
import { getWorkshopData, saveWorkshopData, mergeUniqueById } from '../src/lib/storage';

export const PRESET_SERVICES = [
  { label: 'Troca de Óleo e Filtro', icon: '🛢️', desc: 'TROCA DE ÓLEO DO MOTOR E FILTRO DE ÓLEO', defaultPrice: 280, type: 'SERVICE' as const },
  { label: 'Pastilhas de Freio', icon: '🛑', desc: 'SUBSTITUIÇÃO DE PASTILHAS DE FREIO DIANTEIRAS', defaultPrice: 220, type: 'SERVICE' as const },
  { label: 'Discos e Pastilhas', icon: '🛑', desc: 'REVISÃO DO SISTEMA DE FREIOS (DISCOS + PASTILHAS)', defaultPrice: 480, type: 'SERVICE' as const },
  { label: 'Alinhamento & Balanceamento', icon: '🔩', desc: 'ALINHAMENTO TÉCNICO COMPUTADORIZADO E BALANCEAMENTO', defaultPrice: 160, type: 'SERVICE' as const },
  { label: 'Diagnóstico com Scanner', icon: '⚡', desc: 'DIAGNÓSTICO ELETRÔNICO COMPLETO COM SCANNER AUTOMOTIVO', defaultPrice: 150, type: 'SERVICE' as const },
  { label: 'Higienização de Ar + Filtro', icon: '❄️', desc: 'HIGIENIZAÇÃO DE AR CONDICIONADO E FILTRO DE CABINE', defaultPrice: 140, type: 'SERVICE' as const },
  { label: 'Correia Dentada e Tensor', icon: '🧯', desc: 'SUBSTITUIÇÃO DO KIT CORREIA DENTADA E TENSOR', defaultPrice: 650, type: 'SERVICE' as const },
  { label: 'Arrefecimento + Aditivo', icon: '💧', desc: 'LIMPEZA DO SISTEMA DE ARREFECIMENTO E ADITIVO SINTÉTICO', defaultPrice: 210, type: 'SERVICE' as const },
  { label: 'Bateria e Teste de Carga', icon: '🔋', desc: 'TESTE DO SISTEMA DE CARGA E INSTALAÇÃO DE BATERIA', defaultPrice: 420, type: 'PART' as const },
  { label: 'Revisão Preventiva Geral', icon: '🚗', desc: 'REVISÃO PREVENTIVA GERAL (SUSPENSÃO, FREIOS, FLUIDOS)', defaultPrice: 350, type: 'SERVICE' as const },
];

const NewServiceOrder: React.FC<{ session?: UserSession; syncData?: (key: string, data: any) => Promise<void> }> = ({ session, syncData }) => {
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);

  // Fallback to active session in storage so note creation never hangs even if prop is missing
  const activeSession = session || (typeof window !== 'undefined' && sessionStorage.getItem('kaen_session') ? JSON.parse(sessionStorage.getItem('kaen_session') || '{}') : null);
  const tenant = activeSession?.username || 'rafael';
  
  const [step, setStep] = useState<'CLIENTE' | 'VEICULO' | 'ITENS' | 'FINAL'>('CLIENTE');
  const [showPatioModal, setShowPatioModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [partSearch, setPartSearch] = useState('');
  const [showPartSearch, setShowPartSearch] = useState(false);
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [showQuickVehicle, setShowQuickVehicle] = useState(false);
  
  const [quickClient, setQuickClient] = useState({ name: '', phone: '' });
  const [quickVehicle, setQuickVehicle] = useState({ model: '', plate: '', km: '' });
  
  const [items, setItems] = useState<OSItem[]>([]);
  const [labor, setLabor] = useState<string>('0');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDENTE);
  
  const [finalOs, setFinalOs] = useState<ServiceOrder | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = () => {
    const savedClients = getWorkshopData<Client[]>('clients', tenant, []);
    const savedVehicles = getWorkshopData<Vehicle[]>('vehicles', tenant, []);
    const savedParts = getWorkshopData<Part[]>('parts', tenant, []);
    setClients(savedClients);
    setVehicles(savedVehicles);
    setParts(savedParts);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('kaen_storage_updated', loadData);
    return () => window.removeEventListener('kaen_storage_updated', loadData);
  }, [tenant]);

  const totalValue = useMemo(() => {
    const itemsTotal = items.reduce((acc, curr) => acc + ((curr.quantity || 0) * (curr.unitPrice || 0)), 0);
    return itemsTotal + (parseFloat(labor) || 0);
  }, [items, labor]);

  // Handle client selection with immediate advancement
  const handleSelectClient = (c: Client) => {
    setSelectedClient(c);
    setSelectedVehicle(null);
    setStep('VEICULO');
  };

  // Handle quick client creation
  const handleCreateQuickClient = () => {
    if (!quickClient.name.trim()) {
      alert("Por favor, digite o nome do cliente.");
      return;
    }
    const newC: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: quickClient.name.trim().toUpperCase(),
      phone: quickClient.phone.trim() || '(13) 99689-2958',
      document: '---',
      observations: 'CADASTRADO NA EMISSÃO DA NOTA',
      createdAt: new Date().toISOString()
    };
    const currentClients = getWorkshopData<Client[]>('clients', tenant, []);
    const updated = mergeUniqueById(currentClients, [newC]);
    setClients(updated);
    saveWorkshopData('clients', updated, tenant);
    if (syncData) syncData('clients', updated).catch(console.warn);

    setSelectedClient(newC);
    setSelectedVehicle(null);
    setShowQuickClient(false);
    setQuickClient({ name: '', phone: '' });
    setStep('VEICULO');
  };

  // Immediate vehicle selection and step transition
  const handleSelectVehicleWithKm = (v: Vehicle, newKmStr: string) => {
    const newKm = parseFloat(newKmStr) || v.km || 0;
    const updatedVehicle: Vehicle = {
      ...v,
      km: newKm
    };
    setSelectedVehicle(updatedVehicle);
    setStep('ITENS');

    // Asynchronous background persistence
    try {
      const currentVehicles = getWorkshopData<Vehicle[]>('vehicles', tenant, []);
      const updatedVehicles = currentVehicles.map(item => item.id === v.id ? updatedVehicle : item);
      setVehicles(updatedVehicles);
      saveWorkshopData('vehicles', updatedVehicles, tenant);
      if (syncData) syncData('vehicles', updatedVehicles).catch(console.warn);
    } catch (err) {
      console.warn("Storage vehicle update warning:", err);
    }
  };

  // Handle quick vehicle creation with immediate advancement
  const handleCreateQuickVehicle = () => {
    if (!selectedClient) {
      alert("Selecione um cliente primeiro.");
      setStep('CLIENTE');
      return;
    }
    const plate = quickVehicle.plate.trim() ? quickVehicle.plate.trim().toUpperCase() : 'SEM PLACA';
    const model = quickVehicle.model.trim() ? quickVehicle.model.trim().toUpperCase() : 'VEÍCULO DIVERSOS';
    const km = parseFloat(quickVehicle.km) || 0;

    const newV: Vehicle = {
      id: Math.random().toString(36).substr(2, 9),
      clientId: selectedClient.id,
      model,
      plate,
      brand: '---',
      year: '---',
      km
    };
    const currentVehicles = getWorkshopData<Vehicle[]>('vehicles', tenant, []);
    const updated = mergeUniqueById(currentVehicles, [newV]);
    setVehicles(updated);
    saveWorkshopData('vehicles', updated, tenant);
    if (syncData) syncData('vehicles', updated).catch(console.warn);

    setSelectedVehicle(newV);
    setShowQuickVehicle(false);
    setQuickVehicle({ model: '', plate: '', km: '' });
    setStep('ITENS');
  };

  // Conclude and generate final invoice immediately
  const handleFinalize = async () => {
    if (!selectedClient) {
      alert("Selecione um cliente para gerar a nota.");
      setStep('CLIENTE');
      return;
    }
    if (!selectedVehicle) {
      alert("Selecione o veículo do cliente para gerar a nota.");
      setStep('VEICULO');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Auto-purge empty boxes (quadrados em branco)
      let validItems = items.filter(i => i.description && i.description.trim() !== '');

      // If user typed only labor or no items, provide an appropriate line item so invoice is clean
      const laborVal = parseFloat(labor) || 0;
      if (validItems.length === 0) {
        if (laborVal > 0) {
          validItems = [{
            id: Math.random().toString(36).substr(2, 9),
            description: 'SERVIÇO MECÂNICO KAEN (MÃO DE OBRA)',
            quantity: 1,
            unitPrice: laborVal,
            type: 'SERVICE'
          }];
        } else {
          validItems = [{
            id: Math.random().toString(36).substr(2, 9),
            description: 'MANUTENÇÃO TÉCNICA E REVISÃO',
            quantity: 1,
            unitPrice: 0,
            type: 'SERVICE'
          }];
        }
      }
      setItems(validItems);

      const itemsTotal = validItems.reduce((acc, curr) => acc + ((curr.quantity || 0) * (curr.unitPrice || 0)), 0);
      const computedTotal = itemsTotal + laborVal;

      const osNumber = `${Math.floor(100000 + Math.random() * 899999)}`;
      const os: ServiceOrder = {
        id: Math.random().toString(36).substr(2, 9),
        osNumber,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        clientPhone: selectedClient.phone || '(13) 99689-2958',
        vehicleId: selectedVehicle.id,
        vehiclePlate: selectedVehicle.plate,
        vehicleModel: selectedVehicle.model,
        vehicleKm: (selectedVehicle.km || 0).toString(),
        problem: 'MANUTENÇÃO TÉCNICA KAEN',
        items: validItems,
        laborValue: laborVal,
        discount: 0,
        totalValue: computedTotal,
        status: OSStatus.FINALIZADO,
        paymentStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // IMMEDIATELY ADVANCE TO FINAL NOTE
      setFinalOs(os);
      setStep('FINAL');

      // Save order to persistent workshop data in background
      try {
        const currentOrders = getWorkshopData<ServiceOrder[]>('orders', tenant, []);
        const updatedOrders = mergeUniqueById(currentOrders, [os]);
        await saveWorkshopData('orders', updatedOrders, tenant);
        if (syncData) {
          syncData('orders', updatedOrders).catch(err => console.warn("Background sync warning:", err));
        }
      } catch (saveErr) {
        console.warn("Storage save orders warning:", saveErr);
      }

      // Update inventory stock for used parts
      try {
        let updatedParts = [...parts];
        let hasPartChanges = false;
        validItems.forEach(item => {
          if (item.type === 'PART') {
            const pIndex = updatedParts.findIndex(p => p.name.toUpperCase() === item.description.toUpperCase());
            if (pIndex !== -1) {
              updatedParts[pIndex] = {
                ...updatedParts[pIndex],
                stock: Math.max(0, updatedParts[pIndex].stock - item.quantity)
              };
              hasPartChanges = true;
            }
          }
        });
        if (hasPartChanges) {
          setParts(updatedParts);
          saveWorkshopData('parts', updatedParts, tenant);
          if (syncData) syncData('parts', updatedParts).catch(console.warn);
        }
      } catch (pErr) {
        console.warn("Parts inventory warning:", pErr);
      }
    } catch (error) {
      console.error("Erro na nota:", error);
      alert("Houve um detalhe no processamento, mas a nota foi exibida.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPartFromInventory = (part: Part) => {
    setItems(prev => [...prev, { 
      id: Math.random().toString(36).substr(2, 9), 
      description: part.name.toUpperCase(), 
      quantity: 1, 
      unitPrice: part.salePrice, 
      type: 'PART' 
    }]);
    setShowPartSearch(false);
    setPartSearch('');
  };

  const downloadImage = async () => {
    const target = document.getElementById('render-target-hidden');
    if (!target || !finalOs || !previewRef.current) return;
    setIsSaving(true);
    
    const clone = previewRef.current.cloneNode(true) as HTMLDivElement;
    clone.style.width = '794px';
    clone.style.height = 'auto';
    clone.style.position = 'static';
    
    target.innerHTML = '';
    target.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, { 
        scale: 2.5, 
        backgroundColor: "#ffffff", 
        useCORS: true, 
        width: 794, 
        height: clone.offsetHeight 
      });
      const link = document.createElement('a');
      link.download = `KAEN_MECANICA_NOTA_${finalOs.osNumber}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      alert("Houve um erro ao gerar a imagem da nota.");
    } finally {
      target.innerHTML = ''; 
      setIsSaving(false);
    }
  };

  const handleResetForm = () => {
    setSelectedClient(null);
    setSelectedVehicle(null);
    setItems([]);
    setLabor('0');
    setFinalOs(null);
    setStep('CLIENTE');
  };

  // Filter vehicles for selected client
  const clientVehicles = useMemo(() => {
    if (!selectedClient) return [];
    return vehicles.filter(v => v.clientId === selectedClient.id);
  }, [vehicles, selectedClient]);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white items-center w-full">
      {/* Top Header */}
      <div className="w-full p-4 sm:p-6 flex items-center justify-between glass-card sticky top-0 z-50 rounded-b-[2rem] border-b border-white/10">
        <button onClick={() => navigate(-1)} className="p-3 sm:p-4 bg-white/5 rounded-full text-zinc-500 hover:text-white border border-white/10 active:scale-90 transition-all cursor-pointer">
          <ChevronLeft size={22} />
        </button>
        <div className="text-center">
          <h2 className="text-[11px] font-black uppercase tracking-[0.4em] italic text-zinc-300">
            EMISSÃO DE NOTA <span className="text-[#FF2D55]">KAEN</span>
          </h2>
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Mecânica de Precisão</p>
        </div>
        <button 
          onClick={handleResetForm} 
          className="p-3 bg-white/5 rounded-full text-zinc-400 hover:text-white border border-white/10 active:scale-90 transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1"
          title="Reiniciar Nota"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Visual Stepper / Breadcrumbs */}
      <div className="w-full max-w-2xl px-4 pt-6 pb-2">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 p-1.5 bg-zinc-950/80 border border-white/10 rounded-2xl shadow-xl">
          <button 
            onClick={() => setStep('CLIENTE')}
            className={`py-2 px-1 sm:px-3 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${step === 'CLIENTE' ? 'bg-[#FF2D55] text-white shadow-lg shadow-red-900/40' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <span>1. Cliente</span>
            {selectedClient && <Check size={11} className="text-emerald-400" />}
          </button>
          <button 
            onClick={() => { if (selectedClient) setStep('VEICULO'); }}
            disabled={!selectedClient}
            className={`py-2 px-1 sm:px-3 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${!selectedClient ? 'opacity-30 cursor-not-allowed text-zinc-600' : 'cursor-pointer hover:bg-white/5'} ${step === 'VEICULO' ? 'bg-[#FF2D55] text-white shadow-lg shadow-red-900/40' : 'text-zinc-500'}`}
          >
            <span>2. Veículo</span>
            {selectedVehicle && <Check size={11} className="text-emerald-400" />}
          </button>
          <button 
            onClick={() => { if (selectedClient && selectedVehicle) setStep('ITENS'); }}
            disabled={!selectedClient || !selectedVehicle}
            className={`py-2 px-1 sm:px-3 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${(!selectedClient || !selectedVehicle) ? 'opacity-30 cursor-not-allowed text-zinc-600' : 'cursor-pointer hover:bg-white/5'} ${step === 'ITENS' ? 'bg-[#FF2D55] text-white shadow-lg shadow-red-900/40' : 'text-zinc-500'}`}
          >
            <span>3. Itens</span>
            {items.length > 0 && <Check size={11} className="text-emerald-400" />}
          </button>
          <button 
            disabled={!finalOs}
            className={`py-2 px-1 sm:px-3 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${!finalOs ? 'opacity-30 cursor-not-allowed text-zinc-600' : 'cursor-pointer'} ${step === 'FINAL' ? 'bg-emerald-500 text-black font-black shadow-lg shadow-emerald-900/40' : 'text-zinc-500'}`}
          >
            <span>4. Nota</span>
          </button>
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl p-4 sm:p-8 md:p-12 space-y-8 pb-40 flex flex-col items-center">
        
        {/* STEP 1: CLIENTE */}
        {step === 'CLIENTE' && (
          <div className="w-full max-w-2xl space-y-6 animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
            
            {/* Quick Patio Check-in */}
            <button
              onClick={() => setShowPatioModal(true)}
              className="w-full p-5 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-[#FF2D55]/40 hover:border-[#FF2D55] rounded-[2rem] flex items-center justify-between group shadow-2xl transition-all active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-2xl bg-[#FF2D55] text-white flex items-center justify-center shadow-lg shadow-[#FF2D55]/30 group-hover:scale-105 transition-transform">
                  <Camera size={22} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#FF2D55] block">EXPRESS • CHECK-IN DO PÁTIO</span>
                  <h3 className="text-sm font-black uppercase italic tracking-wider text-white">
                    Foto da Placa & Entrada Rápida
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Identifique o carro na chegada antes da nota</p>
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl text-zinc-400 group-hover:text-white transition-colors">
                <Sparkles size={18} className="text-[#FF2D55]" />
              </div>
            </button>

            <div className="w-full flex items-center gap-4 my-1">
              <div className="h-[1px] flex-1 bg-white/10"></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">OU SELECIONE O CLIENTE</span>
              <div className="h-[1px] flex-1 bg-white/10"></div>
            </div>

            <div className="text-center space-y-1">
              <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter">1. SELECIONE O CLIENTE</h1>
              <p className="text-xs text-zinc-400">Escolha um cliente da lista ou cadastre em 1 segundo</p>
            </div>
            
            {!showQuickClient ? (
              <>
                <div className="relative glass-card p-2 rounded-full border-white/10 w-full shadow-2xl">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                  <input 
                    type="text" 
                    value={clientSearch} 
                    onChange={(e) => setClientSearch(e.target.value)} 
                    placeholder="DIGITE O NOME OU TELEFONE..." 
                    className="w-full bg-transparent border-none py-4 pl-14 pr-8 text-white font-black text-xs uppercase outline-none placeholder-zinc-600 tracking-wider"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3.5 w-full">
                  {clients
                    .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.phone && c.phone.includes(clientSearch)))
                    .slice(0, 6)
                    .map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => handleSelectClient(c)} 
                        className={`w-full p-5 glass-card border rounded-[1.75rem] flex items-center justify-between transition-all group shadow-lg cursor-pointer ${selectedClient?.id === c.id ? 'border-[#FF2D55] bg-[#FF2D55]/10' : 'border-white/10 hover:border-[#FF2D55]/60 hover:bg-white/5'}`}
                      >
                        <div className="text-left">
                          <p className="text-lg sm:text-xl font-black italic uppercase group-hover:text-[#FF2D55] tracking-tight text-white">{c.name}</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                            <Phone size={12} className="text-[#FF2D55]" /> {c.phone || '(13) 99689-2958'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-zinc-500 group-hover:text-[#FF2D55] transition-colors hidden sm:inline">Avançar ➔</span>
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-[#FF2D55] group-hover:text-white transition-all">
                            <ArrowRight size={18} />
                          </div>
                        </div>
                      </button>
                    ))}

                  <button 
                    onClick={() => setShowQuickClient(true)} 
                    className="w-full p-6 border-2 border-dashed border-white/15 hover:border-[#FF2D55] rounded-[1.75rem] flex items-center justify-center gap-3 hover:bg-white/5 transition-all group active:scale-95 cursor-pointer"
                  >
                    <Plus className="text-[#FF2D55]" size={26} />
                    <span className="text-xs font-black uppercase tracking-wider italic text-zinc-300 group-hover:text-white transition-all">CADASTRAR NOVO CLIENTE</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full glass-card p-6 sm:p-8 rounded-[2rem] border-white/10 space-y-6 shadow-2xl animate-in zoom-in duration-300">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-lg font-black uppercase italic tracking-wider text-white">CADASTRO RÁPIDO DE CLIENTE</h3>
                  <button onClick={() => setShowQuickClient(false)} className="text-zinc-500 hover:text-white p-2 cursor-pointer"><X size={20}/></button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">NOME COMPLETO</label>
                    <input 
                      type="text" 
                      value={quickClient.name} 
                      onChange={(e) => setQuickClient({...quickClient, name: e.target.value})} 
                      className="w-full bg-black/60 border border-white/15 p-4 rounded-xl text-white font-black outline-none focus:border-[#FF2D55] uppercase text-xs" 
                      placeholder="EX: CARLOS ALBERTO"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">WHATSAPP / CELULAR</label>
                    <input 
                      type="text" 
                      value={quickClient.phone} 
                      onChange={(e) => setQuickClient({...quickClient, phone: e.target.value})} 
                      className="w-full bg-black/60 border border-white/15 p-4 rounded-xl text-white font-black outline-none focus:border-[#FF2D55] text-xs" 
                      placeholder="(13) 99689-2958"
                    />
                  </div>
                  <button 
                    onClick={handleCreateQuickClient} 
                    className="w-full bg-[#FF2D55] hover:bg-[#D11D40] text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all cursor-pointer shadow-lg shadow-red-900/30"
                  >
                    SALVAR E AVANÇAR PARA VEÍCULO ➔
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: VEICULO */}
        {step === 'VEICULO' && selectedClient && (
          <div className="w-full max-w-2xl space-y-6 animate-in slide-in-from-right-4 duration-500 flex flex-col items-center">
            
            {/* Selected Client Badge */}
            <div className="w-full p-4 glass-card border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-[#FF2D55] block">CLIENTE SELECIONADO</span>
                <p className="text-base font-black italic uppercase text-white">{selectedClient.name}</p>
                <p className="text-[10px] text-zinc-400">{selectedClient.phone || '(13) 99689-2958'}</p>
              </div>
              <button 
                onClick={() => setStep('CLIENTE')} 
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-wider text-zinc-300 transition-all cursor-pointer"
              >
                Trocar Cliente
              </button>
            </div>

            <div className="text-center space-y-1">
              <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter">2. SELECIONE O VEÍCULO</h1>
              <p className="text-xs text-zinc-400">Escolha o carro ou cadastre a placa para esta nota</p>
            </div>
            
            {!showQuickVehicle ? (
              <div className="grid grid-cols-1 gap-4 w-full">
                {/* Linked Vehicles */}
                {clientVehicles.map(v => (
                  <div key={v.id} className="p-6 glass-card border border-white/10 hover:border-[#FF2D55]/60 rounded-[2rem] space-y-4 shadow-xl transition-all">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 block">VEÍCULO CADASTRADO</span>
                        <p className="text-2xl sm:text-3xl font-black italic uppercase text-white tracking-widest leading-none mt-1">{v.plate}</p>
                        <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mt-1.5">{v.model}</p>
                        <p className="text-[10px] text-zinc-500 mt-1">KM Anterior: <span className="text-zinc-300 font-bold">{v.km ? v.km.toLocaleString('pt-BR') : '0'} KM</span></p>
                      </div>
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-400">
                        <Car size={26} />
                      </div>
                    </div>

                    {/* Novo KM com avanço imediato */}
                    <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                          <Gauge size={13} /> KM Atual nesta Visita (Atualizar Retorno):
                        </label>
                        <input
                          type="number"
                          placeholder={`Novo KM (ex: ${(v.km || 0) + 5000})`}
                          defaultValue={v.km || ''}
                          id={`km-input-${v.id}`}
                          className="w-full bg-black/60 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white font-mono font-bold text-xs outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById(`km-input-${v.id}`) as HTMLInputElement;
                          const val = input ? input.value : (v.km || 0).toString();
                          handleSelectVehicleWithKm(v, val);
                        }}
                        className="px-6 py-3 bg-[#FF2D55] hover:bg-[#D11D40] text-white rounded-xl font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-red-900/30 cursor-pointer sm:self-end flex items-center justify-center gap-2"
                      >
                        <span>AVANÇAR PARA OS ITENS</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {clientVehicles.length === 0 && (
                  <div className="p-6 glass-card border border-white/10 rounded-[2rem] text-center space-y-4">
                    <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
                      <Car size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase italic text-white">Nenhum veículo vinculado a {selectedClient.name}</h4>
                      <p className="text-xs text-zinc-400 mt-1">Informe a placa e modelo abaixo para avançar imediatamente para a nota:</p>
                    </div>

                    {/* Direct Quick Vehicle Form on Empty */}
                    <div className="space-y-3 pt-2 text-left">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">PLACA</label>
                          <input 
                            type="text" 
                            value={quickVehicle.plate} 
                            onChange={(e) => setQuickVehicle({...quickVehicle, plate: e.target.value.toUpperCase()})} 
                            className="w-full bg-black/70 border border-white/15 p-3 rounded-xl text-white font-black outline-none focus:border-[#FF2D55] uppercase text-xs font-mono" 
                            placeholder="EX: ABC-1234"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">MODELO / ANO</label>
                          <input 
                            type="text" 
                            value={quickVehicle.model} 
                            onChange={(e) => setQuickVehicle({...quickVehicle, model: e.target.value.toUpperCase()})} 
                            className="w-full bg-black/70 border border-white/15 p-3 rounded-xl text-white font-black outline-none focus:border-[#FF2D55] uppercase text-xs" 
                            placeholder="EX: FIAT PALIO 2015"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">KM ATUAL</label>
                        <input 
                          type="number" 
                          value={quickVehicle.km} 
                          onChange={(e) => setQuickVehicle({...quickVehicle, km: e.target.value})} 
                          className="w-full bg-black/70 border border-white/15 p-3 rounded-xl text-white font-bold outline-none focus:border-[#FF2D55] text-xs font-mono" 
                          placeholder="EX: 125000"
                        />
                      </div>
                      <button 
                        onClick={handleCreateQuickVehicle} 
                        className="w-full bg-[#FF2D55] hover:bg-[#D11D40] text-white py-3.5 rounded-xl font-black uppercase text-xs tracking-wider active:scale-95 transition-all cursor-pointer shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
                      >
                        <span>CADASTRAR VEÍCULO E AVANÇAR</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {clientVehicles.length > 0 && (
                  <button 
                    onClick={() => setShowQuickVehicle(true)} 
                    className="w-full p-5 border-2 border-dashed border-white/15 hover:border-[#FF2D55] rounded-[1.75rem] flex items-center justify-center gap-3 hover:bg-white/5 transition-all group active:scale-95 cursor-pointer"
                  >
                    <Plus className="text-[#FF2D55]" size={22} />
                    <span className="text-xs font-black uppercase tracking-wider italic text-zinc-300 group-hover:text-white transition-all">CADASTRAR OUTRO VEÍCULO PARA ESTE CLIENTE</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full glass-card p-6 sm:p-8 rounded-[2rem] border-white/10 space-y-6 shadow-2xl animate-in zoom-in duration-300">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-lg font-black uppercase italic tracking-wider text-white">NOVO VEÍCULO PARA {selectedClient.name}</h3>
                  <button onClick={() => setShowQuickVehicle(false)} className="text-zinc-500 hover:text-white p-2 cursor-pointer"><X size={20}/></button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">PLACA</label>
                    <input 
                      type="text" 
                      value={quickVehicle.plate} 
                      onChange={(e) => setQuickVehicle({...quickVehicle, plate: e.target.value.toUpperCase()})} 
                      className="w-full bg-black/60 border border-white/15 p-4 rounded-xl text-white font-black outline-none focus:border-[#FF2D55] uppercase text-xs font-mono" 
                      placeholder="ABC-1234"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">MODELO / ANO</label>
                    <input 
                      type="text" 
                      value={quickVehicle.model} 
                      onChange={(e) => setQuickVehicle({...quickVehicle, model: e.target.value.toUpperCase()})} 
                      className="w-full bg-black/60 border border-white/15 p-4 rounded-xl text-white font-black outline-none focus:border-[#FF2D55] uppercase text-xs" 
                      placeholder="EX: CHEVROLET ONIX 2020"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">KM ATUAL</label>
                    <input 
                      type="number" 
                      value={quickVehicle.km} 
                      onChange={(e) => setQuickVehicle({...quickVehicle, km: e.target.value})} 
                      className="w-full bg-black/60 border border-white/15 p-4 rounded-xl text-white font-bold outline-none focus:border-[#FF2D55] text-xs font-mono" 
                      placeholder="85000"
                    />
                  </div>
                  <button 
                    onClick={handleCreateQuickVehicle} 
                    className="w-full bg-[#FF2D55] hover:bg-[#D11D40] text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all cursor-pointer shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
                  >
                    <span>VINCULAR E AVANÇAR PARA ITENS</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: ITENS & VALORES */}
        {step === 'ITENS' && selectedVehicle && (
          <div className="w-full max-w-3xl space-y-6 animate-in slide-in-from-right-4 duration-500 flex flex-col items-center">
            
            <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/10 space-y-6 w-full shadow-2xl">
              
              {/* Header Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-6 gap-4">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-[#FF2D55]/10 border border-[#FF2D55]/30 rounded-2xl flex items-center justify-center text-[#FF2D55]">
                    <Car size={24}/>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">{selectedVehicle.plate}</h3>
                    <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider mt-1">
                      {selectedVehicle.model} • <span className="text-emerald-400 font-mono">{Number(selectedVehicle.km || 0).toLocaleString('pt-BR')} KM</span>
                    </p>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">Cliente: {selectedClient?.name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowPartSearch(true)} 
                    className="px-4 py-2.5 bg-zinc-900 border border-white/10 text-zinc-300 rounded-xl font-black uppercase text-[10px] tracking-wider hover:text-white hover:border-white/30 transition-all italic cursor-pointer"
                  >
                    BUSCAR PEÇA
                  </button>
                  <button 
                    onClick={() => setItems([...items, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unitPrice: 0, type: 'SERVICE' }])} 
                    className="px-4 py-2.5 bg-[#FF2D55] text-white rounded-xl font-black uppercase text-[10px] tracking-wider active:scale-95 transition-all italic cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-900/30"
                  >
                    <Plus size={14} /> NOVO ITEM
                  </button>
                </div>
              </div>

              {/* CONJUNTO DE BOTÕES DE SERVIÇOS MAIS USADOS */}
              <div className="space-y-3 bg-zinc-950/80 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF2D55] flex items-center gap-1.5">
                    <Zap size={14} /> ATALHOS RÁPIDOS DE SERVIÇOS MAIS USADOS:
                  </span>
                  <span className="hidden sm:inline text-[9px] font-bold text-zinc-500 uppercase">1 Clique para Lançar</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {PRESET_SERVICES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setItems(prev => [
                          ...prev,
                          {
                            id: Math.random().toString(36).substr(2, 9),
                            description: preset.desc,
                            quantity: 1,
                            unitPrice: preset.defaultPrice,
                            type: preset.type
                          }
                        ]);
                      }}
                      className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-[#FF2D55]/50 rounded-xl flex flex-col text-left transition-all active:scale-95 group cursor-pointer shadow-sm"
                      title={`Adicionar ${preset.label} por R$ ${preset.defaultPrice}`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-sm">{preset.icon}</span>
                        <span className="text-[9px] font-black uppercase text-white truncate group-hover:text-[#FF2D55] transition-colors">{preset.label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">R$ {preset.defaultPrice.toLocaleString('pt-BR')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Part Search Modal */}
              {showPartSearch && (
                <div className="bg-zinc-900 p-5 rounded-2xl border border-[#FF2D55]/40 space-y-3 animate-in zoom-in duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FF2D55]">ESTOQUE DE PEÇAS</h4>
                    <button onClick={() => setShowPartSearch(false)} className="cursor-pointer text-zinc-400 hover:text-white"><X size={18}/></button>
                  </div>
                  <input 
                    type="text" 
                    value={partSearch} 
                    onChange={(e) => setPartSearch(e.target.value)} 
                    placeholder="BUSCAR PEÇA NO ESTOQUE..." 
                    className="w-full bg-black border border-white/10 p-3 rounded-xl text-white font-black text-xs outline-none"
                  />
                  <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1">
                    {parts.filter(p => p.name.toLowerCase().includes(partSearch.toLowerCase())).map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => handleAddPartFromInventory(p)} 
                        className="flex items-center justify-between p-3 bg-black/50 rounded-xl hover:bg-black transition-all border border-transparent hover:border-white/10 cursor-pointer"
                      >
                        <span className="text-xs font-black uppercase italic">{p.name}</span>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-zinc-400">Estoque: {p.stock}</p>
                          <p className="text-xs font-mono font-bold text-emerald-400">R$ {p.salePrice.toLocaleString('pt-BR')}</p>
                        </div>
                      </button>
                    ))}
                    {parts.length === 0 && (
                      <p className="text-xs text-zinc-500 text-center py-4">Nenhuma peça cadastrada no estoque.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3">
                {items.some(i => !i.description || i.description.trim() === '') && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                      <span>💡</span>
                      <span>
                        {items.filter(i => !i.description || i.description.trim() === '').length} caixa(s) em branco. O sistema apaga automaticamente ao salvar a nota!
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setItems(items.filter(i => i.description && i.description.trim() !== ''))}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer self-start sm:self-auto"
                    >
                      Limpar Vazias
                    </button>
                  </div>
                )}

                {items.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl space-y-2">
                    <p className="text-xs text-zinc-400">Nenhum item na nota ainda.</p>
                    <p className="text-[10px] text-zinc-600">Clique em um dos atalhos rápidos acima ou em "+ NOVO ITEM".</p>
                  </div>
                )}

                {items.map(item => (
                  <div key={item.id} className="bg-black/60 p-4 rounded-2xl border border-white/10 flex flex-col gap-3 shadow-inner">
                    <input 
                      type="text" 
                      placeholder="DESCRIÇÃO DO SERVIÇO OU PEÇA..." 
                      value={item.description} 
                      onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, description: e.target.value.toUpperCase()} : i))} 
                      className="w-full bg-transparent text-xs sm:text-sm font-black outline-none uppercase italic text-white tracking-wider placeholder-zinc-600"
                    />
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">QTD</label>
                        <input 
                          type="number" 
                          placeholder="1" 
                          value={item.quantity || ''} 
                          onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, quantity: parseFloat(e.target.value) || 0} : i))} 
                          className="w-16 sm:w-20 bg-white/5 border border-white/10 p-2 sm:p-2.5 rounded-xl text-center text-xs font-mono font-bold text-white outline-none"
                        />
                      </div>
                      <div className="space-y-1 flex-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">R$ UNITÁRIO</label>
                        <input 
                          type="number" 
                          placeholder="0,00" 
                          value={item.unitPrice || ''} 
                          onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, unitPrice: parseFloat(e.target.value) || 0} : i))} 
                          className="w-full bg-white/5 border border-white/10 p-2 sm:p-2.5 rounded-xl text-xs font-mono font-bold text-white outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">TOTAL</label>
                        <div className="p-2 sm:p-2.5 font-mono font-bold text-xs sm:text-sm text-emerald-400">
                          R$ {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                        </div>
                      </div>
                      <button 
                        onClick={() => setItems(items.filter(i => i.id !== item.id))} 
                        className="p-2 text-zinc-500 hover:text-[#FF2D55] active:scale-90 transition-all cursor-pointer mt-3"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Labor */}
              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-zinc-300 uppercase tracking-wider block">Mão de Obra Geral (R$)</label>
                    <span className="text-[9px] text-zinc-500">Valor adicional de serviço técnico</span>
                  </div>
                  <input 
                    type="number" 
                    value={labor} 
                    onChange={(e) => setLabor(e.target.value)} 
                    className="bg-zinc-900 border border-white/15 p-3 rounded-xl text-right text-white font-mono font-bold text-sm w-36 outline-none focus:border-[#FF2D55] transition-all"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs font-black text-white uppercase tracking-widest italic">VALOR TOTAL DA NOTA</p>
                  <p className="text-3xl font-black text-[#FF2D55] italic tracking-tight font-mono">
                    R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* ADVANCE / FINALIZE BUTTON */}
              <button 
                onClick={handleFinalize} 
                disabled={isSaving} 
                className="w-full bg-[#FF2D55] hover:bg-[#D11D40] py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 italic transition-all shadow-xl shadow-red-900/40 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                <span>CONCLUIR E GERAR NOTA FISCAL</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: NOTA FINAL GERADA */}
        {step === 'FINAL' && finalOs && (
          <div className="w-full flex flex-col items-center gap-8 animate-in fade-in duration-700">
            
            {/* Success Banner */}
            <div className="w-full max-w-2xl p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-emerald-400">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">Nota Nº {finalOs.osNumber} Gerada com Sucesso!</h4>
                  <p className="text-[10px] text-emerald-300">Salva no histórico e pronta para envio ao cliente.</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/orders')}
                className="px-3 py-1.5 bg-emerald-500 text-black font-black text-[10px] uppercase rounded-xl hover:bg-emerald-400 transition-all cursor-pointer"
              >
                Ver Histórico
              </button>
            </div>

            {/* Note Render Container */}
            <div className="invoice-preview-wrapper shadow-2xl rounded-2xl overflow-hidden border border-white/10">
              <div className="invoice-container-scaled">
                <div ref={previewRef}>
                  <Invoice os={finalOs} />
                </div>
              </div>
            </div>

            {/* Actions for Final Note */}
            <div className="w-full max-w-md flex flex-col gap-3 px-4 pb-20">
              <button 
                onClick={downloadImage} 
                disabled={isSaving} 
                className="w-full bg-white hover:bg-zinc-200 text-black py-4 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-3 shadow-2xl active:scale-95 italic transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20}/> : <ImageIcon size={20}/>}
                <span>SALVAR COMO IMAGEM (WHATSAPP)</span>
              </button>

              <button 
                onClick={() => window.print()} 
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white border border-white/15 py-3.5 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-3 active:scale-95 italic transition-all cursor-pointer"
              >
                <Printer size={18} />
                <span>IMPRIMIR EM A4 (PDF)</span>
              </button>

              {finalOs.clientPhone && (
                <button 
                  onClick={() => {
                    const cleanPhone = (finalOs.clientPhone || '').replace(/\D/g, '');
                    const text = encodeURIComponent(`Olá ${finalOs.clientName}! Segue a Ordem de Serviço da Auto Mecânica Kaen nº ${finalOs.osNumber} referente ao seu veículo ${finalOs.vehicleModel} (${finalOs.vehiclePlate}). Qualquer dúvida estamos à disposição!`);
                    window.open(`https://wa.me/55${cleanPhone}?text=${text}`, '_blank');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-3 active:scale-95 italic transition-all cursor-pointer shadow-lg shadow-emerald-900/30"
                >
                  <Share2 size={18} />
                  <span>NOTIFICAR CLIENTE NO WHATSAPP</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button 
                  onClick={handleResetForm} 
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl font-black uppercase text-[10px] tracking-wider text-zinc-300 border border-white/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw size={14} /> Nova Nota
                </button>
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl font-black uppercase text-[10px] tracking-wider text-zinc-300 border border-white/10 flex items-center justify-center transition-all cursor-pointer"
                >
                  Ir ao Painel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Patio Check-in Modal */}
      {showPatioModal && (
        <PatioCheckinModal
          isOpen={showPatioModal}
          onClose={() => setShowPatioModal(false)}
          session={session}
          syncData={syncData}
          onSuccess={(newOs) => {
            setShowPatioModal(false);
            navigate('/orders');
          }}
        />
      )}
    </div>
  );
};

export default NewServiceOrder;
