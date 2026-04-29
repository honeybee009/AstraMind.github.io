/* ═══════════════════════════════════════════════════════════════
   ASTRAMIND — Geocoding Engine v1.1.0
   Provider: OpenStreetMap Nominatim (free, no API key, global)
   Fallback: Built-in city database (offline)
   Timezone: OpenStreetMap timezone data via timezonefinder logic
═══════════════════════════════════════════════════════════════ */

const Geocoder = (function () {

  // ── Nominatim base URL ──────────────────────────────────────
  const NOMINATIM = 'https://nominatim.openstreetmap.org';
  const TZDB      = 'https://timezonefinder.michelfe.it/api/0';
  // Alternative TZ API (no key): https://api.timezonedb.com — requires free key
  // We'll calculate TZ offset from longitude as fallback

  // ── Offline fallback city database (expanded ~200 cities) ───
  const FALLBACK_CITIES = [
    // India — Uttarakhand
    { name:'Pantnagar, Uttarakhand, India',       lat:29.0344,   lon:79.4740,   tz:5.5 },
    { name:'Dehradun, Uttarakhand, India',         lat:30.3165,   lon:78.0322,   tz:5.5 },
    { name:'Haridwar, Uttarakhand, India',         lat:29.9457,   lon:78.1642,   tz:5.5 },
    { name:'Nainital, Uttarakhand, India',         lat:29.3919,   lon:79.4542,   tz:5.5 },
    { name:'Rishikesh, Uttarakhand, India',        lat:30.0869,   lon:78.2676,   tz:5.5 },
    { name:'Haldwani, Uttarakhand, India',         lat:29.2183,   lon:79.5130,   tz:5.5 },
    // India — North
    { name:'Delhi, India',                         lat:28.6139,   lon:77.2090,   tz:5.5 },
    { name:'New Delhi, India',                     lat:28.6139,   lon:77.2090,   tz:5.5 },
    { name:'Noida, Uttar Pradesh, India',          lat:28.5355,   lon:77.3910,   tz:5.5 },
    { name:'Gurgaon, Haryana, India',              lat:28.4595,   lon:77.0266,   tz:5.5 },
    { name:'Faridabad, Haryana, India',            lat:28.4089,   lon:77.3178,   tz:5.5 },
    { name:'Ghaziabad, Uttar Pradesh, India',      lat:28.6692,   lon:77.4538,   tz:5.5 },
    { name:'Meerut, Uttar Pradesh, India',         lat:28.9845,   lon:77.7064,   tz:5.5 },
    { name:'Agra, Uttar Pradesh, India',           lat:27.1767,   lon:78.0081,   tz:5.5 },
    { name:'Lucknow, Uttar Pradesh, India',        lat:26.8467,   lon:80.9462,   tz:5.5 },
    { name:'Kanpur, Uttar Pradesh, India',         lat:26.4499,   lon:80.3319,   tz:5.5 },
    { name:'Varanasi, Uttar Pradesh, India',       lat:25.3176,   lon:82.9739,   tz:5.5 },
    { name:'Allahabad, Uttar Pradesh, India',      lat:25.4358,   lon:81.8463,   tz:5.5 },
    { name:'Bareilly, Uttar Pradesh, India',       lat:28.3670,   lon:79.4304,   tz:5.5 },
    { name:'Chandigarh, India',                    lat:30.7333,   lon:76.7794,   tz:5.5 },
    { name:'Amritsar, Punjab, India',              lat:31.6340,   lon:74.8723,   tz:5.5 },
    { name:'Ludhiana, Punjab, India',              lat:30.9010,   lon:75.8573,   tz:5.5 },
    { name:'Jalandhar, Punjab, India',             lat:31.3260,   lon:75.5762,   tz:5.5 },
    { name:'Patiala, Punjab, India',               lat:30.3398,   lon:76.3869,   tz:5.5 },
    { name:'Shimla, Himachal Pradesh, India',      lat:31.1048,   lon:77.1734,   tz:5.5 },
    { name:'Jammu, Jammu & Kashmir, India',        lat:32.7266,   lon:74.8570,   tz:5.5 },
    { name:'Srinagar, Jammu & Kashmir, India',     lat:34.0837,   lon:74.7973,   tz:5.5 },
    // India — West
    { name:'Mumbai, Maharashtra, India',           lat:19.0760,   lon:72.8777,   tz:5.5 },
    { name:'Pune, Maharashtra, India',             lat:18.5204,   lon:73.8567,   tz:5.5 },
    { name:'Nagpur, Maharashtra, India',           lat:21.1458,   lon:79.0882,   tz:5.5 },
    { name:'Nashik, Maharashtra, India',           lat:20.0059,   lon:73.7898,   tz:5.5 },
    { name:'Aurangabad, Maharashtra, India',       lat:19.8762,   lon:75.3433,   tz:5.5 },
    { name:'Thane, Maharashtra, India',            lat:19.2183,   lon:72.9781,   tz:5.5 },
    { name:'Ahmedabad, Gujarat, India',            lat:23.0225,   lon:72.5714,   tz:5.5 },
    { name:'Surat, Gujarat, India',                lat:21.1702,   lon:72.8311,   tz:5.5 },
    { name:'Vadodara, Gujarat, India',             lat:22.3072,   lon:73.1812,   tz:5.5 },
    { name:'Rajkot, Gujarat, India',               lat:22.3039,   lon:70.8022,   tz:5.5 },
    { name:'Indore, Madhya Pradesh, India',        lat:22.7196,   lon:75.8577,   tz:5.5 },
    { name:'Bhopal, Madhya Pradesh, India',        lat:23.2599,   lon:77.4126,   tz:5.5 },
    { name:'Jabalpur, Madhya Pradesh, India',      lat:23.1815,   lon:79.9864,   tz:5.5 },
    // India — South
    { name:'Bengaluru, Karnataka, India',          lat:12.9716,   lon:77.5946,   tz:5.5 },
    { name:'Bangalore, Karnataka, India',          lat:12.9716,   lon:77.5946,   tz:5.5 },
    { name:'Mysuru, Karnataka, India',             lat:12.2958,   lon:76.6394,   tz:5.5 },
    { name:'Hubli, Karnataka, India',              lat:15.3647,   lon:75.1240,   tz:5.5 },
    { name:'Mangaluru, Karnataka, India',          lat:12.9141,   lon:74.8560,   tz:5.5 },
    { name:'Chennai, Tamil Nadu, India',           lat:13.0827,   lon:80.2707,   tz:5.5 },
    { name:'Coimbatore, Tamil Nadu, India',        lat:11.0168,   lon:76.9558,   tz:5.5 },
    { name:'Madurai, Tamil Nadu, India',           lat:9.9252,    lon:78.1198,   tz:5.5 },
    { name:'Tiruchirappalli, Tamil Nadu, India',   lat:10.7905,   lon:78.7047,   tz:5.5 },
    { name:'Hyderabad, Telangana, India',          lat:17.3850,   lon:78.4867,   tz:5.5 },
    { name:'Warangal, Telangana, India',           lat:17.9689,   lon:79.5941,   tz:5.5 },
    { name:'Visakhapatnam, Andhra Pradesh, India', lat:17.6868,   lon:83.2185,   tz:5.5 },
    { name:'Vijayawada, Andhra Pradesh, India',    lat:16.5062,   lon:80.6480,   tz:5.5 },
    { name:'Kochi, Kerala, India',                 lat:9.9312,    lon:76.2673,   tz:5.5 },
    { name:'Thiruvananthapuram, Kerala, India',    lat:8.5241,    lon:76.9366,   tz:5.5 },
    { name:'Kozhikode, Kerala, India',             lat:11.2588,   lon:75.7804,   tz:5.5 },
    // India — East
    { name:'Kolkata, West Bengal, India',          lat:22.5726,   lon:88.3639,   tz:5.5 },
    { name:'Patna, Bihar, India',                  lat:25.5941,   lon:85.1376,   tz:5.5 },
    { name:'Ranchi, Jharkhand, India',             lat:23.3441,   lon:85.3096,   tz:5.5 },
    { name:'Bhubaneswar, Odisha, India',           lat:20.2961,   lon:85.8245,   tz:5.5 },
    { name:'Cuttack, Odisha, India',               lat:20.4625,   lon:85.8828,   tz:5.5 },
    { name:'Guwahati, Assam, India',               lat:26.1445,   lon:91.7362,   tz:5.5 },
    { name:'Raipur, Chhattisgarh, India',          lat:21.2514,   lon:81.6296,   tz:5.5 },
    // India — Rajasthan
    { name:'Jaipur, Rajasthan, India',             lat:26.9124,   lon:75.7873,   tz:5.5 },
    { name:'Jodhpur, Rajasthan, India',            lat:26.2389,   lon:73.0243,   tz:5.5 },
    { name:'Udaipur, Rajasthan, India',            lat:24.5854,   lon:73.7125,   tz:5.5 },
    { name:'Kota, Rajasthan, India',               lat:25.2138,   lon:75.8648,   tz:5.5 },
    { name:'Ajmer, Rajasthan, India',              lat:26.4499,   lon:74.6399,   tz:5.5 },
    // USA
    { name:'New York, NY, USA',                    lat:40.7128,   lon:-74.0060,  tz:-5  },
    { name:'Los Angeles, CA, USA',                 lat:34.0522,   lon:-118.2437, tz:-8  },
    { name:'Chicago, IL, USA',                     lat:41.8781,   lon:-87.6298,  tz:-6  },
    { name:'Houston, TX, USA',                     lat:29.7604,   lon:-95.3698,  tz:-6  },
    { name:'Phoenix, AZ, USA',                     lat:33.4484,   lon:-112.0740, tz:-7  },
    { name:'Philadelphia, PA, USA',                lat:39.9526,   lon:-75.1652,  tz:-5  },
    { name:'San Antonio, TX, USA',                 lat:29.4241,   lon:-98.4936,  tz:-6  },
    { name:'San Diego, CA, USA',                   lat:32.7157,   lon:-117.1611, tz:-8  },
    { name:'Dallas, TX, USA',                      lat:32.7767,   lon:-96.7970,  tz:-6  },
    { name:'San Jose, CA, USA',                    lat:37.3382,   lon:-121.8863, tz:-8  },
    { name:'San Francisco, CA, USA',               lat:37.7749,   lon:-122.4194, tz:-8  },
    { name:'Seattle, WA, USA',                     lat:47.6062,   lon:-122.3321, tz:-8  },
    { name:'Denver, CO, USA',                      lat:39.7392,   lon:-104.9903, tz:-7  },
    { name:'Boston, MA, USA',                      lat:42.3601,   lon:-71.0589,  tz:-5  },
    { name:'Atlanta, GA, USA',                     lat:33.7490,   lon:-84.3880,  tz:-5  },
    { name:'Miami, FL, USA',                       lat:25.7617,   lon:-80.1918,  tz:-5  },
    { name:'Minneapolis, MN, USA',                 lat:44.9778,   lon:-93.2650,  tz:-6  },
    { name:'Portland, OR, USA',                    lat:45.5231,   lon:-122.6765, tz:-8  },
    { name:'Las Vegas, NV, USA',                   lat:36.1699,   lon:-115.1398, tz:-8  },
    // UK
    { name:'London, UK',                           lat:51.5074,   lon:-0.1278,   tz:0   },
    { name:'Manchester, UK',                       lat:53.4808,   lon:-2.2426,   tz:0   },
    { name:'Birmingham, UK',                       lat:52.4862,   lon:-1.8904,   tz:0   },
    { name:'Edinburgh, UK',                        lat:55.9533,   lon:-3.1883,   tz:0   },
    { name:'Glasgow, UK',                          lat:55.8642,   lon:-4.2518,   tz:0   },
    // Europe
    { name:'Paris, France',                        lat:48.8566,   lon:2.3522,    tz:1   },
    { name:'Berlin, Germany',                      lat:52.5200,   lon:13.4050,   tz:1   },
    { name:'Frankfurt, Germany',                   lat:50.1109,   lon:8.6821,    tz:1   },
    { name:'Munich, Germany',                      lat:48.1351,   lon:11.5820,   tz:1   },
    { name:'Hamburg, Germany',                     lat:53.5753,   lon:10.0153,   tz:1   },
    { name:'Rome, Italy',                          lat:41.9028,   lon:12.4964,   tz:1   },
    { name:'Milan, Italy',                         lat:45.4654,   lon:9.1859,    tz:1   },
    { name:'Madrid, Spain',                        lat:40.4168,   lon:-3.7038,   tz:1   },
    { name:'Barcelona, Spain',                     lat:41.3851,   lon:2.1734,    tz:1   },
    { name:'Amsterdam, Netherlands',               lat:52.3676,   lon:4.9041,    tz:1   },
    { name:'Brussels, Belgium',                    lat:50.8503,   lon:4.3517,    tz:1   },
    { name:'Zurich, Switzerland',                  lat:47.3769,   lon:8.5417,    tz:1   },
    { name:'Vienna, Austria',                      lat:48.2082,   lon:16.3738,   tz:1   },
    { name:'Warsaw, Poland',                       lat:52.2297,   lon:21.0122,   tz:1   },
    { name:'Prague, Czech Republic',               lat:50.0755,   lon:14.4378,   tz:1   },
    { name:'Stockholm, Sweden',                    lat:59.3293,   lon:18.0686,   tz:1   },
    { name:'Oslo, Norway',                         lat:59.9139,   lon:10.7522,   tz:1   },
    { name:'Copenhagen, Denmark',                  lat:55.6761,   lon:12.5683,   tz:1   },
    { name:'Helsinki, Finland',                    lat:60.1699,   lon:24.9384,   tz:2   },
    { name:'Athens, Greece',                       lat:37.9838,   lon:23.7275,   tz:2   },
    { name:'Istanbul, Turkey',                     lat:41.0082,   lon:28.9784,   tz:3   },
    { name:'Lisbon, Portugal',                     lat:38.7223,   lon:-9.1393,   tz:0   },
    // Middle East
    { name:'Dubai, UAE',                           lat:25.2048,   lon:55.2708,   tz:4   },
    { name:'Abu Dhabi, UAE',                       lat:24.4539,   lon:54.3773,   tz:4   },
    { name:'Riyadh, Saudi Arabia',                 lat:24.6877,   lon:46.7219,   tz:3   },
    { name:'Jeddah, Saudi Arabia',                 lat:21.5433,   lon:39.1728,   tz:3   },
    { name:'Doha, Qatar',                          lat:25.2854,   lon:51.5310,   tz:3   },
    { name:'Kuwait City, Kuwait',                  lat:29.3759,   lon:47.9774,   tz:3   },
    { name:'Muscat, Oman',                         lat:23.5880,   lon:58.3829,   tz:4   },
    { name:'Tehran, Iran',                         lat:35.6892,   lon:51.3890,   tz:3.5 },
    { name:'Beirut, Lebanon',                      lat:33.8938,   lon:35.5018,   tz:2   },
    { name:'Amman, Jordan',                        lat:31.9539,   lon:35.9106,   tz:2   },
    { name:'Tel Aviv, Israel',                     lat:32.0853,   lon:34.7818,   tz:2   },
    { name:'Cairo, Egypt',                         lat:30.0444,   lon:31.2357,   tz:2   },
    // Asia Pacific
    { name:'Singapore',                            lat:1.3521,    lon:103.8198,  tz:8   },
    { name:'Tokyo, Japan',                         lat:35.6762,   lon:139.6503,  tz:9   },
    { name:'Osaka, Japan',                         lat:34.6937,   lon:135.5023,  tz:9   },
    { name:'Seoul, South Korea',                   lat:37.5665,   lon:126.9780,  tz:9   },
    { name:'Beijing, China',                       lat:39.9042,   lon:116.4074,  tz:8   },
    { name:'Shanghai, China',                      lat:31.2304,   lon:121.4737,  tz:8   },
    { name:'Hong Kong',                            lat:22.3193,   lon:114.1694,  tz:8   },
    { name:'Taipei, Taiwan',                       lat:25.0330,   lon:121.5654,  tz:8   },
    { name:'Bangkok, Thailand',                    lat:13.7563,   lon:100.5018,  tz:7   },
    { name:'Jakarta, Indonesia',                   lat:-6.2088,   lon:106.8456,  tz:7   },
    { name:'Kuala Lumpur, Malaysia',               lat:3.1390,    lon:101.6869,  tz:8   },
    { name:'Manila, Philippines',                  lat:14.5995,   lon:120.9842,  tz:8   },
    { name:'Ho Chi Minh City, Vietnam',            lat:10.8231,   lon:106.6297,  tz:7   },
    { name:'Hanoi, Vietnam',                       lat:21.0278,   lon:105.8342,  tz:7   },
    { name:'Dhaka, Bangladesh',                    lat:23.8103,   lon:90.4125,   tz:6   },
    { name:'Colombo, Sri Lanka',                   lat:6.9271,    lon:79.8612,   tz:5.5 },
    { name:'Kathmandu, Nepal',                     lat:27.7172,   lon:85.3240,   tz:5.75},
    { name:'Islamabad, Pakistan',                  lat:33.6844,   lon:73.0479,   tz:5   },
    { name:'Karachi, Pakistan',                    lat:24.8607,   lon:67.0011,   tz:5   },
    { name:'Lahore, Pakistan',                     lat:31.5204,   lon:74.3587,   tz:5   },
    // Australia & NZ
    { name:'Sydney, Australia',                    lat:-33.8688,  lon:151.2093,  tz:10  },
    { name:'Melbourne, Australia',                 lat:-37.8136,  lon:144.9631,  tz:10  },
    { name:'Brisbane, Australia',                  lat:-27.4698,  lon:153.0251,  tz:10  },
    { name:'Perth, Australia',                     lat:-31.9505,  lon:115.8605,  tz:8   },
    { name:'Adelaide, Australia',                  lat:-34.9285,  lon:138.6007,  tz:9.5 },
    { name:'Auckland, New Zealand',                lat:-36.8485,  lon:174.7633,  tz:12  },
    // Canada
    { name:'Toronto, Ontario, Canada',             lat:43.6532,   lon:-79.3832,  tz:-5  },
    { name:'Vancouver, BC, Canada',                lat:49.2827,   lon:-123.1207, tz:-8  },
    { name:'Montreal, Quebec, Canada',             lat:45.5017,   lon:-73.5673,  tz:-5  },
    { name:'Calgary, Alberta, Canada',             lat:51.0447,   lon:-114.0719, tz:-7  },
    { name:'Ottawa, Ontario, Canada',              lat:45.4215,   lon:-75.6972,  tz:-5  },
    // Africa
    { name:'Nairobi, Kenya',                       lat:-1.2921,   lon:36.8219,   tz:3   },
    { name:'Lagos, Nigeria',                       lat:6.5244,    lon:3.3792,    tz:1   },
    { name:'Accra, Ghana',                         lat:5.6037,    lon:-0.1870,   tz:0   },
    { name:'Johannesburg, South Africa',           lat:-26.2041,  lon:28.0473,   tz:2   },
    { name:'Cape Town, South Africa',              lat:-33.9249,  lon:18.4241,   tz:2   },
    { name:'Casablanca, Morocco',                  lat:33.5731,   lon:-7.5898,   tz:1   },
    { name:'Addis Ababa, Ethiopia',                lat:9.0320,    lon:38.7469,   tz:3   },
    { name:'Dar es Salaam, Tanzania',              lat:-6.7924,   lon:39.2083,   tz:3   },
    // South America
    { name:'São Paulo, Brazil',                    lat:-23.5505,  lon:-46.6333,  tz:-3  },
    { name:'Rio de Janeiro, Brazil',               lat:-22.9068,  lon:-43.1729,  tz:-3  },
    { name:'Buenos Aires, Argentina',              lat:-34.6037,  lon:-58.3816,  tz:-3  },
    { name:'Lima, Peru',                           lat:-12.0464,  lon:-77.0428,  tz:-5  },
    { name:'Bogotá, Colombia',                     lat:4.7110,    lon:-74.0721,  tz:-5  },
    { name:'Santiago, Chile',                      lat:-33.4489,  lon:-70.6693,  tz:-4  },
    { name:'Mexico City, Mexico',                  lat:19.4326,   lon:-99.1332,  tz:-6  },
  ];

  // ── Timezone estimation from longitude (fallback) ───────────
  // DST-unaware but accurate for birth chart purposes
  function tzFromLon(lon) {
    // Round to nearest 0.25 (15° = 1hr, so 1° = 0.0667 hr)
    const raw = lon / 15;
    // Round to nearest 0.25 for common TZ offsets
    return Math.round(raw * 4) / 4;
  }

  // Known country TZ overrides for accuracy
  const TZ_OVERRIDES = {
    // India always +5.5
    'india': 5.5, 'IN': 5.5,
    // Nepal +5.75
    'nepal': 5.75,
    // China always +8
    'china': 8,
    // Australia eastern +10
    'australia': null, // varies by state, use lon
    // USA — varies widely, use lon
  };

  // ── Get timezone for coordinates via free API ────────────────
  async function getTzOffset(lat, lon, countryCode) {
    // India shortcut
    if (countryCode === 'IN') return 5.5;
    if (countryCode === 'NP') return 5.75;
    if (countryCode === 'LK') return 5.5;

    try {
      // timeapi.io — free, no key needed
      const url = `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`;
      const res  = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        // currentUtcOffset.seconds / 3600
        if (data.currentUtcOffset && data.currentUtcOffset.seconds !== undefined) {
          return data.currentUtcOffset.seconds / 3600;
        }
        // Try standard offset
        if (data.standardUtcOffset && data.standardUtcOffset.seconds !== undefined) {
          return data.standardUtcOffset.seconds / 3600;
        }
      }
    } catch (_) { /* fall through */ }

    // Fallback: longitude-based estimate
    return tzFromLon(lon);
  }

  // ── Search via Nominatim ─────────────────────────────────────
  let _searchTimeout = null;
  let _lastQuery     = '';
  let _cache         = {};

  async function search(query) {
    if (!query || query.length < 2) return [];
    if (_cache[query])              return _cache[query];

    // 1. Try offline first (fast, instant)
    const qLow   = query.toLowerCase();
    const offline = FALLBACK_CITIES
      .filter(c => c.name.toLowerCase().includes(qLow))
      .slice(0, 6)
      .map(c => ({ display_name: c.name, lat: c.lat, lon: c.lon, tz: c.tz, source: 'offline' }));

    // 2. Fire Nominatim in parallel (or instead)
    try {
      const url = `${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=8&featuretype=city`;
      const res  = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'AstraMind/1.0' },
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) throw new Error('Nominatim error');
      const raw = await res.json();

      const online = raw
        .filter(r => ['city','town','village','municipality','suburb','county'].includes(r.type) || r.class === 'place' || r.class === 'boundary')
        .slice(0, 6)
        .map(r => ({
          display_name: formatName(r),
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
          tz:  null, // fetched lazily
          countryCode: r.address?.country_code?.toUpperCase() || '',
          source: 'online'
        }));

      // Merge: online results take priority, then offline fills gaps
      const seen   = new Set(online.map(r => r.display_name));
      const merged = [...online, ...offline.filter(o => !seen.has(o.display_name))].slice(0, 8);
      _cache[query] = merged;
      return merged;

    } catch (_) {
      // Nominatim unavailable — use offline only
      _cache[query] = offline;
      return offline;
    }
  }

  function formatName(r) {
    const a = r.address || {};
    const parts = [];
    // City/town/village
    const city = a.city || a.town || a.village || a.municipality || a.county || a.suburb || r.display_name.split(',')[0];
    parts.push(city);
    // State
    if (a.state) parts.push(a.state);
    // Country
    if (a.country) parts.push(a.country);
    return parts.filter(Boolean).join(', ');
  }

  // ── Resolve a result to full data (with TZ) ──────────────────
  async function resolve(result) {
    let tz = result.tz;
    if (tz === null || tz === undefined) {
      tz = await getTzOffset(result.lat, result.lon, result.countryCode || '');
    }
    return {
      name:     result.display_name,
      lat:      parseFloat(result.lat.toFixed(4)),
      lon:      parseFloat(result.lon.toFixed(4)),
      timezone: tz
    };
  }

  // ── Expose ───────────────────────────────────────────────────
  return {
    search,
    resolve,
    FALLBACK_CITIES
  };

})();
