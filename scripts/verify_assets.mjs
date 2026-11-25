// Проверка зеркала site/ БЕЗ загрузки: считаем хэши и спрашиваем у Cloudflare, каких из них у него ещё нет.
// POST .../assets-upload-session только регистрирует манифест и возвращает jwt + buckets (хэши, которых нет в хранилище).
// Мы НЕ вызываем /workers/assets/upload и НЕ создаём версию -> никаких изменений в сайте/ассетах. jwt живёт 1 час и нигде не сохраняется.
// Ключи:  --candidates  дополнительно проверить ответы воркера из .crawl-cache (для путей, затенённых воркером) как кандидаты в ассеты.
import fs from "node:fs";
import path from "node:path";
import { ROOT, SCRIPT, cf, buildManifest, assetHash, walk } from "./lib.mjs";

async function session(manifest) {
  const r = await cf("POST", `/workers/scripts/${SCRIPT}/assets-upload-session`, { json: { manifest } });
  const notStored = new Set((r.buckets || []).flat());
  return notStored; // jwt намеренно отбрасывается
}

const manifest = buildManifest();
const paths = Object.keys(manifest);
console.log(`файлов в site/: ${paths.length}`);

// 1) согласованность с crawl-report.json (хэш на диске == хэш при скачивании)
const rep = JSON.parse(fs.readFileSync(path.join(ROOT, "crawl-report.json"), "utf8"));
const drift = paths.filter((p) => !rep.assets[p] || rep.assets[p].hash !== manifest[p].hash);
console.log(`расхождений с crawl-report: ${drift.length}`);

// 2) сессия загрузки
const notStored = await session(manifest);
const missing = paths.filter((p) => notStored.has(manifest[p].hash));
const out = { files: paths.length, already_stored: paths.length - missing.length, not_stored: missing.length, not_stored_paths: missing, drift };
console.log(`уже хранятся у Cloudflare: ${out.already_stored}; НЕ хранятся: ${out.not_stored}`);
if (missing.length) console.log("не найдены в хранилище:\n" + missing.join("\n"));

// 2b) файлы, которые сейчас отдаёт воркер из вшитых модулей: лежат ли такие байты в хранилище ассетов?
{
  const w = { "/assets/shop.js": path.join(ROOT, "worker", "shop.js.txt"), "/llms.txt": path.join(ROOT, "worker", "llms.txt.txt") };
  const man = {}; for (const [p, f] of Object.entries(w)) { const b = fs.readFileSync(f); man[p] = { hash: assetHash(b, p), size: b.length }; }
  const ns = await session(man); out.worker_served_in_asset_store = Object.fromEntries(Object.keys(man).map((p) => [p, !ns.has(man[p].hash)]));
  console.log("вшитые в воркер файлы есть в хранилище ассетов:", JSON.stringify(out.worker_served_in_asset_store));
}

// 3) кандидаты: динамические ответы воркера как возможные байты ассетов-«запасных вариантов»
if (process.argv.includes("--candidates")) {
  const cache = path.join(ROOT, ".crawl-cache"); const cand = {}; const byHash = {};
  for (const [abs, rel] of walk(cache)) {
    if (manifest[rel]) continue;
    const buf = fs.readFileSync(abs); const h = assetHash(buf, abs);
    cand[rel] = { hash: h, size: buf.length };
  }
  const ns = await session(cand);
  const hit = Object.keys(cand).filter((p) => !ns.has(cand[p].hash));
  out.candidates = { total: Object.keys(cand).length, identical_to_stored: hit.length, paths_identical_to_stored: hit };
  console.log(`кандидатов: ${out.candidates.total}; совпали с уже хранимыми байтами: ${hit.length}`);
}
fs.writeFileSync(path.join(ROOT, "verify-report.json"), JSON.stringify(out, null, 1));
