
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Wrench, ChevronLeft, X,
  User, Search, Loader2, Check, ImageIcon, Car, Info, Download, Phone, Package, Camera, Sparkles, Gauge, Zap
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
  const [vehicleVisitKm, setVehicleVisitKm] = useState<string>('');
  const [pendingVehicle, setPendingVehicle] = useState<Vehicle | null>(null);
  
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
    const savedClients = getWorkshopData<Client[]>('clients', session?.username, []);
    const savedVehicles = getWorkshopData<Vehicle[]>('vehicles', session?.username, []);
    const savedParts = getWorkshopData<Part[]>('parts', session?.username, []);
    setClients(savedClients);
    setVehicles(savedVehicles);
    setParts(savedParts);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('kaen_storage_updated', loadData);
    return () => window.removeEventListener('kaen_storage_updated', loadData);
  }, [session]);

  const totalValue = useMemo(() => {
    const itemsTotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
    return itemsTotal + (parseFloat(labor) || 0);
  }, [items, labor]);

  const handleFinalize = async () => {
    if (!selectedClient || !selectedVehicle || !session || !syncData) return;
    setIsSaving(true);
    try {
      // Subtract parts from inventory
      let updatedParts = [...parts];
      items.forEach(item => {
        if (item.type === 'PART') {
          // Find part by description (primitive match) or SKU if we had it
          // For now, let's assume we match by exact description if they picked from inventory
          const pIndex = updatedParts.findIndex(p => p.name.toUpperCase() === item.description.toUpperCase());
          if (pIndex !== -1) {
            updatedParts[pIndex] = {
              ...updatedParts[pIndex],
              stock: Math.max(0, updatedParts[pIndex].stock - item.quantity)
            };
          }
        }
      });
      if (JSON.stringify(updatedParts) !== JSON.stringify(parts)) {
        await syncData('parts', updatedParts);
        setParts(updatedParts);
      }

      const osNumber = `${Math.floor(100000 + Math.random() * 899999)}`;
      const os: ServiceOrder = {
        id: Math.random().toString(36).substr(2, 9),
        osNumber,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        clientPhone: selectedClient.phone,
        vehicleId: selectedVehicle.id,
        vehiclePlate: selectedVehicle.plate,
        vehicleModel: selectedVehicle.model,
        vehicleKm: selectedVehicle.km.toString(),
        problem: 'MANUTENÇÃO TÉCNICA KAEN',
        items,
        laborValue: parseFloat(labor) || 0,
        discount: 0,
        totalValue,
        status: OSStatus.FINALIZADO,
        paymentStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const currentOrders = getWorkshopData<ServiceOrder[]>('orders', session?.username, []);
      const updatedOrders = mergeUniqueById(currentOrders, [os]);
      await saveWorkshopData('orders', updatedOrders, session?.username);
      if (syncData) await syncData('orders', updatedOrders);

      setFinalOs(os);
      setStep('FINAL');
    } catch (error) {
      alert("ERRO NO PROCESSAMENTO.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateQuickClient = async () => {
    if (!quickClient.name || !quickClient.phone) return;
    const newC: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: quickClient.name.toUpperCase(),
      phone: quickClient.phone,
      document: '---',
      observations: 'CADASTRADO VIA NOTA',
      createdAt: new Date().toISOString()
    };
    const currentClients = getWorkshopData<Client[]>('clients', session?.username, []);
    const updated = mergeUniqueById(currentClients, [newC]);
    setClients(updated);
    await saveWorkshopData('clients', updated, session?.username);
    if (syncData) await syncData('clients', updated);
    setSelectedClient(newC);
    setShowQuickClient(false);
    setStep('VEICULO');
  };

  const handleCreateQuickVehicle = async () => {
    if (!selectedClient || !quickVehicle.model || !quickVehicle.plate) return;
    const newV: Vehicle = {
      id: Math.random().toString(36).substr(2, 9),
      clientId: selectedClient.id,
      model: quickVehicle.model.toUpperCase(),
      plate: quickVehicle.plate.toUpperCase(),
      brand: '---',
      year: '---',
      km: parseFloat(quickVehicle.km) || 0
    };
    const currentVehicles = getWorkshopData<Vehicle[]>('vehicles', session?.username, []);
    const updated = mergeUniqueById(currentVehicles, [newV]);
    setVehicles(updated);
    await saveWorkshopData('vehicles', updated, session?.username);
    if (syncData) await syncData('vehicles', updated);
    setSelectedVehicle(newV);
    setShowQuickVehicle(false);
    setStep('ITENS');
  };

  const handleSelectVehicleWithKm = async (v: Vehicle, newKmStr: string) => {
    const newKm = parseFloat(newKmStr) || v.km;
    const updatedVehicle: Vehicle = {
      ...v,
      km: newKm
    };
    const currentVehicles = getWorkshopData<Vehicle[]>('vehicles', session?.username, []);
    const updatedVehicles = currentVehicles.map(item => item.id === v.id ? updatedVehicle : item);
    setVehicles(updatedVehicles);
    await saveWorkshopData('vehicles', updatedVehicles, session?.username);
    if (syncData) await syncData('vehicles', updatedVehicles);
    setSelectedVehicle(updatedVehicle);
    setPendingVehicle(null);
    setStep('ITENS');
  };

  const handleAddPartFromInventory = (part: Part) => {
    setItems([...items, { 
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
    
    // Create a temporary clone for rendering without scaling artifacts
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

  const densityClass = useMemo(() => {
    const totalLines = items.length + (parseFloat(labor) > 0 ? 1 : 0);
    if (totalLines > 18) return 'micro-mode';
    if (totalLines > 10) return 'compact-mode';
    return '';
  }, [items, labor]);

  const InvoiceTemplate = ({ os }: { os: ServiceOrder }) => (
    <Invoice os={os} />
  );

  return (
    <div className="flex flex-col min-h-screen bg-black text-white items-center w-full">
      <div className="w-full p-6 flex items-center justify-between glass-card sticky top-0 z-50 rounded-b-[2rem]">
        <button onClick={() => navigate(-1)} className="p-4 bg-white/5 rounded-full text-zinc-500 hover:text-white border border-white/10 active:scale-90 transition-all"><ChevronLeft size={24} /></button>
        <h2 className="text-[11px] font-black uppercase tracking-[0.5em] italic">CENTRAL DE NOTAS <span className="text-[#FF2D55]">KAEN</span></h2>
        <div className="w-16"></div>
      </div>
      <div className="flex-1 w-full max-w-4xl p-6 md:p-12 space-y-12 pb-40 flex flex-col items-center">
        {step === 'CLIENTE' && (
          <div className="w-full max-w-2xl space-y-8 animate-in slide-in-from-bottom-6 duration-700 flex flex-col items-center">
            
            {/* Quick Patio Check-in Trigger */}
            <button
              onClick={() => setShowPatioModal(true)}
              className="w-full p-6 bg-gradient-to-r from-zinc-900 via-black to-zinc-900 border border-[#FF2D55]/30 hover:border-[#FF2D55] rounded-[2rem] flex items-center justify-between group shadow-2xl transition-all active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-2xl bg-[#FF2D55] text-white flex items-center justify-center shadow-lg shadow-[#FF2D55]/30 group-hover:scale-110 transition-transform">
                  <Camera size={22} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#FF2D55] block">NOVO • CHECK-IN DE PÁTIO</span>
                  <h3 className="text-sm font-black uppercase italic tracking-wider text-white">
                    Foto da Placa & Vistoria Express
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Identifique o carro na hora e anexe fotos antes da nota</p>
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl text-zinc-400 group-hover:text-white transition-colors">
                <Sparkles size={18} className="text-[#FF2D55]" />
              </div>
            </button>

            <div className="w-full flex items-center gap-4 my-2">
              <div className="h-[1px] flex-1 bg-white/5"></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">OU PREENCHA MANUALMENTE</span>
              <div className="h-[1px] flex-1 bg-white/5"></div>
            </div>

            <h1 className="text-5xl font-black italic uppercase tracking-tighter">CLIENTE</h1>
            
            {!showQuickClient ? (
              <>
                <div className="relative glass-card p-2 rounded-full border-white/10 w-full shadow-2xl">
                  <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-700" size={24} />
                  <input type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="BUSCAR NOME..." className="w-full bg-transparent border-none py-6 pl-20 pr-10 text-white font-black text-xs uppercase outline-none placeholder-zinc-800 tracking-widest"/>
                </div>
                <div className="grid grid-cols-1 gap-6 w-full">
                  {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 5).map(c => (
                    <button key={c.id} onClick={() => { setSelectedClient(c); setStep('VEICULO'); }} className="w-full p-8 glass-card border-white/5 rounded-ios flex items-center justify-between hover:border-[#FF2D55]/50 transition-all group shadow-xl">
                       <div className="text-left">
                        <p className="text-2xl font-black italic uppercase group-hover:text-[#FF2D55] tracking-tight">{c.name}</p>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] mt-2">{c.phone}</p>
                      </div>
                      <User size={32} className="text-zinc-800" />
                    </button>
                  ))}
                  <button onClick={() => setShowQuickClient(true)} className="w-full p-8 border-2 border-dashed border-white/10 rounded-ios flex items-center justify-center gap-4 hover:bg-white/5 transition-all group active:scale-95">
                    <Plus className="text-[#FF2D55]" size={32} />
                    <span className="text-[12px] font-black uppercase tracking-widest italic text-zinc-500 group-hover:text-white transition-all">CADASTRAR NOVO CLIENTE</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full glass-card p-10 rounded-ios border-white/10 space-y-8 shadow-2xl animate-in zoom-in duration-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">CADASTRO RÁPIDO</h3>
                  <button onClick={() => setShowQuickClient(false)} className="text-zinc-500 hover:text-white"><X/></button>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">NOME DO CLIENTE</label>
                    <input type="text" value={quickClient.name} onChange={(e) => setQuickClient({...quickClient, name: e.target.value})} className="w-full bg-black/50 border border-white/10 p-6 rounded-2xl text-white font-black outline-none focus:border-[#FF2D55] uppercase" placeholder="EX: JOÃO DA SILVA"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">WHATSAPP / TELEFONE</label>
                    <input type="text" value={quickClient.phone} onChange={(e) => setQuickClient({...quickClient, phone: e.target.value})} className="w-full bg-black/50 border border-white/10 p-6 rounded-2xl text-white font-black outline-none focus:border-[#FF2D55]" placeholder="(00) 00000-0000"/>
                  </div>
                  <button onClick={handleCreateQuickClient} className="w-full bg-white text-black py-6 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">SALVAR E CONTINUAR</button>
                </div>
              </div>
            )}
          </div>
        )}
        {step === 'VEICULO' && selectedClient && (
          <div className="w-full max-w-2xl space-y-10 animate-in slide-in-from-right-6 duration-700 flex flex-col items-center">
            <h1 className="text-5xl font-black italic uppercase tracking-tighter">VEÍCULO</h1>
            
            {!showQuickVehicle ? (
              <div className="grid grid-cols-1 gap-6 w-full">
                {vehicles.filter(v => v.clientId === selectedClient.id).map(v => (
                  <div key={v.id} className="p-6 sm:p-8 glass-card border-white/10 hover:border-[#FF2D55]/50 rounded-[2rem] space-y-4 shadow-xl transition-all">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-2xl sm:text-3xl font-black italic uppercase text-white tracking-widest leading-none">{v.plate}</p>
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.3em] mt-2">{v.model}</p>
                        <p className="text-[10px] font-bold text-zinc-500 mt-1">KM Anterior: <span className="text-zinc-300 font-black">{v.km ? v.km.toLocaleString('pt-BR') : '0'} KM</span></p>
                      </div>
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-400">
                        <Car size={26} />
                      </div>
                    </div>

                    {/* Novo KM para quando o carro volta */}
                    <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                          <Gauge size={13} /> KM Atual nesta Visita (Retorno / Nova Nota):
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
                        className="px-5 py-3 bg-[#FF2D55] hover:bg-[#D11D40] text-white rounded-xl font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-red-900/30 cursor-pointer sm:self-end"
                      >
                        Selecionar e Avançar ➔
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setShowQuickVehicle(true)} className="w-full p-6 sm:p-8 border-2 border-dashed border-white/10 rounded-ios flex items-center justify-center gap-4 hover:bg-white/5 transition-all group active:scale-95 cursor-pointer">
                  <Plus className="text-[#FF2D55]" size={28} />
                  <span className="text-[12px] font-black uppercase tracking-widest italic text-zinc-400 group-hover:text-white transition-all">CADASTRAR OUTRO VEÍCULO</span>
                </button>
              </div>
            ) : (
              <div className="w-full glass-card p-6 sm:p-10 rounded-ios border-white/10 space-y-6 sm:space-y-8 shadow-2xl animate-in zoom-in duration-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-black uppercase italic tracking-tighter">VEÍCULO PARA {selectedClient.name}</h3>
                  <button onClick={() => setShowQuickVehicle(false)} className="text-zinc-500 hover:text-white"><X/></button>
                </div>
                <div className="space-y-4 sm:space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">PLACA</label>
                    <input type="text" value={quickVehicle.plate} onChange={(e) => setQuickVehicle({...quickVehicle, plate: e.target.value.toUpperCase()})} className="w-full bg-black/50 border border-white/10 p-4 sm:p-5 rounded-2xl text-white font-black outline-none focus:border-[#FF2D55] uppercase text-xs" placeholder="ABC-1234"/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">MODELO / ANO</label>
                    <input type="text" value={quickVehicle.model} onChange={(e) => setQuickVehicle({...quickVehicle, model: e.target.value.toUpperCase()})} className="w-full bg-black/50 border border-white/10 p-4 sm:p-5 rounded-2xl text-white font-black outline-none focus:border-[#FF2D55] uppercase text-xs" placeholder="EX: FIAT PALIO 2014"/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">KM ATUAL</label>
                    <input type="number" value={quickVehicle.km} onChange={(e) => setQuickVehicle({...quickVehicle, km: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 sm:p-5 rounded-2xl text-white font-black outline-none focus:border-[#FF2D55] text-xs" placeholder="125000"/>
                  </div>
                  <button onClick={handleCreateQuickVehicle} className="w-full bg-white text-black py-4 sm:py-5 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all cursor-pointer">VINCULAR E CONTINUAR</button>
                </div>
              </div>
            )}
          </div>
        )}
        {step === 'ITENS' && selectedVehicle && (
          <div className="w-full max-w-3xl space-y-8 animate-in slide-in-from-right-6 duration-700 flex flex-col items-center">
            <div className="glass-card p-6 sm:p-10 rounded-ios border-white/10 space-y-8 w-full shadow-2xl">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-6 gap-4">
                 <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-[#FF2D55]/10 rounded-xl flex items-center justify-center text-[#FF2D55]"><Car size={24}/></div>
                    <div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">{selectedVehicle.plate}</h3>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mt-1">{selectedVehicle.model} • <span className="text-emerald-400">{selectedVehicle.km.toLocaleString('pt-BR')} KM</span></p>
                    </div>
                 </div>
                 <div className="flex gap-2 sm:gap-4">
                   <button onClick={() => setShowPartSearch(true)} className="px-4 py-3 bg-zinc-900 border border-white/10 text-zinc-400 rounded-full font-black uppercase text-[10px] tracking-widest hover:text-white transition-all italic cursor-pointer">BUSCAR PEÇA</button>
                   <button onClick={() => setItems([...items, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unitPrice: 0, type: 'SERVICE' }])} className="px-5 py-3 bg-[#FF2D55] text-white rounded-full font-black uppercase text-[10px] tracking-widest active:scale-90 transition-all italic cursor-pointer">NOVO ITEM</button>
                 </div>
               </div>

               {/* CONJUNTO DE BOTÕES DE SERVIÇOS MAIS USADOS (FACILITAÇÃO DE SERVIÇO) */}
               <div className="space-y-3 bg-zinc-950/70 border border-white/10 rounded-2xl p-4 sm:p-5">
                 <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF2D55] flex items-center gap-1.5">
                     <Zap size={14} /> ATALHOS RÁPIDOS DE SERVIÇOS MAIS USADOS (CLIQUE PARA LANÇAR):
                   </span>
                   <span className="hidden sm:inline text-[8px] font-bold text-zinc-500 uppercase">1 Toque na Nota</span>
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
                       className="p-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-[#FF2D55]/50 rounded-xl flex flex-col text-left transition-all active:scale-95 group cursor-pointer shadow-sm"
                       title={`Adicionar ${preset.label} por R$ ${preset.defaultPrice}`}
                     >
                       <div className="flex items-center gap-1 mb-1">
                         <span className="text-sm">{preset.icon}</span>
                         <span className="text-[9px] font-black uppercase text-white truncate group-hover:text-[#FF2D55] transition-colors">{preset.label}</span>
                       </div>
                       <span className="text-[10px] font-bold text-emerald-400">R$ {preset.defaultPrice.toLocaleString('pt-BR')}</span>
                     </button>
                   ))}
                 </div>
               </div>

               {showPartSearch && (
                 <div className="bg-zinc-900 p-6 sm:p-8 rounded-[2rem] border border-[#FF2D55]/30 space-y-4 animate-in zoom-in duration-300">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FF2D55]">ESTOQUE DE PEÇAS</h4>
                      <button onClick={() => setShowPartSearch(false)}><X size={20}/></button>
                    </div>
                    <input type="text" value={partSearch} onChange={(e) => setPartSearch(e.target.value)} placeholder="NOME DA PEÇA..." className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white font-black text-xs outline-none"/>
                    <div className="grid grid-cols-1 gap-2.5 max-h-[200px] overflow-y-auto pr-2">
                       {parts.filter(p => p.name.toLowerCase().includes(partSearch.toLowerCase())).map(p => (
                         <button key={p.id} onClick={() => handleAddPartFromInventory(p)} className="flex items-center justify-between p-3.5 bg-black/40 rounded-xl hover:bg-black transition-all border border-transparent hover:border-white/10 cursor-pointer">
                            <span className="text-xs font-black uppercase italic">{p.name}</span>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-zinc-500">QTD: {p.stock}</p>
                              <p className="text-[10px] font-black text-[#FF2D55]">R$ {p.salePrice.toLocaleString('pt-BR')}</p>
                            </div>
                         </button>
                       ))}
                    </div>
                 </div>
               )}

               <div className="space-y-4">
                 {items.length === 0 && (
                   <p className="text-xs text-zinc-500 text-center py-6 border border-dashed border-white/10 rounded-2xl">
                     Nenhum item na nota. Clique em um dos atalhos rápidos acima ou em "NOVO ITEM".
                   </p>
                 )}
                 {items.map(item => (
                   <div key={item.id} className="bg-black/50 p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-white/5 flex flex-col gap-3 sm:gap-4 shadow-inner">
                     <input 
                       type="text" 
                       placeholder="DESCRIÇÃO DO SERVIÇO OU PEÇA..." 
                       value={item.description} 
                       onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, description: e.target.value.toUpperCase()} : i))} 
                       className="w-full bg-transparent text-xs sm:text-[14px] font-black outline-none uppercase italic text-white tracking-wider"
                     />
                     <div className="flex items-center gap-2 sm:gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-zinc-500 uppercase">QTD</label>
                          <input 
                            type="number" 
                            placeholder="1" 
                            value={item.quantity || ''} 
                            onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, quantity: parseFloat(e.target.value) || 0} : i))} 
                            className="w-16 sm:w-20 bg-white/5 border border-white/10 p-2.5 sm:p-3.5 rounded-xl text-center text-xs sm:text-[14px] font-black text-white outline-none"
                          />
                        </div>
                        <div className="space-y-1 flex-1">
                          <label className="text-[8px] font-bold text-zinc-500 uppercase">R$ UNITÁRIO</label>
                          <input 
                            type="number" 
                            placeholder="0,00" 
                            value={item.unitPrice || ''} 
                            onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, unitPrice: parseFloat(e.target.value) || 0} : i))} 
                            className="w-full bg-white/5 border border-white/10 p-2.5 sm:p-3.5 rounded-xl text-xs sm:text-[14px] font-black text-white outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-zinc-500 uppercase">TOTAL</label>
                          <div className="p-2.5 sm:p-3.5 font-mono font-bold text-xs sm:text-sm text-emerald-400">
                            R$ {(item.quantity * item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                        <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="p-2.5 text-zinc-600 hover:text-[#FF2D55] active:scale-90 transition-all cursor-pointer mt-4">
                          <Trash2 size={20}/>
                        </button>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="pt-8 border-t border-white/5 space-y-6">
                 <div className="flex items-center justify-between">
                   <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">Mão de Obra Geral (R$)</label>
                   <input 
                     type="number" 
                     value={labor} 
                     onChange={(e) => setLabor(e.target.value)} 
                     className="bg-zinc-900 border border-white/10 p-4 rounded-xl text-right text-white font-black w-40 outline-none focus:border-[#FF2D55] transition-all"
                   />
                 </div>
                 <div className="flex items-center justify-between">
                   <p className="text-[12px] font-black text-white uppercase tracking-[0.3em] italic">Total Acumulado</p>
                   <p className="text-4xl font-black text-[#FF2D55] italic tracking-tighter">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                 </div>
               </div>

               <button onClick={handleFinalize} disabled={isSaving} className="w-full bg-[#FF2D55] py-8 rounded-ios font-black uppercase text-xs tracking-[0.5em] flex items-center justify-center gap-6 active:scale-95 italic transition-all shadow-[0_40px_80px_rgba(255,45,85,0.4)]">
                 {isSaving ? <Loader2 className="animate-spin" /> : 'CONCLUIR NOTA'}
               </button>
            </div>
          </div>
        )}
        {step === 'FINAL' && finalOs && (
          <div className="w-full flex flex-col items-center gap-16 animate-in fade-in duration-1000">
             <div className="invoice-preview-wrapper"><div className="invoice-container-scaled"><div ref={previewRef}><InvoiceTemplate os={finalOs} /></div></div></div>
             <div className="w-full max-w-[500px] flex flex-col gap-6 px-6 pb-24">
                <button onClick={downloadImage} disabled={isSaving} className="w-full bg-white text-black py-8 rounded-ios font-black uppercase text-xs tracking-[0.4em] flex items-center justify-center gap-6 shadow-2xl active:scale-95 italic transition-all disabled:opacity-50">
                   {isSaving ? <Loader2 className="animate-spin"/> : <ImageIcon size={32}/>} SALVAR COMO IMAGEM
                </button>
                <button onClick={() => navigate('/dashboard')} className="glass-card py-6 rounded-ios font-black uppercase text-[10px] tracking-[0.5em] flex items-center justify-center hover:bg-white/5 italic transition-all">VOLTAR AO PAINEL</button>
             </div>
          </div>
        )}
      </div>

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
