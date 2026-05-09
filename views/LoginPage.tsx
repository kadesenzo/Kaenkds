
import React, { useState } from 'react';
import { Wrench, Eye, EyeOff, RefreshCw, Cloud, ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onLogin: (username: string, role: 'Dono' | 'Funcionário' | 'Recepção') => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('Rafael');
  const [password, setPassword] = useState('enzo1234');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    await new Promise(r => setTimeout(r, 1400));

    if (username === 'Rafael' && password === 'enzo1234') {
      onLogin(username, 'Dono');
    } else {
      setError('ACESSO BLOQUEADO: CREDENCIAIS NÃO RECONHECIDAS.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,rgba(255,45,85,0.05)_0%,transparent_70%)] pointer-events-none"></div>
      
      <button 
        onClick={() => navigate('/')}
        className="fixed top-12 left-12 text-zinc-700 hover:text-white transition-all flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.4em] italic z-50 group"
      >
        <ArrowLeft size={22} className="group-hover:-translate-x-2 transition-transform" /> VOLTAR AO SITE
      </button>

      <div className="w-full max-w-md animate-ios-slide space-y-14 flex flex-col items-center relative z-10">
        <div className="text-center space-y-8">
          <div className="w-28 h-28 bg-[#FF2D55] rounded-[3rem] flex items-center justify-center mx-auto shadow-[0_30px_70px_rgba(255,45,85,0.4)] border border-white/20">
            <Shield size={52} className="text-white" />
          </div>
          <div className="space-y-3">
            <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">KAEN</h1>
            <p className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.8em] italic">AUTENTICAÇÃO DE SEGURANÇA</p>
          </div>
        </div>

        <div className="w-full glass-card p-12 rounded-[4rem] relative overflow-hidden border border-white/5 shadow-2xl">
          {isLoggingIn && (
            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl z-20 flex flex-col items-center justify-center gap-10 px-10 text-center">
              <RefreshCw size={60} className="text-[#FF2D55] animate-spin" />
              <p className="text-[12px] font-black text-white uppercase tracking-[0.6em] italic animate-pulse">Sincronizando Workspace KAEN...</p>
            </div>
          )}

          <form className="space-y-12" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] p-7 rounded-[2rem] text-center font-black uppercase tracking-widest animate-pulse italic">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] ml-8 italic">USUÁRIO MASTER</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black border border-white/10 rounded-[2.5rem] px-10 py-7 text-white text-center focus:border-[#FF2D55]/50 outline-none transition-all font-black text-sm uppercase tracking-widest shadow-inner"/>
            </div>

            <div className="space-y-5">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] ml-8 italic">CHAVE PRIVADA</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-white/10 rounded-[2.5rem] px-10 py-7 text-white text-center focus:border-[#FF2D55]/50 outline-none transition-all font-black text-sm tracking-widest shadow-inner"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-10 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-white transition-colors"><Eye size={28} /></button>
              </div>
            </div>

            <button type="submit" className="w-full bg-[#FF2D55] py-9 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.7em] text-white flex items-center justify-center gap-6 active:scale-95 transition-all shadow-[0_25px_60px_rgba(255,45,85,0.4)]">
              <span>EFETUAR LOGIN</span>
              <Cloud size={28} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
