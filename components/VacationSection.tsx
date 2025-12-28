
import React, { useState, useEffect } from 'react';
import { db, ref, onValue, set, push, remove } from '../firebase';
import { UserAccount, VacationBalance, VacationRecord, UserRole } from '../types';

const VacationSection: React.FC<{ user: UserAccount }> = ({ user }) => {
  const [balance, setBalance] = useState<VacationBalance>({ annual: 21, casual: 7, sick: 15, exams: 0 });
  const [records, setRecords] = useState<VacationRecord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<VacationRecord>>({ type: 'annual', days: 1 });
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [selectedAdminUser, setSelectedAdminUser] = useState(user.id);

  useEffect(() => {
    // Current user balance
    onValue(ref(db, `users/${user.id}/vacationBalance`), snapshot => {
      if (snapshot.exists()) setBalance(snapshot.val());
    });

    // Load records (Users only see self, Admin sees all)
    onValue(ref(db, 'vacations'), snapshot => {
      if (snapshot.exists()) {
        const list = Object.entries(snapshot.val()).map(([id, val]: any) => ({ id, ...val })) as VacationRecord[];
        setRecords(list.filter(r => user.role === UserRole.ADMIN || r.userId === user.id));
      } else {
        setRecords([]);
      }
    });

    if (user.role === UserRole.ADMIN) {
      onValue(ref(db, 'users'), s => s.exists() && setUsersList(Object.values(s.val())));
    }
  }, [user.id, user.role]);

  const getPeriodLabel = () => {
    const today = new Date();
    let m = today.getMonth();
    let y = today.getFullYear();
    if (today.getDate() < 21) m -= 1;
    if (m < 0) { m = 11; y -= 1; }
    
    const start = new Date(y, m, 21);
    const end = new Date(y, m + 1, 20);
    return `فترة من ${start.toLocaleDateString('en-GB')} حتى ${end.toLocaleDateString('en-GB')}`;
  };

  const handleAddVacation = async () => {
    if (!formData.date || !formData.days) return alert('أدخل التاريخ وعدد الأيام');
    
    const targetId = user.role === UserRole.ADMIN ? selectedAdminUser : user.id;
    const targetUser = usersList.find(u => u.id === targetId) || user;

    // Fetch latest balance for the target user
    const balSnap = await onValue(ref(db, `users/${targetId}/vacationBalance`), s => {}, {onlyOnce: true});
    let currentBal = { annual: 21, casual: 7, sick: 15, exams: 0 };
    // Wait for real value
    const snapshot = await new Promise<any>(res => onValue(ref(db, `users/${targetId}/vacationBalance`), s => res(s.val()), {onlyOnce: true}));
    if (snapshot) currentBal = snapshot;

    const type = formData.type as keyof VacationBalance;
    if (currentBal[type] < (formData.days || 0)) return alert('الرصيد غير كافي!');

    const record = {
      ...formData,
      userId: targetId,
      userName: targetUser.employeeName,
      timestamp: Date.now(),
      monthPeriod: getPeriodLabel()
    };

    const newBalance = { ...currentBal };
    newBalance[type] -= (formData.days || 0);

    await push(ref(db, 'vacations'), record);
    await set(ref(db, `users/${targetId}/vacationBalance`), newBalance);
    
    setIsAdding(false);
    alert('تم تسجيل الإجازة وخصمها من الرصيد بنجاح');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-rose-100 pb-6">
        <div>
           <h2 className="text-3xl font-black text-rose-600 tracking-tight">إدارة رصيد الإجازات</h2>
           <p className="text-xs font-bold text-gray-400 mt-1">تتبع الأرصدة السنوية والعارضة</p>
        </div>
        {user.role === UserRole.ADMIN && (
          <button onClick={() => setIsAdding(true)} className="bg-rose-600 text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-rose-700 transition font-black">تسجيل إجازة لموظف 🌴</button>
        )}
        {user.role !== UserRole.ADMIN && (
          <button onClick={() => setIsAdding(true)} className="bg-rose-600 text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-rose-700 transition font-black">طلب إجازة 🌴</button>
        )}
      </div>

      <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-6 rounded-[2rem] text-white text-center shadow-xl shadow-rose-100">
         <p className="font-black text-lg">{getPeriodLabel()}</p>
         <p className="text-[10px] opacity-70 mt-1 uppercase tracking-widest">يتم احتساب الشهر من يوم 21 إلى 20 من الشهر التالي</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'إجازة سنوية', val: balance.annual, icon: '📅' },
          { label: 'إجازة عارضة', val: balance.casual, icon: '⚡' },
          { label: 'إجازة مرضية', val: balance.sick, icon: '🤒' },
          { label: 'إجازة امتحانات', val: balance.exams, icon: '✍️' },
        ].map(b => (
          <div key={b.label} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 text-center shadow-xl shadow-gray-50 hover:scale-105 transition duration-300 group">
            <span className="text-3xl mb-4 block transform group-hover:rotate-12 transition">{b.icon}</span>
            <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{b.label}</p>
            <p className="text-4xl font-black text-gray-800">{b.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
        <div className="p-6 bg-gray-50 font-black text-gray-400 text-[10px] tracking-[0.2em] uppercase">سجل الإجازات الأخير</div>
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead className="bg-gray-50/50 text-[10px] font-black text-gray-500 uppercase">
              <tr>
                {user.role === UserRole.ADMIN && <th className="p-5">الموظف</th>}
                <th className="p-5">التاريخ</th>
                <th className="p-5">نوع الإجازة</th>
                <th className="p-5">المدة (أيام)</th>
                <th className="p-5">الفترة المحسوبة</th>
                {user.role === UserRole.ADMIN && <th className="p-5">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/30 transition">
                  {user.role === UserRole.ADMIN && <td className="p-5 font-black text-gray-800">{r.userName}</td>}
                  <td className="p-5 font-bold text-gray-600">{r.date}</td>
                  <td className="p-5">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black ${
                      r.type === 'annual' ? 'bg-blue-50 text-blue-600' : 
                      r.type === 'casual' ? 'bg-amber-50 text-amber-600' : 
                      r.type === 'sick' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                    }`}>
                      {r.type === 'annual' ? 'سنوي' : r.type === 'casual' ? 'عارضة' : r.type === 'sick' ? 'مرضي' : 'امتحان'}
                    </span>
                  </td>
                  <td className="p-5 font-black text-rose-600">{r.days} يوم</td>
                  <td className="p-5 text-[10px] text-gray-400 font-bold">{r.monthPeriod}</td>
                  {user.role === UserRole.ADMIN && (
                    <td className="p-5">
                      <button onClick={() => confirm('سيتم حذف السجل (لن يتم استرجاع الرصيد المخصوم تلقائياً)') && remove(ref(db, `vacations/${r.id}`))} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition">🗑️</button>
                    </td>
                  )}
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={6} className="p-20 text-gray-300 font-bold italic">لا توجد إجازات مسجلة</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsAdding(false)} className="absolute top-6 left-6 text-gray-300 hover:text-rose-600 text-2xl transition">✕</button>
            <h3 className="text-2xl font-black mb-8 text-rose-600 text-center">تسجيل إجازة جديدة</h3>
            <div className="space-y-6">
              {user.role === UserRole.ADMIN && (
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-2 mr-2">اختر الموظف</label>
                  <select value={selectedAdminUser} onChange={e => setSelectedAdminUser(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold">
                    {usersList.map(u => <option key={u.id} value={u.id}>{u.employeeName}</option>)}
                  </select>
                </div>
              )}
              {user.role !== UserRole.ADMIN && (
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-2 mr-2">الموظف</label>
                  <input type="text" value={user.employeeName} disabled className="w-full p-4 bg-gray-100 border-none rounded-2xl font-bold"/>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-2 mr-2">التاريخ</label>
                  <input type="date" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold"/>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-2 mr-2">عدد الأيام</label>
                  <input type="number" value={formData.days || ''} onChange={e => setFormData({...formData, days: Number(e.target.value)})} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold" min="1"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 mb-2 mr-2">نوع الإجازة</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold">
                  <option value="annual">سنوية</option>
                  <option value="casual">عارضة</option>
                  <option value="sick">مرضية</option>
                  <option value="exams">امتحانات</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={handleAddVacation} className="flex-1 bg-rose-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-rose-700 active:scale-95 transition">تأكيد وخصم الرصيد</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VacationSection;
