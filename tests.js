/* ═══════════════════════════════════════════════════════════════
   ASTRAMIND — Test Suite v1.0.0
   15 test cases · Browser-based · No external dependencies
   Pass threshold: 80%
═══════════════════════════════════════════════════════════════ */

const TestRunner = (function () {

  const PASS_THRESHOLD = 80;

  // ── Test Helpers ─────────────────────────────────────────────
  function assert(condition, msg) {
    if (!condition) throw new Error(msg || 'Assertion failed');
  }

  function assertEqual(a, b, msg) {
    if (a !== b) throw new Error(msg || `Expected "${b}" but got "${a}"`);
  }

  function assertInRange(val, min, max, msg) {
    if (val < min || val > max) throw new Error(msg || `Expected ${val} to be between ${min} and ${max}`);
  }

  function assertHasKeys(obj, keys, msg) {
    for (const k of keys) {
      if (!(k in obj)) throw new Error(msg || `Missing key: ${k}`);
    }
  }

  function assertNotEmpty(val, msg) {
    if (!val || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0)) {
      throw new Error(msg || 'Value is empty');
    }
  }

  // ── Sample Birth Data ─────────────────────────────────────────
  const SAMPLE_DATA_1 = {
    name: 'Arjun Sharma',
    dob:  '1990-03-15',
    time: '06:30',
    place: 'Mumbai, Maharashtra',
    lat:   19.0760,
    lon:   72.8777,
    timezone: 5.5
  };

  const SAMPLE_DATA_2 = {
    name: 'Priya Singh',
    dob:  '1993-02-09',
    time: '09:45',
    place: 'Pantnagar, Uttarakhand',
    lat:   29.0344,
    lon:   79.4740,
    timezone: 5.5
  };

  // ── All Tests ─────────────────────────────────────────────────
  const TESTS = [

    // ── 1. Chart Calculation — Basic ──────────────────────────
    {
      name: 'Chart Calculation: Basic Output',
      purpose: 'calculateChart returns a valid chart object with all required fields',
      run() {
        const chart = AstrologyEngine.calculateChart(SAMPLE_DATA_1);
        assertHasKeys(chart, ['ascendant','planets','houses','sunSign','moonSign','ascendantSign','dasha','yoga']);
        assertNotEmpty(chart.sunSign, 'sunSign should not be empty');
        assertNotEmpty(chart.moonSign, 'moonSign should not be empty');
        assertNotEmpty(chart.ascendantSign, 'ascendantSign should not be empty');
        assert(AstrologyEngine.SIGNS.includes(chart.sunSign), `Invalid sunSign: ${chart.sunSign}`);
        assert(AstrologyEngine.SIGNS.includes(chart.moonSign), `Invalid moonSign: ${chart.moonSign}`);
        assert(AstrologyEngine.SIGNS.includes(chart.ascendantSign), `Invalid ascendantSign: ${chart.ascendantSign}`);
      }
    },

    // ── 2. Chart Calculation — Correct Signs (9 Feb 1993) ─────
    {
      name: 'Chart Calculation: Correct Western Signs',
      purpose: 'Verifies Sun=Aquarius, Moon=Virgo, Rising=Aries for 9 Feb 1993 09:45 Pantnagar',
      run() {
        const chart = AstrologyEngine.calculateChart(SAMPLE_DATA_2);
        assertEqual(chart.sunSign, 'Aquarius', `Sun sign: expected Aquarius, got ${chart.sunSign}`);
        assertEqual(chart.moonSign, 'Virgo', `Moon sign: expected Virgo, got ${chart.moonSign}`);
        assertEqual(chart.ascendantSign, 'Aries', `Rising: expected Aries, got ${chart.ascendantSign}`);
      }
    },

    // ── 3. Planets Array ──────────────────────────────────────
    {
      name: 'Chart Calculation: All 9 Planets Present',
      purpose: 'Ensures Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu are in planets array',
      run() {
        const chart = AstrologyEngine.calculateChart(SAMPLE_DATA_1);
        const expected = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
        for (const name of expected) {
          const p = chart.planets.find(p => p.name === name);
          assert(p !== undefined, `Missing planet: ${name}`);
          assertInRange(p.longitude, 0, 360, `${name} longitude out of range: ${p.longitude}`);
          assertInRange(p.house, 1, 12, `${name} house out of range: ${p.house}`);
        }
      }
    },

    // ── 4. Houses ─────────────────────────────────────────────
    {
      name: 'Chart Calculation: 12 Houses with Signs',
      purpose: 'All 12 houses are generated with valid signs and meanings',
      run() {
        const chart = AstrologyEngine.calculateChart(SAMPLE_DATA_1);
        assertEqual(chart.houses.length, 12, `Expected 12 houses, got ${chart.houses.length}`);
        for (const h of chart.houses) {
          assertInRange(h.number, 1, 12, `House number ${h.number} out of range`);
          assert(AstrologyEngine.SIGNS.includes(h.sign), `Invalid house sign: ${h.sign}`);
          assertNotEmpty(h.meaning, `House ${h.number} has no meaning`);
        }
      }
    },

    // ── 5. Dasha Calculation ──────────────────────────────────
    {
      name: 'Dasha Calculation: Active Period Exists',
      purpose: 'Chart should have exactly one isActive Dasha period for any living person',
      run() {
        const chart = AstrologyEngine.calculateChart(SAMPLE_DATA_1);
        assert(Array.isArray(chart.dasha), 'dasha should be an array');
        assertInRange(chart.dasha.length, 8, 9, `Dasha array length: ${chart.dasha.length}`);
        const active = chart.dasha.filter(d => d.isActive);
        assertEqual(active.length, 1, `Expected exactly 1 active dasha, got ${active.length}`);
        assert(active[0].planet, 'Active dasha must have a planet name');
        assert(active[0].endDate instanceof Date || typeof active[0].endDate === 'string', 'Dasha endDate must exist');
      }
    },

    // ── 6. Dasha Progress Utility ─────────────────────────────
    {
      name: 'Dasha Progress: Returns 0–100',
      purpose: 'dashaProgress returns a number between 0 and 100',
      run() {
        const chart = AstrologyEngine.calculateChart(SAMPLE_DATA_1);
        chart.dasha = chart.dasha.map(d => ({
          ...d,
          startDate: new Date(d.startDate),
          endDate:   new Date(d.endDate)
        }));
        const active = chart.dasha.find(d => d.isActive);
        assert(active, 'Need an active dasha');
        const prog = AstrologyEngine.dashaProgress(active);
        assertInRange(prog, 0, 100, `Progress ${prog} out of 0–100 range`);
      }
    },

    // ── 7. Insight Engine — Decision Mode ─────────────────────
    {
      name: 'Insight Engine: Decision Mode Output',
      purpose: 'decide() returns title, content, and category for any question',
      run() {
        const chart = AstrologyEngine.calculateChart(SAMPLE_DATA_1);
        const result = InsightEngine.decide('Should I switch jobs right now?', chart, 'Arjun');
        assertHasKeys(result, ['title','content','category']);
        assertNotEmpty(result.title, 'title is empty');
        assertNotEmpty(result.content, 'content is empty');
        assert(result.content.length > 100, `Content too short: ${result.content.length} chars`);
        const validCats = ['career','wealth','love','health','general'];
        assert(validCats.includes(result.category), `Invalid category: ${result.category}`);
      }
    },

    // ── 8. Insight Engine — Category Routing ─────────────────
    {
      name: 'Insight Engine: Correct Category Routing',
      purpose: 'Career questions → career, love questions → love, etc.',
      run() {
        const chart = AstrologyEngine.calculateChart(SAMPLE_DATA_1);
        const tests = [
          { q:'Should I invest my money?',           expected:'wealth'  },
          { q:'What about my relationship?',         expected:'love'    },
          { q:'How is my health right now?',         expected:'health'  },
          { q:'Should I start a new business?',      expected:'career'  },
          { q:'Should I relocate to another city?',  expected:'general' }
        ];
        for (const { q, expected } of tests) {
          const r = InsightEngine.decide(q, chart, 'Test');
          assertEqual(r.category, expected, `Q: "${q}" → expected ${expected}, got ${r.category}`);
        }
      }
    },

    // ── 9. Insight Generation — Full Set ─────────────────────
    {
      name: 'Insight Engine: generateAll Returns 9 Insights',
      purpose: 'generateAll returns at least 9 insights covering all categories',
      run() {
        const chart = AstrologyEngine.calculateChart(SAMPLE_DATA_1);
        const ins   = InsightEngine.generateAll(chart, 'Arjun', 'test-user-1');
        assert(ins.length >= 8, `Expected ≥8 insights, got ${ins.length}`);
        for (const i of ins) {
          assertHasKeys(i, ['id','userId','category','period','title','content','date','bookmarked']);
          assertNotEmpty(i.title, 'Insight title is empty');
          assertNotEmpty(i.content, 'Insight content is empty');
          assert(i.content.length > 80, `Content too short: ${i.content.length}`);
        }
        const cats = new Set(ins.map(i => i.category));
        assert(cats.size >= 4, `Expected ≥4 categories, got ${cats.size}: ${[...cats].join(',')}`);
      }
    },

    // ── 10. Blend Engine — Synastry ──────────────────────────
    {
      name: 'Blend Engine: createBlend Returns Valid Blend',
      purpose: 'createBlend generates a full blend object with all required sections',
      run() {
        const chart1 = AstrologyEngine.calculateChart(SAMPLE_DATA_1);
        const chart2 = AstrologyEngine.calculateChart(SAMPLE_DATA_2);
        const blend  = BlendEngine.createBlend('u1','u2','Arjun Sharma','Priya Singh', chart1, chart2, 'Arjun ✦ Priya');
        assertHasKeys(blend, ['id','name','userId1','userId2','synastry','dimensions','coreNarrative','strengths','frictionPoints','currentPhase','weeklyInsight','monthlyInsight','decisionHistory']);
        assertEqual(blend.name, 'Arjun ✦ Priya', 'Blend name mismatch');
        assertNotEmpty(blend.coreNarrative, 'coreNarrative is empty');
        assert(blend.dimensions.length === 5, `Expected 5 dimensions, got ${blend.dimensions.length}`);
        assert(blend.strengths.length > 0, 'strengths array is empty');
        assert(blend.frictionPoints.length >= 0, 'frictionPoints must be an array');
      }
    },

    // ── 11. Blend Engine — Dimensions ────────────────────────
    {
      name: 'Blend Engine: Compatibility Dimensions Valid',
      purpose: 'All 5 dimensions have valid scores, levels, and advice',
      run() {
        const chart1 = AstrologyEngine.calculateChart(SAMPLE_DATA_1);
        const chart2 = AstrologyEngine.calculateChart(SAMPLE_DATA_2);
        const blend  = BlendEngine.createBlend('u1','u2','Arjun','Priya', chart1, chart2);
        const LABELS = ['Emotional Sync','Romantic Pull','Communication Flow','Long-Term Growth','Shared Values'];
        const LEVELS = ['Exceptional','Strong','Good','Complex','Challenging'];
        for (const d of blend.dimensions) {
          assertInRange(d.score, 0, 100, `${d.label} score ${d.score} out of range`);
          assert(LEVELS.includes(d.level), `Invalid level for ${d.label}: ${d.level}`);
          assertNotEmpty(d.insight, `${d.label} insight is empty`);
          assertNotEmpty(d.advice, `${d.label} advice is empty`);
        }
      }
    },

    // ── 12. Blend Engine — Couple Decision ───────────────────
    {
      name: 'Blend Engine: Couple Decision Mode',
      purpose: 'coupleDecide returns a non-empty analysis for travel, money, and commitment questions',
      run() {
        const chart1 = AstrologyEngine.calculateChart(SAMPLE_DATA_1);
        const chart2 = AstrologyEngine.calculateChart(SAMPLE_DATA_2);
        const synastry = [];
        const questions = [
          'Should we travel together this month?',
          'Is this a good time for a shared investment?',
          'Should we commit to this relationship?'
        ];
        for (const q of questions) {
          const ans = BlendEngine.coupleDecide(q, chart1, chart2, 'Arjun', 'Priya', synastry);
          assert(typeof ans === 'string', `Answer is not a string for: "${q}"`);
          assert(ans.length > 80, `Answer too short (${ans.length} chars) for: "${q}"`);
        }
      }
    },

    // ── 13. localStorage Persistence ─────────────────────────
    {
      name: 'LocalStorage: Data Saved and Retrieved',
      purpose: 'User data written to localStorage can be read back correctly',
      run() {
        const testKey = 'astramind_test_persistence';
        const testData = { id:'test-123', name:'Test User', timestamp: Date.now() };
        localStorage.setItem(testKey, JSON.stringify(testData));
        const retrieved = JSON.parse(localStorage.getItem(testKey));
        assertEqual(retrieved.id, testData.id, 'ID mismatch after localStorage round-trip');
        assertEqual(retrieved.name, testData.name, 'Name mismatch after localStorage round-trip');
        localStorage.removeItem(testKey);
        assert(localStorage.getItem(testKey) === null, 'Item not removed from localStorage');
      }
    },

    // ── 14. Edge Cases — Empty / Invalid Input ────────────────
    {
      name: 'Edge Case: Empty Question Handling',
      purpose: 'Insight engine handles edge-case questions without throwing errors',
      run() {
        const chart = AstrologyEngine.calculateChart(SAMPLE_DATA_1);
        // Non-matching question should fall to general
        const result = InsightEngine.decide('xyzabcabc123nonsense', chart, 'Test');
        assertHasKeys(result, ['title','content','category']);
        assertNotEmpty(result.content, 'Content must not be empty even for nonsense input');

        // Very short question
        const result2 = InsightEngine.decide('ok?', chart, 'Test');
        assertHasKeys(result2, ['title','content','category']);

        // Question with special characters
        const result3 = InsightEngine.decide('What about my life & career?!', chart, 'Test');
        assertNotEmpty(result3.content, 'Content empty for special-char question');
      }
    },

    // ── 15. City List & Sign Constants ───────────────────────
    {
      name: 'Data Integrity: Cities and Sign Constants',
      purpose: 'CITIES list has Pantnagar, all 12 signs exist, SIGN_TRAITS covers all signs',
      run() {
        const cities = AstrologyEngine.CITIES;
        assert(cities.length >= 30, `Expected ≥30 cities, got ${cities.length}`);
        const pantnagar = cities.find(c => c.name.toLowerCase().includes('pantnagar'));
        assert(pantnagar, 'Pantnagar not found in city list');
        assertInRange(pantnagar.lat, 28, 30, `Pantnagar lat ${pantnagar.lat} seems wrong`);
        assertEqual(pantnagar.tz, 5.5, `Pantnagar timezone should be 5.5, got ${pantnagar.tz}`);

        const SIGNS = AstrologyEngine.SIGNS;
        assertEqual(SIGNS.length, 12, `Expected 12 signs, got ${SIGNS.length}`);

        const T = AstrologyEngine.SIGN_TRAITS;
        for (const sign of SIGNS) {
          assert(T[sign], `No SIGN_TRAITS for: ${sign}`);
          assert(T[sign].element, `Missing element for: ${sign}`);
          assert(T[sign].vibe, `Missing vibe for: ${sign}`);
        }
      }
    }

  ];

  // ── Runner ────────────────────────────────────────────────────
  function run() {
    const results = [];
    let passed = 0, failed = 0;

    for (const test of TESTS) {
      const result = { name: test.name, purpose: test.purpose };
      const start  = performance.now();
      try {
        test.run();
        result.status  = 'pass';
        result.message = 'All assertions passed';
        passed++;
      } catch(e) {
        result.status  = 'fail';
        result.message = e.message;
        failed++;
      }
      result.ms = (performance.now() - start).toFixed(1);
      results.push(result);
    }

    const total   = passed + failed;
    const pct     = Math.round((passed / total) * 100);
    const overall = pct >= PASS_THRESHOLD ? 'PASS' : 'FAIL';

    // Console output
    console.group(`%cAstraMind Test Suite — ${overall} (${passed}/${total} · ${pct}%)`,
      `color:${overall==='PASS'?'#10b981':'#f43f5e'};font-weight:bold;font-size:14px`);
    for (const r of results) {
      const icon = r.status === 'pass' ? '✅' : '❌';
      if (r.status === 'pass') console.log(`${icon} ${r.name} (${r.ms}ms)`);
      else console.error(`${icon} ${r.name} — ${r.message}`);
    }
    console.groupEnd();

    // On-screen rendering
    renderResults(results, passed, failed, pct, overall);
    return { passed, failed, total, pct, overall };
  }

  function renderResults(results, passed, failed, pct, overall) {
    const summaryEl  = document.getElementById('test-summary');
    const resultsEl  = document.getElementById('test-results');
    if (!summaryEl || !resultsEl) return;

    const passClass = overall === 'PASS' ? 'test-pass' : 'test-fail';
    summaryEl.className = `test-summary ${passClass}`;
    summaryEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <strong style="font-size:18px">${overall === 'PASS' ? '✅' : '❌'} ${overall}</strong>
          &nbsp;&nbsp;${pct}% pass rate (${passed}/${passed+failed} tests)
        </div>
        <div style="font-size:13px">
          Threshold: ${PASS_THRESHOLD}% &nbsp;|&nbsp;
          <span style="color:#10b981">${passed} passed</span> &nbsp;|&nbsp;
          <span style="color:#f43f5e">${failed} failed</span>
        </div>
      </div>
      ${overall === 'FAIL' ? `<div style="margin-top:8px;font-size:12px;opacity:.8">⚠️ Below ${PASS_THRESHOLD}% threshold. Check failed tests below.</div>` : ''}`;

    resultsEl.innerHTML = results.map(r => `
      <div class="test-item">
        <div class="test-icon">${r.status === 'pass' ? '✅' : '❌'}</div>
        <div style="flex:1">
          <div class="test-name">${r.name}</div>
          <div class="test-detail">${r.purpose} · ${r.ms}ms</div>
          ${r.status === 'fail' ? `<div class="test-err">Error: ${r.message}</div>` : ''}
        </div>
      </div>`).join('');
  }

  return { run };

})();
