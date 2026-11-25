// Общие функции. Токен читается из окружения или ~/.cfx/env и никогда не печатается.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { blake3 } from "@noble/hashes/blake3";
import { bytesToHex } from "@noble/hashes/utils";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
export const SCRIPT = "gemstone-public";
export const BASE = "https://gemstone.md";

export function loadEnv() {
  if (!process.env.CF_TOKEN || !process.env.CF_ACC) {
    const f = path.join(os.homedir(), ".cfx", "env");
    if (fs.existsSync(f)) {
      for (const line of fs.readFileSync(f, "utf8").split("\n")) {
        const m = line.match(/^\s*(?:export\s+)?([A-Z_]+)=(.*)$/);
        if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
  if (!process.env.CF_TOKEN || !process.env.CF_ACC) throw new Error("нужны CF_TOKEN и CF_ACC (окружение или ~/.cfx/env)");
  return { token: process.env.CF_TOKEN, acc: process.env.CF_ACC };
}

export async function cf(method, apiPath, { json, form, raw } = {}) {
  const { token, acc } = loadEnv();
  const url = `https://api.cloudflare.com/client/v4/accounts/${acc}${apiPath}`;
  const headers = { Authorization: `Bearer ${token}` };
  let body;
  if (json !== undefined) { headers["content-type"] = "application/json"; body = JSON.stringify(json); }
  if (form) body = form;
  const r = await fetch(url, { method, headers, body });
  if (raw) return r;
  const t = await r.text();
  let d; try { d = JSON.parse(t); } catch { throw new Error(`CF ${method} ${apiPath}: HTTP ${r.status} не JSON`); }
  if (!d.success) throw new Error(`CF ${method} ${apiPath}: HTTP ${r.status} ${JSON.stringify(d.errors).slice(0, 300)}`);
  return d.result;
}

// Хэш ассета как у Cloudflare/wrangler: первые 32 hex-символа BLAKE3(base64(содержимое) + расширение без точки)
export function assetHash(buf, filePath) {
  const ext = path.extname(filePath).slice(1);
  return bytesToHex(blake3(new TextEncoder().encode(Buffer.from(buf).toString("base64") + ext))).slice(0, 32);
}

export function* walk(dir, base = dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p, base);
    else yield [p, "/" + path.relative(base, p).split(path.sep).join("/")];
  }
}

// Манифест = ВСЯ папка site/ (файлы, которых нет в манифесте, при выкладке ассетов УДАЛЯЮТСЯ с сайта)
export function buildManifest(siteDir = path.join(ROOT, "site")) {
  const m = {};
  for (const [abs, rel] of walk(siteDir)) {
    const buf = fs.readFileSync(abs);
    m[rel] = { hash: assetHash(buf, abs), size: buf.length };
  }
  return m;
}
