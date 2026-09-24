// Canvas renderer for star fields, constellation figures, and the all-sky dome.
window.SKY = window.SKY || {};
(function (S) {
  const A = S.astro, DATA = window.SKY_DATA;
  const STARS = DATA.stars, CONS = DATA.constellations;

  // Colour from B−V index (blue → white → yellow → orange).
  function starColor(bv) {
    if (bv < -0.05) return '#9db4ff';
    if (bv < 0.25) return '#cfd9ff';
    if (bv < 0.55) return '#f4f3ff';
    if (bv < 0.85) return '#fff3dc';
    if (bv < 1.25) return '#ffd9a6';
    return '#ffb877';
  }

  // Size canvas backing store to CSS size × DPR.
  function prep(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function drawStar(ctx, x, y, mag, bv, scale, glow) {
    const r = Math.max(0.55, (6.3 - mag) * 0.42 * scale);
    const col = starColor(bv);
    if (glow && mag < 2.6) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      g.addColorStop(0, col + '99'); g.addColorStop(1, col + '00');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  // Which star names deserve a label: proper names only (skip "α Ori"-style designations).
  function isProperName(n) { return n && !/^[α-ω]/.test(n) && !/^[A-Za-z0-9]{1,3} [A-Z][A-Za-z]{2}$/.test(n); }

  /**
   * Chart centred on (ra0,dec0) with field radius fov (deg).
   * o: { ra0, dec0, fov, rot, magLimit, field, lines:[{id,color,width,hidden}], labels, labelMag, dim, marker:{ra,dec,color}, pad, dx, dy, starScale, vignette }
   * Returns { toSky(px,py), proj(ra,dec), cx, cy, R }.
   */
  function drawChart(canvas, o) {
    const { ctx, w, h } = prep(canvas);
    ctx.clearRect(0, 0, w, h);
    const R = Math.min(w, h) / 2 * (o.pad || 0.88);
    const k = R / A.fovScale(o.fov);
    const cx = w / 2 + (o.dx || 0), cy = h / 2 + (o.dy || 0);
    const starScale = (o.starScale || 1) * Math.max(0.7, Math.min(1.5, R / 220));
    const rot = o.rot || 0;
    const proj = (ra, dec) => { const p = A.project(ra, dec, o.ra0, o.dec0, rot); return { x: cx + p.x * k, y: cy + p.y * k, c: p.c }; };

    if (o.vignette !== false) {
      const g = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.3);
      g.addColorStop(0, 'rgba(10,20,50,0.6)'); g.addColorStop(1, 'rgba(0,4,15,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }

    const lim = o.magLimit == null ? 5.5 : o.magLimit;
    const figureStars = new Set();
    for (const l of o.lines || []) for (const i of CONS[l.id].stars) figureStars.add(i);

    if (o.field) {
      for (let i = 0; i < STARS.length; i++) {
        const s = STARS[i];
        if (s[2] > lim && !figureStars.has(i)) continue;
        if (A.sep(s[0], s[1], o.ra0, o.dec0) > o.fov * 2.1) continue; // cover the canvas corners
        const p = proj(s[0], s[1]);
        drawStar(ctx, p.x, p.y, s[2], s[3], starScale, !o.dim);
      }
    } else {
      for (const i of figureStars) {
        const s = STARS[i]; const p = proj(s[0], s[1]);
        drawStar(ctx, p.x, p.y, s[2], s[3], starScale, !o.dim);
      }
    }

    for (const l of o.lines || []) {
      if (l.hidden) continue;
      ctx.strokeStyle = l.color || 'rgba(72,200,224,0.6)';
      ctx.lineWidth = l.width || 1.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (const poly of CONS[l.id].lines) {
        ctx.beginPath();
        poly.forEach((si, n) => { const s = STARS[si]; const p = proj(s[0], s[1]); n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
        ctx.stroke();
      }
    }

    if (o.labels) {
      ctx.font = `${Math.round(Math.max(10, 11 * Math.min(1.3, R / 220)))}px 'Source Serif 4', Georgia, serif`;
      ctx.fillStyle = 'rgba(232,244,248,0.88)'; ctx.textBaseline = 'middle';
      const placed = [];   // label boxes {x0,x1,y0,y1}
      const collides = b => placed.some(q => b.x0 < q.x1 && b.x1 > q.x0 && b.y0 < q.y1 && b.y1 > q.y0);
      for (const i of [...figureStars].sort((a, b) => STARS[a][2] - STARS[b][2])) {
        const s = STARS[i];
        if (!isProperName(s[4]) || s[2] > (o.labelMag == null ? 3.2 : o.labelMag)) continue;
        const p = proj(s[0], s[1]); const tw = ctx.measureText(s[4]).width;
        // Try right of the star, then left, then below; skip if everything collides.
        const spots = [
          { x: p.x + 7, y: p.y - 8, align: 'left' }, { x: p.x - 7, y: p.y - 8, align: 'right' }, { x: p.x + 7, y: p.y + 9, align: 'left' }];
        for (const sp of spots) {
          const box = { x0: sp.align === 'left' ? sp.x : sp.x - tw, x1: sp.align === 'left' ? sp.x + tw : sp.x, y0: sp.y - 7, y1: sp.y + 7 };
          if (collides(box)) continue;
          placed.push(box); ctx.textAlign = sp.align; ctx.fillText(s[4], sp.x, sp.y); break;
        }
      }
      ctx.textAlign = 'left';
    }

    if (o.marker) {
      const p = proj(o.marker.ra, o.marker.dec);
      ctx.strokeStyle = o.marker.color || '#FFB020'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.stroke();
    }

    function toSky(px, py) {
      let x = (px - cx) / k, y = -(py - cy) / k;
      if (rot) { const r = -rot * A.D2R, cs = Math.cos(r), sn = Math.sin(r); const xr = x * cs - y * sn, yr = x * sn + y * cs; x = xr; y = yr; }
      x = -x;
      const rho = Math.hypot(x, y); if (rho === 0) return { ra: o.ra0, dec: o.dec0 };
      const c = 2 * Math.atan(rho / 2);
      const p0 = o.dec0 * A.D2R, l0 = o.ra0 * A.D2R;
      const dec = Math.asin(Math.cos(c) * Math.sin(p0) + y * Math.sin(c) * Math.cos(p0) / rho);
      const ra = l0 + Math.atan2(x * Math.sin(c), rho * Math.cos(p0) * Math.cos(c) - y * Math.sin(p0) * Math.sin(c));
      return { ra: ((ra * A.R2D) % 360 + 360) % 360, dec: dec * A.R2D };
    }
    return { toSky, proj, cx, cy, R };
  }

  // Galactic (l, b) → equatorial (ra, dec), degrees. J2000 pole/node constants.
  function gal2eq(l, b) {
    const aG = 192.85948 * A.D2R, dG = 27.12825 * A.D2R, lN = 122.93192 * A.D2R;
    const lr = l * A.D2R, br = b * A.D2R;
    const sinDec = Math.sin(dG) * Math.sin(br) + Math.cos(dG) * Math.cos(br) * Math.cos(lN - lr);
    const dec = Math.asin(Math.max(-1, Math.min(1, sinDec)));
    const y = Math.cos(br) * Math.sin(lN - lr);
    const x = Math.cos(dG) * Math.sin(br) - Math.sin(dG) * Math.cos(br) * Math.cos(lN - lr);
    const ra = aG + Math.atan2(y, x);
    return { ra: ((ra * A.R2D) % 360 + 360) % 360, dec: dec * A.R2D };
  }
  const MW = []; for (let l = 0; l < 360; l += 3) { const p = gal2eq(l, 0); MW.push({ ra: p.ra, dec: p.dec, w: 0.6 + 0.5 * Math.cos(l * A.D2R) }); }

  /**
   * All-sky dome for a place and time. North up, east left: hold it overhead.
   * o: { lat, lon, date, lines, labels, magLimit, level:{id:n}, highlight, onlyLearned }
   * Returns { hit(px,py) → id|null, positions }
   */
  function drawDome(canvas, o) {
    const { ctx, w, h } = prep(canvas);
    ctx.clearRect(0, 0, w, h);
    const R = Math.min(w, h) / 2 - 26, cx = w / 2, cy = h / 2;
    const L = A.lst(o.date, o.lon);
    const toXY = (ra, dec) => {
      const { alt, az } = A.altaz(ra, dec, o.lat, L);
      const r = R * (90 - alt) / 90;
      return { x: cx - r * Math.sin(az * A.D2R), y: cy - r * Math.cos(az * A.D2R), alt, az };
    };

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, '#08163a'); g.addColorStop(0.75, '#04102c'); g.addColorStop(1, '#0b1a3a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();

    // Milky Way band
    for (const m of MW) {
      const p = toXY(m.ra, m.dec); if (p.alt < -6) continue;
      const rr = R * 0.085 * m.w + R * 0.03;
      const mg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr);
      mg.addColorStop(0, `rgba(190,205,255,${(0.05 * m.w + 0.02).toFixed(3)})`); mg.addColorStop(1, 'rgba(190,205,255,0)');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, Math.PI * 2); ctx.fill();
    }

    // Altitude rings (30°, 60°)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
    for (const a of [30, 60]) { ctx.beginPath(); ctx.arc(cx, cy, R * (90 - a) / 90, 0, Math.PI * 2); ctx.stroke(); }
    ctx.setLineDash([]);

    const lim = o.magLimit == null ? 5.0 : o.magLimit;
    const scale = Math.max(0.45, Math.min(1.0, R / 330));
    for (let i = 0; i < STARS.length; i++) {
      const s = STARS[i]; if (s[2] > lim) continue;
      const p = toXY(s[0], s[1]); if (p.alt < -1) continue;
      drawStar(ctx, p.x, p.y, s[2], s[3], scale, s[2] < 1.2);
    }

    const positions = {};
    for (const id in CONS) {
      const c = CONS[id];
      const lvl = (o.level && o.level[id]) || 0;
      if (o.onlyLearned && !lvl) continue;
      const centre = toXY(c.ra, c.dec);
      positions[id] = centre;
      if (o.lines) {
        const isHi = o.highlight === id;
        ctx.strokeStyle = isHi ? '#FFB020' : lvl >= 5 ? 'rgba(255,196,80,0.55)' : lvl > 0 ? 'rgba(72,200,224,0.55)' : 'rgba(120,150,190,0.22)';
        ctx.lineWidth = isHi ? 2.2 : 1.1;
        for (const poly of c.lines) {
          ctx.beginPath(); let pen = false;
          for (const si of poly) {
            const s = STARS[si]; const p = toXY(s[0], s[1]);
            if (p.alt < -2) { pen = false; continue; }
            pen ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); pen = true;
          }
          ctx.stroke();
        }
      }
      if (o.labels && centre.alt > 6) {
        ctx.font = `${Math.round(Math.max(9, 11 * scale * 1.15))}px 'Fraunces', Georgia, serif`;
        ctx.fillStyle = o.highlight === id ? '#FFB020' : lvl > 0 ? 'rgba(232,244,248,0.9)' : 'rgba(150,175,205,0.6)';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(c.name, centre.x, centre.y);
      }
    }
    ctx.restore();

    // Horizon and cardinal points
    ctx.strokeStyle = 'rgba(232,244,248,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.font = "600 14px 'Fraunces', Georgia, serif"; ctx.fillStyle = 'rgba(232,244,248,0.8)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', cx, cy - R - 13); ctx.fillText('S', cx, cy + R + 13); ctx.fillText('E', cx - R - 13, cy); ctx.fillText('W', cx + R + 13, cy);

    function hit(px, py) {
      let best = null, bd = 1e9;
      for (const id in positions) {
        const p = positions[id]; if (p.alt < 0) continue;
        const d = Math.hypot(p.x - px, p.y - py);
        if (d < bd) { bd = d; best = id; }
      }
      return bd < Math.max(26, R * 0.09) ? best : null;
    }
    return { hit, positions, toXY };
  }

  S.render = { drawChart, drawDome, starColor, prep, gal2eq };
})(window.SKY);
