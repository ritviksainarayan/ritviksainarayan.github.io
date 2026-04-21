/* =============================================
   SPACE THEME — Interactive Solar System
   ============================================= */

// ── Starfield ─────────────────────────────────
(function () {
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  let stars = [];
  let raf;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    buildStars();
  }

  function buildStars() {
    const count = Math.floor((canvas.width * canvas.height) / 4500);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      base: Math.random() * 0.6 + 0.2,
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
    raf = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  raf = requestAnimationFrame(draw);
})();

// ── Panel logic ───────────────────────────────
const panel = document.getElementById('panel');
const panelBody = document.getElementById('panel-body');
const solarView = document.getElementById('solar-system-view');
const panelDot = document.getElementById('panel-dot');
const panelName = document.getElementById('panel-name');

const SECTIONS = {
  about: {
    name: 'About',
    dotColor: '#FFB020',   /* star */
    render: renderAbout,
  },
  contact: {
    name: 'Contact',
    dotColor: '#48C8E0',   /* Earth */
    render: renderContact,
  },
  cv: {
    name: 'CV',
    dotColor: '#E88A5A',   /* Mars */
    render: renderCV,
  },
  research: {
    name: 'Research',
    dotColor: '#E8B860',   /* Jupiter */
    render: renderResearch,
  },
};

window.openPanel = function (key, triggerEl) {
  const sec = SECTIONS[key];
  if (!sec) return;

  // Compute zoom origin from the clicked planet's centre
  let cx = '50%', cy = '50%';
  if (triggerEl) {
    const planet = triggerEl.querySelector('.planet') || triggerEl;
    const r = planet.getBoundingClientRect();
    cx = Math.round(r.left + r.width  / 2) + 'px';
    cy = Math.round(r.top  + r.height / 2) + 'px';
  }
  panel.style.setProperty('--cx', cx);
  panel.style.setProperty('--cy', cy);

  panelDot.style.background = sec.dotColor;
  panelDot.style.boxShadow = `0 0 8px ${sec.dotColor}`;
  panelName.textContent = sec.name;

  panelBody.innerHTML = '';
  const inner = document.createElement('div');
  inner.className = 'panel-inner';
  sec.render(inner);
  panelBody.appendChild(inner);
  panelBody.scrollTop = 0;

  // Block solar-system clicks during transition
  solarView.style.pointerEvents = 'none';

  // Trigger zoom-in on next frame so clip-path transition fires
  requestAnimationFrame(() => panel.classList.add('open'));

  history.pushState({ section: key }, '', `#${key}`);
};

window.closePanel = function () {
  panel.classList.remove('open');
  solarView.style.pointerEvents = '';
  history.pushState({}, '', location.pathname);
};

// Handle browser back
window.addEventListener('popstate', (e) => {
  if (panel.classList.contains('open')) {
    panel.classList.remove('open');
    solarView.style.pointerEvents = '';
  }
  if (e.state && e.state.section) {
    openPanel(e.state.section);
  }
});

// Open from hash on load
window.addEventListener('DOMContentLoaded', () => {
  const hash = location.hash.replace('#', '');
  if (SECTIONS[hash]) openPanel(hash);
});

// ── Section Renderers ────────────────────────

function renderAbout(el) {
  el.innerHTML = `
    <h1 class="section-h1">Ritvik Sai Narayan</h1>

    <div class="about-grid">
      <div class="about-profile">
        <img src="assets/img/profile/profile.jpeg" alt="Ritvik Sai Narayan" class="profile-img">
        <div class="social-icons">
          <a href="https://www.linkedin.com/in/ritviksainarayan/" target="_blank" rel="noopener" class="social-icon" title="LinkedIn">
            <i class="bi bi-linkedin"></i>
          </a>
          <a href="https://github.com/ritviksainarayan" target="_blank" rel="noopener" class="social-icon" title="GitHub">
            <i class="bi bi-github"></i>
          </a>
          <a href="https://orcid.org/0009-0007-0488-5685" target="_blank" rel="noopener" class="social-icon" title="ORCID">
            <i class="fa-brands fa-orcid"></i>
          </a>
        </div>
      </div>

      <div class="about-bio">
        <p>
          I am an incoming PhD student at
          <a href="https://physics.mit.edu/" target="_blank" rel="noopener">MIT</a>
          working on exoplanet and stellar astronomy, having double-majored in Astrophysics and Economics at the
          <a href="https://www.astro.wisc.edu/" target="_blank" rel="noopener">University of Wisconsin–Madison</a>.
        </p>
        <p>
          I like thinking about the evolution of stars and exoplanets, from both observational and theoretical lenses.
          I also enjoy the data science and computational aspects of modern astronomy, and care about how to effectively
          communicate science results with meaningful visualizations.
        </p>
        <p>
          In my free time, I enjoy working out, binge-watching copious amounts of TV, and mindlessly supporting a
          Formula 1 team (<em>Forza Ferrari!</em>).
        </p>
      </div>
    </div>
  `;
}

function renderResearch(el) {
  el.innerHTML = `
    <h1 class="section-h1">Research</h1>

    <p style="font-size:1rem;line-height:1.9;color:#C8D8E0;margin-bottom:2rem">
      I am broadly interested in the lives of stars and the planets that orbit them — from how they
      form and evolve, to how we observe and characterize them. My work spans both observational
      and theoretical approaches, with a strong emphasis on data science and scientific visualization.
    </p>

    <div class="research-areas">

      <div class="research-area-card">
        <div class="ra-icon">✦</div>
        <div>
          <h2 class="section-h2">Exoplanet Astronomy</h2>
          <p>
            Predicting and characterizing exoplanet populations, including transit yield forecasts
            for upcoming surveys with the
            <a href="https://roman.gsfc.nasa.gov/" target="_blank" rel="noopener">Nancy Grace Roman Space Telescope</a>.
          </p>
        </div>
      </div>

      <div class="research-area-card">
        <div class="ra-icon">✦</div>
        <div>
          <h2 class="section-h2">Stellar Evolution &amp; Binary Stars</h2>
          <p>
            Understanding how stars deviate from standard single-star evolutionary tracks.
            In particular, how mass transfer between binary companions produces interesting stellar
            populations like Blue Straggler Stars, and what the remnant white dwarfs tell us
            about those interactions.
          </p>
        </div>
      </div>

      <div class="research-area-card">
        <div class="ra-icon">✦</div>
        <div>
          <h2 class="section-h2">Data Science &amp; Visualization</h2>
          <p>
            Applying statistical and computational tools to large astronomical datasets.
            I care deeply about how science results are communicated — clear, meaningful
            visualizations are part of the science, not an afterthought.
          </p>
        </div>
      </div>

    </div>

    <p style="margin-top:2rem;font-size:0.85rem;color:var(--text-muted)">
      Full research page coming soon.
    </p>
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
        <a href="https://www.linkedin.com/in/ritviksainarayan/" target="_blank" rel="noopener" class="social-icon" title="LinkedIn">
          <i class="bi bi-linkedin"></i>
        </a>
        <a href="https://github.com/ritviksainarayan" target="_blank" rel="noopener" class="social-icon" title="GitHub">
          <i class="bi bi-github"></i>
        </a>
        <a href="https://orcid.org/0009-0007-0488-5685" target="_blank" rel="noopener" class="social-icon" title="ORCID">
          <i class="fa-brands fa-orcid"></i>
        </a>
      </div>
    </div>
    <p style="text-align:center;margin-top:2rem;font-size:0.75rem;color:var(--text-muted)">
      &copy; 2025 Ritvik Sai Narayan
    </p>
  `;
}
