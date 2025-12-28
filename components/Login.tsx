
import React, { useState } from 'react';
import { db, ref, get } from '../firebase';
import { UserAccount } from '../types';

const Login: React.FC<{ onLogin: (user: UserAccount) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      const data = snapshot.val();

      if (data) {
        const user = Object.values(data).find((u: any) => u.username === username && u.password === password) as UserAccount;
        if (user) {
          localStorage.setItem('softrose_user', JSON.stringify(user));
          onLogin(user);
        } else if (username === 'admin' && password === 'admin') {
          // Default admin
          const adminUser: UserAccount = {
             id: 'admin_sys',
             username: 'admin',
             password: 'admin',
             role: 'admin' as any,
             employeeName: 'مدير النظام الرئيسي',
             employeeCode: '000',
             phoneNumber: '',
             // Added missing allowViewOthersSales property
             permissions: { showSalesLog: true, showInventoryLog: true, showCompetitorReports: true, showAllSales: true, allowViewOthersSales: true }
          };
          onLogin(adminUser);
        } else {
          setError('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
      } else {
        // First time initialization with admin/admin
        if (username === 'admin' && password === 'admin') {
           const adminUser: UserAccount = {
             id: 'admin_sys',
             username: 'admin',
             password: 'admin',
             role: 'admin' as any,
             employeeName: 'مدير النظام الرئيسي',
             employeeCode: '000',
             phoneNumber: '',
             // Added missing allowViewOthersSales property
             permissions: { showSalesLog: true, showInventoryLog: true, showCompetitorReports: true, showAllSales: true, allowViewOthersSales: true }
          };
          onLogin(adminUser);
        } else {
          setError('لا توجد بيانات مستخدمين');
        }
      }
    } catch (err) {
      setError('فشل في الاتصال بقاعدة البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-600 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-10 text-center">
          <div className="w-24 h-24 bg-rose-50 rounded-full mx-auto flex items-center justify-center text-5xl mb-6 shadow-inner">
            🌹
          </div>
          <h1 className="text-3xl font-black text-gray-800 mb-2">Soft Rose</h1>
          <p className="text-gray-400 font-medium">نظام التجارة الحديثة المتكامل</p>
        </div>

        <form onSubmit={handleLogin} className="p-10 bg-gray-50 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">{error}</div>}
          
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">اسم المستخدم</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-rose-100 focus:border-rose-500 outline-none transition"
              placeholder="Username"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">كلمة المرور</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-rose-100 focus:border-rose-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-rose-700 disabled:opacity-50 transform transition active:scale-95"
          >
            {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
