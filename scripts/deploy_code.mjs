// Загружает НОВУЮ ВЕРСИЮ кода (worker/*) c keep_assets — БЕЗ деплоя. Трафик остаётся на текущей версии.
// По умолчанию dry-run (ничего не отправляет). Реальная загрузка версии: node scripts/deploy_code.mjs --go
// Ассеты здесь НЕ трогаются никогда (keep_assets: true). Секреты сохраняются (keep_bindings), их значения не нужны.
// ВНИМАНИЕ: скрипт написан по документации и ещё ни разу не запускался с --go.
import fs from "node:fs";
import path from "node:path";
import { ROOT, SCRIPT, cf } from "./lib.mjs";

const W = path.join(ROOT, "worker");
const st = JSON.parse(fs.readFileSync(path.join(W, "settings.json"), "utf8"));
const go = process.argv.includes("--go"), force = process.argv.includes("--force");

// защита от затирания чужих правок: боевой код должен совпадать с тем, что в git
const live = await cf("GET", `/workers/scripts/${SCRIPT}/content/v2`, { raw: true });
const liveEtag = (live.headers.get("etag") || "").replace(/"/g, "");
if (liveEtag !== st.content_etag && !force) {
  console.error(`Боевой код изменился после последнего pull_live (live ${liveEtag.slice(0, 12)} != git ${String(st.content_etag).slice(0, 12)}).\nСделайте node scripts/pull_live.mjs, разберите diff, затем повторите. (--force — игнорировать)`);
  process.exit(2);
}

const files = fs.readdirSync(W).filter((f) => f !== "settings.json");
const ctype = (f) => (f.endsWith(".js") ? "application/javascript+module" : f.endsWith(".txt") ? "text/plain" : "application/octet-stream");

const bindings = [];
for (const b of st.bindings) {
  if (b.type === "secret_text" || b.type === "secret_key") continue; // сохраняются через keep_bindings
  if (b.type === "ai") bindings.push({ name: b.name, type: "ai" });
  else if (b.type === "d1") bindings.push({ name: b.name, type: "d1", id: b.id || b.database_id });
  else if (b.type === "service") bindings.push({ name: b.name, type: "service", service: b.service, environment: b.environment });
  else bindings.push(b);
}
const a = st.assets_config || {};
const metadata = {
  main_module: st.main_module || "index.js",
  compatibility_date: st.compatibility_date,
  ...(st.compatibility_flags && st.compatibility_flags.length ? { compatibility_flags: st.compatibility_flags } : {}),
  bindings,
  keep_bindings: ["secret_text", "secret_key"],
  keep_assets: true,
  assets: { config: { html_handling: a.html_handling, not_found_handling: a.not_found_handling, run_worker_first: a.raw_run_worker_first } },
  annotations: { "workers/message": "deploy_code.mjs from git", "workers/tag": "git" },
};
console.log("модули:", files.join(" "));
console.log("метаданные:", JSON.stringify({ ...metadata, bindings: bindings.map((b) => b.name + ":" + b.type) }));
if (!go) { console.log("dry-run: ничего не отправлено. Добавьте --go, чтобы создать версию (без деплоя)."); process.exit(0); }

const form = new FormData();
form.set("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
for (const f of files) form.set(f, new Blob([fs.readFileSync(path.join(W, f))], { type: ctype(f) }), f);
const r = await cf("POST", `/workers/scripts/${SCRIPT}/versions`, { form });
console.log("версия создана (НЕ задеплоена):", r.id, "номер", r.number);
const sub = (await cf("GET", "/workers/subdomain")).subdomain;
console.log("превью-URL:   https://" + r.id.slice(0, 8) + "-" + SCRIPT + "." + sub + ".workers.dev/");
console.log("на боевом домене (только ваш запрос): заголовок  Cloudflare-Workers-Version-Overrides: " + SCRIPT + '="' + r.id + '"');
console.log("Дальше — проверка превью, затем деплой вручную (см. README).");
