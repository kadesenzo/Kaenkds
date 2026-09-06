import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, CheckCircle2, AlertTriangle, Camera, Search, Plus, 
  Car, Shield, Eye, Clock, UserCheck, ChevronRight, Fuel, ArrowRight
} from 'lucide-react';
import { ServiceOrder, UserSession } from '../types';
import PatioCheckinModal from '../components/PatioCheckinModal';
import AntesEDepoisModal from '../components/AntesEDepoisModal';

interface ChecklistsViewProps {
  session?: UserSession;
  syncData?: (key: string, data: any) => Promise<void>;
}

export const ChecklistsView: React.FC<ChecklistsViewProps> = ({ session, syncData }) => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedPhotosOs, setSelectedPhotosOs] = useState<ServiceOrder | null>(null);

  const tenant = session?.username || 'rafael';

  useEffect(() => {
    const loadData = () => {
      const savedOrders = localStorage.getItem(`kaenpro_${tenant}_orders`) || localStorage.getItem('kaenpro_rafael_orders');
      if (savedOrders) {
        try {
          setOrders(JSON.parse(savedOrders));
        } catch (e) {
          console.error(e);
        }
      }
    };

    loadData();
    window.addEventListener('kaen_storage_updated', loadData);
    return () => window.removeEventListener('kaen_storage_updated', loadData);
  }, [tenant]);

  const ordersWithChecklist = orders.filter(os => {
    const term = searchTerm.toLowerCase();
    const matches = 
      os.clientName?.toLowerCase().includes(term) ||
      os.vehiclePlate?.toLowerCase().includes(term) ||
      os.vehicleModel?.toLowerCase().includes(term) ||
      os.osNumber?.includes(term);
    return matches;
  });

  return (
    <div className="w-full max-w-[1200px] space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-zinc-950/80 border border-white/5 rounded-3xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
            <ClipboardCheck size={16} />
            <span>Controle Técnico & Segurança Jurídica</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1 italic">
            Checklists Digitais de Veículos
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Vistorias de entrada com fotos, nível de combustível, avarias externas, interior e mecânica inicial.
          </p>
        </div>

        <button
          onClick={() => setShowCheckinModal(true)}
          className="px-5 py-3.5 bg-[#FF2D55] hover:bg-[#ff1744] text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#FF2D55]/30 transition-all duration-200 active:scale-95"
        >
          <Plus size={16} />
          <span>Novo Check-in de Pátio</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-950/80 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Vistorias Realizadas</span>
            <span className="text-xl font-black text-white">{orders.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400">
            <Car size={20} />
          </div>
        </div>

        <div className="p-4 bg-zinc-950/80 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 block">Com Fotos Anexadas</span>
            <span className="text-xl font-black text-emerald-400">
              {orders.filter(o => (o.proofPhotos && o.proofPhotos.length > 0) || (o.checklist?.proofPhotos && o.checklist.proofPhotos.length > 0)).length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Camera size={20} />
          </div>
        </div>

        <div className="p-4 bg-zinc-950/80 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-[#FF2D55] block">Proteção Jurídica Ativa</span>
            <span className="text-sm font-black text-zinc-200">100% dos Veículos</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FF2D55]/10 flex items-center justify-center text-[#FF2D55]">
            <Shield size={20} />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar checklist por placa, cliente ou modelo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-white/5 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Checklists List */}
      <div className="space-y-4">
        {ordersWithChecklist.length === 0 ? (
          <div className="p-12 text-center bg-zinc-950/40 border border-dashed border-white/10 rounded-3xl space-y-3">
            <ClipboardCheck size={32} className="mx-auto text-zinc-600" />
            <p className="text-sm font-bold text-zinc-400">Nenhum checklist encontrado</p>
            <p className="text-xs text-zinc-600">Clique em "Novo Check-in de Pátio" para registrar a primeira vistoria completa.</p>
          </div>
        ) : (
          ordersWithChecklist.map(os => {
            const checklist = os.checklist;
            const photoCount = (os.proofPhotos?.length || 0) + (checklist?.proofPhotos?.length || 0) + (checklist?.photos?.length || 0);

            return (
              <div
                key={os.id}
                className="p-5 bg-zinc-950/70 border border-white/5 rounded-3xl space-y-4 hover:border-white/10 transition-all duration-300"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-[#FF2D55] bg-[#FF2D55]/10 px-2.5 py-1 rounded-xl">
                      {os.vehiclePlate}
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase">{os.vehicleModel}</h3>
                      <p className="text-[10px] text-zinc-400">Cliente: <span className="text-zinc-200 font-bold">{os.clientName}</span> • OS #{os.osNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPhotosOs(os)}
                      className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                      <Camera size={14} className="text-[#FF2D55]" />
                      <span>Ver Fotos ({photoCount})</span>
                    </button>
                  </div>
                </div>

                {/* Inspection Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Exterior */}
                  <div className="p-3 bg-black/50 border border-white/5 rounded-2xl space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block">
                      1. Exterior & Lataria
                    </span>
                    <div className="space-y-1 text-zinc-400 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span>Faróis e Lanternas</span>
                        <span className="text-emerald-400 font-bold">✓ Vistoriado</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Pneus e Rodas</span>
                        <span className="text-emerald-400 font-bold">✓ Calibrado/Inspecionado</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Avarias Registradas</span>
                        <span className="text-zinc-300 font-bold">{checklist?.damages?.length || 0} marcas</span>
                      </div>
                    </div>
                  </div>

                  {/* Interior & Combustível */}
                  <div className="p-3 bg-black/50 border border-white/5 rounded-2xl space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-blue-400 block">
                      2. Interior & Marcadores
                    </span>
                    <div className="space-y-1 text-zinc-400 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span>Combustível</span>
                        <span className="text-zinc-200 font-bold flex items-center gap-1">
                          <Fuel size={12} className="text-amber-400" />
                          {checklist?.fuelLevel || '1/2 Tanque'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Odômetro na Entrada</span>
                        <span className="text-zinc-200 font-mono">{os.vehicleKm || '0'} KM</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Pertences / Painel</span>
                        <span className="text-emerald-400 font-bold">✓ Sem pendências</span>
                      </div>
                    </div>
                  </div>

                  {/* Mecânica Preliminar */}
                  <div className="p-3 bg-black/50 border border-white/5 rounded-2xl space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 block">
                      3. Mecânica Inicial
                    </span>
                    <div className="space-y-1 text-zinc-400 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span>Nível de Óleo / Fluídos</span>
                        <span className="text-emerald-400 font-bold">✓ Verificado</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Ruídos Relatados</span>
                        <span className="text-zinc-300 font-medium truncate max-w-[140px]">{os.problem || 'Nenhum'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Status Geral</span>
                        <span className="text-zinc-400 text-[10px]">{os.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {showCheckinModal && (
        <PatioCheckinModal
          isOpen={showCheckinModal}
          onClose={() => setShowCheckinModal(false)}
          session={session as any}
          syncData={syncData as any}
        />
      )}

      {selectedPhotosOs && (
        <AntesEDepoisModal
          isOpen={!!selectedPhotosOs}
          onClose={() => setSelectedPhotosOs(null)}
          os={selectedPhotosOs}
          session={session as any}
          syncData={syncData as any}
        />
      )}
    </div>
  );
};

export default ChecklistsView;
