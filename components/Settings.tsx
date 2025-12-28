
import React, { useState, useEffect } from 'react';
import { db, ref, onValue, set, remove, update, push } from '../firebase';
import { UserAccount, UserRole, UserPermissions, GlobalSettings } from '../types';

interface SettingsProps {
  user: UserAccount;
  onUpdateSettings: (s: GlobalSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateSettings }) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [newUser, setNewUser] = useState<Partial<UserAccount>>({
    role: UserRole.USER,
    permissions: { showSalesLog: true, showInventoryLog: true, showCompetitorReports: true, showAllSales: false, allowViewOthersSales: false }
  });
  const [settings, setSettings] = useState<GlobalSettings>({
    appTitle: 'Soft Rose Modern Trade',
    whatsapp: '',
    ticker: { text: '', showSales: true, active: true },
    sidebarVisibility: { salesLog: true, inventoryLog: true, competitorReports: true }
  });
  const [messageTarget, setMessageTarget] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isManagingStaff, setIsManagingStaff] = useState(false);

  useEffect(() => {
    onValue(ref(db, 'users'), snapshot => snapshot.exists() && setUsers(Object.values(snapshot.val())));
    onValue(ref(db, 'settings'), s => {
      if (s.exists()) {
        const val = s.val();
        setSettings(val);
        onUpdateSettings(val);
      }
    });
  }, []);

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.password || !newUser.employeeName) return alert('أكمل جميع البيانات');
    const userId = newUser.id || Math.random().toString(36).substr(2, 9);
    set(ref(db, `users/${userId}`), {
      ...newUser,
      id: userId,
      vacationBalance: { annual: 21, casual: 7, sick: 15, exams: 0 }
    });
    alert('تم إضافة الحساب بنجاح');
    setNewUser({ role: UserRole.USER, permissions: { showSalesLog: true, showInventoryLog: true, showCompetitorReports: true, showAllSales: false, allowViewOthersSales: false } });
  };

  const handleSaveGlobal = () => {
    set(ref(db, 'settings'), settings);
    alert('تم حفظ الإعدادات بنجاح');
  };

  const handleSendMessage = () => {
    if (!messageTarget || !messageText) return alert('اختر مستخدم واكتب رسالة');
    push(ref(db, `notifications/${messageTarget}`), {
      message: messageText,
      timestamp: Date.now(),
      isRead: false,
      senderName: user.employeeName
    });
    alert('تم إرسال الرسالة');
    setMessageText('');
  };

  const backupData = () => {
    onValue(ref(db, '/'), (snapshot) => {
      const dataStr = JSON.stringify(snapshot.val());
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SoftRose_FullBackup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    }, { onlyOnce: true });
  };

  const restoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (confirm('هل أنت متأكد؟ سيتم حذف جميع البيانات الحالية واستبدالها بالنسخة الاحتياطية.')) {
           await set(ref(db, '/'), data);
           alert('تمت استعادة البيانات بنجاح. سيتم إعادة تحميل الصفحة.');
           window.location.reload();
        }
      } catch (err) {
        alert('ملف غير صالح');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex justify-between items-center border-b border-rose-100 pb-6">
        <h2 className="text-3xl font-black text-rose-600 tracking-tight">إدارة النظام المركزية</h2>
        <div className="flex gap-2">
          <button onClick={backupData} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition">نسخة احتياطية 💾</button>
          <label className="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition cursor-pointer">
             استعادة 🔄
             <input type="file" className="hidden" accept=".json" onChange={restoreData} />
          </label>
        </div>
      </div>

      {/* Global Config */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-6">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
             <span className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center">⚙️</span>
             الإعدادات العامة
          </h3>
          <div className="space-y-4">
             <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 mr-2">اسم البرنامج بالكامل</label>
                <input type="text" value={settings.appTitle} onChange={e => setSettings({...settings, appTitle: e.target.value})} className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 ring-rose-200 outline-none transition" />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 mr-2">رقم واتساب للتواصل</label>
                <input type="text" value={settings.whatsapp} onChange={e => setSettings({...settings, whatsapp: e.target.value})} className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 ring-rose-200 outline-none transition" />
             </div>
             <div className="pt-2">
                <button onClick={handleSaveGlobal} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-rose-200 hover:bg-rose-700 transition active:scale-95">حفظ التغييرات</button>
             </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-6">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
             <span className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">📢</span>
             الشريط الإعلاني
          </h3>
          <div className="space-y-4">
             <textarea 
               value={settings.ticker.text} 
               onChange={e => setSettings({...settings, ticker: {...settings.ticker, text: e.target.value}})}
               className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 ring-blue-200 outline-none transition" 
               rows={2} 
               placeholder="اكتب نص الإعلان هنا..."
             />
             <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-sm font-bold text-gray-600">تفعيل الشريط</span>
                <input type="checkbox" checked={settings.ticker.active} onChange={e => setSettings({...settings, ticker: {...settings.ticker, active: e.target.checked}})} className="w-6 h-6 rounded-lg accent-blue-600" />
             </div>
             <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-sm font-bold text-gray-600">إظهار ملخص المبيعات</span>
                <input type="checkbox" checked={settings.ticker.showSales} onChange={e => setSettings({...settings, ticker: {...settings.ticker, showSales: e.target.checked}})} className="w-6 h-6 rounded-lg accent-blue-600" />
             </div>
          </div>
        </div>
      </section>

      {/* Visibility Permissions */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50">
          <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-3">
             <span className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center">👁️</span>
             إدارة صلاحيات العرض العامة للموظفين
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'سجل المبيعات', key: 'salesLog' },
              { label: 'سجل المخزون', key: 'inventoryLog' },
              { label: 'تقارير المنافسين', key: 'competitorReports' }
            ].map(item => (
              <div key={item.key} className="p-6 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-700">{item.label}</span>
                <button 
                  onClick={() => setSettings({...settings, sidebarVisibility: {...settings.sidebarVisibility, [item.key]: !settings.sidebarVisibility[item.key as keyof typeof settings.sidebarVisibility]}})}
                  className={`px-6 py-2 rounded-full font-black text-xs transition ${settings.sidebarVisibility[item.key as keyof typeof settings.sidebarVisibility] ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                >
                  {settings.sidebarVisibility[item.key as keyof typeof settings.sidebarVisibility] ? 'ظاهر للجميع' : 'مخفي للجميع'}
                </button>
              </div>
            ))}
          </div>
      </section>

      {/* Messaging */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-6">
        <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
           <span className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center">📧</span>
           نظام المراسلة الداخلية
        </h3>
        <div className="flex flex-col gap-4">
          <select value={messageTarget} onChange={e => setMessageTarget(e.target.value)} className="p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 ring-rose-200 outline-none transition font-bold text-gray-700">
             <option value="">اختر الموظف المستلم...</option>
             {users.map(u => <option key={u.id} value={u.id}>{u.employeeName} (#{u.employeeCode})</option>)}
          </select>
          <textarea 
            value={messageText} 
            onChange={e => setMessageText(e.target.value)}
            className="p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 ring-rose-200 outline-none transition" 
            placeholder="اكتب رسالتك للموظف (حتى 1000 حرف)..."
            maxLength={1000}
            rows={4}
          />
          <button onClick={handleSendMessage} className="bg-rose-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-rose-700 active:scale-95 transition">إرسال التنبيه الآن</button>
        </div>
      </section>

      {/* User Management */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
             <span className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center">👥</span>
             إدارة الموظفين والحسابات
          </h3>
          <button onClick={() => setIsManagingStaff(!isManagingStaff)} className="text-rose-600 font-bold hover:underline">
            {isManagingStaff ? 'إغلاق الإدارة' : 'فتح الإدارة السريعة'}
          </button>
        </div>

        {isManagingStaff && (
          <div className="bg-rose-50/50 p-8 rounded-3xl border border-rose-100 mb-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <input type="text" placeholder="كود الموظف" value={newUser.employeeCode || ''} onChange={e => setNewUser({...newUser, employeeCode: e.target.value, id: e.target.value})} className="p-4 border-none bg-white rounded-2xl" />
               <input type="text" placeholder="اسم الدخول" value={newUser.username || ''} onChange={e => setNewUser({...newUser, username: e.target.value})} className="p-4 border-none bg-white rounded-2xl" />
               <input type="password" placeholder="كلمة المرور" value={newUser.password || ''} onChange={e => setNewUser({...newUser, password: e.target.value})} className="p-4 border-none bg-white rounded-2xl" />
               <input type="text" placeholder="اسم الموظف الثلاثي" value={newUser.employeeName || ''} onChange={e => setNewUser({...newUser, employeeName: e.target.value})} className="p-4 border-none bg-white rounded-2xl" />
               <input type="text" placeholder="رقم الهاتف" value={newUser.phoneNumber || ''} onChange={e => setNewUser({...newUser, phoneNumber: e.target.value})} className="p-4 border-none bg-white rounded-2xl" />
               <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="p-4 border-none bg-white rounded-2xl font-bold">
                  <option value={UserRole.USER}>مستخدم عادي</option>
                  <option value={UserRole.ADMIN}>مدير (Admin)</option>
               </select>
             </div>
             <button onClick={handleCreateUser} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-green-700 transition">إضافة الموظف لقاعدة البيانات</button>
          </div>
        )}

        <div className="overflow-x-auto rounded-[2rem] border border-gray-100">
          <table className="w-full text-center text-xs">
            <thead className="bg-gray-50 font-black text-gray-500 uppercase tracking-widest">
              <tr>
                <th className="p-5">الموظف والكود</th>
                <th className="p-5">صلاحيات السجل</th>
                <th className="p-5">رؤية الجميع</th>
                <th className="p-5">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-5 text-right">
                    <div className="font-black text-gray-800">{u.employeeName}</div>
                    <div className="text-[10px] text-gray-400 font-mono">ID: {u.employeeCode} | User: {u.username}</div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-wrap gap-2 justify-center">
                       {[
                         { k: 'showSalesLog', l: 'مبيعات' },
                         { k: 'showInventoryLog', l: 'مخزون' },
                         { k: 'showCompetitorReports', l: 'منافسين' }
                       ].map(p => (
                         <label key={p.k} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border shadow-sm cursor-pointer">
                            <input type="checkbox" checked={u.permissions?.[p.k as keyof UserPermissions]} onChange={e => update(ref(db, `users/${u.id}/permissions`), {[p.k]: e.target.checked})} className="accent-rose-500" />
                            <span className="text-[10px] font-bold">{p.l}</span>
                         </label>
                       ))}
                    </div>
                  </td>
                  <td className="p-5">
                    <input 
                      type="checkbox" 
                      checked={u.permissions?.showAllSales} 
                      onChange={e => update(ref(db, `users/${u.id}/permissions`), {showAllSales: e.target.checked})} 
                      className="w-5 h-5 accent-rose-500"
                    />
                  </td>
                  <td className="p-5">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => {
                        const pass = prompt('أدخل كلمة المرور الجديدة:');
                        if(pass) update(ref(db, `users/${u.id}`), {password: pass});
                      }} className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition" title="تغيير الباسورد">🔑</button>
                      <button onClick={() => {
                        if(confirm('حذف الحساب نهائياً؟')) remove(ref(db, `users/${u.id}`));
                      }} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition" title="حذف">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Settings;
