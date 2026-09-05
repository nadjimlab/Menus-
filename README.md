# CHENEB TACOS — Menu Digital & POS

تطبيق القائمة الرقمية التفاعلية، الطلبات المباشرة، ونظام نقاط البيع لمطعم **CHENEB TACOS** في حي الرمال — الوادي.

## الميزات الرئيسية

يحتوي المشروع على قائمة طعام متجاوبة، طلبات الطاولات وطلبات التوصيل، لوحة KDS للمطبخ، شاشة POS للكاشير، وطباعة وصل حراري يعرض المنتجات والأسعار والمبلغ المدفوع والباقي.

## إعداد دخول المدير والكاشير

دخول الموظفين يعتمد على جلسة موقعة في الخادم. لا توجد كلمة مرور افتراضية داخل الواجهة، ولا يجب وضع `service_role` أو `CASHIER_SERVICE_ROLE_KEY` في ملفات الواجهة أو GitHub Pages.

### 1. إعداد قاعدة بيانات الموظفين

افتح **Supabase Dashboard → SQL Editor** وشغّل الملف:

```text
supabase_staff_auth.sql
```

بعد تشغيل الجداول والدوال، ألغِ التعليق عن قسم bootstrap في نهاية الملف، واستبدل `YOUR_PRIVATE_4_DIGIT_PIN` برمز PIN خاص تختاره أنت، ثم نفّذ عملية الإدراج مرة واحدة. لا ترسل هذا الرمز في GitHub أو داخل المحادثة ولا تستخدم رمزاً عاماً مثل `1234` أو `9999`.

### 2. نشر Edge Functions

انشر الدوال التالية في مشروع Supabase:

```bash
supabase functions deploy verify-cashier-pin
supabase functions deploy staff-session
supabase functions deploy manage-staff
supabase functions deploy staff-orders
```

من إعدادات **Supabase Edge Functions Secrets**، أضف:

```text
CASHIER_SERVICE_ROLE_KEY=<مفتاح الخدمة السري لمشروع Supabase>
```

يبقى هذا المفتاح على الخادم فقط. لا تضعه في `.env.example` أو في كود React.

### 3. إعداد GitHub Pages

أضف الأسرار التالية من **GitHub → Settings → Secrets and variables → Actions**:

| اسم السر | القيمة |
|---|---|
| `VITE_SUPABASE_URL` | رابط مشروع Supabase، مثل `https://project.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | مفتاح Supabase العام publishable/anon فقط |

يقرأ ملف `.github/workflows/deploy.yml` هذه القيم أثناء البناء. إذا لم تتم إضافتها، ستظهر رسالة **إعدادات Supabase غير مكتملة** ولن يعمل دخول المدير أو الكاشير في نسخة GitHub Pages.

## النشر التلقائي على GitHub Pages

1. من صفحة المستودع على GitHub افتح **Settings → Pages**.
2. ضمن **Build and deployment** اختر **GitHub Actions**.
3. ادفع أي تغيير إلى فرع `main` أو شغّل Workflow يدوياً من تبويب **Actions**.
4. بعد اكتمال البناء، افتح الرابط الذي يعرضه GitHub Pages.

## الاختبارات المحلية

```bash
npm install
npm run lint
npm run build
npm run dev
```

للدخول إلى لوحة الإدارة محلياً افتح المسار `/admin`. يجب أن تكون قيم `VITE_SUPABASE_URL` و`VITE_SUPABASE_PUBLISHABLE_KEY` موجودة في ملف `.env.local` المحلي، بينما يجب أن يبقى مفتاح الخدمة داخل Supabase Edge Functions فقط.
