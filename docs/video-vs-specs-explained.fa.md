همه‌ی تغییرها توی specها نوشته شد. هنوز هیچ صفحه‌ای ساخته نشده؛ فقط ستون `ends_at` روی دیتابیس اعمال شده.

## چی کجا رفت

- **[spec3](<context/features/[spec3-app-shell.md](http://spec3-app-shell.md)>):** tab bar شناور، آیکون Lucide، فونت Outfit، و دکمه‌ی Create a trip که تا spec 4 غیرفعاله.

- **[spec4](<context/features/[spec4-create-trip.md](http://spec4-create-trip.md)>):** محتوای کارت سفر (cover، عنوان، مبدا و مقصد، تاریخ، تعداد روز، برچسب Upcoming/Ongoing/Past) و جایی که فرم ازش باز می‌شه.

- **[spec5](<context/features/[spec5-trip-itinerary.md](http://spec5-trip-itinerary.md)>):** chipهای تاریخ و نمایش timeline، با ساعت شروع و پایان.

- **[spec6](<context/features/[spec6-explore.md](http://spec6-explore.md)>):** chipهای دسته‌بندی برای Explore.

- **[spec8](<context/features/[spec8-packing.md](http://spec8-packing.md)>):** نوار پیشرفت برنامه‌ریزی روی کارت، که حساب می‌شه و ذخیره نمی‌شه.

- **[spec11](<context/features/[spec11-ai-chat.md](http://spec11-ai-chat.md)>):** itinerary سفر به مدل داده می‌شه تا جای تکراری پیشنهاد نده، و جواب به شکل markdown مرتب نشون داده می‌شه.

- **[spec12](<context/features/[spec12-ai-trip-actions.md](http://spec12-ai-trip-actions.md)>):** chat فقط روی روزِ موجود activity ذخیره می‌کنه و هیچ‌وقت روز جدید نمی‌سازه؛ دکمه‌ی Plan with AI هم روی planهای Explore اضافه شد.

- **[spec13](<context/features/[spec13-ai-cover.md](http://spec13-ai-cover.md)>):** سفری که chat می‌سازه خودکار cover می‌گیره.

## دو نکته که باید بدونی

- **`ends_at` با یه migration جدا روی دیتابیس اعمال شد: `supabase/migrations/0003_activity_ends_at.sql`.** این جزو spec 2 هست. فایل `0002` دست نخورد، چون قبلاً روی دیتابیس واقعی اعمال شده بود و عوض کردنش با تاریخچه‌ی دیتابیس نمی‌خوند.

- **cover خودکار از همون سقف روزانه‌ی ۵ تا عکس مصرف می‌کنه.** اگه سقف پر باشه یا ساختن عکس خطا بده، سفر ساخته می‌شه و فقط placeholder می‌گیره.

## چیزهای دیگه

- **فایل‌های همراه:** [[project-overview.md](http://project-overview.md)](<context/[project-overview.md](http://project-overview.md)>)، بخش Memory توی [[AGENTS.md](http://AGENTS.md)](<[AGENTS.md](http://AGENTS.md)>) و [فایل فارسی](<docs/[video-vs-specs-explained.fa.md](http://video-vs-specs-explained.fa.md)>) هم به‌روز شدن.

- **اضافه نشد:** چیزهای اضافه‌ی Home (quick tools، Finish planning، travel tips) هنوز spec ندارن، چون اختیاری بودن.

- **commit نشده:** هیچ چیزی commit نکردم.
