# دعوت نیلو — Nilou Invitation

> یک وب‌اپلیکیشن شخصی، محترمانه، امن و آماده‌ی تولید برای یک دعوت دوستانه در تهران.
> A private, respectful, production-ready Persian (RTL) invitation web app.

دعوت یک تجربه‌ی چندمرحله‌ای است: خوش‌آمد، پرسش بازیگوشانه‌ی «بله/نه»، انتخاب نوع
برنامه، انتخاب زمان با تقویم شمسی، شماره‌ی تماس اختیاری با رضایت صریح، مرور، و صفحه‌ی
موفقیت به‌همراه کارت تماس مجید. پاسخ‌ها در داشبورد مدیریتی امن دیده می‌شوند و اعلان‌ها
از طریق تلگرام/ایمیل ارسال می‌گردند.

---

## 🚀 اجرای سریع روی سرور با Docker (سه دستور)

روی هر سروری که Docker و Docker Compose دارد:

```bash
git clone <your-repo-url> daavat && cd daavat
node scripts/init-env.mjs "admin@you.com" "YourAdminPassword"   # می‌سازد .env با کلیدهای تصادفی
docker compose up --build -d
```

سپس لینک دعوت را از لاگ بگیر:

```bash
docker compose logs app | grep "Invitation link"
```

همین! کانتینر به‌صورت خودکار:

- مهاجرت‌های دیتابیس را اجرا می‌کند (`prisma migrate deploy`)
- یک دعوت برای نیلو می‌سازد (idempotent) و لینکش را در لاگ چاپ می‌کند
- سرور را روی پورت `3000` بالا می‌آورد (اپ + PostgreSQL هر دو در Compose)

> اگر `node` روی سرور نصب نیست، به‌جای `init-env.mjs` فایل `.env` را از روی
> `.env.example` بساز و مقادیر `SESSION_SECRET`، `PHONE_ENCRYPTION_KEY`،
> `ADMIN_EMAIL` و `ADMIN_PASSWORD` را پر کن:
> ```bash
> cp .env.example .env
> # SESSION_SECRET:     openssl rand -base64 48
> # PHONE_ENCRYPTION_KEY: openssl rand -base64 32
> ```

> **برای ورود مدیر در تولید HTTPS لازم است** (کوکی نشست `Secure` است). جریان عمومی
> دعوت روی HTTP هم کار می‌کند. بخش «Reverse proxy» را پایین‌تر ببین.

---

## فهرست / Table of contents

- [ویژگی‌ها](#ویژگیها--features)
- [معماری](#معماری--architecture)
- [تکنولوژی‌ها](#تکنولوژیها--tech-stack)
- [ساختار پروژه](#ساختار-پروژه--project-structure)
- [راه‌اندازی محلی](#راهاندازی-محلی--local-development)
- [متغیرهای محیطی](#متغیرهای-محیطی--environment-variables)
- [تلگرام و ایمیل](#تلگرام-و-ایمیل--telegram--email)
- [تست‌ها](#تستها--testing)
- [Docker با جزئیات](#docker-با-جزئیات--docker-in-depth)
- [Reverse proxy و HTTPS](#reverse-proxy-و-https)
- [GitHub و CI](#github-و-ci)
- [استقرار روی Vercel](#استقرار-روی-vercel-مسیر-a)
- [امنیت و حریم خصوصی](#امنیت-و-حریم-خصوصی--security--privacy)
- [حذف شماره](#حذف-شماره--deleting-a-stored-phone)
- [عیب‌یابی](#عیبیابی--troubleshooting)
- [لینک نهایی](#لینک-نهایی--final-link)

---

## ویژگی‌ها / Features

- تجربه‌ی چندمرحله‌ای کاملاً **RTL** و موبایل‌محور با انیمیشن‌های ظریف (Framer Motion).
- دکمه‌ی «بله» که با هر «نه» بزرگ‌تر می‌شود — **بدون فرار از موس، بدون مخفی‌کردن
  گزینه‌ی نه، حداکثر ۴ کلیک** و یک گزینه‌ی «جدی می‌گم، فعلاً نمی‌خوام» برای ردِ محترمانه.
- انتخاب برنامه (قهوه و گپ، پیاده‌روی و قهوه، قرار ورزشی، صبحانه، گالری‌گردی،
  غافلگیری، یا انتخاب دلخواه).
- زمان‌بندی با **تقویم شمسی**، ارقام فارسی، منطقه‌ی زمانی `Asia/Tehran`، ذخیره‌ی UTC،
  و انتخاب تا سه زمان با اولویت‌بندی قابل‌جابه‌جایی با کیبورد.
- شماره‌ی تماس **اختیاری با رضایت صریح** و **رمزنگاری AES-256-GCM**.
- کارت تماس مجید فقط **بعد از پذیرش** (کپی/تماس/پیامک/واتساپ).
- اعلان به مجید از طریق **تلگرام** و **ایمیل**، با ذخیره‌ی وضعیت و تلاش مجدد.
- **داشبورد مدیریتی امن**: مشاهده‌ی پاسخ‌ها، نمایش/حذف شماره، تلاش مجدد اعلان، تأیید
  قرار نهایی، خروجی JSON، فایل تقویم (ICS) و گزارش فعالیت.
- ویرایش پاسخ با **توکن امن**؛ تم روشن/تیره/سیستم؛ دسترس‌پذیری WCAG 2.2 AA؛ حالت کاهش حرکت.

## معماری / Architecture

```
Browser (RTL, Persian)
   │  Server Actions (typed, Zod-validated)
   ▼
Next.js App Router (RSC + Server Actions)
   │            │                 │
   ▼            ▼                 ▼
Prisma ORM   Notifications     Auth (bcrypt + JWT cookie)
   │          (Telegram/SMTP)
   ▼
PostgreSQL   ── phone AES-256-GCM encrypted, datetimes in UTC
```

**جریان ثبت پاسخ (transaction-safe):** اعتبارسنجی → ذخیره در تراکنش → commit →
تلاش برای اعلان (بعد از ذخیره) → ثبت وضعیت اعلان → پاسخ امن. خطای اعلان هرگز باعث
از دست رفتن پاسخ نمی‌شود.

## تکنولوژی‌ها / Tech stack

Next.js 15 (App Router, RSC, Server Actions) · TypeScript strict · React 19 ·
Tailwind CSS + shadcn-style + Radix + Lucide · Framer Motion · next-themes ·
Zod · Prisma + PostgreSQL · bcryptjs + jose · dayjs + jalaali-js · nodemailer +
Telegram Bot API · Vitest + Testing Library · Playwright + axe · Docker · GitHub Actions.

## ساختار پروژه / Project structure

```
src/
  app/            routes: invite/[slug] (+edit/[token]), admin/*, api/health, api/calendar/[token]
  components/     invitation/*, admin/*, ui/* (shadcn-style), shared
  lib/            env, db, crypto, auth, datetime, phone, notifications, validation…
  server/actions/ typed Server Actions (invitation, admin)
  tests/          Vitest unit + component
prisma/           schema, migrations, seed.ts (local), seed.mjs (container)
e2e/              Playwright specs + global setup
scripts/          init-env, gen-secrets, hash-password
```

## راه‌اندازی محلی / Local development

```bash
npm install
node scripts/init-env.mjs "admin@you.com" "YourAdminPassword"   # یا: cp .env.example .env

# Postgres (اگر Docker داری فقط دیتابیس را بالا بیاور)
docker run -d --name nilou-pg -e POSTGRES_USER=nilou -e POSTGRES_PASSWORD=nilou \
  -e POSTGRES_DB=nilou -p 5432:5432 postgres:16-alpine

npm run prisma:migrate     # ساخت جداول
npm run db:seed            # ساخت دعوت + چاپ لینک
npm run dev                # http://localhost:3000
```

## متغیرهای محیطی / Environment variables

همه در `.env.example` مستند شده‌اند.

| متغیر | توضیح |
|---|---|
| `DATABASE_URL` | رشته‌ی اتصال PostgreSQL (در Docker به‌صورت خودکار override می‌شود) |
| `NEXT_PUBLIC_APP_URL` | آدرس عمومی اپ |
| `INVITATION_SLUG` | اسلاگ ثابت (اختیاری؛ seed در نبودش می‌سازد) |
| `ADMIN_EMAIL` | ایمیل ورود مدیر |
| `ADMIN_PASSWORD` | رمز مدیر (ساده؛ در حافظه هش می‌شود) — یا … |
| `ADMIN_PASSWORD_HASH` | هش bcrypt رمز (ترجیح تولید؛ `npm run admin:hash`) |
| `SESSION_SECRET` | امضای session (≥ ۳۲ کاراکتر) |
| `PHONE_ENCRYPTION_KEY` | کلید AES-256-GCM (base64، دقیقاً ۳۲ بایت) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | اعلان تلگرام (اختیاری) |
| `EMAIL_PROVIDER=smtp`, `SMTP_*`, `EMAIL_FROM/TO` | اعلان ایمیل (اختیاری) |
| `TIME_SLOTS` | بازه‌های زمانی سفارشی مثل `10:00,12:00,18:00` (اختیاری) |
| `POSTGRES_USER/PASSWORD/DB` | برای docker-compose |

اعتبارسنجی متغیرها هنگام راه‌اندازی سرور انجام می‌شود؛ در production نبودِ کلیدهای
حیاتی باعث توقف امن می‌شود.

## تلگرام و ایمیل / Telegram & email

**Telegram:** با [@BotFather](https://t.me/BotFather) بات بساز و توکن بگیر → یک پیام
به بات بده → `chat.id` را از `https://api.telegram.org/bot<TOKEN>/getUpdates` بردار →
`TELEGRAM_BOT_TOKEN` و `TELEGRAM_CHAT_ID` را در `.env` بگذار.

**Email (SMTP):** `EMAIL_PROVIDER=smtp` و مقادیر `SMTP_*`, `EMAIL_FROM`, `EMAIL_TO`.
اگر هیچ کانالی تنظیم نشود، پاسخ‌ها همچنان ذخیره و در داشبورد دیده می‌شوند.

## تست‌ها / Testing

```bash
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit (strict)
npm run test          # Vitest (unit + component)
npm run test:e2e      # Playwright (dev server را خودش بالا می‌آورد)
```

به‌صورت محلی e2e از Chrome سیستم استفاده می‌کند؛ در CI از chromium نصب‌شده.

## Docker با جزئیات / Docker in depth

- **Dockerfile** چندمرحله‌ای، خروجی `standalone`، اجرای **non-root**، همراه با
  Prisma CLI/engines برای اجرای مهاجرت‌ها هنگام استارت.
- `docker-entrypoint.sh`: `migrate deploy` → seed idempotent → `node server.js`.
- **docker-compose.yml**: سرویس `db` (PostgreSQL با volume و healthcheck) و `app`
  (با healthcheck روی `/api/health`، `restart: unless-stopped`، و وابستگی به سلامت db).

دستورهای مفید:

```bash
docker compose up --build -d
docker compose logs -f app
docker compose exec db psql -U nilou -d nilou
docker compose exec db pg_dump -U nilou nilou > backup.sql   # بکاپ
docker compose down            # توقف (داده‌ها در volume می‌مانند)
docker compose down -v         # توقف + حذف داده‌ها
```

## Reverse proxy و HTTPS

برای تولید، پشت یک reverse proxy با TLS قرار بده. نمونه‌ی **Caddy** (خودکار HTTPS):

```
your-domain.com {
  reverse_proxy 127.0.0.1:3000
}
```

یا **Nginx + Certbot**. سپس در `.env` مقدار `NEXT_PUBLIC_APP_URL=https://your-domain.com`
را ست کن و کانتینر را دوباره بالا بیاور. HTTPS برای ورود مدیر ضروری است.

## GitHub و CI

```bash
git init && git add . && git commit -m "feat: nilou invitation app"
git branch -M main && git remote add origin <repo-url> && git push -u origin main
```

`.gitignore` از commit شدن `.env` و اسرار جلوگیری می‌کند.
**GitHub Actions** (`.github/workflows/ci.yml`): lint، typecheck، unit tests،
production build، Playwright e2e (با سرویس PostgreSQL)، و بیلد ایمیج Docker.

## استقرار روی Vercel (مسیر A)

1. ریپو را به Vercel وصل کن.
2. PostgreSQL مدیریت‌شده (Neon/Supabase) بساز و `DATABASE_URL` را بگیر.
3. Env Variables را در Vercel ست کن: `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`,
   `SESSION_SECRET`, `PHONE_ENCRYPTION_KEY`, `ADMIN_EMAIL`, و
   `ADMIN_PASSWORD` (یا `ADMIN_PASSWORD_HASH`)، و در صورت نیاز `TELEGRAM_*`/`SMTP_*`.
4. یک‌بار از ماشین خودت: `npx prisma migrate deploy` و `npm run db:seed`.
5. Deploy. لینک: `https://<project>.vercel.app/invite/<slug>`.

> طرح‌های رایگان ممکن است cold start یا محدودیت اتصال داشته باشند؛ محدودیت‌ها را
> هنگام استقرار بررسی کن. هیچ سرویسی «همیشه رایگان» تضمین نمی‌شود.

## امنیت و حریم خصوصی / Security & privacy

- اعتبارسنجی سمت سرور برای هر mutation؛ محدودسازی نرخ (submit و ورود مدیر).
- **رمزنگاری شماره** با AES-256-GCM و nonce تصادفی؛ کلید فقط سمت سرور. فقط ۴ رقم آخر
  برای ماسک ذخیره می‌شود. شماره هرگز در لاگ/URL/باندل کلاینت نمی‌نشیند.
- توکن ویرایش به‌صورت **هش SHA-256**؛ مقایسه‌های حساس constant-time.
- session با کوکی HttpOnly، `SameSite=Lax`، و `Secure` در production.
- هدرهای امنیتی + **CSP**؛ کل اپ `noindex/nofollow` و `robots.txt` مسدودکننده.
- شناسه‌ها cuid (غیرقابل حدس)؛ لاگ‌های ساختاریافته و redact-شده.
- شماره‌ی مجید فقط پس از پذیرش و از سمت سرور بازگردانده می‌شود.

## حذف شماره / Deleting a stored phone

در `/admin/responses/[id]` → «شماره تماس» → **حذف شماره** (با دیالوگ تأیید). شماره‌ی
رمزنگاری‌شده، ۴ رقم آخر و زمان رضایت برای همیشه پاک و در Audit log ثبت می‌شود.

## عیب‌یابی / Troubleshooting

- **`Environment problems` هنگام استارت:** `SESSION_SECRET` (≥۳۲)، یکی از
  `ADMIN_PASSWORD`/`ADMIN_PASSWORD_HASH`، و `PHONE_ENCRYPTION_KEY` (۳۲ بایت base64) را چک کن.
- **هش رمز کار نمی‌کند (روش hash):** `$` را در `.env` با `\$` فرار بده — یا ساده‌تر،
  از `ADMIN_PASSWORD` استفاده کن.
- **ورود مدیر روی http محلی نمی‌ماند:** در production کوکی `Secure` است؛ HTTPS بگذار
  یا برای تست محلی `NODE_ENV=development`.
- **اعلان تلگرام نمی‌رسد:** توکن/Chat ID را چک کن؛ از داشبورد «تلاش دوباره» را بزن.
- **Playwright مرورگر دانلود نمی‌کند:** محلی از Chrome سیستم استفاده می‌شود؛ در CI
  `npx playwright install chromium`.

## لینک نهایی / Final link

```
https://<your-domain>/invite/<secure-slug>
```

اسلاگ را از خروجی seed، از `INVITATION_SLUG`، یا از دیتابیس بردار
(`docker compose exec db psql -U nilou -d nilou -c 'SELECT slug FROM "Invitation";'`).
همین لینک را برای نیلو بفرست.

---

ساخته‌شده با احترام. 🌱
