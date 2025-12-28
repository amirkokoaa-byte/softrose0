
import React, { useState, useEffect } from 'react';
import { db, ref, onValue, push, serverTimestamp } from '../firebase';
import { INITIAL_MARKETS, INITIAL_PRODUCTS } from '../constants';
import { UserAccount, InventoryRecord } from '../types';
import { exportToExcel } from '../utils';

export const InventoryRegistration: React.FC<{ user: UserAccount }> = ({ user }) => {
  const [selectedMarket, setSelectedMarket] = useState('');
  const [items, setItems] = useState<{productName: string, quantity: number}[]>([]);
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentQty, setCurrentQty] = useState(0);

  const handleSave = async () => {
    if (!selectedMarket || items.length === 0) return;
    const record = {
      marketName: selectedMarket,
      items,
      date: new Date().toLocaleDateString('en-CA'),
      timestamp: serverTimestamp(),
      createdBy: user.id,
      createdByName: user.employeeName
    };
    await push(ref(db, 'inventory'), record);
    alert('تم حفظ المخزون');
    setItems([]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-rose-600">تسجيل المخزون</h2>
      <select value={selectedMarket} onChange={e => setSelectedMarket(e.target.value)} className="w-full p-3 border rounded-xl">
        <option value="">اختر الماركت...</option>
        {INITIAL_MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
         <select value={currentProduct} onChange={e => setCurrentProduct(e.target.value)} className="p-2 border rounded">
            <option value="">اختر الصنف...</option>
            {INITIAL_PRODUCTS.map(p => <option key={p.id} value={p.name} disabled={p.isHeader}>{p.name}</option>)}
         </select>
         <div className="flex gap-2">
            <input type="number" value={currentQty || ''} onChange={e => setCurrentQty(Number(e.target.value))} className="w-full p-2 border rounded" placeholder="الكمية"/>
            <button onClick={() => {
               if(!currentProduct || currentQty <= 0) return;
               setItems([...items, {productName: currentProduct, quantity: currentQty}]);
            }} className="bg-green-600 text-white px-4 rounded">إضافة</button>
         </div>
      </div>
      <table className="w-full text-center border">
        <thead><tr className="bg-gray-100"><th>الصنف</th><th>الكمية</th></tr></thead>
        <tbody>{items.map((it, i) => <tr key={i}><td>{it.productName}</td><td>{it.quantity}</td></tr>)}</tbody>
      </table>
      <button onClick={handleSave} className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold">حفظ المخزون</button>
    </div>
  );
};

export const InventoryLog: React.FC<{ user: UserAccount }> = ({ user }) => {
  const [logs, setLogs] = useState<InventoryRecord[]>([]);

  useEffect(() => {
    onValue(ref(db, 'inventory'), s => {
      if(s.exists()) setLogs(Object.values(s.val()));
    });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-rose-600">سجل المخزون</h2>
      <div className="space-y-4">
        {logs.map((log: any, i) => (
          <div key={i} className="p-4 border rounded-xl bg-white shadow-sm">
             <div className="flex justify-between font-bold text-sm mb-2">
               <span>{log.marketName}</span>
               <span>{log.date}</span>
             </div>
             <p className="text-xs text-gray-400">سجل بواسطة: {log.createdByName}</p>
             <div className="mt-2 text-xs">
                {log.items.map((it: any, j: number) => <div key={j}>{it.productName}: {it.quantity}</div>)}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
