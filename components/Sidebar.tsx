
import React from 'react';
import { AppTheme, UserAccount, UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  user: UserAccount;
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  onlineUsers: Record<string, boolean>;
  allUsers: UserAccount[];
  globalVisibility: { salesLog: boolean; inventoryLog: boolean; competitorReports: boolean };
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onLogout, 
  user, 
  theme, 
  setTheme, 
  onlineUsers, 
  allUsers, 
  globalVisibility = { salesLog: true, inventoryLog: true, competitorReports: true } 
}) => {
  const menuItems = [
    { id: 'daily-sales', label: 'المبيعات اليومية', icon: '💰' },
    { id: 'sales-log', label: 'سجل المبيعات', icon: '📝', visible: globalVisibility?.salesLog ?? true, permission: 'showSalesLog' },
    { id: 'inventory-reg', label: 'تسجيل المخزون', icon: '📦' },
    { id: 'inventory-log', label: 'سجل المخزون', icon: '📋', visible: globalVisibility?.inventoryLog ?? true, permission: 'showInventoryLog' },
    { id: 'competitor-prices', label: 'أسعار المنافسين', icon: '📊' },
    { id: 'competitor-reports', label: 'تقارير المنافسين', icon: '📉', visible: globalVisibility?.competitorReports ?? true, permission: 'showCompetitorReports' },
    { id: 'vacations', label: 'رصيد الإجازات', icon: '🌴' },
    { id: 'settings', label: 'الإعدادات', icon: '⚙️', adminOnly: true },
  ];

  const filteredItems = menuItems.filter(item => {
    if (user.role === UserRole.ADMIN) return true;
    if (item.adminOnly) return false;
    // Check if admin has hidden this globally for users
    if (item.visible === false) return false;
    // Check individual account permission
    if (item.permission) {
      const p = user.permissions?.[item.permission as keyof typeof user.permissions];
      return p === true;
    }
    return true;
  });

  return (
    <aside className="w-full md:w-80 bg-white/90 backdrop-blur-md shadow-2xl flex flex-col z-40 md:h-screen border-l border-gray-100 transition-all duration-500 ease-in-out">
      <div className="p-8 text-center bg-gradient-to-br from-rose-600 to-rose-700 text-white shadow-xl rounded-bl-[3rem]">
        <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full mx-auto flex items-center justify-center text-4xl mb-3 shadow-lg border border-white/30 transform hover:rotate-12 transition">
          🌹
        </div>
        <h2 className="text-xl font-black tracking-tight">Soft Rose</h2>
        <p className="text-xs opacity-70 font-medium">{user.employeeName}</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full ${onlineUsers[user.id] ? 'bg-blue-400' : 'bg-gray-400'} border border-white`}></div>
            {onlineUsers[user.id] && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping opacity-50"></div>}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">{user.role === UserRole.ADMIN ? 'مدير النظام' : 'عضو'}</span>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.5rem] transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-rose-600 text-white shadow-xl shadow-rose-200 translate-x-1 font-bold scale-105' 
                : 'text-gray-500 hover:bg-rose-50 hover:text-rose-600 hover:translate-x-1'
            }`}
          >
            <span className={`text-2xl transform transition group-hover:scale-110`}>{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}

        <div className="pt-6 border-t border-gray-100 mt-6 space-y-4">
           <p className="text-[10px] font-black text-gray-300 px-5 uppercase tracking-[0.2em]">اختيار المظهر</p>
           <div className="flex justify-between px-5">
             {Object.values(AppTheme).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-125 ${theme === t ? 'border-rose-600 scale-125 shadow-lg' : 'border-transparent opacity-60'}`}
                  style={{
                    backgroundColor: t === 'light' ? '#fff' : t === 'dark' ? '#1f2937' : t === 'glass' ? '#fecdd3' : t === 'professional_blue' ? '#2563eb' : '#059669'
                  }}
                />
             ))}
           </div>
        </div>
      </nav>

      {user.role === UserRole.ADMIN && (
        <div className="p-6 bg-gray-50/50 border-t border-gray-100">
          <p className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            المتواجدون الآن
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
            {allUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 text-xs p-2 rounded-xl bg-white/50 border border-transparent hover:border-rose-100 transition">
                <div className={`w-2.5 h-2.5 rounded-full ${onlineUsers[u.id] ? 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]' : 'bg-red-500'}`}></div>
                <span className="truncate flex-1 font-bold text-gray-700">{u.employeeName}</span>
                <span className="text-[8px] font-mono text-gray-300">#{u.employeeCode}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-[1.5rem] text-red-500 hover:bg-red-50 transition-all font-black shadow-sm border border-red-50 active:scale-95"
        >
          <span>🚪</span>
          <span className="text-sm">خروج آمن</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
