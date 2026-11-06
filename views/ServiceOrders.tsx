
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Trash2, X, Eye, 
  Printer, ImageIcon, Wrench, Calendar, CreditCard, ChevronRight, Car, Camera, Filter, Plus, CalendarDays, Pencil
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ServiceOrder, UserSession, OSStatus, PaymentStatus } from '../types';
import html2canvas from 'html2canvas';
import Invoice from '../components/Invoice';
import AntesEDepoisModal from '../components/AntesEDepoisModal';
import EditOrderModal from '../components/EditOrderModal';
import { getWorkshopData, saveWorkshopData } from '../src/lib/storage';

const ServiceOrders: React.FC<{ role?: string; session?: UserSession; syncData?: (key: string, data: any) => Promise<void> }> = ({ role = 'Dono', session, syncData }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [antesDepoisOs, setAntesDepoisOs] = useState<ServiceOrder | null>(null);
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const invoiceRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    const tenant = session?.username || 'rafael';
    const saved = getWorkshopData<ServiceOrder[]>('orders', tenant, []);
    setOrders(saved);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('kaen_storage_updated', loadData);
    return () => window.removeEventListener('kaen_storage_updated', loadData);
  }, [session]);

  const handleDelete = async (id: string) => {
    if (role !== 'Dono') return;
    if (!confirm("CONFIRMA EXCLUSÃO?")) return;
    const tenant = session?.username || 'rafael';
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    await saveWorkshopData('orders', updated, tenant);
    if (syncData) await syncData('orders', updated);
  };

  const downloadImage = async () => {
    const target = document.getElementById('render-target-hidden');
    if (!target || !selectedOrder || !invoiceRef.current) return;
    
    // Create a temporary clone for rendering without scaling artifacts
    const clone = invoiceRef.current.cloneNode(true) as HTMLDivElement;
    clone.style.width = '794px';
    clone.style.height = 'auto'; // Let it grow
    clone.style.position = 'static';
    
    target.innerHTML = '';
    target.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, { 
        scale: 2.5, 
        backgroundColor: '#FFFFFF', 
        useCORS: true, 
        width: 794, 
        height: clone.offsetHeight // Capture full content
      });
      const link = document.createElement('a');
      link.download = `KAEN_MECANICA_NOTA_${selectedOrder.osNumber}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error(err);
      alert("Houve um erro ao gerar a imagem da nota.");
    } finally {
      target.innerHTML = '';
    }
  };

  const filtered = orders.filter(o => {
    const matchesSearch = 
      o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.vehiclePlate.includes(searchTerm.toUpperCase()) || 
      o.osNumber.includes(searchTerm) ||
      o.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (dateFilter === 'ALL') return true;

    const osDate = new Date(o.createdAt);
    const now = new Date();

    if (dateFilter === 'TODAY') {
      return osDate.toDateString() === now.toDateString();
    }

    if (dateFilter === 'WEEK') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return osDate >= oneWeekAgo && osDate <= now;
    }

    if (dateFilter === 'MONTH') {
      return osDate.getMonth() === now.getMonth() && osDate.getFullYear() === now.getFullYear();
    }

    if (dateFilter === 'CUSTOM') {
      if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        if (osDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59');
        if (osDate > end) return false;
      }
      return true;
    }

    return true;
  }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="animate-in fade-in duration-700 space-y-8 p-4 sm:p-6 md:p-12 pb-40 max-w-[1200px] mx-auto flex flex-col items-center w-full">
       <div className="flex flex-col sm:flex-row items-center justify-between w-full mt-4 gap-4">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-white italic uppercase tracking-tighter leading-tight text-center sm:text-left">
            HISTÓRICO <span className="text-[#FF2D55]">GERAL</span>
          </h1>
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest text-center sm:text-left">
            {filtered.length} {filtered.length === 1 ? 'ordem de serviço encontrada' : 'ordens de serviço encontradas'}
          </p>
        </div>
        <button
          onClick={() => navigate('/orders/new')}
          className="px-6 py-3.5 bg-[#FF2D55] hover:bg-[#D11D40] text-white rounded-2xl font-black uppercase text-xs tracking-wider flex items-center gap-2 shadow-xl shadow-red-900/30 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Fazer Nova Nota</span>
        </button>
      </div>

      {/* Busca & Filtro de Data */}
      <div className="w-full space-y-4 max-w-4xl">
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 flex items-center shadow-xl">
          <Search className="ml-4 text-zinc-600" size={18} />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="BUSCAR POR PLACA, CARRO, CLIENTE OU NÚMERO DE OS..." 
            className="w-full bg-transparent border-none py-3 px-4 text-white font-bold text-xs outline-none uppercase tracking-wider placeholder-zinc-700" 
          />
        </div>

        {/* Barra de Filtro de Data */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-zinc-950/70 border border-white/5 rounded-2xl">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-black uppercase tracking-wider mr-2">
            <CalendarDays size={14} className="text-[#FF2D55]" />
            <span>Filtrar Data:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Todas' },
              { id: 'TODAY', label: 'Hoje' },
              { id: 'WEEK', label: 'Esta Semana' },
              { id: 'MONTH', label: 'Este Mês' },
              { id: 'CUSTOM', label: 'Período' },
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setDateFilter(btn.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  dateFilter === btn.id
                    ? 'bg-white text-black font-black shadow-md'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-white/5'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {dateFilter === 'CUSTOM' && (
            <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-zinc-500 font-bold uppercase">De:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-black border border-white/10 rounded-lg px-2.5 py-1 text-white text-[11px] font-bold outline-none"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-zinc-500 font-bold uppercase">Até:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-black border border-white/10 rounded-lg px-2.5 py-1 text-white text-[11px] font-bold outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {filtered.map(os => (
          <div key={os.id} className="glass-card rounded-[3rem] p-8 hover:border-[#FF2D55]/50 transition-all group relative overflow-hidden flex flex-col justify-between h-[420px]">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-zinc-500 tracking-[0.4em] uppercase italic">OS #{os.osNumber}</span>
                <span className="text-[10px] font-black text-zinc-500 uppercase italic">{new Date(os.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white/5 rounded-2xl text-zinc-500 group-hover:text-[#FF2D55] transition-colors">
                  <Car size={22} className="group-hover:scale-110 transition-transform" />
                </div>
                <div>
                   <p className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{os.vehiclePlate}</p>
                   <p className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest mt-1.5">{os.vehicleModel}</p>
                </div>
              </div>

              {/* Status do Carro → GRANDE & DESTACADO */}
              <div className="mb-6">
                <span className="text-[8px] font-black text-zinc-650 uppercase tracking-[0.2em] block mb-2 italic">STATUS DO CARRO</span>
                <div className={`py-4 px-6 rounded-2xl text-center text-[11px] font-black uppercase tracking-[0.25em] italic border shadow-inner
                  ${os.status === OSStatus.EM_ANDAMENTO ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    os.status === OSStatus.FINALIZADO ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_5px_15px_rgba(16,185,129,0.1)]' :
                    os.status === OSStatus.ORCAMENTO ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                    'bg-zinc-800/50 text-zinc-500 border-zinc-700/30'}`}>
                  ● {os.status || 'Em Execução'}
                </div>
              </div>

              {/* Nome do Cliente → MÉDIO */}
              <div className="space-y-1">
                <span className="text-[8px] font-black text-zinc-650 uppercase tracking-[0.2em] block italic">PROPRIETÁRIO</span>
                <h3 className="text-lg font-black text-zinc-200 uppercase italic tracking-normal truncate">{os.clientName}</h3>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <div>
                 <p className="text-[8px] font-black text-zinc-650 uppercase italic mb-1.5">TAXA TOTAL DE MANUTENÇÃO</p>
                 {/* Valor → menor e elegante */}
                 <p className="text-sm font-semibold text-zinc-400 tracking-tight">R$ {os.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingOrder(os);
                  }}
                  className="p-4 bg-white/5 text-amber-400 hover:text-black hover:bg-amber-400 rounded-2xl border border-white/10 hover:border-amber-400/40 transition-all shadow-xl active:scale-90 cursor-pointer"
                  title="Editar Dados desta Nota (Telefone, KM, Itens, etc.)"
                >
                  <Pencil size={20}/>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setAntesDepoisOs(os);
                  }}
                  className="p-4 bg-white/5 text-zinc-400 hover:text-emerald-400 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-all shadow-xl active:scale-90 cursor-pointer"
                  title="Vistoria e Fotos Antes & Depois"
                >
                  <Camera size={20}/>
                </button>
                <button onClick={() => setSelectedOrder(os)} className="p-4 bg-white/5 text-[#FF2D55] rounded-2xl border border-white/10 hover:bg-[#FF2D55] hover:text-white transition-all shadow-xl active:scale-90" title="Visualizar Nota"><Eye size={20}/></button>
                {role === 'Dono' && <button onClick={() => handleDelete(os.id)} className="p-4 bg-white/5 text-zinc-650 hover:text-[#FF2D55] rounded-2xl border border-white/10 transition-all active:scale-90" title="Excluir Nota"><Trash2 size={20}/></button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-3xl overflow-y-auto no-scrollbar animate-in fade-in duration-500">
          <button 
            onClick={() => setSelectedOrder(null)} 
            className="fixed top-4 right-4 sm:top-8 sm:right-8 text-white bg-white/15 p-3 sm:p-4 rounded-full hover:bg-[#FF2D55] transition-all z-[220] border border-white/10 active:scale-90 cursor-pointer shadow-2xl"
            aria-label="Fechar"
          >
            <X size={24}/>
          </button>

          <div className="w-full max-w-[850px] flex flex-col items-center gap-6 sm:gap-10 my-8 sm:my-16 px-2 sm:px-4">
             <div className="invoice-preview-wrapper">
               <div className="invoice-container-scaled">
                 <div ref={invoiceRef}>
                   <Invoice os={selectedOrder} />
                 </div>
               </div>
             </div>

              <div className="w-full max-w-[500px] flex flex-col gap-3 sm:gap-4 px-2 sm:px-4 pb-24">
                <button 
                  onClick={() => {
                    const toEdit = selectedOrder;
                    setSelectedOrder(null);
                    setEditingOrder(toEdit);
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-4 sm:py-5 rounded-ios font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 italic transition-all cursor-pointer"
                >
                  <Pencil size={20}/> EDITAR DADOS DA NOTA (TELEFONE, KM & ITENS)
                </button>
                <button 
                  onClick={() => setAntesDepoisOs(selectedOrder)}
                  className="w-full bg-[#FF2D55] hover:bg-[#D11D40] text-white py-4 sm:py-5 rounded-ios font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 italic transition-all border border-[#FF2D55] cursor-pointer"
                >
                  <Camera size={20}/> VISTORIA FOTOGRÁFICA (ANTES & DEPOIS)
                </button>
                <button 
                  onClick={downloadImage} 
                  className="w-full bg-white hover:bg-zinc-200 text-black py-4 sm:py-5 rounded-ios font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 italic transition-all cursor-pointer"
                >
                   <ImageIcon size={20}/> SALVAR IMAGEM (WHATSAPP)
                </button>
                <button 
                  onClick={() => window.print()} 
                  className="glass-card py-4 sm:py-5 rounded-ios font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-white/5 italic transition-all border-white/10 text-white cursor-pointer"
                >
                   <Printer size={20}/> IMPRIMIR EM A4
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Nota */}
      {editingOrder && (
        <EditOrderModal
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          order={editingOrder}
          session={session}
          syncData={syncData}
          onOrderUpdated={(updated) => {
            loadData();
            if (selectedOrder && selectedOrder.id === updated.id) {
              setSelectedOrder(updated);
            }
          }}
        />
      )}

      {/* Modal Antes e Depois */}
      {antesDepoisOs && (
        <AntesEDepoisModal
          isOpen={!!antesDepoisOs}
          onClose={() => setAntesDepoisOs(null)}
          os={antesDepoisOs}
          session={session}
          syncData={syncData}
        />
      )}
    </div>
  );
};

export default ServiceOrders;
