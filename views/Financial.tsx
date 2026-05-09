
import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, ArrowUpCircle, ArrowDownCircle, PieChart as PieChartIcon, 
  Plus, Search, X, Trash2, Edit3, Loader2, Save, TrendingUp, Filter
} from 'lucide-react';
import { FinancialTransaction, TransactionType, PaymentMethod, UserSession } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';

const Financial: React.FC<{ session?: UserSession; syncData?: (key: string, data: any) => Promise<void> }> = ({ session, syncData }) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    description: '',
    category: 'Diversos',
    amount: '',
    method: PaymentMethod.PIX,
    type: TransactionType.EXPENSE,
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    'Serviço/Peças', 'Aluguel', 'Peças (Compra)', 'Energia/Água', 
    'Internet', 'Salários', 'Impostos', 'Ferramentas', 'Diversos'
  ];

  useEffect(() => {
    if (session) {
      const saved = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_transactions`) || '[]');
      setTransactions(saved);
    }
  }, [session]);

  const handleSave = async () => {
    if (!form.description || !form.amount || !session || !syncData) {
        alert("Preencha Descrição e Valor.");
        return;
    }

    let updated: FinancialTransaction[];
    if (editingId) {
      updated = transactions.map(t => t.id === editingId ? {
        ...t,
        description: form.description,
        category: form.category,
        amount: parseFloat(form.amount),
        method: form.method,
        type: form.type,
        date: new Date(form.date).toISOString()
      } : t);
    } else {
      const newTransaction: FinancialTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        type: form.type,
        category: form.category,
        amount: parseFloat(form.amount),
        method: form.method,
        description: form.description,
        date: new Date(form.date).toISOString()
      };
      updated = [...transactions, newTransaction];
    }

    setTransactions(updated);
    if (syncData) {
      await syncData('transactions', updated);
    }
    setShowModal(false);
    setEditingId(null);
    setForm({ 
        description: '', 
        category: 'Diversos', 
        amount: '', 
        method: PaymentMethod.PIX, 
        type: TransactionType.EXPENSE, 
        date: new Date().toISOString().split('T')[0] 
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este registro financeiro?")) return;
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    if (syncData) {
      await syncData('transactions', updated);
    }
  };

  const handleEdit = (t: FinancialTransaction) => {
    setEditingId(t.id);
    setForm({
      description: t.description,
      category: t.category,
      amount: t.amount.toString(),
      method: t.method,
      type: t.type,
      date: new Date(t.date).toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((a, b) => a + b.amount, 0);
    const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((a, b) => a + b.amount, 0);
    const dailyIncome = transactions.filter(t => t.type === TransactionType.INCOME && t.date.split('T')[0] === todayStr).reduce((a, b) => a + b.amount, 0);
    const balance = income - expense;

    const chartData = [
      { name: 'Entradas', value: income, fill: '#10B981' },
      { name: 'Saídas', value: expense, fill: '#E11D48' }
    ];

    const categoryDataMap = transactions.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.keys(categoryDataMap).map(cat => ({
        name: cat,
        value: categoryDataMap[cat]
    }));

    return { income, expense, balance, dailyIncome, chartData, categoryData };
  }, [transactions]);

  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32 h-full overflow-y-auto no-scrollbar scroll-smooth px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-6">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Fluxo de <span className="text-[#E11D48]">Caixa</span></h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] italic mt-2">Gestão Financeira Sincronizada</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-zinc-800 text-white px-8 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-zinc-700 active:scale-95 transition-all border border-zinc-800"
        >
          <Plus size={20} className="text-[#E11D48]" /> Lançar Despesa / Entrada
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121214] border border-zinc-800/60 p-8 rounded-[2rem] border-l-4 border-l-emerald-500 shadow-xl">
           <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2 italic">Entradas Acumuladas</p>
           <p className="text-3xl font-black text-emerald-500 italic">R$ {stats.income.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-[#121214] border border-zinc-800/60 p-8 rounded-[2rem] border-l-4 border-l-[#E11D48] shadow-xl">
           <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2 italic">Saídas Acumuladas</p>
           <p className="text-3xl font-black text-[#E11D48] italic">R$ {stats.expense.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-[#121214] border border-zinc-800/60 p-8 rounded-[2rem] border-l-4 border-l-blue-500 shadow-xl">
           <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2 italic">Saldo em Caixa</p>
           <p className={`text-3xl font-black italic ${stats.balance >= 0 ? 'text-white' : 'text-[#E11D48]'}`}>
             R$ {stats.balance.toLocaleString('pt-BR')}
           </p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-[2rem] shadow-inner flex flex-col justify-center">
           <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mb-2 italic">Faturamento de Hoje</p>
           <p className="text-3xl font-black text-white/50 italic">R$ {stats.dailyIncome.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121214] border border-zinc-800/60 p-8 rounded-[2.5rem] shadow-xl h-[350px]">
           <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 italic text-zinc-500 flex items-center gap-2">
             <TrendingUp size={14} /> Balanço de Operação
           </h3>
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={stats.chartData}>
               <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
               <XAxis dataKey="name" stroke="#525252" fontSize={10} axisLine={false} tickLine={false} />
               <YAxis hide />
               <Tooltip 
                contentStyle={{ backgroundColor: '#0c0c0e', border: '1px solid #1f1f1f', borderRadius: '12px' }}
                itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
               />
               <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                 {stats.chartData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.fill} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>

        <div className="bg-[#121214] border border-zinc-800/60 p-8 rounded-[2.5rem] shadow-xl h-[350px]">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 italic text-zinc-500 flex items-center gap-2">
             <PieChartIcon size={14} /> Despesas por Categoria
           </h3>
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie 
                data={stats.categoryData} 
                cx="50%" cy="50%" 
                innerRadius={60} outerRadius={80} 
                paddingAngle={5} 
                dataKey="value"
               >
                 {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#E11D48', '#10B981', '#3B82F6', '#F59E0B', '#6366F1', '#EC4899'][index % 6]} />
                  ))}
               </Pie>
               <Tooltip 
                 contentStyle={{ backgroundColor: '#0c0c0e', border: '1px solid #1f1f1f', borderRadius: '12px' }}
                 itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
               />
             </PieChart>
           </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#121214] border border-zinc-800/60 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 bg-zinc-950/20 flex items-center gap-4">
           <Search size={22} className="text-zinc-700" />
           <input type="text" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="Pesquisar histórico (descrição ou categoria)..." className="bg-transparent border-none text-[11px] font-black uppercase w-full outline-none focus:ring-0 text-white italic tracking-widest"/>
        </div>

        <div className="divide-y divide-zinc-800/50">
           {filtered.map(t => (
             <div key={t.id} className="p-6 flex items-center justify-between gap-6 hover:bg-zinc-800/20 transition-all group">
                <div className="flex items-center gap-5">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${t.type === TransactionType.INCOME ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-[#E11D48]/10 border-[#E11D48]/20 text-[#E11D48]'}`}>
                      {t.type === TransactionType.INCOME ? <ArrowUpCircle size={24}/> : <ArrowDownCircle size={24}/>}
                   </div>
                   <div>
                      <p className="text-sm font-black text-white uppercase italic tracking-tight truncate max-w-[200px]">{t.description}</p>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1 italic">
                        {new Date(t.date).toLocaleDateString('pt-BR')} • {t.category}
                      </p>
                   </div>
                </div>
                
                <div className="flex items-center gap-10">
                   <div className="text-right">
                      <p className={`text-xl font-black italic ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-[#E11D48]'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest italic">{t.method}</p>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={()=>handleEdit(t)} className="p-3 bg-zinc-900 text-zinc-500 hover:text-white rounded-xl border border-zinc-800 shadow-md transition-all"><Edit3 size={18}/></button>
                      <button onClick={()=>handleDelete(t.id)} className="p-3 bg-zinc-900 text-zinc-500 hover:text-red-500 rounded-xl border border-zinc-800 shadow-md transition-all"><Trash2 size={18}/></button>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
           <div className="bg-[#0c0c0e] border border-zinc-800 w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300">
              <button onClick={() => { setShowModal(false); setEditingId(null); }} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-all"><X size={28} /></button>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-10">{editingId ? 'Editar Movimentação' : 'Novo Lançamento'}</h2>
              <div className="space-y-6">
                <div className="flex gap-2 p-1.5 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-inner">
                  <button onClick={()=>setForm({...form, type: TransactionType.INCOME})} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all italic tracking-widest ${form.type === TransactionType.INCOME ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-600'}`}>Entrada</button>
                  <button onClick={()=>setForm({...form, type: TransactionType.EXPENSE})} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all italic tracking-widest ${form.type === TransactionType.EXPENSE ? 'bg-[#E11D48] text-white shadow-lg' : 'text-zinc-600'}`}>Saída (Despesa)</button>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase mb-2 block ml-1 italic tracking-widest">Descrição</label>
                  <input type="text" value={form.description} onChange={(e)=>setForm({...form, description: e.target.value.toUpperCase()})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-white font-bold text-sm outline-none focus:border-[#E11D48]"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="text-[10px] font-black text-zinc-600 uppercase mb-2 block ml-1 italic tracking-widest">Valor (R$)</label>
                    <input type="number" value={form.amount} onChange={(e)=>setForm({...form, amount: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-white font-black text-lg outline-none focus:border-[#E11D48]"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-600 uppercase mb-2 block ml-1 italic tracking-widest">Data</label>
                    <input type="date" value={form.date} onChange={(e)=>setForm({...form, date: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-white font-black text-[10px] outline-none focus:border-[#E11D48]"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-600 uppercase mb-2 block ml-1 italic tracking-widest">Categoria</label>
                    <select value={form.category} onChange={(e)=>setForm({...form, category: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-white font-bold text-xs outline-none focus:border-[#E11D48]">
                       {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-600 uppercase mb-2 block ml-1 italic tracking-widest">Método</label>
                    <select value={form.method} onChange={(e)=>setForm({...form, method: e.target.value as PaymentMethod})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-white font-bold text-xs outline-none focus:border-[#E11D48]">
                       {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={handleSave} className="w-full bg-[#E11D48] py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl mt-4 active:scale-95 transition-all">
                  Confirmar Registro Financeiro
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Financial;
