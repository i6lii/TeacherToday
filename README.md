# معلّم اليوم

تجربة تفاعلية عربية لمتحف المعلّم. تحفظ المشاركات محليًا عند عدم إعداد Supabase، وتنتقل إلى قاعدة مشتركة مع تحديثات مباشرة عند ربط المشروع.

## التشغيل المحلي

```sh
npm install
npm run dev
```

من دون إعداد Supabase تُحفظ المشاركات على الجهاز نفسه في `localStorage` وتُزامن بين علامات التبويب، ولا تتم مزامنتها بين أجهزة مختلفة.

## تفعيل قاعدة البيانات الحية

1. أنشئ مشروعًا مخصصًا للفعالية في Supabase.
2. فعّل Anonymous Sign-Ins من إعدادات Authentication في المشروع.
3. شغّل `supabase/schema.sql` من SQL Editor لإنشاء الجداول وسياسات الوصول وتفعيل Realtime.
4. انسخ `.env.example` إلى `.env.local` وأدخل Project URL و`anon` key من إعدادات المشروع.
5. أعد تشغيل خادم التطوير أو أعد بناء الموقع.

تتيح السياسات قراءة أسماء المشاركين وإجاباتهم للجميع، بينما تحفظ كل مشاركة بهوية مجهولة مستقلة وتقصر تعديل الإجابة على صاحبها. لا تخزّن معلومات حساسة، ولا تضع `service_role` key في الواجهة.

## النشر على GitHub Pages

من إعدادات المستودع، افتح **Settings → Pages** واجعل **Build and deployment → Source** هو **GitHub Actions**. بعدها ينشر Workflow الموقع تلقائيًا عند كل دفع إلى `main` على `https://i6lii.github.io/TeacherToday/`.

لتفعيل Supabase على الموقع المنشور، أضف `VITE_SUPABASE_URL` و`VITE_SUPABASE_ANON_KEY` كـ Actions secrets في إعدادات المستودع.

## النشر على Render

أنشئ خدمة **Web Service** باستخدام Build Command `npm ci && npm run build` وStart Command `npm run start`. يقدّم أمر التشغيل ملفات `dist` على المنفذ الذي يحدده Render.