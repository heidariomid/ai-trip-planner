<div dir="rtl" align="right">

# Pre-review برای spec 16: Account and Web App

تاریخ: ۲۰۲۶-۱۰-۰۹ — Status: Not Started. spec 15 هنوز روی branch `feature/family-share` بازه و commit نشده؛ spec 16 load نشده.

## نتیجه

**Decided (۲۰۲۶-۱۰-۰۹).** سه تصمیم از خودت بود و spec طبقشون از نو نوشته شد:

- **release اول web app هست، نه App Store.** Apple Developer account سالی ۹۹ دلاره؛ web رایگانه. traveller سایت رو باز می‌کنه و «Add to Home Screen» می‌زنه.
- **email فعلاً نه.** password reset، Resend و email confirmation رفتن توی یه spec جدید برای بعد: `spec18-password-reset-and-email.md`.
- **Sign in with Apple ساخته نمیشه.** قانون App Store هست و برای web لازم نیست.

پس spec 16 الان چهار چیزه: shell برای web app، راهنمای install، Delete account، و privacy policy. هیچ‌کدوم هزینه نداره.

**یه چیز رو یادت بمونه:** این یه website توی قاب app هست، نه native app. روی iPhone از icon باز میشه و نوار Safari نداره، ولی هنوز هیچ‌وقت این‌طوری test نشده.

توی مثال‌ها **سارا** owner یه trip هست و **علی** member اون.

## چی توی spec نوشته شد

### ۱. راهنمای install قبل از sign in (ایده‌ی خودت، با research تأیید شد)

- **چرا قبل:** iPhone به app روی home screen یه storage جدا از Safari میده. session ما توی همون storage هست. پس اگه سارا اول توی Safari sign in کنه و بعد install کنه، app رو باز می‌کنه و دوباره Sign In می‌بینه.
- **یه دلیل دیگه:** Safari data سایتی که ۷ روز بهش سر نزدی رو پاک می‌کنه؛ app روی home screen شمارنده‌ی خودش رو داره. یعنی install نشده، سارا بیشتر sign out میشه.
- **توی spec:** یه card کوچیک روی Sign In و Sign Up.
  - iPhone: دو قدم با icon، «Tap Share» و «Add to Home Screen». Safari دکمه‌ی install نداره که سایت بتونه بزنه؛ card فقط توضیح میده.
  - Android Chrome: همون card با دکمه‌ی «Install app» که prompt خود browser رو باز می‌کنه.
  - یه عکس ثابت از قدم‌ها، نه video. بسته میشه، بسته می‌مونه، و جلوی form رو نمی‌گیره.
  - وقتی از icon باز شده، یا روی desktop، دیده نمیشه.
- **شرکت‌ها هم همین کار رو می‌کنن:** یه card یا sheet کوچیک با دو قدم. poster تمام‌صفحه که تا install نکنی نذاره بری جلو، آدم رو فراری میده.

### ۲. shell برای web app

- `public/manifest.json` با اسم، `display: standalone`، و رنگ `canvas`.
- icon ۱۹۲ و ۵۱۲، و `apple-touch-icon` ۱۸۰. icon الان هنوز مال template Expo هست؛ همین‌جا ساخته میشه و سه گزینه با اسم نشونت میدم.
- service worker نه؛ app آفلاین کار نمی‌کنه و قرار هم نیست.
- قبل از ساختن، guide مربوط به SDK 57 خونده میشه.

### ۳. Google sign-in از روی icon — ثابت نشده (test رفت به spec 17)

- **ریسک:** وقتی app از home screen باز شده و صفحه میره به Google، iOS سابقه داره که اون رو توی Safari باز کنه و دیگه به app برنگرده. اون‌وقت سارا توی Safari sign in شده، نه توی app.
- **توی spec:** این فقط روی address عمومی با HTTPS قابل test هست، پس check رفت به spec 17؛ دکمه‌ی «Install app» روی Android هم همین‌طور. email و password از روی icon همین‌جا باید کار کنه.

### ۴. tab Profile جا نداره

- **الان:** `Screen` scroll نمی‌کنه و Profile یه card، دو row، «Edit profile» و «Sign out» داره.
- **توی spec:** Profile scroll کنه. «Privacy policy» یه row سوم مثل «Saved places». «Delete account» یه متن آروم قرمز زیر «Sign out».

### ۵. Delete account و trip مشترک

- cascade کامله: توی database چک کردم، همه‌ی tableهایی که به `auth.users` وصلن `on delete cascade` دارن.
- `ConfirmDialog` می‌گه trip‌ها، عکس‌ها و conversation‌ها پاک میشن، trip‌هایی که share کردی برای بقیه هم میرن، و قابل برگشت نیست.
- عکس‌هایی که علی به‌عنوان editor توی trip سارا گذاشته **می‌مونن**. فقط member بودن علی پاک میشه.
- یه confirm کافیه؛ تایپ کردن «DELETE» نه.

### ۶. صفحه‌ی privacy policy

- یه فایل `public/privacy.html` توی همین project؛ با سایت آنلاین میشه و host دوم نمی‌خواد. من draft می‌نویسم و تو تأیید می‌کنی.
- متن این‌ها رو اسم می‌بره: Supabase، Google sign-in، Google Gemini برای chat، Cloudflare برای cover، و Wikipedia برای عکس place.

موردهای ۴ تا ۶ پیشنهاد من بودن و بدون رأی جدا توی spec رفتن. هر کدوم رو نخواستی بگو.

## چی به spec 18 رفت

- password reset با code شش‌رقمی، Resend به‌عنوان SMTP، و روشن کردن email confirmation.
- **یه domain لازمه** که مال خودت باشه؛ subdomain رایگان hosting قبول نمیشه. هنوز نگفتی داری یا نه.
- یه bug که از قبل پیدا شده و اونجا نوشته شده: `verifyOtp` همون لحظه session می‌سازه، پس بدون تغییر، traveller قبل از ذخیره‌ی password جدید وارد Home میشه.

## نکته‌های پیاده‌سازی

| موضوع | نکته |
| --- | --- |
| ترتیب | spec 15 اول commit و merge بشه؛ هر دو `profile.tsx` رو عوض می‌کنن |
| migration | احتمالاً لازم نیست |
| HTML head | `app.json` الان `web.output` نداره. جای link کردن manifest به output بستگی داره؛ از guide خونده بشه، حدس زده نشه |
| safe area | توی حالت standalone باید روی iPhone واقعی دیده بشه: status bar بالا و home indicator پایین |
| تشخیص standalone | card وقتی app از icon باز شده نباید بیاد. «بسته شد» توی storage همون device می‌مونه |
| in-app browser | اگه link توی Instagram یا Telegram باز بشه، «Add to Home Screen» اونجا نیست. فعلاً کاری نمی‌کنیم |
| Edge Function `delete-account` | اولین function با قدرت admin. id فقط از token، هیچ‌وقت از body. secret key فقط از env خود function، فقط برای `auth.admin.deleteUser` |
| فایل‌ها | `list` توی Storage recursive نیست و صفحه‌ای ۱۰۰ تا میده. اول folderهای زیر `{user_id}/`، بعد هر folder. اول فایل‌ها، بعد user |
| owner فایل | docs Supabase می‌گه user که owner یه object توی Storage هست پاک نمیشه. database ما همچین foreign key نداره، پس معلوم نیست. همون test «editor با عکس توی trip یکی دیگه» این رو معلوم می‌کنه |
| بعد از delete | `signOut({ scope: "local" })`؛ sign out معمولی برای user که دیگه نیست error میده |
| account Google | «sign in با password قدیمی fail میشه» برای account Google معنی نداره؛ Continue with Google یه account خالی جدید می‌سازه |
| link privacy | `expo-web-browser` نصبه. URL یه constant، نه توی هر screen |
| عکس place روی web | browser اجازه نمیده `User-Agent` عوض بشه، پس throttle Wikipedia روی web همون‌طور می‌مونه |
| QA | delete فقط روی account یک‌بارمصرف، **نه `ada@gmail.com`** |

## اضافه نکنیم

- service worker و کار آفلاین
- push notification
- Sign in with Apple، EAS build، و store listing
- عوض کردن email یا password از داخل Profile
- مهلت برگشت بعد از delete، یا export گرفتن از data
- متن privacy policy داخل app
- video یا animation برای راهنمای install

## رأی‌ها

- [x] release اول web app باشه، نه App Store — تصمیم خودت
- [x] email از این spec بره به spec 18 — تصمیم خودت
- [x] provider برای email: Resend — تصمیم خودت
- [x] راهنمای install قبل از sign in — ایده‌ی خودت
- [x] Profile scroll کنه، row «Privacy policy»، «Delete account» متن قرمز آروم — پیشنهاد assistant
- [x] متن confirm با trip مشترک؛ عکس‌های editor بمونن — پیشنهاد assistant
- [x] صفحه‌ی privacy روی hosting رایگان با draft assistant — پیشنهاد assistant
- [ ] domain برای Resend: دارم `……` / می‌خرم (فقط برای spec 18)

## قدم بعدی

اول spec 15 رو commit و merge کن. بعد `/feature load spec16-account-and-store` و `/feature start`.

</div>
