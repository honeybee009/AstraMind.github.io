/* ═══════════════════════════════════════════════════════════════
   ASTRAMIND — Insight Engine v1.0.0
   100% local, no API calls. All insight text generated from chart.
═══════════════════════════════════════════════════════════════ */

const InsightEngine = (function () {

  // ── Context Builder ─────────────────────────────────────────
  function buildCtx(chart, name) {
    const active = chart.dasha.find(d => d.isActive);
    const get    = n => chart.planets.find(p => p.name === n) || {};
    return {
      firstName:    name.split(' ')[0],
      asc:          chart.ascendantSign,
      moon:         chart.moonSign,
      sun:          chart.sunSign,
      lagnaLord:    chart.lagnaLord,
      yoga:         chart.yoga.map(y => y.name),
      dasha:        active ? active.planet : 'Saturn',
      dashaEnd:     active ? active.endDate.toLocaleDateString('en-US',{month:'long',year:'numeric'}) : '2027',
      dashaPlain:   active ? active.plainEnglish : '',
      jupiter:      get('Jupiter'),
      saturn:       get('Saturn'),
      mars:         get('Mars'),
      venus:        get('Venus'),
      mercury:      get('Mercury'),
      sun_p:        get('Sun'),
      moon_p:       get('Moon'),
    };
  }

  // ── Career Insights ─────────────────────────────────────────
  function career(ctx, q) {
    const q_l = (q||'').toLowerCase();
    if (q_l.includes('switch') || q_l.includes('change') || q_l.includes('quit') || q_l.includes('leave')) {
      return {
        title: 'Decision: Career Transition Analysis',
        content: `${ctx.firstName}, your ${ctx.asc} ascendant with ${ctx.dasha} Mahadasha active until ${ctx.dashaEnd}: This Dasha ${isTransitionDasha(ctx.dasha) ? 'is inherently transitional — the old structure has peaked and change is cosmically timed' : 'favors consolidation over disruption — transitions now need extra groundwork'}. ${ctx.saturn.sign ? `Saturn in ${ctx.saturn.sign} ${ctx.saturn.retrograde ? '(retrograde) warns that hidden complications arise in rushed exits' : 'supports structured, well-planned moves'}.` : ''} Optimal window: ${getTransitionTiming(ctx.dasha)}. If you've mentally already left your current role, your chart confirms the instinct. The risk isn't in leaving — it's in leaving without a clear next target.`
      };
    }
    if (q_l.includes('promot') || q_l.includes('raise') || q_l.includes('salary')) {
      return {
        title: 'Decision: Promotion & Compensation Timing',
        content: `${ctx.firstName}, your Sun in House ${ctx.sun_p.house || 10} ${[10,1,5].includes(ctx.sun_p.house) ? 'is well-placed for recognition — this is a genuine window' : 'benefits from visibility-building before the ask lands well'}. ${ctx.dasha === 'Jupiter' || ctx.dasha === 'Sun' ? 'Your current chapter actively supports authority expansion — ask now.' : 'Your current chapter suggests patience; the ask lands better in 4–6 months when the energy shifts.'}  Go with specific data and results, not tenure. Your ${ctx.asc} ascendant reads as confident when prepared.`
      };
    }
    if (q_l.includes('business') || q_l.includes('startup') || q_l.includes('entrepreneur')) {
      return {
        title: 'Decision: Business Launch Analysis',
        content: `${ctx.firstName}, your ${ctx.asc} ascendant ${isGoodAscForBusiness(ctx.asc) ? 'has natural entrepreneurial instincts' : 'is more naturally suited to collaborative ventures than solo founding'}. Mars in ${ctx.mars.sign || 'your chart'} ${ctx.mars.retrograde ? '(retrograde) — your best venture builds slowly, not launched fast' : '(direct) — execution energy is available'}. The ${ctx.dasha} Dasha ${isDashaGoodForBusiness(ctx.dasha) ? 'supports new ventures — this is a real launch window' : 'is better for preparing than for full public launch'}. Critical: don't build entirely alone — your chart rewards co-founders or early key hires.`
      };
    }

    const templates = [
      {
        title: `${ctx.dasha} Dasha: Professional Inflection Point`,
        content: `${ctx.firstName}, your ${ctx.dasha} Mahadasha (until ${ctx.dashaEnd}) governs your professional trajectory. With your ${ctx.asc} ascendant, ${getDashaCareerTheme(ctx.dasha)} are the primary vehicles for this period's growth. ${ctx.saturn.sign ? `Saturn in ${ctx.saturn.sign} ${ctx.saturn.retrograde ? '(retrograde) rewards patient, mastery-driven moves over quick wins' : 'rewards structured, long-game positioning'}.` : ''} One precise move in your domain outperforms scattered effort across multiple fronts.`
      },
      {
        title: `${ctx.asc} Rising: Strategic Career Positioning`,
        content: `${ctx.firstName}, as a ${ctx.asc} ascendant, your professional strength lies in ${getAscCareerStrength(ctx.asc)}. ${ctx.mars.sign ? `Mars in ${ctx.mars.sign} (House ${ctx.mars.house}) ${ctx.mars.retrograde ? '— internalized drive pushes you toward mastery over competition' : '— execution ability is a genuine competitive advantage right now'}.` : ''} The ${ctx.dasha} Dasha aligns with ${getDashaCareerTheme(ctx.dasha)}. Authority figures and institutions respond well to your direct approach this period.`
      }
    ];
    return templates[new Date().getDate() % templates.length];
  }

  // ── Wealth Insights ─────────────────────────────────────────
  function wealth(ctx, q) {
    const q_l = (q||'').toLowerCase();
    if (q_l.includes('invest') || q_l.includes('stock') || q_l.includes('market')) {
      return {
        title: 'Decision: Investment Timing',
        content: `${ctx.firstName}, Jupiter in House ${ctx.jupiter.house || 2} ${[2,11].includes(ctx.jupiter.house) ? 'is in a wealth-positive position — financial growth is supported' : 'requires deliberate financial action, not passive accumulation'}. Saturn ${ctx.saturn.retrograde ? '(retrograde) warns against illiquid or long-lock positions right now' : '(direct) supports structured, long-duration assets: index funds, real estate, bonds'}. The ${ctx.dasha} Dasha ${isDashaGoodForWealth(ctx.dasha) ? 'is historically favorable for wealth accumulation' : 'favors preservation over aggressive growth'}. Timing: ${getInvestmentTiming(ctx.dasha)}. Avoid leverage-heavy strategies for the next 6 weeks.`
      };
    }

    const templates = [
      {
        title: `Wealth Cycle: ${ctx.dasha} Period Themes`,
        content: `${ctx.firstName}, Jupiter in House ${ctx.jupiter.house || 2} ${ctx.jupiter.house === 2 ? 'directly activates your wealth house — accumulation is supported' : ctx.jupiter.house === 11 ? 'in the house of gains — income from multiple sources is likely' : 'requires active financial effort, not passive expectation'}. Your ${ctx.moon} Moon sign means ${getMoonMoneyPattern(ctx.moon)}. The ${ctx.dasha} Mahadasha ${getDashaWealthEffect(ctx.dasha)}. Focus on assets that compound quietly over the next year.`
      }
    ];
    return templates[0];
  }

  // ── Love / Relationship Insights ────────────────────────────
  function love(ctx, q) {
    const q_l = (q||'').toLowerCase();
    if (q_l.includes('marry') || q_l.includes('marriage') || q_l.includes('commit') || q_l.includes('propose')) {
      return {
        title: 'Decision: Commitment & Marriage Timing',
        content: `${ctx.firstName}, Venus in ${ctx.venus.sign || 'your chart'} (House ${ctx.venus.house}) ${ctx.venus.retrograde ? '— retrograde: NOT the ideal time to formalize commitment; tensions surface post-ceremony' : '— direct: commitment entered now has solid foundations'}. The ${ctx.dasha} Dasha ${isDashaGoodForMarriage(ctx.dasha) ? 'actively supports lasting partnerships — this window is genuine' : 'is not the peak marriage timing; a natural alignment comes in 1–2 years'}. Core question: does the existing partnership meet your ${ctx.moon} Moon\'s emotional need? If yes — proceed. If no — the discomfort only amplifies post-commitment.`
      };
    }

    const templates = [
      {
        title: `${ctx.moon} Moon: Your Relationship Signature`,
        content: `${ctx.firstName}, your ${ctx.moon} Moon is your core emotional language in relationships — ${getMoonRelStyle(ctx.moon)}. Venus in ${ctx.venus.sign || 'your chart'} (House ${ctx.venus.house || 7}) ${ctx.venus.retrograde ? '— retrograde: past patterns are asking for review before fully investing in something new' : '— direct: new relationship energy is accessible and genuine right now'}. The ${ctx.dasha} period ${getRelDashaEffect(ctx.dasha)}. Your ${ctx.asc} ascendant projects ${getAscProjection(ctx.asc)} — be intentional about whether that matches what you want to attract.`
      }
    ];
    return templates[0];
  }

  // ── Health Insights ─────────────────────────────────────────
  function health(ctx) {
    return {
      title: `Vitality Focus: ${ctx.dasha} Period`,
      content: `${ctx.firstName}, your ${ctx.asc} ascendant governs your physical constitution — ${getAscHealth(ctx.asc)}. Mars in ${ctx.mars.sign || 'your chart'} (House ${ctx.mars.house || 1}) ${ctx.mars.retrograde ? '— retrograde: energy fluctuates; consistent routines outperform intense-then-absent approaches' : '— direct: physical vitality is accessible, channel it with structure'}. The ${ctx.dasha} Mahadasha ${getDashaHealth(ctx.dasha)}. Key insight for your ${ctx.moon} Moon: ${getMoonHealth(ctx.moon)}`
    };
  }

  // ── General / Default ────────────────────────────────────────
  function general(ctx, q) {
    const q_l = (q||'').toLowerCase();
    if (q_l.includes('relocat') || q_l.includes('move') || q_l.includes('city') || q_l.includes('travel')) {
      return {
        title: 'Decision: Relocation & Travel',
        content: `${ctx.firstName}, Rahu in your chart governs foreign connections. The ${ctx.dasha} Dasha ${ctx.dasha === 'Rahu' ? 'is the single best period for international moves — act within 18 months' : ctx.dasha === 'Jupiter' ? 'supports educational or growth-motivated relocation' : ctx.dasha === 'Saturn' ? 'prefers stable, planned moves over spontaneous relocations' : 'is neutral for relocation — opportunity quality is what matters'}. Your ${ctx.asc} ascendant ${getAscTravel(ctx.asc)}. One direct point: don't move toward a city — move toward a specific opportunity or person. Vague relocations don't resolve under any Dasha.`
      };
    }

    return {
      title: `${ctx.dasha} Mahadasha: What This Chapter Means`,
      content: `${ctx.firstName}, ${getMahadashaOverview(ctx.dasha, ctx)} Your ${ctx.asc} ascendant filters this energy through ${getAscFilter(ctx.asc)}. ${ctx.yoga.length > 0 ? `Your ${ctx.yoga[0]} adds a layer of ${getYogaMod(ctx.yoga[0])} to this period.` : ''} Focus energy on ${getDashaFocus(ctx.dasha)} and consciously deprioritize ${getDashaAvoid(ctx.dasha)}.`
    };
  }

  // ── Decision Dispatcher ──────────────────────────────────────
  function decide(question, chart, name) {
    const ctx = buildCtx(chart, name);
    const q   = question.toLowerCase();
    let category = 'general';
    let result;

    if (/job|career|work|promot|business|salary|startup|entrepreneur|office/.test(q)) {
      category = 'career'; result = career(ctx, question);
    } else if (/money|invest|wealth|stock|loan|debt|financial|property|rich/.test(q)) {
      category = 'wealth'; result = wealth(ctx, question);
    } else if (/love|relation|partner|marry|marriage|divorce|breakup|dating|romantic|girlfriend|boyfriend|spouse|husband|wife/.test(q)) {
      category = 'love'; result = love(ctx, question);
    } else if (/health|sick|diet|exercise|weight|stress|anxiety|mental|body|fitness/.test(q)) {
      category = 'health'; result = health(ctx);
    } else {
      result = general(ctx, question);
    }

    return { ...result, category };
  }

  // ── Generate Full User Insight Set ──────────────────────────
  function generateAll(chart, name, userId) {
    const ctx  = buildCtx(chart, name);
    const now  = new Date().toISOString();

    return [
      { id:`${userId}-career-1`,  userId, category:'career',  period:'daily',   date:now, bookmarked:false, ...career(ctx)  },
      { id:`${userId}-wealth-1`,  userId, category:'wealth',  period:'daily',   date:now, bookmarked:false, ...wealth(ctx)  },
      { id:`${userId}-love-1`,    userId, category:'love',    period:'daily',   date:now, bookmarked:false, ...love(ctx)    },
      { id:`${userId}-health-1`,  userId, category:'health',  period:'daily',   date:now, bookmarked:false, ...health(ctx)  },
      { id:`${userId}-general-1`, userId, category:'general', period:'general', date:now, bookmarked:false, ...general(ctx) },
      { id:`${userId}-career-2`,  userId, category:'career',  period:'weekly',  date:now, bookmarked:false, ...career(ctx)  },
      { id:`${userId}-wealth-2`,  userId, category:'wealth',  period:'weekly',  date:now, bookmarked:false, ...wealth(ctx)  },
      { id:`${userId}-love-2`,    userId, category:'love',    period:'monthly', date:now, bookmarked:false, ...love(ctx)    },
      { id:`${userId}-health-2`,  userId, category:'health',  period:'monthly', date:now, bookmarked:false, ...health(ctx)  },
    ];
  }

  // ── Helper Functions ─────────────────────────────────────────
  function isTransitionDasha(d) { return ['Rahu','Ketu','Mars','Mercury'].includes(d); }
  function isDashaGoodForBusiness(d) { return ['Jupiter','Mercury','Sun','Rahu','Venus'].includes(d); }
  function isDashaGoodForWealth(d)   { return ['Jupiter','Venus','Mercury','Moon'].includes(d); }
  function isDashaGoodForMarriage(d) { return ['Venus','Moon','Jupiter','Mercury'].includes(d); }
  function isGoodAscForBusiness(a)   { return ['Aries','Scorpio','Leo','Sagittarius','Aquarius','Capricorn'].includes(a); }

  function getTransitionTiming(d) {
    return { Sun:'next 3 months while Sun transits favor it', Moon:'wait for the next Full Moon cycle to complete', Mars:'move quickly — Mars Dasha rewards decisiveness', Mercury:'avoid Mercury retrograde windows; otherwise frequent', Jupiter:'any time in the next 6 months — broadly supportive', Venus:'spring moves are particularly favorable', Saturn:'after a minimum 6-month preparation window', Rahu:'sooner — Rahu Dasha rewards bold unconventional moves', Ketu:'only if deeply compelled — Ketu favors inner completion' }[d] || 'after thorough preparation with a clear target identified';
  }

  function getDashaCareerTheme(d) {
    return { Sun:'leadership roles, government connections, and visibility', Moon:'public-facing work, hospitality, and emotionally resonant projects', Mars:'competitive fields, technical execution, and decisive moves', Mercury:'communication, technology, and multi-stakeholder coordination', Jupiter:'expansion, mentorship, education, and institutional influence', Venus:'creative industries, partnerships, and aesthetically driven work', Saturn:'structured, long-term career investments', Rahu:'unconventional moves, foreign connections, technology disruption', Ketu:'specialized expertise and contribution without seeking recognition' }[d] || 'strategic, deliberate career development';
  }

  function getAscCareerStrength(a) {
    return { Aries:'leadership and pioneering new territory', Taurus:'building durable, tangible value and finance', Gemini:'communication, writing, and multi-domain expertise', Cancer:'caregiving, real estate, and emotionally intelligent leadership', Leo:'performance, creative direction, and commanding a room', Virgo:'analysis, precision work, and process optimization', Libra:'law, diplomacy, design, and partnership ventures', Scorpio:'research, investigation, and high-stakes decision-making', Sagittarius:'education, international business, and publishing', Capricorn:'institutional leadership and long-horizon strategy', Aquarius:'technology, social innovation, and network building', Pisces:'creative arts, healing professions, and behind-the-scenes influence' }[a] || 'your unique combination of strengths';
  }

  function getInvestmentTiming(d) {
    return { Jupiter:'invest continuously — Jupiter Dasha is strongest for compounding', Venus:'real assets, art, stable equity over the next 12 months', Mercury:'diversified, liquid investments — avoid illiquid lock-ins', Moon:'timing around lunar cycles has measurable impact', Sun:'government bonds, blue-chip equities over speculative positions', Mars:'real estate and actively managed positions', Saturn:'invest with a 10+ year horizon', Rahu:'technology and international markets can outperform, but size down', Ketu:'prioritize debt elimination and capital preservation' }[d] || 'start with stable, diversified positions';
  }

  function getMoonMoneyPattern(m) {
    return { Aries:'impulsive spending is the key risk — implement a 48-hour rule on major purchases', Taurus:'natural accumulator, but can over-save at the expense of growth', Gemini:'income versatility is high, but scattering dilutes returns', Cancer:'emotionally driven decisions — security-seeking can block growth investments', Leo:'tendency to spend on status — redirect toward visible asset-building', Virgo:'natural financial analyst — trust your assessment over others\' enthusiasm', Libra:'financial decisions improve dramatically with a trusted second opinion', Scorpio:'capable of extreme transformation; avoid all-or-nothing thinking', Sagittarius:'optimism is an asset but needs realistic planning as counterweight', Capricorn:'long-term discipline is innate — risk is excessive conservatism', Aquarius:'drawn to innovation — balance with stable core holdings', Pisces:'spiritual relationship with money can create avoidance — financial literacy is the work' }[m] || 'balancing emotional and rational financial decisions is the core work';
  }

  function getDashaWealthEffect(d) {
    return { Sun:'income through authority and government connections, not passive streams', Moon:'income fluctuates but public-facing ventures and real estate perform well', Mars:'active income generation — real estate and technical consulting are highlighted', Mercury:'trading, communication-based income, multiple revenue streams', Jupiter:'the best Dasha for wealth expansion — compounding investments work well', Venus:'luxury sector income, creative monetization, partnership revenues', Saturn:'slow but durable — assets built now last longer than faster Dashas', Rahu:'sudden unconventional income, but also unexpected expenses; watch both', Ketu:'financially neutral to negative for material wealth — focus on debt reduction' }[d] || 'requires active management and disciplined habits';
  }

  function getMoonRelStyle(m) {
    return { Aries:'you love with urgency and need partners who can match your pace', Taurus:'you build love slowly and reliably — once committed, deeply loyal', Gemini:'you need intellectual stimulation; emotional depth comes through conversation', Cancer:'you love by nurturing — your risk is making the relationship your entire world', Leo:'you love dramatically and fully — you need a partner who receives that', Virgo:'you express love through service — you need partners who recognize that as affection', Libra:'you are deeply partnership-oriented and struggle with necessary conflict', Scorpio:'you love with fierce depth and require complete emotional honesty', Sagittarius:'you love freely and need philosophical alignment over shared routines', Capricorn:'you love through commitment — emotional expressiveness develops with trust over time', Aquarius:'you love as a friend first — intimacy develops through mental connection', Pisces:'you love with dissolution of boundaries — maintaining self while fully loving is the work' }[m] || 'you love with the full depth of your nature';
  }

  function getRelDashaEffect(d) {
    return { Sun:'ego dynamics in partnerships are highlighted — conscious humility prevents conflicts', Moon:'emotional tides intensify — both deepening and friction are more pronounced', Mars:'passion and conflict both peak — channel the energy or it becomes destructive', Mercury:'communication-based relationship work is most effective now', Jupiter:'broadly protective and expansive — growth together is genuinely possible', Venus:'the peak relationship Dasha — love, beauty, and partnership are favored', Saturn:'tests relationship foundations — shallow connections end, deep ones deepen', Rahu:'unconventional attractions and disruptions — clarity over illusion is essential', Ketu:'can create emotional withdrawal and spiritual prioritization over romance' }[d] || 'brings its own flavor worth understanding';
  }

  function getAscProjection(a) {
    return { Aries:'confidence bordering on aggression — soften when connection is the goal', Taurus:'calm reliability and aesthetic awareness — extremely attractive to those valuing stability', Gemini:'wit and versatility — attractive to curious minds', Cancer:'warmth and protectiveness — nurturing energy attracts those seeking safety', Leo:'charisma and authority — magnetic but can overwhelm lower self-confidence', Virgo:'intelligence and precision — can project critical energy unintentionally', Libra:'charm and aesthetic grace — naturally attractive socially', Scorpio:'intensity and magnetism — you attract and repel with equal force', Sagittarius:'optimism and adventure — attracts free spirits', Capricorn:'seriousness and competence — attractive to those valuing ambition', Aquarius:'uniqueness and detachment — attracts unconventional thinkers', Pisces:'dreamy depth and empathy — attracts those seeking spiritual connection' }[a] || 'a distinctive combination of qualities';
  }

  function getAscHealth(a) {
    return { Aries:'strong constitution with head and brain as primary watchpoints; manage stress proactively', Taurus:'robust but slow metabolism; throat and thyroid need monitoring', Gemini:'nervous system and lung health are primary — avoid overstimulation', Cancer:'emotional suppression creates digestive issues — gut is your emotional barometer', Leo:'strong heart and circulation; watch blood pressure and back', Virgo:'digestive sensitivity and nervous system reactivity are the key patterns', Libra:'kidney and lower back health; maintain hydration and hormonal balance', Scorpio:'powerful regenerative capacity; reproductive and elimination systems need attention', Sagittarius:'hips, liver, and excess are the watchpoints', Capricorn:'joints, bones, and skin — cold affects this constitution significantly', Aquarius:'circulatory system and ankles; nerve and electrical health are sensitive', Pisces:'feet and lymphatic system; emotional boundaries directly support physical immunity' }[a] || 'your constitution has specific strengths and vulnerabilities worth understanding';
  }

  function getDashaHealth(d) {
    return { Sun:'vitality is generally strong, but ego-driven overexertion is the risk', Moon:'emotional patterns manifest physically — mental health is physical health this period', Mars:'high energy but accident and inflammation risk; structured exercise is non-negotiable', Mercury:'nervous system fatigue; consistent sleep schedules are critical', Jupiter:'broadly protective of health, but weight management needs attention', Venus:'reproductive health and sugar metabolism need monitoring; self-care matters', Saturn:'chronic patterns surface for resolution — preventive care now prevents major intervention later', Rahu:'unusual symptoms and misdiagnosis risk; seek second opinions', Ketu:'mysterious ailments; integrative medicine approaches work well' }[d] || 'requires attentive, consistent maintenance';
  }

  function getMoonHealth(m) {
    const map = { Aries:'Your Moon drives you to push physical limits — recovery and rest are where growth happens.', Taurus:'Your Moon thrives with routine — disrupted schedules create measurable physical stress.', Gemini:'Your Moon processes stress through the nervous system — breath-work and nature are essential.', Cancer:'Emotional suppression creates digestive symptoms. The gut-brain connection is especially strong.', Leo:'Your Moon needs creative expression for wellbeing — suppressed expression manifests physically.', Virgo:'Anxiety and digestive sensitivity are your primary patterns. Worry creates real physical load.', Libra:'Relational conflict creates immediate physical symptoms — conflict resolution is health maintenance.', Scorpio:'Emotional intensity needs physical release — exercise and processing are equally important.', Sagittarius:'Your Moon needs movement and outdoor time — sedentary periods create both mental and physical stagnation.', Capricorn:'Overwork patterns are the primary health risk. Your body keeps score of what your mind ignores.', Aquarius:'Circulatory patterns respond well to rhythmic exercise and social connection.', Pisces:'Your Moon absorbs environmental energy — clear physical environments support your immunity.' };
    return map[m] || 'your emotional state and physical health are more directly linked than average.';
  }

  function getMahadashaOverview(d, ctx) {
    const map = {
      Sun:     `The Sun Mahadasha (6 years) illuminates themes of self, authority, and recognition. ${ctx.firstName}, your identity is sharpening — who you are at your core becomes non-negotiable.`,
      Moon:    `The Moon Mahadasha (10 years) deepens emotional intelligence and public connection. ${ctx.firstName}, your inner world becomes the outer curriculum. Home, travel, and relationships are featured.`,
      Mars:    `The Mars Mahadasha (7 years) is an action-activation period. ${ctx.firstName}, decisiveness is rewarded and hesitation is penalized. Property, courage, and competitive domains are highlighted.`,
      Mercury: `The Mercury Mahadasha (17 years) activates intellect, communication, and commerce. ${ctx.firstName}, your verbal and written expression become key assets.`,
      Jupiter: `The Jupiter Mahadasha (16 years) is broadly expansive and protective. ${ctx.firstName}, wisdom, abundance, and spiritual development are naturally accessible.`,
      Venus:   `The Venus Mahadasha (20 years) activates beauty, love, and material comfort. ${ctx.firstName}, creative expression, relationships, and aesthetic environments are highlighted.`,
      Saturn:  `The Saturn Mahadasha (19 years) is the karmic audit. ${ctx.firstName}, what is real gets strengthened; what is built on illusion dissolves. Discipline and patience are required and rewarded.`,
      Rahu:    `The Rahu Mahadasha (18 years) is amplification and disruption. ${ctx.firstName}, ambitions intensify, unconventional paths open, and hidden desires surface.`,
      Ketu:    `The Ketu Mahadasha (7 years) is the release period. ${ctx.firstName}, what no longer serves your evolution naturally falls away. Spiritual inclinations strengthen.`
    };
    return map[d] || `The ${d} Mahadasha brings distinct themes to ${ctx.firstName}'s life path.`;
  }

  function getAscFilter(a) {
    return { Aries:'a lens of initiative — you act on energy immediately', Taurus:'a lens of patience — energy unfolds slowly but durably', Gemini:'a lens of intellect — themes are processed through communication', Cancer:'a lens of emotion — energy is felt before it is understood', Leo:'a lens of self-expression — themes are channeled through creative outlets', Virgo:'a lens of analysis — energy is refined through practical application', Libra:'a lens of relationship — themes manifest through partnerships', Scorpio:'a lens of depth — energies are experienced intensely', Sagittarius:'a lens of expansion — themes are given meaning through wisdom', Capricorn:'a lens of discipline — energies are channeled into long-term building', Aquarius:'a lens of innovation — themes are expressed unconventionally', Pisces:'a lens of intuition — energies are felt spiritually before manifesting' }[a] || 'your unique personal filter';
  }

  function getYogaMod(y) {
    return { 'Gajakesari Yoga':'elevated intelligence and recognition potential', 'Budhaditya Yoga':'sharp analytical power and communication authority', 'Hamsa Yoga':'wisdom, ethical clarity, and respected standing', 'Malavya Yoga':'aesthetic refinement, luxury access, and relationship magnetism', 'Ruchaka Yoga':'executive power, physical vitality, and competitive advantage' }[y] || 'enhanced expression of the core period themes';
  }

  function getDashaFocus(d) {
    return { Sun:'visibility, leadership, and institutional relationships', Moon:'emotional intelligence, public presence, and home foundations', Mars:'decisive action, technical skill, and competitive positioning', Mercury:'communication, learning, and multiple income streams', Jupiter:'wisdom cultivation, expansion, and long-term vision', Venus:'creative expression, relationships, and quality of life', Saturn:'disciplined systems, long-term structures, and genuine mastery', Rahu:'innovation, unconventional opportunities, and breaking old patterns', Ketu:'spiritual depth, expertise refinement, and voluntary simplification' }[d] || 'the core themes of your period';
  }

  function getDashaAvoid(d) {
    return { Sun:'ego conflicts with authority and scattered self-promotion', Moon:'emotional reactivity and excessive rumination', Mars:'impulsive decisions and unnecessary confrontation', Mercury:'information overload and committing to too many projects', Jupiter:'overconfidence and expanding beyond current capacity', Venus:'excessive comfort-seeking and avoiding necessary discipline', Saturn:'shortcuts, impatience, and resistance to its slow demands', Rahu:'illusion, obsessive ambition, and loss of ethical grounding', Ketu:'excessive detachment from necessary worldly responsibilities' }[d] || 'patterns that work against this period\'s energy';
  }

  function getAscTravel(a) {
    const natural = ['Sagittarius','Aquarius','Gemini','Aries'];
    return natural.includes(a) ? 'has strong foreign affinity — relocation often triggers genuine life acceleration' : 'functions well in both local and foreign environments — location is secondary to opportunity quality';
  }

  // ── Expose ───────────────────────────────────────────────────
  return { decide, generateAll };

})();
