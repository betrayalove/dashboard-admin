# Дашборд / Админ-панель

## Описание

SPA: страница логина, дашборд с виджетами и графиками (Recharts), таблица пользователей с сортировкой и пагинацией, страница настроек. Backend на Node.js + Express отдаёт REST API с JWT в httpOnly cookie и WebSocket для обновлений в реальном времени. Демонстрирует Zustand, CSS Modules, FSD, JWT (cookie), WebSocket.

## Возможности

- Вход по логину/паролю (JWT в httpOnly cookie)
- Дашборд: метрики, линейный и столбчатый графики
- WebSocket: обновление метрик и уведомления в реальном времени
- Таблица пользователей: сортировка, пагинация, выбор строк
- Страница настроек
- Защищённые и гостевые маршруты

## Стек

- **Фронтенд:** React 18, TypeScript, Zustand, CSS Modules, Vite, React Router, Recharts
- **Бэкенд:** Node.js, Express, JWT, cookie-parser, WebSocket (ws)
- **Тесты:** Jest, React Testing Library; E2E: Playwright

## Переменные окружения

См. [.env.example](.env.example). Скопируйте в `.env` и при необходимости измените (PORT, WS_PORT, JWT_SECRET).

## Команды

- `npm install` — установка зависимостей
- `npm run dev` — только фронтенд (Vite, http://localhost:5173)
- `npm run build` — сборка фронтенда (TypeScript + Vite)
- `npm run preview` — просмотр собранной сборки
- `npm run test` — unit-тесты (Jest)
- `npm run e2e` — E2E (Playwright); перед первым запуском: `npx playwright install`
- `npm run e2e:ui` — E2E с UI Playwright
- `npm start` — запуск backend и фронтенда одной командой (concurrently)
- `npm run server` — только backend (REST + WebSocket)

## Авторизация

JWT хранится в **httpOnly cookie**. При успешном `POST /api/auth/login` сервер устанавливает cookie (`auth_token`) с флагами HttpOnly, SameSite=Strict, Path=/. Фронтенд не пишет токен в localStorage; все REST-запросы с `credentials: 'include'`. Токен в памяти (Zustand) используется только для WebSocket (передача в query, т.к. WS на отдельном порту). Проверка сессии — через `GET /api/auth/me`. Выход — `POST /api/auth/logout` (сброс cookie) и очистка состояния.

## Запуск backend

В корне проекта: `npm run server` (или `npm start` для API + фронт). REST API: http://localhost:3081, WebSocket: ws://localhost:3082. Вход: логин `admin`, пароль `admin`. В папке `server`: `npm run start`.

## Структура проекта

- **src/app** — провайдеры, роутер, хранилища Zustand (auth, users, dashboard, toasts), layout
- **src/pages** — dashboard, users-table, settings, login
- **src/features** — auth (форма логина), table-actions, toast
- **src/shared** — ui (кнопки, инпуты, карточки, скелетон), api (client с credentials), lib (константы), auth (token.ts), styles (tokens.ts)
- **server** — Node.js + Express: маршруты auth (login, logout, me), dashboard, users; middleware JWT (cookie или Bearer); WebSocket-сервер (ws)
