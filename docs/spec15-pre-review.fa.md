<div dir="rtl" align="right">

# Pre-review برای spec 15: Family Share

تاریخ: ۲۰۲۶-۱۰-۰۹ — Status: Not Started. spec 14 هنوز روی branch `feature/saved-places` بازه و commit نشده؛ spec 15 load نشده.

## نتیجه

**Decided (۲۰۲۶-۱۰-۰۹).** همه‌ی پیشنهادهای پایین توی spec نوشته شدن. قسمت database توی spec خوب فکر شده و با code امروز می‌خونه: policyها از spec 2 روی `can_access_trip` و `can_edit_trip` سوارن، و upload عکس و cover همین الان توی folder صاحب trip (`trip.user_id`) می‌ره، نه folder کسی که sign in کرده. مشکل سمت app هست: spec فقط database رو می‌بنده و درباره‌ی screen چیزی نمی‌گه.

**یه چیز رو یادت بمونه:** app امروز اصلاً نمی‌دونه «role» چیه. اگه فقط migration رو بزنیم، viewer همه‌ی دکمه‌های edit رو می‌بینه و هر کدوم رو بزنه error می‌گیره.

توی مثال‌ها **سارا** owner هست و trip «Japan Adventure» رو ساخته. **علی** با code بهش join می‌کنه.

## باید عوض بشه

### ۱. viewer همه‌ی دکمه‌های edit رو می‌بینه (must change)

- **الان:** spec می‌گه viewer توی database نمی‌تونه چیزی عوض کنه. ولی screen trip برای همه یکیه: «+ Add»، مداد کنار هر row، tick روی activity و packing، «Edit trip» و «Delete trip» توی `TripMenu`، و دکمه‌های Add to Trip / Add to Bookings / Add to Packing توی chat.
- **اگه همین‌طوری ship کنیم:**
  - علی (viewer) روی «+ Add» می‌زنه، یه hotel کامل تایپ می‌کنه، Save می‌زنه و می‌بینه «We couldn't save…».
  - روی tick یه activity می‌زنه؛ tick پر میشه، بعد برمی‌گرده و یه error بالای صفحه میاد.
  - علی وقتی editor بشه «Delete trip» رو می‌بینه، می‌زنه، و عکس‌های trip از Storage پاک میشن (چون policy فایل‌ها `can_edit_trip` هست) ولی خود trip پاک نمیشه. trip سارا بدون cover و بدون gallery می‌مونه.
- **پیشنهاد:**
  - trip یه `role` بگیره (`owner`، `editor`، `viewer`) که با همون request خود trip میاد.
  - **viewer:** همه‌ی rowها read-only (همون حالتی که `ActivityRow` برای explore plan داره)، بدون «+ Add»، مداد و tick. توی menu فقط «Ask the assistant». توی chat به‌جای دکمه‌ی card یه خط `subtle`: «Only editors can add to this trip».
  - **editor:** همه‌چیز مثل owner، به‌جز «Delete trip» و «Move to my trips» که نشون داده نمیشن.
  - `deleteTrip` قبل از پاک کردن فایل‌ها چک کنه که caller همون owner هست.

### ۲. `trip_people` عکس Google و role رو برنمی‌گردونه (must change)

- **الان:** spec می‌گه `trip_people` فقط id، `full_name` و `avatar_path` بده.
- **اگه همین‌طوری ship کنیم:** هر کسی که با Google sign in کرده عکسش توی `avatar_url` هست و `avatar_path`ش خالیه. توی لیست member به‌جای عکس سارا فقط حرف «S» میاد، در حالی که توی Profile خودش عکس داره. role هم توی خروجی نیست، پس لیست نمی‌تونه «Can view» رو کنار اسم بنویسه.
- **پیشنهاد:** `trip_people` سه چیز دیگه هم بده: `avatar_url`، `role`، و `is_you`. `email` برنگرده. کسی که `full_name` نداره «Traveller» نشون داده بشه.

### ۳. share panel به‌عنوان sheet (must change)

- **الان:** board یه panel روی صفحه‌ی trip نشون می‌ده و spec می‌گه «share sheet».
- **اگه همین‌طوری ship کنیم:** توی این sheet باید role یه member عوض بشه و قبل از remove سؤال بشه (`ConfirmDialog`). یعنی یه modal روی یه modal دیگه، که روی iOS قابل اعتماد نیست؛ توی spec 12 به همین دلیل `chat-create-trip` یه route جدا شد.
- **پیشنهاد:** share یه screen جدا باشه: `/trip/[id]/share`. از یه `RoundButton` سوم روی banner باز بشه (icon `Users` با تعداد member کنارش، مثل board).

## spec amendment

### ۴. code کجا ذخیره میشه و کی ساخته میشه

- **الان:** spec می‌گه «هر trip یه code» ولی نمی‌گه کجا و کی.
- **اگه column روی `trips` باشه:** هر viewer که trip رو می‌خونه code رو هم می‌تونه بخونه و برای بقیه بفرسته. spec می‌گه فقط owner share می‌کنه.
- **پیشنهاد:** یه table جدا، `trip_join_codes` (`trip_id` به‌عنوان primary key با cascade، `code` unique). فقط owner می‌تونه بخوندش. code اولین باری که سارا screen share رو باز می‌کنه ساخته میشه، با `public.rotate_trip_code(trip_id)` که همون function دکمه‌ی Regenerate هم هست.
- **شکل code:** ۸ character از حروف و عددهایی که با هم اشتباه نمیشن (بدون `0`، `O`، `1`، `I`)، با یه خط وسطش مثل board: `JPN8-7X5K`. موقع تایپ، حروف کوچیک، فاصله و خط‌تیره نادیده گرفته بشن.

### ۵. کسی که قبلاً member هست و code رو دوباره می‌زنه

- **الان:** spec می‌گه code اشتباه، trip خودت، و «قبلاً member هستی» هر سه یه جمله بدن: «that code does not work».
- **اگه همین‌طوری ship کنیم:** علی code رو دوباره از توی پیام‌هاش می‌زنه و می‌بینه «کار نمی‌کنه»، در حالی که trip توی لیستش هست. فکر می‌کنه سارا حذفش کرده.
- **پیشنهاد:** برای member قبلی، `join_trip` همون trip id رو برگردونه و trip باز بشه؛ role هم دست نخوره. چیزی لو نمیره چون علی از قبل trip رو می‌بینه. code اشتباه و trip خودت همون یه جمله بمونن.

### ۶. member راهی برای بیرون رفتن نداره

- **الان:** فقط owner می‌تونه member رو remove کنه.
- **اگه همین‌طوری ship کنیم:** علی اشتباهی به یه trip join کرده. تا سارا حذفش نکنه، اون trip توی My Trips و Home علی می‌مونه.
- **پیشنهاد:** یه «Leave trip» توی `TripMenu` برای viewer و editor، با `ConfirmDialog`. سمت database یه policy که member بتونه row خودش رو delete کنه.

### ۷. member لیست بقیه رو می‌بینه؟

- **الان:** spec می‌گه `trip_people` برای هر کسی که `can_access_trip` داره جواب می‌ده، ولی نمی‌گه screen share برای member باز میشه یا نه.
- **پیشنهاد:** همه لیست و role‌ها رو ببینن (روی board هم «Both users can access trip details» هست). فقط owner قسمت code، Copy، Regenerate، و menu هر row رو ببینه.

### ۸. trip مشترک توی My Trips علامت نداره

- **الان:** spec می‌گه trip توی My Trips علی میاد. `TripCard` هیچ نشونه‌ای نداره.
- **اگه همین‌طوری ship کنیم:** علی نمی‌فهمه کدوم trip مال خودشه و کدوم مال سارا؛ روی یکی «Delete trip» داره و روی اون یکی نه.
- **پیشنهاد:** یه `Badge` آروم «Shared» کنار badge وضعیت، روی `TripCard` و `TripBanner`، وقتی `user_id` با کاربر یکی نیست. request اضافه نمی‌خواد. طبق design system رنگ جدا برای role نداریم.

## نکته‌های پیاده‌سازی

| موضوع | نکته |
| --- | --- |
| ترتیب | spec 14 اول merge بشه. هر دو tab Profile رو عوض می‌کنن و `0019` مال saved places هست؛ این میشه `0020` |
| MCP | MCP migrationی که `drop function` یا statement `delete` داره رو رد می‌کنه. دو تا body با `create or replace` عوض بشن، Regenerate یه `update` باشه، و remove یه member از app با policy انجام بشه، نه توی function |
| `trip_members` | `user_id` به `profiles(id)` با cascade. یه index روی `user_id`. grant: `select`، `update (role)`، `delete`. `insert` فقط از `join_trip` |
| policy members | read با `can_access_trip(trip_id)`؛ update و delete فقط وقتی `private.trip_owner_id(trip_id) = auth.uid()`، به‌علاوه‌ی delete روی row خود member (رأی ۶) |
| ساخت code | با `search_path = ''` باید `extensions.gen_random_bytes` با اسم schema صدا زده بشه. اگه code تکراری دراومد دوباره بسازه |
| حدس زدن code | ۸ character یعنی حدود هزار میلیارد حالت؛ سقف روزانه لازم نیست |
| avatar policy | یه function توی `private` که بگه «این user با من توی یه trip هست»، و policy select جدید روی `storage.objects` ازش استفاده کنه. signed URL همون `getImageSource` |
| role توی app | `getTripDetail` و `listTrips` همون `user_id` رو دارن؛ role از `trip_members(role)` توی همون select بیاد |
| `Move to my trips` | editor روی draft سارا نباید ببیندش |
| تغییر تاریخ | editor می‌تونه تاریخ رو عوض کنه و با تأیید، روزهای plan‌شده رو حذف کنه. spec همین رو می‌خواد («editor header رو عوض می‌کنه»)؛ فقط بدونیم |
| chat | thread هر کس مال خودشه؛ علی و سارا conversation هم رو نمی‌بینن. بعد از remove، thread علی می‌مونه ولی trip رو نمی‌خونه؛ chat باید بدون trip باز بشه، نه با error |
| عکس بعد از remove | signed URL تا یه ساعت cache میشه. علی بعد از remove تا یه ساعت cover رو می‌تونه ببینه، بقیه‌ی data نه |
| clipboard | `npx expo install expo-clipboard`. طبق docs SDK 57 توی Expo Go هست و plugin نمی‌خواد. روی web ممکنه `false` برگردونه؛ فقط وقتی `true` بود «Copied» نشون بده |
| screen Join | یه `FormScreen` با یه field: `autoCapitalize="characters"`، `autoCorrect` خاموش. بعد از join، trip باز بشه |
| Profile | یه ردیف «Join a trip» مثل ردیف «Saved places» |
| account deletion | وقتی سارا account رو پاک کنه (spec 16) trip برای همه میره. توی spec 16 باید بهش گفته بشه |
| types و design system | tableها و functionها دستی به `types/database.types.ts`؛ screen share، screen Join، و badge «Shared» توی `design-system.md` |
| QA | «دو تا phone» لازم نیست: iPhone با یه account و web با اون یکی. user سوم باید ۰ row از trip، member، code و profile ببینه |

## اضافه نکنیم

- دکمه‌ی «Add Member» روی board. join فقط با code هست؛ این دکمه کاری نداره بکنه
- «code توی Profile» که روی board نوشته. spec عمداً برش داشته
- دعوت با email یا link
- share sheet سیستم‌عامل برای فرستادن code. Copy کافیه
- Supabase Realtime، یا notification وقتی کسی join می‌کنه
- انتخاب role موقع join. همه viewer میان و سارا عوض می‌کنه
- تاریخ انقضا برای code، یا سقف تعداد member
- «چه کسی این activity رو اضافه کرد»

## رأی‌ها

کاربر گفت «خودت تصمیم بگیر» (۲۰۲۶-۱۰-۰۹). همه‌ی پیشنهادها رو assistant انتخاب کرده و توی `context/features/spec15-family-share.md` نوشته؛ هر کدوم رو نخواستی بگو.

- [x] ۱ — role توی app: viewer read-only، editor بدون Delete trip
- [x] ۲ — `trip_people` با `avatar_url`، `role` و `is_you`
- [x] ۳ — share به‌عنوان screen جدا (`/trip/[id]/share`)، نه sheet
- [x] ۴ — table `trip_join_codes`، ساخت code با اولین باز شدن screen، شکل `XXXX-XXXX`
- [x] ۵ — member قبلی با همون code، trip رو باز کنه
- [x] ۶ — «Leave trip» برای member
- [x] ۷ — همه لیست member رو ببینن؛ code و کنترل‌ها فقط برای owner
- [x] ۸ — badge «Shared» روی trip مشترک

## قدم بعدی

اول spec 14 رو تموم و merge کن. بعد `/feature load spec15-family-share` و `/feature start`.

</div>
