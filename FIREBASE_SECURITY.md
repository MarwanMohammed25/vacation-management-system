# خطوات تأمين Firebase

## 1. تفعيل Firebase Security Rules

انسخ محتوى ملف `database.rules.json` وضعه في:
Firebase Console → Realtime Database → Rules

**ملاحظة مهمة:** القواعد الحالية تتطلب تسجيل الدخول (Authentication)

## 2. تفعيل Firebase Authentication

1. افتح Firebase Console
2. اذهب إلى Authentication → Get Started
3. فعّل طريقة تسجيل الدخول المطلوبة:
   - Email/Password (موصى به للبداية)
   - Google Sign-In
   - أو أي طريقة أخرى

## 3. القواعد المؤقتة (للتطوير فقط)

إذا كنت لا تريد تفعيل Authentication الآن، استخدم هذه القواعد **مؤقتاً**:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

⚠️ **تحذير:** هذه القواعد غير آمنة ويجب استخدامها للتطوير فقط!

## 4. تكوين المتغيرات البيئية

1. انسخ ملف `.env.example` إلى `.env`
2. املأ البيانات من Firebase Console → Project Settings → General

## 5. التأكد من أن .env محمي

تأكد من أن `.env` موجود في `.gitignore` ولن يتم رفعه إلى Git

## 6. إعادة تشغيل السيرفر

بعد إضافة ملف `.env`:

```bash
npm run dev
```

## 7. القواعد المتقدمة (للإنتاج)

للحماية القصوى، استخدم قواعد مخصصة حسب نوع المستخدم:

```json
{
  "rules": {
    "employees": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    "vacations": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```
