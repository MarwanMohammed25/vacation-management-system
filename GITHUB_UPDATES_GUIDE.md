# دليل التحديثات عبر GitHub

## الإعداد الأولي

### 1. إنشاء مستودع GitHub
```bash
# إنشاء مستودع جديد على GitHub باسم: vacation-management-system
# ثم ربط المشروع:
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/vacation-management-system.git
git push -u origin main
```

### 2. تحديث معلومات المستودع في package.json
في ملف `package.json`، غيّر:
```json
"publish": [
  {
    "provider": "github",
    "owner": "YOUR_GITHUB_USERNAME",  // ضع اسم حسابك هنا
    "repo": "vacation-management-system",
    "releaseType": "release"
  }
],
```

### 3. إنشاء GitHub Token
1. اذهب إلى: https://github.com/settings/tokens
2. اضغط "Generate new token" → "Generate new token (classic)"
3. اختر الصلاحيات:
   - ✅ `repo` (كامل)
   - ✅ `write:packages`
   - ✅ `delete:packages`
4. احفظ الـ Token

### 4. حفظ GitHub Token
في Windows PowerShell:
```powershell
# احفظ الـ Token في متغير بيئة
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'YOUR_TOKEN_HERE', 'User')
```

## نشر إصدار جديد

### 1. تحديث رقم الإصدار
في `package.json`:
```json
"version": "2.0.2"  // زود الرقم
```

### 2. بناء ونشر التطبيق
```bash
# بناء التطبيق ورفعه على GitHub
npm run electron:build:win -- --publish always
```

هذا الأمر سيقوم بـ:
- ✅ بناء التطبيق
- ✅ إنشاء ملفات التحديث (.exe, .yml, .blockmap)
- ✅ رفعها على GitHub Releases تلقائياً
- ✅ نشر الإصدار الجديد

### 3. التحقق من النشر
1. اذهب إلى: `https://github.com/YOUR_USERNAME/vacation-management-system/releases`
2. تأكد من وجود الإصدار الجديد
3. تأكد من وجود الملفات:
   - `التعمير - إدارة الإجازات-Setup-2.0.2.exe`
   - `latest.yml`
   - `التعمير - إدارة الإجازات-Setup-2.0.2.exe.blockmap`

## كيف يعمل التحديث التلقائي

### عند تشغيل التطبيق:
1. التطبيق يفحص GitHub Releases بعد 3 ثواني
2. إذا وجد إصدار أحدث، يظهر رسالة للمستخدم
3. المستخدم يختار "تنزيل" أو "لاحقاً"
4. عند التنزيل، يظهر شريط التقدم
5. بعد التنزيل، يسأل عن "إعادة التشغيل" أو "لاحقاً"
6. التحديث يُثبّت تلقائياً عند إعادة التشغيل

### فحص يدوي:
المستخدم يمكنه فحص التحديثات من القائمة:
**مساعدة → فحص التحديثات**

## ملفات التحديث المهمة

### latest.yml
يُنشأ تلقائياً ويحتوي على:
- رقم أحدث إصدار
- تاريخ النشر
- حجم الملف
- رابط التنزيل
- معلومات التحقق (checksums)

### .blockmap
ملفات التحديث التفاضلي (differential updates):
- تُحمّل فقط الأجزاء المتغيرة
- توفر bandwidth
- تسرّع التحديثات

## مثال كامل

```bash
# 1. تحديث الإصدار
# عدّل version في package.json من 2.0.1 إلى 2.0.2

# 2. Commit التغييرات
git add .
git commit -m "Release v2.0.2"
git push

# 3. بناء ونشر
npm run electron:build:win -- --publish always

# 4. انتظر اكتمال الرفع (سيظهر في Terminal)
# ✔ published التعمير - إدارة الإجازات-Setup-2.0.2.exe to GitHub Releases

# 5. تحقق من GitHub Releases
# https://github.com/YOUR_USERNAME/vacation-management-system/releases
```

## استكشاف الأخطاء

### خطأ: "GitHub token not found"
```bash
# تأكد من وجود GH_TOKEN
echo $env:GH_TOKEN  # في PowerShell
# أو أعد تعيينه
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'YOUR_TOKEN', 'User')
```

### خطأ: "Release not found"
- تأكد من وجود release على GitHub
- تأكد من أن `releaseType: "release"` وليس "draft"

### التحديث لا يعمل
1. تأكد من رفع `latest.yml` على GitHub
2. تأكد من صحة اسم المستودع في `package.json`
3. فحص console logs في التطبيق

## ملاحظات أمان

⚠️ **مهم جداً:**
- لا تشارك الـ GitHub Token مع أحد
- لا تضعه في الكود
- احفظه في environment variable فقط
- يمكنك إلغاؤه وإنشاء جديد من GitHub settings

## الأوامر المفيدة

```bash
# بناء بدون نشر (للاختبار)
npm run electron:build:win

# بناء ونشر كـ draft
npm run electron:build:win -- --publish always --draft

# بناء ونشر كـ pre-release
npm run electron:build:win -- --publish always --prerelease

# فحص إعدادات البناء
npx electron-builder --help
```

## الخطوات القادمة

✅ التطبيق جاهز للتحديثات عبر GitHub
✅ فقط غيّر `YOUR_GITHUB_USERNAME` في package.json
✅ أنشئ GitHub Token واحفظه
✅ ابدأ النشر!
