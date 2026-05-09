
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
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { SyncStatus, UserSession } from './types';

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.SYNCED);

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

  const performCloudSync = useCallback(async (action: string) => {
    setSyncStatus(SyncStatus.SYNCING);
    await new Promise(r => setTimeout(r, 800));
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
    sessionStorage.removeItem('kaen_session');
  };

  const syncData = async (key: string, data: any) => {
    if (!session) return;
    const userKey = `kaenpro_${session.username}_${key}`;
    localStorage.setItem(userKey, JSON.stringify(data));
    await performCloudSync(`Update ${key}`);
  };

  const PrivateLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (!session) return <Navigate to="/login" replace />;

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
          />
          
          <main className="flex-1 overflow-y-auto overflow-x-visible bg-[#050505] scroll-smooth overscroll-contain no-scrollbar flex flex-col items-center">
            <div className="w-full max-w-[1200px] min-h-full flex flex-col items-center overflow-x-visible">
              {React.isValidElement(children) 
                ? React.cloneElement(children as React.ReactElement<any>, { session, syncData })
                : children}
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
