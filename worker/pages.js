// Страницы изделий и sitemap, собираемые на лету из живого каталога (Google-таблица «ГС товары»).
// Порт seo/pages/gen.py. Любая ошибка → отдаём статическую страницу из ASSETS (запасной вариант).
const BUILD = "20261123190000"; // v46: быстрая заявка и корзина на странице изделия
export const BASE = "https://gemstone.md";
export const LANGS = ["ru", "ro", "en"];
const LI = { ru: 0, ro: 1, en: 2 };
export const PFX = { ru: "", ro: "/ro", en: "/en" };
const QUO = { ru: ["«", "»"], ro: ["„", "”"], en: ["“", "”"] };
const FIX = [[/Внутненн/g, "Внутренн"], [/балланс/g, "баланс"], [/Аппатит/g, "Апатит"], [/аппатит/g, "апатит"]];
const GCAT = { "Браслеты": "Apparel & Accessories > Jewelry > Bracelets", "Чокеры": "Apparel & Accessories > Jewelry > Necklaces", "Колье": "Apparel & Accessories > Jewelry > Necklaces", "Кольца": "Apparel & Accessories > Jewelry > Rings", "Серьги": "Apparel & Accessories > Jewelry > Earrings" };
export const KIND = {
  ru: { Браслеты: "Браслет", Чокеры: "Чокер", Кольца: "Кольцо", Колье: "Колье", Серьги: "Серьги", Другое: "Камни и сувениры" },
  ro: { Браслеты: "Brățară", Чокеры: "Choker", Кольца: "Inel", Колье: "Colier", Серьги: "Cercei", Другое: "Pietre și suveniruri" },
  en: { Браслеты: "Bracelet", Чокеры: "Choker", Кольца: "Ring", Колье: "Necklace", Серьги: "Earrings", Другое: "Stones & gifts" },
};
const CATP = {
  ru: { Браслеты: "Браслеты", Чокеры: "Чокеры", Кольца: "Кольца", Колье: "Колье", Серьги: "Серьги", Другое: "Камни и сувениры" },
  ro: { Браслеты: "Brățări", Чокеры: "Choker-e", Кольца: "Inele", Колье: "Coliere", Серьги: "Cercei", Другое: "Pietre și suveniruri" },
  en: { Браслеты: "Bracelets", Чокеры: "Chokers", Кольца: "Rings", Колье: "Necklaces", Серьги: "Earrings", Другое: "Stones & gifts" },
};
const T = {
  ru: { lang: "ru", loc: "ru_RU", home: "Главная", cat: "Каталог", buy: "Выбрать в каталоге", cart: "В корзину", inCart: "В корзине ✓", lead: "Оставить заявку", ask: "Спросить в Instagram", stone: "О камне", comp: "Состав", more: "Другие изделия", cur: "лей",
    note: "Цена без доставки. Доставка по Молдове — 100 лей, бесплатно от {F}. Изготовление — до 3 дней, доставка по Молдове — 1–3 дня.", rt: "Условия возврата", how: "Выберите изделие в каталоге и оформите заказ — менеджер свяжется с вами, чтобы уточнить наличие и доставку.",
    ph: "Фото минерала", t: (n, k) => `${n} — ${k.toLowerCase()} · Gemstone.md`,
    d: (n, k, p) => `${n}: ${k.toLowerCase()} из натуральных камней, цена ${p}. Gemstone.md — доставка по всему миру.`,
    when: "Когда носить:", alt: (n, k) => `${n} — ${k.toLowerCase()} из натуральных камней`, mm: "мм" },
  ro: { lang: "ro", loc: "ro_RO", home: "Acasă", cat: "Catalog", buy: "Alege în catalog", cart: "În coș", inCart: "În coș ✓", lead: "Trimite o cerere", ask: "Întreabă pe Instagram", stone: "Despre piatră", comp: "Compoziție", more: "Alte bijuterii", cur: "lei",
    note: "Prețul nu include livrarea. Livrare în Moldova — 100 lei, gratuită de la {F}. Confecționare — până la 3 zile, livrare în Moldova — 1–3 zile.", rt: "Condiții de returnare", how: "Alegeți bijuteria în catalog și plasați comanda — managerul vă va contacta pentru a confirma disponibilitatea și livrarea.",
    ph: "Fotografie a mineralului", t: (n, k) => `${n} — ${k.toLowerCase()} din pietre naturale · Gemstone.md`,
    d: (n, k, p) => `${n}: ${k.toLowerCase()} din pietre naturale, preț ${p}. Gemstone.md — livrare în toată lumea.`,
    when: "Când se poartă:", alt: (n, k) => `${n} — ${k.toLowerCase()} din pietre naturale`, mm: "mm" },
  en: { lang: "en", loc: "en_GB", home: "Home", cat: "Catalogue", buy: "Choose in the catalogue", cart: "Add to cart", inCart: "In cart ✓", lead: "Send a request", ask: "Ask on Instagram", stone: "About the stone", comp: "Composition", more: "More pieces", cur: "MDL",
    note: "Price excludes delivery. Delivery in Moldova — 100 MDL, free from {F}. Preparation takes up to 3 days, delivery in Moldova 1–3 days.", rt: "Return policy", how: "Choose the piece in the catalogue and place your order — our manager will contact you to confirm availability and delivery.",
    ph: "Mineral photo", t: (n, k) => `${n} — natural stone ${k.toLowerCase()} · Gemstone.md`,
    d: (n, k, p) => `${n}: natural stone ${k.toLowerCase()}, price ${p}. Gemstone.md — worldwide delivery.`,
    when: "When to wear it:", alt: (n, k) => `${n} — natural stone ${k.toLowerCase()}`, mm: "mm" },
};

export const E = (s, q = true) => { s = String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); return q ? s.replace(/"/g, "&quot;").replace(/'/g, "&#x27;") : s; };
export const slug = (id) => id.replace(/[ВКСО]/g, (c) => ({ В: "B", К: "K", С: "C", О: "O" }[c]));
const nice = (n, l) => { const q = QUO[l]; n = n.split('""').join(""); n = n.replace(/"\s*([^"]+?)\s*"/g, q[0] + "$1" + q[1]); n = n.replace(/"\s*$/, ""); return n.replace(/\s+/g, " ").trim(); };
export const lname = (it, l) => {
  if (l === "ru") { let n = it.n; for (const [a, b] of FIX) n = n.replace(a, b); return nice(n, l); }
  return nice((it.t && it.t[l]) || it.n, l);
};
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
export const money = (n, l, cur) => { cur = cur || "MDL"; if (cur === "RUB") return grp(n) + " ₽"; return grp(n) + " " + (cur === "EUR" ? "€" : T[l].cur); };
const bold = (t) => E(t, false).replace(/\*([^*]+)\*/g, "<b>$1</b>");
export const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const catOf = (m, c) => m[c] || c;

/* ── данные из статических файлов (кэш в изоляте) ── */
let STATIC = null, STATIC_AT = 0, CHROME = {};
export async function asset(env, origin, path) {
  const r = await env.ASSETS.fetch(new Request(new URL(path, origin).toString()));
  if (!r.ok) throw new Error("asset " + path + " " + r.status);
  return r;
}
export async function loadStatic(env, origin) {
  if (STATIC && Date.now() - STATIC_AT < 600000) return STATIC;
  const [D, PH, ru, ro, en] = await Promise.all([
    asset(env, origin, "/assets/seo/dump.json").then((r) => r.json()),
    asset(env, origin, "/assets/photos.json").then((r) => r.json()),
    asset(env, origin, "/assets/caps/ru.json").then((r) => r.json()),
    asset(env, origin, "/assets/caps/ro.json").then((r) => r.json()),
    asset(env, origin, "/assets/caps/en.json").then((r) => r.json()),
  ]);
  const ph = {}; for (const i of PH.items) ph[i.id] = i;
  STATIC = { D, ph, caps: { ru: ru.items, ro: ro.items, en: en.items } }; STATIC_AT = Date.now(); CHROME = {};
  return STATIC;
}
export async function chromeParts(env, origin, l) {
  if (CHROME[l]) return CHROME[l];
  const s = await (await asset(env, origin, PFX[l] + "/shop/")).text();
  const top = s.match(/<div class="langsw-top">[\s\S]*?<\/div><\/div>/)[0];
  const foot = s.match(/<footer class="shop-foot">[\s\S]*?<\/footer>/)[0];
  return (CHROME[l] = { top, foot });
}

export function makeCtx(items, S) {
  const idx = new Map(items.map((x, n) => [x.id, n]));
  const pic = (i) => {
    if (S.ph[i.id]) { const p = S.ph[i.id]; return [p.f.map((f) => [`/assets/p/${p.d}/${f}-1200.webp`, `/assets/p/${p.d}/${f}-640.webp`]), "item"]; }
    const k = S.D.items[i.id];
    if (k && S.D.photos[k]) return [[[S.D.photos[k], S.D.photos[k]]], "min"];
    return [[], null];
  };
  const related = (i, n = 4) => {
    const k = S.D.items[i.id]; const out = [];
    const add = (x) => { if (x.id !== i.id && !out.some((o) => o.id === x.id) && out.length < n) out.push(x); };
    const pool = items.filter((x) => x.c === i.c);
    if (k) pool.filter((x) => S.D.items[x.id] === k && S.ph[x.id]).forEach(add);
    if (k) pool.filter((x) => S.D.items[x.id] === k).forEach(add);
    pool.filter((x) => S.ph[x.id]).forEach(add);
    const ix = idx.get(i.id); pool.filter((x) => Math.abs(idx.get(x.id) - ix) <= 6).forEach(add);
    return out;
  };
  return { pic, related };
}

// порог бесплатной доставки для текстов: «3 000 лей» (из каталога, запасное значение 3000)
export const freeTxt = (l, del, cur) => {
  cur = cur || "MDL";
  const lei = (del && del.freeFromLei > 0) ? del.freeFromLei : 3000;
  return cur === "MDL" ? money(lei, l) : money((del && del.freeFrom && del.freeFrom[cur]) || 0, l, cur);
};
function render(i, l, items, S, cx, ch, del) {
  const t = T[l], id = i.id, s = slug(id), name = lname(i, l), kind = catOf(KIND[l], i.c);
  const size = (i.s || "").split("мм").join(t.mm).trim();
  const url = `${BASE}${PFX[l]}/p/${s}/`;
  const k = S.caps[l][id], stone = S.D.items[id], dd = stone ? S.D.desc[stone] : null;
  const [srcs, pk] = cx.pic(i); const price = money(i.p.MDL, l);
  const lead = k ? k.l : "", desc = k ? k.d : "";
  const comp = k ? k.s.map((x) => x[0]) : [];
  const imgAbs = srcs.length ? BASE + srcs[0][0] : null;
  let mdesc = t.d(name, kind, price); if (lead) mdesc = `${lead} ${mdesc}`;
  mdesc = mdesc.length > 160 ? mdesc.slice(0, 157) + "…" : mdesc;
  const title = t.t(name, kind);
  let sname = null;
  if (stone) { const sn = S.D.names[stone]; sname = l === "ru" ? stone : (sn ? sn[LI[l] - 1] : stone); }
  const descrLd = (lead + " " + desc.replace(/\*/g, "")).trim() || (dd ? dd.t[LI[l]] : mdesc);
  const ld = { "@context": "https://schema.org", "@type": "Product", "@id": url + "#product", name, sku: id, ...(GCAT[i.c] ? { category: GCAT[i.c] } : {}), description: descrLd,
    brand: { "@type": "Brand", name: "Gemstone.md" }, offers: { "@type": "Offer", url, priceCurrency: "MDL", price: String(i.p.MDL), seller: { "@id": BASE + "/#store" }, availability: "https://schema.org/InStock",
      shippingDetails: { "@type": "OfferShippingDetails", shippingRate: { "@type": "MonetaryAmount", value: 100, currency: "MDL" }, shippingDestination: { "@type": "DefinedRegion", addressCountry: "MD" }, deliveryTime: { "@type": "ShippingDeliveryTime", handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 3, unitCode: "DAY" }, transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" } } },
      hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", applicableCountry: "MD", returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow", merchantReturnDays: 14, returnMethod: "https://schema.org/ReturnByMail", returnFees: "https://schema.org/ReturnShippingFees", returnShippingFeesAmount: { "@type": "MonetaryAmount", value: 100, currency: "MDL" }, refundType: "https://schema.org/FullRefund", merchantReturnLink: BASE + PFX[l] + "/returns/" } } };
  if (pk === "item") ld.image = srcs.map(([a]) => BASE + a); else if (srcs.length) ld.image = [BASE + srcs[0][0]]; else ld.image = [BASE + "/assets/og.jpg"];
  const bc = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Gemstone.md", item: BASE + PFX[l] + "/" },
    { "@type": "ListItem", position: 2, name: t.cat, item: BASE + PFX[l] + "/shop/" },
    { "@type": "ListItem", position: 3, name, item: url }] };
  let top = ch.top; const foot = ch.foot;
  for (const L of LANGS) top = top.split(`href="${PFX[L]}/shop/"`).join(`href="${PFX[L]}/p/${s}/"`);
  top = top.replace(/<a href="([^"]*)" class="on"/g, '<a href="$1"');
  top = top.replace(new RegExp('(<a href="' + reEsc(PFX[l] + "/p/" + s + "/") + '")'), '$1 class="on"');
  let phb;
  if (srcs.length) {
    const [a, b] = srcs[0];
    const dim = pk === "item" ? 1200 : 720;
    const main = `<img src="${a}" srcset="${b} 640w, ${a} 1200w" sizes="(max-width:860px) 100vw, 52vw" width="${dim}" height="${dim}" alt="${E(pk === "item" ? t.alt(name, kind) : (sname || name))}" fetchpriority="high">`;
    phb = `<figure class="pd__ph">${main}` + (pk === "min" ? `<figcaption>${E(t.ph)}</figcaption>` : "") + "</figure>";
    const extra = pk === "item" ? srcs.slice(1).map(([a2, b2], n) => `<img src="${a2}" srcset="${b2} 640w, ${a2} 1200w" sizes="(max-width:860px) 50vw, 26vw" width="1200" height="1200" alt="${E(t.alt(name, kind))} — ${n + 2}" loading="lazy">`).join("") : "";
    if (extra) phb = phb.replace("</figure>", "") + `<div class="pd__more">${extra}</div></figure>`;
  } else phb = `<div class="pd__ph pd__ph--empty" role="img" aria-label="${E(kind)}"><span>${E(kind)}</span></div>`;
  const chips = comp.map((x) => `<li>${E(x)}</li>`).join("");
  let stoneblk = "";
  if (dd) stoneblk = `<section class="pd__stone"><h2 class="pd__h">${E(t.stone)}${sname ? ": " + E(sname) : ""}</h2><p class="pd__lead2">${E(dd.p[LI[l]])}</p><p class="pd__d">${E(dd.t[LI[l]])}</p><p class="pd__when">${E(t.when)} ${E(dd.w[LI[l]])}</p></section>`;
  const rel = cx.related(i); let relblk = "";
  if (rel.length) {
    let cards = "";
    for (const x of rel) {
      const xs = slug(x.id); let [sr, _pk] = cx.pic(x); if (_pk !== "item") sr = [];
      const thumb = sr.length ? `<img src="${sr[0][1]}" width="320" height="320" alt="" loading="lazy">` : `<span class="pd__rt">${E(catOf(KIND[l], x.c))}</span>`;
      cards += `<li><a href="${PFX[l]}/p/${xs}/">${thumb}<span class="pd__rn">${E(lname(x, l))}</span><span class="pd__rp">${money(x.p.MDL, l)}</span></a></li>`;
    }
    relblk = `<section class="pd__rel"><h2 class="pd__h">${E(t.more)}</h2><ul>${cards}</ul></section>`;
  }
  const alts = LANGS.map((L) => `<link rel="alternate" hreflang="${L}" href="${BASE}${PFX[L]}/p/${s}/">`).join("") + `<link rel="alternate" hreflang="x-default" href="${BASE}/p/${s}/">`;
  const ogImg = imgAbs ? `<meta property="og:image" content="${imgAbs}">` : `<meta property="og:image" content="${BASE}/assets/og.jpg">`;
  const oloc = LANGS.filter((L) => L !== l).map((L) => `<meta property="og:locale:alternate" content="${T[L].loc}">`).join("");
  return `<!DOCTYPE html>
<html lang="${l}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${E(title)}</title>
<meta name="description" content="${E(mdesc)}">
<link rel="canonical" href="${url}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;1,6..72,300;1,6..72,400&family=Public+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
${alts}
<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/styles.css">
<link rel="stylesheet" href="/assets/pd.css">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Gemstone.md">
<meta property="og:title" content="${E(title)}">
<meta property="og:description" content="${E(mdesc)}">
<meta property="og:url" content="${url}">
${ogImg}
<meta property="og:locale" content="${t.loc}">${oloc}
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script type="application/ld+json">${JSON.stringify(bc)}</script>
<meta name="msvalidate.01" content="F5F4988AB66745E8582839EDBF27A096">
<meta name="yandex-verification" content="8cf88ddeeba5f69c">
<meta name="google-site-verification" content="yEEkVI5008o9FIY8TOy2XqPGxiluU67EckeJp0zb3LM">
</head>
<body class="no-bar" data-lead-sku="${E(id)}" data-lead-name="${E(name)}" data-lead-ru="${E(lname(i, "ru"))}">
${top}
<main class="pd">
<nav class="pd__bc" aria-label="${E(t.cat)}"><a href="${PFX[l]}/">${E(t.home)}</a><span aria-hidden="true">/</span><a href="${PFX[l]}/shop/">${E(t.cat)}</a><span aria-hidden="true">/</span><a href="${PFX[l]}/shop/?c=${E(i.c)}">${E(catOf(CATP[l], i.c))}</a></nav>
<article class="pd__in">
${phb}
<div class="pd__b">
<p class="pd__m">${E(kind)} · ${E(id)}${size ? " · " + E(size) : ""}</p>
<h1 class="pd__n">${E(name)}</h1>
<p class="pd__pr"><strong>${price}</strong><span>≈ ${money(i.p.EUR, l, "EUR")} · ${money(i.p.RUB, l, "RUB")}</span></p>
<p class="pd__note">${E(t.note.replace("{F}", freeTxt(l, del)))} <a href="${PFX[l]}/returns/" style="white-space:nowrap">${E(t.rt)}</a></p>
${lead ? `<p class="pd__lead">${E(lead)}</p>` : ""}
${chips ? `<h2 class="pd__h">${E(t.comp)}</h2><ul class="pd__st">${chips}</ul>` : ""}
${desc ? `<p class="pd__d">${bold(desc)}</p>` : ""}
<p class="pd__how">${E(t.how)}</p>
<div class="pd__acts2"><button type="button" class="pd__buy gsx-add" data-add="${E(id)}">${E(t.cart)}</button><button type="button" class="pd__buy pd__buy--o" data-lead-open="1">${E(t.lead)}</button></div>
<p class="pd__lk"><a class="pd__ask" href="${PFX[l]}/shop/?id=${E(id)}">${E(t.buy)} →</a><a class="pd__ask" href="https://instagram.com/gemstone.md" target="_blank" rel="noopener">${E(t.ask)} →</a></p>
${stoneblk}
</div>
</article>
${relblk}
</main>
${foot}
<script src="/assets/minerals.js" defer></script>
<script src="/assets/shop.js" defer></script>
<script src="/assets/lead.js" defer></script>
<script src="/assets/an.js" defer></script>
</body>
</html>`;
}

/* ── обработчики ── */
export const HDR = (type) => ({ "content-type": type, "cache-control": "public, max-age=600, s-maxage=3600", "x-robots-tag": "all" });
export const notFound = (env, origin) => env.ASSETS.fetch(new Request(new URL("/__not_found__", origin).toString()));

export async function cached(request, ctx, key, build) {
  const cache = caches.default, ck = new Request(key);
  const hit = await cache.match(ck);
  if (hit) return hit;
  const resp = await build();
  if (resp.status === 200) ctx.waitUntil(cache.put(ck, resp.clone()));
  return resp;
}

export async function handlePage(request, env, ctx, getCatalog) {
  const url = new URL(request.url);
  const m = url.pathname.match(/^(\/ro|\/en)?\/p\/([^/]+)\/?$/);
  if (!m || (request.method !== "GET" && request.method !== "HEAD")) return env.ASSETS.fetch(request);
  try {
    if (!url.pathname.endsWith("/")) return Response.redirect(url.origin + url.pathname + "/" + url.search, 301);
    const l = m[1] ? m[1].slice(1) : "ru", sl = decodeURIComponent(m[2]);
    const cat = await getCatalog(env, ctx);
    const items = cat.items;
    const item = items.find((x) => slug(x.id) === sl);
    if (!item) return notFound(env, url.origin);
    const key = `${url.origin}${url.pathname}?_b=${BUILD}&_c=${cat.v}`;
    return await cached(request, ctx, key, async () => {
      const S = await loadStatic(env, url.origin), ch = await chromeParts(env, url.origin, l);
      const html = render(item, l, items, S, makeCtx(items, S), ch, cat.delivery);
      return new Response(html, { status: 200, headers: HDR("text/html; charset=utf-8") });
    });
  } catch (e) {
    console.error("page fallback", String(e));
    return env.ASSETS.fetch(request);
  }
}

// extra (необязательно): { version(env) → строка для ключа кэша, entries(env) → готовые <url> журнала }
export async function handleSitemap(request, env, ctx, getCatalog, extra) {
  const url = new URL(request.url);
  try {
    const cat = await getCatalog(env, ctx);
    let jv = "";
    if (extra) { try { jv = await extra.version(env); } catch (e) { console.error("journal version", String(e)); } }
    const key = `${url.origin}/sitemap.xml?_b=${BUILD}&_c=${cat.v}&_j=${encodeURIComponent(jv)}`;
    return await cached(request, ctx, key, async () => {
      let sm = await (await asset(env, url.origin, "/sitemap.xml")).text();
      sm = sm.replace(/\s*<!--PROD:START-->[\s\S]*?<!--PROD:END-->/, "");
      const lastmod = (cat.updated || "").slice(0, 10) || new Date().toISOString().slice(0, 10);
      const parts = ["<!--PROD:START-->"];
      for (const it of cat.items) {
        const s = slug(it.id);
        const alts = LANGS.map((L) => `<xhtml:link rel="alternate" hreflang="${L}" href="${BASE}${PFX[L]}/p/${s}/"/>`).join("") + `<xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/p/${s}/"/>`;
        for (const l of LANGS) parts.push(`<url><loc>${BASE}${PFX[l]}/p/${s}/</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority>${alts}</url>`);
      }
      parts.push("<!--PROD:END-->");
      // журнал: любая ошибка не ломает основной sitemap
      if (extra) { try { const je = await extra.entries(env); if (je) parts.push("<!--JOURNAL:START-->\n" + je + "\n<!--JOURNAL:END-->"); } catch (e) { console.error("journal sitemap", String(e)); } }
      sm = sm.replace(/\s*<!--JOURNAL:START-->[\s\S]*?<!--JOURNAL:END-->/, "").replace("</urlset>", parts.join("\n") + "\n</urlset>");
      return new Response(sm, { status: 200, headers: HDR("application/xml; charset=utf-8") });
    });
  } catch (e) {
    console.error("sitemap fallback", String(e));
    return env.ASSETS.fetch(request);
  }
}

// для проверки совпадения с gen.py
export const _test = { render, makeCtx, loadStatic, chromeParts };
