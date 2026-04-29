/* ═══════════════════════════════════════════════════════════════
   ASTRAMIND — App Controller v1.1.0
   Fixed: Blend tab, city search (global via Nominatim), all rendering
═══════════════════════════════════════════════════════════════ */

const App = (function () {

  // ── State ────────────────────────────────────────────────────
  let S = {
    users: [], currentUserId: null, insights: [], blends: [],
    activeBlendId: null, chartSystem: 'western',
    activePeriod: 'daily', activeTab: 'home',
    formStep: 0, formData: {}, selectedCity: null,
    creatorStep: 0, creatorData: {},
    testPanelOpen: false
  };

  // ── LocalStorage ─────────────────────────────────────────────
  function save() {
    try {
      localStorage.setItem('am_users',    JSON.stringify(S.users));
      localStorage.setItem('am_current',  S.currentUserId || '');
      localStorage.setItem('am_insights', JSON.stringify(S.insights));
      localStorage.setItem('am_blends',   JSON.stringify(S.blends));
    } catch(e) { console.warn('Save failed', e); }
  }

  function load() {
    try {
      const u = localStorage.getItem('am_users');
      const c = localStorage.getItem('am_current');
      const i = localStorage.getItem('am_insights');
      const b = localStorage.getItem('am_blends');
      if (u) S.users    = JSON.parse(u);
      if (c) S.currentUserId = c;
      if (i) S.insights = JSON.parse(i);
      if (b) S.blends   = JSON.parse(b);
      // Restore Date objects in dasha
      for (const user of S.users) {
        if (user.chart && user.chart.dasha) {
          user.chart.dasha = user.chart.dasha.map(d => ({
            ...d, startDate: new Date(d.startDate), endDate: new Date(d.endDate)
          }));
        }
      }
    } catch(e) { console.warn('Load failed', e); }
  }

  // ── Helpers ───────────────────────────────────────────────────
  const $  = id => document.getElementById(id);
  const html = (id, h) => { const el = $(id); if (el) el.innerHTML = h; };
  const show = (id) => { const el = $(id); if (el) el.style.display = ''; };
  const hide = (id) => { const el = $(id); if (el) el.style.display = 'none'; };

  function signEmoji(s) {
    return {Aries:'♈',Taurus:'♉',Gemini:'♊',Cancer:'♋',Leo:'♌',Virgo:'♍',
            Libra:'♎',Scorpio:'♏',Sagittarius:'♐',Capricorn:'♑',Aquarius:'♒',Pisces:'♓'}[s]||'';
  }

  function dashaEmoji(p) {
    return {Sun:'👑',Moon:'🌙',Mars:'🔥',Mercury:'🧠',Jupiter:'🌟',Venus:'💖',Saturn:'⚖️',Rahu:'🚀',Ketu:'🔮'}[p]||'✦';
  }

  function currentUser() { return S.users.find(u => u.id === S.currentUserId) || null; }
  function userInsights(uid) { return S.insights.filter(i => i.userId === (uid || S.currentUserId)); }

  function makeStars(id) {
    const el = $(id); if (!el) return; el.innerHTML = '';
    for (let i = 0; i < 80; i++) {
      const s = document.createElement('div'); s.className = 'star-dot';
      s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${Math.random()*2+0.5}px;height:${Math.random()*2+0.5}px;--d:${2+Math.random()*4}s;--del:${Math.random()*4}s;--op:${0.3+Math.random()*0.6}`;
      el.appendChild(s);
    }
  }

  // ── Screens & Tabs ────────────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = $(id); if (el) el.classList.add('active');
  }

  function switchTab(tab) {
    S.activeTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    const el = $(`tab-${tab}`); if (el) el.classList.add('active');
    if (tab === 'home')     renderHome();
    if (tab === 'chart')    renderChart();
    if (tab === 'insights') renderInsights();
    if (tab === 'blend')    renderBlend();
    if (tab === 'profile')  renderProfile();
  }

  function switchPeriod(period) {
    S.activePeriod = period;
    document.querySelectorAll('.ptab').forEach(b => b.classList.toggle('active', b.dataset.period === period));
    document.querySelectorAll('.period').forEach(p => p.classList.remove('active'));
    const el = $(`period-${period}`); if (el) el.classList.add('active');
    if (period !== 'decision') renderPeriodContent(period);
  }

  // ── Insights Generation ───────────────────────────────────────
  function generateInsights(userId) {
    const uid  = userId || S.currentUserId;
    const user = S.users.find(u => u.id === uid);
    if (!user) return;
    S.insights = S.insights.filter(i => i.userId !== uid);
    const generated = InsightEngine.generateAll(user.chart, user.name, uid);
    S.insights.push(...generated);
    save();
  }

  // ── HOME ──────────────────────────────────────────────────────
  function renderHome() {
    const user = currentUser(); if (!user) return;
    const { chart } = user;
    const h = new Date().getHours();
    const greeting = h<12?'Good morning':h<17?'Good afternoon':'Good evening';
    const date = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
    html('greeting-meta',  `${greeting.toUpperCase()} · ${date.toUpperCase()}`);
    html('greeting-name',  `${user.name.split(' ')[0]} 👋`);
    html('greeting-signs', `${signEmoji(chart.sunSign)} ${chart.sunSign} Sun · ${signEmoji(chart.moonSign)} ${chart.moonSign} Moon · ${signEmoji(chart.ascendantSign)} ${chart.ascendantSign} Rising`);
    html('hdr-signs', `${chart.sunSign.slice(0,3)} · ${chart.moonSign.slice(0,3)} · ${chart.ascendantSign.slice(0,3)}`);
    renderBig3Compact();
    renderDailyHero();
    renderWeeklySnap();
    renderDashaHome();
  }

  function renderBig3Compact() {
    const user = currentUser(); if (!user) return;
    const { chart } = user;
    html('big3', [
      {label:'SUN ☉',   sign:chart.sunSign,        sub:'Your core self',   color:'#f59e0b'},
      {label:'MOON ☽',  sign:chart.moonSign,       sub:'Your emotions',    color:'#e2e8f0'},
      {label:'RISING ↑',sign:chart.ascendantSign,  sub:'First impression', color:'#8b5cf6'}
    ].map(it => `<div class="big3-card">
      <div class="big3-label">${it.label}</div>
      <div class="big3-sign" style="color:${it.color}">${it.sign}</div>
      <div class="big3-sub">${it.sub}</div>
    </div>`).join(''));
  }

  function renderDailyHero() {
    const ins = userInsights();
    const daily = ins.find(i => i.category==='general') || ins[0];
    if (!daily) return;
    html('daily-hero-title', daily.title);
    const bodyEl = $('daily-hero-body');
    if (bodyEl) {
      bodyEl.textContent = daily.content;
      bodyEl.style.cssText = 'display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden';
    }
    const btn = $('daily-expand-btn');
    if (btn) btn.onclick = () => {
      const exp = bodyEl.style.webkitLineClamp === 'none';
      bodyEl.style.webkitLineClamp = exp ? '4' : 'none';
      bodyEl.style.overflow = exp ? 'hidden' : 'visible';
      btn.textContent = exp ? 'Read full ▼' : 'Show less ▲';
    };
  }

  function renderWeeklySnap() {
    const ins = userInsights();
    const CFG = {career:{icon:'💼',color:'#8b5cf6'},wealth:{icon:'💰',color:'#f59e0b'},love:{icon:'💕',color:'#f43f5e'}};
    const cards = Object.entries(CFG).map(([cat,{icon,color}]) => {
      const i = ins.find(x => x.category===cat);
      if (!i) return '';
      return `<div class="snap-card" onclick="App.switchTab('insights')">
        <div class="snap-icon">${icon}</div>
        <div class="snap-text">
          <div class="snap-title">${i.title}</div>
          <div class="snap-body">${i.content}</div>
        </div>
        <button class="snap-bm" style="color:${i.bookmarked?'#f59e0b':'#4a4870'}" onclick="event.stopPropagation();App.toggleBookmark('${i.id}')">${i.bookmarked?'★':'☆'}</button>
      </div>`;
    }).join('');
    html('weekly-snap', cards || '<div class="empty-state"><div class="es-sub">Tap Insights to generate your readings.</div></div>');
  }

  function renderDashaHome() {
    const user = currentUser(); if (!user) return;
    const active = user.chart.dasha.find(d => d.isActive);
    if (!active) return;
    const prog = AstrologyEngine.dashaProgress(active);
    html('dasha-home', `<div class="dasha-card-home" style="border-color:${active.color}25;background:${active.color}06">
      <div class="dc-top">
        <div class="dc-planet" style="background:${active.color}20;border:1px solid ${active.color}40;color:${active.color}">${dashaEmoji(active.planet)}</div>
        <div><div class="dc-name">${active.planet} Period</div>
        <div class="dc-date">Ends ${AstrologyEngine.fmtDate(active.endDate)} · ${AstrologyEngine.dashaTimeLeft(active)}</div></div>
        <div class="dc-badge">ACTIVE NOW</div>
      </div>
      <div class="dc-progress"><div class="dc-fill" style="width:${prog}%;background:linear-gradient(90deg,${active.color},${active.color}80)"></div></div>
      <p class="dc-body">${active.plainEnglish}</p>
      <button class="dc-link" style="color:${active.color}" onclick="App.switchTab('chart')">See your full chart →</button>
    </div>`);
  }

  // ── CHART ─────────────────────────────────────────────────────
  function renderChart() {
    const user = currentUser(); if (!user) return;
    const { chart, birthData } = user;
    const sys = S.chartSystem;
    html('chart-meta', `${birthData.place} · ${birthData.dob} · ${birthData.time}`);
    $('vedic-note').style.display = sys==='vedic' ? 'block' : 'none';

    const T = AstrologyEngine.SIGN_TRAITS;
    const big3 = [
      {label:'Sun ☉', sign:sys==='western'?chart.sunSign:chart.vedicSun, meaning:'Your core personality and how you express confidence. This is who you are when you\'re most yourself.', color:'#f59e0b', glyph:'☉'},
      {label:'Moon ☽', sign:sys==='western'?chart.moonSign:chart.vedicMoon, meaning:'Your emotional nature and what makes you feel safe. Your inner world and gut instincts.', color:'#e2e8f0', glyph:'☽'},
      {label:'Rising ↑', sign:sys==='western'?chart.ascendantSign:chart.vedicAsc, meaning:'Your outer personality and first impression. How strangers perceive you before they know you.', color:'#8b5cf6', glyph:'↑'}
    ];
    html('big3-expanded', '<div style="padding:0 20px">' + big3.map(it => {
      const tr = T[it.sign] || {};
      return `<div class="b3e-card">
        <div class="b3e-top">
          <div class="b3e-glyph" style="color:${it.color}">${it.glyph}</div>
          <div class="b3e-meta"><div class="b3e-label">${it.label}</div><div class="b3e-sign" style="color:${it.color}">${it.sign}</div></div>
          <div class="b3e-right"><div class="b3e-element">${tr.element||''}</div><div class="b3e-mode">${tr.mode||''}</div></div>
        </div>
        <div class="b3e-meaning">${it.meaning}</div>
        ${tr.vibe?`<div class="b3e-vibe" style="background:${it.color}08;color:${it.color}"><strong>Vibe:</strong> ${tr.vibe}</div>`:''}
      </div>`;
    }).join('') + '</div>');

    // Planet list
    html('planet-list', [chart.ascendant,...chart.planets].map(p => {
      const sign = sys==='western'?p.sign:p.vedicSign;
      const hm   = AstrologyEngine.HOUSE_MEANINGS[p.house]||'';
      return `<div class="planet-item">
        <div class="planet-row" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.planet-caret').textContent=this.nextElementSibling.classList.contains('open')?'▲':'▼'">
          <div class="planet-glyph" style="background:${p.color}18;border:1px solid ${p.color}30;color:${p.color}">${p.symbol}</div>
          <div class="planet-info">
            <div class="planet-name">${p.name} ${p.emoji||''} ${p.retrograde?'<span class="retro-badge">℞ Retrograde</span>':''}</div>
            <div class="planet-pos">${p.degree.toFixed(1)}° ${sign} · House ${p.house}</div>
          </div>
          <div class="planet-caret">▼</div>
        </div>
        <div class="planet-detail">
          <div class="planet-meaning">${p.meaning}</div>
          <div class="planet-house-detail" style="background:${p.color}08;border:1px solid ${p.color}18">
            <div class="phl" style="color:${p.color}">In House ${p.house}</div>
            <div style="color:var(--text-secondary);font-size:13px">${hm}</div>
          </div>
          ${p.retrograde?'<div class="retro-detail">℞ Retrograde: This planet\'s energy is internalized — felt deeply but slower to express outwardly.</div>':''}
        </div>
      </div>`;
    }).join(''));

    // Yogas
    html('yogas-wrap', chart.yoga.length > 0 ? `<div class="yogas-section">
      <div class="sec-label" style="margin-bottom:10px">SPECIAL PATTERNS IN YOUR CHART</div>
      ${chart.yoga.map(y=>`<div class="yoga-card"><div class="yoga-name">✦ ${y.name}</div><div class="yoga-meaning">${y.meaning}</div></div>`).join('')}
    </div>` : '');

    if ($('chart-diagram-wrap').style.display !== 'none') drawChart(chart);
  }

  function drawChart(chart) {
    const canvas = $('chart-canvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W=300, H=300, s=75;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='rgba(7,7,26,0.9)'; ctx.beginPath(); ctx.roundRect(0,0,W,H,12); ctx.fill();
    const byH = {};
    for (const p of [chart.ascendant,...chart.planets]) { if(!byH[p.house]) byH[p.house]=[]; byH[p.house].push(p); }
    const pos = [{h:12,x:0,y:0,w:s,ht:s},{h:1,x:s,y:0,w:s*2,ht:s},{h:2,x:s*3,y:0,w:s,ht:s},
      {h:11,x:0,y:s,w:s,ht:s*2},{h:3,x:s*3,y:s,w:s,ht:s*2},
      {h:10,x:s,y:s,w:s,ht:s},{h:4,x:s*2,y:s,w:s,ht:s},{h:9,x:s,y:s*2,w:s,ht:s},{h:5,x:s*2,y:s*2,w:s,ht:s},
      {h:8,x:0,y:s*3,w:s,ht:s},{h:7,x:s,y:s*3,w:s*2,ht:s},{h:6,x:s*3,y:s*3,w:s,ht:s}];
    for (const {h,x,y,w,ht} of pos) {
      ctx.fillStyle='rgba(13,13,43,0.7)'; ctx.strokeStyle='rgba(139,92,246,0.2)'; ctx.lineWidth=0.5;
      ctx.beginPath(); ctx.roundRect(x+1,y+1,w-2,ht-2,3); ctx.fill(); ctx.stroke();
      ctx.fillStyle='rgba(139,92,246,0.5)'; ctx.font='9px JetBrains Mono'; ctx.fillText(h,x+5,y+13);
      const hd = chart.houses[h-1];
      if (hd) { ctx.fillStyle='rgba(155,152,196,0.6)'; ctx.font='7px JetBrains Mono'; ctx.textAlign='center'; ctx.fillText(hd.sign.slice(0,3),x+w/2,y+(ht===s?19:16)); ctx.textAlign='left'; }
      (byH[h]||[]).slice(0,4).forEach((p,pi) => {
        ctx.fillStyle=p.color||'#f59e0b'; ctx.font='11px serif';
        ctx.fillText((p.symbol||'•')+(p.retrograde?'ᴿ':''), x+6+(pi%2)*(w/2-6), y+(ht===s?34:30)+Math.floor(pi/2)*13);
      });
    }
    ctx.strokeStyle='rgba(139,92,246,0.12)'; ctx.lineWidth=0.5;
    [[s,s,s*3,s*3],[s*3,s,s,s*3],[s,s,s*3,s],[s,s*3,s*3,s*3],[s,s,s,s*3],[s*3,s,s*3,s*3]].forEach(([x1,y1,x2,y2])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();});

    const tip = $('house-tip');
    canvas.onclick = (e) => {
      const r=canvas.getBoundingClientRect(), mx=(e.clientX-r.left)*(W/r.width), my=(e.clientY-r.top)*(H/r.height);
      for (const {h,x,y,w,ht} of pos) {
        if (mx>=x&&mx<=x+w&&my>=y&&my<=y+ht) {
          const hd=chart.houses[h-1], ps=(byH[h]||[]).map(p=>p.name).join(', ');
          tip.style.display='block';
          tip.innerHTML=`<strong style="color:var(--violet)">House ${h} · ${hd?hd.sign:''}</strong><br>${hd?hd.meaning:''} ${ps?`<br><em style="color:var(--gold)">Contains: ${ps}</em>`:''}`;
          return;
        }
      }
      tip.style.display='none';
    };
  }

  // ── INSIGHTS ──────────────────────────────────────────────────
  function renderInsights() {
    const user = currentUser(); if (!user) return;
    html('insights-meta', `${user.chart.sunSign} Sun · ${user.chart.moonSign} Moon · ${user.chart.ascendantSign} Rising`);
    renderPeriodContent(S.activePeriod);
    if (S.activePeriod !== 'decision') {
      document.querySelectorAll('.ptab').forEach(b => b.classList.toggle('active', b.dataset.period === S.activePeriod));
      document.querySelectorAll('.period').forEach(p => p.classList.remove('active'));
      const pel = $(`period-${S.activePeriod}`); if (pel) pel.classList.add('active');
    }
    setupDecisionMode();
    renderDecisionHistory();
    setupQuickQuestions();
  }

  function renderPeriodContent(period) {
    if (period==='decision') return;
    const user = currentUser(); if (!user) return;
    const el   = $(`period-${period}`); if (!el) return;
    const ins  = userInsights();
    const active = user.chart.dasha.find(d=>d.isActive);
    const yoga   = user.chart.yoga[0];
    const mon    = new Date().toLocaleDateString('en-US',{month:'long',day:'numeric'});
    const CFG    = {career:{icon:'💼',color:'#8b5cf6',label:'Career'},wealth:{icon:'💰',color:'#f59e0b',label:'Money'},love:{icon:'💕',color:'#f43f5e',label:'Love'},health:{icon:'🌿',color:'#10b981',label:'Health'},general:{icon:'✦',color:'#06b6d4',label:'General'}};

    const overview = `<div class="period-overview">
      <div class="po-top">
        <div class="po-icon">${period==='daily'?'☀️':period==='weekly'?'📅':'🌙'}</div>
        <div><div class="po-name">${period==='daily'?'Today':period==='weekly'?'This Week':'This Month'}'s Snapshot</div>
        <div class="po-date">${mon} · ${user.chart.sunSign} Sun · ${user.chart.moonSign} Moon</div></div>
      </div>
      <div class="po-body">You're currently in your <strong style="color:var(--text-primary)">${active?active.planet:''} Chapter</strong> — ${active?active.plainEnglish.split('.')[0]:''}.</div>
      ${yoga?`<div class="po-yoga"><div class="po-yoga-name">✦ ${yoga.name}</div><div class="po-yoga-meaning">${yoga.meaning}</div></div>`:''}
    </div>`;

    const filtered = period==='daily' ? ins.filter(i=>i.period==='daily')
      : period==='weekly' ? ins.filter(i=>['daily','weekly'].includes(i.period))
      : ins;

    const cards = filtered.length===0
      ? '<div class="empty-state"><div class="es-icon">◎</div><div class="es-title">No insights yet</div></div>'
      : filtered.map(i => {
          const cfg = CFG[i.category]||CFG.general;
          return `<div class="ins-card" style="border-left:2px solid ${cfg.color}">
            <div class="ins-card-inner">
              <div class="ins-cat"><span class="ins-cat-icon">${cfg.icon}</span><span class="ins-cat-label">${cfg.label.toUpperCase()}</span></div>
              <div class="ins-title">${i.title}</div>
              <div class="ins-body" id="ib-${i.id}">${i.content}</div>
              <div class="ins-actions">
                <button class="read-more-sm" onclick="App.expandInsight('${i.id}')">Read more ▼</button>
                <button class="bm-btn" style="color:${i.bookmarked?'#f59e0b':'#4a4870'}" onclick="App.toggleBookmark('${i.id}')">${i.bookmarked?'★':'☆'}</button>
              </div>
            </div>
          </div>`;
        }).join('');
    el.innerHTML = overview + cards;
  }

  function expandInsight(id) {
    const el = $(`ib-${id}`); if (!el) return;
    const btn = el.parentElement.querySelector('.read-more-sm');
    const exp = el.classList.toggle('expanded');
    if (btn) btn.textContent = exp?'Show less ▲':'Read more ▼';
  }

  function toggleBookmark(id) {
    const i = S.insights.find(x=>x.id===id); if (!i) return;
    i.bookmarked = !i.bookmarked; save();
    document.querySelectorAll(`button[onclick*="'${id}'"]`).forEach(btn => {
      if (btn.className.includes('bm') || btn.className.includes('snap-bm')) {
        btn.textContent = i.bookmarked?'★':'☆';
        btn.style.color = i.bookmarked?'#f59e0b':'#4a4870';
      }
    });
  }

  function setupQuickQuestions() {
    const qs = ['Should I switch jobs right now?','Is this a good time to start a business?','Should I relocate to another city?','Is this a good period for investments?','What does my chart say about this relationship?','Is this a good time to ask for a raise?','Should I start freelancing?','What\'s my best financial move right now?'];
    html('quick-qs', qs.map(q=>`<button class="quick-q" onclick="App.selectQ(this,'${q.replace(/'/g,"\\'")}')">${q}</button>`).join(''));
  }

  function selectQ(btn, q) {
    document.querySelectorAll('.quick-q').forEach(b=>b.classList.remove('sel'));
    btn.classList.add('sel');
    const ta = $('decision-ta'); if (ta) ta.value = q;
  }

  function setupDecisionMode() {
    const btn = $('ask-btn'); if (!btn) return;
    btn.onclick = () => {
      const ta = $('decision-ta'); const q = ta?ta.value.trim():'';
      if (!q) return;
      const user = currentUser(); if (!user) return;
      btn.disabled = true;
      $('ask-loading').style.display = 'flex';
      $('decision-res').style.display = 'none';
      setTimeout(() => {
        const r = InsightEngine.decide(q, user.chart, user.name);
        $('dr-title').textContent = r.title;
        $('dr-body').textContent  = r.content;
        $('ask-loading').style.display = 'none';
        $('decision-res').style.display = 'block';
        btn.disabled = false;
        S.insights.unshift({id:`d-${Date.now()}`,userId:user.id,category:r.category,title:r.title,content:r.content,date:new Date().toISOString(),bookmarked:false,period:'decision'});
        save(); renderDecisionHistory();
      }, 700);
    };
  }

  function renderDecisionHistory() {
    const hist = S.insights.filter(i=>i.userId===S.currentUserId&&i.period==='decision').slice(0,5);
    const el = $('decision-history'); if (!el||!hist.length) return;
    el.innerHTML = '<div style="margin-top:20px"><div class="sec-label" style="margin-bottom:10px">YOUR PAST QUESTIONS</div>'
      + hist.map(i=>`<div class="dec-hist-item">
        <div class="dec-q">"${i.title}"</div>
        <div class="dec-a" id="dha-${i.id}">${i.content}</div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="dec-date">${new Date(i.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
          <button class="read-more-sm" onclick="App.expandDecH('${i.id}')">Read more ▼</button>
        </div></div>`).join('') + '</div>';
  }

  function expandDecH(id) {
    const el=$(`dha-${id}`); if(!el) return;
    const btn=el.parentElement.querySelector('.read-more-sm');
    const exp=el.classList.toggle('expanded');
    if(btn) btn.textContent=exp?'Show less ▲':'Read more ▼';
  }

  // ── BLEND ─────────────────────────────────────────────────────
  function renderBlend() {
    // Show correct sub-view
    if (S.activeBlendId && S.blends.find(b=>b.id===S.activeBlendId)) {
      showBlendDash(); return;
    }
    showBlendLanding();
  }

  function showBlendLanding() {
    S.activeBlendId = null;
    $('blend-landing').style.display = '';
    $('blend-creator').style.display = 'none';
    $('blend-dash').style.display    = 'none';

    const hasTwo = S.users.length >= 2;
    const notice = $('blend-notice');
    const hiw    = $('blend-how-it-works');

    if (!hasTwo) {
      notice.style.display = '';
      notice.innerHTML = '<strong>⚠️ You need 2 profiles to create a blend</strong>Go to Profile → All Profiles → Add New Profile to add your partner or friend.';
    } else { notice.style.display = 'none'; }

    if (S.blends.length === 0 && hiw) hiw.style.display = '';
    else if (hiw) hiw.style.display = 'none';

    renderBlendList();
    const cb = $('create-blend-btn');
    if (cb) cb.onclick = startCreator;
  }

  function renderBlendList() {
    const el = $('blend-list'); if (!el) return;
    if (!S.blends.length) { el.innerHTML=''; return; }
    const LC = {Exceptional:'#10b981',Strong:'#8b5cf6',Good:'#06b6d4',Complex:'#f59e0b',Challenging:'#f43f5e'};
    const PE = {aligned:'🌟',tense:'⚡',growth:'🌱'};
    el.innerHTML = S.blends.map(b => {
      const u1 = S.users.find(u=>u.id===b.userId1);
      const u2 = S.users.find(u=>u.id===b.userId2);
      if (!u1||!u2) return '';
      const pEmoji = PE[b.currentPhase?.energy]||'✦';
      return `<div class="blend-card" onclick="App.openBlend('${b.id}')">
        <div class="bc-top">
          <div class="bc-avatars">
            <div class="bc-av" style="background:rgba(139,92,246,.2);border-color:rgba(139,92,246,.4);color:#8b5cf6;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:14px;border:2px solid">${u1.name[0]}</div>
            <div class="bc-av" style="background:rgba(244,63,94,.2);border-color:rgba(244,63,94,.4);color:#f43f5e;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:14px;border:2px solid;margin-left:-10px">${u2.name[0]}</div>
          </div>
          <div class="bc-info"><div class="bc-name">${b.name}</div>
          <div class="bc-sub">${u1.chart.sunSign} + ${u2.chart.sunSign} · ${(b.synastry||[]).filter(a=>a.strength!=='weak').length} active aspects</div></div>
          <div style="text-align:right"><div style="font-size:16px">${pEmoji}</div><div style="color:var(--text-muted);font-size:10px;font-family:var(--font-mono)">${(b.currentPhase?.energy||'').toUpperCase()}</div></div>
        </div>
        <div class="bc-bars">${(b.dimensions||[]).map(d=>`<div class="bc-bar-wrap"><div style="font-size:12px">${d.emoji}</div><div class="bc-bar-track"><div class="bc-bar-fill" style="width:${d.score}%;background:${LC[d.level]||'#8b5cf6'}"></div></div></div>`).join('')}</div>
      </div>`;
    }).join('');
  }

  function openBlend(id) {
    S.activeBlendId = id;
    showBlendDash();
  }

  // ── Blend Creator ─────────────────────────────────────────────
  function startCreator() {
    if (S.users.length < 2) { alert('Add at least 2 profiles first.\n\nGo to: Profile → All Profiles → Add New Profile'); return; }
    S.creatorStep = 0; S.creatorData = {};
    $('blend-landing').style.display = 'none';
    $('blend-creator').style.display = '';
    $('blend-dash').style.display    = 'none';
    renderCreatorStep();
  }

  function renderCreatorStep() {
    const step = S.creatorStep;
    const data = S.creatorData;
    const labels = ['STEP 1 OF 3','STEP 2 OF 3','STEP 3 OF 3'];
    const titles = ['Your Profile','Partner Profile','Name Your Blend'];
    const subs   = ['Who\'s the first person in this blend?','Who are you blending with?','Give this blend a name (optional)'];
    html('creator-eye', labels[step]);
    html('creator-h',   titles[step]);
    html('creator-sub', subs[step]);
    const content = $('creator-content'); if (!content) return;

    if (step === 0) {
      content.innerHTML = S.users.map(u => {
        const sel = data.userId1 === u.id;
        return `<div class="profile-choice ${sel?'selected':''}" onclick="App.creatorPick(0,'${u.id}')">
          <div class="pc-av">${u.name.slice(0,2).toUpperCase()}</div>
          <div class="pc-info"><div class="pc-name">${u.name}</div><div class="pc-sub">${u.chart.sunSign} Sun · ${u.chart.moonSign} Moon · ${u.chart.ascendantSign} Rising</div></div>
          ${sel?'<div class="pc-check">✓</div>':''}
        </div>`;
      }).join('') + `<button class="btn-primary btn-full" style="margin-top:12px" onclick="App.creatorNext()">Continue →</button>`;
    } else if (step === 1) {
      const others = S.users.filter(u=>u.id!==data.userId1);
      content.innerHTML = (others.length===0
        ? '<div class="empty-state"><div class="es-sub">No other profiles found. Go to Profile → Add New Profile.</div></div>'
        : others.map(u => {
            const sel = data.userId2 === u.id;
            return `<div class="profile-choice ${sel?'selected':''}" onclick="App.creatorPick(1,'${u.id}')">
              <div class="pc-av" style="background:rgba(244,63,94,.15);color:#f43f5e">${u.name.slice(0,2).toUpperCase()}</div>
              <div class="pc-info"><div class="pc-name">${u.name}</div><div class="pc-sub">${u.chart.sunSign} Sun · ${u.chart.moonSign} Moon · ${u.chart.ascendantSign} Rising</div></div>
              ${sel?'<div class="pc-check" style="color:#f43f5e">✓</div>':''}
            </div>`;
          }).join(''))
        + `<div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn-ghost" onclick="App.creatorBack()">← Back</button>
            <button class="btn-primary" style="flex:2" onclick="App.creatorNext()">Continue →</button>
           </div>`;
    } else {
      const u1 = S.users.find(u=>u.id===data.userId1);
      const u2 = S.users.find(u=>u.id===data.userId2);
      content.innerHTML = `
        <div class="blend-preview">
          <div class="bp-av">
            <div class="bp-av-circle" style="width:52px;height:52px;background:rgba(139,92,246,.2);border:2px solid rgba(139,92,246,.4);color:#8b5cf6;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:18px">${u1?.name[0]||'?'}</div>
            <div class="bp-av-name">${u1?.name.split(' ')[0]||''}</div><div class="bp-av-sign">${u1?.chart.sunSign||''}</div>
          </div>
          <div class="bp-divider"><div class="bp-divider-icon">✦</div><div class="bp-divider-label">BLEND</div></div>
          <div class="bp-av">
            <div class="bp-av-circle" style="width:52px;height:52px;background:rgba(244,63,94,.2);border:2px solid rgba(244,63,94,.4);color:#f43f5e;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:18px">${u2?.name[0]||'?'}</div>
            <div class="bp-av-name">${u2?.name.split(' ')[0]||''}</div><div class="bp-av-sign">${u2?.chart.sunSign||''}</div>
          </div>
        </div>
        <div class="field" style="margin-top:16px">
          <label>Blend Name</label>
          <input type="text" id="blend-name-inp" class="astro-input" placeholder="${u1?.name.split(' ')[0]||''} ✦ ${u2?.name.split(' ')[0]||''}"/>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn-ghost" onclick="App.creatorBack()">← Back</button>
          <button class="btn-blend" style="flex:2;padding:13px 0" onclick="App.finaliseBlend()">✦ Create AstroBlend</button>
        </div>`;
    }
  }

  function creatorPick(step, id) {
    if (step===0) S.creatorData.userId1=id; else S.creatorData.userId2=id;
    renderCreatorStep();
  }

  function creatorNext() {
    if (S.creatorStep===0 && !S.creatorData.userId1) { alert('Select a profile first'); return; }
    if (S.creatorStep===1 && !S.creatorData.userId2) { alert('Select a partner profile'); return; }
    S.creatorStep++; renderCreatorStep();
  }

  function creatorBack() {
    if (S.creatorStep===0) { showBlendLanding(); return; }
    S.creatorStep--; renderCreatorStep();
  }

  function finaliseBlend() {
    const {userId1,userId2} = S.creatorData;
    const u1=S.users.find(u=>u.id===userId1), u2=S.users.find(u=>u.id===userId2);
    if (!u1||!u2) { alert('Profile not found'); return; }
    const nameInp = $('blend-name-inp');
    const blendName = nameInp && nameInp.value.trim() ? nameInp.value.trim() : `${u1.name.split(' ')[0]} ✦ ${u2.name.split(' ')[0]}`;
    const blend = BlendEngine.createBlend(userId1,userId2,u1.name,u2.name,u1.chart,u2.chart,blendName);
    S.blends.unshift(blend);
    S.activeBlendId = blend.id;
    save();
    showBlendDash();
  }

  // ── Blend Dashboard ───────────────────────────────────────────
  function showBlendDash() {
    const blend = S.blends.find(b=>b.id===S.activeBlendId);
    if (!blend) { showBlendLanding(); return; }
    const u1=S.users.find(u=>u.id===blend.userId1), u2=S.users.find(u=>u.id===blend.userId2);
    if (!u1||!u2) { showBlendLanding(); return; }

    $('blend-landing').style.display = 'none';
    $('blend-creator').style.display = 'none';
    $('blend-dash').style.display    = '';

    const PE = {aligned:'🌟',tense:'⚡',growth:'🌱'};
    const PC = {aligned:'#10b981',tense:'#f43f5e',growth:'#f59e0b'};
    const pEmoji = PE[blend.currentPhase?.energy]||'✦';
    const pColor = PC[blend.currentPhase?.energy]||'#8b5cf6';
    const LC = {Exceptional:'#10b981',Strong:'#8b5cf6',Good:'#06b6d4',Complex:'#f59e0b',Challenging:'#f43f5e'};
    let activeBdTab = 'overview';

    $('blend-dash').innerHTML = `
    <div style="padding:0 0 20px">
      <div style="padding:16px 20px 0">
        <button class="btn-back" onclick="App.showBlendLanding()" style="margin-bottom:12px">← All Blends</button>
        <div style="background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(244,63,94,.05));border:1px solid rgba(139,92,246,.18);border-radius:16px;padding:20px">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
            <div style="display:flex;flex-direction:column;align-items:center;gap:5px">
              <div style="width:48px;height:48px;border-radius:50%;background:rgba(139,92,246,.2);border:2px solid rgba(139,92,246,.4);color:#8b5cf6;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:18px">${u1.name[0]}</div>
              <div style="font-family:var(--font-display);font-size:11px;color:var(--text-primary)">${u1.name.split(' ')[0]}</div>
              <div style="color:var(--text-muted);font-size:10px;font-family:var(--font-mono)">${u1.chart.sunSign}</div>
            </div>
            <div style="flex:1;text-align:center;cursor:pointer" onclick="App.renameBlend('${blend.id}')">
              <div style="font-family:var(--font-display);font-size:16px;color:var(--text-primary)" id="bd-name-disp">${blend.name}</div>
              <div style="color:var(--text-muted);font-size:10px;font-family:var(--font-mono)">tap to rename</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:5px">
              <div style="width:48px;height:48px;border-radius:50%;background:rgba(244,63,94,.2);border:2px solid rgba(244,63,94,.4);color:#f43f5e;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:18px">${u2.name[0]}</div>
              <div style="font-family:var(--font-display);font-size:11px;color:var(--text-primary)">${u2.name.split(' ')[0]}</div>
              <div style="color:var(--text-muted);font-size:10px;font-family:var(--font-mono)">${u2.chart.sunSign}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:center;gap:8px">
            <span style="font-size:16px">${pEmoji}</span>
            <span style="font-size:12px;font-family:var(--font-mono);color:${pColor}">${blend.currentPhase?.title?.toUpperCase()||''}</span>
            <span style="color:var(--text-muted);font-size:11px;font-family:var(--font-mono)">· ${blend.currentPhase?.duration||''}</span>
          </div>
        </div>
      </div>

      <div class="bd-tabs" id="bd-tabs" style="display:flex;gap:6px;padding:12px 20px 0;overflow-x:auto;scrollbar-width:none">
        <button class="bd-tab active" data-bdtab="overview" onclick="App.switchBdTab('overview')">🔮 Overview</button>
        <button class="bd-tab" data-bdtab="weekly" onclick="App.switchBdTab('weekly')">📅 This Week</button>
        <button class="bd-tab" data-bdtab="monthly" onclick="App.switchBdTab('monthly')">🌙 This Month</button>
        <button class="bd-tab ask-tab" data-bdtab="ask" onclick="App.switchBdTab('ask')">⊕ Ask Together</button>
      </div>

      <div style="padding:16px 20px 0" id="bd-tab-content">
        ${renderBdOverview(blend, LC, pEmoji, pColor)}
      </div>
    </div>`;
  }

  function switchBdTab(tab) {
    document.querySelectorAll('.bd-tab').forEach(b=>b.classList.toggle('active',b.dataset.bdtab===tab));
    const blend = S.blends.find(b=>b.id===S.activeBlendId); if (!blend) return;
    const u1=S.users.find(u=>u.id===blend.userId1), u2=S.users.find(u=>u.id===blend.userId2);
    const LC = {Exceptional:'#10b981',Strong:'#8b5cf6',Good:'#06b6d4',Complex:'#f59e0b',Challenging:'#f43f5e'};
    const PE = {aligned:'🌟',tense:'⚡',growth:'🌱'};
    const PC = {aligned:'#10b981',tense:'#f43f5e',growth:'#f59e0b'};
    const tc = $('bd-tab-content'); if (!tc) return;
    if (tab==='overview') tc.innerHTML = renderBdOverview(blend,LC,PE[blend.currentPhase?.energy]||'✦',PC[blend.currentPhase?.energy]||'#8b5cf6');
    else if (tab==='weekly')  tc.innerHTML = renderBdPeriod(blend.weeklyInsight,'weekly');
    else if (tab==='monthly') tc.innerHTML = renderBdPeriod(blend.monthlyInsight,'monthly');
    else if (tab==='ask')     tc.innerHTML = renderBdAsk(blend,u1,u2);
  }

  function renderBdOverview(blend,LC,pEmoji,pColor) {
    return `
      <div style="background:rgba(139,92,246,.06);border:1px solid rgba(139,92,246,.15);border-radius:14px;padding:18px;margin-bottom:16px">
        <div style="color:var(--text-muted);font-size:11px;font-family:var(--font-mono);margin-bottom:8px">THE CORE DYNAMIC</div>
        <p style="color:var(--text-primary);font-size:15px;line-height:1.8;margin:0">${blend.coreNarrative}</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
        <div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.18);border-radius:12px;padding:14px">
          <div style="color:#10b981;font-size:11px;font-family:var(--font-mono);margin-bottom:10px">✓ WHAT WORKS</div>
          ${(blend.strengths||[]).map(s=>`<div style="color:var(--text-secondary);font-size:12px;line-height:1.5;margin-bottom:6px">${s.length>90?s.slice(0,87)+'…':s}</div>`).join('')}
        </div>
        <div style="background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.18);border-radius:12px;padding:14px">
          <div style="color:#f59e0b;font-size:11px;font-family:var(--font-mono);margin-bottom:10px">⚡ THE FRICTION</div>
          ${(blend.frictionPoints||[]).map(f=>`<div style="color:var(--text-secondary);font-size:12px;line-height:1.5;margin-bottom:6px">${f.length>90?f.slice(0,87)+'…':f}</div>`).join('')}
        </div>
      </div>
      <div style="margin-bottom:6px;color:var(--text-muted);font-size:11px;font-family:var(--font-mono)">COMPATIBILITY BREAKDOWN</div>
      <div class="glass-card" style="padding:4px 16px;margin-bottom:16px">
        ${(blend.dimensions||[]).map(d=>`
          <div class="dim-item" onclick="this.querySelector('.dim-detail').classList.toggle('open');this.querySelector('.dim-caret').textContent=this.querySelector('.dim-detail').classList.contains('open')?'▲':'▼'">
            <div class="dim-row">
              <span class="dim-emoji">${d.emoji}</span>
              <span class="dim-label">${d.label}</span>
              <span class="dim-level" style="color:${d.color||LC[d.level]};background:${(d.color||LC[d.level])}15;border:1px solid ${(d.color||LC[d.level])}30">${d.level}</span>
              <span class="dim-caret">▼</span>
            </div>
            <div class="dim-track"><div class="dim-fill" style="width:${d.score}%;background:${d.color||LC[d.level]}"></div></div>
            <div class="dim-insight">${d.insight}</div>
            <div class="dim-detail">
              <div class="dim-depth">${d.depth}</div>
              <div class="dim-advice" style="background:${(d.color||LC[d.level])}08;border:1px solid ${(d.color||LC[d.level])}18">
                <div class="dim-advice-label" style="color:${d.color||LC[d.level]}">WHAT TO DO</div>${d.advice}
              </div>
            </div>
          </div>`).join('')}
      </div>
      <div style="background:${pColor}08;border:1px solid ${pColor}22;border-radius:14px;padding:16px;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-size:20px">${pEmoji}</span>
          <span style="font-family:var(--font-display);font-size:15px;color:var(--text-primary)">${blend.currentPhase?.title||''}</span>
        </div>
        <p style="color:var(--text-secondary);font-size:14px;line-height:1.75;margin-bottom:12px">${blend.currentPhase?.description||''}</p>
        <div style="background:rgba(255,255,255,.03);border-radius:8px;padding:10px 12px;margin-bottom:8px">
          <div style="color:#e2e8f0;font-size:11px;font-family:var(--font-mono);margin-bottom:4px">❤️ EMOTIONALLY</div>
          <div style="color:var(--text-secondary);font-size:13px">${blend.currentPhase?.emotional||''}</div>
        </div>
        <div style="background:rgba(255,255,255,.03);border-radius:8px;padding:10px 12px">
          <div style="color:#f59e0b;font-size:11px;font-family:var(--font-mono);margin-bottom:4px">⚙️ PRACTICALLY</div>
          <div style="color:var(--text-secondary);font-size:13px">${blend.currentPhase?.practical||''}</div>
        </div>
      </div>
      <button onclick="App.deleteBlend('${blend.id}')" style="width:100%;padding:12px 0;background:rgba(244,63,94,.06);border:1px solid rgba(244,63,94,.2);border-radius:10px;color:#f43f5e;font-size:13px;cursor:pointer;font-family:var(--font-mono)">Delete This Blend</button>`;
  }

  function renderBdPeriod(ins,type) {
    if (!ins) return '<div class="empty-state"><div class="es-sub">Generating…</div></div>';
    return `
      <div style="background:rgba(139,92,246,.06);border:1px solid rgba(139,92,246,.15);border-radius:14px;padding:18px;margin-bottom:16px">
        <div style="color:var(--text-muted);font-size:11px;font-family:var(--font-mono);margin-bottom:6px">${type==='weekly'?'THIS WEEK':'THIS MONTH'}</div>
        <div style="font-family:var(--font-display);font-size:17px;color:var(--text-primary);margin-bottom:12px">${ins.title}</div>
        <p style="color:var(--text-secondary);font-size:14px;line-height:1.8;margin-bottom:14px">${ins.narrative}</p>
        <div style="background:rgba(139,92,246,.06);border-radius:8px;padding:10px 12px">
          <div style="color:#8b5cf6;font-size:11px;font-family:var(--font-mono);margin-bottom:4px">FOCUS</div>
          <div style="color:var(--text-primary);font-size:14px">${ins.focus}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.18);border-radius:12px;padding:14px">
          <div style="color:#10b981;font-size:11px;font-family:var(--font-mono);margin-bottom:10px">✓ DO MORE</div>
          ${(ins.doMore||[]).map(x=>`<div style="color:var(--text-secondary);font-size:13px;line-height:1.6;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.04)">${x}</div>`).join('')}
        </div>
        <div style="background:rgba(244,63,94,.06);border:1px solid rgba(244,63,94,.18);border-radius:12px;padding:14px">
          <div style="color:#f43f5e;font-size:11px;font-family:var(--font-mono);margin-bottom:10px">✗ AVOID</div>
          ${(ins.avoid||[]).map(x=>`<div style="color:var(--text-secondary);font-size:13px;line-height:1.6;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.04)">${x}</div>`).join('')}
        </div>
      </div>`;
  }

  function renderBdAsk(blend,u1,u2) {
    const qs=['Is this a good time for us to travel together?','Should we move in / live together?','Is this a good period for a shared financial decision?','Are we in a good phase for a serious commitment?','Is this a good time to start something together?'];
    const hist = blend.decisionHistory||[];
    return `
      <div style="text-align:center;padding:20px;margin-bottom:20px;background:linear-gradient(135deg,rgba(139,92,246,.1),rgba(244,63,94,.06));border:1px solid rgba(139,92,246,.22);border-radius:16px">
        <div style="display:flex;justify-content:center;align-items:center;gap:6px;margin-bottom:10px">
          <div style="width:30px;height:30px;border-radius:50%;background:rgba(139,92,246,.2);color:#8b5cf6;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:12px">${u1.name[0]}</div>
          <div style="width:30px;height:30px;border-radius:50%;background:rgba(244,63,94,.2);color:#f43f5e;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:12px;margin-left:-8px">${u2.name[0]}</div>
        </div>
        <div style="font-family:var(--font-display);font-size:18px;color:var(--text-primary);margin-bottom:6px">Ask Together</div>
        <div style="color:var(--text-secondary);font-size:14px">Get a reading based on both charts simultaneously</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
        ${qs.map(q=>`<button class="quick-q" onclick="this.querySelectorAll&&document.querySelectorAll('.quick-q').forEach(b=>b.classList.remove('sel'));this.classList.add('sel');document.getElementById('blend-ta').value='${q.replace(/'/g,"\\'")}'">${q}</button>`).join('')}
      </div>
      <textarea id="blend-ta" class="decision-ta" style="margin-bottom:12px" placeholder='Type your question… e.g. "Should we move in together?"'></textarea>
      <button class="btn-blend btn-full" onclick="App.askTogether('${blend.id}')">✦ Get Couple Reading</button>
      <div class="loading-dots" id="blend-loading" style="display:none"><span></span><span></span><span></span><em>Analyzing both charts…</em></div>
      <div class="blend-result" id="blend-result" style="display:none">
        <div class="br-label">✦ COUPLE READING · ${blend.name.toUpperCase()}</div>
        <div class="br-body" id="br-body"></div>
      </div>
      ${hist.length?`<div style="margin-top:20px"><div class="sec-label" style="margin-bottom:10px">PAST QUESTIONS</div>${hist.slice(0,5).map(d=>`<div class="dec-hist-item"><div class="dec-q">"${d.question}"</div><div class="dec-a">${d.answer.slice(0,220)}…</div><div class="dec-date">${new Date(d.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div></div>`).join('')}</div>`:''}`;
  }

  function askTogether(blendId) {
    const blend = S.blends.find(b=>b.id===blendId); if (!blend) return;
    const ta = $('blend-ta'); const q = ta?ta.value.trim():'';
    if (!q) { alert('Please enter a question first'); return; }
    const u1=S.users.find(u=>u.id===blend.userId1), u2=S.users.find(u=>u.id===blend.userId2);
    if (!u1||!u2) return;
    $('blend-loading').style.display='flex';
    $('blend-result').style.display='none';
    setTimeout(()=>{
      const answer = BlendEngine.coupleDecide(q,u1.chart,u2.chart,u1.name,u2.name,blend.synastry||[]);
      $('br-body').textContent=answer;
      $('blend-loading').style.display='none';
      $('blend-result').style.display='block';
      blend.decisionHistory=[{id:`d-${Date.now()}`,question:q,answer,date:new Date().toISOString()},...(blend.decisionHistory||[])].slice(0,20);
      save();
    },800);
  }

  function renameBlend(id) {
    const blend=S.blends.find(b=>b.id===id); if(!blend) return;
    const n=prompt('New name for this blend:',blend.name);
    if(n&&n.trim()){blend.name=n.trim();save();const el=$('bd-name-disp');if(el)el.textContent=blend.name;}
  }

  function deleteBlend(id) {
    if(!confirm('Delete this blend?')) return;
    S.blends=S.blends.filter(b=>b.id!==id);
    if(S.activeBlendId===id) S.activeBlendId=null;
    save(); showBlendLanding();
  }

  // ── PROFILE ───────────────────────────────────────────────────
  function renderProfile() {
    const user=currentUser(); if(!user) return;
    const {chart,birthData,name}=user;
    const ini=name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    const active=chart.dasha.find(d=>d.isActive);
    html('profile-heading',name);
    html('profile-card',`<div class="prof-av">${ini}</div>
      <div class="prof-info">
        <div class="prof-name">${name}</div>
        <div class="prof-signs">${chart.ascendantSign} Rising · ${chart.moonSign} Moon · ${chart.sunSign} Sun</div>
        <div class="prof-birth">${birthData.place} · ${birthData.dob}</div>
      </div>`);
    renderProfDetails(); renderProfUsers(); renderProfBookmarks();
    document.querySelectorAll('.ptab2').forEach(b=>{ b.onclick=()=>switchProfTab(b.dataset.ptab); });
  }

  function switchProfTab(tab) {
    document.querySelectorAll('.ptab2').forEach(b=>b.classList.toggle('active',b.dataset.ptab===tab));
    document.querySelectorAll('.ptab2-content').forEach(c=>c.classList.remove('active'));
    const el=$(`ptab2-${tab}`); if(el) el.classList.add('active');
  }

  function renderProfDetails() {
    const user=currentUser(); if(!user) return;
    const {chart,birthData}=user;
    const active=chart.dasha.find(d=>d.isActive);
    const rows=[
      {l:'Date of Birth',v:birthData.dob},{l:'Time',v:birthData.time},{l:'Place',v:birthData.place},
      {l:'Ascendant (Rising)',v:chart.ascendantSign},{l:'Moon Sign',v:chart.moonSign},{l:'Sun Sign',v:chart.sunSign},
      {l:'Lagna Lord',v:chart.lagnaLord},
      {l:'Active Chapter',v:active?`${active.planet} (until ${AstrologyEngine.fmtDate(active.endDate)})`:'—'},
      {l:'Active Yogas',v:chart.yoga.length>0?chart.yoga.map(y=>y.name).join(', '):'None identified'}
    ];
    html('ptab2-details',`<div class="glass-card">${rows.map((r,i,a)=>`<div class="detail-row" ${i===a.length-1?'style="border-bottom:none"':''}><span class="det-label">${r.l}</span><span class="det-val">${r.v}</span></div>`).join('')}</div>
      <button onclick="App.confirmDelete('${user.id}')" style="width:100%;margin-top:16px;padding:12px 0;background:rgba(244,63,94,.06);border:1px solid rgba(244,63,94,.2);border-radius:10px;color:#f43f5e;font-size:13px;cursor:pointer;font-family:var(--font-mono)">Delete This Profile</button>`);
  }

  function renderProfUsers() {
    html('ptab2-users',`<div style="color:var(--text-muted);font-size:11px;font-family:var(--font-mono);margin-bottom:12px">ALL PROFILES (${S.users.length})</div>
      ${S.users.map(u=>`<div class="user-card ${u.id===S.currentUserId?'current':''}">
        <div class="uc-av">${u.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>
        <div class="uc-info"><div class="uc-name">${u.name}</div><div class="uc-sub">${u.chart.ascendantSign} Rising · ${u.chart.moonSign} Moon · ${u.birthData.dob}</div></div>
        ${u.id===S.currentUserId?'<div class="uc-active">ACTIVE</div>':`<button class="uc-switch" onclick="App.switchUser('${u.id}')">Switch</button>`}
      </div>`).join('')}
      <button class="btn-primary btn-full" style="margin-top:12px" onclick="App.addProfile()">+ Add New Profile</button>`);
  }

  function renderProfBookmarks() {
    const bms=S.insights.filter(i=>i.userId===S.currentUserId&&i.bookmarked);
    const catI={career:'💼',wealth:'💰',love:'💕',health:'🌿',general:'✦'};
    html('ptab2-bookmarks', bms.length===0
      ? '<div class="empty-state"><div class="es-icon">☆</div><div class="es-title">No bookmarks yet</div><div class="es-sub">Star insights to save them here</div></div>'
      : bms.map(i=>`<div class="bm-card"><div class="bm-cat">${catI[i.category]||'✦'} ${i.category.toUpperCase()}</div><div class="bm-title">${i.title}</div><div class="bm-body">${i.content}</div></div>`).join(''));
  }

  function switchUser(id) {
    S.currentUserId=id; save();
    const ins=userInsights(id);
    if(!ins.length) generateInsights(id);
    renderAll(); renderProfile();
  }

  function addProfile() { showFormScreen(); }

  function confirmDelete(id) {
    if(!confirm('Delete this profile? This cannot be undone.')) return;
    S.users=S.users.filter(u=>u.id!==id);
    S.insights=S.insights.filter(i=>i.userId!==id);
    S.blends=S.blends.filter(b=>b.userId1!==id&&b.userId2!==id);
    if(S.currentUserId===id) S.currentUserId=S.users[0]?.id||null;
    save();
    if(!S.currentUserId) showScreen('screen-onboarding');
    else { renderAll(); switchTab('profile'); }
  }

  // ── Test Panel ────────────────────────────────────────────────
  function toggleTestPanel() {
    S.testPanelOpen=!S.testPanelOpen;
    $('test-panel').style.display=S.testPanelOpen?'block':'none';
  }

  // ── City Search (Global via Nominatim) ────────────────────────
  let _cityTimeout = null;

  function setupCitySearch() {
    const inp  = $('inp-city');
    const drop = $('city-drop');
    if (!inp||!drop) return;

    // Show top cities on focus
    inp.addEventListener('focus', () => {
      if (!inp.value.trim()) showOfflineCities('');
    });

    inp.addEventListener('input', () => {
      const q = inp.value.trim();
      clearTimeout(_cityTimeout);
      if (!q) { showOfflineCities(''); return; }
      // Immediate offline results
      showOfflineCities(q);
      // Then fire online after 350ms debounce
      _cityTimeout = setTimeout(() => searchOnline(q), 350);
    });

    document.addEventListener('click', e => {
      if (!inp.contains(e.target)&&!drop.contains(e.target)) drop.classList.remove('open');
    });
  }

  function showOfflineCities(q) {
    const drop = $('city-drop'); if (!drop) return;
    const cities = Geocoder.FALLBACK_CITIES;
    const qL     = q.toLowerCase();
    const matches = qL
      ? cities.filter(c=>c.name.toLowerCase().includes(qL)).slice(0,8)
      : cities.slice(0,10);
    renderCityDrop(matches.map(c=>({display_name:c.name,lat:c.lat,lon:c.lon,tz:c.tz,source:'offline'})), q);
  }

  async function searchOnline(q) {
    const drop = $('city-drop'); if (!drop) return;
    try {
      // Show spinner
      const existing = drop.innerHTML;
      drop.innerHTML = `<div class="city-item" style="color:var(--text-muted);font-style:italic">🔍 Searching worldwide…</div>` + existing;
      drop.classList.add('open');

      const results = await Geocoder.search(q);
      renderCityDrop(results, q);
    } catch(e) {
      // silently keep offline results
    }
  }

  function renderCityDrop(results, q) {
    const drop = $('city-drop'); if (!drop) return;
    if (!results.length) { drop.classList.remove('open'); return; }
    drop.innerHTML = results.map(r =>
      `<div class="city-item" onclick="App.pickCity(${JSON.stringify(r).replace(/"/g,'&quot;')})">
        <span style="color:var(--violet);margin-right:6px">${r.source==='online'?'🌍':'◉'}</span>${r.display_name}
       </div>`
    ).join('');
    drop.classList.add('open');
  }

  async function pickCity(result) {
    const inp  = $('inp-city');
    const drop = $('city-drop');
    if (inp)  inp.value = result.display_name;
    if (drop) drop.classList.remove('open');

    // Show loading coords
    $('coords-row').style.display='flex';
    html('c-lat','…'); html('c-lon','…'); html('c-tz','…');

    // Resolve TZ (may be async)
    const resolved = await Geocoder.resolve(result);
    S.selectedCity = resolved;

    html('c-lat', `${resolved.lat.toFixed(4)}°`);
    html('c-lon', `${resolved.lon.toFixed(4)}°`);
    html('c-tz',  `UTC${resolved.timezone>=0?'+':''}${resolved.timezone}`);

    const note = $('city-source-note');
    if (note) {
      note.style.display='block';
      note.textContent = result.source==='online'
        ? `✓ Coordinates from OpenStreetMap · TZ calculated automatically`
        : `✓ Coordinates from offline database`;
      note.style.color='#10b981';
    }
  }

  // ── Onboarding form ───────────────────────────────────────────
  function startOnboarding() { showFormScreen(); }

  function showFormScreen() {
    S.formStep=0; S.formData={}; S.selectedCity=null;
    showScreen('screen-form');
    updateStepDots(0);
    document.querySelectorAll('.form-step').forEach((el,i)=>el.classList.toggle('active',i===0));
    makeStars('stars2');
    // Re-attach listeners
    setTimeout(setupCitySearch, 100);
  }

  function updateStepDots(step) {
    document.querySelectorAll('.dot').forEach((d,i)=>d.classList.toggle('active',i===step));
    document.querySelectorAll('.form-step').forEach((el,i)=>el.classList.toggle('active',i===step));
  }

  function submitForm() {
    if (!S.selectedCity) { alert('Please select a city from the list'); return; }
    try {
      const data = {
        name:     S.formData.name,
        dob:      S.formData.dob,
        time:     S.formData.time,
        place:    S.selectedCity.name,
        lat:      S.selectedCity.lat,
        lon:      S.selectedCity.lon,
        timezone: S.selectedCity.timezone
      };
      const chart = AstrologyEngine.calculateChart(data);
      const user  = { id:`u-${Date.now()}`, name:data.name, birthData:data, chart, createdAt:new Date().toISOString() };
      S.users.push(user);
      S.currentUserId = user.id;
      save();
      generateInsights();
      showScreen('screen-app');
      makeStars('stars3');
      renderAll();
    } catch(e) {
      console.error(e);
      alert('Could not calculate chart. Please check your birth details and try again.');
    }
  }

  function renderAll() {
    const user=currentUser(); if(!user) return;
    if(!userInsights().length) generateInsights();
    renderHome();
  }

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    load();
    makeStars('stars1');

    if (S.currentUserId && S.users.find(u=>u.id===S.currentUserId)) {
      showScreen('screen-app'); makeStars('stars3'); renderAll();
    } else {
      showScreen('screen-onboarding');
    }

    // Step 0
    $('step0-next').onclick = () => updateStepDots(1);

    // Step 1
    $('step1-next').onclick = () => {
      const name=$('inp-name')?.value.trim(), dob=$('inp-dob')?.value, time=$('inp-time')?.value;
      if(!name||!dob||!time){alert('Please fill in all fields');return;}
      S.formData={name,dob,time};
      updateStepDots(2);
      setTimeout(setupCitySearch,100);
    };
    $('step1-back').onclick = () => updateStepDots(0);

    // Step 2
    $('step2-submit').onclick = () => {
      if(!S.selectedCity){alert('Please select a birth city from the list');return;}
      submitForm();
    };
    $('step2-back').onclick = () => updateStepDots(1);

    // Form back
    $('form-back-btn').onclick = () => {
      if(S.users.length>0) showScreen('screen-app'); else showScreen('screen-onboarding');
    };

    // Nav
    document.querySelectorAll('.nav-btn').forEach(b=>{ b.onclick=()=>switchTab(b.dataset.tab); });

    // Period tabs
    document.querySelectorAll('.ptab').forEach(b=>{ b.onclick=()=>switchPeriod(b.dataset.period); });

    // Chart toggle
    $('btn-western').onclick = () => {
      S.chartSystem='western';
      $('btn-western').classList.add('active'); $('btn-vedic').classList.remove('active');
      renderChart();
    };
    $('btn-vedic').onclick = () => {
      S.chartSystem='vedic';
      $('btn-vedic').classList.add('active'); $('btn-western').classList.remove('active');
      renderChart();
    };

    // Chart diagram
    $('chart-diagram-btn').onclick = () => {
      const wrap=$('chart-diagram-wrap');
      const open=wrap.style.display==='none'||!wrap.style.display;
      wrap.style.display=open?'block':'none';
      $('chart-diagram-btn').textContent=open?'📐 Birth Chart Diagram ▲':'📐 Birth Chart Diagram ▼';
      if(open){const u=currentUser();if(u)drawChart(u.chart);}
    };
  }

  // ── Public API ────────────────────────────────────────────────
  return {
    init, startOnboarding, switchTab, switchPeriod, toggleTestPanel,
    toggleBookmark, expandInsight, expandDecH,
    pickCity, selectQ, showBlendLanding,
    openBlend, switchBdTab, askTogether, renameBlend, deleteBlend,
    creatorPick, creatorNext, creatorBack, finaliseBlend,
    addProfile, switchUser, confirmDelete,
    _state: ()=>S, _currentUser: currentUser
  };
})();

document.addEventListener('DOMContentLoaded', ()=>App.init());
