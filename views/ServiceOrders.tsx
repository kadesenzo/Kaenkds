
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Trash2, X, Eye, 
  Printer, ImageIcon, Wrench, Calendar, CreditCard, ChevronRight, Car
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ServiceOrder, UserSession, OSStatus, PaymentStatus } from '../types';
import html2canvas from 'html2canvas';
import Invoice from '../components/Invoice';

const ServiceOrders: React.FC<{ role?: string; session?: UserSession; syncData?: (key: string, data: any) => Promise<void> }> = ({ role = 'Dono', session, syncData }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) {
      const load = () => {
        const saved = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
        setOrders(saved);
      };
      
      load();
      window.addEventListener('kaen_storage_updated', load);
      return () => window.removeEventListener('kaen_storage_updated', load);
    }
  }, [session]);

  const handleDelete = async (id: string) => {
    if (role !== 'Dono' || !session || !syncData) return;
    if (!confirm("CONFIRMA EXCLUSÃO?")) return;
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    await syncData('orders', updated);
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

  const filtered = orders.filter(o => 
    o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.vehiclePlate.includes(searchTerm.toUpperCase()) || 
    o.osNumber.includes(searchTerm) ||
    o.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="animate-in fade-in duration-700 space-y-12 p-6 md:p-12 pb-40 max-w-[1200px] mx-auto flex flex-col items-center w-full">
      <div className="flex flex-col items-center text-center gap-12 w-full mt-8">
        <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-[0.8] text-center">
          HISTÓRICO <span className="text-[#FF2D55]">GERAL</span>
        </h1>
      </div>

      <div className="w-full glass-card p-4 rounded-full flex items-center shadow-2xl border-white/10 max-w-4xl">
        <Search className="ml-8 text-zinc-700" size={24} />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="BUSCAR POR PLACA, CARRO OU CLIENTE..." className="w-full bg-transparent border-none py-6 px-8 text-white font-black text-xs outline-none uppercase tracking-[0.2em] placeholder-zinc-800" />
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
                <button onClick={() => setSelectedOrder(os)} className="p-4 bg-white/5 text-[#FF2D55] rounded-2xl border border-white/10 hover:bg-[#FF2D55] hover:text-white transition-all shadow-xl active:scale-90"><Eye size={20}/></button>
                {role === 'Dono' && <button onClick={() => handleDelete(os.id)} className="p-4 bg-white/5 text-zinc-650 hover:text-[#FF2D55] rounded-2xl border border-white/10 transition-all active:scale-90"><Trash2 size={20}/></button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-3xl overflow-y-auto no-scrollbar animate-in fade-in duration-500">
          <div className="w-full max-w-[850px] flex flex-col items-center gap-12 my-20 px-4">
             <button onClick={() => setSelectedOrder(null)} className="fixed top-10 right-10 text-white bg-white/10 p-5 rounded-full hover:bg-[#FF2D55] transition-all z-[210] border border-white/10 active:scale-90"><X size={32}/></button>
             
             <div className="invoice-preview-wrapper">
               <div className="invoice-container-scaled">
                 <div ref={invoiceRef}>
                   <Invoice os={selectedOrder} />
                 </div>
               </div>
             </div>

             <div className="w-full max-w-[500px] flex flex-col gap-4 px-4 pb-20">
                <button onClick={downloadImage} className="w-full bg-white text-black py-6 rounded-ios font-black uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-4 shadow-2xl active:scale-95 italic transition-all">
                   <ImageIcon size={24}/> SALVAR IMAGEM (WHATSAPP)
                </button>
                <button onClick={() => window.print()} className="glass-card py-6 rounded-ios font-black uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-white/5 italic transition-all border-white/10 text-white">
                   <Printer size={24}/> IMPRIMIR EM A4
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceOrders;
