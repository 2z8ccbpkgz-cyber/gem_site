// i18n.js — автоматический перевод каталога на румынский и английский.
// Порядок для каждого названия (сверху вниз, первое найденное побеждает):
//   1. колонка «Название RO/EN» в таблице (ручная правка всегда главнее)   → it.t, источник "sheet"
//   2. словарь текущих позиций (i18n_dict.js → NAMES)                      → "dict"
//   3. правила разбора (камень + тип + цвет + размер)                      → "rule"
//   4. Workers AI (m2m100), результат кэшируется (память + Cache API)      → "ai"
//   5. запасной вариант без ИИ: известные слова + транслитерация           → "tl"  (кириллицы на RO/EN не остаётся)
// Описания («Описание RO/EN» в таблице): если RU-описание есть, а RO/EN нет — переводит ИИ.

import { NAMES, STONES, COLOR_RO, MODS, TYPES } from "./i18n_dict.js";

const nz = (s) => String(s ?? "").toLowerCase().replace(/ё/g, "е");
// тот же ключ, что в словаре: строчные, ё→е, пробелы у кавычек убраны
export const nk = (s) => nz(s).replace(/\s*"\s*/g, '"').replace(/\s+/g, " ").trim();
const HAS_CYR = /[А-Яа-яЁё]/;
const up1 = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/* ── 3. правила: «Браслет Аметист 8мм», «Агат чёрный матовый», «Чокер Лабрадорит» … ── */
const SIZE_RE = /^(\d{1,2}(?:[.,]\d)?)\s*мм$|^(\d{1,2})$/;
const SIZE_RE2 = /^(\d{1,2}(?:[.,]\d)?)мм$/;
const PLAIN_TYPES = new Set(["серьги", "колье", "подвеска", "кольцо", "браслет"]); // слово-тип в начале не режем: оно часть названия в таблице
const PRI = (w) =>
  w === "men's" || w === "women's" ? 0
  : ["matte", "glossy", "smooth", "raw", "crackle"].includes(w) ? 1
  : ["light", "dark", "green", "blue", "light blue", "pink", "black", "white", "red", "grey", "lemon", "mint", "multicolour", "lavender", "caramel"].includes(w) ? 2
  : 3;

function tokens(name) {
  return nz(name)
    .replace(/"/g, " ").replace(/[«»]/g, " ").replace(/\(/g, " ( ").replace(/\)/g, " ) ")
    .replace(/(\d)\s*мм/g, "$1мм").replace(/\s+/g, " ").trim();
}

export function ruleTranslate(name) {
  let words = tokens(name).split(" ").filter(Boolean);
  let typ = null;
  if (words.length && TYPES[words[0]] && !PLAIN_TYPES.has(words[0])) { typ = words[0]; words = words.slice(1); }
  let st = null, used = 0;
  for (let n = Math.min(4, words.length); n > 0; n--) {
    const k = words.slice(0, n).join(" ");
    if (Object.prototype.hasOwnProperty.call(STONES, k)) { st = STONES[k]; used = n; break; }
  }
  if (!st) return null;
  const rest = words.slice(used), gender = st[2];
  const preEn = [], postEn = [], roParts = [];
  let size = "", i = 0;
  while (i < rest.length) {
    const w = rest[i];
    let hit = null;
    for (const n of [2, 1]) {
      const k = rest.slice(i, i + n).join(" ");
      if (Object.prototype.hasOwnProperty.call(MODS, k)) { hit = [k, n]; break; }
    }
    if (hit) {
      const [k, n] = hit; let [ro, en, pos] = MODS[k];
      if (pos !== "skip") {
        if (ro === "#") ro = COLOR_RO[gender][k] || COLOR_RO.m[k] || k;
        roParts.push(ro);
        (pos === "pre" ? preEn : postEn).push(en);
      }
      i += n; continue;
    }
    let m = w.match(SIZE_RE);
    if (m) { size = (m[1] || m[2]).replace(",", ".") + " mm"; i++; continue; }
    m = w.match(SIZE_RE2);
    if (m) { size = m[1].replace(",", ".") + " mm"; i++; continue; }
    return null; // незнакомое слово — правила не справились
  }
  let ro = typ ? `${TYPES[typ][0]} din ${st[0][0].toLowerCase()}${st[0].slice(1)}` : st[0];
  const modsRo = roParts.filter((p) => p !== "pentru bărbați" && p !== "pentru femei");
  const tailRo = roParts.filter((p) => p === "pentru bărbați" || p === "pentru femei");
  ro += (modsRo.length ? " " + modsRo.join(" ") : "") + (size ? " " + size : "") + (tailRo.length ? ", " + tailRo[0] : "");
  const pre = [...preEn].sort((a, b) => PRI(a) - PRI(b));
  let en = typ
    ? pre.concat([st[1]]).join(" ") + " " + TYPES[typ][1] + (postEn.length ? ", " + postEn.join(" ") : "")
    : pre.concat([st[1]], postEn).join(" ");
  if (size) en += (typ ? ", " : " ") + size;
  en = en.trim();
  return [ro.trim(), up1(en)];
}

/* ── 5. запасной вариант: известные слова + транслитерация (чтобы на RO/EN не осталось кириллицы) ── */
const TL = {
  ro: { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "io", ж: "j", з: "z", и: "i", й: "i", к: "c", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ț", ч: "ci", ш: "ș", щ: "șc", ъ: "", ы: "î", ь: "", э: "e", ю: "iu", я: "ia" },
  en: { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" },
};
const translit = (w, lang) => Array.from(w).map((ch) => { const l = ch.toLowerCase(), t = TL[lang][l]; return t === undefined ? ch : ch === l ? t : up1(t); }).join("");

// общие слова украшений для запасного перевода (когда ИИ недоступен)
const WORDS = {
  "кулон": ["Pandantiv", "pendant"], "брошь": ["Broșă", "brooch"], "цепочка": ["Lanț", "chain"], "цепь": ["Lanț", "chain"],
  "бусы": ["Mărgele", "beads"], "ожерелье": ["Colier", "necklace"], "набор": ["Set", "set"], "комплект": ["Set", "set"],
  "запонки": ["Butoni", "cufflinks"], "брелок": ["Breloc", "keychain"], "четки": ["Mătănii", "rosary"], "чётки": ["Mătănii", "rosary"],
  "сердце": ["Inimă", "heart"], "сердечко": ["Inimă", "heart"], "звезда": ["Stea", "star"], "шар": ["Sferă", "sphere"], "сфера": ["Sferă", "sphere"],
  "друза": ["Drușă", "druse"], "кристалл": ["Cristal", "crystal"], "пирамида": ["Piramidă", "pyramid"], "камень": ["Piatră", "stone"],
  "с": ["cu", "with"], "и": ["și", "and"], "на": ["pe", "on"], "для": ["pentru", "for"], "из": ["din", "of"], "руку": ["de mână", "for the wrist"],
  "серебро": ["argint", "silver"], "серебряный": ["din argint", "silver"], "золото": ["aur", "gold"], "подарочный": ["cadou", "gift"],
};

export function fallbackTranslate(name, lang) {
  const li = lang === "ro" ? 0 : 1;
  const raw = String(name ?? "").replace(/"/g, " ").replace(/[«»]/g, " ").replace(/\(/g, " ( ").replace(/\)/g, " ) ").replace(/(\d)\s*мм/gi, "$1мм").replace(/\s+/g, " ").trim();
  const out = raw.split(" ").filter(Boolean).map((orig) => {
    const w = nz(orig);
    if (w === "(" || w === ")") return w;
    if (Object.prototype.hasOwnProperty.call(STONES, w)) return STONES[w][li];
    if (Object.prototype.hasOwnProperty.call(TYPES, w)) return TYPES[w][li];
    if (Object.prototype.hasOwnProperty.call(WORDS, w)) return WORDS[w][li];
    if (Object.prototype.hasOwnProperty.call(MODS, w)) { const m = MODS[w]; if (m[2] === "skip") return ""; return m[0] === "#" ? (lang === "ro" ? (COLOR_RO.m[w] || w) : m[1]) : m[li]; }
    const sz = w.match(SIZE_RE2);
    if (sz) return sz[1].replace(",", ".") + " mm";
    return HAS_CYR.test(orig) ? translit(orig, lang) : orig;
  }).filter(Boolean).join(" ").replace(/\( /g, "(").replace(/ \)/g, ")");
  return up1(out);
}

/* ── локальный перевод названия без ИИ: словарь → правила ── */
export function localName(name, lang) {
  const li = lang === "ro" ? 0 : 1;
  const d = NAMES[nk(name)];
  if (d && d[li]) return { v: d[li], src: "dict" };
  const r = ruleTranslate(name);
  if (r) return { v: r[li], src: "rule" };
  return null;
}

/* ── 4. Workers AI + кэш ── */
const AI_MODEL = "@cf/meta/m2m100-1.2b";
const AI_LANG = { ro: ["romanian", "ro"], en: ["english", "en"] };
const MEM = new Map();      // "ro|name|текст" → перевод
const INFLIGHT = new Map(); // ключ → Promise
const FAILED = new Map();   // ключ → время последней ошибки (повтор не чаще раза в 5 минут)
const RETRY_MS = 5 * 60 * 1000;
const AI_TTL = 30 * 24 * 3600;

async function sha(text) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(b)).slice(0, 12).map((x) => x.toString(16).padStart(2, "0")).join("");
}
const cacheKey = async (k) => new Request("https://gemstone.md/__i18n/" + (await sha(k)));

function sane(out, src, lang) {
  const s = String(out || "").replace(/\s+/g, " ").trim();
  if (!s || HAS_CYR.test(s) || s.length > src.length * 3 + 12) return "";
  return s;
}

async function aiRun(env, text, lang) {
  let last;
  for (const target of AI_LANG[lang]) {
    try {
      const r = await env.AI.run(AI_MODEL, { text, source_lang: target.length > 2 ? "russian" : "ru", target_lang: target });
      const v = sane(r && (r.translated_text || r.translation), text, lang);
      if (v) return v;
    } catch (e) { last = e; }
  }
  if (last) console.error("ai translate failed", String(last).slice(0, 200));
  return "";
}

function aiTranslate(env, ctx, text, lang, kind) {
  const key = `${lang}|${kind}|${text}`;
  if (MEM.has(key)) return Promise.resolve(MEM.get(key));
  if (INFLIGHT.has(key)) return INFLIGHT.get(key);
  if (!env.AI || (FAILED.get(key) && Date.now() - FAILED.get(key) < RETRY_MS)) return Promise.resolve("");
  const p = (async () => {
    let v = "";
    let ck = null;
    try {
      if (typeof caches !== "undefined" && caches.default) {
        ck = await cacheKey(key);
        const hit = await caches.default.match(ck);
        if (hit) v = sane(await hit.text(), text, lang);
      }
    } catch { /* кэш недоступен (локально / workers.dev) — просто идём дальше */ }
    if (!v) {
      // размер «8мм» защищаем от переводчика
      const src = kind === "n" ? text.replace(/(\d+(?:[.,]\d+)?)\s*мм/g, "$1 mm") : text;
      v = await aiRun(env, src, lang);
      if (v && kind === "n") {
        v = v.replace(/\s*\.$/, "").replace(/(\d)\s*mm\b/g, "$1 mm");
        if (lang === "en") v = v.replace(/^(?:the|a|an)\s+/i, ""); // переводчик любит артикли: «The Magic Light» → «Magic Light»
        v = up1(v);
      }
      if (v && ck) { try { await caches.default.put(ck, new Response(v, { headers: { "cache-control": `public, max-age=${AI_TTL}` } })); } catch { /* ok */ } }
    }
    if (v) MEM.set(key, v); else FAILED.set(key, Date.now());
    return v;
  })().finally(() => INFLIGHT.delete(key));
  INFLIGHT.set(key, p);
  try { ctx && ctx.waitUntil && ctx.waitUntil(p); } catch { /* ok */ }
  return p;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Проставляет it.t = {ro, en} и it.d = {ru, ro, en} для каждой позиции. Мутирует items.
 * Ждёт ИИ не дольше budgetMs: если не успел — временно транслит/правила, а результат долетит в кэш
 * и попадёт в каталог при следующем обновлении (через ≤ TTL секунд).
 */
export async function translateItems(env, ctx, items, opts = {}) {
  const budgetMs = opts.budgetMs ?? 2500, maxAi = opts.maxAi ?? 40;
  const stat = { sheet: 0, dict: 0, rule: 0, ai: 0, tl: 0 };
  const need = []; // {it, lang, kind, text}
  for (const it of items) {
    const t = { ...(it.t || {}) };
    for (const lang of ["ro", "en"]) {
      if (t[lang]) { stat.sheet++; continue; }
      const l = localName(it.n, lang);
      if (l) { t[lang] = l.v; stat[l.src]++; continue; }
      need.push({ it, t, lang, kind: "n", text: it.n });
    }
    it.t = t;
    if (it.d && it.d.ru) {
      for (const lang of ["ro", "en"]) if (!it.d[lang]) need.push({ it, lang, kind: "d", text: it.d.ru });
    }
  }
  if (need.length && env.AI) {
    const uniq = new Map();
    for (const n of need) { const k = `${n.lang}|${n.kind}|${n.text}`; if (!MEM.has(k) && !uniq.has(k)) uniq.set(k, n); }
    const jobs = [...uniq.values()].slice(0, maxAi).map((n) => aiTranslate(env, ctx, n.text, n.lang, n.kind));
    if (jobs.length) await Promise.race([Promise.allSettled(jobs), sleep(budgetMs)]);
  }
  for (const n of need) {
    const v = MEM.get(`${n.lang}|${n.kind}|${n.text}`);
    if (n.kind === "n") {
      if (v) { n.t[n.lang] = v; stat.ai++; }
      else { n.t[n.lang] = fallbackTranslate(n.text, n.lang); stat.tl++; }
    } else if (v) {
      n.it.d[n.lang] = v; stat.ai++;
    }
  }
  for (const it of items) { if (it.t && !Object.keys(it.t).length) delete it.t; }
  return stat;
}

// для тестов
export const _i18n = { ruleTranslate, fallbackTranslate, localName, nk, translit, sane, MEM, FAILED, INFLIGHT };
