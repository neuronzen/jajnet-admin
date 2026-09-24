console.log('[JAJ Net Admin] v3.0 loading...');

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

const ADMIN_EMAILS = ["admin@jajnet.com","jibonahmmedniloy@gmail.com"];
const PACKAGES = {"20 Mbps":525,"30 Mbps":650,"40 Mbps":750,"50 Mbps":850,"70 Mbps":1200,"100 Mbps":1500};

function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function init(n){return (n||'U').trim().charAt(0).toUpperCase()}
function money(n){return '৳'+Number(n||0).toLocaleString('en-US')}

function toast(msg,type){
  var t=$('#toast');
  t.textContent=msg;
  t.className='toast '+(type||'');
  clearTimeout(t._tid);
  t._tid=setTimeout(function(){t.classList.add('hidden')},3500);
}
function showErr(m){$('#loginError').textContent=m;$('#loginError').classList.remove('hidden')}
function hideErr(){$('#loginError').classList.add('hidden')}

function mapAuthError(code){
  var m={
    'auth/invalid-credential':'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে',
    'auth/invalid-email':'ইমেইল ঠিকানাটি সঠিক নয়',
    'auth/user-not-found':'এই ইমেইলে কোনো অ্যাকাউন্ট নেই',
    'auth/wrong-password':'পাসওয়ার্ড ভুল হয়েছে',
    'auth/too-many-requests':'অনেকবার চেষ্টা করা হয়েছে, পরে আবার চেষ্টা করুন',
    'auth/network-request-failed':'ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না',
    'auth/user-disabled':'এই অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে',
    'auth/missing-password':'পাসওয়ার্ড লিখুন',
    'auth/operation-not-allowed':'লগইন এখন সম্ভব হচ্ছে না'
  };
  return m[code]||'লগইন করা যায়নি, আবার চেষ্টা করুন';
}

// LOGIN
$('#togglePass').onclick=function(){
  var p=$('#passwordInput');
  p.type=p.type==='password'?'text':'password';
};
$('#emailInput').addEventListener('input',hideErr);
$('#passwordInput').addEventListener('input',hideErr);
$('#passwordInput').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin()});

function doLogin(){
  hideErr();
  var email=$('#emailInput').value.trim();
  var pass=$('#passwordInput').value;
  if(!email)return showErr('ইমেইল লিখুন');
  if(!pass)return showErr('পাসওয়ার্ড লিখুন');
  var btn=$('#loginBtn'),txt=$('#loginBtnText'),ldr=$('#loginBtnLoader');
  btn.disabled=true;txt.classList.add('hidden');ldr.classList.remove('hidden');
  auth.signInWithEmailAndPassword(email,pass).then(function(cred){
    if(ADMIN_EMAILS.indexOf(cred.user.email)===-1){
      return auth.signOut().then(function(){throw {code:'auth/not-admin'}});
    }
  }).catch(function(err){
    var msg=err.code==='auth/not-admin'?'এই অ্যাকাউন্টটি অ্যাডমিন নয়':mapAuthError(err.code);
    showErr(msg);
  }).then(function(){
    btn.disabled=false;txt.classList.remove('hidden');ldr.classList.add('hidden');
  });
}
$('#loginBtn').onclick=doLogin;

// AUTH STATE
var authReady=false;
auth.onAuthStateChanged(function(user){
  if(!authReady){authReady=true;$('#loadingScreen').classList.add('hidden')}
  if(user && ADMIN_EMAILS.indexOf(user.email)!==-1){
    $('#loginScreen').classList.add('hidden');
    $('#mainApp').classList.remove('hidden');
    $('#userChip').textContent=init(user.email);
    startApp();
  }else{
    $('#mainApp').classList.add('hidden');
    $('#loginScreen').classList.remove('hidden');
    stopApp();
  }
});

$('#logoutBtn').onclick=function(){auth.signOut()};

// SIDEBAR
function openSidebar(){
  $('#sidebar').classList.add('open');
  $('#sidebarBackdrop').classList.remove('hidden');
  $('#sidebarBackdrop').classList.add('show');
}
function closeSidebar(){
  $('#sidebar').classList.remove('open');
  $('#sidebarBackdrop').classList.add('hidden');
  $('#sidebarBackdrop').classList.remove('show');
}
function toggleSidebar(){
  if($('#sidebar').classList.contains('open'))closeSidebar();
  else openSidebar();
}
$('#menuBtn').onclick=toggleSidebar;
$('#sidebarBackdrop').onclick=function(){closeSidebar();closeModal()};

// ROUTER
var PAGES={
  dashboard:{title:'ড্যাশবোর্ড',render:renderDashboard},
  customers:{title:'গ্রাহক',render:renderCustomers},
  payments:{title:'পেমেন্ট',render:renderPayments},
  notices:{title:'নোটিশ',render:renderNotices}
};
var currentPage='dashboard';

function goto(page){
  console.log('[JAJ Net Admin] navigating to:',page);
  if(!PAGES[page])return;
  currentPage=page;
  $$('.nav-item').forEach(function(b){b.classList.toggle('active',b.dataset.page===page)});
  $('#pageTitle').textContent=PAGES[page].title;
  closeSidebar();
  PAGES[page].render();
}

// Bind nav-item clicks directly AND via delegation
$$('.nav-item').forEach(function(btn){
  btn.addEventListener('click',function(e){
    e.preventDefault();
    e.stopPropagation();
    goto(btn.dataset.page);
  });
});
document.addEventListener('click',function(e){
  var nav=e.target.closest && e.target.closest('.nav-item');
  if(nav && !nav._bound){
    e.preventDefault();
    goto(nav.dataset.page);
  }
});

// START / STOP
var unsubs=[];
function startApp(){
  if(unsubs.length)return;
  unsubs.push(db.collection('users').onSnapshot(function(){
    if(currentPage==='dashboard')renderDashboard();
    else if(currentPage==='customers')renderCustomers();
  },function(e){console.error('users snap:',e)}));
  unsubs.push(db.collection('payments').onSnapshot(function(snap){
    var pending=0;
    snap.forEach(function(d){if(d.data().status==='pending')pending++});
    var badge=$('#pendingBadge');
    if(pending>0){badge.textContent=pending;badge.classList.remove('hidden')}
    else badge.classList.add('hidden');
    if(currentPage==='dashboard')renderDashboard();
    else if(currentPage==='payments')renderPayments();
  },function(e){console.error('payments snap:',e)}));
  unsubs.push(db.collection('notices').onSnapshot(function(){
    if(currentPage==='notices')renderNotices();
  },function(e){console.error('notices snap:',e)}));
  goto('dashboard');
}
function stopApp(){
  unsubs.forEach(function(u){try{u()}catch(e){}});
  unsubs=[];
}

// DASHBOARD
function renderDashboard(){
  var body=$('#pageBody');
  body.innerHTML='<div class="empty">লোড হচ্ছে...</div>';
  Promise.all([db.collection('users').get(),db.collection('payments').get()]).then(function(res){
    var users=res[0].docs,pays=res[1].docs;
    var active=0,due=0,expired=0,dueAmt=0;
    users.forEach(function(d){
      var m=d.data(),s=m.status||'';
      if(s==='active')active++;else if(s==='due')due++;else if(s==='expired')expired++;
      dueAmt+=Number(m.dueAmount||0);
    });
    var pending=0,today=0;
    var t0=new Date();t0.setHours(0,0,0,0);
    pays.forEach(function(d){
      var m=d.data();
      if(m.status==='pending')pending++;
      if(m.status==='verified'&&m.verifiedAt&&m.verifiedAt.toDate){
        var dt=m.verifiedAt.toDate();
        if(dt>=t0)today+=Number(m.amount||0);
      }
    });
    var recent=users.slice(0,5);
    var dateStr=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});

    body.innerHTML=
      '<div class="hero-card">'+
        '<div class="hero-text">'+
'<h3>স্বাগতম 👋</h3>'+
'<p>JAJ Net ব্যবসার সারসংক্ষেপ</p>'+
'<div class="hero-date">'+dateStr+'</div>'+
        '</div>'+
        '<div class="hero-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg></div>'+
      '</div>'+
      '<h4 class="section-title">ব্যবসার সারসংক্ষেপ</h4>'+
      '<div class="stats-grid">'+
        statCard('মোট গ্রাহক',users.length,'info','&#128101;')+
        statCard('Active',active,'success','&#10003;')+
        statCard('Due',due,'warning','!')+
        statCard('Expired',expired,'error','&#10005;')+
        statCard('পেন্ডিং',pending,'warning','&#8987;')+
        statCard('বকেয়া',money(dueAmt),'error','&#128176;')+
      '</div>'+
      '<div class="hero-card hero-mini" style="margin-bottom:22px">'+
        '<div class="hero-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>'+
        '<div class="hero-text"><p>আজকের আদায়</p><h3 class="num">'+money(today)+'</h3></div>'+
      '</div>'+
      '<h4 class="section-title">সাম্প্রতিক গ্রাহক <span style="font-weight:400;color:var(--grey);font-size:12px">('+users.length+' জন)</span></h4>'+
      '<div class="card" style="padding:6px 16px">'+
        (recent.length?recent.map(function(d){
var m=d.data(),s=(m.status||'').toLowerCase();
var cls=s==='active'?'pill-success':s==='due'?'pill-warning':'pill-error';
return '<div class="list-row"><div class="avatar">'+init(m.name)+'</div><div class="list-main"><div class="list-title">'+esc(m.name||'')+'</div><div class="list-sub">'+esc(m.package||'')+' • ৳'+(m.packagePrice||0)+'</div></div><span class="pill '+cls+'">'+(m.status||'').toUpperCase()+'</span></div>';
        }).join(''):'<div class="empty">কোনো গ্রাহক নেই</div>')+
      '</div>';
  }).catch(function(e){
    console.error('dashboard:',e);
    body.innerHTML='<div class="empty">লোড করা যায়নি, ইন্টারনেট চেক করুন</div>';
  });
}
function statCard(label,value,type,icon){
  return '<div class="stat-card"><div class="stat-icon stat-'+type+'">'+icon+'</div><div class="stat-body"><div class="stat-label">'+label+'</div><div class="stat-value num">'+value+'</div></div></div>';
}

// CUSTOMERS
var custSearch='',custFilter='all',custCache=[];
function renderCustomers(){
  var body=$('#pageBody');
  body.innerHTML='<div class="empty">লোড হচ্ছে...</div>';
  db.collection('users').get().then(function(snap){
    custCache=snap.docs.map(function(d){var o={id:d.id};var x=d.data();for(var k in x)o[k]=x[k];return o});
    paintCustomers();
  }).catch(function(e){console.error('cust:',e);body.innerHTML='<div class="empty">লোড করা যায়নি</div>'});
}
function paintCustomers(){
  var body=$('#pageBody');
  var list=custCache.slice();
  if(custSearch){
    var q=custSearch.toLowerCase();
    list=list.filter(function(m){return (m.name||'').toLowerCase().indexOf(q)!==-1||(m.phone||'').indexOf(q)!==-1||(m.email||'').toLowerCase().indexOf(q)!==-1});
  }
  if(custFilter!=='all')list=list.filter(function(m){return m.status===custFilter});

  body.innerHTML=
    '<div class="toolbar">'+
      '<div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="custSearchInput" placeholder="খুঁজুন..." value="'+esc(custSearch)+'"></div>'+
      '<button id="addCustBtn" class="btn btn-primary" type="button">➕ নতুন গ্রাহক</button>'+
    '</div>'+
    '<div class="chips">'+
      '<button class="chip '+(custFilter==='all'?'active':'')+'" data-f="all" type="button">সব</button>'+
      '<button class="chip '+(custFilter==='active'?'active':'')+'" data-f="active" type="button">Active</button>'+
      '<button class="chip '+(custFilter==='due'?'active':'')+'" data-f="due" type="button">Due</button>'+
      '<button class="chip '+(custFilter==='expired'?'active':'')+'" data-f="expired" type="button">Expired</button>'+
    '</div>'+
    '<div style="font-size:12.5px;color:var(--grey);margin-bottom:10px">মোট '+list.length+' জন</div>'+
    '<div id="custList">'+(list.length?list.map(customerRow).join(''):'<div class="empty">কোনো গ্রাহক নেই</div>')+'</div>';

  var si=$('#custSearchInput');
  si.oninput=function(e){custSearch=e.target.value;var p=si.selectionStart;paintCustomers();var ns=$('#custSearchInput');ns.focus();ns.setSelectionRange(p,p)};
  $('#addCustBtn').onclick=openAddCustomer;
  $$('.chips .chip').forEach(function(c){c.onclick=function(){custFilter=c.dataset.f;paintCustomers()}});
  $$('#custList .customer-card').forEach(function(c){c.onclick=function(){openCustomerDetail(c.dataset.id)}});
}
function customerRow(m){
  var s=(m.status||'').toLowerCase();
  var cls=s==='active'?'pill-success':s==='due'?'pill-warning':s==='expired'?'pill-error':'pill-info';
  var due=Number(m.dueAmount||0);
  return '<div class="customer-card" data-id="'+m.id+'">'+
    '<div class="avatar">'+init(m.name)+'</div>'+
    '<div class="customer-info">'+
      '<div class="customer-name">'+esc(m.name||'')+'</div>'+
      '<div class="customer-meta">'+esc(m.phone||'')+' • '+esc(m.package||'')+'</div>'+
      '<div class="customer-meta">'+esc(m.address||'')+'</div>'+
    '</div>'+
    '<div class="customer-right">'+
      '<span class="pill '+cls+'">'+(m.status||'').toUpperCase()+'</span>'+
      '<span class="amount" style="color:'+(due>0?'var(--error)':'var(--success)')+'">'+money(due)+'</span>'+
    '</div>'+
  '</div>';
}

// MODAL
function openModal(html){
  $('#modalContent').innerHTML=html;
  $('#modal').classList.remove('hidden');
  $('#modalOverlay').classList.remove('hidden');
}
function closeModal(){
  $('#modal').classList.add('hidden');
  $('#modalOverlay').classList.add('hidden');
}
$('#modalOverlay').onclick=closeModal;

function openAddCustomer(){
  openModal(
    '<div class="modal-title">➕ নতুন গ্রাহক</div>'+
    '<div class="form-row"><label>নাম *</label><input id="acName" placeholder="গ্রাহকের নাম"></div>'+
    '<div class="form-row"><label>মোবাইল নম্বর</label><input id="acPhone" type="tel" inputmode="tel" placeholder="01XXXXXXXXX"></div>'+
    '<div class="form-row"><label>ইমেইল *</label><input id="acEmail" type="email" inputmode="email" placeholder="customer@example.com"></div>'+
    '<div class="form-row"><label>পাসওয়ার্ড * (গ্রাহককে জানাতে হবে)</label><input id="acPass" value="jajnet1234"></div>'+
    '<div class="form-row"><label>ঠিকানা / এলাকা</label><input id="acAddr" placeholder="Podoharbaid"></div>'+
    '<div class="form-row"><label>প্যাকেজ</label><select id="acPkg">'+Object.keys(PACKAGES).map(function(k){return '<option value="'+k+'">'+k+' — ৳'+PACKAGES[k]+'</option>'}).join('')+'</select></div>'+
    '<div class="form-grid-2">'+
      '<div class="form-row"><label>মাসিক বিল (৳)</label><input id="acPrice" type="number" value="525"></div>'+
      '<div class="form-row"><label>বর্তমান বকেয়া (৳)</label><input id="acDue" type="number" value="525"></div>'+
    '</div>'+
    '<div class="form-row"><label>স্ট্যাটাস</label><select id="acStatus"><option value="active">Active</option><option value="due">Due</option><option value="expired">Expired</option></select></div>'+
    '<div class="modal-actions"><button class="btn btn-outline" id="acCancel" type="button">বাতিল</button><button class="btn btn-primary" id="acSave" type="button">যোগ করুন</button></div>'
  );
  $('#acPkg').onchange=function(){var v=PACKAGES[$('#acPkg').value];$('#acPrice').value=v;$('#acDue').value=v};
  $('#acCancel').onclick=closeModal;
  $('#acSave').onclick=submitAddCustomer;
}
function submitAddCustomer(){
  var name=$('#acName').value.trim();
  var email=$('#acEmail').value.trim();
  var pass=$('#acPass').value;
  if(!name)return toast('নাম দিন','error');
  if(!email)return toast('ইমেইল দিন','error');
  if(pass.length<6)return toast('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর','error');
  var btn=$('#acSave');btn.disabled=true;btn.textContent='অপেক্ষা করুন...';
  var secondary=firebase.apps.filter(function(a){return a.name==='admin_creator'})[0];
  if(!secondary)secondary=firebase.initializeApp(firebaseConfig,'admin_creator');
  var sAuth=secondary.auth();
  sAuth.createUserWithEmailAndPassword(email,pass).then(function(cred){
    return db.collection('users').doc(cred.user.uid).set({
      name:name,phone:$('#acPhone').value.trim(),email:email,
      address:$('#acAddr').value.trim(),
      package:$('#acPkg').value,
      packagePrice:Number($('#acPrice').value)||0,
      dueAmount:Number($('#acDue').value)||0,
      status:$('#acStatus').value,
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    }).then(function(){return sAuth.signOut()});
  }).then(function(){
    closeModal();
    toast('গ্রাহক যোগ হয়েছে ✅ পাসওয়ার্ড: '+pass+' — গ্রাহককে জানান','success');
    renderCustomers();
  }).catch(function(err){
    var msg='গ্রাহক যোগ করা যায়নি';
    if(err.code==='auth/email-already-in-use')msg='এই ইমেইল আগে থেকেই আছে';
    else if(err.code==='auth/invalid-email')msg='ইমেইল সঠিক নয়';
    else if(err.code==='auth/weak-password')msg='পাসওয়ার্ড আরও শক্তিশালী করুন';
    console.error('add cust:',err);
    toast(msg,'error');
    btn.disabled=false;btn.textContent='যোগ করুন';
  });
}

function openCustomerDetail(id){
  var m=custCache.filter(function(c){return c.id===id})[0];
  if(!m)return;
  openModal(
    '<div class="modal-title">👤 '+esc(m.name||'')+'</div>'+
    '<div class="form-row"><label>নাম</label><input id="dcName" value="'+esc(m.name||'')+'"></div>'+
    '<div class="form-row"><label>মোবাইল</label><input id="dcPhone" value="'+esc(m.phone||'')+'"></div>'+
    '<div class="form-row"><label>ইমেইল</label><input value="'+esc(m.email||'')+'" disabled style="opacity:.6"></div>'+
    '<div class="form-row"><label>ঠিকানা</label><input id="dcAddr" value="'+esc(m.address||'')+'"></div>'+
    '<div class="form-row"><label>প্যাকেজ</label><select id="dcPkg">'+Object.keys(PACKAGES).map(function(k){return '<option value="'+k+'" '+(k===m.package?'selected':'')+'>'+k+' — ৳'+PACKAGES[k]+'</option>'}).join('')+'</select></div>'+
    '<div class="form-grid-2">'+
      '<div class="form-row"><label>মাসিক বিল (৳)</label><input id="dcPrice" type="number" value="'+(m.packagePrice||0)+'"></div>'+
      '<div class="form-row"><label>বকেয়া (৳)</label><input id="dcDue" type="number" value="'+(m.dueAmount||0)+'"></div>'+
    '</div>'+
    '<div class="form-row"><label>স্ট্যাটাস</label><select id="dcStatus">'+['active','due','expired'].map(function(s){return '<option value="'+s+'" '+(s===m.status?'selected':'')+'>'+s.charAt(0).toUpperCase()+s.slice(1)+'</option>'}).join('')+'</select></div>'+
    '<div class="modal-actions"><button class="btn btn-outline" id="dcCancel" type="button">বাতিল</button><button class="btn btn-primary" id="dcSave" type="button">সেভ করুন</button></div>'
  );
  $('#dcCancel').onclick=closeModal;
  $('#dcPkg').onchange=function(){var v=PACKAGES[$('#dcPkg').value];$('#dcPrice').value=v};
  $('#dcSave').onclick=function(){
    var btn=$('#dcSave');btn.disabled=true;btn.textContent='সেভ হচ্ছে...';
    db.collection('users').doc(id).update({
      name:$('#dcName').value.trim(),
      phone:$('#dcPhone').value.trim(),
      address:$('#dcAddr').value.trim(),
      package:$('#dcPkg').value,
      packagePrice:Number($('#dcPrice').value)||0,
      dueAmount:Number($('#dcDue').value)||0,
      status:$('#dcStatus').value
    }).then(function(){
      closeModal();
      toast('গ্রাহকের তথ্য সেভ হয়েছে ✅','success');
      renderCustomers();
    }).catch(function(e){
      console.error('save cust:',e);
      toast('সেভ করা যায়নি','error');
      btn.disabled=false;btn.textContent='সেভ করুন';
    });
  };
}

// PAYMENTS
var payTab='pending',payCache=[];
function renderPayments(){
  var body=$('#pageBody');
  body.innerHTML='<div class="empty">লোড হচ্ছে...</div>';
  db.collection('payments').orderBy('createdAt','desc').get().catch(function(){return db.collection('payments').get()}).then(function(snap){
    payCache=snap.docs.map(function(d){var o={id:d.id};var x=d.data();for(var k in x)o[k]=x[k];return o});
    paintPayments();
  }).catch(function(e){console.error('pay:',e);body.innerHTML='<div class="empty">লোড করা যায়নি</div>'});
}
function paintPayments(){
  var body=$('#pageBody');
  var list=payTab==='pending'?payCache.filter(function(p){return p.status==='pending'}):payCache;
  var pendingCount=payCache.filter(function(p){return p.status==='pending'}).length;
  body.innerHTML=
    '<div class="chips">'+
      '<button class="chip '+(payTab==='pending'?'active':'')+'" data-t="pending" type="button">পেন্ডিং ('+pendingCount+')</button>'+
      '<button class="chip '+(payTab==='all'?'active':'')+'" data-t="all" type="button">সব পেমেন্ট</button>'+
    '</div>'+
    '<div id="payList">'+(list.length?list.map(paymentCard).join(''):'<div class="empty">কোনো পেমেন্ট নেই</div>')+'</div>';
  $$('.chips .chip').forEach(function(c){c.onclick=function(){payTab=c.dataset.t;paintPayments()}});
  $$('#payList .pay-verify').forEach(function(b){b.onclick=function(){verifyPayment(b.dataset.id)}});
  $$('#payList .pay-reject').forEach(function(b){b.onclick=function(){rejectPayment(b.dataset.id)}});
}
function paymentCard(p){
  var s=p.status||'pending';
  var cls=s==='verified'?'pill-success':s==='pending'?'pill-warning':'pill-error';
  var ic=s==='verified'?'&#10003;':s==='pending'?'&#8987;':'&#10005;';
  return '<div class="card">'+
    '<div class="list-row" style="border:none;padding:0 0 12px">'+
      '<div class="stat-icon stat-'+(s==='verified'?'success':s==='pending'?'warning':'error')+'" style="width:44px;height:44px">'+ic+'</div>'+
      '<div class="list-main">'+
        '<div class="list-title num">'+money(p.amount)+'</div>'+
        '<div class="list-sub">TrxID: '+esc(p.trxId||'')+'</div>'+
        '<div class="list-sub">মেথড: '+esc(p.method||'bKash')+'</div>'+
      '</div>'+
      '<span class="pill '+cls+'">'+s.toUpperCase()+'</span>'+
    '</div>'+
    (s==='pending'?'<div style="display:flex;gap:10px">'+
      '<button class="btn btn-danger pay-reject" data-id="'+p.id+'" type="button" style="flex:1;justify-content:center">বাতিল</button>'+
      '<button class="btn btn-success pay-verify" data-id="'+p.id+'" type="button" style="flex:1;justify-content:center">Verify</button>'+
    '</div>':'')+
  '</div>';
}
function verifyPayment(id){
  db.collection('payments').doc(id).update({status:'verified',verifiedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){toast('পেমেন্ট Verify হয়েছে ✅','success')}).catch(function(e){console.error(e);toast('সমস্যা হয়েছে','error')});
}
function rejectPayment(id){
  db.collection('payments').doc(id).update({status:'rejected'}).then(function(){toast('পেমেন্ট বাতিল করা হয়েছে','error')}).catch(function(e){console.error(e);toast('সমস্যা হয়েছে','error')});
}

// NOTICES
function renderNotices(){
  var body=$('#pageBody');
  body.innerHTML='<div class="empty">লোড হচ্ছে...</div>';
  db.collection('notices').get().then(function(snap){
    var list=snap.docs.map(function(d){var o={id:d.id};var x=d.data();for(var k in x)o[k]=x[k];return o});
    body.innerHTML=
      '<button id="addNoticeBtn" class="btn btn-primary btn-block" type="button" style="margin-bottom:16px">➕ নতুন নোটিশ পাঠান</button>'+
      '<div id="noticeList">'+(list.length?list.map(noticeCard).join(''):'<div class="empty">কোনো নোটিশ নেই</div>')+'</div>';
    $('#addNoticeBtn').onclick=openAddNotice;
    $$('#noticeList .notice-del').forEach(function(b){b.onclick=function(){deleteNotice(b.dataset.id)}});
  }).catch(function(e){console.error('not:',e);body.innerHTML='<div class="empty">লোড করা যায়নি</div>'});
}
function noticeCard(n){
  return '<div class="card"><div style="display:flex;gap:12px;align-items:flex-start">'+
    '<div class="stat-icon stat-warning" style="width:44px;height:44px;flex-shrink:0">&#128226;</div>'+
    '<div style="flex:1;min-width:0"><div style="font-weight:700;margin-bottom:4px">'+esc(n.title||'')+'</div><div style="font-size:13px;color:var(--grey);word-break:break-word">'+esc(n.body||'')+'</div></div>'+
    '<button class="btn btn-danger notice-del" data-id="'+n.id+'" type="button" style="padding:6px 10px;font-size:12px;flex-shrink:0">মুছুন</button>'+
  '</div></div>';
}
function openAddNotice(){
  openModal(
    '<div class="modal-title">📢 নতুন নোটিশ</div>'+
    '<div class="form-row"><label>শিরোনাম</label><input id="anTitle" placeholder="যেমন: আগামীকাল নেট বন্ধ"></div>'+
    '<div class="form-row"><label>বিস্তারিত</label><textarea id="anBody" rows="5" placeholder="নোটিশের বিস্তারিত লিখুন..."></textarea></div>'+
    '<div class="modal-actions"><button class="btn btn-outline" id="anCancel" type="button">বাতিল</button><button class="btn btn-primary" id="anSave" type="button">পাঠান</button></div>'
  );
  $('#anCancel').onclick=closeModal;
  $('#anSave').onclick=function(){
    var t=$('#anTitle').value.trim();
    var b=$('#anBody').value.trim();
    if(!t)return toast('শিরোনাম দিন','error');
    var btn=$('#anSave');btn.disabled=true;btn.textContent='পাঠানো হচ্ছে...';
    db.collection('notices').add({title:t,body:b,createdAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){
      closeModal();
      toast('নোটিশ পাঠানো হয়েছে ✅','success');
      renderNotices();
    }).catch(function(e){console.error('add not:',e);toast('পাঠানো যায়নি','error');btn.disabled=false;btn.textContent='পাঠান'});
  };
}
function deleteNotice(id){
  if(!confirm('নোটিশ মুছবেন?'))return;
  db.collection('notices').doc(id).delete().then(function(){toast('নোটিশ মুছে ফেলা হয়েছে','success');renderNotices()}).catch(function(e){console.error(e);toast('সমস্যা হয়েছে','error')});
}

console.log('[JAJ Net Admin] v3.0 loaded');
