import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// 1. SUPABASE SETUP
// ==========================================
const supabaseUrl = 'https://xxyopmjulslhamaglkvy.supabase.co';
const supabaseKey = 'sb_publishable_tR0dnEoQOhQYITOJJlvh-A_WtKZ9czg';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 2. TELEGRAM SETUP
// ==========================================
const TELEGRAM_BOT_TOKEN = "8519916191:AAHF6c7iNnf9a9NE6f0_vhQq0XCo1qku3gE";
const TELEGRAM_CHAT_ID = "5834441670";

// 3. ADMIN CREDENTIALS
const ADMIN_EMAIL = "tmmasuk247@gmail.com";
const ADMIN_PASS = "Shukhpakhi2021@#00";

// 4. FALLBACK IMAGES (যদি ডাটাবেসে না থাকে)
const DEFAULT_IMAGES = {
    'w1': 'https://placehold.co/400x200/FACC15/78350F?text=WEEKLY',
    'm1': 'https://placehold.co/400x200/9333ea/ffffff?text=MONTHLY',
    'levelup': 'https://placehold.co/400x200/0E7490/ffffff?text=LEVEL+UP',
    'diamond': 'https://cdn-icons-png.flaticon.com/128/6438/6438253.png'
};

export default function App() {
  const [view, setView] = useState('home');
  const [user, setUser] = useState(null);
  
  // Data States
  const [packages, setPackages] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);

  // Inputs
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPassInput, setAdminPassInput] = useState('');

  // Order Inputs
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);

  // Wallet Inputs
  const [addAmount, setAddAmount] = useState('');
  const [addMethod, setAddMethod] = useState('');
  const [addTrx, setAddTrx] = useState('');

  // Admin States
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState('orders'); // orders, prices, payments
  
  // Admin Edit States
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editNumber, setEditNumber] = useState('');

  // --- LOAD DATA ---
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchData();
  }, []);

  useEffect(() => {
    if(user) fetchMyOrders();
    if(isAdmin) fetchAllOrders();
  }, [user, isAdmin, view]);

  const fetchData = async () => {
    const { data: pkgData } = await supabase.from('packages').select('*').order('price', { ascending: true });
    if(pkgData) setPackages(pkgData);
    
    const { data: payData } = await supabase.from('payment_methods').select('*').order('id', { ascending: true });
    if(payData) setPaymentMethods(payData);
  };

  const fetchMyOrders = async () => {
    if(!user) return;
    const { data } = await supabase.from('orders').select('*').eq('customer_phone', user.phone).order('id', { ascending: false });
    if(data) setOrders(data);
  };

  const fetchAllOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('id', { ascending: false });
    if(data) setAllOrders(data);
  };

  // --- ACTIONS ---
  const handleLogin = () => {
    if(!loginName || !loginPhone) return alert("নাম এবং ফোন নাম্বার দিন");
    const newUser = { name: loginName, phone: loginPhone };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    setView('home');
  };

  const handleAdminLogin = () => {
    if(adminEmailInput === ADMIN_EMAIL && adminPassInput === ADMIN_PASS) {
      setIsAdmin(true);
      setView('admin_dashboard');
    } else {
      alert("ভুল তথ্য");
    }
  };

  const handleSubmitOrder = async () => {
    if(!user) { alert("লগইন করুন"); setView('login'); return; }
    if(!selectedPkg || !playerId || !selectedMethod || !trxId) return alert("সব তথ্য দিন");
    
    setIsSubmitting(true);
    const { error } = await supabase.from('orders').insert([{
      customer_name: user.name,
      customer_phone: user.phone,
      player_id: playerId,
      package_name: selectedPkg.name,
      price: selectedPkg.price,
      payment_method: selectedMethod,
      trx_id: trxId,
      status: 'Pending'
    }]);

    if(!error) {
      await sendTelegram(`🔥 *নতুন অর্ডার!*\n👤 ${user.name}\n🎮 ${selectedPkg.name}\n💰 ${selectedPkg.price} TK`);
      alert("অর্ডার সফল!");
      setView('history');
      fetchMyOrders();
    } else {
      alert("সমস্যা হয়েছে");
    }
    setIsSubmitting(false);
  };

  const handleAddMoney = async () => {
    if(!user) { alert("লগইন করুন"); setView('login'); return; }
    
    setIsSubmitting(true);
    const { error } = await supabase.from('orders').insert([{
      customer_name: user.name,
      customer_phone: user.phone,
      player_id: 'Wallet',
      package_name: `Add Money: ${addAmount}`,
      price: addAmount,
      payment_method: addMethod,
      trx_id: addTrx,
      status: 'Pending'
    }]);

    if(!error) {
      await sendTelegram(`💰 *অ্যাড মানি!*\n👤 ${user.name}\n💵 ${addAmount} TK`);
      alert("রিকোয়েস্ট পাঠানো হয়েছে!");
      setView('history');
      fetchMyOrders();
    }
    setIsSubmitting(false);
  };

  const sendTelegram = async (text) => {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' })
    });
  };

  // --- ADMIN ACTIONS ---
  const updateStatus = async (id, status) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    fetchAllOrders();
  };

  const savePackage = async (id) => {
    await supabase.from('packages').update({ name: editName, price: editPrice, image_url: editImage }).eq('id', id);
    setEditingId(null);
    fetchData();
  };

  const savePayment = async (id) => {
    await supabase.from('payment_methods').update({ number: editNumber }).eq('id', id);
    setEditingId(null);
    fetchData();
  };

  // --- RENDER VIEWS ---
  if(view === 'login') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg w-80">
          <h2 className="text-xl font-bold mb-4 text-center">লগইন</h2>
          <input className="w-full border p-2 mb-2 rounded" placeholder="নাম" onChange={e=>setLoginName(e.target.value)}/>
          <input className="w-full border p-2 mb-2 rounded" placeholder="ফোন" onChange={e=>setLoginPhone(e.target.value)}/>
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white p-2 rounded">লগইন</button>
        </div>
      </div>
    );
  }

  if(view === 'admin' && !isAdmin) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg w-80">
          <h2 className="text-xl font-bold mb-4 text-center">অ্যাডমিন</h2>
          <input className="w-full border p-2 mb-2 rounded" placeholder="Email" onChange={e=>setAdminEmailInput(e.target.value)}/>
          <input className="w-full border p-2 mb-2 rounded" type="password" placeholder="Pass" onChange={e=>setAdminPassInput(e.target.value)}/>
          <button onClick={handleAdminLogin} className="w-full bg-black text-white p-2 rounded">Login</button>
          <button onClick={()=>setView('home')} className="w-full mt-2 text-sm">Back</button>
        </div>
      </div>
    );
  }

  if(view === 'admin_dashboard' && isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 pb-20">
        <div className="flex justify-between mb-4">
           <h2 className="text-xl font-bold">ড্যাশবোর্ড</h2>
           <button onClick={()=>{setIsAdmin(false); setView('home')}} className="bg-red-500 text-white px-3 rounded">Log Out</button>
        </div>
        
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <button onClick={()=>setAdminTab('orders')} className={`px-3 py-1 rounded ${adminTab==='orders'?'bg-blue-600 text-white':'bg-white'}`}>Orders</button>
          <button onClick={()=>setAdminTab('prices')} className={`px-3 py-1 rounded ${adminTab==='prices'?'bg-blue-600 text-white':'bg-white'}`}>Prices</button>
          <button onClick={()=>setAdminTab('payments')} className={`px-3 py-1 rounded ${adminTab==='payments'?'bg-blue-600 text-white':'bg-white'}`}>Payments</button>
        </div>

        {/* ORDER LIST */}
        {adminTab === 'orders' && (
          <div className="space-y-2">
            {allOrders.map(o => (
              <div key={o.id} className="bg-white p-3 rounded shadow border-l-4 border-blue-500">
                <div className="flex justify-between font-bold">
                  <span>#{o.id} {o.package_name}</span>
                  <span className={o.status==='Success'?'text-green-600':'text-yellow-600'}>{o.status}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>👤 {o.customer_name} | 📞 {o.customer_phone}</p>
                  {o.player_id !== 'Wallet' && <p>UID: {o.player_id}</p>}
                  <p>Trx: {o.trx_id} | ৳{o.price}</p>
                </div>
                {o.status === 'Pending' && (
                  <div className="mt-2 flex gap-2">
                    <button onClick={()=>updateStatus(o.id, 'Success')} className="bg-green-500 text-white px-2 rounded">Confirm</button>
                    <button onClick={()=>updateStatus(o.id, 'Rejected')} className="bg-red-500 text-white px-2 rounded">Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PRICE EDIT */}
        {adminTab === 'prices' && (
          <div className="space-y-2">
            {packages.map(pkg => (
              <div key={pkg.id} className="bg-white p-3 rounded shadow flex flex-col gap-2">
                 <div className="flex justify-between">
                    <span className="font-bold">{pkg.name}</span>
                    <span className="text-blue-600 font-bold">৳{pkg.price}</span>
                 </div>
                 {editingId === pkg.id ? (
                   <div className="flex flex-col gap-2 bg-gray-50 p-2">
                      <input value={editName} onChange={e=>setEditName(e.target.value)} className="border p-1" placeholder="Name"/>
                      <input value={editPrice} onChange={e=>setEditPrice(e.target.value)} className="border p-1" placeholder="Price"/>
                      <input value={editImage} onChange={e=>setEditImage(e.target.value)} className="border p-1" placeholder="Image URL"/>
                      <div className="flex gap-2">
                        <button onClick={()=>savePackage(pkg.id)} className="bg-green-600 text-white px-2 rounded">Save</button>
                        <button onClick={()=>setEditingId(null)} className="bg-red-400 text-white px-2 rounded">Cancel</button>
                      </div>
                   </div>
                 ) : (
                   <button onClick={()=>{setEditingId(pkg.id); setEditName(pkg.name); setEditPrice(pkg.price); setEditImage(pkg.image_url)}} className="bg-blue-100 text-blue-600 px-2 rounded text-sm self-end">Edit</button>
                 )}
              </div>
            ))}
          </div>
        )}

        {/* PAYMENT EDIT */}
        {adminTab === 'payments' && (
          <div className="space-y-2">
            {paymentMethods.map(pm => (
               <div key={pm.id} className="bg-white p-3 rounded shadow">
                  <div className="flex justify-between">
                    <span className="font-bold">{pm.method_name} ({pm.type_label})</span>
                    <span>{pm.number}</span>
                  </div>
                  {editingId === pm.id ? (
                    <div className="flex gap-2 mt-2">
                       <input value={editNumber} onChange={e=>setEditNumber(e.target.value)} className="border p-1 w-full"/>
                       <button onClick={()=>savePayment(pm.id)} className="bg-green-600 text-white px-2 rounded">Save</button>
                       <button onClick={()=>setEditingId(null)} className="bg-red-400 text-white px-2 rounded">X</button>
                    </div>
                  ) : (
                    <button onClick={()=>{setEditingId(pm.id); setEditNumber(pm.number)}} className="bg-blue-100 text-blue-600 px-2 rounded text-sm mt-1 w-full">Edit Number</button>
                  )}
               </div>
            ))}
          </div>
        )}

      </div>
    );
  }

  // --- MAIN HOME UI ---
  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-20">
      
      {/* Header */}
      <div className="bg-white shadow px-4 py-3 flex justify-between items-center sticky top-0 z-50">
          <div className="font-bold text-xl text-blue-700">GameShop BD</div>
          <button onClick={()=>setView('admin')} className="text-gray-400 text-sm">🔒 Admin</button>
      </div>

      {/* Level Up Modal */}
      {showLevelUpModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl p-4 w-full max-w-sm relative">
              <button onClick={()=>setShowLevelUpModal(false)} className="absolute top-2 right-3 text-xl">✕</button>
              <h3 className="font-bold text-center mb-4">লেভেল আপ পাস</h3>
              <div className="grid grid-cols-2 gap-2">
                 {packages.filter(p => p.category === 'levelup').map(pkg => (
                    <div key={pkg.id} onClick={()=>{setSelectedPkg(pkg); setShowLevelUpModal(false)}} className="border p-2 rounded text-center hover:bg-blue-50 cursor-pointer">
                       <div className="text-sm font-bold">{pkg.name}</div>
                       <div className="text-blue-600 font-bold">৳{pkg.price}</div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Pages */}
      {view === 'home' && (
        <div className="p-4 max-w-md mx-auto space-y-4">
            {/* Banner */}
            <div className="bg-blue-600 text-white p-4 rounded-xl text-center shadow-lg">
               <h1 className="text-2xl font-bold">ফ্রি ফায়ার টপ-আপ</h1>
               <p className="text-sm">Trusted & Fast Delivery</p>
            </div>

            {/* Level Up Button */}
            <div onClick={()=>setShowLevelUpModal(true)} className="bg-white p-4 rounded-xl shadow border border-purple-200 text-center cursor-pointer">
               <h2 className="text-xl font-bold text-purple-700">🔥 লেভেল আপ পাস</h2>
               <p className="text-xs text-gray-500">প্যাকেজ দেখতে ক্লিক করুন</p>
            </div>

            {/* Membership */}
            <div className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500">
               <h3 className="font-bold text-yellow-700 mb-2">👑 মেম্বারশিপ</h3>
               <div className="grid grid-cols-2 gap-2">
                  {packages.filter(p => p.category === 'membership').map(pkg => (
                     <div key={pkg.id} onClick={()=>setSelectedPkg(pkg)} className={`border p-2 rounded text-center cursor-pointer ${selectedPkg?.id===pkg.id?'bg-yellow-50 border-yellow-500':''}`}>
                        <img src={pkg.image_url || DEFAULT_IMAGES.diamond} className="w-10 h-10 mx-auto"/>
                        <div className="text-xs font-bold">{pkg.name}</div>
                        <div className="text-blue-600 font-bold">৳{pkg.price}</div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Diamonds */}
            <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
               <h3 className="font-bold text-blue-700 mb-2">💎 ডায়মন্ড</h3>
               <div className="grid grid-cols-3 gap-2">
                  {packages.filter(p => p.category === 'diamond').map(pkg => (
                     <div key={pkg.id} onClick={()=>setSelectedPkg(pkg)} className={`border p-2 rounded text-center cursor-pointer ${selectedPkg?.id===pkg.id?'bg-blue-50 border-blue-500':''}`}>
                        <img src={pkg.image_url || DEFAULT_IMAGES.diamond} className="w-8 h-8 mx-auto"/>
                        <div className="text-xs font-bold">{pkg.name}</div>
                        <div className="text-blue-600 font-bold">৳{pkg.price}</div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Order Form */}
            <div className="bg-white p-4 rounded-xl shadow">
               <h3 className="font-bold mb-2">অর্ডার করুন</h3>
               {selectedPkg && <div className="bg-green-100 p-2 rounded text-center text-green-800 font-bold mb-2">{selectedPkg.name} - ৳{selectedPkg.price}</div>}
               
               <input className="w-full border p-2 mb-2 rounded" placeholder="Player ID (UID)" onChange={e=>setPlayerId(e.target.value)}/>
               
               <div className="grid grid-cols-3 gap-2 mb-2">
                  {paymentMethods.map(pm => (
                     <button key={pm.id} onClick={()=>setSelectedMethod(pm.method_name)} className={`border p-1 rounded text-xs font-bold ${selectedMethod===pm.method_name?'bg-black text-white':''}`}>
                       {pm.method_name}
                     </button>
                  ))}
               </div>

               {selectedMethod && (
                 <div className="bg-gray-100 p-2 rounded text-xs mb-2">
                    Send Money to: 
                    {paymentMethods.filter(pm => pm.method_name === selectedMethod).map(pm => (
                       <div key={pm.id} className="font-bold text-lg">{pm.number} ({pm.type_label})</div>
                    ))}
                 </div>
               )}

               <input className="w-full border p-2 mb-2 rounded" placeholder="আপনার নাম্বার" onChange={e=>setMobileNumber(e.target.value)}/>
               <input className="w-full border p-2 mb-2 rounded" placeholder="TrxID" onChange={e=>setTrxId(e.target.value)}/>
               
               <button onClick={handleSubmitOrder} disabled={isSubmitting} className="w-full bg-blue-600 text-white p-3 rounded font-bold">
                 {isSubmitting ? 'Processing...' : 'Confirm Order'}
               </button>
            </div>
        </div>
      )}

      {view === 'history' && (
         <div className="p-4 space-y-2">
            <h2 className="font-bold text-xl">অর্ডার হিস্ট্রি</h2>
            {orders.map(o => (
               <div key={o.id} className="bg-white p-3 rounded shadow flex justify-between">
                  <div>
                     <div className="font-bold">{o.package_name}</div>
                     <div className="text-xs text-gray-500">Trx: {o.trx_id}</div>
                  </div>
                  <div className={`font-bold ${o.status==='Success'?'text-green-600':'text-yellow-600'}`}>{o.status}</div>
               </div>
            ))}
         </div>
      )}

      {view === 'wallet' && (
         <div className="p-4">
            <div className="bg-white p-6 rounded-xl shadow text-center mb-4">
               <p>Your Balance</p>
               <h1 className="text-3xl font-bold text-blue-600">৳ 0.00</h1>
            </div>
            <div className="bg-white p-4 rounded-xl shadow">
               <h3 className="font-bold mb-2">Add Money</h3>
               <input className="w-full border p-2 mb-2 rounded" placeholder="Amount" type="number" onChange={e=>setAddAmount(e.target.value)}/>
               <select className="w-full border p-2 mb-2 rounded" onChange={e=>setAddMethod(e.target.value)}>
                  <option>Select Method</option>
                  <option>Bkash</option>
                  <option>Nagad</option>
                  <option>Rocket</option>
               </select>
               <input className="w-full border p-2 mb-2 rounded" placeholder="TrxID" onChange={e=>setAddTrx(e.target.value)}/>
               <button onClick={handleAddMoney} className="w-full bg-green-600 text-white p-2 rounded">Request Add Money</button>
            </div>
         </div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 w-full bg-white border-t flex justify-around py-3 text-xs font-bold text-gray-600">
         <button onClick={()=>handleNavClick('home')}>🏠 Home</button>
         <button onClick={()=>handleNavClick('history')}>📜 History</button>
         <button onClick={()=>handleNavClick('wallet')}>💰 Wallet</button>
      </div>

    </div>
  );
}