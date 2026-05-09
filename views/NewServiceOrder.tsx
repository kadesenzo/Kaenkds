
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Wrench, ChevronLeft, X,
  User, Search, Loader2, Check, ImageIcon, Car, Info, Download, Phone, Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client, Vehicle, OSItem, OSStatus, ServiceOrder, PaymentStatus, UserSession, Part } from '../types';
import html2canvas from 'html2canvas';
import Invoice from '../components/Invoice';

const NewServiceOrder: React.FC<{ session?: UserSession; syncData?: (key: string, data: any) => Promise<void> }> = ({ session, syncData }) => {
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState<'CLIENTE' | 'VEICULO' | 'ITENS' | 'FINAL'>('CLIENTE');
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

  useEffect(() => {
    if (session) {
      const savedClients = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_clients`) || '[]');
      const savedVehicles = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_vehicles`) || '[]');
      const savedParts = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_parts`) || '[]');
      setClients(savedClients);
      setVehicles(savedVehicles);
      setParts(savedParts);
    }
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
      const currentOrders = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
      await syncData('orders', [...currentOrders, os]);
      setFinalOs(os);
      setStep('FINAL');
    } catch (error) {
      alert("ERRO NO PROCESSAMENTO.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateQuickClient = async () => {
    if (!quickClient.name || !quickClient.phone || !session || !syncData) return;
    const newC: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: quickClient.name.toUpperCase(),
      phone: quickClient.phone,
      document: '---',
      observations: 'CADASTRADO VIA NOTA',
      createdAt: new Date().toISOString()
    };
    const updated = [...clients, newC];
    setClients(updated);
    await syncData('clients', updated);
    setSelectedClient(newC);
    setShowQuickClient(false);
    setStep('VEICULO');
  };

  const handleCreateQuickVehicle = async () => {
    if (!selectedClient || !quickVehicle.model || !quickVehicle.plate || !session || !syncData) return;
    const newV: Vehicle = {
      id: Math.random().toString(36).substr(2, 9),
      clientId: selectedClient.id,
      model: quickVehicle.model.toUpperCase(),
      plate: quickVehicle.plate.toUpperCase(),
      brand: '---',
      year: '---',
      km: parseInt(quickVehicle.km) || 0
    };
    const updated = [...vehicles, newV];
    setVehicles(updated);
    await syncData('vehicles', updated);
    setSelectedVehicle(newV);
    setShowQuickVehicle(false);
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
          <div className="w-full max-w-2xl space-y-10 animate-in slide-in-from-bottom-6 duration-700 flex flex-col items-center">
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
                  <button key={v.id} onClick={() => { setSelectedVehicle(v); setStep('ITENS'); }} className="p-10 glass-card border-white/5 rounded-ios flex items-center justify-between hover:border-[#FF2D55]/50 transition-all group shadow-2xl">
                    <div className="text-left">
                      <p className="text-3xl font-black italic uppercase text-white tracking-widest leading-none">{v.plate}</p>
                      <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-[0.4em] mt-3">{v.model}</p>
                    </div>
                    <Car size={40} className="text-zinc-800" />
                  </button>
                ))}
                <button onClick={() => setShowQuickVehicle(true)} className="w-full p-8 border-2 border-dashed border-white/10 rounded-ios flex items-center justify-center gap-4 hover:bg-white/5 transition-all group active:scale-95">
                  <Plus className="text-[#FF2D55]" size={32} />
                  <span className="text-[12px] font-black uppercase tracking-widest italic text-zinc-500 group-hover:text-white transition-all">CADASTRAR NOVO VEÍCULO</span>
                </button>
              </div>
            ) : (
              <div className="w-full glass-card p-10 rounded-ios border-white/10 space-y-8 shadow-2xl animate-in zoom-in duration-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">VEÍCULO PARA {selectedClient.name}</h3>
                  <button onClick={() => setShowQuickVehicle(false)} className="text-zinc-500 hover:text-white"><X/></button>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">PLACA</label>
                    <input type="text" value={quickVehicle.plate} onChange={(e) => setQuickVehicle({...quickVehicle, plate: e.target.value})} className="w-full bg-black/50 border border-white/10 p-6 rounded-2xl text-white font-black outline-none focus:border-[#FF2D55] uppercase" placeholder="ABC-1234"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">MODELO / ANO</label>
                    <input type="text" value={quickVehicle.model} onChange={(e) => setQuickVehicle({...quickVehicle, model: e.target.value})} className="w-full bg-black/50 border border-white/10 p-6 rounded-2xl text-white font-black outline-none focus:border-[#FF2D55] uppercase" placeholder="EX: FIAT PALIO 2014"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">KM ATUAL</label>
                    <input type="number" value={quickVehicle.km} onChange={(e) => setQuickVehicle({...quickVehicle, km: e.target.value})} className="w-full bg-black/50 border border-white/10 p-6 rounded-2xl text-white font-black outline-none focus:border-[#FF2D55]" placeholder="125000"/>
                  </div>
                  <button onClick={handleCreateQuickVehicle} className="w-full bg-white text-black py-6 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">VINCULAR E CONTINUAR</button>
                </div>
              </div>
            )}
          </div>
        )}
        {step === 'ITENS' && selectedVehicle && (
          <div className="w-full max-w-3xl space-y-12 animate-in slide-in-from-right-6 duration-700 flex flex-col items-center">
            <div className="glass-card p-10 rounded-ios border-white/10 space-y-12 w-full shadow-2xl">
               <div className="flex items-center justify-between border-b border-white/5 pb-8">
                 <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-[#FF2D55]/10 rounded-xl flex items-center justify-center text-[#FF2D55]"><Car size={24}/></div>
                    <div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">{selectedVehicle.plate}</h3>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] mt-1">{selectedVehicle.model}</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                   <button onClick={() => setShowPartSearch(true)} className="px-6 py-4 bg-zinc-900 border border-white/10 text-zinc-400 rounded-full font-black uppercase text-[10px] tracking-widest hover:text-white transition-all italic">BUSCAR PEÇA</button>
                   <button onClick={() => setItems([...items, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unitPrice: 0, type: 'SERVICE' }])} className="px-8 py-4 bg-[#FF2D55] text-white rounded-full font-black uppercase text-[10px] tracking-widest active:scale-90 transition-all italic">NOVO ITEM</button>
                 </div>
               </div>

               {showPartSearch && (
                 <div className="bg-zinc-900 p-8 rounded-[2rem] border border-[#FF2D55]/30 space-y-6 animate-in zoom-in duration-300">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FF2D55]">ESTOQUE DE PEÇAS</h4>
                      <button onClick={() => setShowPartSearch(false)}><X size={20}/></button>
                    </div>
                    <input type="text" value={partSearch} onChange={(e) => setPartSearch(e.target.value)} placeholder="NOME DA PEÇA..." className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white font-black text-xs outline-none"/>
                    <div className="grid grid-cols-1 gap-4 max-h-[200px] overflow-y-auto pr-2">
                       {parts.filter(p => p.name.toLowerCase().includes(partSearch.toLowerCase())).map(p => (
                         <button key={p.id} onClick={() => handleAddPartFromInventory(p)} className="flex items-center justify-between p-4 bg-black/40 rounded-xl hover:bg-black transition-all border border-transparent hover:border-white/10">
                            <span className="text-xs font-black uppercase italic">{p.name}</span>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-zinc-600">QTD: {p.stock}</p>
                              <p className="text-[10px] font-black text-[#FF2D55]">R$ {p.salePrice.toLocaleString('pt-BR')}</p>
                            </div>
                         </button>
                       ))}
                    </div>
                 </div>
               )}

               <div className="space-y-6">
                 {items.map(item => (
                   <div key={item.id} className="bg-black/50 p-6 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 shadow-inner">
                     <input type="text" placeholder="DESCRIÇÃO..." value={item.description} onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, description: e.target.value.toUpperCase()} : i))} className="w-full bg-transparent text-[14px] font-black outline-none uppercase italic text-white tracking-widest"/>
                     <div className="flex gap-6">
                        <input type="number" placeholder="QTD" value={item.quantity || ''} onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, quantity: parseFloat(e.target.value) || 0} : i))} className="w-20 bg-white/5 border border-white/5 p-5 rounded-2xl text-center text-[16px] font-black text-white outline-none"/>
                        <input type="number" placeholder="R$ UNIT" value={item.unitPrice || ''} onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, unitPrice: parseFloat(e.target.value) || 0} : i))} className="flex-1 bg-white/5 border border-white/5 p-5 rounded-2xl text-[16px] font-black text-white outline-none"/>
                        <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="p-5 text-zinc-800 hover:text-[#FF2D55] active:scale-90 transition-all"><Trash2 size={24}/></button>
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
    </div>
  );
};

export default NewServiceOrder;
