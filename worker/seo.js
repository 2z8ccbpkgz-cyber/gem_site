// seo.js — поисковые страницы gemstone.md (23.11.2026): камни, камень по дате рождения (366 дат), знаки зодиака + хабы и sitemap.
// Данные — из того же календаря «камень по дате», что на главной (/assets/script.js → calData), каталог — живой (цены/изделия),
// посты журнала — по знаку. Пути одинаковы для всех языков (/ro, /en — префиксы), чтобы работал переключатель языка.
import { E, PFX, BASE, LANGS, notFound, chromeParts } from "./pages.js";
import { calData, shell, FONTS, VERIFY } from "./journal.js";

const MON = {
  slug: ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  ruN: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
  ro: ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};
// [ru, ro, en, slug, месяц конца, день конца]
const ZOD = [["Козерог", "Capricorn", "Capricorn", "capricorn", 1, 19], ["Водолей", "Vărsător", "Aquarius", "aquarius", 2, 18], ["Рыбы", "Pești", "Pisces", "pisces", 3, 20],
  ["Овен", "Berbec", "Aries", "aries", 4, 19], ["Телец", "Taur", "Taurus", "taurus", 5, 20], ["Близнецы", "Gemeni", "Gemini", "gemini", 6, 20], ["Рак", "Rac", "Cancer", "cancer", 7, 22],
  ["Лев", "Leu", "Leo", "leo", 8, 22], ["Дева", "Fecioară", "Virgo", "virgo", 9, 22], ["Весы", "Balanță", "Libra", "libra", 10, 22], ["Скорпион", "Scorpion", "Scorpio", "scorpio", 11, 21],
  ["Стрелец", "Săgetător", "Sagittarius", "sagittarius", 12, 21], ["Козерог", "Capricorn", "Capricorn", "capricorn", 12, 31]];
const LI = { ru: 0, ro: 1, en: 2 };
const DIM = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const T = {
  ru: { stones: "Камни", stonesH: "Натуральные камни: свойства и значение", stonesD: "Свойства и значение натуральных камней: для чего носить, кому подходит по дате рождения и знаку зодиака.",
    bday: "Камень по дате рождения", bdayD: "Камень по дате рождения: найдите свой день и узнайте камень, который поддерживает именно Вас.",
    zod: "Камни по знаку зодиака", zodD: "Какие камни подходят каждому знаку зодиака — по реальным датам рождения, а не общим спискам.",
    stoneT: (n) => `${n}: свойства камня и кому подходит`, stoneD: (n, th) => `${n} — ${th.toLowerCase()}. Свойства камня, кому подходит по дате рождения и знаку, украшения GemStone.`,
    dayT: (d) => `Камень по дате рождения ${d}`, dayH: (d) => `Камень по дате рождения: ${d}`, dayD: (d, s) => `Ваш камень, если Вы родились ${d}, — ${s}. Значение, свойства и украшения с этим камнем.`,
    zodT: (z) => `Камни для знака ${z}: какие подходят по дате рождения`, zodD: (z) => `Камни для знака ${z}: подборка по датам рождения, значение каждого камня и капсула знака GemStone.`,
    theme: "Ключевая тема", when: "Когда особенно нужен", dates: "Даты рождения с этим камнем", signs: "Знаки зодиака", buy: "Украшения с этим камнем", calc: "Узнать свой камень по дате",
    cab: "Сохранить в кабинете", sign: "Знак зодиака", prev: "Предыдущий день", next: "Следующий день", topStones: "Камни знака — по датам рождения", days: (n) => `${n} дн.`,
    capsule: "Капсула знака", posts: "Видео журнала", range: "Даты знака", month: "Месяц", all: "Все камни", allDays: "Все даты", allSigns: "Все знаки",
    faq1: (d) => `Какой камень подходит родившимся ${d}?`, faq2: (s) => `Чем полезен камень ${s}?`, faq3: "Можно ли носить несколько камней?",
    faqA3: "Да. Основной камень по дате даёт главную опору, а камни знака и запроса дополняют его. Астролог GemStone поможет собрать сочетание под Вашу карту.", more: "Подробнее о камне" },
  ro: { stones: "Pietre", stonesH: "Pietre naturale: proprietăți și semnificație", stonesD: "Proprietățile și semnificația pietrelor naturale: pentru ce se poartă, cui se potrivesc după data nașterii și zodie.",
    bday: "Piatra după data nașterii", bdayD: "Piatra după data nașterii: găsiți ziua Dvs. și aflați piatra care vă susține.",
    zod: "Pietre după zodie", zodD: "Ce pietre se potrivesc fiecărei zodii — după datele reale de naștere.",
    stoneT: (n) => `${n}: proprietăți și cui se potrivește`, stoneD: (n, th) => `${n} — ${th.toLowerCase()}. Proprietăți, cui se potrivește după data nașterii și zodie, bijuterii GemStone.`,
    dayT: (d) => `Piatra pentru data nașterii ${d}`, dayH: (d) => `Piatra după data nașterii: ${d}`, dayD: (d, s) => `Dacă v-ați născut pe ${d}, piatra Dvs. este ${s}. Semnificație, proprietăți și bijuterii.`,
    zodT: (z) => `Pietre pentru zodia ${z}: care se potrivesc`, zodD: (z) => `Pietre pentru zodia ${z}: selecție după datele nașterii, semnificația fiecărei pietre și capsula zodiei.`,
    theme: "Tema cheie", when: "Când este nevoie", dates: "Date de naștere cu această piatră", signs: "Zodii", buy: "Bijuterii cu această piatră", calc: "Aflați piatra după dată",
    cab: "Salvați în cabinet", sign: "Zodia", prev: "Ziua precedentă", next: "Ziua următoare", topStones: "Pietrele zodiei — după datele nașterii", days: (n) => `${n} zile`,
    capsule: "Capsula zodiei", posts: "Video din jurnal", range: "Perioada", month: "Luna", all: "Toate pietrele", allDays: "Toate datele", allSigns: "Toate zodiile",
    faq1: (d) => `Ce piatră se potrivește celor născuți pe ${d}?`, faq2: (s) => `La ce ajută piatra ${s}?`, faq3: "Se pot purta mai multe pietre?",
    faqA3: "Da. Piatra principală după dată este sprijinul de bază, iar pietrele zodiei și ale intenției o completează. Astrologul GemStone vă ajută cu combinația potrivită.", more: "Despre piatră" },
  en: { stones: "Stones", stonesH: "Natural gemstones: meaning and properties", stonesD: "Meaning and properties of natural gemstones: why to wear them and who they suit by birth date and zodiac sign.",
    bday: "Birthstone by date of birth", bdayD: "Birthstone by exact date of birth: find your day and the stone that supports you.",
    zod: "Gemstones by zodiac sign", zodD: "Which gemstones suit each zodiac sign — based on real birth dates, not generic lists.",
    stoneT: (n) => `${n}: meaning, properties and who it suits`, stoneD: (n, th) => `${n} — ${th.toLowerCase()}. Meaning, properties, who it suits by birth date and zodiac sign, GemStone jewelry.`,
    dayT: (d) => `${d} birthstone: your stone by date of birth`, dayH: (d) => `Birthstone for ${d}`, dayD: (d, s) => `If you were born on ${d}, your stone is ${s}. Meaning, properties and jewelry with this stone.`,
    zodT: (z) => `${z} gemstones: which stones suit ${z}`, zodD: (z) => `${z} gemstones by birth date: the meaning of each stone and the GemStone ${z} capsule.`,
    theme: "Key theme", when: "When you need it most", dates: "Birth dates with this stone", signs: "Zodiac signs", buy: "Jewelry with this stone", calc: "Find your stone by date",
    cab: "Save to my account", sign: "Zodiac sign", prev: "Previous day", next: "Next day", topStones: "Stones of the sign — by birth date", days: (n) => `${n} days`,
    capsule: "Sign capsule", posts: "Journal videos", range: "Dates", month: "Month", all: "All stones", allDays: "All dates", allSigns: "All signs",
    faq1: (d) => `Which stone suits people born on ${d}?`, faq2: (s) => `What is ${s} good for?`, faq3: "Can I wear several stones?",
    faqA3: "Yes. Your main birth-date stone is the core support, and sign or intention stones complement it. A GemStone astrologer can help you build the right combination.", more: "About the stone" },
};

const slugOf = (en) => String(en).toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const dayLabel = (l, m, d) => (l === "en" ? `${MON.en[m - 1]} ${d}` : `${d} ${MON[l][m - 1]}`);
const daySlug = (m, d) => `${MON.slug[m - 1]}-${d}`;
const signOf = (m, d) => ZOD.find((z) => m < z[4] || (m === z[4] && d <= z[5]));
const jsonLd = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

async function model(env, origin) {
  const c = await calData(env, origin);
  const idx = (ch) => (ch === ch.toUpperCase() ? ch.charCodeAt(0) - 65 : ch.charCodeAt(0) - 97 + 26);
  const days = []; // {m,d,i}
  c.cal.forEach((row, mi) => { for (let d = 1; d <= row.length; d++) { const i = idx(row.charAt(d - 1)); if (c.st_ru[i]) days.push({ m: mi + 1, d, i }); } });
  const stones = c.st_ru.map((s, i) => ({ i, slug: slugOf(c.st_en[i][0]), ru: c.st_ru[i], ro: c.st_ro[i], en: c.st_en[i], d: { ru: c.sd_ru[i], ro: c.sd_ro[i], en: c.sd_en[i] } }));
  return { days, stones };
}
const CSS = `.sx{max-width:var(--wide,1240px);margin:0 auto;padding:110px var(--gut,1.5rem) 70px}.sx h1{font-family:var(--f-d,serif);font-weight:400;font-size:clamp(2rem,4vw,3.2rem);line-height:1.08;margin:.4rem 0 1rem}
.sx .mono{font-family:var(--f-m,monospace);font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;opacity:.7}.sx .lead{font-size:1.15rem;max-width:760px;line-height:1.55}
.sx h2{font-family:var(--f-d,serif);font-weight:400;font-size:1.6rem;margin:2.4rem 0 .9rem}.sx .card{border:1px solid rgba(236,232,225,.16);border-radius:14px;padding:18px 20px;margin-top:14px}
.sx .chips{display:flex;flex-wrap:wrap;gap:8px}.sx .chips a{border:1px solid rgba(236,232,225,.22);border-radius:999px;padding:6px 12px;text-decoration:none;color:inherit;font-size:.92rem}
.sx .chips a:hover{border-color:var(--flash,#7fc3d6)}.sx .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.sx .grid a{display:block;border:1px solid rgba(236,232,225,.16);border-radius:12px;padding:14px;text-decoration:none;color:inherit}
.sx .grid a b{display:block;font-weight:500}.sx .grid a small{opacity:.7}.sx .cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}.sx .btn{display:inline-block;padding:12px 18px;border-radius:10px;background:var(--paper,#ece8e1);color:var(--ink,#13161a);text-decoration:none;font-weight:600}
.sx .btn.g{background:none;color:inherit;border:1px solid currentColor}.sx .nav{display:flex;justify-content:space-between;gap:10px;margin-top:28px}.sx .nav a{color:inherit}.sx details{border-top:1px solid rgba(236,232,225,.14);padding:12px 0}.sx summary{cursor:pointer;font-weight:500}
.sx .crumb{font-size:.85rem;opacity:.75}.sx .crumb a{color:inherit}`;

function page(l, ch, path, title, desc, body, ld) {
  const sh = shell(ch, l, path);
  const alt = LANGS.map((L) => `<link rel="alternate" hreflang="${L}" href="${BASE}${PFX[L]}${path}">`).join("") + `<link rel="alternate" hreflang="x-default" href="${BASE}${path}">`;
  return `<!DOCTYPE html><html lang="${l}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${E(title)} · Gemstone.md</title><meta name="description" content="${E(desc)}"><link rel="canonical" href="${BASE}${PFX[l]}${path}">${alt}
<meta property="og:title" content="${E(title)}"><meta property="og:description" content="${E(desc)}"><meta property="og:url" content="${BASE}${PFX[l]}${path}"><meta property="og:type" content="article"><meta property="og:image" content="${BASE}/assets/hero_0291.webp">
${FONTS}<link rel="icon" href="/assets/favicon.ico" sizes="any"><link rel="stylesheet" href="/assets/styles.css"><style>${CSS}</style>${VERIFY}
<script type="application/ld+json">${jsonLd(ld)}</script></head><body>
${sh.top}<main class="sx">${body}</main>${sh.foot}
<script src="/assets/minerals.js" defer></script><script src="/assets/shop.js" defer></script><script src="/assets/lead.js" defer></script><script src="/assets/an.js" defer></script></body></html>`;
}
const crumbs = (l, items) => `<nav class="crumb" aria-label="breadcrumbs"><a href="${PFX[l] || "/"}">Gemstone.md</a>${items.map((x) => ` · ${x[1] ? `<a href="${PFX[l]}${x[1]}">${E(x[0])}</a>` : E(x[0])}`).join("")}</nav>`;
const crumbLd = (l, items) => ({ "@type": "BreadcrumbList", itemListElement: [["Gemstone.md", "/"]].concat(items).map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x[0], item: BASE + PFX[l] + (x[1] || "") })) });
const faqLd = (qa) => ({ "@type": "FAQPage", mainEntity: qa.map((x) => ({ "@type": "Question", name: x[0], acceptedAnswer: { "@type": "Answer", text: x[1] } })) });
const faqHtml = (qa) => qa.map((x) => `<details><summary>${E(x[0])}</summary><p>${E(x[1])}</p></details>`).join("");

function productsFor(cat, stoneRu) {
  const stem = String(stoneRu).toLowerCase().split(/\s+/)[0].slice(0, -1);
  if (stem.length < 3) return [];
  return (cat.items || []).filter((it) => String(it.n || "").toLowerCase().includes(stem)).slice(0, 8);
}
const pslug = (id) => String(id).replace(/[ВКСО]/g, (c) => ({ В: "B", К: "K", С: "C", О: "O" }[c]));
const prodGrid = (l, items) => items.length ? `<div class="grid">${items.map((it) => `<a href="${PFX[l]}/p/${E(pslug(it.id))}/"><b>${E(l === "ru" ? it.n : (it.t && it.t[l]) || it.n)}${it.s ? " · " + E(it.s) : ""}</b><small>${E(it.c || "")}</small></a>`).join("")}</div>` : "";
const ctas = (l, t, extra) => `<div class="cta"><a class="btn" href="${PFX[l] || "/"}#bd">${E(t.calc)}</a><a class="btn g" href="${PFX[l]}/kabinet/">${E(t.cab)}</a>${extra || ""}</div>`;

async function stonePage(l, ch, m, st, cat) {
  const t = T[l], s = st[l], path = `/stones/${st.slug}/`, name = s[0];
  const ds = m.days.filter((x) => x.i === st.i);
  const signs = [...new Set(ds.map((x) => signOf(x.m, x.d)[3]))].map((sl) => ZOD.find((z) => z[3] === sl));
  const prods = productsFor(cat, st.ru[0]);
  const qa = [[t.faq2(name), st.d[l]], [t.faq3, t.faqA3]];
  const items = [[t.stones, "/stones/"], [name]];
  const body = `${crumbs(l, items)}<p class="mono">${E(s[1])}</p><h1>${E(t.stoneT(name))}</h1><p class="lead">${E(st.d[l])}</p>
<div class="card"><p class="mono">${E(t.theme)}</p><p><b>${E(s[1])}</b></p><p class="mono" style="margin-top:12px">${E(t.when)}</p><p>${E(s[2])}</p></div>
${ds.length ? `<h2>${E(t.dates)} · ${E(t.days(ds.length))}</h2><div class="chips">${ds.map((x) => `<a href="${PFX[l]}/birthday/${daySlug(x.m, x.d)}/">${E(dayLabel(l, x.m, x.d))}</a>`).join("")}</div>` : ""}
${signs.length ? `<h2>${E(t.signs)}</h2><div class="chips">${signs.map((z) => `<a href="${PFX[l]}/zodiac/${z[3]}/">${E(z[LI[l]])}</a>`).join("")}</div>` : ""}
${prods.length ? `<h2>${E(t.buy)}</h2>${prodGrid(l, prods)}` : ""}${ctas(l, t)}<h2>FAQ</h2>${faqHtml(qa)}`;
  return page(l, ch, path, t.stoneT(name), t.stoneD(name, s[1]), body, { "@context": "https://schema.org", "@graph": [
    { "@type": "Article", headline: t.stoneT(name), description: t.stoneD(name, s[1]), inLanguage: l, author: { "@type": "Organization", name: "GemStone" }, publisher: { "@type": "Organization", name: "Gemstone.md", url: BASE }, mainEntityOfPage: BASE + PFX[l] + path },
    crumbLd(l, items), faqLd(qa)] });
}
async function dayPage(l, ch, m, x, cat) {
  const t = T[l], st = m.stones[x.i], s = st[l], label = dayLabel(l, x.m, x.d), path = `/birthday/${daySlug(x.m, x.d)}/`, z = signOf(x.m, x.d);
  const k = m.days.indexOf(x), pv = m.days[(k - 1 + m.days.length) % m.days.length], nx = m.days[(k + 1) % m.days.length];
  const prods = productsFor(cat, st.ru[0]);
  const qa = [[t.faq1(label), `${s[0]} — ${s[1].toLowerCase()}. ${st.d[l]}`], [t.faq2(s[0]), s[2]], [t.faq3, t.faqA3]];
  const items = [[t.bday, "/birthday/"], [label]];
  const body = `${crumbs(l, items)}<p class="mono">${E(t.sign)}: <a href="${PFX[l]}/zodiac/${z[3]}/" style="color:inherit">${E(z[LI[l]])}</a></p><h1>${E(t.dayH(label))}</h1>
<div class="card"><p class="mono">${E(s[1])}</p><h2 style="margin-top:.3rem">${E(s[0])}</h2><p>${E(s[2])}</p><p style="margin-top:10px">${E(st.d[l])}</p><p><a href="${PFX[l]}/stones/${st.slug}/" style="color:inherit">${E(t.more)} →</a></p></div>
${prods.length ? `<h2>${E(t.buy)}</h2>${prodGrid(l, prods)}` : ""}${ctas(l, t)}<h2>FAQ</h2>${faqHtml(qa)}
<div class="nav"><a href="${PFX[l]}/birthday/${daySlug(pv.m, pv.d)}/">← ${E(dayLabel(l, pv.m, pv.d))}</a><a href="${PFX[l]}/birthday/${daySlug(nx.m, nx.d)}/">${E(dayLabel(l, nx.m, nx.d))} →</a></div>`;
  return page(l, ch, path, t.dayT(label), t.dayD(label, s[0]), body, { "@context": "https://schema.org", "@graph": [
    { "@type": "Article", headline: t.dayH(label), description: t.dayD(label, s[0]), inLanguage: l, about: s[0], publisher: { "@type": "Organization", name: "Gemstone.md", url: BASE }, mainEntityOfPage: BASE + PFX[l] + path },
    crumbLd(l, items), faqLd(qa)] });
}
async function zodPage(l, ch, m, z, cat, posts) {
  const t = T[l], name = z[LI[l]], path = `/zodiac/${z[3]}/`;
  const ds = m.days.filter((x) => signOf(x.m, x.d)[3] === z[3]);
  const freq = {}; ds.forEach((x) => { freq[x.i] = (freq[x.i] || 0) + 1; });
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([i, n]) => [m.stones[i], n]);
  const caps = (cat.items || []).filter((it) => /капсул/i.test(it.n) && String(it.n).includes(z[0])).slice(0, 4);
  const pz = (posts || []).filter((p) => p.sign === z[0]).slice(0, 6);
  const first = ds[0], last = ds[ds.length - 1];
  const items = [[t.zod, "/zodiac/"], [name]];
  const qa = [[T[l].zodT(name), top.slice(0, 5).map((x) => x[0][l][0]).join(", ") + "."], [t.faq3, t.faqA3]];
  const body = `${crumbs(l, items)}<p class="mono">${E(t.range)}: ${E(dayLabel(l, first.m, first.d))} — ${E(dayLabel(l, last.m, last.d))}</p><h1>${E(t.zodT(name))}</h1>
<p class="lead">${E(t.zodD(name))}</p><h2>${E(t.topStones)}</h2><div class="grid">${top.map(([st, n]) => `<a href="${PFX[l]}/stones/${st.slug}/"><b>${E(st[l][0])}</b><small>${E(st[l][1])} · ${E(t.days(n))}</small></a>`).join("")}</div>
${caps.length ? `<h2>${E(t.capsule)}</h2>${prodGrid(l, caps)}` : ""}
${pz.length ? `<h2>${E(t.posts)}</h2><div class="grid">${pz.map((p) => `<a href="${PFX[l]}/journal/${E(p.slug)}/"><b>${E((p.title && (p.title[l] || p.title.ru)) || p.slug)}</b></a>`).join("")}</div>` : ""}
<h2>${E(t.dates)}</h2><div class="chips">${ds.map((x) => `<a href="${PFX[l]}/birthday/${daySlug(x.m, x.d)}/">${E(dayLabel(l, x.m, x.d))}</a>`).join("")}</div>${ctas(l, t)}<h2>FAQ</h2>${faqHtml(qa)}`;
  return page(l, ch, path, t.zodT(name), t.zodD(name), body, { "@context": "https://schema.org", "@graph": [{ "@type": "Article", headline: t.zodT(name), inLanguage: l, publisher: { "@type": "Organization", name: "Gemstone.md", url: BASE } }, crumbLd(l, items), faqLd(qa)] });
}
function hub(l, ch, m, kind) {
  const t = T[l];
  if (kind === "stones") {
    const body = `${crumbs(l, [[t.stones]])}<h1>${E(t.stonesH)}</h1><p class="lead">${E(t.stonesD)}</p><div class="grid" style="margin-top:20px">${m.stones.map((st) => `<a href="${PFX[l]}/stones/${st.slug}/"><b>${E(st[l][0])}</b><small>${E(st[l][1])}</small></a>`).join("")}</div>${ctas(l, t)}`;
    return page(l, ch, "/stones/", t.stonesH, t.stonesD, body, { "@context": "https://schema.org", "@graph": [crumbLd(l, [[t.stones]])] });
  }
  if (kind === "birthday") {
    const body = `${crumbs(l, [[t.bday]])}<h1>${E(t.bday)}</h1><p class="lead">${E(t.bdayD)}</p>${MON.slug.map((_, mi) => `<h2>${E(l === "ru" ? MON.ruN[mi] : l === "ro" ? MON.ro[mi].replace(/^./, (c) => c.toUpperCase()) : MON.en[mi])}</h2><div class="chips">${m.days.filter((x) => x.m === mi + 1).map((x) => `<a href="${PFX[l]}/birthday/${daySlug(x.m, x.d)}/">${x.d} · ${E(m.stones[x.i][l][0])}</a>`).join("")}</div>`).join("")}${ctas(l, t)}`;
    return page(l, ch, "/birthday/", t.bday, t.bdayD, body, { "@context": "https://schema.org", "@graph": [crumbLd(l, [[t.bday]])] });
  }
  const uniq = ZOD.slice(0, 12);
  const body = `${crumbs(l, [[t.zod]])}<h1>${E(t.zod)}</h1><p class="lead">${E(t.zodD)}</p><div class="grid" style="margin-top:20px">${uniq.map((z) => `<a href="${PFX[l]}/zodiac/${z[3]}/"><b>${E(z[LI[l]])}</b></a>`).join("")}</div>${ctas(l, t)}`;
  return page(l, ch, "/zodiac/", t.zod, t.zodD, body, { "@context": "https://schema.org", "@graph": [crumbLd(l, [[t.zod]])] });
}

export const SEO_RE = /^(\/ro|\/en)?\/(stones|birthday|zodiac)\/([a-z0-9-]*)\/?$/;
export async function handleSeo(request, env, ctx, getCatalog, loadIdx) {
  const url = new URL(request.url), mt = SEO_RE.exec(url.pathname);
  if (!mt) return notFound(env, url.origin);
  if (!url.pathname.endsWith("/")) return Response.redirect(url.origin + url.pathname + "/", 301);
  const l = mt[1] ? mt[1].slice(1) : "ru", kind = mt[2], sl = mt[3];
  try {
    const [m, ch] = await Promise.all([model(env, url.origin), chromeParts(env, url.origin, l)]);
    let cat = { items: [] }; try { cat = await getCatalog(env, ctx); } catch (e) {}
    let html = null;
    if (!sl) html = hub(l, ch, m, kind);
    else if (kind === "stones") { const st = m.stones.find((x) => x.slug === sl); if (st) html = await stonePage(l, ch, m, st, cat); }
    else if (kind === "birthday") { const x = m.days.find((d) => daySlug(d.m, d.d) === sl); if (x) html = await dayPage(l, ch, m, x, cat); }
    else { const z = ZOD.find((z) => z[3] === sl); if (z) { let posts = []; try { posts = (await loadIdx(env)).items; } catch (e) {} html = await zodPage(l, ch, m, z, cat, posts); } }
    if (!html) return notFound(env, url.origin);
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=600, s-maxage=3600" } });
  } catch (e) {
    console.error("seo page", String(e && e.message || e).slice(0, 150));
    return notFound(env, url.origin);
  }
}
export async function seoSitemap(env, origin) {
  const m = await model(env, origin);
  const paths = ["/stones/", "/birthday/", "/zodiac/"].concat(m.stones.map((s) => `/stones/${s.slug}/`), m.days.map((x) => `/birthday/${daySlug(x.m, x.d)}/`), ZOD.slice(0, 12).map((z) => `/zodiac/${z[3]}/`));
  const urls = paths.map((p) => LANGS.map((L) => `<url><loc>${BASE}${PFX[L]}${p}</loc>${LANGS.map((A) => `<xhtml:link rel="alternate" hreflang="${A}" href="${BASE}${PFX[A]}${p}"/>`).join("")}<changefreq>weekly</changefreq></url>`).join("")).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
export async function seoUrls(env, origin) {
  const m = await model(env, origin);
  const paths = ["/stones/", "/birthday/", "/zodiac/"].concat(m.stones.map((s) => `/stones/${s.slug}/`), m.days.map((x) => `/birthday/${daySlug(x.m, x.d)}/`), ZOD.slice(0, 12).map((z) => `/zodiac/${z[3]}/`));
  return paths.flatMap((p) => LANGS.map((L) => BASE + PFX[L] + p));
}
