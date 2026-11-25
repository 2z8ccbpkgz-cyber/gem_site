// Зеркало статики (ASSETS) gemstone.md. Только чтение: GET-запросы к публичному сайту, максимум 8 параллельно.
// Запуск: NODE_USE_ENV_PROXY=1 node scripts/crawl.mjs   (если нужен прокси)
// Ассет признаётся «настоящим», только если ETag ответа == BLAKE3-хэш тела (так отвечает ASSETS; воркер ETag не ставит).
import fs from "node:fs";
import path from "node:path";
import { ROOT, BASE, assetHash, cf } from "./lib.mjs";

const SITE = path.join(ROOT, "site");
const CACHE = path.join(ROOT, ".crawl-cache"); // не коммитится: ответы воркера (динамика)
const CONC = 8;
const settings = JSON.parse(fs.readFileSync(path.join(ROOT, "worker", "settings.json"), "utf8"));
const WF = settings.assets_config.raw_run_worker_first || [];
const wfRe = WF.map((g) => new RegExp("^" + g.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"));
const isWorkerFirst = (p) => wfRe.some((r) => r.test(p));

const EXT = "css|js|mjs|json|webp|jpe?g|png|gif|svg|ico|xml|txt|woff2?|ttf|otf|mp4|webm|mp3|pdf|webmanifest|html|avif|docx?|zip|map";
const RE_ABS = new RegExp(`(?:["'\`(=,\\s]|^)((?:https?:\\/\\/(?:www\\.)?gemstone\\.md)?\\/(?:[\\w.~%@+-]+\\/)*[\\w.~%@+-]*\\.(?:${EXT}))(?![\\w])`, "g");
const RE_ASSETS = /\/assets\/[^\s"'`)<>\\,;]+/g;
const RE_HREF = /(?:href|src|poster|data-src|action)=["']([^"'#\s]+)["']/g;
const RE_SRCSET = /srcset=["']([^"']+)["']/g;
const RE_URLFN = /url\(\s*["']?([^"')\s]+)["']?\s*\)/g;
const SKIP = /^\/(api|media|cdn-cgi)\//;

// Откуда качаем: по умолчанию workers.dev того же воркера (там нет вставок зоны: на gemstone.md зона добавляет в HTML
// <script src=".webmcp/bridge.js"> и убирает ETag, поэтому HTML с боевого домена НЕ байт-в-байт равен ассету).
let ORIGIN = process.env.CRAWL_ORIGIN || "";
async function resolveOrigin() {
  if (ORIGIN) return;
  try { const s = await cf("GET", "/workers/subdomain"); ORIGIN = `https://gemstone-public.${s.subdomain}.workers.dev`; }
  catch { ORIGIN = BASE; console.error("workers.dev не определён, качаем с боевого домена: HTML будет с вставкой зоны!"); }
}
const queue = []; const seen = new Set();
const report = { assets: {}, dynamic: {}, redirects: {}, missing: [], suspicious: [], fetchErrors: [] };

function norm(u, from) {
  try {
    if (/\$\{|[{}*<>]/.test(u)) return null;
    const x = new URL(u, BASE + from);
    if (x.origin !== BASE && x.hostname !== "www.gemstone.md") return null;
    let p = decodeURI(x.pathname); p = encodeURI(p).replace(/%25/g, "%");
    return p;
  } catch { return null; }
}
function add(u, from = "/") {
  const p = norm(u, from);
  if (!p || SKIP.test(p) || seen.has(p)) return;
  seen.add(p); queue.push(p);
}

// URL -> путь файла в ASSETS (auto-trailing-slash)
function filePathFor(p, ct) {
  if (p.endsWith("/")) return p + "index.html";
  if (!path.extname(p) && /html/.test(ct || "")) return p + ".html";
  return p;
}

function extractRefs(text, p) {
  text = text.replace(/\\\//g, "/");
  let m;
  RE_ABS.lastIndex = 0; while ((m = RE_ABS.exec(text))) add(m[1], p);
  for (m of text.matchAll(RE_ASSETS)) add(m[0], p);
  for (m of text.matchAll(RE_HREF)) add(m[1], p);
  for (m of text.matchAll(RE_URLFN)) add(m[1], p);
  for (m of text.matchAll(RE_SRCSET)) for (const part of m[1].split(",")) add(part.trim().split(/\s+/)[0], p);
}

function expandPhotos(json) {
  try {
    const d = JSON.parse(json); const W = d.w || [640, 1200]; const base = d.base || "/assets/p/";
    for (const it of d.items || []) {
      const fs_ = new Set([...(it.f || []), "c", "s1", "s2", "a", "b"]);
      for (const f of fs_) for (const w of W) add(`${base}${it.d}/${f}-${w}.webp`);
      for (const w of [400, 800]) add(`/assets/k/${it.d}-${w}.webp`); // вырезки (cutouts) для круга знаков на главной
    }
  } catch {}
}

async function get(p) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(ORIGIN + p, { redirect: "manual", headers: { "user-agent": "gemstone-site-mirror/1.0" } });
      const buf = Buffer.from(await r.arrayBuffer());
      return { r, buf };
    } catch (e) { if (i === 2) throw e; await new Promise((s) => setTimeout(s, 500 * (i + 1))); }
  }
}

async function work(p) {
  let res;
  try { res = await get(p); } catch (e) { report.fetchErrors.push([p, String(e.message || e)]); return; }
  const { r, buf } = res; const ct = r.headers.get("content-type") || "";
  if (r.status >= 300 && r.status < 400) {
    const loc = r.headers.get("location") || ""; report.redirects[p] = { status: r.status, location: loc };
    add(loc, p); return;
  }
  const wf = isWorkerFirst(p);
  if (r.status !== 200) { report.missing.push([p, r.status, wf ? "worker-first" : "assets"]); return; }
  const etag = (r.headers.get("etag") || "").replace(/^W\//, "").replace(/"/g, "");
  const fp = filePathFor(p, ct);
  const h = assetHash(buf, fp);
  const isText = /text|json|xml|javascript|svg/.test(ct);
  const htmlNoEtag = !etag && !wf && /text\/html/.test(ct); // у HTML из ASSETS ETag не отдаётся: байты проверяются сессией загрузки
  if ((etag && etag === h) || htmlNoEtag) {
    const abs = path.join(SITE, fp); fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, buf);
    report.assets[fp] = { hash: h, size: buf.length, url: p, ct, ...(htmlNoEtag ? { etag_verified: false } : {}) };
    if (isText) { const t = buf.toString("utf8"); extractRefs(t, p); if (p === "/assets/photos.json") expandPhotos(t); }
  } else {
    // ответ воркера (или иначе изменённый): в site/ не кладём, но ссылки из него учитываем
    const rec = { url: p, status: r.status, ct, size: buf.length, hash_if_asset: h, etag: etag || null, workerFirst: wf };
    if (wf) report.dynamic[p] = rec; else report.suspicious.push(rec);
    const abs = path.join(CACHE, fp); fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, buf);
    if (isText) extractRefs(buf.toString("utf8"), p);
    if (/xml/.test(ct) && /sitemap/.test(p)) extractRefs(buf.toString("utf8"), p);
  }
}

async function main() {
  await resolveOrigin();
  const seeds = ["/", "/ro/", "/en/", "/shop/", "/ro/shop/", "/en/shop/", "/404", "/404.html", "/robots.txt", "/llms.txt", "/sitemap.xml",
    "/sitemap-video.xml", "/sitemap-seo.xml", "/favicon.ico", "/assets/favicon.ico", "/assets/favicon-32x32.png", "/assets/favicon-16x16.png",
    "/assets/apple-touch-icon.png", "/assets/og.jpg", "/assets/photos.json", "/assets/caps/ru.json", "/assets/caps/ro.json", "/assets/caps/en.json",
    "/assets/seo/dump.json", "/assets/shop.js", "/assets/script.js", "/assets/styles.css", "/assets/pd.css", "/assets/minerals.js", "/assets/lead.js", "/assets/an.js",
    "/site.webmanifest", "/assets/site.webmanifest", "/manifest.webmanifest", "/index.html", "/ro/index.html", "/en/index.html"];
  seeds.forEach((s) => add(s));
  let done = 0;
  async function runner() {
    while (true) {
      const p = queue.shift();
      if (!p) { if (inflight === 0) return; await new Promise((s) => setTimeout(s, 50)); continue; }
      inflight++; try { await work(p); } finally { inflight--; done++; if (done % 200 === 0) console.error(`… ${done} запросов, в очереди ${queue.length}, ассетов ${Object.keys(report.assets).length}`); }
    }
  }
  let inflight = 0;
  await Promise.all(Array.from({ length: CONC }, runner));
  // Главные страницы затенены воркером (он вставляет секцию журнала <section class="jrail"> после section.hero через HTMLRewriter).
  // Восстанавливаем статический байт-в-байт вариант вырезанием этой секции; корректность подтверждает verify_assets.mjs.
  for (const L of ["", "ro/", "en/"]) {
    const f = path.join(CACHE, L, "index.html"); if (!fs.existsSync(f)) continue;
    const t = fs.readFileSync(f, "utf8"); const i = t.indexOf('<section class="jrail"'); if (i < 0) continue;
    const j = t.indexOf("</section>", i) + "</section>".length; const buf = Buffer.from(t.slice(0, i) + t.slice(j));
    const fp = "/" + L + "index.html"; const abs = path.join(SITE, fp); fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, buf);
    report.assets[fp] = { hash: assetHash(buf, fp), size: buf.length, url: "/" + L, ct: "text/html", reconstructed: "dynamic minus journal rail" };
  }
  // Что в ASSETS есть, но снаружи не достать (затенено воркером)
  const slugs = [...new Set(Object.keys(report.dynamic).map((p) => (p.match(/^(?:\/ro|\/en)?\/p\/([^/]+)\/$/) || [])[1]).filter(Boolean))];
  report.unknown = {
    static_product_fallback_pages: { note: "p/<slug>/index.html, ro/p/.., en/p/.. — затенены воркером (/p/*); возможно ASSETS-файлы-запасной вариант", slugs: slugs.length, files_expected: slugs.length * 3 },
    shadowed_other: ["/sitemap.xml", "/sitemap-video.xml", "/sitemap-seo.xml", "/assets/shop.js (в ASSETS может лежать старая версия)", "/llms.txt (то же)"],
  };
  const out = {
    crawled_at: new Date().toISOString(), requests: done,
    counts: { assets: Object.keys(report.assets).length, dynamic: Object.keys(report.dynamic).length, redirects: Object.keys(report.redirects).length, missing: report.missing.length, suspicious: report.suspicious.length, fetchErrors: report.fetchErrors.length },
    ...report,
  };
  fs.writeFileSync(path.join(ROOT, "crawl-report.json"), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out.counts));
}
main().catch((e) => { console.error(e); process.exit(1); });
