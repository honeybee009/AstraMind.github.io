/* ═══════════════════════════════════════════════════════════════
   ASTRAMIND — App Controller v1.0.0
   Manages all state, routing, and UI rendering
═══════════════════════════════════════════════════════════════ */

const App = (function () {

  // ── State ────────────────────────────────────────────────────
  let state = {
    users:        [],
    currentUserId: null,
    insights:     [],
    blends:       [],
    activeBlendId: null,
    chartSystem:  'western',     // 'western' | 'vedic'
    activePeriod: 'daily',
    activeTab:    'home',
    formStep:     0,
    formData:     {},
    creatorStep:  0,
    creatorData:  {},
    testPanelOpen: false
  };

  // ── Persistence ──────────────────────────────────────────────
  function save() {
    try {
      localStorage.setItem('astramind_users',    JSON.stringify(state.users));
      localStorage.setItem('astramind_current',  state.currentUserId || '');
      localStorage.setItem('astramind_insights', JSON.stringify(state.insights));
      localStorage.setItem('astramind_blends',   JSON.stringify(state.blends));
    } catch(e) { console.warn('Save failed:', e); }
  }

  function load() {
    try {
      const u = localStorage.getItem('astramind_users');
      const c = localStorage.getItem('astramind_current');
      const i = localStorage.getItem('astramind_insights');
      const b = localStorage.getItem('astramind_blends');
      if (u) state.users = JSON.parse(u);
      if (c) state.currentUserId = c;
      if (i) state.insights = JSON.parse(i);
      if (b) {
        // Restore date objects in dasha
        const blends = JSON.parse(b);
        state.blends = blends;
      }
      // Restore Date objects in user charts
      for (const user of state.users) {
        if (user.chart && user.chart.dasha) {
          user.chart.dasha = user.chart.dasha.map(d => ({
            ...d,
            startDate: new Date(d.startDate),
            endDate:   new Date(d.endDate)
          }));
        }
      }
    } catch(e) { console.warn('Load failed:', e); }
  }

  // ── Getters ──────────────────────────────────────────────────
  function currentUser()    { return state.users.find(u => u.id === state.currentUserId) || null; }
  function userInsights()   { return state.insights.filter(i => i.userId === state.currentUserId); }
  function userBookmarks()  { return state.insights.filter(i => i.userId === state.currentUserId && i.bookmarked); }
  function activeBlend()    { return state.blends.find(b => b.id === state.activeBlendId) || null; }

  // ── Stars background ─────────────────────────────────────────
  function makeStars(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < 80; i++) {
      const s = document.createElement('div');
      s.className = 'star-dot';
      s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${Math.random()*2+0.5}px;height:${Math.random()*2+0.5}px;--d:${2+Math.random()*4}s;--del:${Math.random()*4}s;--op:${0.3+Math.random()*0.6}`;
      el.appendChild(s);
    }
  }

  // ── Screen Router ────────────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  function showApp() {
    showScreen('screen-app');
    renderAll();
  }

  // ── Tab Switching ────────────────────────────────────────────
  function switchTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    const el = document.getElementById(`tab-${tab}`);
    if (el) el.classList.add('active');

    if (tab === 'home')     renderHome();
    if (tab === 'chart')    renderChart();
    if (tab === 'insights') renderInsights();
    if (tab === 'blend')    renderBlend();
    if (tab === 'profile')  renderProfile();
  }

  function switchPeriod(period) {
    state.activePeriod = period;
    document.querySelectorAll('.ptab').forEach(b => {
      b.classList.toggle('active', b.dataset.period === period);
    });
    document.querySelectorAll('.period').forEach(p => p.classList.remove('active'));
    const el = document.getElementById(`period-${period}`);
    if (el) el.classList.add('active');
    renderPeriodContent(period);
  }

  // ── Render All ───────────────────────────────────────────────
  function renderAll() {
    const user = currentUser();
    if (!user) return;
    // Ensure insights exist
    if (userInsights().length === 0) generateInsights();
    updateHeader(user);
    renderHome();
  }

  function updateHeader(user) {
    const signs = document.getElementById('hdr-signs');
    if (signs && user) {
      signs.textContent = `${user.chart.sunSign.slice(0,3)} · ${user.chart.moonSign.slice(0,3)} · ${user.chart.ascendantSign.slice(0,3)}`;
    }
  }

  // ── Generate Insights ────────────────────────────────────────
  function generateInsights() {
    const user = currentUser();
    if (!user) return;
    const generated = InsightEngine.generateAll(user.chart, user.name, user.id);
    // Remove old insights for this user
    state.insights = state.insights.filter(i => i.userId !== user.id);
    state.insights.push(...generated);
    save();
  }

  // ── HOME TAB ─────────────────────────────────────────────────
  function renderHome() {
    const user = currentUser();
    if (!user) return;
    const { chart } = user;

    // Greeting
    const h = new Date().getHours();
    const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const dateStr  = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
    setHtml('greeting-meta', `${greeting.toUpperCase()} · ${dateStr.toUpperCase()}`);
    setHtml('greeting-name', `${user.name.split(' ')[0]} 👋`);
    setHtml('greeting-signs', `${SIGN_EMOJI(chart.sunSign)} ${chart.sunSign} Sun · ${SIGN_EMOJI(chart.moonSign)} ${chart.moonSign} Moon · ${SIGN_EMOJI(chart.ascendantSign)} ${chart.ascendantSign} Rising`);

    // Big 3
    renderBig3Compact();

    // Daily insight hero
    const ins = userInsights();
    const daily = ins.find(i => i.period === 'daily' && i.category === 'general') || ins[0];
    if (daily) {
      setHtml('daily-hero-title', daily.title);
      const bodyEl = document.getElementById('daily-hero-body');
      if (bodyEl) {
        bodyEl.textContent = daily.content;
        bodyEl.style.display = '-webkit-box';
        bodyEl.style.webkitLineClamp = '4';
        bodyEl.style.webkitBoxOrient = 'vertical';
        bodyEl.style.overflow = 'hidden';
      }
      const expandBtn = document.getElementById('daily-expand-btn');
      if (expandBtn) {
        expandBtn.onclick = () => {
          const expanded = bodyEl.style.webkitLineClamp === 'none';
          bodyEl.style.webkitLineClamp = expanded ? '4' : 'none';
          bodyEl.style.overflow = expanded ? 'hidden' : 'visible';
          expandBtn.textContent = expanded ? 'Read full ▼' : 'Show less ▲';
        };
      }
    }

    // Weekly snapshot
    renderWeeklySnap();

    // Dasha
    renderDashaHome();
  }

  function renderBig3Compact() {
    const user = currentUser();
    if (!user) return;
    const { chart } = user;
    const items = [
      { label:'SUN ☉',   sign:chart.sunSign,        sub:'Your core self',   color:'#f59e0b' },
      { label:'MOON ☽',  sign:chart.moonSign,       sub:'Your emotions',    color:'#e2e8f0' },
      { label:'RISING ↑',sign:chart.ascendantSign,  sub:'First impression', color:'#8b5cf6' }
    ];
    setHtml('big3', items.map(it => `
      <div class="big3-card">
        <div class="big3-label">${it.label}</div>
        <div class="big3-sign" style="color:${it.color}">${it.sign}</div>
        <div class="big3-sub">${it.sub}</div>
      </div>`).join(''));
  }

  function renderWeeklySnap() {
    const ins = userInsights();
    const cats = [
      { cat:'career', icon:'💼', color:'#8b5cf6' },
      { cat:'wealth', icon:'💰', color:'#f59e0b' },
      { cat:'love',   icon:'💕', color:'#f43f5e' }
    ];
    const html = cats.map(({ cat, icon, color }) => {
      const i = ins.find(x => x.category === cat);
      if (!i) return '';
      const bm = i.bookmarked ? '#f59e0b' : '#4a4870';
      return `<div class="snap-card" onclick="App.switchTab('insights')">
        <div class="snap-icon">${icon}</div>
        <div class="snap-text">
          <div class="snap-title">${i.title}</div>
          <div class="snap-body">${i.content}</div>
        </div>
        <button class="snap-bm" style="color:${bm}" onclick="event.stopPropagation();App.toggleBookmark('${i.id}')">${i.bookmarked ? '★' : '☆'}</button>
      </div>`;
    }).join('');
    setHtml('weekly-snap', html || '<div class="empty-state"><div class="es-sub">No insights yet. Tap Insights to generate.</div></div>');
  }

  function renderDashaHome() {
    const user = currentUser();
    if (!user) return;
    const active = user.chart.dasha.find(d => d.isActive);
    if (!active) return;
    const prog  = AstrologyEngine.dashaProgress(active);
    const left  = AstrologyEngine.dashaTimeLeft(active);
    const emoji = { Sun:'👑',Moon:'🌙',Mars:'🔥',Mercury:'🧠',Jupiter:'🌟',Venus:'💖',Saturn:'⚖️',Rahu:'🚀',Ketu:'🔮' }[active.planet] || '✦';
    setHtml('dasha-home', `
      <div class="dasha-card-home" style="border-color:${active.color}25;background:${active.color}06">
        <div class="dc-top">
          <div class="dc-planet" style="background:${active.color}20;border:1px solid ${active.color}40;color:${active.color}">${emoji}</div>
          <div>
            <div class="dc-name">${active.planet} Period</div>
            <div class="dc-date">Ends ${AstrologyEngine.fmtDate(active.endDate)} · ${left}</div>
          </div>
          <div class="dc-badge">ACTIVE NOW</div>
        </div>
        <div class="dc-progress"><div class="dc-fill" style="width:${prog}%;background:linear-gradient(90deg,${active.color},${active.color}80)"></div></div>
        <p class="dc-body">${active.plainEnglish}</p>
        <button class="dc-link" style="color:${active.color}" onclick="App.switchTab('chart')">See your full chart →</button>
      </div>`);
  }

  // ── CHART TAB ────────────────────────────────────────────────
  function renderChart() {
    const user = currentUser();
    if (!user) return;
    const { chart, birthData } = user;
    const sys = state.chartSystem;

    setHtml('chart-meta', `${birthData.place} · ${birthData.dob} · ${birthData.time}`);
    document.getElementById('vedic-note').style.display = sys === 'vedic' ? 'block' : 'none';

    // Big 3 expanded
    const big3Items = [
      { label:'Sun ☉', sign: sys==='western' ? chart.sunSign : chart.vedicSun, meaning:'Your core personality, ego, and how you express confidence. This is who you are when you\'re most yourself.', color:'#f59e0b', glyph:'☉' },
      { label:'Moon ☽', sign: sys==='western' ? chart.moonSign : chart.vedicMoon, meaning:'Your emotional nature, gut reactions, and what makes you feel safe. This is your inner world.', color:'#e2e8f0', glyph:'☽' },
      { label:'Rising ↑', sign: sys==='western' ? chart.ascendantSign : chart.vedicAsc, meaning:'Your outer personality and first impression. How strangers perceive you before they know you well.', color:'#8b5cf6', glyph:'↑' }
    ];
    const T = AstrologyEngine.SIGN_TRAITS;
    setHtml('big3-expanded', '<div class="big3-exp">' + big3Items.map(it => {
      const tr = T[it.sign] || {};
      return `<div class="b3e-card">
        <div class="b3e-top">
          <div class="b3e-glyph" style="color:${it.color}">${it.glyph}</div>
          <div class="b3e-meta">
            <div class="b3e-label">${it.label}</div>
            <div class="b3e-sign" style="color:${it.color}">${it.sign}</div>
          </div>
          <div class="b3e-right">
            <div class="b3e-element">${tr.element || ''}</div>
            <div class="b3e-mode">${tr.mode || ''}</div>
          </div>
        </div>
        <div class="b3e-meaning">${it.meaning}</div>
        ${tr.vibe ? `<div class="b3e-vibe" style="background:${it.color}08;color:${it.color}"><strong>Vibe:</strong> ${tr.vibe}</div>` : ''}
      </div>`;
    }).join('') + '</div>');

    // Planet list
    const allPlanets = [chart.ascendant, ...chart.planets];
    setHtml('planet-list', allPlanets.map(p => {
      const sign = sys==='western' ? p.sign : p.vedicSign;
      const hm   = AstrologyEngine.HOUSE_MEANINGS[p.house] || '';
      return `<div class="planet-item" onclick="App.togglePlanet(this)">
        <div class="planet-row">
          <div class="planet-glyph" style="background:${p.color}18;border:1px solid ${p.color}30;color:${p.color}">${p.symbol}</div>
          <div class="planet-info">
            <div class="planet-name">
              ${p.name} ${p.emoji || ''}
              ${p.retrograde ? '<span class="retro-badge">℞ Retrograde</span>' : ''}
            </div>
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
          ${p.retrograde ? `<div class="retro-detail">℞ Retrograde means: This planet's energy is more internalized. You feel it deeply, but it takes longer to express outwardly.</div>` : ''}
          <div style="color:var(--text-muted);font-size:11px;font-family:var(--font-mono);margin-top:8px">Nakshatra: ${p.nakshatra} Pada ${p.pada}</div>
        </div>
      </div>`;
    }).join(''));

    // Yogas
    if (chart.yoga.length > 0) {
      setHtml('yogas-wrap', `<div class="yogas-section">
        <div class="sec-label" style="margin-bottom:10px">SPECIAL PATTERNS IN YOUR CHART</div>
        ${chart.yoga.map(y => `<div class="yoga-card"><div class="yoga-name">✦ ${y.name}</div><div class="yoga-meaning">${y.meaning}</div></div>`).join('')}
      </div>`);
    } else {
      setHtml('yogas-wrap', '');
    }

    // Draw chart diagram if visible
    if (document.getElementById('chart-diagram-wrap').style.display !== 'none') {
      drawChartDiagram(chart);
    }
  }

  function togglePlanet(el) {
    const detail = el.querySelector('.planet-detail');
    const caret  = el.querySelector('.planet-caret');
    if (!detail) return;
    const open = detail.classList.toggle('open');
    if (caret) caret.textContent = open ? '▲' : '▼';
  }

  // ── Chart Diagram (Canvas) ────────────────────────────────────
  function drawChartDiagram(chart) {
    const canvas = document.getElementById('chart-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 300, H = 300, s = W / 4;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(7,7,26,0.9)';
    ctx.roundRect(0, 0, W, H, 12);
    ctx.fill();

    // Build planet map by house
    const byHouse = {};
    for (const p of [chart.ascendant, ...chart.planets]) {
      if (!byHouse[p.house]) byHouse[p.house] = [];
      byHouse[p.house].push(p);
    }

    const housePos = [
      { h:12,x:0,    y:0,    w:s,   ht:s   },
      { h:1, x:s,    y:0,    w:s*2, ht:s   },
      { h:2, x:s*3,  y:0,    w:s,   ht:s   },
      { h:11,x:0,    y:s,    w:s,   ht:s*2 },
      { h:3, x:s*3,  y:s,    w:s,   ht:s*2 },
      { h:10,x:s,    y:s,    w:s,   ht:s   },
      { h:4, x:s*2,  y:s,    w:s,   ht:s   },
      { h:9, x:s,    y:s*2,  w:s,   ht:s   },
      { h:5, x:s*2,  y:s*2,  w:s,   ht:s   },
      { h:8, x:0,    y:s*3,  w:s,   ht:s   },
      { h:7, x:s,    y:s*3,  w:s*2, ht:s   },
      { h:6, x:s*3,  y:s*3,  w:s,   ht:s   }
    ];

    for (const { h, x, y, w, ht } of housePos) {
      ctx.fillStyle = 'rgba(13,13,43,0.7)';
      ctx.strokeStyle = 'rgba(139,92,246,0.2)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.roundRect(x+1, y+1, w-2, ht-2, 3);
      ctx.fill();
      ctx.stroke();

      // House number
      ctx.fillStyle = 'rgba(139,92,246,0.5)';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(h, x+5, y+13);

      // Sign
      const houseData = chart.houses[h-1];
      if (houseData) {
        ctx.fillStyle = 'rgba(155,152,196,0.6)';
        ctx.font = '7px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(houseData.sign.slice(0,3), x+w/2, y+(ht===s?19:16));
        ctx.textAlign = 'left';
      }

      // Planets
      const ps = byHouse[h] || [];
      ps.slice(0,4).forEach((p, pi) => {
        ctx.fillStyle = p.color || '#f59e0b';
        ctx.font = '11px serif';
        ctx.fillText(
          (p.symbol || '•') + (p.retrograde ? 'ᴿ' : ''),
          x + 6 + (pi%2)*(w/2-6),
          y + (ht===s?34:30) + Math.floor(pi/2)*13
        );
      });
    }

    // Center lines
    ctx.strokeStyle = 'rgba(139,92,246,0.12)';
    ctx.lineWidth = 0.5;
    [[s,s,s*3,s*3],[s*3,s,s,s*3],[s,s,s*3,s],[s,s*3,s*3,s*3],[s,s,s,s*3],[s*3,s,s*3,s*3]].forEach(([x1,y1,x2,y2]) => {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    });

    // Hover tooltip
    canvas.onmousemove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      const my = (e.clientY - rect.top) * (H / rect.height);
      const tip = document.getElementById('house-tip');
      for (const { h, x, y, w, ht } of housePos) {
        if (mx >= x && mx <= x+w && my >= y && my <= y+ht) {
          const hd = chart.houses[h-1];
          const ps = (byHouse[h]||[]).map(p=>p.name).join(', ');
          tip.style.display = 'block';
          tip.innerHTML = `<strong style="color:var(--violet)">House ${h} · ${hd ? hd.sign : ''}</strong><br>${hd ? hd.meaning : ''} ${ps ? `<br><em style="color:var(--gold)">Contains: ${ps}</em>` : ''}`;
          return;
        }
      }
      tip.style.display = 'none';
    };
    canvas.onmouseleave = () => { document.getElementById('house-tip').style.display = 'none'; };
  }

  // ── INSIGHTS TAB ─────────────────────────────────────────────
  function renderInsights() {
    const user = currentUser();
    if (!user) return;
    setHtml('insights-meta', `${user.chart.sunSign} Sun · ${user.chart.moonSign} Moon · ${user.chart.ascendantSign} Rising`);
    renderPeriodContent(state.activePeriod);
    setupQuickQuestions();
    setupDecisionMode();
    renderDecisionHistory();
  }

  function renderPeriodContent(period) {
    if (period === 'decision') return;
    const ins = userInsights();
    const user = currentUser();
    const el   = document.getElementById(`period-${period}`);
    if (!el || !user) return;

    const CAT_CFG = {
      career:  { icon:'💼', color:'#8b5cf6', label:'Career'  },
      wealth:  { icon:'💰', color:'#f59e0b', label:'Money'   },
      love:    { icon:'💕', color:'#f43f5e', label:'Love'    },
      health:  { icon:'🌿', color:'#10b981', label:'Health'  },
      general: { icon:'✦',  color:'#06b6d4', label:'General' }
    };

    // Overview block
    const active = user.chart.dasha.find(d => d.isActive);
    const yoga   = user.chart.yoga[0];
    const mon    = new Date().toLocaleDateString('en-US',{month:'long', day:'numeric'});
    const overviewHtml = `
      <div class="period-overview">
        <div class="po-top">
          <div class="po-icon">${period==='daily'?'☀️':period==='weekly'?'📅':'🌙'}</div>
          <div>
            <div class="po-name">${period==='daily'?'Today':period==='weekly'?'This Week':'This Month'}'s Snapshot</div>
            <div class="po-date">${mon} · ${user.chart.sunSign} Sun · ${user.chart.moonSign} Moon</div>
          </div>
        </div>
        <div class="po-body">You're currently in your <strong style="color:var(--text-primary)">${active ? active.planet : ''} Chapter</strong> — ${active ? active.plainEnglish.split('.')[0] : ''}.</div>
        ${yoga ? `<div class="po-yoga"><div class="po-yoga-name">✦ ${yoga.name}</div><div class="po-yoga-meaning">${yoga.meaning}</div></div>` : ''}
      </div>`;

    const filteredIns = period === 'daily'
      ? ins.filter(i => i.period === 'daily')
      : period === 'weekly'
      ? ins.filter(i => ['daily','weekly'].includes(i.period))
      : ins;

    const insHtml = filteredIns.length === 0
      ? '<div class="empty-state"><div class="es-icon">◎</div><div class="es-title">No insights yet</div><div class="es-sub">They\'ll appear here automatically</div></div>'
      : filteredIns.map(i => {
          const cfg = CAT_CFG[i.category] || CAT_CFG.general;
          const bm  = i.bookmarked ? '#f59e0b' : '#4a4870';
          return `<div class="ins-card" style="border-left:2px solid ${cfg.color}">
            <div class="ins-card-inner">
              <div class="ins-cat">
                <span class="ins-cat-icon">${cfg.icon}</span>
                <span class="ins-cat-label">${cfg.label.toUpperCase()}</span>
                ${i.period==='decision'?`<span class="ins-type-badge" style="background:rgba(6,182,212,.1);color:#06b6d4;border:1px solid rgba(6,182,212,.2)">YOUR QUESTION</span>`:''}
              </div>
              <div class="ins-title">${i.title}</div>
              <div class="ins-body" id="ib-${i.id}">${i.content}</div>
              <div class="ins-actions">
                <button class="read-more-sm" onclick="App.expandInsight('${i.id}')">Read more ▼</button>
                <button class="bm-btn" style="color:${bm}" onclick="App.toggleBookmark('${i.id}')">${i.bookmarked?'★':'☆'}</button>
              </div>
            </div>
          </div>`;
        }).join('');

    el.innerHTML = overviewHtml + insHtml;
  }

  function expandInsight(id) {
    const el  = document.getElementById(`ib-${id}`);
    const btn = el?.nextElementSibling?.querySelector('.read-more-sm');
    if (!el || !btn) return;
    const exp = el.classList.toggle('expanded');
    btn.textContent = exp ? 'Show less ▲' : 'Read more ▼';
  }

  function toggleBookmark(id) {
    const i = state.insights.find(x => x.id === id);
    if (i) { i.bookmarked = !i.bookmarked; save(); }
    // Update all bookmark buttons for this insight
    document.querySelectorAll(`[onclick*="toggleBookmark('${id}')"]`).forEach(btn => {
      btn.textContent = i?.bookmarked ? '★' : '☆';
      btn.style.color = i?.bookmarked ? '#f59e0b' : '#4a4870';
    });
    if (state.activeTab === 'profile') renderProfileBookmarks();
  }

  function setupQuickQuestions() {
    const templates = [
      'Should I switch jobs right now?',
      'Is this a good time to start a business?',
      'Should I relocate to another city?',
      'Is this a good period for investments?',
      'What does my chart say about this relationship?',
      'Is this a good time to ask for a raise?',
      'Should I start freelancing?',
      'What\'s my best financial move right now?'
    ];
    const qEl = document.getElementById('quick-qs');
    if (!qEl) return;
    qEl.innerHTML = templates.map(t =>
      `<button class="quick-q" onclick="App.selectQuestion(this,'${t.replace(/'/g,"\\'")}')"> ${t}</button>`
    ).join('');
  }

  function selectQuestion(btn, q) {
    document.querySelectorAll('.quick-q').forEach(b => b.classList.remove('sel'));
    btn.classList.add('sel');
    const ta = document.getElementById('decision-ta');
    if (ta) ta.value = q;
  }

  function setupDecisionMode() {
    const btn = document.getElementById('ask-btn');
    if (!btn) return;
    btn.onclick = () => {
      const ta  = document.getElementById('decision-ta');
      const q   = ta ? ta.value.trim() : '';
      if (!q) return;
      const user = currentUser();
      if (!user) return;

      btn.disabled = true;
      document.getElementById('ask-loading').style.display = 'flex';
      document.getElementById('decision-res').style.display = 'none';

      setTimeout(() => {
        const result = InsightEngine.decide(q, user.chart, user.name);
        document.getElementById('dr-title').textContent = result.title;
        document.getElementById('dr-body').textContent  = result.content;
        document.getElementById('ask-loading').style.display = 'none';
        document.getElementById('decision-res').style.display = 'block';
        btn.disabled = false;

        // Save to insights
        const ins = {
          id:        `decision-${Date.now()}`,
          userId:    user.id,
          category:  result.category,
          title:     result.title,
          content:   result.content,
          date:      new Date().toISOString(),
          bookmarked:false,
          period:    'decision'
        };
        state.insights.unshift(ins);
        save();
        renderDecisionHistory();
      }, 700);
    };
  }

  function renderDecisionHistory() {
    const hist = state.insights.filter(i => i.userId === state.currentUserId && i.period === 'decision').slice(0,5);
    const el = document.getElementById('decision-history');
    if (!el || hist.length === 0) return;
    el.innerHTML = '<div style="margin-top:20px"><div class="sec-label" style="margin-bottom:10px">YOUR PAST QUESTIONS</div>'
      + hist.map(i => `
        <div class="dec-hist-item">
          <div class="dec-q">"${i.title}"</div>
          <div class="dec-a" id="dha-${i.id}">${i.content}</div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="dec-date">${new Date(i.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
            <button class="read-more-sm" onclick="App.expandDecHistory('${i.id}')">Read more ▼</button>
          </div>
        </div>`).join('')
      + '</div>';
  }

  function expandDecHistory(id) {
    const el  = document.getElementById(`dha-${id}`);
    const btn = el?.parentElement?.querySelector('.read-more-sm');
    if (!el || !btn) return;
    const exp = el.classList.toggle('expanded');
    btn.textContent = exp ? 'Show less ▲' : 'Read more ▼';
  }

  // ── BLEND TAB ────────────────────────────────────────────────
  function renderBlend() {
    const blends  = state.blends;
    const hasTwo  = state.users.length >= 2;

    if (state.activeBlendId && blends.find(b => b.id === state.activeBlendId)) {
      renderBlendDashboard();
      return;
    }

    // Landing
    document.getElementById('blend-landing').style.display = '';
    document.getElementById('blend-creator').style.display = 'none';
    document.getElementById('blend-dash').style.display    = 'none';

    const hiw  = document.getElementById('blend-how-it-works');
    const note = document.getElementById('blend-notice');

    if (blends.length === 0 && hiw) hiw.style.display = '';
    else if (hiw) hiw.style.display = 'none';

    if (!hasTwo && note) {
      note.style.display = '';
      note.innerHTML = '<strong>⚠️ Need 2 profiles</strong>Go to Profile → All Profiles → Add New Profile to add a partner or friend.';
    } else if (note) {
      note.style.display = 'none';
    }

    // Blend list
    const listEl = document.getElementById('blend-list');
    if (!listEl) return;
    if (blends.length === 0) {
      listEl.innerHTML = '';
      return;
    }

    listEl.innerHTML = blends.map(b => {
      const u1  = state.users.find(u => u.id === b.userId1);
      const u2  = state.users.find(u => u.id === b.userId2);
      if (!u1 || !u2) return '';
      const pEmoji = { aligned:'🌟', tense:'⚡', growth:'🌱' }[b.currentPhase?.energy] || '✦';
      const dims   = b.dimensions || [];
      const levelColors = { Exceptional:'#10b981', Strong:'#8b5cf6', Good:'#06b6d4', Complex:'#f59e0b', Challenging:'#f43f5e' };
      return `<div class="blend-card" onclick="App.openBlend('${b.id}')">
        <div class="bc-top">
          <div class="bc-avatars">
            <div class="bc-av" style="background:rgba(139,92,246,.2);border-color:rgba(139,92,246,.4);color:#8b5cf6">${u1.name[0]}</div>
            <div class="bc-av" style="background:rgba(244,63,94,.2);border-color:rgba(244,63,94,.4);color:#f43f5e">${u2.name[0]}</div>
          </div>
          <div class="bc-info">
            <div class="bc-name">${b.name}</div>
            <div class="bc-sub">${u1.chart.sunSign} + ${u2.chart.sunSign} · ${(b.synastry||[]).filter(a=>a.strength!=='weak').length} active aspects</div>
          </div>
          <div class="bc-phase">
            <div class="bc-phase-icon">${pEmoji}</div>
            <div class="bc-phase-label">${(b.currentPhase?.energy||'').toUpperCase()}</div>
          </div>
        </div>
        <div class="bc-bars">
          ${dims.map(d => `<div class="bc-bar-wrap"><div class="bc-bar-icon">${d.emoji}</div><div class="bc-bar-track"><div class="bc-bar-fill" style="width:${d.score}%;background:${levelColors[d.level]||'#8b5cf6'}"></div></div></div>`).join('')}
        </div>
      </div>`;
    }).join('');

    // Create blend button
    const createBtn = document.getElementById('create-blend-btn');
    if (createBtn) createBtn.onclick = startBlendCreator;
  }

  function openBlend(id) {
    state.activeBlendId = id;
    renderBlendDashboard();
  }

  function showBlendLanding() {
    state.activeBlendId = null;
    state.creatorStep   = 0;
    state.creatorData   = {};
    document.getElementById('blend-landing').style.display = '';
    document.getElementById('blend-creator').style.display = 'none';
    document.getElementById('blend-dash').style.display    = 'none';
    renderBlend();
  }

  function startBlendCreator() {
    if (state.users.length < 2) { alert('Add at least 2 profiles first (Profile → All Profiles → Add New Profile)'); return; }
    state.creatorStep = 0;
    state.creatorData = {};
    document.getElementById('blend-landing').style.display = 'none';
    document.getElementById('blend-creator').style.display = '';
    document.getElementById('blend-dash').style.display    = 'none';
    renderCreatorStep();
  }

  function renderCreatorStep() {
    const step  = state.creatorStep;
    const data  = state.creatorData;
    const labels = ['STEP 1 OF 3','STEP 2 OF 3','STEP 3 OF 3'];
    const titles  = ['Your Profile','Partner Profile','Name Your Blend'];
    const subs    = ['Who\'s the first person?','Who are you blending with?','Give this blend a name (optional)'];
    setHtml('creator-eye', labels[step]);
    setHtml('creator-h',   titles[step]);
    setHtml('creator-sub', subs[step]);
    const content = document.getElementById('creator-content');
    if (!content) return;

    if (step === 0) {
      content.innerHTML = state.users.map(u => {
        const sel = data.userId1 === u.id;
        return `<div class="profile-choice ${sel?'selected':''}" onclick="App.creatorSelect(0,'${u.id}')">
          <div class="pc-av">${u.name.slice(0,2).toUpperCase()}</div>
          <div class="pc-info">
            <div class="pc-name">${u.name}</div>
            <div class="pc-sub">${u.chart.sunSign} Sun · ${u.chart.moonSign} Moon · ${u.chart.ascendantSign} Rising</div>
          </div>
          ${sel ? '<div class="pc-check">✓</div>' : ''}
        </div>`;
      }).join('')
      + `<button class="btn-primary btn-full" style="margin-top:12px" onclick="App.creatorNext()">Continue →</button>`;
    }

    else if (step === 1) {
      const others = state.users.filter(u => u.id !== data.userId1);
      content.innerHTML = others.map(u => {
        const sel = data.userId2 === u.id;
        return `<div class="profile-choice ${sel?'selected':''}" onclick="App.creatorSelect(1,'${u.id}')">
          <div class="pc-av" style="background:rgba(244,63,94,.15);color:#f43f5e">${u.name.slice(0,2).toUpperCase()}</div>
          <div class="pc-info">
            <div class="pc-name">${u.name}</div>
            <div class="pc-sub">${u.chart.sunSign} Sun · ${u.chart.moonSign} Moon · ${u.chart.ascendantSign} Rising</div>
          </div>
          ${sel ? '<div class="pc-check" style="color:#f43f5e">✓</div>' : ''}
        </div>`;
      }).join('')
      + (others.length === 0 ? '<div class="empty-state"><div class="es-sub">No other profiles. Go to Profile → Add New Profile first.</div></div>' : '')
      + `<div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn-ghost" onclick="App.creatorBack()">← Back</button>
          <button class="btn-primary" style="flex:2" onclick="App.creatorNext()">Continue →</button>
         </div>`;
    }

    else if (step === 2) {
      const u1 = state.users.find(u => u.id === data.userId1);
      const u2 = state.users.find(u => u.id === data.userId2);
      content.innerHTML = `
        <div class="blend-preview">
          <div class="bp-av">
            <div class="bp-av-circle" style="width:52px;height:52px;background:rgba(139,92,246,.2);border:2px solid rgba(139,92,246,.4);color:#8b5cf6">${u1?.name[0]||'?'}</div>
            <div class="bp-av-name">${u1?.name.split(' ')[0]||''}</div>
            <div class="bp-av-sign">${u1?.chart.sunSign||''}</div>
          </div>
          <div class="bp-divider"><div class="bp-divider-icon">✦</div><div class="bp-divider-label">BLEND</div></div>
          <div class="bp-av">
            <div class="bp-av-circle" style="width:52px;height:52px;background:rgba(244,63,94,.2);border:2px solid rgba(244,63,94,.4);color:#f43f5e">${u2?.name[0]||'?'}</div>
            <div class="bp-av-name">${u2?.name.split(' ')[0]||''}</div>
            <div class="bp-av-sign">${u2?.chart.sunSign||''}</div>
          </div>
        </div>
        <div class="field">
          <label>Blend Name (optional)</label>
          <input type="text" id="blend-name-inp" class="astro-input" value="${u1?.name.split(' ')[0]||''} ✦ ${u2?.name.split(' ')[0]||''}" />
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn-ghost" onclick="App.creatorBack()">← Back</button>
          <button class="btn-blend" style="flex:2;padding:13px 0" onclick="App.createBlendFinal()">✦ Create AstroBlend</button>
        </div>`;
    }
  }

  function creatorSelect(step, id) {
    if (step === 0) state.creatorData.userId1 = id;
    else            state.creatorData.userId2 = id;
    renderCreatorStep();
  }

  function creatorNext() {
    const data = state.creatorData;
    if (state.creatorStep === 0 && !data.userId1) { alert('Select a profile first'); return; }
    if (state.creatorStep === 1 && !data.userId2) { alert('Select a partner profile'); return; }
    state.creatorStep++;
    renderCreatorStep();
  }

  function creatorBack() {
    if (state.creatorStep === 0) { showBlendLanding(); return; }
    state.creatorStep--;
    renderCreatorStep();
  }

  function createBlendFinal() {
    const { userId1, userId2 } = state.creatorData;
    const u1 = state.users.find(u => u.id === userId1);
    const u2 = state.users.find(u => u.id === userId2);
    if (!u1 || !u2) return;
    const nameInp   = document.getElementById('blend-name-inp');
    const blendName = nameInp ? nameInp.value.trim() : '';
    const blend = BlendEngine.createBlend(userId1, userId2, u1.name, u2.name, u1.chart, u2.chart, blendName);
    state.blends.unshift(blend);
    state.activeBlendId = blend.id;
    save();
    renderBlendDashboard();
  }

  function renderBlendDashboard() {
    const blend = state.blends.find(b => b.id === state.activeBlendId);
    if (!blend) { showBlendLanding(); return; }
    const u1 = state.users.find(u => u.id === blend.userId1);
    const u2 = state.users.find(u => u.id === blend.userId2);
    if (!u1 || !u2) { showBlendLanding(); return; }

    document.getElementById('blend-landing').style.display = 'none';
    document.getElementById('blend-creator').style.display = 'none';
    document.getElementById('blend-dash').style.display    = '';

    const phaseEmoji = { aligned:'🌟', tense:'⚡', growth:'🌱' }[blend.currentPhase?.energy] || '✦';
    const phaseColor = { aligned:'#10b981', tense:'#f43f5e', growth:'#f59e0b' }[blend.currentPhase?.energy] || '#8b5cf6';

    let currentBdTab = 'overview';
    const levelColors = { Exceptional:'#10b981', Strong:'#8b5cf6', Good:'#06b6d4', Complex:'#f59e0b', Challenging:'#f43f5e' };

    function renderBdTab(tab) {
      currentBdTab = tab;
      document.querySelectorAll('.bd-tab').forEach(b => b.classList.toggle('active', b.dataset.bdtab === tab));
      document.querySelectorAll('.bd-content').forEach(c => c.classList.remove('active'));
      const el = document.getElementById(`bdc-${tab}`);
      if (el) el.classList.add('active');
    }

    const dashHtml = `
    <div class="bd-wrap">
      <div class="bd-hero">
        <button class="btn-back" onclick="App.showBlendLanding()" style="margin-bottom:12px">← All Blends</button>
        <div class="bd-header">
          <div class="bd-avatars">
            <div class="bd-av-wrap">
              <div class="bd-av-circle" style="width:48px;height:48px;background:rgba(139,92,246,.2);border:2px solid rgba(139,92,246,.4);color:#8b5cf6;font-size:18px">${u1.name[0]}</div>
              <div class="bd-av-name">${u1.name.split(' ')[0]}</div>
              <div class="bd-av-sign">${u1.chart.sunSign}</div>
            </div>
            <div class="bd-name-center" onclick="App.renameBlend('${blend.id}')">
              <div class="bd-blend-name" id="bd-blend-name-disp">${blend.name}</div>
              <div class="bd-rename-hint">tap to rename</div>
            </div>
            <div class="bd-av-wrap">
              <div class="bd-av-circle" style="width:48px;height:48px;background:rgba(244,63,94,.2);border:2px solid rgba(244,63,94,.4);color:#f43f5e;font-size:18px">${u2.name[0]}</div>
              <div class="bd-av-name">${u2.name.split(' ')[0]}</div>
              <div class="bd-av-sign">${u2.chart.sunSign}</div>
            </div>
          </div>
          <div class="bd-phase-row">
            <span class="bd-phase-icon">${phaseEmoji}</span>
            <span class="bd-phase-label" style="color:${phaseColor}">${blend.currentPhase?.title?.toUpperCase() || ''}</span>
            <span class="bd-phase-dur">· ${blend.currentPhase?.duration || ''}</span>
          </div>
        </div>
      </div>

      <div class="bd-tabs">
        <button class="bd-tab active" data-bdtab="overview" onclick="renderBdTab('overview')">🔮 Overview</button>
        <button class="bd-tab" data-bdtab="weekly" onclick="renderBdTab('weekly')">📅 This Week</button>
        <button class="bd-tab" data-bdtab="monthly" onclick="renderBdTab('monthly')">🌙 This Month</button>
        <button class="bd-tab ask-tab" data-bdtab="ask" onclick="renderBdTab('ask')">⊕ Ask Together</button>
      </div>

      <!-- Overview -->
      <div class="bd-content active" id="bdc-overview">
        <div class="period-overview" style="margin-bottom:16px">
          <div class="po-body" style="font-size:15px;line-height:1.8">${blend.coreNarrative}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
          <div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.18);border-radius:12px;padding:14px">
            <div style="color:#10b981;font-size:11px;font-family:var(--font-mono);margin-bottom:10px">✓ WHAT WORKS</div>
            ${(blend.strengths||[]).map(s=>`<div style="color:var(--text-secondary);font-size:12px;line-height:1.5;margin-bottom:6px">${s.length>90?s.slice(0,87)+'...':s}</div>`).join('')}
          </div>
          <div style="background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.18);border-radius:12px;padding:14px">
            <div style="color:#f59e0b;font-size:11px;font-family:var(--font-mono);margin-bottom:10px">⚡ THE FRICTION</div>
            ${(blend.frictionPoints||[]).map(f=>`<div style="color:var(--text-secondary);font-size:12px;line-height:1.5;margin-bottom:6px">${f.length>90?f.slice(0,87)+'...':f}</div>`).join('')}
          </div>
        </div>

        <div style="margin-bottom:6px;color:var(--text-muted);font-size:11px;font-family:var(--font-mono);letter-spacing:.1em">COMPATIBILITY BREAKDOWN</div>
        <div class="glass-card" style="padding:4px 16px;margin-bottom:16px">
          ${(blend.dimensions||[]).map(d => `
            <div class="dim-item" onclick="this.querySelector('.dim-detail').classList.toggle('open');this.querySelector('.dim-caret').textContent=this.querySelector('.dim-detail').classList.contains('open')?'▲':'▼'">
              <div class="dim-row">
                <span class="dim-emoji">${d.emoji}</span>
                <span class="dim-label">${d.label}</span>
                <span class="dim-level" style="color:${d.color};background:${d.color}15;border:1px solid ${d.color}30">${d.level}</span>
                <span class="dim-caret">▼</span>
              </div>
              <div class="dim-track"><div class="dim-fill" style="width:${d.score}%;background:${d.color}"></div></div>
              <div class="dim-insight">${d.insight}</div>
              <div class="dim-detail">
                <div class="dim-depth">${d.depth}</div>
                <div class="dim-advice" style="background:${d.color}08;border:1px solid ${d.color}18">
                  <div class="dim-advice-label" style="color:${d.color}">WHAT TO DO</div>
                  ${d.advice}
                </div>
              </div>
            </div>`).join('')}
        </div>

        <div style="margin-bottom:6px;color:var(--text-muted);font-size:11px;font-family:var(--font-mono);letter-spacing:.1em">CURRENT PHASE</div>
        <div style="background:${phaseColor}08;border:1px solid ${phaseColor}22;border-radius:14px;padding:16px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span style="font-size:20px">${phaseEmoji}</span>
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

        <button onclick="App.deleteBlend('${blend.id}')" style="width:100%;margin-top:20px;padding:12px 0;background:rgba(244,63,94,.06);border:1px solid rgba(244,63,94,.2);border-radius:10px;color:#f43f5e;font-size:13px;cursor:pointer;font-family:var(--font-mono)">Delete This Blend</button>
      </div>

      <!-- Weekly -->
      <div class="bd-content" id="bdc-weekly">
        ${renderBlendPeriod(blend.weeklyInsight, 'weekly')}
      </div>

      <!-- Monthly -->
      <div class="bd-content" id="bdc-monthly">
        ${renderBlendPeriod(blend.monthlyInsight, 'monthly')}
      </div>

      <!-- Ask Together -->
      <div class="bd-content" id="bdc-ask">
        <div class="ask-together">
          <div class="at-hero">
            <div class="at-avatars">
              <div class="at-av" style="background:rgba(139,92,246,.2);color:#8b5cf6">${u1.name[0]}</div>
              <div class="at-av" style="background:rgba(244,63,94,.2);color:#f43f5e;margin-left:-8px">${u2.name[0]}</div>
            </div>
            <div class="at-title">Ask Together</div>
            <div class="at-sub">Get a reading based on both charts simultaneously</div>
          </div>
          ${renderCoupleQuestions()}
          <textarea id="blend-ta" class="decision-ta" style="margin-bottom:12px" placeholder='Type your question... e.g. "Should we move in together?"'></textarea>
          <button class="btn-blend btn-full" onclick="App.askTogether('${blend.id}')">✦ Get Couple Reading</button>
          <div class="loading-dots" id="blend-loading" style="display:none"><span></span><span></span><span></span><em>Analyzing synastry…</em></div>
          <div class="blend-result" id="blend-result" style="display:none">
            <div class="br-label">✦ COUPLE READING · ${blend.name.toUpperCase()}</div>
            <div class="br-body" id="br-body"></div>
          </div>
          ${renderBlendHistory(blend)}
        </div>
      </div>
    </div>`;

    document.getElementById('blend-dash').innerHTML = dashHtml;

    // Expose renderBdTab to onclick
    window.renderBdTab = renderBdTab;
  }

  function renderBlendPeriod(insight, type) {
    if (!insight) return '<div class="empty-state"><div class="es-sub">Generating…</div></div>';
    return `
      <div style="background:rgba(139,92,246,.06);border:1px solid rgba(139,92,246,.15);border-radius:14px;padding:18px;margin-bottom:16px">
        <div style="color:var(--text-muted);font-size:11px;font-family:var(--font-mono);margin-bottom:6px">${type==='weekly'?'THIS WEEK':'THIS MONTH'}</div>
        <div style="font-family:var(--font-display);font-size:17px;color:var(--text-primary);margin-bottom:12px">${insight.title}</div>
        <p style="color:var(--text-secondary);font-size:14px;line-height:1.8;margin-bottom:16px">${insight.narrative}</p>
        <div style="background:rgba(139,92,246,.06);border-radius:8px;padding:10px 12px;margin-bottom:16px">
          <div style="color:#8b5cf6;font-size:11px;font-family:var(--font-mono);margin-bottom:4px">FOCUS</div>
          <div style="color:var(--text-primary);font-size:14px">${insight.focus}</div>
        </div>
      </div>
      <div class="do-avoid">
        <div class="da-box" style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.18)">
          <div class="da-label" style="color:#10b981">✓ DO MORE</div>
          ${(insight.doMore||[]).map(x=>`<div class="da-item">${x}</div>`).join('')}
        </div>
        <div class="da-box" style="background:rgba(244,63,94,.06);border:1px solid rgba(244,63,94,.18)">
          <div class="da-label" style="color:#f43f5e">✗ AVOID</div>
          ${(insight.avoid||[]).map(x=>`<div class="da-item">${x}</div>`).join('')}
        </div>
      </div>`;
  }

  function renderCoupleQuestions() {
    const qs = [
      'Is this a good time for us to travel together?',
      'Should we move in / live together?',
      'Is this a good period for a shared financial decision?',
      'Are we in a good phase for a serious commitment?',
      'Is this a good time to start something together?'
    ];
    return `<div class="quick-qs" style="margin-bottom:14px">${qs.map(q=>`<button class="quick-q" onclick="App.selectBlendQ(this,'${q.replace(/'/g,"\\'")}')"> ${q}</button>`).join('')}</div>`;
  }

  function selectBlendQ(btn, q) {
    document.querySelectorAll('.quick-q').forEach(b => b.classList.remove('sel'));
    btn.classList.add('sel');
    const ta = document.getElementById('blend-ta');
    if (ta) ta.value = q;
  }

  function renderBlendHistory(blend) {
    const hist = blend.decisionHistory || [];
    if (!hist.length) return '';
    return `<div style="margin-top:20px"><div class="sec-label" style="margin-bottom:10px">PAST QUESTIONS</div>
      ${hist.slice(0,5).map(d=>`<div class="dec-hist-item">
        <div class="dec-q">"${d.question}"</div>
        <div class="dec-a">${d.answer.slice(0,200)}…</div>
        <div class="dec-date">${new Date(d.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
      </div>`).join('')}
    </div>`;
  }

  function askTogether(blendId) {
    const blend = state.blends.find(b => b.id === blendId);
    if (!blend) return;
    const ta = document.getElementById('blend-ta');
    const q  = ta ? ta.value.trim() : '';
    if (!q) return;

    const u1 = state.users.find(u => u.id === blend.userId1);
    const u2 = state.users.find(u => u.id === blend.userId2);
    if (!u1 || !u2) return;

    document.getElementById('blend-loading').style.display = 'flex';
    document.getElementById('blend-result').style.display  = 'none';

    setTimeout(() => {
      const answer = BlendEngine.coupleDecide(q, u1.chart, u2.chart, u1.name, u2.name, blend.synastry || []);
      document.getElementById('br-body').textContent = answer;
      document.getElementById('blend-loading').style.display = 'none';
      document.getElementById('blend-result').style.display  = 'block';

      // Save to history
      blend.decisionHistory = [{ id:`d-${Date.now()}`, question:q, answer, date:new Date().toISOString() }, ...(blend.decisionHistory||[])].slice(0,20);
      save();
    }, 800);
  }

  function renameBlend(id) {
    const blend = state.blends.find(b => b.id === id);
    if (!blend) return;
    const newName = prompt('New name for this blend:', blend.name);
    if (newName && newName.trim()) {
      blend.name = newName.trim();
      save();
      const el = document.getElementById('bd-blend-name-disp');
      if (el) el.textContent = blend.name;
    }
  }

  function deleteBlend(id) {
    if (!confirm('Delete this blend?')) return;
    state.blends = state.blends.filter(b => b.id !== id);
    if (state.activeBlendId === id) state.activeBlendId = null;
    save();
    showBlendLanding();
  }

  // ── PROFILE TAB ──────────────────────────────────────────────
  function renderProfile() {
    const user = currentUser();
    if (!user) return;
    const { chart, birthData, name } = user;
    const initials = name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    const active   = chart.dasha.find(d => d.isActive);

    setHtml('profile-heading', name);
    setHtml('profile-card', `
      <div class="prof-av">${initials}</div>
      <div class="prof-info">
        <div class="prof-name">${name}</div>
        <div class="prof-signs">${chart.ascendantSign} Rising · ${chart.moonSign} Moon · ${chart.sunSign} Sun</div>
        <div class="prof-birth">${birthData.place} · ${birthData.dob}</div>
      </div>
      <button class="prof-edit" onclick="App.editProfile()">Edit ✎</button>`);

    renderProfileDetails();
    renderProfileUsers();
    renderProfileBookmarks();

    document.querySelectorAll('.ptab2').forEach(btn => {
      btn.onclick = () => switchProfileTab(btn.dataset.ptab);
    });
  }

  function switchProfileTab(tab) {
    document.querySelectorAll('.ptab2').forEach(b => b.classList.toggle('active', b.dataset.ptab === tab));
    document.querySelectorAll('.ptab2-content').forEach(c => c.classList.remove('active'));
    const el = document.getElementById(`ptab2-${tab}`);
    if (el) el.classList.add('active');
  }

  function renderProfileDetails() {
    const user = currentUser();
    if (!user) return;
    const { chart, birthData } = user;
    const active = chart.dasha.find(d => d.isActive);
    const rows = [
      { label:'Date of Birth', val:birthData.dob },
      { label:'Time',          val:birthData.time },
      { label:'Place',         val:birthData.place },
      { label:'Ascendant',     val:chart.ascendantSign },
      { label:'Moon Sign',     val:chart.moonSign },
      { label:'Sun Sign',      val:chart.sunSign },
      { label:'Lagna Lord',    val:chart.lagnaLord },
      { label:'Active Chapter',val:active ? `${active.planet} (until ${AstrologyEngine.fmtDate(active.endDate)})` : '—' },
      { label:'Active Yogas',  val:chart.yoga.length > 0 ? chart.yoga.map(y=>y.name).join(', ') : 'None identified' }
    ];
    setHtml('ptab2-details', `
      <div class="glass-card">
        ${rows.map((r,i,a) => `<div class="detail-row" ${i===a.length-1?'style="border-bottom:none"':''}>
          <span class="det-label">${r.label}</span>
          <span class="det-val">${r.val}</span>
        </div>`).join('')}
      </div>
      <button onclick="App.confirmDeleteProfile('${user.id}')" style="width:100%;margin-top:16px;padding:12px 0;background:rgba(244,63,94,.06);border:1px solid rgba(244,63,94,.2);border-radius:10px;color:#f43f5e;font-size:13px;cursor:pointer;font-family:var(--font-mono)">Delete This Profile</button>`);
  }

  function renderProfileUsers() {
    const current = currentUser();
    setHtml('ptab2-users', `
      <div style="color:var(--text-muted);font-size:11px;font-family:var(--font-mono);margin-bottom:12px">ALL PROFILES (${state.users.length})</div>
      ${state.users.map(u => {
        const isCur = u.id === state.currentUserId;
        return `<div class="user-card ${isCur?'current':''}">
          <div class="uc-av">${u.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>
          <div class="uc-info">
            <div class="uc-name">${u.name}</div>
            <div class="uc-sub">${u.chart.ascendantSign} · ${u.chart.moonSign} Moon · ${u.birthData.dob}</div>
          </div>
          ${isCur
            ? '<div class="uc-active">ACTIVE</div>'
            : `<button class="uc-switch" onclick="App.switchUser('${u.id}')">Switch</button>`}
        </div>`;
      }).join('')}
      <button class="btn-primary btn-full" style="margin-top:12px" onclick="App.addNewProfile()">+ Add New Profile</button>
      <p style="text-align:center;color:var(--text-muted);font-size:12px;margin-top:8px;font-family:var(--font-mono)">Each profile has its own chart &amp; insights</p>`);
  }

  function renderProfileBookmarks() {
    const bms = userBookmarks();
    if (bms.length === 0) {
      setHtml('ptab2-bookmarks', '<div class="empty-state"><div class="es-icon">☆</div><div class="es-title">No bookmarks yet</div><div class="es-sub">Star insights to save them here</div></div>');
      return;
    }
    const catIcon = { career:'💼', wealth:'💰', love:'💕', health:'🌿', general:'✦' };
    setHtml('ptab2-bookmarks', bms.map(i => `
      <div class="bm-card">
        <div class="bm-cat">${catIcon[i.category]||'✦'} ${i.category.toUpperCase()}</div>
        <div class="bm-title">${i.title}</div>
        <div class="bm-body">${i.content}</div>
      </div>`).join(''));
  }

  function editProfile() {
    alert('To edit your profile, delete it and create a new one. (Profile → Details → Delete This Profile)');
  }

  function confirmDeleteProfile(id) {
    if (!confirm('Delete this profile? This cannot be undone.')) return;
    state.users    = state.users.filter(u => u.id !== id);
    state.insights = state.insights.filter(i => i.userId !== id);
    state.blends   = state.blends.filter(b => b.userId1 !== id && b.userId2 !== id);
    if (state.currentUserId === id) state.currentUserId = state.users[0]?.id || null;
    save();
    if (!state.currentUserId) showScreen('screen-onboarding');
    else { renderAll(); switchTab('profile'); }
  }

  function switchUser(id) {
    state.currentUserId = id;
    state.insights      = state.insights.filter(i => i.userId !== id); // force regen
    save();
    renderAll();
    renderProfile();
  }

  function addNewProfile() {
    showOnboardingForm();
  }

  // ── TEST PANEL ────────────────────────────────────────────────
  function toggleTestPanel() {
    const panel = document.getElementById('test-panel');
    state.testPanelOpen = !state.testPanelOpen;
    panel.style.display = state.testPanelOpen ? 'block' : 'none';
  }

  // ── ONBOARDING ────────────────────────────────────────────────
  function startOnboarding() { showOnboardingForm(); }

  function showOnboardingForm() {
    state.formStep = 0;
    state.formData = {};
    showScreen('screen-form');
    updateFormStep(0);
    makeStars('stars2');
  }

  function updateFormStep(step) {
    document.querySelectorAll('.form-step').forEach((el,i) => el.classList.toggle('active', i === step));
    document.querySelectorAll('.dot').forEach((el,i) => el.classList.toggle('active', i === step));
    state.formStep = step;
  }

  function submitForm() {
    const city = AstrologyEngine.CITIES.find(c => c.name === state.formData.place);
    if (!city) { alert('Please select a city from the list'); return; }

    const birthData = {
      name:     state.formData.name,
      dob:      state.formData.dob,
      time:     state.formData.time,
      place:    city.name,
      lat:      city.lat,
      lon:      city.lon,
      timezone: city.tz
    };

    try {
      const chart = AstrologyEngine.calculateChart(birthData);
      const user  = {
        id:        `user-${Date.now()}`,
        name:      birthData.name,
        birthData,
        chart,
        createdAt: new Date().toISOString()
      };
      state.users.push(user);
      state.currentUserId = user.id;
      save();
      generateInsights();
      showApp();
      makeStars('stars3');
    } catch(e) {
      console.error('Chart calculation error:', e);
      alert('Could not calculate chart. Please check your birth details.');
    }
  }

  // ── City Autocomplete ─────────────────────────────────────────
  function setupCityInput() {
    const inp  = document.getElementById('inp-city');
    const drop = document.getElementById('city-drop');
    if (!inp || !drop) return;

    inp.addEventListener('input', () => {
      const q     = inp.value.toLowerCase();
      const cities = AstrologyEngine.CITIES;
      const matches = q.length === 0
        ? cities.slice(0,10)
        : cities.filter(c => c.name.toLowerCase().includes(q)).slice(0,10);

      if (matches.length === 0) { drop.classList.remove('open'); return; }
      drop.innerHTML = matches.map(c =>
        `<div class="city-item" onclick="App.selectCity('${c.name.replace(/'/g,"\\'")}')">◉ ${c.name}</div>`
      ).join('');
      drop.classList.add('open');
    });

    inp.addEventListener('focus', () => {
      if (inp.value.length === 0) {
        drop.innerHTML = AstrologyEngine.CITIES.slice(0,8).map(c =>
          `<div class="city-item" onclick="App.selectCity('${c.name.replace(/'/g,"\\'")}')">◉ ${c.name}</div>`
        ).join('');
        drop.classList.add('open');
      }
    });

    document.addEventListener('click', (e) => {
      if (!inp.contains(e.target) && !drop.contains(e.target)) drop.classList.remove('open');
    });
  }

  function selectCity(name) {
    const city = AstrologyEngine.CITIES.find(c => c.name === name);
    if (!city) return;
    state.formData.place = name;
    document.getElementById('inp-city').value = name;
    document.getElementById('city-drop').classList.remove('open');
    const row = document.getElementById('coords-row');
    if (row) {
      row.style.display = 'flex';
      setHtml('c-lat', `${city.lat.toFixed(4)}°`);
      setHtml('c-lon', `${city.lon.toFixed(4)}°`);
      setHtml('c-tz',  `UTC+${city.tz}`);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────
  function setHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function SIGN_EMOJI(sign) {
    return { Aries:'♈',Taurus:'♉',Gemini:'♊',Cancer:'♋',Leo:'♌',Virgo:'♍',
             Libra:'♎',Scorpio:'♏',Sagittarius:'♐',Capricorn:'♑',Aquarius:'♒',Pisces:'♓' }[sign] || '';
  }

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    load();
    makeStars('stars1');

    // Route to correct screen
    if (state.currentUserId && state.users.find(u => u.id === state.currentUserId)) {
      showApp();
      makeStars('stars3');
    } else {
      showScreen('screen-onboarding');
    }

    // Onboarding button
    const stepBtn0 = document.getElementById('step0-next');
    if (stepBtn0) stepBtn0.onclick = () => updateFormStep(1);

    // Step 1
    const step1next = document.getElementById('step1-next');
    const step1back = document.getElementById('step1-back');
    if (step1next) step1next.onclick = () => {
      const name = document.getElementById('inp-name')?.value.trim();
      const dob  = document.getElementById('inp-dob')?.value;
      const time = document.getElementById('inp-time')?.value;
      if (!name || !dob || !time) { alert('Please fill in all fields'); return; }
      state.formData.name = name;
      state.formData.dob  = dob;
      state.formData.time = time;
      updateFormStep(2);
      setupCityInput();
    };
    if (step1back) step1back.onclick = () => updateFormStep(0);

    // Step 2
    const step2submit = document.getElementById('step2-submit');
    const step2back   = document.getElementById('step2-back');
    if (step2submit) step2submit.onclick = () => {
      if (!state.formData.place) { alert('Please select a birth city'); return; }
      submitForm();
    };
    if (step2back) step2back.onclick = () => updateFormStep(1);

    // Back on form screen
    const formBackBtn = document.getElementById('form-back-btn');
    if (formBackBtn) formBackBtn.onclick = () => {
      if (state.users.length > 0) showApp(); else showScreen('screen-onboarding');
    };

    // Bottom nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.onclick = () => switchTab(btn.dataset.tab);
    });

    // Period tabs
    document.querySelectorAll('.ptab').forEach(btn => {
      btn.onclick = () => switchPeriod(btn.dataset.period);
    });

    // Chart system toggle
    document.getElementById('btn-western')?.addEventListener('click', () => {
      state.chartSystem = 'western';
      document.getElementById('btn-western').classList.add('active');
      document.getElementById('btn-vedic').classList.remove('active');
      renderChart();
    });
    document.getElementById('btn-vedic')?.addEventListener('click', () => {
      state.chartSystem = 'vedic';
      document.getElementById('btn-vedic').classList.add('active');
      document.getElementById('btn-western').classList.remove('active');
      renderChart();
    });

    // Chart diagram toggle
    const diagramBtn = document.getElementById('chart-diagram-btn');
    const diagramWrap= document.getElementById('chart-diagram-wrap');
    if (diagramBtn && diagramWrap) {
      diagramBtn.onclick = () => {
        const open = diagramWrap.style.display === 'none' || !diagramWrap.style.display;
        diagramWrap.style.display = open ? 'block' : 'none';
        diagramBtn.textContent = open ? '📐 Birth Chart Diagram ▲' : '📐 Birth Chart Diagram ▼';
        if (open) {
          const user = currentUser();
          if (user) drawChartDiagram(user.chart);
        }
      };
    }
  }

  // ── Expose public API ─────────────────────────────────────────
  return {
    init,
    startOnboarding,
    switchTab,
    switchPeriod,
    toggleTestPanel,
    toggleBookmark,
    togglePlanet,
    expandInsight,
    expandDecHistory,
    selectCity,
    selectQuestion,
    selectBlendQ,
    openBlend,
    showBlendLanding,
    askTogether,
    renameBlend,
    deleteBlend,
    addNewProfile,
    editProfile,
    confirmDeleteProfile,
    switchUser,
    creatorSelect,
    creatorNext,
    creatorBack,
    createBlendFinal,
    // expose for tests
    _state: () => state,
    _currentUser: currentUser,
    _generateInsights: generateInsights,
    _calcChart: (data) => AstrologyEngine.calculateChart(data)
  };

})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
