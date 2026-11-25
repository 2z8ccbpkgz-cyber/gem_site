/* Быстрая заявка на страницах изделий, каталога и постов журнала.
   Та же панель «Оставить заявку», что на главной (классы .stickybar, поля, /api/lead), но с контекстом: где находится человек
   (изделие + артикул / статья + ссылка) подставляется сам, тема выбирается одним касанием. На главной не включается (там своя панель). */
(function () {
  'use strict';
  var d = document, b = d.body;
  if (!b || d.getElementById('stickybar') || d.getElementById('leadbar')) return;
  var isPd = !!b.getAttribute('data-lead-sku'), isPost = !!d.getElementById('jd'), isShop = !!d.getElementById('shop');
  if (!isPd && !isPost && !isShop) return;

  var LANG = (d.documentElement.lang || 'ru').slice(0, 2); if (['ru', 'ro', 'en'].indexOf(LANG) < 0) LANG = 'ru';
  var TX = {
    ru: { open: 'Оставить заявку', cart: 'В корзину', inCart: 'В корзине ✓', title: 'Оставить заявку', name: 'Как вас зовут', contact: 'Телефон / Telegram', country: 'Страна / город', send: 'Отправить', sending: 'Отправляем…',
      need: 'Заполните имя и телефон или Telegram — иначе мы не сможем ответить.', err: 'Не получилось отправить. Напишите нам прямо в Telegram — @gemstone_md_bot.', ok: 'Заявка получена — мы напишем в течение дня.', close: 'Свернуть', topic: 'Тема заявки',
      m: { Telegram: 'Telegram', WhatsApp: 'WhatsApp', 'Звонок': 'Звонок', Viber: 'Viber' },
      item: 'Это изделие', post: 'Эта статья', date: 'Подбор камня по дате рождения', natal: 'Разбор натальной карты', gift: 'Подарок', other: 'Другое',
      phDate: 'Дата рождения (дд.мм.гггг)', phNatal: 'Дата, время и город рождения', phGift: 'Для кого подарок, повод', phOther: 'Что вас интересует', ask: 'Оставить заявку на это изделие' },
    ro: { open: 'Trimite o cerere', cart: 'În coș', inCart: 'În coș ✓', title: 'Trimite o cerere', name: 'Cum te numești', contact: 'Telefon / Telegram', country: 'Țară / oraș', send: 'Trimite', sending: 'Se trimite…',
      need: 'Completați numele și telefonul sau Telegram — altfel nu vă putem răspunde.', err: 'Nu s-a putut trimite. Scrieți-ne direct pe Telegram — @gemstone_md_bot.', ok: 'Cererea a fost primită — te scriem în cursul zilei.', close: 'Restrânge', topic: 'Subiectul cererii',
      m: { Telegram: 'Telegram', WhatsApp: 'WhatsApp', 'Звонок': 'Apel telefonic', Viber: 'Viber' },
      item: 'Acest produs', post: 'Acest articol', date: 'Alegerea pietrei după data nașterii', natal: 'Analiza hărții natale', gift: 'Cadou', other: 'Altceva',
      phDate: 'Data nașterii (zz.ll.aaaa)', phNatal: 'Data, ora și orașul nașterii', phGift: 'Pentru cine este cadoul, ocazia', phOther: 'Ce te interesează', ask: 'Trimite o cerere pentru acest produs' },
    en: { open: 'Send a request', cart: 'Add to cart', inCart: 'In cart ✓', title: 'Send a request', name: 'Your name', contact: 'Phone / Telegram', country: 'Country / city', send: 'Send', sending: 'Sending…',
      need: 'Fill in your name and phone or Telegram — otherwise we can’t reply.', err: 'Couldn’t send. Message us directly on Telegram — @gemstone_md_bot.', ok: 'Request received — we will write to you within a day.', close: 'Close', topic: 'Request topic',
      m: { Telegram: 'Telegram', WhatsApp: 'WhatsApp', 'Звонок': 'Phone call', Viber: 'Viber' },
      item: 'This piece', post: 'This article', date: 'Stone by birth date', natal: 'Natal chart reading', gift: 'A gift', other: 'Other',
      phDate: 'Date of birth (dd.mm.yyyy)', phNatal: 'Date, time and place of birth', phGift: 'Who the gift is for, occasion', phOther: 'What are you interested in', ask: 'Send a request about this piece' }
  }[LANG];
  // тема для CRM — всегда по-русски (как у остальных заявок сайта)
  var RU = { item: 'изделие', post: 'статья журнала', date: 'подбор камня по дате рождения', natal: 'разбор натальной карты', gift: 'подарок', other: 'другое' };

  function store(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var txt = function (el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; };

  /* ── где находится человек ── */
  function jd() { try { return JSON.parse(d.getElementById('jd').textContent); } catch (e) { return null; } }
  function ctx() {
    var q = d.querySelector('.qv.on');
    if (q) { // окно изделия в каталоге
      var t = txt(q.querySelector('.qv__t')), sku = t.split('·').pop().trim();
      if (sku) return { kind: 'item', sku: sku, name: txt(q.querySelector('.qv__n')), ru: '' };
    }
    if (isPd) return { kind: 'item', sku: b.getAttribute('data-lead-sku'), name: b.getAttribute('data-lead-name') || '', ru: b.getAttribute('data-lead-ru') || '' };
    if (isPost) return { kind: 'post', sku: '', name: txt(d.querySelector('h1')), ru: location.pathname.replace(/^\/(ro|en)\//, '/').replace(/^\/journal\/|\/$/g, '') };
    if (isShop) { var id = (new URLSearchParams(location.search)).get('id'); if (id) return { kind: 'item', sku: id, name: '', ru: '' }; }
    return { kind: 'none' };
  }
  function objLabel(c) { return c.kind === 'item' ? (c.name ? c.name + ' · ' + c.sku : c.sku) : c.kind === 'post' ? c.name : ''; }

  /* ── кнопка «В корзину» в панели: артикул страницы (изделие / первый товар поста) ── */
  var cartId = '';
  if (isPd) cartId = b.getAttribute('data-lead-sku');
  else if (isPost) { var J = jd(); cartId = J && J.prods && J.prods[0] ? J.prods[0].id : ''; }

  /* ── разметка (классы и поля — как у панели на главной) ── */
  var st = d.createElement('style');
  st.textContent = '.lb{z-index:90}.lb.open{z-index:140}body.gs-lb{padding-bottom:4.6rem!important}body.gs-lb .j-bar{display:none!important}' +
    '.lb__row{max-width:1200px;margin:0 auto;padding:.65rem 1.1rem;display:flex;gap:.6rem;align-items:center;justify-content:flex-end}' +
    '.lb__btn{min-height:46px;padding:0 1.3rem;font:500 .92rem var(--f-b,"Public Sans",sans-serif);cursor:pointer;border:1px solid var(--paper,#ece8e1);white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:.5rem}' +
    '.lb__cart{background:var(--paper,#ece8e1);color:var(--ink,#13161a)}.lb__cart.done{background:transparent;color:var(--paper,#ece8e1)}.lb__ask{background:transparent;color:var(--flash,#7fc3d6);border-color:var(--flash,#7fc3d6);font-weight:600}.lb__ask:hover{background:rgba(127,195,214,.12)}' +
    '.lb__form{display:none;position:relative;max-width:1200px;margin:0 auto;padding:.8rem 1.1rem 1rem;max-height:90dvh;overflow-y:auto;-webkit-overflow-scrolling:touch}.lb.open .lb__form{display:block}.lb.open .lb__row{display:none}' +
    '.lb__h{display:flex;justify-content:space-between;align-items:center;margin-bottom:.6rem;color:var(--flash,#7fc3d6);font:600 .95rem var(--f-b,"Public Sans",sans-serif)}.lb__x{background:none;border:0;color:var(--stone,#9aa0a3);font-size:1.6rem;line-height:1;cursor:pointer;padding:0 .3rem;min-width:44px;min-height:44px}' +
    '.lb__g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem}.lb__g .w2{grid-column:1/-1}' +
    '.lb__g input,.lb__g select{min-width:0;width:100%;box-sizing:border-box;background:rgba(236,232,225,.07);border:1px solid rgba(236,232,225,.22);color:var(--paper,#ece8e1);font:400 16px var(--f-b,"Public Sans",sans-serif);padding:.62rem .7rem;min-height:44px;outline:none;border-radius:0}' +
    '.lb__g input::placeholder{color:#6b6f72;font-size:14px}.lb__g input:focus,.lb__g select:focus{border-color:var(--flash,#7fc3d6)}.lb__g select option{background:var(--ink,#13161a);color:var(--paper,#ece8e1)}' +
    '.lb__go{background:var(--paper,#ece8e1);color:var(--ink,#13161a);border:0;font:600 .95rem var(--f-b,"Public Sans",sans-serif);min-height:46px;cursor:pointer}.lb__g .lb__go{grid-column:1/-1}.lb__go:hover{background:var(--flash,#7fc3d6)}.lb__go:disabled{opacity:.5;cursor:default}' +
    '.lb .stickybar__err{padding:0 1.1rem .5rem}.lb .stickybar__ok{padding:.6rem 1.1rem}' +
    '@media(min-width:861px){.lb__g{grid-template-columns:repeat(4,minmax(0,1fr))}.lb__g .w2{grid-column:span 2}.lb__g .w1,.lb__g #lbTopic,.lb__g .lb__go{grid-column:span 1}.lb__g input,.lb__g select{font-size:.9rem}}' +
    '@media(max-width:520px){.lb__row{padding:.55rem .8rem}.lb__btn{flex:1;padding:0 .6rem;font-size:.9rem}}' +
    '.qv__lead{width:100%;min-height:46px;border:1px solid var(--ink,#13161a);background:transparent;color:var(--ink,#13161a);font:500 .9rem var(--f-b,"Public Sans",sans-serif);cursor:pointer;margin-top:.1rem}.qv__lead:hover{background:var(--ink,#13161a);color:var(--paper,#ece8e1)}';
  d.head.appendChild(st);

  var bar = d.createElement('div'); bar.className = 'stickybar lb'; bar.id = 'leadbar';
  var mopts = ['Telegram', 'WhatsApp', 'Звонок', 'Viber'].map(function (v) { return '<option value="' + v + '">' + esc(TX.m[v]) + '</option>'; }).join('');
  bar.innerHTML = '<div class="lb__row">' + (cartId ? '<button type="button" class="lb__btn lb__cart" id="lbCart" data-add="' + esc(cartId) + '"></button>' : '') +
    '<button type="button" class="lb__btn lb__ask" id="lbOpen">' + esc(TX.open) + ' <span class="stickybar__arrow" aria-hidden="true">→</span></button></div>' +
    '<div class="lb__form" id="lbForm"><div class="lb__h"><span>' + esc(TX.title) + '</span><button type="button" class="lb__x" id="lbX" aria-label="' + esc(TX.close) + '">×</button></div>' +
    '<div class="lb__g"><input type="text" id="lbName" class="w1" placeholder="' + esc(TX.name) + '" autocomplete="name"><input type="text" id="lbContact" class="w1" placeholder="' + esc(TX.contact) + '" inputmode="tel" autocomplete="tel">' +
    '<select id="lbMethod" class="w1">' + mopts + '</select><input type="text" id="lbCountry" class="w1" placeholder="' + esc(TX.country) + '">' +
    '<select id="lbTopic" class="w2" aria-label="' + esc(TX.topic) + '"></select><input type="text" id="lbInterest" class="w2" placeholder="' + esc(TX.phOther) + '">' +
    '<button type="button" class="lb__go w1" id="lbGo">' + esc(TX.send) + '</button></div></div>' +
    '<p class="stickybar__err" id="lbErr" role="alert"></p><p class="stickybar__ok" id="lbOk" role="status">' + esc(TX.ok) + '</p>';
  d.body.appendChild(bar); b.classList.add('gs-lb');
  requestAnimationFrame(function () { bar.classList.add('show'); });

  var $ = function (i) { return d.getElementById(i); };
  var topicEl = $('lbTopic'), intEl = $('lbInterest'), auto = '', C = { kind: 'none' };

  function fillTopics() {
    var ks = (C.kind === 'item' ? ['item'] : C.kind === 'post' ? ['post'] : []).concat(['date', 'natal', 'gift', 'other']);
    topicEl.innerHTML = ks.map(function (k) { return '<option value="' + k + '">' + esc(TX[k]) + '</option>'; }).join('');
  }
  function applyTopic() { // подсказка и автотекст «что интересует» по теме; руками набранное не затираем
    var k = topicEl.value, ob = objLabel(C), next = '', ph = TX.phOther;
    if (k === 'item' || k === 'post') next = ob; else if (k === 'gift') { next = ob; ph = TX.phGift; } else if (k === 'date') ph = TX.phDate; else if (k === 'natal') ph = TX.phNatal;
    if (!intEl.value || intEl.value === auto) intEl.value = next;
    auto = next; intEl.placeholder = ph;
  }
  topicEl.addEventListener('change', applyTopic);

  function openForm() {
    C = ctx(); fillTopics(); auto = ''; intEl.value = ''; applyTopic();
    var s = store('gs_contact') || {};
    if (s.name && !$('lbName').value) $('lbName').value = s.name;
    if (s.contact && !$('lbContact').value) $('lbContact').value = s.contact;
    if (s.method && ['Telegram', 'WhatsApp', 'Звонок', 'Viber'].indexOf(s.method) >= 0) $('lbMethod').value = s.method;
    if (s.country && !$('lbCountry').value) $('lbCountry').value = s.country;
    $('lbErr').textContent = ''; bar.classList.add('open');
    setTimeout(function () { try { ($('lbName').value ? $('lbContact').value ? $('lbGo') : $('lbContact') : $('lbName')).focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  function closeForm() { bar.classList.remove('open'); }
  $('lbOpen').addEventListener('click', openForm);
  $('lbX').addEventListener('click', closeForm);
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && bar.classList.contains('open')) closeForm(); });
  d.addEventListener('click', function (e) { var t = e.target.closest ? e.target.closest('[data-lead-open]') : null; if (t) { e.preventDefault(); openForm(); } });

  function clip(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  $('lbGo').addEventListener('click', function () {
    var name = $('lbName').value.trim(), contact = $('lbContact').value.trim(), err = $('lbErr'), btn = $('lbGo');
    if (!name || !contact) { err.textContent = TX.need; return; }
    err.textContent = ''; btn.disabled = true; btn.textContent = TX.sending;
    var k = topicEl.value, obRu = C.kind === 'item' ? (C.sku + (C.ru || C.name ? ' ' + (C.ru || C.name) : '')) : C.kind === 'post' ? (C.ru || C.name) : '';
    var interest = 'Заявка: ' + RU[k] + ((k === 'item' || k === 'post' || k === 'gift') && obRu ? ' — ' + obRu : '');
    var page = location.origin + location.pathname + location.search, v = intEl.value.trim();
    var payload = { name: name, contact: contact, method: $('lbMethod').value, country: $('lbCountry').value.trim(), interest: clip(interest, 200),
      comment: (v ? v + '\n' : '') + 'Страница: ' + page, page: location.href, lang: navigator.language || '' };
    if (C.kind === 'item') payload.sku = C.sku;
    try { localStorage.setItem('gs_contact', JSON.stringify({ name: name, contact: contact, method: payload.method, country: payload.country })); } catch (e) {}
    fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (r) { if (!r.ok) throw 0; closeForm(); var ok = $('lbOk'); ok.style.display = 'block'; setTimeout(function () { ok.style.display = 'none'; }, 4000); })
      .catch(function () { err.textContent = TX.err; })
      .then(function () { btn.disabled = false; btn.textContent = TX.send; });
  });

  /* ── «В корзину»: общая корзина сайта gs_cart, обрабатывает shop.js; если он не загрузился — пишем сами в том же формате ── */
  function inCart(id) { var c = store('gs_cart'); return Array.isArray(c) && c.some(function (x) { return x && x.id === id; }); }
  function sync() {
    d.querySelectorAll('[data-gsl]').forEach(function (el) {
      var id = el.getAttribute('data-add'), on = inCart(id), lbl = on ? TX.inCart : TX.cart;
      if (el.id === 'lbCart') { var p = isPost && d.getElementById('jbp') ? txt(d.getElementById('jbp')) : ''; lbl += p && !on ? ' · ' + p : ''; }
      if (el.textContent !== lbl) el.textContent = lbl; el.classList.toggle('done', on);
    });
  }
  var lc = $('lbCart'); if (lc) lc.setAttribute('data-gsl', '1');
  d.querySelectorAll('.gsx-add').forEach(function (el) { el.setAttribute('data-gsl', '1'); });
  d.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-gsl]') : null;
    if (a && !window.GS_SHOP) { // запасной путь без shop.js
      var id = a.getAttribute('data-add'), c = store('gs_cart'); if (!Array.isArray(c)) c = [];
      var f = c.filter(function (x) { return x && x.id === id; })[0]; if (f) f.q = Math.min(20, f.q + 1); else c.push({ id: id, q: 1 });
      try { localStorage.setItem('gs_cart', JSON.stringify(c)); } catch (x) {}
    }
    setTimeout(sync, 120);
  });
  window.addEventListener('storage', sync);
  setTimeout(sync, 0); setTimeout(sync, 600); setTimeout(sync, 2000); // валюта/цена в journal подтягиваются после загрузки shop.js

  /* ── окно изделия в каталоге: кнопка заявки внутри окна (панель при открытом окне закрыта им) ── */
  function inject() {
    var acts = d.querySelector('.qv__b .qv__acts'); if (!acts || d.querySelector('.qv__b .qv__lead')) return;
    var bt = d.createElement('button'); bt.type = 'button'; bt.className = 'qv__lead'; bt.setAttribute('data-lead-open', '1'); bt.textContent = TX.ask;
    acts.parentNode.insertBefore(bt, acts.nextSibling);
  }
  if (isShop || isPost || isPd) {
    var tries = 0, hook = function () {
      var qb = d.querySelector('.qv__b');
      if (qb) { new MutationObserver(inject).observe(qb, { childList: true }); inject(); return; }
      if (++tries < 40) setTimeout(hook, 250);
    };
    hook();
  }
})();
