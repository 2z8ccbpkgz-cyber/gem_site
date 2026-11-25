// Обновляет worker/ из боевого Cloudflare: модули активной версии (байт-в-байт) + settings.json (без значений секретов).
// Только чтение. Запуск: node scripts/pull_live.mjs
import fs from "node:fs";
import path from "node:path";
import { ROOT, SCRIPT, cf } from "./lib.mjs";

const W = path.join(ROOT, "worker");
fs.mkdirSync(W, { recursive: true });

// 1) модули: GET .../content/v2 (multipart). Разбираем вручную на Buffer-ах, чтобы не потерять ни байта.
const r = await cf("GET", `/workers/scripts/${SCRIPT}/content/v2`, { raw: true });
if (!r.ok) throw new Error("content/v2: HTTP " + r.status);
const boundary = /boundary=(\S+)/.exec(r.headers.get("content-type") || "")[1];
const liveEtag = (r.headers.get("etag") || "").replace(/"/g, "");
const mainModule = r.headers.get("cf-entrypoint");
const raw = Buffer.from(await r.arrayBuffer());
const delim = Buffer.from("--" + boundary);
const names = [];
let pos = raw.indexOf(delim);
while (pos >= 0) {
  const start = pos + delim.length;
  if (raw.slice(start, start + 2).toString() === "--") break;
  const next = raw.indexOf(delim, start);
  let part = raw.slice(start + 2, next - 2); // отрезаем CRLF после разделителя и CRLF перед следующим
  const sep = part.indexOf("\r\n\r\n");
  const head = part.slice(0, sep).toString("utf8"); const body = part.slice(sep + 4);
  const name = /name="([^"]+)"/.exec(head)[1];
  fs.writeFileSync(path.join(W, name), body); names.push(name);
  pos = next;
}
console.log("модулей:", names.length, names.join(" "));

// 2) настройки без секретов
const s = await cf("GET", `/workers/scripts/${SCRIPT}/settings`);
const deployments = await cf("GET", `/workers/scripts/${SCRIPT}/deployments`);
const active = deployments.deployments[0]; const vid = active.versions[0].version_id;
const v = await cf("GET", `/workers/scripts/${SCRIPT}/versions/${vid}`);
const md = { ...(v.metadata || {}) }; delete md.author_id; delete md.author_email;
const out = {
  script: SCRIPT, account_id: process.env.CF_ACC, active_version_id: v.id, active_version_number: v.number,
  deployment_strategy: active.strategy, deployment_versions: active.versions,
  content_etag: liveEtag, main_module: mainModule,
  compatibility_date: s.compatibility_date, compatibility_flags: s.compatibility_flags, usage_model: s.usage_model, placement: s.placement,
  // bindings: у secret_text значений нет (API их не отдаёт) — только имя и тип; plain_text — значение в открытом виде (оно не секрет)
  bindings: s.bindings, annotations: s.annotations, tags: s.tags, tail_consumers: s.tail_consumers, logpush: s.logpush,
  assets_config: v.resources.script_runtime.assets, version_metadata: md, version_bindings: v.resources.bindings,
};
fs.writeFileSync(path.join(W, "settings.json"), JSON.stringify(out, null, 2));
console.log("активная версия", v.number, v.id, "etag", liveEtag.slice(0, 12));
