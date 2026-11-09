import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Wrench, ChevronLeft, X,
  User, Users, Search, Loader2, Check, ImageIcon, Car, Info, Download, Phone, Package, Camera, Sparkles, Gauge, Zap,
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
  const [clientMode, setClientMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

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
  const loadData = async () => {
    let savedClients = getWorkshopData<Client[]>('clients', tenant, []);
    let savedVehicles = getWorkshopData<Vehicle[]>('vehicles', tenant, []);
    const savedParts = getWorkshopData<Part[]>('parts', tenant, []);

    // Fetch directly from server API if local storage has fewer records
    try {
      const res = await fetch(`/api/sync/${tenant}`);
      if (res.ok) {
        const cloudData = await res.json();
        if (Array.isArray(cloudData.clients) && cloudData.clients.length > 0) {
          savedClients = mergeUniqueById(savedClients, cloudData.clients);
          localStorage.setItem(`kaenpro_rafael_clients`, JSON.stringify(savedClients));
          localStorage.setItem(`kaen_clients`, JSON.stringify(savedClients));
        }
        if (Array.isArray(cloudData.vehicles) && cloudData.vehicles.length > 0) {
          savedVehicles = mergeUniqueById(savedVehicles, cloudData.vehicles);
          localStorage.setItem(`kaenpro_rafael_vehicles`, JSON.stringify(savedVehicles));
          localStorage.setItem(`kaen_vehicles`, JSON.stringify(savedVehicles));
        }
      }
    } catch (e) {}

    const cleanClients = (savedClients || []).map(c => ({
      ...c,
      id: String(c?.id || Math.random().toString(36).substr(2, 9)),
      name: String(c?.name || '').trim().toUpperCase(),
      phone: String(c?.phone || '(13) 99689-2958'),
      document: String(c?.document || '---')
    }));
    const cleanVehicles = (savedVehicles || []).map(v => ({
      ...v,
      id: String(v?.id || Math.random().toString(36).substr(2, 9)),
      plate: String(v?.plate || 'SEM PLACA').trim().toUpperCase(),
      model: String(v?.model || 'VEÍCULO DIVERSOS').trim().toUpperCase(),
      km: typeof v?.km === 'number' ? v.km : parseFloat(String(v?.km || 0).replace(',', '.')) || 0
    }));

    setClients(cleanClients);
    setVehicles(cleanVehicles);
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

  // Selected client object
  const selectedClient = useMemo(() => {
    return clients.find(c => c && (c.id === selectedClientId || (c.name && clientName && (c.name || '').toUpperCase() === (clientName || '').toUpperCase())));
  }, [clients, selectedClientId, clientName]);

  // Cars belonging to the currently selected client
  const clientVehicles = useMemo(() => {
    if (!selectedClientId && !clientName) return [];
    return vehicles.filter(v => {
      if (!v) return false;
      if (selectedClientId && v.clientId === selectedClientId) return true;
      if (selectedClient && v.clientId === selectedClient.id) return true;
      if (clientName && (v as any).clientName && ((v as any).clientName || '').toUpperCase() === (clientName || '').toUpperCase()) return true;
      return false;
    });
  }, [vehicles, selectedClient, selectedClientId, clientName]);

  // Filtered clients for instant search
  const filteredClients = useMemo(() => {
    const q = (clientSearch || '').trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c => {
      if (!c) return false;
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const doc = (c.document || '').toLowerCase();
      const hasCarPlate = vehicles.some(v => v && v.clientId === c.id && (v.plate || '').toLowerCase().includes(q));
      return name.includes(q) || phone.includes(q) || doc.includes(q) || hasCarPlate;
    });
  }, [clients, vehicles, clientSearch]);

  // Select an existing client from search or suggestions (Auto-fills car!)
  const handleSelectClient = (c: Client) => {
    if (!c) return;
    setClientName(c.name ? String(c.name) : '');
    setClientPhone(c.phone ? String(c.phone) : '(13) 99689-2958');
    setSelectedClientId(c.id);

    // Auto-fill car if client has one or more vehicles registered
    const cars = vehicles.filter(v => v && (v.clientId === c.id || ((v as any).clientName && c.name && String((v as any).clientName || '').toUpperCase() === String(c.name || '').toUpperCase())));
    if (cars.length > 0) {
      const primaryCar = cars[0];
      setVehiclePlate(primaryCar.plate ? String(primaryCar.plate) : '');
      setVehicleModel(primaryCar.model ? String(primaryCar.model) : '');
      setVehicleKm(primaryCar.km !== undefined && primaryCar.km !== null ? String(primaryCar.km) : '');
      setSelectedVehicleId(primaryCar.id);
    }
  };

  // Select client and immediately advance to step 2 (Itens)
  const handleSelectClientAndAdvance = (c: Client) => {
    if (!c) return;
    handleSelectClient(c);
    setClientSearch('');
    setTimeout(() => {
      setStep('ITENS');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 40);
  };

  // Quick action: Cliente Balcão
  const handleQuickBalcao = () => {
    setClientName('CLIENTE BALCÃO');
    setClientPhone('(13) 99689-2958');
    setSelectedClientId('cli_balcao_09');
    setVehiclePlate('SEM VEÍCULO');
    setVehicleModel('ATENDIMENTO BALCÃO / AVULSO');
    setVehicleKm('0');
    setSelectedVehicleId('');
    setClientSearch('');
  };

  // Quick action: Novo Cliente (limpar campos para preenchimento)
  const handleQuickNewClient = () => {
    setClientName('');
    setClientPhone('');
    setSelectedClientId('');
    setVehiclePlate('');
    setVehicleModel('');
    setVehicleKm('');
    setSelectedVehicleId('');
    setClientSearch('');
    setClientMode('NEW');
  };

  // Dedicated handler: Save new client and vehicle and advance to items
  const handleCreateNewClientAndAdvance = () => {
    const finalName = String(clientName || '').trim() ? String(clientName || '').trim().toUpperCase() : 'NOVO CLIENTE';
    const finalPhone = String(clientPhone || '').trim() || '(13) 99689-2958';
    const finalPlate = String(vehiclePlate || '').trim() ? String(vehiclePlate || '').trim().toUpperCase() : 'SEM PLACA';
    const finalModel = String(vehicleModel || '').trim() ? String(vehicleModel || '').trim().toUpperCase() : 'VEÍCULO DIVERSOS';
    const finalKmNum = parseFloat(String(vehicleKm || '0').replace(',', '.')) || 0;

    const newClientId = Math.random().toString(36).substr(2, 9);
    const newClientObj: Client = {
      id: newClientId,
      name: finalName,
      phone: finalPhone,
      document: '---',
      observations: 'CADASTRADO PELA EMISSÃO DE NOTA',
      createdAt: new Date().toISOString()
    };

    let newVehId = '';
    let updatedVehicles = [...vehicles];
    if (finalPlate !== 'SEM PLACA') {
      newVehId = Math.random().toString(36).substr(2, 9);
      const newVehObj: Vehicle = {
        id: newVehId,
        clientId: newClientId,
        plate: finalPlate,
        model: finalModel,
        brand: finalModel.split(' ')[0] || 'GERAL',
        year: '---',
        km: finalKmNum
      };
      updatedVehicles = mergeUniqueById(vehicles, [newVehObj]);
      setVehicles(updatedVehicles);
      saveWorkshopData('vehicles', updatedVehicles, tenant);
      if (syncData) syncData('vehicles', updatedVehicles).catch(console.warn);
    }

    const updatedClients = mergeUniqueById(clients, [newClientObj]);
    setClients(updatedClients);
    saveWorkshopData('clients', updatedClients, tenant);
    if (syncData) syncData('clients', updatedClients).catch(console.warn);

    setClientName(finalName);
    setClientPhone(finalPhone);
    setSelectedClientId(newClientId);
    setVehiclePlate(finalPlate);
    setVehicleModel(finalModel);
    setSelectedVehicleId(newVehId);

    setNoticeMessage(`✓ Cliente ${finalName} cadastrado com sucesso!`);
    setTimeout(() => setNoticeMessage(null), 3000);

    setStep('ITENS');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick action: Atendimento Sem Veículo
  const handleQuickSemVeiculo = () => {
    setVehiclePlate('SEM VEÍCULO');
    setVehicleModel('ATENDIMENTO BALCÃO / AVULSO');
    setVehicleKm('0');
    setSelectedVehicleId('');
  };

  // Select an existing vehicle from suggestions
  const handleSelectVehicle = (v: Vehicle) => {
    if (!v) return;
    setVehiclePlate(v.plate ? String(v.plate) : '');
    setVehicleModel(v.model ? String(v.model) : '');
    setVehicleKm(v.km !== undefined && v.km !== null ? String(v.km) : '');
    setSelectedVehicleId(v.id);

    // Auto-fill client if vehicle is linked to a client
    if (v.clientId) {
      const owner = clients.find(c => c && c.id === v.clientId);
      if (owner) {
        setClientName(owner.name ? String(owner.name) : '');
        setClientPhone(owner.phone ? String(owner.phone) : '(13) 99689-2958');
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
    const finalClientName = String(clientName || '').trim() ? String(clientName || '').trim().toUpperCase() : 'CLIENTE BALCÃO';
    const finalClientPhone = String(clientPhone || '').trim() || '(13) 99689-2958';
    const finalPlate = String(vehiclePlate || '').trim() ? String(vehiclePlate || '').trim().toUpperCase() : 'SEM PLACA';
    const finalModel = String(vehicleModel || '').trim() ? String(vehicleModel || '').trim().toUpperCase() : 'VEÍCULO DIVERSOS';
    const finalKmNum = parseFloat(String(vehicleKm || '0').replace(',', '.')) || 0;

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

  // Recalculate total dynamically (guaranteed number, never NaN)
  const totalValue = useMemo(() => {
    const itemsTotal = (Array.isArray(items) ? items : []).reduce((acc, curr) => {
      const q = typeof curr?.quantity === 'number' ? curr.quantity : parseFloat(String(curr?.quantity || 1).replace(',', '.')) || 0;
      const u = typeof curr?.unitPrice === 'number' ? curr.unitPrice : parseFloat(String(curr?.unitPrice || 0).replace(',', '.')) || 0;
      return acc + (q * u);
    }, 0);
    const laborNum = parseFloat(String(labor || '0').replace(',', '.')) || 0;
    return Number(itemsTotal + laborNum) || 0;
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

  // CONCLUDE AND GENERATE INVOICE - 100% RELIABLE & INSTANT
  const handleFinalize = (goToOrdersList: boolean = false) => {
    try {
      // 1. Automatically sanitize items (filter out completely empty lines)
      let validItems = (Array.isArray(items) ? items : [])
        .filter(i => (i && i.description && String(i.description).trim() !== '') || ((Number(i?.unitPrice) || 0) > 0))
        .map((i, index) => ({
          ...i,
          description: (i.description && String(i.description).trim() !== '') 
            ? String(i.description).trim().toUpperCase() 
            : `SERVIÇO MECÂNICO ITEM ${index + 1}`,
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.unitPrice) || 0
        }));

      const laborVal = parseFloat(String(labor || '0').replace(',', '.')) || 0;

      // Fallback if no items were typed so invoice is NEVER empty
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

      const itemsTotal = validItems.reduce((acc, curr) => acc + ((Number(curr.quantity) || 1) * (Number(curr.unitPrice) || 0)), 0);
      const computedTotal = Number(itemsTotal + laborVal) || 0;

      const osNumber = `${Math.floor(100000 + Math.random() * 899999)}`;
      const os: ServiceOrder = {
        id: Math.random().toString(36).substr(2, 9),
        osNumber,
        clientId: selectedClientId || 'c_balcao',
        clientName: String(clientName || '').trim().toUpperCase() || 'CLIENTE BALCÃO',
        clientPhone: String(clientPhone || '').trim() || '(13) 99689-2958',
        vehicleId: selectedVehicleId || 'v_geral',
        vehiclePlate: String(vehiclePlate || '').trim().toUpperCase() || 'SEM PLACA',
        vehicleModel: String(vehicleModel || '').trim().toUpperCase() || 'VEÍCULO DIVERSOS',
        vehicleKm: String(vehicleKm || '0').trim(),
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

      // 1. SAVE IMMEDIATELY TO WORKSHOP DATABASE (LOCAL + SERVIDOR)
      const currentOrders = getWorkshopData<ServiceOrder[]>('orders', tenant, []);
      const updatedOrders = [os, ...currentOrders.filter(o => o && o.id !== os.id)];
      saveWorkshopData('orders', updatedOrders, tenant);
      if (syncData) syncData('orders', updatedOrders).catch(console.warn);

      // 2. Update inventory stock for used parts
      try {
        let updatedParts = [...parts];
        let hasPartChanges = false;
        validItems.forEach(item => {
          if (item.type === 'PART') {
            const pIndex = updatedParts.findIndex(p => String(p?.name || '').toUpperCase() === String(item?.description || '').toUpperCase());
            if (pIndex !== -1) {
              updatedParts[pIndex] = {
                ...updatedParts[pIndex],
                stock: Math.max(0, updatedParts[pIndex].stock - (Number(item.quantity) || 1))
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

      // 3. Option: if explicitly requested to go directly to orders list
      if (goToOrdersList === true) {
        navigate('/orders');
        return;
      }

      // 4. Otherwise switch to final invoice screen
      setFinalOs(os);
      setStep('FINAL');
      setIsSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Erro ao gerar nota:", error);
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
      console.warn("Aviso ao baixar imagem da nota:", err);
    } finally {
      target.innerHTML = '';
      setIsSaving(false);
    }
  };

  // Send Note via WhatsApp
  const shareWhatsApp = () => {
    if (!finalOs) return;
    const cleanPhone = String(finalOs.clientPhone || '').replace(/\D/g, '');
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

        {/* Header Title (Clean, Professional, No 1 2 3) */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF2D55] animate-pulse" />
          <h2 className="text-xs sm:text-sm font-black italic uppercase tracking-wider text-white">
            EMISSÃO DE NOTA FISCAL & OS
          </h2>
          <span className="text-[9px] bg-[#FF2D55]/20 text-[#FF2D55] px-2 py-0.5 rounded-full font-bold hidden sm:inline">
            KAEN
          </span>
        </div>

        <button 
          onClick={handleReset} 
          title="Nova Nota / Limpar"
          className="p-2 text-zinc-500 hover:text-[#FF2D55] rounded-xl hover:bg-white/5 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw size={16} />
          <span className="text-[10px] font-bold uppercase hidden sm:inline">Nova Nota</span>
        </button>
      </div>

      <div className="w-full max-w-3xl p-4 sm:p-6 space-y-6">

        {/* ======================================================== */}
        {/* PASSO 1: DADOS DO CLIENTE & VEÍCULO                     */}
        {/* ======================================================== */}
        {step === 'DADOS' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Seletor de Modo: Cliente Cadastrado vs Novo Cliente */}
            <div className="flex bg-zinc-950/90 p-1.5 rounded-2xl border border-white/10 gap-1.5 shadow-xl">
              <button
                type="button"
                onClick={() => setClientMode('EXISTING')}
                className={`flex-1 py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${clientMode === 'EXISTING' ? 'bg-[#FF2D55] text-white shadow-lg shadow-red-900/40 ring-1 ring-white/20' : 'text-zinc-400 hover:text-white bg-zinc-900/60'}`}
              >
                <Search size={15} />
                <span>CLIENTES CADASTRADOS ({clients.length})</span>
              </button>
              <button
                type="button"
                onClick={handleQuickNewClient}
                className={`flex-1 py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${clientMode === 'NEW' ? 'bg-[#FF2D55] text-white shadow-lg shadow-red-900/40 ring-1 ring-white/20' : 'text-zinc-400 hover:text-white bg-zinc-900/60'}`}
              >
                <Plus size={15} />
                <span>CADASTRAR NOVO CLIENTE</span>
              </button>
            </div>

            {/* MODO NOVO CLIENTE: FORMULÁRIO DEDICADO E DIRETO */}
            {clientMode === 'NEW' && (
              <div className="glass-card p-5 sm:p-7 rounded-[2.5rem] border-2 border-[#FF2D55]/50 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FF2D55]/20 text-[#FF2D55] flex items-center justify-center font-black">
                      <Plus size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-black italic uppercase tracking-wider text-white">
                        CADASTRAR NOVO CLIENTE & CARRO
                      </h3>
                      <p className="text-[10px] text-zinc-400">
                        Preencha os dados abaixo. O cliente e o carro serão gravados automaticamente no banco de dados!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClientMode('EXISTING')}
                    className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Voltar aos salvos
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                      <User size={13} className="text-[#FF2D55]" />
                      <span>Nome do Cliente *</span>
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value.toUpperCase())}
                      placeholder="EX: ROBERTO DE SOUZA"
                      autoFocus
                      className="w-full bg-black/80 border-2 border-white/20 focus:border-[#FF2D55] rounded-2xl p-4 text-white font-black text-sm uppercase outline-none shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Phone size={13} />
                      <span>WhatsApp / Telefone *</span>
                    </label>
                    <input
                      type="text"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="(13) 99689-2958"
                      className="w-full bg-black/80 border-2 border-white/20 focus:border-emerald-500 rounded-2xl p-4 text-white font-black text-sm outline-none shadow-inner font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-[#FF2D55] flex items-center gap-1.5">
                      <Car size={13} />
                      <span>Placa do Carro</span>
                    </label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => handlePlateInputChange(e.target.value)}
                      placeholder="EX: BRA2E19"
                      className="w-full bg-black/80 border-2 border-white/20 focus:border-[#FF2D55] rounded-2xl p-4 text-white font-mono font-black text-sm uppercase outline-none shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-300">
                      Modelo do Carro / Versão
                    </label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value.toUpperCase())}
                      placeholder="EX: CIVIC 2.0 2019"
                      className="w-full bg-black/80 border-2 border-white/20 focus:border-[#FF2D55] rounded-2xl p-4 text-white font-black text-sm uppercase outline-none shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Gauge size={13} />
                      <span>KM Atual Nesta Visita</span>
                    </label>
                    <input
                      type="number"
                      value={vehicleKm}
                      onChange={(e) => setVehicleKm(e.target.value)}
                      placeholder="EX: 92400"
                      className="w-full bg-black/80 border-2 border-emerald-500/50 focus:border-emerald-400 rounded-2xl p-4 text-white font-mono font-black text-sm outline-none shadow-inner"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCreateNewClientAndAdvance}
                    className="w-full py-5 bg-[#FF2D55] hover:bg-[#D11D40] text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-red-900/40 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-3"
                  >
                    <span>CADASTRAR CLIENTE E AVANÇAR PARA OS ITENS</span>
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* MODO CLIENTES CADASTRADOS (PESQUISA + ROLAGEM DO BANCO REAL) */}
            {clientMode === 'EXISTING' && (
              <div className="glass-card p-5 sm:p-7 rounded-[2.5rem] border border-blue-500/20 space-y-5 shadow-2xl relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black italic uppercase tracking-wider text-white flex items-center gap-2">
                        <span>PESQUISAR OU ESCOLHER CLIENTE DO BANCO</span>
                      </h3>
                      <p className="text-[10px] text-zinc-400">
                        {clients.length} clientes carregados do banco de dados da oficina
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleQuickBalcao}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                      title="Preencher como Cliente Balcão rápido"
                    >
                      <span>👤 BALCÃO</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickNewClient}
                      className="px-3 py-2 bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus size={13} />
                      <span>+ NOVO</span>
                    </button>
                  </div>
                </div>

                {/* BARRA DE PESQUISA INTELIGENTE DE CLIENTES */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="🔍 Digite para pesquisar cliente por nome, telefone ou placa..."
                      className="w-full bg-black/90 border-2 border-blue-500/30 focus:border-blue-400 rounded-2xl py-3.5 pl-11 pr-10 text-white font-bold text-xs sm:text-sm placeholder:text-zinc-500 outline-none shadow-inner"
                    />
                    {clientSearch && (
                      <button
                        type="button"
                        onClick={() => setClientSearch('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown de Resultados da Pesquisa de Clientes */}
                  {clientSearch.trim().length > 0 && (
                    <div className="bg-zinc-950 border border-blue-500/40 rounded-2xl p-2 max-h-60 overflow-y-auto space-y-1 shadow-2xl z-20">
                      <div className="px-3 py-1 text-[9px] font-black uppercase tracking-wider text-blue-400 flex justify-between">
                        <span>Resultados no banco de dados ({filteredClients.length})</span>
                        <span className="text-zinc-500">Clique para selecionar</span>
                      </div>
                      {filteredClients.length === 0 ? (
                        <div className="p-4 text-center text-xs text-zinc-500">
                          Nenhum cliente encontrado com "{clientSearch}". Clique em "+ NOVO" acima para cadastrar na hora!
                        </div>
                      ) : (
                        filteredClients.map(c => {
                          const cCars = vehicles.filter(v => v && (v.clientId === c.id || ((v as any).clientName && ((v as any).clientName || '').toUpperCase() === (c.name || '').toUpperCase())));
                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                handleSelectClient(c);
                                setClientSearch('');
                              }}
                              className="w-full text-left p-3 rounded-xl bg-zinc-900/90 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/40 flex items-center justify-between gap-3 transition-all cursor-pointer group"
                            >
                              <div>
                                <div className="font-black text-xs text-white uppercase group-hover:text-blue-300 transition-colors">
                                  {c.name}
                                </div>
                                <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                                  <span>📞 {c.phone || '(13) 99689-2958'}</span>
                                  {c.document && c.document !== '---' && <span>• CPF: {c.document}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {cCars.length > 0 ? (
                                  <span className="inline-block bg-blue-500/20 text-blue-300 font-mono text-[9px] px-2 py-0.5 rounded-md font-bold">
                                    🚗 {cCars[0].plate}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-zinc-500 italic">Sem carro</span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectClientAndAdvance(c);
                                  }}
                                  className="px-3 py-1.5 bg-[#FF2D55] hover:bg-[#D11D40] text-white font-black text-[9px] uppercase tracking-wider rounded-lg shadow-md flex items-center gap-1 group-hover:scale-105 transition-transform cursor-pointer"
                                >
                                  <span>Avançar</span>
                                  <ArrowRight size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* TODOS OS CLIENTES SALVOS ROLANDO (Banco de dados real da oficina) */}
                {clients.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[8.5px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                        <Users size={12} />
                        <span>CLIENTES SALVOS NO BANCO ({clients.length}) — ROLAGEM RÁPIDA:</span>
                      </span>
                      <span className="text-[8px] text-zinc-500 font-bold">1 TOQUE SELECIONA</span>
                    </div>
                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5 pt-0.5">
                      {clients.map(c => {
                        const isSelected = clientName === c.name || (selectedClient && selectedClient.id === c.id);
                        const cCar = vehicles.find(v => v && (v.clientId === c.id || ((v as any).clientName && ((v as any).clientName || '').toUpperCase() === (c.name || '').toUpperCase())));
                        return (
                          <div
                            key={c.id}
                            onClick={() => handleSelectClient(c)}
                            className={`p-3 rounded-2xl border flex flex-col justify-between text-left shrink-0 min-w-[170px] transition-all cursor-pointer ${isSelected ? 'bg-blue-600/35 border-blue-400 shadow-lg shadow-blue-900/30 ring-2 ring-blue-500/50' : 'bg-zinc-900/90 border-white/10 hover:border-blue-400/50 hover:bg-zinc-800'}`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-black text-white uppercase truncate max-w-[125px]">{c.name}</span>
                                {isSelected && <Check size={12} className="text-blue-400 shrink-0" />}
                              </div>
                              <span className="text-[9px] text-zinc-400 mt-0.5 font-mono block truncate">{c.phone || '(13) 99689-2958'}</span>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between gap-1">
                              {cCar ? (
                                <span className="text-[8.5px] text-blue-300 font-mono bg-black/50 px-1.5 py-0.5 rounded self-start border border-blue-500/20 truncate max-w-[90px]">
                                  🚗 {cCar.plate}
                                </span>
                              ) : (
                                <span className="text-[8px] text-zinc-600 italic">Sem carro</span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectClientAndAdvance(c);
                                }}
                                className="px-2 py-1 bg-[#FF2D55] hover:bg-[#D11D40] text-white font-black text-[8px] uppercase tracking-wider rounded-md shadow flex items-center gap-0.5 active:scale-95 cursor-pointer"
                                title="Selecionar e avançar direto para os Itens"
                              >
                                <span>Avançar</span>
                                <ArrowRight size={8} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Banner de Cliente Ativo Selecionado com Botão de Avanço Rápido */}
                {clientName && (
                  <div className="p-4 bg-blue-500/10 border-2 border-blue-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={22} className="text-blue-400 shrink-0" />
                      <div>
                        <span className="text-[9px] font-black uppercase text-blue-300 tracking-wider block">CLIENTE SELECIONADO:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white uppercase">{clientName}</span>
                          <span className="text-xs text-zinc-400 font-mono">({clientPhone})</span>
                        </div>
                        {vehiclePlate && (
                          <span className="text-[10px] text-blue-300 font-mono mt-0.5 block">
                            🚗 Veículo: {vehiclePlate} • {vehicleModel || 'Diversos'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleAdvanceToItems}
                      className="px-4 py-3 bg-[#FF2D55] hover:bg-[#D11D40] text-white rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-red-900/40 cursor-pointer shrink-0"
                    >
                      <span>Avançar para Itens</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                )}

                {/* Campos Manuais Editáveis do Cliente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-300 flex items-center justify-between">
                      <span>NOME DO CLIENTE *</span>
                      <span className="text-[8px] text-zinc-500">Editável</span>
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value.toUpperCase())}
                      placeholder="EX: CLIENTE OU BALCÃO"
                      className="w-full bg-black/80 border border-white/15 focus:border-blue-400 rounded-2xl p-3.5 text-white font-black text-xs sm:text-sm uppercase outline-none tracking-wider shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                      <Phone size={12} />
                      <span>WHATSAPP / TELEFONE *</span>
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
              </div>
            )}

            {/* CARD 2: VEÍCULO / CARRO (DIRETAMENTE ABAIXO DO CLIENTE!) */}
            <div className="glass-card p-5 sm:p-7 rounded-[2.5rem] border border-[#FF2D55]/30 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF2D55]/15 border border-[#FF2D55]/30 text-[#FF2D55] flex items-center justify-center shrink-0">
                    <Car size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black italic uppercase tracking-wider text-white flex items-center gap-2">
                      <span>VEÍCULO / CARRO</span>
                      <span className="text-[8px] bg-[#FF2D55]/20 text-[#FF2D55] px-2 py-0.5 rounded-full font-bold">AUTOMÁTICO</span>
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      {clientVehicles.length > 0 
                        ? 'Carro vinculado ao cliente carregado automaticamente' 
                        : 'Digite a placa ou escolha um carro da oficina'}
                    </p>
                  </div>
                </div>

                {/* Ação rápida sem veículo */}
                <button
                  type="button"
                  onClick={handleQuickSemVeiculo}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span>🚫 SEM VEÍCULO</span>
                </button>
              </div>

              {/* Se o cliente selecionado tiver carros cadastrados, mostrar botões de seleção rápida */}
              {clientVehicles.length > 0 && (
                <div className="p-3 bg-[#FF2D55]/10 border border-[#FF2D55]/30 rounded-2xl space-y-2">
                  <span className="text-[9px] font-black uppercase text-[#FF2D55] tracking-wider block">
                    🚗 CARROS VINCULADOS A ESTE CLIENTE ({clientVehicles.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {clientVehicles.map(cv => {
                      const isCarSelected = vehiclePlate === cv.plate;
                      return (
                        <button
                          key={cv.id}
                          type="button"
                          onClick={() => handleSelectVehicle(cv)}
                          className={`px-3 py-2 rounded-xl text-left border flex items-center gap-2 transition-all cursor-pointer ${isCarSelected ? 'bg-[#FF2D55] text-white border-white shadow-lg' : 'bg-black/60 text-zinc-300 border-white/15 hover:border-white/40'}`}
                        >
                          <span className="font-mono font-black text-xs">{cv.plate}</span>
                          <span className="text-[10px] opacity-80 truncate max-w-[150px]">{cv.model}</span>
                          {isCarSelected && <Check size={14} className="text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                    <span>KM ATUAL NESTA VISITA</span>
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
                      OU CLIQUE EM OUTRO VEÍCULO DA OFICINA:
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
                      .slice(0, 30)
                      .map(v => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleSelectVehicle(v)}
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

            {/* BOTÃO PRINCIPAL: AVANÇAR PARA OS ITENS */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAdvanceToItems}
                className="w-full py-5 bg-[#FF2D55] hover:bg-[#D11D40] text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-red-900/40 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-3"
              >
                <span>AVANÇAR PARA OS ITENS</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 2: ITENS & SERVIÇOS (TELA DEDICADA E LIMPA)        */}
        {/* ======================================================== */}
        {step === 'ITENS' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Stepper Progress Bar */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 p-2 bg-zinc-950/80 border border-white/10 rounded-2xl">
              <button
                type="button"
                onClick={() => setStep('DADOS')}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                <Check size={12} className="text-emerald-400" />
                <span>1. Cliente & Veículo</span>
              </button>
              <ArrowRight size={14} className="text-zinc-600" />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FF2D55] text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md">
                <span>2</span>
                <span>Itens & Serviços</span>
              </div>
            </div>

            {/* Barra de Resumo do Cliente Selecionado e Botão Voltar */}
            <div className="bg-zinc-950/90 border border-white/10 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Car size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white uppercase">{clientName || 'CLIENTE BALCÃO'}</span>
                    <span className="text-xs text-zinc-400 font-mono">({clientPhone})</span>
                  </div>
                  <div className="text-[11px] text-zinc-300 font-mono flex items-center gap-2 mt-0.5">
                    <span className="text-[#FF2D55] font-black">🚗 {vehiclePlate || 'SEM PLACA'}</span>
                    <span>•</span>
                    <span className="text-zinc-300">{vehicleModel || 'VEÍCULO DIVERSOS'}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">⚡ {vehicleKm || '0'} KM</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('DADOS');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
              >
                <ChevronLeft size={14} />
                <span>Alterar Cliente / Carro</span>
              </button>
            </div>

            {/* Modal de Peças do Estoque */}
            {showPartSearch && (
              <div className="bg-zinc-900 p-5 rounded-2xl border border-[#FF2D55]/40 space-y-3 animate-in zoom-in duration-200 shadow-2xl">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-black italic uppercase tracking-wider text-white">
                    ITENS & SERVIÇOS DA NOTA ({items.length})
                  </h3>
                  <p className="text-[10px] text-zinc-400">Digite a descrição, quantidade e o valor unitário</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPartSearch(true)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 rounded-xl font-black uppercase text-[9px] tracking-wider flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                  >
                    <Package size={12} />
                    <span>Estoque</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePurgeBlankBoxes}
                    className="px-2.5 py-1.5 text-[9px] font-bold uppercase text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Remove linhas sem descrição"
                  >
                    🧹 Limpar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 bg-[#FF2D55] text-white rounded-xl font-black uppercase text-[9px] tracking-wider flex items-center gap-1 active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>+ Item</span>
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

              {/* BOTÕES DE AÇÃO: CONCLUIR E VER NOTA OU SALVAR E IR PRO HISTÓRICO */}
              <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleFinalize(false)}
                  className="w-full bg-[#FF2D55] hover:bg-[#D11D40] text-white py-4 sm:py-5 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-wider active:scale-98 transition-all cursor-pointer shadow-xl shadow-red-900/40 flex items-center justify-center gap-2.5"
                >
                  <FileText size={18} />
                  <span>CONCLUIR E GERAR NOTA FISCAL</span>
                  <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFinalize(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 sm:py-5 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-wider active:scale-98 transition-all cursor-pointer shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2.5"
                >
                  <Check size={18} />
                  <span>SALVAR E IR PRO HISTÓRICO (OS) ➔</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: NOTA FINAL GERADA (PREVIEW, IMPRIMIR, ENVIAR)    */}
        {/* ======================================================== */}
        {step === 'FINAL' && finalOs && (
          <div className="space-y-6 animate-in fade-in duration-500 flex flex-col items-center w-full">
            
            {/* Banner de Sucesso */}
            <div className="w-full p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-emerald-400">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="shrink-0 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Nota Nº {finalOs.osNumber} Concluída com Sucesso!
                  </h4>
                  <p className="text-[10px] text-emerald-300 font-mono">
                    {finalOs.clientName} • Placa: {finalOs.vehiclePlate} ({finalOs.vehicleModel})
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

            {/* Ações Imediatas no Topo (WhatsApp, Baixar, Imprimir, Nova) */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={shareWhatsApp}
                className="p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all cursor-pointer active:scale-95"
              >
                <Share2 size={16} />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={downloadImage}
                className="p-3.5 bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
              >
                <Download size={16} />
                <span>Baixar Imagem</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="p-3.5 bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
              >
                <Printer size={16} />
                <span>Imprimir</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-3.5 bg-[#FF2D55] hover:bg-[#D11D40] text-white rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all cursor-pointer active:scale-95"
              >
                <Plus size={16} />
                <span>Nova Nota</span>
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

            {/* Ações da Nota no Rodapé */}
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
            className="flex-1 py-3.5 px-4 bg-[#FF2D55] hover:bg-[#D11D40] text-white rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-red-900/40 cursor-pointer"
          >
            <FileText size={16} />
            <span>Concluir Nota</span>
          </button>
        </div>
      )}

      {step === 'FINAL' && finalOs && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-black/95 backdrop-blur-lg border-t border-white/10 flex items-center justify-between gap-2 z-50 md:hidden shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
          <button
            type="button"
            onClick={shareWhatsApp}
            className="flex-1 py-3 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-lg shadow-emerald-900/40 cursor-pointer"
          >
            <Share2 size={16} />
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={downloadImage}
            className="flex-1 py-3 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-black uppercase text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-lg cursor-pointer border border-white/10"
          >
            <Download size={16} />
            <span>Baixar Foto</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="py-3 px-3.5 bg-[#FF2D55] hover:bg-[#D11D40] text-white rounded-xl font-black uppercase text-xs flex items-center justify-center active:scale-95 shadow-lg cursor-pointer"
            title="Fazer Nova Nota"
          >
            <Plus size={16} />
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
