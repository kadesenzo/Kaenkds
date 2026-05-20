import React, { useState, useEffect } from 'react';
import { Wrench, Eye, EyeOff, RefreshCw, Cloud, ArrowLeft, Shield, AlertTriangle, Key, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onLogin: (username: string, role: 'Dono' | 'Funcionário' | 'Recepção', realName: string, activeUser: string) => void;
}

interface AppUser {
  id: string;
  name: string;
  username: string;
  role: 'Dono' | 'Funcionário' | 'Recepção';
  status: 'ATIVO' | 'BLOQUEADO';
  lastLogin: string;
  deviceRegistered: string;
  password?: string;
  securityQuestion?: string;
  securityAnswer?: string;
}

const DEFAULT_USERS: AppUser[] = [
  { 
    id: 'usr-1', 
    name: 'Administrador Master', 
    username: 'rafael', 
    role: 'Dono', 
    status: 'ATIVO', 
    lastLogin: 'Nunca logou', 
    deviceRegistered: 'Desktop Master (Chrome Windows)',
    password: 'enzo1234',
    securityQuestion: 'Qual o nome de sua oficina principal?',
    securityAnswer: 'KAEN'
  },
  { 
    id: 'usr-2', 
    name: 'Eduardo Maciel', 
    username: 'eduardo', 
    role: 'Funcionário', 
    status: 'ATIVO', 
    lastLogin: 'Nunca logou', 
    deviceRegistered: 'Tablet Oficina (iPad Pro)',
    password: 'mec1234',
    securityQuestion: 'Qual sua profissão?',
    securityAnswer: 'MECANICO'
  },
  { 
    id: 'usr-3', 
    name: 'Janete Silva', 
    username: 'janete', 
    role: 'Recepção', 
    status: 'ATIVO', 
    lastLogin: 'Nunca logou', 
    deviceRegistered: 'Desktop Recepção (Linux Chrome)',
    password: 'rec1234',
    securityQuestion: 'Em qual cidade fica a matriz?',
    securityAnswer: 'SAO PAULO'
  },
  { 
    id: 'usr-4', 
    name: 'Thiago Rover', 
    username: 'thiago', 
    role: 'Funcionário', 
    status: 'ATIVO', 
    lastLogin: 'Nunca logou', 
    deviceRegistered: 'Smartphone (Android)',
    password: 'mec1234',
    securityQuestion: 'Qual a marca do scanner principal?',
    securityAnswer: 'LAUNCH'
  }
];

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('rafael');
  const [password, setPassword] = useState('enzo1234');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  
  // Loaded Users list
  const [users, setUsers] = useState<AppUser[]>([]);

  // Recovery States
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryUser, setRecoveryUser] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveredPass, setRecoveredPass] = useState('');

  // Settle users db on mount
  useEffect(() => {
    const saved = localStorage.getItem('kaenpro_rafael_admin_users');
    if (saved) {
      try {
        setUsers(JSON.parse(saved));
      } catch (err) {
        setUsers(DEFAULT_USERS);
        localStorage.setItem('kaenpro_rafael_admin_users', JSON.stringify(DEFAULT_USERS));
      }
    } else {
      setUsers(DEFAULT_USERS);
      localStorage.setItem('kaenpro_rafael_admin_users', JSON.stringify(DEFAULT_USERS));
    }
  }, []);

  const detectDevice = () => {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablet";
    if (/mobile|iphone|ipod|android/i.test(ua)) return "Celular";
    return "Computador Desktop";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    await new Promise(r => setTimeout(r, 1200));

    const checkUser = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

    if (!checkUser) {
      setError('ACESSO CORTADO: USUÁRIO NÃO ENCONTRADO NO BACKEND.');
      setIsLoggingIn(false);
      return;
    }

    if (checkUser.status === 'BLOQUEADO') {
      setError('CONTA SEGURADA BLOQUEADA: CONSULTE SEU ADMINISTRADOR.');
      setIsLoggingIn(false);
      return;
    }

    // Default match checks
    const reqPassword = checkUser.password || (checkUser.username === 'rafael' ? 'enzo1234' : 'mec1234');

    if (password === reqPassword) {
      // 1. Log access attempt in storage logs
      const timestamp = new Date().toISOString();
      const clientIp = "192.168.1." + Math.floor(Math.random() * 200 + 10);
      const activeDeviceName = detectDevice() + " (" + (navigator.platform || "ChromeOS") + ")";

      // Update users last login
      const updatedUsers = users.map(u => u.id === checkUser.id ? { ...u, lastLogin: timestamp } : u);
      setUsers(updatedUsers);
      localStorage.setItem('kaenpro_rafael_admin_users', JSON.stringify(updatedUsers));

      // Append accesses log
      const accessesKey = 'kaenpro_rafael_admin_accesses';
      const currentAccesses = JSON.parse(localStorage.getItem(accessesKey) || '[]');
      const newAccess = {
        id: `acc-${Date.now()}`,
        username: checkUser.name,
        role: checkUser.role,
        device: activeDeviceName,
        ip: clientIp,
        location: 'Kaen Oficina - Pátio Principal',
        timestamp
      };
      localStorage.setItem(accessesKey, JSON.stringify([newAccess, ...currentAccesses]));

      // Append general audit log
      const logsKey = 'kaenpro_rafael_admin_logs';
      const currentLogs = JSON.parse(localStorage.getItem(logsKey) || '[]');
      const newAudit = {
        id: `log-${Date.now()}`,
        user: checkUser.name,
        device: detectDevice(),
        action: `LOGIN EFETUADO NO TERMINAL DE SEGURANÇA (${checkUser.role})`,
        module: 'Sessão de Sistema',
        timestamp
      };
      localStorage.setItem(logsKey, JSON.stringify([newAudit, ...currentLogs]));

      onLogin('rafael', checkUser.role, checkUser.name, checkUser.username);
    } else {
      setError('CHAVE PRIVADA INCORRETA: ACESSO BLOQUEADO PELO NÚCLEO.');
      setIsLoggingIn(false);
    }
  };

  const selectedRecoveryRecord = users.find(u => u.username.toLowerCase() === recoveryUser.toLowerCase());

  const handleRecover = () => {
    setRecoveryError('');
    setRecoveredPass('');
    if (!selectedRecoveryRecord) {
      setRecoveryError('USUÁRIO NÃO RECONHECIDO.');
      return;
    }

    const defaultAns = selectedRecoveryRecord.securityAnswer || 'KAEN';
    if (recoveryAnswer.trim().toUpperCase() === defaultAns.toUpperCase()) {
      const recoveryKey = selectedRecoveryRecord.password || (selectedRecoveryRecord.username === 'rafael' ? 'enzo1234' : 'mec1234');
      setRecoveredPass(recoveryKey);
    } else {
      setRecoveryError('RESPOSTA DE SEGURANÇA INCORRETA. CONTATE A CENTRAL.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,rgba(255,45,85,0.05)_0%,transparent_70%)] pointer-events-none"></div>
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 md:top-12 md:left-12 text-zinc-700 hover:text-white transition-all flex items-center gap-3 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] italic z-50 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1.5 transition-transform" /> VOLTAR AO INÍCIO
      </button>

      <div className="w-full max-w-md space-y-8 md:space-y-12 flex flex-col items-center relative z-10 py-10">
        <div className="text-center space-y-4 md:space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FF2D55] rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(255,45,85,0.35)] border border-white/20">
            <Shield size={32} className="text-white sm:size-40" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">KAEN</h1>
            <p className="text-[9px] sm:text-[10px] font-black text-zinc-700 uppercase tracking-[0.6em] italic">AUTENTICAÇÃO DE SEGURANÇA</p>
          </div>
        </div>

        <div className="w-full glass-card p-6 sm:p-10 md:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] relative overflow-hidden border border-white/5 shadow-2xl">
          {isLoggingIn && (
            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl z-20 flex flex-col items-center justify-center gap-6 p-6 text-center">
              <RefreshCw size={44} className="text-[#FF2D55] animate-spin" />
              <p className="text-[10px] sm:text-xs font-black text-white uppercase tracking-[0.4em] italic animate-pulse">Iniciando Workspace KAEN...</p>
            </div>
          )}

          <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] sm:text-[10px] p-5 rounded-[1.5rem] text-center font-black uppercase tracking-wider animate-pulse italic">
                {error}
              </div>
            )}

            {/* Account Profile Quick Selector */}
            <div className="space-y-3">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] ml-4 text-left block italic">SELECIONE SEU PERFIL</label>
              <div className="grid grid-cols-3 gap-2 bg-zinc-950/80 p-1.5 border border-white/5 rounded-2xl">
                {[
                  { username: 'rafael', label: 'Admin', role: 'Dono' },
                  { username: 'janete', label: 'Recepção', role: 'Staff' },
                  { username: 'eduardo', label: 'Mecânico', role: 'Oficina' },
                ].map(it => {
                  const isSel = username.toLowerCase() === it.username;
                  return (
                    <button
                      key={it.username}
                      type="button"
                      onClick={() => {
                        setUsername(it.username);
                        setPassword(it.username === 'rafael' ? 'enzo1234' : it.username === 'janete' ? 'rec1234' : 'mec1234');
                      }}
                      className={`py-3 rounded-xl transition-all duration-300 text-center flex flex-col items-center justify-center
                      ${isSel ? 'bg-white text-black font-black font-semibold' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                    >
                      <span className="text-[10px] uppercase font-black tracking-tight leading-none">{it.label}</span>
                      <span className="text-[7px] text-zinc-400 mt-0.5 tracking-tight font-light">{it.role}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] ml-4 text-left block italic">CÓDIGO DE USUÁRIO</label>
              <input 
                type="text" 
                required 
                placeholder="NOME DO COLABORADOR"
                value={username} 
                onChange={(e) => setUsername(e.target.value.toLowerCase())} 
                className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white text-center focus:border-[#FF2D55]/50 outline-none transition-all font-black text-xs uppercase tracking-widest shadow-inner"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-4">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] italic">CHAVE PRIVADA (SENHA)</label>
                <button 
                  type="button" 
                  onClick={() => setShowRecoveryModal(true)} 
                  className="text-[#FF2D55] text-[9px] font-bold uppercase tracking-widest italic hover:underline"
                >
                  RECUPERAR ACESSO
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="DIGITE A CHAVE PRIVADA"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white text-center focus:border-[#FF2D55]/50 outline-none transition-all font-black text-xs tracking-widest shadow-inner"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#FF2D55] py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.5em] text-white flex items-center justify-center gap-4 active:scale-95 transition-all shadow-[0_15px_40px_rgba(255,45,85,0.3)] italic"
            >
              <span>EFETUAR AUTENTICAÇÃO</span>
              <Cloud size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* RECOVERY MODAL */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0D0D0E] border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative">
            <div className="text-center space-y-4 mb-8">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <Key size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black italic uppercase text-white tracking-widest leading-none">RECUPERAÇÃO DE ACESSO</h3>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-2">Validação de protocolo de segurança interna</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block ml-2 text-left">Selecione o Usuário</label>
                <select 
                  value={recoveryUser} 
                  onChange={(e) => {
                    setRecoveryUser(e.target.value);
                    setRecoveryAnswer('');
                    setRecoveredPass('');
                    setRecoveryError('');
                  }} 
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3.5 text-white text-xs font-black uppercase outline-none focus:border-amber-500/50 transition-all font-sans"
                >
                  <option value="">-- SELECIONE SEU NOME --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.username}>{u.name} ({u.username})</option>
                  ))}
                </select>
              </div>

              {selectedRecoveryRecord && (
                <div className="space-y-4 p-5 bg-zinc-950 border border-white/5 rounded-2xl text-left">
                  <div className="space-y-2">
                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-[0.2em] block">PERGUNTA DE SEGURANÇA:</span>
                    <p className="text-xs font-black text-white uppercase italic">{selectedRecoveryRecord.securityQuestion || "Qual o nome da sua oficina?"}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Sua Resposta</label>
                    <input 
                      type="text" 
                      placeholder="RESPOSTA DE RECUPERAÇÃO"
                      value={recoveryAnswer} 
                      onChange={(e) => setRecoveryAnswer(e.target.value)} 
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-black uppercase outline-none focus:border-amber-500/50 transition-all tracking-wider"
                    />
                  </div>
                </div>
              )}

              {recoveryError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] p-4 rounded-xl text-center font-black uppercase italic">
                  {recoveryError}
                </div>
              )}

              {recoveredPass && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-center p-5 rounded-2xl space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest block">DECODIFICAÇÃO DE CHAVE PRIVADA COM SUCESSO!</span>
                  <div className="text-2xl font-mono font-black tracking-widest bg-black p-3 rounded-lg text-white border border-emerald-500/30">
                    {recoveredPass}
                  </div>
                  <span className="text-[8px] text-zinc-500 uppercase block font-medium">Use a chave acima para efetuar seu login.</span>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowRecoveryModal(false)}
                  className="flex-1 bg-zinc-900 text-zinc-400 py-3.5 rounded-xl font-bold uppercase text-[9px] tracking-widest hover:text-white transition-all border border-white/5"
                >
                  CANCELAR
                </button>
                {selectedRecoveryRecord && !recoveredPass && (
                  <button 
                    onClick={handleRecover}
                    className="flex-1 bg-amber-500 text-black py-3.5 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-[0_10px_25px_rgba(245,158,11,0.2)] italic"
                  >
                    REVELAR CHAVE
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
