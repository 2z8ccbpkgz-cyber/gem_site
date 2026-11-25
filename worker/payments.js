// payments.js — оплата услуг в кабинете gemstone.md + независимый «сторож» платежей (23.11.2026).
// Повторяет логику бота @gemstone_md_bot (src/services/paynet.py, wata.py, pricing*.py) без изменений в самом боте:
//  • PayNet (лей; Visa/Mastercard): /auth → /api/Payments/Send, статус — GET /api/Payments?Invoice= (Status 4 = оплачен);
//  • WATA (₽): POST /links, статус — GET /v2/transactions?OrderId= (status "Paid");
//  • цены — копия таблиц бота service_prices (EUR, скидка до даты) и service_prices_rub; MDL = EUR × 20 (EUR_TO_MDL_RATE бота);
//  • номер счёта PayNet уникален: случайный в [1e9, 2^31−1], проверяется по счетам бота, сайта и у самого PayNet;
//  • вебхуки PayNet/WATA остаются на Railway (для чужого счёта бот только пишет строку в лог) — сайт подтверждает оплату опросом
//    (Cron раз в минуту + проверка при возврате клиента), поэтому не зависит ни от Telegram, ни от Railway.
// При оплате: атомарно pending → paid, запись в CRM (клиент + заказ «reserved», оплачено), сообщение в группу продаж,
// уведомление клиенту в Telegram (если вход через Telegram) и на почту.

const PAYNET_API = "https://paynet.md:4448";
const WATA_API = "https://api.wata.pro/api/h2h";
const EUR_TO_MDL = 20;
const SITE = "https://gemstone.md";

export const SERVICES = {
  natal_chart:    { ru: "Натальная карта", code: "NATAL_COMPLETE", birth: 1 },
  forecast_month: { ru: "Прогноз на 1 месяц", code: "FORECAST_MONTH", birth: 1 },
  forecast_year:  { ru: "Прогноз на 12 месяцев", code: "FORECAST_YEAR", birth: 1 },
  compatibility:  { ru: "Совместимость", code: "COMPATIBILITY", birth: 2 },
  soul_code:      { ru: "Код Души", code: "SOUL_CODE", birth: 1 },
  // ai_consultant — на сайте пока не продаётся (решение владельца 23.11); обработчики оставлены выключенными
};

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS site_orders(
     id INTEGER PRIMARY KEY AUTOINCREMENT, account_id INTEGER NOT NULL, telegram_id TEXT, service TEXT NOT NULL,
     provider TEXT NOT NULL, amount REAL NOT NULL, currency TEXT NOT NULL, amount_eur REAL,
     invoice_id INTEGER UNIQUE, paynet_payment_id TEXT, wata_order_id TEXT UNIQUE, wata_link_id TEXT, pay_url TEXT,
     status TEXT NOT NULL DEFAULT 'pending', data TEXT, contact TEXT, lang TEXT,
     created_at INTEGER NOT NULL, paid_at INTEGER, checked_at INTEGER, checks INTEGER DEFAULT 0,
     crm_order_id INTEGER, notified_at INTEGER, last_error TEXT, pn_signature TEXT, pn_expiry TEXT, go_key TEXT)`,
  "CREATE INDEX IF NOT EXISTS ix_site_orders_acc ON site_orders(account_id)",
  "CREATE TABLE IF NOT EXISTS site_prices(service_key TEXT PRIMARY KEY, mdl REAL NOT NULL, eur REAL NOT NULL, rub REAL, active INTEGER NOT NULL DEFAULT 1, updated_at INTEGER)",
  "CREATE TABLE IF NOT EXISTS ai_credits(account_id INTEGER PRIMARY KEY, left INTEGER NOT NULL DEFAULT 0, updated_at INTEGER)",
  "CREATE TABLE IF NOT EXISTS ai_history(id INTEGER PRIMARY KEY AUTOINCREMENT, account_id INTEGER NOT NULL, q TEXT, a TEXT, at INTEGER)",
  "CREATE INDEX IF NOT EXISTS ix_site_orders_st ON site_orders(status, created_at)",
];
let schemaOk = false;
async function ensure(env) {
  if (schemaOk) return;
  await env.APP_DB.batch(SCHEMA.map((s) => env.APP_DB.prepare(s)));
  schemaOk = true;
}

const jr = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const cl = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

/* ───────── цены: собственный справочник сайта (правится в кабинете админом) ─────────
   Начальные значения 23.11.2026: EUR — дефолты бота (pricing._DEFAULTS), лей = EUR × 20 (EUR_TO_MDL_RATE бота),
   ₽ — таблица бота service_prices_rub. Каждая валюта хранится отдельно: что стоит в справочнике — то и в счёте. */
const SEED = { natal_chart: [1500, 75, 5500], forecast_month: [400, 20, 1700], forecast_year: [1000, 50, 6700], compatibility: [500, 25, 5000], soul_code: [400, 20, 5000] };
export async function prices(env) {
  await ensure(env);
  let r = await env.APP_DB.prepare("SELECT service_key k, mdl, eur, rub, active FROM site_prices").all();
  if (!(r.results || []).length) {
    const now = Date.now();
    await env.APP_DB.batch(Object.entries(SEED).map(([k, v]) => env.APP_DB.prepare("INSERT OR IGNORE INTO site_prices(service_key,mdl,eur,rub,active,updated_at) VALUES(?,?,?,?,1,?)").bind(k, v[0], v[1], v[2], now)));
    r = await env.APP_DB.prepare("SELECT service_key k, mdl, eur, rub, active FROM site_prices").all();
  }
  const out = {};
  for (const x of r.results || []) if (SERVICES[x.k] && x.active) out[x.k] = { mdl: x.mdl, eur: x.eur, rub: x.rub || null };
  return out;
}
export const isAdmin = (env, a) => {
  const ids = String(env.ADMIN_TG_IDS || "234491691").split(/[,\s]+/), em = String(env.ADMIN_EMAILS || "").toLowerCase().split(/[,\s]+/);
  return !!(a && ((a.telegram_id && ids.includes(String(a.telegram_id))) || (a.email && em.includes(String(a.email).toLowerCase()))));
};
export async function adminPrices(env, sess, b) {
  if (!isAdmin(env, sess.account)) return jr({ ok: false, error: "forbidden" }, 403);
  await prices(env);
  if (b) {
    const now = Date.now(), st = [];
    for (const k of Object.keys(SERVICES)) {
      const v = b[k]; if (!v) continue;
      const n = (x, max) => { const f = Math.round(Number(x) * 100) / 100; return f > 0 && f <= max ? f : null; };
      const mdl = n(v.mdl, 100000), eur = n(v.eur, 5000), rub = v.rub === "" || v.rub == null ? null : n(v.rub, 500000);
      if (!mdl || !eur) return jr({ ok: false, error: "bad_price", key: k }, 400);
      st.push(env.APP_DB.prepare("INSERT INTO site_prices(service_key,mdl,eur,rub,active,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(service_key) DO UPDATE SET mdl=excluded.mdl, eur=excluded.eur, rub=excluded.rub, active=excluded.active, updated_at=excluded.updated_at").bind(k, mdl, eur, rub, v.active === false ? 0 : 1, now));
    }
    if (st.length) await env.APP_DB.batch(st);
  }
  const r = await env.APP_DB.prepare("SELECT service_key k, mdl, eur, rub, active, updated_at FROM site_prices").all();
  return jr({ ok: true, prices: r.results || [] });
}

/* ───────── PayNet ───────── */
let PN_TOKEN = null, PN_EXP = 0, LAST_PN = "";
async function pnToken(env) {
  if (PN_TOKEN && Date.now() < PN_EXP - 300000) return PN_TOKEN;
  const f = new URLSearchParams({ grant_type: "password", username: env.PAYNET_MERCHANT_USER, password: env.PAYNET_MERCHANT_PASSWORD, merchantcode: env.PAYNET_MERCHANT_CODE });
  if (env.PAYNET_SALE_AREA) f.set("salearea", env.PAYNET_SALE_AREA);
  const r = await fetch(PAYNET_API + "/auth", { method: "POST", body: f, headers: { "content-type": "application/x-www-form-urlencoded" } });
  if (r.status !== 200) { LAST_PN = "auth_" + r.status + ":" + (await r.text()).slice(0, 80); throw new Error("paynet_" + LAST_PN); }
  const j = await r.json();
  PN_TOKEN = j.access_token; PN_EXP = Date.now() + (j.expires_in || 14400) * 1000;
  return PN_TOKEN;
}
async function pnLookup(env, invoice) {
  const t = await pnToken(env);
  const r = await fetch(PAYNET_API + "/api/Payments?Invoice=" + encodeURIComponent(invoice), { headers: { authorization: "bearer " + t } });
  if (r.status === 404) return []; // PayNet: счёта с таким номером нет
  if (r.status !== 200) { LAST_PN = "lookup_" + r.status; return null; }
  const j = await r.json().catch(() => null);
  return Array.isArray(j) ? j : j ? [j] : [];
}
const loc = (d) => new Date(d.getTime() + 2 * 3600e3).toISOString().slice(0, 19); // как datetime.now() бота (Кишинёв)
async function pnCreate(env, o) {
  const t = await pnToken(env);
  const amt = Math.round(o.amount * 100), now = new Date();
  const parts = (o.name || "Клиент").split(/\s+/);
  const body = {
    Invoice: o.invoice, MerchantCode: env.PAYNET_MERCHANT_CODE, LinkUrlSuccess: o.ok, LinkUrlCancel: o.cancel, Signature: null, SignVersion: "v01",
    Customer: { Code: o.email, Name: o.name || "Клиент", NameFirst: parts[0] || "Клиент", NameLast: parts.slice(1).join(" "), email: o.email, Country: "Moldova", City: "Chisinau", Address: "N/A", PhoneNumber: "37300000000" },
    Currency: 498, ExternalDate: loc(now), ExpiryDate: loc(new Date(now.getTime() + 86400e3)),
    Services: [{ Name: o.desc.slice(0, 50), Description: o.desc, Amount: amt, Products: [{ LineNo: 1, Code: "srv_" + o.invoice, Barcode: o.invoice, Name: o.desc.slice(0, 50), Description: o.desc, UnitPrice: amt, Quantity: 100, TotalAmount: amt }] }],
  };
  if (env.PAYNET_SALE_AREA) body.SaleAreaCode = env.PAYNET_SALE_AREA;
  const r = await fetch(PAYNET_API + "/api/Payments/Send", { method: "POST", body: JSON.stringify(body), headers: { authorization: "bearer " + t, "content-type": "application/json" } });
  const txt = await r.text();
  if (r.status !== 200 && r.status !== 201) throw new Error("paynet_send_" + r.status + ":" + txt.slice(0, 200));
  const j = JSON.parse(txt);
  const pid = j.PaymentId || j.PaymentID, url = j.LinkUrlPayment || j.LinkUrl || null;
  if (pid == null) throw new Error("paynet_no_id");
  return { pid: String(pid), url, sig: j.Signature != null ? String(j.Signature) : "", exp: body.ExpiryDate };
}
async function freshInvoice(env) {
  for (let i = 0; i < 12; i++) {
    const v = 1000000000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 1147483647);
    const a = await env.APP_DB.prepare("SELECT 1 FROM site_orders WHERE invoice_id=?").bind(v).first();
    if (a) continue;
    const b = await env.APP_DB.prepare("SELECT 1 FROM bot_payment_data WHERE invoice_id=?").bind(String(v)).first().catch(() => null);
    if (b) continue;
    let pn; try { pn = await pnLookup(env, v); } catch (e) { LAST_PN = String(e.message || e).slice(0, 120); pn = null; }
    if (pn === null || pn.length) continue; // PayNet уже знает такой счёт или не ответил — берём другой
    return v;
  }
  throw new Error("invoice_alloc " + LAST_PN);
}

/* ───────── WATA ───────── */
const wh = (env) => ({ authorization: "Bearer " + env.WATA_ACCESS_TOKEN, "content-type": "application/json" });
async function wataCreate(env, o) {
  const r = await fetch(WATA_API + "/links", { method: "POST", headers: wh(env), body: JSON.stringify({ amount: o.amount, currency: "RUB", description: "GemStone: оплата услуги", orderId: o.orderId, successRedirectUrl: o.ok, failRedirectUrl: o.cancel }) });
  const txt = await r.text();
  if (r.status !== 200) throw new Error("wata_" + r.status + ":" + txt.slice(0, 200));
  const j = JSON.parse(txt);
  if (!j.url) throw new Error("wata_no_link");
  return { id: j.id || null, url: j.url };
}
async function wataPaid(env, orderId) {
  const r = await fetch(WATA_API + "/v2/transactions?OrderId=" + encodeURIComponent(orderId), { headers: wh(env) });
  if (r.status !== 200) return null;
  const j = await r.json().catch(() => null);
  return !!(j && (j.items || []).some((t) => t.status === "Paid"));
}

/* ───────── создание оплаты из кабинета ───────── */
function personOk(p) { return p && /^\d{4}-\d{2}-\d{2}$/.test(p.birth_date || ""); }
function person(x) { x = x || {}; return { name: cl(x.name, 60), birth_date: cl(x.birth_date, 10), birth_time: cl(x.birth_time, 5), birth_place: cl(x.birth_place, 100) }; }

export async function createPay(request, env, sess, b) {
  await ensure(env);
  const a = sess.account, key = String(b.service || ""), svc = SERVICES[key];
  if (!svc) return jr({ ok: false, error: "bad_service" }, 400);
  const provider = b.provider === "wata" ? "wata" : "paynet";
  if (provider === "paynet" && !(env.PAYNET_MERCHANT_CODE && env.PAYNET_MERCHANT_USER && env.PAYNET_MERCHANT_PASSWORD)) return jr({ ok: false, error: "pay_off" }, 503);
  if (provider === "wata" && !(env.WATA_ENABLED === "1" && env.WATA_ACCESS_TOKEN)) return jr({ ok: false, error: "pay_off" }, 503);
  const me = { name: a.name || "", birth_date: a.birth_date || "", birth_time: a.birth_time || "", birth_place: a.birth_place || "" };
  const forOther = b.for === "other";
  const p1 = forOther ? person(b.p1) : me, p2 = svc.birth === 2 ? person(b.p2) : null;
  if (svc.birth >= 1 && !personOk(p1)) return jr({ ok: false, error: "need_birth" }, 400);
  if (key === "soul_code" && cl(b.full_name, 120).split(" ").length < 2 && !(forOther && p1.name)) return jr({ ok: false, error: "need_fullname" }, 400);
  if (svc.birth >= 1 && key !== "soul_code" && !p1.birth_place) return jr({ ok: false, error: "need_place" }, 400);
  if (svc.birth === 2 && !personOk(p2)) return jr({ ok: false, error: "need_partner" }, 400);
  // не более 10 неоплаченных счетов за час на аккаунт
  const cnt = await env.APP_DB.prepare("SELECT count(*) n FROM site_orders WHERE account_id=? AND created_at>?").bind(a.id, Date.now() - 3600e3).first();
  if (cnt && cnt.n >= 10) return jr({ ok: false, error: "rate" }, 429);
  const pr = (await prices(env))[key];
  if (!pr) return jr({ ok: false, error: "bad_service" }, 400);
  const amount = provider === "wata" ? pr.rub : pr.mdl, currency = provider === "wata" ? "RUB" : "MDL";
  if (!amount) return jr({ ok: false, error: "pay_off" }, 503);
  const lang = ["ru", "ro", "en"].includes(b.lang) ? b.lang : (a.lang || "ru");
  const data = JSON.stringify({ for: forOther ? "other" : "me", p1, p2, full_name: cl(b.full_name, 120), comment: cl(b.comment, 500) });
  const contact = a.email || (a.tg_username ? "@" + a.tg_username : a.contact_tg ? "TG @" + a.contact_tg : a.contact_ig ? "IG @" + a.contact_ig : a.telegram_id ? "tg:" + a.telegram_id : "") || "site#" + a.id;
  const now = Date.now();
  const ins = await env.APP_DB.prepare("INSERT INTO site_orders(account_id,telegram_id,service,provider,amount,currency,amount_eur,status,data,contact,lang,created_at) VALUES(?,?,?,?,?,?,?,'creating',?,?,?,?) RETURNING id")
    .bind(a.id, a.telegram_id || null, key, provider, amount, currency, pr.eur, data, contact, lang, now).first();
  const id = ins.id, base = SITE + (lang === "ru" ? "" : "/" + lang) + "/kabinet/";
  const ok = base + "?paid=" + id + "#readings", cancel = base + "?cancel=" + id + "#services";
  try {
    if (provider === "paynet") {
      const invoice = await freshInvoice(env);
      await env.APP_DB.prepare("UPDATE site_orders SET invoice_id=? WHERE id=?").bind(invoice, id).run();
      const r = await pnCreate(env, { invoice, amount, desc: `${svc.ru} #S${id}`, email: a.email || `${a.telegram_id || "site" + a.id}@telegram.user`, name: a.name || "Клиент", ok, cancel });
      // как бот: если PayNet не дал прямую ссылку — своя страница-переход с автоотправкой формы на paynet.md/acquiring/getecom
      const key = Array.from(crypto.getRandomValues(new Uint8Array(12)), (x) => x.toString(16).padStart(2, "0")).join("");
      const url = r.url || `${SITE}/api/pay/go?id=${id}&k=${key}`;
      await env.APP_DB.prepare("UPDATE site_orders SET paynet_payment_id=?, pay_url=?, pn_signature=?, pn_expiry=?, go_key=?, status='pending' WHERE id=?").bind(r.pid, url, r.sig, r.exp, key, id).run();
      return jr({ ok: true, id, url });
    }
    const orderId = "site-" + id + "-" + now.toString(36);
    await env.APP_DB.prepare("UPDATE site_orders SET wata_order_id=? WHERE id=?").bind(orderId, id).run();
    const r = await wataCreate(env, { amount, orderId, ok, cancel });
    await env.APP_DB.prepare("UPDATE site_orders SET wata_link_id=?, pay_url=?, status='pending' WHERE id=?").bind(r.id, r.url, id).run();
    return jr({ ok: true, id, url: r.url });
  } catch (e) {
    const m = String(e.message || e).slice(0, 300);
    console.error("pay create", m);
    await env.APP_DB.prepare("UPDATE site_orders SET status='error', last_error=? WHERE id=?").bind(m, id).run();
    return jr({ ok: false, error: "pay_failed" }, 502);
  }
}

/* ───────── проверка оплаты (сторож и ручная) ───────── */
async function checkOne(env, o) {
  let paid = null;
  try {
    if (o.provider === "paynet" && o.invoice_id) {
      const list = await pnLookup(env, o.invoice_id);
      if (list) {
        const m = list.filter((r) => o.paynet_payment_id && ["Id", "ID", "PaymentId", "PaymentID"].some((k) => r[k] != null && String(r[k]) === o.paynet_payment_id));
        const rec = m[0] || (list.length === 1 ? list[0] : null);
        paid = rec ? rec.Status === 4 : false;
      }
    } else if (o.provider === "wata" && o.wata_order_id) paid = await wataPaid(env, o.wata_order_id);
  } catch (e) { console.error("pay check", o.id, String(e.message || e).slice(0, 150)); }
  await env.APP_DB.prepare("UPDATE site_orders SET checked_at=?, checks=checks+1 WHERE id=?").bind(Date.now(), o.id).run();
  if (paid !== true) return false;
  const claim = await env.APP_DB.prepare("UPDATE site_orders SET status='paid', paid_at=? WHERE id=? AND status='pending'").bind(Date.now(), o.id).run();
  if (!claim.meta || !claim.meta.changes) return false; // уже отмечен другим проходом
  await onPaid(env, o.id);
  return true;
}

async function onPaid(env, id) {
  const o = await env.APP_DB.prepare("SELECT o.*, a.name aname, a.email aemail, a.tg_username atg FROM site_orders o JOIN accounts a ON a.id=o.account_id WHERE o.id=?").bind(id).first();
  if (!o) return;
  const svc = SERVICES[o.service] || { ru: o.service };
  const d = (() => { try { return JSON.parse(o.data || "{}"); } catch { return {}; } })();
  const pp = (p) => p ? [p.name, p.birth_date, p.birth_time, p.birth_place].filter(Boolean).join(", ") : "";
  const cur = o.currency === "RUB" ? "₽" : "лей";
  const lines = [
    "💰 ОПЛАТА на gemstone.md (кабинет) — подтверждена у " + (o.provider === "wata" ? "WATA" : "PayNet"),
    `Услуга: ${svc.ru}`, `Сумма: ${o.amount} ${cur}` + (o.amount_eur ? ` (≈${o.amount_eur} €)` : ""),
    `Заказ сайта: S${o.id}` + (o.invoice_id ? ` · счёт PayNet ${o.invoice_id}` : "") + (o.wata_order_id ? ` · WATA ${o.wata_order_id}` : ""),
    `Клиент: ${o.aname || "—"} · ${o.contact || "—"}` + (o.telegram_id ? ` · TG id ${o.telegram_id}` : ""),
    `Для: ${d.for === "other" ? "другого человека" : "себя"} — ${pp(d.p1) || "—"}`,
    d.p2 ? `Партнёр: ${pp(d.p2)}` : null,
    d.comment ? `Пожелания: ${d.comment}` : null,
    "Разбор сформировать и выложить клиенту (раздел «Мои разборы»).",
  ].filter(Boolean);
  let crmId = null;
  try {
    const c = await env.CRM_DB.prepare("INSERT INTO clients (name, email, birth_date, source, notes) VALUES (?, ?, ?, ?, ?)")
      .bind(o.aname || d.p1?.name || "Клиент сайта", o.aemail || null, (d.for !== "other" && d.p1?.birth_date) || null, "gemstone.md", `Контакт: ${o.contact}` + (o.telegram_id ? ` · TG ${o.telegram_id}` : "")).run();
    const r = await env.CRM_DB.prepare("INSERT INTO orders (client_id, status, source, amount, paid_amount, currency, comment) VALUES (?, 'reserved', 'gemstone.md · кабинет', ?, ?, ?, ?)")
      .bind(c.meta.last_row_id, o.amount, o.amount, o.currency, lines.slice(1).join("\n")).run();
    crmId = r.meta.last_row_id;
  } catch (e) { console.error("crm paid", String(e.message || e).slice(0, 150)); }
  await ownerMsg(env, lines.join("\n") + (crmId ? `\nCRM заказ #${crmId}` : ""));
  const msg = { ru: `✅ Оплата получена: ${svc.ru}. Астролог готовит ваш разбор — он появится в кабинете: ${SITE}/kabinet/#readings`, ro: `✅ Plata a fost primită. Analiza va apărea în cabinet: ${SITE}/ro/kabinet/#readings`, en: `✅ Payment received. Your reading will appear in your account: ${SITE}/en/kabinet/#readings` }[o.lang] || "";
  if (o.telegram_id && env.TG_BOT_TOKEN) {
    await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: o.telegram_id, text: msg }) }).catch(() => {});
  }
  if (o.aemail && env.EMAIL && env.MAIL_FROM) {
    try { await env.EMAIL.send({ to: o.aemail, from: { email: env.MAIL_FROM, name: "Gemstone.md" }, subject: "Gemstone.md — " + ({ ru: "оплата получена", ro: "plata primită", en: "payment received" }[o.lang] || "оплата получена"), text: msg }); }
    catch (e) { console.error("pay mail", e && e.code ? String(e.code) : "error"); }
  }
  await env.APP_DB.prepare("UPDATE site_orders SET crm_order_id=?, notified_at=? WHERE id=?").bind(crmId, Date.now(), id).run();
  await startGen(env, o, d);
}

/* ───────── генерация: тот же движок, что в боте (сервис site-gen на Railway) ───────── */
const hex = (buf) => Array.from(new Uint8Array(buf), (x) => x.toString(16).padStart(2, "0")).join("");
async function hmacHex(env, data) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.SITEGEN_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", k, typeof data === "string" ? new TextEncoder().encode(data) : data));
}
// уведомления по оплатам/разборам сайта — только владельцу (решение 23.11), не в группу продаж
const ownerIds = (env) => String(env.OWNER_TG_IDS || env.ADMIN_TG_IDS || "234491691").split(/[,\s]+/).filter(Boolean);
async function ownerMsg(env, text) {
  if (!env.TG_BOT_TOKEN) return;
  for (const id of ownerIds(env)) await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: id, text }) }).catch(() => {});
}
const GEN_URL = (env) => env.SITEGEN_URL || "https://site-gen-production.up.railway.app";
async function startGen(env, o, d) {
  if (o.service === "ai_consultant") {
    await env.APP_DB.batch([
      env.APP_DB.prepare("INSERT INTO ai_credits(account_id,left,updated_at) VALUES(?,10,?) ON CONFLICT(account_id) DO UPDATE SET left=left+10, updated_at=excluded.updated_at").bind(o.account_id, Date.now()),
      env.APP_DB.prepare("UPDATE site_orders SET status='done' WHERE id=?").bind(o.id),
    ]);
    return;
  }
  if (!env.SITEGEN_SECRET) return;
  const body = JSON.stringify({ job: "S" + o.id, service: o.service, lang: o.lang || "ru", p1: d.p1 || {}, p2: d.p2 || null, full_name: d.full_name || (d.p1 && d.p1.name) || "" });
  try {
    const r = await fetch(GEN_URL(env) + "/gen", { method: "POST", body, headers: { "content-type": "application/json", "x-sig": await hmacHex(env, body) } });
    await env.APP_DB.prepare("UPDATE site_orders SET status=?, last_error=? WHERE id=?").bind(r.status === 202 ? "generating" : "paid", r.status === 202 ? null : "gen_http_" + r.status, o.id).run();
  } catch (e) {
    await env.APP_DB.prepare("UPDATE site_orders SET last_error=? WHERE id=?").bind("gen_start:" + String(e.message || e).slice(0, 120), o.id).run();
  }
}

// POST /api/pay/gen-cb — сервис генерации присылает готовый PDF (или ошибку), подпись X-Sig
export async function genCallback(request, env) {
  await ensure(env);
  const buf = await request.arrayBuffer();
  if (!env.SITEGEN_SECRET || (request.headers.get("x-sig") || "") !== (await hmacHex(env, buf))) return jr({ ok: false }, 403);
  const id = parseInt(String(request.headers.get("x-job") || "").replace(/^S/, ""), 10) || 0;
  const o = id ? await env.APP_DB.prepare("SELECT o.*, a.email aemail FROM site_orders o JOIN accounts a ON a.id=o.account_id WHERE o.id=?").bind(id).first() : null;
  if (!o) return jr({ ok: true });
  const svc = SERVICES[o.service] || { ru: o.service };
  if (request.headers.get("x-status") !== "done" || buf.byteLength < 1000) {
    const err = new TextDecoder().decode(buf).slice(0, 300);
    await env.APP_DB.prepare("UPDATE site_orders SET status='gen_error', last_error=? WHERE id=?").bind(err, id).run();
    await ownerMsg(env, `⚠️ Заказ сайта S${id} (${svc.ru}) оплачен, но PDF не собран: ${err}\nНужна ручная проверка / перезапуск.`);
    return jr({ ok: true });
  }
  await env.MEDIA.put(`reports/S${id}.pdf`, buf, { httpMetadata: { contentType: "application/pdf" } });
  await env.APP_DB.prepare("UPDATE site_orders SET status='done', last_error=NULL WHERE id=?").bind(id).run();
  const fname = `GemStone_${o.service}_S${id}.pdf`;
  const link = SITE + (o.lang && o.lang !== "ru" ? "/" + o.lang : "") + "/kabinet/#readings";
  const cap = { ru: `✅ Ваш разбор готов: ${svc.ru}. Он также сохранён в кабинете: ${link}`, ro: `✅ Analiza este gata. Este salvată și în cabinet: ${link}`, en: `✅ Your reading is ready. It is also saved in your account: ${link}` }[o.lang] || "";
  if (o.telegram_id && env.TG_BOT_TOKEN) {
    const f = new FormData(); f.append("chat_id", String(o.telegram_id)); f.append("caption", cap); f.append("document", new Blob([buf], { type: "application/pdf" }), fname);
    await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendDocument`, { method: "POST", body: f }).catch(() => {});
  }
  if (o.aemail && env.EMAIL && env.MAIL_FROM) {
    try { await env.EMAIL.send({ to: o.aemail, from: { email: env.MAIL_FROM, name: "Gemstone.md" }, subject: "Gemstone.md — " + svc.ru, text: cap }); } catch (e) { console.error("gen mail", e && e.code ? String(e.code) : "error"); }
  }
  for (const oid of ownerIds(env)) {
    if (env.TG_BOT_TOKEN === undefined || String(o.telegram_id) === oid) continue;
    const f = new FormData(); f.append("chat_id", oid); f.append("caption", `📄 Готово: S${id} · ${svc.ru} · отправлено клиенту`); f.append("document", new Blob([buf], { type: "application/pdf" }), fname);
    await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendDocument`, { method: "POST", body: f }).catch(() => {});
  }
  return jr({ ok: true });
}

export async function myReport(env, sess, id) {
  await ensure(env);
  const o = await env.APP_DB.prepare("SELECT id, service FROM site_orders WHERE id=? AND account_id=? AND status='done'").bind(id, sess.account.id).first();
  if (!o) return jr({ ok: false, error: "not_found" }, 404);
  const obj = await env.MEDIA.get(`reports/S${id}.pdf`);
  if (!obj) return jr({ ok: false, error: "not_found" }, 404);
  return new Response(obj.body, { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="GemStone_${o.service}_S${id}.pdf"`, "cache-control": "private, no-store" } });
}

// AI-консультант: 10 вопросов за пакет, ответы — тем же генератором, что в боте
export async function aiAsk(env, sess, b) {
  await ensure(env);
  const a = sess.account, q = cl(b.question, 1500);
  if (q.length < 3) return jr({ ok: false, error: "bad_request" }, 400);
  const c = await env.APP_DB.prepare("SELECT left FROM ai_credits WHERE account_id=?").bind(a.id).first();
  if (!c || c.left <= 0) return jr({ ok: false, error: "no_credits" }, 402);
  const body = JSON.stringify({ question: q, lang: ["ru", "ro", "en"].includes(b.lang) ? b.lang : (a.lang || "ru"), user: { site_account_id: a.id, name: a.name, birth_date: a.birth_date, birth_time: a.birth_time, birth_place: a.birth_place } });
  const r = await fetch(GEN_URL(env) + "/ai", { method: "POST", body, headers: { "content-type": "application/json", "x-sig": await hmacHex(env, body) } });
  const j = await r.json().catch(() => null);
  if (!j || !j.ok || !j.answer) return jr({ ok: false, error: "ai_failed" }, 502);
  await env.APP_DB.batch([
    env.APP_DB.prepare("UPDATE ai_credits SET left=left-1, updated_at=? WHERE account_id=? AND left>0").bind(Date.now(), a.id),
    env.APP_DB.prepare("INSERT INTO ai_history(account_id,q,a,at) VALUES(?,?,?,?)").bind(a.id, q, String(j.answer).slice(0, 8000), Date.now()),
  ]);
  return jr({ ok: true, answer: j.answer, left: c.left - 1 });
}
export async function aiState(env, sess) {
  await ensure(env);
  const c = await env.APP_DB.prepare("SELECT left FROM ai_credits WHERE account_id=?").bind(sess.account.id).first();
  const h = await env.APP_DB.prepare("SELECT q, a, at FROM ai_history WHERE account_id=? ORDER BY id DESC LIMIT 10").bind(sess.account.id).all();
  return jr({ ok: true, left: c ? c.left : 0, history: h.results || [] });
}

// Cron раз в минуту: счета не старше 26 ч; первые 30 мин — каждую минуту, затем раз в 10 мин (лимит WATA 1 запрос/45 с на заказ соблюдён)
export async function watch(env) {
  if (!env.APP_DB) return;
  await ensure(env);
  const now = Date.now();
  const r = await env.APP_DB.prepare("SELECT * FROM site_orders WHERE status='pending' AND created_at>? ORDER BY created_at DESC LIMIT 40").bind(now - 26 * 3600e3).all();
  for (const o of r.results || []) {
    const age = now - o.created_at, last = o.checked_at || 0;
    if (age > 1800e3 && now - last < 600e3) continue;
    if (now - last < 50e3) continue;
    await checkOne(env, o);
  }
  await env.APP_DB.prepare("UPDATE site_orders SET status='expired' WHERE status='pending' AND created_at<?").bind(now - 26 * 3600e3).run();
  // оплачено, но генерация не стартовала (сервис был недоступен) — повтор раз в 5 минут, до 12 попыток
  const st = await env.APP_DB.prepare("SELECT o.* FROM site_orders o WHERE o.status='paid' AND o.paid_at<? AND o.checks<40 LIMIT 5").bind(now - 300e3).all();
  for (const o of st.results || []) {
    await env.APP_DB.prepare("UPDATE site_orders SET checks=checks+3, paid_at=? WHERE id=?").bind(now, o.id).run();
    let d = {}; try { d = JSON.parse(o.data || "{}"); } catch {}
    await startGen(env, o, d);
  }
}

export async function payStatus(env, sess, id) {
  await ensure(env);
  const o = await env.APP_DB.prepare("SELECT * FROM site_orders WHERE id=? AND account_id=?").bind(id, sess.account.id).first();
  if (!o) return jr({ ok: false, error: "not_found" }, 404);
  if (o.status === "pending" && Date.now() - (o.checked_at || 0) > 45e3) { if (await checkOne(env, o)) o.status = "paid"; }
  return jr({ ok: true, status: o.status });
}

export async function myOrders(env, sess) {
  await ensure(env);
  const a = sess.account;
  const s = await env.APP_DB.prepare("SELECT id, service, amount, currency, status, created_at, paid_at, pay_url FROM site_orders WHERE account_id=? AND status IN ('pending','paid','generating','gen_error','done') ORDER BY id DESC LIMIT 50").bind(a.id).all();
  let bot = [];
  if (a.telegram_id) {
    try {
      const r = await env.APP_DB.prepare("SELECT id, service_type, package, amount, currency, status, created_at, paid_at, completed_at FROM bot_orders WHERE user_id=? AND status IN ('completed','paid','generating') ORDER BY id DESC LIMIT 50").bind(Number(a.telegram_id)).all();
      bot = r.results || [];
    } catch {}
  }
  return jr({ ok: true, site: (s.results || []).map((x) => Object.assign(x, { pay_url: x.status === "pending" ? x.pay_url : null })), bot });
}

/* ───────── профиль из базы бота при входе через Telegram ───────── */
export async function fillFromBot(env, accountId, telegramId) {
  try {
    const u = await env.APP_DB.prepare("SELECT first_name, language, birth_date, birth_time, birth_city_display, birth_city FROM bot_users WHERE telegram_id=?").bind(Number(telegramId)).first();
    if (!u) return;
    const lang = ["ru", "ro", "en"].includes(u.language) ? u.language : null;
    const bd = /^\d{4}-\d{2}-\d{2}$/.test(u.birth_date || "") ? u.birth_date : null;
    const bt = /^\d{2}:\d{2}/.test(u.birth_time || "") ? String(u.birth_time).slice(0, 5) : null;
    await env.APP_DB.prepare(
      "UPDATE accounts SET name=COALESCE(NULLIF(name,''),?), lang=COALESCE(?,lang), birth_date=COALESCE(NULLIF(birth_date,''),?), birth_time=COALESCE(NULLIF(birth_time,''),?), birth_place=COALESCE(NULLIF(birth_place,''),?) WHERE id=?"
    ).bind(cl(u.first_name, 60) || null, lang, bd, bt, cl(u.birth_city_display || u.birth_city, 100) || null, accountId).run();
    // данные рождения уже были даны боту — фиксируем согласие с пометкой источника, если его ещё нет
    if (bd) {
      const c = await env.APP_DB.prepare("SELECT 1 FROM consents WHERE account_id=? AND kind='birth_data'").bind(accountId).first();
      if (!c) await env.APP_DB.prepare("INSERT INTO consents(account_id,kind,version,at) VALUES(?,'birth_data',?,?)").bind(accountId, "bot-import-2026-11-23", Date.now()).run().catch(() => {});
    }
  } catch (e) { console.error("fillFromBot", String(e.message || e).slice(0, 120)); }
}

/* ───────── страница перехода на PayNet (порт payment_page.py бота) ───────── */
export async function payGo(env, url) {
  await ensure(env);
  const id = parseInt(url.searchParams.get("id"), 10) || 0, k = String(url.searchParams.get("k") || "");
  const o = id && k ? await env.APP_DB.prepare("SELECT * FROM site_orders WHERE id=? AND go_key=? AND provider='paynet'").bind(id, k).first() : null;
  const h = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", "referrer-policy": "no-referrer" };
  if (!o || o.status !== "pending") return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><p style="font-family:sans-serif;padding:24px">Счёт не найден или уже оплачен. <a href="/kabinet/#readings">Мой кабинет</a></p>', { status: 404, headers: h });
  const L = ["ru", "ro", "en"].includes(o.lang) ? o.lang : "ru", base = SITE + (L === "ru" ? "" : "/" + L) + "/kabinet/";
  const e = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const t = { ru: ["Переход к оплате…", "Перейти к оплате"], ro: ["Redirecționare către plată…", "Mergi la plată"], en: ["Redirecting to payment…", "Go to payment"] }[L];
  const html = `<!doctype html><html lang="${L}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t[0]}</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0e1013;color:#f3efe6;font-family:system-ui,sans-serif}div{text-align:center;padding:32px}button{margin-top:18px;padding:14px 28px;border:0;border-radius:10px;background:#c9a24a;color:#13161a;font-weight:600;font-size:16px;cursor:pointer}</style></head>
<body><div><p>${t[0]}</p><form id="f" action="https://paynet.md/acquiring/getecom" method="POST">
<input type="hidden" name="operation" value="${e(o.paynet_payment_id)}"><input type="hidden" name="Signature" value="${e(o.pn_signature)}">
<input type="hidden" name="LinkUrlSucces" value="${e(base + "?paid=" + o.id + "#readings")}"><input type="hidden" name="LinkUrlCancel" value="${e(base + "?cancel=" + o.id + "#services")}">
<input type="hidden" name="ExpiryDate" value="${e(o.pn_expiry)}"><input type="hidden" name="Lang" value="${L}"><button type="submit">${t[1]}</button></form></div>
<script>setTimeout(function(){document.getElementById("f").submit()},400)</script></body></html>`;
  return new Response(html, { status: 200, headers: h });
}
