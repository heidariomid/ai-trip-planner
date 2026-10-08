<div dir="rtl" align="right">

# Overview برای spec 6: Explore

تاریخ: ۲۰۲۶-۱۰-۰۷ — branch: `feature/explore` — هنوز commit نشده

## چی ساختیم

- **Explore plan توی دیتابیس.** سه تا table جدید با migration
  `0006_explore_plans.sql`، به‌علاوه‌ی ۵ تا plan آماده: Swiss Alps، Dubai،
  Chicago، Los Angeles و Lake Tahoe. migration روی remote apply شده.
- **Home با layout جدید.** بالا greeting با اسم کاربر، بعد ask bar، بعد یه
  ردیف «Popular destinations» که هر card‌ش یه explore plan واقعیه و با زدن
  روش plan باز می‌شه. پایینش «Continue planning» هست: حداکثر ۳ تا trip که
  هنوز تموم نشدن.
- **Explore screen.** «See all» کنار Popular destinations یه screen جدا باز
  می‌کنه با همه‌ی planها و category chipها (All، Nature، Beach، City،
  Adventure).
- **Plan screen.** با زدن روی card باز می‌شه: عکس، مشخصات، و itinerary
  روز به روز. فقط read-only هست. لینک Google Maps روی place کار می‌کنه.
- **Copy screen.** دکمه‌ی «Copy to my trips» یه screen جدا باز می‌کنه که
  `source` و start date رو می‌پرسه و end date رو خودش نشون می‌ده.
- **بعد از copy.** یه trip واقعی با همه‌ی dayها و activityها ساخته می‌شه و
  همون لحظه باز می‌شه. back برمی‌گرده به Home.

- **Planning progress.** حالا از روی تیک activityها حساب می‌شه: هر activity
  یه دایره‌ی تیک داره و progress می‌شه تعداد تیک‌خورده‌ها به کل. trip
  کپی‌شده از ۰٪ شروع می‌کنه، نه ۱۰۰٪. migration `0007_activity_is_done.sql`
  هم apply شده.

## تصمیم‌هایی که گرفتیم

- plan فیلد `source` نداره، برای همین موقع copy می‌پرسیم.
- عکس planها توی app bundle هست، نه Storage.
- day count و place count ذخیره نمی‌شن، از روی rowها count می‌شن.
- trip کپی‌شده عکس همون plan رو به‌عنوان cover می‌گیره. عکس توی folder خود
  کاربر upload می‌شه، پس مثل هر cover دیگه‌ای قابل عوض کردنه.

## چی تست شده

روی web با test account همه‌ی این‌ها pass شد: لیست planها، category chip،
plan screen، خطای `source` خالی، و copy کردن plan Chicago.

توی دیتابیس هم چک شد: کاربر دوم trip کپی‌شده رو نمی‌بینه، ولی planها رو
می‌بینه. هیچ کاربری نمی‌تونه plan رو update یا delete کنه.

## چی رو خودت باید تست کنی

روی گوشی، با Expo Go:

- [ ] Home: greeting، ردیف Popular destinations و لیست Continue planning
      دیده می‌شن
- [ ] روی یه destination card بزن: plan همون‌جا باز می‌شه
- [ ] «See all» کنار Popular destinations: Explore screen با هر ۵ تا plan
- [ ] یه category chip بزن: لیست فیلتر می‌شه. All همه رو برمی‌گردونه
- [ ] «See all» کنار Continue planning: می‌ره به My Trips
- [ ] یه plan باز کن: عکس و itinerary درست نشون داده می‌شن
- [ ] بین Day 1، Day 2 و بقیه جابه‌جا شو
- [ ] روی یه place بزن: Google Maps باز می‌شه
- [ ] «Copy to my trips» رو بزن و `source` رو خالی بذار: خطا می‌ده
- [ ] `source` رو پر کن: keyboard نباید دکمه‌ی Create trip رو بپوشونه
- [ ] start date رو عوض کن: end date خودش update می‌شه
- [ ] Create trip: trip جدید با activityهاش باز می‌شه
- [ ] روی دایره‌ی کنار یه activity بزن: تیک می‌خوره و خط می‌خوره
- [ ] back بزن: برمی‌گردی به Home
- [ ] trip جدید توی My Trips هست و cover‌ش عکس همون plan هست
- [ ] progress روی card درسته: بدون تیک ۰٪، با تیک زدن بالا می‌ره

## نکته

- test account الان یه trip کپی‌شده از Chicago داره.
- chipهای My Plan / Explore و فیلترهای All Plans / Active از Home برداشته
  شدن. tripهای Past فقط توی My Trips دیده می‌شن.

## قدم بعدی

اگه تست گوشی اوکی بود: `/feature complete`

</div>
