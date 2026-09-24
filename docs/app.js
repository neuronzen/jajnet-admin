console.log('[JAJ Net Admin] v4.0 English UI');

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
    'auth/invalid-credential':'Invalid email or password',
    'auth/invalid-email':'Invalid email address',
    'auth/user-not-found':'No account found with this email',
    'auth/wrong-password':'Incorrect password',
    'auth/too-many-requests':'Too many attempts. Please try again later',
    'auth/network-request-failed':'No internet connection',
    'auth/user-disabled':'This account has been disabled',
    'auth/missing-password':'Please enter your password',
    'auth/operation-not-allowed':'Login is currently unavailable'
  };
  return m[code]||'Login failed. Please try again';
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
  if(!email)return showErr('Please enter your email');
  if(!pass)return showErr('Please enter your password');
  var btn=$('#loginBtn'),txt=$('#loginBtnText'),ldr=$('#loginBtnLoader');
  btn.disabled=true;txt.classList.add('hidden');ldr.classList.remove('hidden');
  auth.signInWithEmailAndPassword(email,pass).then(function(cred){
    if(ADMIN_EMAILS.indexOf(cred.user.email)===-1){
      return auth.signOut().then(function(){throw {code:'auth/not-admin'}});
    }
  }).catch(function(err){
    var msg=err.code==='auth/not-admin'?'This account is not an admin':mapAuthError(err.code);
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
  dashboard:{title:'Dashboard',render:renderDashboard},
  customers:{title:'Customers',render:renderCustomers},
  payments:{title:'Payments',render:renderPayments},
  notices:   {title: 'Notices', render: renderNotices},
            packages:  {title: 'Packages', render: renderPackages}
};
var currentPage='dashboard';

function goto(page){
  if(!PAGES[page])return;
  currentPage=page;
  $$('.nav-item').forEach(function(b){b.classList.toggle('active',b.dataset.page===page)});
  $('#pageTitle').textContent=PAGES[page].title;
  closeSidebar();
  PAGES[page].render();
}

$$('.nav-item').forEach(function(btn){
  btn.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    goto(btn.dataset.page);
  });
});

// START/STOP
var unsubs=[];
function startApp(){
  if(unsubs.length)return;
  unsubs.push(db.collection('users').onSnapshot(function(){
    if(currentPage==='dashboard')renderDashboard();
    else if(currentPage==='customers')renderCustomers();
  },function(e){console.error(e)}));
  unsubs.push(db.collection('payments').onSnapshot(function(snap){
    var pending=0;
    snap.forEach(function(d){if(d.data().status==='pending')pending++});
    var badge=$('#pendingBadge');
    if(pending>0){badge.textContent=pending;badge.classList.remove('hidden')}
    else badge.classList.add('hidden');
    if(currentPage==='dashboard')renderDashboard();
    else if(currentPage==='payments')renderPayments();
  },function(e){console.error(e)}));
  unsubs.push(db.collection('notices').onSnapshot(function(){
    if(currentPage==='notices')renderNotices();
  },function(e){console.error(e)}));
  goto('dashboard');
}
function stopApp(){
  unsubs.forEach(function(u){try{u()}catch(e){}});
  unsubs=[];
}

// DASHBOARD
function renderDashboard(){
  var body=$('#pageBody');
  body.innerHTML='<div class="empty">Loading...</div>';
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
'<h3>Welcome 👋</h3>'+
'<p>JAJ Net Business Overview</p>'+
'<div class="hero-date">'+dateStr+'</div>'+
        '</div>'+
        '<div class="hero-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg></div>'+
      '</div>'+
      '<h4 class="section-title">Business Overview</h4>'+
      '<div class="stats-grid">'+
        statCard('Total Customers',users.length,'info','&#128101;')+
        statCard('Active',active,'success','&#10003;')+
        statCard('Due',due,'warning','!')+
        statCard('Expired',expired,'error','&#10005;')+
        statCard('Pending',pending,'warning','&#8987;')+
        statCard('Due Amount',money(dueAmt),'error','&#128176;')+
      '</div>'+
      '<div class="hero-card hero-mini" style="margin-bottom:22px">'+
        '<div class="hero-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>'+
        '<div class="hero-text"><p>Today\'s Collection</p><h3 class="num">'+money(today)+'</h3></div>'+
      '</div>'+
      '<h4 class="section-title">Recent Customers <span style="font-weight:400;color:var(--grey);font-size:12px">('+users.length+' total)</span></h4>'+
      '<div class="card" style="padding:6px 16px">'+
        (recent.length?recent.map(function(d){
var m=d.data(),s=(m.status||'').toLowerCase();
var cls=s==='active'?'pill-success':s==='due'?'pill-warning':'pill-error';
return '<div class="list-row"><div class="avatar">'+init(m.name)+'</div><div class="list-main"><div class="list-title">'+esc(m.name||'')+'</div><div class="list-sub">'+esc(m.package||'')+' • ৳'+(m.packagePrice||0)+'</div></div><span class="pill '+cls+'">'+(m.status||'').toUpperCase()+'</span></div>';
        }).join(''):'<div class="empty">No customers yet</div>')+
      '</div>';
  }).catch(function(e){
    console.error(e);
    body.innerHTML='<div class="empty">Failed to load. Check your internet.</div>';
  });
}
function statCard(label,value,type,icon){
  return '<div class="stat-card"><div class="stat-icon stat-'+type+'">'+icon+'</div><div class="stat-body"><div class="stat-label">'+label+'</div><div class="stat-value num">'+value+'</div></div></div>';
}

// CUSTOMERS
var custSearch='',custFilter='all',custCache=[];
function renderCustomers(){
  var body=$('#pageBody');
  body.innerHTML='<div class="empty">Loading...</div>';
  db.collection('users').get().then(function(snap){
    custCache=snap.docs.map(function(d){var o={id:d.id};var x=d.data();for(var k in x)o[k]=x[k];return o});
    paintCustomers();
  }).catch(function(e){console.error(e);body.innerHTML='<div class="empty">Failed to load</div>'});
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
      '<div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="custSearchInput" placeholder="Search by name, phone, email..." value="'+esc(custSearch)+'"></div>'+
      '<button id="addCustBtn" class="btn btn-primary" type="button">+ New Customer</button>'+
    '</div>'+
    '<div class="chips">'+
      '<button class="chip '+(custFilter==='all'?'active':'')+'" data-f="all" type="button">All</button>'+
      '<button class="chip '+(custFilter==='active'?'active':'')+'" data-f="active" type="button">Active</button>'+
      '<button class="chip '+(custFilter==='due'?'active':'')+'" data-f="due" type="button">Due</button>'+
      '<button class="chip '+(custFilter==='expired'?'active':'')+'" data-f="expired" type="button">Expired</button>'+
    '</div>'+
    '<div style="font-size:12.5px;color:var(--grey);margin-bottom:10px">Total '+list.length+' customers</div>'+
    '<div id="custList">'+(list.length?list.map(customerRow).join(''):'<div class="empty">No customers</div>')+'</div>';

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
    '<div class="modal-title">+ New Customer</div>'+
    '<div class="form-row"><label>Name *</label><input id="acName" placeholder="Customer name"></div>'+
    '<div class="form-row"><label>Mobile Number</label><input id="acPhone" type="tel" inputmode="tel" placeholder="01XXXXXXXXX"></div>'+
    '<div class="form-row"><label>Email *</label><input id="acEmail" type="email" inputmode="email" placeholder="customer@example.com"></div>'+
    '<div class="form-row"><label>Password * (share with customer)</label><input id="acPass" value="jajnet1234"></div>'+
    '<div class="form-row"><label>Address / Area</label><input id="acAddr" placeholder="Podoharbaid"></div>'+
    '<div class="form-row"><label>Package</label><select id="acPkg">'+Object.keys(PACKAGES).map(function(k){return '<option value="'+k+'">'+k+' — ৳'+PACKAGES[k]+'</option>'}).join('')+'</select></div>'+
    '<div class="form-grid-2">'+
      '<div class="form-row"><label>Monthly Bill (৳)</label><input id="acPrice" type="number" value="525"></div>'+
      '<div class="form-row"><label>Current Due (৳)</label><input id="acDue" type="number" value="525"></div>'+
    '</div>'+
    '<div class="form-row"><label>Status</label><select id="acStatus"><option value="active">Active</option><option value="due">Due</option><option value="expired">Expired</option></select></div>'+
    '<div class="modal-actions"><button class="btn btn-outline" id="acCancel" type="button">Cancel</button><button class="btn btn-primary" id="acSave" type="button">Add Customer</button></div>'
  );
  $('#acPkg').onchange=function(){var v=PACKAGES[$('#acPkg').value];$('#acPrice').value=v;$('#acDue').value=v};
  $('#acCancel').onclick=closeModal;
  $('#acSave').onclick=submitAddCustomer;
}
function submitAddCustomer(){
  var name=$('#acName').value.trim();
  var email=$('#acEmail').value.trim();
  var pass=$('#acPass').value;
  if(!name)return toast('Please enter name','error');
  if(!email)return toast('Please enter email','error');
  if(pass.length<6)return toast('Password must be 6+ characters','error');
  var btn=$('#acSave');btn.disabled=true;btn.textContent='Please wait...';
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
    toast('Customer added ✅ Password: '+pass+' — Share with customer','success');
    renderCustomers();
  }).catch(function(err){
    var msg='Failed to add customer';
    if(err.code==='auth/email-already-in-use')msg='This email is already registered';
    else if(err.code==='auth/invalid-email')msg='Invalid email address';
    else if(err.code==='auth/weak-password')msg='Password is too weak';
    console.error(err);
    toast(msg,'error');
    btn.disabled=false;btn.textContent='Add Customer';
  });
}

function openCustomerDetail(id){
  var m=custCache.filter(function(c){return c.id===id})[0];
  if(!m)return;
  openModal(
    '<div class="modal-title">👤 '+esc(m.name||'')+'</div>'+
    
    '<div class="form-row"><label>Name</label><input id="dcName" value="'+esc(m.name||'')+'"></div>'+
    '<div class="form-row"><label>Mobile</label><input id="dcPhone" value="'+esc(m.phone||'')+'"></div>'+
    '<div class="form-row"><label>Email</label><input value="'+esc(m.email||'')+'" disabled style="opacity:.6"></div>'+
    '<div class="form-row"><label>Address</label><input id="dcAddr" value="'+esc(m.address||'')+'"></div>'+
    '<div class="form-row"><label>Package</label><select id="dcPkg">'+Object.keys(PACKAGES).map(function(k){return '<option value="'+k+'" '+(k===m.package?'selected':'')+'>'+k+' — ৳'+PACKAGES[k]+'</option>'}).join('')+'</select></div>'+
    '<div class="form-grid-2">'+
      '<div class="form-row"><label>Monthly Bill (৳)</label><input id="dcPrice" type="number" value="'+(m.packagePrice||0)+'"></div>'+
      '<div class="form-row"><label>Due Amount (৳)</label><input id="dcDue" type="number" value="'+(m.dueAmount||0)+'"></div>'+
    '</div>'+
    '<div class="form-row"><label>Status</label><select id="dcStatus">'+['active','due','expired'].map(function(s){return '<option value="'+s+'" '+(s===m.status?'selected':'')+'>'+s.charAt(0).toUpperCase()+s.slice(1)+'</option>'}).join('')+'</select></div>'+
    '<button class="btn btn-success" id="dcCollect" type="button" style="width:100%;justify-content:center;margin-top:6px;margin-bottom:10px">Collect Payment</button>' +
    '<div class="modal-actions"><button class="btn btn-outline" id="dcCancel" type="button">Cancel</button><button class="btn btn-primary" id="dcSave" type="button">Save Changes</button></div>'
  );
  $('#dcCollect').onclick = function(){
  collectPayment(id, m.name || '', Number(m.dueAmount || 0));
};
  $('#dcCancel').onclick=closeModal;
  $('#dcPkg').onchange=function(){var v=PACKAGES[$('#dcPkg').value];$('#dcPrice').value=v};
  $('#dcSave').onclick=function(){
    var btn=$('#dcSave');btn.disabled=true;btn.textContent='Saving...';
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
      toast('Customer info saved ✅','success');
      renderCustomers();
    }).catch(function(e){
      console.error(e);
      toast('Failed to save','error');
      btn.disabled=false;btn.textContent='Save Changes';
    });
  };
}

// PAYMENTS
var payTab='pending',payCache=[];
function renderPayments(){
  var body=$('#pageBody');
  body.innerHTML='<div class="empty">Loading...</div>';
  db.collection('payments').orderBy('createdAt','desc').get().catch(function(){return db.collection('payments').get()}).then(function(snap){
    payCache=snap.docs.map(function(d){var o={id:d.id};var x=d.data();for(var k in x)o[k]=x[k];return o});
    paintPayments();
  }).catch(function(e){console.error(e);body.innerHTML='<div class="empty">Failed to load</div>'});
}
function paintPayments(){
  var body=$('#pageBody');
  var list=payTab==='pending'?payCache.filter(function(p){return p.status==='pending'}):payCache;
  var pendingCount=payCache.filter(function(p){return p.status==='pending'}).length;
  body.innerHTML=
    '<div class="chips">'+
      '<button class="chip '+(payTab==='pending'?'active':'')+'" data-t="pending" type="button">Pending ('+pendingCount+')</button>'+
      '<button class="chip '+(payTab==='all'?'active':'')+'" data-t="all" type="button">All Payments</button>'+
    '</div>'+
    '<div id="payList">'+(list.length?list.map(paymentCard).join(''):'<div class="empty">No payments yet</div>')+'</div>';
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
        '<div class="list-sub">Method: '+esc(p.method||'bKash')+'</div>'+
      '</div>'+
      '<span class="pill '+cls+'">'+s.toUpperCase()+'</span>'+
    '</div>'+
    (s==='pending'?'<div style="display:flex;gap:10px">'+
      '<button class="btn btn-danger pay-reject" data-id="'+p.id+'" type="button" style="flex:1;justify-content:center">Reject</button>'+
      '<button class="btn btn-success pay-verify" data-id="'+p.id+'" type="button" style="flex:1;justify-content:center">Verify</button>'+
    '</div>':'')+
  '</div>';
}
function verifyPayment(id){
  db.collection('payments').doc(id).update({status:'verified',verifiedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){toast('Payment verified ✅','success')}).catch(function(e){console.error(e);toast('Something went wrong','error')});
}
function rejectPayment(id){
  db.collection('payments').doc(id).update({status:'rejected'}).then(function(){toast('Payment rejected','error')}).catch(function(e){console.error(e);toast('Something went wrong','error')});
}

// NOTICES
function renderNotices(){
  var body=$('#pageBody');
  body.innerHTML='<div class="empty">Loading...</div>';
  db.collection('notices').get().then(function(snap){
    var list=snap.docs.map(function(d){var o={id:d.id};var x=d.data();for(var k in x)o[k]=x[k];return o});
    body.innerHTML=
      '<button id="addNoticeBtn" class="btn btn-primary btn-block" type="button" style="margin-bottom:16px">+ Send New Notice</button>'+
      '<div id="noticeList">'+(list.length?list.map(noticeCard).join(''):'<div class="empty">No notices yet</div>')+'</div>';
    $('#addNoticeBtn').onclick=openAddNotice;
    $$('#noticeList .notice-del').forEach(function(b){b.onclick=function(){deleteNotice(b.dataset.id)}});
  }).catch(function(e){console.error(e);body.innerHTML='<div class="empty">Failed to load</div>'});
}
function noticeCard(n){
  return '<div class="card"><div style="display:flex;gap:12px;align-items:flex-start">'+
    '<div class="stat-icon stat-warning" style="width:44px;height:44px;flex-shrink:0">&#128226;</div>'+
    '<div style="flex:1;min-width:0"><div style="font-weight:700;margin-bottom:4px">'+esc(n.title||'')+'</div><div style="font-size:13px;color:var(--grey);word-break:break-word">'+esc(n.body||'')+'</div></div>'+
    '<button class="btn btn-danger notice-del" data-id="'+n.id+'" type="button" style="padding:6px 10px;font-size:12px;flex-shrink:0">Delete</button>'+
  '</div></div>';
}
function openAddNotice(){
  openModal(
    '<div class="modal-title">📢 New Notice</div>'+
    '<div class="form-row"><label>Title</label><input id="anTitle" placeholder="e.g. Internet will be down tomorrow"></div>'+
    '<div class="form-row"><label>Details</label><textarea id="anBody" rows="5" placeholder="Write the notice details..."></textarea></div>'+
    '<div class="modal-actions"><button class="btn btn-outline" id="anCancel" type="button">Cancel</button><button class="btn btn-primary" id="anSave" type="button">Send</button></div>'
  );
  $('#anCancel').onclick=closeModal;
  $('#anSave').onclick=function(){
    var t=$('#anTitle').value.trim();
    var b=$('#anBody').value.trim();
    if(!t)return toast('Please enter title','error');
    var btn=$('#anSave');btn.disabled=true;btn.textContent='Sending...';
    db.collection('notices').add({title:t,body:b,createdAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){
      closeModal();
      toast('Notice sent ✅','success');
      renderNotices();
    }).catch(function(e){console.error(e);toast('Failed to send','error');btn.disabled=false;btn.textContent='Send'});
  };
}
function deleteNotice(id){
  if(!confirm('Delete this notice?'))return;
  db.collection('notices').doc(id).delete().then(function(){toast('Notice deleted','success');renderNotices()}).catch(function(e){console.error(e);toast('Something went wrong','error')});
}

// ============ PACKAGES ============
var pkgCache = [];

function renderPackages(){
  var body = $('#pageBody');
  body.innerHTML = '<div class="empty">Loading packages...</div>';
  db.collection('packages').get()
    .then(function(snap){
      pkgCache = snap.docs.map(function(d){
        var o = {id: d.id};
        var x = d.data();
        for (var k in x) o[k] = x[k];
        return o;
      });
      pkgCache.sort(function(a,b){return (a.order||0) - (b.order||0);});
      paintPackages();
    })
    .catch(function(e){
      console.error('packages load failed:', e);
      body.innerHTML = '<div class="empty">Failed to load packages</div>';
    });
}

function paintPackages(){
  var body = $('#pageBody');
  body.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px">' +
      '<div>' +
        '<div style="font-size:16px;font-weight:700">Manage Packages</div>' +
        '<div style="font-size:12.5px;color:var(--grey);margin-top:2px">Changes here appear instantly in the customer app</div>' +
      '</div>' +
      '<button id="addPkgBtn" class="btn btn-primary" type="button">+ New Package</button>' +
    '</div>' +
    '<div id="pkgList"></div>';

  var list = $('#pkgList');
  if (pkgCache.length === 0){
    list.innerHTML = '<div class="empty">No packages yet. Tap "New Package" to add.</div>';
  } else {
    list.innerHTML = pkgCache.map(function(p){
      var active = p.isActive !== false;
      return '<div class="card" style="display:flex;align-items:center;gap:14px;padding:16px;margin-bottom:10px;flex-wrap:wrap">' +
        '<div class="stat-icon stat-info" style="width:48px;height:48px;font-size:22px;flex-shrink:0">&#128225;</div>' +
        '<div style="flex:1;min-width:120px">' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
            '<div style="font-size:16px;font-weight:700">' + esc(p.name || '') + '</div>' +
            (active ? '' : '<span class="pill pill-info">INACTIVE</span>') +
          '</div>' +
          '<div style="font-family:Poppins;font-size:14px;font-weight:700;color:var(--primary);margin-top:2px">৳' + (p.price || 0) + ' per month</div>' +
        '</div>' +
        '<button class="btn btn-outline pkg-edit" data-id="' + p.id + '" type="button" style="padding:8px 14px;font-size:13px">Edit</button>' +
        '<button class="btn btn-danger pkg-del" data-id="' + p.id + '" data-name="' + esc(p.name || '') + '" type="button" style="padding:8px 14px;font-size:13px">Delete</button>' +
      '</div>';
    }).join('');
  }

  $('#addPkgBtn').onclick = function(){ openAddPackage(null); };
  $$('.pkg-edit').forEach(function(b){
    b.onclick = function(){
      var id = b.dataset.id;
      var p = pkgCache.filter(function(x){return x.id === id})[0];
      if (p) openAddPackage(p);
    };
  });
  $$('.pkg-del').forEach(function(b){
    b.onclick = function(){
      var id = b.dataset.id;
      var name = b.dataset.name;
      if (!confirm('Delete package "' + name + '"?')) return;
      db.collection('packages').doc(id).delete()
        .then(function(){
          toast('Package deleted', 'success');
          renderPackages();
        })
        .catch(function(e){
          console.error(e);
          toast('Delete failed', 'error');
        });
    };
  });
}

function openAddPackage(existing){
  var isEdit = existing !== null && existing !== undefined;
  var name = isEdit ? (existing.name || '') : '';
  var speedNum = name ? name.replace(/\s*Mbps\s*$/i, '') : '';
  var price = isEdit ? (existing.price || 525) : 525;
  var order = isEdit ? (existing.order || 1) : (pkgCache.length + 1);
  var active = isEdit ? (existing.isActive !== false) : true;

  openModal(
  '<div class="modal-title">' + (isEdit ? 'Edit Package' : 'New Package') + '</div>' +
  '<div class="form-row"><label>Speed</label>' +
    '<div style="position:relative">' +
      '<input id="pkgName" type="number" value="' + speedNum + '" placeholder="20" style="padding-right:70px">' +
      '<span style="position:absolute;right:16px;top:50%;transform:translateY(-50%);color:var(--grey);font-weight:600;font-size:14px;pointer-events:none">Mbps</span>' +
    '</div>' +
  '</div>' +
  '<div class="form-row"><label>Monthly Price (৳)</label><input id="pkgPrice" type="number" value="' + price + '" placeholder="525"></div>' +
  '<div class="form-row"><label>Display Order</label><input id="pkgOrder" type="number" value="' + order + '" placeholder="1"></div>' +
    '<div class="form-row"><label style="display:flex;align-items:center;gap:8px;cursor:pointer">' +
      '<input type="checkbox" id="pkgActive" ' + (active ? 'checked' : '') + ' style="width:auto"> Active (visible to customers)' +
    '</label></div>' +
    '<div class="modal-actions">' +
      '<button class="btn btn-outline" id="pkgCancel" type="button">Cancel</button>' +
      '<button class="btn btn-primary" id="pkgSave" type="button">' + (isEdit ? 'Save' : 'Add') + '</button>' +
    '</div>'
  );

  $('#pkgCancel').onclick = closeModal;
  $('#pkgSave').onclick = function(){
    var rawSpeed = $('#pkgName').value.trim();
if (!rawSpeed) return toast('Enter speed', 'error');
var n = rawSpeed.replace(/\s*Mbps\s*$/i, '') + ' Mbps';
    var data = {
      name: n,
      price: Number($('#pkgPrice').value) || 0,
      order: Number($('#pkgOrder').value) || 1,
      isActive: $('#pkgActive').checked
    };
    var btn = $('#pkgSave');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    var promise = isEdit
      ? db.collection('packages').doc(existing.id).update(data)
      : db.collection('packages').add(Object.assign({}, data, {createdAt: firebase.firestore.FieldValue.serverTimestamp()}));

    promise.then(function(){
      closeModal();
      toast(isEdit ? 'Package updated' : 'Package added', 'success');
      renderPackages();
    }).catch(function(e){
      console.error(e);
      toast('Save failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = isEdit ? 'Save' : 'Add';
    });
  };
          }
// ============ PAYMENT ACTIONS v7 ============

async function verifyPaymentNew(id){
  var payRef = db.collection('payments').doc(id);
  try {
    var paySnap = await payRef.get();
    if (!paySnap.exists) return toast('Payment not found', 'error');
    var pay = paySnap.data();
    
    if (pay.status !== 'pending') {
      return toast('This payment is already ' + pay.status, 'error');
    }
    
    var userRef = db.collection('users').doc(pay.userId);
    var userSnap = await userRef.get();
    if (!userSnap.exists) return toast('Customer not found', 'error');
    var currentDue = Number(userSnap.data().dueAmount || 0);
    var amount = Number(pay.amount || 0);
    var custName = userSnap.data().name || 'Unknown';
    
    if (amount > currentDue) {
      return toast('Payment ৳' + amount + ' exceeds due ৳' + currentDue + '. Reject instead.', 'error');
    }
    
    var newDue = currentDue - amount;
    
    if (!confirm('Verify payment of ৳' + amount + ' from ' + custName + '?\n\nCurrent due: ৳' + currentDue + '\nNew due: ৳' + newDue)) {
      return;
    }
    
    var adminEmail = auth.currentUser ? auth.currentUser.email : 'unknown';
    
    await db.runTransaction(async function(tx){
      var p = await tx.get(payRef);
      if (p.data().status !== 'pending') {
        throw new Error('Already processed');
      }
      var u = await tx.get(userRef);
      var cd = Number(u.data().dueAmount || 0);
      var nd = cd - Number(p.data().amount || 0);
      
      tx.update(payRef, {
        status: 'verified',
        verifiedAt: firebase.firestore.FieldValue.serverTimestamp(),
        verifiedBy: adminEmail,
        dueAfter: nd
      });
      tx.update(userRef, {
        dueAmount: nd,
        lastPaymentDate: firebase.firestore.FieldValue.serverTimestamp(),
        lastPaymentAmount: Number(p.data().amount || 0)
      });
    });
    
    toast('Verified. Due updated to ৳' + newDue, 'success');
    if (currentPage === 'payments') renderPayments();
    else if (currentPage === 'dashboard') renderDashboard();
    else if (currentPage === 'customers') renderCustomers();
  } catch (e) {
    console.error('verify error:', e);
    toast('Error: ' + e.message, 'error');
  }
}

async function rejectPaymentNew(id){
  var reason = prompt('Reason for rejection?', 'Invalid TrxID');
  if (reason === null) return;
  if (!reason.trim()) return toast('Please provide a reason', 'error');
  
  try {
    await db.collection('payments').doc(id).update({
      status: 'rejected',
      rejectedReason: reason.trim(),
      rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
      rejectedBy: auth.currentUser ? auth.currentUser.email : 'unknown'
    });
    toast('Payment rejected', 'error');
    if (currentPage === 'payments') renderPayments();
  } catch (e) {
    console.error(e);
    toast('Error: ' + e.message, 'error');
  }
}

function collectPayment(customerId, customerName, currentDue){
  var method = 'Cash';
  var trxId = '';
  
  openModal(
    '<div class="modal-title">Collect Payment</div>' +
    '<div class="form-row"><label>Customer</label><input value="' + esc(customerName) + '" disabled style="opacity:.7"></div>' +
    '<div class="form-row"><label>Current Due (৳)</label><input value="' + currentDue + '" disabled style="opacity:.7"></div>' +
    '<div class="form-row"><label>Amount Collected (৳)</label><input id="cpAmount" type="number" value="' + currentDue + '" placeholder="0"></div>' +
    '<div class="form-row"><label>Payment Method</label><select id="cpMethod">' +
      '<option value="Cash">Cash</option>' +
      '<option value="bKash">bKash</option>' +
      '<option value="Nagad">Nagad</option>' +
      '<option value="Rocket">Rocket</option>' +
      '<option value="Bank">Bank</option>' +
    '</select></div>' +
    '<div class="form-row"><label>Transaction ID (optional for Cash)</label><input id="cpTrx" placeholder="For bKash/Nagad/Rocket"></div>' +
    '<div class="form-row"><label>Months (for record)</label><input id="cpMonths" type="number" value="1"></div>' +
    '<div class="modal-actions">' +
      '<button class="btn btn-outline" id="cpCancel" type="button">Cancel</button>' +
      '<button class="btn btn-primary" id="cpSave" type="button">Save Payment</button>' +
    '</div>'
  );
  
  $('#cpCancel').onclick = closeModal;
  $('#cpSave').onclick = async function(){
    var amt = Number($('#cpAmount').value) || 0;
    var mtd = $('#cpMethod').value;
    var trx = $('#cpTrx').value.trim();
    var mon = Number($('#cpMonths').value) || 1;
    
    if (amt <= 0) return toast('Enter valid amount', 'error');
    if (amt > currentDue) return toast('Amount exceeds due ৳' + currentDue, 'error');
    if ((mtd === 'bKash' || mtd === 'Nagad' || mtd === 'Rocket') && !trx) {
      return toast('TrxID required for ' + mtd, 'error');
    }
    
    var btn = $('#cpSave');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    
    try {
      var userRef = db.collection('users').doc(customerId);
      var userSnap = await userRef.get();
      if (!userSnap.exists) throw new Error('Customer not found');
      
      var adminEmail = auth.currentUser ? auth.currentUser.email : 'unknown';
      var newPayRef = db.collection('payments').doc();
      
      var finalDue = 0;
      await db.runTransaction(async function(tx){
        var u = await tx.get(userRef);
        var cd = Number(u.data().dueAmount || 0);
        if (amt > cd) throw new Error('Amount exceeds current due ৳' + cd);
        var nd = cd - amt;
        finalDue = nd;
        
        tx.set(newPayRef, {
          userId: customerId,
          amount: amt,
          method: mtd,
          trxId: trx,
          months: mon,
          status: 'verified',
          entryType: 'admin',
          submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
          verifiedAt: firebase.firestore.FieldValue.serverTimestamp(),
          verifiedBy: adminEmail,
          dueBefore: cd,
          dueAfter: nd
        });
        tx.update(userRef, {
          dueAmount: nd,
          lastPaymentDate: firebase.firestore.FieldValue.serverTimestamp(),
          lastPaymentAmount: amt
        });
      });
      
      closeModal();
      toast('Collected ৳' + amt + '. Due now ৳' + finalDue, 'success');
      if (currentPage === 'customers') renderCustomers();
      else if (currentPage === 'dashboard') renderDashboard();
      else if (currentPage === 'payments') renderPayments();
    } catch(e){
      console.error(e);
      toast('Error: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Save Payment';
    }
  };
}

// Override old functions with new ones
verifyPayment = verifyPaymentNew;
rejectPayment = rejectPaymentNew;
console.log('[JAJ Net Admin] v4.0 loaded');

// ============ PAYMENT v8a ============
var custLookup = {};

async function renderPayments(){
  var body = document.querySelector('#pageBody');
  body.innerHTML = '<div class="empty">Loading...</div>';
  try {
    var paySnap = await db.collection('payments').get();
    var usersSnap = await db.collection('users').get();
    custLookup = {};
    usersSnap.docs.forEach(function(d){
      var u = d.data();
      custLookup[d.id] = {
        name: u.name || 'Unknown',
        phone: u.phone || '',
        due: Number(u.dueAmount || 0)
      };
    });
    payCache = paySnap.docs.map(function(d){
      var o = {id: d.id}; var x = d.data();
      for (var k in x) o[k] = x[k];
      return o;
    });
    paintPayments();
  } catch(e){
    console.error(e);
    body.innerHTML = '<div class="empty">Failed to load</div>';
  }
}

function paymentCard(p){
  var s = p.status || 'pending';
  var cls = s === 'verified' ? 'pill-success' : s === 'pending' ? 'pill-warning' : 'pill-error';
  var ic = s === 'verified' ? '&#10003;' : s === 'pending' ? '&#8987;' : '&#10005;';
  var cust = custLookup[p.userId] || { name: 'Unknown', phone: '' };
  return '<div class="card">' +
    '<div class="list-row" style="border:none;padding:0 0 12px">' +
      '<div class="stat-icon stat-' + (s==='verified'?'success':s==='pending'?'warning':'error') + '" style="width:44px;height:44px">' + ic + '</div>' +
      '<div class="list-main">' +
        '<div class="list-title">' + esc(cust.name) + ' <span class="num" style="color:var(--primary);font-weight:700;margin-left:4px">&#2547;' + (p.amount||0) + '</span></div>' +
        '<div class="list-sub">' + esc(cust.phone || '') + '</div>' +
        '<div class="list-sub">TrxID: ' + esc(p.trxId||'') + ' &bull; ' + esc(p.method||'bKash') + '</div>' +
      '</div>' +
      '<span class="pill ' + cls + '">' + s.toUpperCase() + '</span>' +
    '</div>' +
    (s==='pending' ?
      '<div style="display:flex;gap:10px">' +
        '<button class="btn btn-danger pay-reject" data-id="' + p.id + '" type="button" style="flex:1;justify-content:center">Reject</button>' +
        '<button class="btn btn-success pay-verify" data-id="' + p.id + '" type="button" style="flex:1;justify-content:center">Verify</button>' +
      '</div>' : '') +
    '</div>';
}

// ============ PAYMENT v8b: Verify + Reject Modals ============
function verifyPaymentNew(id){
  var pay = payCache.filter(function(x){return x.id===id})[0];
  if (!pay) return toast('Payment not found','error');
  var cust = custLookup[pay.userId] || { name: 'Unknown', phone: '', due: 0 };
  var currentDue = cust.due;
  var newDue = currentDue - Number(pay.amount||0);
  if (pay.status !== 'pending') return toast('Already ' + pay.status, 'error');
  if (Number(pay.amount||0) > currentDue) {
    return toast('Warning: ' + cust.name + ' has only ' + currentDue + ' due. Cannot verify ' + pay.amount + '.', 'error');
  }
  openModal(
    '<div class="modal-title">Confirm Verification</div>' +
    '<div style="text-align:center;padding:10px 0 20px">' +
      '<div class="stat-icon stat-success" style="width:64px;height:64px;font-size:30px;margin:0 auto 14px;border-radius:50%">&#10003;</div>' +
      '<div style="font-family:Poppins;font-size:24px;font-weight:700;color:var(--ink)">&#2547;' + pay.amount + '</div>' +
      '<div style="color:var(--grey);font-size:13px;margin-top:6px">' + esc(cust.name) + ' &bull; ' + esc(cust.phone) + '</div>' +
    '</div>' +
    '<div style="background:var(--cream);padding:14px;border-radius:12px;margin-bottom:18px">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--grey);font-size:13px">Current Due</span><span style="font-family:Poppins;font-weight:700;color:var(--error)">&#2547;' + currentDue + '</span></div>' +
      '<div style="display:flex;justify-content:space-between"><span style="color:var(--grey);font-size:13px">After Verification</span><span style="font-family:Poppins;font-weight:700;color:var(--success)">&#2547;' + newDue + '</span></div>' +
    '</div>' +
    '<div class="modal-actions"><button class="btn btn-outline" id="vCancel" type="button">Cancel</button><button class="btn btn-success" id="vConfirm" type="button">Confirm Verify</button></div>'
  );
  document.querySelector('#vCancel').onclick = closeModal;
  document.querySelector('#vConfirm').onclick = function(){
    this.disabled = true;
    this.textContent = 'Verifying...';
    doVerifyPayment(id);
  };
}

async function doVerifyPayment(id){
  var payRef = db.collection('payments').doc(id);
  try {
    var paySnap = await payRef.get();
    if (!paySnap.exists) return toast('Not found','error');
    var pay = paySnap.data();
    if (pay.status !== 'pending') return toast('Already processed','error');
    var userRef = db.collection('users').doc(pay.userId);
    var userSnap = await userRef.get();
    if (!userSnap.exists) return toast('Customer not found','error');
    var adminEmail = auth.currentUser ? auth.currentUser.email : 'unknown';
    var finalDue = 0;
    var custName = userSnap.data().name || 'Customer';
    await db.runTransaction(async function(tx){
      var p = await tx.get(payRef);
      if (p.data().status !== 'pending') throw new Error('Already processed');
      var u = await tx.get(userRef);
      var cd = Number(u.data().dueAmount || 0);
      var amt = Number(p.data().amount || 0);
      if (amt > cd) throw new Error('Amount exceeds due');
      var nd = cd - amt;
      finalDue = nd;
      tx.update(payRef, {status: 'verified', verifiedAt: firebase.firestore.FieldValue.serverTimestamp(), verifiedBy: adminEmail, dueAfter: nd});
      tx.update(userRef, {dueAmount: nd, lastPaymentDate: firebase.firestore.FieldValue.serverTimestamp(), lastPaymentAmount: amt});
    });
    closeModal();
    toast('Verified. ' + custName + ' due now ' + finalDue, 'success');
    renderPayments();
  } catch(e){
    console.error(e); toast('Error: ' + e.message, 'error'); closeModal();
  }
}

function rejectPaymentNew(id){
  var pay = payCache.filter(function(x){return x.id===id})[0];
  if (!pay) return toast('Not found','error');
  var cust = custLookup[pay.userId] || { name: 'Unknown', phone: '' };
  openModal(
    '<div class="modal-title">Reject Payment</div>' +
    '<div style="padding:10px 0 16px">' +
      '<div style="font-family:Poppins;font-size:18px;font-weight:700;color:var(--ink);margin-bottom:6px">&#2547;' + pay.amount + '</div>' +
      '<div style="color:var(--grey);font-size:13px">' + esc(cust.name) + ' &bull; ' + esc(cust.phone) + '</div>' +
      '<div style="color:var(--grey);font-size:12px;margin-top:4px">TrxID: ' + esc(pay.trxId||'') + '</div>' +
    '</div>' +
    '<div class="form-row"><label>Reason for rejection</label><textarea id="rjReason" rows="3">Invalid TrxID</textarea></div>' +
    '<div class="modal-actions"><button class="btn btn-outline" id="rjCancel" type="button">Cancel</button><button class="btn btn-danger" id="rjConfirm" type="button">Confirm Reject</button></div>'
  );
  document.querySelector('#rjCancel').onclick = closeModal;
  document.querySelector('#rjConfirm').onclick = async function(){
    var reason = document.querySelector('#rjReason').value.trim();
    if (!reason) return toast('Provide a reason','error');
    this.disabled = true;
    this.textContent = 'Rejecting...';
    try {
      await db.collection('payments').doc(id).update({
        status: 'rejected',
        rejectedReason: reason,
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
        rejectedBy: auth.currentUser ? auth.currentUser.email : 'unknown'
      });
      closeModal();
      toast('Payment rejected', 'error');
      renderPayments();
    } catch(e){ console.error(e); toast('Error: ' + e.message, 'error'); }
  };
}

// Override old handlers
verifyPayment = verifyPaymentNew;
rejectPayment = rejectPaymentNew;
