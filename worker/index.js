// gemstone-public — публичный сайт gemstone.md
// v5 (23.11.2026): личный кабинет «Мой космос» E1 (kabinet.js, kabinet_page.js; D1 APP_DB).
// v4 (23.11.2026): журнал (видеопосты): /journal/*, /media/* (R2 MEDIA), /api/journal, /sitemap-video.xml; лента на главной за флагом JOURNAL_HOME (journal.js).
// v3 (30.09.2026): автообновление (TTL 30 с + ETag, клиент перепроверяет при поиске) и автоперевод RO/EN (i18n.js).
// v2 (30.09.2026): /api/catalog (живой каталог из Google-таблицы CRM) + заказ корзины через /api/lead.
// Биндинги/секреты: ASSETS, CRM_DB (D1, общая с astrogems-sales — только чтение pricing_coefficients
// и запись заявок, как раньше), SALES_BOT_TOKEN, SALES_CHAT_ID,
// необязательно: GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY (доступ к таблице без публичной ссылки),
// AI (Workers AI — перевод названий/описаний новых позиций на RO/EN; без него работают словарь и правила).

import { translateItems, _i18n } from "./i18n.js";
import { handlePage, handleSitemap } from "./pages.js";
import { handleHit, logLead } from "./analytics.js";
import { handleKabinetApi, isKabinetApi } from "./kabinet.js";
import { handleKabinet } from "./kabinet_page.js";
import { watch as payWatch, payGo, genCallback } from "./payments.js";
import { journalSync } from "./journal_sync.js";
import { handleSeo, seoSitemap, SEO_RE } from "./seo.js";
import { loadIndex } from "./journal.js";
// отдаётся воркером, а не ASSETS (25.11.2026): полного зеркала статики в сессии нет, поэтому изменённые файлы вшиты в код (text modules)
import SHOP_JS from "./shop.js.txt";
import LLMS_TXT from "./llms.txt.txt";
import { handleJournal, handleMedia, handleApi, handleVideoSitemap, handleHome, sitemapVersion, sitemapEntries } from "./journal.js";

const CATALOG_SPREADSHEET_ID = "1h1EHm148DfLwA_2rp6rlwfNJv7Da8EZfH_XJZYMn508";

// Только эти листы попадают на сайт. «Услуги» (цены вручную) и «Закупка у физлица» — никогда.
const SHOP_SHEETS = ["Браслеты", "Чокеры", "Кольца", "Колье", "Серьги", "Другое"];

// Значения CRM на 30.09.2026 — запасной вариант. Реально берутся из CRM_DB.pricing_coefficients.
const DEFAULT_COEF = { eu_markup: 0.10, eu_rate: 20, ru_markup: 0.20, ru_rate: 5.2 };

const CATALOG_TTL_MS = 30 * 1000; // новая позиция в таблице видна на сайте не позднее чем через ~30 с (+ задержка выгрузки Google)

export default {
  // сторож платежей сайта: Cron раз в минуту опрашивает PayNet/WATA по неоплаченным счетам кабинета
  async scheduled(event, env, ctx) {
    ctx.waitUntil(payWatch(env).catch((e) => console.error("pay watch", String(e && e.message || e).slice(0, 150))));
    // автоперенос новых рилсов из Instagram CRM в журнал
    ctx.waitUntil(journalSync(env, (e) => getCatalog(e, ctx)).catch((e) => console.error("journal sync", String(e && e.message || e).slice(0, 150))));
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // личный кабинет «Мой космос» (E1): API входа/профиля и страницы /kabinet/ (+ /ro, /en)
    // поисковые страницы: камни, камень по дате рождения, знаки (+ /ro, /en)
    if (SEO_RE.test(url.pathname) || /^(\/ro|\/en)?\/(stones|birthday|zodiac)$/.test(url.pathname)) {
      if (!url.pathname.endsWith("/") && !/\/[a-z0-9-]+\/[a-z0-9-]+$/.test(url.pathname.replace(/^\/(ro|en)/, ""))) return Response.redirect(url.origin + url.pathname + "/", 301);
      return handleSeo(request, env, ctx, getCatalog, loadIndex);
    }
    if (url.pathname === "/sitemap-seo.xml") return seoSitemap(env, url.origin);
    if (url.pathname === "/api/pay/go" && request.method === "GET") return payGo(env, url);
    if (url.pathname === "/api/pay/gen-cb" && request.method === "POST") return genCallback(request, env);
    if (isKabinetApi(url.pathname)) return handleKabinetApi(request, env, ctx);
    if (/^(\/ro|\/en)?\/kabinet(\/.*)?$/.test(url.pathname)) return handleKabinet(request, env, ctx);

    if (url.pathname === "/api/lead") {
      if (request.method === "POST") return handleLead(request, env, ctx);
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (url.pathname === "/api/hit" && request.method === "POST") return handleHit(request, env, ctx);
    if (url.pathname === "/api/catalog" && request.method === "GET") {
      return handleCatalog(request, env, ctx);
    }

    // страницы изделий и sitemap — на лету из живого каталога (запасной вариант — статические файлы)
    if (/^(\/ro|\/en)?\/p\/[^/]+\/?$/.test(url.pathname)) return handlePage(request, env, ctx, getCatalog);
    if (url.pathname === "/sitemap.xml") return handleSitemap(request, env, ctx, getCatalog, env.MEDIA ? { version: sitemapVersion, entries: sitemapEntries } : undefined);

    // журнал: видеопосты Натальи (R2 MEDIA). Нет биндинга/ошибка → запасной вариант внутри обработчиков (статические файлы)
    if (url.pathname.startsWith("/media/")) return handleMedia(request, env);
    if (url.pathname === "/api/journal" || url.pathname === "/api/journal/cal") return handleApi(request, env);
    if (/^(\/ro|\/en)?\/journal(\/[^/]*)?\/?$/.test(url.pathname)) return handleJournal(request, env, ctx, getCatalog);
    if (url.pathname === "/sitemap-video.xml") return handleVideoSitemap(request, env, ctx);
    if (/^(\/ro|\/en)?\/?$/.test(url.pathname)) return handleHome(request, env, ctx); // без env.JOURNAL_HOME === "1" отдаёт статику как раньше

    // отдаётся воркером, а не ASSETS (25.11.2026): /assets/shop.js и /llms.txt вшиты в код (keep_assets: true, пути добавлены в run_worker_first).
    // Когда статика будет выложена целиком — убрать эти два пути из run_worker_first и этот блок.
    if (request.method === "GET" || request.method === "HEAD") {
      const served = WORKER_SERVED[url.pathname];
      if (served) return new Response(request.method === "HEAD" ? null : served.body, { status: 200, headers: { "content-type": served.type, "cache-control": "public, max-age=300" } });
    }

    return env.ASSETS.fetch(request);
  },
};

// отдаётся воркером, а не ASSETS (25.11.2026)
const WORKER_SERVED = {
  "/assets/shop.js": { body: SHOP_JS, type: "application/javascript; charset=utf-8" },
  "/llms.txt": { body: LLMS_TXT, type: "text/plain; charset=utf-8" },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
  };
}

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...corsHeaders(), ...extra },
  });

/* ═════════════════════════ КАТАЛОГ ═════════════════════════ */

let CATALOG_CACHE = { data: null, at: 0 };
let CATALOG_BUILD = null; // общая сборка: параллельные запросы не дёргают Google по нескольку раз

const wait = (ctx, p) => { try { ctx && ctx.waitUntil && ctx.waitUntil(p); } catch { /* локальный запуск без ctx */ } return p; };

async function handleCatalog(request, env, ctx) {
  try {
    const data = await getCatalog(env, ctx);
    const etag = `"${data.v}"`;
    const base = { etag, "cache-control": "no-cache" }; // браузер всегда перепроверяет (304 — почти бесплатно), так поиск видит новые позиции сразу
    if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ...corsHeaders(), ...base } });
    return json(data, 200, base);
  } catch (e) {
    console.error("catalog failed", e);
    return json({ ok: false, error: "catalog_unavailable" }, 503, { "cache-control": "no-store" });
  }
}

async function getCatalog(env, ctx) {
  const now = Date.now();
  if (CATALOG_CACHE.data && now - CATALOG_CACHE.at < CATALOG_TTL_MS) return CATALOG_CACHE.data;
  if (!CATALOG_BUILD) {
    CATALOG_BUILD = wait(ctx, buildCatalog(env, ctx)).finally(() => { CATALOG_BUILD = null; });
  }
  try {
    const data = await CATALOG_BUILD;
    CATALOG_CACHE = { data, at: Date.now() };
    return data;
  } catch (e) {
    // таблица временно недоступна — отдаём последний удачный каталог и повторяем попытку через ~10 с
    if (CATALOG_CACHE.data) { CATALOG_CACHE.at = Date.now() - CATALOG_TTL_MS + 10 * 1000; return CATALOG_CACHE.data; }
    throw e;
  }
}

async function buildCatalog(env, ctx) {
  const sheets = await loadSheets(env);
  const raw = [];
  const seen = new Set();
  for (const { title, rows } of sheets) {
    for (const it of parseSheet(title, rows)) {
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      raw.push(it);
    }
  }
  // Цены, доставка и порог «бесплатно от» считаются ОДНИМ ядром — CRM (service binding CRM → /api/public/price-quote), владелец 25.11.2026.
  // Собственные формулы сайта (ceil5/priceSet) — только запасной вариант, если нет ни ответа CRM, ни снимка.
  const core = await getCorePrices(env, ctx, [...new Set(raw.map((it) => it.mdl))]);
  const items = [];
  let local = null; // коэффициенты для запасных формул — читаем только если понадобились
  for (const it of raw) {
    const { mdl, ...rest } = it;
    let p = core.prices[String(mdl)];
    if (!p) {
      local = local || (await loadCoefficients(env));
      console.error("price fallback: own formulas used for base", mdl, "source", core.src);
      p = priceSet(mdl, local);
    }
    items.push({ ...rest, p: { MDL: p.MDL, EUR: p.EUR, RUB: p.RUB } });
  }
  let delivery = core.delivery;
  if (!delivery) {
    console.error("delivery fallback: own formulas used, source", core.src);
    local = local || (await loadCoefficients(env));
    delivery = await loadDelivery(env);
    // эквиваленты порога в € и ₽ — запасными формулами сайта (только если нет ни CRM, ни снимка)
    if (delivery && delivery.freeFromLei > 0) delivery.freeFrom = priceSet(delivery.freeFromLei, local);
  }
  if (!items.length) throw new Error("catalog parsed empty");
  // RO/EN названия и описания для каждой позиции — автоматически (таблица → словарь → правила → ИИ → транслит)
  const tr = await translateItems(env, ctx, items);
  const body = {
    categories: SHOP_SHEETS.filter((c) => items.some((i) => i.c === c)),
    ...(delivery ? { delivery } : {}),
    items,
  };
  return { ok: true, updated: new Date().toISOString(), v: hash53(JSON.stringify(body)), tr, ...body };
}

// версия содержимого (для ETag): меняется только когда меняются позиции, цены, названия или переводы
function hash53(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/* ═══ Цены из ядра CRM (25.11.2026) ═══ */
const CORE_URL = "https://crm.internal/api/public/price-quote";
let SNAP_READY = false;
let SNAP_LAST = "";

// 1) ответ CRM (и снимок в CRM_DB.site_price_snapshot); 2) нет ответа — последний снимок; 3) иначе { prices: {}, delivery: null } → запасные формулы сайта
async function getCorePrices(env, ctx, bases) {
  try {
    if (!env.CRM) throw new Error("no CRM binding");
    const res = await env.CRM.fetch(CORE_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bases }) });
    if (!res.ok) throw new Error("CRM price-quote " + res.status);
    const j = await res.json();
    if (!j || !j.ok || !j.prices || !j.delivery || !j.delivery.freeFrom) throw new Error("CRM price-quote: bad shape");
    const out = { src: "crm", prices: j.prices, delivery: j.delivery, v: j.v };
    await saveSnapshot(env, out).catch((e) => console.error("price snapshot save failed", String(e && e.message || e).slice(0, 150)));
    return out;
  } catch (e) {
    console.error("CRM price-quote failed, trying snapshot", String(e && e.message || e).slice(0, 150));
  }
  try {
    const row = await env.CRM_DB.prepare("SELECT v FROM site_price_snapshot WHERE k = 'quote'").first();
    const snap = row && JSON.parse(row.v);
    if (snap && snap.prices && snap.delivery && snap.delivery.freeFrom) return { src: "snapshot", prices: snap.prices, delivery: snap.delivery, v: snap.v };
  } catch (e) {
    console.error("price snapshot read failed", String(e && e.message || e).slice(0, 150));
  }
  return { src: "none", prices: {}, delivery: null };
}

async function saveSnapshot(env, q) {
  const body = JSON.stringify({ v: q.v, prices: q.prices, delivery: q.delivery });
  const sig = hash53(body);
  if (sig === SNAP_LAST) return; // ничего не изменилось — D1 не трогаем
  if (!SNAP_READY) {
    await env.CRM_DB.prepare("CREATE TABLE IF NOT EXISTS site_price_snapshot (k TEXT PRIMARY KEY, v TEXT, at INTEGER)").run();
    SNAP_READY = true;
  }
  await env.CRM_DB.prepare("INSERT INTO site_price_snapshot (k, v, at) VALUES ('quote', ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, at = excluded.at").bind(body, Date.now()).run();
  SNAP_LAST = sig;
}

// ЗАПАСНОЙ вариант (25.11.2026): основной расчёт — ядро CRM (getCorePrices). Используется только если нет ни ответа CRM, ни снимка.
// Округление вверх до 5: 59→60, 124→125, 1230→1230, 1236→1240 (правило владельца, 30.09.2026)
function ceil5(x) {
  const v = Math.round(Number(x) * 100) / 100; // убрать мусор плавающей точки
  return Math.ceil(v / 5 - 1e-9) * 5;
}

// Та же формула, что у CRM для клиента: € = лей×(1+eu_markup)/eu_rate; ₽ = лей×ru_rate×(1+ru_markup)
function priceSet(mdl, c) {
  return {
    MDL: ceil5(mdl),
    EUR: ceil5((mdl * (1 + c.eu_markup)) / c.eu_rate),
    RUB: ceil5(mdl * c.ru_rate * (1 + c.ru_markup)),
  };
}

async function loadCoefficients(env) {
  const c = { ...DEFAULT_COEF };
  try {
    const r = await env.CRM_DB.prepare(
      "SELECT key, value FROM pricing_coefficients WHERE key IN ('eu_markup','eu_rate','ru_markup','ru_rate')"
    ).all();
    for (const row of r.results || []) {
      const v = Number(row.value);
      if (Number.isFinite(v) && v >= 0) c[row.key] = v;
    }
  } catch (e) {
    console.error("pricing_coefficients read failed, defaults used", e);
  }
  if (!(c.eu_rate > 0) || !(c.ru_rate > 0)) return { ...DEFAULT_COEF };
  return c;
}

// Доставка для клиента. Правило (владелец, 25.11.2026): бесплатно от 3000 лей суммы изделий (в БАЗОВЫХ лей, «Цена NEW»),
// для всех стран; меньше — Молдова 100 лей, Европа 10 €, Россия 1000 ₽. Значения из CRM_DB.pricing_coefficients
// (delivery_free_from_lei, md_delivery_amount, eu_delivery_amount, ru_delivery_amount), если заданы, имеют приоритет.
// delivery_threshold (старое правило «от N изделий») остаётся как запасное — только если freeFromLei не определён.
const DEFAULT_DELIVERY = { threshold: 3, freeFromLei: 3000, MDL: 100, EUR: 10, RUB: 1000 };

async function loadDelivery(env) {
  const d = { ...DEFAULT_DELIVERY };
  try {
    const r = await env.CRM_DB.prepare(
      "SELECT key, value FROM pricing_coefficients WHERE key IN ('delivery_threshold','delivery_free_from_lei','md_delivery_amount','eu_delivery_amount','ru_delivery_amount')"
    ).all();
    for (const row of r.results || []) {
      const v = Number(row.value);
      if (!Number.isFinite(v) || v <= 0) continue;
      if (row.key === "delivery_threshold") d.threshold = v;
      else if (row.key === "delivery_free_from_lei") d.freeFromLei = v;
      else if (row.key === "md_delivery_amount") d.MDL = v;
      else if (row.key === "eu_delivery_amount") d.EUR = v;
      else if (row.key === "ru_delivery_amount") d.RUB = v;
    }
  } catch (e) {
    console.error("delivery coefficients read failed, defaults used", e);
  }
  return d;
}

async function loadSheets(env) {
  if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY) return loadSheetsViaApi(env);
  return loadSheetsViaPublicCsv();
}

// — путь 1: сервисный аккаунт (работает и после закрытия публичной ссылки)
async function loadSheetsViaApi(env) {
  const token = await googleToken(env);
  const auth = { headers: { authorization: `Bearer ${token}` } };
  const meta = await (await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${CATALOG_SPREADSHEET_ID}?fields=sheets.properties(title,hidden)`,
    auth
  )).json();
  const titles = (meta.sheets || [])
    .map((s) => s.properties)
    .filter((p) => !p.hidden && SHOP_SHEETS.includes(String(p.title).trim()))
    .map((p) => p.title);
  if (!titles.length) throw new Error("no shop sheets visible");
  const ranges = titles.map((t) => `ranges=${encodeURIComponent(`'${t.replace(/'/g, "''")}'!A:Z`)}`).join("&");
  const data = await (await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${CATALOG_SPREADSHEET_ID}/values:batchGet?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE&${ranges}`,
    auth
  )).json();
  if (!data.valueRanges) throw new Error("sheets api: " + JSON.stringify(data.error || {}).slice(0, 200));
  return titles.map((title, i) => ({ title: String(title).trim(), rows: data.valueRanges[i]?.values || [] }));
}

let TOKEN_CACHE = { value: null, exp: 0 };
async function googleToken(env) {
  if (TOKEN_CACHE.value && Date.now() < TOKEN_CACHE.exp) return TOKEN_CACHE.value;
  const now = Math.floor(Date.now() / 1000);
  const enc = (o) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const unsigned = `${enc({ alg: "RS256", typ: "JWT" })}.${enc({
    iss: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3500,
  })}`;
  const pem = env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (ch) => ch.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${b64url(sig)}` }),
  });
  const d = await r.json();
  if (!d.access_token) throw new Error("google token failed");
  TOKEN_CACHE = { value: d.access_token, exp: Date.now() + 50 * 60 * 1000 };
  return d.access_token;
}
function b64url(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// — путь 2: пока таблица открыта по ссылке — CSV-выгрузка каждого листа по gid
let GID_CACHE = { map: null, at: 0 };
async function loadSheetsViaPublicCsv() {
  const base = `https://docs.google.com/spreadsheets/d/${CATALOG_SPREADSHEET_ID}`;
  if (!GID_CACHE.map || Date.now() - GID_CACHE.at > 60 * 60 * 1000) {
    const html = await (await fetch(`${base}/htmlview`)).text();
    const map = parseGidMap(html);
    if (!Object.keys(map).length) throw new Error("sheet list not readable (публичная ссылка закрыта? нужен сервисный аккаунт)");
    GID_CACHE = { map, at: Date.now() };
  }
  const titles = SHOP_SHEETS.filter((t) => GID_CACHE.map[t]);
  return Promise.all(
    titles.map(async (title) => {
      const r = await fetch(`${base}/export?format=csv&gid=${GID_CACHE.map[title]}`);
      if (!r.ok) throw new Error(`csv ${title} ${r.status}`);
      return { title, rows: parseCsv(await r.text()) };
    })
  );
}
function parseGidMap(html) {
  const map = {};
  for (const m of html.matchAll(/\{name: "((?:[^"\\]|\\.)*)", pageUrl: "[^"]*", gid: "(\d+)"/g)) {
    let name = m[1];
    try { name = JSON.parse(`"${m[1]}"`); } catch { /* как есть */ }
    map[name.trim()] = m[2];
  }
  return map;
}

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
      } else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// Разбор листа — те же псевдонимы колонок, что у CRM, плюс необязательные «Название RO», «Название EN»,
// «Описание», «Описание RO», «Описание EN» и «Фото» (ссылка). Себестоимость, остаток, поставщик — не читаются вообще.
const ALIASES = {
  sku: ["артикул", "артикль", "sku", "код", "код товара"],
  name: ["наименование", "название", "позиция", "товар", "название камня", "наименование товара"],
  price: ["цена new", "цена", "стоимость", "price", "цена продажи", "розница"],
  size: ["размер", "size", "диаметр"],
  photo: ["фото", "photo", "изображение"],
  nameRo: ["название ro", "наименование ro", "denumire", "denumire ro"],
  nameEn: ["название en", "наименование en", "name en"],
  descRo: ["описание ro", "descriere"],
  descEn: ["описание en", "description"],
  desc: ["описание", "описание ru"],
};
const normH = (v) => String(v ?? "").trim().toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]+/gi, " ").replace(/\s+/g, " ").trim();
function colIndex(header, names) {
  const cells = header.map(normH);
  for (const n of names) {
    const i = cells.findIndex((c) => c === n);
    if (i >= 0) return i;
  }
  for (const n of names) {
    const i = cells.findIndex((c) => c.startsWith(n + " "));
    if (i >= 0) return i;
  }
  return -1;
}
const clean = (v) => String(v ?? "").replace(/[“”«»]/g, '"').replace(/\s+/g, " ").trim();
function normSku(v) {
  const t = String(v ?? "").trim().toUpperCase().replace(/[\s._]+/g, "");
  if (!t) return "";
  const map = { B: "В", O: "О", C: "С", K: "К" };
  return (map[t[0]] || t[0]) + t.slice(1);
}
function parseMoney(v) {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace(/\s+/g, "").replace(",", ".").replace(/[^0-9.]/g, "");
  if (!s) return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
function sizeLabel(name, size) {
  const s = clean(size);
  if (!s) return "";
  const digits = s.replace(/[^\d]/g, "");
  if (digits && new RegExp(`(^|\\D)${digits}(\\D|$)`).test(name)) return ""; // размер уже есть в названии («8мм», «кубы 4*4»)
  return /мм|см|mm/i.test(s) ? s : `${s} мм`;
}
function photoUrl(v) {
  const s = clean(v);
  if (!/^https?:\/\//i.test(s)) return "";
  const drive = s.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/);
  if (drive) return `https://drive.google.com/thumbnail?id=${drive[1]}&sz=w1000`;
  return s;
}
function parseSheet(title, rows) {
  let h = -1, idx = null;
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r] || [];
    const i = {};
    for (const k of Object.keys(ALIASES)) i[k] = colIndex(row, ALIASES[k]);
    if (i.desc >= 0 && (i.desc === i.descRo || i.desc === i.descEn)) i.desc = -1;
    if (i.name >= 0 && (i.name === i.nameRo || i.name === i.nameEn)) i.name = -1; // «Название RO» не должно стать основным названием
    if (i.sku >= 0 && i.name >= 0 && i.price >= 0) { h = r; idx = i; break; }
  }
  if (!idx) return [];
  const out = [];
  for (const row of rows.slice(h + 1)) {
    const name = clean(row[idx.name]);
    const sku = normSku(row[idx.sku]);
    const mdl = parseMoney(row[idx.price]);
    if (!name || !sku || !(mdl > 0)) continue;
    const item = { id: sku, n: name, c: title, mdl };
    const s = idx.size >= 0 ? sizeLabel(name, row[idx.size]) : "";
    if (s) item.s = s;
    const img = idx.photo >= 0 ? photoUrl(row[idx.photo]) : "";
    if (img) item.img = img;
    const tn = {};
    if (idx.nameRo >= 0 && clean(row[idx.nameRo])) tn.ro = clean(row[idx.nameRo]).slice(0, 160);
    if (idx.nameEn >= 0 && clean(row[idx.nameEn])) tn.en = clean(row[idx.nameEn]).slice(0, 160);
    if (Object.keys(tn).length) item.t = tn;
    const d = {};
    if (idx.desc >= 0 && clean(row[idx.desc])) d.ru = clean(row[idx.desc]).slice(0, 1200);
    if (idx.descRo >= 0 && clean(row[idx.descRo])) d.ro = clean(row[idx.descRo]).slice(0, 1200);
    if (idx.descEn >= 0 && clean(row[idx.descEn])) d.en = clean(row[idx.descEn]).slice(0, 1200);
    if (Object.keys(d).length) item.d = d;
    out.push(item);
  }
  return out;
}

/* ═════════════════════════ ЗАЯВКА / ЗАКАЗ ═════════════════════════ */

const CUR_LABEL = { MDL: "лей", EUR: "€", RUB: "₽" };

async function handleLead(request, env, ctx) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }

  const name = clip(data.name, 200);
  const contact = clip(data.contact, 200);
  if (!name || !contact) {
    return json({ ok: false, error: "missing_fields" }, 400);
  }

  const method = clip(data.method, 50);
  const country = clip(data.country, 200);
  let interest = clip(data.interest, 200) || "Общий вопрос";
  const userComment = clip(data.comment, 1000);
  let comment = userComment;

  // Корзина: клиент присылает только артикулы и количество — цены пересчитываются здесь, по каталогу.
  const cartLines = await buildCartLines(env, data, ctx);
  if (cartLines.length) {
    interest = cartLines.interest;
    comment = [cartLines.join("\n"), userComment].filter(Boolean).join("\n— ");
  }

  const noteParts = [
    method ? `Способ связи: ${method}` : null,
    country ? `Страна/город: ${country}` : null,
    comment ? `Комментарий: ${comment}` : null,
  ].filter(Boolean);
  const notes = noteParts.join(" · ");

  let clientId;
  try {
    const isPhone = /^[+0-9][0-9\s\-()]{5,}$/.test(contact);
    const clientRes = await env.CRM_DB.prepare(
      `INSERT INTO clients (name, phone, source, notes) VALUES (?, ?, ?, ?)`
    )
      .bind(name, isPhone ? contact : null, "gemstone.md", notes || null)
      .run();
    clientId = clientRes.meta.last_row_id;

    if (!isPhone) {
      await env.CRM_DB.prepare(`UPDATE clients SET notes = ? WHERE id = ?`)
        .bind(`Контакт: ${contact}` + (notes ? " · " + notes : ""), clientId)
        .run();
    }

    // amount остаётся 0, как у всех заявок с сайта: это ещё не продажа; состав и сумма — в comment.
    await env.CRM_DB.prepare(
      `INSERT INTO orders (client_id, status, source, amount, currency, comment)
       VALUES (?, 'new', 'gemstone.md', 0, 'MDL', ?)`
    )
      .bind(clientId, cartLines.length ? `${interest}\n${cartLines.join("\n")}` : interest)
      .run();
  } catch (e) {
    console.error("CRM_DB write failed", e);
    return json({ ok: false, error: "db_failed" }, 500);
  }

  if (env.SALES_BOT_TOKEN && env.SALES_CHAT_ID) {
    const now = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
    const lines = [
      cartLines.length ? "🛍 Заказ из корзины gemstone.md (уже в CRM)" : "🔔 Заявка с gemstone.md (уже в CRM)",
      `Имя: ${name}`,
      `Контакт: ${contact}`,
      method ? `Способ связи: ${method}` : null,
      country ? `Страна/город: ${country}` : null,
      `Тема: ${interest}`,
      cartLines.length ? cartLines.join("\n") : null,
      (cartLines.length ? userComment : comment) ? `Комментарий: ${cartLines.length ? userComment : comment}` : null,
      `Время: ${now}`,
    ].filter(Boolean);

    try {
      await fetch(`https://api.telegram.org/bot${env.SALES_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: env.SALES_CHAT_ID, text: lines.join("\n") }),
      });
    } catch (e) {
      console.error("telegram notify failed (не критично, заявка уже в CRM)", e);
    }
  }

  wait(ctx, logLead(request, env, { item: (cartLines.length && normSku(data.cart?.[0]?.id)) || "", lang: String(data.lang || "").slice(0, 2).toLowerCase(), count: parseInt((cartLines.interest || "").match(/(\d+) шт/)?.[1], 10) || 0 }));
  return json({ ok: true });
}

async function buildCartLines(env, data, ctx) {
  const lines = [];
  if (!Array.isArray(data.cart) || !data.cart.length) return lines;
  const cur = ["MDL", "EUR", "RUB"].includes(data.currency) ? data.currency : "MDL";
  let catalog = null;
  try { catalog = await getCatalog(env, ctx); } catch (e) { console.error("catalog for cart failed", e); }
  const byId = new Map((catalog?.items || []).map((i) => [i.id, i]));
  let total = 0, totalMdl = 0, count = 0;
  for (const raw of data.cart.slice(0, 50)) {
    const id = normSku(raw?.id);
    if (!id) continue;
    const q = Math.max(1, Math.min(20, parseInt(raw?.q, 10) || 1));
    const it = byId.get(id);
    count += q;
    if (!it) { lines.push(`${clip(id, 30)} — не найден в каталоге ×${q}`); continue; }
    total += it.p[cur] * q;
    totalMdl += it.p.MDL * q;
    lines.push(`${it.id} — ${it.n}${it.s ? " " + it.s : ""} ×${q} = ${it.p[cur] * q} ${CUR_LABEL[cur]}`);
  }
  if (!lines.length) return lines;
  lines.push(`Итого: ${total} ${CUR_LABEL[cur]}` + (cur !== "MDL" ? ` (по каталогу ${totalMdl} лей)` : "") + ` · ${count} шт.`);
  // Получение: клиент выбирает в корзине «нужна доставка» (по умолчанию) или «самовывоз из шоурума».
  const pickup = data.delivery === "pickup";
  const dl = catalog?.delivery;
  if (pickup) {
    lines.push("Получение: САМОВЫВОЗ из шоурума (доставка не нужна)");
  } else if (dl && dl[cur] && (dl.freeFromLei > 0 || dl.threshold)) {
    const place = cur === "MDL" ? "по Молдове" : cur === "EUR" ? "в Европу" : "в Россию";
    // правило: сумма изделий в базовых лей >= freeFromLei; счёт по штукам — только запасной вариант
    const byLei = dl.freeFromLei > 0;
    const free = byLei ? totalMdl >= dl.freeFromLei : count >= dl.threshold;
    const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const rule = byLei
      ? `от ${grp(dl.freeFromLei)} лей` + (cur !== "MDL" && dl.freeFrom && dl.freeFrom[cur] ? ` ≈ ${grp(dl.freeFrom[cur])} ${CUR_LABEL[cur]}` : "")
      : `от ${dl.threshold} шт.`;
    lines.push(free
      ? `Получение: нужна доставка ${place} — бесплатно (${rule})`
      : `Получение: нужна доставка ${place} +${dl[cur]} ${CUR_LABEL[cur]} (${byLei ? `товаров на ${grp(totalMdl)} лей, бесплатно ${rule}` : `меньше ${dl.threshold} шт.`}) — к оплате ${total + dl[cur]} ${CUR_LABEL[cur]}`);
  } else {
    lines.push("Получение: нужна доставка (стоимость подтвердит менеджер)");
  }
  const wrist = clip(data.wrist, 40);
  if (wrist) lines.push(`Обхват запястья: ${wrist}`);
  lines.interest = `Заказ с сайта (корзина, ${count} шт., ${pickup ? "самовывоз" : "доставка"})`;
  return lines;
}

function clip(v, max) {
  if (v === undefined || v === null) return "";
  return String(v).trim().slice(0, max);
}

// для локальных тестов
export const _test = { ceil5, priceSet, parseSheet, parseCsv, normSku, photoUrl, parseGidMap, sizeLabel, hash53, resetCatalogCache: () => { CATALOG_CACHE = { data: null, at: 0 }; }, CATALOG_TTL_MS, ..._i18n };
