// journal_sync.js — автоперенос новых рилсов Instagram в журнал gemstone.md (23.11.2026). Всё на Cloudflare.
// Источник: движок Instagram CRM (D1 astrogems-ig-test: таблица media + действующий ig_token, движок сам его продлевает).
// Конвейер (по шагу за запуск Cron, раз в минуту; один рилс за раз):
//   new → fetch (видео+обложка в R2) → voice (ElevenLabs Audio Isolation: голос без музыки → R2 voice.mp3)
//   → text (Workers AI Whisper large-v3-turbo, таймкоды) → meta (Claude: заголовки/ответ/FAQ RU·RO·EN, камни, изделия, знак)
//   → publish (posts/<slug>.json + index.json, IndexNow, уведомление владельцу) → done.
// Публикация — через 30 мин после выхода рилса (успевает набрать статистику). Без голоса (<15 слов) — skipped.

const BASE = "https://gemstone.md";
const IDX_KEY = "journal/index.json";
const INDEXNOW_KEY = "a7a3a2e2f678ff1007c9ca7ffd0bb417";
const MIN_AGE_MS = 30 * 60 * 1000;
const CUTOFF_TS = Date.UTC(2026, 10, 22); // не переносить задним числом то, что уже разбирали вручную
const SIGNS = ["Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева", "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"];
const TOPICS = ["signs", "gifts", "stones", "rings", "capsules"];

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS jsync(media_id TEXT PRIMARY KEY, status TEXT NOT NULL, data TEXT, tries INTEGER DEFAULT 0, err TEXT, created_at INTEGER, updated_at INTEGER)`,
];
let ok = false;
async function ensure(env) { if (ok) return; await env.APP_DB.batch(SCHEMA.map((s) => env.APP_DB.prepare(s))); ok = true; }

const slugify = (s) => {
  const m = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
  return String(s || "").toLowerCase().split("").map((c) => (m[c] !== undefined ? m[c] : c)).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "post";
};
const b64 = (buf) => { let s = ""; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };

async function setJob(env, id, status, data, err) {
  await env.APP_DB.prepare("UPDATE jsync SET status=?, data=?, err=?, tries=CASE WHEN ? IS NULL THEN 0 ELSE tries+1 END, updated_at=? WHERE media_id=?")
    .bind(status, JSON.stringify(data), err || null, err || null, Date.now(), id).run();
}
async function owner(env, text) {
  if (!env.TG_BOT_TOKEN) return;
  for (const id of String(env.OWNER_TG_IDS || "234491691").split(/[,\s]+/).filter(Boolean))
    await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: id, text, disable_web_page_preview: false }) }).catch(() => {});
}
async function igToken(env) {
  const r = await env.ENGINE_DB.prepare("SELECT v FROM settings WHERE k='ig_token'").first();
  return r && r.v;
}

/* ── обнаружение новых рилсов в движке CRM ── */
async function discover(env) {
  const idx = (await env.MEDIA.get(IDX_KEY).then((o) => (o ? o.json() : []))) || [];
  const have = new Set(idx.map((x) => String(x.media_id)));
  const r = await env.ENGINE_DB.prepare("SELECT id, caption, permalink, ts, like_count, comments_count, product_type, media_type FROM media WHERE media_type='VIDEO' AND product_type='REELS' AND ts>? AND ts<? ORDER BY ts ASC LIMIT 10")
    .bind(CUTOFF_TS, Date.now() - MIN_AGE_MS).all();
  for (const m of r.results || []) {
    if (have.has(String(m.id))) continue;
    await env.APP_DB.prepare("INSERT OR IGNORE INTO jsync(media_id,status,data,created_at,updated_at) VALUES(?,?,?,?,?)")
      .bind(String(m.id), "new", JSON.stringify({ caption: m.caption || "", permalink: m.permalink, ts: m.ts, likes: m.like_count || 0, comments: m.comments_count || 0 }), Date.now(), Date.now()).run();
  }
}

/* ── шаги ── */
async function stepFetch(env, id, d) {
  const tok = await igToken(env);
  const g = await fetch(`https://graph.instagram.com/${id}?fields=media_url,thumbnail_url,like_count,comments_count,caption,permalink,timestamp&access_token=${encodeURIComponent(tok)}`).then((x) => x.json());
  if (!g || !g.media_url) throw new Error("graph:" + JSON.stringify(g && g.error ? g.error.message : g).slice(0, 150));
  const v = await fetch(g.media_url); if (!v.ok) throw new Error("video_" + v.status);
  const vb = await v.arrayBuffer();
  await env.MEDIA.put(`reels/${id}/v.mp4`, vb, { httpMetadata: { contentType: "video/mp4" } });
  if (g.thumbnail_url) { const t = await fetch(g.thumbnail_url); if (t.ok) await env.MEDIA.put(`reels/${id}/poster.jpg`, await t.arrayBuffer(), { httpMetadata: { contentType: "image/jpeg" } }); }
  Object.assign(d, { ts: g.timestamp ? Date.parse(g.timestamp) : d.ts, caption: g.caption || d.caption, permalink: g.permalink || d.permalink, likes: g.like_count || d.likes, comments: g.comments_count || d.comments, bytes: vb.byteLength });
  return "voice";
}
async function stepVoice(env, id, d) {
  if (!env.ELEVENLABS_API_KEY) throw new Error("no_elevenlabs");
  const o = await env.MEDIA.get(`reels/${id}/v.mp4`); if (!o) return "fetch";
  const f = new FormData(); f.append("audio", new Blob([await o.arrayBuffer()], { type: "video/mp4" }), "reel.mp4");
  const r = await fetch("https://api.elevenlabs.io/v1/audio-isolation", { method: "POST", headers: { "xi-api-key": env.ELEVENLABS_API_KEY }, body: f });
  if (!r.ok) throw new Error("isolation_" + r.status + ":" + (await r.text()).slice(0, 120));
  await env.MEDIA.put(`reels/${id}/voice.mp3`, await r.arrayBuffer(), { httpMetadata: { contentType: "audio/mpeg" } });
  return "text";
}
async function stepText(env, id, d) {
  let words = d.words;
  if (words === undefined) {
  const o = await env.MEDIA.get(`reels/${id}/voice.mp3`); if (!o) return "voice";
  const res = await env.AI.run("@cf/openai/whisper-large-v3-turbo", { audio: b64(await o.arrayBuffer()), language: "ru", vad_filter: true });
  const segs = (res.segments || []).map((s) => [Math.round(s.start * 10) / 10, Math.round(s.end * 10) / 10, String(s.text || "").trim()]).filter((s) => s[2] && !/субтитр|dimatorzok|продолжение следует|редактор субтитров/i.test(s[2]));
  words = segs.reduce((n, s) => n + s[2].split(/\s+/).length, 0);
  d.segments = segs; d.duration = segs.length ? segs[segs.length - 1][1] : 0; d.words = words;
  if (res.transcription_info && res.transcription_info.duration) d.duration = Math.round(res.transcription_info.duration * 10) / 10;
  }
  // титры/текст в кадре и смысл ролика — из разбора CRM (media_insight: кадры каждые 1,5 с → gemma читает весь текст кадра)
  const ins = await insight(env, id);
  if (ins) { d.onscreen = ins.timeline; d.insight = ins.full; }
  if (words >= 15) return "meta";
  if (ins && (ins.timeline.length >= 3 || (ins.full || "").length > 80)) {
    // голоса нет — субтитрами становятся титры из кадра; видео показываем без звука (музыку не публикуем)
    d.textMode = true;
    const tl = ins.timeline;
    d.segments = tl.map((x, i) => [x.t, i + 1 < tl.length ? Math.max(x.t + 1.5, tl[i + 1].t) : x.t + 3, x.text]);
    if (!d.duration) d.duration = d.segments.length ? d.segments[d.segments.length - 1][1] : 0;
    return "meta";
  }
  // разбор CRM ещё не готов — ждём до 6 часов после выхода рилса
  if (!ins && Date.now() - (Number(d.ts) || 0) < 6 * 3600e3) { d.waitInsight = (d.waitInsight || 0) + 1; return "text"; }
  return "skipped";
}
async function insight(env, id) {
  if (!env.CRM_DB) return null;
  try {
    const r = await env.CRM_DB.prepare("SELECT status, scene, result FROM media_insight WHERE id=?").bind(String(id)).first();
    if (!r || (r.status !== "ok" && r.status !== "partial")) return null;
    let sc = {}, rs = {}; try { sc = JSON.parse(r.scene || "{}"); } catch {} try { rs = JSON.parse(r.result || "{}"); } catch {}
    const tl = (sc.timeline || []).filter((x) => x && x.text && String(x.text).trim().length > 1).map((x) => ({ t: Number(x.t) || 0, text: String(x.text).trim() }));
    return { timeline: tl, full: rs.full || r.about || "", stones: rs.stones || [], sign: rs.sign || null };
  } catch (e) { return null; }
}
async function stepMeta(env, id, d, getCatalog) {
  if (!env.ANTHROPIC_API_KEY) throw new Error("no_anthropic");
  const text = d.segments.map((s) => s[2]).join(" ").toLowerCase() + " " + String(d.caption).toLowerCase();
  let items = [];
  try { items = ((await getCatalog(env)).items || []); } catch (e) {}
  const pick = items.filter((it) => { const w = String(it.n || "").toLowerCase().split(/\s+/)[0]; return (w.length > 3 && text.includes(w.slice(0, -1))) || /капсул/i.test(it.n) && SIGNS.some((s) => text.includes(s.toLowerCase().slice(0, 4)) && String(it.n).includes(s)); }).slice(0, 60)
    .map((it) => ({ id: it.id, n: it.n + (it.s ? " " + it.s : ""), c: it.c }));
  const prompt = `Ты редактор журнала gemstone.md (натуральные камни и астроминералогия, бренд GemStone, астролог Наталья). Из рилса Instagram сделай статью для сайта.
Правила: обращение на «Вы»; сила, а не боль; без обещаний «гарантированно/магически защитит»; без скидок. Факты — только из расшифровки и подписи.
Подпись к рилсу: ${JSON.stringify(String(d.caption).slice(0, 1500))}
${d.textMode ? "Голоса в ролике нет. Сегменты ниже — ТИТРЫ ИЗ КАДРА (текст на экране) с секундами" : "Расшифровка голоса (сегменты [начало, конец, текст])"}: ${JSON.stringify(d.segments)}
${!d.textMode && d.onscreen && d.onscreen.length ? "Текст в кадре (титры) с секундами: " + JSON.stringify(d.onscreen.slice(0, 60)) : ""}
${d.insight ? "Описание ролика по кадрам (из CRM): " + JSON.stringify(String(d.insight).slice(0, 1500)) : ""}
Изделия каталога, которые могут относиться к рилсу (id, название, категория): ${JSON.stringify(pick)}
Знаки: ${SIGNS.join(", ")}. Темы (topics): ${TOPICS.join(", ")}.
Верни ТОЛЬКО JSON без пояснений:
{"slug":"латиница-через-дефис, 2-6 слов по-русски транслитом","sign":"знак из списка или null","topics":["..."],
"stones":[{"n":"название камня по-русски","t":секунда первого упоминания,"d":"1 короткое предложение о свойстве камня из ролика"}],
"products":["id изделий из списка, которые прямо относятся к рилсу; максимум 4; [] если нет"],
"ru":{"title":"до 60 символов, поисковый","h1":"до 80 символов","answer":"2-3 предложения — прямой ответ на главный вопрос ролика","faq":[["вопрос","ответ"],["вопрос","ответ"],["вопрос","ответ"]],"segments":[[начало,конец,"текст исправленный: названия камней, пунктуация; для титров — связные фразы (пары «Хочу … — выбираю …» собирать вместе)"]]},
"ro":{...то же на румынском, segments — перевод каждого сегмента с теми же таймкодами},
"en":{...то же на английском, segments — перевод каждого сегмента с теми же таймкодами}}`;
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: env.CLAUDE_MODEL || "claude-sonnet-5-5", max_tokens: 12000, messages: [{ role: "user", content: prompt }] }) });
  const j = await r.json();
  if (!r.ok) throw new Error("claude_" + r.status + ":" + JSON.stringify(j.error || j).slice(0, 150));
  const raw = (j.content || []).map((c) => c.text || "").join("");
  const m = raw.indexOf("{"), n = raw.lastIndexOf("}");
  const meta = JSON.parse(raw.slice(m, n + 1));
  if (!meta.ru || !meta.ru.title || !Array.isArray(meta.ru.segments)) throw new Error("meta_incomplete");
  d.meta = meta;
  return "publish";
}
async function stepPublish(env, id, d) {
  const meta = d.meta, colors = (await env.MEDIA.get("journal/stone_colors.json").then((o) => (o ? o.json() : {}))) || {};
  const idx = (await env.MEDIA.get(IDX_KEY).then((o) => (o ? o.json() : []))) || [];
  if (idx.some((x) => String(x.media_id) === String(id))) return "done";
  let slug = slugify(meta.slug || meta.ru.title); const used = new Set(idx.map((x) => x.slug));
  for (let k = 2; used.has(slug); k++) slug = slugify(meta.slug || meta.ru.title) + "-" + k;
  const date = new Date(Number(d.ts) || Date.now()).toISOString().slice(0, 10);
  const poster = (await env.MEDIA.head(`reels/${id}/poster.jpg`)) ? `/media/reels/${id}/poster.jpg` : "";
  const sign = SIGNS.includes(meta.sign) ? meta.sign : null;
  const topics = (meta.topics || []).filter((t) => TOPICS.includes(t)); if (sign && !topics.includes("signs")) topics.unshift("signs");
  const lang = (x) => x && x.title && Array.isArray(x.segments) ? { title: x.title, h1: x.h1 || x.title, answer: x.answer || "", faq: Array.isArray(x.faq) ? x.faq : [], segments: x.segments } : null;
  const post = {
    slug, media_id: String(id), type: "reel", date, duration: d.duration || 0, width: 720, height: 1280,
    video: `/media/reels/${id}/v.mp4`, poster, ...(d.textMode ? { mute: true, captions: "onscreen" } : { audio: `/media/reels/${id}/voice.mp3` }), sign, topics: topics.length ? topics : ["stones"],
    products: (meta.products || []).slice(0, 4), stats: { views: 0, likes: d.likes || 0, comments: d.comments || 0 },
    stones: (meta.stones || []).map((s) => ({ n: s.n, t: Number(s.t) || 0, c: colors[s.n] || "#8f8a80", d: s.d || "" })),
    ru: lang(meta.ru), permalink: d.permalink || "", auto: true,
  };
  if (lang(meta.ro)) post.ro = lang(meta.ro);
  if (lang(meta.en)) post.en = lang(meta.en);
  await env.MEDIA.put(`journal/posts/${slug}.json`, JSON.stringify(post), { httpMetadata: { contentType: "application/json" } });
  idx.unshift({ slug, media_id: String(id), date, duration: post.duration, poster, topics: post.topics, products: post.products, stats: post.stats, sign,
    title: { ru: post.ru.title, ro: post.ro ? post.ro.title : post.ru.title, en: post.en ? post.en.title : post.ru.title } });
  await env.MEDIA.put(IDX_KEY, JSON.stringify(idx), { httpMetadata: { contentType: "application/json" } });
  const urls = ["", "/ro", "/en"].map((p) => `${BASE}${p}/journal/${slug}/`);
  await fetch("https://api.indexnow.org/indexnow", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ host: "gemstone.md", key: INDEXNOW_KEY, keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`, urlList: urls.concat([`${BASE}/journal/`, `${BASE}/sitemap-video.xml`]) }) }).catch(() => {});
  await owner(env, `📰 Новый пост на сайте (автоматически из Instagram):\n${post.ru.title}\n${urls[0]}\nЕсли что-то не так — напишите, поправлю или сниму.`);
  d.slug = slug;
  return "done";
}

export async function journalSync(env, getCatalog) {
  if (!env.ENGINE_DB || !env.MEDIA || !env.APP_DB || env.JOURNAL_SYNC === "0") return;
  await ensure(env);
  const now = Date.now();
  if (new Date(now).getUTCMinutes() % 10 === 0) await discover(env);
  const job = await env.APP_DB.prepare("SELECT * FROM jsync WHERE status NOT IN ('done','skipped','failed') AND (tries<5) ORDER BY created_at ASC LIMIT 1").first();
  if (!job) return;
  if (job.err && now - job.updated_at < job.tries * 120000) return; // пауза перед повтором после ошибки
  if (job.status === "text" && /"waitInsight"/.test(job.data || "") && now - job.updated_at < 10 * 60000) return; // ждём разбор CRM
  let d = {}; try { d = JSON.parse(job.data || "{}"); } catch {}
  const steps = { new: stepFetch, fetch: stepFetch, voice: stepVoice, text: stepText, meta: (e, i, dd) => stepMeta(e, i, dd, getCatalog), publish: stepPublish };
  try {
    const next = await steps[job.status](env, job.media_id, d);
    await setJob(env, job.media_id, next, d, null);
    if (next === "skipped") await owner(env, `ℹ️ Рилс ${d.permalink || job.media_id} не перенесён на сайт: в нём почти нет голоса (${d.words || 0} слов).`);
  } catch (e) {
    const m = String(e.message || e).slice(0, 300);
    console.error("journal sync", job.media_id, job.status, m);
    await setJob(env, job.media_id, job.tries >= 4 ? "failed" : job.status, d, m);
    if (job.tries >= 4) await owner(env, `⚠️ Рилс ${d.permalink || job.media_id} не удалось перенести на сайт (шаг ${job.status}): ${m}`);
  }
}
