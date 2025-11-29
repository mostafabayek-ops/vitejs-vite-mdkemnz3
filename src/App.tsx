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

// 4. IMAGES
const IMAGES = {
    'diamond': 'https://cdn-icons-png.flaticon.com/512/2654/2654506.png', // Blue Diamond
    'levelup': 'https://i.ibb.co/4RDnJ0q/1000874942.jpg',
    'membership': 'https://cdn-icons-png.flaticon.com/512/5305/5305268.png',
    'offer': 'https://cdn-icons-png.flaticon.com/512/726/726476.png'
};

export default function App() {
  const [view, setView] = useState('home'); 
  const [user, setUser] = useState(null); 
  
  // Data States
  const [packages, setPackages] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [orders, setOrders] = useState([]); // Only user's orders
  const [allOrders, setAllOrders] = useState([]); // Admin sees all

  // Form States
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  
  // Wallet
  const [addAmount, setAddAmount] = useState('');
  const [addMethod, setAddMethod] = useState('');
  const [addTrx, setAddTrx] = useState('');

  // Admin
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState('game_orders');
  const [clickCount, setClickCount] = useState(0);

  // Admin Editing States
  const [editingItemId, setEditingItemId] = useState(null);
  const [newPackageName, setNewPackageName] = useState('');
  const [editingPrice, setEditingPrice] = useState('');
  const [editingImage, setEditingImage] = useState('');
  
  // Payment Editing States
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [newPaymentNumber, setNewPaymentNumber] = useState('');
  
  // Add Payment States
  const [addPayName, setAddPayName] = useState('bkash');
  const [addPayType, setAddPayType] = useState('Personal');
  const [addPayNumber, setAddPayNumber] = useState('');


  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchPackages(); 
    fetchPaymentMethods();
  }, []);

  useEffect(() => { 
      if(user) fetchMyOrders(); 
      if(isAdmin) fetchAllOrders();
  }, [user, isAdmin, view, adminTab]);

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

  const handleSecretAdminClick = () => {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount === 5) {
          setView('admin_login'); 
          setClickCount(0);
      }
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

  // --- ADMIN EDIT FUNCTIONS ---
  const handlePackageUpdate = async (pkgId) => {
      await supabase.from('packages').update({ 
          name: newPackageName, 
          price: parseFloat(editingPrice),
          image_url: editingImage 
      }).eq('id', pkgId);
      setEditingItemId(null);
      fetchPackages();
      alert("আপডেট হয়েছে!");
  };

  const handlePaymentNumberUpdate = async (id) => {
      await supabase.from('payment_methods').update({ number: newPaymentNumber }).eq('id', id);
      setEditingPaymentId(null);
      fetchPaymentMethods();
      alert("আপডেট হয়েছে!");
  };
  
  const handlePaymentDelete = async (id) => {
      if(confirm("Are you sure?")) {
          await supabase.from('payment_methods').delete().eq('id', id);
          fetchPaymentMethods();
      }
  };

  const handleAddPayment = async () => {
      if(!addPayNumber) return alert("নাম্বার দিন");
      await supabase.from('payment_methods').insert([{
          method_name: addPayName,
          type_label: addPayType,
          number: addPayNumber
      }]);
      setAddPayNumber('');
      fetchPaymentMethods();
      alert("নতুন নাম্বার যুক্ত হয়েছে!");
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
        const msg = `🔥 *নতুন অর্ডার!*
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
          const msg = `💰 *অ্যাড মানি!*
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
          else { alert("লগইন করুন"); setView('login'); }
      }
  };

  const getPackageImage = (pkg) => {
      if (pkg.image_url) return pkg.image_url;
      if (pkg.category === 'diamond') return IMAGES.diamond;
      if (pkg.category === 'membership') return IMAGES.membership;
      if (pkg.category === 'levelup') return IMAGES.levelup;
      return IMAGES.diamond;
  };

  const gameOrders = allOrders.filter(o => o.player_id !== 'Wallet');
  const walletRequests = allOrders.filter(o => o.player_id === 'Wallet');

  // --- COMPONENTS ---
  
  const OrderItem = ({ order }) => (
      <div className={`bg-white p-4 rounded-xl shadow border-l-4 ${order.player_id === 'Wallet' ? 'border-green-500' : 'border-blue-500'} animate-fade-in mb-2`}>
          <div className="flex justify-between font-bold border-b pb-2 mb-2">
              <span className="text-gray-700">#{order.id} - {order.package_name}</span>
              <span className={`px-2 py-0.5 rounded text-xs ${order.status==='Success'?'bg-green-100 text-green-700': order.status==='Pending'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{order.status}</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
              <div>👤 {order.customer_name} ({order.customer_phone})</div>
              <div className="bg-gray-50 p-2 rounded border">
                  {order.player_id !== 'Wallet' && <div>UID: {order.player_id}</div>}
                  <div>TrxID: {order.trx_id}</div>
                  <div>{order.payment_method} | ৳{order.price}</div>
              </div>
          </div>
          {order.status === 'Pending' && isAdmin && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                  <button onClick={()=>updateStatus(order.id, 'Success')} className="bg-green-500 text-white py-2 rounded">Confirm</button>
                  <button onClick={()=>updateStatus(order.id, 'Rejected')} className="bg-red-500 text-white py-2 rounded">Reject</button>
              </div>
          )}
      </div>
  );

  const PriceEditorComponent = ({ category, title, color }) => {
    const filteredPackages = packages.filter(p => p.category === category);
    return (
      <div className={`bg-white p-4 rounded-xl shadow border-l-4 ${color} mb-4`}>
          <h3 className="font-bold text-gray-700 mb-3">{title}</h3>
          <div className="space-y-2">
              {filteredPackages.map(pkg => (
                  <div key={pkg.id} className="bg-gray-50 p-2 rounded border">
                      {editingItemId === pkg.id ? (
                          <div className="flex flex-col gap-2">
                              <input className="border p-1 rounded" placeholder="Name" value={newPackageName} onChange={e => setNewPackageName(e.target.value)} />
                              <input className="border p-1 rounded" placeholder="Price" type="number" value={editingPrice} onChange={e=>setEditingPrice(e.target.value)} />
                              <input className="border p-1 rounded" placeholder="Image URL" value={editingImage} onChange={e=>setEditingImage(e.target.value)} />
                              <div className="flex gap-2 mt-1">
                                  <button onClick={() => handlePackageUpdate(pkg.id)} className="bg-green-600 text-white px-2 py-1 rounded text-xs">Save</button>
                                  <button onClick={() => setEditingItemId(null)} className="bg-red-400 text-white px-2 py-1 rounded text-xs">Cancel</button>
                              </div>
                          </div>
                      ) : (
                          <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                  <img src={getPackageImage(pkg)} className="w-8 h-8 object-cover rounded"/>
                                  <span className="text-sm font-medium">{pkg.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <span className="font-bold text-blue-600">৳{pkg.price}</span>
                                  <button onClick={()=>{setEditingItemId(pkg.id); setNewPackageName(pkg.name); setEditingPrice(pkg.price); setEditingImage(pkg.image_url || '');}} className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs">Edit</button>
                              </div>
                          </div>
                      )}
                  </div>
              ))}
          </div>
      </div>
    );
  };

  // --- ADMIN LOGIN ---
  if (view === 'admin_login') {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
                  <h2 className="text-xl font-bold mb-4 text-center">অ্যাডমিন লগইন</h2>
                  <input type="email" value={adminEmailInput} onChange={e=>setAdminEmailInput(e.target.value)} placeholder="Email" className="w-full border p-2 mb-3 rounded"/>
                  <input type="password" value={adminPassInput} onChange={e=>setAdminPassInput(e.target.value)} placeholder="Password" className="w-full border p-2 mb-4 rounded"/>
                  <button onClick={handleAdminLogin} className="w-full bg-black text-white p-2 rounded font-bold">লগইন</button>
                  <button onClick={()=>setView('home')} className="w-full mt-2 text-center text-gray-500">ব্যাক</button>
              </div>
          </div>
      )
  }

  // --- USER LOGIN ---
  if (view === 'login') {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
                <h2 className="2xl font-bold text-center mb-6">লগইন করুন</h2>
                <input className="w-full border p-3 rounded-lg mb-4" placeholder="আপনার নাম" onChange={e=>setLoginName(e.target.value)}/>
                <input className="w-full border p-3 rounded-lg mb-4" placeholder="মোবাইল নাম্বার" onChange={e=>setLoginPhone(e.target.value)}/>
                <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">এগিয়ে যান</button>
                <button onClick={()=>setView('home')} className="w-full text-gray-500 text-sm mt-4 text-center block">স্কিপ করুন</button>
            </div>
        </div>
    )
  }

  // --- ADMIN DASHBOARD ---
  if (view === 'admin_dashboard' && isAdmin) {
      return (
          <div className="min-h-screen bg-gray-100 p-4 pb-20">
              <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-xl shadow-sm">
                  <h2 className="text-xl font-bold">অ্যাডমিন</h2>
                  <button onClick={()=>{setIsAdmin(false); setView('home')}} className="bg-red-100 text-red-600 px-3 py-1 rounded-lg font-bold">লগআউট</button>
              </div>
              
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  <button onClick={()=>setAdminTab('game_orders')} className={`px-3 py-2 rounded whitespace-nowrap ${adminTab==='game_orders'?'bg-blue-600 text-white':'bg-white'}`}>🎮 গেম অর্ডার</button>
                  <button onClick={()=>setAdminTab('wallet_requests')} className={`px-3 py-2 rounded whitespace-nowrap ${adminTab==='wallet_requests'?'bg-green-600 text-white':'bg-white'}`}>💰 অ্যাড মানি</button>
                  <button onClick={()=>setAdminTab('prices')} className={`px-3 py-2 rounded whitespace-nowrap ${adminTab==='prices'?'bg-purple-600 text-white':'bg-white'}`}>💎 ডায়মন্ড এডিট</button>
                  <button onClick={()=>setAdminTab('payments')} className={`px-3 py-2 rounded whitespace-nowrap ${adminTab==='payments'?'bg-orange-600 text-white':'bg-white'}`}>💳 পেমেন্ট সেটিংস</button>
              </div>

              {/* TAB: PRICES */}
              {adminTab === 'prices' && (
                  <div className="max-w-2xl mx-auto animate-fade-in">
                      <PriceEditorComponent category="levelup" title="🔥 লেভেল আপ" color="border-purple-500" />
                      <PriceEditorComponent category="membership" title="👑 মেম্বারশিপ" color="border-yellow-500" />
                      <PriceEditorComponent category="diamond" title="💎 ডায়মন্ড" color="border-blue-500" />
                  </div>
              )}
              
              {/* TAB: PAYMENTS (ADD NEW NUMBER & LIST) */}
              {adminTab === 'payments' && (
                  <div className="bg-white p-4 rounded-xl">
                      <h3 className="font-bold mb-4">পেমেন্ট নাম্বার</h3>
                      
                      {/* Add New Payment Form */}
                      <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
                          <h4 className="font-bold text-sm mb-2 text-blue-800">নতুন নাম্বার অ্যাড করুন:</h4>
                          <div className="flex gap-2 mb-2">
                              <select className="border p-1 rounded w-1/2" value={addPayName} onChange={e=>setAddPayName(e.target.value)}>
                                  <option value="bkash">বিকাশ</option>
                                  <option value="nagad">নগদ</option>
                                  <option value="rocket">রকেট</option>
                              </select>
                              <select className="border p-1 rounded w-1/2" value={addPayType} onChange={e=>setAddPayType(e.target.value)}>
                                  <option value="Personal">Personal</option>
                                  <option value="Merchant">Merchant</option>
                              </select>
                          </div>
                          <div className="flex gap-2">
                              <input className="border p-1 rounded w-full" placeholder="নাম্বার লিখুন..." value={addPayNumber} onChange={e=>setAddPayNumber(e.target.value)} />
                              <button onClick={handleAddPayment} className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-sm">Add</button>
                          </div>
                      </div>

                      {/* Existing Payment List */}
                      {paymentMethods.map(pm => (
                          <div key={pm.id} className="bg-gray-50 p-2 mb-2 rounded border">
                              {editingPaymentId === pm.id ? (
                                  <div className="flex flex-col gap-2">
                                      <div className="font-bold">{pm.method_name}</div>
                                      <input className="border p-1" value={newPaymentNumber} onChange={e=>setNewPaymentNumber(e.target.value)} />
                                      <div className="flex gap-2">
                                          <button onClick={()=>handlePaymentNumberUpdate(pm.id)} className="bg-green-500 text-white px-2 rounded">Save</button>
                                          <button onClick={()=>handlePaymentDelete(pm.id)} className="bg-red-500 text-white px-2 rounded">Delete</button>
                                          <button onClick={()=>setEditingPaymentId(null)} className="bg-gray-400 text-white px-2 rounded">Cancel</button>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="flex justify-between items-center">
                                      <div>
                                          <div className="font-bold capitalize">{pm.method_name} ({pm.type_label})</div>
                                          <div className="text-blue-600">{pm.number}</div>
                                      </div>
                                      <button onClick={()=>{setEditingPaymentId(pm.id); setNewPaymentNumber(pm.number)}} className="bg-blue-100 text-blue-600 px-2 rounded text-sm">Edit</button>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              )}

              {/* TAB: ORDERS & WALLET */}
              {adminTab === 'game_orders' && (
                  <div className="space-y-2">
                      {gameOrders.length === 0 ? <p className="text-center text-gray-500">অর্ডার নেই</p> : gameOrders.map(order => <OrderItem key={order.id} order={order} />)}
                  </div>
              )}
               
              {adminTab === 'wallet_requests' && (
                  <div className="space-y-2">
                      {walletRequests.length === 0 ? <p className="text-center text-gray-500">রিকোয়েস্ট নেই</p> : walletRequests.map(order => <OrderItem key={order.id} order={order} />)}
                  </div>
              )}
          </div>
      )
  }

  // --- MAIN HOME ---
  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-20">
      <div className="bg-white shadow px-4 py-3 flex justify-between items-center sticky top-0 z-50">
          {/* SECRET ADMIN CLICK: Click "GameShop BD" 5 times */}
          <div onClick={handleSecretAdminClick} className="font-bold text-xl text-blue-700 cursor-pointer select-none">GameShop BD</div>
          
          <div className="flex items-center gap-3">
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

              {/* LEVEL UP PASS */}
              <div className="bg-white rounded-xl p-4 shadow-lg mb-6 cursor-pointer border border-purple-200 text-center hover:shadow-xl transition" onClick={() => setShowLevelUpModal(true)}>
                  <img src={IMAGES.levelup} className="w-full h-32 object-cover rounded-lg mb-2" />
                  <h2 className="text-xl font-bold text-purple-700">লেভেল আপ পাস</h2>
              </div>

              {showLevelUpModal && (
                  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-2xl p-5 w-full max-w-sm relative">
                          <button onClick={() => setShowLevelUpModal(false)} className="absolute top-3 right-4 text-2xl">×</button>
                          <h3 className="text-xl font-bold mb-4 text-center">লেভেল আপ পাস</h3>
                          <div className="grid grid-cols-2 gap-3">
                              {packages.filter(p => p.category === 'levelup').map((pkg) => (
                                  <div key={pkg.id} onClick={() => { setSelectedPkg(pkg); setShowLevelUpModal(false); }} className="p-3 rounded-xl border text-center cursor-pointer">
                                      <div className="font-bold text-sm">{pkg.name}</div>
                                      <div className="text-purple-600 font-bold">৳ {pkg.price}</div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}

              {/* MEMBERSHIP */}
              <div className="bg-white rounded-2xl shadow p-5 mb-5 border-l-4 border-yellow-500">
                <h3 className="font-bold mb-4 text-yellow-700">👑 মেম্বারশিপ</h3>
                <div className="grid grid-cols-2 gap-3">
                    {packages.filter(p => p.category === 'membership').map((pkg) => (
                        <div key={pkg.id} onClick={() => setSelectedPkg(pkg)} className={`p-3 rounded-xl border cursor-pointer text-center ${selectedPkg?.id === pkg.id ? 'bg-yellow-50 ring-1 ring-yellow-500' : ''}`}>
                            <img src={getPackageImage(pkg)} className="w-12 h-12 mx-auto mb-1 object-cover"/>
                            <div className="font-bold text-sm">{pkg.name}</div>
                            <div className="text-yellow-600 font-bold">৳ {pkg.price}</div>
                        </div>
                    ))}
                </div>
              </div>

              {/* DIAMONDS */}
              <div className="bg-white rounded-2xl shadow p-5 mb-5 border-l-4 border-blue-500">
                <h3 className="font-bold mb-4 text-blue-700">💎 রেগুলার ডায়মন্ড</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {packages.filter(p => p.category === 'diamond').map((pkg) => (
                        <div key={pkg.id} onClick={() => setSelectedPkg(pkg)} className={`p-3 rounded-xl border cursor-pointer text-center ${selectedPkg?.id === pkg.id ? 'bg-blue-50 ring-1 ring-blue-500' : ''}`}>
                            <img src={getPackageImage(pkg)} className="w-10 h-10 mx-auto mb-1"/>
                            <div className="font-bold text-sm">{pkg.name}</div>
                            <div className="text-blue-600 font-bold">৳ {pkg.price}</div>
                        </div>
                    ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow p-5 mt-6 space-y-4">
                  <h3 className="font-bold border-l-4 border-blue-600 pl-3">অর্ডার ইনফরমেশন</h3>
                  {selectedPkg && <div className="bg-blue-50 p-3 rounded text-center font-bold mb-2">{selectedPkg.name} - ৳{selectedPkg.price}</div>}
                  <input type="text" value={playerId} onChange={e=>setPlayerId(e.target.value)} placeholder="প্লেয়ার আইডি (UID)" className="w-full border p-3 rounded-lg"/>
                  <div className="grid grid-cols-3 gap-2">
                      {['bkash', 'nagad', 'rocket'].map(m => (
                          <button key={m} onClick={()=>setSelectedMethod(m)} className={`p-2 border rounded uppercase text-sm font-bold ${selectedMethod===m ? 'bg-slate-800 text-white' : ''}`}>{m}</button>
                      ))}
                  </div>
                  {selectedMethod && (
                      <div className="bg-slate-100 p-3 rounded text-sm text-center">
                           <p className="font-bold mb-1">সেন্ড মানি নাম্বার:</p>
                           {paymentMethods.filter(pm=>pm.method_name.toLowerCase() === selectedMethod).map((n,i)=>(
                              <div key={i} className="bg-white p-1 rounded mb-1 border">{n.number} ({n.type_label})</div>
                          ))}
                      </div>
                  )}
                  <input type="text" value={mobileNumber} onChange={e=>setMobileNumber(e.target.value)} placeholder="আপনার নাম্বার" className="w-full border p-3 rounded-lg"/>
                  <input type="text" value={trxId} onChange={e=>setTrxId(e.target.value)} placeholder="TrxID" className="w-full border p-3 rounded-lg uppercase"/>
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
              <h2 className="text-xl font-bold mb-4">অ্যাড মানি</h2>
              <div className="bg-white p-5 rounded-2xl shadow space-y-4">
                  <div className="bg-blue-50 p-4 rounded-xl text-center mb-4">
                      <p className="text-sm text-gray-600">ব্যালেন্স</p>
                      <h3 className="2xl font-bold text-blue-600">৳ 0.00</h3>
                  </div>
                  <input type="number" value={addAmount} onChange={e=>setAddAmount(e.target.value)} placeholder="টাকার পরিমাণ" className="w-full border p-3 rounded-lg"/>
                  <select value={addMethod} onChange={e=>setAddMethod(e.target.value)} className="w-full border p-3 rounded-lg bg-white">
                      <option value="">মেথড সিলেক্ট করুন</option>
                      <option value="Bkash">Bkash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket</option>
                  </select>
                  <input type="text" value={addTrx} onChange={e=>setTrxId(e.target.value)} placeholder="TrxID" className="w-full border p-3 rounded-lg uppercase"/>
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