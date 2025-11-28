import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// 1. SUPABASE SETUP (ডাটাবেস)
// ==========================================
const supabaseUrl = 'https://xxyopmjulslhamaglkvy.supabase.co';
const supabaseKey = 'sb_publishable_tR0dnEoQOhQYITOJJlvh-A_WtKZ9czg';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 2. TELEGRAM SETUP (মেসেজ)
// ==========================================
const TELEGRAM_BOT_TOKEN = "8519916191:AAHF6c7iNnf9a9NE6f0_vhQq0XCo1qku3gE";
const TELEGRAM_CHAT_ID = "5834441670";

// ==========================================
// 3. ADMIN CREDENTIALS
// ==========================================
const ADMIN_EMAIL = "tmmasuk247@gmail.com";
const ADMIN_PASS = "Shukhpakhi2021@#00";

// ==========================================
// DATA
// ==========================================
const PACKAGES = [
  { id: 'w1', name: 'উইকলি মেম্বারশিপ', price: 155, category: 'membership' },
  { id: 'm1', name: 'মান্থলি মেম্বারশিপ', price: 770, category: 'membership' },
  { id: 'd1', name: '২৫ ডায়মন্ড', price: 24, category: 'diamond' },
  { id: 'd2', name: '৫০ ডায়মন্ড', price: 38, category: 'diamond' },
  { id: 'd3', name: '১১৫ ডায়মন্ড', price: 80, category: 'diamond' },
  { id: 'd4', name: '২৪০ ডায়মন্ড', price: 160, category: 'diamond' },
  { id: 'd5', name: '৩৫৫ ডায়মন্ড', price: 245, category: 'diamond' },
  { id: 'd6', name: '৫০৫ ডায়মন্ড', price: 350, category: 'diamond' },
  { id: 'd7', name: '৬১০ ডায়মন্ড', price: 410, category: 'diamond' },
  { id: 'd8', name: '৮৫০ ডায়মন্ড', price: 570, category: 'diamond' },
  { id: 'd9', name: '১০৯০ ডায়মন্ড', price: 750, category: 'diamond' },
];

const PAYMENT_METHODS = [
  { id: 'bkash', name: 'বিকাশ', color: 'bg-pink-600', numbers: [{ label: 'Personal', number: '01845793151' }, { label: 'Merchant', number: '01700664000' }] },
  { id: 'nagad', name: 'নগদ', color: 'bg-orange-600', numbers: [{ label: 'Personal', number: '01700664000' }] },
  { id: 'rocket', name: 'রকেট', color: 'bg-purple-600', numbers: [{ label: 'Personal', number: '01700664000' }] },
];

export default function App() {
  const [view, setView] = useState('home'); 
  const [user, setUser] = useState(null); 
  const [orders, setOrders] = useState([]);
  
  // Login State
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');

  // Order State
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Money State
  const [addAmount, setAddAmount] = useState('');
  const [addMethod, setAddMethod] = useState('');
  const [addTrx, setAddTrx] = useState('');

  // Admin State
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [allOrders, setAllOrders] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if(user) fetchMyOrders();
  }, [user, view]);

  useEffect(() => {
    if(isAdmin) fetchAllOrders();
  }, [isAdmin, view]);

  const fetchMyOrders = async () => {
    if(!user) return;
    const { data } = await supabase.from('orders').select('*').eq('customer_phone', user.phone).order('created_at', { ascending: false });
    if(data) setOrders(data);
  };

  const fetchAllOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if(data) setAllOrders(data);
  };

  const handleLogin = () => {
    if(!loginName || !loginPhone) return alert("নাম এবং ফোন নাম্বার দিন");
    const newUser = { name: loginName, phone: loginPhone, balance: 0 };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    setView('home');
  };

  const handleAdminLogin = () => {
    if(adminEmailInput === ADMIN_EMAIL && adminPassInput === ADMIN_PASS) { 
        setIsAdmin(true);
        setView('admin_dashboard');
    } else {
        alert("ভুল ইমেইল বা পাসওয়ার্ড");
    }
  };

  const updateStatus = async (id, newStatus) => {
      await supabase.from('orders').update({ status: newStatus }).eq('id', id);
      fetchAllOrders(); 
  };

  const sendTelegramMsg = async (text) => {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text, parse_mode: 'Markdown' })
      });
    } catch (e) { console.error(e); }
  };

  const handleSubmitOrder = async () => {
    if (!user) return alert("অর্ডার করতে লগইন করুন");
    if (!selectedPkg || !playerId || !selectedMethod || !mobileNumber || !trxId) return alert('সব তথ্য পূরণ করুন');

    setIsSubmitting(true);

    const { error } = await supabase.from('orders').insert([{
          customer_name: user.name,
          customer_phone: user.phone,
          player_id: playerId,
          package_name: selectedPkg.name,
          price: selectedPkg.price.toString(),
          payment_method: selectedMethod,
          trx_id: trxId,
          status: 'Pending' 
        }]);

    if (error) {
        setIsSubmitting(false);
        alert("সমস্যা হয়েছে!");
    } else {
        // TELEGRAM MESSAGE WITH ADMIN LINK
        const adminLink = window.location.href; // লিংকে ক্লিক করলে সাইটে যাবে
        const msg = `
🔥 *নতুন অর্ডার এসেছে!*
------------------------------
👤 *কাস্টমার:* ${user.name}
📱 *ফোন:* ${user.phone}
🎮 *প্যাকেজ:* ${selectedPkg.name}
💰 *দাম:* ${selectedPkg.price} টাকা
🆔 *UID:* \`${playerId}\`
📝 *TrxID:* \`${trxId}\`
------------------------------
👉 [অর্ডার কনফার্ম করতে এখানে ক্লিক করুন](${adminLink})
        `;
        await sendTelegramMsg(msg);
        setIsSubmitting(false);
        alert("অর্ডার সফল হয়েছে!");
        fetchMyOrders();
        setView('history');
    }
  };

  const handleAddMoneyRequest = async () => {
      if(!addAmount || !addMethod || !addTrx) return alert("সব তথ্য দিন");
      setIsSubmitting(true);
      
      const adminLink = window.location.href;
      const msg = `
💰 *অ্যাড মানি রিকোয়েস্ট!*
👤 নাম: ${user.name} (${user.phone})
💵 পরিমাণ: ${addAmount} টাকা
💳 মেথড: ${addMethod}
📝 TrxID: \`${addTrx}\`
------------------------------
👉 [চেক করতে এখানে ক্লিক করুন](${adminLink})
      `;
      
      await sendTelegramMsg(msg);
      setIsSubmitting(false);
      alert("রিকোয়েস্ট পাঠানো হয়েছে!");
      setAddAmount(''); setAddTrx('');
  };

  if (view === 'admin' && !isAdmin) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
                  <h2 className="text-xl font-bold mb-4 text-center">অ্যাডমিন লগইন</h2>
                  <input type="email" value={adminEmailInput} onChange={e=>setAdminEmailInput(e.target.value)} placeholder="Email" className="w-full border p-2 mb-3 rounded"/>
                  <input type="password" value={adminPassInput} onChange={e=>setAdminPassInput(e.target.value)} placeholder="Password" className="w-full border p-2 mb-4 rounded"/>
                  <button onClick={handleAdminLogin} className="w-full bg-black text-white p-2 rounded font-bold">লগইন</button>
                  <button onClick={()=>setView('home')} className="w-full mt-2 text-gray-500 text-sm">ব্যাক</button>
              </div>
          </div>
      )
  }

  if (view === 'admin_dashboard' && isAdmin) {
      return (
          <div className="min-h-screen bg-gray-100 p-4 font-sans">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">অ্যাডমিন প্যানেল</h2>
                  <button onClick={()=>{setIsAdmin(false); setView('home')}} className="bg-red-500 text-white px-4 py-2 rounded font-bold">লগআউট</button>
              </div>
              <div className="space-y-4">
                  {allOrders.map(order => (
                      <div key={order.id} className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
                          <div className="flex justify-between font-bold">
                              <span>#{order.id} - {order.package_name}</span>
                              <span className={`px-2 rounded text-sm ${order.status==='Success'?'bg-green-100 text-green-700': order.status==='Pending'?'bg-yellow-100 text-yellow-700':'bg-red-100'}`}>{order.status}</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>👤 {order.customer_name} ({order.customer_phone})</div>
                              <div>🆔 {order.player_id}</div>
                              <div>💰 ৳{order.price} ({order.payment_method})</div>
                              <div>📝 {order.trx_id}</div>
                          </div>
                          {order.status === 'Pending' && (
                              <div className="mt-3 flex gap-2">
                                  <button onClick={()=>updateStatus(order.id, 'Success')} className="bg-green-600 text-white px-4 py-1 rounded text-sm font-bold">Confirm</button>
                                  <button onClick={()=>updateStatus(order.id, 'Rejected')} className="bg-red-600 text-white px-4 py-1 rounded text-sm font-bold">Reject</button>
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      )
  }

  if (!user) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">লগইন করুন</h2>
                <div className="space-y-4">
                    <input type="text" value={loginName} onChange={e=>setLoginName(e.target.value)} className="w-full border p-3 rounded-lg" placeholder="আপনার নাম"/>
                    <input type="tel" value={loginPhone} onChange={e=>setLoginPhone(e.target.value)} className="w-full border p-3 rounded-lg" placeholder="মোবাইল নাম্বার"/>
                    <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">এগিয়ে যান</button>
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-20">
      <div className="bg-white shadow px-4 py-3 flex justify-between items-center sticky top-0 z-50">
          <div className="font-bold text-xl text-blue-700">GameShop BD</div>
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">{user.name.charAt(0)}</div>
      </div>

      {view === 'home' && (
          <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="bg-blue-600 rounded-2xl p-6 text-white mb-6 shadow text-center">
                  <h1 className="text-2xl font-bold">ফ্রি ফায়ার টপ-আপ</h1>
                  <p className="text-sm opacity-90">Supabase + Telegram Powered</p>
              </div>

              <div className="bg-white rounded-2xl shadow p-5 mb-5">
                <h3 className="font-bold mb-4 border-l-4 border-blue-600 pl-3">প্যাকেজ সিলেক্ট করুন</h3>
                <div className="grid grid-cols-2 gap-3">
                    {PACKAGES.map((pkg) => (
                        <div key={pkg.id} onClick={() => setSelectedPkg(pkg)} className={`p-3 rounded-xl border cursor-pointer text-center ${selectedPkg?.id === pkg.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:shadow-sm'}`}>
                            <div className="font-bold text-sm text-gray-700">{pkg.name}</div>
                            <div className="text-blue-600 font-bold">৳ {pkg.price}</div>
                        </div>
                    ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow p-5 mb-5 space-y-4">
                  <h3 className="font-bold border-l-4 border-blue-600 pl-3">অর্ডার ইনফরমেশন</h3>
                  <input type="text" value={playerId} onChange={e=>setPlayerId(e.target.value)} placeholder="প্লেয়ার আইডি (UID)" className="w-full border p-3 rounded-lg bg-slate-50"/>
                  
                  <div className="grid grid-cols-3 gap-2">
                      {['bkash', 'nagad', 'rocket'].map(m => (
                          <button key={m} onClick={()=>setSelectedMethod(m)} className={`p-2 border rounded-lg uppercase text-sm font-bold ${selectedMethod===m ? 'bg-slate-800 text-white' : 'bg-white'}`}>{m}</button>
                      ))}
                  </div>

                  {selectedMethod && (
                      <div className="bg-slate-100 p-3 rounded-lg text-sm">
                           <p className="font-bold text-center mb-2">টাকা পাঠানোর নাম্বার:</p>
                           {PAYMENT_METHODS.find(pm=>pm.id===selectedMethod).numbers.map((n,i)=>(
                              <div key={i} className="flex justify-between bg-white p-2 rounded mb-1 border">
                                  <span>{n.number} ({n.label})</span>
                              </div>
                          ))}
                      </div>
                  )}

                  <input type="text" value={mobileNumber} onChange={e=>setMobileNumber(e.target.value)} placeholder="আপনার নাম্বার" className="w-full border p-3 rounded-lg bg-slate-50"/>
                  <input type="text" value={trxId} onChange={e=>setTrxId(e.target.value)} placeholder="TrxID" className="w-full border p-3 rounded-lg bg-slate-50 uppercase"/>
                  
                  <button onClick={handleSubmitOrder} disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg">
                      {isSubmitting ? 'প্রসেসিং...' : 'অর্ডার কনফার্ম করুন'}
                  </button>
              </div>
          </div>
      )}

      {view === 'history' && (
          <div className="max-w-md mx-auto px-4 py-6">
              <h2 className="text-xl font-bold mb-4">অর্ডার হিস্ট্রি</h2>
              <div className="space-y-3">
                  {orders.map((order) => (
                      <div key={order.id} className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-400">
                          <div className="flex justify-between font-bold text-slate-800">
                              <span>{order.package_name}</span>
                              <span className={`px-2 rounded text-xs ${order.status==='Success'?'bg-green-100 text-green-700': order.status==='Pending'?'bg-yellow-100 text-yellow-700':'bg-red-100'}`}>{order.status}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-500 mt-1">
                              <span>ID: {order.player_id}</span>
                              <span>৳ {order.price}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">TrxID: {order.trx_id}</div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {view === 'wallet' && (
          <div className="max-w-md mx-auto px-4 py-6">
              <h2 className="text-xl font-bold mb-4">অ্যাড মানি (Add Money)</h2>
              <div className="bg-white p-5 rounded-2xl shadow space-y-4">
                  <div className="bg-blue-50 p-4 rounded-xl text-center mb-4">
                      <p className="text-sm text-gray-600">আপনার বর্তমান ব্যালেন্স</p>
                      <h3 className="text-2xl font-bold text-blue-600">৳ 0.00</h3>
                  </div>
                  <input type="number" value={addAmount} onChange={e=>setAddAmount(e.target.value)} placeholder="টাকার পরিমাণ (যেমন: 100)" className="w-full border p-3 rounded-lg"/>
                  <select value={addMethod} onChange={e=>setAddMethod(e.target.value)} className="w-full border p-3 rounded-lg bg-white">
                      <option value="">মেথড সিলেক্ট করুন</option>
                      <option value="Bkash">Bkash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket</option>
                  </select>
                  
                  {addMethod && (
                       <div className="bg-slate-100 p-3 rounded-lg text-sm">
                           <p className="font-bold text-center mb-2">টাকা পাঠানোর নাম্বার:</p>
                           {PAYMENT_METHODS.find(pm=>pm.name=== (addMethod==='Bkash'?'বিকাশ': addMethod==='Nagad'?'নগদ':'রকেট') )?.numbers.map((n,i)=>(
                              <div key={i} className="flex justify-between bg-white p-2 rounded mb-1 border">
                                  <span>{n.number}</span>
                              </div>
                          ))}
                       </div>
                  )}

                  <input type="text" value={addTrx} onChange={e=>setAddTrx(e.target.value)} placeholder="TrxID" className="w-full border p-3 rounded-lg uppercase"/>
                  <button onClick={handleAddMoneyRequest} disabled={isSubmitting} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">
                      {isSubmitting ? 'পাঠানো হচ্ছে...' : 'রিকোয়েস্ট পাঠান'}
                  </button>
              </div>
          </div>
      )}

      <div className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around py-3 z-50 text-xs font-bold text-gray-500">
          <button onClick={()=>setView('home')} className={`flex flex-col items-center ${view==='home'?'text-blue-600':''}`}><span className="text-xl">🏠</span>হোম</button>
          <button onClick={()=>setView('history')} className={`flex flex-col items-center ${view==='history'?'text-blue-600':''}`}><span className="text-xl">📜</span>হিস্ট্রি</button>
          <button onClick={()=>setView('wallet')} className={`flex flex-col items-center ${view==='wallet'?'text-blue-600':''}`}><span className="text-xl">💰</span>ওয়ালেট</button>
          <button onClick={()=>setView('admin')} className={`flex flex-col items-center ${view==='admin'?'text-red-600':''}`}><span className="text-xl">🛠️</span>অ্যাডমিন</button>
      </div>
    </div>
  );
}