import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Wrench, ChevronLeft, X,
  User, Search, Loader2, Check, ImageIcon, Car, Info, Download, Phone, Package, Camera, Sparkles, Gauge, Zap,
  Printer, Share2, CheckCircle2, ArrowRight, RotateCcw, FileText, Pencil, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client, Vehicle, OSItem, OSStatus, ServiceOrder, PaymentStatus, UserSession, Part } from '../types';
import html2canvas from 'html2canvas';
import Invoice from '../components/Invoice';
import EditOrderModal from '../components/EditOrderModal';
import { lookupVehicleByPlate } from '../src/utils/plateLookup';
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

interface NewServiceOrderProps {
  session?: UserSession;
  syncData?: (key: string, data: any) => Promise<void>;
}

const NewServiceOrder: React.FC<NewServiceOrderProps> = ({ session, syncData }) => {
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);

  // Active session and tenant
  const activeSession = session || (typeof window !== 'undefined' && sessionStorage.getItem('kaen_session') ? JSON.parse(sessionStorage.getItem('kaen_session') || '{}') : null);
  const tenant = activeSession?.username || 'rafael';

  // Wizard Steps: 1: DADOS (Cliente & Carro), 2: ITENS (Serviços e Peças), 3: FINAL (Nota Pronta)
  const [step, setStep] = useState<'DADOS' | 'ITENS' | 'FINAL'>('DADOS');

  // Loaded database state
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parts, setParts] = useState<Part[]>([]);

  // Search state
  const [clientSearch, setClientSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [partSearch, setPartSearch] = useState('');
  const [showPartSearch, setShowPartSearch] = useState(false);

  // Direct Controlled Fields (Never lost, always editable)
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('(13) 99689-2958');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleKm, setVehicleKm] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  // Quick edit vehicle modal inside ITENS step
  const [showEditCarInItems, setShowEditCarInItems] = useState(false);

  // Items in Order (starts with 1 line ready)
  const [items, setItems] = useState<OSItem[]>([
    { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unitPrice: 0, type: 'SERVICE' }
  ]);
  const [labor, setLabor] = useState<string>('0');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDENTE);

  // Final Generated Note
  const [finalOs, setFinalOs] = useState<ServiceOrder | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditFinalModal, setShowEditFinalModal] = useState(false);

  // Load workshop data
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

  // Handle Plate Typing with Auto-lookup
  const handlePlateInputChange = (val: string) => {
    const cleanPlate = (val || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setVehiclePlate(cleanPlate);

    const lookupKey = cleanPlate.replace(/[^A-Z0-9]/g, '');
    if (lookupKey.length >= 6) {
      // 1. Try to find existing vehicle in workshop safely
      const foundInShop = vehicles.find(v => v && v.plate && v.plate.replace(/[^A-Z0-9]/g, '').toUpperCase() === lookupKey);
      if (foundInShop) {
        setVehicleModel(foundInShop.model || '');
        if (foundInShop.km && !vehicleKm) {
          setVehicleKm(String(foundInShop.km));
        }
        setSelectedVehicleId(foundInShop.id);

        // Also link owner client if known
        if (foundInShop.clientId && !clientName) {
          const owner = clients.find(c => c && c.id === foundInShop.clientId);
          if (owner) {
            setClientName(owner.name || '');
            setClientPhone(owner.phone || '(13) 99689-2958');
            setSelectedClientId(owner.id);
          }
        }
        return;
      }

      // 2. Lookup standard plate database
      if (!vehicleModel) {
        const info = lookupVehicleByPlate(cleanPlate);
        if (info && info.model) {
          setVehicleModel(info.model);
          if (!vehicleKm && info.km) setVehicleKm(String(info.km));
        }
      }
    }
  };

  // Select an existing client from suggestions
  const handleSelectClient = (c: Client) => {
    if (!c) return;
    setClientName(c.name || '');
    setClientPhone(c.phone || '(13) 99689-2958');
    setSelectedClientId(c.id);

    // If client has a car, auto-fill it
    const clientCar = vehicles.find(v => v && v.clientId === c.id);
    if (clientCar) {
      setVehiclePlate(clientCar.plate || '');
      setVehicleModel(clientCar.model || '');
      setVehicleKm(clientCar.km ? String(clientCar.km) : '');
      setSelectedVehicleId(clientCar.id);
    }
  };

  // Select an existing vehicle from suggestions
  const handleSelectVehicle = (v: Vehicle) => {
    if (!v) return;
    setVehiclePlate(v.plate || '');
    setVehicleModel(v.model || '');
    setVehicleKm(v.km ? String(v.km) : '');
    setSelectedVehicleId(v.id);

    // Auto-fill client if vehicle is linked to a client
    if (v.clientId) {
      const owner = clients.find(c => c && c.id === v.clientId);
      if (owner) {
        setClientName(owner.name || '');
        setClientPhone(owner.phone || '(13) 99689-2958');
        setSelectedClientId(owner.id);
      }
    }
  };

  // 100% BULLETPROOF ADVANCE TO ITENS - ALWAYS MOVES FORWARD
  const handleAdvanceToItems = () => {
    // 1. ADVANCE STEP IMMEDIATELY FIRST - NEVER BLOCKED BY STORAGE OR ASYNC
    setStep('ITENS');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 2. Normalize and set direct fields
    const finalClientName = (clientName || '').trim() ? (clientName || '').trim().toUpperCase() : 'CLIENTE BALCÃO';
    const finalClientPhone = (clientPhone || '').trim() || '(13) 99689-2958';
    const finalPlate = (vehiclePlate || '').trim() ? (vehiclePlate || '').trim().toUpperCase() : 'SEM PLACA';
    const finalModel = (vehicleModel || '').trim() ? (vehicleModel || '').trim().toUpperCase() : 'VEÍCULO DIVERSOS';
    const finalKmNum = parseFloat(vehicleKm) || 0;

    setClientName(finalClientName);
    setClientPhone(finalClientPhone);
    setVehiclePlate(finalPlate);
    setVehicleModel(finalModel);

    // 3. Persist client & vehicle non-blockingly
    setTimeout(async () => {
      try {
        let targetClientId = selectedClientId;
        if (!targetClientId) {
          const existingClient = clients.find(c => c && (c.name || '').toUpperCase() === finalClientName);
          if (existingClient) {
            targetClientId = existingClient.id;
          } else {
            targetClientId = Math.random().toString(36).substr(2, 9);
            const newClientObj: Client = {
              id: targetClientId,
              name: finalClientName,
              phone: finalClientPhone,
              document: '---',
              observations: 'CADASTRADO PELA NOTA FISCAL',
              createdAt: new Date().toISOString()
            };
            const updatedClients = mergeUniqueById(clients, [newClientObj]);
            setClients(updatedClients);
            saveWorkshopData('clients', updatedClients, tenant);
            if (syncData) syncData('clients', updatedClients).catch(console.warn);
          }
          setSelectedClientId(targetClientId);
        }

        let targetVehicleId = selectedVehicleId;
        if (finalPlate !== 'SEM PLACA') {
          const existingVehicle = vehicles.find(v => v && (v.plate || '').toUpperCase() === finalPlate);
          if (existingVehicle) {
            targetVehicleId = existingVehicle.id;
            const updatedVehicles = vehicles.map(v => v && v.id === existingVehicle.id ? { ...v, km: finalKmNum, model: finalModel } : v);
            setVehicles(updatedVehicles);
            saveWorkshopData('vehicles', updatedVehicles, tenant);
            if (syncData) syncData('vehicles', updatedVehicles).catch(console.warn);
          } else {
            targetVehicleId = Math.random().toString(36).substr(2, 9);
            const newVeh: Vehicle = {
              id: targetVehicleId,
              clientId: targetClientId,
              model: finalModel,
              plate: finalPlate,
              brand: finalModel.split(' ')[0] || 'GERAL',
              year: '---',
              km: finalKmNum
            };
            const updatedVehicles = mergeUniqueById(vehicles, [newVeh]);
            setVehicles(updatedVehicles);
            saveWorkshopData('vehicles', updatedVehicles, tenant);
            if (syncData) syncData('vehicles', updatedVehicles).catch(console.warn);
          }
          setSelectedVehicleId(targetVehicleId);
        }
      } catch (saveErr) {
        console.warn("Notice: background client/vehicle auto-save:", saveErr);
      }
    }, 10);
  };

  // Recalculate total dynamically
  const totalValue = useMemo(() => {
    const itemsTotal = items.reduce((acc, curr) => acc + ((curr.quantity || 0) * (curr.unitPrice || 0)), 0);
    return itemsTotal + (parseFloat(labor) || 0);
  }, [items, labor]);

  // Add Item Line
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unitPrice: 0, type: 'SERVICE' }
    ]);
  };

  // Add Preset Service Item
  const handleAddPreset = (preset: typeof PRESET_SERVICES[0]) => {
    setItems(prev => {
      // Replace if only 1 empty item exists
      if (prev.length === 1 && !prev[0].description && prev[0].unitPrice === 0) {
        return [{
          id: Math.random().toString(36).substr(2, 9),
          description: preset.desc,
          quantity: 1,
          unitPrice: preset.defaultPrice,
          type: preset.type
        }];
      }
      return [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          description: preset.desc,
          quantity: 1,
          unitPrice: preset.defaultPrice,
          type: preset.type
        }
      ];
    });
  };

  // Add Part From Inventory
  const handleAddPartFromInventory = (part: Part) => {
    setItems(prev => [
      ...prev,
      { 
        id: Math.random().toString(36).substr(2, 9), 
        description: part.name.toUpperCase(), 
        quantity: 1, 
        unitPrice: part.salePrice, 
        type: 'PART' 
      }
    ]);
    setShowPartSearch(false);
    setPartSearch('');
  };

  // Automatically Purge Empty/Blank Item Boxes (Request #3)
  const handlePurgeBlankBoxes = () => {
    const filtered = items.filter(i => (i.description && i.description.trim() !== '') || (i.unitPrice || 0) > 0);
    if (filtered.length === 0) {
      setItems([{ id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unitPrice: 0, type: 'SERVICE' }]);
    } else {
      setItems(filtered);
    }
  };

  // CONCLUDE AND GENERATE INVOICE
  const handleFinalize = async () => {
    setIsSaving(true);
    try {
      // 1. Automatically remove all empty item boxes so the invoice is clean (No blank lines)
      let validItems = items
        .filter(i => (i.description && i.description.trim() !== '') || ((i.unitPrice || 0) > 0))
        .map((i, index) => ({
          ...i,
          description: (i.description && i.description.trim() !== '') 
            ? i.description.trim().toUpperCase() 
            : `SERVIÇO MECÂNICO ITEM ${index + 1}`,
          quantity: i.quantity || 1,
          unitPrice: i.unitPrice || 0
        }));

      const laborVal = parseFloat(labor) || 0;

      // Fallback if no items were typed
      if (validItems.length === 0) {
        if (laborVal > 0) {
          validItems = [{
            id: Math.random().toString(36).substr(2, 9),
            description: 'SERVIÇO MECÂNICO KAEN (MÃO DE OBRA TÉCNICA)',
            quantity: 1,
            unitPrice: laborVal,
            type: 'SERVICE'
          }];
        } else {
          validItems = [{
            id: Math.random().toString(36).substr(2, 9),
            description: 'MANUTENÇÃO PREVENTIVA E REVISÃO',
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
        clientId: selectedClientId || 'c_balcao',
        clientName: clientName.trim() || 'CLIENTE BALCÃO',
        clientPhone: clientPhone.trim() || '(13) 99689-2958',
        vehicleId: selectedVehicleId || 'v_geral',
        vehiclePlate: vehiclePlate.trim().toUpperCase() || 'SEM PLACA',
        vehicleModel: vehicleModel.trim().toUpperCase() || 'VEÍCULO DIVERSOS',
        vehicleKm: vehicleKm.trim() || '0',
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

      // Set final OS and advance immediately
      setFinalOs(os);
      setStep('FINAL');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Save order to persistent workshop database
      try {
        const currentOrders = getWorkshopData<ServiceOrder[]>('orders', tenant, []);
        const updatedOrders = mergeUniqueById(currentOrders, [os]);
        await saveWorkshopData('orders', updatedOrders, tenant);
        if (syncData) syncData('orders', updatedOrders).catch(console.warn);
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
      console.error("Erro ao gerar nota:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Download Note Image
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
        backgroundColor: '#FFFFFF', 
        useCORS: true, 
        width: 794, 
        height: clone.offsetHeight 
      });
      const link = document.createElement('a');
      link.download = `KAEN_NOTA_${finalOs.vehiclePlate}_${finalOs.osNumber}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error(err);
      alert("Houve um erro ao baixar a imagem da nota.");
    } finally {
      target.innerHTML = '';
      setIsSaving(false);
    }
  };

  // Send Note via WhatsApp
  const shareWhatsApp = () => {
    if (!finalOs) return;
    const cleanPhone = (finalOs.clientPhone || '').replace(/\D/g, '');
    const phoneToUse = cleanPhone.length >= 10 ? (cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`) : '5513996892958';
    
    const msg = `🚗 *AUTO MECÂNICA KAEN - REGISTRO/SP*
*ORDEM DE SERVIÇO Nº ${finalOs.osNumber}*

Olá, *${finalOs.clientName}*!
Sua ordem de serviço foi emitida com sucesso:

🔧 *Veículo:* ${finalOs.vehicleModel}
🏷️ *Placa:* ${finalOs.vehiclePlate}
⚡ *KM Atual:* ${finalOs.vehicleKm || '0'} KM
💰 *Valor Total:* R$ ${finalOs.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
🛡️ *Garantia:* 90 dias para serviços

Auto Mecânica Kaen
Rua Joaquim Marques Alves, 765 - Registro/SP
WhatsApp: (13) 99689-2958`;

    window.open(`https://wa.me/${phoneToUse}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Reset for a new note
  const handleReset = () => {
    setClientName('');
    setClientPhone('(13) 99689-2958');
    setSelectedClientId('');
    setVehiclePlate('');
    setVehicleModel('');
    setVehicleKm('');
    setSelectedVehicleId('');
    setItems([{ id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unitPrice: 0, type: 'SERVICE' }]);
    setLabor('0');
    setFinalOs(null);
    setStep('DADOS');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center animate-in fade-in duration-300 pb-32">
      
      {/* TOP BAR / NAVIGATION */}
      <div className="w-full max-w-4xl p-3 sm:p-4 flex items-center justify-between border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-30">
        <button 
          onClick={() => navigate('/orders')} 
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>Voltar</span>
        </button>

        {/* 3 Step Pill Indicator */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setStep('DADOS')}
            className={`px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${step === 'DADOS' ? 'bg-[#FF2D55] text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            <span>1. Carro & Cliente</span>
            {(vehiclePlate || clientName) && <Check size={11} className="text-emerald-400" />}
          </button>

          <button
            onClick={handleAdvanceToItems}
            className={`px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${step === 'ITENS' ? 'bg-[#FF2D55] text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            <span>2. Serviços & Itens</span>
            {items.some(i => i.description) && <Check size={11} className="text-emerald-400" />}
          </button>

          <button
            onClick={() => {
              if (finalOs) setStep('FINAL');
              else handleFinalize();
            }}
            className={`px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${step === 'FINAL' ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            <span>3. Nota Final</span>
          </button>
        </div>

        <button 
          onClick={handleReset} 
          title="Nova Nota"
          className="p-2 text-zinc-500 hover:text-[#FF2D55] rounded-xl hover:bg-white/5 transition-all cursor-pointer"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="w-full max-w-3xl p-4 sm:p-6 space-y-6">

        {/* ======================================================== */}
        {/* STEP 1: CARRO & CLIENTE (UNIFIED, FAST, NEVER BLOCKS)    */}
        {/* ======================================================== */}
        {step === 'DADOS' && (
          <div className="space-y-6 animate-in slide-in-from-right-3 duration-300">
            
            {/* Header Title */}
            <div className="text-center space-y-1">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#FF2D55] block">ETAPA 1 DE 2</span>
              <h1 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">
                DADOS DO VEÍCULO & CLIENTE
              </h1>
              <p className="text-xs text-zinc-400">
                Preencha a placa e o carro. Se o cliente for novo, o sistema salva automaticamente.
              </p>
            </div>

            {/* CARD PRINCIPAL: VEÍCULO / CARRO */}
            <div className="glass-card p-5 sm:p-7 rounded-[2.5rem] border border-white/10 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FF2D55]/15 border border-[#FF2D55]/30 text-[#FF2D55] flex items-center justify-center">
                  <Car size={20} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black italic uppercase tracking-wider text-white">
                    IDENTIFICAÇÃO DO VEÍCULO
                  </h3>
                  <p className="text-[10px] text-zinc-400">Digite a placa ou escolha um carro da oficina abaixo</p>
                </div>
              </div>

              {/* Form Grid: Placa, Modelo, KM Atual */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Placa */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#FF2D55] flex items-center justify-between">
                    <span>PLACA DO CARRO *</span>
                    <span className="text-[8px] text-zinc-500 font-normal">Auto-detecta</span>
                  </label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => handlePlateInputChange(e.target.value)}
                    placeholder="EX: BRA-2E19"
                    className="w-full bg-black/80 border-2 border-white/15 focus:border-[#FF2D55] rounded-2xl p-3.5 text-white font-mono font-black text-sm uppercase outline-none tracking-widest shadow-inner"
                  />
                </div>

                {/* Modelo */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-300">
                    MODELO / VERSÃO / ANO
                  </label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value.toUpperCase())}
                    placeholder="EX: HONDA CIVIC 2.0 2018"
                    className="w-full bg-black/80 border border-white/15 focus:border-[#FF2D55] rounded-2xl p-3.5 text-white font-black text-xs sm:text-sm uppercase outline-none tracking-wider shadow-inner"
                  />
                </div>

                {/* KM Atual */}
                <div className="space-y-1.5 sm:col-span-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                    <Gauge size={13} />
                    <span>KM ATUAL NESTA VISITA (ATUALIZAR RETORNO DO CARRO)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={vehicleKm}
                      onChange={(e) => setVehicleKm(e.target.value)}
                      placeholder="EX: 85400"
                      className="w-full bg-black/80 border border-emerald-500/40 focus:border-emerald-400 rounded-2xl p-3.5 pl-4 pr-16 text-white font-mono font-bold text-sm outline-none shadow-inner"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-400 font-mono">
                      KM
                    </span>
                  </div>
                </div>
              </div>

              {/* Sugestões de Veículos Cadastrados na Oficina */}
              {vehicles.length > 0 && (
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-black uppercase tracking-widest text-zinc-500">
                      OU CLIQUE EM UM VEÍCULO DA OFICINA:
                    </span>
                    <input
                      type="text"
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      placeholder="Filtrar placa..."
                      className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white uppercase outline-none w-28 text-right font-mono"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {vehicles
                      .filter(v => v && v.plate && (!vehicleSearch || (v.plate || '').toUpperCase().includes(vehicleSearch.toUpperCase()) || (v.model || '').toLowerCase().includes(vehicleSearch.toLowerCase())))
                      .slice(0, 8)
                      .map(v => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            handleSelectVehicle(v);
                          }}
                          className={`p-2.5 rounded-xl border flex flex-col text-left shrink-0 min-w-[130px] transition-all cursor-pointer ${vehiclePlate === v.plate ? 'bg-[#FF2D55]/20 border-[#FF2D55]' : 'bg-zinc-900/80 border-white/10 hover:border-white/30'}`}
                        >
                          <span className="text-xs font-black text-white font-mono">{v.plate}</span>
                          <span className="text-[9px] text-zinc-400 truncate max-w-[120px]">{v.model || 'Veículo'}</span>
                          <span className="text-[8px] text-emerald-400 font-mono mt-0.5">{v.km ? `${Number(v.km).toLocaleString('pt-BR')} KM` : 'Sem KM'}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* CARD CLIENTE */}
            <div className="glass-card p-5 sm:p-7 rounded-[2.5rem] border border-white/10 space-y-5 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black italic uppercase tracking-wider text-white">
                    CLIENTE PROPRIETÁRIO
                  </h3>
                  <p className="text-[10px] text-zinc-400">Nome e WhatsApp para envio da nota</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Nome */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-300">
                    NOME DO CLIENTE
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value.toUpperCase())}
                    placeholder="EX: RAFAEL KAEN (OU CLIENTE BALCÃO)"
                    className="w-full bg-black/80 border border-white/15 focus:border-[#FF2D55] rounded-2xl p-3.5 text-white font-black text-xs sm:text-sm uppercase outline-none tracking-wider shadow-inner"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                    <Phone size={12} />
                    <span>WHATSAPP / CELULAR</span>
                  </label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(13) 99689-2958"
                    className="w-full bg-black/80 border border-white/15 focus:border-emerald-500 rounded-2xl p-3.5 text-white font-black text-xs sm:text-sm outline-none tracking-wider shadow-inner"
                  />
                </div>
              </div>

              {/* Sugestões de Clientes Cadastrados */}
              {clients.length > 0 && (
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-black uppercase tracking-widest text-zinc-500">
                      OU ESCOLHA DA LISTA DE CLIENTES:
                    </span>
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Buscar cliente..."
                      className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white uppercase outline-none w-28 text-right font-mono"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {clients
                      .filter(c => c && c.name && (!clientSearch || (c.name || '').toLowerCase().includes(clientSearch.toLowerCase()) || (c.phone && c.phone.includes(clientSearch))))
                      .slice(0, 8)
                      .map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            handleSelectClient(c);
                          }}
                          className={`p-2.5 rounded-xl border flex flex-col text-left shrink-0 min-w-[130px] transition-all cursor-pointer ${clientName === c.name ? 'bg-blue-500/20 border-blue-500' : 'bg-zinc-900/80 border-white/10 hover:border-white/30'}`}
                        >
                          <span className="text-xs font-black text-white truncate max-w-[120px]">{c.name}</span>
                          <span className="text-[9px] text-zinc-400 mt-0.5">{c.phone || '(13) 99689-2958'}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* BOTÃO PRINCIPAL AVANÇAR: 100% FUNCIONAL E VISÍVEL */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAdvanceToItems}
                className="w-full bg-[#FF2D55] hover:bg-[#D11D40] text-white py-5 rounded-2xl font-black uppercase text-sm tracking-[0.2em] active:scale-98 transition-all cursor-pointer shadow-xl shadow-red-900/40 flex items-center justify-center gap-3"
              >
                <span>AVANÇAR PARA OS SERVIÇOS & ITENS</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: ITENS & VALORES (COMPLETO, RÁPIDO, INTUITIVO)    */}
        {/* ======================================================== */}
        {step === 'ITENS' && (
          <div className="space-y-6 animate-in slide-in-from-right-3 duration-300">
            
            {/* Header com Resumo do Carro e Cliente */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-white/10 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FF2D55]/15 border border-[#FF2D55]/30 text-[#FF2D55] flex items-center justify-center shrink-0">
                  <Car size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black text-white font-mono tracking-widest">
                      {vehiclePlate || 'SEM PLACA'}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                      {vehicleKm ? `${Number(vehicleKm).toLocaleString('pt-BR')} KM` : '0 KM'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 font-bold uppercase truncate max-w-[240px] sm:max-w-none">
                    {vehicleModel || 'VEÍCULO DIVERSOS'} • {clientName || 'CLIENTE BALCÃO'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEditCarInItems(!showEditCarInItems)}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Pencil size={12} />
                <span className="hidden sm:inline">Ajustar Carro / KM</span>
                <span className="sm:hidden">Ajustar</span>
              </button>
            </div>

            {/* Quick Car/KM inline editor if requested */}
            {showEditCarInItems && (
              <div className="p-4 bg-zinc-950 border border-white/10 rounded-2xl space-y-3 animate-in zoom-in-95 duration-200">
                <span className="text-[9px] font-black text-[#FF2D55] uppercase tracking-wider">EDITAR DADOS DA NOTA EM ANDAMENTO:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="Placa"
                    className="p-2.5 bg-black border border-white/10 rounded-xl text-xs font-mono font-bold text-white uppercase outline-none"
                  />
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value.toUpperCase())}
                    placeholder="Modelo"
                    className="p-2.5 bg-black border border-white/10 rounded-xl text-xs font-bold text-white uppercase outline-none sm:col-span-1"
                  />
                  <input
                    type="number"
                    value={vehicleKm}
                    onChange={(e) => setVehicleKm(e.target.value)}
                    placeholder="KM Atual"
                    className="p-2.5 bg-black border border-emerald-500/40 rounded-xl text-xs font-mono font-bold text-white outline-none"
                  />
                </div>
              </div>
            )}

            {/* CONJUNTO DE BOTÕES DE SERVIÇOS MAIS USADOS (1 CLIQUE) */}
            <div className="bg-zinc-950/80 border border-white/10 rounded-[2rem] p-4 sm:p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-black uppercase tracking-[0.2em] text-[#FF2D55] flex items-center gap-1.5">
                  <Zap size={14} className="text-[#FF2D55]" />
                  <span>SERVIÇOS FREQUENTES (1 TOQUE PARA ADICIONAR):</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPartSearch(true)}
                  className="text-[9px] font-black uppercase text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Package size={12} />
                  <span>Estoque de Peças</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {PRESET_SERVICES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPreset(preset)}
                    className="p-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-white/5 hover:border-[#FF2D55]/60 rounded-xl flex flex-col text-left transition-all active:scale-95 group cursor-pointer shadow-sm"
                    title={`Adicionar ${preset.label} por R$ ${preset.defaultPrice}`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-sm">{preset.icon}</span>
                      <span className="text-[9px] font-black uppercase text-white truncate group-hover:text-[#FF2D55] transition-colors">
                        {preset.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 font-mono">
                      R$ {preset.defaultPrice.toLocaleString('pt-BR')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal de Peças do Estoque */}
            {showPartSearch && (
              <div className="bg-zinc-900 p-5 rounded-2xl border border-[#FF2D55]/40 space-y-3 animate-in zoom-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FF2D55]">BUSCAR PEÇA NO ESTOQUE</h4>
                  <button onClick={() => setShowPartSearch(false)} className="cursor-pointer text-zinc-400 hover:text-white"><X size={18}/></button>
                </div>
                <input 
                  type="text" 
                  value={partSearch} 
                  onChange={(e) => setPartSearch(e.target.value)} 
                  placeholder="DIGITE O NOME DA PEÇA..." 
                  className="w-full bg-black border border-white/10 p-3 rounded-xl text-white font-black text-xs outline-none"
                />
                <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1">
                  {parts.filter(p => p.name.toLowerCase().includes(partSearch.toLowerCase())).map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => handleAddPartFromInventory(p)} 
                      className="flex items-center justify-between p-3 bg-black/50 rounded-xl hover:bg-black transition-all border border-transparent hover:border-white/10 cursor-pointer text-left"
                    >
                      <span className="text-xs font-black uppercase italic text-white">{p.name}</span>
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

            {/* TABELA DE ITENS DA NOTA */}
            <div className="glass-card p-5 sm:p-7 rounded-[2.5rem] border border-white/10 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                  ITENS & SERVIÇOS LANÇADOS ({items.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePurgeBlankBoxes}
                    className="text-[9px] font-bold uppercase text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    title="Remove linhas sem descrição"
                  >
                    🧹 Limpar Vazios
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 bg-[#FF2D55] text-white rounded-xl font-black uppercase text-[9px] tracking-wider flex items-center gap-1 active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Adicionar Item</span>
                  </button>
                </div>
              </div>

              {/* Lista dos Itens */}
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item.id || idx} className="bg-black/70 p-3.5 sm:p-4 rounded-2xl border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500">
                        Item #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setItems(items.filter(i => i.id !== item.id))}
                          className="text-zinc-500 hover:text-[#FF2D55] transition-colors p-1 cursor-pointer"
                          title="Excluir item"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, description: e.target.value.toUpperCase() } : i))}
                      placeholder="DESCREVA O SERVIÇO OU PEÇA (EX: PASTILHAS, ÓLEO 5W30, REVISÃO...)"
                      className="w-full bg-white/5 border border-white/10 focus:border-[#FF2D55] rounded-xl p-3 text-xs sm:text-sm font-black uppercase text-white outline-none tracking-wide placeholder-zinc-600"
                    />

                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-zinc-400">QUANTIDADE</label>
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, quantity: parseFloat(e.target.value) || 0 } : i))}
                          placeholder="1"
                          className="w-full bg-white/5 border border-white/10 focus:border-[#FF2D55] rounded-xl p-2.5 text-center text-xs font-mono font-bold text-white outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-zinc-400">VALOR UNIT. (R$)</label>
                        <input
                          type="number"
                          value={item.unitPrice || ''}
                          onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, unitPrice: parseFloat(e.target.value) || 0 } : i))}
                          placeholder="0,00"
                          className="w-full bg-white/5 border border-white/10 focus:border-[#FF2D55] rounded-xl p-2.5 text-xs font-mono font-bold text-white outline-none"
                        />
                      </div>

                      <div className="space-y-1 text-right">
                        <label className="text-[8px] font-black uppercase text-zinc-400">SUBTOTAL</label>
                        <div className="p-2.5 text-xs sm:text-sm font-mono font-black text-emerald-400 truncate">
                          R$ {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mão de Obra e Total */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-300 block">
                      MÃO DE OBRA GERAL (R$)
                    </label>
                    <span className="text-[9px] text-zinc-500">Valor adicional de serviço técnico</span>
                  </div>
                  <input
                    type="number"
                    value={labor}
                    onChange={(e) => setLabor(e.target.value)}
                    placeholder="0"
                    className="w-32 sm:w-40 bg-black border border-white/15 focus:border-[#FF2D55] rounded-xl p-3 text-right text-sm font-mono font-bold text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#FF2D55] block">TOTAL GERAL DA NOTA</span>
                    <span className="text-xs text-zinc-400 font-bold uppercase">{clientName || 'CLIENTE BALCÃO'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-4xl font-black text-[#FF2D55] font-mono italic tracking-tight">
                      R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* BOTÃO GERAR NOTA */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={isSaving}
                  className="w-full bg-[#FF2D55] hover:bg-[#D11D40] text-white py-5 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-[0.25em] active:scale-98 transition-all cursor-pointer shadow-xl shadow-red-900/40 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
                  <span>CONCLUIR E GERAR NOTA FISCAL</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: NOTA FINAL GERADA (PREVIEW, IMPRIMIR, ENVIAR)    */}
        {/* ======================================================== */}
        {step === 'FINAL' && finalOs && (
          <div className="space-y-6 animate-in fade-in duration-500 flex flex-col items-center">
            
            {/* Banner de Sucesso */}
            <div className="w-full p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-emerald-400">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="shrink-0" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Nota Nº {finalOs.osNumber} Gerada com Sucesso!
                  </h4>
                  <p className="text-[10px] text-emerald-300">
                    Veículo: {finalOs.vehiclePlate} ({finalOs.vehicleModel}) • {finalOs.vehicleKm || '0'} KM
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEditFinalModal(true)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Pencil size={12} />
                <span>Editar Dados</span>
              </button>
            </div>

            {/* Invoice Render Preview Container */}
            <div className="invoice-preview-wrapper shadow-2xl rounded-2xl overflow-hidden border border-white/10 w-full max-w-full">
              <div className="invoice-container-scaled">
                <div ref={previewRef}>
                  <Invoice os={finalOs} />
                </div>
              </div>
            </div>

            {/* Ações da Nota */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={shareWhatsApp}
                className="p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer active:scale-95"
              >
                <Share2 size={18} />
                <span>Enviar no WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={downloadImage}
                disabled={isSaving}
                className="p-4 bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
              >
                <Download size={18} />
                <span>Baixar Foto (PNG)</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="p-4 bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
              >
                <Printer size={18} />
                <span>Imprimir Nota</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-4 bg-[#FF2D55] hover:bg-[#D11D40] text-white rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all cursor-pointer active:scale-95"
              >
                <Plus size={18} />
                <span>Fazer Nova Nota</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* BARRA FIXA DE AÇÃO NO MOBILE (NUNCA SOME NO CELULAR) */}
      {step === 'DADOS' && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-black/95 backdrop-blur-lg border-t border-white/10 flex items-center justify-between gap-3 z-50 md:hidden shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
          <div className="text-left truncate max-w-[150px]">
            <span className="text-[8px] font-black uppercase text-zinc-500 block">Veículo:</span>
            <span className="text-xs font-black text-white font-mono truncate block">{vehiclePlate || 'Sem placa'}</span>
          </div>
          <button
            type="button"
            onClick={handleAdvanceToItems}
            className="flex-1 py-3.5 px-4 bg-[#FF2D55] text-white rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-red-900/40 cursor-pointer"
          >
            <span>Avançar para Itens</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {step === 'ITENS' && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-black/95 backdrop-blur-lg border-t border-white/10 flex items-center justify-between gap-3 z-50 md:hidden shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
          <div className="text-left">
            <span className="text-[8px] font-black uppercase text-zinc-500 block">Total:</span>
            <span className="text-sm font-black text-[#FF2D55] font-mono">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <button
            type="button"
            onClick={handleFinalize}
            disabled={isSaving}
            className="flex-1 py-3.5 px-4 bg-[#FF2D55] text-white rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-red-900/40 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            <span>Concluir Nota</span>
          </button>
        </div>
      )}

      {/* RENDER TARGET HIDDEN PARA EXPORTAÇÃO HD DE NOTA */}
      <div id="render-target-hidden" style={{ position: 'fixed', top: '-10000px', left: '-10000px', width: '794px' }} />

      {/* MODAL DE EDIÇÃO DE NOTA CASO O USUÁRIO QUEIRA MUDAR TELEFONE OU KM DEPOIS */}
      {showEditFinalModal && finalOs && (
        <EditOrderModal
          isOpen={showEditFinalModal}
          onClose={() => setShowEditFinalModal(false)}
          order={finalOs}
          session={activeSession}
          syncData={syncData}
          onOrderUpdated={(updated) => {
            setFinalOs(updated);
            setShowEditFinalModal(false);
          }}
        />
      )}
    </div>
  );
};

export default NewServiceOrder;
