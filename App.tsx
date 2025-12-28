
import React, { useState, useEffect } from 'react';
import { db, ref, onValue, onDisconnect, set, serverTimestamp, get } from './firebase';
import { AppTheme, UserAccount, UserRole, GlobalSettings } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import DailySales from './components/DailySales';
import SalesLog from './components/SalesLog';
import { InventoryRegistration, InventoryLog } from './components/InventorySection';
import { CompetitorPrices, CompetitorReports } from './components/CompetitorSection';
import VacationSection from './components/VacationSection';
import Settings from './components/Settings';
import Notifications from './components/Notifications';

const DEFAULT_SETTINGS: GlobalSettings = {
  appTitle: 'Soft Rose Modern Trade',
  whatsapp: '',
  ticker: { text: '', showSales: true, active: true },
  sidebarVisibility: { salesLog: true, inventoryLog: true, competitorReports: true }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<string>('daily-sales');
  const [theme, setTheme] = useState<AppTheme>(AppTheme.LIGHT);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const savedUser = localStorage.getItem('softrose_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const connectedRef = ref(db, '.info/connected');
    onValue(connectedRef, (snapshot) => {
      const isOnline = !!snapshot.val();
      setIsConnected(isOnline);
      if (isOnline) {
        const userStatusRef = ref(db, `status/${currentUser.id}`);
        onDisconnect(userStatusRef).set(false);
        set(userStatusRef, true);
      }
    });

    onValue(ref(db, 'settings'), s => {
      if (s.exists()) {
        const data = s.val();
        // Robust merge to ensure nested objects like sidebarVisibility exist
        setGlobalSettings({
          ...DEFAULT_SETTINGS,
          ...data,
          ticker: { ...DEFAULT_SETTINGS.ticker, ...data.ticker },
          sidebarVisibility: { ...DEFAULT_SETTINGS.sidebarVisibility, ...data.sidebarVisibility }
        });
      }
    });
    
    onValue(ref(db, 'users'), snapshot => {
      if (snapshot.exists()) {
        const users = Object.values(snapshot.val()) as UserAccount[];
        setAllUsers(users);
        const freshSelf = users.find(u => u.id === currentUser.id);
        if (freshSelf && JSON.stringify(freshSelf.permissions) !== JSON.stringify(currentUser.permissions)) {
           setCurrentUser(freshSelf);
           localStorage.setItem('softrose_user', JSON.stringify(freshSelf));
        }
      }
    });

    onValue(ref(db, 'status'), (snapshot) => setOnlineUsers(snapshot.val() || {}));

  }, [currentUser?.id]);

  const handleLogout = () => {
    if (currentUser) set(ref(db, `status/${currentUser.id}`), false);
    localStorage.removeItem('softrose_user');
    setCurrentUser(null);
  };

  const getThemeClass = () => {
    switch (theme) {
      case AppTheme.DARK: return 'bg-gray-900 text-white';
      case AppTheme.GLASS: return 'bg-gradient-to-br from-rose-50 to-white text-gray-800';
      case AppTheme.PROFESSIONAL_BLUE: return 'bg-slate-100 text-slate-900';
      case AppTheme.PROFESSIONAL_GREEN: return 'bg-emerald-50 text-emerald-900';
      default: return 'bg-gray-50 text-gray-900';
    }
  };

  if (!currentUser) return <Login onLogin={setCurrentUser} />;

  const renderContent = () => {
    // Pass safety fallbacks for visibility settings
    const visibility = globalSettings.sidebarVisibility || DEFAULT_SETTINGS.sidebarVisibility;

    switch (activeTab) {
      case 'daily-sales': return <DailySales user={currentUser} />;
      case 'sales-log': return <SalesLog user={currentUser} permissions={visibility} />;
      case 'inventory-reg': return <InventoryRegistration user={currentUser} />;
      case 'inventory-log': return <InventoryLog user={currentUser} visibility={visibility.inventoryLog} />;
      case 'competitor-prices': return <CompetitorPrices user={currentUser} />;
      case 'competitor-reports': return <CompetitorReports user={currentUser} visibility={visibility.competitorReports} />;
      case 'vacations': return <VacationSection user={currentUser} />;
      case 'settings': return <Settings user={currentUser} onUpdateSettings={setGlobalSettings} />;
      default: return <DailySales user={currentUser} />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-all duration-300 ${getThemeClass()}`}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        user={currentUser}
        theme={theme}
        setTheme={setTheme}
        onlineUsers={onlineUsers}
        allUsers={allUsers}
        globalVisibility={globalSettings.sidebarVisibility || DEFAULT_SETTINGS.sidebarVisibility}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md shadow-sm p-4 flex flex-col items-center gap-2 relative border-b z-30">
          <div className="flex justify-between w-full items-center">
             <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
                <h1 className="text-xl font-black text-rose-600 tracking-tight">{globalSettings.appTitle || 'Soft Rose Modern Trade'}</h1>
             </div>
             <div className="flex items-center gap-3">
               <Notifications user={currentUser} allUsers={allUsers} />
               {globalSettings.whatsapp && (
                 <a href={`https://wa.me/${globalSettings.whatsapp}`} target="_blank" className="bg-green-500 text-white p-2.5 rounded-full shadow-lg hover:bg-green-600 hover:scale-110 transition active:scale-95">
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.767 5.767 0 1.267.405 2.436 1.093 3.388l-1.156 4.221 4.318-1.132c.907.54 1.965.856 3.097.856 3.181 0 5.767-2.586 5.767-5.767 0-3.181-2.586-5.767-5.767-5.767zm4.611 8.219c-.21.594-1.211 1.134-1.681 1.189-.47.054-.941.054-3.181-.865-2.24-.919-3.661-3.219-3.771-3.369-.11-.15-.891-1.185-.891-2.26s.561-1.611.761-1.836c.2-.225.441-.281.591-.281s.3.001.431.011c.141.011.331-.051.521.411.2.46.681 1.661.741 1.78.06.12.1.261.02.431-.08.17-.121.281-.241.421-.12.14-.251.31-.36.421-.12.12-.24.25-.1.49.141.24.621 1.021 1.331 1.651.91.81 1.681 1.06 1.921 1.18.24.12.38.1.521-.06.141-.16.601-.701.761-.941.16-.241.32-.201.541-.121.22.081 1.391.656 1.631.776.24.12.4.18.46.28.061.1.061.581-.149 1.175z"/></svg>
                 </a>
               )}
             </div>
          </div>
          {globalSettings.ticker?.active && (
            <div className="ticker-wrap rounded-full shadow-inner bg-gray-50 border w-full h-8 flex items-center">
              <div className="ticker text-rose-700 font-bold px-4 text-sm">
                {globalSettings.ticker.text} {globalSettings.ticker.showSales && " | مبيعات الشهر: أداء متميز ومستمر"}
              </div>
            </div>
          )}
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className={`max-w-6xl mx-auto rounded-[2rem] p-4 md:p-8 transition-all ${theme === AppTheme.GLASS ? 'glass-effect' : 'bg-white shadow-xl'}`}>
            {renderContent()}
          </div>
        </section>

        <footer className="text-center py-4 text-[10px] text-gray-400 border-t bg-white/50 backdrop-blur">
          مع تحيات المطور <span className="font-bold text-rose-500">Amir Lamay</span>
        </footer>
      </main>
    </div>
  );
};

export default App;
