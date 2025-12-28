
import React, { useState, useEffect } from 'react';
import { db, ref, onValue, push, serverTimestamp, remove } from '../firebase';
import { INITIAL_MARKETS, INITIAL_COMPANIES } from '../constants';
import { UserAccount, UserRole } from '../types';

export const CompetitorPrices: React.FC<{ user: UserAccount }> = ({ user }) => {
  const [market, setMarket] = useState('');
  const [company, setCompany] = useState('');
  const [items, setItems] = useState<{productName: string, price: number}[]>([]);
  const [product, setProduct] = useState('');
  const [price, setPrice] = useState(0);

  const handleSave = async () => {
    if (!market || !company || items.length === 0) return alert('أكمل البيانات');
    await push(ref(db, 'competitor_prices'), {
      marketName: market,
      companyName: company,
      items,
      date: new Date().toLocaleDateString('en-CA'),
      timestamp: serverTimestamp(),
      createdBy: user.id
    });
    alert('تم ترحيل البيانات بنجاح');
    setItems([]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-rose-600">تسجيل أسعار المنافسين</h2>
      <div className="grid grid-cols-2 gap-4">
        <select value={market} onChange={e => setMarket(e.target.value)} className="p-3 border rounded-xl">
           <option value="">الماركت...</option>
           {INITIAL_MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={company} onChange={e => setCompany(e.target.value)} className="p-3 border rounded-xl">
           <option value="">الشركة...</option>
           {INITIAL_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="bg-gray-50 p-4 rounded-xl space-y-4">
         <div className="flex gap-2">
            <input type="text" value={product} onChange={e => setProduct(e.target.value)} placeholder="اسم الصنف..." className="flex-1 p-2 border rounded"/>
            <input type="number" value={price || ''} onChange={e => setPrice(Number(e.target.value))} placeholder="السعر" className="w-24 p-2 border rounded"/>
            <button onClick={() => {
              if(!product || price <= 0) return;
              setItems([...items, {productName: product, price}]);
              setProduct(''); setPrice(0);
            }} className="bg-rose-600 text-white px-4 rounded font-bold">+</button>
         </div>
         <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex justify-between items-center bg-white p-2 border rounded text-sm">
                <span>{it.productName}</span>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-rose-600">{it.price} ج.م</span>
                  <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-500">✕</button>
                </div>
              </div>
            ))}
         </div>
      </div>
      <button onClick={handleSave} className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold text-lg shadow">حفظ الأسعار وترحيلها</button>
    </div>
  );
};

export const CompetitorReports: React.FC<{ user: UserAccount }> = ({ user }) => {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    onValue(ref(db, 'competitor_prices'), s => {
      if(s.exists()) {
        const list = Object.entries(s.val()).map(([id, val]: any) => ({ id, ...val }));
        setReports(list);
      }
    });
  }, []);

  const filteredReports = reports.filter(r => {
    // Shared Data logic: Soft Rose products visible to everyone. Others only to creator or admin.
    if (user.role === UserRole.ADMIN || user.permissions.showCompetitorReports) return true;
    if (r.companyName === "شركة سوفت روز") return true;
    return r.createdBy === user.id;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-rose-600">تقارير المنافسين</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredReports.map(r => (
          <div key={r.id} className="p-5 border rounded-3xl bg-white shadow-sm hover:shadow-md transition border-r-4 border-rose-500">
             <div className="flex justify-between items-start mb-3">
               <div>
                  <p className="text-lg font-black text-rose-700">{r.companyName}</p>
                  <p className="text-xs font-bold text-gray-400">🏢 {r.marketName}</p>
               </div>
               {user.role === UserRole.ADMIN && (
                 <button onClick={() => remove(ref(db, `competitor_prices/${r.id}`))} className="text-red-500 bg-red-50 p-1 rounded-full">🗑️</button>
               )}
             </div>
             <div className="space-y-2">
                {r.items.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                    <span className="text-gray-600">{it.productName}</span>
                    <span className="font-bold text-rose-600">{it.price} ج.م</span>
                  </div>
                ))}
             </div>
             <p className="text-[10px] text-gray-300 mt-4 text-left italic">سجل بتاريخ: {r.date}</p>
          </div>
        ))}
        {filteredReports.length === 0 && <p className="col-span-2 text-center text-gray-400 p-10">لا توجد تقارير متاحة</p>}
      </div>
    </div>
  );
};
