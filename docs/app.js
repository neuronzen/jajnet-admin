// ============ FIREBASE ============
const firebaseConfig = {
  apiKey: "AIzaSyAs2g3X7hcN7x991kte3vBTIIGNHfryH30",
  authDomain: "jaj-net.firebaseapp.com",
  projectId: "jaj-net",
  storageBucket: "jaj-net.firebasestorage.app",
  messagingSenderId: "862012070477",
  appId: "1:862012070477:web:8cee7125b28b5853a51a04"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const ADMIN_EMAILS = [
  "admin@jajnet.com",
  "jibonahmmedniloy@gmail.com"
];

const PACKAGES = {
  "20 Mbps": 525, "30 Mbps": 650, "40 Mbps": 750,
  "50 Mbps": 850, "70 Mbps": 1200, "100 Mbps": 1500
};

// ============ HELPERS ============
function $(s, r=document){return r.querySelector(s)}
function $$(s, r=document){return Array.from(r.querySelectorAll(s))}
function escapeHtml(s){return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])}
function initials(name){return (name||'U').trim().charAt(0).toUpperCase()}
function formatMoney(n){return '৳' + Number(n||0).toLocaleString('en-US')}
function toast(msg, type){
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast ' + (type||'');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.add('hidden'), 3500);
}
function showError(msg){
  const e = $('#loginError');
  e.textContent = msg;
  e.classList.remove('hidden');
}
function hideError(){$('#loginError').classList.add('hidden')}

function firebaseAuthError(code){
  const map = {
    'auth/invalid-credential': 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে',
    'auth/invalid-email': 'ইমেইল ঠিকানাটি সঠিক নয়',
    'auth/user-not-found': 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই',
    'auth/wrong-password': 'পাসওয়ার্ড ভুল হয়েছে',
    'auth/too-many-requests': 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন',
    'auth/network-request-failed': 'ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না',
    'auth/user-disabled': 'এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে',
    'auth/missing-password': 'পাসওয়ার্ড লিখুন',
    'auth/operation-not-allowed': 'লগইন এখন সম্ভব হচ্ছে না, সহায়তার জন্য যোগাযোগ করুন'
  };
  return map[code] || 'লগইন করা যায়নি। আবার চেষ্টা করুন';
}

// ============ LOGIN ============
$('#togglePass').onclick = () => {
  const p = $('#passwordInput');
  p.type = p.type === 'password' ? 'text' : 'password';
};
$('#emailInput').addEventListener('input', hideError);
$('#passwordInput').addEventListener('input', hideError);
$('#passwordInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

async function doLogin(){
  hideError();
  const email = $('#emailInput').value.trim();
  const pass  = $('#passwordInput').value;
  if (!email) return showError('ইমেইল লিখুন');
  if (!pass)  return showError('পাসওয়ার্ড লিখুন');
  const btn = $('#loginBtn'), txt = $('#loginBtnText'), ldr = $('#loginBtnLoader');
  btn.disabled = true; txt.classList.add('hidden'); ldr.classList.remove('hidden');
  try {
    const cred = await auth.signInWithEmailAndPassword(email, pass);
    if (!ADMIN_EMAILS.includes(cred.user.email)){
      await auth.signOut();
      throw {code:'auth/not-admin'};
    }
  } catch(err){
    let msg = 'লগইন করা যায়নি। আবার চেষ্টা করুন';
    if (err.code === 'auth/not-admin') msg = 'এই অ্যাকাউন্টটি অ্যাডমিন নয়';
    else msg = firebaseAuthError(err.code);
    showError(msg);
  } finally {
    btn.disabled = false; txt.classList.remove('hidden'); ldr.classList.add('hidden');
  }
}
$('#loginBtn').onclick = doLogin;
$('#emailInput').focus();

// ============ AUTH STATE ============
auth.onAuthStateChanged(user => {
  if (user && ADMIN_EMAILS.includes(user.email)){
    $('#loginScreen').classList.add('hidden');
    $('#mainApp').classList.remove('hidden');
    $('#userChip').textContent = initials(user.email);
    startApp();
  } else {
    $('#mainApp').classList.add('hidden');
    $('#loginScreen').classList.remove('hidden');
    stopApp();
  }
});

$('#logoutBtn').onclick = () => auth.signOut();

// ============ SIDEBAR ============
$('#menuBtn').onclick = () => {
  $('#sidebar').classList.toggle('open');
  $('#overlay').classList.toggle('hidden');
};
$('#overlay').onclick = () => {
  $('#sidebar').classList.remove('open');
  $('#overlay').classList.add('hidden');
};

// ============ ROUTER ============
const PAGES = {
  dashboard: { title: 'ড্যাশবোর্ড', render: renderDashboard },
  customers: { title: 'গ্রাহক', render: renderCustomers },
  payments:  { title: 'পেমেন্ট', render: renderPayments },
  notices:   { title: 'নোটিশ', render: renderNotices }
};
let currentPage = 'dashboard';
function goto(page){
  currentPage = page;
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  $('#pageTitle').textContent = PAGES[page].title;
  $('#sidebar').classList.remove('open');
  $('#overlay').classList.add('hidden');
  PAGES[page].render();
}
$$('.nav-item').forEach(b => b.onclick = () => goto(b.dataset.page));

// ============ APP START/STOP ============
let unsubs = [];
function startApp(){
  if (unsubs.length) return;
  unsubs.push(db.collection('users').onSnapshot(snap => {
    if (currentPage === 'dashboard') renderDashboard();
    else if (currentPage === 'customers') renderCustomers();
  }));
  unsubs.push(db.collection('payments').onSnapshot(snap => {
    let pending = 0;
    snap.forEach(d => { if (d.data().status === 'pending') pending++; });
    const badge = $('#pendingBadge');
    if (pending > 0){ badge.textContent = pending; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
    if (currentPage === 'dashboard') renderDashboard();
    else if (currentPage === 'payments') renderPayments();
  }));
  unsubs.push(db.collection('notices').onSnapshot(snap => {
    if (currentPage === 'notices') renderNotices();
  }));
  goto('dashboard');
}
function stopApp(){
  unsubs.forEach(u => {try{u()}catch(e){}});
  unsubs = [];
}

// ============ DASHBOARD ============
async function renderDashboard(){
  const body = $('#pageBody');
  body.innerHTML = '<div class="empty">লোড হচ্ছে...</div>';
  const [usersSnap, paysSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('payments').get()
  ]);
  const users = usersSnap.docs;
  const pays = paysSnap.docs;
  let active=0, due=0, expired=0, dueAmount=0;
  users.forEach(d => {
    const m = d.data();
    const s = m.status || '';
    if (s === 'active') active++;
    else if (s === 'due') due++;
    else if (s === 'expired') expired++;
    dueAmount += Number(m.dueAmount||0);
  });
  let pending=0, today=0;
  const t0 = new Date(); t0.setHours(0,0,0,0);
  pays.forEach(d => {
    const m = d.data();
    if (m.status === 'pending') pending++;
    if (m.status === 'verified' && m.verifiedAt?.toDate){
      const dt = m.verifiedAt.toDate();
      if (dt >= t0) today += Number(m.amount||0);
    }
  });
  const recent = users.slice(0,5);
  const dateStr = new Date().toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});

  body.innerHTML = `
    <div class="hero-card">
      <div class="hero-text">
        <h3>স্বাগতম 👋</h3>
        <p>JAJ Net ব্যবসার সারসংক্ষেপ</p>
        <div class="hero-date">${dateStr}</div>
      </div>
      <div class="hero-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
<path d="M5 12.55a11 11 0 0 1 14.08 0"/>
<path d="M1.42 9a16 16 0 0 1 21.16 0"/>
<path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
<line x1="12" y1="20" x2="12.01" y2="20"/>
        </svg>
      </div>
    </div>
    <h4 class="section-title">ব্যবসার সারসংক্ষেপ</h4>
    <div class="stats-grid">
      ${statCard('মোট গ্রাহক', users.length, 'info', '&#128101;')}
      ${statCard('Active', active, 'success', '&#10003;')}
      ${statCard('Due', due, 'warning', '!')}
      ${statCard('Expired', expired, 'error', '&#10005;')}
      ${statCard('পেন্ডিং', pending, 'warning', '&#8987;')}
      ${statCard('বকেয়া', formatMoney(dueAmount), 'error', '&#128176;')}
    </div>
    <div class="hero-card" style="margin-top:4px">
      <div class="hero-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
      <div class="hero-text">
        <p>আজকের আদায়</p>
        <h3 class="num">${formatMoney(today)}</h3>
      </div>
    </div>
    <h4 class="section-title" style="margin-top:20px">সাম্প্রতিক গ্রাহক <span style="font-weight:400;color:var(--grey);font-size:12px">(${users.length} জন)</span></h4>
    <div class="card" style="padding:6px 16px">
      ${recent.length ? recent.map(d => {
        const m = d.data();
        const s = (m.status||'').toLowerCase();
        const cls = s==='active'?'pill-success':s==='due'?'pill-warning':'pill-error';
        return `<div class="list-row">
<div class="avatar">${initials(m.name)}</div>
<div class="list-main">
  <div class="list-title">${escapeHtml(m.name||'')}</div>
  <div class="list-sub">${escapeHtml(m.package||'')} • ৳${m.packagePrice||0}</div>
</div>
<span class="pill ${cls}">${(m.status||'').toUpperCase()}</span>
        </div>`;
      }).join('') : '<div class="empty">কোনো গ্রাহক নেই</div>'}
    </div>
  `;
}
function statCard(label, value, type, icon){
  return `<div class="stat-card">
    <div class="stat-icon stat-${type}">${icon}</div>
    <div>
      <div class="stat-label">${label}</div>
      <div class="stat-value num">${value}</div>
    </div>
  </div>`;
}

// ============ CUSTOMERS ============
let custSearch = '', custFilter = 'all';
let custCache = [];
async function renderCustomers(){
  const body = $('#pageBody');
  body.innerHTML = '<div class="empty">লোড হচ্ছে...</div>';
  const snap = await db.collection('users').get();
  custCache = snap.docs.map(d => ({id:d.id, ...d.data()}));
  paintCustomers();
}
function paintCustomers(){
  const body = $('#pageBody');
  let list = custCache.slice();
  if (custSearch){
    const q = custSearch.toLowerCase();
    list = list.filter(m =>
      (m.name||'').toLowerCase().includes(q) ||
      (m.phone||'').includes(q) ||
      (m.email||'').toLowerCase().includes(q)
    );
  }
  if (custFilter !== 'all') list = list.filter(m => m.status === custFilter);
  body.innerHTML = `
    <div class="toolbar">
      <div class="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input id="custSearchInput" placeholder="খুঁজুন..." value="${escapeHtml(custSearch)}">
      </div>
      <button id="addCustBtn" class="btn btn-primary">➕ নতুন গ্রাহক</button>
    </div>
    <div class="chips" id="custChips">
      <button class="chip ${custFilter==='all'?'active':''}" data-f="all">সব</button>
      <button class="chip ${custFilter==='active'?'active':''}" data-f="active">Active</button>
      <button class="chip ${custFilter==='due'?'active':''}" data-f="due">Due</button>
      <button class="chip ${custFilter==='expired'?'active':''}" data-f="expired">Expired</button>
    </div>
    <div style="font-size:12.5px;color:var(--grey);margin-bottom:10px">মোট ${list.length} জন</div>
    <div id="custList">
      ${list.length ? list.map(m => customerRow(m)).join('') : '<div class="empty">কোনো গ্রাহক নেই</div>'}
    </div>
  `;
  $('#custSearchInput').oninput = e => { custSearch = e.target.value; paintCustomers(); $('#custSearchInput').focus(); };
  $('#addCustBtn').onclick = openAddCustomer;
  $$('#custChips .chip').forEach(c => c.onclick = () => { custFilter = c.dataset.f; paintCustomers(); });
  $$('#custList .customer-card').forEach(c => c.onclick = () => openCustomerDetail(c.dataset.id));
}
function customerRow(m){
  const s = (m.status||'').toLowerCase();
  const cls = s==='active'?'pill-success':s==='due'?'pill-warning':s==='expired'?'pill-error':'pill-info';
  const due = Number(m.dueAmount||0);
  return `<div class="customer-card" data-id="${m.id}">
    <div class="avatar">${initials(m.name)}</div>
    <div class="customer-info">
      <div class="customer-name">${escapeHtml(m.name||'')}</div>
      <div class="customer-meta">${escapeHtml(m.phone||'')} • ${escapeHtml(m.package||'')}</div>
      <div class="customer-meta">${escapeHtml(m.address||'')}</div>
    </div>
    <div class="customer-right">
      <span class="pill ${cls}">${(m.status||'').toUpperCase()}</span>
      <span class="amount" style="color:${due>0?'var(--error)':'var(--success)'}">${formatMoney(due)}</span>
    </div>
  </div>`;
}

// ============ ADD CUSTOMER MODAL ============
function openModal(html){
  $('#modalContent').innerHTML = html;
  $('#modal').classList.remove('hidden');
  $('#overlay').classList.remove('hidden');
}
function closeModal(){
  $('#modal').classList.add('hidden');
  $('#overlay').classList.add('hidden');
}
$('#overlay').onclick = () => { closeModal(); $('#sidebar').classList.remove('open'); };

function openAddCustomer(){
  openModal(`
    <div class="modal-title">➕ নতুন গ্রাহক</div>
    <div class="form-row"><label>নাম *</label><input id="acName" placeholder="গ্রাহকের নাম"></div>
    <div class="form-row"><label>মোবাইল নম্বর</label><input id="acPhone" type="tel" inputmode="tel" placeholder="01XXXXXXXXX"></div>
    <div class="form-row"><label>ইমেইল *</label><input id="acEmail" type="email" inputmode="email" placeholder="customer@example.com"></div>
    <div class="form-row"><label>পাসওয়ার্ড * (গ্রাহককে জানাতে হবে)</label><input id="acPass" value="jajnet1234"></div>
    <div class="form-row"><label>ঠিকানা / এলাকা</label><input id="acAddr" placeholder="Podoharbaid"></div>
    <div class="form-row"><label>প্যাকেজ</label>
      <select id="acPkg">
        ${Object.entries(PACKAGES).map(([k,v]) => `<option value="${k}">${k} — ৳${v}</option>`).join('')}
      </select>
    </div>
    <div class="form-grid-2">
      <div class="form-row"><label>মাসিক বিল (৳)</label><input id="acPrice" type="number" value="525"></div>
      <div class="form-row"><label>বর্তমান বকেয়া (৳)</label><input id="acDue" type="number" value="525"></div>
    </div>
    <div class="form-row"><label>স্ট্যাটাস</label>
      <select id="acStatus">
        <option value="active">Active</option>
        <option value="due">Due</option>
        <option value="expired">Expired</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" id="acCancel">বাতিল</button>
      <button class="btn btn-primary" id="acSave">যোগ করুন</button>
    </div>
  `);
  const pkg = $('#acPkg'), price = $('#acPrice'), due = $('#acDue');
  pkg.onchange = () => { const v = PACKAGES[pkg.value]; price.value = v; due.value = v; };
  $('#acCancel').onclick = closeModal;
  $('#acSave').onclick = submitAddCustomer;
}
async function submitAddCustomer(){
  const name = $('#acName').value.trim();
  const email = $('#acEmail').value.trim();
  const pass = $('#acPass').value;
  if (!name) return toast('নাম দিন','error');
  if (!email) return toast('ইমেইল দিন','error');
  if (pass.length < 6) return toast('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর','error');
  const btn = $('#acSave');
  btn.disabled = true; btn.textContent = 'অপেক্ষা করুন...';
  try {
    const secondary = firebase.apps.find(a => a.name === 'admin_creator')
      || firebase.initializeApp(firebaseConfig, 'admin_creator');
    const secondaryAuth = secondary.auth();
    const cred = await secondaryAuth.createUserWithEmailAndPassword(email, pass);
    await db.collection('users').doc(cred.user.uid).set({
      name,
      phone: $('#acPhone').value.trim(),
      email,
      address: $('#acAddr').value.trim(),
      package: $('#acPkg').value,
      packagePrice: Number($('#acPrice').value) || 0,
      dueAmount: Number($('#acDue').value) || 0,
      status: $('#acStatus').value,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await secondaryAuth.signOut();
    closeModal();
    toast(`গ্রাহক যোগ হয়েছে ✅ পাসওয়ার্ড: ${pass} — গ্রাহককে জানান`, 'success');
    renderCustomers();
  } catch(err){
    let msg = 'গ্রাহক যোগ করা যায়নি';
    if (err.code === 'auth/email-already-in-use') msg = 'এই ইমেইল আগে থেকেই আছে';
    else if (err.code === 'auth/invalid-email') msg = 'ইমেইল সঠিক নয়';
    else if (err.code === 'auth/weak-password') msg = 'পাসওয়ার্ড আরও শক্তিশালী করুন';
    toast(msg, 'error');
    btn.disabled = false; btn.textContent = 'যোগ করুন';
  }
}

// ============ CUSTOMER DETAIL ============
function openCustomerDetail(id){
  const m = custCache.find(c => c.id === id);
  if (!m) return;
  openModal(`
    <div class="modal-title">👤 ${escapeHtml(m.name||'')}</div>
    <div class="form-row"><label>নাম</label><input id="dcName" value="${escapeHtml(m.name||'')}"></div>
    <div class="form-row"><label>মোবাইল</label><input id="dcPhone" value="${escapeHtml(m.phone||'')}"></div>
    <div class="form-row"><label>ইমেইল</label><input value="${escapeHtml(m.email||'')}" disabled style="opacity:.6"></div>
    <div class="form-row"><label>ঠিকানা</label><input id="dcAddr" value="${escapeHtml(m.address||'')}"></div>
    <div class="form-row"><label>প্যাকেজ</label>
      <select id="dcPkg">
        ${Object.keys(PACKAGES).map(k => `<option value="${k}" ${k===m.package?'selected':''}>${k} — ৳${PACKAGES[k]}</option>`).join('')}
      </select>
    </div>
    <div class="form-grid-2">
      <div class="form-row"><label>মাসিক বিল (৳)</label><input id="dcPrice" type="number" value="${m.packagePrice||0}"></div>
      <div class="form-row"><label>বকেয়া (৳)</label><input id="dcDue" type="number" value="${m.dueAmount||0}"></div>
    </div>
    <div class="form-row"><label>স্ট্যাটাস</label>
      <select id="dcStatus">
        ${['active','due','expired'].map(s => `<option value="${s}" ${s===m.status?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" id="dcCancel">বাতিল</button>
      <button class="btn btn-primary" id="dcSave">সেভ করুন</button>
    </div>
  `);
  $('#dcCancel').onclick = closeModal;
  $('#dcPkg').onchange = () => { const v = PACKAGES[$('#dcPkg').value]; $('#dcPrice').value = v; };
  $('#dcSave').onclick = async () => {
    const btn = $('#dcSave'); btn.disabled = true; btn.textContent = 'সেভ হচ্ছে...';
    try {
      await db.collection('users').doc(id).update({
        name: $('#dcName').value.trim(),
        phone: $('#dcPhone').value.trim(),
        address: $('#dcAddr').value.trim(),
        package: $('#dcPkg').value,
        packagePrice: Number($('#dcPrice').value)||0,
        dueAmount: Number($('#dcDue').value)||0,
        status: $('#dcStatus').value
      });
      closeModal();
      toast('গ্রাহকের তথ্য সেভ হয়েছে ✅', 'success');
      renderCustomers();
    } catch(e){
      toast('সেভ করা যায়নি', 'error');
      btn.disabled = false; btn.textContent = 'সেভ করুন';
    }
  };
}

// ============ PAYMENTS ============
let payTab = 'pending';
let payCache = [];
async function renderPayments(){
  const body = $('#pageBody');
  body.innerHTML = '<div class="empty">লোড হচ্ছে...</div>';
  const snap = await db.collection('payments').orderBy('createdAt','desc').get().catch(() => db.collection('payments').get());
  payCache = snap.docs.map(d => ({id:d.id, ...d.data()}));
  paintPayments();
}
function paintPayments(){
  const body = $('#pageBody');
  const list = payTab === 'pending'
    ? payCache.filter(p => p.status === 'pending')
    : payCache;
  body.innerHTML = `
    <div class="chips">
      <button class="chip ${payTab==='pending'?'active':''}" data-t="pending">পেন্ডিং (${payCache.filter(p=>p.status==='pending').length})</button>
      <button class="chip ${payTab==='all'?'active':''}" data-t="all">সব পেমেন্ট</button>
    </div>
    <div id="payList">
      ${list.length ? list.map(p => paymentCard(p)).join('') : '<div class="empty">কোনো পেমেন্ট নেই</div>'}
    </div>
  `;
  $$('.chips .chip').forEach(c => c.onclick = () => { payTab = c.dataset.t; paintPayments(); });
  $$('#payList .pay-verify').forEach(b => b.onclick = e => { e.stopPropagation(); verifyPayment(b.dataset.id); });
  $$('#payList .pay-reject').forEach(b => b.onclick = e => { e.stopPropagation(); rejectPayment(b.dataset.id); });
}
function paymentCard(p){
  const s = p.status || 'pending';
  const cls = s === 'verified' ? 'pill-success' : s === 'pending' ? 'pill-warning' : 'pill-error';
  const icon = s === 'verified' ? '&#10003;' : s === 'pending' ? '&#8987;' : '&#10005;';
  return `<div class="card">
    <div class="list-row" style="border:none;padding:0 0 12px">
      <div class="stat-icon stat-${s==='verified'?'success':s==='pending'?'warning':'error'}" style="width:44px;height:44px">${icon}</div>
      <div class="list-main">
        <div class="list-title num">${formatMoney(p.amount)}</div>
        <div class="list-sub">TrxID: ${escapeHtml(p.trxId||'')}</div>
        <div class="list-sub">মেথড: ${escapeHtml(p.method||'bKash')}</div>
      </div>
      <span class="pill ${cls}">${s.toUpperCase()}</span>
    </div>
    ${s === 'pending' ? `
      <div style="display:flex;gap:10px">
        <button class="btn btn-danger pay-reject" data-id="${p.id}" style="flex:1;justify-content:center">বাতিল</button>
        <button class="btn btn-success pay-verify" data-id="${p.id}" style="flex:1;justify-content:center">Verify</button>
      </div>` : ''}
  </div>`;
}
async function verifyPayment(id){
  try {
    await db.collection('payments').doc(id).update({
      status: 'verified',
      verifiedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('পেমেন্ট Verify হয়েছে ✅', 'success');
  } catch(e){ toast('সমস্যা হয়েছে', 'error'); }
}
async function rejectPayment(id){
  try {
    await db.collection('payments').doc(id).update({status:'rejected'});
    toast('পেমেন্ট বাতিল করা হয়েছে', 'error');
  } catch(e){ toast('সমস্যা হয়েছে', 'error'); }
}

// ============ NOTICES ============
async function renderNotices(){
  const body = $('#pageBody');
  body.innerHTML = '<div class="empty">লোড হচ্ছে...</div>';
  const snap = await db.collection('notices').get().catch(() => ({docs:[]}));
  const list = snap.docs.map(d => ({id:d.id, ...d.data()}));
  body.innerHTML = `
    <button id="addNoticeBtn" class="btn btn-primary btn-block" style="margin-bottom:16px">➕ নতুন নোটিশ পাঠান</button>
    <div id="noticeList">
      ${list.length ? list.map(n => noticeCard(n)).join('') : '<div class="empty">কোনো নোটিশ নেই</div>'}
    </div>
  `;
  $('#addNoticeBtn').onclick = openAddNotice;
  $$('#noticeList .notice-del').forEach(b => b.onclick = () => deleteNotice(b.dataset.id));
}
function noticeCard(n){
  return `<div class="card">
    <div style="display:flex;gap:12px">
      <div class="stat-icon stat-warning" style="width:44px;height:44px">&#128226;</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;margin-bottom:4px">${escapeHtml(n.title||'')}</div>
        <div style="font-size:13px;color:var(--grey)">${escapeHtml(n.body||'')}</div>
      </div>
      <button class="btn btn-danger notice-del" data-id="${n.id}" style="padding:6px 10px;font-size:12px">মুছুন</button>
    </div>
  </div>`;
}
function openAddNotice(){
  openModal(`
    <div class="modal-title">📢 নতুন নোটিশ</div>
    <div class="form-row"><label>শিরোনাম</label><input id="anTitle" placeholder="যেমন: আগামীকাল নেট বন্ধ"></div>
    <div class="form-row"><label>বিস্তারিত</label><textarea id="anBody" rows="5" style="width:100%;padding:13px;border-radius:12px;background:var(--cream);border:1.5px solid transparent;font-family:inherit;font-size:14px;resize:vertical" placeholder="নোটিশের বিস্তারিত লিখুন..."></textarea></div>
    <div class="modal-actions">
      <button class="btn btn-outline" id="anCancel">বাতিল</button>
      <button class="btn btn-primary" id="anSave">পাঠান</button>
    </div>
  `);
  $('#anCancel').onclick = closeModal;
  $('#anSave').onclick = async () => {
    const t = $('#anTitle').value.trim();
    const b = $('#anBody').value.trim();
    if (!t) return toast('শিরোনাম দিন','error');
    const btn = $('#anSave'); btn.disabled = true; btn.textContent='পাঠানো হচ্ছে...';
    try {
      await db.collection('notices').add({
        title: t, body: b,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      closeModal();
      toast('নোটিশ পাঠানো হয়েছে ✅','success');
      renderNotices();
    } catch(e){
      toast('পাঠানো যায়নি','error');
      btn.disabled = false; btn.textContent='পাঠান';
    }
  };
}
async function deleteNotice(id){
  if (!confirm('নোটিশ মুছবেন?')) return;
  try {
    await db.collection('notices').doc(id).delete();
    toast('নোটিশ মুছে ফেলা হয়েছে','success');
    renderNotices();
  } catch(e){ toast('সমস্যা হয়েছে','error'); }
}
