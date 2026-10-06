<div dir="rtl" align="right">

# فاز ۱ — ورود و ثبت‌نام با Supabase (توضیح ساده)

> این فایل برای یادگیری نوشته شده، نه به‌عنوان مرجع رسمی. هر کاری که در این فاز انجام شد را با زبان ساده و با دلیلش توضیح می‌دهد. مرجع رسمی همان `context/current-feature.md` است.

## در یک نگاه

قبل از این فاز، اپ فقط یک صفحه‌ی خالی بود. الان:

- کاربر می‌تواند **ثبت‌نام کند**، **وارد شود**، و **خارج شود**.
- اطلاعاتش در یک جدول به اسم `profiles` ذخیره می‌شود.
- اگر اپ را ببندد و دوباره باز کند، هنوز وارد است.
- هیچ‌کس نمی‌تواند پروفایل کاربر دیگر را بخواند.

همه‌ی کدها روی شاخه‌ی گیت `feature/supabase-auth` هستند.

---

## قدم ۱ — وصل شدن به Supabase

### Supabase چیست؟

یک سرویس آماده که سه چیز به ما می‌دهد: **دیتابیس** (Postgres)، **سیستم احراز هویت** (ثبت‌نام و ورود)، و **فضای ذخیره‌سازی فایل**. یعنی لازم نیست خودمان سرور بنویسیم.

### دو کلید که اپ لازم دارد

در فایل `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```


سه نکته‌ی مهم:

۱. **چرا `EXPO_PUBLIC_` اولش؟** در Expo فقط متغیرهایی که با این پیشوند شروع می‌شوند به داخل اپ راه پیدا می‌کنند. بقیه نادیده گرفته می‌شوند.

۲. **یعنی این کلید عمومی است؟** بله. هر چیزی که داخل اپ باشد قابل استخراج است. ولی اشکالی ندارد — کلید `publishable` اصلاً برای همین ساخته شده. چیزی که **هرگز** نباید وارد پروژه شود کلید `sb_secret_…` است.

۳. **چرا `publishable` و نه `anon`؟** Supabase دارد کلیدهای قدیمی `anon` و `service_role` را تا پایان ۲۰۲۶ بازنشسته می‌کند. کلید قدیمی خیلی بلند است و با `eyJ` شروع می‌شود. ما از همان اول کلید جدید را برداشتیم تا بعداً مجبور به مهاجرت نشویم.

> فایل `.env` در `.gitignore` هست، پس روی گیت نمی‌رود. فایل `.env.example` فقط **اسم** متغیرها را دارد (بدون مقدار) و روی گیت می‌رود تا نفر بعدی بداند چه چیزی لازم است.

---

## قدم ۲ — دیتابیس

این مهم‌ترین و کم‌شهودترین بخش کار بود. سه تکه دارد.

### الف) چرا جدول `profiles` لازم است؟

Supabase خودش جدولی به اسم `auth.users` دارد که ایمیل و رمز را نگه می‌دارد. اما **آن جدول مال Supabase است و ما نباید دستکاری‌اش کنیم**. هر اطلاعاتی که مال اپ خودمان است (اسم، عکس پروفایل، و بعداً تنظیمات سفر) باید در جدول خودمان باشد.

```sql
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```


`references auth.users (id) on delete cascade` یعنی: شناسه‌ی هر پروفایل، همان شناسه‌ی کاربر در Supabase است؛ و اگر کاربر حذف شود، پروفایلش هم خودکار پاک می‌شود.

### ب) RLS — مهم‌ترین خط امنیتی پروژه

**RLS** یعنی Row Level Security، یا «امنیت در سطح ردیف». دیتابیس خودش تصمیم می‌گیرد هر کاربر اجازه‌ی دیدن کدام ردیف‌ها را دارد.

```sql
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);
```


ترجمه‌ی خط آخر: «کاربر فقط ردیفی را می‌بیند که `id` آن برابر شناسه‌ی خودش باشد.»

چرا این‌قدر مهم است؟ چون کلید `publishable` داخل اپ است و هر کسی می‌تواند درش بیاورد. اگر RLS خاموش باشد، آن شخص می‌تواند **کل جدول** را بخواند.

> نکته‌ای که زیاد گیج‌کننده است: جدولی که RLS روشن دارد ولی هیچ policy ندارد، **خالی برمی‌گرداند** — نه خطا. یعنی اگر کوئری‌ات بی‌دلیل خالی برگشت، اول policy را چک کن.

پس قاعده‌ی پروژه این شد: **هر جدول جدید، در همان migration که ساخته می‌شود، RLS و policy‌اش را هم بگیرد.**

### ج) تریگر — ردیف پروفایل را دیتابیس می‌سازد، نه اپ

وقتی کسی ثبت‌نام می‌کند، باید یک ردیف در `profiles` ساخته شود. سؤال: این کار را چه کسی انجام دهد؟

**راه اشتباه:** اپ بعد از ثبت‌نام یک `insert` بزند. سه مشکل دارد:

- ورود با گوگل اصلاً از فرم ثبت‌نام ما رد نمی‌شود، پس از قلم می‌افتد.
- اگر کاربر دقیقاً همان لحظه اپ را ببندد، کاربر ساخته شده ولی پروفایل نه.
- اگر تأیید ایمیل روشن باشد، هنوز نشستی وجود ندارد و اپ اصلاً اجازه‌ی `insert` ندارد.

**راه درست:** یک **تریگر** در خود دیتابیس:

```sql
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
```


چند اصطلاح:

- **تریگر (trigger):** کدی که دیتابیس خودش، هر بار که اتفاق خاصی می‌افتد، اجرا می‌کند. اینجا: «هر بار که ردیفی به `auth.users` اضافه شد».
- **`security definer`:** یعنی این تابع با دسترسی سازنده‌اش اجرا می‌شود، نه با دسترسی کاربر. برای همین می‌تواند در `profiles` بنویسد با اینکه policy‌ای برای `insert` نگذاشتیم.
- **`raw_user_meta_data`:** یک ستون JSON که اطلاعات اضافی کاربر در آن می‌نشیند. فرم ثبت‌نام ما اسم را با کلید `full_name` می‌فرستد، ولی گوگل همان چیز را `name` صدا می‌زند. `coalesce` یعنی «اولی را بردار، اگر خالی بود دومی را».
- **`set search_path = ''`:** یک قفل امنیتی. مجبورمان می‌کند اسم کامل جدول‌ها را بنویسیم (`public.profiles` نه فقط `profiles`) تا کسی نتواند با ساختن جدول هم‌نام، تابع را فریب دهد.

### کجا نگه داشته شد؟

در `supabase/migrations/0001_profiles.sql`.

**چرا فایل و نه فقط کلیک در پنل؟** اگر SQL را در پنل بزنی و ذخیره نکنی، هیچ ردی نمی‌ماند از اینکه دیتابیس چطور به این شکل رسید. با فایل، هم قابل مرور است و هم قابل اجرای دوباره روی یک پروژه‌ی تازه.

---

## قدم ۳ — پکیج‌هایی که نصب شد

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage \
  react-native-url-polyfill expo-auth-session expo-web-browser expo-linking expo-crypto
```


| پکیج | کارش چیست |
| --- | --- |
| `@supabase/supabase-js` | کتابخانه‌ی اصلی ارتباط با Supabase |
| `@react-native-async-storage/async-storage` | حافظه‌ی دائمی روی گوشی؛ نشست کاربر اینجا ذخیره می‌شود |
| `react-native-url-polyfill` | **اختیاری نیست.** کلاس `URL` در React Native ناقص است و `supabase-js` با آن آدرس می‌سازد |
| `expo-auth-session` | ساختن آدرس بازگشت و خواندن توکن از آن |
| `expo-web-browser` | باز کردن مرورگر برای ورود با گوگل |
| `expo-linking` | گرفتن لینکی که اپ با آن باز شده |

> **چرا `npx expo install` و نه `npm install`؟** چون `expo install` نسخه‌ای را می‌آورد که با SDK فعلی (اینجا ۵۷) سازگار است. `npm install` آخرین نسخه را می‌آورد؛ کد **کامپایل می‌شود** ولی ممکن است روی گوشی کرش کند. این بدترین نوع باگ است چون در مرحله‌ی کدنویسی دیده نمی‌شود.

---

## قدم ۴ — کلاینت Supabase

فایل `lib/supabase.ts`. فقط **یک بار** ساخته می‌شود و همه‌جا import می‌شود — هرگز داخل کامپوننت `createClient` صدا نمی‌زنیم.

```ts
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```


دو تنظیم که پیش‌فرضشان روی موبایل **غلط** است:

۱. **`detectSessionInUrl: Platform.OS === "web"`** — این قابلیت مال وب است، جایی که توکن داخل آدرس مرورگر می‌آید. روی موبایل چنین آدرسی وجود ندارد و روشن ماندنش خطا می‌دهد؛ پس روی موبایل خاموش و روی وب روشن است. (بخش «ورود با گوگل» پایین‌تر توضیح می‌دهد چرا وب به آن نیاز دارد.)

۲. **شنونده‌ی `AppState`:**

```ts
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
```


توکن ورود عمر کوتاهی دارد و باید مرتب تازه شود. اگر این شنونده نباشد، کاربر اپ را در پس‌زمینه می‌گذارد، توکن منقضی می‌شود، و وقتی برمی‌گردد بی‌سروصدا از حساب خارج شده است.

**چرا AsyncStorage و نه SecureStore؟** `expo-secure-store` امن‌تر است، اما برای هر مقدار محدودیت حجم دارد و نشست Supabase می‌تواند از آن رد شود. نتیجه‌اش نشستی است که اصلاً ذخیره نمی‌شود. فعلاً AsyncStorage، و قبل از انتشار دوباره بررسی می‌شود.

---

## قدم ۵ — لایه‌ی `lib/`

قاعده‌ی پروژه: **هیچ کامپوننتی مستقیم با شبکه حرف نمی‌زند.** هر چه کار شبکه است در `lib/` می‌نشیند تا صفحه با یک بار خواندن قابل فهم بماند.

### `lib/auth.ts`

همه‌ی عملیات ورود و ثبت‌نام. همه یک شکل مشترک برمی‌گردانند:

```ts
export interface AuthResult {
  success: boolean;
  error: string | null;   // جمله‌ای که به کاربر نشان داده می‌شود
  notice?: string;        // وقتی کار موفق بود ولی کاربر هنوز کاری دارد
}
```


### `lib/auth-errors.ts` — ترجمه‌ی خطا به زبان آدمیزاد

Supabase خطا را با کد می‌دهد؛ ما آن را به جمله تبدیل می‌کنیم:

```ts
const MESSAGES: Record<string, string> = {
  invalid_credentials: "That email and password don't match an account.",
  user_already_exists: "An account with that email already exists. Sign in instead.",
  weak_password: "That password is too weak. Use at least 6 characters.",
};
```


قاعده: **خطای خام هرگز به کاربر نشان داده نمی‌شود**، ولی همیشه در کنسول لاگ می‌شود تا ما بتوانیم دیباگ کنیم.

حالت قطعی اینترنت جداست، چون کد ندارد و فقط از روی اسمش شناخته می‌شود:

```ts
if (error.name === "AuthRetryableFetchError") return OFFLINE;
```


### `lib/validation.ts`

قبل از اینکه چیزی به شبکه برود، فرم چک می‌شود: ایمیل شکل درستی دارد؟ رمزها یکی هستند؟

> نکته‌ی مهم: این اعتبارسنجی فقط برای **تجربه‌ی کاربری** است، نه امنیت. امنیت واقعی کار دیتابیس و Supabase است. هر چیزی که فقط سمت اپ چک شود قابل دور زدن است.

### `lib/profiles.ts`

خواندن ردیف پروفایل:

```ts
.select("id, email, full_name, avatar_url")
```


**چرا `select("*")` نه؟** چون فقط همین چهار ستون روی صفحه نمایش داده می‌شود. ستاره یعنی کشیدن داده‌ای که استفاده نمی‌شود.

---

## قدم ۶ — نگهداری نشست

فایل `hooks/useAuth.tsx`. یک **Context** می‌سازد که تنها منبع حقیقت درباره‌ی نشست است. صفحه‌ها از آن می‌خوانند و هیچ‌کدام خودشان `getSession` صدا نمی‌زنند.

دو کار انجام می‌دهد:

```ts
// ۱. یک بار در شروع: نشست ذخیره‌شده را بخوان
supabase.auth.getSession().then(...)

// ۲. از آن به بعد: به هر تغییری گوش بده
supabase.auth.onAuthStateChange((_event, nextSession) => {
  setSession(nextSession);
});
```


به خاطر مورد دوم است که بعد از ورود موفق، **لازم نیست دستی به صفحه‌ی خانه برویم**. نشست عوض می‌شود، Context خبردار می‌شود، و مسیریابی خودش جابه‌جا می‌کند.

متغیر `isRestoring` هم هست: تا وقتی نشست ذخیره‌شده خوانده نشده `true` است. در ادامه می‌بینی چرا حیاتی است.

---

## قدم ۷ — مسیریابی و جلوگیری از «چشمک» صفحه‌ی ورود

ساختار پوشه‌ها:

```
app/
├── _layout.tsx          ریشه — Provider و نگهبان
├── (auth)/
│   ├── sign-in.tsx
│   └── sign-up.tsx
└── (app)/
    └── index.tsx        صفحه‌ی خانه
```


پرانتز در `(auth)` یعنی **این اسم در آدرس نمی‌آید**. یعنی `app/(auth)/sign-in.tsx` آدرسش می‌شود `/sign-in`. فقط برای گروه‌بندی است.

### نگهبان مسیر

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Protected guard={session !== null}>
    <Stack.Screen name="(app)" />
  </Stack.Protected>
  <Stack.Protected guard={session === null}>
    <Stack.Screen name="(auth)" />
  </Stack.Protected>
</Stack>
```


`Stack.Protected` روش جدید Expo Router است. وقتی شرطش برقرار نباشد، آن گروه **اصلاً وجود ندارد**. یعنی کاربرِ واردشده حتی با لینک مستقیم هم نمی‌تواند به `/sign-in` برود.

این بهتر از روش قدیمی `<Redirect>` است، چون در آن روش صفحه اول ساخته می‌شود و بعد کاربر پرت می‌شود بیرون.

### مسئله‌ی «چشمک»

تصور کن کاربر از قبل وارد است و اپ را باز می‌کند. خواندن نشست از حافظه چند صدم ثانیه طول می‌کشد. در آن فاصله `session` هنوز `null` است. اگر همان لحظه مسیریاب را نشان بدهیم، کاربر یک لحظه صفحه‌ی ورود را می‌بیند و بعد به خانه پرت می‌شود. زشت است و حس خرابی می‌دهد.

راه‌حل: **تا وقتی `isRestoring` روشن است، اصلاً مسیریاب را نساز.**

```tsx
if (isRestoring) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50">
      <ActivityIndicator size="large" color="#0284c7" />
    </View>
  );
}
```


---

## قدم ۸ — کامپوننت‌ها و صفحه‌ها

| فایل | کارش |
| --- | --- |
| `components/TextField.tsx` | یک فیلد با برچسب و پیام خطای زیرش |
| `components/Button.tsx` | دکمه با حالت لودینگ و غیرفعال |
| `components/FormMessage.tsx` | کادر پیام، قرمز برای خطا و آبی برای اطلاع |
| `components/AuthScreenLayout.tsx` | قالب مشترک دو صفحه‌ی ورود و ثبت‌نام |

### چرا `AuthScreenLayout` جدا شد؟

به‌خاطر **کیبورد**. رایج‌ترین باگ فرم در React Native این است که کیبورد بالا می‌آید و دکمه‌ی ثبت را می‌پوشاند. کاربر دکمه را نمی‌بیند و فکر می‌کند اپ خراب است.

```tsx
<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
  <ScrollView
    contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
    keyboardShouldPersistTaps="handled"
  >
```


`keyboardShouldPersistTaps="handled"` یعنی اگر کیبورد باز است و کاربر روی دکمه زد، همان اولین لمس کار کند — وگرنه اولین لمس فقط کیبورد را می‌بندد و باید دو بار بزند.

> این باگ در بازبینی کد **اصلاً دیده نمی‌شود**. فقط روی گوشی معلوم می‌شود. برای همین است که در این پروژه نوشته شده «تست روی دستگاه، نه در کامپایلر».

### جزئیات کوچک ولی مهم فیلدها

```tsx
autoCapitalize="none"
keyboardType="email-address"
autoCorrect={false}
```


اگر `autoCapitalize` را تنظیم نکنی، گوشی حرف اول ایمیل را بزرگ می‌کند، ورود شکست می‌خورد، و کاربر فکر می‌کند رمزش غلط است.

---

## چطور همه‌چیز تست شد

۱. **`npx tsc --noEmit`** — بدون خطا رد شد. (یعنی فقط تایپ‌ها درست‌اند، نه اینکه اپ کار می‌کند.)

۲. **شبیه‌ساز iPhone 17** — هر دو صفحه درست نمایش داده شدند و بدون نشست، اپ خودش روی `/sign-in` ایستاد.

۳. **نسخه‌ی وب** — بدون خطای کنسول بالا آمد. این مرحله الکی نیست: NativeWind روی وب مسیر کد متفاوتی دارد و قبلاً در همین پروژه خطایی داده که iOS هرگز ندیده بود.

۴. **یک چرخه‌ی کامل واقعی:** ساخت کاربر آزمایشی → چک کردن اینکه تریگر ردیف `profiles` را با اسم درست ساخته → ورود → دیدن صفحه‌ی خانه با اسم کاربر → خروج → ورود با رمز غلط و دیدن پیام فارسی‌فهمِ «That email and password don't match an account.»

۵. در پایان کاربر آزمایشی حذف شد و سرور Metro خاموش شد.

---

## چیزی که وسط تست کشف شد

ثبت‌نام کاربر آزمایشی موفق بود، **اما نشستی برنگرداند**. یعنی **تأیید ایمیل در پنل Supabase روشن است** — برخلاف چیزی که نقشه‌ی این فاز فرض کرده بود.

چرا مهم است؟ چون در این حالت کاربر دکمه‌ی «ثبت‌نام» را می‌زند، هیچ خطایی نمی‌گیرد، و هیچ اتفاقی هم نمی‌افتد. بدترین حالت ممکن.

راه‌حل موقتی که گذاشتم:

```ts
if (!data.session) {
  return {
    success: true,
    error: null,
    notice: "Account created. Check your email for a confirmation link, then sign in.",
  };
}
```


این فقط یک **محافظ** است تا دکمه بی‌صدا نماند. راه‌حل اصلی، خاموش کردن آن تنظیم در پنل است.

---

## کارهای باقی‌مانده (همه در پنل Supabase)

۱. **خاموش کردن تأیید ایمیل** — مسیر Authentication → Sign In / Providers → Email.

۲. **فعال کردن provider گوگل** — به‌علاوه ساختن یک OAuth Client در Google Cloud و گذاشتن Client ID و Secret در پنل. تا قبل از آن، دکمه‌ی گوگل مرورگر را باز می‌کند و خطا می‌دهد.

۳. **مجاز کردن آدرس‌های بازگشت** — مسیر Authentication → URL Configuration. هر دو لازم‌اند:
   - `aitripplanner://**` برای نسخه‌ی نصب‌شده
   - `exp://**` برای Expo Go

> آدرس بازگشت در Expo Go چیزی شبیه `exp://127.0.0.1:8081/--/` است و **IP شبکه‌ی لپ‌تاپ را در خودش دارد**. یعنی با عوض شدن شبکه عوض می‌شود. اگر ورود با گوگل در خانه کار کرد و جای دیگر نکرد، دلیلش همین است.

### هنوز روی گوشی واقعی تست نشده

- ورود با گوگل
- باقی ماندن نشست بعد از بستن کامل اپ
- رفتار کیبورد

---

## چرا ورود با گوگل از مرورگر است و نه آن شیت قشنگ نیتیو؟

پکیج `@react-native-google-signin/google-signin` آن پنجره‌ی زیبای داخل اپ را می‌دهد و اولین چیزی است که مستندات Supabase پیشنهاد می‌کند. **اما یک ماژول نیتیو است و در Expo Go اجرا نمی‌شود.**

استفاده از آن یعنی رفتن سراغ development build، که یعنی هر بار build گرفتن و نصب کردن به‌جای اسکن یک QR. این یک تصمیم واقعی با هزینه‌ی واقعی است — نباید بی‌سروصدا و فقط با نصب یک پکیج گرفته شود.

پس فعلاً مسیر مرورگر:

```ts
const redirectTo = makeRedirectUri();

const { data } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo, skipBrowserRedirect: true },
});

const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
if (result.type === "success") await createSessionFromUrl(result.url);
```


یعنی: آدرس ورود گوگل را بگیر → مرورگر را باز کن → بعد از ورود، گوگل کاربر را به اپ برمی‌گرداند → توکن را از آدرس بیرون بکش → به‌عنوان نشست ثبتش کن.

### چرا روی وب مسیر فرق می‌کند؟

روی وب، همین `openAuthSessionAsync` در عمل یک `window.open()` است — یعنی popup. و مرورگرها popup را فقط وقتی اجازه می‌دهند که **دقیقاً داخل همان کلیک کاربر** باز شود. چون ما قبلش یک `await` داریم، دیگر «داخل کلیک» حساب نمی‌شود و popup بلاک می‌شود:

```
Popup window was blocked by the browser or failed to open.
```

برای همین روی وب اصلاً سراغ popup نمی‌رویم و می‌گذاریم خود supabase-js کل صفحه را redirect کند:

```ts
if (Platform.OS === "web") {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },   // بدون skipBrowserRedirect
  });
  if (error) return failed(error);
  return ok;
}
```

بعد از برگشت از گوگل، همان `detectSessionInUrl` که بالاتر گفتیم توکن را از آدرس می‌خواند. روی موبایل این مشکل اصلاً وجود ندارد، چون آنجا `openAuthSessionAsync` یک پنجره‌ی نیتیو (`ASWebAuthenticationSession`) باز می‌کند، نه popup مرورگر.

> **درس:** یک خطا که فقط روی وب می‌آید لزوماً یعنی کد خراب نیست — گاهی یعنی آن پلتفرم زیر پوستش کار دیگری می‌کند.

---

## نقشه‌ی فایل‌ها

```
app/
├── _layout.tsx              Provider + نگهبان مسیر + جلوگیری از چشمک
├── (auth)/
│   ├── _layout.tsx
│   ├── sign-in.tsx
│   └── sign-up.tsx
└── (app)/
    ├── _layout.tsx
    └── index.tsx            صفحه‌ی خانه

components/
├── AuthScreenLayout.tsx     قالب مشترک + مدیریت کیبورد
├── Button.tsx
├── FormMessage.tsx
└── TextField.tsx

hooks/
├── useAuth.tsx              Context نشست
└── useProfile.ts            خواندن ردیف پروفایل

lib/
├── auth.ts                  عملیات ورود و ثبت‌نام
├── auth-errors.ts           کد خطا ← جمله‌ی قابل فهم
├── profiles.ts
├── supabase.ts              کلاینت (فقط یک بار ساخته می‌شود)
└── validation.ts

supabase/migrations/
└── 0001_profiles.sql        جدول + RLS + تریگر

types/
└── database.types.ts        تولید خودکار — دستی ویرایش نکن
```


---

## دستورهای مفید

```bash
npx expo start              # اجرای سرور توسعه
npx expo start --clear      # بعد از تغییر babel یا metro، حتماً با --clear
npx tsc --noEmit            # چک کردن تایپ‌ها قبل از هر commit
npx expo install <package>  # نصب پکیج با نسخه‌ی سازگار
npx expo-doctor             # بررسی سلامت وابستگی‌ها
```


---

## چند درسی که از این فاز می‌ماند

- **کامپایل شدن یعنی هیچ.** TypeScript نمی‌بیند که کیبورد روی دکمه افتاده، یا که RLS کوئری را خالی برگردانده، یا که ماژول نیتیو در Expo Go نیست. هر سه بی‌خطا کامپایل می‌شوند.
- **امنیت کار دیتابیس است، نه اپ.** هر فیلتری که فقط سمت اپ باشد قابل دور زدن است.
- **کارهایی که اپ نمی‌تواند انجام دهد را باید صریح گفت.** یک قابلیت با کدِ تمام‌شده هنوز تمام نشده اگر سه تنظیم در پنل باقی مانده باشد. پنهان کردنشان یعنی تحویل دادن چیزی که کار نمی‌کند.
- **پیش‌فرض‌ها را باید چک کرد.** نقشه‌ی این فاز فرض کرده بود تأیید ایمیل خاموش است؛ نبود. فقط چون واقعاً یک ثبت‌نام آزمایشی انجام شد معلوم شد.

</div>
