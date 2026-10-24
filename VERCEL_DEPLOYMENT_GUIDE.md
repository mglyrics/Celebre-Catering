# دليل النشر والتجهيز الإنتاجي لمنصة CÉLÈBRE Catering على Vercel

تم تجهيز وهيكلة المشروع بالكامل ليعمل كمنصة متكاملة Full-Stack على **Vercel** مع دعم **Prisma ORM** وقاعدة بيانات **PostgreSQL** وواجهة **React 19 / Vite** وخدمات **Serverless API**.

---

## 1. البنية التقنية المهيأة لـ Vercel
- **`vercel.json`**:
  - أمر البناء: `prisma generate && vite build`
  - مجلد الإخراج: `dist`
  - توجيه الـ API: تحويل جميع طلبات `/api/*` إلى الدالة السحابية `/api/index.ts` (Express Serverless).
  - توجيه الـ SPA: تحويل مسارات الواجهة إلى `/index.html`.
- **`api/index.ts`**: نقطة انطلاق Serverless تدير كافة مسارات الحجز والإدارة والمصنع وتوليد PDF وWebhooks.
- **`package.json`**:
  - يتضمن سكربت `postinstall` لتوليد عميل Prisma تلقائيًا فور تثبيت الاعتماديات.
  - سكربتات `db:push` و `seed` لتطبيق الجداول وتغذية بيانات الوجبات الـ18 وحسابات الإدارة.

---

## 2. متغيرات البيئة المطلوبة على Vercel (Environment Variables)

قم بإضافة المتغيرات التالية في إعدادات مشروع Vercel تحت تبويب **Settings -> Environment Variables**:

| المتغير | الوصف | مثال لقيمة افتراضية / تجريبية |
| :--- | :--- | :--- |
| `DATABASE_URL` | رابط اتصال PostgreSQL (Supabase / Neon / Vercel Postgres) | `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres` |
| `JWT_SECRET` | مفتاح تشفير جلسات الإدارة والمصنع | قيمة نصية قوية معقدة |
| `ADMIN_PASSWORD` | كلمة مرور حساب الإدارة الأولي | `Celebre@2026` |
| `APP_URL` | رابط النشر التجريبي على Vercel | سيتم تعيينه تلقائيًا بعد أول نشر Preview |
| `META_VERIFY_TOKEN` | رمز التحقق الأمني لـ Meta Webhook | `celebre_meta_verify_token_2026` |
| `META_PAGE_ACCESS_TOKEN` | (اختياري) رمز وصول صفحة Meta للإرسال الآلي | يترك فارغاً لحين توفير بيانات Meta المعتمدة |
| `META_APP_SECRET` | (اختياري) سر تطبيق Meta للتحقق من التوقيع | يترك فارغاً لحين ربط التطبيق |

> **ملاحظة الشفافية والأمان:** في حال عدم إدخال `META_PAGE_ACCESS_TOKEN`، يعمل النظام تلقائياً بوضع **STANDALONE_FALLBACK_ACTIVE** الآمن والموثوق بنسبة 100% دون فقدان أي حجز أو تعطل أي عملية.

---

## 3. خطوات النشر على رابط تجريبي (Vercel Preview)
1. **ربط المستودع بـ Vercel**:
   - من لوحة تحكم Vercel، اضغط **Add New Project** واختر المستودع.
2. **إعدادات البناء (Build Settings)**:
   - Framework Preset: `Vite`
   - Build Command: `prisma generate && vite build`
   - Output Directory: `dist`
3. **تطبيق جداول قاعدة البيانات والبيانات الأولية**:
   - بعد تزويد `DATABASE_URL`، قم بتنفيذ أمر الترحيل والتغذية الأولية:
     ```bash
     npx prisma db push
     npx tsx prisma/seed.ts
     ```
   - سيقوم الأمر بتسجيل الوجبات الـ18 بأسعار الموزع والمصنع ومكوناتها الدقيقة، وإنشاء حسابي الإدارة والمصنع.
4. **النشر والتجربة على رابط المعاينة (Preview URL)**:
   - انسخ رابط Vercel المعطى بصيغة `https://your-project-xxx.vercel.app`.

---

## 4. قائمة التحقق قبل ربط دومين `celebre-eg.com`
- [ ] تجربة تقديم حجز مبدئي من واجهة العميل والتحقق من حساب إجمالي سعر الموزع بدقة.
- [ ] تجربة تسجيل دخول الإدارة (`admin` / `Celebre@2026`) والتحقق من رؤية هوامش الربح.
- [ ] تجربة تسجيل دفعة وتأكيد الحجز ثم إصدار أمر تشغيل المصنع.
- [ ] تجربة تسجيل دخول المصنع (`factory` / `Factory@2026`) والتأكد من حجب أسعار الموزع وهوامش الربح تماماً.
- [ ] تحميل ومعاينة منيو PDF العربي من الرابط `/api/menu/pdf` والتأكد من ظهور الشعار ورقم 01284484868 وروابط التواصل.
- [ ] التأكد من استقرار كافة العمليات قبل التوجه إلى إدارة DNS وتوجيه دومين `celebre-eg.com`.
