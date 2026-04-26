/* ═══════════════════════════════════════════════════════════════
   ASTRAMIND — AstroBlend Engine v1.0.0
   Synastry analysis · Compatibility · Couple insights
═══════════════════════════════════════════════════════════════ */

const BlendEngine = (function () {

  const ASPECT_ORBS = { conjunction:8, opposition:7, trine:6, square:6, sextile:5 };

  function getAspect(angle) {
    const d = Math.abs(((angle % 360) + 360) % 360);
    const diff = d > 180 ? 360 - d : d;
    const targets = [
      { type:'conjunction', target:0   },
      { type:'opposition',  target:180 },
      { type:'trine',       target:120 },
      { type:'square',      target:90  },
      { type:'sextile',     target:60  }
    ];
    for (const { type, target } of targets) {
      const orb = Math.abs(diff - target);
      if (orb <= ASPECT_ORBS[type]) return { type, orb: parseFloat(orb.toFixed(1)) };
    }
    return null;
  }

  function aspectNature(type, p1, p2) {
    if (['trine','sextile'].includes(type)) return 'harmonious';
    if (['square','opposition'].includes(type)) return 'challenging';
    // Conjunction depends on planets
    const good = ['Moon','Venus','Jupiter'];
    return (good.includes(p1) && good.includes(p2)) ? 'harmonious' : 'neutral';
  }

  // Synastry meaning library
  const MEANINGS = {
    'Moon-Moon': {
      conjunction: 'Emotional fusion — you mirror each other\'s feelings intensely. Creates deep bonding but can become an emotional echo chamber. Healthy boundaries make this incredibly powerful.',
      trine:       'Emotional language match. You understand each other\'s moods intuitively — sometimes without words. This is rare and deeply stabilizing.',
      sextile:     'Emotionally compatible with natural empathy. You give each other space to feel without judgment. A solid foundation for hard conversations.',
      square:      'Emotional mismatch at the core. What makes one feel safe unsettles the other. Not impossible — but you\'ll need to intentionally learn each other\'s emotional language.',
      opposition:  'Different emotional rhythms. One wants closeness when the other needs space. You feel each other deeply but sometimes in opposite directions.'
    },
    'Sun-Moon': {
      conjunction: 'Intense fusion — the Sun\'s identity directly meets the Moon\'s emotional needs. Magnetic and often stabilizing when mature.',
      trine:       'Core personalities and emotional natures flow well together. You energize each other without trying. A natural give-and-take.',
      sextile:     'Good chemistry between who you are and how the other feels. Requires some effort but always pays off.',
      square:      'Friction between identity and emotion. You may misread each other\'s needs frequently. Growth-inducing but frustrating if unaddressed.',
      opposition:  'One person\'s confidence can inadvertently dim the other\'s security. Challenge each other to grow beyond your comfort zones.'
    },
    'Venus-Mars': {
      conjunction: 'Raw, immediate attraction. You both feel it, and it doesn\'t fade quickly. This is the aspect that makes people say "there was just something there."',
      trine:       'Natural romantic flow. The attraction is real and sustains itself without drama. The comfortable fire that keeps burning.',
      sextile:     'Genuine attraction with a playful edge. You inspire each other creatively and romantically. Takes effort to ignite but burns clean.',
      square:      'Intense attraction mixed with friction. You want each other but sometimes rub each other the wrong way. Passion and irritation coexist.',
      opposition:  'A push-pull dynamic. The attraction is undeniable and so is the tension. Electric or exhausting — depends on the day.'
    },
    'Mercury-Mercury': {
      conjunction: 'Minds that operate in sync — for better or worse. You finish each other\'s thoughts and can get into the same mental ruts together.',
      trine:       'You just talk well. Conversations flow, ideas spark ideas, and "that\'s not what I meant" moments are rare. Real intellectual sync.',
      sextile:     'Good communication chemistry that improves with time. You complement each other\'s thinking styles rather than competing.',
      square:      'Different communication styles that create real misunderstandings. You\'re both saying what you mean — you just mean different things. Patience required.',
      opposition:  'Opposite mental approaches. One is direct while the other is indirect. Frustrating but broadening.'
    },
    'Sun-Sun': {
      conjunction: 'Very similar core natures. Creates deep understanding or a hall-of-mirrors effect where you amplify both strengths and blindspots.',
      trine:       'Core personalities that simply get along. You admire qualities in each other you also recognize in yourself.',
      sextile:     'Compatible identities with room for individuality. You support each other\'s goals without ego collision.',
      square:      'Ego tension. Two strong personalities that occasionally compete for the same space. Drives growth or resentment.',
      opposition:  'Opposite cores. Drawn to what\'s different but can find those same things irritating. Classic attraction of opposites.'
    },
    'Saturn-Moon': {
      conjunction: 'Heavy aspect. Saturn\'s lessons land directly on the Moon\'s feelings. Can be incredibly growth-inducing or emotionally burdensome depending on maturity.',
      trine:       'Stabilizing. Saturn grounds the Moon\'s emotional nature. The aspect of long-term security — not the most electric, but it endures.',
      sextile:     'Saturn provides a container for the Moon\'s feelings. The emotional person feels held; the Saturn person feels needed.',
      square:      'Saturn can feel cold to the Moon\'s needs. The emotional person may feel unseen. The lesson: discipline and tenderness can coexist.',
      opposition:  'Saturn restricts what the Moon needs to feel free. Real work required to prevent emotional suppression becoming a pattern.'
    },
    'Jupiter-Venus': {
      conjunction: 'Abundance and joy between you. Genuine pleasure, generosity, and expansive warmth. People around you feel the good energy.',
      trine:       'Natural happiness together. You bring out each other\'s optimism and create comfort without trying.',
      sextile:     'Good fortune and pleasure in the connection. You enjoy life better together than separately.',
      square:      'Too much of a good thing. Excess or unrealistic expectations. The joy is real but needs discipline.',
      opposition:  'Expansive ideals that can clash with practical reality. The warmth is genuine, but grounding is needed.'
    }
  };

  function getSynastryMeaning(p1, p2, type) {
    const keys = [`${p1}-${p2}`, `${p2}-${p1}`];
    for (const k of keys) {
      if (MEANINGS[k] && MEANINGS[k][type]) return MEANINGS[k][type];
    }
    // Generic fallback
    const aspectDesc = { conjunction:'directly fused with', trine:'naturally flowing with', sextile:'cooperating with', square:'in friction with', opposition:'in tension with' };
    const areas = { Sun:'your identity', Moon:'your emotions', Mercury:'your communication', Venus:'your love style', Mars:'your drive', Jupiter:'your growth', Saturn:'your discipline', Rahu:'your ambitions', Ketu:'your spiritual side' };
    return `Your ${areas[p1] || p1} is ${aspectDesc[type]} their ${areas[p2] || p2}, shaping how these themes play out between you.`;
  }

  // ── Synastry Calculator ──────────────────────────────────────
  function calcSynastry(chart1, chart2) {
    const KEY_PLANETS = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'];
    const aspects = [];

    for (const n1 of KEY_PLANETS) {
      const p1 = chart1.planets.find(p => p.name === n1);
      if (!p1) continue;
      for (const n2 of KEY_PLANETS) {
        const p2 = chart2.planets.find(p => p.name === n2);
        if (!p2) continue;
        const result = getAspect(p1.longitude - p2.longitude);
        if (!result) continue;
        const nature = aspectNature(result.type, n1, n2);
        const meaning = getSynastryMeaning(n1, n2, result.type);
        if (!meaning) continue;

        const cat = getCategory(n1, n2);
        aspects.push({
          planet1: n1, planet2: n2,
          orb: result.orb, aspectType: result.type,
          strength: result.orb < 2 ? 'strong' : result.orb < 5 ? 'moderate' : 'weak',
          nature, meaning, category: cat
        });
      }
    }

    return aspects.sort((a,b) => ({ strong:0, moderate:1, weak:2 }[a.strength] - { strong:0, moderate:1, weak:2 }[b.strength]));
  }

  function getCategory(p1, p2) {
    if (['Moon','Saturn'].includes(p1) && ['Moon','Saturn'].includes(p2)) return 'emotional';
    if (['Venus','Mars'].includes(p1) && ['Venus','Mars'].includes(p2)) return 'romantic';
    if (['Mercury','Sun'].includes(p1) && ['Mercury','Sun'].includes(p2)) return 'communication';
    if (['Jupiter'].includes(p1) || ['Jupiter'].includes(p2)) return 'growth';
    return 'general';
  }

  // ── Compatibility Dimensions ─────────────────────────────────
  function calcDimensions(chart1, chart2, aspects) {
    const levelFor = s => s >= 80 ? 'Exceptional' : s >= 65 ? 'Strong' : s >= 50 ? 'Good' : s >= 35 ? 'Complex' : 'Challenging';
    const colorFor = l => ({ Exceptional:'#10b981', Strong:'#8b5cf6', Good:'#06b6d4', Complex:'#f59e0b', Challenging:'#f43f5e' })[l];

    function dim(label, emoji, filterFn, scoreBase, insightFn, depthFn, adviceFn) {
      const match = aspects.filter(filterFn);
      const h = match.filter(a => a.nature === 'harmonious').length;
      const c = match.filter(a => a.nature === 'challenging').length;
      const score = Math.min(92, Math.max(22, scoreBase + h*10 - c*10));
      const level = levelFor(score);
      return { label, emoji, score, level, color: colorFor(level), insight: insightFn(score, match), depth: depthFn(score, match), advice: adviceFn(score) };
    }

    const emo = dim('Emotional Sync', '💙',
      a => ['emotional'].includes(a.category) || (a.planet1==='Moon' && a.planet2==='Moon'),
      60,
      (s, m) => `${chart1.moonSign} Moon meets ${chart2.moonSign} Moon — ${getMoonMoonInsight(chart1.moonSign, chart2.moonSign)}`,
      (s, m) => m.length > 0 ? m[0].meaning : `Your emotional natures (${chart1.moonSign} and ${chart2.moonSign}) ${s >= 60 ? 'resonate naturally, creating intuitive understanding' : 'operate differently — active learning of each other\'s emotional language required'}.`,
      s => s >= 65 ? 'Lean into emotional conversations. You have a natural gift for it — don\'t take it for granted.' : 'Name your emotional needs explicitly. Your emotional languages are different, and that\'s workable with intention.'
    );

    const rom = dim('Romantic Pull', '🔥',
      a => a.category === 'romantic' || (a.planet1==='Venus' && a.planet2==='Mars') || (a.planet1==='Mars' && a.planet2==='Venus'),
      aspects.some(a => (a.planet1==='Venus'&&a.planet2==='Mars')||(a.planet1==='Mars'&&a.planet2==='Venus')) ? 72 : 52,
      (s, m) => m.length > 0 ? `Venus-Mars ${m[0].aspectType} — ${m[0].nature === 'harmonious' ? 'sustained, real attraction' : 'intense but friction-filled chemistry'}` : `${chart1.ascendantSign} and ${chart2.ascendantSign} Rising — ${s > 60 ? 'compatible energies that attract' : 'different energies that occasionally clash'}`,
      (s, m) => m.length > 0 ? m[0].meaning : `Romantic chemistry exists beyond obvious aspects. ${s >= 60 ? 'The attraction sustains itself.' : 'Connection runs deeper than surface attraction — build through shared values and experiences.'}`,
      s => s >= 65 ? 'Protect the chemistry by keeping novelty alive. You have it — don\'t let routine kill it.' : 'Focus on shared values and experiences to build lasting desire.'
    );

    const comm = dim('Communication Flow', '🗣️',
      a => a.category === 'communication',
      60,
      (s, m) => m.length > 0 ? `Mercury ${m[0].aspectType} Mercury — ${m[0].nature === 'harmonious' ? 'natural conversational chemistry' : 'different mental wavelengths'}` : `Communication styles between ${chart1.sunSign} and ${chart2.sunSign}`,
      (s, m) => m.length > 0 ? m[0].meaning : `Your mental styles interact through your Sun signs. ${s >= 60 ? 'You tend to understand each other\'s thinking even when you disagree.' : 'You process information differently — establish communication agreements.'}`,
      s => s >= 65 ? 'Use your communication strength for the hard conversations, not just easy ones.' : 'Signal when you need space to process vs when you want to talk it out. This reduces 70% of misunderstandings.'
    );

    const growth = dim('Long-Term Growth', '🌱',
      a => a.planet1 === 'Jupiter' || a.planet2 === 'Jupiter' || a.planet1 === 'Saturn' || a.planet2 === 'Saturn',
      55,
      (s) => s >= 70 ? 'You actively make each other better people' : 'Growth is possible but requires intentional effort from both sides',
      (s, m) => m.length > 0 ? m[0].meaning : `${s >= 60 ? 'Your expansion and structure energies complement each other, building something durable.' : 'Your growth approaches pull in different directions — one expands when the other wants to consolidate.'}`,
      s => s >= 65 ? 'Talk about your individual goals regularly. You grow best when building toward something together, not just alongside each other.' : 'Define what growth means for each of you individually. Relationships where each person is growing are the ones that last.'
    );

    const values = dim('Shared Values', '⚖️',
      a => (a.planet1==='Venus'&&a.planet2==='Venus') || (a.planet1==='Saturn'&&a.planet2==='Saturn'),
      58,
      (s) => `${chart1.sunSign} and ${chart2.sunSign} at the core — ${getSharedValueInsight(chart1.sunSign, chart2.sunSign)}`,
      (s) => `Venus placements (${chart1.planets.find(p=>p.name==='Venus')?.sign||'—'} and ${chart2.planets.find(p=>p.name==='Venus')?.sign||'—'}) reveal core values. ${s >= 60 ? 'You want similar things from life — less negotiation, more shared direction.' : 'You value different things. Richness comes through real compromise on the big decisions.'}`,
      s => s >= 65 ? 'Protect your value alignment by making explicit agreements on money, lifestyle, and priorities.' : 'Have the values conversation explicitly and often — not to change each other, but to understand what you\'re each optimizing for.'
    );

    return [emo, rom, comm, growth, values];
  }

  function getMoonMoonInsight(m1, m2) {
    const el = { Aries:'Fire',Leo:'Fire',Sagittarius:'Fire', Taurus:'Earth',Virgo:'Earth',Capricorn:'Earth', Gemini:'Air',Libra:'Air',Aquarius:'Air', Cancer:'Water',Scorpio:'Water',Pisces:'Water' };
    const e1 = el[m1]||'Mixed', e2 = el[m2]||'Mixed';
    if (e1 === e2) return { Fire:'two emotionally passionate people who feel life intensely and often in sync', Earth:'two people who need stability — your emotional needs mirror each other comfortably', Air:'you both process emotion through thinking — intellectually empathetic', Water:'deeply intuitive emotional connection, sometimes borderline telepathic' }[e1] || 'similar natures that create natural understanding';
    const combos = { 'Air-Fire':'passionate meets intellectual — emotionally stimulating', 'Earth-Fire':'one needs excitement, the other security — real tension requiring compromise', 'Fire-Water':'intense but volatile — one evaporates under heat, one drowns the fire', 'Air-Earth':'practical meets conceptual — grounded stability vs restless ideas', 'Earth-Water':'beautifully nurturing — one provides security, the other depth', 'Air-Water':'head meets heart — one analyzes feelings, the other just feels them' };
    return combos[[e1,e2].sort().join('-')] || 'contrasting emotional natures requiring intentional understanding';
  }

  function getSharedValueInsight(s1, s2) {
    const modes = { Aries:'Cardinal',Cancer:'Cardinal',Libra:'Cardinal',Capricorn:'Cardinal', Taurus:'Fixed',Leo:'Fixed',Scorpio:'Fixed',Aquarius:'Fixed', Gemini:'Mutable',Virgo:'Mutable',Sagittarius:'Mutable',Pisces:'Mutable' };
    const m1 = modes[s1]||'Mixed', m2 = modes[s2]||'Mixed';
    if (m1===m2) return { Cardinal:'two initiators who may compete for the lead — set clear roles', Fixed:'two deeply loyal people who both hold firm — unstoppable when aligned, immovable when opposed', Mutable:'two adaptable natures who can flow together — flexibility is your superpower' }[m1] || 'similar approaches to change';
    return 'different approaches to change and stability that balance each other with mutual respect';
  }

  // ── Narrative Generation ─────────────────────────────────────
  function coreNarrative(chart1, chart2, name1, name2, aspects) {
    const n1 = name1.split(' ')[0], n2 = name2.split(' ')[0];
    const sh = aspects.filter(a => a.nature==='harmonious' && a.strength==='strong');
    const sc = aspects.filter(a => a.nature==='challenging' && a.strength==='strong');
    const hasVM = aspects.some(a => (a.planet1==='Venus'&&a.planet2==='Mars')||(a.planet1==='Mars'&&a.planet2==='Venus'));
    const hasMM = aspects.some(a => a.planet1==='Moon'&&a.planet2==='Moon');

    let s = `${n1} (${chart1.sunSign} Sun, ${chart1.moonSign} Moon, ${chart1.ascendantSign} Rising) and ${n2} (${chart2.sunSign} Sun, ${chart2.moonSign} Moon, ${chart2.ascendantSign} Rising) form a `;
    if (sh.length >= 3 && sc.length <= 1) s += 'naturally flowing connection with strong innate compatibility. ';
    else if (sc.length >= 3) s += 'complex, high-growth dynamic that requires real maturity to navigate well. ';
    else if (sh.length >= 2 && sc.length >= 2) s += 'layered relationship where genuine harmony coexists with real friction. ';
    else s += 'nuanced connection shaped by complementary energies and growth-inducing tensions. ';
    if (hasVM) s += 'There\'s an unmistakable attraction that doesn\'t require effort — Venus and Mars are directly activated between you. ';
    if (hasMM) s += 'Your emotional natures connect directly — you understand each other\'s moods in ways that can surprise you. ';
    s += `At the core, this is a relationship where ${sh.length > sc.length ? 'natural ease outweighs friction — use that foundation wisely.' : 'growth comes through navigating real differences — the friction is the teacher.'}`;
    return s;
  }

  function strengthsAndFriction(chart1, chart2, aspects, dims) {
    const strengths = [], friction = [];
    for (const d of dims.filter(x => x.score >= 68).slice(0,2)) strengths.push(`${d.emoji} ${d.label}: ${d.insight}`);
    for (const d of dims.filter(x => x.score < 45).slice(0,2)) friction.push(`${d.emoji} ${d.label}: ${d.insight}`);
    for (const a of aspects.filter(x => x.nature==='harmonious' && x.strength==='strong').slice(0,2)) {
      if (strengths.length < 4) strengths.push(`✦ ${a.planet1}–${a.planet2} ${a.aspectType}: ${a.meaning.split('.')[0]}`);
    }
    for (const a of aspects.filter(x => x.nature==='challenging' && x.strength==='strong').slice(0,2)) {
      if (friction.length < 4) friction.push(`⚡ ${a.planet1}–${a.planet2} ${a.aspectType}: ${a.meaning.split('.')[0]}`);
    }
    return { strengths: strengths.slice(0,4), frictionPoints: friction.slice(0,4) };
  }

  function currentPhase(chart1, chart2) {
    const d1 = chart1.dasha.find(x=>x.isActive)?.planet || 'Saturn';
    const d2 = chart2.dasha.find(x=>x.isActive)?.planet || 'Jupiter';
    const positive = ['Jupiter','Venus','Sun','Moon'];
    const isAligned = positive.includes(d1) && positive.includes(d2);
    const isTense   = ['Saturn','Rahu','Ketu'].includes(d1) && ['Saturn','Rahu','Ketu'].includes(d2);
    const energy    = isAligned ? 'aligned' : isTense ? 'tense' : 'growth';

    const phases = {
      aligned: { title:'High Harmony Period', emoji:'🌟', description:`Both in expansive chapters (${d1} and ${d2}) — individually things feel positive, and that energy transfers into your connection. One of those rare windows where it\'s easier to be your best selves together.`, emotional:'Emotional receptivity is high for both. Deep conversations will land well. Vulnerability feels safer than usual.', practical:'Good time for shared decisions, commitments, or plans. Energy supports things moving forward.' },
      tense:   { title:'Navigating a Complex Phase', emoji:'⚡', description:`Both in demanding chapters (${d1} and ${d2}) — life is asking hard questions individually, and that pressure shows up between you. Not a bad sign — it\'s a growth test.`, emotional:'Emotions run higher than usual. Both of you may be more sensitive to perceived slights. Name that dynamic explicitly.', practical:'Avoid major shared decisions this month unless necessary. Focus on stability and showing up consistently.' },
      growth:  { title:'Two Speeds, One Direction', emoji:'🌱', description:`Your individual chapters (${d1} and ${d2}) are moving at different rhythms. One may feel more expansive while the other is being tested. This is the "two speeds" dynamic that growth couples learn to navigate.`, emotional:'Check in more frequently. The one in the easier chapter should hold space; the one being tested should ask for what they need.', practical:'Build new shared habits or routines that will carry both of you through different individual seasons.' }
    };

    const p = phases[energy];
    return { ...p, energy, duration:`~${2 + (new Date().getMonth() % 3)} months` };
  }

  function weeklyInsight(chart1, chart2, name1, name2, aspects) {
    const n1 = name1.split(' ')[0], n2 = name2.split(' ')[0];
    const d1 = chart1.dasha.find(x=>x.isActive)?.planet || 'Jupiter';
    const d2 = chart2.dasha.find(x=>x.isActive)?.planet || 'Saturn';
    const wk = Math.floor(new Date().getDate() / 7);
    const strongAsp = aspects.filter(a => a.strength !== 'weak').slice(0,2);
    const titles = ['A Week for Honest Conversations','Building Momentum Together','Quiet Depth Week','Action-Oriented Week'];

    return {
      period: 'weekly',
      title: titles[wk % titles.length],
      narrative: `${n1} is in their ${d1} chapter and ${n2} in their ${d2} chapter — this week those energies intersect around ${wk%2===0 ? 'communication and clarity' : 'emotion and connection'}. ${strongAsp[0] ? `Your ${strongAsp[0].planet1}–${strongAsp[0].planet2} ${strongAsp[0].aspectType} is active — ${strongAsp[0].meaning.split('.')[0]}.` : ''} The energy this week rewards directness over hints.`,
      doMore: [
        wk%2===0 ? 'Have the conversation you\'ve been putting off' : 'Spend unplanned time together without an agenda',
        'Acknowledge one specific thing you appreciate about each other — out loud',
        d1==='Mercury'||d2==='Mercury' ? 'Write it down if you can\'t say it out loud' : 'Physical presence matters more than usual this week'
      ],
      avoid: [
        'Bringing up old grievances when the real issue is the current one',
        d1==='Saturn'||d2==='Saturn' ? 'Letting work stress redirect into relationship tension' : 'Overcommitting on behalf of both of you',
        'Assuming you know what the other person needs without asking'
      ],
      focus: wk%2===0 ? 'Honesty with kindness' : 'Presence over productivity'
    };
  }

  function monthlyInsight(chart1, chart2, name1, name2, aspects) {
    const n1 = name1.split(' ')[0], n2 = name2.split(' ')[0];
    const d1 = chart1.dasha.find(x=>x.isActive)?.planet || 'Jupiter';
    const d2 = chart2.dasha.find(x=>x.isActive)?.planet || 'Saturn';
    const mon = new Date().toLocaleDateString('en-US',{month:'long'});
    const positive = ['Jupiter','Venus','Sun'];
    const isGood = positive.includes(d1) || positive.includes(d2);

    return {
      period: 'monthly',
      title: `${mon}: ${d1===d2 ? 'Aligned Energies' : 'Two Speeds, One Direction'}`,
      narrative: `${n1} (${d1} Dasha) and ${n2} (${d2} Dasha) — ${mon} brings ${isGood ? 'a generally expansive energy that benefits the connection' : 'a more demanding backdrop that will test your ability to support each other under pressure'}. The ${aspects.filter(a=>a.strength==='strong').length} strong synastry aspects between your charts continue to be the defining dynamic.`,
      doMore: [
        'Create one new shared experience this month — something neither has done before',
        'Have the "what are we building toward" conversation — individually and together',
        isGood ? 'Say yes to the spontaneous things — the energy rewards openness' : 'Build at least one new consistent ritual together'
      ],
      avoid: [
        'Letting busyness become the default relationship state for the whole month',
        'Keeping score on who put in more effort — it shifts monthly',
        d1==='Saturn'||d2==='Saturn' ? 'Letting Saturn\'s seriousness drain all the lightness from your time together' : 'Over-planning your time together to the point it loses spontaneity'
      ],
      focus: `${chart1.moonSign} Moon meets ${chart2.moonSign} Moon — honor each other\'s emotional rhythms this month`
    };
  }

  // ── Decision Mode for Couples ────────────────────────────────
  function coupleDecide(question, chart1, chart2, name1, name2, aspects) {
    const n1 = name1.split(' ')[0], n2 = name2.split(' ')[0];
    const d1 = chart1.dasha.find(x=>x.isActive)?.planet || 'Jupiter';
    const d2 = chart2.dasha.find(x=>x.isActive)?.planet || 'Saturn';
    const q  = question.toLowerCase();
    const h  = aspects.filter(a => a.nature==='harmonious').length;
    const c  = aspects.filter(a => a.nature==='challenging').length;
    const gen = h > c;

    const prefix = `Analyzing for ${n1} (${chart1.sunSign} Sun, ${d1} Dasha) and ${n2} (${chart2.sunSign} Sun, ${d2} Dasha): `;

    if (/travel|trip|vacation/.test(q)) return prefix + `Travel together is ${['Jupiter','Venus','Sun'].includes(d1)||['Jupiter','Venus','Sun'].includes(d2) ? 'well-supported right now — at least one of you is in an expansive chapter that benefits from new experiences' : 'possible but may need more planning — both Dashas are more inward-focused'}. ${gen ? 'Your synastry suggests travel deepens your bond rather than stressing it.' : 'Travel amplifies existing dynamics — great if things are good, stressful if there\'s existing tension. Address lingering friction before booking.'} Best window: ${['Jupiter','Venus'].includes(d1)&&['Jupiter','Venus'].includes(d2) ? 'now is actually ideal' : 'wait 4–6 weeks for cleaner energy'}.`;

    if (/move|live together|relocat/.test(q)) return prefix + `Moving in or relocating is a ${d1==='Saturn'||d2==='Saturn' ? 'Saturn-influenced decision — the foundation matters enormously. Don\'t rush the practical details' : 'decision supported by current energy if underlying relationship health is solid'}. ${h >= 3 ? 'Your chart synergy suggests shared space will deepen the connection.' : 'Your charts show friction points that shared space amplifies. Resolve recurring conflicts first.'} Key question before deciding: what does "home" mean to each of you?`;

    if (/invest|money|financial|business together/.test(q)) return prefix + `Shared financial decisions under ${d1} and ${d2} Dasha: ${['Saturn','Mercury'].includes(d1)||['Saturn','Mercury'].includes(d2) ? 'structured financial planning over speculation' : 'Jupiter energy can create optimism that outpaces reality — validate numbers before committing'}. ${gen ? 'Your synastry shows good value alignment — the foundation of any shared financial decision.' : 'Your values dimensions show real differences — discuss risk tolerance and spending philosophy before committing shared capital.'} Practical: document the agreement to prevent resentment, not because you distrust each other.`;

    if (/commit|marriage|engage|next level/.test(q)) {
      const jupGood = aspects.some(a => (a.planet1==='Jupiter'||a.planet2==='Jupiter') && a.nature==='harmonious');
      const satGood = aspects.some(a => (a.planet1==='Saturn'||a.planet2==='Saturn') && a.nature==='harmonious');
      return prefix + `Commitment timing: ${jupGood ? 'Jupiter aspects support lasting commitments — the expansive energy holds' : 'Jupiter isn\'t strongly activated, which means commitment works but needs more intentional nurturing'}. ${satGood ? 'Strong Saturn contacts mean whatever you build together will be durable — built for the long game.' : 'Without strong Saturn support, build structure consciously: shared agreements, clear expectations, regular check-ins.'} Dasha context: ${['Venus','Jupiter','Moon'].includes(d1)&&['Venus','Jupiter','Moon'].includes(d2) ? 'Both chapters are receptive to deepening — timing is genuinely good.' : 'Mixed energy — consider waiting for a more expansive phase if possible.'}`;
    }

    return prefix + `For this decision, your charts show ${gen ? 'more flow than friction' : 'more friction than flow'} in synastry. ${n1}\'s ${d1} chapter and ${n2}\'s ${d2} chapter mean ${['Jupiter','Venus','Sun'].includes(d1)&&['Jupiter','Venus','Sun'].includes(d2) ? 'you\'re both in relatively expansive energy — a good time for joint decisions' : 'at least one of you is in a more demanding chapter, which adds weight to the decision'}. Test: can you both articulate clearly why you want this, independently of each other? If yes — alignment exists. If one is more enthusiastic, discuss why before proceeding.`;
  }

  // ── Create Full Blend ────────────────────────────────────────
  function createBlend(userId1, userId2, name1, name2, chart1, chart2, blendName) {
    const synastry   = calcSynastry(chart1, chart2);
    const dimensions = calcDimensions(chart1, chart2, synastry);
    const narrative  = coreNarrative(chart1, chart2, name1, name2, synastry);
    const { strengths, frictionPoints } = strengthsAndFriction(chart1, chart2, synastry, dimensions);
    const phase   = currentPhase(chart1, chart2);
    const weekly  = weeklyInsight(chart1, chart2, name1, name2, synastry);
    const monthly = monthlyInsight(chart1, chart2, name1, name2, synastry);
    const defaultName = `${name1.split(' ')[0]} ✦ ${name2.split(' ')[0]}`;

    return {
      id:            `blend-${Date.now()}`,
      name:          blendName || defaultName,
      userId1, userId2,
      createdAt:     new Date().toISOString(),
      lastUpdated:   new Date().toISOString(),
      synastry, dimensions,
      coreNarrative: narrative,
      strengths, frictionPoints,
      currentPhase:  phase,
      weeklyInsight: weekly,
      monthlyInsight: monthly,
      decisionHistory: []
    };
  }

  // ── Expose ────────────────────────────────────────────────────
  return { createBlend, coupleDecide };

})();
