<div dir="rtl" align="right">

# Pre-review برای spec 14: Saved Places

تاریخ: ۲۰۲۶-۱۰-۰۹ — Status: Not Started. spec 13 روی `main` merge شده؛ spec 14 هنوز load نشده.

## نتیجه

**Decided (۲۰۲۶-۱۰-۰۹).** همه‌ی پیشنهادهای پایین توی spec نوشته شدن. خود feature کوچیکه و هیچ هزینه یا package جدیدی نداره، ولی spec قبل از عکس‌دار شدن place card نوشته شده و سه جاش با app امروز نمی‌خونه.

**یه چیز رو یادت بمونه:** spec می‌گه یه place فقط با `name` ذخیره بشه. بدون شهر، نه میشه روی Maps پیداش کرد، نه دو تا جای هم‌اسم توی دو تا شهر رو از هم جدا کرد.

توی مثال‌ها **سارا** کاربره و توی chat درباره‌ی لیسبون می‌پرسه.

## باید عوض بشه

### ۱. row بدون شهر ذخیره میشه (must change)

- **الان:** spec می‌گه `saved_places` فقط user، `name`، یه label و زمان داره، و unique روی user + `name`.
- **اگه همین‌طوری ship کنیم:**
  - سارا «Time Out Market» لیسبون رو heart می‌کنه. ماه بعد توی chat درباره‌ی بوستون، card «Time Out Market» از قبل heart خورده نشون داده میشه، و اگه روش بزنه، مال لیسبون پاک میشه.
  - توی Profile فقط می‌بینه «Old Town». کدوم شهر؟ معلوم نیست.
- **چرا:** place card توی chat همین الان شهر رو داره (`near` توی `PlaceCardView`) و Maps و lookup عکس هر دو با اسم + شهر کار می‌کنن.
- **پیشنهاد:** یه column به اسم `city` (متن، می‌تونه خالی باشه) اضافه بشه و unique بشه روی user + `lower(name)` + `lower(city)`.

### ۲. Profile الان scroll نمی‌کنه (must change)

- **الان:** tab Profile با `Screen` ساخته شده که scroll نداره. توش یه card، «Edit profile» و «Sign out» هست. spec می‌گه لیست روی همین صفحه بیاد.
- **اگه همین‌طوری ship کنیم:** سارا ده تا place ذخیره می‌کنه و از پنجمی به بعد زیر tab bar می‌ره و دیده نمیشه. spec 15 و spec 16 هم قراره به همین صفحه چیز اضافه کنن.
- **پیشنهاد:** روی Profile یه ردیف «Saved places» با تعداد بیاد که یه screen جدا باز می‌کنه (`/saved-places`، با `FlatList`، شبیه `chat-history`). «Done when» هم بشه «از Profile بازش کن و ببینش».
- **گزینه‌ی دوم:** خود Profile بشه یه `FlatList` و لیست زیر دکمه‌ها بیاد. یه tap کمتر، ولی صفحه‌ای که قراره join code و تنظیمات account هم بگیره شلوغ میشه.

### ۳. tap روی row ذخیره‌شده (spec amendment)

- **الان:** spec می‌گه tap روی row، map باز نمی‌کنه. ولی همون place توی chat با یه tap توی Google Maps باز میشه.
- **اگه همین‌طوری ship کنیم:** سارا جایی رو که ذخیره کرده پیدا می‌کنه و هیچ کاری نمی‌تونه باهاش بکنه جز پاک کردن.
- **پیشنهاد:** tap روی row با `openInMaps(name, city)` باز بشه. رایگانه، key نمی‌خواد، و code‌ش آماده‌ست.

### ۴. عکس توی لیست (spec amendment)

- **الان:** spec می‌گه image نداریم چون card عکس نداشت. الان card عکس Wikipedia داره که هر بار با اسم lookup میشه.
- **اگه توی لیست هم lookup کنیم:** Wikimedia بعد از حدود ۱۰ request جواب `429` می‌ده و ۲۴ ثانیه صبر می‌خواد. سارا با ۲۰ تا place ذخیره‌شده Profile رو باز می‌کنه و نصف عکس‌ها دقیقه‌ها خاکستری می‌مونن؛ همون صف، عکس‌های chat رو هم عقب می‌ندازه.
- **اگه URL عکس رو موقع heart ذخیره کنیم:** با Wikipedia کار می‌کنه، ولی روزی که `PLACE_SOURCE` بره روی Google، URLهاش موقتی‌ان و عکس‌های ذخیره‌شده می‌شکنن.
- **پیشنهاد:** لیست فقط متن باشه: `name` با وزن medium، زیرش label و شهر با `subtle`. شبیه row‌های `chat-history`، بدون placeholder خاکستری.

### ۵. heart کجای card و چه رنگی (spec amendment)

- **الان:** کل place card یه `Pressable` هست که Maps باز می‌کنه. spec جای heart رو نگفته.
- **اگه heart رو توی همون `Pressable` بذاریم:** روی web یه button داخل یه link میشه و tap روی heart ممکنه Maps رو هم باز کنه.
- **پیشنهاد جا:** card بشه یه `View`؛ عکس و متن با هم همون link به Maps بمونن، و heart یه دایره‌ی سفید ۴۴pt روی گوشه‌ی بالا-راست عکس باشه (همون `RoundButton`).
- **رنگ heart پر — انتخاب با خودت:**
  - **`ink` (پیشنهاد):** سرمه‌ای پر. آروم، و با قانون «accent حداکثر دو تا توی یه viewport» مشکلی نداره، چون یه ردیف card می‌تونه چند تا heart پر داشته باشه.
  - **`accent`:** بنفش. واضح‌تره، ولی چند تا کنار هم قانون accent رو می‌شکنه.
  - **قرمز:** design system قرمز رو فقط برای error نگه داشته؛ یه token جدید لازم داره.

### ۶. پاک کردن از لیست (spec amendment)

- **الان:** spec فقط می‌گه «می‌تونه پاک کنه». `chat-history` قبل از delete با `ConfirmDialog` می‌پرسه.
- **پیشنهاد:** هر row یه heart پر داشته باشه و با یه tap بدون dialog پاک بشه. چیزی که از دست می‌ره یه اسم و یه خطه، نه یه conversation. اگه save نشد، row برگرده و یه جمله نشون داده بشه.

## نکته‌های پیاده‌سازی

| موضوع | نکته |
| --- | --- |
| migration | شماره‌ی `0018` رو spec 13 گرفته؛ این میشه `0019`. `drop` و statement `delete` نداره، پس اول MCP `apply_migration` |
| table | `user_id` با default `auth.uid()` و `on delete cascade` به `auth.users` (برای account deletion توی spec 16). `name` تا ۸۰ و `label` تا ۱۶۰ character، همون سقف‌هایی که function `chat` روی card می‌ذاره |
| grant و policy | فقط `select`، `insert`، `delete` برای `authenticated`؛ `update` لازم نیست. policy با `(select auth.uid()) = user_id` |
| toggle | heart همون لحظه عوض بشه و اگه save fail شد برگرده، مثل `toggleActivity`. بدون spinner. tap دوم موقع save نادیده گرفته بشه؛ خطای unique (`23505`) یعنی «از قبل ذخیره‌ست»، نه error |
| state توی chat | لیست ذخیره‌شده‌ها یه بار برای کل screen خونده بشه (یه hook)، نه یه query برای هر card. یه place که توی چند تا reply هست، همه‌جا با هم پر و خالی میشه |
| شهر خالی | وقتی trip انتخاب نشده و reply هم trip card نداره، `near` خالیه. row با `city` خالی ذخیره میشه و Maps فقط با اسم می‌گرده |
| card از day | وقتی reply خودش place card نداره، placeها از day card ساخته میشن و `line` شون متن activity هست («Morning coffee»). همون به‌عنوان label ذخیره میشه |
| Profile | تعداد و لیست روی focus دوباره خونده بشن، مثل بقیه‌ی hookها |
| types | table دستی به `types/database.types.ts` اضافه بشه، به format generator |
| design system | heart روی place card، ردیف «Saved places» و screen جدید توی `design-system.md` نوشته بشن |
| Expo Go | package جدید نداره. `Heart` توی `lucide-react-native` هست |
| QA | user دوم باید ۰ row ببینه و نتونه row سارا رو پاک کنه؛ بدون session هم read رد بشه |

## اضافه نکنیم

- heart روی link یه stop توی day card، یا روی booking card
- تبدیل place ذخیره‌شده به activity یا «Add to trip» از لیست
- عکس یا column عکس برای row
- این‌که مدل برای هر place شهر جدا بده (یعنی redeploy function `chat`)
- دادن لیست ذخیره‌شده‌ها به prompt مدل
- search، sort، یا دسته‌بندی توی لیست

## رأی‌ها

کاربر گفت «خودت تصمیم بگیر» (۲۰۲۶-۱۰-۰۹). همه‌ی پیشنهادها رو assistant انتخاب کرده و توی `context/features/spec14-saved-places.md` نوشته؛ هر کدوم رو نخواستی بگو.

- [x] ۱ — column `city` و unique روی user + name + city
- [x] ۲ — لیست توی screen جدا (`/saved-places`) با یه ردیف روی Profile
- [x] ۳ — tap روی row، Google Maps رو باز کنه
- [x] ۴ — لیست فقط متن، بدون عکس
- [x] ۵ — heart روی گوشه‌ی عکس؛ رنگ پر: `ink`
- [x] ۶ — پاک کردن با یه tap، بدون dialog

## قدم بعدی

`/feature load spec14-saved-places` و بعد `/feature start`.

</div>
