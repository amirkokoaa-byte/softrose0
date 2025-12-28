
import React, { useState, useEffect } from 'react';
import { db, ref, onValue, push, serverTimestamp } from '../firebase';
import { INITIAL_MARKETS, INITIAL_PRODUCTS } from '../constants';
import { UserAccount, SaleItem, Market } from '../types';
import { formatCurrency } from '../utils';

const DailySales: React.FC<{ user: UserAccount }> = ({ user }) => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState('');
  const [customProducts, setCustomProducts] = useState<string[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [currentQuantity, setCurrentQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const marketRef = ref(db, 'markets');
    onValue(marketRef, (snapshot) => {
      const data = snapshot.val();
      // Added missing createdBy property to satisfy Market interface
      const list: Market[] = INITIAL_MARKETS.map(m => ({ id: m, name: m, createdBy: 'system' }));
      if (data) {
        Object.entries(data).forEach(([id, val]: any) => {
          list.push({ id, name: val.name, createdBy: val.createdBy });
        });
      }
      setMarkets(list);
    });

    const productsRef = ref(db, `users/${user.id}/customProducts`);
    onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) setCustomProducts(Object.values(snapshot.val()));
    });
  }, [user.id]);

  const addMarket = () => {
    const name = prompt('أدخل اسم الماركت الجديد:');
    if (name) push(ref(db, 'markets'), { name, createdBy: user.id });
  };

  const addCustomProduct = () => {
    if (customProducts.length >= 50) return alert('الحد الأقصى 50 صنف');
    const name = prompt('أدخل اسم الصنف الجديد:');
    if (name) push(ref(db, `users/${user.id}/customProducts`), name);
  };

  const addItemToSale = () => {
    if (!currentProduct || currentPrice <= 0 || currentQuantity <= 0) return;
    setSaleItems([...saleItems, { productName: currentProduct, price: currentPrice, quantity: currentQuantity }]);
    setCurrentProduct('');
    setCurrentPrice(0);
    setCurrentQuantity(1);
  };

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => saleItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleSave = async () => {
    if (!selectedMarket || saleItems.length === 0) return alert('يرجى اختيار ماركت وإضافة أصناف');
    setIsLoading(true);
    try {
      const record = {
        marketName: selectedMarket,
        items: saleItems,
        total: calculateTotal(),
        date: new Date().toLocaleDateString('en-CA'),
        timestamp: serverTimestamp(),
        createdBy: user.id,
        createdByName: user.employeeName
      };
      await push(ref(db, 'sales'), record);
      alert('تم حفظ المبيعات بنجاح');
      setSaleItems([]);
      setSelectedMarket('');
    } catch (e) {
      alert('خطأ في الحفظ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-rose-600 border-b pb-2">المبيعات اليومية</h2>
      
      <div className="flex flex-wrap items-end gap-4 bg-gray-50 p-4 rounded-xl shadow-sm border">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-bold mb-1">الماركت</label>
          <div className="flex gap-2">
            <select 
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">اختر ماركت...</option>
              {markets.map(m => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
            <button onClick={addMarket} className="bg-rose-600 text-white px-3 py-2 rounded-lg hover:bg-rose-700 transition">+</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-bold mb-1">الصنف</label>
          <div className="flex flex-col gap-2">
            <select 
              value={currentProduct}
              onChange={(e) => setCurrentProduct(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">اختر صنف...</option>
              {INITIAL_PRODUCTS.map(p => (
                <option 
                  key={p.id} 
                  value={p.name} 
                  disabled={p.isHeader} 
                  className={p.isHeader ? 'bg-gray-200 font-bold' : ''}
                >
                  {p.name}
                </option>
              ))}
              <optgroup label="أصناف مخصصة">
                {customProducts.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </optgroup>
            </select>
            <button onClick={addCustomProduct} className="text-xs text-rose-600 font-bold hover:underline self-start">+ إضافة صنف جديد</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">السعر</label>
          <input 
            type="number" 
            value={currentPrice || ''} 
            onChange={e => setCurrentPrice(Number(e.target.value))} 
            className="w-full p-2 border rounded-lg"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">الكمية</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              value={currentQuantity || ''} 
              onChange={e => setCurrentQuantity(Number(e.target.value))} 
              className="w-full p-2 border rounded-lg"
              placeholder="1"
            />
            <button onClick={addItemToSale} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">إضافة</button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">الصنف</th>
              <th className="p-3">السعر</th>
              <th className="p-3">الكمية</th>
              <th className="p-3">الإجمالي</th>
              <th className="p-3">حذف</th>
            </tr>
          </thead>
          <tbody>
            {saleItems.map((item, index) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="p-3">{item.productName}</td>
                <td className="p-3">{formatCurrency(item.price)}</td>
                <td className="p-3">{item.quantity}</td>
                <td className="p-3">{formatCurrency(item.price * item.quantity)}</td>
                <td className="p-3">
                  <button onClick={() => removeItem(index)} className="text-red-600 hover:bg-red-50 p-1 rounded">🗑️</button>
                </td>
              </tr>
            ))}
            {saleItems.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-gray-400">لا توجد أصناف مضافة بعد</td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50 font-bold">
            <tr>
              <td colSpan={3} className="p-3 text-left">إجمالي المبيعات اليومية:</td>
              <td colSpan={2} className="p-3 text-rose-600 text-lg">{formatCurrency(calculateTotal())}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <button 
        onClick={handleSave} 
        disabled={isLoading || saleItems.length === 0}
        className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-rose-700 disabled:opacity-50 transition-all transform hover:scale-[1.01]"
      >
        {isLoading ? 'جاري الحفظ...' : 'حفظ وترحيل البيانات'}
      </button>
    </div>
  );
};

export default DailySales;
