// Счётчик посещений gemstone.md: без cookie и без хранения IP (v1, 19.11.2026).
// Пишет в D1 CRM_DB таблицу web_events (создаётся здесь, существующие таблицы CRM не затрагиваются).
// Читает таблицу вкладка «Сайт» в админке CRM (astrogems-sales → /api/admin/site-stats).
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|python|curl|wget|httpclient|monitor|uptime|check|scan|yandex|google|bing|duckduck|baidu|semrush|ahrefs|mj12|petal|bytespider|gpt|claude|perplexity/i;
const EV = new Set(["pv", "dur", "buy", "cart"]);
const OWN = /(^|\.)gemstone\.md$/i;
let READY = false;

const DDL = [
  `CREATE TABLE IF NOT EXISTS web_events (
     id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, day TEXT NOT NULL, vid TEXT NOT NULL, ev TEXT NOT NULL,
     path TEXT, ptype TEXT, item TEXT, lang TEXT, country TEXT, city TEXT, device TEXT, src TEXT, ref TEXT, val INTEGER)`,
  `CREATE INDEX IF NOT EXISTS web_events_day ON web_events(day, ev)`,
  `CREATE INDEX IF NOT EXISTS web_events_vid ON web_events(vid, day)`,
];
async function ready(env) {
  if (READY) return;
  for (const q of DDL) await env.CRM_DB.prepare(q).run();
  READY = true;
}

const dayOf = (d = new Date()) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Chisinau" });
async function visitorId(request, day) {
  const ip = request.headers.get("cf-connecting-ip") || "";
  const ua = request.headers.get("user-agent") || "";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${ip}|${ua}|${day}|gm-site-v1`));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const SRC = [
  [/(^|\.)google\./i, "Google"], [/yandex\./i, "Яндекс"], [/bing\.com$/i, "Bing"], [/duckduckgo|ecosia|brave\.com|yahoo\./i, "Другой поиск"],
  [/instagram\.com$/i, "Instagram"], [/tiktok\.com$/i, "TikTok"], [/(^|\.)t\.me$|telegram/i, "Telegram"], [/facebook\.com$|(^|\.)fb\.com$|messenger/i, "Facebook"],
  [/(^|\.)vk\.com$|ok\.ru/i, "ВКонтакте / ОК"], [/chatgpt\.com|openai\.com|perplexity|gemini\.google|claude\.ai|copilot\.microsoft/i, "ИИ-ассистенты"],
  [/pinterest\./i, "Pinterest"], [/youtube\.com|youtu\.be/i, "YouTube"], [/whatsapp/i, "WhatsApp"],
];
const UTM = [[/^(ig|insta)/i, "Instagram"], [/tiktok|tt$/i, "TikTok"], [/^(tg|tele)/i, "Telegram"], [/^(fb|face)/i, "Facebook"], [/google/i, "Google"], [/yandex/i, "Яндекс"], [/pinterest/i, "Pinterest"], [/youtube|yt$/i, "YouTube"]];
function classify(refHost, utm) {
  if (utm) { for (const [re, n] of UTM) if (re.test(utm)) return n; return "Метка: " + utm.slice(0, 40); }
  if (!refHost) return "Прямой заход";
  if (OWN.test(refHost)) return "internal";
  for (const [re, n] of SRC) if (re.test(refHost)) return n;
  return refHost.replace(/^www\./, "").slice(0, 60);
}
function pageInfo(p) {
  const lang = p.startsWith("/ro/") || p === "/ro" ? "ro" : p.startsWith("/en/") || p === "/en" ? "en" : "ru";
  const rest = p.replace(/^\/(ro|en)(?=\/|$)/, "") || "/";
  const m = rest.match(/^\/p\/([^/]+)\/?$/);
  if (m) return { lang, ptype: "product", item: m[1].slice(0, 30) };
  if (/^\/shop\/?$/.test(rest)) return { lang, ptype: "shop", item: "" };
  if (rest === "/" || rest === "") return { lang, ptype: "home", item: "" };
  return { lang, ptype: "other", item: "" };
}
const clip = (v, n) => (v == null ? "" : String(v).slice(0, n));

export async function handleHit(request, env, ctx) {
  const ok = new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  try {
    if (BOT.test(request.headers.get("user-agent") || "")) return ok;
    const raw = await request.text();
    if (!raw || raw.length > 2000) return ok;
    const b = JSON.parse(raw);
    if (!EV.has(b.e)) return ok;
    let path = clip(b.p, 200).split("?")[0].split("#")[0];
    if (!path.startsWith("/")) return ok;
    const day = dayOf(), vid = await visitorId(request, day), cf = request.cf || {};
    const { lang, ptype, item } = pageInfo(path);
    let ref = "", src = "";
    if (b.e === "pv") {
      try { ref = b.r ? new URL(b.r).hostname : ""; } catch { ref = ""; }
      const utm = clip(b.u, 60).replace(/[^\w.\-/ ]/g, "");
      src = classify(ref, utm);
    }
    let val = null, evItem = item;
    if (b.e === "dur") { val = Math.max(0, Math.min(1800, parseInt(b.d, 10) || 0)); if (val < 1) return ok; }
    if (b.e === "buy" || b.e === "cart") evItem = clip(b.i, 30);
    const device = Number(b.w) > 0 && Number(b.w) < 820 ? "mobile" : "desktop";
    const run = async () => {
      await ready(env);
      await env.CRM_DB.prepare(
        `INSERT INTO web_events (ts, day, vid, ev, path, ptype, item, lang, country, city, device, src, ref, val) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(Math.floor(Date.now() / 1000), day, vid, b.e, path, ptype, evItem, lang, clip(cf.country, 2) || "??", clip(cf.city, 60), device, src, ref, val).run();
      if (Math.random() < 0.01) await env.CRM_DB.prepare(`DELETE FROM web_events WHERE ts < ?`).bind(Math.floor(Date.now() / 1000) - 400 * 86400).run();
    };
    ctx && ctx.waitUntil ? ctx.waitUntil(run().catch((e) => console.error("hit failed", String(e)))) : await run();
  } catch (e) { console.error("hit error", String(e)); }
  return ok;
}

// Заявка с сайта (вызывается из handleLead, не блокирует ответ клиенту)
export async function logLead(request, env, info) {
  try {
    await ready(env);
    const day = dayOf(), vid = await visitorId(request, day), cf = request.cf || {};
    const first = await env.CRM_DB.prepare(`SELECT src FROM web_events WHERE vid=? AND day=? AND ev='pv' AND src!='internal' ORDER BY ts LIMIT 1`).bind(vid, day).first();
    await env.CRM_DB.prepare(
      `INSERT INTO web_events (ts, day, vid, ev, path, ptype, item, lang, country, city, device, src, ref, val) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(Math.floor(Date.now() / 1000), day, vid, "lead", "/api/lead", "lead", clip(info.item, 30), clip(info.lang, 2) || "ru", clip(cf.country, 2) || "??", clip(cf.city, 60), "", first?.src || "Не определён", "", info.count || 0).run();
  } catch (e) { console.error("lead log failed", String(e)); }
}
