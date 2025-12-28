
import React, { useState, useEffect } from 'react';
import { db, ref, onValue, set, push } from '../firebase';
import { UserAccount, Notification, UserRole } from '../types';

const Notifications: React.FC<{ user: UserAccount }> = ({ user }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<Notification | null>(null);

  useEffect(() => {
    const notesRef = ref(db, `notifications/${user.id}`);
    onValue(notesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setNotifications(Object.entries(data).map(([id, val]: any) => ({ id, ...val })).reverse());
      }
    });
  }, [user.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const openNote = (n: Notification) => {
    setActiveNote(n);
    if (!n.isRead) {
      set(ref(db, `notifications/${user.id}/${n.id}/isRead`), true);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition shadow"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border z-50 overflow-hidden">
          <div className="p-4 bg-rose-600 text-white font-bold flex justify-between">
             <span>الإشعارات والرسائل</span>
             <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.map(n => (
              <div 
                key={n.id} 
                onClick={() => openNote(n)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${!n.isRead ? 'bg-rose-50' : ''}`}
              >
                <p className="text-sm truncate font-medium">{n.message}</p>
                <span className="text-[10px] text-gray-400">{new Date(n.timestamp).toLocaleString()}</span>
              </div>
            ))}
            {notifications.length === 0 && <p className="p-8 text-center text-gray-400">لا يوجد إشعارات</p>}
          </div>
        </div>
      )}

      {activeNote && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setActiveNote(null)} className="absolute top-4 left-4 text-gray-400 hover:text-black text-2xl">✕</button>
            <h3 className="text-xl font-bold mb-6 text-rose-600 border-b pb-2">تفاصيل الرسالة</h3>
            <div className="bg-gray-50 p-6 rounded-2xl border leading-relaxed min-h-[150px]">
               {activeNote.message}
            </div>
            <div className="mt-6 flex gap-4">
               <button onClick={() => {
                  navigator.clipboard.writeText(activeNote.message);
                  alert('تم النسخ بنجاح');
               }} className="flex-1 bg-gray-100 py-3 rounded-2xl font-bold hover:bg-gray-200 transition">نسخ الرسالة</button>
               <button onClick={() => setActiveNote(null)} className="flex-1 bg-rose-600 text-white py-3 rounded-2xl font-bold shadow-lg">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
