import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Trash2, Plus, Phone, Gauge, Car, User, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { ServiceOrder, OSItem, OSStatus, PaymentStatus, Client, Vehicle, UserSession } from '../types';
import { getWorkshopData, saveWorkshopData } from '../src/lib/storage';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder;
  session?: UserSession;
  syncData?: (key: string, data: any) => Promise<void>;
  onOrderUpdated?: (updatedOrder: ServiceOrder) => void;
}

const PRESET_QUICK_ITEMS = [
  { label: 'Óleo + Filtro', desc: 'TROCA DE ÓLEO 5W30 SINTÉTICO + FILTRO DE ÓLEO', price: 280, type: 'PART' as const },
  { label: 'Pastilha Freio', desc: 'SUBSTITUIÇÃO DO JOGO DE PASTILHAS DE FREIO DIANTEIRAS', price: 220, type: 'PART' as const },
  { label: 'Alinhamento', desc: 'ALINHAMENTO A LASER 3D + BALANCEAMENTO 4 RODAS', price: 140, type: 'SERVICE' as const },
  { label: 'Higienização AC', desc: 'HIGIENIZAÇÃO DE AR CONDICIONADO OZÔNIO + FILTRO DE CABINE', price: 160, type: 'SERVICE' as const },
  { label: 'Revisão Geral', desc: 'REVISÃO PREVENTIVA E CHECK-UP COMPLETO', price: 350, type: 'SERVICE' as const },
];

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  session,
  syncData,
  onOrderUpdated
}) => {
  if (!isOpen || !order) return null;

  const [clientName, setClientName] = useState(order.clientName || '');
  const [clientPhone, setClientPhone] = useState(order.clientPhone || '');
  const [vehiclePlate, setVehiclePlate] = useState(order.vehiclePlate || '');
  const [vehicleModel, setVehicleModel] = useState(order.vehicleModel || '');
  const [vehicleKm, setVehicleKm] = useState(order.vehicleKm || '');
  const [status, setStatus] = useState<OSStatus>(order.status || OSStatus.FINALIZADO);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus || PaymentStatus.PENDENTE);
  const [labor, setLabor] = useState<string>((order.laborValue || 0).toString());
  const [items, setItems] = useState<OSItem[]>(() => 
    order.items && order.items.length > 0 ? [...order.items] : []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Recalculate total dynamically based on items and labor
  const totalValue = useMemo(() => {
    const validItemsTotal = items.reduce((acc, curr) => {
      const q = typeof curr.quantity === 'number' ? curr.quantity : parseFloat(curr.quantity as any) || 0;
      const u = typeof curr.unitPrice === 'number' ? curr.unitPrice : parseFloat(curr.unitPrice as any) || 0;
      return acc + (q * u);
    }, 0);
    return validItemsTotal + (parseFloat(labor) || 0);
  }, [items, labor]);

  // Identify empty boxes (quadrados em branco)
  const blankBoxes = items.filter(i => !i.description || i.description.trim() === '');

  const handlePurgeBlankBoxes = () => {
    setItems(items.filter(i => i.description && i.description.trim() !== ''));
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Math.random().toString(36).substr(2, 9),
        description: '',
        quantity: 1,
        unitPrice: 0,
        type: 'SERVICE'
      }
    ]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Automatically purge any blank/empty item boxes
      const cleanItems = items.filter(i => String(i?.description || '').trim() !== '');

      const laborNum = parseFloat(String(labor || '0').replace(',', '.')) || 0;
      const computedItemsTotal = cleanItems.reduce((acc, curr) => acc + ((Number(curr.quantity) || 1) * (Number(curr.unitPrice) || 0)), 0);
      const computedTotal = computedItemsTotal + laborNum;

      const tenant = session?.username || 'rafael';

      // 2. Build updated ServiceOrder
      const updatedOrder: ServiceOrder = {
        ...order,
        clientName: String(clientName || '').trim().toUpperCase() || 'CLIENTE BALCÃO',
        clientPhone: String(clientPhone || '').trim() || '(13) 99689-2958',
        vehiclePlate: String(vehiclePlate || '').trim().toUpperCase() || 'SEM PLACA',
        vehicleModel: String(vehicleModel || '').trim().toUpperCase() || 'VEÍCULO DIVERSOS',
        vehicleKm: String(vehicleKm || '0').trim(),
        status,
        paymentStatus,
        laborValue: laborNum,
        items: cleanItems.length > 0 ? cleanItems : [{
          id: Math.random().toString(36).substr(2, 9),
          description: 'MANUTENÇÃO GERAL',
          quantity: 1,
          unitPrice: computedTotal,
          type: 'SERVICE'
        }],
        totalValue: computedTotal,
        updatedAt: new Date().toISOString()
      };

      // 3. Update orders list
      const currentOrders = getWorkshopData<ServiceOrder[]>('orders', tenant, []);
      const updatedOrders = currentOrders.map(o => o.id === order.id ? updatedOrder : o);
      await saveWorkshopData('orders', updatedOrders, tenant);
      if (syncData) await syncData('orders', updatedOrders);

      // 4. Also update Client record so personal phone/name fixes persist permanently
      if (order.clientId) {
        const currentClients = getWorkshopData<Client[]>('clients', tenant, []);
        const clientIndex = currentClients.findIndex(c => c.id === order.clientId);
        if (clientIndex !== -1) {
          const updatedClients = [...currentClients];
          updatedClients[clientIndex] = {
            ...updatedClients[clientIndex],
            name: clientName.trim() || updatedClients[clientIndex].name,
            phone: clientPhone.trim() || updatedClients[clientIndex].phone
          };
          await saveWorkshopData('clients', updatedClients, tenant);
          if (syncData) await syncData('clients', updatedClients);
        }
      }

      // 5. Also update Vehicle record if KM or model was adjusted
      if (order.vehicleId) {
        const currentVehicles = getWorkshopData<Vehicle[]>('vehicles', tenant, []);
        const vehicleIndex = currentVehicles.findIndex(v => v.id === order.vehicleId);
        if (vehicleIndex !== -1) {
          const updatedVehicles = [...currentVehicles];
          const newKmNum = parseInt(vehicleKm, 10);
          updatedVehicles[vehicleIndex] = {
            ...updatedVehicles[vehicleIndex],
            plate: vehiclePlate.trim().toUpperCase() || updatedVehicles[vehicleIndex].plate,
            model: vehicleModel.trim().toUpperCase() || updatedVehicles[vehicleIndex].model,
            km: !isNaN(newKmNum) ? newKmNum : updatedVehicles[vehicleIndex].km
          };
          await saveWorkshopData('vehicles', updatedVehicles, tenant);
          if (syncData) await syncData('vehicles', updatedVehicles);
        }
      }

      setSaveSuccess(true);
      if (onOrderUpdated) {
        onOrderUpdated(updatedOrder);
      }

      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);

    } catch (err) {
      console.error(err);
      alert("Houve um erro ao salvar as alterações da nota.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-3 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-950 border border-white/15 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-zinc-900/60 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#FF2D55] text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                EDITAR NOTA
              </span>
              <span className="text-zinc-500 text-xs font-mono font-bold">
                OS #{order.osNumber}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white italic uppercase tracking-tight mt-1">
              Editar Dados da Ordem de Serviço
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90 cursor-pointer"
            aria-label="Fechar"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">

          {/* Seção 1: Cliente & Telefone (Pedido explícito do usuário) */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-wider">
              <User size={16} className="text-[#FF2D55]" />
              <span>Dados do Cliente & Contato Telefônico</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nome completo do cliente"
                  className="w-full bg-black/60 border border-white/15 focus:border-[#FF2D55] rounded-xl px-4 py-3 text-white font-bold text-xs outline-none uppercase transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Phone size={12} /> Telefone / WhatsApp do Cliente
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(13) 99999-9999"
                  className="w-full bg-black/60 border border-emerald-500/40 focus:border-emerald-400 rounded-xl px-4 py-3 text-emerald-300 font-mono font-bold text-xs outline-none transition-all shadow-inner"
                />
                <p className="text-[9px] text-zinc-500 italic">
                  * Atualiza o telefone nesta nota e também no cadastro permanente do cliente.
                </p>
              </div>
            </div>
          </div>

          {/* Seção 2: Veículo & KM */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-wider">
              <Car size={16} className="text-[#FF2D55]" />
              <span>Veículo & Kilometragem (KM)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Placa
                </label>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                  placeholder="ABC-1234"
                  className="w-full bg-black/60 border border-white/15 focus:border-[#FF2D55] rounded-xl px-4 py-3 text-white font-mono font-black text-xs outline-none uppercase transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Modelo do Veículo
                </label>
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value.toUpperCase())}
                  placeholder="Ex: CHEVROLET ONIX 1.0"
                  className="w-full bg-black/60 border border-white/15 focus:border-[#FF2D55] rounded-xl px-4 py-3 text-white font-bold text-xs outline-none uppercase transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Gauge size={12} /> KM Atual Nesta Nota
                </label>
                <input
                  type="number"
                  value={vehicleKm}
                  onChange={(e) => setVehicleKm(e.target.value)}
                  placeholder="Ex: 85000"
                  className="w-full bg-black/60 border border-emerald-500/40 focus:border-emerald-400 rounded-xl px-4 py-3 text-emerald-300 font-mono font-bold text-xs outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Status da OS & Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Status da Ordem de Serviço
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OSStatus)}
                className="w-full bg-black/60 border border-white/15 focus:border-[#FF2D55] rounded-xl px-4 py-3 text-white font-bold text-xs outline-none cursor-pointer"
              >
                <option value={OSStatus.FINALIZADO}>● Finalizado</option>
                <option value={OSStatus.EM_ANDAMENTO}>● Em Execução / Oficina</option>
                <option value={OSStatus.ORCAMENTO}>● Orçamento</option>
                <option value={OSStatus.AGUARDANDO_APROVACAO}>● Aguardando Aprovação</option>
                <option value={OSStatus.CANCELADO}>● Cancelado</option>
              </select>
            </div>

            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Status do Pagamento
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full bg-black/60 border border-white/15 focus:border-[#FF2D55] rounded-xl px-4 py-3 text-white font-bold text-xs outline-none cursor-pointer"
              >
                <option value={PaymentStatus.PAGO}>✔ Quitado / Pago</option>
                <option value={PaymentStatus.PENDENTE}>⏳ Pendente</option>
                <option value={PaymentStatus.ATRASADO}>⚠ Em Aberto / Atrasado</option>
              </select>
            </div>
          </div>

          {/* Seção 4: Itens da Nota com Auto-Purge de Caixas Vazias */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-sm font-black text-white italic uppercase tracking-wider">
                  Itens, Peças e Serviços da Nota
                </h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                  {items.length} {items.length === 1 ? 'item lançado' : 'itens lançados'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-[#FF2D55] hover:bg-[#D11D40] text-white rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <Plus size={14} /> Novo Item
                </button>
              </div>
            </div>

            {/* Atalhos rápidos para adicionar na edição */}
            <div className="flex flex-wrap items-center gap-1.5 py-1">
              <span className="text-[9px] font-bold uppercase text-zinc-500 flex items-center gap-1 mr-1">
                <Zap size={11} className="text-[#FF2D55]" /> Atalhos:
              </span>
              {PRESET_QUICK_ITEMS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setItems([
                      ...items,
                      {
                        id: Math.random().toString(36).substr(2, 9),
                        description: preset.desc,
                        quantity: 1,
                        unitPrice: preset.price,
                        type: preset.type
                      }
                    ]);
                  }}
                  className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 border border-white/10 rounded-lg text-[9px] font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  + {preset.label}
                </button>
              ))}
            </div>

            {/* Alerta de Caixas Vazias (Purge Automático conforme pedido do usuário) */}
            {blankBoxes.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <AlertCircle size={16} className="text-amber-400 shrink-0" />
                  <span>
                    {blankBoxes.length} {blankBoxes.length === 1 ? 'caixa em branco detectada' : 'caixas em branco detectadas'}. Ao salvar, serão apagadas automaticamente para a nota não ficar vazia!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handlePurgeBlankBoxes}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-black text-[10px] uppercase tracking-wider self-start sm:self-auto cursor-pointer"
                >
                  Apagar Vazias Agora
                </button>
              </div>
            )}

            {/* Lista de Caixas de Itens */}
            <div className="space-y-3">
              {items.length === 0 && (
                <div className="p-6 border border-dashed border-white/15 rounded-2xl text-center text-xs text-zinc-500">
                  Nenhum item na nota. Clique em "+ Novo Item" acima para adicionar.
                </div>
              )}

              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="p-3.5 sm:p-4 bg-black/60 border border-white/10 rounded-2xl space-y-3 shadow-inner"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-zinc-500 w-5">
                      #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const newDesc = e.target.value.toUpperCase();
                        setItems(items.map((it, i) => i === index ? { ...it, description: newDesc } : it));
                      }}
                      placeholder="Descrição técnica do serviço ou peça..."
                      className="flex-1 bg-transparent border-b border-white/15 focus:border-[#FF2D55] text-white font-bold text-xs uppercase outline-none py-1 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setItems(items.filter((_, i) => i !== index))}
                      className="p-1.5 text-zinc-500 hover:text-[#FF2D55] transition-colors rounded-lg cursor-pointer"
                      title="Excluir este item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase">Qtd</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setItems(items.map((it, i) => i === index ? { ...it, quantity: val } : it));
                        }}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-center text-white font-bold text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase">R$ Unitário</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setItems(items.map((it, i) => i === index ? { ...it, unitPrice: val } : it));
                        }}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-right text-white font-bold text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase">Total Item</label>
                      <div className="w-full bg-zinc-900/60 border border-white/5 rounded-lg p-2 text-right text-emerald-400 font-mono font-bold text-xs">
                        R$ {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 5: Mão de Obra e Total */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 max-w-xs">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">
                Mão de Obra Geral (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={labor}
                onChange={(e) => setLabor(e.target.value)}
                className="w-full bg-black/60 border border-white/15 focus:border-[#FF2D55] rounded-xl px-4 py-2.5 text-white font-bold text-sm outline-none"
              />
            </div>

            <div className="text-right sm:border-l sm:border-white/10 sm:pl-6">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                Total Atualizado da Nota
              </p>
              <p className="text-2xl sm:text-3xl font-black text-[#FF2D55] italic tracking-tight font-mono">
                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-zinc-900/80 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-3 rounded-xl border border-white/15 text-zinc-400 hover:text-white hover:bg-white/5 font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 sm:px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-xl active:scale-95 cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-[#FF2D55] hover:bg-[#D11D40] text-white shadow-red-900/30'
            }`}
          >
            {isSaving ? (
              <span>Salvando Alterações...</span>
            ) : saveSuccess ? (
              <>
                <CheckCircle size={16} />
                <span>Nota Atualizada!</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Salvar Alterações na Nota</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditOrderModal;
