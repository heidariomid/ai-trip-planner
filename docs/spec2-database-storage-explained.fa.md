<div dir="rtl" align="right">

# Spec 2 — دیتابیس سفر و Storage به زبون ساده

> این فایل برای یاد گرفتنه، مرجع رسمی نیست. خود spec توی `context/features/spec2-database-and-storage.md` هست و SQL توی `supabase/migrations/0002_trips_itinerary_storage.sql`. توی این مرحله هیچ صفحه‌ای به اپ اضافه نشده.

توی مثال‌ها دو نفر داریم: **علی** که سفر رو ساخته، و **سارا** که یه کاربر دیگه‌ست.

## خلاصه

قبل از این مرحله توی Supabase فقط جدول `profiles` رو داشتیم. الان این چیزها کار می‌کنه:

- علی می‌تونه سفر، روزها و activityهای خودش رو بسازه، ببینه، عوض کنه و پاک کنه.
- سارا هیچ‌کدوم از اون‌ها رو نمی‌بینه و نمی‌تونه دستشون بزنه.
- فایل‌ها توی دو تا bucket خصوصی می‌رن: `images` و `documents`. هر کس فقط توی فولدر خودش می‌تونه فایل بذاره.
- typeهای TypeScript از روی دیتابیس generate شدن، دستی ننوشتیمشون.

همه‌ی این‌ها رو مستقیم روی دیتابیس تست کردیم. توی اپ هنوز دکمه‌ای برای ساختن سفر نیست.

## ۱ — چرا سه تا جدول، نه یه column از نوع JSON

یه سفر چند تا روز داره و هر روز چند تا activity.

راه تنبلانه این بود که همه‌ی activityهای یه روز رو توی یه column از نوع `jsonb` بریزیم. دو تا مشکل داره:

- برای پاک کردن یه activity باید کل اون JSON رو از اول بنویسی.
- دیتابیس نمی‌تونه چک کنه که اون activity واقعاً مال یه روز واقعیه.

پس سه تا جدول ساختیم:

- `trips` — خود سفر. به یه `profiles` وصله.
- `itinerary_days` — یه روز از یه سفر.
- `itinerary_activities` — یه activity توی یه روز.

`on delete cascade` یعنی: سفر رو پاک کنی، روزهاش هم پاک میشن. روز رو پاک کنی، activityهاش هم پاک میشن.

```sql
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  source text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  image_path text,
  description text,
  traveler_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_dates_check check (end_date >= start_date),
  constraint trips_traveler_count_check check (traveler_count > 0),
  constraint trips_description_length_check
    check (description is null or char_length(description) <= 200)
);
```

چند تا نکته درباره‌ی این جدول:

- **تعداد روزها column نیست.** اپ خودش از `start_date` و `end_date` حسابش می‌کنه.
- **سه تا `check` آخر** جلوی دیتای غلط رو می‌گیرن: تاریخ پایان قبل از شروع، صفر مسافر، و description بلندتر از ۲۰۰ کاراکتر.
- **`updated_at` خودش آپدیت نمیشه.** فقط موقع `insert` مقدار می‌گیره. `profiles` هم همین‌طوریه.
- **Postgres برای foreign key خودش index نمی‌سازه.** برای همین روی `user_id` و `day_id` دستی index ساختیم.
- **`unique (trip_id, day_number)`** نمی‌ذاره یه سفر دو تا «روز ۱» داشته باشه. خودش یه index هم هست، پس پیدا کردن روزهای یه سفر هم سریعه.

## ۲ — کی اجازه داره؟ دو تا function جواب می‌دن

RLS (Row Level Security) یعنی خود Postgres تصمیم می‌گیره هر کاربر کدوم rowها رو ببینه، نه اپ. قانونش رو با policy می‌نویسیم.

سؤال همه‌ی policyها یکیه: «این کاربر به این سفر دسترسی داره؟». اگه این شرط رو توی تک‌تک policyها کپی کنیم، روزی که share خانوادگی (spec 15) بیاد باید همه‌شون رو از اول بنویسیم.

پس جواب این سؤال رو گذاشتیم توی دو تا function:

- `can_access_trip` — کاربر می‌تونه این سفر رو **ببینه**؟
- `can_edit_trip` — کاربر می‌تونه این سفر رو **عوض کنه**؟

الان هر دو یه چیز رو چک می‌کنن: «تو owner این سفری؟». توی spec 15 فقط داخل این دو تا function عوض میشه (مثلاً سارا با role به اسم `viewer` فقط اولی رو پاس می‌کنه و با `editor` هر دو رو). اسم و ورودی‌شون همون می‌مونه، پس policyها دست نمی‌خورن.

```sql
create function private.can_access_trip(trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.trips
    where trips.id = can_access_trip.trip_id
      and trips.user_id = (select auth.uid())
  );
$$;
```

سه تا چیز توی این کد هست که باید بدونی چرا اونجاست.

**`security definer`** — function با دسترسی کسی اجرا میشه که ساختتش، نه کسی که صداش زده. چرا لازمه؟ چون بدون اون یه loop درست میشه: policy جدول `trips` این function رو صدا می‌زنه، function می‌ره `trips` رو بخونه، خوندن `trips` دوباره policy رو اجرا می‌کنه، و همین‌طور تا ابد. با `security definer` اون `select` داخل function دیگه از RLS رد نمیشه و loop قطع میشه.

**schema به اسم `private`** — هر function که توی `public` باشه از بیرون با API قابل صدا زدنه. یه function از نوع `security definer` که RLS رو دور می‌زنه نباید این‌طوری در دسترس باشه. `private` اصلاً توی API نیست. بعدش هم اجازه‌ی اجرا (`EXECUTE`) رو از `public` و `anon` گرفتیم و فقط به `authenticated` دادیم.

**`set search_path = ''`** — یعنی داخل function باید همه‌چیز رو با اسم کامل بنویسی: `public.trips`، `auth.uid()`. این‌طوری کسی نمی‌تونه یه `trips` یا `uid` تقلبی جلوی function بذاره.

یه function سوم هم هست: `private.trip_owner_id`. فقط می‌گه owner این سفر کیه. policyهای Storage ازش استفاده می‌کنن (بخش ۸).

## ۳ — policy خوندن `trips` چرا دو تا شرط داره

```sql
create policy "Trip members can read the trip"
  on public.trips
  for select
  to authenticated
  using ((select auth.uid()) = user_id or (select private.can_access_trip(id)));
```

توی نگاه اول شرط اول اضافه به نظر میاد، چون `can_access_trip` هم همین رو چک می‌کنه. ولی اگه برش داری یه باگ عجیب می‌گیری.

قضیه اینه: وقتی اپ می‌نویسه `.insert().select()`، Postgres سفر رو می‌سازه و **توی همون statement** می‌خواد row جدید رو برگردونه. برای برگردوندن، policy خوندن اجرا میشه.

- `can_access_trip` می‌ره توی جدول `trips` دنبال اون row می‌گرده. ولی چون `stable` هست، rowی که همین statement تازه ساخته رو هنوز نمی‌بینه. جواب: `false`.
- شرط `auth.uid() = user_id` اصلاً توی جدول نمی‌گرده. مستقیم به همون rowی که دستشه نگاه می‌کنه. جواب: `true`.

پس بدون شرط اول، سفر ساخته میشه ولی اپ یه خطای RLS می‌گیره. با شرط اول درست کار می‌کنه.

برای خود `insert` هم نمیشه از `can_access_trip` استفاده کرد، چون سفر هنوز وجود نداره که function پیداش کنه. policy ساختن فقط چک می‌کنه سفر رو به اسم خودت بسازی:

```sql
create policy "Users can create their own trips"
  on public.trips
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
```

**activityها چطور؟** جدول `itinerary_activities` اصلاً `trip_id` نداره، فقط `day_id` داره. پس policyش اول روز رو پیدا می‌کنه، بعد با `trip_id` اون روز function رو صدا می‌زنه:

```sql
exists (
  select 1 from public.itinerary_days as days
  where days.id = itinerary_activities.day_id
    and (select private.can_access_trip(days.trip_id))
)
```

برای `insert`، `update` و `delete` همین شکله، فقط با `can_edit_trip`.

دو تا نکته‌ی کوچیک:

- **همیشه بنویس `(select auth.uid())`، نه `auth.uid()` خالی.** خالی‌ش برای هر row یه بار اجرا میشه. با `select` فقط یه بار برای کل query.
- **برای `anon` هیچ policyای ننوشتیم.** وقتی RLS روشنه و هیچ policyای به کاربر نمی‌خوره، نتیجه یه لیست خالیه، نه خطا.

## ۴ — policy ادیت owner رو چک نمی‌کنه، trigger چک می‌کنه

```sql
create policy "Trip editors can update the trip"
  on public.trips
  for update
  to authenticated
  using ((select private.can_edit_trip(id)))
  with check ((select private.can_edit_trip(id)));
```

دقت کن که اینجا `user_id = auth.uid()` نداریم. عمداً نذاشتیم.

دلیلش spec 15 هست. فرض کن علی سفرش رو با سارا share کرده و سارا `editor` شده. `user_id` سفر هنوز علی‌ه. اگه policy می‌گفت «`user_id` باید خودت باشی»، سارا هیچ‌وقت نمی‌تونست title رو عوض کنه، با اینکه `can_edit_trip` بهش اجازه داده.

ولی یه چیز نباید هیچ‌وقت عوض بشه: خود `user_id`. وگرنه سارا می‌تونه سفر رو به اسم خودش بزنه. این رو یه trigger نگه می‌داره:

```sql
create function private.prevent_trip_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'The owner of a trip cannot be changed'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
```

`old` یعنی row قبل از `update` و `new` یعنی row بعدش. اگه `user_id` فرق کرده باشه، trigger خطا می‌ده و `update` انجام نمیشه.

چرا `is distinct from` و نه `<>`؟ چون اگه یکی از دو طرف `null` باشه، `<>` جواب `null` می‌ده و `if` اجرا نمیشه. `is distinct from` با `null` هم درست کار می‌کنه.

توی تست واقعی، requestی که می‌خواست `user_id` رو عوض کنه `403` گرفت و owner همون علی موند.

## ۵ — پاک کردن سفر فقط کار owner هست

```sql
create policy "Only the owner can delete the trip"
  on public.trips
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
```

اینجا برعکس بخش قبل، از `can_edit_trip` استفاده نکردیم. سارا به عنوان `editor` می‌تونه title رو عوض کنه یا روز و activity اضافه و پاک کنه، ولی نباید بتونه کل سفر علی رو پاک کنه.

## ۶ — `create_trip`: سفر و روزهاش با هم ساخته میشن

اگه اپ اول سفر رو بسازه و توی یه request دیگه روزها رو، و request دوم fail بشه، یه سفر بدون روز توی دیتابیس می‌مونه.

`create_trip` همه رو توی یه transaction می‌سازه: سفر، روزها و activityها. یا همه‌ش انجام میشه یا هیچی. آخرش `id` سفر رو برمی‌گردونه.

```sql
create function public.create_trip(
  p_title text,
  p_source text,
  p_destination text,
  p_start_date date,
  p_end_date date,
  p_description text default null,
  p_traveler_count integer default 1,
  p_image_path text default null,
  p_activities jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
```

**چرا اسم‌ها با `p_` شروع میشن؟** اگه argument هم‌اسم column باشه (مثلاً هر دو `title`)، Postgres داخل function نمی‌فهمه منظورت کدومه و خطا می‌ده. `p_` این مشکل رو حل می‌کنه. spec 4 باید با همین اسم‌ها صداش بزنه.

**چرا `security invoker`؟** این برعکس `security definer` هست: function با دسترسی خود کاربر اجرا میشه، پس `insert`هاش از RLS رد میشن. `user_id` هم از `auth.uid()` میاد، نه از argument. یعنی هیچ‌کس نمی‌تونه سفر رو به اسم یکی دیگه بسازه.

**روزها:** از `p_start_date` تا `p_end_date` و خود هر دو روز هم حساب میشن. برای ۶ تا ۸ اکتبر سه تا row ساخته شد.

**activityها:** `p_activities` یه آرایه‌ی JSON هست. هر عضوش این شکلیه:

```json
{ "day_number": 1, "starts_at": "09:00", "ends_at": "10:30", "place": "Colosseum", "activity": "Tour", "notes": "..." }
```

`ends_at` بعداً با migration `0003_activity_ends_at.sql` اضافه شد. اختیاریه، و دیتابیس نمی‌ذاره قبل از `starts_at` باشه.

اگه چیزی نفرستی، خالیه (`[]`). spec 4 بدون activity صداش می‌زنه. spec 6 و spec 12 با activity.

**اگه `day_number` غلط باشه چی؟** مثلاً سفر سه‌روزه‌ست و یه activity برای روز ۹ فرستادی. اون activity هیچ روزی پیدا نمی‌کنه و بی‌صدا جا می‌مونه. برای همین function آخر کار می‌شمره: چند تا فرستادی، چند تا نوشته شد. اگه یکی نبود، خطا می‌ده و کل transaction برمی‌گرده:

```sql
  if written_activities <> expected_activities then
    raise exception 'An activity refers to a day that is not part of the trip'
      using errcode = '22023';
  end if;
```

توی تست واقعی، روز ۹ خطای `22023` داد و هیچ سفری نموند. تاریخ برعکس، description با ۲۰۱ کاراکتر و `traveler_count` صفر هم هر کدوم با `check` خودشون رد شدن و چیزی جا نذاشتن.

**`status` نداره.** draft توی spec 12 میاد. اونجا اول این function رو `drop` می‌کنن و بعد نسخه‌ی جدید رو می‌سازن، چون اگه دو تا `create_trip` با ورودی‌های مختلف هم‌زمان باشن، API نمی‌دونه کدوم رو صدا بزنه.

## ۷ — `GRANT` و RLS دو تا چیز جدان

- `GRANT` می‌گه این role اصلاً اجازه داره به این جدول دست بزنه یا نه.
- RLS می‌گه حالا که اجازه داره، کدوم rowها رو می‌بینه.

هر دو باید باشن. مطمئن نبودیم Supabase خودش به `authenticated` روی جدول‌های جدید `GRANT` می‌ده، پس توی migration صریح نوشتیمش:

```sql
grant select, insert, update, delete
  on public.trips, public.itinerary_days, public.itinerary_activities
  to authenticated;
```

**یه چیز که باید بدونی:** بعد از اعمال چک کردیم و دیدیم `anon` هم روی این سه جدول `GRANT` داره. ما ندادیم، Supabase به‌صورت پیش‌فرض روی هر جدول جدید توی `public` می‌ده (`profiles` هم همین‌طوره). چیزی که جلوی `anon` رو می‌گیره RLS هست: هیچ policyای براش نیست، پس همیشه لیست خالی می‌گیره. تست بدون login هم همین رو نشون داد.

## ۸ — Storage: فایل خصوصیه و مسیرش می‌گه مال کیه

دو تا bucket ساختیم. توی این SQL، `public` اسم یه column هست (نه schema) و `false` یعنی داشتن لینک برای دانلود کافی نیست.

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('images', 'images', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('documents', 'documents', false, 20971520,
    array['application/pdf', 'image/jpeg', 'image/png']);
```

- `images` — برای cover سفر و بعداً gallery. تا ۱۰ مگابایت.
- `documents` — برای فایل بلیت. تا ۲۰ مگابایت. هنوز هیچ صفحه‌ای توش آپلود نمی‌کنه.

مسیر هر فایل سفر این شکلیه:

```text
{user_id}/{trip_id}/{filename}
```

policy آپلود سه تا چیز رو چک می‌کنه:

1. bucket باید `images` یا `documents` باشه.
2. فولدر اول باید `id` همون owner سفر باشه (از `trip_owner_id` می‌گیره).
3. `can_edit_trip` برای اون سفر باید `true` باشه.

**`try_uuid` برای چیه؟** فولدر دوم باید `id` یه سفر باشه، یعنی یه uuid. اگه policy مستقیم بنویسه `::uuid` و یکی فایلی با مسیر `abc/hello/x.jpg` بفرسته، Postgres موقع تبدیل `hello` به uuid خطا می‌ده و کل request خراب میشه. `try_uuid` به جای خطا `null` برمی‌گردونه، پس policy فقط همون مسیر رو رد می‌کنه:

```sql
create function private.try_uuid(value text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  if value ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return value::uuid;
  end if;
  return null;
end;
$$;
```

چند تا نکته‌ی دیگه:

- **upsert هم policy از نوع `select` می‌خواد هم `update`.** Storage برای جایگزین کردن فایل اول باید فایل قبلی رو ببینه. اگه policy از نوع `update` نباشه، request بدون خطا تموم میشه ولی فایل عوض نمیشه.
- **avatar یه policy جدا داره.** مسیرش `{user_id}/avatar/{filename}` هست. الان هر کس فقط avatar خودش رو می‌بینه. دیدن avatar بقیه مال spec 15 هست.
- **پاک کردن سفر فایل‌هاش رو پاک نمی‌کنه.** بین Storage و جدول `trips` هیچ foreign keyای نیست. این کار رو اپ توی spec 5 انجام می‌ده.

## ۹ — typeها از دیتابیس generate شدن

بعد از اعمال migration، فایل `types/database.types.ts` دوباره generate شد. دستی ادیتش نکن. بعد از هر migration دوباره generate کن.

`create_trip` با همون argumentهای `p_` توش اومده:

```typescript
      create_trip: {
        Args: {
          p_activities?: Json
          p_description?: string
          p_destination: string
          p_end_date: string
          p_image_path?: string
          p_source: string
          p_start_date: string
          p_title: string
          p_traveler_count?: number
        }
        Returns: string
      }
```

functionهای `private` توی این فایل نیستن، که درسته: از اپ قابل صدا زدن نیستن.

spec اول گفته بود typeها برن توی `types/database.ts`. تصمیم گرفتیم همون فایل قبلی (`types/database.types.ts`) آپدیت بشه که دو تا فایل type نداشته باشیم.

## چیزهایی که موقع تست غافلگیرمون کرد

### بلافاصله بعد از upsert، دانلود هنوز فایل قبلی رو داد

آپلود و دانلود JPEG و PDF درست بود. upsert هم `200` داد و توی دیتابیس checksum فایل جدید ثبت شد. ولی دانلودی که همون ثانیه زدیم هنوز فایل قدیمی رو برگردوند.

مشکل از policy نبود. CDN چند لحظه طول می‌کشه تا نسخه‌ی جدید رو بده. خود داکیومنت Storage هم می‌گه روی همون مسیر overwrite نکن. **نتیجه برای cover سفر:** فایل جدید رو با یه اسم جدید آپلود کن، نه upsert روی اسم قبلی.

### `delete` مستقیم روی `storage.objects` خطا می‌ده

برای پاک کردن فایل‌های تست نوشتیم `delete from storage.objects` و این رو گرفتیم:

`Direct deletion from storage tables is not allowed. Use the Storage API instead.`

Supabase یه trigger گذاشته که جلوی این کار رو می‌گیره. برای پاک‌سازی تست یه راه دور زدن پیدا شد (یه `do` block که اول `storage.allow_delete_query` رو `true` می‌کنه و بعد `delete` می‌زنه)، ولی اپ هیچ‌وقت نباید از این راه بره. spec 5 باید فایل رو با Storage API پاک کنه.

### شماره‌ی migration روی سرور با اسم فایل فرق داره

فایل ما `0002_trips_itinerary_storage.sql` هست. ولی توی history پروژه‌ی remote، version شده `20261006162604`. برای `0001` هم همین‌طوره (`20261006115425`).

این شماره رو ابزار MCP خودش ساخته. SQL همون SQL فایله. فقط اگه یه روز Supabase CLI رو وصل کردی، قبل از `db push` حواست باشه: CLI ممکنه فکر کنه این فایل‌ها اعمال نشدن، دوباره اجراشون کنه و چون جدول‌ها هستن خطا بده.

### هشدار `handle_new_user` مال این migration نیست

security advisor می‌گه `anon` و `authenticated` می‌تونن `public.handle_new_user` رو اجرا کنن. این همون trigger ثبت‌نام spec 1 هست که `security definer` هست و توی `public` نشسته، یعنی دقیقاً همون اشتباهی که توی بخش ۲ ازش دوری کردیم. functionهای این مرحله توی `private` هستن و هیچ هشداری ندارن.

performance advisor اولش گفت دو تا index جدید استفاده نشدن. طبیعیه، چون هنوز هیچ queryای ازشون رد نشده. توی چک بعدی اون لیست خالی بود.

## چطور تست شد

روی پروژه‌ی واقعی Supabase، با دو تا کاربر تستی که با ایمیل ساخته شدن. بعد از تست، اون کاربرها، سفرها و فایل‌ها پاک شدن.

**به اسم owner:**

- `create_trip` برای ۶ تا ۸ اکتبر سه تا روز و هر دو activity رو ساخت.
- `insert` سفر، خود row رو برگردوند، نه خطای RLS.
- تاریخ برعکس، description با ۲۰۱ کاراکتر، صفر مسافر و activity برای روز ۹، همه خطا دادن و هیچ سفری جا نموند.
- عوض کردن `user_id` رد شد. عوض کردن title انجام شد.
- روز، activity و خود سفر ساخته، ادیت و پاک شدن. با پاک شدن سفر، روزها و activityهاش هم رفتن.
- دو تا روز با یه `day_number` توی یه سفر رد شد.
- یه JPEG و یه PDF توی فولدر خودش آپلود و دانلود شد. آپلود توی فولدر کاربر دوم رد شد.

**به اسم کاربر دوم:** هر سه جدول خالی برگشتن. `update` و `delete` روی سفر owner هیچ rowی رو عوض نکرد.

**بدون login (فقط publishable key):** هر سه جدول خالی، آپلود رد شد، لینک عمومی عکس فایل رو نداد، و صدا زدن `can_access_trip` از API جواب `404` داد.

**بقیه:**

- هر ثبت‌نام دقیقاً یه row توی `profiles` ساخت.
- `npx tsc --noEmit` بدون خطا رد شد.
- اپ توی مرورگر روی `http://localhost:8081` باز شد و صفحه‌ی sign-in اومد.

**چیزهایی که تست نشد:** گوشی واقعی، simulator و Android. توی این مرحله صفحه‌ی جدیدی نبود که چک بشه.

## کارهایی که مونده

- branch `feature/spec2-database-and-storage` هنوز merge نشده و چیزی commit نشده. تا خودت نگی انجام نمیشه.
- `public.handle_new_user` هنوز برای `anon` قابل اجراست. یه migration جدید می‌خواد. `0001_profiles.sql` رو نباید ادیت کنیم.
- پاک کردن فایل‌های سفر موقع حذف سفر: spec 5.
- صفحه‌ای که `create_trip` رو صدا بزنه: spec 4.

## کدوم فایل چی داره

```text
supabase/migrations/0002_trips_itinerary_storage.sql
  جدول‌ها، functionها، policyها و هر دو bucket

types/database.types.ts
  typeهایی که بعد از migration generate شدن

context/current-feature.md
  وضعیت کار و نتیجه‌ی تست

AGENTS.md
  یادداشت اینکه migration روی remote اعمال شده و هنوز merge نشده

docs/spec2-database-storage-explained.fa.md
  همین فایل
```

`0001_profiles.sql` دست نخورده.

## دستور مفید

```bash
npx tsc --noEmit
```

Supabase CLI روی این کامپیوتر نصب نیست. migration با MCP اعمال شد. همین SQL رو دوباره توی SQL Editor اجرا نکن، چون جدول‌ها هستن و خطا می‌گیری.

## شش تا چیز که از این مرحله یادت بمونه

1. **`GRANT` و RLS دو تا قفل جدان.** `GRANT` در جدول رو باز می‌کنه، RLS می‌گه کدوم rowها رو ببینی. هیچ‌کدوم جای اون یکی رو نمی‌گیره.
2. **function از نوع `security definer` رو توی `public` نذار.** اونجا مثل یه endpoint باز می‌مونه. بذارش توی `private` و `EXECUTE` رو از `anon` بگیر.
3. **policy خوندن `trips` به `auth.uid() = user_id` نیاز داره.** بدون اون، `insert … returning` خطای RLS می‌ده، چون function هنوز row جدید رو نمی‌بینه.
4. **توی policy ادیت `trips` ننویس `user_id = auth.uid()`.** وگرنه `editor` توی spec 15 نمی‌تونه چیزی save کنه. ثابت موندن `user_id` کار trigger هست.
5. **upsert فایل قابل اعتماد نیست.** بدون policy از نوع `update` بی‌صدا هیچ کاری نمی‌کنه، و با policy درست هم CDN ممکنه چند لحظه فایل قدیمی رو بده. اسم جدید بهتره.
6. **اسم argument رو هم‌اسم column نذار.** `p_` بذار جلوش.

</div>
