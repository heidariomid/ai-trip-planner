<div dir="rtl" align="right">

# فعال‌کردن ورود با گوگل (توضیح ساده)

این فایل برای یاد گرفتن است، نه برای مرجع. کد واقعی در `lib/auth.ts` و `lib/supabase.ts` است.

## در یک نگاه

- دکمه‌ی Continue with Google دیگر نباید با «provider خاموش است» بمیرد؛ provider در Supabase روشن شده.
- کلاینت OAuth از نوع **Web application** در Google Cloud ساخته شده، نه Android/iOS.
- تأیید ایمیل خاموش است، پس ثبت‌نام با ایمیل بلافاصله session برمی‌گرداند.
- `site_url` از `localhost:3000` پیش‌فرض به `http://localhost:8081` عوض شده؛ بدون این، callbackهای خراب به جایی می‌رفتند که هیچ‌کس گوش نمی‌داد.
- لیست آدرس بازگشت پر شده: `aitripplanner://**`، `exp://**`، `http://localhost:8081/**`.

## چرا MCP این کار را نکرد؟

تو خواستی «با MCP گوگل را روشن کن». ابزارهای `user-supabase` جدول و SQL و migration دارند. ابزار تنظیم auth provider ندارند. تنها match روی کلمه‌ی auth همان `mcp_auth` است که خود سرور MCP را لاگین می‌کند، نه گوگل را.

پس دو راه ماند: داشبورد، یا Management API.

`PATCH https://api.supabase.com/v1/projects/<project-ref>/config/auth` با توکن شخصی `sbp_…`. نام فیلدها از spec زنده‌ی `UpdateAuthConfigBody` آمد، نه از حافظه:

- `external_google_enabled`
- `external_google_client_id`
- `external_google_secret`
- `mailer_autoconfirm`
- `site_url`
- `uri_allow_list`

> Secret گوگل هرگز نباید داخل `.env` برود. هر `EXPO_PUBLIC_*` داخل bundle اپ می‌نشیند و عمومی است. Secret فقط در config سمت Supabase می‌ماند.

## کلاینت Web application — نه Android/iOS

راهنمای خود Supabase در بخش Expo React Native می‌گوید کلاینت Android و iOS بساز. آن بخش فرض می‌کند از `@react-native-google-signin/google-signin` استفاده می‌کنی.

ما آن پکیج را عمداً نیاوردیم. یک native module است و در Expo Go اجرا نمی‌شود. ورود گوگل از مسیر مرورگر است: `signInWithOAuth` + `expo-web-browser`.

برای browser flow گوگل باید کلاینت **Web application** ببیند، با این دو مقدار:

| فیلد | مقدار |
| --- | --- |
| Authorized redirect URI | `https://<project-ref>.supabase.co/auth/v1/callback` |
| Authorized JavaScript origin | `http://localhost:8081` |

اگر Android/iOS می‌ساختی، گوگل callback سوپابیس را قبول نمی‌کرد و یک ساعت دنبال باگ اپ می‌گشتی.

Google Cloud برای ساختن OAuth client ID هیچ API عمومی ندارد. `gcloud iam oauth-clients` محصول دیگری است (Workforce Identity Federation). این مرحله فقط از UI کنسول رفت.

پروژه: `my-project-66567-1685040125454`. نام کلاینت: `AI Trip Planner (Supabase)`. حساب: `<owner-email>`.

## Consent screen و حالت Testing

قبل از کلاینت، Google Auth Platform اصلاً configure نشده بود. ویزارد چهار مرحله‌ای:

1. App name: `AI Trip Planner`
2. Audience: **External** — Internal فقط داخل Workspace سازمان کار می‌کند و این حساب شخصی است
3. ایمیل تماس
4. موافقت با Google API Services: User Data Policy — این را تو زدی، نه من

> Publishing status الان **Testing** است. این warning نیست؛ دروازه است. فقط آدرس‌های Audience → Test users می‌توانند وارد شوند. بقیه `access_denied` می‌گیرند، حتی اگر Client ID درست باشد. الان فقط `<owner-email>` در لیست است. سقف مادام‌العمر ۱۰۰ نفر است.

Data Access اول خالی بود. بدون scope، گوگل ایمیل و اسم و عکس را نمی‌دهد. این سه تا اضافه شد: `openid`، `userinfo.email`، `userinfo.profile`.

## Secret دوم — گوگل Secret اول را دیگر نشان نمی‌دهد

کلاینت از قبل Secret داشت (`****01MJmj`) ولی گوگل دیگر دیدن و دانلود Secret قدیمی را پشتیبانی نمی‌کند. بدون Secret کامل، Management API چیزی برای فرستادن به Supabase نداشت.

یک Secret تازه ساخته شد و همان به Supabase رفت. Secret قدیمی هنوز Enabled است.

> بعد از اینکه یک بار ورود گوگل را خودت دیدی، Secret قدیمی را Disable کن. دو Secret فعال یعنی سطح حمله بزرگ‌تر، بدون فایده.

Secret را در هیچ فایل ریپو ننوشتیم و در این سند هم نیست.

## سه تنظیم که گوگل لازم نداشت، ولی بدون‌شان فاز می‌شکست

اول `GET` روی همان endpoint زدیم تا حدس نزنیم. واقعیت داشبورد این بود:

| فیلد | قبل | بعد |
| --- | --- | --- |
| `mailer_autoconfirm` | `false` | `true` |
| `site_url` | `http://localhost:3000` | `http://localhost:8081` |
| `uri_allow_list` | خالی | `aitripplanner://**,exp://**,http://localhost:8081/**` |
| `external_google_enabled` | `false` | `true` |

`site_url` پیش‌فرض سوپابیس برای پروژه‌های وب است. خود callback را با یک درخواست خالی زدیم: جواب `303` بود به `http://localhost:3000?error=…`. یعنی خطاهای OAuth به پورتی می‌رفتند که هیچ‌کس گوش نمی‌داد.

`exp://**` لازم است چون در Expo Go آدرس بازگشت IP شبکه‌ی لپ‌تاپ را داخل خودش دارد و با عوض شدن وای‌فای عوض می‌شود. `aitripplanner` همان `scheme` در `app.json` است.

`mailer_autoconfirm: true` یعنی Confirm email خاموش. یک signup واقعی بعدش زدیم: `access_token` برگشت و `email_confirmed_at` پر بود. تریگر هم ردیف `profiles` را نوشت. کاربر تست بعدش پاک شد.

کد هنوز حالت «session برنگشت» را نگه می‌دارد، چون قبل از انتشار باید `mailer_autoconfirm` برگردد `false`:

```40:50:lib/auth.ts
    // This phase expects "Confirm email" to be off, so sign-up hands back a
    // session and the route guard moves on. If the setting is on, there is no
    // session and nothing would appear to happen — say so instead.
    if (!data.session) {
      return {
        success: true,
        error: null,
        notice:
          "Account created. Check your email for a confirmation link, then sign in.",
      };
    }
```

این مسیر الان dormant است، نه مرده.

## دو مسیر OAuth — وب و نیتیو یکی نیستند

کد از قبل نوشته شده بود. کار امروز روشن کردن provider بود. ولی بدون فهم این شاخه، دکمه‌ی گوگل را در مرورگر تست می‌کنی و همان خطای popup را دوباره می‌بینی.

```75:109:lib/auth.ts
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    // Built per call: in Expo Go this contains the dev machine's LAN address,
    // which changes with the network. On web it is the page origin.
    const redirectTo = makeRedirectUri();

    // On web, openAuthSessionAsync is a window.open() that popup blockers
    // reject because it runs after an await rather than inside the click.
    // Navigate the whole page instead and let detectSessionInUrl read the
    // tokens back when Google returns.
    if (Platform.OS === "web") {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) return failed(error);
      return ok;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) return failed(error);
    if (!data.url) return failed(new Error("Google sign-in returned no URL"));

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success") {
      return { success: false, error: null };
    }

    return await createSessionFromUrl(result.url);
  } catch (error) {
    return failed(error);
  }
}
```

**چرا دو راه؟** روی نیتیو `skipBrowserRedirect: true` یعنی supabase-js مرورگر را باز نکند؛ URL را به ما بدهد و `WebBrowser.openAuthSessionAsync` آن را در in-app browser باز کند. روی وب همان تابع بعد از یک `await` یک `window.open()` است و popup blocker ردش می‌کند. پس وب کل صفحه را redirect می‌کند.

`flowType` همان پیش‌فرض supabase-js است: `implicit`. توکن‌ها در fragment آدرس می‌آیند، نه با code exchange.

## `detectSessionInUrl` فقط روی وب

```18:29:lib/supabase.ts
export const supabase = createClient<Database>(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // On native there is no browser URL carrying the token and leaving this
      // on throws. On web it is how the OAuth redirect gets read back.
      detectSessionInUrl: Platform.OS === "web",
    },
  },
);
```

روی نیتیو URL مرورگر وجود ندارد. اگر این را روشن بگذاری کلاینت throw می‌کند. روی وب همین فلگ است که بعد از برگشتن از گوگل، توکن داخل آدرس را می‌خواند.

به همین خاطر `useLinkingURL` روی وب عمداً خاموش است. اگر هر دو با هم بخوانند، race می‌شود:

```62:67:hooks/useAuth.tsx
  useEffect(() => {
    // On web, detectSessionInUrl already consumes the redirect; doing it here
    // too would race with it.
    if (!linkingUrl || Platform.OS === "web") return;
    void createSessionFromUrl(linkingUrl);
  }, [linkingUrl]);
```

روی نیتیو همان `createSessionFromUrl` توکن را از URL برمی‌دارد و `setSession` می‌کند. این برای وقتی است که redirect اپ را سرد باز می‌کند و دیگر `openAuthSessionAsync` منتظر نیست.

## تریگر از قبل آماده‌ی گوگل بود

اپ بعد از ورود گوگل `insert` به `profiles` نمی‌زند. یک trigger روی `auth.users` این کار را می‌کند. گوگل فیلدها را با اسم خودش می‌فرستد: `name` و `picture`، نه `full_name` و `avatar_url`.

```32:54:supabase/migrations/0001_profiles.sql
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
```

اگر فقط `full_name` را می‌خواندی، ثبت‌نام ایمیل کار می‌کرد و گوگل اسم را خالی می‌گذاشت. `coalesce` هر دو قرارداد را پوشش می‌دهد.

## چطور تست شد

تست شد:

- خواندن config قبل از تغییر، تا حدس نزنیم.
- `PATCH` و خواندن دوباره‌ی همان فیلدها: گوگل `true`، Client ID ست، Secret ست.
- یک signup ایمیلی بعد از `mailer_autoconfirm`: session برگشت، `email_confirmed_at` پر شد، ردیف `profiles` ساخته شد. کاربر تست پاک شد.
- کلاینت گوگل در کنسول: نوع Web application، redirect و origin درست.
- Data Access بعد از Save: سه scope غیرحساس.
- Audience: Testing، یک test user.

تست نشد:

- کلیک واقعی روی Continue with Google تا consent و برگشت به خانه.
- ورود گوگل روی Expo Go یا شبیه‌ساز.
- cold-start بعد از ورود گوگل.
- کیبورد روی گوشی.

`npx tsc --noEmit` برای این مرحله لازم نبود؛ کد اپ عوض نشد. فقط config سمت سرور و کنسول گوگل عوض شد.

## کارهای باقی‌مانده

1. یک بار خودت دکمه‌ی گوگل را در `http://localhost:8081/sign-in` بزن، با همان جیمیل test user. اگر خانه آمد و عکس پروفایل نشست، مسیر وب زنده است.
2. Secret قدیمی (`****01MJmj`) را Disable کن.
3. توکن `sbp_…` را از [account/tokens](https://supabase.com/dashboard/account/tokens) revoke کن. داخل تاریخچه‌ی چت مانده.
4. قبل از انتشار: `mailer_autoconfirm` برگردد `false`، و `site_url` و allowlist از localhost به آدرس واقعی اپ بروند.
5. اگر کس دیگری باید تست کند، اول به Test users اضافه‌اش کن. در غیر این صورت `access_denied` می‌گیرد.

## نقشه‌ی فایل‌ها

این کار کد اپ را عوض نکرد. سندها به‌روز شدند تا Memory دروغ نگوید.

```text
lib/auth.ts                         شاخه‌ی وب / نیتیو گوگل — از قبل بود
lib/supabase.ts                     detectSessionInUrl فقط روی وب — از قبل بود
hooks/useAuth.tsx                   skip linking روی وب — از قبل بود
supabase/migrations/0001_profiles.sql  coalesce برای name/picture — از قبل بود
AGENTS.md                           Memory: گوگل روشن است، هنوز click-through نشده
context/current-feature.md          leftover گوگل برداشته شد
context/current-feature.fa.md       آینه‌ی فارسی همان
docs/google-signin-explained.fa.md  همین فایل
```

## دستورهای مفید

```bash
# خواندن config فعلی (توکن تازه، نه همان sbp_ قبلی)
curl -s -H "Authorization: Bearer $SB_PAT" \
  "https://api.supabase.com/v1/projects/<project-ref>/config/auth"

# callback زنده است اگر بدون state همین را بدهد: bad_oauth_callback
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://<project-ref>.supabase.co/auth/v1/callback"
```

صفحه‌ی کلاینت در کنسول: Google Auth Platform → Clients → `AI Trip Planner (Supabase)`.

## چند درسی که می‌ماند

- MCP محصول را کامل پوشش نمی‌دهد. نبودن ابزار یعنی API دیگر یا UI، نه حدس زدن.
- راهنمای رسمی را با stack خودت چک کن. بخش Expo آن راهنما برای native module است؛ ما browser flow داریم، پس Web application.
- Testing mode گوگل سخت‌گیر است. کانفیگ درست + ایمیل خارج از لیست = `access_denied`. اول آنجا را نگاه کن.
- Secret کلاینت گوگل مال سرور است (اینجا: config سوپابیس)، نه مال bundle. `EXPO_PUBLIC_*` یعنی هرکس اپ را دارد، آن را هم دارد.
- پیش‌فرض `site_url` سوپابیس برای Next.js است (`localhost:3000`). روی Expo همان پیش‌فرض باگ واقعی است، نه جزئیات.
- دو مصرف‌کننده‌ی یک redirect (اینجا `detectSessionInUrl` و `useLinkingURL`) را همزمان روشن نگذار.

</div>
