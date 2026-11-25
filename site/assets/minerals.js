/* gemstone.md — минералы: рисунки кристаллов (SVG строится в коде), каталог «минерал недели» (v5 · 30.09.2026)
   Рисунок — иллюстрация минерала, а не фото изделия. Если в /assets/crystals/<slug>.webp появится файл (например, из GPT),
   сайт покажет его вместо рисунка; пока файла нет — рисунок. */
(function () {
  'use strict';
  var LANG = (document.documentElement.lang || 'ru').slice(0, 2); if (['ru', 'ro', 'en'].indexOf(LANG) < 0) LANG = 'ru';
  var LI = LANG === 'ro' ? 1 : LANG === 'en' ? 2 : 0;

  /* ── утилиты ── */
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hsl(hex) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255,
      mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) { s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  }
  function T(c, dl, ds, a) {
    var l = Math.max(2, Math.min(97, c[2] + (dl || 0))), s = Math.max(0, Math.min(100, c[1] + (ds || 0)));
    return 'hsl(' + c[0] + ',' + s + '%,' + l + '%' + (a == null ? '' : ',' + a) + ')';
  }
  function f(n) { return Math.round(n * 10) / 10; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var UID = 0;
  function uid(p) { return (p || 'g') + (++UID); }
  function pts(a) { return a.map(function (p) { return f(p[0]) + ',' + f(p[1]); }).join(' '); }
  function poly(a, fill, extra) { return '<polygon points="' + pts(a) + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function lin(id, x1, y1, x2, y2, stops, units) {
    return '<linearGradient id="' + id + '" ' + (units ? 'gradientUnits="userSpaceOnUse" ' : '') + 'x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"/>'; }).join('') + '</linearGradient>';
  }
  function rad(id, cx, cy, r, stops, fx, fy) {
    return '<radialGradient id="' + id + '" gradientUnits="userSpaceOnUse" cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '"' + (fx != null ? ' fx="' + f(fx) + '" fy="' + f(fy) + '"' : '') + '>' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</radialGradient>';
  }
  var EDGE = ' stroke-linejoin="round"';

  /* ── общая подложка: тень на поверхности ── */
  function shadow(X, cx, cy, rx, ry, a) {
    var id = uid('sh');
    X.defs.push(rad(id, cx, cy, rx, [[0, '#000', a || .55], [1, '#000', 0]]));
    X.body.unshift('<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="url(#' + id + ')" transform="translate(0 0)"/>');
  }

  /* ── форма 1: призмы с вершинами (кварц, аметист, берилл, турмалин…) ── */
  function prism(X, o) {
    var c = o.c, x0 = o.cx - o.w / 2, x1 = x0 + o.w * .27, x2 = x0 + o.w * .70, x3 = x0 + o.w, ty = o.by - o.h,
      ap = [o.cx + o.w * .05, ty - o.tip], k = o.k || 0, a = o.clear ? .8 : 1, g1 = uid('pl'), g2 = uid('pc'), g3 = uid('pr');
    var lx = o.rot ? ' transform="rotate(' + o.rot + ' ' + f(o.cx) + ' ' + f(o.by) + ')"' : '';
    X.defs.push(
      lin(g1, 0, ty, 0, o.by, [[0, T(c, -10 + k, 0, a)], [1, T(c, -30 + k, 0, a)]]),
      lin(g2, 0, ty, 0, o.by, [[0, T(c, 12 + k, 0, a)], [.55, T(c, -2 + k, 0, a)], [1, T(c, -20 + k, 0, a)]]),
      lin(g3, 0, ty, 0, o.by, [[0, T(c, 0 + k, 0, a)], [1, T(c, -22 + k, 0, a)]])
    );
    var s = '<g' + lx + '>';
    s += poly([[x0, o.by], [x1, o.by + 1.5], [x1, ty], [x0, ty]], 'url(#' + g1 + ')');
    s += poly([[x1, o.by + 1.5], [x2, o.by + 1], [x2, ty], [x1, ty]], 'url(#' + g2 + ')');
    s += poly([[x2, o.by + 1], [x3, o.by], [x3, ty], [x2, ty]], 'url(#' + g3 + ')');
    s += poly([[x0, ty], [x1, ty], ap], T(c, 2 + k, 0, a));
    s += poly([[x1, ty], [x2, ty], ap], T(c, 20 + k, -4, a));
    s += poly([[x2, ty], [x3, ty], ap], T(c, -6 + k, 0, a));
    if (o.stri) {
      var r = rng(hash(o.stri + o.cx));
      for (var i = 0; i < 9; i++) { var x = x0 + 2 + r() * (o.w - 4); s += '<line x1="' + f(x) + '" y1="' + f(ty + 2) + '" x2="' + f(x + (r() - .5) * 1.2) + '" y2="' + f(o.by) + '" stroke="' + T(c, -34, 0, .55) + '" stroke-width="' + f(.4 + r() * .7) + '"/>'; }
    }
    s += '<g fill="none" stroke="' + T(c, 34, -10, .55) + '" stroke-width=".7"' + EDGE + '><path d="M' + f(x1) + ' ' + f(o.by + 1.5) + 'V' + f(ty) + 'L' + f(ap[0]) + ' ' + f(ap[1]) + 'L' + f(x0) + ' ' + f(ty) + 'V' + f(o.by) + '"/><path d="M' + f(x2) + ' ' + f(o.by + 1) + 'V' + f(ty) + 'L' + f(ap[0]) + ' ' + f(ap[1]) + 'L' + f(x3) + ' ' + f(ty) + 'V' + f(o.by) + '"/><path d="M' + f(x0) + ' ' + f(ty) + 'H' + f(x3) + '" stroke-opacity=".35"/></g>';
    s += '<path d="M' + f(x1 + 1.2) + ' ' + f(o.by - 6) + 'V' + f(ty + 3) + '" stroke="rgba(255,255,255,.42)" stroke-width="1.3" stroke-linecap="round" fill="none"/>';
    s += poly([[x1 + 1, ty - 1], [x1 + o.w * .16, ty - 1], [ap[0] - 1, ap[1] + o.tip * .38]], 'rgba(255,255,255,.28)');
    s += '</g>';
    X.body.push(s);
  }
  function matrix(X, cx, by, w, seed) {
    var r = rng(hash(seed)), g = uid('mx'), a = [], n = 9, i;
    for (i = 0; i <= n; i++) a.push([cx - w / 2 + (w * i) / n + (r() - .5) * 6, by - 2 + r() * 7 - (i % 2 ? 2 : 0)]);
    a.push([cx + w / 2 + 4, by + 16], [cx - w / 2 - 4, by + 17]);
    X.defs.push(lin(g, 0, by - 4, 0, by + 18, [[0, '#343a42'], [1, '#101215']]));
    var s = poly(a, 'url(#' + g + ')', EDGE);
    for (i = 0; i < 12; i++) { var px = cx - w / 2 + r() * w, py = by + 1 + r() * 10; s += poly([[px, py], [px + 4 + r() * 6, py - 1 - r() * 2], [px + 5, py + 2 + r() * 3]], 'rgba(255,255,255,' + f(.03 + r() * .06) + ')'); }
    return s;
  }
  function pointCluster(X, o) {
    var c = o.c;
    X.body.push(matrix(X, 120, 128, o.slender ? 112 : 132, o.seed));
    var list = o.list || [
      { cx: 84, by: 130, w: 24, h: 44, tip: 17, rot: -17, k: -10 },
      { cx: 160, by: 131, w: 26, h: 54, tip: 19, rot: 16, k: -8 },
      { cx: 104, by: 132, w: 20, h: 36, tip: 13, rot: -7, k: -4 },
      { cx: 138, by: 133, w: 22, h: 40, tip: 15, rot: 7, k: -2 },
      { cx: 120, by: 134, w: 40, h: 74, tip: 27, rot: -1, k: 0 }
    ];
    list.forEach(function (p) { prism(X, { cx: p.cx, by: p.by, w: p.w * (o.wm || 1), h: p.h * (o.hm || 1), tip: p.tip * (o.tm || 1), rot: p.rot, k: p.k, c: c, clear: o.clear, stri: o.stri }); });
    shadow(X, 120, 145, 80, 8);
  }

  /* ── форма 2: кубы (флюорит, пирит) ── */
  function cube(X, o) {
    var s = o.s, k = .866 * s, cx = o.cx, cy = o.cy, c = o.c, c2 = o.c2 || o.c,
      F = [cx, cy], R = [cx + k, cy - s / 2], L = [cx - k, cy - s / 2], FT = [cx, cy - s], RT = [cx + k, cy - 1.5 * s], LT = [cx - k, cy - 1.5 * s], BT = [cx, cy - 2 * s],
      gl = uid('cl'), gr = uid('cr'), gt = uid('ct'), pivot = f(cx) + ' ' + f(cy - s), out = '<g transform="rotate(' + (o.rot || 0) + ' ' + pivot + ')">';
    if (o.pyr) {
      X.defs.push(
        lin(gl, L[0], L[1], F[0], F[1], [[0, T(c, 8)], [.28, T(c, -22)], [.5, T(c, 16)], [.75, T(c, -14)], [1, T(c, -26)]], 1),
        lin(gr, F[0], F[1], R[0], R[1], [[0, T(c, -18)], [.3, T(c, 4)], [.55, T(c, -26)], [.8, T(c, -6)], [1, T(c, -30)]], 1),
        lin(gt, LT[0], LT[1], RT[0], RT[1], [[0, T(c, 26)], [.4, T(c, 12)], [.7, T(c, 30)], [1, T(c, 8)]], 1));
    } else {
      X.defs.push(
        lin(gl, L[0], L[1], F[0], F[1], [[0, T(c2, 4, 0, .95)], [.5, T(c, -6, 0, .95)], [1, T(c, -24, 0, .95)]], 1),
        lin(gr, F[0], F[1], R[0], R[1], [[0, T(c, -22, 0, .95)], [.5, T(c, -12, 0, .95)], [1, T(c2, -18, 0, .95)]], 1),
        lin(gt, LT[0], LT[1], RT[0], RT[1], [[0, T(c2, 22, 0, .95)], [.5, T(c, 16, 0, .95)], [1, T(c, 6, 0, .95)]], 1));
    }
    out += poly([F, L, LT, FT], 'url(#' + gl + ')') + poly([F, R, RT, FT], 'url(#' + gr + ')') + poly([FT, RT, BT, LT], 'url(#' + gt + ')');
    function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
    if (o.pyr) {
      var i, p, q, sl = '', n = 7;
      for (i = 1; i < n; i++) { p = lerp(L, F, i / n); q = lerp(LT, FT, i / n); sl += '<line x1="' + f(p[0]) + '" y1="' + f(p[1]) + '" x2="' + f(q[0]) + '" y2="' + f(q[1]) + '"/>'; }
      for (i = 1; i < n; i++) { p = lerp(F, R, i / n); q = lerp(FT, RT, i / n); sl += '<line x1="' + f(p[0]) + '" y1="' + f(p[1]) + '" x2="' + f(q[0]) + '" y2="' + f(q[1]) + '"/>'; }
      for (i = 1; i < n; i++) { p = lerp(FT, RT, i / n); q = lerp(LT, BT, i / n); sl += '<line x1="' + f(p[0]) + '" y1="' + f(p[1]) + '" x2="' + f(q[0]) + '" y2="' + f(q[1]) + '"/>'; }
      out += '<g stroke="rgba(0,0,0,.34)" stroke-width=".6">' + sl + '</g>';
    } else {
      // «фантом» — вложенный контур роста, характерный для флюорита
      function shrink(P, t) { var m = [(P[0][0] + P[2][0]) / 2, (P[0][1] + P[2][1]) / 2]; return P.map(function (v) { return [m[0] + (v[0] - m[0]) * t, m[1] + (v[1] - m[1]) * t]; }); }
      out += '<g fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.28)" stroke-width=".6"' + EDGE + '>' + poly(shrink([F, L, LT, FT], .52), 'rgba(255,255,255,.07)') + poly(shrink([F, R, RT, FT], .52), 'rgba(255,255,255,.05)') + poly(shrink([FT, RT, BT, LT], .5), 'rgba(255,255,255,.1)') + '</g>';
    }
    out += '<g fill="none" stroke="' + T(c, 36, -6, .6) + '" stroke-width=".8"' + EDGE + ' stroke-linecap="round"><path d="M' + pts([LT]) + ' ' + pts([FT]) + ' ' + pts([RT]) + '"/><path d="M' + pts([FT]) + ' ' + pts([F]) + '" stroke-opacity=".5"/><path d="M' + pts([LT]) + ' ' + pts([BT]) + ' ' + pts([RT]) + '" stroke-opacity=".8"/></g>';
    out += '<path d="M' + f(LT[0] + 3) + ' ' + f(LT[1] + 2.5) + 'L' + f(FT[0] - 1) + ' ' + f(FT[1] - 1.6) + '" stroke="rgba(255,255,255,.65)" stroke-width="1.2" stroke-linecap="round"/>';
    out += '</g>';
    X.body.push(out);
  }
  function cubeCluster(X, o) {
    cube(X, { s: 30, cx: 70, cy: 130, rot: 9, c: o.c, c2: o.c2, pyr: o.pyr });
    cube(X, { s: 46, cx: 122, cy: 128, rot: -5, c: o.c, c2: o.c2, pyr: o.pyr });
    cube(X, { s: 26, cx: 170, cy: 134, rot: -13, c: o.c, c2: o.c2, pyr: o.pyr });
    cube(X, { s: 14, cx: 96, cy: 141, rot: 18, c: o.c, c2: o.c2, pyr: o.pyr });
    shadow(X, 122, 145, 86, 8);
  }

  /* ── форма 3: ромбододекаэдры (гранат) ── */
  function dodeca(X, o) {
    var c = o.c, r = o.r, cx = o.cx, cy = o.cy, v = [], i, a;
    for (i = 0; i < 6; i++) { a = ((-90 + i * 60 + (o.rot || 0)) * Math.PI) / 180; v.push([cx + r * Math.cos(a) * 1.0, cy + r * Math.sin(a) * .92]); }
    var C = [cx + r * .04, cy - r * .02], g1 = uid('da'), g2 = uid('db'), g3 = uid('dc');
    X.defs.push(rad(g1, C[0], C[1], r * 1.1, [[0, T(c, 26)], [1, T(c, 4)]]), rad(g2, C[0], C[1], r * 1.1, [[0, T(c, 6)], [1, T(c, -22)]]), rad(g3, C[0], C[1], r * 1.1, [[0, T(c, 14)], [1, T(c, -10)]]));
    var s = poly([C, v[0], v[1], v[2]], 'url(#' + g1 + ')') + poly([C, v[2], v[3], v[4]], 'url(#' + g2 + ')') + poly([C, v[4], v[5], v[0]], 'url(#' + g3 + ')');
    s += '<g fill="none" stroke="' + T(c, 40, -10, .55) + '" stroke-width=".8"' + EDGE + '><polygon points="' + pts(v) + '"/><path d="M' + pts([C]) + ' ' + pts([v[0]]) + 'M' + pts([C]) + ' ' + pts([v[2]]) + 'M' + pts([C]) + ' ' + pts([v[4]]) + '"/></g>';
    s += '<g fill="none" stroke="rgba(255,255,255,.12)" stroke-width=".5">';
    [[0, 1, 2], [2, 3, 4], [4, 5, 0]].forEach(function (t) { var m = [(v[t[0]][0] + v[t[2]][0]) / 2, (v[t[0]][1] + v[t[2]][1]) / 2]; s += '<path d="M' + pts([m]) + ' ' + pts([v[t[1]]]) + '"/>'; });
    s += '</g>';
    s += poly([[cx - r * .42, cy - r * .5], [cx - r * .08, cy - r * .78], [cx + r * .06, cy - r * .5], [cx - r * .2, cy - r * .28]], 'rgba(255,255,255,.34)');
    X.body.push('<g>' + s + '</g>');
  }
  function dodecaCluster(X, o) {
    X.body.push(matrix(X, 118, 130, 120, o.seed));
    dodeca(X, { c: o.c, r: 22, cx: 66, cy: 118, rot: -10 });
    dodeca(X, { c: o.c, r: 16, cx: 168, cy: 122, rot: 14 });
    dodeca(X, { c: o.c, r: 38, cx: 118, cy: 98, rot: 6 });
    dodeca(X, { c: o.c, r: 12, cx: 96, cy: 128, rot: 25 });
    shadow(X, 118, 146, 76, 7);
  }

  /* ── форма 4: полированные кабошоны / срезы с узором ── */
  function blob(cx, cy, rx, ry, n, seed, j) {
    var r = rng(hash(seed)), P = [], i, a;
    for (i = 0; i < n; i++) { a = (i / n) * Math.PI * 2 + .3; var m = 1 + (r() - .5) * (j || .12); P.push([cx + rx * m * Math.cos(a), cy + ry * m * Math.sin(a)]); }
    var d = 'M' + f(P[0][0]) + ' ' + f(P[0][1]);
    for (i = 0; i < n; i++) {
      var p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      d += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
    }
    return d + 'Z';
  }
  function wave(r, x1, y1, x2, y2, amp, seg) {
    var d = 'M' + f(x1) + ' ' + f(y1), i, nx = -(y2 - y1), ny = x2 - x1, len = Math.sqrt(nx * nx + ny * ny) || 1;
    nx /= len; ny /= len;
    for (i = 1; i <= seg; i++) { var t = i / seg, o = (r() - .5) * 2 * amp; d += 'L' + f(x1 + (x2 - x1) * t + nx * o) + ' ' + f(y1 + (y2 - y1) * t + ny * o); }
    return d;
  }
  var PAT = {
    bands: function (X, o, r, cx, cy, rx, ry) {
      var s = '', i = 0, t = 1.1, c1 = hsl(o.c), c2 = hsl(o.c2), sd = o.seed + 'b' + o.cx;
      while (t > .05) {
        var col = i % 2 ? T(c2, (r() - .5) * 8) : T(c1, (r() - .5) * 12);
        s += '<path d="' + blob(cx - i * .9, cy + i * .6, rx * t, ry * t, 10, sd, .1) + '" fill="' + col + '" stroke="' + T(c1, -26, 0, .45) + '" stroke-width="' + f(.3 + r() * .5) + '"/>';
        t -= .03 + r() * .085; i++;
      }
      return s;
    },
    veins: function (X, o, r, cx, cy, rx, ry) {
      var s = '', i, c2 = hsl(o.c2), n = o.vn || 9;
      for (i = 0; i < n; i++) {
        var y = cy - ry + (i / (n - 1)) * ry * 2 + (r() - .5) * 10, w = .5 + r() * 2;
        s += '<path d="' + wave(r, cx - rx * 1.1, y + (r() - .5) * 26, cx + rx * 1.1, y + (r() - .5) * 26, 7, 9) + '" fill="none" stroke="' + T(c2, 0, 0, f(.45 + r() * .5)) + '" stroke-width="' + f(w) + '" stroke-linecap="round" stroke-linejoin="round"/>';
      }
      for (i = 0; i < 5; i++) s += '<circle cx="' + f(cx + (r() - .5) * rx * 1.6) + '" cy="' + f(cy + (r() - .5) * ry * 1.4) + '" r="' + f(4 + r() * 9) + '" fill="' + T(hsl(o.c), (r() - .5) * 26, 0, .28) + '"/>';
      return s;
    },
    specks: function (X, o, r, cx, cy, rx, ry) {
      var s = '', i, c2 = hsl(o.c2), n = o.sn || 70;
      for (i = 0; i < 6; i++) s += '<circle cx="' + f(cx + (r() - .5) * rx * 1.7) + '" cy="' + f(cy + (r() - .5) * ry * 1.5) + '" r="' + f(8 + r() * 14) + '" fill="' + T(hsl(o.c), (r() - .5) * 30, 0, .25) + '"/>';
      if (o.vein) for (i = 0; i < 3; i++) s += '<path d="' + wave(r, cx - rx, cy - ry * .6 + i * ry * .6, cx + rx, cy - ry * .2 + i * ry * .5, 8, 8) + '" stroke="rgba(245,245,248,.55)" stroke-width="' + f(1 + r() * 2) + '" fill="none" stroke-linecap="round"/>';
      for (i = 0; i < n; i++) s += '<circle cx="' + f(cx + (r() - .5) * rx * 2) + '" cy="' + f(cy + (r() - .5) * ry * 2) + '" r="' + f(.5 + r() * (o.big || 1.3)) + '" fill="' + T(c2, r() * 18, 0, f(.55 + r() * .45)) + '"/>';
      return s;
    },
    silk: function (X, o, r, cx, cy, rx, ry) {
      var s = '', i, g = uid('sk'), c = hsl(o.c), c2 = hsl(o.c2);
      X.defs.push(lin(g, 0, cy - ry, 0, cy + ry, [[0, T(c, -18)], [.34, T(c2, -6)], [.5, T(c2, 22)], [.66, T(c2, -8)], [1, T(c, -22)]], 1));
      s += '<rect x="' + f(cx - rx * 1.2) + '" y="' + f(cy - ry * 1.2) + '" width="' + f(rx * 2.4) + '" height="' + f(ry * 2.4) + '" fill="url(#' + g + ')"/>';
      for (i = 0; i < 60; i++) { var x = cx - rx * 1.1 + r() * rx * 2.2; s += '<line x1="' + f(x) + '" y1="' + f(cy - ry * 1.2) + '" x2="' + f(x + (r() - .5) * 8) + '" y2="' + f(cy + ry * 1.2) + '" stroke="' + (r() > .5 ? T(c, -26, 0, .4) : T(c2, 28, 0, .35)) + '" stroke-width="' + f(.4 + r() * 1.2) + '"/>'; }
      return s;
    },
    botry: function (X, o, r, cx, cy, rx, ry) {
      var s = '', i, j, c = hsl(o.c), c2 = hsl(o.c2), n = 7;
      s += '<rect x="' + f(cx - rx) + '" y="' + f(cy - ry) + '" width="' + f(rx * 2) + '" height="' + f(ry * 2) + '" fill="' + T(c, -8) + '"/>';
      for (i = 0; i < n; i++) {
        var px = cx - rx * .8 + r() * rx * 1.6, py = cy - ry * .7 + r() * ry * 1.4, R = 16 + r() * 16;
        for (j = 0; j < 6; j++) s += '<circle cx="' + f(px) + '" cy="' + f(py) + '" r="' + f(R - j * (R / 6.5)) + '" fill="' + (j % 2 ? T(c2, -6 - j * 3) : T(c, -14 + j * 2)) + '" stroke="' + T(c, -30, 0, .5) + '" stroke-width=".4"/>';
      }
      return s;
    },
    fire: function (X, o, r, cx, cy, rx, ry) {
      var s = '', i, cols = ['#37d6a5', '#4b7cf0', '#f08a3a', '#e5487f', '#9fe36a', '#7c5cf0'];
      for (i = 0; i < 16; i++) {
        var g = uid('of'), col = cols[Math.floor(r() * cols.length)], x = cx + (r() - .5) * rx * 1.7, y = cy + (r() - .5) * ry * 1.6, R = 6 + r() * 15;
        X.defs.push(rad(g, x, y, R, [[0, col, .75], [1, col, 0]]));
        s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(R) + '" fill="url(#' + g + ')"/>';
      }
      return s;
    },
    spots: function (X, o, r, cx, cy, rx, ry) {
      var s = '', i, c2 = hsl(o.c2);
      for (i = 0; i < 26; i++) s += '<circle cx="' + f(cx + (r() - .5) * rx * 2) + '" cy="' + f(cy + (r() - .5) * ry * 2) + '" r="' + f(1.4 + r() * 3.4) + '" fill="' + T(c2, (r() - .5) * 20, 0, f(.7 + r() * .3)) + '"/>';
      for (i = 0; i < 5; i++) s += '<circle cx="' + f(cx + (r() - .5) * rx * 1.6) + '" cy="' + f(cy + (r() - .5) * ry * 1.5) + '" r="' + f(8 + r() * 10) + '" fill="' + T(hsl(o.c), (r() - .5) * 20, 0, .3) + '"/>';
      return s;
    },
    swirl: function (X, o, r, cx, cy, rx, ry) {
      var s = '', i, c = hsl(o.c), c2 = hsl(o.c2);
      for (i = 0; i < 12; i++) {
        var y = cy - ry * 1.1 + (i / 11) * ry * 2.2, col = i % 3 === 0 ? T(c2, -6, 0, .75) : i % 3 === 1 ? T(c, 10, 0, .7) : T(c, -22, 0, .8);
        s += '<path d="' + wave(r, cx - rx * 1.1, y + (r() - .5) * 20, cx + rx * 1.1, y + (r() - .5) * 20, 12, 10) + '" fill="none" stroke="' + col + '" stroke-width="' + f(3 + r() * 6) + '" stroke-linecap="round" stroke-linejoin="round"/>';
      }
      for (i = 0; i < 9; i++) s += '<circle cx="' + f(cx + (r() - .5) * rx * 1.8) + '" cy="' + f(cy + (r() - .5) * ry * 1.6) + '" r="' + f(1 + r() * 2.4) + '" fill="rgba(10,8,14,.7)"/>';
      return s;
    },
    plain: function (X, o, r, cx, cy, rx, ry) {
      var g = uid('pn'), c = hsl(o.c), s = '';
      X.defs.push(rad(g, cx, cy, rx * 1.05, [[0, T(c, 16, 0, .0)], [.65, T(c, 6, 0, .0)], [1, T(c, -18, 0, .35)]]));
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + f(rx * 1.2) + '" fill="url(#' + g + ')"/>';
      for (var i = 0; i < 4; i++) s += '<path d="' + wave(r, cx - rx, cy - ry + i * ry * .7, cx + rx, cy - ry * .6 + i * ry * .7, 10, 8) + '" fill="none" stroke="' + T(c, 14, 0, .16) + '" stroke-width="' + f(2 + r() * 4) + '" stroke-linecap="round"/>';
      return s;
    },
    sheenLab: function (X, o, r, cx, cy, rx, ry) {
      var g = uid('lb'), s = '', i;
      X.defs.push(lin(g, cx - rx * .7, cy + ry * .8, cx + rx * .4, cy - ry * .9, [[0, '#0b2a5c', 0], [.28, '#1f5fc4', .55], [.46, '#2fb6d6', .85], [.58, '#3a8fe0', .7], [.74, '#d8c25a', .35], [.9, '#d8c25a', 0]], 1));
      s += '<rect x="' + f(cx - rx * 1.3) + '" y="' + f(cy - ry * 1.3) + '" width="' + f(rx * 2.6) + '" height="' + f(ry * 2.6) + '" fill="url(#' + g + ')"/>';
      for (i = 0; i < 40; i++) { var x = cx - rx + (i / 39) * rx * 2.2; s += '<line x1="' + f(x) + '" y1="' + f(cy + ry * 1.2) + '" x2="' + f(x + ry * .9) + '" y2="' + f(cy - ry * 1.2) + '" stroke="rgba(255,255,255,' + f(.03 + r() * .08) + ')" stroke-width="' + f(.4 + r() * .6) + '"/>'; }
      for (i = 0; i < 14; i++) s += '<circle cx="' + f(cx + (r() - .5) * rx * 2) + '" cy="' + f(cy + (r() - .5) * ry * 2) + '" r="' + f(1 + r() * 4) + '" fill="rgba(180,190,200,' + f(.1 + r() * .14) + ')"/>';
      return s;
    },
    sheenMoon: function (X, o, r, cx, cy, rx, ry) {
      var g = uid('mn'), s = '';
      X.defs.push(rad(g, cx - rx * .15, cy - ry * .1, rx * .9, [[0, '#cfe0ff', .95], [.45, '#a9c4f5', .55], [1, '#a9c4f5', 0]]));
      s += '<ellipse cx="' + f(cx - rx * .12) + '" cy="' + f(cy - ry * .05) + '" rx="' + f(rx * .85) + '" ry="' + f(ry * .75) + '" fill="url(#' + g + ')"/>';
      for (var i = 0; i < 30; i++) s += '<path d="M' + f(cx - rx + r() * rx * 2) + ' ' + f(cy - ry) + 'Q' + f(cx + (r() - .5) * rx) + ' ' + f(cy) + ' ' + f(cx - rx + r() * rx * 2) + ' ' + f(cy + ry) + '" stroke="rgba(255,255,255,' + f(.04 + r() * .1) + ')" stroke-width="' + f(.5 + r() * .8) + '" fill="none"/>';
      return s;
    },
    sheenSun: function (X, o, r, cx, cy, rx, ry) {
      var g = uid('sn'), s = '', c2 = hsl(o.c2), i;
      X.defs.push(rad(g, cx - rx * .2, cy - ry * .2, rx * .9, [[0, T(c2, 12, 0, .85)], [1, T(c2, 0, 0, 0)]]));
      s += '<ellipse cx="' + f(cx - rx * .18) + '" cy="' + f(cy - ry * .15) + '" rx="' + f(rx * .85) + '" ry="' + f(ry * .8) + '" fill="url(#' + g + ')"/>';
      for (i = 0; i < 90; i++) s += '<circle cx="' + f(cx + (r() - .5) * rx * 2) + '" cy="' + f(cy + (r() - .5) * ry * 2) + '" r="' + f(.4 + r() * 1.1) + '" fill="rgba(255,236,170,' + f(.4 + r() * .6) + ')"/>';
      return s;
    }
  };
  function slabOne(X, o) {
    var r = rng(hash(o.seed + o.cx)), c = hsl(o.c), id = uid('sb'), cl = uid('cp'), body = uid('bd'), d = blob(o.cx, o.cy, o.rx, o.ry, 10, o.seed + 'b' + o.cx, .1);
    X.defs.push('<clipPath id="' + cl + '"><path d="' + d + '"/></clipPath>',
      rad(body, o.cx - o.rx * .3, o.cy - o.ry * .4, o.rx * 1.25, [[0, T(c, 20)], [.55, T(c, 2)], [1, T(c, -24)]]),
      rad(id, o.cx - o.rx * .35, o.cy - o.ry * .55, o.rx * .6, [[0, '#fff', .55], [1, '#fff', 0]]));
    var s = '<path d="' + d + '" fill="url(#' + body + ')"/>';
    s += '<g clip-path="url(#' + cl + ')">' + (PAT[o.pat] || PAT.plain)(X, o, r, o.cx, o.cy, o.rx, o.ry) +
      // объём: тёмный край и мягкий блик
      '<path d="' + d + '" fill="none" stroke="rgba(0,0,0,.4)" stroke-width="7"/></g>';
    s += '<ellipse cx="' + f(o.cx - o.rx * .35) + '" cy="' + f(o.cy - o.ry * .5) + '" rx="' + f(o.rx * .5) + '" ry="' + f(o.ry * .32) + '" fill="url(#' + id + ')"/>';
    s += '<path d="' + d + '" fill="none" stroke="' + T(c, 30, -10, .5) + '" stroke-width=".8"/>';
    s += '<path d="M' + f(o.cx - o.rx * .74) + ' ' + f(o.cy - o.ry * .1) + 'Q' + f(o.cx - o.rx * .68) + ' ' + f(o.cy - o.ry * .72) + ' ' + f(o.cx - o.rx * .1) + ' ' + f(o.cy - o.ry * .86) + '" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1.6" stroke-linecap="round"/>';
    X.body.push(s);
  }
  function slab(X, o) {
    slabOne(X, { cx: 112, cy: 78, rx: 64, ry: 46, c: o.c, c2: o.c2, pat: o.pat, seed: o.seed, vn: o.vn, sn: o.sn, vein: o.vein, big: o.big });
    slabOne(X, { cx: 178, cy: 112, rx: 30, ry: 23, c: o.c, c2: o.c2, pat: o.pat, seed: o.seed + 'x', vn: 5, sn: 26, vein: o.vein, big: o.big });
    shadow(X, 120, 140, 88, 8);
  }

  /* ── форма 5: необработанные куски (обсидиан, гематит, лава, розовый кварц) ── */
  function rough(X, o) {
    function piece(cx, cy, rx, ry, seed, k) {
      var r = rng(hash(seed)), n = 9, v = [], i, c = hsl(o.c), a, m;
      for (i = 0; i < n; i++) { a = (i / n) * Math.PI * 2 + .4; m = .72 + r() * .34; v.push([cx + rx * m * Math.cos(a), cy + ry * m * Math.sin(a)]); }
      var C = [cx - rx * .12, cy - ry * .22], s = '', ct = o.metal ? 30 : 17;
      for (i = 0; i < n; i++) {
        var p = v[i], q = v[(i + 1) % n], mid = [(p[0] + q[0]) / 2 - C[0], (p[1] + q[1]) / 2 - C[1]], ang = Math.atan2(mid[1], mid[0]), lt = Math.cos(ang + 2.3);
        s += poly([C, p, q], T(c, lt * ct + (o.glossDark ? -3 : 0) + k, o.metal ? -6 : 0, o.alpha), ' stroke="' + T(c, 30, 0, .25) + '" stroke-width=".5"' + EDGE);
      }
      if (o.pores) { for (i = 0; i < 34; i++) { var px = cx + (r() - .5) * rx * 1.6, py = cy + (r() - .5) * ry * 1.6; s += '<ellipse cx="' + f(px) + '" cy="' + f(py) + '" rx="' + f(.8 + r() * 2.6) + '" ry="' + f(.6 + r() * 1.8) + '" fill="rgba(8,8,10,.6)" stroke="rgba(255,255,255,.14)" stroke-width=".4"/>'; } }
      if (o.gloss) {
        s += poly([[cx - rx * .5, cy - ry * .35], [cx - rx * .05, cy - ry * .62], [cx + rx * .05, cy - ry * .45], [cx - rx * .34, cy - ry * .2]], 'rgba(160,190,230,.28)');
        s += '<path d="M' + f(cx - rx * .55) + ' ' + f(cy + ry * .1) + 'Q' + f(cx - rx * .3) + ' ' + f(cy + ry * .5) + ' ' + f(cx + rx * .2) + ' ' + f(cy + ry * .55) + '" fill="none" stroke="rgba(190,210,240,.25)" stroke-width="1"/>';
      }
      if (o.metal) s += poly([[cx - rx * .5, cy - ry * .3], [cx - rx * .15, cy - ry * .55], [cx - rx * .05, cy - ry * .4]], 'rgba(255,255,255,.5)');
      if (o.frost) { for (i = 0; i < 6; i++) s += '<path d="' + wave(r, cx - rx * .6 + r() * rx * 1.2, cy - ry * .6, cx - rx * .6 + r() * rx * 1.2, cy + ry * .6, 5, 5) + '" stroke="rgba(255,255,255,' + f(.15 + r() * .2) + ')" stroke-width=".7" fill="none"/>'; }
      return s;
    }
    X.body.push(piece(112, 80, 62, 46, o.seed, 0));
    X.body.push(piece(176, 116, 28, 21, o.seed + 'b', -4));
    shadow(X, 118, 140, 84, 8);
  }

  /* ── форма 6: жемчуг ── */
  function orb(X, o) {
    var c = hsl(o.c);
    function pearl(cx, cy, r) {
      var g = uid('pe'), h = uid('ph'), rim = uid('pr');
      X.defs.push(rad(g, cx - r * .35, cy - r * .4, r * 1.35, [[0, '#ffffff'], [.35, T(c, 6)], [.8, T(c, -14)], [1, T(c, -32)]]),
        rad(rim, cx, cy, r, [[.75, '#000', 0], [1, '#a9c9c0', .3]]),
        rad(h, cx - r * .38, cy - r * .42, r * .3, [[0, '#fff', .95], [1, '#fff', 0]]));
      return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#' + g + ')"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#' + rim + ')"/><ellipse cx="' + f(cx - r * .38) + '" cy="' + f(cy - r * .42) + '" rx="' + f(r * .3) + '" ry="' + f(r * .22) + '" fill="url(#' + h + ')"/>';
    }
    X.body.push(pearl(158, 108, 22), pearl(108, 80, 38), pearl(76, 118, 15));
    shadow(X, 118, 142, 80, 8);
  }

  /* ── форма 7: ветвистый коралл ── */
  function branch(X, o) {
    var r = rng(hash(o.seed)), c = hsl(o.c), s = '';
    function seg(x, y, ang, len, w, depth) {
      var x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len, mx = (x + x2) / 2 + (r() - .5) * len * .3, my = (y + y2) / 2 + (r() - .5) * len * .3;
      s += '<path d="M' + f(x) + ' ' + f(y) + 'Q' + f(mx) + ' ' + f(my) + ' ' + f(x2) + ' ' + f(y2) + '" fill="none" stroke="' + T(c, -10 + depth * 4) + '" stroke-width="' + f(w) + '" stroke-linecap="round"/>';
      s += '<path d="M' + f(x - w * .2) + ' ' + f(y) + 'Q' + f(mx - w * .2) + ' ' + f(my) + ' ' + f(x2 - w * .2) + ' ' + f(y2) + '" fill="none" stroke="' + T(c, 26, -6, .45) + '" stroke-width="' + f(Math.max(.7, w * .28)) + '" stroke-linecap="round"/>';
      if (depth < 3) {
        seg(x2, y2, ang - .5 - r() * .3, len * .75, w * .68, depth + 1);
        seg(x2, y2, ang + .45 + r() * .35, len * .7, w * .66, depth + 1);
        if (depth < 2 && r() > .35) seg((x + x2) / 2, (y + y2) / 2, ang + (r() > .5 ? .9 : -.9), len * .5, w * .5, depth + 2);
      }
    }
    seg(112, 132, -Math.PI / 2 - .1, 34, 11, 0);
    seg(140, 134, -Math.PI / 2 + .35, 26, 7, 1);
    var g = uid('cb');
    X.defs.push(lin(g, 0, 126, 0, 144, [[0, '#4a4f57'], [1, '#15181c']]));
    X.body.push('<path d="M84 137 Q112 126 156 136 L162 146 L80 146Z" fill="url(#' + g + ')"/>' + s);
    shadow(X, 118, 146, 76, 7);
  }

  /* ── каталог внешнего вида камней: ключ = русское название ── */
  var LOOK = {
    'Соколиный глаз': ['slab', 'silk', '#3b4f63', '#8aa3bb'],
    'Рубин': ['point', '#b0112a', { squat: 1, clear: 1 }],
    'Чёрный агат': ['slab', 'bands', '#15171a', '#3a4047'],
    'Родонит': ['slab', 'veins', '#c9587a', '#17171a', { vn: 6 }],
    'Жемчуг': ['orb', '#efe6da'],
    'Бирюза': ['slab', 'veins', '#2fb3b0', '#5a4632', { vn: 8 }],
    'Яшма': ['slab', 'bands', '#7d301c', '#c68537'],
    'Аметист': ['point', '#7a44b8', { stri: '' }],
    'Горный хрусталь': ['point', '#d6e8f2', { clear: 1 }],
    'Гелиотроп': ['slab', 'spots', '#1d4a3a', '#c23a2c'],
    'Нефрит': ['slab', 'plain', '#4f8a5b'],
    'Лава': ['rough', '#5a5a60', { pores: 1 }],
    'Тигровый глаз': ['slab', 'silk', '#6e3f0e', '#e0a93b'],
    'Изумруд': ['point', '#0f8455', { slender: 1, clear: 1 }],
    'Турмалин': ['point', '#1e2025', { stri: 'tur', slender: 1 }],
    'Гранат': ['dodeca', '#8c1230'],
    'Цитрин': ['point', '#e3a422', { clear: 1 }],
    'Амазонит': ['slab', 'veins', '#3fb8a2', '#e8f2ee', { vn: 7 }],
    'Лазурит': ['slab', 'specks', '#1b3f9e', '#d9b13b', { vein: 1, sn: 90 }],
    'Агат': ['slab', 'bands', '#8a7d9e', '#efe8df'],
    'Сапфир': ['point', '#1f48ac', { squat: 1, clear: 1 }],
    'Хризопраз': ['slab', 'plain', '#57c48a'],
    'Лунный камень': ['slab', 'sheenMoon', '#dbe3ee', '#9fbcf0'],
    'Берилл': ['point', '#c7d76e', { clear: 1 }],
    'Сардоникс': ['slab', 'bands', '#7a3d1c', '#efe6d6'],
    'Малахит': ['slab', 'botry', '#0e6b45', '#7fd6a8'],
    'Солнечный камень': ['slab', 'sheenSun', '#c9651f', '#ffd98a'],
    'Розовый кварц': ['rough', '#ecb6c8', { alpha: .96, frost: 1 }],
    'Авантюрин': ['slab', 'specks', '#2f8f5c', '#bdeccc', { sn: 120, big: 1.1 }],
    'Опал': ['slab', 'fire', '#efeae2', '#fff'],
    'Обсидиан': ['rough', '#22252b', { gloss: 1, glossDark: 1 }],
    'Коралл': ['branch', '#d9472f'],
    'Сердолик': ['slab', 'plain', '#d9642a'],
    'Аквамарин': ['point', '#7cc6dc', { clear: 1, slender: 1 }],
    'Чароит': ['slab', 'swirl', '#7b3fa8', '#d6b5ee'],
    'Гематит': ['rough', '#5f656e', { metal: 1 }],
    'Корунд': ['point', '#7f98c0', { squat: 1 }],
    'Змеевик': ['slab', 'veins', '#4f7d3c', '#1d2a1a', { vn: 8 }],
    'Топаз': ['point', '#84bde2', { clear: 1 }],
    'Альмандин': ['dodeca', '#7a1028'],
    // дополнительные минералы «недели» и каталога
    'Флюорит': ['cubes', '#7f4cc4', '#43d1b0'],
    'Пирит': ['cubes', '#c9a227', '', { pyr: 1 }],
    'Лабрадорит': ['slab', 'sheenLab', '#3b4653', '#7fa3c8'],
    'Содалит': ['slab', 'veins', '#2a4ba6', '#f2f2f5', { vn: 6 }],
    'Кианит': ['point', '#4f7fd0', { blade: 1 }],
    'Ларимар': ['slab', 'veins', '#78cfe0', '#ffffff', { vn: 7 }],
    'Кварц': ['point', '#d6e8f2', { clear: 1 }],
    'Кунцит': ['point', '#e0a6d0', { clear: 1 }],
    'Морганит': ['point', '#f0b8ad', { clear: 1 }],
    'Раухтопаз': ['point', '#6b5646', { clear: 1 }],
    'Мукаит': ['slab', 'bands', '#a53a2d', '#e6b04a'],
    'Жадеит': ['slab', 'plain', '#6aa878']
  };

  function render(name, size) {
    if (PHOTOS[name]) return '<img class="xtl" src="' + esc(PHOTOS[name]) + '" alt="' + esc(size || name) + '" width="720" height="720" loading="lazy" decoding="async">';
    var L = LOOK[name]; if (!L) return '';
    var X = { defs: [], body: [] }, form = L[0], seed = name, label = name, o;
    if (form === 'point') {
      var op = L[2] || {};
      o = { c: hsl(L[1]), clear: op.clear, stri: op.stri, seed: seed };
      if (op.squat) { o.list = [
        { cx: 78, by: 128, w: 34, h: 30, tip: 9, rot: -12, k: -10 }, { cx: 164, by: 130, w: 38, h: 36, tip: 10, rot: 12, k: -8 },
        { cx: 122, by: 134, w: 62, h: 58, tip: 14, rot: -1, k: 0 }]; }
      if (op.slender) { o.list = [
        { cx: 82, by: 130, w: 16, h: 52, tip: 14, rot: -13, k: -10 }, { cx: 162, by: 131, w: 18, h: 60, tip: 15, rot: 12, k: -8 },
        { cx: 104, by: 133, w: 14, h: 44, tip: 12, rot: -6, k: -4 }, { cx: 140, by: 134, w: 15, h: 48, tip: 12, rot: 6, k: -2 },
        { cx: 121, by: 135, w: 24, h: 82, tip: 22, rot: -1, k: 0 }]; o.slender = 1; }
      if (op.blade) { o.list = [
        { cx: 76, by: 130, w: 12, h: 50, tip: 4, rot: -22, k: -12 }, { cx: 92, by: 132, w: 14, h: 62, tip: 5, rot: -12, k: -8 },
        { cx: 150, by: 132, w: 14, h: 60, tip: 5, rot: 14, k: -6 }, { cx: 168, by: 131, w: 12, h: 46, tip: 4, rot: 24, k: -12 },
        { cx: 122, by: 136, w: 18, h: 84, tip: 6, rot: 1, k: 0 }, { cx: 106, by: 135, w: 13, h: 68, tip: 5, rot: -5, k: -4 }]; o.slender = 1; o.stri = 'ky'; }
      pointCluster(X, o);
    } else if (form === 'cubes') { cubeCluster(X, { c: hsl(L[1]), c2: hsl(L[2] || L[1]), pyr: (L[3] || {}).pyr }); }
    else if (form === 'dodeca') { dodecaCluster(X, { c: hsl(L[1]), seed: seed }); }
    else if (form === 'slab') { var ox = L[4] || {}; slab(X, { pat: L[1], c: L[2], c2: L[3] || L[2], seed: seed, vn: ox.vn, sn: ox.sn, vein: ox.vein, big: ox.big }); }
    else if (form === 'rough') { var orr = L[2] || {}; rough(X, { c: L[1], seed: seed, pores: orr.pores, gloss: orr.gloss, glossDark: orr.glossDark, metal: orr.metal, alpha: orr.alpha, frost: orr.frost }); }
    else if (form === 'orb') { orb(X, { c: L[1] }); }
    else if (form === 'branch') { branch(X, { c: L[1], seed: seed }); }
    return '<svg class="xtl" viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(size || label) + '" preserveAspectRatio="xMidYMid meet"><defs>' + X.defs.join('') + '</defs>' + X.body.join('') + '</svg>';
  }

  /* фото кристаллов (assets/min, 89 файлов): ключ камня → файл; есть у каждого камня из LOOK и у EXTRA */
  var PHOTOS = {
    "Соколиный глаз": "/assets/min/hawks_eye.webp",
    "Рубин": "/assets/min/ruby.webp",
    "Чёрный агат": "/assets/min/black_agate.webp",
    "Родонит": "/assets/min/rhodonite.webp",
    "Жемчуг": "/assets/min/pearl.webp",
    "Бирюза": "/assets/min/turquoise.webp",
    "Яшма": "/assets/min/jasper.webp",
    "Аметист": "/assets/min/amethyst.webp",
    "Горный хрусталь": "/assets/min/clear_quartz.webp",
    "Гелиотроп": "/assets/min/bloodstone.webp",
    "Нефрит": "/assets/min/nephrite.webp",
    "Лава": "/assets/min/lava.webp",
    "Тигровый глаз": "/assets/min/tiger_eye.webp",
    "Изумруд": "/assets/min/emerald.webp",
    "Турмалин": "/assets/min/black_tourmaline.webp",
    "Гранат": "/assets/min/garnet.webp",
    "Цитрин": "/assets/min/citrine.webp",
    "Амазонит": "/assets/min/amazonite.webp",
    "Лазурит": "/assets/min/lapis_lazuli.webp",
    "Агат": "/assets/min/agate.webp",
    "Сапфир": "/assets/min/sapphire.webp",
    "Хризопраз": "/assets/min/chrysoprase.webp",
    "Лунный камень": "/assets/min/moonstone.webp",
    "Берилл": "/assets/min/beryl.webp",
    "Сардоникс": "/assets/min/sardonyx.webp",
    "Малахит": "/assets/min/malachite.webp",
    "Солнечный камень": "/assets/min/sunstone.webp",
    "Розовый кварц": "/assets/min/rose_quartz.webp",
    "Авантюрин": "/assets/min/aventurine.webp",
    "Опал": "/assets/min/opal.webp",
    "Обсидиан": "/assets/min/obsidian.webp",
    "Коралл": "/assets/min/coral.webp",
    "Сердолик": "/assets/min/carnelian.webp",
    "Аквамарин": "/assets/min/aquamarine.webp",
    "Чароит": "/assets/min/charoite.webp",
    "Гематит": "/assets/min/hematite.webp",
    "Корунд": "/assets/min/corundum.webp",
    "Змеевик": "/assets/min/serpentine.webp",
    "Топаз": "/assets/min/topaz.webp",
    "Альмандин": "/assets/min/garnet.webp",
    "Флюорит": "/assets/min/fluorite.webp",
    "Пирит": "/assets/min/pyrite.webp",
    "Лабрадорит": "/assets/min/labradorite.webp",
    "Содалит": "/assets/min/sodalite.webp",
    "Кианит": "/assets/min/kyanite.webp",
    "Ларимар": "/assets/min/larimar.webp",
    "Кварц": "/assets/min/clear_quartz.webp",
    "Кунцит": "/assets/min/kunzite.webp",
    "Морганит": "/assets/min/morganite.webp",
    "Раухтопаз": "/assets/min/smoky_quartz.webp",
    "Мукаит": "/assets/min/mookaite.webp",
    "Жадеит": "/assets/min/jadeite.webp",
    "Янтарь": "/assets/min/amber.webp",
    "Аметрин": "/assets/min/ametrine.webp",
    "Ангелит": "/assets/min/angelite.webp",
    "Апатит": "/assets/min/apatite.webp",
    "Апофиллит": "/assets/min/apophyllite.webp",
    "Чёрный оникс": "/assets/min/black_onyx.webp",
    "Оникс": "/assets/min/onyx.webp",
    "Кальцит": "/assets/min/blue_calcite.webp",
    "Бронзит": "/assets/min/bronzite.webp",
    "Кахолонг": "/assets/min/cacholong.webp",
    "Хризоколла": "/assets/min/chrysocolla.webp",
    "Данбурит": "/assets/min/danburite.webp",
    "Алмаз": "/assets/min/diamond.webp",
    "Золотистый кварц": "/assets/min/golden_quartz.webp",
    "Зелёный кварц": "/assets/min/green_quartz.webp",
    "Иолит": "/assets/min/iolite.webp",
    "Лепидолит": "/assets/min/lepidolite.webp",
    "Манганокальцит": "/assets/min/mangano_calcite.webp",
    "Анкерит": "/assets/min/manganoan_ankerite.webp",
    "Молдавит": "/assets/min/moldavite.webp",
    "Морион": "/assets/min/morion.webp",
    "Моховой агат": "/assets/min/moss_agate.webp",
    "Перламутр": "/assets/min/mother_of_pearl.webp",
    "Хризолит": "/assets/min/peridot.webp",
    "Фенакит": "/assets/min/phenakite.webp",
    "Розовый опал": "/assets/min/pink_opal.webp",
    "Розовый турмалин": "/assets/min/pink_tourmaline.webp",
    "Пренит": "/assets/min/prehnite.webp",
    "Родохрозит": "/assets/min/rhodochrosite.webp",
    "Рутиловый кварц": "/assets/min/rutilated_quartz.webp",
    "Селенит": "/assets/min/selenite.webp",
    "Серафинит": "/assets/min/seraphinite.webp",
    "Шерл": "/assets/min/black_tourmaline.webp",
    "Шунгит": "/assets/min/shungite.webp",
    "Сугилит": "/assets/min/sugilite.webp",
    "Танзанит": "/assets/min/tanzanite.webp",
    "Турмалиновый кварц": "/assets/min/tourmalinated_quartz.webp",
    "Унакит": "/assets/min/unakite.webp",
    "Зелёный турмалин": { n: ["Turmalină verde", "Green Tourmaline"], h: "#5b8c3c", s: ["зелены турмалин", "верделит"] },
    "Арбузный кварц": "/assets/min/watermelon_quartz.webp",
    "Зелёный турмалин": "/assets/min/tourmaline.webp",
    "Хрусталь": "/assets/min/clear_quartz.webp",
    "Лунный": "/assets/min/moonstone.webp"
  };
  /* камни без нарисованной версии — только фото; h: цвет плитки украшения; s: наборы основ для поиска в названиях каталога (как есть, без усечения) */
  var EXTRA = {
    "Янтарь": { n: ["Chihlimbar", "Amber"], h: "#b1560e", s: ["янтар"] },
    "Аметрин": { n: ["Ametrin", "Ametrine"], h: "#9d6048", s: ["аметрин"] },
    "Ангелит": { n: ["Angelit", "Angelite"], h: "#7d95b4", s: ["ангелит"] },
    "Апатит": { n: ["Apatit", "Apatite"], h: "#279c94", s: ["апатит", "аппатит"] },
    "Апофиллит": { n: ["Apofilit", "Apophyllite"], h: "#ada194", s: ["апофиллит", "апофил"] },
    "Чёрный оникс": { n: ["Onix negru", "Black Onyx"], h: "#6a6462", s: ["черны оникс"] },
    "Оникс": { n: ["Onix", "Onyx"], h: "#6e6661", s: ["оникс"] },
    "Кальцит": { n: ["Calcit albastru", "Blue Calcite"], h: "#7a99b8", s: ["кальцит"] },
    "Бронзит": { n: ["Bronzit", "Bronzite"], h: "#95532b", s: ["бронзит"] },
    "Кахолонг": { n: ["Cacholong", "Cacholong"], h: "#b0a9a3", s: ["кахолонг"] },
    "Хризоколла": { n: ["Crisocolă", "Chrysocolla"], h: "#23a49a", s: ["хризокол"] },
    "Данбурит": { n: ["Danburit", "Danburite"], h: "#b8978c", s: ["данбурит"] },
    "Алмаз": { n: ["Diamant", "Diamond"], h: "#9e8f78", s: ["алмаз", "бриллиант"] },
    "Золотистый кварц": { n: ["Cuarț auriu", "Golden Quartz"], h: "#bb762c", s: ["золотист кварц"] },
    "Зелёный кварц": { n: ["Cuarț verde", "Green Quartz"], h: "#727d54", s: ["зелены кварц"] },
    "Иолит": { n: ["Iolit", "Iolite"], h: "#504f7c", s: ["иолит", "кордиерит"] },
    "Лепидолит": { n: ["Lepidolit", "Lepidolite"], h: "#6b5360", s: ["лепидолит", "лепидот"] },
    "Манганокальцит": { n: ["Manganocalcit", "Mangano Calcite"], h: "#c5928f", s: ["манганокальцит", "марганцев кальцит"] },
    "Анкерит": { n: ["Ankerit", "Manganoan Ankerite"], h: "#9e7053", s: ["анкерит"] },
    "Молдавит": { n: ["Moldavit", "Moldavite"], h: "#7c8b37", s: ["молдавит"] },
    "Морион": { n: ["Morion", "Morion"], h: "#815f42", s: ["морион"] },
    "Моховой агат": { n: ["Agat cu mușchi", "Moss Agate"], h: "#526150", s: ["мохов агат"] },
    "Перламутр": { n: ["Sidef", "Mother-of-pearl"], h: "#b8a691", s: ["перламутр"] },
    "Хризолит": { n: ["Peridot", "Peridot"], h: "#adb40f", s: ["хризолит", "оливин", "перидот"] },
    "Фенакит": { n: ["Fenachit", "Phenakite"], h: "#a6998b", s: ["фенакит"] },
    "Розовый опал": { n: ["Opal roz", "Pink Opal"], h: "#c08186", s: ["розов опал"] },
    "Розовый турмалин": { n: ["Turmalină roz", "Pink Tourmaline"], h: "#a02e3d", s: ["розов турмалин", "рубеллит"] },
    "Пренит": { n: ["Prehnit", "Prehnite"], h: "#808b4f", s: ["пренит"] },
    "Родохрозит": { n: ["Rodocrozit", "Rhodochrosite"], h: "#b54f59", s: ["родохрозит"] },
    "Рутиловый кварц": { n: ["Cuarț rutilat", "Rutilated Quartz"], h: "#a7783e", s: ["рутилов кварц"] },
    "Селенит": { n: ["Selenit", "Selenite"], h: "#b4aba1", s: ["селенит"] },
    "Серафинит": { n: ["Serafinit", "Seraphinite"], h: "#5a7156", s: ["серафинит"] },
    "Шерл": { n: ["Schorl", "Schorl"], h: "#716659", s: ["шерл"] },
    "Шунгит": { n: ["Șungit", "Shungite"], h: "#666161", s: ["шунгит"] },
    "Сугилит": { n: ["Sugilit", "Sugilite"], h: "#7126a0", s: ["сугилит"] },
    "Танзанит": { n: ["Tanzanit", "Tanzanite"], h: "#453d79", s: ["танзанит"] },
    "Турмалиновый кварц": { n: ["Cuarț turmalinat", "Tourmalinated Quartz"], h: "#867567", s: ["турмалинов кварц"] },
    "Унакит": { n: ["Unakit", "Unakite"], h: "#9c7132", s: ["унакит"] },
    "Хрусталь": { n: ["Cristal de stâncă", "Clear Quartz"], h: "#cfe3ee", s: ["хрусталь"] },
    "Лунный": { n: ["Piatra lunii", "Moonstone"], h: "#b9cdea", s: ["лунны"] },
    "Арбузный кварц": { n: ["Cuarț pepene", "Watermelon Quartz"], h: "#aa645d", s: ["арбузны кварц"] }
  };

  /* ── ключ камня по названию изделия из каталога ── */
  var STEM = null;
  function norm(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/["«»“”]/g, ''); }
  function buildStems() {
    STEM = Object.keys(LOOK).map(function (k) {
      var st = norm(k).split(/\s+/).filter(function (w) { return w.length > 2; }).map(function (w) { return w.length > 5 ? w.slice(0, 5) : w; });
      return { k: k, st: st, len: st.join('').length };
    });
    Object.keys(EXTRA).forEach(function (k) {
      EXTRA[k].s.forEach(function (set) { var st = set.split(' '); STEM.push({ k: k, st: st, len: st.join('').length }); });
    });
    STEM.sort(function (a, b) { return b.len - a.len; });
  }
  function keyForName(n) {
    if (!STEM) buildStems();
    var words = norm(n).split(/[^a-zа-я0-9]+/);
    function hit(s) { return words.some(function (w) { return s.length < 5 ? w === s : w.indexOf(s) === 0; }); }
    for (var i = 0; i < STEM.length; i++) { var e = STEM[i]; if (e.st.length && e.st.every(hit)) return e.k; }
    return '';
  }
  function tint(name) { var k = keyForName(name); if (!k) return null; if (!LOOK[k]) return EXTRA[k] ? { key: k, hex: EXTRA[k].h } : null; var L = LOOK[k]; var c = L[0] === 'slab' ? L[2] : L[1]; if (L[0] === 'slab' && L[1] === 'sheenLab') c = '#5f86b3'; if (L[0] === 'slab' && L[1] === 'sheenMoon') c = '#b9cdea'; return { key: k, hex: c }; }

  /* ── «минерал недели»: 26 позиций, смена каждый понедельник ── */
  var SYS = {
    cub: ['кубическая', 'cubică', 'cubic'], tri: ['тригональная', 'trigonală', 'trigonal'], mon: ['моноклинная', 'monoclinică', 'monoclinic'],
    tcl: ['триклинная', 'triclinică', 'triclinic'], hex: ['гексагональная', 'hexagonală', 'hexagonal'], amo: ['аморфный', 'amorf', 'amorphous'],
    cry: ['скрытокристаллическая', 'criptocristalină', 'cryptocrystalline']
  };
  // n: [ru, ro, en]; look: ключ в LOOK; q: поисковая основа для каталога; p: для чего камень (коротко); w: когда подходит; t: описание для женщины [ru, ro, en] — на утверждение Натальи; f/m/s: состав, твёрдость, сингония (в карточке не показываются)
  var WEEK = [
    { look: "Флюорит", q: "флюорит", n: ["Флюорит", "Fluorină", "Fluorite"], f: "CaF₂", m: "4", s: "cub",
      p: ["Ясность и фокус", "Claritate și concentrare", "Clarity and focus"],
      w: ["слишком много задач сразу", "prea multe sarcini deodată", "too many tasks at once"],
      t: [
        "Камень для женщины, у которой день расписан по минутам, а мысли разбегаются. Помогает выбрать главное и не распыляться. Носите как визуальный якорь внимания: взгляд на запястье — и вы снова возвращаетесь к одной задаче.",
        "O piatră pentru femeia care are ziua planificată la minut, iar gândurile îi fug în toate direcțiile. Ajută să alegeți ce contează și să nu vă risipiți. Purtați-o ca pe un reper vizual al atenției: o privire spre încheietura mâinii — și vă întoarceți la o singură sarcină.",
        "A stone for the woman whose day is planned to the minute while her thoughts scatter. It helps you pick what matters and not spread yourself thin. Wear it as a visual anchor for attention: one glance at your wrist and you are back to a single task."] },
    { look: "Аметист", q: "аметист", n: ["Аметист", "Ametist", "Amethyst"], f: "SiO₂", m: "7", s: "tri",
      p: ["Спокойствие и ясная голова", "Calm și minte limpede", "Calm and a clear head"],
      w: ["внутри шумно, трудно выдохнуть", "agitație în gânduri, greu să respirați", "your mind is loud, hard to exhale"],
      t: [
        "Камень для вечера после долгого дня, когда мысли крутятся по кругу. Традиционно его выбирают, чтобы замедлиться, отделить своё от чужого и спокойно лечь спать. Удобный ритуал: снимаете браслет вечером — и рабочий день закончен.",
        "O piatră pentru seara de după o zi lungă, când gândurile se învârt în cerc. Se alege în mod tradițional pentru a încetini ritmul, a separa ce e al vostru de ce e al altora și a adormi liniștite. Un ritual simplu: scoateți brățara seara — și ziua de lucru s-a încheiat.",
        "A stone for the evening after a long day, when thoughts go in circles. Traditionally it is chosen to slow down, separate what is yours from what is someone else’s, and go to sleep calmly. A simple ritual: take the bracelet off in the evening, and the working day is over."] },
    { look: "Пирит", q: "пирит", n: ["Пирит", "Pirită", "Pyrite"], f: "FeS₂", m: "6–6,5", s: "cub",
      p: ["Уверенность в делах и деньгах", "Încredere în afaceri și bani", "Confidence in work and money"],
      w: ["нужно заявить о себе и своей цене", "trebuie să spuneți cât valorați", "time to state your worth"],
      t: [
        "Камень женщины, которая растит своё дело или просит повышения. Золотистый блеск принято связывать с ценностью и деловой энергией — как напоминание: ваш труд стоит своих денег. Подходит для переговоров, презентаций и первых продаж.",
        "Piatra femeii care își construiește afacerea sau cere o promovare. Sclipirea aurie e asociată tradițional cu valoarea și energia de afaceri — ca o amintire: munca voastră merită plătită pe măsură. Potrivită pentru negocieri, prezentări și primele vânzări.",
        "The stone of a woman who is building her business or asking for a raise. Its golden shine is traditionally linked with worth and business energy — a reminder that your work is worth its price. Suited to negotiations, presentations and first sales."] },
    { look: "Лабрадорит", q: "лабрадорит", n: ["Лабрадорит", "Labradorit", "Labradorite"], f: "(Ca,Na)(Al,Si)₄O₈", m: "6–6,5", s: "tcl",
      p: ["Интуиция и перемены", "Intuiție și schimbare", "Intuition and change"],
      w: ["вы на пороге решения", "sunteți în pragul unei decizii", "you stand at the edge of a decision"],
      t: [
        "Камень для периода, когда жизнь меняется, а внутренний голос подсказывает больше, чем логика. Его переливы принято связывать с интуицией и умением видеть неочевидное. Носите, когда нужно остановиться и спросить себя: чего я на самом деле хочу?",
        "O piatră pentru perioada în care viața se schimbă, iar vocea interioară spune mai mult decât logica. Irizațiile sale sunt asociate cu intuiția și cu capacitatea de a vedea ce nu e evident. Purtați-o când e nevoie să vă opriți și să vă întrebați: ce îmi doresc, de fapt?",
        "A stone for a period when life is shifting and your inner voice says more than logic does. Its play of colour is traditionally linked with intuition and seeing what is not obvious. Wear it when you need to pause and ask yourself: what do I actually want?"] },
    { look: "Горный хрусталь", q: "хрусталь", n: ["Горный хрусталь", "Cristal de stâncă", "Rock crystal"], f: "SiO₂", m: "7", s: "tri",
      p: ["Чистый лист", "Început curat", "A clean slate"],
      w: ["начинаете новый этап", "începeți o etapă nouă", "you are starting a new chapter"],
      t: [
        "Универсальный камень для женщины, которая начинает с нуля: новую работу, отношения, привычки. Он нейтрален и усиливает соседние камни в браслете, поэтому его любят в сочетаниях. Ритуал на новолуние: запишите намерение и наденьте браслет в тот же вечер.",
        "O piatră universală pentru femeia care o ia de la zero: un loc de muncă nou, o relație, obiceiuri noi. Este neutră și întărește pietrele din jur, de aceea e iubită în combinații. Ritual de lună nouă: scrieți intenția și puneți brățara chiar în seara aceea.",
        "A universal stone for the woman who is starting from zero: a new job, relationship or habits. It is neutral and amplifies the stones next to it, which is why it is loved in combinations. A new-moon ritual: write down an intention and put the bracelet on that same evening."] },
    { look: "Малахит", q: "малахит", n: ["Малахит", "Malahit", "Malachite"], f: "Cu₂CO₃(OH)₂", m: "3,5–4", s: "mon",
      p: ["Глубокая внутренняя работа", "Transformare interioară", "Deep inner work"],
      w: ["пора разобраться с тем, о чём не говорят", "e timpul să priviți ce nu se spune", "time to face what nobody talks about"],
      t: [
        "Камень для женщины, готовой честно посмотреть на то, что давно откладывала: усталость, обиды, границы. Его концентрические узоры принято считать символом перемен изнутри. Носите как спутника в периоды переосмысления — не как волшебную кнопку, а как напоминание о своём решении.",
        "O piatră pentru femeia pregătită să privească sincer ce amână de mult: oboseala, resentimentele, limitele. Desenele sale concentrice sunt văzute ca simbol al schimbării dinăuntru. Purtați-o ca pe un însoțitor în perioadele de regândire — nu ca pe un buton magic, ci ca pe o amintire a deciziei voastre.",
        "A stone for a woman ready to look honestly at what she has long put off: exhaustion, old hurts, boundaries. Its concentric patterns are seen as a symbol of change from within. Wear it as a companion through periods of rethinking — not a magic button, but a reminder of your own decision."] },
    { look: "Гранат", q: "гранат", n: ["Гранат (альмандин)", "Granat (almandin)", "Garnet (almandine)"], f: "Fe₃Al₂(SiO₄)₃", m: "6,5–7,5", s: "cub",
      p: ["Энергия и вкус к жизни", "Energie și poftă de viață", "Energy and zest for life"],
      w: ["сил на себя уже не остаётся", "nu vă mai rămân puteri pentru voi", "nothing is left for yourself"],
      t: [
        "Глубокий винный цвет — для женщины, которой нужно вернуть желание действовать и интерес к собственной жизни. Традиционно этот камень связывают с энергией, чувственностью и решимостью. Хорошо поддерживает в периоды перезагрузки: после долгой зимы, выгорания, затянувшейся рутины.",
        "Un roșu-vin profund — pentru femeia care vrea să-și recapete dorința de a acționa și interesul pentru propria viață. Piatra e legată tradițional de energie, senzualitate și hotărâre. Sprijină bine perioadele de resetare: după o iarnă lungă, epuizare sau rutină prelungită.",
        "A deep wine-red — for the woman who wants her drive and interest in her own life back. The stone is traditionally linked with energy, sensuality and determination. A good companion for periods of reset: after a long winter, burnout or a stretch of routine."] },
    { look: "Лазурит", q: "лазурит", n: ["Лазурит", "Lapis lazuli", "Lapis lazuli"], f: "(Na,Ca)₈(AlSiO₄)₆(S,SO₄,Cl)₂", m: "5–5,5", s: "cub",
      p: ["Ясная речь и правда", "Vorbire limpede și adevăr", "Clear speech and truth"],
      w: ["предстоит важный разговор", "aveți o discuție importantă în față", "an important conversation is ahead"],
      t: [
        "Камень женщины, которой предстоит сказать главное: руководителю, партнёру, близким. Его считают камнем честной и спокойной речи — говорить прямо и без лишних оправданий. Подходит для переговоров и разговоров, после которых отношения становятся яснее.",
        "Piatra femeii care are de spus ceva important: șefului, partenerului, celor apropiați. E considerată piatra vorbirii sincere și calme — a spune direct, fără scuze de prisos. Potrivită pentru negocieri și discuții după care relațiile devin mai clare.",
        "The stone of a woman who has something important to say: to a manager, a partner, loved ones. It is regarded as a stone of honest, calm speech — saying it directly, without needless excuses. Suited to negotiations and conversations after which relationships become clearer."] },
    { look: "Турмалин", q: "турмалин", n: ["Турмалин", "Turmalină", "Tourmaline"], f: "боросиликат сложного состава", fro: "borosilicat complex", fen: "complex borosilicate", m: "7–7,5", s: "tri",
      p: ["Личные границы", "Limite personale", "Personal boundaries"],
      w: ["нужно сказать «нет» без чувства вины", "trebuie să spuneți „nu” fără vinovăție", "you need to say “no” without guilt"],
      t: [
        "Камень женщины, которая устала быть удобной для всех. Чёрный турмалин традиционно выбирают как символ границ: это моё время, мои силы, моё решение. Носите в дни, когда много чужих просьб, а хочется сохранить себя.",
        "Piatra femeii care s-a săturat să fie comodă pentru toată lumea. Turmalina neagră e aleasă tradițional ca simbol al limitelor: acesta e timpul meu, puterile mele, decizia mea. Purtați-o în zilele cu multe cereri din partea altora, când vreți să vă păstrați pe voi.",
        "The stone of a woman tired of being convenient for everyone. Black tourmaline is traditionally chosen as a symbol of boundaries: this is my time, my energy, my decision. Wear it on days full of other people’s requests, when you want to keep yourself intact."] },
    { look: "Опал", q: "опал", n: ["Опал", "Opal", "Opal"], f: "SiO₂·nH₂O", m: "5,5–6,5", s: "amo",
      p: ["Творчество и самовыражение", "Creativitate și exprimare", "Creativity and self-expression"],
      w: ["хочется делать своё, а не «правильное»", "vreți să faceți ce e al vostru, nu ce e „corect”", "you want to make your own thing, not the “right” one"],
      t: [
        "Камень женщины, которая возвращается к творчеству — рисунку, письму, собственному делу. Игра цвета внутри опала напоминает: у вас много граней, и все они настоящие. Носите, когда нужны вдохновение и смелость показать своё.",
        "Piatra femeii care se întoarce la creativitate — desen, scris, propria afacere. Jocul de culori din opal amintește: aveți multe fațete și toate sunt reale. Purtați-l când aveți nevoie de inspirație și de curajul de a vă arăta lucrul.",
        "A stone for the woman returning to creativity — drawing, writing, her own venture. The play of colour inside opal is a reminder: you have many facets, and all of them are real. Wear it when you need inspiration and the courage to show your work."] },
    { look: "Гематит", q: "гематит", n: ["Гематит", "Hematit", "Hematite"], f: "Fe₂O₃", m: "5–6,5", s: "tri",
      p: ["Заземление и опора", "Stabilitate și echilibru", "Grounding and support"],
      w: ["много в голове, мало в теле", "multe în minte, puține în corp", "a lot in your head, little in your body"],
      t: [
        "Камень женщины, которая живёт на эмоциях и мыслях и нуждается в опоре. Тяжёлый и прохладный на ощупь, он работает как тактильный якорь: коснулись браслета — вернулись в момент. Подходит для дней с большими нагрузками и напряжением.",
        "Piatra femeii care trăiește în emoții și gânduri și are nevoie de sprijin. Greu și răcoros la atingere, funcționează ca un reper tactil: ați atins brățara — v-ați întors în clipa prezentă. Potrivit pentru zilele cu sarcini mari și încordare.",
        "A stone for the woman who lives in her feelings and thoughts and needs something steady. Heavy and cool to the touch, it works as a tactile anchor: touch the bracelet and you are back in the moment. Suited to days of heavy load and tension."] },
    { look: "Аквамарин", q: "аквамарин", n: ["Аквамарин", "Acvamarin", "Aquamarine"], f: "Be₃Al₂Si₆O₁₈", m: "7,5–8", s: "hex",
      p: ["Спокойная речь", "Vorbire calmă", "Calm speech"],
      w: ["нужно объяснить себя и быть услышанной", "trebuie să vă explicați și să fiți ascultată", "you need to explain yourself and be heard"],
      t: [
        "Камень цвета морской воды для женщины, которой важно говорить спокойно и быть понятой — на работе, в семье, в паре. Традиционно связан с мягкой уверенностью и умением не срываться. Подходит для выступлений и непростых разговоров дома.",
        "O piatră de culoarea apei de mare pentru femeia căreia îi pasă să vorbească calm și să fie înțeleasă — la serviciu, în familie, în cuplu. E legată tradițional de încrederea blândă și de calmul în fața tensiunii. Potrivită pentru prezentări și discuții dificile acasă.",
        "A sea-water-coloured stone for the woman who wants to speak calmly and be understood — at work, in the family, in a couple. Traditionally linked with gentle confidence and staying composed. Suited to presentations and difficult conversations at home."] },
    { look: "Обсидиан", q: "обсидиан", n: ["Обсидиан", "Obsidian", "Obsidian"], f: "SiO₂ ≈ 70–75 %", fro: "SiO₂ ≈ 70–75 %", fen: "SiO₂ ≈ 70–75 %", m: "5–5,5", s: "amo",
      p: ["Щит в напряжённые дни", "Scut în zilele încărcate", "A shield for intense days"],
      w: ["много людей и тяжёлые разговоры", "mulți oameni și discuții grele", "many people and heavy conversations"],
      t: [
        "Камень для женщины, которая работает с людьми и принимает чужие эмоции на себя. Тёмное вулканическое стекло традиционно связывают с защитой личного пространства и честностью с собой. Носите в дни встреч и сложных переговоров — как символ: моё пространство — моё.",
        "O piatră pentru femeia care lucrează cu oamenii și preia emoțiile altora. Sticla vulcanică închisă la culoare e asociată tradițional cu protecția spațiului personal și cu sinceritatea față de sine. Purtați-o în zilele de întâlniri și negocieri grele — ca simbol: spațiul meu e al meu.",
        "A stone for the woman who works with people and absorbs other people’s emotions. Dark volcanic glass is traditionally linked with protecting personal space and being honest with yourself. Wear it on days of meetings and hard negotiations — as a symbol: my space is mine."] },
    { look: "Тигровый глаз", q: "тигров", n: ["Тигровый глаз", "Ochi de tigru", "Tiger’s eye"], f: "SiO₂", m: "6,5–7", s: "tri",
      p: ["Уверенность в себе", "Încredere în sine", "Self-confidence"],
      w: ["нужно говорить своим голосом", "trebuie să vorbiți cu vocea voastră", "you need to speak in your own voice"],
      t: [
        "Камень женщины, которая перестаёт подстраиваться и начинает отстаивать свою позицию. Золотистый перелив связывают с решимостью и ясным взглядом на ситуацию. Хорош для собеседований, выступлений и разговоров о своих условиях.",
        "Piatra femeii care nu se mai adaptează tuturor și începe să-și susțină poziția. Reflexia aurie e asociată cu hotărârea și cu o privire clară asupra situației. Potrivită pentru interviuri, prezentări și discuții despre condițiile voastre.",
        "The stone of a woman who stops adapting to everyone and starts standing by her position. Its golden sheen is linked with resolve and a clear view of the situation. Good for interviews, presentations and conversations about your terms."] },
    { look: "Розовый кварц", q: "розов", n: ["Розовый кварц", "Cuarț roz", "Rose quartz"], f: "SiO₂", m: "7", s: "tri",
      p: ["Любовь к себе и близость", "Iubire de sine și apropiere", "Self-love and closeness"],
      w: ["пора поставить себя не последней в списке", "e timpul să nu mai fiți ultima pe listă", "time to stop putting yourself last"],
      t: [
        "Камень женщины, которая много отдаёт другим и забывает о себе. Нежный розовый цвет традиционно связывают с заботой, мягкостью и тёплыми отношениями — с партнёром, детьми и прежде всего с собой. Ритуал: наденьте утром и назовите одну вещь, которую сделаете для себя сегодня.",
        "Piatra femeii care dăruiește mult și se uită pe sine. Roz-ul delicat e asociat tradițional cu grija, blândețea și relațiile calde — cu partenerul, cu copiii și, mai ales, cu sine. Ritual: puneți-l dimineața și numiți un lucru pe care îl veți face azi pentru voi.",
        "The stone of a woman who gives a lot to others and forgets herself. Its soft pink is traditionally linked with care, gentleness and warm relationships — with a partner, with children and, above all, with yourself. A ritual: put it on in the morning and name one thing you will do for yourself today."] },
    { look: "Агат", q: "агат", n: ["Агат", "Agat", "Agate"], f: "SiO₂ (халцедон)", fro: "SiO₂ (calcedonie)", fen: "SiO₂ (chalcedony)", m: "6,5–7", s: "cry",
      p: ["Стабильность и опора", "Stabilitate și sprijin", "Stability and support"],
      w: ["вокруг всё меняется", "totul în jur se schimbă", "everything around you is changing"],
      t: [
        "Слоистый камень для женщины, которая держит на себе дом, работу и близких. Узор, складывавшийся веками, напоминает о терпении: большое строится слой за слоем. Носите в периоды перемен, когда нужна ровная опора под ногами.",
        "O piatră stratificată pentru femeia care ține în brațe casa, munca și oamenii dragi. Desenul format de-a lungul secolelor amintește de răbdare: lucrurile mari se construiesc strat cu strat. Purtați-o în perioade de schimbare, când aveți nevoie de un sprijin stabil sub picioare.",
        "A layered stone for the woman who holds up her home, her work and her people. A pattern built over centuries is a reminder of patience: big things are made layer by layer. Wear it through periods of change, when you need steady ground under your feet."] },
    { look: "Лунный камень", q: "лунн", n: ["Лунный камень", "Piatra-lunii", "Moonstone"], f: "KAlSi₃O₈", m: "6–6,5", s: "mon",
      p: ["Интуиция и женственность", "Intuiție și feminitate", "Intuition and femininity"],
      w: ["хочется услышать себя раньше чужих советов", "vreți să vă auziți pe voi înaintea sfaturilor altora", "you want to hear yourself before other people’s advice"],
      t: [
        "Классический камень женщины: его связывают с лунными ритмами, мягкостью и внутренним чутьём. Его выбирают, чтобы прислушаться к себе перед решением и бережнее относиться к перепадам настроения. Особенно хорош в новолуние и полнолуние — для ритуала тишины.",
        "Piatra clasică a femeii: e legată de ritmurile lunii, de blândețe și de simțul interior. O alegeți ca să vă ascultați înainte de o decizie și să fiți mai blânde cu schimbările de dispoziție. Mai ales potrivită la lună nouă și lună plină — pentru un ritual al liniștii.",
        "The classic woman’s stone: it is linked with lunar rhythms, gentleness and inner instinct. People choose it to listen to themselves before a decision and to be kinder about shifts in mood. Especially good at new and full moon — for a ritual of quiet."] },
    { look: "Кианит", q: "кианит", n: ["Кианит", "Cianit", "Kyanite"], f: "Al₂SiO₅", m: "4,5–7", s: "tcl",
      p: ["Спокойный диалог", "Dialog calm", "Calm dialogue"],
      w: ["нужно поговорить без ссоры", "trebuie să discutați fără ceartă", "you need to talk without a quarrel"],
      t: [
        "Сине-голубые лучистые кристаллы — камень женщины, которая хочет разговаривать, а не ссориться. Традиционно связан с ясной, спокойной коммуникацией и умением слышать собеседника. Подходит для семейных разговоров, переговоров и дней, когда важно сохранить тон.",
        "Cristale albastre, radiate — piatra femeii care vrea să vorbească, nu să se certe. E legată tradițional de o comunicare clară, calmă și de capacitatea de a-l asculta pe celălalt. Potrivită pentru discuții în familie, negocieri și zile în care contează să păstrați tonul.",
        "Blue, bladed crystals — the stone of a woman who wants to talk, not to quarrel. Traditionally linked with clear, calm communication and the ability to hear the other person. Suited to family conversations, negotiations and days when keeping your tone matters."] },
    { look: "Цитрин", q: "цитрин", n: ["Цитрин", "Citrin", "Citrine"], f: "SiO₂", m: "7", s: "tri",
      p: ["Достаток и радость", "Belșug și bucurie", "Abundance and joy"],
      w: ["хочется спокойных отношений с деньгами", "vreți o relație liniștită cu banii", "you want a calmer relationship with money"],
      t: [
        "Солнечный камень для женщины, которая выстраивает финансовое спокойствие — через ясные решения, а не тревогу. Традиционно связан с деловой энергией, оптимизмом и умением радоваться заработанному. Хорош на старте проектов и в дни важных финансовых решений.",
        "O piatră solară pentru femeia care își construiește liniștea financiară — prin decizii clare, nu prin neliniște. Legată tradițional de energia de afaceri, optimism și bucuria a ceea ce ați câștigat. Potrivită la startul proiectelor și în zilele cu decizii financiare importante.",
        "A sunny stone for the woman building financial calm — through clear decisions rather than anxiety. Traditionally linked with business energy, optimism and being able to enjoy what you have earned. Good at the start of projects and on days of important money decisions."] },
    { look: "Нефрит", q: "нефрит", n: ["Нефрит", "Nefrit", "Nephrite"], f: "Ca₂(Mg,Fe)₅Si₈O₂₂(OH)₂", m: "6–6,5", s: "mon",
      p: ["Устойчивое благополучие", "Bunăstare stabilă", "Lasting well-being"],
      w: ["хочется стабильности и покоя", "vreți stabilitate și liniște", "you want stability and peace"],
      t: [
        "Камень гармонии в доме и в делах. Нефрит издавна ценят как символ спокойного достатка, мудрости и долгой жизни. Для женщины, которая строит надёжную жизнь без лишней суеты: дом, семья, стабильный доход.",
        "Piatra armoniei în casă și în afaceri. Nefritul e prețuit din vechime ca simbol al belșugului liniștit, al înțelepciunii și al vieții lungi. Pentru femeia care își clădește o viață sigură fără agitație: casă, familie, venit stabil.",
        "A stone of harmony at home and at work. Jade has long been valued as a symbol of quiet prosperity, wisdom and a long life. For the woman building a reliable life without fuss: home, family, steady income."] },
    { look: "Бирюза", q: "бирюз", n: ["Бирюза", "Turcoaz", "Turquoise"], f: "CuAl₆(PO₄)₄(OH)₈·4H₂O", m: "5–6", s: "tcl",
      p: ["Дорога и новые места", "Drum și locuri noi", "Travel and new places"],
      w: ["поездка, переезд, новая страна", "călătorie, mutare, o țară nouă", "a trip, a move, a new country"],
      t: [
        "Камень женщины-путешественницы и тех, кто начинает жизнь на новом месте. Бирюзу веками берут в дорогу как талисман — символ лёгкого пути и хороших встреч. Носите в отпуске, при переезде или когда нужны свежесть и лёгкость.",
        "Piatra femeii călătoare și a celor care încep o viață într-un loc nou. Turcoazul e luat de secole la drum ca talisman — simbol al unui drum ușor și al întâlnirilor bune. Purtați-l în vacanță, la mutare sau când aveți nevoie de prospețime și ușurință.",
        "The stone of the woman traveller and of those starting a life somewhere new. For centuries turquoise has been taken on the road as a talisman — a symbol of an easy way and good meetings. Wear it on holiday, when moving, or when you need freshness and lightness."] },
    { look: "Содалит", q: "содалит", n: ["Содалит", "Sodalit", "Sodalite"], f: "Na₈(Al₆Si₆O₂₄)Cl₂", m: "5,5–6", s: "cub",
      p: ["Спокойный разум", "Minte limpede", "A composed mind"],
      w: ["нужно принять взвешенное решение", "trebuie să luați o decizie chibzuită", "you need to make a considered decision"],
      t: [
        "Глубокий синий — для женщины, которая хочет опираться на разум, а не на тревогу. Камень связывают с ясным мышлением, самоанализом и честным разговором с собой. Подходит для учёбы, работы с документами и решений, которые нужно принять спокойно.",
        "Un albastru profund — pentru femeia care vrea să se sprijine pe rațiune, nu pe neliniște. Piatra e asociată cu gândirea clară, autoanaliza și o discuție sinceră cu sine. Potrivită pentru studiu, munca cu documente și decizii ce trebuie luate calm.",
        "A deep blue — for the woman who wants to lean on reason rather than worry. The stone is linked with clear thinking, self-analysis and an honest talk with yourself. Suited to study, paperwork and decisions that need to be made calmly."] },
    { look: "Авантюрин", q: "авантюрин", n: ["Авантюрин", "Aventurin", "Aventurine"], f: "SiO₂ + слюда", fro: "SiO₂ + mică", fen: "SiO₂ + mica", m: "6,5–7", s: "tri",
      p: ["Удача и лёгкость", "Noroc și ușurință", "Luck and lightness"],
      w: ["старания наконец дают результат", "eforturile încep să dea roade", "your efforts are finally paying off"],
      t: [
        "Зелёный камень для женщины, открытой новому и желающей больше лёгкости в делах. Традиционно его выбирают на удачу и как поддержку начинаний — особенно когда много сделано и пора увидеть результат. Носите как напоминание: удача любит действующих.",
        "O piatră verde pentru femeia deschisă spre nou, care vrea mai multă ușurință în treburi. E aleasă tradițional pentru noroc și ca sprijin la început de drum — mai ales când multe sunt făcute și e timpul să vedeți rezultatul. Purtați-o ca amintire: norocul îi iubește pe cei care acționează.",
        "A green stone for the woman who is open to the new and wants more lightness in her affairs. Traditionally chosen for luck and as support at the start of ventures — especially when a lot is done and it is time to see results. Wear it as a reminder: luck favours those who act."] },
    { look: "Родонит", q: "родонит", n: ["Родонит", "Rodonit", "Rhodonite"], f: "(Mn,Fe,Mg,Ca)SiO₃", m: "5,5–6,5", s: "tcl",
      p: ["Прощение и мягкость", "Iertare și blândețe", "Forgiveness and softness"],
      w: ["хочется отпустить обиду", "vreți să lăsați o supărare în urmă", "you want to let an old hurt go"],
      t: [
        "Розовый камень с тёмными прожилками — для женщины, готовой отпустить старую обиду и не тащить её в новые отношения. Его принято считать камнем прощения — себя и других — и эмоционального равновесия. Ритуал: напишите на бумаге то, что отпускаете, и наденьте браслет как знак этого решения.",
        "O piatră roz cu vinișoare închise — pentru femeia gata să lase în urmă o supărare veche și să n-o ducă în relațiile noi. E socotită piatra iertării — a voastră și a celorlalți — și a echilibrului emoțional. Ritual: scrieți pe hârtie ce lăsați în urmă și puneți brățara ca semn al acestei hotărâri.",
        "A pink stone with dark veins — for the woman ready to let go of an old hurt and not carry it into new relationships. It is regarded as a stone of forgiveness — of yourself and others — and emotional balance. A ritual: write down what you are releasing and put the bracelet on as a sign of that decision."] },
    { look: "Корунд", q: "корунд", n: ["Корунд", "Corindon", "Corundum"], f: "Al₂O₃", m: "9", s: "tri",
      p: ["Воля и решимость", "Voință și hotărâre", "Will and determination"],
      w: ["нужно довести начатое до конца", "trebuie să duceți lucrul început până la capăt", "you need to see it through"],
      t: [
        "Очень твёрдый камень для женщины, у которой уже есть план, а нужна выдержка. Символ воли и последовательности: сделать то, что решила, даже когда устала. Подходит для больших проектов, учёбы, спортивных и финансовых целей.",
        "O piatră foarte dură pentru femeia care are deja un plan și are nevoie de răbdare și rezistență. Simbol al voinței și al consecvenței: să faceți ce v-ați propus, chiar și obosită. Potrivită pentru proiecte mari, studii, obiective sportive și financiare.",
        "A very hard stone for the woman who already has a plan and needs stamina. A symbol of will and consistency: doing what you decided even when tired. Suited to big projects, study, sports and financial goals."] },
    { look: "Яшма", q: "яшма", n: ["Яшма", "Jasp", "Jasper"], f: "SiO₂ + примеси", fro: "SiO₂ + impurități", fen: "SiO₂ + impurities", m: "6,5–7", s: "cry",
      p: ["Опора и забота", "Sprijin și grijă", "Support and care"],
      w: ["на вас держится семья или команда", "familia sau echipa se sprijină pe voi", "your family or team leans on you"],
      t: [
        "Камень женщины, на которой держится многое: дом, дети, коллеги. Каждая яшма с неповторимым рисунком — напоминание, что ваша роль уникальна. Носите в периоды высокой нагрузки, когда нужно выдержать — и не забыть о себе.",
        "Piatra femeii pe care se sprijină multe: casa, copiii, colegii. Fiecare jasp are un desen irepetabil — o amintire că rolul vostru e unic. Purtați-l în perioade cu încărcătură mare, când trebuie să rezistați — și să nu vă uitați pe voi.",
        "The stone of a woman on whom a lot rests: home, children, colleagues. Every jasper has a one-of-a-kind pattern — a reminder that your role is unique. Wear it through high-load periods, when you have to hold steady — and not forget yourself."] }
  ];
  /* названия на RO/EN — чтобы поиск в каталоге работал на всех языках */
  var NAMES = {"Соколиный глаз": ["Ochi de șoim", "Hawk's Eye"], "Рубин": ["Rubin", "Ruby"], "Чёрный агат": ["Agat negru", "Black Agate"], "Родонит": ["Rodonit", "Rhodonite"], "Жемчуг": ["Perlă", "Pearl"], "Бирюза": ["Turcoaz", "Turquoise"], "Яшма": ["Jasp", "Jasper"], "Аметист": ["Ametist", "Amethyst"], "Горный хрусталь": ["Cristal de stâncă", "Clear Quartz"], "Гелиотроп": ["Heliotrop", "Bloodstone"], "Нефрит": ["Nefrit", "Jade"], "Лава": ["Piatră de lavă", "Lava Stone"], "Тигровый глаз": ["Ochi de tigru", "Tiger's Eye"], "Изумруд": ["Smarald", "Emerald"], "Турмалин": ["Turmalină", "Tourmaline"], "Гранат": ["Granat", "Garnet"], "Цитрин": ["Citrin", "Citrine"], "Амазонит": ["Amazonit", "Amazonite"], "Лазурит": ["Lazurit", "Lapis Lazuli"], "Агат": ["Agat", "Agate"], "Сапфир": ["Safir", "Sapphire"], "Хризопраз": ["Crisopraz", "Chrysoprase"], "Лунный камень": ["Piatra lunii", "Moonstone"], "Берилл": ["Beril", "Beryl"], "Сардоникс": ["Sardonix", "Sardonyx"], "Малахит": ["Malachit", "Malachite"], "Солнечный камень": ["Piatra soarelui", "Sunstone"], "Розовый кварц": ["Cuarț roz", "Rose Quartz"], "Авантюрин": ["Aventurin", "Aventurine"], "Опал": ["Opal", "Opal"], "Обсидиан": ["Obsidian", "Obsidian"], "Коралл": ["Coral", "Coral"], "Сердолик": ["Carneol", "Carnelian"], "Аквамарин": ["Acvamarin", "Aquamarine"], "Чароит": ["Charoit", "Charoite"], "Гематит": ["Hematit", "Hematite"], "Корунд": ["Corindon", "Corundum"], "Змеевик": ["Serpentin", "Serpentine"], "Топаз": ["Topaz", "Topaz"], "Альмандин": ["Almandin", "Almandine"], "Флюорит": ["Fluorină", "Fluorite"], "Пирит": ["Pirită", "Pyrite"], "Лабрадорит": ["Labradorit", "Labradorite"], "Содалит": ["Sodalit", "Sodalite"], "Кианит": ["Cianit", "Kyanite"], "Ларимар": ["Larimar", "Larimar"], "Кварц": ["Cuarț", "Quartz"], "Кунцит": ["Kunzit", "Kunzite"], "Морганит": ["Morganit", "Morganite"], "Раухтопаз": ["Cuarț fumuriu", "Smoky quartz"], "Мукаит": ["Mookait", "Mookaite"], "Жадеит": ["Jadeit", "Jadeite"]};
  function fold(x) { return String(x || '').toLowerCase().replace(/ё/g, 'е').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ș/g, 's').replace(/ț/g, 't').replace(/["«»“”’']/g, ''); }
  /* слово из поисковой строки на RU/RO/EN → списки русских основ подходящих камней */
  Object.keys(EXTRA).forEach(function (k) { NAMES[k] = EXTRA[k].n; });
  function stoneAlts(tok) {
    var out = []; tok = fold(tok); if (tok.length < 3) return out;
    Object.keys(NAMES).forEach(function (k) {
      var hit = fold(k).indexOf(tok) === 0 || NAMES[k].some(function (nm) { return fold(nm).split(/\s+/).some(function (w) { return w.indexOf(tok) === 0; }); });
      if (!hit) return;
      if (EXTRA[k]) EXTRA[k].s.forEach(function (set) { out.push({ k: k, st: set.split(' ') }); });
      else out.push({ k: k, st: norm(k).split(/\s+/).filter(function (w) { return w.length > 2; }).map(function (w) { return w.length > 5 ? w.slice(0, 5) : w; }) });
    });
    return out;
  }
  var WEEK0 = Math.floor(Date.UTC(2026, 8, 28) / 864e5); // понедельник, с которого «Флюорит» — минерал недели

  function weekInfo(d) {
    d = d || new Date();
    var days = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5), w = Math.floor((days - WEEK0) / 7), n = WEEK.length;
    var i = ((w % n) + n) % n, start = new Date((WEEK0 + w * 7) * 864e5), end = new Date((WEEK0 + w * 7 + 6) * 864e5);
    var M = LANG === 'ro' ? ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'noi', 'dec'] : LANG === 'en' ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] : ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    var range = start.getUTCDate() + ' ' + M[start.getUTCMonth()] + ' – ' + end.getUTCDate() + ' ' + M[end.getUTCMonth()];
    var m = WEEK[i], ds = DESC[m.look];
    return {
      i: i, week: w, range: range, look: m.look, q: m.q, name: m.n[LI],
      formula: LI === 1 && m.fro ? m.fro : LI === 2 && m.fen ? m.fen : m.f, mohs: m.m, system: SYS[m.s][LI], purpose: (ds || m).p[LI], when: (ds || m).w[LI], fact: (ds || m).t[LI]
    };
  }

  /* тексты «для женщины» (45 камней: 40 календаря + минералы недели). p — слоган, w — «для чего», t — 3 коротких фразы [ru, ro, en] */
  var DESC = {
 "Соколиный глаз": {"p": ["Дальновидность и стратегия", "Viziune și strategie", "See the next move"], "w": ["видеть ход наперёд, а не реагировать", "să vedeți un pas înainte, nu doar să reacționați", "seeing a step ahead instead of reacting"], "t": ["Вы привыкли видеть на шаг дальше других. Сине-золотистый отлив камня — как взгляд с высоты. Наденьте его перед важным решением и позвольте себе спокойно выбрать свой ход.", "Vedeți de obicei cu un pas înaintea celorlalți. Reflexia albastru-aurie a pietrei e de mult asociată cu privirea de sus. Purtați-o înainte de o decizie importantă și alegeți-vă calm mutarea.", "You see one step further than most. Hawk's Eye, with its blue-gold shimmer, is long seen as a view from above. Wear it before a big decision and choose your move calmly."]},
 "Рубин": {"p": ["Жизненная сила и смелость", "Forță și curaj", "Fire and courage"], "w": ["когда хочется вернуть огонь", "când vreți să readuceți focul", "when you want your spark back"], "t": ["Вы знаете, каково это — гореть делом. Глубокий красный — цвет жизни, страсти и решимости. Носите рубин, когда готовы снова быть заметной, — и почувствуйте, как возвращается огонь.", "Știți ce înseamnă să ardeți pentru ceea ce faceți. Roșul adânc al rubinului e de mult asociat cu viața, pasiunea și hotărârea. Purtați-l când vreți să fiți din nou văzută și simțiți cum revine flacăra.", "You know what it's like to burn for your work. Ruby's deep red is traditionally linked to life, passion and resolve. Wear it when you're ready to be seen again, and feel the spark return."]},
 "Чёрный агат": {"p": ["Опора и личные границы", "Sprijin și limite personale", "Grounding and boundaries"], "w": ["вернуться в себя после чужого шума", "să vă regăsiți după zgomotul celor din jur", "coming back to yourself after other people's noise"], "t": ["К вечеру вы устаёте не от дел, а от чужих эмоций. Тёмный агат — камень тишины и опоры. Снимите украшение вечером, сделайте вдох — и шум дня останется позади.", "Seara sunteți obosită nu de treburi, ci de emoțiile celorlalți. Agatul negru e de mult asociat cu liniștea și cu sprijinul. Scoateți bijuteria seara, respirați adânc și lăsați zgomotul zilei în urmă.", "By evening you're tired less from tasks than from other people's emotions. Black Agate is long seen as a stone of quiet. Take it off at night, breathe out, and leave the noise behind."]},
 "Родонит": {"p": ["Прощение и мягкость", "Iertare și blândețe", "Forgiveness and softness"], "w": ["отпустить то, что держит", "să lăsați în urmă ce vă ține pe loc", "letting go of what holds you back"], "t": ["Вы уже готовы отпустить старую обиду. Розовый камень с тёмными прожилками называют камнем прощения. Запишите, что отпускаете, наденьте браслет — и позвольте себе лёгкость.", "Sunteți gata să lăsați în urmă o veche supărare. Piatra roz cu vinișoare închise e tradițional numită piatra iertării. Notați ce lăsați să plece, puneți brățara și dați-vă voie să fiți mai ușoară.", "You're ready to release an old hurt. This pink, dark-veined stone is traditionally called the stone of forgiveness. Write down what you're releasing, put on the bracelet, and feel lighter."]},
 "Жемчуг": {"p": ["Мягкая женская сила", "Forța blândă a feminității", "Gentle feminine strength"], "w": ["мягкость к себе, а не только к другим", "blândețe față de sine, nu doar față de ceilalți", "softness toward yourself, not only others"], "t": ["Вы заботитесь обо всех — пора позаботиться и о себе. Жемчуг издавна — знак женственности и спокойного достоинства. Почувствуйте: нежность тоже сила.", "Vă îngrijiți de toți cei dragi, iar acum e rândul dumneavoastră. Perla e de mult asociată cu feminitatea și cu demnitatea calmă. Simțiți pentru o clipă: tandrețea este tot o formă de putere.", "You care for everyone around you, and it's time to care for yourself too. Pearl has long symbolized femininity and quiet dignity. Wear it and remember that tenderness is a strength."]},
 "Бирюза": {"p": ["Лёгкая дорога", "Drum ușor", "An easy road"], "w": ["поездка, переезд, новая страна", "o călătorie, o mutare, o țară nouă", "a trip, a move, a new country"], "t": ["Впереди дорога, новое место, новая глава. Бирюзу веками берут в путь как талисман лёгкой дороги. Представьте, как свободно вам дышится на новом месте, — и возьмите её с собой.", "Vă așteaptă un drum, un loc nou, un capitol nou. Turcoazul e de secole luat în călătorie ca simbol al drumului bun. Imaginați-vă cât de liber respirați în noul loc și luați piatra cu dumneavoastră.", "A journey, a new place, a new chapter lies ahead. For centuries turquoise has traveled as a talisman for a smooth road. Picture how freely you'll breathe there, and bring it along."]},
 "Яшма": {"p": ["Опора и забота", "Sprijin și grijă", "Support and care"], "w": ["когда все опираются на вас", "când toți se sprijină pe dumneavoastră", "when everyone leans on you"], "t": ["На вас держится дом, дети, работа. У каждой яшмы свой неповторимый рисунок — как и у вас. Носите её в дни большой нагрузки и помните: вы тоже заслуживаете заботы.", "Pe dumneavoastră se sprijină casa, copiii și munca. Fiecare jasp are un desen unic, la fel ca dumneavoastră. Purtați-l în zilele cu multă încărcătură și amintiți-vă că și dumneavoastră meritați grijă.", "Home, kids and work all rest on you. Every piece of jasper has a pattern no other has, just like you. Wear it on your heaviest days and remember that you deserve care too."]},
 "Аметист": {"p": ["Тишина и ясная голова", "Liniște și minte limpede", "Quiet, clear mind"], "w": ["внутри шумно, трудно выдохнуть", "când înăuntru e zgomot și e greu să respirați adânc", "it's loud inside and hard to exhale"], "t": ["Мысли крутятся по кругу, а вам хочется тишины. Фиолетовый аметист традиционно выбирают для спокойного вечера. Снимите браслет перед сном — и позвольте рабочему дню закончиться.", "Gândurile se rotesc în cerc, iar dumneavoastră vă doriți liniște. Ametistul violet e tradițional ales pentru o seară calmă. Scoateți brățara înainte de culcare și lăsați ziua de lucru să se încheie.", "Your thoughts go in circles and all you want is quiet. Purple amethyst is traditionally chosen for a calm evening. Take the bracelet off before bed and let the workday end."]},
 "Горный хрусталь": {"p": ["Чистый лист", "Foaie curată", "A clean slate"], "w": ["начинаете новый этап", "când începeți o etapă nouă", "starting a new chapter"], "t": ["Новая работа, новые отношения, новая привычка — вы начинаете с чистого листа. Прозрачный хрусталь — образ ясности. В новолуние запишите намерение и наденьте браслет в тот же вечер.", "Muncă nouă, relație nouă, obicei nou: începeți pe o foaie curată. Cristalul de stâncă e de mult asociat cu claritatea. La lună nouă notați o intenție și puneți brățara chiar în seara aceea.", "New job, new love, new habit: you're starting fresh. Clear Quartz is long seen as an image of clarity. On the new moon, write down an intention and put on the bracelet that evening."]},
 "Гелиотроп": {"p": ["Смелость первого шага", "Curajul primului pas", "Courage to begin"], "w": ["сделать первый шаг, который откладывается", "să faceți primul pas, tot amânat", "taking the first step you keep postponing"], "t": ["Вы давно знаете, что нужно сделать. Тёмно-зелёный гелиотроп с красными искрами — камень смелости. Выберите один маленький шаг, сделайте его сегодня — и почувствуйте, как легче становится дальше.", "Știți de mult ce trebuie făcut. Heliotropul verde închis, cu picături roșii, e tradițional numit piatra curajului. Alegeți un singur pas mic, faceți-l astăzi și simțiți cum drumul devine mai ușor.", "You've known for a while what needs doing. Dark green heliotrope with red flecks is traditionally the stone of courage. Choose one small step, take it today, and the next feels lighter."]},
 "Нефрит": {"p": ["Спокойный достаток", "Belșug liniștit", "Calm abundance"], "w": ["спокойные отношения с деньгами", "o relație liniștită cu banii", "a steady, peaceful relationship with money"], "t": ["Вы строите устойчивую жизнь без лишней суеты. Нефрит издавна — символ гармонии, достатка и долгих лет. Носите его как знак: я выбираю спокойствие и надёжность.", "Vă construiți o viață stabilă, fără agitație inutilă. Jadul e de mult asociat cu armonia, belșugul și anii lungi. Purtați-l ca pe un semn că alegeți liniștea și siguranța.", "You're building a steady life without the fuss. Jade has long symbolized harmony, prosperity and long years. Wear it as a reminder that you choose calm and reliability."]},
 "Лава": {"p": ["Стойкость и выдержка", "Tărie și răbdare", "Endurance and stamina"], "w": ["пережить период, который надо просто пережить", "să treceți printr-o perioadă care trebuie pur și simplu trecută", "getting through a season you simply have to get through"], "t": ["Бывают периоды, когда нужно просто выстоять. Лава — камень силы и земной опоры. Капля любимого эфирного масла на пористые бусины — и браслет становится вашим ритуалом спокойствия.", "Sunt perioade în care trebuie doar să rezistați. Lava e de mult asociată cu puterea și cu sprijinul pământului. O picătură de ulei esențial pe mărgele face din brățară ritualul dumneavoastră de calm.", "Some seasons ask only that you hold steady. Lava stone is long seen as a stone of strength and earthy grounding. Add a drop of essential oil to the porous beads for a ritual of calm."]},
 "Тигровый глаз": {"p": ["Уверенность в себе", "Încredere în sine", "Steady self-confidence"], "w": ["говорить своим голосом", "să vorbiți cu vocea dumneavoastră", "speaking in your own voice"], "t": ["Вы перестаёте подстраиваться — и начинаете говорить своим голосом. Золотистый перелив — цвет решимости и ясного взгляда. Наденьте камень на собеседование, выступление, важный разговор.", "Nu vă mai adaptați tuturor și începeți să vorbiți cu vocea dumneavoastră. Reflexia aurie e de mult asociată cu hotărârea. Purtați-o la un interviu, o prezentare sau o discuție importantă.", "You've stopped adjusting to everyone and started speaking in your own voice. Its golden shimmer is traditionally linked to resolve. Wear it to interviews and important talks."]},
 "Изумруд": {"p": ["Верность себе", "Fidelitate față de sine", "Loyalty to yourself"], "w": ["держать данное слово — себе в первую очередь", "să vă țineți cuvântul, mai întâi față de dumneavoastră", "keeping your word, to yourself first"], "t": ["Для вас слово — не пустой звук. Изумруд издавна связывают с верностью, любовью и возрождением. Выберите его для важной даты — как обещание, которое вы даёте себе.", "Pentru dumneavoastră cuvântul dat nu e o vorbă în vânt. Smaraldul e de mult asociat cu loialitatea, iubirea și renașterea. Alegeți-l pentru o zi importantă, ca o promisiune față de dumneavoastră.", "To you, a promise is never an empty sound. Emerald has long been linked to loyalty, love and renewal. Choose it for an important date, as a promise you make to yourself."]},
 "Турмалин": {"p": ["Границы без чувства вины", "Limite fără vinovăție", "Boundaries without guilt"], "w": ["сказать «нет» спокойно", "să spuneți „nu” calm", "saying no calmly"], "t": ["Вы устали быть удобной для всех. Чёрный турмалин традиционно считают символом личных границ. Носите его в дни чужих просьб и повторяйте: моё время — моё решение.", "V-ați săturat să fiți mereu la dispoziția tuturor. Turmalina neagră e tradițional legată de limitele personale. Purtați-o în zilele cu multe cereri și repetați în gând: timpul meu, decizia mea.", "You're tired of being convenient for everyone. Black Tourmaline is traditionally a symbol of personal boundaries. Wear it on days of requests and repeat: my time is my decision."]},
 "Гранат": {"p": ["Энергия и вкус к жизни", "Energie și elan", "Zest for life"], "w": ["вернуть интерес к собственной жизни", "să vă recâștigați interesul pentru propria viață", "getting interested in your own life again"], "t": ["Вам хочется снова желать, действовать, чувствовать. Глубокий винный цвет граната — цвет энергии и решимости. Носите его в период перезагрузки — и позвольте себе начать.", "Vă vine din nou să visați, să acționați, să simțiți. Culoarea de vin închis a granatului e de mult asociată cu energia și hotărârea. Purtați-l într-o perioadă de resetare și dați-vă voie să începeți.", "You want to desire, act and feel again. Garnet's deep wine red is traditionally the color of energy and resolve. Wear it through a season of reset, and let yourself begin."]},
 "Цитрин": {"p": ["Достаток и радость", "Belșug și bucurie", "Abundance and joy"], "w": ["спокойные отношения с деньгами", "calm în relația cu banii", "financial calm built on clear decisions"], "t": ["Вы выстраиваете финансовое спокойствие через ясные решения. Солнечный цитрин традиционно связывают с достатком и оптимизмом. Наденьте его на старте проекта — и порадуйтесь заработанному.", "Vă clădiți liniștea financiară prin decizii clare. Citrinul solar e de mult asociat cu belșugul și optimismul. Purtați-l la startul unui proiect și bucurați-vă de ceea ce ați câștigat.", "You're building financial calm through clear decisions. Sunny Citrine is traditionally linked to abundance and optimism. Put it on at a project's start, and enjoy what you've earned."]},
 "Амазонит": {"p": ["Правда без конфликта", "Adevăr fără conflict", "Truth without conflict"], "w": ["сказать вслух то, что давно понятно", "să spuneți cu voce tare ce înțelegeți de mult", "saying out loud what you've long known"], "t": ["Вы давно всё поняли — осталось сказать. Бирюзово-зелёный амазонит связывают с честным и мягким самовыражением. Носите его для разговоров о границах и условиях — спокойно и прямо.", "Ați înțeles de mult totul, mai rămâne doar să spuneți. Amazonitul turcoaz-verzui e tradițional legat de exprimarea sinceră și blândă. Purtați-l la discuții despre limite și condiții, calm și direct.", "You've long understood it, and it's time to say it. Turquoise-green Amazonite is traditionally tied to honest, gentle speech. Wear it for talks about boundaries, calm and direct."]},
 "Лазурит": {"p": ["Ясная речь и правда", "Vorbire clară și adevăr", "Clear speech, honest words"], "w": ["предстоит важный разговор", "când vă așteaptă o discuție importantă", "an important conversation ahead"], "t": ["Вам предстоит сказать главное — руководителю, близким, себе. Глубокий синий лазурит — камень честного, спокойного слова. Наденьте его перед разговором и говорите прямо, без лишних оправданий.", "Aveți de spus ceva esențial: șefului, celor dragi, dumneavoastră înșivă. Lapislazuliul e de mult asociat cu cuvântul sincer și calm. Purtați-l înainte de discuție și vorbiți direct, fără scuze.", "You have something important to say, to your boss, family, yourself. Deep blue Lapis Lazuli is long seen as the stone of honest words. Put it on before the talk and speak plainly."]},
 "Агат": {"p": ["Опора и стабильность", "Sprijin și stabilitate", "Steadiness and support"], "w": ["вокруг всё меняется", "când totul în jur se schimbă", "everything around you is changing"], "t": ["Вы держите дом, работу, близких. Слоистый агат — символ терпения: большое строится слой за слоем. Носите его в дни перемен — и почувствуйте ровную опору под ногами.", "Susțineți casa, munca și pe cei dragi. Agatul stratificat e un simbol al răbdării: lucrurile mari se construiesc strat cu strat. Purtați-l în zilele de schimbare și simțiți sprijin sub picioare.", "You hold it all together: home, work, loved ones. Banded agate symbolizes patience, since big things are built layer by layer. Wear it on days of change and feel steady ground beneath you."]},
 "Сапфир": {"p": ["Мудрое решение", "Decizie înțeleaptă", "Wise decisions"], "w": ["решение, о котором не пожалеете", "o decizie pe care nu o veți regreta", "a decision you won't regret"], "t": ["Вы взвешиваете важное решение. Глубокий синий сапфир — камень ясного ума и верности себе. Наденьте его, сделайте паузу — и позвольте ответу прийти спокойно, без спешки.", "Cântăriți o decizie importantă. Safirul albastru adânc e de mult asociat cu mintea limpede și cu fidelitatea față de sine. Purtați-l, faceți o pauză și lăsați răspunsul să vină fără grabă.", "You're weighing an important decision. Deep blue Sapphire is traditionally the stone of a clear mind and loyalty to yourself. Put it on, pause, and let the answer arrive without rush."]},
 "Хризопраз": {"p": ["Надежда и лёгкость", "Speranță și ușurință", "Hope and lightness"], "w": ["поверить, что период закончится", "să credeți că perioada aceasta se va încheia", "believing this chapter will end"], "t": ["Трудный этап подходит к концу. Яблочно-зелёный хризопраз — камень надежды и свежего дыхания. Наденьте его и встречайте новое с открытым сердцем.", "O etapă grea se apropie de sfârșit și o simțiți deja. Crisoprazul verde ca mărul e de mult asociat cu speranța și cu o respirație proaspătă. Purtați-l și întâmpinați noul cu inima deschisă.", "A hard chapter is coming to its close. Apple-green Chrysoprase is long seen as a stone of hope and fresh air. Put it on and meet what's next with an open heart."]},
 "Лунный камень": {"p": ["Интуиция и женственность", "Intuiție și feminitate", "Intuition and femininity"], "w": ["услышать себя раньше чужих советов", "să vă auziți pe dumneavoastră înaintea sfaturilor altora", "hearing yourself before anyone's advice"], "t": ["Вы чувствуете больше, чем можете объяснить. Лунный камень — классика женственности и внутреннего чутья. Носите его в новолуние и полнолуние — для ритуала тишины и разговора с собой.", "Simțiți mai mult decât puteți explica. Piatra lunii e de mult asociată cu feminitatea și cu vocea interioară. Purtați-o la lună nouă și plină, pentru un ritual de liniște și un dialog cu sine.", "You sense more than you can explain. Moonstone is a classic symbol of femininity and inner knowing. Wear it on new and full moons for a ritual of quiet and a talk with yourself."]},
 "Берилл": {"p": ["Ясность выбора", "Claritatea alegerii", "Clarity of choice"], "w": ["выбрать одно из десяти", "să alegeți una dintre zece variante", "choosing one out of ten"], "t": ["Вариантов много — и трудно выбрать. Светлый берилл традиционно связывают с ясностью мысли. Запишите три критерия выбора, наденьте браслет — и отсеивайте лишнее легко.", "Aveți multe variante și vă e greu să alegeți. Berilul deschis la culoare e tradițional legat de claritatea gândirii. Notați trei criterii, puneți brățara și lăsați ușor deoparte ce e în plus.", "There are so many options that choosing feels hard. Pale Beryl is traditionally linked to clarity of thought. Write down three criteria, put on the bracelet, and let the extras fall away."]},
 "Сардоникс": {"p": ["Надёжные отношения", "Relații de încredere", "Lasting relationships"], "w": ["строить вдолгую, а не на один раз", "să construiți pe termen lung, nu pentru o singură dată", "building for the long run, not just for now"], "t": ["Вы строите надолго — партнёрство, семью, общее дело. Полосатый сардоникс издавна — символ верности и доверия. Подарите пару — как знак договорённости, которую берёте всерьёз.", "Construiți pentru mult timp: parteneriat, familie, proiect comun. Sardonixul cu dungi e de mult un simbol al fidelității și al încrederii. Dăruiți o pereche, ca semn al unei înțelegeri serioase.", "You're building for the long run: a partnership, a family, a shared cause. Banded Sardonyx has long symbolized loyalty and trust. Give a pair as a sign of an agreement you take seriously."]},
 "Малахит": {"p": ["Глубокая внутренняя работа", "Muncă interioară profundă", "Deep inner work"], "w": ["разобраться с тем, о чём не говорят", "să lămuriți ce nu se spune cu voce tare", "facing what no one talks about"], "t": ["Вы готовы честно посмотреть на то, что давно откладывали. Узоры малахита — как круги перемен изнутри. Носите его как спутника на пути: решение всегда остаётся за вами.", "Sunteți gata să priviți sincer ce ați tot amânat. Desenul malahitului amintește de cercuri ale schimbării dinăuntru. Purtați-l ca pe un însoțitor de drum: decizia vă aparține întotdeauna.", "You're ready to look honestly at what you've put off. Malachite's swirling bands are long seen as rings of inner change. Wear it as a companion on the way: the choice is always yours."]},
 "Солнечный камень": {"p": ["Радость и тепло", "Bucurie și căldură", "Joy and warmth"], "w": ["вспомнить, что вам нравится", "să vă amintiți ce vă place", "remembering what you enjoy"], "t": ["Вы так много делаете для других, что забыли, что любите сами. Золотистый солнечный камень — образ тепла и внутреннего света. Запишите три радости — и сделайте одну сегодня.", "Faceți atât de mult pentru alții, încât ați uitat ce vă place dumneavoastră. Piatra soarelui aurie e de mult asociată cu căldura și lumina interioară. Notați trei bucurii și faceți una astăzi.", "You do so much for others that you've forgotten what you love. Golden Sunstone is an image of warmth and inner light. Write down three joys and do one of them today."]},
 "Розовый кварц": {"p": ["Любовь к себе", "Iubire de sine", "Love for yourself"], "w": ["поставить себя не последней в списке", "să nu vă mai puneți ultima pe listă", "not putting yourself last on the list"], "t": ["Вы отдаёте много — пора вспомнить о себе. Нежно-розовый кварц — знак заботы и тёплых отношений, прежде всего с собой. Утром наденьте браслет и назовите одно дело для себя на сегодня.", "Dăruiți mult altora, iar pe dumneavoastră vă lăsați la urmă. Cuarțul roz e de mult asociat cu grija și căldura, mai întâi față de sine. Dimineața puneți brățara și alegeți un lucru pentru dumneavoastră.", "You give a lot, and it's time to remember yourself. Soft pink Rose Quartz symbolizes care and warm bonds, above all with yourself. Each morning, put it on and name one thing just for you."]},
 "Авантюрин": {"p": ["Удача и лёгкость", "Noroc și ușurință", "Luck and ease"], "w": ["старания наконец дают результат", "eforturile dau, în sfârșit, roade", "your efforts finally paying off"], "t": ["Вы многое сделали — пора увидеть результат. Зелёный авантюрин традиционно выбирают на удачу и новые начинания. Носите его и помните: удача любит тех, кто действует.", "Ați făcut multe și e timpul să vedeți rezultatul. Aventurinul verde e tradițional ales pentru noroc și începuturi noi. Purtați-l și amintiți-vă: norocul îi iubește pe cei care acționează.", "You've done so much, and it's time to see the result. Green Aventurine is traditionally chosen for luck and new beginnings. Wear it and remember that luck loves those who act."]},
 "Опал": {"p": ["Творчество и самовыражение", "Creativitate și exprimare", "Creativity and self-expression"], "w": ["делать своё, а не «правильное»", "să faceți ce e al dumneavoastră, nu ce e „corect”", "making what's yours, not what's expected"], "t": ["В вас много граней — и все настоящие. Игра цвета в опале напоминает об этом. Носите его, когда нужны вдохновение и смелость показать своё.", "Aveți multe fațete și toate sunt adevărate. Jocul de culori al opalului, de mult asociat cu creativitatea, vi le amintește. Purtați-l când vă trebuie inspirație și curajul de a fi dumneavoastră.", "You have many facets, and every one is real. The play of color in Opal is long seen as a sign of many sides at once. Wear it when you need inspiration and the courage to show what's yours."]},
 "Обсидиан": {"p": ["Щит в напряжённые дни", "Scut pentru zile încordate", "Shield for tense days"], "w": ["много людей и сложных разговоров", "mulți oameni și discuții dificile", "lots of people and difficult conversations"], "t": ["Вы работаете с людьми и принимаете чужие эмоции. Тёмное вулканическое стекло традиционно связывают с защитой личного пространства. Надевайте его на встречи — как знак: моё пространство — моё.", "Lucrați cu oamenii și primiți emoțiile lor. Sticla vulcanică întunecată e tradițional legată de protejarea spațiului personal. Purtați obsidianul la întâlniri, ca semn că spațiul e al dumneavoastră.", "You work with people and take in their emotions. Dark volcanic glass is traditionally linked to guarding your personal space. Wear it to meetings as a sign that your space is yours."]},
 "Коралл": {"p": ["Глубина и честность с собой", "Adâncime și sinceritate", "Depth and honesty"], "w": ["честность с собой без свидетелей", "sinceritate cu sine, fără martori", "being honest with yourself, no witnesses"], "t": ["Вам хочется тишины и разговора с собой. Кораллу издавна приписывают связь с женской энергией и глубокими чувствами. Выберите его для спокойного вечера и дневника.", "Vă doriți liniște și o discuție cu dumneavoastră înșivă. Coralul e de mult asociat cu energia feminină și cu emoțiile profunde. Alegeți-l pentru o seară calmă și un jurnal.", "You want quiet and a conversation with yourself. Coral has long been tied to feminine energy and deep feelings. Choose it for a calm evening with your journal."]},
 "Сердолик": {"p": ["Энергия начинаний", "Energia începuturilor", "The energy of beginnings"], "w": ["первый день после решения", "prima zi după o decizie", "day one after you've decided"], "t": ["Вы только что решили — и нужна энергия начать. Тёплый оранжево-красный сердолик — цвет мотивации и радости движения. Носите в первые недели нового проекта, работы, режима.", "Tocmai ați decis și vă trebuie energie ca să începeți. Carneolul portocaliu-roșcat e de mult asociat cu motivația și bucuria mișcării. Purtați-l în primele săptămâni ale unui proiect sau regim nou.", "You've just decided, and now you need the energy to start. Warm orange-red Carnelian is traditionally the color of motivation. Wear it through the first weeks of a new project or routine."]},
 "Аквамарин": {"p": ["Спокойная речь", "Vorbire calmă", "Calm, clear speech"], "w": ["объяснить себя и быть услышанной", "să vă explicați și să fiți ascultată", "explaining yourself and being heard"], "t": ["Вам важно говорить спокойно и быть понятой. Цвет морской воды — цвет мягкой уверенности. Наденьте аквамарин на выступление или разговор дома — и говорите без спешки.", "Vreți să vorbiți calm și să fiți înțeleasă. Culoarea apei de mare e de mult asociată cu încrederea blândă. Purtați acvamarinul la o prezentare sau la o discuție acasă și vorbiți fără grabă.", "You want to speak calmly and be understood. Sea-water blue is long seen as the color of gentle confidence. Put on Aquamarine for a presentation or a talk at home, and speak without hurry."]},
 "Чароит": {"p": ["Поиск своего пути", "Căutarea drumului propriu", "Finding your path"], "w": ["когда прежние ответы перестали работать", "când vechile răspunsuri nu mai funcționează", "when the old answers stopped working"], "t": ["Вы перерастаете прежние роли. Фиолетовый чароит с живым узором связывают с интуицией и внутренним ростом. Носите его как спутника в поиске нового смысла.", "Ați depășit rolurile de până acum. Charoitul violet, cu desen viu, e de mult asociat cu intuiția și cu creșterea interioară. Purtați-l ca pe un însoțitor în căutarea unui sens nou.", "You're outgrowing your old roles. Purple Charoite, with its living swirl, is traditionally linked to intuition and inner growth. Wear it as a companion in your search for new meaning."]},
 "Гематит": {"p": ["Заземление и опора", "Ancorare și sprijin", "Grounding and support"], "w": ["вернуться в тело из головы", "să reveniți din minte în corp", "coming back into your body from your head"], "t": ["Много мыслей, мало опоры. Тяжёлый, прохладный гематит работает как тактильный якорь. Коснитесь браслета — и вернитесь в момент: здесь и сейчас.", "Aveți multe gânduri și puțin sprijin. Hematitul, greu și rece la atingere, funcționează ca o ancoră tactilă. Atingeți brățara și reveniți în clipa de față: aici și acum.", "Your mind is crowded and your feet feel far away. Heavy, cool Hematite is long seen as a tactile anchor. Touch the bracelet, breathe, and come back to the moment, here and now."]},
 "Корунд": {"p": ["Воля и решимость", "Voință și hotărâre", "Will and resolve"], "w": ["довести начатое до конца", "să duceți până la capăt ce ați început", "finishing what you started"], "t": ["План есть — нужна выдержка. Корунд очень твёрдый — символ воли и последовательности. Носите его для больших проектов, учёбы и целей: сделайте то, что решили, даже когда устали.", "Aveți un plan și vă trebuie perseverență. Corindonul, foarte dur, e de mult văzut ca simbol al voinței și al consecvenței. Purtați-l pentru proiecte și studiu, ca să duceți la capăt ce ați hotărât.", "You have the plan, and now you need staying power. Corundum is very hard, which is why it symbolizes will. Wear it for big goals and finish what you decided, even when you're tired."]},
 "Змеевик": {"p": ["Обновление", "Reînnoire interioară", "Renewal and change"], "w": ["выйти из круга, который повторяется", "să ieșiți din cercul care se repetă", "breaking out of a repeating loop"], "t": ["Вы замечаете, что жизнь ходит по кругу, и хотите перемен. Зелёный змеевик с переливчатым узором — образ обновления. Выберите одну привычку для смены и наденьте браслет как напоминание.", "Observați că viața se învârte în cerc și vă doriți schimbare. Serpentinul verde, cu desen irizat, e de mult asociat cu reînnoirea. Alegeți un obicei de schimbat și purtați brățara ca pe o amintire.", "You see life going in circles and want change. Green Serpentine, with its shimmering pattern, is traditionally an image of renewal. Pick one habit to change and wear it as your reminder."]},
 "Топаз": {"p": ["Спокойное благополучие", "Bunăstare liniștită", "Calm well-being"], "w": ["позволить себе спокойствие", "să vă permiteți liniștea", "allowing yourself some peace"], "t": ["Вы привыкли жить в режиме «надо» — и заслуживаете покоя. Тёплый топаз связывают с оптимизмом и щедростью. Носите его, когда цели достигнуты, — и сохраните радость.", "Sunteți obișnuită să trăiți după regula „trebuie” și meritați liniște. Topazul cald e de mult asociat cu optimismul și generozitatea. Purtați-l când scopurile sunt atinse și păstrați bucuria.", "You're used to living in have-to mode, and you deserve peace. Warm Topaz is traditionally linked to optimism and generosity. Wear it once your goals are met, and hold on to the joy."]},
 "Альмандин": {"p": ["Энергия и вкус к жизни", "Energie și vitalitate", "Energy and stamina"], "w": ["когда сил на себя уже не остаётся", "când nu vă mai rămân puteri pentru dumneavoastră", "when nothing is left for yourself"], "t": ["Вы отдали много сил — пора вернуть их себе. Тёмно-красный альмандин — камень энергии и выносливости. Носите его в период перезагрузки: после долгого года, затянувшейся рутины.", "Ați dat mult din puteri și e timpul să vi le recâștigați. Almandinul roșu închis e de mult asociat cu energia și rezistența. Purtați-l la resetare: după un an lung sau o rutină obositoare.", "You've given a lot of yourself, and it's time to take some back. Deep red Almandine is traditionally a stone of energy and endurance. Wear it in a season of reset, after a long year."]},
 "Флюорит": {"p": ["Ясность и фокус", "Claritate și concentrare", "Clarity and focus"], "w": ["слишком много задач сразу", "prea multe sarcini deodată", "too many tasks at once"], "t": ["День расписан по минутам, а мысли разбегаются. Фиолетово-зелёный флюорит — камень фокуса. Носите его как визуальный якорь: взгляд на запястье — и вы снова с одной задачей.", "Ziua e planificată la minut, iar gândurile se risipesc. Fluoritul violet-verzui e de mult asociat cu concentrarea. Purtați-l ca ancoră vizuală: o privire la încheietură și reveniți la o sarcină.", "Your day is booked by the minute and your thoughts scatter. Purple-green Fluorite is long seen as a stone of focus. Let it be a visual anchor: one glance at your wrist, back to one task."]},
 "Пирит": {"p": ["Уверенность в делах и деньгах", "Încredere în afaceri", "Confidence in your worth"], "w": ["заявить о себе и своей цене", "să vă declarați valoarea și prețul", "claiming your work and your price"], "t": ["Вы растёте в своём деле и знаете цену своему труду. Золотистый блеск пирита связывают с деловой энергией. Носите его на переговоры и презентации — как напоминание: ваш труд стоит своих денег.", "Creșteți în meseria dumneavoastră și vă știți valoarea. Luciul auriu al piritului e de mult asociat cu energia afacerilor. Purtați-l la negocieri, ca amintire că munca dumneavoastră merită prețul.", "You're growing in your field and know what your work is worth. Pyrite's golden shine is traditionally linked to business energy. Wear it to negotiations as a reminder of your worth."]},
 "Лабрадорит": {"p": ["Интуиция и перемены", "Intuiție și schimbare", "Intuition and change"], "w": ["вы на пороге решения", "sunteți în pragul unei decizii", "standing on the edge of a decision"], "t": ["Жизнь меняется, и внутренний голос звучит тоньше логики. Переливы лабрадорита — образ интуиции. Остановитесь и спросите себя: чего я на самом деле хочу? — и услышьте ответ.", "Viața se schimbă, iar vocea interioară sună mai fin decât logica. Irizațiile labradoritului sunt de mult asociate cu intuiția. Opriți-vă, întrebați-vă ce vă doriți cu adevărat și ascultați răspunsul.", "Life is shifting, and your inner voice is subtler than logic. Labradorite's flashes of color are long seen as an image of intuition. Pause, ask what you truly want, and listen."]},
 "Кианит": {"p": ["Спокойный диалог", "Dialog calm", "Calm conversation"], "w": ["поговорить без ссоры", "să discutați fără ceartă", "talking without fighting"], "t": ["Вы хотите разговаривать, а не ссориться. Сине-голубой кианит связывают с ясной, спокойной коммуникацией. Носите его на семейные разговоры и переговоры — и держите свой тон.", "Vreți să vorbiți, nu să vă certați. Cianitul albastru-deschis e de mult asociat cu o comunicare clară și calmă. Purtați-l la discuții în familie și la negocieri și păstrați-vă tonul.", "You want to talk, not quarrel. Blue Kyanite is traditionally linked to clear, calm communication. Wear it to family talks and negotiations, and keep your own tone."]},
 "Содалит": {"p": ["Спокойный разум", "Minte liniștită", "A calm mind"], "w": ["принять взвешенное решение", "să luați o decizie chibzuită", "making a balanced decision"], "t": ["Вы хотите опираться на разум, а не на спешку. Глубокий синий содалит связывают с ясным мышлением. Выбирайте его для учёбы, документов и решений — и принимайте их спокойно.", "Vreți să vă sprijiniți pe rațiune, nu pe grabă. Sodalitul albastru adânc e de mult asociat cu gândirea limpede. Alegeți-l pentru studiu, acte și decizii și luați-le cu calm.", "You'd rather lean on reason than rush. Deep blue Sodalite is traditionally linked to clear thinking. Choose it for study, paperwork and decisions, and make them calmly."]}
  };
  /* единый доступ: сначала минерал недели (WEEK[].look), потом DESC; ключ — русское имя камня из календаря */
  function stoneInfo(ru) {
    var d = DESC[ru];
    if (!d) for (var i = 0; i < WEEK.length; i++) if (WEEK[i].look === ru) { d = WEEK[i]; break; }
    return d ? { purpose: d.p[LI], when: d.w[LI], text: d.t[LI] } : null;
  }

  /* астроминералогия из «Шпаргалки по натуральным камням» (PDF владельца): знаки, планеты, чакры — традиционные соответствия, не медицина.
     Ключ — русское имя камня календаря (DESC); у камней, которых нет в шпаргалке, данных нет и строки не показываются. */
  var ASTRO = {"Соколиный глаз":{"s":["vod","koz"],"p":["ura","sat"],"c":["ajn","mul"]},"Рубин":{"s":["lev","ovn","skor"],"p":["sun","mar"],"c":["mul","ana"]},"Родонит":{"s":["tel","ves","ovn"],"p":["ven","mar"],"c":["ana","mul"]},"Бирюза":{"s":["str","ryb"],"p":["jup","ven"],"c":["vis"]},"Аметист":{"s":["ryb","vod"],"p":["jup","nep"],"c":["ajn","sah"]},"Горный хрусталь":{"s":["all"],"p":["sun"],"c":["all"]},"Гелиотроп":{"s":["ovn","skor"],"p":["mar"],"c":["mul","ana"]},"Нефрит":{"s":["tel","ves","dev"],"p":["ven"],"c":["ana"]},"Тигровый глаз":{"s":["lev","koz","bliz"],"p":["sun","mar"],"c":["man","mul"]},"Изумруд":{"s":["tel","rak","bliz"],"p":["ven","mer"],"c":["ana"]},"Турмалин":{"s":["ves","skor"],"p":["ven"],"c":[]},"Гранат":{"s":["koz","ovn","skor"],"p":["mar","plu"],"c":["mul","sva"]},"Цитрин":{"s":["lev","ovn","bliz"],"p":["sun","jup"],"c":["man"]},"Амазонит":{"s":["dev","vod"],"p":["mer","ura"],"c":["vis","ana"]},"Лазурит":{"s":["str","ves"],"p":["jup","ven"],"c":["vis","ajn"]},"Хризопраз":{"s":["tel","ves","bliz"],"p":["ven","mer"],"c":["ana"]},"Лунный камень":{"s":["rak","ryb"],"p":["moon"],"c":["sva","ajn","sah"]},"Берилл":{"s":["bliz","skor"],"p":["mer"],"c":[]},"Малахит":{"s":["skor","koz","tel"],"p":["ven","plu"],"c":["ana","man"]},"Солнечный камень":{"s":["lev","ovn"],"p":["sun"],"c":["man","sva"]},"Розовый кварц":{"s":["tel","ves"],"p":["ven"],"c":["ana"]},"Авантюрин":{"s":["tel","dev","ves"],"p":["ven","mer"],"c":["ana"]},"Обсидиан":{"s":["skor","koz"],"p":["plu","sat"],"c":["mul"]},"Аквамарин":{"s":["ryb","vod","skor"],"p":["nep","moon"],"c":["vis"]},"Гематит":{"s":["ovn","vod"],"p":["mar","sat"],"c":["mul"]},"Змеевик":{"s":["bliz","ves"],"p":["mer"],"c":["ana","man"]},"Альмандин":{"s":["koz","ovn","skor"],"p":["mar","plu"],"c":["mul","sva"]},"Флюорит":{"s":["vod","ryb","bliz"],"p":["ura","nep","mer"],"c":["ajn"]},"Пирит":{"s":["lev","ovn","koz"],"p":["sun","mar"],"c":["man","mul"]},"Лабрадорит":{"s":["skor","str","ryb"],"p":["ura","moon"],"c":["ajn","sah"]},"Кианит":{"s":["tel","ves","ryb"],"p":["ven","nep"],"c":["vis","ajn"]},"Содалит":{"s":["str","dev","vod"],"p":["jup","mer"],"c":["vis","ajn"]},"Сапфир":{"s":["tel","dev","ves"],"p":["sat","jup"],"c":["vis","ajn"]},"Корунд":{"s":["rak","vod","ryb"],"p":[],"c":["mul"]},"Топаз":{"s":["str","skor","lev"],"p":["jup"],"c":["man","vis"]},"Сердолик":{"s":["lev","dev","ovn"],"p":["mar","sun"],"c":["sva","mul"]},"Сардоникс":{"s":["lev","dev","ovn"],"p":["mar"],"c":["mul","man"]},"Агат":{"s":["bliz","tel","dev"],"p":["mer"],"c":["mul"]},"Чёрный агат":{"s":["bliz","koz"],"p":["sat"],"c":["mul"]},"Лава":{"s":["ovn","lev","skor"],"p":["plu"],"c":["mul","sva"]},"Чароит":{"s":["skor","str","ves"],"p":["ven","nep"],"c":["sah","ajn"]},"Жемчуг":{"s":["rak","ryb"],"p":["moon","ven"],"c":["sah","ana"]},"Коралл":{"s":["skor","ryb","rak"],"p":["mar","nep"],"c":["mul","sva"]},"Яшма":{"s":["koz","ovn","skor"],"p":["sat","mar"],"c":["mul"]},"Опал":{"s":["rak","ryb","ves"],"p":["moon","nep","ven"],"c":["vis","ana"]}};
  var A_SIGN = { ovn: ['Овен', 'Berbec', 'Aries'], tel: ['Телец', 'Taur', 'Taurus'], bliz: ['Близнецы', 'Gemeni', 'Gemini'], rak: ['Рак', 'Rac', 'Cancer'], lev: ['Лев', 'Leu', 'Leo'], dev: ['Дева', 'Fecioară', 'Virgo'], ves: ['Весы', 'Balanță', 'Libra'], skor: ['Скорпион', 'Scorpion', 'Scorpio'], str: ['Стрелец', 'Săgetător', 'Sagittarius'], koz: ['Козерог', 'Capricorn', 'Capricorn'], vod: ['Водолей', 'Vărsător', 'Aquarius'], ryb: ['Рыбы', 'Pești', 'Pisces'], all: ['все знаки', 'toate zodiile', 'all signs'] };
  var A_PL = { sun: ['Солнце', 'Soare', 'Sun'], moon: ['Луна', 'Lună', 'Moon'], mer: ['Меркурий', 'Mercur', 'Mercury'], ven: ['Венера', 'Venus', 'Venus'], mar: ['Марс', 'Marte', 'Mars'], jup: ['Юпитер', 'Jupiter', 'Jupiter'], sat: ['Сатурн', 'Saturn', 'Saturn'], ura: ['Уран', 'Uranus', 'Uranus'], nep: ['Нептун', 'Neptun', 'Neptune'], plu: ['Плутон', 'Pluto', 'Pluto'] };
  var A_CH = { mul: ['корневая', 'rădăcină', 'root'], sva: ['сакральная', 'sacrală', 'sacral'], man: ['солнечное сплетение', 'plex solar', 'solar plexus'], ana: ['сердечная', 'inimii', 'heart'], vis: ['горловая', 'gâtului', 'throat'], ajn: ['третий глаз', 'al treilea ochi', 'third eye'], sah: ['коронная', 'coroanei', 'crown'], all: ['все чакры', 'toate chakrele', 'all chakras'] };
  function astroInfo(ru) {
    var a = ASTRO[ru]; if (!a) return null;
    var f = function (list, map) { return (list || []).map(function (k) { return map[k] ? map[k][LI] : ''; }).filter(Boolean); };
    var o = { planets: f(a.p, A_PL), signs: f(a.s, A_SIGN), chakras: f(a.c, A_CH) };
    return o.planets.length || o.signs.length || o.chakras.length ? o : null;
  }
  // Подбор по намерению: камни выбраны по описаниям свойств из «Шпаргалки по натуральным камням» (PDF) и составу капсул; названия — RU/RO/EN
  var INTENTS = [
    { id: 'love', n: ['Любовь', 'Dragoste', 'Love'], art: 'Розовый кварц', st: ['Розовый кварц', 'Родонит', 'Кунцит', 'Изумруд', 'Гранат', 'Рубин'] },
    { id: 'money', n: ['Деньги и карьера', 'Bani și carieră', 'Money & career'], art: 'Цитрин', st: ['Цитрин', 'Пирит', 'Тигровый глаз', 'Нефрит', 'Авантюрин', 'Соколиный глаз'] },
    { id: 'protect', n: ['Защита', 'Protecție', 'Protection'], art: 'Обсидиан', st: ['Турмалин', 'Обсидиан', 'Гематит', 'Бронзит', 'Раухтопаз', 'Тигровый глаз', 'Лабрадорит'] },
    { id: 'calm', n: ['Спокойствие', 'Liniște', 'Calm'], art: 'Аметист', st: ['Аметист', 'Амазонит', 'Лунный камень', 'Селенит', 'Ангелит', 'Агат'] },
    { id: 'clarity', n: ['Ясность', 'Claritate', 'Clarity'], art: 'Аквамарин', st: ['Аквамарин', 'Лазурит', 'Хрусталь', 'Флюорит', 'Содалит', 'Кианит', 'Берилл'] },
    { id: 'conf', n: ['Уверенность', 'Încredere', 'Confidence'], art: 'Тигровый глаз', st: ['Тигровый глаз', 'Солнечный камень', 'Гранат', 'Рубин', 'Цитрин', 'Гелиотроп'] }
  ];
  function intentInfo(id) {
    for (var i = 0; i < INTENTS.length; i++) {
      if (INTENTS[i].id !== id) continue;
      var t = INTENTS[i];
      return { id: t.id, name: t.n[LI], art: t.art, ru: t.st.slice(), names: t.st.map(function (x) { return LI === 0 ? x : (NAMES[x] && NAMES[x][LI - 1]) || x; }) };
    }
    return null;
  }
  window.GS_MIN = { render: render, look: LOOK, keyForName: keyForName, tint: tint, hsl: hsl, week: weekInfo, WEEK: WEEK, SYS: SYS, alts: stoneAlts, names: NAMES, fold: fold, photos: PHOTOS, extra: EXTRA, info: stoneInfo, DESC: DESC, astro: astroInfo, intent: intentInfo };
})();
