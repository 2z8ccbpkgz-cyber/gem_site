// Личный кабинет «Мой космос» — этап E1: вход (e-mail код + Telegram Login Widget), сессии, профиль, дневник ритуала.
// Хранилище: D1 APP_DB (база gemstone-app). CRM_DB не затрагивается.
// Секреты/переменные: AUTH_PEPPER (секрет, обязателен), TG_BOT_TOKEN (секрет, необязателен — без него кнопка Telegram скрыта),
// TG_LOGIN_BOT (имя бота без @), MAIL_MODE ("log" — только для стенда), MAIL_FROM, биндинг EMAIL (Cloudflare Email Sending).
// Оплаты в этот этап не входят.

import { createPay, payStatus, myOrders, fillFromBot, prices, myReport, aiAsk, aiState, adminPrices, isAdmin } from "./payments.js";
const SESSION_DAYS = 30;
const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_MAX_ATTEMPTS = 5;
export const CONSENT_VERSION = "birth-2026-11-23";
const COOKIE = "gs_s";

const enc = new TextEncoder();

/* ───────────── утилиты ───────────── */
export const jres = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", ...extra } });

async function sha256hex(s) {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
// сравнение строк за постоянное время (длина учитывается, но она у хешей фиксирована)
function ctEq(a, b) {
  a = String(a); b = String(b);
  let x = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) x |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return x === 0;
}
const b64u = (u8) => btoa(String.fromCharCode(...u8)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const randToken = () => b64u(crypto.getRandomValues(new Uint8Array(32)));
// 6 цифр без смещения: отбрасываем значения выше наибольшего кратного 1e6
function randCode() {
  const lim = 4294000000; // кратно 1_000_000
  const a = new Uint32Array(1);
  do { crypto.getRandomValues(a); } while (a[0] >= lim);
  return String(a[0] % 1000000).padStart(6, "0");
}
const clean = (s, max) => String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const EMAIL_RE = /^[^\s@<>"',;:()[\]\\]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
export const LANGS = ["ru", "ro", "en"];
const okLang = (l) => (LANGS.includes(l) ? l : "ru");

function getCookie(request, name) {
  const c = request.headers.get("cookie") || "";
  for (const part of c.split(/;\s*/)) { const i = part.indexOf("="); if (i > 0 && part.slice(0, i) === name) return part.slice(i + 1); }
  return null;
}
const setCookie = (token) => `${COOKIE}=${token}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`;
const clearCookie = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

/* ───────────── схема D1 (идемпотентные миграции) ───────────── */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, telegram_id TEXT UNIQUE, tg_username TEXT, name TEXT, lang TEXT, birth_date TEXT, birth_time TEXT, birth_place TEXT, created_at INTEGER NOT NULL, last_login_at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, account_id INTEGER NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, ua TEXT)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id)`,
  `CREATE TABLE IF NOT EXISTS login_codes (email TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_codes_email ON login_codes(email)`,
  `CREATE TABLE IF NOT EXISTS consents (account_id INTEGER NOT NULL, kind TEXT NOT NULL, version TEXT NOT NULL, at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_consents_account ON consents(account_id, kind)`,
  // лимиты запросов (окно считается в D1, чтобы работали между изолятами)
  `CREATE TABLE IF NOT EXISTS rate_limits (k TEXT PRIMARY KEY, n INTEGER NOT NULL, reset_at INTEGER NOT NULL)`,
  // дневник ритуала/намерений: одна запись на аккаунт в день
  `CREATE TABLE IF NOT EXISTS journal_entries (account_id INTEGER NOT NULL, day TEXT NOT NULL, intention TEXT, ritual_done INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL, PRIMARY KEY (account_id, day))`,
];
const MIGRATED = new WeakSet();
export async function ensureSchema(env) {
  const db = env.APP_DB;
  if (MIGRATED.has(db)) return;
  await db.batch(SCHEMA.map((s) => db.prepare(s)));
  for (const c of ["contact_ig TEXT", "contact_tg TEXT", "notify_ok INTEGER", "currency TEXT"]) { try { await db.prepare("ALTER TABLE accounts ADD COLUMN " + c).run(); } catch {} }
  MIGRATED.add(db);
}

/* ───────────── лимиты ───────────── */
// true — можно; false — лимит исчерпан. Счётчик увеличивается атомарно одним запросом.
async function rateOk(env, key, limit, windowSec) {
  const now = Date.now(), reset = now + windowSec * 1000;
  const r = await env.APP_DB.prepare(
    `INSERT INTO rate_limits(k,n,reset_at) VALUES(?,1,?) ON CONFLICT(k) DO UPDATE SET n=CASE WHEN reset_at<=? THEN 1 ELSE n+1 END, reset_at=CASE WHEN reset_at<=? THEN ? ELSE reset_at END RETURNING n`
  ).bind(key, reset, now, now, reset).first();
  return !!r && r.n <= limit;
}
const ipKey = async (request, env) => (await sha256hex((env.AUTH_PEPPER || "") + "|ip|" + (request.headers.get("cf-connecting-ip") || "0"))).slice(0, 24);

/* ───────────── письма ───────────── */
const MAIL_T = {
  ru: { s: "Код входа в Gemstone.md", h: "Ваш код входа", b: "Введите его на странице личного кабинета. Код действует 10 минут. Если Вы не запрашивали вход — просто проигнорируйте письмо." },
  ro: { s: "Codul de autentificare Gemstone.md", h: "Codul dvs. de autentificare", b: "Introduceți-l în cabinetul personal. Codul este valabil 10 minute. Dacă nu ați cerut autentificarea, ignorați mesajul." },
  en: { s: "Your Gemstone.md sign-in code", h: "Your sign-in code", b: "Enter it on your account page. The code is valid for 10 minutes. If you did not request it, just ignore this email." },
};
// Интерфейс отправки: sendMail(env, {to, lang, code}) → true/false.
// Режимы: binding (Cloudflare Email Sending, биндинг EMAIL) — по умолчанию; log — только стенд (письмо кладётся в globalThis.__MAILBOX, в журнал не пишется).
export async function sendMail(env, { to, lang, code }) {
  const t = MAIL_T[okLang(lang)];
  const text = `${t.h}: ${code}\n\n${t.b}\n\nGemstone.md`;
  const html = `<div style="font-family:Arial,sans-serif;color:#13161a;max-width:480px"><p style="font-size:15px">${t.h}</p><p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:12px 0">${code}</p><p style="font-size:14px;color:#555">${t.b}</p><p style="font-size:13px;color:#888">Gemstone.md</p></div>`;
  if (env.MAIL_MODE === "log") {
    if (Array.isArray(globalThis.__MAILBOX)) globalThis.__MAILBOX.push({ to, subject: t.s, text, code });
    return true;
  }
  if (!env.EMAIL || typeof env.EMAIL.send !== "function") return false;
  try {
    await env.EMAIL.send({ to, from: { email: env.MAIL_FROM || "noreply@gemstone.md", name: "Gemstone.md" }, subject: t.s, text, html });
    return true;
  } catch (e) {
    console.error("mail send failed", e && e.code ? String(e.code) : "error"); // без адреса и кода
    return false;
  }
}

/* ───────────── сессии ───────────── */
async function pepperOk(env) { return !!(env.AUTH_PEPPER && env.AUTH_PEPPER.length >= 16 && env.APP_DB); }
const hashCode = (env, email, code) => sha256hex(`${env.AUTH_PEPPER}|code|${email}|${code}`);
const hashToken = (env, token) => sha256hex(`${env.AUTH_PEPPER}|sess|${token}`);

async function createSession(env, request, accountId) {
  const token = randToken(), now = Date.now();
  await env.APP_DB.prepare("INSERT INTO sessions(token_hash,account_id,created_at,expires_at,ua) VALUES(?,?,?,?,?)")
    .bind(await hashToken(env, token), accountId, now, now + SESSION_DAYS * 86400000, clean(request.headers.get("user-agent"), 120)).run();
  // фоновая уборка просроченного
  await env.APP_DB.batch([
    env.APP_DB.prepare("DELETE FROM sessions WHERE expires_at<?").bind(now),
    env.APP_DB.prepare("DELETE FROM login_codes WHERE expires_at<?").bind(now),
    env.APP_DB.prepare("DELETE FROM rate_limits WHERE reset_at<?").bind(now),
  ]);
  return token;
}
async function getSession(request, env) {
  const token = getCookie(request, COOKIE);
  if (!token || token.length > 80 || !(await pepperOk(env))) return null;
  const row = await env.APP_DB.prepare(
    "SELECT a.* FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>?"
  ).bind(await hashToken(env, token), Date.now()).first();
  return row ? { account: row, tokenHash: await hashToken(env, token) } : null;
}

/* ───────────── CSRF ───────────── */
// SameSite=Lax + обязательный Origin своего хоста + JSON content-type для всех изменяющих запросов
function csrfBad(request, url) {
  const o = request.headers.get("origin");
  if (!o || o !== url.origin) return true;
  const ct = request.headers.get("content-type") || "";
  return !/^application\/json/i.test(ct);
}
async function body(request) {
  try { const t = await request.text(); if (t.length > 4000) return null; const j = JSON.parse(t); return j && typeof j === "object" ? j : null; } catch { return null; }
}

/* ───────────── аккаунт → публичный вид ───────────── */
async function consentState(env, id) {
  const r = await env.APP_DB.prepare("SELECT version FROM consents WHERE account_id=? AND kind='birth_data' ORDER BY at DESC, rowid DESC LIMIT 1").bind(id).first();
  return r && r.version !== "revoked" ? r.version : null;
}
async function publicAccount(env, a) {
  return {
    email: a.email || null, tg: a.telegram_id ? { username: a.tg_username || null } : null, name: a.name || "", lang: okLang(a.lang),
    birth_date: a.birth_date || "", birth_time: a.birth_time || "", birth_place: a.birth_place || "", instagram: a.contact_ig || "", telegram: a.contact_tg || a.tg_username || "", currency: a.currency || "",
    consent: await consentState(env, a.id), consent_version: CONSENT_VERSION,
  };
}

/* ───────────── Telegram Login Widget ───────────── */
// https://core.telegram.org/widgets/login#checking-authorization
export async function verifyTelegram(data, botToken, nowSec = Math.floor(Date.now() / 1000)) {
  if (!data || typeof data !== "object" || !botToken || typeof data.hash !== "string" || !/^[0-9a-f]{64}$/.test(data.hash)) return false;
  const pairs = [];
  for (const k of Object.keys(data).sort()) {
    if (k === "hash") continue;
    const v = data[k];
    if (v === null || v === undefined || typeof v === "object") return false;
    pairs.push(`${k}=${v}`);
  }
  const key = await crypto.subtle.digest("SHA-256", enc.encode(botToken));
  const ck = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", ck, enc.encode(pairs.join("\n"))));
  const hex = [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (!ctEq(hex, data.hash)) return false;
  const ad = Number(data.auth_date);
  return Number.isFinite(ad) && ad <= nowSec + 60 && nowSec - ad <= 86400;
}

/* ───────────── быстрая регистрация: имя + данные рождения (+ ник для уведомлений), без почты ───────────── */
const nick = (s) => { const v = clean(s, 40).replace(/^@+/, "").replace(/^https?:\/\/(www\.)?(instagram\.com|t\.me)\//i, "").replace(/[/?#].*$/, ""); return /^[A-Za-z0-9._]{2,32}$/.test(v) ? v : ""; };
async function quickStart(request, env) {
  const b = await body(request); if (!b) return jres({ ok: false, error: "bad_request" }, 400);
  const ik = await ipKey(request, env);
  if (!(await rateOk(env, "ip-q:" + ik, 10, 3600))) return jres({ ok: false, error: "rate" }, 429);
  const name = clean(b.name, 60), place = clean(b.birth_place, 100), lang = okLang(b.lang);
  const date = typeof b.birth_date === "string" ? b.birth_date.trim() : "", time = typeof b.birth_time === "string" ? b.birth_time.trim() : "";
  if (!name) return jres({ ok: false, error: "need_name" }, 400);
  if (!validDate(date)) return jres({ ok: false, error: "bad_date" }, 400);
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return jres({ ok: false, error: "bad_time" }, 400);
  if (b.consent !== true) return jres({ ok: false, error: "consent_required" }, 400);
  const ig = nick(b.instagram), tg = nick(b.telegram), now = Date.now(), cur = ["MDL", "EUR", "RUB"].includes(b.currency) ? b.currency : null;
  const sess = await getSession(request, env);
  let id;
  if (sess) { id = sess.account.id; await env.APP_DB.prepare("UPDATE accounts SET name=?, lang=?, birth_date=?, birth_time=?, birth_place=?, contact_ig=COALESCE(?,contact_ig), contact_tg=COALESCE(?,contact_tg) WHERE id=?").bind(name, lang, date, time || null, place || null, ig || null, tg || null, id).run(); }
  else { const r = await env.APP_DB.prepare("INSERT INTO accounts(name,lang,currency,birth_date,birth_time,birth_place,contact_ig,contact_tg,notify_ok,created_at,last_login_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) RETURNING id").bind(name, lang, cur, date, time || null, place || null, ig || null, tg || null, ig || tg ? 1 : 0, now, now).first(); id = r.id; }
  await env.APP_DB.prepare("INSERT INTO consents(account_id,kind,version,at) VALUES(?,?,?,?)").bind(id, "birth_data", CONSENT_VERSION, now).run();
  if (sess) return jres({ ok: true });
  const token = await createSession(env, request, id);
  return jres({ ok: true }, 200, { "set-cookie": setCookie(token) });
}

/* ───────────── обработчики API ───────────── */
async function emailStart(request, env, url) {
  const b = await body(request);
  const email = b && typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return jres({ ok: false, error: "bad_email" }, 400);
  const lang = okLang(b.lang);
  const ek = (await sha256hex(env.AUTH_PEPPER + "|em|" + email)).slice(0, 24);
  const ik = await ipKey(request, env);
  if (!(await rateOk(env, "ip-s:" + ik, 20, 3600))) return jres({ ok: false, error: "rate" }, 429);
  if (!(await rateOk(env, "em-m:" + ek, 1, 60))) return jres({ ok: false, error: "too_soon", retry: 60 }, 429);
  if (!(await rateOk(env, "em-d:" + ek, 10, 86400))) return jres({ ok: false, error: "rate" }, 429);
  const code = randCode(), now = Date.now();
  // один действующий код на адрес
  await env.APP_DB.batch([
    env.APP_DB.prepare("DELETE FROM login_codes WHERE email=?").bind(email),
    env.APP_DB.prepare("INSERT INTO login_codes(email,code_hash,expires_at,attempts,created_at) VALUES(?,?,?,0,?)").bind(email, await hashCode(env, email, code), now + CODE_TTL_MS, now),
  ]);
  if (!(await sendMail(env, { to: email, lang, code }))) {
    await env.APP_DB.prepare("DELETE FROM login_codes WHERE email=?").bind(email).run();
    return jres({ ok: false, error: "mail_unavailable" }, 503);
  }
  return jres({ ok: true, ttl: CODE_TTL_MS / 1000 });
}

async function emailVerify(request, env, url) {
  const b = await body(request);
  const email = b && typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const code = b && typeof b.code === "string" ? b.code.replace(/\s/g, "") : "";
  if (!EMAIL_RE.test(email) || email.length > 254 || !/^\d{6}$/.test(code)) return jres({ ok: false, error: "bad_code" }, 400);
  const ik = await ipKey(request, env);
  if (!(await rateOk(env, "ip-v:" + ik, 30, 3600))) return jres({ ok: false, error: "rate" }, 429);
  const now = Date.now();
  // атомарно «тратим» попытку и получаем хеш эталона — параллельные подборы не обходят лимит 5
  const row = await env.APP_DB.prepare(
    "UPDATE login_codes SET attempts=attempts+1 WHERE email=? AND expires_at>? AND attempts<? RETURNING code_hash, attempts"
  ).bind(email, now, CODE_MAX_ATTEMPTS).first();
  if (!row) return jres({ ok: false, error: "code_expired" }, 400);
  const good = ctEq(await hashCode(env, email, code), row.code_hash);
  if (!good) return jres({ ok: false, error: row.attempts >= CODE_MAX_ATTEMPTS ? "locked" : "wrong_code", left: Math.max(0, CODE_MAX_ATTEMPTS - row.attempts) }, 400);
  // одноразовый: удаляем, если успели — значит мы первые
  const del = await env.APP_DB.prepare("DELETE FROM login_codes WHERE email=? AND code_hash=? RETURNING 1 AS x").bind(email, row.code_hash).first();
  if (!del) return jres({ ok: false, error: "code_expired" }, 400);
  const acc = await env.APP_DB.prepare(
    "INSERT INTO accounts(email,lang,created_at,last_login_at) VALUES(?,?,?,?) ON CONFLICT(email) DO UPDATE SET last_login_at=excluded.last_login_at RETURNING id"
  ).bind(email, okLang(b.lang), now, now).first();
  const token = await createSession(env, request, acc.id);
  return jres({ ok: true }, 200, { "set-cookie": setCookie(token) });
}

async function telegramAuth(request, env) {
  if (!env.TG_BOT_TOKEN) return jres({ ok: false, error: "tg_disabled" }, 404);
  const b = await body(request);
  if (!b) return jres({ ok: false, error: "bad_request" }, 400);
  const link = b.link === true; delete b.link;
  const lang = okLang(b.lang); delete b.lang;
  return tgCore(request, env, b, link, lang);
}

// Вход через Telegram в режиме перенаправления (data-auth-url): работает и там, где всплывающее окно виджета
// не может вернуть данные в страницу (мобильные браузеры, встроенные браузеры приложений).
async function telegramCallback(request, env, url) {
  const lang = okLang(url.searchParams.get("lang"));
  const base = (lang === "ru" ? "" : "/" + lang) + "/kabinet/";
  const go = (q, cookie) => new Response(null, { status: 302, headers: Object.assign({ location: base + (q || ""), "cache-control": "no-store" }, cookie ? { "set-cookie": cookie } : {}) });
  if (!env.TG_BOT_TOKEN) return go("?tg=off");
  const b = {};
  for (const k of ["id", "first_name", "last_name", "username", "photo_url", "auth_date", "hash"]) { const v = url.searchParams.get(k); if (v !== null) b[k] = v; }
  const link = url.searchParams.get("link") === "1";
  const r = await tgCore(request, env, b, link, lang);
  const j = await r.clone().json().catch(() => ({}));
  if (!j.ok) return go("?tg=" + encodeURIComponent(j.error || "err"));
  return go(link ? "?tg=linked" : "", r.headers.get("set-cookie"));
}

async function tgCore(request, env, b, link, lang) {
  if (!(await verifyTelegram(b, env.TG_BOT_TOKEN))) return jres({ ok: false, error: "bad_hash" }, 401);
  const tid = String(b.id || "");
  if (!/^\d{1,20}$/.test(tid)) return jres({ ok: false, error: "bad_request" }, 400);
  // защита от повторного предъявления той же подписи (в пределах суток)
  if (!(await rateOk(env, "tg-h:" + b.hash.slice(0, 32), 1, 86400))) return jres({ ok: false, error: "replay" }, 401);
  const uname = clean(b.username, 40) || null, now = Date.now();
  const sess = await getSession(request, env);
  if (link) {
    if (!sess) return jres({ ok: false, error: "auth" }, 401);
    const other = await env.APP_DB.prepare("SELECT id FROM accounts WHERE telegram_id=?").bind(tid).first();
    if (other && other.id !== sess.account.id) return jres({ ok: false, error: "tg_taken" }, 409);
    await env.APP_DB.prepare("UPDATE accounts SET telegram_id=?, tg_username=? WHERE id=?").bind(tid, uname, sess.account.id).run();
    await fillFromBot(env, sess.account.id, tid);
    return jres({ ok: true, linked: true });
  }
  const acc = await env.APP_DB.prepare(
    "INSERT INTO accounts(telegram_id,tg_username,name,lang,created_at,last_login_at) VALUES(?,?,?,?,?,?) ON CONFLICT(telegram_id) DO UPDATE SET tg_username=excluded.tg_username, last_login_at=excluded.last_login_at RETURNING id"
  ).bind(tid, uname, clean(b.first_name, 60) || null, lang, now, now).first();
  await fillFromBot(env, acc.id, tid);
  const token = await createSession(env, request, acc.id);
  return jres({ ok: true }, 200, { "set-cookie": setCookie(token) });
}

async function logout(request, env) {
  const sess = await getSession(request, env);
  if (sess) await env.APP_DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(sess.tokenHash).run();
  return jres({ ok: true }, 200, { "set-cookie": clearCookie() });
}

function validDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (y < 1900 || y > new Date().getUTCFullYear()) return false;
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d && t.getTime() <= Date.now() + 86400000;
}

async function profileSave(request, env, sess) {
  const b = await body(request);
  if (!b) return jres({ ok: false, error: "bad_request" }, 400);
  const a = sess.account, id = a.id;
  const name = clean(b.name, 60), place = clean(b.birth_place, 100);
  const date = typeof b.birth_date === "string" ? b.birth_date.trim() : "", time = typeof b.birth_time === "string" ? b.birth_time.trim() : "";
  const lang = b.lang === undefined ? okLang(a.lang) : (LANGS.includes(b.lang) ? b.lang : null);
  if (!lang) return jres({ ok: false, error: "bad_lang" }, 400);
  if (date && !validDate(date)) return jres({ ok: false, error: "bad_date" }, 400);
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return jres({ ok: false, error: "bad_time" }, 400);
  const hasBirth = !!(date || time || place);
  const had = await consentState(env, id);
  const now = Date.now();
  if (hasBirth && b.consent !== false && b.consent !== true && !had) return jres({ ok: false, error: "consent_required" }, 400);
  const stmts = [];
  if (b.consent === false) {
    // согласие отозвано → данные рождения удаляются
    stmts.push(env.APP_DB.prepare("UPDATE accounts SET name=?, lang=?, birth_date=NULL, birth_time=NULL, birth_place=NULL WHERE id=?").bind(name || null, lang, id));
    if (had) stmts.push(env.APP_DB.prepare("INSERT INTO consents(account_id,kind,version,at) VALUES(?,?,?,?)").bind(id, "birth_data", "revoked", now));
  } else {
    stmts.push(env.APP_DB.prepare("UPDATE accounts SET name=?, lang=?, birth_date=?, birth_time=?, birth_place=? WHERE id=?").bind(name || null, lang, date || null, time || null, place || null, id));
    if (b.consent === true && had !== CONSENT_VERSION) stmts.push(env.APP_DB.prepare("INSERT INTO consents(account_id,kind,version,at) VALUES(?,?,?,?)").bind(id, "birth_data", CONSENT_VERSION, now));
  }
  if (["MDL", "EUR", "RUB"].includes(b.currency)) stmts.push(env.APP_DB.prepare("UPDATE accounts SET currency=? WHERE id=?").bind(b.currency, id));
  if (b.instagram !== undefined || b.telegram !== undefined) stmts.push(env.APP_DB.prepare("UPDATE accounts SET contact_ig=?, contact_tg=? WHERE id=?").bind(nick(b.instagram) || null, nick(b.telegram) || null, id));
  await env.APP_DB.batch(stmts);
  const fresh = await env.APP_DB.prepare("SELECT * FROM accounts WHERE id=?").bind(id).first();
  return jres({ ok: true, account: await publicAccount(env, fresh) });
}

const dayRe = /^\d{4}-\d{2}-\d{2}$/;
async function journalGet(env, sess) {
  const r = await env.APP_DB.prepare("SELECT day, intention, ritual_done FROM journal_entries WHERE account_id=? ORDER BY day DESC LIMIT 30").bind(sess.account.id).all();
  return jres({ ok: true, entries: (r.results || []).map((e) => ({ day: e.day, text: e.intention || "", ritual: !!e.ritual_done })) });
}
async function journalPut(request, env, sess) {
  const b = await body(request);
  if (!b || typeof b.day !== "string" || !dayRe.test(b.day)) return jres({ ok: false, error: "bad_day" }, 400);
  // день клиента (его часовой пояс) может отличаться от UTC не больше чем на сутки
  const t = Date.parse(b.day + "T12:00:00Z");
  if (!Number.isFinite(t) || Math.abs(t - Date.now()) > 36 * 3600 * 1000) return jres({ ok: false, error: "bad_day" }, 400);
  const text = clean(b.text, 500), ritual = b.ritual === true ? 1 : 0;
  if (!text && !ritual) return jres({ ok: false, error: "empty" }, 400);
  await env.APP_DB.prepare(
    "INSERT INTO journal_entries(account_id,day,intention,ritual_done,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(account_id,day) DO UPDATE SET intention=excluded.intention, ritual_done=excluded.ritual_done, updated_at=excluded.updated_at"
  ).bind(sess.account.id, b.day, text || null, ritual, Date.now()).run();
  return journalGet(env, sess);
}
async function deleteAccount(env, sess) {
  const id = sess.account.id;
  await env.APP_DB.batch(["sessions", "consents", "journal_entries"].map((t) => env.APP_DB.prepare(`DELETE FROM ${t} WHERE account_id=?`).bind(id)).concat([env.APP_DB.prepare("DELETE FROM accounts WHERE id=?").bind(id)]));
  return jres({ ok: true }, 200, { "set-cookie": clearCookie() });
}

/* ───────────── роутер API ───────────── */
export function isKabinetApi(p) { return p.startsWith("/api/auth/") || p === "/api/me" || p.startsWith("/api/me/"); }

export async function handleKabinetApi(request, env, ctx) {
  const url = new URL(request.url), p = url.pathname, m = request.method;
  try {
    if (!(await pepperOk(env))) return jres({ ok: false, error: "not_configured" }, 503);
    await ensureSchema(env);
    if (m !== "GET" && m !== "HEAD" && csrfBad(request, url)) return jres({ ok: false, error: "csrf" }, 403);
    if (p === "/api/auth/email/start" && m === "POST") return await emailStart(request, env, url);
    if (p === "/api/auth/email/verify" && m === "POST") return await emailVerify(request, env, url);
    if (p === "/api/auth/telegram" && m === "POST") return await telegramAuth(request, env);
    if (p === "/api/auth/telegram/cb" && m === "GET") return await telegramCallback(request, env, url);
    if (p === "/api/auth/logout" && m === "POST") return await logout(request, env);
    if (p === "/api/auth/quick" && m === "POST") return await quickStart(request, env);
    if (p === "/api/me/prices" && m === "GET") return jres({ ok: true, prices: await prices(env), wata: env.WATA_ENABLED === "1" && !!env.WATA_ACCESS_TOKEN });
    if (p === "/api/me" || p.startsWith("/api/me/")) {
      const sess = await getSession(request, env);
      if (!sess) return jres({ ok: false, error: "auth" }, 401);
      if (p === "/api/me" && m === "GET") return jres({ ok: true, account: Object.assign(await publicAccount(env, sess.account), isAdmin(env, sess.account) ? { admin: true } : {}) });
      if (p === "/api/me" && m === "PUT") return await profileSave(request, env, sess);
      if (p === "/api/me/journal" && m === "GET") return await journalGet(env, sess);
      if (p === "/api/me/journal" && m === "PUT") return await journalPut(request, env, sess);
      if (p === "/api/me/delete" && m === "POST") return await deleteAccount(env, sess);
      if (p === "/api/me/pay" && m === "POST") { const b = await body(request); if (!b) return jres({ ok: false, error: "bad_request" }, 400); return await createPay(request, env, sess, b); }
      if (p === "/api/me/pay/status" && m === "GET") return await payStatus(env, sess, parseInt(url.searchParams.get("id"), 10) || 0);
      if (p === "/api/me/orders" && m === "GET") return await myOrders(env, sess);
      if (p === "/api/me/report" && m === "GET") return await myReport(env, sess, parseInt(url.searchParams.get("id"), 10) || 0);
      if (p === "/api/me/admin/prices" && m === "GET") return await adminPrices(env, sess, null);
      if (p === "/api/me/admin/prices" && m === "PUT") { const b = await body(request); if (!b) return jres({ ok: false, error: "bad_request" }, 400); return await adminPrices(env, sess, b); }
      if (p === "/api/me/ai" && m === "GET") return await aiState(env, sess);
      if (p === "/api/me/ai" && m === "POST") { const b = await body(request); if (!b) return jres({ ok: false, error: "bad_request" }, 400); return await aiAsk(env, sess, b); }
    }
    return jres({ ok: false, error: "not_found" }, 404);
  } catch (e) {
    console.error("kabinet api", String(e && e.message ? e.message : e).slice(0, 200)); // без персональных данных
    return jres({ ok: false, error: "server" }, 500);
  }
}
