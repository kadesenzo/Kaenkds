import React, { useState, useEffect } from 'react';
import { 
  Wrench, Eye, EyeOff, RefreshCw, Cloud, ArrowLeft, Shield, 
  AlertTriangle, Key, CheckCircle, Smartphone, Laptop, ShieldCheck, 
  Lock, ArrowRight, Trash2, CheckCircle2, ShieldAlert 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KaenLogo from '../components/KaenLogo';

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
  const [tenant, setTenant] = useState(() => {
    try {
      return localStorage.getItem('kaenpro_last_tenant') || 'rafael';
    } catch {
      return 'rafael';
    }
  });
  const [roomPassword, setRoomPassword] = useState('');
  const [username, setUsername] = useState('rafael');
  // Password is intentionally EMPTY - user MUST enter their password
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  // Device Signature & Trusted Device Storage
  const getOrCreateDeviceToken = () => {
    let token = localStorage.getItem('kaen_device_token');
    if (!token) {
      token = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem('kaen_device_token', token);
    }
    return token;
  };

  const detectDevice = () => {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablet";
    if (/mobile|iphone|ipod|android/i.test(ua)) return "Celular";
    return "Computador Desktop";
  };

  const getDeviceLabel = () => {
    const type = detectDevice();
    const ua = navigator.userAgent;
    let os = "Navegador";
    if (/windows/i.test(ua)) os = "Windows";
    else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
    else if (/android/i.test(ua)) os = "Android";
    else if (/iphone|ipad/i.test(ua)) os = "iOS";
    else if (/linux/i.test(ua)) os = "Linux";
    return `${type} (${os})`;
  };

  // Check if current device is already an authorized saved device
  const [trustedDevice, setTrustedDevice] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('kaen_trusted_device');
      const token = localStorage.getItem('kaen_device_token');
      if (raw && token) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.deviceId === token) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [rememberDevice, setRememberDevice] = useState(true);
  const [showDirectAccess, setShowDirectAccess] = useState(() => {
    try {
      const raw = localStorage.getItem('kaen_trusted_device');
      const token = localStorage.getItem('kaen_device_token');
      if (raw && token) {
        const parsed = JSON.parse(raw);
        return parsed && parsed.deviceId === token;
      }
      return false;
    } catch {
      return false;
    }
  });
  
  // Loaded Users list
  const [users, setUsers] = useState<AppUser[]>([]);

  // Recovery States
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryUser, setRecoveryUser] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveredPass, setRecoveredPass] = useState('');

  // Room Creation States (Protected by Master Password)
  const [showMasterAuthModal, setShowMasterAuthModal] = useState(false);
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [masterAuthError, setMasterAuthError] = useState('');
  const [masterAuthorizedPassword, setMasterAuthorizedPassword] = useState('');

  const [showRoomCreator, setShowRoomCreator] = useState(false);
  const [newRoomId, setNewRoomId] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomCreatorError, setRoomCreatorError] = useState('');
  const [roomCreatorSuccess, setRoomCreatorSuccess] = useState('');

  const handleVerifyMasterPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMasterAuthError('');
    if (masterPasswordInput.trim() === 'enzo1234') {
      setMasterAuthorizedPassword(masterPasswordInput.trim());
      setShowMasterAuthModal(false);
      setMasterPasswordInput('');
      setShowRoomCreator(true);
    } else {
      setMasterAuthError('SENHA MASTER INCORRETA: Apenas o Administrador Master tem autorização para criar salas.');
    }
  };

  // Dynamically load users when server code changes
  useEffect(() => {
    const syncAndLoadUsers = async () => {
      // 1. Initial local load
      const saved = localStorage.getItem(`kaenpro_${tenant}_admin_users`);
      let loadedUsers = DEFAULT_USERS;
      if (saved) {
        try {
          loadedUsers = JSON.parse(saved);
        } catch {
          loadedUsers = DEFAULT_USERS;
        }
      }
      setUsers(loadedUsers);

      // Save tenant code index
      localStorage.setItem('kaenpro_last_tenant', tenant);

      // 2. Query cloud database to synchronize users for this server/tenant
      try {
        const res = await fetch(`/api/sync/${tenant}`);
        if (res.ok) {
          const data = await res.json();
          if (data.admin_users && Array.isArray(data.admin_users)) {
            setUsers(data.admin_users);
            localStorage.setItem(`kaenpro_${tenant}_admin_users`, JSON.stringify(data.admin_users));
          }
        }
      } catch (err) {
        console.warn("Could not load cloud user database for server code:", tenant, err);
      }
    };

    if (tenant) {
      syncAndLoadUsers();
    }
  }, [tenant]);

  const handleCreateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoomCreatorError('');
    setRoomCreatorSuccess('');
    setIsCreatingRoom(true);

    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: newRoomId,
          password: newRoomPassword,
          name: newRoomName,
          masterPassword: masterAuthorizedPassword || 'enzo1234'
        })
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (!res.ok) {
          setRoomCreatorError(data.error || "Houve um erro desconhecido ao criar a oficina.");
        } else {
          setRoomCreatorSuccess(`OFICINA REGISTRADA! ID: ${newRoomId.toUpperCase()}`);
          setTenant(newRoomId.toLowerCase());
          setRoomPassword(newRoomPassword);
          setTimeout(() => {
            setShowRoomCreator(false);
            setNewRoomId('');
            setNewRoomPassword('');
            setNewRoomName('');
            setRoomCreatorSuccess('');
          }, 2000);
        }
      } else {
        const text = await res.text();
        setRoomCreatorError(`Erro no Servidor [${res.status}]: ${text.substring(0, 150) || "Sem resposta do servidor"}`);
      }
    } catch (err: any) {
      setRoomCreatorError(`Erro de Conexão: ${err?.message || "Sem detalhes"}`);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    await new Promise(r => setTimeout(r, 800));

    // Dynamic Room validation if not default "rafael"
    if (tenant.trim().toLowerCase() !== "rafael") {
      try {
        const roomJoinRes = await fetch("/api/rooms/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: tenant.trim().toLowerCase(),
            password: roomPassword
          })
        });

        const joinContentType = roomJoinRes.headers.get("content-type") || "";
        if (joinContentType.includes("application/json")) {
          if (!roomJoinRes.ok) {
            const roomErr = await roomJoinRes.json();
            setError(`ACESSO SALA BLOQUEADO: ${roomErr.error || 'Código da oficina ou senha inválidos.'}`);
            setIsLoggingIn(false);
            return;
          }
        } else {
          const joinText = await roomJoinRes.text();
          setError(`ERRO DO SERVIDOR [${roomJoinRes.status}]: ${joinText.substring(0, 150) || "Sem resposta"}`);
          setIsLoggingIn(false);
          return;
        }
      } catch (err: any) {
        setError(`ERRO DE REDE: ${err?.message || "Sem detalhes da falha"}`);
        setIsLoggingIn(false);
        return;
      }
    }

    const checkUser = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

    if (!checkUser) {
      setError('ACESSO CORTADO: USUÁRIO NÃO ENCONTRADO NO BACKEND DA OFICINA.');
      setIsLoggingIn(false);
      return;
    }

    if (checkUser.status === 'BLOQUEADO') {
      setError('CONTA SEGURADA BLOQUEADA: CONSULTE SEU ADMINISTRADOR.');
      setIsLoggingIn(false);
      return;
    }

    if (!password || !password.trim()) {
      setError('SENHA OBRIGATÓRIA: Digite a sua chave/senha pessoal para autenticar.');
      setIsLoggingIn(false);
      return;
    }

    // Default match checks
    const reqPassword = checkUser.password || (checkUser.username === 'rafael' ? 'enzo1234' : 'mec1234');

    if (password === reqPassword) {
      // 1. Log access attempt in storage logs
      const timestamp = new Date().toISOString();
      const clientIp = "192.168.1." + Math.floor(Math.random() * 200 + 10);
      const activeDeviceName = getDeviceLabel();
      const currentDevToken = getOrCreateDeviceToken();

      // If user chose to remember/save this device:
      if (rememberDevice) {
        const deviceData = {
          deviceId: currentDevToken,
          username: tenant,
          activeUser: checkUser.username,
          realUsername: checkUser.name,
          role: checkUser.role,
          deviceName: activeDeviceName,
          savedAt: timestamp
        };
        localStorage.setItem('kaen_trusted_device', JSON.stringify(deviceData));
        setTrustedDevice(deviceData);
      } else {
        localStorage.removeItem('kaen_trusted_device');
        setTrustedDevice(null);
      }

      // Update users last login & registered device info
      const updatedUsers = users.map(u => u.id === checkUser.id ? { 
        ...u, 
        lastLogin: timestamp,
        deviceRegistered: `${activeDeviceName}${rememberDevice ? ' [Confiável]' : ''}`
      } : u);
      setUsers(updatedUsers);
      localStorage.setItem(`kaenpro_${tenant}_admin_users`, JSON.stringify(updatedUsers));

      // Append accesses log
      let cloudAccesses: any[] = [];
      let cloudLogs: any[] = [];
      try {
        const syncRes = await fetch(`/api/sync/${tenant}`);
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          cloudAccesses = syncData.admin_accesses || [];
          cloudLogs = syncData.admin_logs || [];
        }
      } catch (err) {
        console.warn("Failed to fetch cloud accesses/logs for initial seed. Falling back to local.", err);
        cloudAccesses = JSON.parse(localStorage.getItem(`kaenpro_${tenant}_admin_accesses`) || '[]');
        cloudLogs = JSON.parse(localStorage.getItem(`kaenpro_${tenant}_admin_logs`) || '[]');
      }

      const newAccess = {
        id: `acc-${Date.now()}`,
        username: checkUser.name,
        role: checkUser.role,
        device: activeDeviceName,
        ip: clientIp,
        location: 'Kaen Oficina - Pátio Principal',
        timestamp
      };

      const newAudit = {
        id: `log-${Date.now()}`,
        user: checkUser.name,
        device: activeDeviceName,
        action: `LOGIN COM SENHA ${rememberDevice ? '[APARELHO SALVO]' : ''} (${checkUser.role})`,
        module: 'Sessão de Sistema',
        timestamp
      };

      const updatedAccesses = [newAccess, ...cloudAccesses];
      const updatedLogs = [newAudit, ...cloudLogs];

      // Save locally for backup
      localStorage.setItem(`kaenpro_${tenant}_admin_accesses`, JSON.stringify(updatedAccesses));
      localStorage.setItem(`kaenpro_${tenant}_admin_logs`, JSON.stringify(updatedLogs));

      // Post back to database for full synchronization across devices
      try {
        await fetch(`/api/sync/${tenant}/admin_accesses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedAccesses)
        });
        await fetch(`/api/sync/${tenant}/admin_logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedLogs)
        });
        await fetch(`/api/sync/${tenant}/admin_users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUsers)
        });
      } catch (err) {
        console.error("Failed to POST updated login logs to server", err);
      }

      onLogin(tenant, checkUser.role, checkUser.name, checkUser.username);
    } else {
      setError('CHAVE PRIVADA INCORRETA: Acesso negado. A senha digitada não confere.');
      setIsLoggingIn(false);
    }
  };

  const handleQuickTrustedLogin = () => {
    if (!trustedDevice) return;
    setIsLoggingIn(true);
    setTimeout(() => {
      onLogin(
        trustedDevice.username || tenant, 
        trustedDevice.role, 
        trustedDevice.realUsername || trustedDevice.activeUser, 
        trustedDevice.activeUser
      );
    }, 400);
  };

  const handleForgetDevice = () => {
    localStorage.removeItem('kaen_trusted_device');
    setTrustedDevice(null);
    setShowDirectAccess(false);
    setPassword('');
    setError('');
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
        <div className="text-center space-y-2 md:space-y-3 flex flex-col items-center">
          <KaenLogo variant="horizontal" className="h-12 sm:h-16 md:h-18 w-auto drop-shadow-xl" />
          <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] italic">AUTENTICAÇÃO DE SEGURANÇA</p>
        </div>

        <div className="w-full glass-card p-6 sm:p-10 md:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] relative overflow-hidden border border-white/5 shadow-2xl">
          {isLoggingIn && (
            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl z-20 flex flex-col items-center justify-center gap-6 p-6 text-center">
              <RefreshCw size={44} className="text-[#FF2D55] animate-spin" />
              <p className="text-[10px] sm:text-xs font-black text-white uppercase tracking-[0.4em] italic animate-pulse">Iniciando Workspace KAEN...</p>
            </div>
          )}

          {trustedDevice && showDirectAccess ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Device Authorized Banner */}
              <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-2xl flex items-center gap-3.5 text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <span className="text-[8px] font-black uppercase tracking-[0.25em] text-emerald-400 block">DISPOSITIVO CONFIÁVEL REGISTRADO</span>
                  <p className="text-xs text-zinc-200 font-bold mt-0.5">{trustedDevice.deviceName || getDeviceLabel()}</p>
                </div>
              </div>

              {/* Saved Account Card */}
              <div className="p-6 bg-zinc-950/90 border border-white/10 rounded-3xl text-left space-y-4 shadow-inner">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#FF2D55] text-white flex items-center justify-center text-lg font-black uppercase italic shadow-lg shadow-[#FF2D55]/25 shrink-0">
                    {(trustedDevice.realUsername || trustedDevice.activeUser || 'K').slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block">Sessão Salva neste Aparelho</span>
                    <h3 className="text-base font-black text-white uppercase italic truncate">{trustedDevice.realUsername || trustedDevice.activeUser}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/10">
                        {trustedDevice.role}
                      </span>
                      <span className="text-[8px] text-zinc-400 uppercase tracking-wider">
                        {trustedDevice.username === 'rafael' ? 'Oficina: Auto Mecânica KAEN' : `Oficina: ${trustedDevice.username}`}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[9.5px] text-zinc-400 leading-relaxed pt-2 border-t border-white/5">
                  Este aparelho já foi autenticado anteriormente com senha válida e está liberado para acesso imediato.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleQuickTrustedLogin}
                  className="w-full bg-[#FF2D55] hover:bg-[#ff1744] py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] text-white flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_15px_40px_rgba(255,45,85,0.35)] italic"
                >
                  <span>ENTRAR NESTE DISPOSITIVO</span>
                  <ArrowRight size={16} />
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDirectAccess(false);
                      setPassword('');
                      setError('');
                    }}
                    className="py-3 px-3 bg-zinc-950 hover:bg-zinc-900 border border-white/5 hover:border-white/15 rounded-xl text-[8.5px] font-black uppercase tracking-wider text-zinc-400 hover:text-white transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <Lock size={12} />
                    Entrar com Senha
                  </button>

                  <button
                    type="button"
                    onClick={handleForgetDevice}
                    className="py-3 px-3 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40 rounded-xl text-[8.5px] font-black uppercase tracking-wider text-red-400 hover:text-red-300 transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={12} />
                    Esquecer Aparelho
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
              {/* Header security notice */}
              {!trustedDevice ? (
                <div className="bg-amber-500/10 border border-amber-500/25 p-3.5 rounded-2xl flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-400 block">NOVO DISPOSITIVO DETECTADO</span>
                    <p className="text-[9.5px] text-zinc-300 font-medium">Digite sua senha para autenticar e salvar o acesso neste aparelho.</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center pb-1">
                  <button
                    type="button"
                    onClick={() => setShowDirectAccess(true)}
                    className="text-[9px] font-black text-[#FF2D55] uppercase tracking-widest hover:underline flex items-center gap-1.5 italic"
                  >
                    <ArrowLeft size={12} /> VOLTAR PARA ACESSO RÁPIDO
                  </button>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">{getDeviceLabel()}</span>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] sm:text-[10px] p-4 rounded-[1.5rem] text-center font-black uppercase tracking-wider animate-pulse italic">
                  {error}
                </div>
              )}

              {/* UNIDADE EXCLUSIVA: AUTO MECÂNICA KAEN */}
              <div className="p-4 bg-zinc-950/90 border border-white/10 rounded-2xl flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-3.5 text-left">
                  <div className="w-10 h-10 rounded-xl bg-[#FF2D55]/15 border border-[#FF2D55]/30 flex items-center justify-center text-[#FF2D55] shrink-0">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-[0.25em] text-[#FF2D55] block">OFICINA OFICIAL CONECTADA</span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">AUTO MECÂNICA KAEN</h4>
                    <span className="text-[8.5px] text-zinc-500 font-mono">Unidade Matriz Oficial • Registro/SP</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[8px] font-black uppercase tracking-wider">ONLINE</span>
                </div>
              </div>

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
                          setPassword('');
                          setError('');
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

              {/* PASSWORD FIELD - ALWAYS REQUIRED */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-4">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] italic">SENHA DE ACESSO</label>
                  <button 
                    type="button" 
                    onClick={() => setShowRecoveryModal(true)} 
                    className="text-[#FF2D55] text-[9px] font-bold uppercase tracking-widest italic hover:underline"
                  >
                    RECUPERAR SENHA
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="DIGITE A SUA SENHA"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-6 py-4 text-white text-center focus:border-[#FF2D55]/50 outline-none transition-all font-black text-xs tracking-widest shadow-inner"
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

              {/* REMEMBER DEVICE CHECKBOX */}
              <div 
                onClick={() => setRememberDevice(!rememberDevice)}
                className="flex items-start gap-3 p-3.5 bg-zinc-950/70 border border-white/5 hover:border-white/15 rounded-2xl cursor-pointer transition-all select-none text-left"
              >
                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors mt-0.5
                  ${rememberDevice ? 'bg-[#FF2D55] border-[#FF2D55] text-white' : 'bg-black border-white/20'}`}>
                  {rememberDevice && <CheckCircle2 size={14} />}
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9.5px] font-black uppercase tracking-wider text-zinc-200">
                    Lembrar e salvar este dispositivo
                  </p>
                  <p className="text-[8px] text-zinc-500 leading-tight">
                    Dispositivos salvos permanecem autorizados. Dispositivos novos ou desconhecidos sempre exigirão a senha.
                  </p>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#FF2D55] hover:bg-[#ff1744] py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] text-white flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_15px_40px_rgba(255,45,85,0.35)] italic"
              >
                <Lock size={16} />
                <span>EFETUAR AUTENTICAÇÃO</span>
              </button>

              {/* ACESSO ADMINISTRATIVO RESTRITO PARA CRIAÇÃO DE SALAS - PROTEGIDO COM SENHA */}
              <div className="pt-2 text-center border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setMasterPasswordInput('');
                    setMasterAuthError('');
                    setShowMasterAuthModal(true);
                  }}
                  className="text-zinc-600 hover:text-zinc-400 text-[8.5px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-1.5 mx-auto py-1"
                >
                  <Lock size={11} />
                  <span>Criar Nova Sala (Requer Senha Master)</span>
                </button>
              </div>
            </form>
          )}
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

      {/* MASTER AUTH MODAL - GATES ROOM CREATION */}
      {showMasterAuthModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0D0D0E] border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative">
            <div className="text-center space-y-4 mb-6">
              <div className="w-12 h-12 bg-[#FF2D55]/10 text-[#FF2D55] border border-[#FF2D55]/20 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black italic uppercase text-white tracking-widest leading-none">AUTORIZAÇÃO MASTER</h3>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-2">
                  A criação de novas salas é restrita. Digite a senha do Administrador Master para continuar.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyMasterPassword} className="space-y-5">
              <div className="space-y-2 text-left">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block ml-2">SENHA DO ADMINISTRADOR MASTER</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="DIGITE A SENHA MASTER"
                    value={masterPasswordInput}
                    onChange={(e) => setMasterPasswordInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3.5 text-white text-xs font-mono outline-none focus:border-[#FF2D55]/50 transition-all tracking-widest text-center shadow-inner"
                  />
                </div>
              </div>

              {masterAuthError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[9.5px] p-3.5 rounded-xl text-center font-black uppercase italic leading-tight">
                  {masterAuthError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMasterAuthModal(false);
                    setMasterPasswordInput('');
                    setMasterAuthError('');
                  }}
                  className="flex-1 bg-zinc-900 text-zinc-400 py-3.5 rounded-xl font-bold uppercase text-[9px] tracking-widest hover:text-white transition-all border border-white/5"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#FF2D55] text-white py-3.5 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-[0_10px_25px_rgba(255,45,85,0.25)] italic flex items-center justify-center gap-2"
                >
                  <Lock size={14} />
                  <span>AUTORIZAR</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROOM CREATOR MODAL */}
      {showRoomCreator && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0D0D0E] border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative">
            <div className="text-center space-y-4 mb-8">
              <div className="w-12 h-12 bg-[#FF2D55]/10 text-[#FF2D55] border border-[#FF2D55]/20 rounded-2xl flex items-center justify-center mx-auto">
                <Wrench size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black italic uppercase text-white tracking-widest leading-none">CRIAR SALA INTELIGENTE</h3>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-2">REGISTRE UM AMBIENTE COMPARTILHADO SÍNCRONO</p>
              </div>
            </div>

            <form onSubmit={handleCreateRoomSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block ml-2 text-left">NOME DA OFICINA / CONTRATO</label>
                <input 
                  type="text" 
                  required
                  placeholder="EX: KAEN CARS AUTOMOTIVE"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-white text-xs font-black uppercase outline-none focus:border-[#FF2D55]/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block ml-2 text-left">ID DA SALA (APENAS LETRAS E NÚMEROS)</label>
                <input 
                  type="text" 
                  required
                  placeholder="EX: kaen_leste"
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value.toLowerCase().trim().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-white text-xs font-black outline-none focus:border-[#FF2D55]/50 transition-all font-mono"
                />
                <span className="text-[7px] text-zinc-600 block leading-tight px-1 uppercase">USADO PARA CONECTAR APARELHOS CLIENTES</span>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block ml-2 text-left">SENHA DE ACESSO DA SALA</label>
                <input 
                  type="password" 
                  required
                  placeholder="SENHA PRIVADA"
                  value={newRoomPassword}
                  onChange={(e) => setNewRoomPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-white text-xs font-mono outline-none focus:border-[#FF2D55]/50 transition-all tracking-widest text-center"
                />
              </div>

              {roomCreatorError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] p-4 rounded-xl text-center font-black uppercase italic leading-tight">
                  {roomCreatorError}
                </div>
              )}

              {roomCreatorSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-center p-4 rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center justify-center gap-2">
                  <CheckCircle size={16} />
                  <span>{roomCreatorSuccess}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setShowRoomCreator(false);
                    setRoomCreatorError('');
                    setRoomCreatorSuccess('');
                  }}
                  className="flex-1 bg-zinc-900 text-zinc-400 py-3.5 rounded-xl font-bold uppercase text-[9px] tracking-widest hover:text-white transition-all border border-white/5"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit"
                  disabled={isCreatingRoom}
                  className="flex-1 bg-[#FF2D55] text-white py-3.5 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-[0_10px_25px_rgba(255,45,85,0.25)] italic flex items-center justify-center gap-2"
                >
                  {isCreatingRoom ? <RefreshCw className="animate-spin" size={14} /> : 'REGISTRAR SALA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
