// Журнал gemstone.md (видеопосты Натальи): хаб «Кинозал», страница поста, /media/*, /api/journal, sitemap-video.xml, лента на главной.
// Данные — в R2 (биндинг MEDIA, бакет gemstone-media): journal/index.json и journal/posts/<slug>.json.
// Цены — только из живого каталога (getCatalog), корзина/валюта — те же, что у сайта (localStorage gs_cart / gs_cur, скрипт /assets/shop.js).
// Любая ошибка → запасной вариант как в pages.js: статическая страница из ASSETS (404).
import { BASE, LANGS, PFX, KIND, E, slug as skuSlug, lname, money, freeTxt, reEsc, HDR, notFound, cached, asset, chromeParts, loadStatic, makeCtx } from "./pages.js";

const LI = { ru: 0, ro: 1, en: 2 };
const LOC = { ru: "ru_RU", ro: "ro_RO", en: "en_GB" };
const TOPICS = ["signs", "gifts", "stones", "rings", "capsules"];
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,100}$/;
const IG = "https://www.instagram.com/gemstone_md/";
const IGDM = "https://ig.me/m/gemstone_md";

/* ───────────── строки интерфейса (контент поста приходит из данных) ───────────── */
const J = {
  ru: {
    jn: "Журнал", hub: "Кинозал", hubT: "Кинозал Gemstone.md — видео Натальи о камнях, знаках и украшениях", hubD: "Короткие видео Натальи: какие камни подходят вашему знаку, что подарить, как носить кольца. Расшифровка к каждому видео и украшение — рядом.",
    hubL: "Короткие видео Натальи о камнях и знаках. К каждому — расшифровка, состав и украшение, которое можно сразу заказать.", watch: "Смотреть", all: "Все видео", empty: "Видео скоро появятся.", views: "просмотров", sec: "сек.",
    topics: { signs: "Знаки", gifts: "Подарки", stones: "Камни", rings: "Кольца", capsules: "Капсулы" }, home: "Главная",
    world: "Доставляем по всему миру", worldT: "язык и валюта — в шапке, цена пересчитается сразу", byl: "Наталья, основательница Gemstone.md", video: "видео", signsK: "Камни знаков",
    vInst: "просмотров в Instagram", vCli: "клиентов Gemstone", vOrd: "заказов отправлено", play: "Смотреть видео", cart: "В корзину", inCart: "В корзине", gift: "В подарок", askN: "Спросить Наталью в Instagram",
    stonesH: "Состав", deliv: (d, f) => `Доставляем по всему миру · ${d}, бесплатно от ${f} · самовывоз из шоурума в Кишинёве`,
    trK: "Расшифровка видео", trH: "Что говорит Наталья — нажмите на фразу, и видео перейдёт к ней", stK: "Состав", stH: (n) => (n === 4 ? "Четыре камня — четыре задачи" : "Камни и их задачи"), from: "смотреть с",
    dK: "Ваш камень по дате рождения", dH: "Какой камень ведёт именно Вас", dP: "Календарь Натальи на 366 дней: камень подбирается по точной дате, а не только по знаку. Ответ — сразу, без ожидания в директе.", dPh: "дд.мм", dB: "Узнать", dE: "Введите дату — здесь появится Ваш камень и капсула Вашего знака",
    dBad: "Введите дату как дд.мм", dChk: "Проверьте дату", dErr: "Календарь временно недоступен, попробуйте позже", dStone: "Ваш камень", dYou: "Вы —", dMine: "Капсула из этого видео собрана для Вас.", dSign: "Ваш знак —", dHas: "У него своя капсула.", dCap: "Капсула",
    faqK: "Спрашивали под видео", faqH: "Частые вопросы", faqPrice: "Сколько стоит?", seeK: "Смотрите также", seeH: "Ещё видео Натальи", seeAll: "Все видео →",
    gH: "Подарить капсулу", gP: "Оставьте контакт — менеджер подскажет упаковку и карточку о камнях, уточнит размер и доставку.", gN: "Ваше имя", gC: "Телефон, Telegram или e-mail", gM: "Способ связи", gCm: "Пожелания (необязательно)", gS: "Отправить", gX: "Закрыть", gNeed: "Укажите имя и контакт", gErr: "Не удалось отправить, попробуйте ещё раз", gOk: "Спасибо! Менеджер свяжется с вами, чтобы уточнить подарок и доставку.", gSend: "Отправляем…",
    foot: "ASTROGEMS S.R.L. · Кишинёв", more: "Все видео журнала",
    mm: ["Telegram", "WhatsApp", "Viber", "Звонок"], mmL: ["Telegram", "WhatsApp", "Viber", "Звонок"], items: "камня", sub: (k, n) => `${k.toLowerCase()}, ${n} камня`,
    ans: "Коротко", delP: (a, f) => `Доставка — ${a}, бесплатно от ${f}; самовывоз из шоурума в Кишинёве — бесплатно.`, priceQ: (n, ps) => `${n}: ${ps}.`,
  },
  ro: {
    jn: "Jurnal", hub: "Sala de cinema", hubT: "Sala de cinema Gemstone.md — videoclipuri cu Natalia despre pietre, zodii și bijuterii", hubD: "Videoclipuri scurte cu Natalia: ce pietre se potrivesc zodiei tale, ce să oferi cadou, cum să porți inelele. Transcrierea fiecărui video și bijuteria — alături.",
    hubL: "Videoclipuri scurte cu Natalia despre pietre și zodii. Fiecare are transcriere, compoziție și bijuteria pe care o poți comanda imediat.", watch: "Vezi", all: "Toate videoclipurile", empty: "Videoclipurile vor apărea în curând.", views: "vizualizări", sec: "sec.",
    topics: { signs: "Zodii", gifts: "Cadouri", stones: "Pietre", rings: "Inele", capsules: "Capsule" }, home: "Acasă",
    world: "Livrăm în toată lumea", worldT: "limba și moneda — sus, prețul se recalculează imediat", byl: "Natalia, fondatoarea Gemstone.md", video: "video", signsK: "Pietrele zodiilor",
    vInst: "vizualizări pe Instagram", vCli: "clienți Gemstone", vOrd: "comenzi expediate", play: "Vezi videoclipul", cart: "În coș", inCart: "În coș", gift: "Cadou", askN: "Întreab-o pe Natalia pe Instagram",
    stonesH: "Compoziție", deliv: (d, f) => `Livrăm în toată lumea · ${d}, gratuit de la ${f} · ridicare din showroom, Chișinău`,
    trK: "Transcrierea videoclipului", trH: "Ce spune Natalia — apăsați pe o frază și videoclipul sare la ea", stK: "Compoziție", stH: (n) => `${n} pietre — fiecare cu rolul ei`, from: "vezi de la",
    dK: "Piatra ta după data nașterii", dH: "Ce piatră te însoțește pe tine", dP: "Calendarul Nataliei pe 366 de zile: piatra se alege după data exactă, nu doar după zodie. Răspunsul vine imediat, fără să aștepți în direct.", dPh: "zz.ll", dB: "Află", dE: "Introduceți data — aici va apărea piatra dumneavoastră și capsula zodiei",
    dBad: "Introduceți data ca zz.ll", dChk: "Verificați data", dErr: "Calendarul nu este disponibil momentan, încercați mai târziu", dStone: "Piatra dumneavoastră", dYou: "Sunteți", dMine: "Capsula din acest video este făcută pentru dumneavoastră.", dSign: "Zodia dumneavoastră este", dHas: "Are capsula ei.", dCap: "Capsula",
    faqK: "Întrebări sub video", faqH: "Întrebări frecvente", faqPrice: "Cât costă?", seeK: "Vezi și", seeH: "Alte videoclipuri cu Natalia", seeAll: "Toate videoclipurile →",
    gH: "Oferă capsula cadou", gP: "Lăsați un contact — managerul va propune ambalajul și cartonașul despre pietre, va confirma mărimea și livrarea.", gN: "Numele dumneavoastră", gC: "Telefon, Telegram sau e-mail", gM: "Metoda de contact", gCm: "Dorințe (opțional)", gS: "Trimite", gX: "Închide", gNeed: "Indicați numele și contactul", gErr: "Nu s-a putut trimite, încercați din nou", gOk: "Mulțumim! Managerul vă va contacta pentru a confirma cadoul și livrarea.", gSend: "Se trimite…",
    foot: "ASTROGEMS S.R.L. · Chișinău", more: "Toate videoclipurile jurnalului",
    mm: ["Telegram", "WhatsApp", "Viber", "Звонок"], mmL: ["Telegram", "WhatsApp", "Viber", "Apel"], items: "pietre", sub: (k, n) => `${k.toLowerCase()}, ${n} pietre`,
    ans: "Pe scurt", delP: (a, f) => `Livrarea costă ${a}, gratuită de la ${f}; ridicarea din showroom-ul din Chișinău este gratuită.`, priceQ: (n, ps) => `${n}: ${ps}.`,
  },
  en: {
    jn: "Journal", hub: "Screening room", hubT: "Gemstone.md Screening Room — Natalia's videos on stones, zodiac signs and jewellery", hubD: "Short videos by Natalia: which stones suit your sign, what to give as a gift, how to wear rings. Every video has a transcript and the jewellery beside it.",
    hubL: "Short videos by Natalia about stones and zodiac signs. Each comes with a transcript, the stones inside and the piece you can order right away.", watch: "Watch", all: "All videos", empty: "Videos are coming soon.", views: "views", sec: "sec",
    topics: { signs: "Signs", gifts: "Gifts", stones: "Stones", rings: "Rings", capsules: "Capsules" }, home: "Home",
    world: "We deliver worldwide", worldT: "language and currency are at the top — the price updates instantly", byl: "Natalia, founder of Gemstone.md", video: "video", signsK: "Zodiac stones",
    vInst: "views on Instagram", vCli: "Gemstone clients", vOrd: "orders shipped", play: "Watch the video", cart: "Add to cart", inCart: "In the cart", gift: "As a gift", askN: "Ask Natalia on Instagram",
    stonesH: "Composition", deliv: (d, f) => `We deliver worldwide · ${d}, free from ${f} · pick-up from the showroom in Chișinău`,
    trK: "Video transcript", trH: "What Natalia says — tap a line and the video jumps to it", stK: "Composition", stH: (n) => `${n} stones — each with its own task`, from: "watch from",
    dK: "Your stone by date of birth", dH: "Which stone guides you in particular", dP: "Natalia's 366-day calendar: the stone is chosen by the exact date, not just by sign. The answer is instant — no waiting in DMs.", dPh: "dd.mm", dB: "Find out", dE: "Enter a date — your stone and your sign's capsule will appear here",
    dBad: "Enter the date as dd.mm", dChk: "Please check the date", dErr: "The calendar is temporarily unavailable, please try later", dStone: "Your stone", dYou: "You are", dMine: "The capsule from this video was made for you.", dSign: "Your sign is", dHas: "It has its own capsule.", dCap: "Capsule",
    faqK: "Asked under the video", faqH: "Frequently asked questions", faqPrice: "How much does it cost?", seeK: "Also watch", seeH: "More videos by Natalia", seeAll: "All videos →",
    gH: "Give the capsule as a gift", gP: "Leave a contact — our manager will suggest the packaging and a card about the stones, and confirm size and delivery.", gN: "Your name", gC: "Phone, Telegram or e-mail", gM: "Contact method", gCm: "Wishes (optional)", gS: "Send", gX: "Close", gNeed: "Please enter your name and contact", gErr: "Could not send, please try again", gOk: "Thank you! Our manager will contact you to confirm the gift and delivery.", gSend: "Sending…",
    foot: "ASTROGEMS S.R.L. · Chișinău", more: "All journal videos",
    mm: ["Telegram", "WhatsApp", "Viber", "Звонок"], mmL: ["Telegram", "WhatsApp", "Viber", "Call"], items: "stones", sub: (k, n) => `${k.toLowerCase()}, ${n} stones`,
    ans: "In short", delP: (a, f) => `Delivery is ${a}, free from ${f}; pick-up from the showroom in Chișinău is free.`, priceQ: (n, ps) => `${n}: ${ps}.`,
  },
};
// знаки: [RU, RO, EN, месяц конца, день конца, номер капсулы В2026-N]
const SIGNS = [["Козерог", "Capricorn", "Capricorn", 1, 19, 10], ["Водолей", "Vărsător", "Aquarius", 2, 18, 11], ["Рыбы", "Pești", "Pisces", 3, 20, 12], ["Овен", "Berbec", "Aries", 4, 19, 1],
  ["Телец", "Taur", "Taurus", 5, 20, 2], ["Близнецы", "Gemeni", "Gemini", 6, 20, 3], ["Рак", "Rac", "Cancer", 7, 22, 4], ["Лев", "Leu", "Leo", 8, 22, 5], ["Дева", "Fecioară", "Virgo", 9, 22, 6],
  ["Весы", "Balanță", "Libra", 10, 22, 7], ["Скорпион", "Scorpion", "Scorpio", 11, 21, 8], ["Стрелец", "Săgetător", "Sagittarius", 12, 21, 9], ["Козерог", "Capricorn", "Capricorn", 12, 31, 10]];

/* ───────────── утилиты ───────────── */
const jsonLd = (o) => JSON.stringify(o).replace(/</g, "\\u003c").replace(new RegExp("\\u2028", "g"), "\\u2028").replace(new RegExp("\\u2029", "g"), "\\u2029");
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const pick = (o, l) => (o && (o[l] || o.ru)) || "";
const absU = (u) => (/^https?:/.test(u) ? u : BASE + u);
const mmss = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
const isoDur = (s) => { s = Math.round(s); return "PT" + (s >= 60 ? Math.floor(s / 60) + "M" : "") + (s % 60 ? (s % 60) + "S" : s >= 60 ? "" : "0S"); };
function kfmt(n, l) {
  n = Number(n) || 0;
  const d1 = (x) => (x >= 100 ? Math.round(x) : Math.round(x * 100) / 100).toString();
  if (n >= 1e6) { const v = d1(n / 1e6); return l === "en" ? v + "M" : l === "ro" ? v.replace(".", ",") + " mil." : v.replace(".", ",") + " млн"; }
  if (n >= 1e3) { const v = Math.round(n / 1e3); return l === "en" ? v + "K" : l === "ro" ? v + " mii" : v + " тыс."; }
  return String(n);
}
function dateL(iso, l, opt) { try { return new Date(iso + "T00:00:00Z").toLocaleDateString(LOC[l].replace("_", "-"), { timeZone: "UTC", ...(opt || { day: "numeric", month: "long", year: "numeric" }) }); } catch { return iso; } }
function signInfo(ruName, l) {
  const k = SIGNS.findIndex((s) => s[0] === ruName);
  if (k < 0) return null;
  const s = SIGNS[k], prev = k === 0 ? SIGNS[11] : SIGNS[k - 1]; // у Козерога начало — после Стрельца (22 декабря)
  const st = new Date(Date.UTC(2024, prev[3] - 1, prev[4] + 1)), en = new Date(Date.UTC(2024, s[3] - 1, s[4]));
  const o = { day: "numeric", month: "long", timeZone: "UTC" }, lc = LOC[l].replace("_", "-");
  return { name: s[LI[l]], range: st.toLocaleDateString(lc, o) + " — " + en.toLocaleDateString(lc, o), n: s[5] };
}

/* ───────────── R2: индекс и посты (кэш в изоляте 60 с) ───────────── */
const MC = new Map();
async function rjson(env, key) {
  const c = MC.get(key);
  if (c && Date.now() - c.at < 60000) return c;
  if (!env.MEDIA) throw new Error("no MEDIA binding");
  const o = await env.MEDIA.get(key);
  if (!o) { const r = { at: Date.now(), data: null, v: "" }; MC.set(key, r); return r; }
  const r = { at: Date.now(), data: await o.json(), v: o.etag || o.httpEtag || String(o.size) };
  MC.set(key, r);
  return r;
}
export async function loadIndex(env) {
  const r = await rjson(env, "journal/index.json");
  const arr = Array.isArray(r.data) ? r.data.filter((x) => x && SLUG_RE.test(String(x.slug || ""))) : [];
  arr.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return { items: arr, v: r.v };
}
async function loadPost(env, sl) {
  if (!SLUG_RE.test(sl)) return null;
  const r = await rjson(env, `journal/posts/${sl}.json`);
  return r.data ? { post: r.data, v: r.v } : null;
}
const hasLang = (p, l) => l === "ru" || !!(p[l] && p[l].h1 && Array.isArray(p[l].segments));
const langOf = (p, l) => (hasLang(p, l) ? p[l] : p.ru);
const titleOf = (it, l) => pick(it.title, l);

// реальные числа для соц. доказательства (кэш 1 ч)
let SOCIAL = { at: 0, v: null };
async function social(env) {
  if (SOCIAL.v && Date.now() - SOCIAL.at < 3600000) return SOCIAL.v;
  try {
    const r = await env.CRM_DB.prepare("SELECT COUNT(DISTINCT client_id) c, COUNT(*) o FROM orders").first();
    const c = Number(r && r.c), o = Number(r && r.o);
    if (c > 0 && o > 0) { SOCIAL = { at: Date.now(), v: { c, o } }; return SOCIAL.v; }
  } catch (e) { console.error("social failed", String(e)); }
  return SOCIAL.v; // последнее удачное значение или null — тогда блок просто не показываем (ничего не выдумываем)
}

/* ───────────── /media/* — потоковая отдача из R2 с Range ───────────── */
const MIME = { mp3: "audio/mpeg", mp4: "video/mp4", webm: "video/webm", webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", vtt: "text/vtt; charset=utf-8", json: "application/json" };
export async function handleMedia(request, env) {
  const m = request.method;
  if (m !== "GET" && m !== "HEAD") return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  let key;
  try { key = decodeURIComponent(new URL(request.url).pathname.slice("/media/".length)); } catch { return new Response("Bad Request", { status: 400 }); }
  if (!(key.startsWith("reels/") || key.startsWith("journal/img/")) || key.includes("..") || key.includes("//") || key.length > 200 || /[\u0000-\u001f]/.test(key)) return new Response("Not Found", { status: 404 });
  if (!env.MEDIA) return new Response("Not Found", { status: 404 });
  const ext = key.split(".").pop().toLowerCase();
  const ct = MIME[ext] || "application/octet-stream";
  const base = { "accept-ranges": "bytes", "cache-control": "public, max-age=31536000, immutable", "access-control-allow-origin": "*", "x-content-type-options": "nosniff", "cross-origin-resource-policy": "cross-origin" };
  try {
    const rh = request.headers.get("range");
    const inm = request.headers.get("if-none-match");
    if (m === "HEAD") {
      const o = await env.MEDIA.head(key);
      if (!o) return new Response(null, { status: 404 });
      return new Response(null, { status: 200, headers: { ...base, "content-type": (o.httpMetadata && o.httpMetadata.contentType) || ct, "content-length": String(o.size), etag: o.httpEtag } });
    }
    let opt;
    const rm = rh && /^bytes=(\d*)-(\d*)$/.exec(rh.trim());
    if (rm && (rm[1] !== "" || rm[2] !== "")) {
      if (rm[1] === "") opt = { range: { suffix: Number(rm[2]) } };
      else if (rm[2] === "") opt = { range: { offset: Number(rm[1]) } };
      else { const a = Number(rm[1]), b = Number(rm[2]); if (b < a) return new Response(null, { status: 416, headers: { ...base, "content-range": "bytes */0" } }); opt = { range: { offset: a, length: b - a + 1 } }; }
    }
    let o;
    try { o = await env.MEDIA.get(key, opt); } catch (e) {
      if (opt) { // диапазон за пределами файла → 416 с реальным размером
        const h = await env.MEDIA.head(key);
        if (!h) return new Response("Not Found", { status: 404 });
        return new Response(null, { status: 416, headers: { ...base, "content-range": `bytes */${h.size}` } });
      }
      throw e;
    }
    if (!o) return new Response("Not Found", { status: 404 });
    const type = (o.httpMetadata && o.httpMetadata.contentType) || ct;
    if (!opt && inm && o.httpEtag && inm.split(",").map((x) => x.trim()).includes(o.httpEtag)) return new Response(null, { status: 304, headers: { ...base, etag: o.httpEtag } });
    if (opt && o.range) {
      const off = o.range.offset != null ? o.range.offset : o.size - o.range.length, len = o.range.length != null ? o.range.length : o.size - off;
      return new Response(o.body, { status: 206, headers: { ...base, "content-type": type, etag: o.httpEtag, "content-range": `bytes ${off}-${off + len - 1}/${o.size}`, "content-length": String(len) } });
    }
    return new Response(o.body, { status: 200, headers: { ...base, "content-type": type, etag: o.httpEtag, "content-length": String(o.size) } });
  } catch (e) {
    console.error("media failed", String(e));
    return new Response("Error", { status: 502, headers: { "cache-control": "no-store" } });
  }
}

/* ───────────── /api/journal ───────────── */
const cors = { "access-control-allow-origin": "*" };
const jres = (o, st = 200, h = {}) => new Response(JSON.stringify(o), { status: st, headers: { "content-type": "application/json; charset=utf-8", ...cors, ...h } });
export async function handleApi(request, env) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors, "access-control-allow-methods": "GET, OPTIONS" } });
  if (request.method !== "GET" && request.method !== "HEAD") return jres({ ok: false }, 405);
  try {
    if (url.pathname === "/api/journal/cal") return await handleCal(url, env);
    if (url.pathname !== "/api/journal") return jres({ ok: false, error: "not_found" }, 404);
    const l = LANGS.includes(url.searchParams.get("lang")) ? url.searchParams.get("lang") : "ru";
    const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get("limit"), 10) || 12));
    const topic = (url.searchParams.get("topic") || "").slice(0, 30);
    const { items, v } = await loadIndex(env);
    const out = items.filter((x) => !topic || (x.topics || []).includes(topic)).slice(0, limit).map((x) => cardJson(x, l));
    return jres({ ok: true, lang: l, v, total: out.length, items: out }, 200, { "cache-control": "public, max-age=60, s-maxage=120" });
  } catch (e) { console.error("api journal", String(e)); return jres({ ok: false, error: "unavailable" }, 503, { "cache-control": "no-store" }); }
}
const cardJson = (x, l) => ({ slug: x.slug, title: titleOf(x, l), poster: x.poster, url: `${PFX[l]}/journal/${x.slug}/`, duration: x.duration, views: (x.stats && x.stats.views) || 0, sign: x.sign || null, topics: x.topics || [], date: x.date });

// Календарь «ваш камень по дате» — берём массивы CAL / ST_* / STD_* из существующего /assets/script.js сайта (без дублирования данных)
let CALD = { at: 0, v: null };
export async function calData(env, origin) {
  if (CALD.v && Date.now() - CALD.at < 600000) return CALD.v;
  const src = await (await asset(env, origin, "/assets/script.js")).text();
  const grab = (name) => { const m = src.match(new RegExp("var " + name + "\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*;")); if (!m) throw new Error("no " + name); return JSON.parse(m[1]); };
  const v = { cal: grab("CAL") };
  for (const L of LANGS) { v["st_" + L] = grab("ST_" + L.toUpperCase()); v["sd_" + L] = grab("STD_" + L.toUpperCase()); }
  CALD = { at: Date.now(), v };
  return v;
}
async function handleCal(url, env) {
  const l = LANGS.includes(url.searchParams.get("l")) ? url.searchParams.get("l") : "ru";
  const d = await calData(env, url.origin);
  return jres({ ok: true, cal: d.cal, st: d["st_" + l], sd: d["sd_" + l] }, 200, { "cache-control": "public, max-age=3600, s-maxage=86400" });
}

/* ───────────── общая оболочка страниц ───────────── */
export const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;1,6..72,300;1,6..72,400&family=Public+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">`;
export const VERIFY = `<meta name="msvalidate.01" content="F5F4988AB66745E8582839EDBF27A096"><meta name="yandex-verification" content="8cf88ddeeba5f69c"><meta name="google-site-verification" content="yEEkVI5008o9FIY8TOy2XqPGxiluU67EckeJp0zb3LM">`;

export function shell(ch, l, path) {
  // переключатель языка ведёт на тот же материал журнала; шапка «как в каталоге» (закреплённая), валюта и корзина добавляются shop.js
  let top = ch.top;
  for (const L of LANGS) top = top.split(`href="${PFX[L]}/shop/"`).join(`href="${PFX[L]}${path}"`);
  top = top.replace(/<a href="([^"]*)" class="on"/g, '<a href="$1"');
  top = top.replace(new RegExp('(<a href="' + reEsc(PFX[l] + path) + '")'), '$1 class="on"');
  top = top.replace('<div class="langsw-top">', '<div class="langsw-top tb--pinned">');
  return { top, foot: ch.foot };
}
const head = (l, title, desc, canon, extra) => `<!DOCTYPE html>
<html lang="${l}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${E(title)}</title>
<meta name="description" content="${E(desc)}">
<link rel="canonical" href="${canon}">
${FONTS}
<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/styles.css">
<style>${CSS}</style>
${extra}
${VERIFY}
</head>`;
const tail = (l, foot, jd, withClient) => `${foot}
${jd ? `<script type="application/json" id="jd">${jsonLd(jd)}</script>` : ""}
<script src="/assets/minerals.js" defer></script>
<script src="/assets/shop.js" defer></script>
<script src="/assets/lead.js" defer></script>
<script src="/assets/an.js" defer></script>
${withClient ? `<script>(${withClient.toString()})()</script>` : ""}
</body>
</html>`;

const play = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4l15 8-15 8z"/></svg>`;
const hreflangs = (post, path) => {
  const have = LANGS.filter((L) => hasLang(post, L));
  return have.map((L) => `<link rel="alternate" hreflang="${L}" href="${BASE}${PFX[L]}${path}">`).join("") + `<link rel="alternate" hreflang="x-default" href="${BASE}${path}">`;
};

/* ───────────── страница поста ───────────── */
async function renderPost(env, origin, l, post, cat, idx, ch) {
  const t = J[l], c = langOf(post, l), translated = hasLang(post, l);
  const path = `/journal/${post.slug}/`, url = `${BASE}${PFX[l]}${path}`;
  const S = await loadStatic(env, origin), cx = makeCtx(cat.items, S);
  const norm = (s) => String(s).normalize("NFC");
  const skus = (post.products || []).map((id) => cat.items.find((x) => skuSlug(x.id) === skuSlug(String(id)) )).filter(Boolean);
  const stonesSrc = Array.isArray(post.stones) ? post.stones : [];
  const lst = (post[l] && Array.isArray(post[l].stones)) ? post[l].stones : [];
  const stones = stonesSrc.map((s, i) => ({ n: (lst[i] && lst[i].n) || s.n, d: (lst[i] && lst[i].d) || s.d, t: s.t, c: s.c || "#555" }));
  const segs = (c.segments || []).filter((s) => Array.isArray(s) && s.length >= 3);
  const poster = absU(post.poster), video = absU(post.video);
  const dur = Number(post.duration) || 0;
  const views = (post.stats && post.stats.views) || 0;
  const sg = post.sign ? signInfo(post.sign, l) : null;
  const sc = await social(env);
  const faq = (c.faq || []).filter((f) => Array.isArray(f) && f[0] && f[1]);
  const prod = skus[0];
  const del = cat.delivery || { MDL: 100, EUR: 10, RUB: 1000 };
  const delTxt = (cur) => cur === "EUR" ? del.EUR + " €" : cur === "RUB" ? del.RUB + " ₽" : del.MDL + " " + (l === "ru" ? "лей" : l === "ro" ? "lei" : "MDL");
  // первый вопрос — про цену, строго из живого каталога (в видимом тексте и в FAQPage)
  const faqAll = prod ? [[t.faqPrice, `${lname(prod, l)}: ${money(prod.p.MDL, l)} · ${money(prod.p.EUR, l, "EUR")} · ${money(prod.p.RUB, l, "RUB")}. ${t.delP(delTxt("MDL") + " / " + delTxt("EUR") + " / " + delTxt("RUB"), freeTxt(l, del) + (del.freeFrom ? " (≈ " + freeTxt(l, del, "EUR") + " / " + freeTxt(l, del, "RUB") + ")" : ""))}`], ...faq] : faq;
  const transcript = segs.map((s) => s[2]).join(" ");
  const titleTxt = c.title || c.h1, h1 = c.h1 || c.title, answer = c.answer || "";
  const mdesc = answer.length > 200 ? answer.slice(0, 197).replace(/\s+\S*$/, "") + "…" : answer;

  /* JSON-LD */
  const graph = [
    { "@type": "VideoObject", "@id": url + "#video", name: h1, description: answer || h1, thumbnailUrl: [poster], uploadDate: post.date, duration: isoDur(dur), contentUrl: video, inLanguage: translated ? l : "ru",
      ...(post.width ? { width: post.width, height: post.height } : {}), transcript, author: { "@id": BASE + "/#natalia" }, publisher: { "@id": BASE + "/#store" },
      ...(views ? { interactionStatistic: { "@type": "InteractionCounter", interactionType: { "@type": "WatchAction" }, userInteractionCount: views } } : {}), mainEntityOfPage: url },
    { "@type": "Person", "@id": BASE + "/#natalia", name: l === "ru" ? "Наталья" : "Natalia", sameAs: [IG], worksFor: { "@id": BASE + "/#store" } },
    { "@type": "Article", "@id": url + "#article", headline: h1, description: answer || h1, image: [poster], datePublished: post.date, dateModified: post.date, inLanguage: translated ? l : "ru",
      author: { "@type": "Person", name: l === "ru" ? "Наталья" : "Natalia", sameAs: [IG] }, publisher: { "@id": BASE + "/#store" }, mainEntityOfPage: url, video: { "@id": url + "#video" } },
    ...skus.map((it) => {
      const pu = `${BASE}${PFX[l]}/p/${skuSlug(it.id)}/`, pics = cx.pic(it);
      const ph = pics[1] === "item" && pics[0].length ? pics[0].map(([a]) => BASE + a) : [poster || BASE + "/assets/og.jpg"];
      const k = S.caps[l] && S.caps[l][it.id];
      return { "@type": "Product", "@id": pu + "#product", name: lname(it, l), sku: it.id, description: (k && k.l) || lname(it, l), image: ph, brand: { "@type": "Brand", name: "Gemstone.md" },
        offers: { "@type": "Offer", url: pu, priceCurrency: "MDL", price: String(it.p.MDL), availability: "https://schema.org/InStock", seller: { "@id": BASE + "/#store" },
          shippingDetails: { "@type": "OfferShippingDetails", shippingRate: { "@type": "MonetaryAmount", value: 100, currency: "MDL" }, shippingDestination: { "@type": "DefinedRegion", addressCountry: "MD" }, deliveryTime: { "@type": "ShippingDeliveryTime", handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 3, unitCode: "DAY" }, transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" } } },
          hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", applicableCountry: "MD", returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow", merchantReturnDays: 14, returnMethod: "https://schema.org/ReturnByMail", returnFees: "https://schema.org/ReturnShippingFees", returnShippingFeesAmount: { "@type": "MonetaryAmount", value: 100, currency: "MDL" }, refundType: "https://schema.org/FullRefund", merchantReturnLink: BASE + PFX[l] + "/returns/" } } };
    }),
    ...(faqAll.length ? [{ "@type": "FAQPage", "@id": url + "#faq", mainEntity: faqAll.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }] : []),
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Gemstone.md", item: BASE + PFX[l] + "/" },
      { "@type": "ListItem", position: 2, name: t.jn, item: `${BASE}${PFX[l]}/journal/` },
      { "@type": "ListItem", position: 3, name: h1, item: url }] },
  ];
  const ld = { "@context": "https://schema.org", "@graph": graph };
  const og = `<meta property="og:type" content="video.other"><meta property="og:site_name" content="Gemstone.md"><meta property="og:title" content="${E(titleTxt)}"><meta property="og:description" content="${E(mdesc)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${poster}"><meta property="og:image:width" content="${post.width || 720}"><meta property="og:image:height" content="${post.height || 1280}">
<meta property="og:video" content="${video}"><meta property="og:video:secure_url" content="${video}"><meta property="og:video:type" content="video/mp4"><meta property="og:video:width" content="${post.width || 720}"><meta property="og:video:height" content="${post.height || 1280}">
<meta property="video:duration" content="${Math.round(dur)}"><meta property="og:locale" content="${LOC[l]}">${LANGS.filter((L) => L !== l && hasLang(post, L)).map((L) => `<meta property="og:locale:alternate" content="${LOC[L]}">`).join("")}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${E(titleTxt)}"><meta name="twitter:description" content="${E(mdesc)}"><meta name="twitter:image" content="${poster}">`;
  const robots = translated ? "index,follow,max-image-preview:large,max-video-preview:-1,max-snippet:-1" : "noindex,follow";
  const extra = `<meta name="robots" content="${robots}">${hreflangs(post, path)}${og}<script type="application/ld+json">${jsonLd(ld)}</script>`;

  /* продукт(ы) */
  const prodData = skus.map((it) => ({ id: it.id, name: lname(it, l), p: it.p, slug: skuSlug(it.id) }));
  const prodHtml = skus.map((it, k) => {
    const pics = cx.pic(it), srcs = pics[1] === "item" ? pics[0] : [];
    const kind = (KIND[l] || KIND.ru)[it.c] || it.c;
    const imgs = srcs.length ? srcs.map(([a, b], n) => `<img src="${a}" srcset="${b} 640w, ${a} 1200w" sizes="140px" width="1200" height="1200" alt="${E(lname(it, l))}${n ? " — " + (n + 1) : ""}" class="${n ? "" : "on"}"${n ? ' loading="lazy"' : ""}>`).join("") : `<img src="${post.poster}" alt="${E(lname(it, l))}" class="on">`;
    const dots = srcs.length > 1 ? `<div class="j-dots">${srcs.map((_, n) => `<i${n ? "" : ' class="on"'}></i>`).join("")}</div>` : "";
    const chips = stones.map((s) => `<button type="button" class="j-chip" data-t="${s.t}"><i style="background:${E(s.c)}"></i>${E(s.n)}</button>`).join("");
    return `<div class="j-prod"${k ? "" : ' id="jprod"'} data-sku="${E(it.id)}">
<div><div class="j-ph">${imgs}</div>${dots}</div>
<div><div class="j-mono">${E(it.id)} · ${E(kind.toLowerCase())}</div>
<h2><a href="${PFX[l]}/p/${skuSlug(it.id)}/">${E(lname(it, l))}</a></h2>
${chips ? `<div class="j-chips">${chips}</div>` : ""}
<div class="j-price" data-sku="${E(it.id)}">${money(it.p.MDL, l)}</div><div class="j-sub">${E(t.sub(kind, stones.length || 0))} · <span data-alt="${E(it.id)}">${money(it.p.EUR, l, "EUR")} · ${money(it.p.RUB, l, "RUB")}</span></div>
<div class="j-btns"><button type="button" class="j-btn" data-add="${E(it.id)}">${E(t.cart)}</button><button type="button" class="j-btn gh" data-gift="${E(it.id)}">${E(t.gift)}</button>
<a class="j-btn gh full" href="${IGDM}" target="_blank" rel="noopener">${E(t.askN)}</a></div></div></div>`;
  }).join("");

  const stonesH = stones.length ? `<section class="j-paper j-sec" style="padding-top:0"><div class="j-wrap"><div class="j-mono">${E(t.stK)}</div><h2 class="j-t">${E(t.stH(stones.length))}</h2>
<div class="j-stones">${stones.map((s, i) => `<div class="j-st"><svg viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="g${i}" cx=".35" cy=".3"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="${E(s.c)}"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient></defs><circle cx="50" cy="50" r="44" fill="url(#g${i})"/><circle cx="50" cy="50" r="44" fill="none" stroke="rgba(0,0,0,.25)"/></svg><h3>${E(s.n)}</h3><p>${E(s.d || "")}</p><button type="button" data-t="${s.t}">▶ ${E(t.from)} ${mmss(s.t)}</button></div>`).join("")}</div></div></section>` : "";
  const mark = (txt) => { let h = E(txt, false); for (const s of stones) { const n = String(s.n).trim(); if (n.length > 2) h = h.replace(new RegExp(reEsc(E(n, false)), "gi"), (m) => "<mark>" + m + "</mark>"); } return h; };
  const trH = segs.length ? `<section class="j-paper j-sec"><div class="j-wrap"><div class="j-mono">${E(t.trK)}</div><h2 class="j-t">${E(t.trH)}</h2><div class="j-tr" id="jtr">${segs.map((s, i) => `<p data-i="${i}" data-t="${s[0]}"><em>${mmss(s[0])}</em>${mark(s[2])}</p>`).join("")}</div></div></section>` : "";
  const faqH = faqAll.length ? `<section class="j-paper j-sec"><div class="j-wrap"><div class="j-mono">${E(t.faqK)}</div><h2 class="j-t">${E(t.faqH)}</h2><div class="j-faq">${faqAll.map((f, i) => `<details${i ? "" : " open"}><summary>${E(f[0])}</summary><p>${E(f[1])}</p></details>`).join("")}</div></div></section>` : "";
  const others = idx.items.filter((x) => x.slug !== post.slug).map((x) => ({ x, sc: (x.sign && x.sign === post.sign ? 3 : 0) + (x.topics || []).filter((q) => (post.topics || []).includes(q)).length })).sort((a, b) => b.sc - a.sc || String(b.x.date).localeCompare(String(a.x.date))).slice(0, 4).map((o) => o.x);
  const seeH = `<section class="j-dark j-sec"><div class="j-wrap"><div class="j-mono">${E(t.seeK)}</div><h2 class="j-t">${E(t.seeH)}</h2>${others.length ? `<div class="j-more">${others.map((x) => cardHtml(x, l, true)).join("")}</div>` : ""}<p style="margin-top:22px"><a class="j-lnk" href="${PFX[l]}/journal/">${E(t.seeAll)}</a></p></div></section>`;
  const capMap = {}; for (const s of SIGNS) { const it = cat.items.find((x) => skuSlug(x.id) === "B2026-" + s[5]); if (it) capMap[s[5]] = skuSlug(it.id); }

  const shellP = shell(ch, l, path);
  const stat = (b, s) => `<div><b>${b}</b><span>${E(s)}</span></div>`;
  const stats = [views ? stat(kfmt(views, l), t.vInst) : "", sc ? stat(grp(sc.c), t.vCli) : "", sc ? stat(grp(sc.o), t.vOrd) : ""].join("");
  const sec = Math.round(dur);
  const secT = l === "ru" ? (sec % 10 === 1 && sec % 100 !== 11 ? "секунда" : sec % 10 >= 2 && sec % 10 <= 4 && (sec % 100 < 10 || sec % 100 >= 20) ? "секунды" : "секунд") : l === "ro" ? (sec === 1 ? "secundă" : "secunde") : (sec === 1 ? "second" : "seconds");
  const kick = sg ? `${t.signsK} · ${sg.name}${sg.range ? " · " + sg.range : ""}` : ((post.topics || []).map((q) => t.topics[q]).filter(Boolean)[0] || t.jn);
  const jd = { l, slug: post.slug, segs, stones, prods: prodData, caps: capMap, sign: post.sign || "", signs: SIGNS.map((s) => [s[LI[l]], s[0], s[3], s[4], s[5]]), url, t: { cart: t.cart, inCart: t.inCart, dBad: t.dBad, dChk: t.dChk, dErr: t.dErr, dStone: t.dStone, dYou: t.dYou, dMine: t.dMine, dSign: t.dSign, dHas: t.dHas, dCap: t.dCap, dE: t.dE, gNeed: t.gNeed, gErr: t.gErr, gOk: t.gOk, gSend: t.gSend, gS: t.gS, from: t.from, MDL: l === "ru" ? "лей" : l === "ro" ? "lei" : "MDL" }, mm: t.mm, title: h1 };
  const bodyH = `<body class="no-bar">
${shellP.top}
<main class="jn" id="jn">
<div class="j-world"><span>✈ ${E(t.world)}</span><span class="j-wt"> · ${E(t.worldT)}</span><span class="j-wl">${LANGS.map((L) => `<a href="${PFX[L]}${path}"${L === l ? ' class="on"' : ""} hreflang="${L}">${L.toUpperCase()}</a>`).join("")}</span><span class="j-wc" id="jwc"><button type="button" data-jc="MDL">${l === "ru" ? "лей" : l === "ro" ? "lei" : "MDL"}</button><button type="button" data-jc="EUR">€</button><button type="button" data-jc="RUB">₽</button></span></div>
<section class="j-hero"><div class="j-wrap j-hw">
<div class="j-vid" id="jvid"><video id="jv" src="${post.video}" poster="${post.poster}" playsinline preload="metadata"${post.audio || post.mute ? " muted" : ""} width="${post.width || 720}" height="${post.height || 1280}"></video><div class="j-cap" id="jcap" aria-hidden="true"></div>${post.audio ? `<audio id="ja" src="${post.audio}" preload="auto"></audio>` : ""}
<button type="button" class="j-play" id="jplay" aria-label="${E(t.play)}"><span>${play}</span></button><div class="j-prog"><i id="jpr"></i></div></div>
<div>
<nav class="j-bc" aria-label="${E(t.jn)}"><a href="${PFX[l]}/">${E(t.home)}</a><span>/</span><a href="${PFX[l]}/journal/">${E(t.jn)}</a><span>/</span>${E(sg ? sg.name : h1)}</nav>
<div class="j-mono">${E(kick)}</div>
<h1 class="j-h1">${E(h1)}</h1>
<div class="j-by"><div class="j-av" style="background-image:url(${post.poster})"></div><div>${E(t.byl)}<br>${E(dateL(post.date, l))} · ${E(t.video)} ${sec} ${secT}</div></div>
${answer ? `<p class="j-ans">${E(answer)}</p>` : ""}
${stats ? `<div class="j-stats">${stats}</div>` : ""}
${prodHtml}
<div class="j-deliv" id="jdel">${E(t.deliv(delTxt("MDL"), freeTxt(l, del)))}</div>
</div></div></section>
${trH}${stonesH}
<section class="j-dark j-sec" id="jdate"><div class="j-wrap j-date"><div><div class="j-mono">${E(t.dK)}</div><h2 class="j-t" style="margin-bottom:10px">${E(t.dH)}</h2><p style="color:var(--dim);max-width:480px">${E(t.dP)}</p>
<form id="jdf" novalidate><input id="jbd" inputmode="numeric" placeholder="${E(t.dPh)}" maxlength="10" aria-label="${E(t.dK)}" autocomplete="bday"><button class="j-btn" type="submit">${E(t.dB)}</button></form></div>
<div class="j-res" id="jres" aria-live="polite"><p class="j-empty">${E(t.dE)}</p></div></div></section>
${faqH}${seeH}
<div class="j-bar" id="jbar"><div class="j-wrap">${prod ? `<img src="${(cx.pic(prod)[0][0] || [post.poster, post.poster])[1] || post.poster}" alt="" width="48" height="48">` : ""}<div class="j-bn">${E(prod ? lname(prod, l) : h1)}<b id="jbp">${prod ? money(prod.p.MDL, l) : ""}</b></div>${prod ? `<button type="button" class="j-btn" data-add="${E(prod.id)}">${E(t.cart)}</button>` : ""}</div></div>
<div class="j-modal" id="jgm" hidden><div class="j-mbg" data-gx></div><form class="j-mp" id="jgf" role="dialog" aria-modal="true" aria-labelledby="jgh"><button type="button" class="j-mx" data-gx aria-label="${E(t.gX)}">×</button>
<h3 id="jgh">${E(t.gH)}</h3><p class="j-mt">${E(t.gP)}</p>
<label><span>${E(t.gN)}</span><input name="name" autocomplete="name" required></label><label><span>${E(t.gC)}</span><input name="contact" autocomplete="tel" required></label>
<label><span>${E(t.gM)}</span><select name="method">${t.mm.map((v, i) => `<option value="${E(v)}">${E(t.mmL[i])}</option>`).join("")}</select></label>
<label><span>${E(t.gCm)}</span><textarea name="comment" rows="2" maxlength="500"></textarea></label><p class="j-err" id="jge" role="alert"></p><button class="j-btn" type="submit" id="jgs">${E(t.gS)}</button></form></div>
<div class="j-toast" id="jtoast" role="status"></div>
</main>`;
  return head(l, titleTxt + " · Gemstone.md", mdesc, url, extra) + "\n" + bodyH + "\n" + tail(l, shellP.foot, jd, postClient);
}

/* карточка видео (хаб, «смотрите также», лента) */
function cardHtml(x, l, lazy) {
  const t = J[l], ttl = titleOf(x, l), v = (x.stats && x.stats.views) || 0;
  return `<a class="j-card" href="${PFX[l]}/journal/${E(x.slug)}/"><div class="j-cp"><img src="${E(x.poster)}" alt="${E(ttl)}" width="360" height="640"${lazy ? ' loading="lazy" decoding="async"' : ""}><span class="j-dur">${mmss(x.duration || 0)}</span></div><h3>${E(ttl)}</h3><span class="j-cv">${v ? E(kfmt(v, l) + " " + t.views) : ""}</span></a>`;
}

/* ───────────── хаб «Кинозал» ───────────── */
async function renderHub(env, origin, l, idx, ch) {
  const t = J[l], path = "/journal/", url = `${BASE}${PFX[l]}${path}`;
  const items = idx.items;
  const top = items.slice().sort((a, b) => ((b.stats && b.stats.views) || 0) - ((a.stats && a.stats.views) || 0))[0];
  let hero = "", segs = [], topPost = null;
  if (top) { const lp = await loadPost(env, top.slug); if (lp) { topPost = lp.post; segs = (langOf(lp.post, l).segments || []); } }
  const sh = shell(ch, l, path);
  const tlist = TOPICS.map((tp) => ({ tp, n: items.filter((x) => (x.topics || []).includes(tp)).length })).filter((x) => x.n);
  const tchips = tlist.length ? `<div class="j-tchips">${tlist.map((x) => `<a href="#t-${x.tp}">${E(t.topics[x.tp])}<i>${x.n}</i></a>`).join("")}</div>` : "";
  const anyL = items.some((x) => x.title && x.title[l]);
  if (top) {
    const ttl = titleOf(top, l), v = (top.stats && top.stats.views) || 0, sg = top.sign ? signInfo(top.sign, l) : null;
    hero = `<section class="j-hero"><div class="j-wrap j-hw">
<a class="j-vid j-hv" href="${PFX[l]}/journal/${E(top.slug)}/" id="jhv" aria-label="${E(ttl)}"><video id="jhvid" src="${E(topPost ? topPost.video : "")}" poster="${E(top.poster)}" muted loop playsinline preload="metadata" width="720" height="1280"></video><div class="j-cap" id="jcap" aria-hidden="true"></div><span class="j-dur">${mmss(top.duration || 0)}</span></a>
<div><div class="j-mono">${E(t.jn)} · ${E(t.hub)}</div><h1 class="j-h1">${E(t.hub)}</h1><p class="j-ans">${E(t.hubL)}</p>
<div class="j-mono" style="margin-top:26px">${sg ? E(sg.name) + " · " : ""}${v ? E(kfmt(v, l) + " " + t.views) : ""}</div><h2 class="j-hh"><a href="${PFX[l]}/journal/${E(top.slug)}/">${E(ttl)}</a></h2>
<p><a class="j-btn" href="${PFX[l]}/journal/${E(top.slug)}/" style="display:inline-flex">▶ ${E(t.watch)}</a></p>
${tchips}</div></div></section>`;
  } else hero = `<section class="j-hero"><div class="j-wrap"><nav class="j-bc"><a href="${PFX[l]}/">${E(t.home)}</a><span>/</span>${E(t.jn)}</nav><h1 class="j-h1">${E(t.hub)}</h1><p class="j-ans">${E(t.empty)}</p></div></section>`;
  const secs = TOPICS.map((tp) => ({ tp, list: items.filter((x) => (x.topics || []).includes(tp)) })).filter((s) => s.list.length)
    .map((s, n) => `<section class="j-sec ${n % 2 ? "j-paper" : "j-dark"}" id="t-${s.tp}"><div class="j-wrap"><div class="j-mono">${E(t.jn)}</div><h2 class="j-t">${E(t.topics[s.tp])}</h2><div class="j-grid">${s.list.map((x) => cardHtml(x, l, true)).join("")}</div></div></section>`).join("");
  const allS = items.length ? `<section class="j-sec j-dark"><div class="j-wrap"><div class="j-mono">${E(t.jn)}</div><h2 class="j-t">${E(t.all)}</h2><div class="j-grid j-grid--p">${items.map((x) => cardHtml(x, l, true)).join("")}</div></div></section>` : "";
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", "@id": url + "#page", url, name: t.hubT, description: t.hubD, inLanguage: l, isPartOf: { "@id": BASE + "/#website" } },
    { "@type": "ItemList", itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: `${BASE}${PFX[l]}/journal/${x.slug}/`, name: titleOf(x, l) })) },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Gemstone.md", item: BASE + PFX[l] + "/" }, { "@type": "ListItem", position: 2, name: t.jn, item: url }] }] };
  const alts = LANGS.map((L) => `<link rel="alternate" hreflang="${L}" href="${BASE}${PFX[L]}${path}">`).join("") + `<link rel="alternate" hreflang="x-default" href="${BASE}${path}">`;
  const robots = l === "ru" || anyL ? "index,follow,max-image-preview:large" : "noindex,follow";
  const extra = `<meta name="robots" content="${robots}">${alts}<meta property="og:type" content="website"><meta property="og:site_name" content="Gemstone.md"><meta property="og:title" content="${E(t.hubT)}"><meta property="og:description" content="${E(t.hubD)}"><meta property="og:url" content="${url}">${top ? `<meta property="og:image" content="${absU(top.poster)}">` : `<meta property="og:image" content="${BASE}/assets/og.jpg">`}<meta property="og:locale" content="${LOC[l]}"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">${jsonLd(ld)}</script>`;
  const body = `<body class="no-bar">
${sh.top}
<main class="jn" id="jn">
<div class="j-world"><span>✈ ${E(t.world)}</span><span class="j-wt"> · ${E(t.worldT)}</span><span class="j-wl">${LANGS.map((L) => `<a href="${PFX[L]}${path}"${L === l ? ' class="on"' : ""} hreflang="${L}">${L.toUpperCase()}</a>`).join("")}</span><span class="j-wc" id="jwc"><button type="button" data-jc="MDL">${l === "ru" ? "лей" : l === "ro" ? "lei" : "MDL"}</button><button type="button" data-jc="EUR">€</button><button type="button" data-jc="RUB">₽</button></span></div>
${hero}${secs}${allS}
</main>`;
  return head(l, t.hubT, t.hubD, url, extra) + "\n" + body + "\n" + tail(l, sh.foot, { segs, l }, hubClient);
}

/* ───────────── роутер журнала ───────────── */
export async function handleJournal(request, env, ctx, getCatalog) {
  const url = new URL(request.url);
  const m = url.pathname.match(/^(\/ro|\/en)?\/journal(?:\/([^/]+))?\/?$/);
  if (!m || (request.method !== "GET" && request.method !== "HEAD")) return env.ASSETS.fetch(request);
  try {
    if (!url.pathname.endsWith("/")) return Response.redirect(url.origin + url.pathname + "/" + url.search, 301);
    const l = m[1] ? m[1].slice(1) : "ru";
    const sl = m[2] ? decodeURIComponent(m[2]) : null;
    if (!env.MEDIA) return env.ASSETS.fetch(request);
    const idx = await loadIndex(env);
    if (sl) {
      const lp = await loadPost(env, sl);
      if (!lp) return notFound(env, url.origin);
      const cat = await getCatalog(env, ctx);
      const key = `${url.origin}${url.pathname}?_b=${BUILD_J}&_c=${cat.v}&_j=${encodeURIComponent(lp.v + "|" + idx.v)}`;
      return await cached(request, ctx, key, async () => {
        const ch = await chromeParts(env, url.origin, l);
        const html = await renderPost(env, url.origin, l, lp.post, cat, idx, ch);
        return new Response(html, { status: 200, headers: { ...HDR("text/html; charset=utf-8"), ...(hasLang(lp.post, l) ? {} : { "x-robots-tag": "noindex, follow" }) } });
      });
    }
    const key = `${url.origin}${url.pathname}?_b=${BUILD_J}&_j=${encodeURIComponent(idx.v)}`;
    return await cached(request, ctx, key, async () => {
      await loadStatic(env, url.origin);
      const ch = await chromeParts(env, url.origin, l);
      return new Response(await renderHub(env, url.origin, l, idx, ch), { status: 200, headers: HDR("text/html; charset=utf-8") });
    });
  } catch (e) {
    console.error("journal fallback", String(e));
    return env.ASSETS.fetch(request);
  }
}
const BUILD_J = "j2";

/* ───────────── sitemap ───────────── */
export async function sitemapVersion(env) { const i = await loadIndex(env); return i.v; }
export async function sitemapEntries(env) {
  const idx = await loadIndex(env);
  const out = [`<url><loc>${BASE}/journal/</loc><changefreq>weekly</changefreq><priority>0.7</priority>${LANGS.map((L) => `<xhtml:link rel="alternate" hreflang="${L}" href="${BASE}${PFX[L]}/journal/"/>`).join("")}<xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/journal/"/></url>`];
  for (const L of ["ro", "en"]) out.push(`<url><loc>${BASE}${PFX[L]}/journal/</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>`);
  for (const x of idx.items) {
    const lp = await loadPost(env, x.slug); if (!lp) continue;
    const have = LANGS.filter((L) => hasLang(lp.post, L));
    const alts = have.map((L) => `<xhtml:link rel="alternate" hreflang="${L}" href="${BASE}${PFX[L]}/journal/${x.slug}/"/>`).join("") + `<xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/journal/${x.slug}/"/>`;
    for (const L of have) out.push(`<url><loc>${BASE}${PFX[L]}/journal/${x.slug}/</loc><lastmod>${E(String(x.date).slice(0, 10))}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority>${alts}</url>`);
  }
  return out.join("\n");
}
export async function handleVideoSitemap(request, env, ctx) {
  const url = new URL(request.url);
  try {
    const idx = await loadIndex(env);
    const key = `${url.origin}/sitemap-video.xml?_b=${BUILD_J}&_j=${encodeURIComponent(idx.v)}`;
    return await cached(request, ctx, key, async () => {
      const parts = [];
      for (const x of idx.items) {
        const lp = await loadPost(env, x.slug); if (!lp) continue;
        const p = lp.post;
        for (const L of LANGS.filter((q) => hasLang(p, q))) {
          const c = langOf(p, L);
          const title = String(c.h1 || c.title || "").slice(0, 100), desc = String(c.answer || c.h1 || "").slice(0, 2000);
          parts.push(`<url><loc>${BASE}${PFX[L]}/journal/${x.slug}/</loc><video:video><video:thumbnail_loc>${E(absU(p.poster))}</video:thumbnail_loc><video:title>${E(title)}</video:title><video:description>${E(desc)}</video:description><video:content_loc>${E(absU(p.video))}</video:content_loc><video:duration>${Math.max(1, Math.round(p.duration || 0))}</video:duration><video:publication_date>${E(p.date)}</video:publication_date><video:family_friendly>yes</video:family_friendly>${p.stats && p.stats.views ? `<video:view_count>${Math.round(p.stats.views)}</video:view_count>` : ""}<video:uploader info="${BASE}/">Gemstone.md</video:uploader><video:live>no</video:live></video:video></url>`);
        }
      }
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${parts.join("\n")}\n</urlset>`;
      return new Response(xml, { status: 200, headers: HDR("application/xml; charset=utf-8") });
    });
  } catch (e) { console.error("video sitemap", String(e)); return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n</urlset>', { status: 200, headers: HDR("application/xml; charset=utf-8") }); }
}

/* ───────────── лента «Смотрите и выбирайте» на главной (за флагом env.JOURNAL_HOME === "1") ───────────── */
// Нужны записи run_worker_first: "/", "/ro/", "/en/" (см. DEPLOY.md). Без флага — просто отдаём статическую страницу.
const RAIL_T = { ru: ["Смотрите и выбирайте", "Короткие видео Натальи: камни, знаки, украшения — и сразу в корзину."], ro: ["Priviți și alegeți", "Videoclipuri scurte cu Natalia: pietre, zodii, bijuterii — și direct în coș."], en: ["Watch and choose", "Short videos by Natalia: stones, signs, jewellery — straight into your cart."] };
const RAIL_CSS = `.jrail{background:#0a0c0e;color:#ece8e1;padding:clamp(40px,6vw,84px) var(--sr,2rem)}.jrail__in{max-width:1240px;margin:0 auto}.jrail h2{font:300 clamp(30px,3.6vw,44px)/1.08 'Newsreader',Georgia,serif;margin:8px 0 10px}.jrail .jrail__k{font:500 11px/1.4 'IBM Plex Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:#b9b4ab}.jrail p{color:#b9b4ab;max-width:560px;margin:0 0 24px}
.jrail__g{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}@media(max-width:1000px){.jrail__g{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:560px){.jrail__g{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:10px;margin:0 calc(var(--sr,2rem)*-1);padding:0 var(--sr,2rem) 8px}.jrail__g a{flex:0 0 44vw;scroll-snap-align:start}}
.jrail__g a{text-decoration:none;color:inherit;display:block}.jrail__g .rp{position:relative;aspect-ratio:9/16;background:#000;border:1px solid rgba(236,232,225,.12);overflow:hidden}.jrail__g img{width:100%;height:100%;object-fit:cover;display:block}.jrail__g .rd{position:absolute;left:8px;bottom:8px;font:500 11px 'IBM Plex Mono',monospace;background:rgba(10,12,14,.7);padding:3px 6px}.jrail__g h3{font:400 16px/1.25 'Newsreader',Georgia,serif;margin:10px 0 0}.jrail__all{display:inline-block;margin-top:22px;color:#7fc3d6;font:500 13px 'IBM Plex Mono',monospace;letter-spacing:.06em;text-decoration:none;border-bottom:1px solid currentColor}`;
export async function railHtml(env, l) {
  const idx = await loadIndex(env);
  const items = idx.items.slice().sort((a, b) => ((b.stats && b.stats.views) || 0) - ((a.stats && a.stats.views) || 0)).slice(0, 6);
  if (!items.length) return "";
  const [h, p] = RAIL_T[l];
  return `<section class="jrail" id="journal-rail" aria-labelledby="jrailH"><style>${RAIL_CSS}</style><div class="jrail__in"><div class="jrail__k">${E(J[l].jn)}</div><h2 id="jrailH">${E(h)}</h2><p>${E(p)}</p><div class="jrail__g">${items.map((x) => `<a href="${PFX[l]}/journal/${E(x.slug)}/"><div class="rp"><img src="${E(x.poster)}" alt="${E(titleOf(x, l))}" width="360" height="640" loading="lazy" decoding="async"><span class="rd">▶ ${mmss(x.duration || 0)}</span></div><h3>${E(titleOf(x, l))}</h3></a>`).join("")}</div><a class="jrail__all" href="${PFX[l]}/journal/">${E(J[l].more)} →</a></div></section>`;
}
export async function handleHome(request, env, ctx) {
  const url = new URL(request.url);
  const l = url.pathname.startsWith("/ro") ? "ro" : url.pathname.startsWith("/en") ? "en" : "ru";
  const plain = () => env.ASSETS.fetch(request);
  if (env.JOURNAL_HOME !== "1" || !env.MEDIA || (request.method !== "GET" && request.method !== "HEAD")) return plain();
  try {
    const html = await railHtml(env, l);
    if (!html) return plain();
    const h = new Headers(request.headers); h.delete("if-none-match"); h.delete("if-modified-since"); h.delete("range");
    const r = await env.ASSETS.fetch(new Request(request.url, { method: request.method, headers: h }));
    if (r.status !== 200 || !(r.headers.get("content-type") || "").includes("text/html")) return r;
    let done = false;
    const out = new HTMLRewriter().on("section.hero", { element(el) { if (done) return; done = true; el.after(html, { html: true }); } }).transform(r);
    const oh = new Headers(out.headers); oh.delete("etag"); oh.delete("content-length"); oh.set("cache-control", "public, max-age=60");
    return new Response(out.body, { status: 200, headers: oh });
  } catch (e) { console.error("home rail fallback", String(e)); return plain(); }
}

/* ═════════════ клиент: страница поста (выполняется в браузере; функция сериализуется через toString) ═════════════ */
function postClient() {
  var D = JSON.parse(document.getElementById("jd").textContent), $ = function (i) { return document.getElementById(i); };
  var v = $("jv"), vid = $("jvid"), SEG = D.segs, ST = D.stones, P = {}, LANG = D.l;
  D.prods.forEach(function (p) { P[p.id] = p; });
  function store(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function guess() {
    var tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    if (/Chisinau|Tiraspol/.test(tz)) return "MDL";
    if (/^Europe\/(Moscow|Samara|Volgograd|Kirov|Astrakhan|Saratov|Ulyanovsk|Kaliningrad|Simferopol)|^Asia\/(Yekaterinburg|Omsk|Novosibirsk|Barnaul|Tomsk|Novokuznetsk|Krasnoyarsk|Irkutsk|Chita|Yakutsk|Khandyga|Vladivostok|Ust-Nera|Magadan|Sakhalin|Srednekolymsk|Kamchatka|Anadyr)/.test(tz)) return "RUB";
    return LANG === "ru" ? "MDL" : "EUR";
  }
  function cur() { var c = store("gs_cur"); return c === "MDL" || c === "EUR" || c === "RUB" ? c : guess(); }
  function fmt(n, c) { var s = Number(n).toLocaleString("ru-RU").replace(/[   ]/g, " "); return c === "EUR" ? s + " €" : c === "RUB" ? s + " ₽" : s + " " + D.t.MDL; }
  var DEL = {};
  function renderPrices() {
    var c = cur();
    document.querySelectorAll(".j-price").forEach(function (e) { var p = P[e.getAttribute("data-sku")]; if (p) e.textContent = fmt(p.p[c], c); });
    document.querySelectorAll("[data-alt]").forEach(function (e) { var p = P[e.getAttribute("data-alt")]; if (p) e.textContent = ["MDL", "EUR", "RUB"].filter(function (x) { return x !== c; }).map(function (x) { return fmt(p.p[x], x); }).join(" · "); });
    var first = D.prods[0]; if ($("jbp") && first) $("jbp").textContent = fmt(first.p[c], c);
    document.querySelectorAll("[data-jc]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-jc") === c); });
    var cart = store("gs_cart") || [];
    document.querySelectorAll("[data-add]").forEach(function (b) { var id = b.getAttribute("data-add"); var inC = cart.some(function (x) { return x && x.id === id; }); b.textContent = inC ? D.t.inCart : D.t.cart; b.classList.toggle("done", inC); });
  }
  renderPrices();
  // валюта сайта: кнопки в «Доставляем по всему миру» нажимают кнопки шапки (shop.js), иначе пишут тот же ключ gs_cur
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-jc]") : null;
    if (b) { var c = b.getAttribute("data-jc"), h = document.querySelector('.cursw button[data-cur="' + c + '"]'); if (h) h.click(); else { try { localStorage.setItem("gs_cur", JSON.stringify(c)); } catch (x) {} } setTimeout(renderPrices, 0); return; }
    if (e.target.closest && e.target.closest(".cursw button[data-cur]")) setTimeout(renderPrices, 0);
    var a = e.target.closest ? e.target.closest("[data-add]") : null;
    if (a) {
      if (!window.GS_SHOP) { // shop.js не загрузился — пишем корзину сами в том же формате
        var id = a.getAttribute("data-add"), cart = store("gs_cart"); if (!Array.isArray(cart)) cart = [];
        var f = cart.filter(function (x) { return x && x.id === id; })[0]; if (f) f.q = Math.min(20, f.q + 1); else cart.push({ id: id, q: 1 });
        try { localStorage.setItem("gs_cart", JSON.stringify(cart)); } catch (x) {}
        toast(D.t.inCart);
      }
      setTimeout(renderPrices, 60);
    }
  });
  window.addEventListener("storage", renderPrices);
  var tt; function toast(m) { var t = $("jtoast"); t.textContent = m; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove("on"); }, 3400); }
  /* видео + живые субтитры */
  // голос отдельной дорожкой (музыка вырезана): видео без звука + синхронный голос
  var au = $("ja");
  if (au) {
    v.muted = true;
    var sync = function () { if (Math.abs(au.currentTime - v.currentTime) > 0.25) au.currentTime = v.currentTime; };
    v.addEventListener("play", function () { sync(); var q = au.play(); if (q && q.catch) q.catch(function () {}); });
    v.addEventListener("pause", function () { au.pause(); });
    v.addEventListener("seeked", sync); v.addEventListener("waiting", function () { au.pause(); }); v.addEventListener("playing", function () { sync(); au.play(); });
    v.addEventListener("timeupdate", sync); v.addEventListener("ended", function () { au.pause(); });
  }
  function play() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function seek(t) { var go = function () { v.currentTime = t; play(); }; if (v.readyState < 1) { v.addEventListener("loadedmetadata", go, { once: true }); v.load(); } else go(); var r = vid.getBoundingClientRect(); if (r.top < 0 || r.bottom > window.innerHeight) vid.scrollIntoView({ behavior: "smooth", block: "center" }); }
  $("jplay").onclick = play;
  v.addEventListener("play", function () { vid.classList.add("playing"); });
  v.addEventListener("pause", function () { vid.classList.remove("playing"); });
  v.addEventListener("click", function () { v.paused ? play() : v.pause(); });
  var last = -2, ps = document.querySelectorAll("#jtr p");
  v.addEventListener("timeupdate", function () {
    var t = v.currentTime; $("jpr").style.width = (t / (v.duration || 1) * 100) + "%";
    var i = -1; for (var k = 0; k < SEG.length; k++) if (t >= SEG[k][0] && t < SEG[k][1]) { i = k; break; }
    if (i !== last) { last = i; $("jcap").textContent = i >= 0 ? SEG[i][2] : ""; ps.forEach(function (p) { p.classList.toggle("on", +p.getAttribute("data-i") === i); }); }
  });
  document.addEventListener("click", function (e) { var b = e.target.closest ? e.target.closest("[data-t]") : null; if (b) { e.preventDefault(); seek(+b.getAttribute("data-t")); } });
  var hm = /#t=(\d+(?:\.\d+)?)/.exec(location.hash); if (hm) { v.addEventListener("loadedmetadata", function () { v.currentTime = +hm[1]; }, { once: true }); }
  /* карусель фото */
  document.querySelectorAll(".j-prod").forEach(function (box) {
    var imgs = box.querySelectorAll(".j-ph img"), dots = box.querySelectorAll(".j-dots i"), k = 0; if (imgs.length < 2) return;
    function show(n) { k = n; imgs.forEach(function (m, j) { m.classList.toggle("on", j === n); }); dots.forEach(function (d, j) { d.classList.toggle("on", j === n); }); }
    dots.forEach(function (d, j) { d.onclick = function () { show(j); }; });
    if (!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) setInterval(function () { show((k + 1) % imgs.length); }, 4000);
  });
  /* нижняя панель покупки */
  var pr = $("jprod"), bar = $("jbar");
  if (pr && bar && window.IntersectionObserver) new IntersectionObserver(function (es) { es.forEach(function (x) { bar.classList.toggle("on", !x.isIntersecting && x.boundingClientRect.top < 0); }); }, { threshold: 0 }).observe(pr);
  /* подарок → /api/lead (та же форма, что у корзины сайта; без cart — тема «Подарок: …») */
  var gm = $("jgm"), gsku = "";
  function gOpen(id) { gsku = id; var c = store("gs_contact") || {}, f = $("jgf"); if (c.name && !f.name.value) f.name.value = c.name; if (c.contact && !f.contact.value) f.contact.value = c.contact; $("jge").textContent = ""; gm.hidden = false; document.documentElement.classList.add("noscroll"); setTimeout(function () { f.name.focus(); }, 30); }
  function gClose() { gm.hidden = true; document.documentElement.classList.remove("noscroll"); }
  document.addEventListener("click", function (e) { var g = e.target.closest ? e.target.closest("[data-gift]") : null; if (g) { gOpen(g.getAttribute("data-gift")); return; } if (e.target.closest && e.target.closest("[data-gx]")) gClose(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !gm.hidden) gClose(); });
  $("jgf").addEventListener("submit", function (e) {
    e.preventDefault(); var f = e.target, name = f.name.value.trim(), contact = f.contact.value.trim(), btn = $("jgs");
    if (!name || !contact) { $("jge").textContent = D.t.gNeed; return; }
    var p = P[gsku] || D.prods[0], c = cur();
    try { localStorage.setItem("gs_contact", JSON.stringify({ name: name, contact: contact, method: f.method.value, country: "" })); } catch (x) {}
    btn.disabled = true; btn.textContent = D.t.gSend; $("jge").textContent = "";
    var cm = "Подарок: " + p.id + " — " + p.name + " · " + fmt(p.p[c], c) + " · " + D.url + (f.comment.value.trim() ? "\n" + f.comment.value.trim() : "");
    fetch("/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name, contact: contact, method: f.method.value, country: "", comment: cm, currency: c, interest: "Подарок: " + p.name, page: location.href, lang: navigator.language || "" }) })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) { if (!d.ok) throw 0; f.reset(); gClose(); toast(D.t.gOk); })
      .catch(function () { $("jge").textContent = D.t.gErr; }).then(function () { btn.disabled = false; btn.textContent = D.t.gS; });
  });
  /* ваш камень по дате: данные берутся из календаря сайта (/assets/script.js через /api/journal/cal) */
  var cal = null, bd = $("jbd");
  function load() { if (cal) return Promise.resolve(cal); return fetch("/api/journal/cal?l=" + LANG).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) { if (!d.ok) throw 0; cal = d; return d; }); }
  bd.addEventListener("focus", function () { load().catch(function () {}); });
  bd.addEventListener("input", function (e) { var x = e.target.value.replace(/\D/g, "").slice(0, 8); if (x.length > 4) x = x.slice(0, 2) + "." + x.slice(2, 4) + "." + x.slice(4); else if (x.length > 2) x = x.slice(0, 2) + "." + x.slice(2); e.target.value = x; });
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  $("jdf").addEventListener("submit", function (e) {
    e.preventDefault(); var m = /^(\d{1,2})\D+(\d{1,2})(?:\D+\d{4})?$/.exec(bd.value.trim());
    if (!m) { toast(D.t.dBad); return; } var d = +m[1], mo = +m[2];
    load().then(function (C) {
      if (mo < 1 || mo > 12 || d < 1 || d > C.cal[mo - 1].length) { toast(D.t.dChk); return; }
      var ch = C.cal[mo - 1].charAt(d - 1), si = ch === ch.toUpperCase() ? ch.charCodeAt(0) - 65 : ch.charCodeAt(0) - 97 + 26, st = C.st[si];
      var sg = D.signs.filter(function (s) { return mo < s[2] || (mo === s[2] && d <= s[3]); })[0] || D.signs[0];
      var mine = D.sign && sg[1] === D.sign, mp = D.prods[0];
      var html = '<div class="j-mono">' + esc(D.t.dStone) + " · " + d + "." + ("0" + mo).slice(-2) + '</div><div class="big">' + esc(st[0]) + '</div><div class="acc">' + esc(st[1]) + '</div><p style="margin:10px 0 18px">' + esc(C.sd[si] || "") + "</p>";
      if (mine && mp) html += "<p><b>" + esc(D.t.dYou) + " " + esc(sg[0]) + ".</b> " + esc(D.t.dMine) + '</p><button type="button" class="j-btn" data-add="' + esc(mp.id) + '" style="margin-top:14px">' + esc(mp.name) + " — " + esc(D.t.cart) + "</button>";
      else html += "<p>" + esc(D.t.dSign) + " <b>" + esc(sg[0]) + "</b>. " + esc(D.t.dHas) + "</p>" + (D.caps[sg[4]] ? '<a class="j-btn gh" style="margin-top:14px;display:inline-flex" href="' + (LANG === "ru" ? "" : "/" + LANG) + "/p/" + D.caps[sg[4]] + '/">' + esc(D.t.dCap) + " «" + esc(sg[0]) + "» →</a>" : "");
      $("jres").innerHTML = html; renderPrices();
    }).catch(function () { toast(D.t.dErr); });
  });
}

/* ═════════════ клиент: хаб (автоплей героя без звука + субтитры) ═════════════ */
function hubClient() {
  var D = JSON.parse(document.getElementById("jd").textContent), v = document.getElementById("jhvid"), cap = document.getElementById("jcap"), SEG = D.segs || [];
  function store(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-jc]") : null; if (!b) return; var c = b.getAttribute("data-jc"), h = document.querySelector('.cursw button[data-cur="' + c + '"]');
    if (h) h.click(); else { try { localStorage.setItem("gs_cur", JSON.stringify(c)); } catch (x) {} }
    document.querySelectorAll("[data-jc]").forEach(function (x) { x.classList.toggle("on", x === b); });
  });
  if (!v) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches, save = navigator.connection && navigator.connection.saveData;
  v.addEventListener("timeupdate", function () { var t = v.currentTime, i = -1; for (var k = 0; k < SEG.length; k++) if (t >= SEG[k][0] && t < SEG[k][1]) { i = k; break; } cap.textContent = i >= 0 ? SEG[i][2] : ""; });
  if (reduce || save || !window.IntersectionObserver) return;
  new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); }); }, { threshold: 0.35 }).observe(v);
}

/* ═════════════ CSS (из утверждённого прототипа, изолирован классом .jn / префиксом j-) ═════════════ */
const CSS = `
.jn{--paper:#ece8e1;--paper2:#f3f0ea;--dim:#b9b4ab;--obs:#13161a;--obsd:#0a0c0e;--obss:#1c2126;--lab:#385a6b;--fl:#7fc3d6;--ink:#13161a;--ink2:#3d4145;--mute:#8c8880;--ln:rgba(236,232,225,.12);--lnd:rgba(19,22,26,.12);
font:300 17px/1.6 'Public Sans',system-ui,sans-serif;color:var(--paper);background:var(--obsd);overflow-x:clip;padding-top:3.4rem;min-height:70vh}
.jn *{box-sizing:border-box;margin:0;padding:0;min-width:0}
:where(.jn) a{color:inherit}.jn img,.jn video{max-width:100%}
.jn button,.jn input,.jn select,.jn textarea{font:inherit;color:inherit}
html.noscroll .jn{overflow:hidden}
.j-mono{font:500 11px/1.4 'IBM Plex Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
.j-paper .j-mono{color:var(--mute)}
.j-wrap{max-width:1180px;margin:0 auto;padding:0 max(4vw,16px)}
.j-wl,.j-wc{display:none!important}.j-world{background:var(--lab);color:#fff;text-align:center;font-size:13.5px;padding:8px 12px;display:flex;flex-wrap:wrap;gap:6px 10px;justify-content:center;align-items:center}
.j-wl,.j-wc{display:inline-flex;border:1px solid rgba(255,255,255,.35)}
.j-wl a,.j-wc button{font:500 12px 'IBM Plex Mono',monospace;color:rgba(255,255,255,.75);padding:6px 9px;text-decoration:none;background:none;border:0;cursor:pointer;min-height:30px}
.j-wl a.on,.j-wc button.on{background:#fff;color:var(--lab)}
.j-hero{background:radial-gradient(900px 500px at 15% 0%,rgba(56,90,107,.45),transparent 60%),var(--obsd)}
.j-hw{display:grid;grid-template-columns:minmax(0,420px) minmax(0,1fr);gap:clamp(24px,5vw,72px);padding-top:clamp(24px,4vw,56px);padding-bottom:clamp(32px,5vw,72px);align-items:start}
@media(max-width:860px){.j-hw{grid-template-columns:minmax(0,1fr)}}
.j-vid{position:relative;display:block;aspect-ratio:9/16;background:#000;border:1px solid var(--ln);overflow:hidden;max-height:82vh;justify-self:center;width:100%}
.j-vid video{width:100%;height:100%;object-fit:cover;display:block}
.j-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,transparent 55%,rgba(10,12,14,.6));border:0;cursor:pointer;color:var(--paper)}
.j-play span{width:76px;height:76px;border-radius:50%;background:rgba(236,232,225,.92);display:flex;align-items:center;justify-content:center}
.j-play svg{width:26px;height:26px;fill:var(--obs);margin-left:4px}
.j-vid.playing .j-play{display:none}
.j-cap{position:absolute;left:12px;right:12px;bottom:18px;text-align:center;font:400 17px/1.35 'Public Sans',sans-serif;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.85),0 0 8px rgba(0,0,0,.6);pointer-events:none;transition:opacity .2s}
.j-cap:empty{opacity:0}
.j-prog{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(255,255,255,.15)}.j-prog i{display:block;height:100%;width:0;background:var(--fl)}
.j-dur{position:absolute;left:8px;top:8px;font:500 11px 'IBM Plex Mono',monospace;background:rgba(10,12,14,.72);backdrop-filter:blur(6px);padding:4px 7px;color:var(--paper);letter-spacing:.05em}
.j-dur--b{top:auto;bottom:12px;left:12px}
.j-bc{font:500 11px 'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);display:flex;flex-wrap:wrap;gap:6px 8px;margin-bottom:14px}.j-bc a{text-decoration:none;border-bottom:1px solid rgba(236,232,225,.2)}.j-bc a:hover{color:var(--paper)}
.j-h1{font:300 clamp(34px,4.6vw,54px)/1.05 'Newsreader',Georgia,serif;text-wrap:balance;margin:12px 0 14px;color:var(--paper)}
.j-hh{font:300 clamp(24px,2.6vw,32px)/1.15 'Newsreader',Georgia,serif;margin:8px 0 16px}.j-hh a{text-decoration:none}
.j-ans{font-size:17px;color:var(--dim);max-width:640px;margin:0 0 6px}
.j-by{display:flex;align-items:center;gap:12px;color:var(--dim);font-size:14px;margin:10px 0 14px}
.j-av{width:40px;height:40px;border-radius:50%;background:center 28%/220% no-repeat;border:1px solid var(--ln);flex:none}
.j-stats{display:flex;flex-wrap:wrap;margin:20px 0;border-top:1px solid var(--ln);border-bottom:1px solid var(--ln)}
.j-stats div{flex:1 1 96px;padding:14px 12px 14px 0}.j-stats b{display:block;font:300 30px/1 'Newsreader',Georgia,serif;color:var(--paper)}.j-stats span{font-size:12.5px;color:var(--mute)}@media(max-width:520px){.j-stats b{font-size:24px}.j-wt{display:none}}
.j-prod{display:grid;grid-template-columns:140px minmax(0,1fr);gap:18px;background:var(--obss);border:1px solid var(--ln);padding:16px;margin-bottom:12px}
@media(max-width:440px){.j-prod{grid-template-columns:96px minmax(0,1fr)}}
.j-ph{position:relative;aspect-ratio:1;background:#0d1012;overflow:hidden}.j-ph img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0;opacity:0;transition:opacity .4s}.j-ph img.on{opacity:1}
.j-dots{display:flex;gap:6px;margin-top:8px;justify-content:center}.j-dots i{width:6px;height:6px;border-radius:50%;background:var(--ln);cursor:pointer;display:block}.j-dots i.on{background:var(--fl)}
.j-prod h2{font:400 24px/1.15 'Newsreader',Georgia,serif;margin-top:2px}.j-prod h2 a{text-decoration:none}
.j-chips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
.j-chip{font-size:13px;border:1px solid var(--ln);padding:4px 9px;color:var(--dim);display:inline-flex;align-items:center;gap:6px;background:none;cursor:pointer}.j-chip i{width:9px;height:9px;border-radius:50%;display:block}
.j-price{font:300 34px/1.1 'Newsreader',Georgia,serif;margin:6px 0 2px}
.j-sub{font-size:13px;color:var(--mute)}
.j-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
.jn .j-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 16px;font:500 15px 'Public Sans',sans-serif;border:1px solid var(--fl);background:var(--fl);color:var(--obsd);cursor:pointer;text-decoration:none;text-align:center}
.jn .j-btn.gh{background:transparent;color:var(--paper);border-color:var(--ln)}.j-btn.full{grid-column:1/-1}.jn .j-btn.done{background:transparent;color:var(--fl)}.j-btn[disabled]{opacity:.6}
.jn :focus-visible{outline:2px solid var(--fl);outline-offset:2px}
.j-deliv{font-size:13px;color:var(--mute);margin-top:12px}
.j-paper{background:var(--paper2);color:var(--ink)}.j-dark{background:var(--obs);color:var(--paper)}
.j-sec{padding:clamp(40px,6vw,88px) 0;position:relative}
.j-t{font:300 clamp(30px,3.6vw,44px)/1.08 'Newsreader',Georgia,serif;text-wrap:balance;margin:8px 0 22px;max-width:760px}
.j-tr{columns:2 340px;column-gap:48px}
.j-tr p{break-inside:avoid;padding:8px 0 8px 64px;position:relative;cursor:pointer;color:var(--ink2);transition:color .2s;border-radius:2px}
.j-tr p:hover{color:var(--ink)}.j-tr p em{position:absolute;left:0;top:11px;font:500 12px 'IBM Plex Mono',monospace;font-style:normal;color:var(--mute)}
.j-tr p.on{color:var(--ink);background:linear-gradient(90deg,rgba(127,195,214,.22),transparent)}.j-tr p.on em{color:var(--lab)}
.j-tr mark{background:none;color:var(--lab);font-weight:500}
.j-stones{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:var(--lnd);border:1px solid var(--lnd)}
@media(max-width:900px){.j-stones{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.j-stones{grid-template-columns:minmax(0,1fr)}}
.j-st{background:var(--paper2);padding:22px 20px 20px;display:flex;flex-direction:column;gap:10px}.j-st svg{width:56px;height:56px}.j-st h3{font:400 24px/1.1 'Newsreader',Georgia,serif}.j-st p{font-size:15px;color:var(--ink2);flex:1}
.j-st button{align-self:flex-start;background:none;border:1px solid var(--lnd);font:500 12px 'IBM Plex Mono',monospace;padding:9px 12px;cursor:pointer;color:var(--ink);min-height:40px}.j-st button:hover{border-color:var(--ink)}
.j-date{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(24px,5vw,64px);align-items:center}@media(max-width:820px){.j-date{grid-template-columns:minmax(0,1fr)}}
.j-date form{display:flex;gap:8px;margin-top:18px;max-width:440px}
.j-date input{flex:1;background:var(--obsd);border:1px solid var(--ln);color:var(--paper);font:400 18px 'Public Sans',sans-serif;padding:0 16px;min-height:52px}
.j-res{border:1px solid var(--ln);padding:24px;min-height:250px;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(160deg,rgba(56,90,107,.25),transparent)}
.j-res .big{font:300 46px/1 'Newsreader',Georgia,serif;margin:8px 0}.j-res .acc{color:var(--fl)}.j-res p{color:var(--dim);font-size:15.5px}.j-res b{color:var(--paper)}.j-empty{color:var(--mute);text-align:center}
.j-faq{max-width:820px}.j-faq details{border-top:1px solid var(--lnd);padding:4px 0}.j-faq details:last-child{border-bottom:1px solid var(--lnd)}
.j-faq summary{list-style:none;cursor:pointer;font:400 21px/1.3 'Newsreader',Georgia,serif;padding:16px 40px 16px 0;position:relative}.j-faq summary::-webkit-details-marker{display:none}
.j-faq summary:after{content:"+";position:absolute;right:4px;top:12px;font:300 28px 'Public Sans';color:var(--mute);transition:transform .2s}.j-faq details[open] summary:after{transform:rotate(45deg)}
.j-faq details p{padding:0 0 18px;color:var(--ink2);max-width:680px}
.j-more,.j-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
@media(max-width:440px){.jn .j-btn{padding:0 8px;font-size:14px}}
@media(max-width:820px){.j-more,.j-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
.j-sec .j-grid:not(.j-grid--p){display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:14px;padding-bottom:10px;scrollbar-width:thin}.j-sec .j-grid:not(.j-grid--p)>.j-card{flex:0 0 clamp(150px,19vw,230px);scroll-snap-align:start}.j-sec{padding-top:clamp(28px,4vw,56px)!important;padding-bottom:clamp(28px,4vw,56px)!important}
.j-card{text-decoration:none;display:block}.j-cp{position:relative;aspect-ratio:9/14;background:#000;border:1px solid var(--ln);overflow:hidden}.j-cp img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s}.j-card:hover .j-cp img{transform:scale(1.03)}
.j-card h3{font:400 18px/1.2 'Newsreader',Georgia,serif;margin-top:10px}.j-cv{font-size:13px;color:var(--mute)}
.j-paper .j-cp{border-color:var(--lnd)}.j-tchips{display:flex;flex-wrap:wrap;gap:8px;margin-top:34px}.j-tchips a{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--ln);padding:9px 14px;font:500 12px 'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;min-height:40px}.j-tchips a:hover{border-color:var(--fl);color:var(--fl)}.j-tchips i{font-style:normal;color:var(--mute)}
.jn .j-lnk{color:var(--fl);font:500 13px 'IBM Plex Mono',monospace;letter-spacing:.06em;text-decoration:none;border-bottom:1px solid currentColor}
.j-bar{position:fixed;left:0;right:0;bottom:0;z-index:60;background:rgba(10,12,14,.95);backdrop-filter:blur(10px);border-top:1px solid var(--ln);transform:translateY(100%);transition:transform .3s}.j-bar.on{transform:none}
.j-bar .j-wrap{display:flex;align-items:center;gap:12px;height:72px}.j-bar img{width:48px;height:48px;object-fit:cover}
.j-bn{flex:1;font-size:14px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.j-bn b{display:block;font:300 22px 'Newsreader',Georgia,serif}.j-bar .j-btn{min-height:46px}
.j-toast{position:fixed;left:50%;bottom:92px;transform:translate(-50%,16px);background:var(--paper);color:var(--ink);padding:12px 18px;font-size:14px;opacity:0;transition:.3s;z-index:140;max-width:92vw;text-align:center;pointer-events:none}.j-toast.on{opacity:1;transform:translate(-50%,0)}
.j-modal{position:fixed;inset:0;z-index:150;display:flex;align-items:center;justify-content:center;padding:16px}.j-modal[hidden]{display:none}
.j-mbg{position:absolute;inset:0;background:rgba(5,6,8,.78)}.j-mp{position:relative;background:var(--obs);border:1px solid var(--ln);padding:28px 24px 24px;width:min(460px,100%);max-height:92vh;overflow:auto;display:flex;flex-direction:column;gap:12px}
.j-mp h3{font:300 28px/1.1 'Newsreader',Georgia,serif}.j-mt{color:var(--dim);font-size:14.5px}.j-mp label span{display:block;font:500 11px 'IBM Plex Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);margin-bottom:5px}
.j-mp input,.j-mp select,.j-mp textarea{width:100%;background:var(--obsd);border:1px solid var(--ln);padding:12px 14px;min-height:48px;font-size:16px}.j-mp textarea{min-height:70px;resize:vertical}
.j-mx{position:absolute;right:10px;top:6px;background:none;border:0;font-size:30px;cursor:pointer;color:var(--mute);width:44px;height:44px}.j-err{color:#f0a08a;font-size:14px;min-height:1.2em}
@media(prefers-reduced-motion:reduce){.jn *{transition:none!important;animation:none!important}}
`;
