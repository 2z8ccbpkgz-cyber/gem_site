/* Счётчик посещений gemstone.md — без cookie, без личных данных. Свои визиты отключить: открыть любую страницу сайта с ?an=off (вернуть: ?an=on). */
(function () {
  try {
    var q = location.search;
    if (/[?&]an=off/.test(q)) localStorage.setItem('an_off', '1');
    if (/[?&]an=on/.test(q)) localStorage.removeItem('an_off');
    if (localStorage.getItem('an_off') || location.hostname === 'localhost') return;
  } catch (e) {}
  var path = location.pathname;
  function send(o) {
    try {
      o.p = path;
      var s = JSON.stringify(o);
      if (navigator.sendBeacon) navigator.sendBeacon('/api/hit', new Blob([s], { type: 'text/plain' }));
      else fetch('/api/hit', { method: 'POST', body: s, keepalive: true });
    } catch (e) {}
  }
  var p = new URLSearchParams(location.search), u = p.get('utm_source') || '';
  if (u && p.get('utm_campaign')) u += '/' + p.get('utm_campaign');
  send({ e: 'pv', r: document.referrer, u: u, w: window.innerWidth });
  var vis = 0, t0 = document.visibilityState === 'visible' ? Date.now() : 0, sent = false;
  function stop() { if (t0) { vis += Date.now() - t0; t0 = 0; } }
  function done() { stop(); if (sent || vis < 1000) return; sent = true; send({ e: 'dur', d: Math.round(vis / 1000) }); vis = 0; }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { done(); } else { sent = false; t0 = Date.now(); }
  });
  window.addEventListener('pagehide', done);
  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('[data-add],.pd__buy') : null;
    if (!t) return;
    var id = t.getAttribute('data-add');
    if (id) return send({ e: 'cart', i: id });
    var m = (t.getAttribute('href') || '').match(/[?&]id=([^&]+)/);
    send({ e: 'buy', i: m ? decodeURIComponent(m[1]) : '' });
  }, true);
})();
