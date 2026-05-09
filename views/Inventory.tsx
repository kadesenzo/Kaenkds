
import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  AlertCircle, 
  Trash2, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Check,
  RefreshCw,
  Box,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Part, UserSession } from '../types';

const Inventory: React.FC<{ session?: UserSession; syncData?: (key: string, data: any) => Promise<void> }> = ({ session, syncData }) => {
  const [parts, setParts] = useState<Part[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  
  const [newPart, setNewPart] = useState({
    name: '',
    sku: '',
    stock: 0,
    minStock: 0,
    salePrice: 0,
    costPrice: 0
  });

  useEffect(() => {
    if (session) {
      const saved = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_parts`) || '[]');
      setParts(saved);
    }
  }, [session]);

  const handleSave = async () => {
    if (!newPart.name || !session || !syncData) return;
    const part: Part = {
      ...newPart,
      id: Math.random().toString(36).substr(2, 9)
    };
    const updated = [...parts, part];
    setParts(updated);
    await syncData('parts', updated);
    setShowModal(false);
    setNewPart({ name: '', sku: '', stock: 0, minStock: 0, salePrice: 0, costPrice: 0 });
  };

  const handleDelete = async (id: string) => {
    if (!session || !syncData) return;
    if (confirm("Deseja remover permanentemente este item do catálogo?")) {
      const updated = parts.filter(p => p.id !== id);
      setParts(updated);
      await syncData('parts', updated);
    }
  };

  const handleQuickAdjust = async (id: string, currentStock: number) => {
    const amount = adjustments[id] || 0;
    if (amount === 0 || !session || !syncData) return;

    const newStock = currentStock + amount;
    if (newStock < 0) {
      alert("ERRO: O estoque não pode ficar negativo.");
      return;
    }

    const updated = parts.map(p => p.id === id ? { ...p, stock: newStock } : p);
    setParts(updated);
    await syncData('parts', updated);
    
    // Reset adjustment for this item
    const newAdjustments = { ...adjustments };
    delete newAdjustments[id];
    setAdjustments(newAdjustments);
  };

  const setItemAdjustment = (id: string, value: number) => {
    setAdjustments({ ...adjustments, [id]: value });
  };

  const filtered = parts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = parts.reduce((acc, curr) => acc + (curr.stock * curr.salePrice), 0);
  const criticalItems = parts.filter(p => p.stock <= p.minStock);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Estoque Ativo</h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
            <RefreshCw size={12} className="text-[#FF2D55]" /> Gestão de peças e insumos em tempo real
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#FF2D55] px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-[#D11D40] transition-all transform active:scale-95 shadow-xl shadow-red-900/20"
        >
          <Plus size={20} />
          Cadastrar Nova Peça
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Box size={100} />
          </div>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Total de SKUs</p>
          <p className="text-4xl font-black text-white">{parts.length}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertTriangle size={100} />
          </div>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Itens em Alerta</p>
          <p className={`text-4xl font-black ${criticalItems.length > 0 ? 'text-amber-500' : 'text-zinc-500'}`}>
            {criticalItems.length}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={100} />
          </div>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Patrimônio em Peças (Venda)</p>
          <p className="text-4xl font-black text-emerald-500">
            R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* INVENTORY TABLE */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-zinc-800 bg-zinc-950/50 flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou código SKU..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-14 pr-6 text-sm text-white outline-none focus:border-[#FF2D55] transition-all placeholder-zinc-700 font-medium" 
            />
          </div>
          <div className="flex gap-4">
             {criticalItems.length > 0 && (
               <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl text-amber-500 text-[10px] font-black uppercase">
                 <AlertCircle size={14} /> Reposição Necessária
               </div>
             )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-950/80 text-zinc-500 text-[9px] uppercase tracking-[0.2em] font-black">
                <th className="px-8 py-5">Identificação do Produto</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-center">Saldo Atual</th>
                <th className="px-8 py-5 text-center bg-zinc-900/40">Ajuste Rápido (Entrada/Saída)</th>
                <th className="px-8 py-5 text-right">Preço Venda</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map(p => {
                const isCritical = p.stock <= p.minStock;
                const adjustmentValue = adjustments[p.id] || 0;
                
                return (
                  <tr key={p.id} className="hover:bg-zinc-800/20 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white group-hover:text-[#FF2D55] transition-colors uppercase">{p.name}</span>
                        <span className="text-[10px] font-mono text-zinc-600 mt-1 uppercase tracking-widest">{p.sku || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {isCritical ? (
                        <div className="flex items-center gap-2 text-amber-500">
                          <AlertCircle size={14} />
                          <span className="text-[10px] font-black uppercase">Crítico (Min: {p.minStock})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-500">
                          <Check size={14} />
                          <span className="text-[10px] font-black uppercase">Normal</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`text-xl font-black ${isCritical ? 'text-amber-500' : 'text-zinc-200'}`}>
                        {p.stock}
                      </span>
                      <span className="text-[9px] block text-zinc-600 uppercase font-bold tracking-tighter">unidades</span>
                    </td>
                    
                    {/* QUICK ADJUSTMENT COLUMN */}
                    <td className="px-8 py-6 bg-zinc-900/20">
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center bg-zinc-950 rounded-2xl border border-zinc-800 p-1 shadow-inner">
                          <button 
                            onClick={() => setItemAdjustment(p.id, adjustmentValue - 1)}
                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                          >
                            <ArrowDown size={16} />
                          </button>
                          <input 
                            type="number"
                            value={adjustmentValue === 0 ? '' : adjustmentValue}
                            onChange={(e) => setItemAdjustment(p.id, parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="w-16 bg-transparent text-center text-sm font-black text-white outline-none placeholder-zinc-800"
                          />
                          <button 
                            onClick={() => setItemAdjustment(p.id, adjustmentValue + 1)}
                            className="p-2 text-zinc-500 hover:text-emerald-500 transition-colors"
                          >
                            <ArrowUp size={16} />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => handleQuickAdjust(p.id, p.stock)}
                          disabled={adjustmentValue === 0}
                          className={`p-3 rounded-xl transition-all shadow-lg ${adjustmentValue !== 0 ? 'bg-[#FF2D55] text-white hover:scale-105 active:scale-95' : 'bg-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'}`}
                          title="Confirmar Ajuste"
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    </td>

                    <td className="px-8 py-6 text-right">
                      <p className="text-sm font-black text-white">R$ {p.salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleDelete(p.id)} 
                        className="p-3 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-zinc-600">
                      <Box size={48} className="opacity-10" />
                      <p className="font-bold uppercase text-xs tracking-widest italic">Nenhum produto encontrado nesta busca</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NEW PRODUCT */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
              <X size={28} />
            </button>
            
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-[#FF2D55] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-900/20">
                <Package size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Novo Item</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Cadastro Técnico de Insumo</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 ml-1">Nome do Produto / Marca</label>
                  <input 
                    type="text" 
                    value={newPart.name}
                    onChange={(e) => setNewPart({...newPart, name: e.target.value})}
                    placeholder="Ex: Óleo Selènia 5W30 Sintético"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-[#FF2D55] outline-none transition-all placeholder-zinc-800 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 ml-1">SKU / Código Fábrica</label>
                  <input 
                    type="text" 
                    value={newPart.sku}
                    onChange={(e) => setNewPart({...newPart, sku: e.target.value})}
                    placeholder="KP-12345"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-[#FF2D55] outline-none transition-all placeholder-zinc-800 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 ml-1">Preço Sugerido Venda</label>
                  <input 
                    type="number" 
                    value={newPart.salePrice === 0 ? '' : newPart.salePrice}
                    onChange={(e) => setNewPart({...newPart, salePrice: parseFloat(e.target.value) || 0})}
                    placeholder="R$ 0,00"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-[#FF2D55] outline-none transition-all placeholder-zinc-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 p-6 bg-zinc-950/50 rounded-3xl border border-zinc-800/50">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Estoque Inicial</label>
                  <input 
                    type="number" 
                    value={newPart.stock === 0 ? '' : newPart.stock}
                    onChange={(e) => setNewPart({...newPart, stock: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-3 text-white focus:border-[#FF2D55] outline-none font-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Estoque de Alerta</label>
                  <input 
                    type="number" 
                    value={newPart.minStock === 0 ? '' : newPart.minStock}
                    onChange={(e) => setNewPart({...newPart, minStock: parseFloat(e.target.value) || 0})}
                    placeholder="Ex: 5"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-3 text-white focus:border-amber-500 outline-none font-black"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full bg-[#FF2D55] py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] text-white hover:bg-[#D11D40] transition-all transform active:scale-95 shadow-2xl shadow-red-900/30 flex items-center justify-center gap-3 mt-4"
              >
                Efetivar Cadastro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
