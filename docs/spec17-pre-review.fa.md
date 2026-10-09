<div dir="rtl" align="right">

# Pre-review برای spec 17: Release

تاریخ: ۲۰۲۶-۱۰-۰۹ — Status: Not Started. spec 15 روی branch `feature/family-share` بازه؛ spec 16 و 17 load نشدن.

## نتیجه

**Decided (۲۰۲۶-۱۰-۰۹).** گفتی «خودت تصمیم بگیر»؛ هر نُه پیشنهاد توی spec 16 و spec 17 نوشته شدن. خود کار کوچیکه: یه `npx expo export -p web`، یه host رایگان، و دو تا address توی Supabase و Google. docs خود Expo فایل config برای Vercel رو آماده داره. مشکل جای دیگه‌ست: چیزهایی که روی `localhost` دیده نمیشن و روی یه address عمومی app رو خراب نشون میدن.

**یه چیز رو یادت بمونه:** این link قراره توی resume باشه. سه چیز هست که اگه الان تصمیم نگیریم، یه شرکت link رو باز می‌کنه و app کار نمی‌کنه: Google sign-in فقط برای خودت بازه، project رایگان Supabase بعد از یه هفته بی‌استفاده pause میشه، و سهم رایگان AI بین همه مشترکه.

توی مثال‌ها **مریم** کسیه که link رو از resume تو باز می‌کنه.

## باید عوض بشه

### ۱. دکمه‌ی Google برای مریم کار نمی‌کنه (must change)

- **الان:** consent screen توی Google روی Testing هست و فقط address خودت توی لیست test user هست. spec می‌گه «توی release notes بنویس».
- **اگه همین‌طوری ship کنیم:** مریم «Continue with Google» رو می‌زنه و `access_denied` می‌گیره. اولین دکمه‌ای که امتحان می‌کنه خرابه.
- **پیشنهاد:** consent screen رو Publish کن. رایگانه، و طبق docs Google وقتی فقط اسم، email و profile می‌خوای verification لازم نیست. صفحه‌ی Branding باید پر بشه: اسم app، email پشتیبانی، address سایت، و link privacy policy.
- **اگه نمی‌خوای Publish کنی:** دکمه‌ی Google روی سایت عمومی مخفی بشه. دکمه‌ی خراب بدتر از نبودنشه.

### ۲. project رایگان Supabase بعد از یه هفته pause میشه (must change)

- **الان:** spec چیزی نمی‌گه.
- **اگه همین‌طوری ship کنیم:** طبق docs Supabase، project رایگانی که ۷ روز کم‌استفاده باشه ممکنه pause بشه. مریم دو هفته بعد link رو باز می‌کنه و sign in هیچ جوابی نمیده، تا تو از dashboard دوباره روشنش کنی.
- **پیشنهاد:** یه request زمان‌بندی‌شده‌ی رایگان که روزی یه بار database رو صدا بزنه. جاش موقع build انتخاب میشه. راه دیگه: خودت هفته‌ای یه بار app رو باز کنی.

### ۳. صفحه‌ی اول نمی‌گه app چیه (must change)

- **الان:** Done when می‌گه «یه نفر دیگه از صفحه‌ی اول بفهمه app چی‌کار می‌کنه». صفحه‌ی اول Sign In هست با «Welcome back» و «Sign in to pick up where you left off».
- **اگه همین‌طوری ship کنیم:** مریم یه form می‌بینه و هیچ دلیلی برای ساختن account نداره. وقتی link رو توی LinkedIn یا پیام می‌ذاری هم preview فقط یه address خالیه.
- **پیشنهاد:**
  - یه خط بالای Sign In و Sign Up که بگه app چیه، مثلاً «Plan a trip day by day with AI».
  - title و description صفحه، و یه عکس preview برای وقتی link share میشه.
  - صفحه‌ی landing جدا نه.

### ۴. دو تا test از spec 16 فقط روی address عمومی شدنی‌ان (must change)

- **الان:** spec 16 می‌گه Google sign-in از روی icon و دکمه‌ی «Install app» روی Android همون‌جا test بشن.
- **چرا نمیشه:** phone به dev server با IP شبکه وصل میشه. Supabase redirect به IP رو رد می‌کنه (همون مشکل spec 1)، و Chrome prompt نصب رو فقط روی HTTPS میده.
- **پیشنهاد:** این دو تا check از spec 16 بیان توی Done when همین spec. بقیه‌ی spec 16 روی `localhost` و iPhone با IP قابل test هست.

## spec amendment

### ۵. سهم رایگان AI بین همه مشترکه

- **الان:** هر account روزی ۳۰ پیام chat و ۵ cover داره. email confirmation خاموشه، پس ساختن account هیچ مانعی نداره.
- **اگه همین‌طوری ship کنیم:** طبق docs Google، سقف Gemini برای کل project هست، نه هر کاربر. سهم Cloudflare هم حدود ۹۶ cover در روز برای همه‌ست. چند نفر (یا یه نفر با چند account) می‌تونن سهم اون روز رو تموم کنن و chat برای مریم جواب نده. tier رایگان Gemini هم به Google اجازه میده از promptها استفاده کنه.
- **پیشنهاد:** رایگان بمونه (قانون خودت). privacy policy و release notes همین رو صریح بگن. موقع build چک میشه که وقتی سهم تموم شد، chat یه جمله‌ی خوانا نشون بده نه error خام. CAPTCHA الان نه.

### ۶. host و address

- **الان:** spec می‌گه «یه host رایگان، موقع load انتخاب میشه».
- **پیشنهاد:** Vercel. account داری و docs Expo فایل `vercel.json` رو با rewrite آماده داده. plan رایگانش برای استفاده‌ی غیرتجاری هست که برای resume درسته.
- **address یه بار انتخاب بشه.** اگه بعداً عوضش کنی، برای browser یه سایت جدیده: app از home screen همه می‌پره و همه sign out میشن.

### ۷. privacy policy توی همین سایت

- **الان:** spec 16 می‌گه یه صفحه‌ی واقعی با URL عمومی؛ نگفته کجا.
- **پیشنهاد:** یه فایل `public/privacy.html` توی همین project. با همین deploy آنلاین میشه و host دوم نمی‌خواد. یعنی link توی spec 16 ساخته میشه ولی URL نهاییش بعد از این spec کار می‌کنه.

### ۸. icon هنوز icon پیش‌فرض Expo هست

- **الان:** `assets/icon.png` و `favicon.png` فایل‌های template از روز اول‌ان. spec 16 برای manifest icon واقعی می‌خواد، spec 17 می‌گه «placeholder نباشه».
- **پیشنهاد:** icon توی spec 16 ساخته بشه و اینجا فقط چک بشه. موقع ساخت سه تا گزینه با اسم نشونت میدم و تو یکی رو انتخاب می‌کنی.

### ۹. password account test توی repo نوشته شده

- **الان:** سایت عمومی و development یه database دارن. `ada@gmail.com` با password `<removed>` توی `AGENTS.md` نوشته شده. repo الان هیچ remote نداره.
- **اگه repo رو برای resume public کنی:** هر کسی با اون password وارد account test میشه. project ref و email خودت هم توی همون فایل هست.
- **پیشنهاد:** قبل از public کردن repo، اون password عوض بشه و از فایل بیرون بره. تا repo private هست کاری لازم نیست.

## نکته‌های پیاده‌سازی

| موضوع | نکته |
| --- | --- |
| ترتیب | spec 15 و بعد spec 16 باید merge شده باشن |
| env | `EXPO_PUBLIC_*` موقع export توی bundle میرن. اگه build روی Vercel باشه، این دو تا باید توی تنظیمات project اونجا هم باشن |
| secret | `.env` یه `GEMINI_API_KEY` هم داره که prefix نداره و نباید توی bundle باشه. بعد از export توی `dist` دنبالش بگرد |
| `site_url` | فقط یه مقدار می‌گیره. میشه address عمومی؛ `localhost` توی `uri_allow_list` می‌مونه. جمله‌ی spec باید همین رو بگه |
| Google client | address عمومی به JavaScript origins اضافه بشه. redirect URI همون callback خود Supabase می‌مونه |
| rewrite | هر path به صفحه‌ی app برمی‌گرده، ولی فایل واقعی مثل `privacy.html` و `manifest.json` باید خودش serve بشه. بعد از deploy چک بشه |
| update | service worker نداریم، پس deploy جدید با باز کردن دوباره‌ی app دیده میشه |
| Edge Function | CORS الان `*` هست؛ از address جدید هم جواب میدن |
| Android | Done when می‌گه روی Android هم باز بشه. اگه phone Android نداری، همین رو توی گزارش بنویس؛ emulator توی Chrome نصب رو ثابت نمی‌کنه |
| release notes | یه فایل توی `docs/`. باید بگه: email confirmation خاموشه، password reset نداریم، سهم AI مشترکه |
| expo-doctor | همون استثنای schema که توی `AGENTS.md` هست |

## اضافه نکنیم

- domain شخصی. address رایگان host کافیه
- account demo و دکمه‌ی «Try the demo» (گفتی فعلاً نه)
- CAPTCHA
- analytics
- صفحه‌ی landing یا سایت معرفی جدا
- plan پولی Supabase، Vercel یا Gemini
- App Store، TestFlight، و Google Play

## رأی‌ها

- [x] ۱ — consent screen توی Google Publish بشه؛ اگه Google قبول نکرد، دکمه روی سایت عمومی مخفی بشه
- [x] ۲ — یه request روزانه‌ی رایگان که project Supabase pause نشه
- [x] ۳ — یه خط معرفی روی Sign In و Sign Up، به‌علاوه‌ی title و عکس preview
- [x] ۴ — test Google از روی icon و «Install app» روی Android از spec 16 بیان اینجا
- [x] ۵ — AI رایگان بمونه و privacy policy و release notes صریح بگن
- [x] ۶ — host: Vercel، با یه address که عوض نمیشه
- [x] ۷ — privacy policy به‌صورت `public/privacy.html` توی همین سایت
- [x] ۸ — icon توی spec 16 ساخته بشه، با سه گزینه برای انتخاب
- [x] ۹ — قبل از public کردن repo، password account test عوض بشه

## قدم بعدی

همه‌ی پیشنهادها رو assistant انتخاب کرده؛ هر کدوم رو نخواستی بگو. spec 15 رو commit و merge کن، بعد spec 16، بعد `/feature load spec17-release`. دکمه‌ی Publish توی Google Cloud رو خودت باید بزنی؛ موقع build قدم‌به‌قدم می‌گم.

</div>
