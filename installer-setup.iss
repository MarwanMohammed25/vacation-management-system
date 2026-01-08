; ================================================================
; Inno Setup Script for Vacation Management System
; التعمير لإدارة المرافق - نظام إدارة الإجازات
; Version 2.0.2
; Last Updated: January 2026
; ================================================================
;
; ميزات الإصدار 2.0.2:
; - نظام الأذونات الكامل مع تتبع الوقت
; - الإجازات المرضية تُحتسب من الرصيد (30 يوم)
; - قائمة موظفين محسّنة مع عرض جميع أنواع الإجازات
; - فلترة منفصلة لكل نوع (إجازات، مأموريات، مرضية، أذونات)
; - ترتيب تصاعدي للسجلات
; - نصوص حالة مخصصة لكل نوع
; - إجبارية المرفق للإجازات المرضية
; - تحسينات شاملة في الواجهة والأداء
; ================================================================
;
; ملاحظات:
; - يدعم التطبيق التحديث التلقائي عبر GitHub Releases
; - يتم فحص التحديثات عند بدء التشغيل
; - يمكن الفحص يدوياً من قائمة "مساعدة" ← "فحص التحديثات"
; ================================================================

#define MyAppName "Tameer Vacation Management"
#define MyAppNameAR "التعمير - إدارة الإجازات"
#define MyAppVersion "2.0.2"
#define MyAppPublisher "IT-M"
#define MyAppPublisherAR "IT-M"
#define MyAppURL "https://www.tameer.com"
#define MyAppExeName "التعمير - إدارة الإجازات.exe"
#define MyAppId "{{A7B3C8D9-E1F2-4A5B-9C8D-7E6F5A4B3C2D}}"
#define SourcePath "C:\Users\Marwan Mohamet\OneDrive\Desktop\klasörler\Şirket web sitesi ve yazılım klasörü\vacation-management-system"

[Setup]
; ================================================================
; معلومات التطبيق الأساسية
; ================================================================
AppId={#MyAppId}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
AppCopyright=Copyright (C) 2025-2026 {#MyAppPublisher}

; ================================================================
; إعدادات المجلدات
; ================================================================
DefaultDirName={autopf}\Tameer\Vacation Management
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes

; ================================================================
; الملفات المخرجة
; ================================================================
OutputDir={#SourcePath}\release
OutputBaseFilename=Vacation-Management-Setup-{#MyAppVersion}
; SetupIconFile=favicon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}

; ================================================================
; إعدادات الضغط
; ================================================================
Compression=lzma2/ultra64
SolidCompression=no
LZMAUseSeparateProcess=yes
LZMADictionarySize=1048576
LZMANumFastBytes=273

; ================================================================
; إعدادات واجهة المستخدم
; ================================================================
WizardStyle=modern
WizardSizePercent=100,100
DisableWelcomePage=no
ShowLanguageDialog=no
LanguageDetectionMethod=none

; ================================================================
; إعدادات الصلاحيات
; ================================================================
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog

; ================================================================
; إعدادات إضافية
; ================================================================
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
AllowNoIcons=yes
AlwaysShowDirOnReadyPage=yes
AlwaysShowGroupOnReadyPage=yes
DisableDirPage=no
DisableReadyPage=no
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} Setup
VersionInfoTextVersion={#MyAppVersion}
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}

[Languages]
Name: "arabic"; MessagesFile: "compiler:Languages\Arabic.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "quicklaunchicon"; Description: "إنشاء أيقونة في شريط المهام"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; ================================================================
; الملف التنفيذي الرئيسي
; ================================================================
Source: "{#SourcePath}\release\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

; ================================================================
; ملفات إضافية
; ================================================================
Source: "{#SourcePath}\LICENSE.txt"; DestDir: "{app}"; DestName: "LICENSE-TAMEER.txt"; Flags: ignoreversion
Source: "{#SourcePath}\README.md"; DestDir: "{app}"; Flags: ignoreversion isreadme
Source: "{#SourcePath}\QUICK_START.md"; DestDir: "{app}"; Flags: ignoreversion

; ================================================================
; ملفات الشعارات (Base64) والمرفقات
; ================================================================
Source: "{#SourcePath}\public\login-logo-base64.txt"; DestDir: "{app}\resources"; Flags: ignoreversion
Source: "{#SourcePath}\public\watermark-base64.txt"; DestDir: "{app}\resources"; Flags: ignoreversion

; ================================================================
; ملف البيئة (.env) - نسخة Production
; ================================================================
Source: "{#SourcePath}\.env"; DestDir: "{app}"; DestName: ".env.production"; Flags: ignoreversion

; ================================================================
; ملف إعدادات Firebase والأمان
; ================================================================
Source: "{#SourcePath}\database.rules.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourcePath}\FIREBASE_SECURITY.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourcePath}\UPDATES.md"; DestDir: "{app}"; Flags: ignoreversion

; ================================================================
; الأيقونة (اختياري)
; ================================================================
; Source: "favicon.ico"; DestDir: "{app}"; DestName: "app-icon.ico"; Flags: ignoreversion

[Icons]
; ================================================================
; اختصارات قائمة Start
; ================================================================
Name: "{group}\{#MyAppNameAR}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\دليل الاستخدام"; Filename: "{app}\README.md"
Name: "{group}\سجل التحديثات"; Filename: "{app}\UPDATES.md"
Name: "{group}\البدء السريع"; Filename: "{app}\QUICK_START.md"
Name: "{group}\إزالة البرنامج"; Filename: "{uninstallexe}"

; ================================================================
; اختصار سطح المكتب
; ================================================================
Name: "{autodesktop}\{#MyAppNameAR}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

; ================================================================
; اختصار شريط المهام
; ================================================================
Name: "{commonstartup}\{#MyAppNameAR}"; Filename: "{app}\{#MyAppExeName}"; Tasks: quicklaunchicon

[Run]
; ================================================================
; تشغيل بعد التثبيت
; ================================================================
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; ================================================================
; حذف الملفات المؤقتة عند الإزالة
; ================================================================
Type: filesandordirs; Name: "{app}\*"
Type: dirifempty; Name: "{app}"

[Code]
function InitializeSetup(): Boolean;
var
  OldVersion: String;
  ResultCode: Integer;
begin
  Result := True;
  if RegQueryStringValue(HKEY_LOCAL_MACHINE,
    'Software\Microsoft\Windows\CurrentVersion\Uninstall\{#MyAppId}_is1',
    'DisplayVersion', OldVersion) then
  begin
    if MsgBox('تم اكتشاف إصدار سابق (' + OldVersion + ')' + #13#10 +
              'يُنصح بإزالة الإصدار القديم قبل تثبيت الإصدار الجديد (' + '{#MyAppVersion}' + ')' + #13#10#13#10 +
              'هل تريد إزالة الإصدار السابق الآن؟',
              mbConfirmation, MB_YESNO) = IDYES then
    begin
      if RegQueryStringValue(HKEY_LOCAL_MACHINE,
        'Software\Microsoft\Windows\CurrentVersion\Uninstall\{#MyAppId}_is1',
        'UninstallString', OldVersion) then
      begin
        OldVersion := RemoveQuotes(OldVersion);
        Exec(OldVersion, '/SILENT', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      end;
    end;
  end;
end;

[Messages]
; ================================================================
; رسائل مخصصة بالعربية
; ================================================================
WelcomeLabel1=مرحباً بك في معالج تثبيت
WelcomeLabel2={#MyAppName}
ClickNext=انقر التالي للمتابعة، أو إلغاء للخروج من التثبيت.
SelectDirLabel3=سيقوم المعالج بتثبيت [name] في المجلد التالي.
SelectDirBrowseLabel=للمتابعة، انقر التالي. إذا كنت تريد اختيار مجلد مختلف، انقر استعراض.
DiskSpaceMBLabel=يتطلب التثبيت على الأقل [mb] ميجابايت من المساحة الحرة.
StatusExtractFiles=جاري استخراج الملفات...
StatusCreateIcons=جاري إنشاء الاختصارات...
StatusRunProgram=جاري إنهاء التثبيت...
StatusSavingUninstall=جاري حفظ معلومات الإزالة...
StatusRollback=جاري التراجع عن التغييرات...
FinishedHeadingLabel=إتمام معالج تثبيت [name]
FinishedLabelNoIcons=تم تثبيت [name] على جهاز الكمبيوتر بنجاح.
FinishedLabel=تم تثبيت [name] على جهاز الكمبيوتر بنجاح. يمكن تشغيل التطبيق باختيار الأيقونات المثبتة.
ClickFinish=انقر إنهاء للخروج من المعالج.
SetupWindowTitle=تثبيت - {#MyAppName}
ButtonInstall=&تثبيت
ButtonNext=&التالي >
ButtonBack=< &السابق
ButtonCancel=إ&لغاء
ButtonYes=&نعم
ButtonNo=&لا
ButtonFinish=إن&هاء
ButtonBrowse=ا&ستعراض...

[UninstallRun]
; ================================================================
; إجراءات قبل الإزالة
; ================================================================
Filename: "{cmd}"; Parameters: "/C ""taskkill /F /IM ""{#MyAppExeName}"" /T"""; Flags: runhidden; RunOnceId: "KillAppProcess"

[Registry]
; ================================================================
; مدخلات السجل
; ================================================================
Root: HKLM; Subkey: "Software\{#MyAppPublisher}\{#MyAppName}"; ValueType: string; ValueName: "Version"; ValueData: "{#MyAppVersion}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "Software\{#MyAppPublisher}\{#MyAppName}"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "Software\{#MyAppPublisher}\{#MyAppName}"; ValueType: string; ValueName: "ExecutablePath"; ValueData: "{app}\{#MyAppExeName}"; Flags: uninsdeletekey
