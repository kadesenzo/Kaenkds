
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

  useEffect(() => {
    const savedSession = sessionStorage.getItem('kaen_session');
    if (savedSession) {
      try {
        setSession(JSON.parse(savedSession));
      } catch (e) {
        sessionStorage.removeItem('kaen_session');
      }
    }
  }, []);

  // Real-time synchronization stream
  useEffect(() => {
    if (!session) return;

    // 1. Initial Fetch from Cloud DB to LocalStorage
    const fetchInitialData = async () => {
      try {
        setSyncStatus(SyncStatus.SYNCING);
        const res = await fetch(`/api/sync/${session.username}`);
        if (res.ok) {
          const data = await res.json();
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(`kaenpro_${session.username}_${key}`, JSON.stringify(value));
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
    const connectStream = () => {
      eventSource = new EventSource(`/api/sync-stream/${session.username}`);
      eventSource.onmessage = (event) => {
        try {
          const { key, value } = JSON.parse(event.data);
          const userKey = `kaenpro_${session.username}_${key}`;
          localStorage.setItem(userKey, JSON.stringify(value));
          // Broadcast to inside React App
          window.dispatchEvent(new CustomEvent('kaen_storage_updated', { detail: { key, value } }));
        } catch (e) {
          console.error("Error processing SSE message", e);
        }
      };
      eventSource.onerror = () => {
        // Retry connection automatically
        eventSource?.close();
        setTimeout(connectStream, 5000);
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

  const handleLogin = (username: string, role: 'Dono' | 'Funcionário' | 'Recepção') => {
    const newSession: UserSession = { username, role, lastSync: new Date().toISOString() };
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
    const userKey = `kaenpro_${session.username}_${key}`;
    localStorage.setItem(userKey, JSON.stringify(data));
    
    setSyncStatus(SyncStatus.SYNCING);
    try {
      await fetch(`/api/sync/${session.username}/${key}`, {
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
          return <AdminPanel session={session} />;
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
            username={session.username}
            syncStatus={syncStatus}
            onLogout={handleLogout} 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            workspaceMode={workspaceMode}
            onWorkspaceModeChange={setWorkspaceMode}
          />
          
          <main className="flex-1 overflow-y-auto overflow-x-visible bg-[#050505] scroll-smooth overscroll-contain no-scrollbar flex flex-col items-center">
            <div className="w-full max-w-[1200px] min-h-full flex flex-col items-center overflow-x-visible">
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
        <Route path="/terminal" element={<PrivateLayout><MechanicTerminal /></PrivateLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
