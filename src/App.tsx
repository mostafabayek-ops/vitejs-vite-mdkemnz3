import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. SUPABASE SETUP
const supabaseUrl = 'https://xxyopmjulslhamaglkvy.supabase.co';
const supabaseKey = 'sb_publishable_tR0dnEoQOhQYITOJJlvh-A_WtKZ9czg';
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. TELEGRAM SETUP
const TELEGRAM_BOT_TOKEN = "8519916191:AAHF6c7iNnf9a9NE6f0_vhQq0XCo1qku3gE";
const TELEGRAM_CHAT_ID = "5834441670";

// 3. ADMIN CREDENTIALS
const ADMIN_EMAIL = "tmmasuk247@gmail.com";
const ADMIN_PASS = "Shukhpakhi2021@#00";

const PAYMENT_METHODS = [
  { id: 'bkash', name: 'বিকাশ', type_label: 'Personal', number: '01845793151' },
  { id: 'nagad', name: 'নগদ', type_label: 'Personal', number: '01700664000' },
  { id: 'rocket', name: 'রকেট', type_label: 'Personal', number: '01700664000' },
];

export default function App() {
  const [view, setView] = useState('home'); 
  const [user, setUser] = useState(null); 
  const [packages, setPackages] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');

  const [selectedPkg, setSelectedPkg] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [addMethod, setAddMethod] = useState('');
  const [addTrx, setAddTrx] = useState('');

  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [allOrders, setAllOrders] = useState([]);
  const [adminTab, setAdminTab] = useState('game_orders');
  
  const [paymentMethods, setPaymentMethods] = useState([]); 


  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchPackages(); 
    fetchPaymentMethods();
  }, []);

  useEffect(() => { if(user || isAdmin) fetchAllOrders(); }, [user, isAdmin, view, adminTab]);

  const fetchPackages = async () => {
    const { data } = await supabase.from('packages').select('*').order('price', { ascending: true });
    if(data) setPackages(data);
  };

  const fetchPaymentMethods = async () => {
    const { data } = await supabase.from('payment_methods').select('*').order('id', { ascending: true });
    if(data) setPaymentMethods(data);
  };

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
    if (!user) { alert("লগইন করুন"); setView('login'); return; }
    if (!selectedPkg || !playerId || !selectedMethod || !mobileNumber || !trxId) return alert('সব তথ্য পূরণ করুন');
    if (trxId.length < 8) { alert("সঠিক TrxID দিন"); return; }

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
        const adminLink = "https://gameshop-bd-official.netlify.app";
        const msg = `🔥 *নতুন গেম অর্ডার!*
👤 ${user.name} (${user.phone})
🎮 ${selectedPkg.name}
💰 ${selectedPkg.price} TK
🆔 \`${playerId}\`
📝 Trx: \`${trxId}\`
👉 [অর্ডার চেক করুন](${adminLink})`;
        await sendTelegramMsg(msg);
        setIsSubmitting(false);
        alert("অর্ডার সফল হয়েছে!");
        fetchMyOrders();
        setView('history');
    }
  };

  const handleAddMoneyRequest = async () => {
      if (!user) { alert("লগইন করুন"); setView('login'); return; }
      if(!addAmount || !addMethod || !addTrx) return alert("সব তথ্য দিন");
      
      const { error } = await supabase.from('orders').insert([{
          customer_name: user.name,
          customer_phone: user.phone,
          player_id: 'Wallet',
          package_name: `Add Money: ৳${addAmount}`,
          price: addAmount,
          payment_method: addMethod,
          trx_id: addTrx,
          status: 'Pending' 
      }]);

      if (!error) {
          const adminLink = "https://gameshop-bd-official.netlify.app";
          const msg = `💰 *অ্যাড মানি রিকোয়েস্ট!*
👤 ${user.name}
💵 ${addAmount} TK (${addMethod})
📝 Trx: \`${addTrx}\`
👉 [চেক করুন](${adminLink})`;
          await sendTelegramMsg(msg);
          setIsSubmitting(false);
          alert("রিকোয়েস্ট পাঠানো হয়েছে!");
          setAddAmount(''); setAddTrx('');
          fetchMyOrders();
          setView('history');
      }
  };

  const handleNavClick = (targetView) => {
      if (targetView === 'home') setView('home');
      else {
          if (user) setView(targetView);
          else { alert("এই অপশনটি দেখতে দয়া করে লগইন করুন।"); setView('login'); }
      }
  };

  const gameOrders = allOrders.filter(o => o.player_id !== 'Wallet');
  const walletRequests = allOrders.filter(o => o.player_id === 'Wallet');


  const OrderItem = ({ order }) => (
      <div className={`bg-white p-4 rounded-xl shadow border-l-4 ${order.player_id === 'Wallet' ? 'border-green-500' : 'border-blue-500'} animate-fade-in`}>
          <div className="flex justify-between font-bold border-b pb-2 mb-2">
              <span className="text-gray-700">#{order.id} - {order.package_name}</span>
              <span className={`px-2 py-0.5 rounded text-xs ${order.status==='Success'?'bg-green-100 text-green-700': order.status==='Pending'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{order.status}</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-2">👤 {order.customer_name} ({order.customer_phone})</div>
              <div className="bg-gray-50 p-2 rounded border border-gray-100 mt-1">
                  {order.player_id !== 'Wallet' && <div className="flex justify-between"><span>UID:</span> <span className="font-mono font-bold select-all">{order.player_id}</span></div>}
                  <div className="flex justify-between"><span>TrxID:</span> <span className="font-mono font-bold text-blue-600 select-all">{order.trx_id}</span></div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1"><span>{order.payment_method}</span> <span>Amount: ৳{order.price}</span></div>
              </div>
          </div>
          {order.status === 'Pending' && isAdmin && ( // Only show buttons if isAdmin and Pending
              <div className="mt-3 grid grid-cols-2 gap-3">
                  <button onClick={()=>updateStatus(order.id, 'Success')} className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-bold transition">Confirm ✅</button>
                  <button onClick={()=>updateStatus(order.id, 'Rejected')} className="bg-red-100 hover:bg-red-200 text-red-600 py-2 rounded-lg text-sm font-bold transition">Reject ❌</button>
              </div>
          )}
      </div>
  );

  if (view === 'login') {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
                <h2 className="2xl font-bold text-center mb-6 text-slate-800">লগইন করুন</h2>
                <div className="space-y-4">
                    <input type="text" value={loginName} onChange={e=>setLoginName(e.target.value)} className="w-full border p-3 rounded-lg" placeholder="আপনার নাম"/>
                    <input type="tel" value={loginPhone} onChange={e=>setLoginPhone(e.target.value)} className="w-full border p-3 rounded-lg" placeholder="মোবাইল নাম্বার"/>
                    <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">এগিয়ে যান</button>
                    <button onClick={()=>setView('home')} className="w-full text-gray-500 text-sm mt-2">স্কিপ করুন (হোম পেজ)</button>
                </div>
            </div>
        </div>
    )
  }

  if (view === 'admin' && !isAdmin) {
      return (
          <div className="min-h-screen bg-gray-100 p-4 font-sans">
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
          <div className="min-h-screen bg-gray-100 p-4 font-sans pb-20">
              <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-xl shadow-sm">
                  <h2 className="text-xl font-bold text-slate-800">অ্যাডমিন ড্যাশবোর্ড</h2>
                  <button onClick={()=>{setIsAdmin(false); setView('home')}} className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm font-bold">লগআউট</button>
              </div>

              {/* Simplified Tabs (No Price Edit) */}
              <div className="flex p-1 bg-white rounded-xl shadow-sm mb-6 overflow-x-auto">
                  <button onClick={()=>setAdminTab('game_orders')} className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${adminTab==='game_orders' ? 'bg-blue-600 text-white shadow' : 'text-gray-500'}`}>🎮 গেম অর্ডার ({gameOrders.filter(o=>o.status==='Pending').length})</button>
                  <button onClick={()=>setAdminTab('wallet_requests')} className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${adminTab==='wallet_requests' ? 'bg-green-600 text-white shadow' : 'text-gray-500'}`}>💰 অ্যাড মানি ({walletRequests.filter(o=>o.status==='Pending').length})</button>
              </div>
              
              {adminTab === 'game_orders' && (
                  <div className="space-y-4">
                      {gameOrders.length === 0 && <p className="text-center text-gray-500">কোনো গেম অর্ডার নেই</p>}
                      {gameOrders.map(order => <OrderItem key={order.id} order={order} />)}
                  </div>
              )}

              {adminTab === 'wallet_requests' && (
                  <div className="space-y-4">
                      {walletRequests.length === 0 && <p className="text-center text-gray-500">কোনো অ্যাড মানি রিকোয়েস্ট নেই</p>}
                      {walletRequests.map(order => <OrderItem key={order.id} order={order} />)}
                  </div>
              )}
          </div>
      )
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-20">
      <div className="bg-white shadow px-4 py-3 flex justify-between items-center sticky top-0 z-50">
          <div className="font-bold text-xl text-blue-700">GameShop BD</div>
          <div className="flex items-center gap-3">
              <button onClick={()=>setView('admin')} className="text-gray-300 hover:text-gray-600 text-lg">🔒</button>
              {user ? (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">{user.name.charAt(0)}</div>
              ) : (
                  <button onClick={()=>setView('login')} className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">Login</button>
              )}
          </div>
      </div>

      {view === 'home' && (
          <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="bg-blue-600 rounded-2xl p-6 text-white mb-6 shadow text-center">
                  <h1 className="text-2xl font-bold">ফ্রি ফায়ার টপ-আপ</h1>
                  <p className="text-sm opacity-90">Supabase + Telegram Powered</p>
              </div>

              {/* Level Up Pass */}
              <div 
                className="bg-white rounded-xl p-4 shadow-lg mb-6 cursor-pointer border border-purple-200 text-center hover:shadow-xl transition"
                onClick={() => setShowLevelUpModal(true)}
              >
                  <img src={packages.filter(p => p.category === 'levelup')[0]?.image_url || 'https://via.placeholder.com/400x200?text=Level+Up+Pass'} alt="Level Up" className="w-full h-32 object-cover rounded-lg mb-2" />
                  <h2 className="text-xl font-bold text-purple-700">লেভেল আপ পাস</h2>
                  <p className="text-xs text-gray-500">প্যাকেজ দেখতে ক্লিক করুন</p>
              </div>

              {showLevelUpModal && (
                  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-2xl p-5 w-full max-w-sm animate-fade-in relative">
                          <button onClick={() => setShowLevelUpModal(false)} className="absolute top-3 right-4 text-2xl font-bold text-gray-500">×</button>
                          <h3 className="text-xl font-bold mb-4 text-purple-700 text-center">লেভেল আপ পাস</h3>
                          <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                              {packages.filter(p => p.category === 'levelup').map((pkg) => (
                                  <div key={pkg.id} onClick={() => { setSelectedPkg(pkg); setShowLevelUpModal(false); }} className="p-3 rounded-xl border border-purple-200 cursor-pointer text-center hover:bg-purple-50">
                                      <div className="font-bold text-sm text-gray-700">{pkg.name}</div>
                                      <div className="text-purple-600 font-bold">৳ {pkg.price}</div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}

              {/* MEMBERSHIP SECTION */}
              <div className="bg-white rounded-2xl shadow p-5 mb-5 border-l-4 border-yellow-500">
                <h3 className="font-bold mb-4 text-yellow-700 flex items-center gap-2">👑 মেম্বারশিপ</h3>
                <div className="grid grid-cols-2 gap-3">
                    {packages.filter(p => p.category === 'membership').map((pkg) => (
                        <div key={pkg.id} onClick={() => setSelectedPkg(pkg)} className={`p-3 rounded-xl border cursor-pointer text-center ${selectedPkg?.id === pkg.id ? 'bg-yellow-50 border-yellow-500 ring-1 ring-yellow-500' : 'hover:shadow-sm'}`}>
                            <img src={pkg.image_url} className="w-full h-24 object-cover rounded mb-2"/>
                            <div className="font-bold text-sm text-gray-700">{pkg.name}</div>
                            <div className="text-yellow-600 font-bold">৳ {pkg.price}</div>
                        </div>
                    ))}
                </div>
              </div>

              {/* DIAMONDS SECTION */}
              <div className="bg-white rounded-2xl shadow p-5 mb-5 border-l-4 border-blue-500">
                <h3 className="font-bold mb-4 text-blue-700">💎 রেগুলার ডায়মন্ড</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {packages.filter(p => p.category === 'diamond').map((pkg) => (
                        <div key={pkg.id} onClick={() => setSelectedPkg(pkg)} className={`p-3 rounded-xl border cursor-pointer text-center ${selectedPkg?.id === pkg.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:shadow-sm'}`}>
                            <img src={pkg.image_url} className="w-10 h-10 mx-auto mb-1"/>
                            <div className="font-bold text-sm text-gray-700">{pkg.name}</div>
                            <div className="text-blue-600 font-bold">৳ {pkg.price}</div>
                        </div>
                    ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow p-5 mt-6 space-y-4">
                  <h3 className="font-bold border-l-4 border-blue-600 pl-3">অর্ডার ইনফরমেশন</h3>
                  {selectedPkg && <div className="bg-blue-50 p-3 rounded-lg text-center text-blue-800 font-bold mb-2">প্যাকেজ: {selectedPkg.name} (৳ {selectedPkg.price})</div>}
                  <input type="text" value={playerId} onChange={e=>setPlayerId(e.target.value)} placeholder="প্লেয়ার আইডি (UID)" className="w-full border p-3 rounded-lg bg-slate-50"/>
                  
                  <div className="grid grid-cols-3 gap-2">
                      {['bkash', 'nagad', 'rocket'].map(m => (
                          <button key={m} onClick={()=>setSelectedMethod(m)} className={`p-2 border rounded-lg uppercase text-sm font-bold ${selectedMethod===m ? 'bg-slate-800 text-white' : 'bg-white'}`}>{m}</button>
                      ))}
                  </div>

                  {selectedMethod && (
                      <div className="bg-slate-100 p-3 rounded-lg text-sm">
                           <p className="font-bold text-center mb-2">টাকা পাঠানোর নাম্বার:</p>
                           {paymentMethods.filter(m=>m.method_name.toLowerCase() === selectedMethod).map((n,i)=>(
                              <div key={i} className="flex justify-between bg-white p-2 rounded mb-1 border"><span>{n.number} ({n.type_label})</span></div>
                          ))}
                      </div>
                  )}

                  <input type="text" value={mobileNumber} onChange={e=>setMobileNumber(e.target.value)} placeholder="আপনার নাম্বার" className="w-full border p-3 rounded-lg bg-slate-50"/>
                  <input type="text" value={trxId} onChange={e=>setTrxId(e.target.value)} placeholder="TrxID (৮+ সংখ্যা)" className="w-full border p-3 rounded-lg bg-slate-50 uppercase"/>
                  
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
                  {orders.map((order) => <OrderItem key={order.id} order={order} />)}
              </div>
          </div>
      )}

      {view === 'wallet' && (
          <div className="max-w-md mx-auto px-4 py-6">
              <h2 className="text-xl font-bold mb-4">অ্যাড মানি (Add Money)</h2>
              <div className="bg-white p-5 rounded-2xl shadow space-y-4">
                  <div className="bg-blue-50 p-4 rounded-xl text-center mb-4">
                      <p className="text-sm text-gray-600">আপনার বর্তমান ব্যালেন্স</p>
                      <h3 className="2xl font-bold text-blue-600">৳ 0.00</h3>
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
                           {paymentMethods.filter(m=>m.method_name.toLowerCase() === addMethod.toLowerCase()).map((n,i)=>(
                              <div key={i} className="flex justify-between bg-white p-2 rounded mb-1 border"><span>{n.number}</span></div>
                          ))}
                       </div>
                  )}

                  <input type="text" value={addTrx} onChange={e=>setTrxId(e.target.value)} placeholder="TrxID (৮+ সংখ্যা)" className="w-full border p-3 rounded-lg uppercase"/>
                  <button onClick={handleAddMoneyRequest} disabled={isSubmitting} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">
                      {isSubmitting ? 'পাঠানো হচ্ছে...' : 'রিকোয়েস্ট পাঠান'}
                  </button>
              </div>
          </div>
      )}

      <div className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around py-3 z-50 text-xs font-bold text-gray-500">
          <button onClick={()=>handleNavClick('home')} className={`flex flex-col items-center ${view==='home'?'text-blue-600':''}`}><span className="text-xl">🏠</span>হোম</button>
          <button onClick={()=>handleNavClick('history')} className={`flex flex-col items-center ${view==='history'?'text-blue-600':''}`}><span className="text-xl">📜</span>হিস্ট্রি</button>
          <button onClick={()=>handleNavClick('wallet')} className={`flex flex-col items-center ${view==='wallet'?'text-blue-600':''}`}><span className="text-xl">💰</span>ওয়ালেট</button>
      </div>
    </div>
  );
}