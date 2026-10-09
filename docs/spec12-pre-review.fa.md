<div dir="rtl" align="right">

# Pre-review برای spec 12: AI Trip Actions

تاریخ: ۲۰۲۶-۱۰-۰۸ — Status: Not Started (branch هنوز ساخته نشده)

## نتیجه

**Decided (۲۰۲۶-۱۰-۰۸).** هر هشت تا تصمیم طبق پیشنهاد گرفته شد و توی `context/features/spec12-ai-trip-actions.md` نوشته شد.

قبل از تصمیم، نتیجه این بود: Needs decisions.

spec از نظر هدف درسته، ولی با فرض یه chat نوشته شده که وجود نداره. spec 11 رو که ساختیم، cardها فقط `chips`، `places` و `days` هستن. spec 12 از «summary card»، «روز خودِ card» و «قبول کردن یه hotel» حرف می‌زنه که هیچ‌کدوم الان توی cardها نیست. پنج تا مورد اگه همین‌طوری ساخته بشن روی گوشی خراب درمیان.

نکته‌ی اصلی که یادت بمونه: **مدل هیچ‌وقت خودش چیزی نمی‌نویسه.** مدل فقط card پیشنهاد می‌ده. نوشتن توی دیتابیس رو app انجام می‌ده، با token خود کاربر، و فقط بعد از این‌که کاربر روی یه دکمه زد. این‌طوری RLS همون مرز امنیتی می‌مونه و «چیزی که کاربر قبول نکرده نوشته نمیشه» خودبه‌خود درست درمیاد.

توی مثال‌ها **سارا** کاربره و توی chat نوشته «یه سفر ۵ روزه به توکیو بچین».

## باید عوض بشه

### ۱. summary card وجود نداره، و `create_trip` چیزهایی می‌خواد که مدل نمی‌دونه (must change)

- **الان:** spec می‌گه Create Trip با «فیلدهای summary card» صدا زده میشه. همچین cardی نداریم. `create_trip` هم `p_title`، `p_source`، `p_destination`، `p_start_date` و `p_end_date` رو اجباری می‌خواد.
- **اگه همین‌طوری ship کنیم:** سارا فقط گفته «۵ روز توکیو». مدل نه می‌دونه سارا از کجا راه می‌افته، نه تاریخ دقیق رو. یا Create Trip با خطای `not null` روی `source` fail میشه، یا مدل یه شهر و یه تاریخ از خودش درمیاره و trip با تاریخ اشتباه ساخته میشه.
- **چرا:** board هم همین رو نشون می‌ده: summary فقط Destination، Duration، Travelers و Highlights داره. source و تاریخ توش نیست.
- **پیشنهاد:** یه card جدید به اسم `trip` با `title`، `destination`، `day_count`، `traveler_count` و `description`. دکمه‌های Create Trip و Save Draft یه sheet کوچیک باز می‌کنن که دو تا چیز می‌پرسه: «Leaving from» و start date (end date خودش حساب میشه)، مثل صفحه‌ی copy توی explore. بعد یه بار `create_trip` صدا زده میشه. همین sheet همون تأییده.

### ۲. day card شماره‌ی روز نداره و ساعتش متن آزاده (must change)

- **الان:** یه day card فقط `title` و `items` داره. `time` هم هر متنی می‌تونه باشه.
- **اگه همین‌طوری ship کنیم:** دو تا خرابی. اول، spec می‌گه «روز خودِ card به‌صورت پیش‌فرض»، ولی app نمی‌دونه «Day 3: Shinjuku» روز چندمه مگه این‌که عنوان رو parse کنه. دوم، `create_trip` مقدار `starts_at` رو به `time` cast می‌کنه. اگه مدل بنویسه «Morning»، cast خطا می‌ده و **کل** ساختن trip برمی‌گرده.
- **پیشنهاد:** day card یه فیلد عددی `day` بگیره. `time` فقط `HH:MM` باشه؛ Edge Function هر چیز دیگه‌ای رو `null` کنه. موقع Create Trip طول سفر بشه بزرگ‌ترینِ `day_count` و بزرگ‌ترین `day`، تا هیچ activity به روزی که وجود نداره اشاره نکنه.

### ۳. Regenerate جایی برای «جایگزین کردن» نداره (must change)

- **الان:** `chat_messages` فقط `insert` و `select` داره. نه `update`، نه `delete`. خود function هم هر بار یه message کاربر جدید ذخیره می‌کنه.
- **اگه همین‌طوری ship کنیم:** Regenerate یا هیچ کاری نمی‌تونه بکنه، یا یه جواب دوم زیر جواب اول اضافه می‌کنه و سؤال سارا دو بار توی transcript میاد.
- **پیشنهاد:** function یه ورودی `regenerate: true` بگیره. آخرین جواب assistant اون thread رو پاک کنه و بدون ذخیره‌ی message کاربر جدید، از روی همون آخرین سؤال دوباره جواب بده. برای این یه policy و grant برای `delete` روی messageهای thread خود کاربر لازمه. Regenerate فقط روی آخرین جواب باشه و **از سقف ۳۰ تا در روز کم کنه**، چون یه request واقعی به مدله.

### ۴. booking card نداریم، و مدل شماره‌ی پرواز رو از خودش درمیاره (must change)

- **الان:** هیچ cardی برای booking نیست. جدول‌های spec 7 هم فیلد اجباری دارن: flight هم `airline` می‌خواد هم `flight_number`؛ hotel هم `name` می‌خواد هم `check_in` و `check_out`.
- **اگه همین‌طوری ship کنیم:** سارا می‌گه «یه پرواز هم اضافه کن». مدل پرواز واقعی رو نمی‌دونه، پس یه چیزی مثل «JL 123» می‌سازه و اون می‌ره زیر Bookings. سارا توی فرودگاه دنبال پروازی می‌گرده که وجود نداره.
- **پیشنهاد:**
  - یه card جدید `bookings` با سه نوع: `hotel` (اسم؛ تاریخ‌ها پیش‌فرض تاریخ سفر)، `car` (شرکت، محل تحویل) و `extra` (عنوان، توضیح).
  - `flight` فقط وقتی card بشه که سارا خودش airline و شماره رو توی chat نوشته. توی prompt صریح می‌گیم شماره‌ی پرواز نساز.
  - هر card یه دکمه‌ی «Add to Bookings» داره که `ConfirmDialog` باز می‌کنه و دقیقاً می‌گه چی نوشته میشه.
  - spec می‌گه «update». پیشنهاد: فقط **اضافه کردن**. ویرایش و حذف booking موجود از توی chat نباشه؛ اون از صفحه‌ی trip انجام میشه.
  - بدون trip انتخاب‌شده دکمه غیرفعاله.

### ۵. draft جایی برای پنهان شدن نداره، و راهی برای active شدن هم نداره (must change)

- **الان:** spec می‌گه draft «از Active پنهان بشه و توی My Trips و All Plans دیده بشه». فیلترهای Active و All Plans رو ۲۰۲۶-۱۰-۰۸ از Home برداشتیم و My Trips هم فیلتر نداره. spec هم هیچ جا نگفته draft چطور active میشه.
- **اگه همین‌طوری ship کنیم:** سارا Save Draft می‌زنه. trip توی My Trips با badge «Upcoming» میاد، عین یه سفر واقعی، و تا ابد draft می‌مونه چون هیچ دکمه‌ای وضعیتش رو عوض نمی‌کنه.
- **پیشنهاد:**
  - توی My Trips، card یه draft به جای Upcoming/Ongoing/Past badge «Draft» نشون بده.
  - لیست «Continue planning» توی Home (که جای همون Active نشسته) draft نشون نده.
  - توی منوی trip یه ردیف «Move to my trips» برای draft باشه که `status` رو `active` می‌کنه.

## چیزهایی که spec نگفته (spec amendment)

### ۶. Add to Trip دو بار زده بشه، دو بار می‌نویسه

- **الان:** card توی transcript ذخیره شده و هیچ نشونه‌ای از «قبلاً اضافه شد» نداره.
- **اگه ول کنیم:** سارا Add to Trip می‌زنه، مطمئن نیست، دوباره می‌زنه. روز ۲ هر activity رو دو بار داره.
- **پیشنهاد:** بعد از موفقیت، دکمه بشه «Added» و غیرفعال بمونه. این فقط تا وقتی صفحه بازه یادش می‌مونه؛ اگه سارا بره و برگرده دکمه دوباره فعاله. ذخیره‌ی دائمی‌اش یعنی `update` روی message، که ارزشش رو نداره.

### ۷. Add to Trip یه sheet داشته باشه که هم روز رو بپرسه هم تأیید باشه

- **الان:** spec دو تا چیز جدا می‌خواد: «کاربر بتونه روز دیگه‌ای انتخاب کنه» و «قبل از نوشتن روی trip موجود تأیید بگیر».
- **پیشنهاد:** یه sheet: لیست روزهای **موجود** trip (روز خود card از قبل انتخاب شده) و یه دکمه‌ی «Add 4 activities». اگه card روز ۶ باشه و سفر ۵ روزه، هیچ روزی پیش‌فرض نیست و یه خط می‌گه تاریخ سفر رو از صفحه‌ی trip عوض کن. activityها با **یه** `insert` نوشته بشن، نه یکی‌یکی، که نصفه نمونه.

### ۸. Plan with AI یه conversation جدید شروع کنه

- **الان:** chat بدون trip، آخرین thread بدون trip رو باز می‌کنه.
- **اگه ول کنیم:** سارا روی plan «Swiss Alps» می‌زنه Plan with AI و وسط بحث دیروزش درباره‌ی لیسبون فرود میاد، با یه پیام تایپ‌شده درباره‌ی آلپ.
- **پیشنهاد:** این دکمه chat رو خالی باز کنه، با پیام تایپ‌شده و فرستاده‌نشده.

## نکته‌های پیاده‌سازی

| موضوع | نکته |
| --- | --- |
| migration | `0013`. `create_trip` قدیمی اول `drop` بشه. بعد از ساختن دوباره، `revoke` از `public` و `anon` و `grant` به `authenticated` هم دوباره لازمه، چون با drop از بین می‌رن |
| callerهای قدیمی | `createTrip` و `copyExplorePlan` همون function رو صدا می‌زنن. argument جدید default داره، ولی هر دو بعد از migration یه بار چک بشن |
| طول جواب | `MAX_OUTPUT_TOKENS` الان ۲۰۴۸ هست. یه plan هفت‌روزه با card ممکنه وسط JSON قطع بشه و کل cardها بی‌صدا حذف بشن. باید بره بالا |
| prompt | وقتی trip انتخاب شده، مدل باید شماره‌ی روزهای همون trip رو استفاده کنه و اگه plan از روزهای trip بیشتره، بگه |
| deploy | هر تغییر توی `supabase/functions/chat/index.ts` یعنی فرستادن کل فایل از طریق MCP |
| `traveler_count` | بین ۱ و ۲۰ نگه داشته بشه، مثل فرم |
| cover | trip ساخته‌شده از chat فعلاً placeholder داره. cover خودکار مال spec 13 هست |
| trip picker | draftها هم توی لیست trip توی chat دیده بشن، تا بشه روز به روز پرشون کرد |
| بعد از Create Trip | مثل copy: `router.dismissAll()` با guard و بعد push به trip |

## اضافه نکنیم

- function calling یا هر راهی که مدل خودش مستقیم بنویسه
- ویرایش یا حذف activity و booking موجود از توی chat
- ساختن روز جدید (`itinerary_days`) از توی chat
- لیست threadهای قدیمی
- ساختن cover (spec 13)، heart روی place (spec 14)

## رأی‌ها

- [x] ۱ — card جدید `trip`، و sheet که `source` و start date رو می‌پرسه
- [x] ۲ — فیلد `day` روی day card، و `time` فقط `HH:MM`
- [x] ۳ — Regenerate آخرین جواب رو پاک و دوباره تولید می‌کنه، و از سقف ۳۰ کم می‌کنه
- [x] ۴ — card `bookings` برای hotel، car و extra؛ flight فقط با داده‌ی خود کاربر؛ فقط اضافه کردن
- [x] ۵ — badge «Draft»، نبودن draft توی Continue planning، و «Move to my trips»
- [x] ۶ — «Added» فقط تا وقتی صفحه بازه
- [x] ۷ — یه sheet برای روز و تأیید، و یه `insert` برای همه‌ی activityها
- [x] ۸ — Plan with AI با conversation جدید

## قدم بعدی

spec 12 با این هشت تصمیم آپدیت شده. قدم بعدی `/feature start` هست.

</div>
