/* =============================================
   SPACE THEME — Interactive Solar System
   ============================================= */

// ── Starfield ─────────────────────────────────
(function () {
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    buildStars();
  }

  function buildStars() {
    const count = Math.floor((canvas.width * canvas.height) / 4500);
    stars = Array.from({ length: count }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 1.2 + 0.2,
      base:  Math.random() * 0.6 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.012 + 0.004,
    }));
  }

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      const opacity = s.base + 0.3 * Math.sin(s.phase + t * s.speed);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${opacity.toFixed(3)})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
})();

// ── Panel logic ───────────────────────────────
const panel     = document.getElementById('panel');
const panelBody = document.getElementById('panel-body');
const solarView = document.getElementById('solar-system-view');
const panelDot  = document.getElementById('panel-dot');
const panelName = document.getElementById('panel-name');

const SECTIONS = {
  about:    { name: 'About',    dotColor: '#FFB020', render: renderAbout    },
  contact:  { name: 'Contact',  dotColor: '#48C8E0', render: renderContact  },
  cv:       { name: 'CV',       dotColor: '#E88A5A', render: renderCV       },
  research: { name: 'Research', dotColor: '#E8B860', render: renderResearch },
};

// origin: DOM element OR {x, y} screen-pixel coords
window.openPanel = function (key, origin) {
  const sec = SECTIONS[key];
  if (!sec) return;

  let cx = '50%', cy = '50%';
  if (origin) {
    if (origin.nodeType) {
      const el = origin.querySelector('.planet') || origin;
      const r  = el.getBoundingClientRect();
      cx = Math.round(r.left + r.width  / 2) + 'px';
      cy = Math.round(r.top  + r.height / 2) + 'px';
    } else if (typeof origin.x === 'number') {
      cx = origin.x + 'px';
      cy = origin.y + 'px';
    }
  }
  panel.style.setProperty('--cx', cx);
  panel.style.setProperty('--cy', cy);

  panelDot.style.background = sec.dotColor;
  panelDot.style.boxShadow  = `0 0 8px ${sec.dotColor}`;
  panelName.textContent      = sec.name;

  panelBody.innerHTML = '';
  const inner = document.createElement('div');
  inner.className = 'panel-inner';
  sec.render(inner);
  panelBody.appendChild(inner);
  panelBody.scrollTop = 0;

  solarView.style.pointerEvents = 'none';
  requestAnimationFrame(() => panel.classList.add('open'));
  history.pushState({ section: key }, '', `#${key}`);
};

window.closePanel = function () {
  panel.classList.remove('open');
  solarView.style.pointerEvents = '';
  history.pushState({}, '', location.pathname);
};

window.addEventListener('popstate', e => {
  if (panel.classList.contains('open')) {
    panel.classList.remove('open');
    solarView.style.pointerEvents = '';
  }
  if (e.state && e.state.section) openPanel(e.state.section);
});

window.addEventListener('DOMContentLoaded', () => {
  const hash = location.hash.replace('#', '');
  if (SECTIONS[hash]) openPanel(hash);
});

// ── Section Renderers ─────────────────────────

function renderAbout(el) {
  el.innerHTML = `
    <h1 class="section-h1">Ritvik Sai Narayan</h1>
    <div class="about-grid">
      <div class="about-profile">
        <img src="assets/img/profile/profile.jpeg" alt="Ritvik Sai Narayan" class="profile-img">
        <div class="social-icons">
          <a href="https://www.linkedin.com/in/ritviksainarayan/" target="_blank" rel="noopener" class="social-icon" title="LinkedIn"><i class="bi bi-linkedin"></i></a>
          <a href="https://github.com/ritviksainarayan" target="_blank" rel="noopener" class="social-icon" title="GitHub"><i class="bi bi-github"></i></a>
          <a href="https://orcid.org/0009-0007-0488-5685" target="_blank" rel="noopener" class="social-icon" title="ORCID"><i class="fa-brands fa-orcid"></i></a>
        </div>
      </div>
      <div class="about-bio">
        <p>I am an incoming PhD student at <a href="https://physics.mit.edu/" target="_blank" rel="noopener">MIT</a> working on exoplanet and stellar astronomy, having double-majored in Astrophysics and Economics at the <a href="https://www.astro.wisc.edu/" target="_blank" rel="noopener">University of Wisconsin–Madison</a>.</p>
        <p>I like thinking about the evolution of stars and exoplanets, from both observational and theoretical lenses. I also enjoy the data science and computational aspects of modern astronomy, and care about how to effectively communicate science results with meaningful visualizations.</p>
        <p>In my free time, I enjoy working out, binge-watching copious amounts of TV, and mindlessly supporting a Formula 1 team (<em>Forza Ferrari!</em>).</p>
      </div>
    </div>
  `;
}

function renderResearch(el) {
  el.innerHTML = `
    <h1 class="section-h1">Research</h1>
    <p style="font-size:1rem;line-height:1.9;color:#C8D8E0;margin-bottom:2rem">
      I am broadly interested in the lives of stars and the planets that orbit them — from how they form and evolve, to how we observe and characterize them. My work spans both observational and theoretical approaches, with a strong emphasis on data science and scientific visualization.
    </p>
    <div class="research-areas">
      <div class="research-area-card">
        <div class="ra-icon">✦</div>
        <div>
          <h2 class="section-h2">Exoplanet Astronomy</h2>
          <p>Predicting and characterizing exoplanet populations, including transit yield forecasts for upcoming surveys with the <a href="https://roman.gsfc.nasa.gov/" target="_blank" rel="noopener">Nancy Grace Roman Space Telescope</a>.</p>
        </div>
      </div>
      <div class="research-area-card">
        <div class="ra-icon">✦</div>
        <div>
          <h2 class="section-h2">Stellar Evolution &amp; Binary Stars</h2>
          <p>Understanding how stars deviate from standard single-star evolutionary tracks. In particular, how mass transfer between binary companions produces interesting stellar populations like Blue Straggler Stars, and what the remnant white dwarfs tell us about those interactions.</p>
        </div>
      </div>
      <div class="research-area-card">
        <div class="ra-icon">✦</div>
        <div>
          <h2 class="section-h2">Data Science &amp; Visualization</h2>
          <p>Applying statistical and computational tools to large astronomical datasets. I care deeply about how science results are communicated — clear, meaningful visualizations are part of the science, not an afterthought.</p>
        </div>
      </div>
    </div>
    <p style="margin-top:2rem;font-size:0.85rem;color:var(--text-muted)">Full research page coming soon.</p>
  `;
}

function renderCV(el) {
  el.innerHTML = `
    <h1 class="section-h1">Curriculum Vitae</h1>
    <div class="cv-wrap">
      <iframe src="cv.pdf#view=FitH" title="Ritvik Sai Narayan — CV"></iframe>
    </div>
  `;
}

function renderContact(el) {
  el.innerHTML = `
    <h1 class="section-h1">Contact</h1>
    <div class="contact-card">
      <p style="color:var(--text-muted);font-size:0.88rem">You can reach me at</p>
      <a href="mailto:rnarayan4@wisc.edu" class="contact-email">rnarayan4 [at] wisc [dot] edu</a>
      <div style="margin-top:2rem;display:flex;justify-content:center;gap:1rem">
        <a href="https://www.linkedin.com/in/ritviksainarayan/" target="_blank" rel="noopener" class="social-icon" title="LinkedIn"><i class="bi bi-linkedin"></i></a>
        <a href="https://github.com/ritviksainarayan" target="_blank" rel="noopener" class="social-icon" title="GitHub"><i class="bi bi-github"></i></a>
        <a href="https://orcid.org/0009-0007-0488-5685" target="_blank" rel="noopener" class="social-icon" title="ORCID"><i class="fa-brands fa-orcid"></i></a>
      </div>
    </div>
    <p style="text-align:center;margin-top:2rem;font-size:0.75rem;color:var(--text-muted)">&copy; 2025 Ritvik Sai Narayan</p>
  `;
}

// ═══════════════════════════════════════════════════════════════════════
//  SINGLE-CANVAS 3-D SOLAR SYSTEM
//
//  All rendering — orbit ellipses, star, and planets — is done on one
//  canvas element (#solar-canvas) that fills the viewport.  No CSS
//  animation transforms are involved, so z-index/timing bugs cannot
//  occur.  3-D tilt is applied in JS via coordinate math each frame.
// ═══════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ── DOM refs ────────────────────────────────────────────────────────
  const SC      = document.getElementById('solar-canvas');   // main canvas
  const ctx     = SC.getContext('2d');
  const lcBtn   = document.getElementById('lc-btn');
  const lcPanel = document.getElementById('lc-panel');
  const lcCv    = document.getElementById('lc-canvas');

  const T0  = performance.now();
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  // ── 3-D view state ──────────────────────────────────────────────────
  let tiltX = 20, az = 0;   // degrees

  // ── Deterministic noise table ────────────────────────────────────────
  const NW   = 256;
  const NTAB = new Float32Array(NW * NW);
  (function () {
    let s = 0xDEADBEEF | 0;
    for (let i = 0; i < NTAB.length; i++) {
      s = Math.imul(s, 1664525) + 1013904223 | 0;
      NTAB[i] = ((s >>> 8) & 0xFFFFFF) / 16777215.0;
    }
  })();

  function tn(xi, yi)  { return NTAB[((yi & 255) << 8) | (xi & 255)]; }
  function noise2(x, y) {
    const ix = x | 0, iy = y | 0;
    const fx = x - ix, fy = y - iy;
    const ux = fx*fx*(3-2*fx), uy = fy*fy*(3-2*fy);
    return tn(ix,iy)*(1-ux)*(1-uy) + tn(ix+1,iy)*ux*(1-uy)
         + tn(ix,iy+1)*(1-ux)*uy   + tn(ix+1,iy+1)*ux*uy;
  }
  function fbm(x, y) {
    return noise2(x, y)                   * 0.572
         + noise2(x*2.1+5.3,  y*2.1+1.7) * 0.286
         + noise2(x*4.4+11.1, y*4.4+7.3) * 0.142;
  }

  // ── Procedural texture sampler ───────────────────────────────────────
  // type: 0=Earth  1=Mars  2=Jupiter  3=Sun
  function texSample(type, u, v) {
    const lat  = (v - 0.5) * Math.PI;
    const aLat = Math.abs(lat);

    // ── Earth ──────────────────────────────────────────────────────────
    if (type === 0) {
      if (aLat > 1.33) return [238, 245, 255];
      const ice = Math.max(0, (aLat - 1.10) / 0.23);
      const n   = fbm(u * 5.2, v * 3.1) * 0.68 + fbm(u * 14 + 2.1, v * 10 + 3.3) * 0.32;
      let r, g, b;
      if (n > 0.52) {
        const t = (n - 0.52) / 0.48;
        if (aLat > 0.9) { r = 115+t*62; g = 125+t*55; b = 78+t*40; }
        else             { r =  22+t*98; g =  78+t*60; b = 12+t*28; }
      } else {
        const dep = n / 0.52;
        r = 4+dep*14; g = 40+dep*92; b = 125+dep*95;
      }
      r += (238-r)*ice; g += (245-g)*ice; b += (255-b)*ice;
      const cl = Math.pow(fbm(u * 9 + 0.5, v * 7 + 4), 2.8) * 0.45;
      r += (255-r)*cl; g += (255-g)*cl; b += (255-b)*cl;
      return [r | 0, g | 0, b | 0];
    }

    // ── Mars ────────────────────────────────────────────────────────────
    if (type === 1) {
      if (aLat > 1.38) return [232, 218, 205];
      const ice = Math.max(0, (aLat - 1.17) / 0.21);
      const n1  = fbm(u * 4.1, v * 3.2), n2 = fbm(u * 9.3 + 3.7, v * 8.1 + 2.2);
      let r = 172+n1*68, g = 55+n1*42, b = 16+n1*18;
      if (n2 < 0.37) { const d = (0.37-n2)/0.37; r -= d*72; g -= d*32; b -= d*10; }
      r += (232-r)*ice; g += (218-g)*ice; b += (205-b)*ice;
      return [Math.max(0,r)|0, Math.max(0,g)|0, Math.max(0,b)|0];
    }

    // ── Jupiter ─────────────────────────────────────────────────────────
    if (type === 2) {
      const turb = fbm(u * 6, v * 14) * 0.18;
      const bv   = ((Math.sin((v + turb) * Math.PI * 13) + 1) * 0.5);
      const pal  = [[82,36,8],[178,95,35],[232,182,105],[208,152,65],[132,68,18],[220,165,88]];
      const pi   = bv * (pal.length - 1);
      const i0   = Math.min(pi | 0, pal.length - 2);
      const t    = pi - i0;
      const c0   = pal[i0], c1 = pal[i0 + 1];
      let r = c0[0]+(c1[0]-c0[0])*t, g = c0[1]+(c1[1]-c0[1])*t, b = c0[2]+(c1[2]-c0[2])*t;
      const gU = 0.65, gV = 0.39;
      const dU = Math.min(Math.abs(u-gU), 1-Math.abs(u-gU));
      const gd = Math.sqrt((dU/0.082)**2 + ((v-gV)/0.052)**2);
      if (gd < 1) { const q = 1-gd*gd; r += (178-r)*q; g += (48-g)*q; b += (15-b)*q; }
      return [r|0, g|0, b|0];
    }

    // ── Sun ─────────────────────────────────────────────────────────────
    const gran   = fbm(u * 28, v * 28);
    const coarse = fbm(u * 9 + 2, v * 9 + 4);
    let spt = 1.0;
    for (const [su, sv] of [[0.22,0.51],[0.60,0.47],[0.76,0.55]]) {
      const sdU = Math.min(Math.abs(u-su), 1-Math.abs(u-su));
      const sd  = Math.sqrt(sdU*sdU + (v-sv)*(v-sv)) / 0.036;
      if (sd < 1) spt = Math.min(spt, 0.38 + 0.62*sd*sd);
    }
    const br = (0.68 + gran*0.22 + coarse*0.10) * spt;
    return [Math.min(255,255*br)|0, Math.min(255,(195+gran*30)*br)|0, Math.min(255,(55+gran*22)*br)|0];
  }

  // ── Sphere rasterizer ────────────────────────────────────────────────
  // Renders body b to its offscreen canvas using Phong shading.
  function renderSphere(b) {
    const c   = b.offscreen;
    const sCtx = b.offCtx;
    const w   = c.width, h = c.height;
    if (w < 4 || h < 4) return;

    const cx = w * 0.5, cy = h * 0.5;
    const r  = Math.min(w, h) * 0.485;
    const iR = 1.0 / r;

    // Light from upper-left (toward viewer)
    const LX = -0.42, LY = -0.56, LZ = 0.72;
    const LL  = Math.sqrt(LX*LX + LY*LY + LZ*LZ);
    const lxL = LX/LL, lyL = LY/LL, lzL = LZ/LL;
    // Blinn-Phong halfway vector (viewer at +z infinity)
    const hLZ  = lzL + 1;
    const hLen = Math.sqrt(lxL*lxL + lyL*lyL + hLZ*hLZ);
    const hX   = lxL/hLen, hY = lyL/hLen, hZ = hLZ/hLen;

    //                  Earth  Mars  Jupiter  Sun
    const SHIN = [60,   12,    40,    0  ][b.type];
    const SPEC = [ 1.8,  0.28,  1.1,  0.0][b.type];
    const AMB  = [ 0.02, 0.02,  0.02, 1.0][b.type];

    const TWO_PI = 6.283185307;
    const img = sCtx.createImageData(w, h);
    const D   = img.data;

    for (let py = 0; py < h; py++) {
      const dyN = (py - cy) * iR;
      const dy2 = dyN * dyN;
      if (dy2 >= 1.0) continue;

      // Latitude is constant per row — hoist asin out of inner loop
      const lat = Math.asin(Math.max(-1.0, Math.min(1.0, dyN)));
      const v   = lat / Math.PI + 0.5;

      for (let px = 0; px < w; px++) {
        const dxN = (px - cx) * iR;
        const d2  = dxN * dxN + dy2;
        if (d2 >= 1.0) continue;

        const dzN = Math.sqrt(1.0 - d2);

        let light, spec = 0;
        if (b.type === 3) {
          // Sun: self-luminous with limb-darkening
          light = 0.52 + 0.48 * (1.0 - d2);
        } else {
          const diff = Math.max(0.0, dxN*lxL + dyN*lyL + dzN*lzL);
          const hDot = Math.max(0.0, dxN*hX  + dyN*hY  + dzN*hZ);
          spec  = (SHIN > 0) ? Math.pow(hDot, SHIN) * SPEC : 0;
          light = AMB + diff * (1.0 - AMB);
        }

        const lon = Math.atan2(dxN, dzN) + b.rot;
        const u   = ((lon / TWO_PI) % 1 + 1) % 1;

        const [tr, tg, tb] = texSample(b.type, u, v);

        const idx  = (py * w + px) << 2;
        D[idx]     = Math.min(255, tr * light + spec * 255) | 0;
        D[idx + 1] = Math.min(255, tg * light + spec * 255) | 0;
        D[idx + 2] = Math.min(255, tb * light + spec * 245) | 0;
        D[idx + 3] = 255;
      }
    }
    sCtx.putImageData(img, 0, 0);
  }

  // ── Responsive size metrics ──────────────────────────────────────────
  function cl(a, v, b) { return Math.max(a, Math.min(b, v)); }

  function getMetrics() {
    const vm = Math.min(window.innerWidth, window.innerHeight) / 100;
    return {
      sunR:      cl(29,  5.25 * vm, 48),
      contactR:  cl(12,  2.25 * vm, 22),
      cvR:       cl(9,   1.7  * vm, 16),
      researchR: cl(19,  3.6  * vm, 36),
      orbit1:    cl(58,  11   * vm, 105),
      orbit2:    cl(92,  17.5 * vm, 160),
      orbit3:    cl(168, 34   * vm, 315),
    };
  }

  // ── Body descriptors ─────────────────────────────────────────────────
  // type: 0=Earth  1=Mars  2=Jupiter  3=Sun
  // physR: planet radius in stellar-radius units (for transit calculation)
  // delay/period match the old CSS animation-delay/duration values
  let bodies = null;

  function initBodies() {
    const m = getMetrics();
    const defs = [
      { key:'about',    label:'About',    color:'#FFB020', type:3, rotSpeed:0.08,
        spR: m.sunR,      physR: m.sunR,              // star itself
        orbitR: 0,        period: 0,   delay: 0    },
      { key:'contact',  label:'Contact',  color:'#48C8E0', type:0, rotSpeed:0.30,
        spR: m.contactR,  physR: m.sunR * 0.092,      // ~Earth/Rs
        orbitR: m.orbit1, period: 10,  delay: 2.5  },
      { key:'cv',       label:'CV',       color:'#E88A5A', type:1, rotSpeed:0.22,
        spR: m.cvR,       physR: m.sunR * 0.065,      // ~sub-Neptune/Rs
        orbitR: m.orbit2, period: 20,  delay: 15.0 },
      { key:'research', label:'Research', color:'#E8B860', type:2, rotSpeed:0.56,
        spR: m.researchR, physR: m.sunR * 0.120,      // ~hot-Jupiter/Rs
        orbitR: m.orbit3, period: 40,  delay: 10.0 },
    ];

    // Preserve existing rot state across resizes
    bodies = defs.map((d, i) => {
      const rot = bodies ? bodies[i].rot : 0;
      const sz  = Math.max(4, Math.round(d.spR * 2 * DPR));
      const off = document.createElement('canvas');
      off.width = off.height = sz;
      return { ...d, rot, offscreen: off, offCtx: off.getContext('2d') };
    });
  }

  // ── Canvas sizing ────────────────────────────────────────────────────
  function resizeCanvas() {
    SC.width  = window.innerWidth  * DPR;
    SC.height = window.innerHeight * DPR;
    SC.style.width  = window.innerWidth  + 'px';
    SC.style.height = window.innerHeight + 'px';
    initBodies();
  }

  // ── Orbital position (screen space) ─────────────────────────────────
  // Matches CSS orbit-spin: planet starts at top of orbit (0,-r) going CW.
  // After rotateX(tiltX) and rotateZ(az) the orbit becomes a tilted ellipse.
  function bodyPos(b, tSec) {
    if (b.orbitR === 0) return { sx: 0, sy: 0, depth: 0 };

    const theta = ((b.delay + tSec) / b.period) * 2 * Math.PI;
    // Position on orbital plane (top = angle 0)
    const ox = b.orbitR * Math.sin(theta);
    const oy = -b.orbitR * Math.cos(theta);

    // Apply azimuth rotation in orbital plane
    const azR = az * Math.PI / 180;
    const rx  =  ox * Math.cos(azR) - oy * Math.sin(azR);
    const ry  =  ox * Math.sin(azR) + oy * Math.cos(azR);

    // Apply tiltX (rotateX)
    const tR = tiltX * Math.PI / 180;
    return {
      sx:    rx,
      sy:    ry * Math.cos(tR),
      depth: ry * Math.sin(tR),   // positive = in front of star plane
    };
  }

  // ── Helper: hex → [r, g, b] ──────────────────────────────────────────
  function hexRGB(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // ── Main render loop ─────────────────────────────────────────────────
  let prevNow = -1;
  let lastTSec = 0;

  function render(now) {
    const tSec = (now - T0) / 1000;
    const dt   = prevNow < 0 ? 0.016 : Math.min((now - prevNow) / 1000, 0.1);
    prevNow = now;
    lastTSec = tSec;

    // Rotate + re-render each sphere to its offscreen canvas
    for (const b of bodies) {
      b.rot += b.rotSpeed * dt;
      renderSphere(b);
    }

    // Viewport center in CSS px
    const W  = SC.width  / DPR;
    const H  = SC.height / DPR;
    const cX = W / 2;
    const cY = H / 2;

    // Compute screen positions, sort back-to-front for correct overdraw
    const posed = bodies.map(b => ({ b, p: bodyPos(b, tSec) }));
    posed.sort((a, b) => a.p.depth - b.p.depth);

    // ── Draw ────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, SC.width, SC.height);
    ctx.save();
    ctx.scale(DPR, DPR);

    const tR  = tiltX * Math.PI / 180;
    const azR = az    * Math.PI / 180;

    // 1. Orbit ellipses
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    for (const { b } of posed) {
      if (b.orbitR === 0) continue;
      ctx.beginPath();
      ctx.ellipse(cX, cY, b.orbitR, b.orbitR * Math.cos(tR), 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Bodies (back to front)
    for (const { b, p } of posed) {
      const bx = cX + p.sx;
      const by = cY + p.sy;
      const r  = b.spR;

      // Glow halo
      const glowR = b.type === 3 ? r * 3.8 : r * 2.8;
      const grd   = ctx.createRadialGradient(bx, by, r * 0.4, bx, by, glowR);
      if (b.type === 3) {
        grd.addColorStop(0,   'rgba(255,176,32,0.40)');
        grd.addColorStop(0.35,'rgba(255,120,16,0.20)');
        grd.addColorStop(1,   'rgba(255,80,0,0)');
      } else {
        const [rr, gg, bb] = hexRGB(b.color);
        grd.addColorStop(0, `rgba(${rr},${gg},${bb},0.35)`);
        grd.addColorStop(1, `rgba(${rr},${gg},${bb},0)`);
      }
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(bx, by, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Sphere surface (drawImage clipped to circle)
      ctx.save();
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(b.offscreen, bx - r, by - r, r * 2, r * 2);
      ctx.restore();

      // Label below sphere
      const fontSize = Math.max(9, Math.round(r * 0.30));
      ctx.font          = `500 ${fontSize}px Poppins,sans-serif`;
      ctx.textAlign     = 'center';
      ctx.textBaseline  = 'top';
      ctx.fillStyle     = b.color;
      ctx.globalAlpha   = 0.72;
      ctx.fillText(b.label.toUpperCase(), bx, by + r + 6);
      ctx.globalAlpha   = 1;
    }

    ctx.restore();

    // Lightcurve
    sampleFlux(tSec, computeFlux(tSec));
    if (lcPanel.classList.contains('open')) drawLiveLightcurve(tSec);

    requestAnimationFrame(render);
  }

  // ── Drag + click ─────────────────────────────────────────────────────
  let dragging  = false;
  let dragMoved = false;
  let lx = 0, ly = 0;

  function startDrag(x, y) { dragging = true; dragMoved = false; lx = x; ly = y; }
  function moveDrag(x, y) {
    if (!dragging) return;
    const dx = x - lx, dy = y - ly;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true;
    az    = (az + dx * 0.25) % 360;
    tiltX = Math.max(0, Math.min(90, tiltX + dy * 0.25));
    lx = x; ly = y;
    updateLcBtn();
  }
  function endDrag(x, y) {
    if (!dragMoved) tryClick(x, y);
    dragging = false;
    SC.classList.remove('is-dragging');
  }

  function tryClick(cx, cy) {
    const rect = SC.getBoundingClientRect();
    const mx   = cx - rect.left, my = cy - rect.top;
    const W    = SC.width / DPR, H = SC.height / DPR;
    const sCX  = W / 2, sCY = H / 2;
    // Test front-to-back
    const posed = bodies.map(b => ({ b, p: bodyPos(b, lastTSec) }))
                        .sort((a, b) => b.p.depth - a.p.depth);
    for (const { b, p } of posed) {
      const bx = sCX + p.sx, by = sCY + p.sy;
      if (Math.hypot(mx - bx, my - by) <= b.spR * 1.5) {
        openPanel(b.key, { x: Math.round(bx + rect.left), y: Math.round(by + rect.top) });
        return;
      }
    }
  }

  SC.addEventListener('mousedown', e => {
    startDrag(e.clientX, e.clientY);
    SC.classList.add('is-dragging');
  });
  window.addEventListener('mousemove', e => { if (dragging) moveDrag(e.clientX, e.clientY); });
  window.addEventListener('mouseup',   e => { if (dragging) endDrag(e.clientX, e.clientY); });

  SC.addEventListener('touchstart', e => {
    if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  SC.addEventListener('touchmove', e => {
    if (dragging && e.touches.length === 1) {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault();
    }
  }, { passive: false });
  SC.addEventListener('touchend', e => {
    if (dragging && e.changedTouches.length === 1)
      endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  });

  // ── Lightcurve button ─────────────────────────────────────────────────
  function updateLcBtn() {
    const vis = tiltX > 62;
    lcBtn.classList.toggle('visible', vis);
    if (!vis && lcPanel.classList.contains('open')) lcPanel.classList.remove('open');
  }

  // ── Animate to edge-on, then run callback ────────────────────────────
  function animateToEdgeOn(cb) {
    const st = tiltX, sa = az;
    const t0 = performance.now(), DUR = 1100;
    (function step(now) {
      const p = Math.min(1, (now - t0) / DUR);
      const e = 1 - (1 - p) * (1 - p) * (1 - p);   // ease-out cubic
      tiltX = st + (90 - st) * e;
      az    = sa + (0  - sa) * e;
      updateLcBtn();
      p < 1 ? requestAnimationFrame(step) : (cb && cb());
    })(t0);
  }

  window.openLightcurve = function () {
    animateToEdgeOn(() => {
      lcPanel.classList.add('open');
      lcBtn.classList.remove('visible');
    });
  };
  window.closeLightcurve = function () {
    lcPanel.classList.remove('open');
    if (tiltX > 62) lcBtn.classList.add('visible');
  };

  // ── Transit flux calculation ─────────────────────────────────────────
  // Uses physR (astrophysically scaled radii) so transit dips are realistic.
  function overlapArea(d, r1, r2) {
    if (d >= r1 + r2) return 0;
    if (d + r2 <= r1) return Math.PI * r2 * r2;
    if (d + r1 <= r2) return Math.PI * r1 * r1;
    const a1 = 2 * Math.acos(Math.min(1, (d*d + r1*r1 - r2*r2) / (2*d*r1)));
    const a2 = 2 * Math.acos(Math.min(1, (d*d + r2*r2 - r1*r1) / (2*d*r2)));
    return 0.5 * (r1*r1*(a1 - Math.sin(a1)) + r2*r2*(a2 - Math.sin(a2)));
  }

  function computeFlux(tSec) {
    if (!bodies) return 1.0;
    const sunR = bodies[0].spR;
    const azR  = az    * Math.PI / 180;
    const tR   = tiltX * Math.PI / 180;
    const cosT = Math.cos(tR), sinT = Math.sin(tR);
    let flux = 1.0;

    for (let i = 1; i < bodies.length; i++) {
      const b     = bodies[i];
      const theta = ((b.delay + tSec) / b.period) * 2 * Math.PI;
      const ox    = b.orbitR * Math.sin(theta);
      const oy    = -b.orbitR * Math.cos(theta);
      const rx    = ox * Math.cos(azR) - oy * Math.sin(azR);
      const ry    = ox * Math.sin(azR) + oy * Math.cos(azR);
      const depth = ry * sinT;
      if (depth <= 0) continue;   // behind star

      const screenX = rx, screenY = ry * cosT;
      const d = Math.sqrt(screenX*screenX + screenY*screenY);
      flux -= overlapArea(d, sunR, b.physR) / (Math.PI * sunR * sunR);
    }
    return Math.max(0, flux);
  }

  // ── Live lightcurve ring-buffer ───────────────────────────────────────
  const LC_RATE = 20;                      // samples per second
  const LC_WIN  = 120;                     // seconds of history
  const LC_SIZE = LC_WIN * LC_RATE;        // 2400 samples
  const lcBuf   = new Float32Array(LC_SIZE).fill(1.0);
  let   lcHead  = 0, lcLastIdx = -1;

  function sampleFlux(tSec, flux) {
    const idx = (tSec * LC_RATE) | 0;
    if (lcLastIdx < 0) lcLastIdx = idx - 1;
    while (lcLastIdx < idx) {
      lcLastIdx++;
      lcBuf[lcHead] = flux + (Math.random() - 0.5) * 0.0005;
      lcHead = (lcHead + 1) % LC_SIZE;
    }
  }

  function drawLiveLightcurve(tSec) {
    if (lcLastIdx < 0) return;
    const lcDPR = Math.min(window.devicePixelRatio || 1, 2);
    const W = lcCv.clientWidth, H = lcCv.clientHeight;
    if (W < 10 || H < 10) return;
    if (lcCv.width !== W * lcDPR || lcCv.height !== H * lcDPR) {
      lcCv.width = W * lcDPR; lcCv.height = H * lcDPR;
    }
    const lCtx = lcCv.getContext('2d');
    lCtx.save();
    lCtx.scale(lcDPR, lcDPR);

    const PAD  = { l: 52, r: 10, t: 18, b: 24 };
    const PW   = W - PAD.l - PAD.r;
    const PH   = H - PAD.t - PAD.b;
    const fMin = 0.955, fMax = 1.008;
    const tY   = f => PAD.t + (1 - (f - fMin) / (fMax - fMin)) * PH;

    lCtx.fillStyle = '#020810';
    lCtx.fillRect(0, 0, W, H);

    // Grid
    lCtx.strokeStyle = 'rgba(255,255,255,0.05)'; lCtx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.t + PH * i / 4;
      lCtx.beginPath(); lCtx.moveTo(PAD.l, y); lCtx.lineTo(PAD.l + PW, y); lCtx.stroke();
    }
    // Baseline
    lCtx.setLineDash([3, 5]);
    lCtx.strokeStyle = 'rgba(255,255,255,0.12)'; lCtx.lineWidth = 0.8;
    lCtx.beginPath(); lCtx.moveTo(PAD.l, tY(1)); lCtx.lineTo(PAD.l + PW, tY(1)); lCtx.stroke();
    lCtx.setLineDash([]);

    // Y ticks
    lCtx.fillStyle = 'rgba(120,160,180,0.65)';
    lCtx.font = '9px Poppins,sans-serif';
    lCtx.textBaseline = 'middle'; lCtx.textAlign = 'right';
    for (let i = 0; i <= 4; i++)
      lCtx.fillText((fMax - (fMax - fMin)*i/4).toFixed(3), PAD.l - 5, PAD.t + PH*i/4);

    // Axis labels
    lCtx.textAlign = 'center'; lCtx.textBaseline = 'bottom';
    lCtx.fillStyle = 'rgba(120,160,180,0.50)';
    lCtx.fillText('← past  ·  time  ·  now →', PAD.l + PW/2, H - 2);
    lCtx.save();
    lCtx.translate(10, PAD.t + PH/2); lCtx.rotate(-Math.PI/2);
    lCtx.textAlign = 'center'; lCtx.textBaseline = 'middle';
    lCtx.fillText('Norm. Flux', 0, 0);
    lCtx.restore();

    // Transit highlight for currently transiting planets
    const pCols = ['#48C8E0', '#E88A5A', '#E8B860'];
    const azR   = az    * Math.PI / 180;
    const tR2   = tiltX * Math.PI / 180;
    for (let i = 0; i < 3; i++) {
      const b = bodies[i + 1];
      const p = bodyPos(b, tSec || lastTSec);
      if (p.depth <= 0) continue;
      if (overlapArea(Math.hypot(p.sx, p.sy), bodies[0].spR, b.physR) > 0) {
        lCtx.fillStyle = pCols[i] + '28';
        lCtx.fillRect(PAD.l + PW - 6, PAD.t, 6, PH);
      }
    }

    // Lightcurve trace
    lCtx.beginPath();
    lCtx.strokeStyle = '#B8D8E8'; lCtx.lineWidth = 1.4;
    for (let i = 0; i < LC_SIZE; i++) {
      const si = (lcHead - LC_SIZE + i + LC_SIZE) % LC_SIZE;
      const x  = PAD.l + (i / (LC_SIZE - 1)) * PW;
      const y  = tY(Math.max(fMin, Math.min(fMax, lcBuf[si])));
      i === 0 ? lCtx.moveTo(x, y) : lCtx.lineTo(x, y);
    }
    lCtx.stroke();

    // NOW marker
    lCtx.strokeStyle = 'rgba(255,255,255,0.22)'; lCtx.lineWidth = 1;
    lCtx.beginPath();
    lCtx.moveTo(PAD.l + PW, PAD.t); lCtx.lineTo(PAD.l + PW, PAD.t + PH);
    lCtx.stroke();

    lCtx.restore();
  }

  // ── Boot ─────────────────────────────────────────────────────────────
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  updateLcBtn();
  requestAnimationFrame(render);

})();
