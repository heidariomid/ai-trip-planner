قدم ۱ تمام شد: اپ حالا روی Expo Router است و روی شبیه‌ساز iPhone 17 بالا آمد (باندل تمیز، بدون خطا).

## چه چیزی عوض شد

- **نصب شد:** `expo-router`، `react-native-safe-area-context`، `react-native-screens`، `expo-linking`، `expo-constants`، `expo-status-bar` — همه با `npx expo install` و سازگار با SDK 57.
- **حذف شد:** `App.tsx` و `index.ts`.
- **ساخته شد:** `app/_layout.tsx` (یک `<Stack>` بدون هدر به‌علاوه‌ی `StatusBar`) و `app/index.tsx` (صفحه‌ی موقت).
- `package.json`\*:\*\* مقدار `main` شد `expo-router/entry`.
- `app.json`\*:\*\* اضافه شدن `scheme: "aitripplanner"`، `experiments.typedRoutes`، و `web.bundler: "metro"`. پلاگین `expo-router` را خود نصب‌کننده اضافه کرد.
- `tsconfig.json`\*:\*\* افزودن `include` برای `.expo/types` تا تایپ مسیرها کار کند.

## تأیید

`npx tsc --noEmit` پاس شد، Metro باندل را در ۳.۷ ثانیه بدون خطا ساخت، و صفحه روی شبیه‌ساز رندر شد. `scheme` هم در کانفیگِ حل‌شده دیده می‌شود — همان چیزی که بعداً بازگشت OAuth گوگل به آن تکیه می‌کند.

## یک نکته درباره‌ی expo-doctor

از ۱۸ چک، یکی خطا می‌دهد: «Check Expo config schema» با پیام `Unexpected token '<'`. آن چک اسکیما را از شبکه می‌گیرد و به‌جای JSON یک صفحه‌ی HTML تحویل گرفته — یعنی مشکل شبکه‌ی این دستگاه است، نه پروژه. دوبار اجرا کردم و هر بار همین شد، ولی `npx expo config --type public` کانفیگ را درست حل می‌کند. این را در [AGENTS.md](http://AGENTS.md) یادداشت کردم تا دفعه‌ی بعد کسی دنبالش نگردد.

## پاک‌سازی

Metro بسته شد (پورت ۸۰۸۱ آزاد است) و اسکرین‌شات QA حذف شد.

نوبت توست: کلیدهای Supabase را در `.env` بگذار تا قدم ۲ را شروع کنم.
