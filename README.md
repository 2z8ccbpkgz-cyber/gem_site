# gemstone-site

Git-зеркало сайта gemstone.md: воркер Cloudflare `gemstone-public` (аккаунт `5c0e15200a46984774052066eab98aae`) и проверенная копия статики (ASSETS).
Сайт раньше выкладывался через API без git; этот репозиторий — первая точка отсчёта. **Ничего отсюда автоматически не деплоится.**

## Что сейчас в проде
- Активная версия **76** (`082e4004-398c-4f3f-b777-bc3188c8300a`), 100% трафика. Точные данные — `worker/settings.json` (bindings без значений секретов, assets config, compatibility_date, `content_etag`).
- `worker/` — модули воркера байт-в-байт (`index.js` — точка входа; `*.js` — ES-модули; `*.txt` — текстовые модули).
- `site/` — зеркало ассетов (317 файлов, ~15 МБ), собрано краулером с workers.dev того же воркера. Отчёты: `crawl-report.json`, `verify-report.json`.
- Конфиг ассетов: `html_handling=auto-trailing-slash`, `not_found_handling=404-page`, список `run_worker_first` (динамика) — в `worker/settings.json`.

### Важно: что отдаёт воркер, а не ASSETS
- `/assets/shop.js` и `/llms.txt` отдаются **воркером** из вшитых текстовых модулей (`worker/shop.js.txt`, `worker/llms.txt.txt`) — пути добавлены в `run_worker_first`. В хранилище ассетов таких байт нет (проверено), в ASSETS может лежать старая версия. В `site/` они намеренно не включены.
- Динамические (worker-first) пути, не ассеты: `/api/*`, `/p/*` (+`/ro`, `/en`), `/sitemap.xml`, `/sitemap-video.xml`, `/sitemap-seo.xml`, `/journal*`, `/media/*`, `/kabinet*`, `/stones*`, `/birthday*`, `/zodiac*`, а также `/`, `/ro/`, `/en/` (воркер вставляет секцию журнала в статическую главную; в `site/` лежат восстановленные статические версии, байты подтверждены).
- Статические страницы-запасной вариант `p/**` (≈1290 файлов: 430 изделий × 3 языка) и статический `sitemap.xml` затенены воркером и снаружи недоступны — **в зеркале их нет**.

## Скрипты (Node 22, `npm install`; токен — `CF_TOKEN`/`CF_ACC` из окружения или `~/.cfx/env`, в git не попадает)
- `scripts/pull_live.mjs` — обновить `worker/` из Cloudflare (только чтение).
- `scripts/crawl.mjs` — пересобрать `site/` (GET, ≤8 параллельно; качает с workers.dev, т.к. зона gemstone.md вставляет в HTML `<script src="/.webmcp/bridge.js">` и убирает ETag). В Node 22 для прокси: `NODE_USE_ENV_PROXY=1`.
- `scripts/verify_assets.mjs [--candidates]` — считает хэши (BLAKE3(base64(содержимое)+расширение), 32 hex) и делает `assets-upload-session`; НИЧЕГО не загружает. Файл, которого нет в списке `buckets`, уже хранится у Cloudflare.
- `scripts/deploy_code.mjs` — создаёт НОВУЮ ВЕРСИЮ только кода (`keep_assets: true`, `keep_bindings` для секретов), НЕ деплоит. По умолчанию dry-run, реальная загрузка — `--go`. Печатает превью-URL. Отказывается работать, если боевой код отличается от git (сначала `pull_live`).

## Безопасная процедура выкладки кода
1. `node scripts/pull_live.mjs` — убедиться, что `git diff` пуст (в проде нет чужих правок).
2. Правка в `worker/`, коммит.
3. `node scripts/deploy_code.mjs` (dry-run) → затем `--go`: создаётся версия, трафик не меняется.
4. Проверка превью: `https://<первые 8 символов id>-gemstone-public.<subdomain>.workers.dev/` или заголовок `Cloudflare-Workers-Version-Overrides: gemstone-public="<version-id>"` для gemstone.md. Пройти главную, `/p/<артикул>/`, `/shop/`, `/journal/`, корзину, `/api/catalog`.
5. Только после проверки — деплой версии (Dashboard → Deployments, либо API `POST /workers/scripts/gemstone-public/deployments`), лучше сначала 10–20%, потом 100%.
6. Откат: задеплоить предыдущую версию (76 = `082e4004-398c-4f3f-b777-bc3188c8300a`) — мгновенно, без пересборки.

## ЗАПРЕТ: выкладка ассетов из git
Пока зеркало не подтверждено полным, **нельзя** выкладывать ассеты: манифест должен содержать весь сайт, а файлы, которых в манифесте нет, с сайта удаляются. Cloudflare не умеет перечислять существующие ассеты, поэтому полнота `site/` недоказуема: нет ≈1290 файлов `p/**`, статического `sitemap.xml` и всего, на что никто не ссылается. Любой деплой ассетов из `site/` сейчас удалил бы их с сайта. Снять запрет можно, только когда недостающее будет восстановлено (например, из исходного `full/` на машине владельца) и `verify_assets.mjs` покажет 0 «не хранится».

## Подключение Workers Builds (позже)
См. отчёт в чате; кратко: тот же воркер, ветка `main`, build без шагов, deploy-команда без ассетов (`wrangler versions upload`, не `deploy`), non-production branch builds — превью, отдельный API-токен с минимальными правами, секреты не в git.
