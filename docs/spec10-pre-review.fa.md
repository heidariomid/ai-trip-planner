<div dir="rtl" align="right">

# Pre-review برای spec 10: Profile

تاریخ: ۲۰۲۶-۱۰-۰۸ — Status: Not Started (spec 10 هنوز load نشده؛ feature فعلی spec 9 هست و روی branch خودش commit نشده مونده)

## نتیجه

**Decided (۲۰۲۶-۱۰-۰۸).** هفت تا fix تأیید شد و توی `context/features/spec10-profile.md` نوشته شد. دو تا «اضافه» (`home_city` و Remove photo) هنوز رأی نگرفتن و توی spec نیستن.

قبل از تصمیم، نتیجه این بود: Needs decisions.

جواب سه تا سؤالت:

- **spec خوبه؟** از نظر scope آره. کوچیکه، جای درستی توی ترتیب نشسته (قبل از spec 11 که `interests` رو می‌خونه)، و چیزهایی که نباید بیان رو درست بیرون گذاشته.
- **تغییر می‌خواد؟** آره. سه جا اگه همین‌طوری که نوشته بسازیم روی گوشی خراب درمیاد (بخش «باید عوض بشه»)، و چهار جا spec چیزی نگفته و باید تصمیم بگیریم.
- **میشه بیشتر انجام داد؟** دو تا چیز کوچیک ارزشش رو داره: `home_city` و دکمه‌ی Remove photo. بقیه نه. پایین توضیح دادم.

نکته‌ی اصلی که یادت بمونه: spec فرض کرده `profiles` یه جدول خالی و ساده‌ست. نیست. همین الان `avatar_url` توش URL عکس Google رو داره، و دو تا screen (Home و Profile) هر کدوم copy خودشون از profile رو نگه می‌دارن.

برای مثال‌ها دو نفر داریم: **علی** با Google وارد شده و عکس Google داره. **سارا** با email ثبت‌نام کرده و عکس نداره.

## باید عوض بشه

### ۱. path عکس رو نمیشه توی `avatar_url` ریخت (must change)

- **الان:** spec می‌گه «path رو روی `profiles` ذخیره کن» ولی اسم column رو نگفته. تنها column موجود `avatar_url` هست، و برای علی یه URL کامل `https://…googleusercontent…` توشه. `Avatar` هم همون مقدار رو مستقیم می‌ده به `Image`:

  ```tsx
  source={{ uri }}
  ```

- **اگه همین‌طوری ship کنیم:** سارا عکس upload می‌کنه، توی `avatar_url` می‌نویسیم `{user_id}/avatar/avatar-123.jpg`، و `Image` یه path خام می‌گیره که URL نیست. عکس سارا لود نمیشه. اگه برعکس همه‌چی رو از signed URL رد کنیم، عکس Google علی خراب میشه چون اون اصلاً توی bucket ما نیست.
- **چرا:** یه column داره دو تا چیز مختلف نگه می‌داره: یه URL عمومی و یه path خصوصی. spec 15 هم خودش نوشته «avatar path» برمی‌گردونه، یعنی از قبل یه path تمیز می‌خواد.
- **پیشنهاد:** یه column جدید `avatar_path` (null مجاز). `avatar_url` دست نمی‌خوره و عکس Google می‌مونه. ترتیب نمایش: اول `avatar_path` (با signed URL از `lib/storage.ts`)، بعد `avatar_url`، بعد حرف اول اسم.

### ۲. فرم نباید روی خود tab باشه (must change)

- **الان:** spec می‌گه tab پروفایل «تبدیل میشه به یه فرم». tab الان با `Screen` ساخته شده که scroll نمی‌کنه و هیچ keyboard handling نداره، و tab bar هم روش شناوره.
- **اگه همین‌طوری ship کنیم:** سارا روی فیلد اسم می‌زنه، keyboard بالا میاد و دکمه‌ی Save و Sign out می‌رن زیرش. این دقیقاً همون چیزیه که spec توی requirementها گفته نباید بشه، و فقط روی گوشی دیده میشه.
- **چرا:** spec 14 (saved places)، spec 15 (Join a trip) و spec 16 (Delete account و privacy policy) هم همه قراره به همین tab چیز اضافه کنن. اگه tab خودش فرم باشه، هر بار باید دورش کار کنیم.
- **پیشنهاد:** tab خلاصه بمونه: avatar، اسم، email، interestها به شکل chip، یه دکمه‌ی Edit profile، و Sign out همون‌جا که هست. فرم بره توی یه route جدا، `/edit-profile`، با `FormScreen` که keyboard handling رو از قبل داره. همون الگوی `create-trip`.

### ۳. بعد از Save، Home هنوز اسم و عکس قدیمی رو نشون می‌ده (must change)

- **الان:** `useProfile` فقط یه بار موقع mount می‌خونه. Home و Profile هر کدوم جدا صداش می‌زنن و tabها mount می‌مونن.
- **اگه همین‌طوری ship کنیم:** سارا اسمش رو می‌کنه «Sara K.» و Save می‌زنه. برمی‌گرده Home و هنوز نوشته «Good morning, Sara» با avatar قدیمی. تا app رو نبنده و باز نکنه درست نمیشه. تست «Done when» خود spec هم این رو نمی‌گیره، چون اون تست app رو kill می‌کنه.
- **پیشنهاد:** `useProfile` مثل `useTrips` موقع focus دوباره بخونه. تغییر کوچیکیه و الگوش توی repo هست.

## چیزهایی که spec نگفته (spec amendment)

### ۴. `interests`: متن آزاد یا لیست آماده؟

- **الان:** spec می‌گه «tagهای کوتاه مثل food، nature» و «یه عدد کوچیک». نه سقف مشخصه، نه طول، نه این‌که کاربر تایپ می‌کنه یا انتخاب.
- **اگه متن آزاد باشه:** یکی `Food` می‌نویسه یکی `food` یکی `foods`. بدتر: spec 11 این tagها رو می‌ذاره توی system prompt، پس هر چی کاربر تایپ کنه مستقیم می‌ره توی prompt مدل. یه فیلد دیگه هم به keyboard اضافه میشه.
- **پیشنهاد:** یه لیست ثابت حدود ۱۲ تایی (Food، Nature، Architecture، History، Art، Beaches، Hiking، Nightlife، Shopping، Museums، Family، Adventure) که با chip انتخاب میشه، حداکثر ۶ تا. دیتابیس هم همین رو با یه `check` نگه داره (تعداد، و این‌که هر tag عضو لیست باشه). trade-off: tag جدید یعنی یه migration.

### ۵. اسم خالی و طول اسم

- **الان:** `full_name` توی دیتابیس null مجازه و هیچ سقفی نداره. sign-up اسم خالی رو قبول نمی‌کنه، ولی فرم edit هیچ قانونی نداره.
- **اگه ول کنیم:** سارا اسم رو پاک می‌کنه و Save می‌زنه. Home می‌نویسه «Good morning, sara» از روی email، و spec 15 توی لیست memberها یه row بدون اسم نشون می‌ده.
- **پیشنهاد:** اسم خالی نباشه، trim بشه، حداکثر ۶۰ کاراکتر، هم توی فرم هم با `check` توی دیتابیس.

### ۶. جزئیات عکس

- **الان:** spec فقط path رو گفته: `{user_id}/avatar/{filename}`. policyهای این path از spec 2 آماده‌ان.
- **پیشنهاد:**
  - اسم فایل `avatar-{time}.{ext}` باشه، مثل cover، تا عکس عوض‌شده از cache نیاد. فایل قبلی بعد از swap پاک بشه.
  - picker با `allowsEditing: true` باز بشه تا کاربر crop کنه. طبق docs نسخه‌ی SDK 57 روی iOS crop همیشه مربعه؛ `aspect` فقط روی Android اثر داره و روی web اصلاً crop نیست. پس `Avatar` باید عکس غیرمربع رو هم درست نشون بده.
  - اگه اسم save شد ولی upload عکس fail شد، مثل cover یه notice نشون بدیم، نه این‌که کل Save رو خطا بدیم.

### ۷. کاربر الان می‌تونه `email` توی row خودش رو هم عوض کنه

- **الان:** از دیتابیس چک کردم: role `authenticated` روی همه‌ی columnهای `profiles` اجازه‌ی `update` داره، از جمله `email` و `created_at`. policy فقط می‌گه «row خودت». `updated_at` هم trigger نداره و بعد از edit همون تاریخ ساخت می‌مونه.
- **اگه ول کنیم:** تا حالا مهم نبود چون app هیچ‌وقت `update` نمی‌زد. از spec 10 می‌زنه. یه request دستی می‌تونه `profiles.email` رو چیزی بکنه که با `auth.users` نمی‌خونه، و tab پروفایل همون رو نشون می‌ده.
- **پیشنهاد:** توی همین migration، `update` فقط روی `full_name`، `avatar_path`، `interests` (و `home_city` اگه رأی آورد) grant بشه، و یه trigger برای `updated_at` اضافه بشه.

## میشه بیشتر انجام داد؟

| ایده | نظر من | چرا |
| --- | --- | --- |
| `home_city` روی profile | آره | فرم create-trip و صفحه‌ی copy هر بار `source` رو از اول می‌پرسن. با این، «Leaving from» از قبل پره. spec 11 هم می‌تونه بخوندش. یه column، یه فیلد، دو خط prefill |
| دکمه‌ی Remove photo | آره | بدون اون کسی که عکس گذاشته راهی برای برگشتن به حرف اول اسم (یا عکس Google) نداره |
| سبک سفر یا budget برای AI | الان نه | تا prompt توی spec 11 نوشته نشه نمی‌دونیم کدوم فیلد واقعاً به درد مدل می‌خوره |
| آمار سفرها روی Profile | نه | تزئینیه و توی board هم نیست |

## نکته‌های پیاده‌سازی

| موضوع | نکته |
| --- | --- |
| شماره‌ی migration | `0011`. فایل `0010` مال spec 9 هست که هنوز commit نشده؛ اول اون باید بسته بشه |
| وابستگی | spec نوشته «Depends on spec 3»، ولی در عمل به spec 4 هم وابسته‌ست (helper توی `lib/storage.ts` و picker) |
| upload | `uploadTripImage` فقط path سفر می‌سازه. یه `uploadAvatar` کنارش لازمه که همون چک type و ۱۰ MB رو استفاده کنه |
| fallback عکس | `useImageSource` وقتی path نیست placeholder خاکستری می‌ده. `Avatar` باید به جاش حرف اول اسم رو نشون بده |
| type | `Profile` توی `lib/profiles.ts` چهار column رو `Pick` کرده. بعد از migration، `types/database.types.ts` دوباره generate بشه و select هم columnهای جدید رو بگیره |
| HEIC | مثل cover، `quality: 0.8` بدیم تا picker عکس رو JPEG کنه |
| حذف account | spec 16 کل prefix `{user_id}/` رو پاک می‌کنه، پس فولدر `avatar` هم پوشش داده میشه. کاری لازم نیست |
| Done when | دو تا تست اضافه بشه: بعد از Save بدون بستن app، Home اسم جدید رو نشون بده؛ و علی قبل از upload هنوز عکس Google خودش رو ببینه |

## اضافه نکنیم

- عوض کردن email یا password (spec 16)
- لیست saved places، فیلد join code، Delete account
- public کردن bucket یا خوندن avatar بقیه (spec 15)
- username یا bio
- تنظیمات notification

## رأی‌ها

- [x] ۱ — column جدید `avatar_path`، و `avatar_url` برای عکس Google بمونه
- [x] ۲ — فرم توی route جدا `/edit-profile` با `FormScreen`؛ tab خلاصه بمونه
- [x] ۳ — `useProfile` موقع focus دوباره بخونه
- [x] ۴ — `interests` از لیست ثابت ۱۲ تایی، حداکثر ۶ تا، با `check` توی دیتابیس
- [x] ۵ — اسم اجباری، حداکثر ۶۰ کاراکتر
- [x] ۶ — `avatar-{time}`، پاک شدن فایل قبلی، crop، و notice برای upload ناموفق (crop بعداً موقع ساخت حذف شد: صفحه‌ی crop و انتظار بعدش انتخاب عکس رو طولانی می‌کرد)
- [x] ۷ — grant ستونی برای `update` و trigger برای `updated_at`
- [ ] اضافه: `home_city` و prefill کردن `source`
- [ ] اضافه: دکمه‌ی Remove photo

## قدم بعدی

spec 10 با این هفت تصمیم آپدیت شده. فقط دو تا «اضافه» مونده که بگی می‌خوای یا نه. ساختنش بعد از بسته شدن spec 9 شروع میشه.

</div>
