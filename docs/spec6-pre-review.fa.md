<div dir="rtl" align="right">

# Pre-review برای spec 6: Explore

تاریخ: ۲۰۲۶-۱۰-۰۷ — Status: Not Started

## نتیجه

**Decided.** همه‌ی تصمیم‌ها گرفته شد (پایین صفحه). قبلش: یه مورد واقعاً blocker هست: explore plan فیلد
`source` نداره، ولی `trips.source` توی دیتابیس `not null` هست. پس copy
همین‌طوری که spec نوشته fail می‌شه. بقیه‌ی موارد کوچیکن.

نکته‌ی اصلی: spec فقط فیلدهایی رو شمرده که **card** لازم داره. برای
**copy** کردن plan به trip دو تا فیلد دیگه هم لازمه.

## تصمیم‌ها

### ۱. `source` و `destination` توی spec نیستن (must change)

- **الان:** spec برای plan این‌ها رو می‌خواد: title، day count، cost،
  place count، tags، picture. ولی `create_trip` هم `p_source` می‌خواد هم
  `p_destination`.
- **اگه همین‌طوری ship کنیم:** یا دکمه‌ی Copy خطا می‌ده، یا یه trip
  ساخته می‌شه که banner بالاش می‌نویسه «‌ to Tokyo» با source خالی. لینک
  Google Maps روی activity هم بدون `destination` شهر اشتباه رو باز می‌کنه.
- **چرا:** plan می‌دونه مقصد کجاست، ولی نمی‌دونه کاربر از کجا راه می‌افته.
- **پیشنهاد:** به plan دو ستون `destination` و `description` (حداکثر
  ۲۰۰ کاراکتر) اضافه کنیم. موقع copy، کنار start date یه فیلد
  «Leaving from» هم بپرسیم.

### ۲. عکس plan جایی توی Storage نداره (must change)

- **الان:** policyهای bucket `images` فقط path به شکل
  `{owner_id}/{trip_id}/…` و avatar رو قبول می‌کنن. عکس plan owner نداره.
- **اگه همین‌طوری ship کنیم:** عکس رو هر جای اون bucket بذاریم، signed URL
  ساخته نمی‌شه و همه‌ی planها placeholder خاکستری نشون می‌دن.
- **چرا:** migration نمی‌تونه فایل upload کنه. اگه بخوایم از Storage
  بیاد، یه policy جدید می‌خواد و برای هر plan یه upload دستی.
- **پیشنهاد:** عکس‌ها رو bundle کنیم توی `assets/explore/` و row فقط یه
  key مثل `tokyo` نگه داره. Storage دست نمی‌خوره. card توی Home همون
  `map.png` رو نگه می‌داره و عکس plan روی banner می‌آد. trade-off: عکس
  برای plan جدید یعنی build جدید.

### ۳. Copy یه screen جدا باشه، نه dialog (spec amendment)

- **الان:** spec فقط می‌گه start date رو بپرس. ساده‌ترین راه `ConfirmDialog`
  هست.
- **اگه همین‌طوری ship کنیم:** `DateField` خودش یه `Modal` باز می‌کنه و
  `ConfirmDialog` هم `Modal` هست. Modal روی Modal توی iOS قابل اعتماد
  نیست و فقط روی گوشی خودش رو نشون می‌ده. با اضافه شدن فیلد source،
  keyboard هم وارد ماجرا می‌شه.
- **پیشنهاد:** یه route جدا با `FormScreen`، مثل create-trip: source،
  start date، و یه خط که end date رو نشون می‌ده.

### ۴. day count و place count رو count کنیم، ذخیره نکنیم (spec amendment)

- **الان:** spec این دو تا رو فیلد plan حساب کرده، در حالی که dayها و
  activityها row خودشون رو دارن.
- **اگه همین‌طوری ship کنیم:** اگه عدد ذخیره‌شده با rowها نخونه، card
  می‌گه «5 days» ولی trip کپی‌شده ۴ روز داره، یا `create_trip` کل copy رو
  rollback می‌کنه.
- **پیشنهاد:** هر دو رو توی query با `count` بگیریم، همون کاری که
  `listTrips` برای progress bar می‌کنه. فقط cost یه ستون واقعی بمونه.

### ۵. category chipها کم‌رنگ باشن (spec amendment)

- **الان:** `Chip` وقتی selected هست `bg-accent` پُره. chip خود Explore
  هم همینه.
- **اگه همین‌طوری ship کنیم:** دو ردیف chip بنفش پُر زیر هم می‌افتن و با
  هم رقابت می‌کنن.
- **پیشنهاد:** category chip به سبک `DayChips` باشه (`accent-soft` با
  متن `accent`)، همون کاری که توی trip screen کردیم.

### ۶. بعد از copy کجا بریم (spec amendment)

- **الان:** spec فقط می‌گه trip توی My Trips دیده بشه.
- **پیشنهاد:** مستقیم trip جدید رو باز کنیم و back برگرده به Home. اگه
  کاربر همون plan رو دوباره copy کنه، trip دوم ساخته می‌شه و این اوکیه.

## Implementation notes (رأی نمی‌خواد)

| موضوع | نکته |
| --- | --- |
| Default privileges | توی این پروژه هر table جدید توی `public` به `anon` و `authenticated` همه‌ی grantها رو می‌گیره (امروز چک کردم). پس RLS روشن، فقط یه select policy برای `authenticated`، و `revoke` صریح برای بقیه. |
| تست «نمی‌تونه update کنه» | update‌ای که RLS جلوش رو بگیره error نمی‌ده، ۰ row برمی‌گردونه. باید خود row رو دوباره خوند. |
| Seed | توی همون migration. `ends_at` نباید قبل از `starts_at` باشه و `description` بیشتر از ۲۰۰ کاراکتر نشه، وگرنه copy توی دیتابیس reject می‌شه. |
| End date | با `addDays` از `lib/dates.ts`. اگه یه روز کم بیاد، `create_trip` کل transaction رو rollback می‌کنه. |
| `createTrip` | الان `p_activities` نمی‌فرسته. همین تابع رو extend کنیم، wrapper دوم نسازیم. |
| `ActivityRow` | همیشه pressable هست و آیکون pencil داره. یه حالت read-only می‌خواد. لینک Maps بمونه. |
| `TripBanner` | تاریخ، status badge و signed image می‌خواد. plan هیچ‌کدوم رو نداره. تاریخ fake بهش ندیم. |
| Home | لیست Explore الان loading، error و empty state نداره. هر سه لازمه، به‌علاوه‌ی پیام وقتی یه category خالیه. |
| Route جدید | `typedRoutes` تا Metro بالا نیاد route جدید رو نمی‌شناسه. قبلش `tsc` خطا می‌ده. |
| Migration | احتمالاً باز باید دستی apply کنی. بعدش `types/database.types.ts` رو regenerate می‌کنم. |
| Accent | plan screen همون open finding مربوط به trip screen رو داره: دکمه‌ی Copy، day chip و نقطه‌های timeline. |

## Do not add

- دکمه‌ی Plan with AI (spec 12)
- heart یا save روی plan (spec 14)
- search توی planها
- ستون budget روی `trips`
- map زنده
- نشونه‌ی «قبلاً copy شده» روی card

## Votes

همه‌ی ۶ مورد قبول شد (۲۰۲۶-۱۰-۰۷). spec 6 و Goals توی
`context/current-feature.md` update شدن.

- [x] ۱. plan ستون `destination` و `description` داره و copy فیلد source رو می‌پرسه
- [x] ۲. عکس plan توی app bundle می‌شه، نه Storage
- [x] ۳. copy یه screen جداست، نه dialog
- [x] ۴. day count و place count با `count` می‌آن
- [x] ۵. category chip به سبک `DayChips`
- [x] ۶. بعد از copy، trip جدید باز می‌شه

## قدم بعدی

`/feature start`

</div>
