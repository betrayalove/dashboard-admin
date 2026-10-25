# Дашборд / Админ-панель

React 18, TypeScript, Zustand, Recharts, CSS Modules, Vite. Демонстрационный Express backend: cookie-сессия JWT, REST, WebSocket, файловое хранение пользователей. Вход: `admin` / `admin`. Не используйте демо для реальных персональных данных.

## Локальный запуск

Используйте Node.js 24 (`nvm use`). Установка обеих частей обязательна:

```sh
npm ci
npm ci --prefix server
cp server/.env.example server/.env
npm start
```

Frontend: http://localhost:5173. Backend: http://localhost:3081, WebSocket: `/ws` на том же порту. Vite проксирует `/api` и `/ws`; сторонние cookie не нужны. Сервер сам загружает `server/.env`, Vite — корневой `.env`. В development без JWT_SECRET создаётся случайный ключ процесса; перезапуск завершает сессии. Production требует внешний JWT_SECRET от 32 символов и ALLOWED_ORIGINS.

Для других портов настройте `PORT` сервера и `API_TARGET`/`FRONTEND_PORT` Vite. Данные по умолчанию сохраняются в `server/.data/users.json`; DATA_FILE задаёт другой путь. Удаление действительно меняет этот файл. Вернуть исходные демо-данные можно удалением файла при остановленном сервере.

## Проверки

```sh
npm run typecheck
npm test
npm run test:server
npm run build
npx playwright install chromium
npm run e2e
```

E2E самостоятельно поднимает backend на 3181 и frontend на 5373, использует отдельный файл данных и останавливает процессы. Переменные BACKEND_PORT/FRONTEND_PORT меняют порты. CI выполняет все проверки на Node 24 и запускает E2E на собранном production frontend. Локально после build можно выполнить `E2E_PREVIEW=1 npm run e2e`. Vite-конфигурация не генерирует JS/d.ts рядом с TS.

## Возможности

- Вход/выход с JWT только в httpOnly cookie, восстановление вложенного маршрута при обновлении.
- REST-метрики и диаграммы, одноразовый WS-ticket на 60 секунд; сообщения `stats-update` и `notification`, переподключение при разрыве.
- Таблица с сортировкой, пагинацией и серверным удалением; выбор и пагинация обновляются после удаления.
- Название дашборда, тема и период диаграмм сохраняются и применяются при запуске. Данные диаграмм демонстрационные, период меняет показанный набор.

## Vercel + Render

1. Подключите репозиторий к Render через `render.yaml`: бесплатный Node web service, root `server`, build `npm ci --omit=dev`, start `npm start`, health `/health`. Blueprint генерирует JWT_SECRET. Задайте ALLOWED_ORIGINS каноническим production origin Vercel `https://dashboard-admin-six-pi.vercel.app` (при другом alias также задайте GATEWAY_ORIGIN на Vercel; несколько значений через запятую).
2. Подключите тот же репозиторий к Vercel: Node 24, build `npm run build`, output `dist`. Задайте серверный `API_ORIGIN=https://YOUR-SERVICE.onrender.com` и build-переменную `VITE_WS_URL=wss://YOUR-SERVICE.onrender.com/ws`. Пересоберите после смены переменных.
3. `api/proxy.js` получает вложенные маршруты через явный rewrite `/api/:path*` → `/api/proxy?path=:path*` и передаёт API через тот же origin Vercel и сохраняет HttpOnly/Secure/SameSite=Lax cookie. REST всегда использует относительный `/api`: устаревшая переменная VITE_API_BASE игнорируется, включая существующие настройки Vercel, чтобы cookie не уходили в cross-site запросы. Gateway проверяет клиентский Origin по текущему host, а backend получает канонический Origin из GATEWAY_ORIGIN (по умолчанию `https://dashboard-admin-six-pi.vercel.app`), поэтому для HTTP API preview не нужен wildcard в ALLOWED_ORIGINS. WS проверяет реальный origin браузера: для WS из preview добавьте его точный origin в ALLOWED_ORIGINS либо проверяйте realtime на production alias. WS идёт прямо в Render с коротким одноразовым ticket; JWT сессии никогда не передаётся JavaScript и WS URL.
4. `vercel.json` настраивает fallback SPA; проверьте прямые `/users`, `/settings`, вход, refresh и обновление WS. Уберите Deployment Protection у публичного production demo в Vercel и используйте production alias, а не защищённый preview URL.

Бесплатный Render засыпает при простое и теряет файловые изменения при redeploy/restart; поэтому удаление переживает обновление страницы, но не гарантируется между перезапусками хостинга. Постоянное хранение требует внешней БД либо постоянного диска с DATA_FILE на его mount path (платные ресурсы автоматически не создаются). В локальном запуске файл сохраняется между перезапусками.

После push GitHub запускает CI; подключённые Vercel/Render автоматически деплоят main. При необходимости обязательного ожидания CI перед deploy включите в Render “After CI Checks Pass” и используйте защищённую main с required CI check в GitHub; эти настройки аккаунта не хранятся в коде. Секреты в Git не добавляйте.
