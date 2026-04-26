/* ═══════════════════════════════════════════════════════════════
   ASTRAMIND — Astrology Engine v1.0.0
   Western (Tropical) primary · Vedic (Sidereal) secondary
   Pure JavaScript, no dependencies
═══════════════════════════════════════════════════════════════ */

const AstrologyEngine = (function () {

  // ── Constants ──────────────────────────────────────────────
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                 'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

  const NAKSHATRAS = [
    'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
    'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni',
    'Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
    'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha',
    'Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
  ];

  const SIGN_LORDS = {
    Aries:'Mars', Taurus:'Venus', Gemini:'Mercury', Cancer:'Moon', Leo:'Sun', Virgo:'Mercury',
    Libra:'Venus', Scorpio:'Mars', Sagittarius:'Jupiter', Capricorn:'Saturn', Aquarius:'Saturn', Pisces:'Jupiter'
  };

  const PLANET_COLORS = {
    Sun:'#f59e0b', Moon:'#e2e8f0', Mars:'#ef4444', Mercury:'#10b981',
    Jupiter:'#fbbf24', Venus:'#ec4899', Saturn:'#6366f1',
    Rahu:'#8b5cf6', Ketu:'#06b6d4', Ascendant:'#ffffff'
  };

  const PLANET_SYMBOLS = {
    Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃',
    Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋', Ascendant:'↑'
  };

  const PLANET_EMOJI = {
    Sun:'🌞', Moon:'🌙', Mars:'🔥', Mercury:'🧠', Jupiter:'🌟',
    Venus:'💖', Saturn:'⚖️', Rahu:'🚀', Ketu:'🔮', Ascendant:'↑'
  };

  const PLANET_MEANINGS = {
    Sun:     'Your core identity, confidence, and how you shine. Also: career, father, authority.',
    Moon:    'Your emotions, gut instincts, and what makes you feel safe. Also: mother, home, moods.',
    Mars:    'Your drive, energy, and how you go after what you want. Also: courage, conflict, ambition.',
    Mercury: 'How you think, communicate, and learn. Also: business, writing, short trips.',
    Jupiter: 'Where luck and growth flow in your life. Also: wisdom, spirituality, abundance.',
    Venus:   'Your relationship style, what you find beautiful, and how you attract. Also: money, art.',
    Saturn:  'Life lessons and where you need to put in real effort. Also: career structure, karma.',
    Rahu:    'Your biggest ambitions in this life — what you\'re reaching toward.',
    Ketu:    'What comes naturally — talents you already have but may undervalue.'
  };

  const HOUSE_MEANINGS = {
    1:  'You — your personality, appearance, and first impression',
    2:  'Money, possessions, family, and the way you speak',
    3:  'Communication, siblings, courage, and daily skills',
    4:  'Home, mother, emotional foundations, and security',
    5:  'Creativity, romance, children, fun, and joy',
    6:  'Daily work, health habits, and how you handle challenges',
    7:  'Partnerships — romantic, business, and close relationships',
    8:  'Transformation, shared money, intimacy, and hidden matters',
    9:  'Travel, higher education, philosophy, and big life experiences',
    10: 'Career, public reputation, and how the world sees your success',
    11: 'Friends, networks, goals, and communities you belong to',
    12: 'Hidden strengths, solitude, spirituality, and letting go'
  };

  const SIGN_TRAITS = {
    Aries:       { element:'Fire 🔥', mode:'Go-getter',    vibe:'Bold, direct, first to act' },
    Taurus:      { element:'Earth 🌿',mode:'Builder',      vibe:'Patient, sensual, values comfort' },
    Gemini:      { element:'Air 💨',  mode:'Communicator', vibe:'Curious, witty, loves variety' },
    Cancer:      { element:'Water 💧',mode:'Nurturer',     vibe:'Emotional, protective, home-loving' },
    Leo:         { element:'Fire 🔥', mode:'Creator',      vibe:'Confident, warm, loves the spotlight' },
    Virgo:       { element:'Earth 🌿',mode:'Analyzer',     vibe:'Precise, helpful, detail-obsessed' },
    Libra:       { element:'Air 💨',  mode:'Diplomat',     vibe:'Fair, charming, hates conflict' },
    Scorpio:     { element:'Water 💧',mode:'Transformer',  vibe:'Intense, perceptive, all-or-nothing' },
    Sagittarius: { element:'Fire 🔥', mode:'Explorer',     vibe:'Free, optimistic, loves big ideas' },
    Capricorn:   { element:'Earth 🌿',mode:'Achiever',     vibe:'Ambitious, disciplined, plays long game' },
    Aquarius:    { element:'Air 💨',  mode:'Innovator',    vibe:'Original, independent, future-focused' },
    Pisces:      { element:'Water 💧',mode:'Dreamer',      vibe:'Intuitive, compassionate, deeply feeling' }
  };

  const DASHA_YEARS   = { Ketu:7,Venus:20,Sun:6,Moon:10,Mars:7,Rahu:18,Jupiter:16,Saturn:19,Mercury:17 };
  const DASHA_ORDER   = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
  const DASHA_COLORS  = {
    Ketu:'#06b6d4',Venus:'#ec4899',Sun:'#f59e0b',Moon:'#e2e8f0',
    Mars:'#ef4444',Rahu:'#8b5cf6',Jupiter:'#fbbf24',Saturn:'#6366f1',Mercury:'#10b981'
  };
  const DASHA_PLAIN = {
    Sun:     'A 6-year chapter focused on identity, career moves, and stepping into leadership. Great time to be visible and own your power.',
    Moon:    'A 10-year period that\'s deeply emotional. Your gut feelings are extra strong. Home, family, and your inner world take center stage.',
    Mars:    'A 7-year burst of energy and action. You\'re driven, competitive, and ready to hustle. Push hard — but pick your battles wisely.',
    Mercury: 'A 17-year phase where your brain is your biggest asset. Communication, business, learning, and smart connections all pay off.',
    Jupiter: 'A 16-year expansion period — possibly the luckiest chapter of your life. Growth, wisdom, abundance, and big opportunities.',
    Venus:   'A 20-year run focused on love, beauty, and the good life. Relationships, creativity, and financial comfort all get a boost.',
    Saturn:  'A 19-year reality check. Hard work actually pays off — but shortcuts don\'t. Build slowly and it lasts forever.',
    Rahu:    'An 18-year ride of big ambitions and rapid change. You\'re chasing something major. Foreign connections and unconventional paths open up.',
    Ketu:    'A 7-year period of letting go and going deeper. Spiritual growth, finding inner peace, and releasing what\'s held you back.'
  };

  const CITIES = [
    { name:'Pantnagar, Uttarakhand',      lat:29.0344,  lon:79.4740,  tz:5.5 },
    { name:'Dehradun, Uttarakhand',        lat:30.3165,  lon:78.0322,  tz:5.5 },
    { name:'Haridwar, Uttarakhand',        lat:29.9457,  lon:78.1642,  tz:5.5 },
    { name:'Nainital, Uttarakhand',        lat:29.3919,  lon:79.4542,  tz:5.5 },
    { name:'Mumbai, Maharashtra',          lat:19.0760,  lon:72.8777,  tz:5.5 },
    { name:'Delhi, NCR',                   lat:28.6139,  lon:77.2090,  tz:5.5 },
    { name:'Bengaluru, Karnataka',         lat:12.9716,  lon:77.5946,  tz:5.5 },
    { name:'Chennai, Tamil Nadu',          lat:13.0827,  lon:80.2707,  tz:5.5 },
    { name:'Kolkata, West Bengal',         lat:22.5726,  lon:88.3639,  tz:5.5 },
    { name:'Hyderabad, Telangana',         lat:17.3850,  lon:78.4867,  tz:5.5 },
    { name:'Pune, Maharashtra',            lat:18.5204,  lon:73.8567,  tz:5.5 },
    { name:'Ahmedabad, Gujarat',           lat:23.0225,  lon:72.5714,  tz:5.5 },
    { name:'Jaipur, Rajasthan',            lat:26.9124,  lon:75.7873,  tz:5.5 },
    { name:'Lucknow, Uttar Pradesh',       lat:26.8467,  lon:80.9462,  tz:5.5 },
    { name:'Kanpur, Uttar Pradesh',        lat:26.4499,  lon:80.3319,  tz:5.5 },
    { name:'Varanasi, Uttar Pradesh',      lat:25.3176,  lon:82.9739,  tz:5.5 },
    { name:'Agra, Uttar Pradesh',          lat:27.1767,  lon:78.0081,  tz:5.5 },
    { name:'Noida, Uttar Pradesh',         lat:28.5355,  lon:77.3910,  tz:5.5 },
    { name:'Gurgaon, Haryana',             lat:28.4595,  lon:77.0266,  tz:5.5 },
    { name:'Chandigarh',                   lat:30.7333,  lon:76.7794,  tz:5.5 },
    { name:'Amritsar, Punjab',             lat:31.6340,  lon:74.8723,  tz:5.5 },
    { name:'Bhopal, Madhya Pradesh',       lat:23.2599,  lon:77.4126,  tz:5.5 },
    { name:'Indore, Madhya Pradesh',       lat:22.7196,  lon:75.8577,  tz:5.5 },
    { name:'Nagpur, Maharashtra',          lat:21.1458,  lon:79.0882,  tz:5.5 },
    { name:'Surat, Gujarat',               lat:21.1702,  lon:72.8311,  tz:5.5 },
    { name:'Patna, Bihar',                 lat:25.5941,  lon:85.1376,  tz:5.5 },
    { name:'Kochi, Kerala',                lat:9.9312,   lon:76.2673,  tz:5.5 },
    { name:'Mysuru, Karnataka',            lat:12.2958,  lon:76.6394,  tz:5.5 },
    { name:'Coimbatore, Tamil Nadu',       lat:11.0168,  lon:76.9558,  tz:5.5 },
    { name:'Visakhapatnam, Andhra Pradesh',lat:17.6868,  lon:83.2185,  tz:5.5 },
    { name:'New York, USA',                lat:40.7128,  lon:-74.0060, tz:-5  },
    { name:'Los Angeles, USA',             lat:34.0522,  lon:-118.2437,tz:-8  },
    { name:'Chicago, USA',                 lat:41.8781,  lon:-87.6298, tz:-6  },
    { name:'Houston, USA',                 lat:29.7604,  lon:-95.3698, tz:-6  },
    { name:'London, UK',                   lat:51.5074,  lon:-0.1278,  tz:0   },
    { name:'Dubai, UAE',                   lat:25.2048,  lon:55.2708,  tz:4   },
    { name:'Singapore',                    lat:1.3521,   lon:103.8198, tz:8   },
    { name:'Sydney, Australia',            lat:-33.8688, lon:151.2093, tz:10  },
    { name:'Melbourne, Australia',         lat:-37.8136, lon:144.9631, tz:10  },
    { name:'Toronto, Canada',              lat:43.6532,  lon:-79.3832, tz:-5  },
    { name:'Paris, France',                lat:48.8566,  lon:2.3522,   tz:1   },
    { name:'Frankfurt, Germany',           lat:50.1109,  lon:8.6821,   tz:1   },
    { name:'Tokyo, Japan',                 lat:35.6762,  lon:139.6503, tz:9   },
    { name:'Nairobi, Kenya',               lat:-1.2921,  lon:36.8219,  tz:3   }
  ];

  // ── Core Math ───────────────────────────────────────────────
  function toJulianDay(year, month, day, hour) {
    if (month <= 2) { year--; month += 12; }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25*(year+4716)) + Math.floor(30.6001*(month+1)) + day + hour/24 + B - 1524.5;
  }

  function getSunLon(jd) {
    const T  = (jd - 2451545) / 36525;
    const M  = (357.52911 + 35999.05029*T - 0.0001537*T*T) * Math.PI/180;
    const L0 = 280.46646 + 36000.76983*T + 0.0003032*T*T;
    const C  = (1.914602 - 0.004817*T - 0.000014*T*T)*Math.sin(M)
             + (0.019993 - 0.000101*T)*Math.sin(2*M)
             +  0.000289*Math.sin(3*M);
    return ((L0 + C) % 360 + 360) % 360;
  }

  function getMoonLon(jd) {
    const T  = (jd - 2451545) / 36525;
    const L  = 218.3164477 + 481267.88123421*T;
    const M  = (357.52911 + 35999.05029*T) * Math.PI/180;
    const Mm = (134.9634114 + 477198.8676313*T) * Math.PI/180;
    const D  = (297.8501921 + 445267.1114034*T) * Math.PI/180;
    const F  = (93.272095  + 483202.0175233*T) * Math.PI/180;
    const lon = L + 6.288774*Math.sin(Mm) + 1.274027*Math.sin(2*D-Mm)
              + 0.658314*Math.sin(2*D) + 0.213618*Math.sin(2*Mm)
              - 0.185116*Math.sin(M)   - 0.114332*Math.sin(2*F);
    return ((lon % 360) + 360) % 360;
  }

  function getPlanetLon(name, jd) {
    const T = (jd - 2451545) / 36525;
    const raw = {
      Sun:     getSunLon(jd),
      Moon:    getMoonLon(jd),
      Mars:    355.433 + 19140.2993*T,
      Mercury: 252.250906 + 149474.0722491*T,
      Jupiter: 34.351519 + 3036.3027748*T,
      Venus:   181.979801 + 58519.2130302*T,
      Saturn:  50.077444 + 1223.5110686*T
    };
    if (raw[name] !== undefined) return ((raw[name] % 360) + 360) % 360;
    if (name === 'Rahu') return ((125.0445479 - 1934.1362608*T) % 360 + 360) % 360;
    if (name === 'Ketu') return ((125.0445479 - 1934.1362608*T + 180) % 360 + 360) % 360;
    return 0;
  }

  function getAscendant(jd, lat, lon) {
    const T    = (jd - 2451545) / 36525;
    const GMST = 280.46061837 + 360.98564736629*(jd-2451545) + 0.000387933*T*T;
    const LST  = ((GMST + lon) % 360 + 360) % 360;
    const eps  = (23.439291111 - 0.013004167*T) * Math.PI/180;
    const lr   = lat * Math.PI/180;
    const lstR = LST * Math.PI/180;
    const asc  = Math.atan2(Math.cos(lstR), -(Math.sin(lstR)*Math.cos(eps) + Math.tan(lr)*Math.sin(eps))) * 180/Math.PI;
    return ((asc % 360) + 360) % 360;
  }

  function getAyanamsha(jd) {
    const T = (jd - 2451545) / 36525;
    return 23.85 + 0.013611*T; // Lahiri
  }

  function toSidereal(tropical, ayan) {
    let s = tropical - ayan;
    if (s < 0)   s += 360;
    if (s >= 360) s -= 360;
    return s;
  }

  function signFromLon(lon) {
    const idx = Math.floor(lon / 30);
    return { sign: SIGNS[idx], signIndex: idx, degree: lon % 30 };
  }

  function getNakshatra(lon) {
    const idx  = Math.floor(lon / (360/27));
    const pada = Math.floor((lon % (360/27)) / (360/27/4)) + 1;
    return { nakshatra: NAKSHATRAS[Math.min(idx,26)], pada: Math.min(pada,4) };
  }

  // ── Dasha Calculation ───────────────────────────────────────
  function calcDasha(moonSidLon, dob) {
    const nakshatraLords = [
      'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury',
      'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury',
      'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'
    ];
    const nIdx     = Math.floor(moonSidLon / (360/27));
    const nProg    = (moonSidLon % (360/27)) / (360/27);
    const startLord= nakshatraLords[nIdx];
    const sLI      = DASHA_ORDER.indexOf(startLord);
    const yrsLeft  = DASHA_YEARS[startLord] * (1 - nProg);

    const makeEnd  = (start, yrs) => {
      const d = new Date(start);
      d.setFullYear(d.getFullYear() + Math.floor(yrs));
      d.setMonth(d.getMonth() + Math.round((yrs % 1)*12));
      return d;
    };

    const periods  = [];
    let cur        = new Date(dob);
    const firstEnd = makeEnd(cur, yrsLeft);
    periods.push({ planet:startLord, startDate:new Date(cur), endDate:firstEnd, years:yrsLeft, isActive:false, color:DASHA_COLORS[startLord], plainEnglish:DASHA_PLAIN[startLord] });
    cur = new Date(firstEnd);

    for (let i = 1; i < 9; i++) {
      const lord   = DASHA_ORDER[(sLI+i)%9];
      const yrs    = DASHA_YEARS[lord];
      const endDate= makeEnd(cur, yrs);
      periods.push({ planet:lord, startDate:new Date(cur), endDate, years:yrs, isActive:false, color:DASHA_COLORS[lord], plainEnglish:DASHA_PLAIN[lord] });
      cur = new Date(endDate);
    }

    const now = new Date();
    for (const p of periods) {
      if (now >= p.startDate && now <= p.endDate) { p.isActive = true; break; }
    }
    return periods;
  }

  // ── Yoga Detection ──────────────────────────────────────────
  function detectYogas(planets) {
    const yogas = [];
    const get   = n => planets.find(p => p.name === n);
    const sun   = get('Sun'), moon  = get('Moon'), jupiter = get('Jupiter');
    const venus = get('Venus'), mars = get('Mars'), mercury = get('Mercury');

    if (jupiter && moon) {
      const diff = Math.abs(jupiter.house - moon.house);
      if ([0,3,6,9].includes(diff)) yogas.push({ name:'Gajakesari Yoga', meaning:'Jupiter and Moon in a powerful alignment — you have natural intelligence and the kind of luck that comes from wisdom. You tend to become known and respected in your field.' });
    }
    if (sun && mercury && sun.sign === mercury.sign) {
      yogas.push({ name:'Budhaditya Yoga', meaning:'Sun and Mercury together — you\'re sharp, articulate, and naturally good at making your ideas known. Great for writing, speaking, and building authority in your domain.' });
    }
    if (jupiter && ['Sagittarius','Pisces','Cancer'].includes(jupiter.sign)) {
      yogas.push({ name:'Hamsa Yoga', meaning:'Jupiter in a power position — you carry a natural wisdom that people sense. Others look to you for guidance. Spiritual depth comes easily to you.' });
    }
    if (venus && ['Taurus','Libra','Pisces'].includes(venus.sign) && [1,4,7,10].includes(venus.house)) {
      yogas.push({ name:'Malavya Yoga', meaning:'Venus in a strong position — you naturally attract beauty, comfort, and good relationships. There\'s a magnetic quality about you that opens doors.' });
    }
    if (mars && ['Aries','Scorpio','Capricorn'].includes(mars.sign) && [1,4,7,10].includes(mars.house)) {
      yogas.push({ name:'Ruchaka Yoga', meaning:'Mars in a power spot — you have exceptional drive and the willpower to push through obstacles. You\'re built to compete and win in your chosen arena.' });
    }
    return yogas;
  }

  // ── Main Chart Calculator ───────────────────────────────────
  function calculateChart(data) {
    const [yr,mo,dy] = data.dob.split('-').map(Number);
    const [hr,min]   = data.time.split(':').map(Number);
    const utcHr      = hr - data.timezone + min/60;
    const jd         = toJulianDay(yr, mo, dy, utcHr);
    const ayan       = getAyanamsha(jd);
    const T          = (jd - 2451545) / 36525;

    // Planetary longitudes
    const pNames = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
    const planets = [];

    for (const name of pNames) {
      const tropical  = getPlanetLon(name, jd);
      const sidereal  = toSidereal(tropical, ayan);
      const { sign, signIndex, degree } = signFromLon(tropical);
      const { sign: vSign }             = signFromLon(sidereal);
      const { nakshatra, pada }         = getNakshatra(sidereal);
      // Simplified retrograde (outer planets only, seed-based for consistency)
      const retro = ['Mars','Jupiter','Saturn','Mercury','Venus'].includes(name)
        ? (Math.sin((jd * 0.01) + signIndex * 0.7) > 0.6)
        : false;

      planets.push({
        name, symbol: PLANET_SYMBOLS[name], emoji: PLANET_EMOJI[name],
        longitude: tropical, siderealLon: sidereal,
        sign, vedicSign: vSign, signIndex, degree,
        house: 1, retrograde: retro,
        nakshatra, pada,
        color: PLANET_COLORS[name],
        meaning: PLANET_MEANINGS[name] || ''
      });
    }

    // Ascendant
    const ascTropical  = getAscendant(jd, data.lat, data.lon);
    const ascSidereal  = toSidereal(ascTropical, ayan);
    const ascInfo      = signFromLon(ascTropical);
    const ascSidInfo   = signFromLon(ascSidereal);
    const ascNak       = getNakshatra(ascSidereal);

    const ascendant = {
      name:'Ascendant', symbol:'↑', emoji:'↑',
      longitude: ascTropical, siderealLon: ascSidereal,
      sign: ascInfo.sign, vedicSign: ascSidInfo.sign,
      signIndex: ascInfo.signIndex, degree: ascInfo.degree,
      house: 1, retrograde: false,
      nakshatra: ascNak.nakshatra, pada: ascNak.pada,
      color: '#ffffff', meaning: 'Your Rising sign — your outer personality, physical appearance, and first impression on others.'
    };

    // Houses (tropical equal-house)
    const houses = [];
    for (let i = 0; i < 12; i++) {
      const hLon      = (ascTropical + i*30) % 360;
      const { sign: hSign, signIndex: hSidx } = signFromLon(hLon);
      const { sign: vSign } = signFromLon(toSidereal(hLon, ayan));
      houses.push({
        number: i+1, sign: hSign, vedicSign: vSign,
        signIndex: hSidx, lord: SIGN_LORDS[hSign],
        planets: [], meaning: HOUSE_MEANINGS[i+1] || ''
      });
    }

    // Place planets in houses
    for (const p of planets) {
      const hi = Math.floor(((p.longitude - ascTropical + 360) % 360) / 30);
      p.house  = hi + 1;
      houses[hi].planets.push(p.name);
    }

    const moon    = planets.find(p => p.name === 'Moon');
    const sun     = planets.find(p => p.name === 'Sun');
    const dob     = new Date(`${data.dob}T${data.time}`);
    const dasha   = calcDasha(moon.siderealLon, dob);
    const yoga    = detectYogas(planets);

    return {
      ascendant, planets, houses,
      sunSign:       sun.sign,
      moonSign:      moon.sign,
      ascendantSign: ascInfo.sign,
      vedicSun:      sun.vedicSign,
      vedicMoon:     moon.vedicSign,
      vedicAsc:      ascSidInfo.sign,
      lagnaLord:     SIGN_LORDS[ascInfo.sign],
      yoga, dasha,
      jd
    };
  }

  // ── Dasha Progress ─────────────────────────────────────────
  function dashaProgress(period) {
    const now   = Date.now();
    const start = period.startDate.getTime();
    const end   = period.endDate.getTime();
    if (now <= start) return 0;
    if (now >= end)   return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  }

  function dashaTimeLeft(period) {
    const ms    = period.endDate.getTime() - Date.now();
    if (ms <= 0) return 'Completed';
    const yrs   = ms / (365.25*24*3600*1000);
    if (yrs < 1) return `${Math.round(yrs*12)} months left`;
    return `${yrs.toFixed(1)} years left`;
  }

  function fmtDate(d) {
    return d.toLocaleDateString('en-US', { month:'short', year:'numeric' });
  }

  // ── Expose ─────────────────────────────────────────────────
  return {
    calculateChart,
    dashaProgress, dashaTimeLeft, fmtDate,
    SIGNS, SIGN_TRAITS, PLANET_COLORS, PLANET_SYMBOLS, PLANET_EMOJI,
    PLANET_MEANINGS, HOUSE_MEANINGS, SIGN_LORDS,
    DASHA_COLORS, DASHA_PLAIN, DASHA_ORDER,
    CITIES
  };

})();
