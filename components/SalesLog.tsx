
import React, { useState, useEffect } from 'react';
import { db, ref, onValue, remove, update } from '../firebase';
import { UserAccount, SaleRecord, UserRole } from '../types';
import { formatCurrency, exportToExcel } from '../utils';

interface SalesLogProps {
  user: UserAccount;
  permissions: { salesLog: boolean };
}

const SalesLog: React.FC<SalesLogProps> = ({ user, permissions }) => {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterMarket, setFilterMarket] = useState('');

  useEffect(() => {
    onValue(ref(db, 'sales'), (snapshot) => {
      if (snapshot.exists()) {
        const list = Object.entries(snapshot.val()).map(([id, val]: any) => ({ id, ...val })) as SaleRecord[];
        setSales(list.sort((a, b) => b.timestamp - a.timestamp));
      }
    });
  }, []);

  const filteredSales = sales.filter(s => {
    // Permission: Show only own data unless admin OR has permission 'showAllSales'
    const canSeeOthers = user.role === UserRole.ADMIN || user.permissions.showAllSales;
    if (!canSeeOthers && s.createdBy !== user.id) return false;

    if (filterMonth && !s.date.startsWith(filterMonth)) return false;
    if (filterUser && s.createdByName !== filterUser) return false;
    if (filterMarket && s.marketName !== filterMarket) return false;
    return true;
  });

  const getTopDailySale = () => {
    const dailyTotals: Record<string, number> = {};
    filteredSales.forEach(s => {
      dailyTotals[s.date] = (dailyTotals[s.date] || 0) + s.total;
    });
    return Math.max(0, ...Object.values(dailyTotals));
  };

  const calculatePeriodStats = () => {
    const stats: Record<string, { qty: number; total: number; price: number }> = {};
    filteredSales.forEach(s => {
      s.items.forEach(it => {
        if (!stats[it.productName]) stats[it.productName] = { qty: 0, total: 0, price: it.price };
        stats[it.productName].qty += it.quantity;
        stats[it.productName].total += it.price * it.quantity;
      });
    });
    return stats;
  };

  const periodStats = calculatePeriodStats();
  const totalPeriod = Object.values(periodStats).reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-rose-100 pb-6">
        <div>
          <h2 className="text-3xl font-black text-rose-600 tracking-tight">سجل المبيعات والتقارير</h2>
          <p className="text-xs font-bold text-gray-400 mt-1">متابعة الأداء اليومي والشهري</p>
        </div>
        <button 
          onClick={() => exportToExcel('sales-report-table', `Sales_Report_${filterMonth || 'Total'}`, 'تقرير المبيعات الموحد', `الفترة: ${filterMonth || 'كامل السجل'}`)}
          className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-green-100 hover:bg-green-700 transition flex items-center gap-2"
        >
          تصدير كـ Excel 📊
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
        <div className="space-y-2">
          <label className="block text-xs font-black text-gray-400 mr-2">تصفية بالشهر</label>
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-full p-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 ring-rose-200 outline-none transition" />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-black text-gray-400 mr-2">تصفية بالماركت</label>
          <select value={filterMarket} onChange={e => setFilterMarket(e.target.value)} className="w-full p-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 ring-rose-200 outline-none transition font-bold">
            <option value="">جميع الماركتات...</option>
            {Array.from(new Set(sales.map(s => s.marketName))).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        {user.role === UserRole.ADMIN && (
          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-400 mr-2">تصفية بالموظف</label>
            <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="w-full p-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 ring-rose-200 outline-none transition font-bold">
              <option value="">جميع الموظفين...</option>
              {Array.from(new Set(sales.map(s => s.createdByName))).map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-rose-500 p-8 rounded-[2rem] text-white shadow-xl shadow-rose-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition duration-700">🏆</div>
            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">أعلى مبيعات يومية محققة</p>
            <p className="text-4xl font-black">{formatCurrency(getTopDailySale())}</p>
         </div>
         <div className="bg-slate-800 p-8 rounded-[2rem] text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition duration-700">📊</div>
            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">إجمالي مبيعات الفترة المحددة</p>
            <p className="text-4xl font-black">{formatCurrency(totalPeriod)}</p>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
        <div className="p-6 bg-gray-50 font-black text-gray-400 text-xs tracking-[0.2em] uppercase">تفاصيل المبيعات خلال الفترة</div>
        <div className="overflow-x-auto">
          <table id="sales-report-table" className="w-full text-center border-collapse">
            <thead className="bg-gray-50/50 text-[10px] font-black text-gray-500 uppercase">
              <tr>
                <th className="p-5 border-b border-gray-100">الصنف</th>
                <th className="p-5 border-b border-gray-100">الكمية المباعة</th>
                <th className="p-5 border-b border-gray-100">سعر الوحدة</th>
                <th className="p-5 border-b border-gray-100">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Object.entries(periodStats).map(([name, stat]) => (
                <tr key={name} className="hover:bg-gray-50/30 transition">
                  <td className="p-5 font-black text-gray-700">{name}</td>
                  <td className="p-5 font-bold text-gray-600">{stat.qty}</td>
                  <td className="p-5 text-gray-400 font-mono">{formatCurrency(stat.price)}</td>
                  <td className="p-5 font-black text-rose-600">{formatCurrency(stat.total)}</td>
                </tr>
              ))}
              {Object.keys(periodStats).length === 0 && (
                <tr>
                  <td colSpan={4} className="p-20 text-gray-300 font-bold italic">لا توجد بيانات لهذه الفترة</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50/80 font-black">
              <tr>
                <td colSpan={3} className="p-6 text-left text-gray-500">المجموع الكلي:</td>
                <td className="p-6 text-2xl text-rose-600">{formatCurrency(totalPeriod)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredSales.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col md:flex-row gap-6 items-center">
             <div className="flex-1 text-right w-full">
                <div className="flex justify-between items-center mb-2">
                   <h4 className="text-xl font-black text-rose-700">{s.marketName}</h4>
                   <span className="text-[10px] font-black bg-rose-50 text-rose-500 px-3 py-1 rounded-full">{s.date}</span>
                </div>
                <p className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                   المسؤول: {s.createdByName}
                </p>
                <div className="flex flex-wrap gap-2">
                   {s.items.map((it, idx) => (
                     <span key={idx} className="text-[10px] font-bold bg-gray-50 px-3 py-1 rounded-lg border">
                       {it.productName} × {it.quantity}
                     </span>
                   ))}
                </div>
             </div>
             <div className="text-center bg-gray-50 px-8 py-6 rounded-[1.5rem] border border-gray-100 min-w-[150px]">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">صافي الفاتورة</p>
                <p className="text-2xl font-black text-rose-600">{formatCurrency(s.total)}</p>
             </div>
             {user.role === UserRole.ADMIN && (
               <button 
                 onClick={() => confirm('حذف الفاتورة؟') && remove(ref(db, `sales/${s.id}`))}
                 className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition shadow-sm"
               >🗑️</button>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesLog;
