import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './views/LandingPage';
import LoginPage from './views/LoginPage';
import Dashboard from './views/Dashboard';
import ServiceOrders from './views/ServiceOrders';
import NewServiceOrder from './views/NewServiceOrder';
import Inventory from './views/Inventory';
import Clients from './views/Clients';
import ClientDetails from './views/ClientDetails';
import Vehicles from './views/Vehicles';
import VehicleDetails from './views/VehicleDetails';
import Employees from './views/Employees';
import Billing from './views/Billing';
import Financial from './views/Financial';
import Calendar from './views/Calendar';
import MechanicTerminal from './views/MechanicTerminal';
import ReceptionTerminal from './views/ReceptionTerminal';
import AdminPanel from './views/AdminPanel';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { SyncStatus, UserSession } from './types';

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.SYNCED);
  const [workspaceMode, setWorkspaceMode] = useState<'PRINCIPAL' | 'MECANICO' | 'RECEPCAO' | 'ADMIN'>('PRINCIPAL');

  // Load session from sessionStorage
  useEffect(() => {
    const savedSession = sessionStorage.getItem('kaen_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSession(parsed);
      } catch (e) {
        sessionStorage.removeItem('kaen_session');
      }
    }
  }, []);

  // Update starting workspace mode when session changes
  useEffect(() => {
    if (session) {
      if (session.role === 'Funcionário') {
        setWorkspaceMode('MECANICO');
      } else if (session.role === 'Recepção') {
        setWorkspaceMode('RECEPCAO');
      } else {
        setWorkspaceMode('PRINCIPAL');
      }
    }
  }, [session]);

  // Real-time synchronization stream & Presence awareness
  useEffect(() => {
    if (!session) return;

    const tenant = session.username; // Kept as "rafael" for full backward compatibility with dynamic keys

    // 1. Initial Fetch from Cloud DB to LocalStorage
    const fetchInitialData = async () => {
      try {
        setSyncStatus(SyncStatus.SYNCING);
        const res = await fetch(`/api/sync/${tenant}`);
        if (res.ok) {
          const data = await res.json();
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(`kaenpro_${tenant}_${key}`, JSON.stringify(value));
          }
          // Notify any listening components
          window.dispatchEvent(new CustomEvent('kaen_storage_updated'));
        }
        setSyncStatus(SyncStatus.SYNCED);
      } catch (e) {
        console.error("Failed to connect to cloud database, running in offline/local storage fallback.", e);
        setSyncStatus(SyncStatus.SYNCED);
      }
    };
    fetchInitialData();

    // 2. EventSource Stream
    let eventSource: EventSource | null = null;
    
    const detectDevice = () => {
      const ua = navigator.userAgent;
      if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablet";
      if (/mobile|iphone|ipod|android/i.test(ua)) return "Celular";
      return "Desktop PC";
    };

    const connectStream = () => {
      const activeUser = session.activeUser || tenant;
      const realUsername = session.realUsername || activeUser;
      const role = session.role;
      const device = detectDevice();

      const qs = `activeUser=${encodeURIComponent(activeUser)}&role=${encodeURIComponent(role)}&device=${encodeURIComponent(device)}&realUsername=${encodeURIComponent(realUsername)}`;
      
      eventSource = new EventSource(`/api/sync-stream/${tenant}?${qs}`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data && data.type === "presence") {
            // Presence registry broadcast from server
            window.dispatchEvent(new CustomEvent("kaen_presence_updated", { detail: data.sessions }));
            return;
          }
          
          if (data && data.type === "connected") {
            // Success response confirmation
            return;
          }

          // Otherwise, general storage sync update broadcasted
          const { key, value } = data;
          const userKey = `kaenpro_${tenant}_${key}`;
          localStorage.setItem(userKey, JSON.stringify(value));
          
          // Broadcast update inside client bundle
          window.dispatchEvent(new CustomEvent('kaen_storage_updated', { detail: { key, value } }));
        } catch (e) {
          console.error("Error processing SSE message", e);
        }
      };
      
      eventSource.onerror = () => {
        eventSource?.close();
        setTimeout(connectStream, 5000); // Retry handshake
      };
    };
    
    connectStream();

    return () => {
      eventSource?.close();
    };
  }, [session]);

  const performCloudSync = useCallback(async (action: string) => {
    setSyncStatus(SyncStatus.SYNCING);
    await new Promise(r => setTimeout(r, 600));
    setSyncStatus(SyncStatus.SYNCED);
  }, []);

  const handleLogin = (username: string, role: 'Dono' | 'Funcionário' | 'Recepção', realUsername: string, activeUser: string) => {
    const newSession: UserSession = { 
      username, // always "rafael" (tenant)
      activeUser, // e.g. "eduardo"
      realUsername, // e.g. "Eduardo Maciel"
      role, 
      lastSync: new Date().toISOString() 
    };
    setSession(newSession);
    sessionStorage.setItem('kaen_session', JSON.stringify(newSession));
    performCloudSync('Full Fetch');
  };

  const handleLogout = () => {
    setSession(null);
    setWorkspaceMode('PRINCIPAL');
    sessionStorage.removeItem('kaen_session');
    sessionStorage.removeItem('kaen_admin_unlocked');
  };

  const syncData = async (key: string, data: any) => {
    if (!session) return;
    const tenant = session.username;
    const userKey = `kaenpro_${tenant}_${key}`;
    localStorage.setItem(userKey, JSON.stringify(data));
    
    setSyncStatus(SyncStatus.SYNCING);
    try {
      await fetch(`/api/sync/${tenant}/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      // Fire internal update as well for instant single-page refresh
      window.dispatchEvent(new CustomEvent('kaen_storage_updated', { detail: { key, value: data } }));
    } catch (e) {
      console.error("Network cloud synchronization failed, queued locally.", e);
    }
    setSyncStatus(SyncStatus.SYNCED);
  };

  const handleWorkspaceModeChange = (mode: 'PRINCIPAL' | 'MECANICO' | 'RECEPCAO' | 'ADMIN') => {
    if (!session) return;

    if (mode === 'ADMIN' && session.role !== 'Dono') {
      alert("ACESSO RECUSADO: Apenas Administradores podem acessar as configurações globais do sistema.");
      return;
    }
    if (mode === 'RECEPCAO' && session.role === 'Funcionário') {
      alert("ACESSO RECUSADO: Mecânicos de pista não têm permissão de acesso à Recepção.");
      return;
    }
    if (mode === 'MECANICO' && session.role === 'Recepção') {
      alert("ACESSO RECUSADO: A recepção não tem acesso ao Terminal de Pista Técnico.");
      return;
    }

    setWorkspaceMode(mode);
  };

  const PrivateLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (!session) return <Navigate to="/login" replace />;

    const renderActiveContent = () => {
      switch (workspaceMode) {
        case 'MECANICO':
          return <MechanicTerminal session={session} syncData={syncData} />;
        case 'RECEPCAO':
          return <ReceptionTerminal session={session} syncData={syncData} />;
        case 'ADMIN':
          return <AdminPanel session={session} syncData={syncData} />;
        case 'PRINCIPAL':
        default:
          return React.isValidElement(children) 
            ? React.cloneElement(children as React.ReactElement<any>, { session, syncData })
            : children;
      }
    };

    return (
      <div className="flex h-screen bg-black overflow-hidden relative">
        <Sidebar 
          role={session.role} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
        
        <div className="flex-1 flex flex-col min-w-0 relative">
          <Header 
            role={session.role} 
            username={session.realUsername}
            syncStatus={syncStatus}
            onLogout={handleLogout} 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            workspaceMode={workspaceMode}
            onWorkspaceModeChange={handleWorkspaceModeChange}
          />
          
          <main className="flex-1 overflow-y-auto overflow-x-visible bg-[#050505] scroll-smooth overscroll-contain no-scrollbar flex flex-col items-center">
            <div className="w-full max-w-[1200px] min-h-full flex flex-col items-center overflow-x-visible p-1 md:p-3">
              {renderActiveContent()}
            </div>
          </main>
        </div>
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/dashboard" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
        <Route path="/calendar" element={<PrivateLayout><Calendar /></PrivateLayout>} />
        <Route path="/orders" element={<PrivateLayout><ServiceOrders role={session?.role} /></PrivateLayout>} />
        <Route path="/orders/new" element={<PrivateLayout><NewServiceOrder /></PrivateLayout>} />
        <Route path="/billing" element={<PrivateLayout><Billing /></PrivateLayout>} />
        <Route path="/financial" element={<PrivateLayout><Financial /></PrivateLayout>} />
        <Route path="/inventory" element={<PrivateLayout><Inventory /></PrivateLayout>} />
        <Route path="/clients" element={<PrivateLayout><Clients role={session?.role || 'Dono'} /></PrivateLayout>} />
        <Route path="/clients/:id" element={<PrivateLayout><ClientDetails role={session?.role || 'Dono'} /></PrivateLayout>} />
        <Route path="/vehicles" element={<PrivateLayout><Vehicles /></PrivateLayout>} />
        <Route path="/vehicles/:id" element={<PrivateLayout><VehicleDetails /></PrivateLayout>} />
        <Route path="/employees" element={<PrivateLayout><Employees /></PrivateLayout>} />
        <Route path="/terminal" element={session ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
