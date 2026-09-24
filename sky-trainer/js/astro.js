// Sky math: projections, sidereal time, horizon coordinates.
window.SKY = window.SKY || {};
(function (S) {
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;

  // Angular separation in degrees.
  function sep(ra1, dec1, ra2, dec2) {
    const a = dec1 * D2R, b = dec2 * D2R, d = (ra1 - ra2) * D2R;
    const c = Math.sin(a) * Math.sin(b) + Math.cos(a) * Math.cos(b) * Math.cos(d);
    return Math.acos(Math.max(-1, Math.min(1, c))) * R2D;
  }

  // Stereographic projection centred on (ra0, dec0), north up, east LEFT (as seen from Earth).
  // Returns tangent-plane coords in "radius units" (2·tan(c/2)) plus angular distance c (deg).
  function project(ra, dec, ra0, dec0, rotDeg) {
    const p = dec * D2R, p0 = dec0 * D2R, dl = (ra - ra0) * D2R;
    const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(dl);
    const k = 2 / (1 + cosc);
    let x = -k * Math.cos(p) * Math.sin(dl);
    let y = k * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(dl));
    if (rotDeg) {
      const r = rotDeg * D2R, cs = Math.cos(r), sn = Math.sin(r);
      const xr = x * cs - y * sn, yr = x * sn + y * cs;
      x = xr; y = yr;
    }
    return { x, y: -y, c: Math.acos(Math.max(-1, Math.min(1, cosc))) * R2D };
  }
  // Scale factor: tangent-plane units per degree of field radius.
  function fovScale(fovDeg) { return 2 * Math.tan(fovDeg * D2R / 2); }

  // Julian date & Greenwich mean sidereal time (degrees).
  function jd(date) { return date.getTime() / 86400000 + 2440587.5; }
  function gmst(date) {
    const T = (jd(date) - 2451545.0) / 36525;
    let g = 280.46061837 + 360.98564736629 * (jd(date) - 2451545.0) + 0.000387933 * T * T;
    return ((g % 360) + 360) % 360;
  }
  function lst(date, lonDeg) { return ((gmst(date) + lonDeg) % 360 + 360) % 360; }

  // Equatorial → horizontal. az measured from North through East.
  function altaz(ra, dec, latDeg, lstDeg) {
    const H = (lstDeg - ra) * D2R, p = latDeg * D2R, d = dec * D2R;
    const sinAlt = Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H);
    const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
    const A = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(p) - Math.tan(d) * Math.cos(p));
    return { alt: alt * R2D, az: ((A * R2D + 180) % 360 + 360) % 360 };
  }
  function compass(az) {
    const names = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return names[Math.round(az / 22.5) % 16];
  }

  // Hour angle (deg) at which an object of declination dec crosses altitude h0 from latitude lat; null if never.
  function riseHA(dec, lat, h0) {
    const c = (Math.sin(h0 * D2R) - Math.sin(lat * D2R) * Math.sin(dec * D2R)) / (Math.cos(lat * D2R) * Math.cos(dec * D2R));
    if (c < -1) return 180;     // always above
    if (c > 1) return null;     // never rises
    return Math.acos(c) * R2D;
  }

  // Random helper with seedable feel (plain Math.random is fine for training).
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  S.astro = { sep, project, fovScale, gmst, lst, altaz, compass, riseHA, rand, pick, shuffle, D2R, R2D };
})(window.SKY);
