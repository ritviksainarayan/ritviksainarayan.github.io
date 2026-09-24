// Spaced-repetition scheduler (SM-2 style) + mastery ladder + session builder.
window.SKY = window.SKY || {};
(function (S) {
  const KEY = 'skytrainer.v1';
  const A = S.astro, CONS = window.SKY_DATA.constellations, CONTENT = window.SKY_CONTENT;
  const DAY = 86400000;

  const defaults = () => ({
    items: {},
    settings: { newPerSession: 4, magLimit: 5.0, lat: null, lon: null, place: '', tonightOnly: false, diff: { auto: true, lines: true, rot: false, field: false, find: false } },
    stats: { answered: 0, correct: 0, streak: 0, best: 0, days: {}, sessions: 0 },
    onboarded: false,
  });
  let state = load();

  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw); return Object.assign(defaults(), s, { settings: Object.assign(defaults().settings, s.settings || {}, { diff: Object.assign(defaults().settings.diff, (s.settings || {}).diff || {}) }), stats: Object.assign(defaults().stats, s.stats || {}) }); } } catch (e) { /* ignore */ }
    return defaults();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

  const fresh = () => ({ level: 0, ef: 2.5, interval: 0, due: 0, reps: 0, lapses: 0, correct: 0, wrong: 0, confusions: {}, last: 0 });
  function get(id) { return state.items[id] || fresh(); }
  function touch(id) { if (!state.items[id]) state.items[id] = fresh(); return state.items[id]; }
  function studied() { return Object.keys(state.items).filter(id => state.items[id].level > 0); }
  function dueItems(now = Date.now()) { return studied().filter(id => state.items[id].due <= now).sort((a, b) => state.items[a].due - state.items[b].due); }
  function isMastered(id) { const it = get(id); return it.level >= 5 && it.interval >= 7; }
  function mastery(id) { return isMastered(id) ? 6 : get(id).level; }   // 0 new · 1-5 ladder · 6 mastered

  // Mark a constellation as introduced (study card seen).
  function introduce(id) { const it = touch(id); if (it.level === 0) { it.level = 1; it.due = Date.now(); } save(); }

  // Grade a flashcard. stage = difficulty it was shown at (1-5). Correct at stage s lifts the
  // ladder to s+1 at most; a miss drops it to below the stage it failed at.
  function answer(id, correct, stage = 1) {
    const it = touch(id), now = Date.now();
    const day = new Date().toISOString().slice(0, 10);
    state.stats.answered++; state.stats.days[day] = (state.stats.days[day] || 0) + 1;
    if (correct) {
      state.stats.correct++; state.stats.streak++; state.stats.best = Math.max(state.stats.best, state.stats.streak);
      it.correct++; it.reps++;
      if (it.reps === 1) it.interval = 1; else if (it.reps === 2) it.interval = 3; else it.interval = Math.round(it.interval * it.ef);
      it.ef = Math.min(3.0, it.ef + 0.08);
      it.level = Math.min(5, Math.max(it.level, stage + 1));
      it.due = now + it.interval * DAY * A.rand(0.9, 1.15);
    } else {
      state.stats.streak = 0; it.wrong++; it.lapses++;
      it.interval = 0; it.reps = 0; it.due = now;
      it.ef = Math.max(1.3, it.ef - 0.2);
      it.level = Math.max(1, Math.min(it.level - 1, stage));
    }
    it.last = now; save();
    return it;
  }

  /**
   * Build a session from one pool: due reviews first, then new cards in prominence order, interleaved.
   * visibleFilter: optional fn(id) → bool to prefer what's up tonight.
   */
  function buildSession(visibleFilter) {
    const pool = CONTENT.order, now = Date.now();
    let due = dueItems(now);
    let fresh = pool.filter(id => get(id).level === 0);
    if (visibleFilter) { const d2 = due.filter(visibleFilter), f2 = fresh.filter(visibleFilter); if (d2.length + f2.length) { due = d2; fresh = f2; } }
    due = A.shuffle(due).slice(0, 14);
    fresh = fresh.slice(0, state.settings.newPerSession);
    if (due.length + fresh.length < 6) {
      const extra = A.shuffle(pool.filter(id => get(id).level > 0 && !due.includes(id))).slice(0, 6 - due.length - fresh.length);
      due = due.concat(extra);
    }
    const queue = due.map(id => ({ id, isNew: false }));
    const step = Math.max(1, Math.floor((queue.length + 1) / (fresh.length + 1)));
    fresh.forEach((id, i) => queue.splice(Math.min(queue.length, i * step + i), 0, { id, isNew: true }));
    return { queue };
  }

  function exportJSON() { return JSON.stringify(state, null, 1); }
  function importJSON(text) { const s = JSON.parse(text); if (!s.items) throw new Error('Not a Sky Trainer export'); state = Object.assign(defaults(), s); save(); }
  function reset() { state = defaults(); save(); }

  S.srs = { get state() { return state; }, save, get, touch, studied, dueItems, isMastered, mastery, introduce, answer, buildSession, exportJSON, importJSON, reset };
})(window.SKY);
