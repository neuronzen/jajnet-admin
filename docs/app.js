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

const WORKER_URL = 'https://jajnet-notifications.neuronzen57.workers.dev/';

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
            billing:   {title: 'Billing', render: renderBilling},
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
  Promise.all([db.collection('users').get(),db.collection('payments').get(),db.collection('billingRecords').where('period','==',(new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0'))).get()]).then(function(res){
    var users=res[0].docs,pays=res[1].docs,billingRecords=res[2].docs;
    var active=0,due=0,expired=0,dueAmt=0;
    users.forEach(function(d){
      var m=d.data(),s=m.status||'';
      if(s==='deleted')return;
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
      ((function(){var chargedCount = {};billingRecords.forEach(function(r){ if(r.data().userId) chargedCount[r.data().userId]=true; });var activeUsers = users.filter(function(u){ var s=(u.data().status||'').toLowerCase(); return s==='active'; });var notCharged = activeUsers.filter(function(u){ return !chargedCount[u.id]; });if (notCharged.length === 0) return '';var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];var d = new Date();var label = monthNames[d.getMonth()] + ' ' + d.getFullYear();return '<div style="background:linear-gradient(135deg,#FF9F5A 0%,#FF6B00 100%);border-radius:16px;padding:16px;margin-bottom:16px;display:flex;align-items:center;gap:14px;box-shadow:0 8px 20px rgba(255,107,0,0.25)">'+'<div style="width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,0.22);display:grid;place-items:center;flex-shrink:0">&#9888;</div>'+'<div style="flex:1;min-width:0;color:#fff">'+'<div style="font-weight:700;font-size:15px">Monthly Charge Pending</div>'+'<div style="font-size:12.5px;opacity:0.92;margin-top:2px">'+label+' — '+notCharged.length+' customers not charged yet</div>'+'</div>'+'<button class="btn" data-goto="billing" style="background:#fff;color:#FF6B00;padding:10px 16px;font-size:13px;font-weight:700;flex-shrink:0">Apply Now</button>'+'</div>';})()) + '<h4 class="section-title">Business Overview</h4>'+
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
      (function(){
        var dueList = users.filter(function(d){
          var m = d.data();
          var s = (m.status || '').toLowerCase();
          if (s === 'deleted' || s === 'suspended') return false;
          return Number(m.dueAmount || 0) > 0;
        }).map(function(d){ return {id: d.id, m: d.data()}; });
        dueList.sort(function(a,b){ return Number(b.m.dueAmount||0) - Number(a.m.dueAmount||0); });
        if (dueList.length === 0) return '';
        var totalDue = 0;
        dueList.forEach(function(x){ totalDue += Number(x.m.dueAmount||0); });
        var items = dueList.slice(0, 5).map(function(x){
          var m = x.m;
          var name = esc(m.name||'');
          var cid = esc(m.customerId||'');
          var amt = Number(m.dueAmount||0);
          return '<div class="list-row" style="padding:10px 0">'+
            '<div class="avatar" style="width:32px;height:32px;font-size:12px">'+init(m.name)+'</div>'+
            '<div class="list-main">'+
              '<div class="list-title" style="font-size:13px">'+name+(cid?' <span class="pill pill-info" style="font-size:9px;margin-left:4px">'+cid+'</span>':'')+'</div>'+
              '<div class="list-sub">'+esc(m.phone||'')+'</div>'+
            '</div>'+
            '<span class="amount" style="color:var(--error);font-size:13px">৳'+amt+'</span>'+
          '</div>';
        }).join('');
        return '<div style="background:#fff;border-radius:16px;padding:16px;margin-bottom:16px;box-shadow:var(--card-shadow);border-left:4px solid var(--error)">'+
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'+
            '<div class="stat-icon stat-error" style="width:36px;height:36px;font-size:16px;border-radius:10px">&#9888;</div>'+
            '<div style="flex:1;min-width:0">'+
              '<div style="font-weight:700;font-size:14px">Due Collections</div>'+
              '<div style="font-size:11.5px;color:var(--grey);margin-top:1px">'+dueList.length+' customers &bull; total ৳'+totalDue.toLocaleString()+'</div>'+
            '</div>'+
            '<button class="btn" data-goto="customers" style="background:var(--cream);color:var(--primary);padding:8px 14px;font-size:12px;font-weight:700">View All</button>'+
          '</div>'+
          '<div style="border-top:1px solid var(--grey-light);padding-top:6px">'+
            items+
            (dueList.length > 5 ? '<div style="text-align:center;padding:8px;color:var(--grey);font-size:11.5px">+ '+(dueList.length-5)+' more customers</div>' : '')+
          '</div>'+
        '</div>';
      })() +
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
  // Always hide deleted customers
  list=list.filter(function(m){return m.status !== 'deleted'});
  if(custFilter!=='all')list=list.filter(function(m){return m.status===custFilter});

  body.innerHTML=
    '<div class="toolbar">'+
      '<div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="custSearchInput" placeholder="Search by name, phone, email..." value="'+esc(custSearch)+'"></div>'+
      '<button id="remindBtn" class="btn btn-outline" type="button" style="margin-right:8px;color:#F59E0B;border-color:#F59E0B">📢 Remind</button>' +
                '<button id="assignAllBtn" class="btn btn-outline" type="button" style="margin-right:8px">Assign IDs</button>' +
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
  var remindBtn = $('#remindBtn');
  if(remindBtn)remindBtn.onclick=openReminderModal;
  var assignAllBtn=$('#assignAllBtn');
  if(assignAllBtn)assignAllBtn.onclick=assignAllMissing;
  $$('.assign-id-btn').forEach(function(b){
    b.onclick=function(e){
      e.stopPropagation();
      assignCustomerId(b.dataset.id);
    };
  });
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
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:2px">'+
        '<div class="customer-name" style="margin-bottom:0">'+esc(m.name||'')+'</div>'+
        (m.customerId ? '<span class="pill pill-info" style="font-size:9px">'+esc(m.customerId)+'</span>' : '<button class="btn btn-outline assign-id-btn" data-id="'+m.id+'" type="button" style="padding:2px 8px;font-size:10px">+ ID</button>')+
      '</div>'+
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
      '<div class="form-row"><label>Monthly Bill (৳)</label><input id="acPrice" type="number" value="" placeholder="e.g. 525"></div>'+
      '<div class="form-row"><label>Discount (৳)</label><input id="acDiscount" type="number" value="" placeholder="0 (optional)"></div>'+
      '<div class="form-row"><label>Current Due (৳)</label><input id="acDue" type="number" value="" placeholder="e.g. 525"></div>'+
    '</div>'+
    '<div class="form-row"><label>Status</label><select id="acStatus"><option value="active">Active</option><option value="due">Due</option><option value="expired">Expired</option></select></div>'+
    '<div class="modal-actions"><button class="btn btn-outline" id="acCancel" type="button">Cancel</button><button class="btn btn-primary" id="acSave" type="button">Add Customer</button></div>'
  );
  $('#acPkg').onchange=function(){
    var v=PACKAGES[$('#acPkg').value];
    if(!$('#acPrice').value)$('#acPrice').value=v;
    if(!$('#acDue').value)$('#acDue').value=v;
  };
  $('#acCancel').onclick=closeModal;
  $('#acSave').onclick=submitAddCustomer;
}
async function submitAddCustomer(){
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
  var newCustomerId = await generateCustomerId();
  sAuth.createUserWithEmailAndPassword(email,pass).then(function(cred){
    return db.collection('users').doc(cred.user.uid).set({
      name:name,phone:$('#acPhone').value.trim(),email:email,
      address:$('#acAddr').value.trim(),
      package:$('#acPkg').value,
      packagePrice:Number($('#acPrice').value)||0,
      dueAmount:Number($('#acDue').value)||0,
      monthlyDiscount:Number($('#acDiscount').value)||0,
      status:$('#acStatus').value,
      customerId:newCustomerId,
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
  var m = custCache.filter(function(x){return x.id===id})[0];
  if (!m) return;

  var status = (m.status || 'active').toString();
  var isSuspended = status === 'suspended';
  var statusColor = status==='active'?'#10B981':status==='due'?'#F59E0B':status==='suspended'?'#F59E0B':'#EF4444';
  var statusBg = status==='active'?'rgba(16,185,129,0.12)':status==='due'?'rgba(245,158,11,0.14)':status==='suspended'?'rgba(245,158,11,0.14)':'rgba(239,68,68,0.12)';

  var infoRow = function(label, value, color){
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #FFEBD8">'+
      '<span style="font-family:Hind Siliguri,sans-serif;font-size:12px;color:#8A92A0">'+label+'</span>'+
      '<span style="font-family:Hind Siliguri,sans-serif;font-size:13px;font-weight:700;color:'+(color||'#151A26')+';text-align:right">'+value+'</span>'+
    '</div>';
  };

  var actionBtn = function(action, icon, label, color){
    return '<div data-action="'+action+'" data-id="'+m.id+'" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:14px 8px;border-radius:14px;background:#FFF8F2;border:1.5px solid #FFEBD8;cursor:pointer;font-family:Hind Siliguri,sans-serif;font-size:12.5px;font-weight:600;color:#151A26;min-height:76px;-webkit-tap-highlight-color:transparent">'+
      '<span style="font-size:22px;color:'+color+'">'+icon+'</span>'+
      '<span>'+label+'</span>'+
    '</div>';
  };

  openModal(
    '<div class="modal-title" style="margin-bottom:6px">' + esc(m.name || '') + '</div>' +
    '<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap">' +
      '<span style="padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;font-family:Poppins,sans-serif;letter-spacing:.3px;background:'+statusBg+';color:'+statusColor+'">' + status.toUpperCase() + '</span>' +
      (m.customerId ? '<span style="padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;font-family:Poppins,sans-serif;letter-spacing:.3px;background:rgba(46,125,255,0.12);color:#2E7DFF">' + esc(m.customerId) + '</span>' : '') +
    '</div>' +

    '<div style="background:#FFF8F2;border-radius:12px;padding:4px 14px;margin-bottom:14px">' +
      infoRow('Mobile', esc(m.phone || '-')) +
      infoRow('Email', esc(m.email || '-')) +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0">' +
        '<span style="font-family:Hind Siliguri,sans-serif;font-size:12px;color:#8A92A0">Address</span>' +
        '<span style="font-family:Hind Siliguri,sans-serif;font-size:13px;font-weight:700;color:#151A26;text-align:right">' + esc(m.address || '-') + '</span>' +
      '</div>' +
    '</div>' +

    '<div style="background:#FFF8F2;border-radius:12px;padding:4px 14px;margin-bottom:16px">' +
      infoRow('Package', esc(m.package || '-')) +
      infoRow('Monthly Bill', '৳'+(m.packagePrice||0), '#FF6B00') +
      (Number(m.monthlyDiscount||0) > 0 ? infoRow('Discount', '- ৳' + m.monthlyDiscount, '#059669') : '') +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0">' +
        '<span style="font-family:Hind Siliguri,sans-serif;font-size:12px;color:#8A92A0">Current Due</span>' +
        '<span style="font-family:Hind Siliguri,sans-serif;font-size:13px;font-weight:700;color:' + (Number(m.dueAmount||0) > 0 ? '#EF4444' : '#059669') + ';text-align:right">৳'+(m.dueAmount||0)+'</span>' +
      '</div>' +
    '</div>' +

    '<div style="font-size:13px;font-weight:700;margin:18px 0 10px;color:#151A26;font-family:Hind Siliguri,sans-serif">Actions</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:6px">' +
      actionBtn('collect', '&#128176;', 'Collect Payment', '#059669') +
      actionBtn('edit', '&#9998;', 'Edit Details', '#FF6B00') +
      actionBtn('suspend', isSuspended ? '&#9654;' : '&#10074;&#10074;', isSuspended ? 'Activate' : 'Suspend', '#F59E0B') +
      actionBtn('delete', '&#128465;', 'Delete', '#EF4444') +
    '</div>' +

    '<div class="modal-actions" style="margin-top:14px">' +
      '<button class="btn btn-outline" id="dcClose" type="button" style="flex:1;justify-content:center">Close</button>' +
    '</div>'
  );

  document.querySelector('#dcClose').onclick = closeModal;

  document.querySelectorAll('[data-action]').forEach(function(btn){
    btn.onclick = function(){
      var action = btn.dataset.action;
      var cid = btn.dataset.id;
      if (action === 'collect') { closeModal(); collectPayment(cid, m.name||'', Number(m.dueAmount||0)); }
      else if (action === 'edit') { closeModal(); setTimeout(function(){ openCustomerEdit(cid); }, 200); }
      else if (action === 'suspend') { closeModal(); setTimeout(function(){ doSuspend(cid, m.status); }, 200); }
      else if (action === 'delete') { closeModal(); setTimeout(function(){ doDelete(cid, m.name||''); }, 200); }
    };
  });
}

// ============ New: Suspend/Delete helper functions ============
function doSuspend(id, curStatus){
  var newStatus = (curStatus === 'suspended') ? 'active' : 'suspended';
  var actionText = (newStatus === 'suspended') ? 'Suspend' : 'Activate';
  openModal(
    '<div class="modal-title">' + actionText + ' Customer</div>' +
    '<div style="text-align:center;padding:10px 0 20px">' +
      '<div class="stat-icon stat-warning" style="width:64px;height:64px;font-size:30px;margin:0 auto 14px;border-radius:50%">' +
        (newStatus === 'suspended' ? '&#10074;&#10074;' : '&#9654;') +
      '</div>' +
      '<div style="font-weight:700;font-size:15px">' + (newStatus === 'suspended' ? 'Suspend this customer?' : 'Activate this customer?') + '</div>' +
      '<div style="color:var(--grey);font-size:13px;margin-top:6px">' + (newStatus === 'suspended' ? 'They will not be able to login to the app.' : 'They will be able to login again.') + '</div>' +
    '</div>' +
    '<div class="modal-actions">' +
      '<button class="btn btn-outline" id="suspendCancel" type="button">Cancel</button>' +
      '<button class="btn ' + (newStatus === 'suspended' ? 'btn-outline' : 'btn-success') + '" id="suspendConfirm" type="button" style="' + (newStatus === 'suspended' ? 'color:#F59E0B;border-color:#F59E0B' : '') + '">' + actionText + '</button>' +
    '</div>'
  );
  document.querySelector('#suspendCancel').onclick = closeModal;
  document.querySelector('#suspendConfirm').onclick = function(){
    this.disabled = true;
    this.textContent = '...';
    db.collection('users').doc(id).update({status: newStatus}).then(function(){
      closeModal();
      toast('Customer ' + (newStatus === 'suspended' ? 'suspended' : 'activated'), 'success');
      renderCustomers();
    }).catch(function(e){
      console.error(e); toast('Failed: ' + e.message, 'error');
    });
  };
}

function doDelete(id, name){
  openModal(
    '<div class="modal-title">Delete Customer</div>' +
    '<div style="text-align:center;padding:10px 0 20px">' +
      '<div class="stat-icon stat-error" style="width:64px;height:64px;font-size:30px;margin:0 auto 14px;border-radius:50%">&#128465;</div>' +
      '<div style="font-weight:700;font-size:15px">' + esc(name) + '</div>' +
      '<div style="color:var(--grey);font-size:13px;margin-top:6px">This customer will be hidden from the list.</div>' +
    '</div>' +
    '<div style="background:rgba(255,71,87,0.08);border:1px solid rgba(255,71,87,0.2);padding:14px;border-radius:12px;margin-bottom:18px">' +
      '<div style="color:#FF4757;font-size:13px;line-height:1.6;font-weight:600">⚠ Warning</div>' +
      '<div style="color:#8A92A0;font-size:12px;line-height:1.6;margin-top:4px">Payment history will remain. This cannot be undone from the app.</div>' +
    '</div>' +
    '<div class="modal-actions">' +
      '<button class="btn btn-outline" id="delCancel" type="button">Cancel</button>' +
      '<button class="btn" id="delConfirm" type="button" style="background:#FF4757;color:#fff;flex:1">Delete</button>' +
    '</div>'
  );
  document.querySelector('#delCancel').onclick = closeModal;
  document.querySelector('#delConfirm').onclick = function(){
    this.disabled = true;
    this.textContent = 'Deleting...';
    db.collection('users').doc(id).update({status: 'deleted'}).then(function(){
      closeModal();
      toast('Customer deleted', 'success');
      renderCustomers();
    }).catch(function(e){
      console.error(e); toast('Failed: ' + e.message, 'error');
    });
  };
}

// ============ New: Separate Edit Modal ============
function openCustomerEdit(id){
  var m = custCache.filter(function(x){return x.id===id})[0];
  if (!m) return;
  openModal(
    '<div class="modal-title">Edit Customer</div>' +
    '<div class="form-row"><label>Name</label><input id="ecName" value="' + esc(m.name||'') + '" placeholder="Full name"></div>' +
    '<div class="form-row"><label>Mobile</label><input id="ecPhone" value="' + esc(m.phone||'') + '" placeholder="01XXXXXXXXX"></div>' +
    '<div class="form-row"><label>Email</label><input value="' + esc(m.email||'') + '" disabled style="opacity:.6"></div>' +
    '<div class="form-row"><label>Address</label><input id="ecAddr" value="' + esc(m.address||'') + '" placeholder="Address / Area"></div>' +
    '<div class="form-row"><label>Package</label><select id="ecPkg">' +
      Object.keys(PACKAGES).map(function(k){return '<option value="'+k+'" '+(k===m.package?'selected':'')+'>'+k+' — ৳'+PACKAGES[k]+'</option>'}).join('') +
    '</select></div>' +
    '<div class="form-grid-2">' +
      '<div class="form-row"><label>Monthly Bill (৳)</label><input id="ecPrice" type="number" value="' + (m.packagePrice||'') + '" placeholder="525"></div>' +
      '<div class="form-row"><label>Discount (৳)</label><input id="ecDiscount" type="number" value="' + (m.monthlyDiscount||'') + '" placeholder="0 (optional)"></div>' +
    '</div>' +
    '<div class="form-row"><label>Due Amount (৳)</label><input id="ecDue" type="number" value="' + (m.dueAmount||'') + '" placeholder="0"></div>' +
    '<div class="form-row"><label>Status</label><select id="ecStatus">' +
      ['active','due','expired'].map(function(s){return '<option value="'+s+'" '+(s===m.status?'selected':'')+'>'+s.charAt(0).toUpperCase()+s.slice(1)+'</option>'}).join('') +
    '</select></div>' +
    '<div class="modal-actions">' +
      '<button class="btn btn-outline" id="ecCancel" type="button">Cancel</button>' +
      '<button class="btn btn-primary" id="ecSave" type="button">Save Changes</button>' +
    '</div>'
  );
  document.querySelector('#ecCancel').onclick = closeModal;
  document.querySelector('#ecPkg').onchange = function(){
    var v = PACKAGES[document.querySelector('#ecPkg').value];
    document.querySelector('#ecPrice').value = v;
  };
  document.querySelector('#ecSave').onclick = function(){
    var btn = this;
    btn.disabled = true;
    btn.textContent = 'Saving...';
    db.collection('users').doc(id).update({
      name: document.querySelector('#ecName').value.trim(),
      phone: document.querySelector('#ecPhone').value.trim(),
      address: document.querySelector('#ecAddr').value.trim(),
      package: document.querySelector('#ecPkg').value,
      packagePrice: Number(document.querySelector('#ecPrice').value)||0,
      monthlyDiscount: Number(document.querySelector('#ecDiscount').value)||0,
      dueAmount: Number(document.querySelector('#ecDue').value)||0,
      status: document.querySelector('#ecStatus').value
    }).then(function(){
      closeModal();
      toast('Customer updated', 'success');
      renderCustomers();
    }).catch(function(e){
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Save Changes';
    });
  };
}

// PAYMENTS
var payTab='pending',payCache=[],paySearch='';
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
  
  // Filter by search
  if (paySearch && paySearch.trim()) {
    var q = paySearch.trim().toLowerCase();
    list = list.filter(function(p){
      var cust = custLookup[p.userId] || {};
      var trx = (p.trxId||'').toLowerCase();
      var name = (cust.name||'').toLowerCase();
      var phone = (cust.phone||'').toLowerCase();
      var amt = String(p.amount||'');
      return trx.indexOf(q) !== -1 || name.indexOf(q) !== -1 || 
             phone.indexOf(q) !== -1 || amt.indexOf(q) !== -1;
    });
  }
  
  body.innerHTML=
    '<div class="chips">'+
      '<button class="chip '+(payTab==='pending'?'active':'')+'" data-t="pending" type="button">Pending ('+pendingCount+')</button>'+
      '<button class="chip '+(payTab==='all'?'active':'')+'" data-t="all" type="button">All Payments</button>'+
    '</div>'+
    '<div style="position:relative;margin-bottom:14px">'+
      '<input id="paySearchInput" type="text" placeholder="Search by TrxID, name, phone, or amount" value="'+esc(paySearch)+'" style="width:100%;padding:12px 14px 12px 40px;border-radius:12px;background:var(--cream);border:1.5px solid transparent;font-family:Hind Siliguri;font-size:14px;color:var(--ink)">'+
      '<span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--primary);font-size:16px">&#128269;</span>'+
    '</div>'+
    '<div id="payList">'+(list.length?list.map(paymentCard).join(''):'<div class="empty">'+(paySearch?'No payments match "&quot;'+esc(paySearch)+'&quot;"':'No payments yet')+'</div>')+'</div>';
  
  $$('.chips .chip').forEach(function(c){c.onclick=function(){payTab=c.dataset.t;paintPayments()}});
  $$('#payList .pay-verify').forEach(function(b){b.onclick=function(){verifyPayment(b.dataset.id)}});
  $$('#payList .pay-reject').forEach(function(b){b.onclick=function(){rejectPayment(b.dataset.id)}});
  
  var si = $('#paySearchInput');
  if (si) {
    si.oninput = function(e){
      paySearch = e.target.value;
      var pos = si.selectionStart;
      paintPayments();
      var ns = $('#paySearchInput');
      if (ns) { ns.focus(); ns.setSelectionRange(pos, pos); }
    };
  }
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
      '<button id="addNoticeBtn" class="btn btn-primary btn-block" type="button" style="margin-bottom:10px">+ Send New Notice</button>' +
      '<button id="sendNotifBtn" class="btn btn-outline btn-block" type="button" style="margin-bottom:16px;color:var(--primary);border-color:var(--primary)">🔔 Send Push Notification</button>'+
      '<div id="noticeList">'+(list.length?list.map(noticeCard).join(''):'<div class="empty">No notices yet</div>')+'</div>';
    $('#addNoticeBtn').onclick=openAddNotice;
    var notifBtn=$('#sendNotifBtn');
    if(notifBtn)notifBtn.onclick=openNotificationModal;
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


// ============ CUSTOMER ID SYSTEM ============
async function generateCustomerId(){
  var counterRef = db.collection('counters').doc('customerId');
  var newId = null;
  await db.runTransaction(async function(tx){
    var snap = await tx.get(counterRef);
    var current = 0;
    if (snap.exists) {
      current = Number(snap.data().value || 0);
    } else {
      var usersSnap = await db.collection('users').get();
      current = usersSnap.size;
    }
    var next = current + 1;
    tx.set(counterRef, {value: next}, {merge: true});
    newId = 'JAJ-' + String(next).padStart(3, '0');
  });
  return newId;
}

async function assignCustomerId(userId){
  try {
    var userRef = db.collection('users').doc(userId);
    var snap = await userRef.get();
    if (!snap.exists) return toast('Customer not found','error');
    if (snap.data().customerId) {
      return toast('Already has ID: ' + snap.data().customerId, 'error');
    }
    var custName = snap.data().name || 'Customer';
    openModal(
      '<div class="modal-title">Assign Customer ID</div>' +
      '<div style="text-align:center;padding:14px 0 20px">' +
        '<div class="stat-icon stat-info" style="width:64px;height:64px;font-size:30px;margin:0 auto 14px;border-radius:50%">&#127991;</div>' +
        '<div style="font-weight:700;font-size:16px">' + esc(custName) + '</div>' +
        '<div style="color:var(--grey);font-size:13px;margin-top:6px">will get a unique ID</div>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-outline" id="aOneCancel" type="button">Cancel</button>' +
        '<button class="btn btn-primary" id="aOneConfirm" type="button">Assign</button>' +
      '</div>'
    );
    document.querySelector('#aOneCancel').onclick = closeModal;
    var btn = document.querySelector('#aOneConfirm');
    btn.onclick = async function(){
      btn.disabled = true;
      btn.textContent = 'Assigning...';
      try {
        var newId = await generateCustomerId();
        await userRef.update({customerId: newId});
        closeModal();
        toast('Assigned: ' + newId, 'success');
        renderCustomers();
      } catch(e) {
        console.error(e);
        toast('Failed: ' + e.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Assign';
      }
    };
  } catch(e) {
    console.error(e);
    toast('Failed: ' + e.message, 'error');
  }
}

function assignAllMissing(){
  var usersSnapCache = null;
  db.collection('users').get().then(function(snap){
    var missing = snap.docs.filter(function(d){ return !d.data().customerId; });
    if (missing.length === 0) return toast('All customers already have IDs', 'success');
    
    openModal(
      '<div class="modal-title">Assign Customer IDs</div>' +
      '<div style="text-align:center;padding:14px 0 20px">' +
        '<div class="stat-icon stat-info" style="width:64px;height:64px;font-size:30px;margin:0 auto 14px;border-radius:50%">&#127991;</div>' +
        '<div style="font-weight:700;font-size:16px">' + missing.length + ' customers</div>' +
        '<div style="color:var(--grey);font-size:13px;margin-top:6px">will get IDs (JAJ-001, JAJ-002...)</div>' +
      '</div>' +
      '<div style="color:var(--grey);font-size:12px;margin-bottom:14px;line-height:1.6;text-align:center">This assigns unique IDs to customers who do not have one yet.</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-outline" id="aAllCancel" type="button">Cancel</button>' +
        '<button class="btn btn-primary" id="aAllConfirm" type="button">Assign Now</button>' +
      '</div>'
    );
    document.querySelector('#aAllCancel').onclick = closeModal;
    var btn = document.querySelector('#aAllConfirm');
    btn.onclick = async function(){
      btn.disabled = true;
      btn.textContent = 'Processing...';
      try {
        var counterRef = db.collection('counters').doc('customerId');
        var counterSnap = await counterRef.get();
        var start = counterSnap.exists ? Number(counterSnap.data().value || 0) : 0;
        var count = 0;
        for (var i = 0; i < missing.length; i++) {
          var doc = missing[i];
          start++;
          var newId = 'JAJ-' + String(start).padStart(3, '0');
          await db.collection('users').doc(doc.id).update({customerId: newId});
          count++;
        }
        await counterRef.set({value: start}, {merge: true});
        closeModal();
        toast('Assigned ' + count + ' customer IDs', 'success');
        renderCustomers();
      } catch(e) {
        console.error(e);
        toast('Failed: ' + e.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Assign Now';
      }
    };
  }).catch(function(e){
    console.error(e);
    toast('Failed to load customers', 'error');
  });
}


function resetCharges(){
  var now = new Date();
  var period = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
  var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var periodLabel = monthNames[now.getMonth()] + ' ' + now.getFullYear();
  
  db.collection('billingRecords').where('period','==',period).get().then(function(snap){
    var count = snap.size;
    if (count === 0) return toast('No charges to reset', 'error');
    
    openModal(
      '<div class="modal-title">Reset Monthly Charges</div>' +
      '<div style="text-align:center;padding:14px 0 20px">' +
        '<div class="stat-icon stat-error" style="width:64px;height:64px;font-size:30px;margin:0 auto 14px;border-radius:50%">&#9888;</div>' +
        '<div style="font-weight:700;font-size:16px">' + periodLabel + '</div>' +
        '<div style="color:var(--grey);font-size:13px;margin-top:6px">' + count + ' customers</div>' +
      '</div>' +
      '<div style="background:rgba(255,71,87,0.08);border:1px solid rgba(255,71,87,0.2);padding:14px;border-radius:12px;margin-bottom:18px">' +
        '<div style="color:var(--error);font-size:13px;line-height:1.6;font-weight:600">Warning</div>' +
        '<div style="color:var(--grey);font-size:12px;line-height:1.6;margin-top:4px">This will remove the monthly charge from each customer\'s due amount. After reset, you can apply charges again with the correct price.</div>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-outline" id="rcCancel" type="button">Cancel</button>' +
        '<button class="btn btn-danger" id="rcConfirm" type="button">Reset Charges</button>' +
      '</div>'
    );
    document.querySelector('#rcCancel').onclick = closeModal;
    var btn = document.querySelector('#rcConfirm');
    btn.onclick = async function(){
      btn.disabled = true;
      btn.textContent = 'Resetting...';
      var success = 0;
      var failed = 0;
      try {
        for (var i = 0; i < snap.docs.length; i++) {
          var rec = snap.docs[i];
          var rdata = rec.data();
          var userId = rdata.userId;
          var charge = Number(rdata.charge || 0);
          try {
            var userRef = db.collection('users').doc(userId);
            await db.runTransaction(async function(tx){
              var uSnap = await tx.get(userRef);
              if (!uSnap.exists) throw new Error('missing');
              var cd = Number(uSnap.data().dueAmount || 0);
              var nd = cd - charge;
              if (nd < 0) nd = 0;
              tx.update(userRef, {dueAmount: nd});
              tx.delete(rec.ref);
            });
            success++;
          } catch(e) {
            failed++;
          }
        }
        closeModal();
        toast('Reset ' + success + ' charges' + (failed>0 ? ' (' + failed + ' failed)' : ''), 'success');
        renderBilling();
      } catch(e) {
        console.error(e);
        toast('Error: ' + e.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Reset Charges';
      }
    };
  }).catch(function(e){
    console.error(e);
    toast('Failed to load records', 'error');
  });
}



// Handle data-goto buttons anywhere in the app
document.addEventListener('click', function(e){
  var el = e.target.closest && e.target.closest('[data-goto]');
  if (el) {
    var page = el.getAttribute('data-goto');
    if (page && typeof goto === 'function') goto(page);
  }
});



// ============ SEND REMINDER ============
function openReminderModal(){
  if (custCache.length === 0) return toast('No customers to remind', 'error');

  var dueList = custCache.filter(function(m){
    return m.status !== 'deleted' && m.status !== 'suspended' && Number(m.dueAmount || 0) > 0;
  });

  if (dueList.length === 0) {
    return toast('No customers with pending dues', 'success');
  }

  var totalDue = 0;
  dueList.forEach(function(m){ totalDue += Number(m.dueAmount || 0); });

  var customerRows = dueList.map(function(m, idx){
    var phone = (m.phone || '').replace(/[^0-9]/g, '');
    var waPhone = phone.startsWith('0') ? '88' + phone : phone;
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #F0F0F0">' +
      '<div class="avatar" style="width:34px;height:34px;font-size:12px;flex-shrink:0">' + init(m.name) + '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-weight:600;font-size:12.5px;color:#151A26;font-family:Hind Siliguri,sans-serif">' + esc(m.name || '') + '</div>' +
        '<div style="font-size:11px;color:#8A92A0;font-family:Poppins,sans-serif">' + esc(m.phone || '') + '</div>' +
      '</div>' +
      '<div style="font-family:Poppins,sans-serif;font-weight:700;color:#EF4444;font-size:12px;margin-right:4px">৳' + (m.dueAmount || 0) + '</div>' +
      '<button class="btn btn-success wa-btn" data-phone="' + waPhone + '" data-name="' + esc(m.name || '') + '" data-amt="' + (m.dueAmount || 0) + '" type="button" style="padding:6px 10px;font-size:11px;flex-shrink:0">' +
        '💬 WhatsApp' +
      '</button>' +
    '</div>';
  }).join('');

  openModal(
    '<div class="modal-title">Send Payment Reminders</div>' +
    '<div style="text-align:center;padding:8px 0 14px">' +
      '<div class="stat-icon stat-warning" style="width:60px;height:60px;font-size:28px;margin:0 auto 12px;border-radius:50%">&#128227;</div>' +
      '<div style="font-weight:700;font-size:14px">' + dueList.length + ' customers owe ৳' + totalDue.toLocaleString() + '</div>' +
      '<div style="color:var(--grey);font-size:12px;margin-top:4px">Tap WhatsApp button next to each customer</div>' +
    '</div>' +
    '<div style="max-height:320px;overflow-y:auto;background:#FFF8F2;border-radius:12px;padding:4px 14px;margin-bottom:14px">' +
      customerRows +
    '</div>' +
    '<div class="modal-actions" style="flex-direction:column;gap:8px">' +
      '<button class="btn btn-outline" id="copyAllBtn" type="button" style="width:100%;justify-content:center">📋 Copy All Numbers</button>' +
    '</div>' +
    '<div class="modal-actions" style="margin-top:8px">' +
      '<button class="btn btn-outline" id="remindClose" type="button" style="flex:1;justify-content:center">Close</button>' +
    '</div>'
  );

  document.querySelector('#remindClose').onclick = closeModal;

  document.querySelector('#copyAllBtn').onclick = function(){
    var text = dueList.map(function(m){
      return (m.customerId || '') + ' | ' + (m.name || '') + ' | ' + (m.phone || '') + ' | ৳' + (m.dueAmount || 0);
    }).join('\n');
    navigator.clipboard.writeText(text).then(function(){
      toast('Copied ' + dueList.length + ' customers', 'success');
    }).catch(function(){
      toast('Copy failed', 'error');
    });
  };

  // Wire each WhatsApp button
  document.querySelectorAll('.wa-btn').forEach(function(btn){
    btn.onclick = function(){
      var phone = btn.dataset.phone;
      var name = btn.dataset.name;
      var amt = btn.dataset.amt;
      var msg = 'প্রিয় ' + name + ', আপনার JAJ Net বিল ৳' + amt + ' বাকি আছে। অনুগ্রহ করে পরিশোধ করুন। ধন্যবাদ।';
      var url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);
      window.open(url, '_blank');
    };
  });
}



// ============ PUSH NOTIFICATIONS ============
function openNotificationModal(){
  openModal(
    '<div class="modal-title">🔔 Send Push Notification</div>' +
    '<div style="color:var(--grey);font-size:12.5px;line-height:1.6;margin-bottom:16px">' +
      'Notification will appear on all customers\' phones (even when app is closed).' +
    '</div>' +
    '<div class="form-row"><label>Title *</label><input id="notifTitle" placeholder="e.g. বিল পরিশোধের সময়"></div>' +
    '<div class="form-row"><label>Message *</label><textarea id="notifBody" rows="3" placeholder="e.g. আপনার বিল পরিশোধের সময় হয়েছে।"></textarea></div>' +
    '<div class="form-row"><label>Target</label>' +
      '<select id="notifTarget">' +
        '<option value="all">📢 All customers (topic: jajnet_all)</option>' +
        '<option value="none" disabled>--- Specific customer coming soon ---</option>' +
      '</select>' +
    '</div>' +
    '<div id="notifStatus" style="display:none;padding:10px;border-radius:10px;font-size:12.5px;line-height:1.5;margin-top:10px"></div>' +
    '<div class="modal-actions">' +
      '<button class="btn btn-outline" id="notifCancel" type="button">Cancel</button>' +
      '<button class="btn btn-primary" id="notifSend" type="button">Send Now</button>' +
    '</div>'
  );
  
  document.querySelector('#notifCancel').onclick = closeModal;
  
  var sendBtn = document.querySelector('#notifSend');
  var statusDiv = document.querySelector('#notifStatus');
  
  sendBtn.onclick = async function(){
    var title = document.querySelector('#notifTitle').value.trim();
    var msgBody = document.querySelector('#notifBody').value.trim();
    
    if (!title) return showNotifStatus('Please enter a title', 'error');
    if (!msgBody) return showNotifStatus('Please enter a message', 'error');
    
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    showNotifStatus('Sending notification...', 'info');
    
    try {
      var res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title,
          body: msgBody,
          topic: 'jajnet_all',
        }),
      });
      
      var data = await res.json();
      
      if (data.ok) {
        showNotifStatus('✓ Sent successfully to all customers!', 'success');
        setTimeout(function(){
          closeModal();
          toast('Notification sent ✅', 'success');
        }, 1500);
      } else {
        showNotifStatus('Error: ' + (data.error || 'Unknown error'), 'error');
        console.error(data);
      }
    } catch (e) {
      showNotifStatus('Network error: ' + e.message, 'error');
      console.error(e);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Now';
    }
  };
  
  function showNotifStatus(msg, type){
    var colors = {
      info: { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
      success: { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
      error: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
    };
    var c = colors[type] || colors.info;
    statusDiv.style.display = 'block';
    statusDiv.style.background = c.bg;
    statusDiv.style.color = c.color;
    statusDiv.style.border = '1px solid ' + c.border;
    statusDiv.textContent = msg;
  }
}

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


// ============ BILLING v9 ============
function renderBilling(){
  var body = document.querySelector('#pageBody');
  body.innerHTML = '<div class="empty">Loading...</div>';
  var now = new Date();
  var period = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
  var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var periodLabel = monthNames[now.getMonth()] + ' ' + now.getFullYear();

  Promise.all([
    db.collection('users').get(),
    db.collection('billingRecords').where('period','==',period).get()
  ]).then(function(results){
    var users = results[0].docs;
    var records = results[1].docs;
    var chargedIds = {};
    records.forEach(function(r){ if(r.data().userId) chargedIds[r.data().userId]=true; });
    var activeUsers = users.filter(function(u){ return (u.data().status||'').toLowerCase()==='active'; });
    var notCharged = activeUsers.filter(function(u){ return !chargedIds[u.id]; });

    body.innerHTML =
      '<div class="hero-card" style="margin-bottom:20px">' +
        '<div class="hero-text"><h3>' + periodLabel + '</h3><p>Monthly charge cycle</p></div>' +
        '<div class="hero-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>' +
      '</div>' +
      '<div class="stats-grid" style="margin-bottom:20px">' +
        '<div class="stat-card"><div class="stat-icon stat-info">&#128101;</div><div class="stat-body"><div class="stat-label">Active</div><div class="stat-value num">' + activeUsers.length + '</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon stat-success">&#10003;</div><div class="stat-body"><div class="stat-label">Charged</div><div class="stat-value num">' + (activeUsers.length - notCharged.length) + '</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon stat-warning">&#8987;</div><div class="stat-body"><div class="stat-label">Pending</div><div class="stat-value num">' + notCharged.length + '</div></div></div>' +
      '</div>' +
      (notCharged.length > 0
        ? '<button id="applyChargeBtn" class="btn btn-primary" style="width:100%;justify-content:center;padding:18px;font-size:15px">Apply ' + periodLabel + ' charge to ' + notCharged.length + ' customers</button>'
        : '<div class="card" style="text-align:center;padding:30px"><div class="stat-icon stat-success" style="width:60px;height:60px;font-size:28px;margin:0 auto 14px;border-radius:50%">&#10003;</div><div style="font-weight:700;font-size:16px">All charged for ' + periodLabel + '</div></div>' +
          '<button id="resetChargeBtn" class="btn btn-outline" type="button" style="width:100%;justify-content:center;padding:14px;margin-top:10px;color:var(--error);border-color:var(--error)">Reset Charges for ' + periodLabel + '</button>'
      );

    if (notCharged.length > 0){
      document.querySelector('#applyChargeBtn').onclick = function(){
        applyMonthlyCharge(period, periodLabel, notCharged);
      };
    }
    var resetBtn = document.querySelector('#resetChargeBtn');
    if (resetBtn) resetBtn.onclick = resetCharges;
  }).catch(function(e){
    body.innerHTML = '<div class="empty">Failed: ' + e.message + '</div>';
  });
}

function applyMonthlyCharge(period, periodLabel, customers){
  var totalAmount = 0;
  customers.forEach(function(u){
    var d = u.data();
    var price = Number(d.packagePrice || 0);
    var disc = Number(d.monthlyDiscount || 0);
    totalAmount += Math.max(0, price - disc);
  });
  openModal(
    '<div class="modal-title">Confirm Monthly Charge</div>' +
    '<div style="text-align:center;padding:14px 0 20px">' +
      '<div class="stat-icon stat-warning" style="width:64px;height:64px;font-size:30px;margin:0 auto 14px;border-radius:50%">&#128181;</div>' +
      '<div style="font-weight:700;font-size:16px">' + periodLabel + '</div>' +
      '<div style="color:var(--grey);font-size:13px;margin-top:6px">' + customers.length + ' customers</div>' +
    '</div>' +
    '<div style="background:var(--cream);padding:14px;border-radius:12px;margin-bottom:18px">' +
      '<div style="display:flex;justify-content:space-between"><span style="color:var(--grey);font-size:13px">Total Expected</span><span style="font-family:Poppins;font-weight:700;color:var(--primary)">&#2547;' + totalAmount.toLocaleString() + '</span></div>' +
    '</div>' +
    '<div style="color:var(--grey);font-size:12px;margin-bottom:14px;line-height:1.6">Each customer\'s due will increase by their package price. This cannot be undone.</div>' +
    '<div class="modal-actions"><button class="btn btn-outline" id="mcCancel" type="button">Cancel</button><button class="btn btn-primary" id="mcConfirm" type="button">Charge Now</button></div>'
  );
  document.querySelector('#mcCancel').onclick = closeModal;
  var btn = document.querySelector('#mcConfirm');
  btn.onclick = async function(){
    btn.disabled = true;
    btn.textContent = 'Processing...';
    var success = 0, failed = 0;
    var adminEmail = auth.currentUser ? auth.currentUser.email : 'unknown';
    for (var i = 0; i < customers.length; i++){
      var u = customers[i];
      var d = u.data();
      var price = Number(d.packagePrice || 0);
      var disc = Number(d.monthlyDiscount || 0);
      var effective = Math.max(0, price - disc);
      if (effective <= 0) { failed++; continue; }
      try {
        var userRef = db.collection('users').doc(u.id);
        var recRef = db.collection('billingRecords').doc(u.id + '_' + period);
        await db.runTransaction(async function(tx){
          var recSnap = await tx.get(recRef);
          if (recSnap.exists) return;
          var userSnap = await tx.get(userRef);
          if (!userSnap.exists) throw new Error('missing');
          var cd = Number(userSnap.data().dueAmount || 0);
          var nd = cd + price;
          tx.update(userRef, {dueAmount: nd});
          tx.set(recRef, {
            userId: u.id,
            period: period,
            charge: price,
            addedAt: firebase.firestore.FieldValue.serverTimestamp(),
            addedBy: adminEmail
          });
        });
        success++;
      } catch(e){
        failed++;
      }
      if ((i+1) % 10 === 0){
        btn.textContent = 'Processing ' + (i+1) + ' / ' + customers.length + '...';
      }
    }
    closeModal();
    toast('Charged ' + success + ' customers' + (failed>0 ? ' (' + failed + ' failed)' : ''), 'success');
    renderBilling();
  };
}
