// Sky Trainer — app shell, views, flashcard training loop.
(function () {
  const S = window.SKY, A = S.astro, R = S.render, SRS = S.srs;
  const CONS = window.SKY_DATA.constellations, STARS = window.SKY_DATA.stars, CONTENT = window.SKY_CONTENT;
  const ORDER = CONTENT.order;
  const view = document.getElementById('view');
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const meaning = id => CONTENT.meaning[id] || '';
  const rich = id => CONTENT.c[id] || null;
  const STAGE = {
    1: { lines: true, rot: false, field: false, find: false, label: 'stage 1 · figure lines, north up' },
    2: { lines: false, rot: false, field: false, find: false, label: 'stage 2 · stars only, north up' },
    3: { lines: false, rot: true, field: false, find: false, label: 'stage 3 · stars only, any rotation' },
    4: { lines: false, rot: true, field: true, find: false, label: 'stage 4 · rotated, with field stars' },
    5: { lines: false, rot: true, field: true, find: true, label: 'stage 5 · find it in a wide field' },
  };
  const LEVEL_NAMES = ['new', 'outline', 'bare stars', 'rotated', 'in the field', 'wide field', 'mastered'];

  // ── Background starfield (matches the main site) ────────────────
  (function () {
    const c = document.getElementById('bg'), ctx = c.getContext('2d'); let stars = [];
    function resize() { c.width = innerWidth; c.height = innerHeight; stars = Array.from({ length: Math.floor(c.width * c.height / 6000) }, () => ({ x: Math.random() * c.width, y: Math.random() * c.height, r: Math.random() * 1.1 + 0.2, b: Math.random() * 0.5 + 0.15, p: Math.random() * 6.28, s: Math.random() * 0.01 + 0.003 })); }
    function draw(t) { ctx.clearRect(0, 0, c.width, c.height); for (const s of stars) { ctx.globalAlpha = s.b + 0.25 * Math.sin(s.p + t * s.s); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill(); } ctx.globalAlpha = 1; requestAnimationFrame(draw); }
    addEventListener('resize', resize); resize(); requestAnimationFrame(draw);
  })();

  // ── Location & time helpers ──────────────────────────────────────
  function loc() { const s = SRS.state.settings; return { lat: s.lat == null ? 42.36 : s.lat, lon: s.lon == null ? -71.09 : s.lon, place: s.place || (s.lat == null ? 'Cambridge, MA (default)' : `${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}°`), isDefault: s.lat == null }; }
  function eveningDate() { const d = new Date(); if (d.getHours() < 4) d.setDate(d.getDate() - 1); d.setHours(21, 0, 0, 0); return d; }
  function altAz(id, date) { const { lat, lon } = loc(); const c = CONS[id]; const r = A.altaz(c.ra, c.dec, lat, A.lst(date, lon)); return { alt: r.alt, az: r.az, dir: A.compass(r.az) }; }
  function tonight(id) {
    const { lat } = loc(); const c = CONS[id]; const v = altAz(id, eveningDate());
    const ha = A.riseHA(c.dec, lat, 10);
    if (v.alt > 10) return { up: true, text: `up tonight at 9 pm: ${v.dir}, ${Math.round(v.alt)}° above the horizon.` };
    if (ha === null) return { up: false, never: true, text: `never gets above 10° from your latitude (${lat.toFixed(0)}°); travel ${lat > 0 ? 'south' : 'north'} to see it.` };
    if (ha === 180) return { up: false, text: `circumpolar for you, but low right now (${v.dir}, ${Math.round(v.alt)}°).` };
    return { up: false, text: 'below the horizon at 9 pm tonight.' };
  }
  const isUpTonight = id => altAz(id, eveningDate()).alt > 15;
  function regionOf(id) { const d = CONS[id].dec; return d > 55 ? CONTENT.region.north : d < -55 ? CONTENT.region.south : CONTENT.region.mid; }
  function seasonOf(id) {
    // Month when the constellation transits around 9 pm local: RA (h) ≈ LST at 21:00 → month ≈ (RA/2 + 9.5) mod 12 (rough).
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const m = Math.round(((CONS[id].ra / 15) / 2 + 9.5) % 12 + 12) % 12;
    return `${months[(m + 11) % 12]} – ${months[(m + 1) % 12]}`;
  }

  // ── Router ───────────────────────────────────────────────────────
  function route() {
    const h = location.hash.replace(/^#/, '') || 'learn';
    const parts = h.split('/');
    $$('.tabs a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + parts[0]));
    window.scrollTo(0, 0);
    if (parts[0] === 'learn' && parts[1] === 'c') return renderCardPage(parts[2]);
    if (parts[0] === 'train') return session ? renderStep() : renderTrainSetup();
    if (parts[0] === 'sky') return renderSky();
    if (parts[0] === 'progress') return renderProgress();
    return renderLearn();
  }
  addEventListener('hashchange', route);

  function drawCons(canvas, id, o = {}) {
    const c = CONS[id];
    return R.drawChart(canvas, Object.assign({ ra0: c.ra, dec0: c.dec, fov: Math.max(c.radius * 1.25, 5), rot: 0, field: false, lines: [{ id }], labels: false, magLimit: SRS.state.settings.magLimit }, o));
  }
  function masteryDots(id) { const m = SRS.mastery(id); return `<span class="dots" title="${LEVEL_NAMES[m]}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= Math.min(m, 5) ? 'on' : ''}${m === 6 ? ' gold' : ''}"></i>`).join('')}</span>`; }

  // ── Learn: one grid of all 88 ────────────────────────────────────
  const learnState = { q: '', sort: 'prominence' };
  function renderLearn() {
    const due = SRS.dueItems().length, studied = SRS.studied().length;
    view.innerHTML = `
      <section class="hero">
        <h1>learn the sky, for real.</h1>
        <p>For anyone who wants to learn the constellations: as a cool party trick, as a budding amateur astronomer, or as a professional astronomer who needs to save face and actually know some stars in the sky. Flashcards built from real star positions: start with the outline, then strip away the lines, spin the sky, drown it in field stars, and finally hunt for it in a wide field. Spaced repetition decides what comes back and when.</p>
        <div class="hero-actions">
          <a class="btn primary" href="#train">${due ? `review ${due} due` : studied ? 'train' : 'start training'}</a>
          <a class="btn" href="#sky">what's up tonight</a>
        </div>
      </section>
      <div class="learn-tools">
        <input type="search" id="q" placeholder="search 88 constellations…" value="${esc(learnState.q)}" aria-label="Search">
        <select id="sort" aria-label="Sort">
          <option value="prominence" ${learnState.sort === 'prominence' ? 'selected' : ''}>bright & famous first</option>
          <option value="name" ${learnState.sort === 'name' ? 'selected' : ''}>a – z</option>
          <option value="progress" ${learnState.sort === 'progress' ? 'selected' : ''}>my progress</option>
          <option value="tonight" ${learnState.sort === 'tonight' ? 'selected' : ''}>highest tonight</option>
        </select>
      </div>
      <div class="tile-grid" id="grid"></div>
      `;
    const grid = $('#grid');
    const fill = () => {
      const q = learnState.q.trim().toLowerCase();
      let ids = ORDER.filter(id => !q || CONS[id].name.toLowerCase().includes(q) || meaning(id).toLowerCase().includes(q) || id.toLowerCase() === q);
      if (learnState.sort === 'name') ids = ids.slice().sort((a, b) => CONS[a].name.localeCompare(CONS[b].name));
      if (learnState.sort === 'progress') ids = ids.slice().sort((a, b) => SRS.mastery(b) - SRS.mastery(a));
      if (learnState.sort === 'tonight') ids = ids.slice().sort((a, b) => altAz(b, new Date()).alt - altAz(a, new Date()).alt);
      grid.innerHTML = ids.map(id => `
        <a class="tile" href="#learn/c/${id}">
          <canvas data-id="${id}"></canvas>
          <div class="tile-name">${esc(CONS[id].name)}</div>
          <div class="tile-sub">${esc(meaning(id))}</div>
          ${masteryDots(id)}
        </a>`).join('') || '<p class="muted">No match.</p>';
      requestAnimationFrame(() => $$('canvas[data-id]', grid).forEach(cv => drawCons(cv, cv.dataset.id, { pad: 0.8, starScale: 0.85, vignette: false })));
    };
    $('#q').addEventListener('input', e => { learnState.q = e.target.value; fill(); });
    $('#sort').addEventListener('change', e => { learnState.sort = e.target.value; fill(); });
    fill();
  }

  // ── Card (used on the Learn page and on the back of a flashcard) ──
  function detailsHTML(id, open) {
    const r = rich(id), t = tonight(id);
    const hops = CONTENT.hops.filter(h => h.from === id || h.to === id);
    const stars = CONS[id].stars.map(i => STARS[i]).filter(s => s[4] && !/^[α-ω]/.test(s[4]) && !/^[A-Za-z0-9]{1,3} [A-Z][A-Za-z]{2}$/.test(s[4])).sort((a, b) => a[2] - b[2]).slice(0, 6);
    return `<details class="more" ${open ? 'open' : ''}>
      <summary>when to see it &amp; how it's formed</summary>
      <div class="more-body">
        <h4>when</h4>
        <p><b>${r && r.best ? esc(r.best) : 'evenings around ' + esc(seasonOf(id))}</b>. ${esc(regionOf(id))}.</p>
        <div class="tonight ${t.up ? 'up' : ''}"><b>from ${esc(loc().place)}:</b> ${esc(t.text)} ${loc().isDefault ? '<a href="#sky">set your location →</a>' : ''}</div>
        <h4>how it's formed</h4>
        <p>${esc(r ? r.cue : `${CONS[id].stars.length} figure stars, the brightest at magnitude ${CONS[id].mag}. A faint pattern with no famous shape: learn it by position relative to its neighbours.`)}</p>
        ${r ? `<h4>how to find it</h4><p>${esc(r.find)}</p>` : ''}
        ${hops.length ? `<ul class="hops">${hops.map(h => `<li><a href="#learn/c/${h.from === id ? h.to : h.from}">${esc(CONS[h.from === id ? h.to : h.from].name)}</a> ${h.from === id ? '←' : '→'} ${esc(h.text)}</li>`).join('')}</ul>` : ''}
        ${r ? `<h4>remember it</h4><p>${esc(r.story)}</p>` : ''}
        ${stars.length ? `<h4>named stars</h4><p class="stars">${stars.map(s => `<span>${esc(s[4])} <small>${s[2].toFixed(1)}</small></span>`).join('')}</p>` : ''}
      </div>
    </details>`;
  }
  function cardHTML(id) {
    const c = CONS[id], r = rich(id);
    return `
      <article class="card">
        <div class="card-canvas-wrap">
          <canvas id="cardcv"></canvas>
          <div class="card-tools">
            <button data-tool="lines" class="on">lines</button>
            <button data-tool="labels" class="on">names</button>
            <button data-tool="field">field stars</button>
            <button data-tool="rot" title="rotate: learn it from every angle">rotate ↻</button>
          </div>
        </div>
        <div class="card-text">
          <div class="card-kicker">${masteryDots(id)} ${esc(LEVEL_NAMES[SRS.mastery(id)])}</div>
          <h1>${esc(c.name)} <small>${esc(c.gen)} · ${esc(id)}</small></h1>
          <div class="card-tag">${esc(r ? r.tag : meaning(id))}${r ? ` · <em>${esc(meaning(id))}</em>` : ''}</div>
          ${detailsHTML(id, false)}
        </div>
      </article>`;
  }
  function mountCard(id) {
    const cv = $('#cardcv'); const st = { lines: true, labels: true, field: false, rot: 0 };
    const draw = () => drawCons(cv, id, { rot: st.rot, field: st.field, labels: st.labels, lines: [{ id, hidden: !st.lines }], labelMag: 3.6 });
    $$('.card-tools button').forEach(b => b.addEventListener('click', () => {
      const t = b.dataset.tool;
      if (t === 'rot') { st.rot = (st.rot + 45 + Math.random() * 90) % 360; } else { st[t] = !st[t]; b.classList.toggle('on', st[t]); }
      draw();
    }));
    draw();
  }
  function renderCardPage(id) {
    if (!CONS[id]) return renderLearn();
    const idx = ORDER.indexOf(id), prev = ORDER[(idx - 1 + ORDER.length) % ORDER.length], next = ORDER[(idx + 1) % ORDER.length];
    view.innerHTML = `
      <div class="crumbs"><a href="#learn">all constellations</a> › ${esc(CONS[id].name)}</div>
      ${cardHTML(id)}
      <div class="card-nav">
        <a class="btn" href="#learn/c/${prev}">← ${esc(CONS[prev].name)}</a>
        <button class="btn primary" id="practice">practice this one</button>
        <a class="btn" href="#learn/c/${next}">${esc(CONS[next].name)} →</a>
      </div>`;
    mountCard(id);
    $('#practice').addEventListener('click', () => startSession({ single: id }));
  }

  // ── Train: setup ─────────────────────────────────────────────────
  let session = null;
  function renderTrainSetup() {
    const s = SRS.state.settings, due = SRS.dueItems().length;
    const fresh = ORDER.filter(id => SRS.get(id).level === 0);
    view.innerHTML = `
      <section class="setup">
        <h1>flashcards</h1>
        <p class="muted">${due ? `<b>${due}</b> due for review` : 'nothing due for review'} · <b>${Math.min(fresh.length, s.newPerSession)}</b> new${fresh.length ? ` (next up: ${fresh.slice(0, 3).map(id => esc(CONS[id].name)).join(', ')}${fresh.length > 3 ? '…' : ''})` : ''}</p>
        <div class="setup-grid">
          <label>new cards per session <span id="npsv">${s.newPerSession}</span>
            <input type="range" id="nps" min="0" max="10" value="${s.newPerSession}"></label>
          <label>sky darkness (faintest star shown) <span id="magv">${s.magLimit.toFixed(1)}</span>
            <input type="range" id="mag" min="3.5" max="6" step="0.1" value="${s.magLimit}">
            <small>4.0 ≈ suburban glow · 5.0 ≈ rural · 6.0 ≈ pristine</small></label>
          <label class="check"><input type="checkbox" id="tonight" ${s.tonightOnly ? 'checked' : ''}> prefer what's actually up tonight from ${esc(loc().place)}</label>
        </div>
        <button class="btn primary big" id="start">start session</button>
        <div class="stages">
          <h4>how a card works</h4>
          <p>You see a patch of sky and guess. Flip to check, then rate yourself: <b>missed</b> or <b>got it</b>. The difficulty bar above each card lets you switch any of these on or off; <b>auto</b> follows your progress:</p>
          <ol>${[1, 2, 3, 4, 5].map(i => `<li>${esc(STAGE[i].label.replace(/^Stage \d · /, ''))}</li>`).join('')}</ol>
          <p class="muted">Getting a card right at a harder setting moves it up the ladder; missing it drops it down and brings it back later in the session.</p>
        </div>
      </section>`;
    $('#nps').addEventListener('input', e => { s.newPerSession = +e.target.value; $('#npsv').textContent = s.newPerSession; SRS.save(); });
    $('#mag').addEventListener('input', e => { s.magLimit = +e.target.value; $('#magv').textContent = s.magLimit.toFixed(1); SRS.save(); });
    $('#tonight').addEventListener('change', e => { s.tonightOnly = e.target.checked; SRS.save(); });
    $('#start').addEventListener('click', () => startSession());
  }

  function startSession(opts = {}) {
    const s = SRS.state.settings;
    const queue = opts.single ? [{ id: opts.single, isNew: SRS.get(opts.single).level === 0 }] : SRS.buildSession(s.tonightOnly ? isUpTonight : null).queue;
    session = { queue, pos: 0, asked: 0, right: 0, seen: new Set(), retries: {} };
    SRS.state.stats.sessions++; SRS.save();
    if (location.hash !== '#train') location.hash = '#train'; else renderStep();
  }
  function renderStep() {
    window.scrollTo(0, 0);
    if (!session) return renderTrainSetup();
    if (session.pos >= session.queue.length) return renderSummary();
    renderFlashcard(session.queue[session.pos]);
  }

  // ── Train: flashcard ─────────────────────────────────────────────
  // Difficulty actually applied to a card: new cards always start with the outline.
  function cardDiff(item) {
    const d = SRS.state.settings.diff, lvl = SRS.get(item.id).level, isNew = lvl === 0;
    if (d.auto) {
      if (isNew) return Object.assign({}, STAGE[1], { stage: 1, label: 'new card · learn the outline, then flip' });
      const st = Math.max(1, Math.min(5, lvl)); return Object.assign({}, STAGE[st], { stage: st, label: STAGE[st].label + ' (auto)' });
    }
    const stage = d.find ? 5 : d.field ? 4 : d.rot ? 3 : !d.lines ? 2 : 1;
    return { lines: d.lines, rot: d.rot, field: d.field, find: d.find, stage, label: `${isNew ? 'new card · ' : ''}manual · counts as stage ${stage}` };
  }
  function makeQuestion(id, cfg) {
    const c = CONS[id];
    const q = { id, cfg, rot: cfg.rot ? A.rand(0, 360) : 0, magLimit: SRS.state.settings.magLimit, ra0: c.ra, dec0: c.dec };
    if (cfg.find) {
      q.fov = Math.max(25, Math.min(70, c.radius * 1.6 + 14));
      const ang = A.rand(0, 360), dist = A.rand(0, q.fov * 0.4) * A.D2R;
      const dec0 = c.dec * A.D2R + dist * Math.cos(ang * A.D2R);
      const ra0 = c.ra + (dist * Math.sin(ang * A.D2R)) / Math.max(0.2, Math.cos(dec0)) * A.R2D;
      q.ra0 = ((ra0 % 360) + 360) % 360; q.dec0 = Math.max(-89, Math.min(89, dec0 * A.R2D));
    } else {
      q.fov = Math.max(c.radius * 1.25, 5) * (cfg.rot ? A.rand(0.95, 1.35) : 1);
    }
    return q;
  }
  function drawQuestion(q, reveal) {
    const cv = $('#qc');
    const lines = reveal ? [{ id: q.id, color: '#FFB020', width: 2 }] : [{ id: q.id, hidden: !q.cfg.lines }];
    return R.drawChart(cv, { ra0: q.ra0, dec0: q.dec0, fov: q.fov, rot: q.rot, field: q.cfg.field, lines, labels: !!reveal, labelMag: 2.8, magLimit: q.magLimit });
  }
  function diffBarHTML() {
    const d = SRS.state.settings.diff;
    const b = (k, label) => `<button data-diff="${k}" class="${(k === 'auto' ? d.auto : !d.auto && d[k]) ? 'on' : ''}">${label}</button>`;
    return `<div class="diff-bar">
      <span class="diff-label">difficulty</span>
      ${b('auto', 'auto')}<span class="sep"></span>${b('lines', 'lines')}${b('rot', 'rotate')}${b('field', 'field stars')}${b('find', 'wide field')}
      <label class="diff-mag">sky <input type="range" id="dmag" min="3.5" max="6" step="0.1" value="${SRS.state.settings.magLimit}"><span id="dmagv">${SRS.state.settings.magLimit.toFixed(1)}</span></label>
    </div>`;
  }
  function renderFlashcard(item) {
    const cfg = cardDiff(item); const q = makeQuestion(item.id, cfg); session.current = q;
    const n = session.queue.length, i = session.pos + 1;
    view.innerHTML = `<section class="train">
      <div class="q-top"><span>${i} / ${n}</span><span class="q-stage">${esc(cfg.label)}</span><span>${SRS.state.stats.streak ? '🔥 ' + SRS.state.stats.streak : ''}</span></div>
      <div class="q-bar"><i style="width:${100 * session.pos / n}%"></i></div>
      ${diffBarHTML()}
      <div class="q-canvas-wrap ${cfg.find ? 'find' : ''}"><canvas id="qc"></canvas>
        <div class="q-prompt" id="qprompt">${cfg.find ? `where is <b>${esc(CONS[q.id].name)}</b>?` : SRS.get(q.id).level === 0 ? `<b>${esc(CONS[q.id].name)}</b> · ${esc(meaning(q.id))}` : 'what constellation is this?'}</div></div>
      <div class="flash-back" id="back" hidden></div>
      <div class="q-actions" id="acts"><button class="btn primary big" id="flip">flip <kbd>space</kbd></button></div>
    </section>`;
    drawQuestion(q);
    $$('[data-diff]').forEach(b => b.addEventListener('click', () => {
      const d = SRS.state.settings.diff, k = b.dataset.diff;
      if (k === 'auto') d.auto = true;
      else {
        if (d.auto) { d.auto = false; Object.assign(d, { lines: cfg.lines, rot: cfg.rot, field: cfg.field, find: cfg.find }); }
        d[k] = !d[k];
        if (k === 'find' && d.find) { d.field = true; d.rot = true; d.lines = false; }   // a wide-field search implies the rest
        if (k === 'lines' && d.lines) d.find = false;                                  // outlines make a search pointless
      }
      SRS.save(); renderFlashcard(item);
    }));
    $('#dmag').addEventListener('input', e => { SRS.state.settings.magLimit = +e.target.value; $('#dmagv').textContent = (+e.target.value).toFixed(1); q.magLimit = +e.target.value; SRS.save(); drawQuestion(q); });
    $('#flip').addEventListener('click', () => flip(q));
    keyHandler = e => { if (e.target.tagName === 'INPUT') return; if (!q.flipped && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); flip(q); } else if (q.flipped && !q.done) { if (e.key === 'x' || e.key === 'X') grade(q, false); if (e.key === 'c' || e.key === 'C') grade(q, true); } };
  }
  let keyHandler = null;
  addEventListener('keydown', e => { if (keyHandler) keyHandler(e); });

  function flip(q) {
    if (q.flipped) return; q.flipped = true;
    drawQuestion(q, true);
    const r = rich(q.id);
    $('#qprompt').innerHTML = `<b>${esc(CONS[q.id].name)}</b> · ${esc(meaning(q.id))}`;
    const back = $('#back'); back.hidden = false;
    back.innerHTML = `<div class="flash-name"><h2>${esc(CONS[q.id].name)}</h2><span class="muted">${esc(CONS[q.id].gen)} · ${esc(r ? r.tag : meaning(q.id))}</span></div>${detailsHTML(q.id, false)}`;
    $('#acts').innerHTML = `<button class="btn bad" id="miss">missed <kbd>x</kbd></button><button class="btn good" id="hit">got it <kbd>c</kbd></button>`;
    $('#miss').addEventListener('click', () => grade(q, false));
    $('#hit').addEventListener('click', () => grade(q, true));
  }
  function grade(q, correct) {
    if (q.done) return; q.done = true; keyHandler = null;
    const it = SRS.answer(q.id, correct, q.cfg.stage);
    session.asked++; if (correct) session.right++; session.seen.add(q.id);
    if (!correct) { const rc = session.retries[q.id] || 0; if (rc < 2) { session.retries[q.id] = rc + 1; session.queue.splice(Math.min(session.queue.length, session.pos + 3), 0, { id: q.id, retry: true }); } }
    const acts = $('#acts');
    acts.innerHTML = `<span class="grade-note ${correct ? 'ok' : 'bad'}">${correct ? '✓' : '✗'} ${esc(CONS[q.id].name)} → ${esc(LEVEL_NAMES[SRS.mastery(q.id)])}${correct ? '' : ' · comes back later this session'}</span><button class="btn primary" id="next">next <kbd>space</kbd></button>`;
    void it;
    $('#next').addEventListener('click', next); $('#next').focus();
    keyHandler = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); } };
  }
  function next() { session.pos++; renderStep(); }

  function renderSummary() {
    keyHandler = null;
    const ids = [...session.seen]; const up = ids.filter(isUpTonight);
    const acc = session.asked ? Math.round(100 * session.right / session.asked) : 0;
    view.innerHTML = `<section class="summary">
      <h1>session complete</h1>
      <div class="tiles"><div><b>${session.asked}</b><span>cards</span></div><div><b>${acc}%</b><span>got it</span></div><div><b>${SRS.state.stats.best}</b><span>best streak</span></div><div><b>${SRS.dueItems().length}</b><span>still due</span></div></div>
      <h4>what you worked on</h4>
      <div class="chips">${ids.map(id => `<a class="chip" href="#learn/c/${id}">${esc(CONS[id].name)} ${masteryDots(id)}</a>`).join('')}</div>
      ${up.length ? `<div class="tonight up"><b>go outside:</b> ${up.map(id => { const v = altAz(id, eveningDate()); return `${esc(CONS[id].name)} (${v.dir}, ${Math.round(v.alt)}°)`; }).join(' · ')} ${up.length > 1 ? 'are' : 'is'} up at 9 pm tonight from ${esc(loc().place)}. <a href="#sky">open the sky map →</a></div>` : ''}
      <div class="q-actions"><button class="btn primary big" id="again">another session</button><a class="btn" href="#learn">all constellations</a></div>
    </section>`;
    session = null;
    $('#again').addEventListener('click', () => startSession());
  }

  // ── Sky now ──────────────────────────────────────────────────────
  const skyState = { offsetH: 0, lines: true, labels: true, onlyLearned: false, highlight: null };
  let skyTick = null;
  function renderSky() {
    const s = SRS.state.settings, l = loc();
    view.innerHTML = `<section class="sky">
      <div class="sky-controls">
        <div class="ctl">
          <button class="btn small" id="geo">📍 use my location</button>
          <label>lat <input type="number" id="lat" step="0.1" min="-90" max="90" value="${l.lat.toFixed(2)}"></label>
          <label>lon <input type="number" id="lon" step="0.1" min="-180" max="180" value="${l.lon.toFixed(2)}"></label>
          <span class="muted" id="place">${esc(l.place)}</span>
        </div>
        <div class="ctl">
          <button class="btn small" id="now">now</button>
          <input type="range" id="toff" min="-12" max="12" step="0.25" value="${skyState.offsetH}">
          <span id="tlabel"></span>
        </div>
        <div class="ctl toggles">
          <label><input type="checkbox" id="tl" ${skyState.lines ? 'checked' : ''}> lines</label>
          <label><input type="checkbox" id="tn" ${skyState.labels ? 'checked' : ''}> names</label>
          <label><input type="checkbox" id="tk" ${skyState.onlyLearned ? 'checked' : ''}> only what I've studied</label>
        </div>
      </div>
      <div class="sky-main">
        <div class="dome-wrap"><canvas id="dome"></canvas><div class="dome-hint">hold it overhead: north at top, east on the left. tap a constellation.</div></div>
        <aside class="sky-info" id="skyinfo"></aside>
      </div>
    </section>`;
    let dome = null;
    const draw = () => {
      const date = new Date(Date.now() + skyState.offsetH * 3600000);
      $('#tlabel').textContent = date.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
      const lv = {}; for (const id in CONS) lv[id] = SRS.mastery(id);
      const { lat, lon } = loc();
      dome = R.drawDome($('#dome'), { lat, lon, date, lines: skyState.lines, labels: skyState.labels, level: lv, highlight: skyState.highlight, onlyLearned: skyState.onlyLearned, magLimit: Math.min(5, s.magLimit) });
      renderSkyInfo(date);
    };
    $('#geo').addEventListener('click', () => {
      if (!navigator.geolocation) return alert('Geolocation is not available in this browser. Type your latitude and longitude instead.');
      $('#geo').textContent = 'locating…';
      navigator.geolocation.getCurrentPosition(p => { s.lat = +p.coords.latitude.toFixed(3); s.lon = +p.coords.longitude.toFixed(3); s.place = ''; SRS.save(); renderSky(); },
        () => { $('#geo').textContent = 'location denied: type it in'; });
    });
    const setLL = () => { const la = parseFloat($('#lat').value), lo = parseFloat($('#lon').value); if (isFinite(la) && isFinite(lo)) { s.lat = Math.max(-90, Math.min(90, la)); s.lon = Math.max(-180, Math.min(180, lo)); s.place = ''; SRS.save(); $('#place').textContent = loc().place; draw(); } };
    $('#lat').addEventListener('change', setLL); $('#lon').addEventListener('change', setLL);
    $('#now').addEventListener('click', () => { skyState.offsetH = 0; $('#toff').value = 0; draw(); });
    $('#toff').addEventListener('input', e => { skyState.offsetH = +e.target.value; draw(); });
    $('#tl').addEventListener('change', e => { skyState.lines = e.target.checked; draw(); });
    $('#tn').addEventListener('change', e => { skyState.labels = e.target.checked; draw(); });
    $('#tk').addEventListener('change', e => { skyState.onlyLearned = e.target.checked; draw(); });
    $('#dome').addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(); skyState.highlight = dome.hit(e.clientX - r.left, e.clientY - r.top); draw(); });
    addEventListener('resize', () => { if ($('#dome')) draw(); }, { passive: true });
    draw();
    clearInterval(skyTick); skyTick = setInterval(() => { if (location.hash.startsWith('#sky') && skyState.offsetH === 0 && $('#dome')) draw(); }, 60000);
  }
  function renderSkyInfo(date) {
    const el = $('#skyinfo'); const { lat, lon } = loc(); const L = A.lst(date, lon);
    const up = Object.keys(CONS).map(id => { const c = CONS[id]; const r = A.altaz(c.ra, c.dec, lat, L); return { id, alt: r.alt, dir: A.compass(r.az) }; }).filter(x => x.alt > 5).sort((a, b) => b.alt - a.alt);
    const due = new Set(SRS.dueItems()); const dueUp = up.filter(x => due.has(x.id));
    const h = skyState.highlight;
    el.innerHTML = `
      ${h ? (() => { const v = up.find(x => x.id === h) || altAz(h, date); const r = rich(h); return `<div class="sky-sel"><div class="card-kicker">${masteryDots(h)} ${esc(LEVEL_NAMES[SRS.mastery(h)])}</div><h3>${esc(CONS[h].name)}</h3><p class="muted">${esc(meaning(h))} · ${esc(v.dir)}, ${Math.round(v.alt)}° up</p>${r ? `<p>${esc(r.cue)}</p>` : ''}<a class="btn small" href="#learn/c/${h}">open card →</a></div>`; })() : ''}
      ${dueUp.length ? `<div class="tonight up"><b>due for review and up right now:</b> ${dueUp.map(x => `<a href="#learn/c/${x.id}">${esc(CONS[x.id].name)}</a>`).join(', ')}. <a href="#train">train →</a></div>` : ''}
      <h4>above the horizon <span class="muted">(${up.length})</span></h4>
      <ul class="uplist">${up.map(x => `<li data-id="${x.id}" class="${SRS.mastery(x.id) ? 'known' : ''}"><span>${esc(CONS[x.id].name)}</span><span class="muted">${x.dir} · ${Math.round(x.alt)}°</span>${masteryDots(x.id)}</li>`).join('')}</ul>`;
    $$('.uplist li').forEach(li => li.addEventListener('click', () => { skyState.highlight = li.dataset.id; renderSky(); }));
  }

  // ── Progress ─────────────────────────────────────────────────────
  function renderProgress() {
    const st = SRS.state.stats;
    const studied = SRS.studied().length, mastered = ORDER.filter(id => SRS.mastery(id) === 6).length, due = SRS.dueItems().length;
    const acc = st.answered ? Math.round(100 * st.correct / st.answered) : 0;
    const days = Object.keys(st.days).length;
    let dstreak = 0; { const d = new Date(); for (let i = 0; i < 400; i++) { const k = d.toISOString().slice(0, 10); if (st.days[k]) dstreak++; else if (i > 0) break; d.setDate(d.getDate() - 1); } }
    view.innerHTML = `<section class="progress">
      <h1>progress</h1>
      <div class="tiles"><div><b>${studied}</b><span>studied of 88</span></div><div><b>${mastered}</b><span>mastered</span></div><div><b>${due}</b><span>due now</span></div><div><b>${acc}%</b><span>got it</span></div><div><b>${dstreak}</b><span>day streak</span></div><div><b>${st.answered}</b><span>cards rated</span></div></div>
      <h4>all 88</h4>
      <div class="prog-grid">${ORDER.map(id => { const it = SRS.get(id); const m = SRS.mastery(id); const dueIn = it.level ? Math.ceil((it.due - Date.now()) / 86400000) : null; return `<a class="prog ${m === 6 ? 'gold' : m ? 'on' : ''}" href="#learn/c/${id}" title="${esc(LEVEL_NAMES[m])}${dueIn != null ? ' · ' + (dueIn <= 0 ? 'due now' : 'due in ' + dueIn + 'd') : ''}"><span>${esc(CONS[id].name)}</span>${masteryDots(id)}</a>`; }).join('')}</div>
      <div class="tools">
        <button class="btn small" id="exp">export progress</button>
        <label class="btn small">import <input type="file" id="imp" accept="application/json" hidden></label>
        <button class="btn small danger" id="reset">reset everything</button>
      </div>
      <p class="muted small">Progress is stored in this browser only. Export it to move between devices. ${days} practice day${days === 1 ? '' : 's'} so far.</p>
    </section>`;
    $('#exp').addEventListener('click', () => { const b = new Blob([SRS.exportJSON()], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'sky-trainer-progress.json'; a.click(); });
    $('#imp').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { SRS.importJSON(t); renderProgress(); } catch (err) { alert(err.message); } }); });
    $('#reset').addEventListener('click', () => { if (confirm('Erase all progress? This cannot be undone.')) { SRS.reset(); renderProgress(); } });
  }

  // ── Onboarding ───────────────────────────────────────────────────
  function onboard() {
    const m = document.getElementById('modal'); m.hidden = false;
    m.innerHTML = `<div class="modal">
      <h2>welcome to sky trainer</h2>
      <p>By the end you will pick constellations out of a real sky: upside down, half-hidden in faint stars, from wherever you happen to be.</p>
      <ol class="steps">
        <li><b>flashcards.</b> See a patch of sky, guess, flip, rate yourself. New cards start with the outline drawn.</li>
        <li><b>make it harder.</b> Take the lines away, spin the sky, add field stars, then search a wide field. Auto mode does this for you as you improve.</li>
        <li><b>check the real sky.</b> A live map for your location shows what is up right now, so you can go outside and find it.</li>
      </ol>
      <p class="muted small">Your location is only used to compute what is above your horizon. It never leaves this browser.</p>
      <div class="q-actions">
        <button class="btn primary" id="ob-geo">📍 use my location & start</button>
        <button class="btn" id="ob-skip">start without location</button>
      </div></div>`;
    const done = () => { SRS.state.onboarded = true; SRS.save(); m.hidden = true; route(); };
    $('#ob-skip').addEventListener('click', done);
    $('#ob-geo').addEventListener('click', () => {
      if (!navigator.geolocation) return done();
      $('#ob-geo').textContent = 'locating…';
      navigator.geolocation.getCurrentPosition(p => { const s = SRS.state.settings; s.lat = +p.coords.latitude.toFixed(3); s.lon = +p.coords.longitude.toFixed(3); s.place = ''; done(); }, done);
    });
  }

  route();
  if (!SRS.state.onboarded) onboard();
})();
