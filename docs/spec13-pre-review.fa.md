<div dir="rtl" align="right">

# Pre-review برای spec 13: AI Cover Image

تاریخ: ۲۰۲۶-۱۰-۰۹ — Status: Not Started (branch ساخته نشده؛ feature لودشده الان spec 14 هست، نه این)

## نتیجه

**Decided (۲۰۲۶-۱۰-۰۹): provider عوض شد به Cloudflare Workers AI، روی free tier.**

ترتیب تصمیم‌ها:

1. کاربر گفت فعلاً هیچ هزینه‌ای نمی‌خواد. مدل Gemini که spec نوشته بود free tier نداره (حدود ۰٫۰۳۴ دلار برای هر عکس).
2. بعد گفت «بهترین گزینه‌ی رایگان با کیفیت خوب». انتخاب: مدل `@cf/black-forest-labs/flux-2-klein-4b` روی Cloudflare.

چرا این:

- روزی ۱۰٬۰۰۰ neuron رایگان، بدون کارت. با این مدل حدوداً ۹۶ عکس در روز برای **کل app**.
- سقف که پر بشه request خطا می‌ده؛ هیچ پولی کم نمیشه مگه خودت plan رو عوض کنی.
- license مدل Apache 2.0 هست، پس استفاده‌ی تجاری مشکلی نداره.
- از `flux-1-schnell` جدیدتر و باکیفیت‌تره؛ schnell به‌عنوان fallback توی spec مونده.

رأی‌های ۳ و ۵ تا ۸ طبق پیشنهاد توی `context/features/spec13-ai-cover.md` نوشته شدن. **این‌ها رو assistant اعمال کرده، کاربر جدا رأی نداده**؛ هر کدوم رو نخواستی بگو. رأی‌های ۲ و ۴ با عوض شدن provider دیگه موضوعیت ندارن.

**چیزی که هنوز معلوم نیست:** پارامترهای دقیق مدل (اندازه، steps، شکل request). docs فقط می‌گه multipart و یه فیلد `image` با base64. قبل از نوشتن function باید یه request واقعی فرستاده بشه.

بخش‌های پایین همون بررسی اولیه‌ست که برای Gemini نوشته شده بود و برای تاریخچه مونده.

توی مثال‌ها **سارا** کاربره و داره یه trip به لیسبون می‌سازه.

## باید عوض بشه

### ۱. مدل تصویر free tier نداره (must change — blocker)

- **الان:** spec می‌گه `gemini-3.1-flash-lite-image` با همون `GEMINI_API_KEY`. key ما روی free tier هست.
- **اگه همین‌طوری ship کنیم:** سارا روی «Generate with AI» می‌زنه و هر بار خطا می‌گیره. ما این رو ۲۰۲۶-۱۰-۰۹ خودمون دیدیم: جواب `429` با «limit: 0 input tokens per minute on Free Tier». صفحه‌ی pricing هم برای این مدل می‌گه free tier نداره.
- **چرا مهمه:** تا حالا هر بار انتخاب بین پولی و رایگان بوده، رایگان رو انتخاب کردی. این‌جا گزینه‌ی رایگان با همین مدل وجود نداره.
- **پیشنهاد:** spec 13 رو **عقب بندازیم** تا وقتی که billing روشن میشه (به‌هرحال قبل از release لازمه). تا اون موقع trip از chat عکس Wikipedia داره و فرم هم upload از gallery. دکمه‌ی «Generate with AI» همون «Coming soon» بمونه.
- **اگه بخوای الان ساخته بشه:** billing باید روشن بشه، وگرنه «Done when» روی گوشی قابل چک نیست.

### ۲. روشن کردن billing، chat رو هم پولی می‌کنه (must change)

- **الان:** spec می‌گه اگه chat هم Gemini باشه، همون secret استفاده بشه.
- **اگه همین‌طوری ship کنیم:** free tier مال کل project گوگله، نه یه مدل. billing که روشن بشه، هر پیام chat هم پولی حساب میشه (ارزون، ولی دیگه صفر نیست).
- **پیشنهاد:** یه key جدا از یه Google Cloud project جدا، با اسم `GEMINI_IMAGE_API_KEY`. chat روی free tier می‌مونه و هزینه‌ی عکس توی یه project جدا دیده میشه. یه budget alert هم روی همون project بذاریم، چون cap ما per-user هست و سقف کلی نداریم.

### ۳. cover خودکار برای trip از chat با چیزی که الان داریم تداخل داره (must change)

- **الان:** spec می‌گه بعد از `create_trip`، app یه عکس از function می‌گیره و cover می‌کنه. ولی `createTripFromPlan` الان با `findDestinationPicture` یه عکس واقعی از Wikipedia می‌ذاره.
- **اگه همین‌طوری ship کنیم:** سه تا مشکل.
  - عکس واقعی لیسبون با یه نقاشی AI از لیسبون عوض میشه، و برای هر trip سه سنت خرج میشه.
  - سارا پنج تا trip توی chat می‌سازه و cap تموم میشه. بعد می‌ره توی فرم، روی Generate می‌زنه و می‌شنوه «فردا».
  - ساختن عکس چند ثانیه طول می‌کشه و Create Trip همون‌قدر منتظر می‌مونه.
- **پیشنهاد:** عکس Wikipedia cover خودکار بمونه. AI فقط **fallback** باشه: وقتی Wikipedia عکسی پیدا نکرد. اون fallback هم از cap کم کنه و اگه fail شد، trip بی‌صدا با placeholder بمونه.
- **خط «readable line in the chat»:** بعد از Create Trip صفحه‌ی chat بسته میشه و trip باز میشه، پس جایی برای اون خط نیست. پیشنهاد: حذفش کنیم.

### ۴. request shape توی spec قدیمیه (spec amendment)

- **الان:** spec می‌گه `response_modalities`، `image_config.image_size`، `thinking_level`، و عکس توی step با `type: model_output`.
- **docs گوگل الان:** `POST /v1beta/interactions` با `response_format: { type: "image", mime_type, aspect_ratio, image_size }`. این مدل فقط `1K` می‌ده.
- **اگه همین‌طوری ship کنیم:** function یه request می‌فرسته که گوگل قبول نمی‌کنه، یا جواب رو از جای اشتباه می‌خونه و هر generation «failed» حساب میشه.
- **پیشنهاد:** spec بشه `response_format` با `mime_type: "image/jpeg"`، `aspect_ratio: "16:9"` و `image_size: "1K"`. جای دقیق base64 توی جواب موقع ساخت با یه request واقعی چک بشه، نه از روی docs.

### ۵. preview به شکل base64 روی گوشی upload نمیشه (must change)

- **الان:** function بایت‌ها رو base64 برمی‌گردونه. ولی `uploadImage` توی `lib/storage.ts` یه `uri` می‌گیره و با `fetch(uri)` می‌خوندش.
- **اگه همین‌طوری ship کنیم:** `fetch` روی یه `data:` URI توی React Native تضمین‌شده نیست، مخصوصاً روی Android. روی web کار می‌کنه، پس چک روی web این رو نشون نمی‌ده. سارا preview رو می‌بینه، Save می‌زنه، و می‌شنوه «cover ذخیره نشد».
- **پیشنهاد:** preview با `data:` URI توی `Image` نشون داده بشه (این کار می‌کنه)، ولی برای upload خود base64 مستقیم به `ArrayBuffer` تبدیل بشه. `LocalImage` یه فیلد اختیاری `base64` بگیره. package جدید لازم نیست.

## چیزهایی که spec نگفته (spec amendment)

### ۶. «The traveller describes the trip» یعنی یه فیلد جدا؟

- **پیشنهاد:** نه. Generate همون `title`، `destination` و `description` فرم رو بفرسته و prompt رو function بسازه (landscape، بدون متن، بدون آدم). تا `destination` خالیه دکمه غیرفعال باشه. متن آزاد به مدل تصویر یعنی هم سوءاستفاده، هم safety block بیشتر.

### ۷. generation ناموفق از cap کم می‌کنه؟

- **الان:** الگوی ما (`consume_chat_request`، `consume_place_lookup`) قبل از صدا زدن مدل می‌شمره.
- **اگه ول کنیم:** safety filter دو بار جواب نمی‌ده و سارا دو تا از پنج تا رو بدون هیچ عکسی از دست داده.
- **پیشنهاد:** همون الگو بمونه (قبل از مدل بشمره، چون امنه)، ولی function توی جواب `remaining` برگردونه و tile بنویسه «3 left today». این‌طوری سارا می‌دونه هر tap یه سهمه.

### ۸. روی صفحه‌ی edit و وقتی cover هست چی؟

- **الان:** `CoverPicker` دو تا tile رو فقط وقتی نشون می‌ده که هیچ cover‌ای نیست. با cover، فقط «Change» هست که gallery باز می‌کنه. spec هم می‌گه «بعداً از trip header cover اضافه کنه».
- **اگه ول کنیم:** trip از chat که عکس Wikipedia داره هیچ راهی به Generate نداره.
- **پیشنهاد:** زیر preview، کنار «Change»، یه «Generate» هم باشه؛ هم توی create هم توی edit.

## نکته‌های پیاده‌سازی

| موضوع | نکته |
| --- | --- |
| migration | `0018`: `cover_usage` و `consume_cover_generation(p_limit)`، کپی الگوی `0015`. `drop` و `delete` نداره، پس MCP `apply_migration` باید قبولش کنه |
| function | `supabase/functions/trip-cover/index.ts`، مثل `place-photo`: `verify_jwt: false`، `auth.getUser`، بدون key جواب `503` با یه جمله. deploy یعنی فرستادن کل فایل از MCP |
| loading | generation چند ثانیه طول می‌کشه. tile باید حالت «Generating…» داشته باشه و tap دوم رو نادیده بگیره، وگرنه دو تا سهم می‌سوزه |
| safety block | جواب بدون عکس = failed. جمله‌ی خوانا روی فرم، کنار دکمه‌ی Save |
| ورودی | `title` و `destination` توی function trim و کوتاه بشن، مثل `text()` توی `place-photo` |
| bundle | بعد از ساخت، web export برای key و آدرس گوگل grep بشه |
| design | tile همون Lucide `Sparkles` با `ink` بمونه؛ accent نگیره. design-system.md برای `CoverPicker` آپدیت بشه |
| types | `consume_cover_generation` دستی به `types/database.types.ts` اضافه بشه |
| draft و explore | هیچ‌کدوم دست نمی‌خورن. copy از explore plan عکس خودش رو داره |

## اضافه نکنیم

- یه provider تصویر دیگه (رایگان یا غیر از Gemini) بدون تصمیم جدا
- دکمه‌ی image توی chat، یا این‌که مدل chat خودش function رو صدا بزنه
- عکس AI برای place card یا gallery
- ذخیره‌ی previewهای استفاده‌نشده توی Storage
- فیلد prompt آزاد روی فرم

## رأی‌ها

- [x] ۱ — بدون هزینه: Cloudflare Workers AI روی free tier (تصمیم کاربر، ۲۰۲۶-۱۰-۰۹)
- [x] ۲ — دیگه لازم نیست: secretها شدن `CLOUDFLARE_ACCOUNT_ID` و `CLOUDFLARE_API_TOKEN`، و chat روی Gemini رایگان می‌مونه
- [x] ۳ — عکس Wikipedia cover خودکار بمونه؛ AI فقط fallback؛ خط توی chat حذف بشه
- [x] ۴ — دیگه لازم نیست: request مال Cloudflare هست و با یه request واقعی چک میشه
- [x] ۵ — upload از روی base64، نه `fetch` روی `data:` URI
- [x] ۶ — بدون فیلد prompt؛ فرم `title`، `destination` و `description` رو می‌فرسته
- [x] ۷ — شمارش قبل از مدل، و نمایش «N left today»
- [x] ۸ — «Generate» کنار «Change»، توی create و edit

## قدم بعدی

دو تا کار دست خودته، هر دو رایگان:

1. یه account رایگان Cloudflare بساز (plan همون Workers Free بمونه).
2. یه API token با دسترسی Workers AI بساز، و اون رو با account id به‌عنوان Edge Function secret توی Supabase بذار: `CLOUDFLARE_API_TOKEN` و `CLOUDFLARE_ACCOUNT_ID`.

بعد `/feature load spec13-ai-cover` و `/feature start`. الان spec 14 لود شده؛ هر کدوم رو خواستی اول بساز.

</div>
