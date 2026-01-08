// Print Templates for Vacation Forms

// Company watermark as base64 for printing (will be embedded)
import watermarkBase64 from '/watermark-base64.txt?raw';
const companyWatermarkBase64 = `data:image/png;base64,${watermarkBase64.trim()}`;

export const RegularVacationTemplate = (vacation, toArabicNumerals) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>طلب إجازة اعتيادي</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 0;
            size: A4;
        }

        body {
            font-family: 'Arial', 'Traditional Arabic', sans-serif;
            padding: 20px;
            direction: rtl;
            position: relative;
            min-height: 100vh;
            margin: 0;
        }

        .background-wrapper {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            z-index: -1;
            pointer-events: none;
        }

        .background-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
        }

        @media print {
            @page {
                margin: 0;
            }

            body {
                padding: 20px;
            }

            .background-wrapper {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 297mm;
                max-height: 297mm;
                z-index: -1;
            }

            .background-wrapper img {
                width: 100%;
                height: 297mm;
                max-height: 297mm;
                object-fit: cover;
                object-position: center;
            }

            .container {
                page-break-inside: avoid;
                page-break-after: always;
            }
        }

        .container {
            max-width: 900px;
            margin: 60px auto 0;
            background-color: transparent;
            padding: 20px 40px;
            position: relative;
            z-index: 1;
        }

        .header {
            text-align: center;
            margin-bottom: 15px;
        }

        .header h1 {
            background: linear-gradient(135deg, #87CEEB 0%, #5AB9D8 100%);
            color: #000;
            padding: 8px 40px;
            border-radius: 12px;
            display: inline-block;
            font-size: 22px;
            font-weight: bold;
            border: 2px solid #5AB9D8;
        }

        .form-section {
            margin-bottom: 20px;
            font-size: 16px;
            line-height: 1.8;
        }

        .info-line {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 10px;
            gap: 20px;
        }

        .info-item {
            flex: 1;
            display: flex;
            align-items: baseline;
            gap: 5px;
        }

        .info-item label {
            font-weight: bold;
            white-space: nowrap;
        }

        .info-item .value {
            flex: 1;
            min-width: 150px;
            text-align: center;
            color: #0066cc;
            font-weight: bold;
            padding-bottom: 2px;
        }

        .date-line {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-weight: bold;
        }

        .date-value {
            color: #0066cc;
        }

        .signature-center {
            text-align: left;
            margin: 15px 0;
            font-weight: bold;
        }

        .signature-center > div {
            text-align: center;
            display: inline-block;
        }

        .bracket {
            display: inline-block;
            min-width: 250px;
            border-bottom: 2px dotted #000;
            margin: 5px 0;
        }

        .align-right {
            text-align: right;
            margin: 10px 0;
            font-weight: bold;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }

        table, th, td {
            border: 2px solid #000;
        }

        th, td {
            padding: 8px 6px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
        }

        th {
            background-color: #fff;
        }

        .decision-section {
            margin-top: 8px;
            text-align: center;
        }

        .decision-section h3 {
            text-decoration: underline;
            margin-bottom: 6px;
            font-size: 18px;
        }

        .decision-text {
            line-height: 1.2;
            margin-bottom: 10px;
            font-size: 14px;
            white-space: nowrap;
            overflow: visible;
        }

        .final-signatures {
            display: flex;
            justify-content: space-around;
            margin-top: 10px;
            margin-bottom: 20px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="background-wrapper">
        <img src="${companyWatermarkBase64}" alt="">
    </div>
    <div class="container">
        <div class="header">
            <h1>طلب إجازة اعتيادي</h1>
        </div>

        <div class="form-section">
            <div class="info-line">
                <div class="info-item">
                    <label>الاسم:</label>
                    <span class="value">${vacation.employeeName}</span>
                </div>
                <div class="info-item">
                    <label>الوظيفة:</label>
                    <span class="value">${vacation.position}</span>
                </div>
            </div>

            <div class="info-line">
                <div class="info-item">
                    <label>جهة العمل:</label>
                    <span class="value">${vacation.department}</span>
                </div>
                <div class="info-item">
                    <label>مدة الإجازة المطلوبة:</label>
                    <span class="value">${toArabicNumerals(vacation.days)} يوم</span>
                </div>
            </div>

            <div class="date-line">
                <span>اعتباراً من <span class="date-value">${toArabicNumerals(vacation.startDate)}</span></span>
                <span>إلى <span class="date-value">${toArabicNumerals(vacation.endDate)}</span></span>
            </div>

            <div class="signature-center">
                <div>
                    <div>توقيع طالب الإجازة</div>
                    <div>(<span class="bracket"></span>)</div>
                </div>
            </div>

            <div class="align-right">
                تحريراً في <span class="date-value">${toArabicNumerals(vacation.requestDate)}</span>
            </div>

            <div class="align-right">
                <div>أتعهد أنا / <span class="date-value">${vacation.coveringEmployee || '............................'}</span> بالقيام بالعمل أثناء الإجازة</div>
            </div>
            
            <div class="signature-center">
                <div>
                    <div>التوقيع</div>
                    <div>(<span class="bracket"></span>)</div>
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>الإجازة المستحقة<br>للعام الحالي</th>
                    <th>الإجازة السابق منحها خلال<br>العام الحالي</th>
                    <th>مدة الإجازة المطلوبة</th>
                    <th>الرصيد المتبقي خلال<br>السنة</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="height: 60px;"></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            </tbody>
        </table>

        <div class="signature-center">
            <div>
                <div>توقيع موظف الإجازات على صحة الرصيد</div>
                <div>(<span class="bracket"></span>)</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 50%;">رأي الرئيس المباشر</th>
                    <th style="width: 50%;">اعتماد الإجازة</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="height: 50px;"></td>
                    <td></td>
                </tr>
            </tbody>
        </table>

        <div class="decision-section">
            <h3>إقرار القيام</h3>
            <p class="decision-text">أقر إنني  أعمالي المصلحية حتى يوم <span class="date-value">${toArabicNumerals(vacation.requestDate)}</span> وهو أخر أيام العمل الرسمية لابتداء الإجازة الاعتيادية المرخص لي بها وبيانها بعالية ....</p>

            <div class="final-signatures">
                <div>توقيع الموظف</div>
                <div>اعتماد الرئيس</div>
            </div>
        </div>
    </div>
</body>
</html>
`;

export const CasualVacationTemplate = (vacation, toArabicNumerals) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>طلب إجازة عارضة</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 0;
            size: A4;
        }

        body {
            font-family: 'Arial', 'Traditional Arabic', sans-serif;
            padding: 5px;
            direction: rtl;
            position: relative;
            min-height: 100vh;
            margin: 0;
        }

        .background-wrapper {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            z-index: -1;
            pointer-events: none;
        }

        .background-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
        }

        @media print {
            @page {
                margin: 0;
            }

            body {
                padding: 5px;
            }

            .background-wrapper {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 297mm;
                max-height: 297mm;
                z-index: -1;
            }

            .background-wrapper img {
                width: 100%;
                height: 297mm;
                max-height: 297mm;
                object-fit: cover;
                object-position: center;
            }

            .container {
                page-break-inside: avoid;
                page-break-after: always;
            }
        }

        .container {
            max-width: 900px;
            margin: 60px auto 0;
            background-color: transparent;arent;
            padding: 15px 25px;
            position: relative;
            z-index: 1;
        }

        .header {
            text-align: center;
            margin-bottom: 55px;
        }

        .header h1 {
            background: linear-gradient(135deg, #87CEEB 0%, #5AB9D8 100%);
            color: #000;
            padding: 8px 40px;
            border-radius: 12px;
            display: inline-block;
            font-size: 22px;
            font-weight: bold;
            border: 2px solid #5AB9D8;
        }

        .form-section {
            margin-bottom: 20px;
            font-size: 16px;
            line-height: 1.8;
        }

        .info-line {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 10px;
            gap: 100px;
        }

        .info-item {
            flex: 1;
            display: flex;
            align-items: baseline;
            gap: 10px;
        }

        .info-item label {
            font-weight: bold;
            white-space: nowrap;
        }

        .info-item .value {
            flex: 1;
            text-align: center;
            color: #0066cc;
            font-weight: bold;
            padding-bottom: 2px;
        }

        .date-line {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
            font-weight: bold;
        }

        .date-value {
            color: #0066cc;
        }

        .signature-center {
            text-align: left;
            margin: 12px 0;
            font-weight: bold;
        }

        .signature-center > div {
            text-align: center;
            display: inline-block;
        }

        .align-right {
            text-align: right;
            margin: 12px 0;
            font-weight: bold;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }

        table, th, td {
            border: 2px solid #000;
        }

        th, td {
            padding: 8px 6px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
        }

        th {
            background-color: #fff;
        }

        .approval-section {
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="background-wrapper">
        <img src="${companyWatermarkBase64}" alt="">
    </div>
    <div class="container">
        <div class="header">
            <h1>طلب إجازة عارضة</h1>
        </div>

        <div class="form-section">
            <div class="info-line">
                <div class="info-item">
                    <label>الاسم:</label>
                    <span class="value">${vacation.employeeName}</span>
                </div>
                <div class="info-item">
                    <label>الوظيفة:</label>
                    <span class="value">${vacation.position}</span>
                </div>
            </div>

            <div class="info-line">
                <div class="info-item">
                    <label>جهة العمل:</label>
                    <span class="value">${vacation.department}</span>
                </div>
                <div class="info-item">
                    <label>مدة الإجازة المطلوبة:</label>
                    <span class="value">${toArabicNumerals(vacation.days)} يوم</span>
                </div>
            </div>

            <div class="date-line">
                <span>اعتباراً من <span class="date-value">${toArabicNumerals(vacation.startDate)}</span></span>
                <span>إلى <span class="date-value">${toArabicNumerals(vacation.endDate)}</span></span>
            </div>

            <div class="signature-center">
                <div>
                    <div>توقيع طالب الإجازة</div>
                    <div>( ........................................ )</div>
                </div>
            </div>

            <div class="align-right">
                تحريراً في <span class="date-value">${toArabicNumerals(vacation.requestDate)}</span>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>الإجازة المستحقة<br>للعام الحالي</th>
                    <th>الإجازة السابق منحها خلال<br>العام الحالي</th>
                    <th>مدة الإجازة المطلوبة</th>
                    <th>الرصيد المتبقي خلال<br>السنة</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="height: 60px;"></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            </tbody>
        </table>

        <div class="signature-center">
            <div>
                <div>توقيع موظف الإجازات على صحة الرصيد</div>
                <div>( ........................................ )</div>
            </div>
        </div>

        <div class="approval-section">
            <table>
                <thead>
                    <tr>
                        <th style="width: 50%;">رأي الرئيس المباشر</th>
                        <th style="width: 50%;">اعتماد الإجازة</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="height: 50px;"></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
`;

// قالب سجل الإجازات - صفحة منفصلة (بدون علامة مائية)
export const VacationHistoryTemplate = (vacation, toArabicNumerals, employeeVacations = [], isFirstPage = false) => {
  // حساب الإحصائيات التفصيلية
  const regularVacations = employeeVacations.filter(v => v.vacationType === 'اعتيادي');
  const casualVacations = employeeVacations.filter(v => v.vacationType === 'عارضة');
  const sickVacations = employeeVacations.filter(v => v.vacationType === 'مرضية');
  const missionVacations = employeeVacations.filter(v => v.vacationType === 'مأمورية');
  const permissionVacations = employeeVacations.filter(v => v.vacationType === 'إذن');
  
  const regularDays = regularVacations.reduce((sum, v) => sum + v.days, 0);
  const casualDays = casualVacations.reduce((sum, v) => sum + v.days, 0);
  const sickDays = sickVacations.reduce((sum, v) => sum + v.days, 0);
  const missionDays = missionVacations.reduce((sum, v) => sum + v.days, 0);
  const permissionCount = permissionVacations.length;
  
  // دالة للتحقق من حالة الإجازة
  const getVacationStatus = (vac) => {
    // إذا كانت هناك حالة يدوية محددة، استخدمها
    if (vac.vacationStatus && vac.vacationStatus.trim() !== '') {
      return vac.vacationStatus;
    }
    
    // وإلا احسبها تلقائياً حسب التاريخ
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(vac.startDate);
    const end = new Date(vac.endDate);
    
    // نصوص مختلفة حسب نوع الإجازة
    const isMission = vac.vacationType === 'مأمورية';
    const isSick = vac.vacationType === 'مرضية';
    const isPermission = vac.vacationType === 'إذن';
    
    const completedText = isMission ? 'تمت المأمورية' : 
                         isSick ? 'تمت الإجازة المرضية' : 
                         isPermission ? 'تم الحضور' : 
                         'تمت الإجازة';
    
    const ongoingText = isMission ? 'مستمرة المأمورية' : 
                       isSick ? 'مستمرة الإجازة المرضية' : 
                       isPermission ? 'جاري الإذن' : 
                       'مستمرة الإجازة';
    
    const notStartedText = isMission ? 'لم تبدأ المأمورية' : 
                          isSick ? 'لم تبدأ الإجازة المرضية' : 
                          isPermission ? 'لم يتم الحضور' : 
                          'لم تبدأ';
    
    if (end < today) {
      return completedText;
    } else if (start <= today && end >= today) {
      return ongoingText;
    } else {
      return notStartedText;
    }
  };
  
  // توليد رقم سجل فريد لكل إجازة
  const generateRecordNumber = (vac, index) => {
    const year = new Date(vac.requestDate).getFullYear();
    return `${year}-${String(index + 1).padStart(4, '0')}`;
  };

  return `
${!isFirstPage ? '<div style="page-break-before: always;"></div>' : ''}
<style>
    .vacation-history-page {
        font-family: 'Arial', 'Traditional Arabic', sans-serif;
        padding: 30px;
        direction: rtl;
        background: white;
    }

    .history-header {
        text-align: center;
        margin-bottom: 25px;
    }

    .history-header h1 {
        background: linear-gradient(135deg, #87CEEB 0%, #5AB9D8 100%);
        color: #000;
        padding: 10px 40px;
        border-radius: 10px;
        display: inline-block;
        font-size: 24px;
        font-weight: bold;
        border: 2px solid #5AB9D8;
    }

    .info-balance-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 20px;
    }

    .history-employee-info {
        padding: 12px;
        background: #f0f8ff;
        border-radius: 8px;
        border: 2px solid #5AB9D8;
    }

    .history-employee-info h3 {
        margin-bottom: 10px;
        color: #000;
        font-size: 16px;
        border-bottom: 2px solid #5AB9D8;
        padding-bottom: 5px;
    }

    .info-row {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
        font-size: 14px;
    }

    .info-label {
        font-weight: bold;
    }

    .info-value {
        color: #0066cc;
        font-weight: bold;
    }

    .balance-section {
        padding: 12px;
        background: linear-gradient(135deg, #87CEEB 0%, #5AB9D8 100%);
        border-radius: 8px;
        border: 2px solid #5AB9D8;
    }

    .balance-section h3 {
        margin-bottom: 10px;
        color: #000;
        font-size: 16px;
        border-bottom: 2px solid #fff;
        padding-bottom: 5px;
    }

    .balance-row {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
        font-size: 14px;
        color: #000;
        font-weight: bold;
    }

    .history-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        background: white;
        font-size: 12px;
    }

    .history-table, .history-table th, .history-table td {
        border: 2px solid #000;
    }

    .history-table th, .history-table td {
        padding: 6px 4px;
        text-align: center;
        font-weight: bold;
    }

    .history-table th {
        background: linear-gradient(135deg, #87CEEB 0%, #5AB9D8 100%);
        color: #000;
        font-size: 12px;
    }

    .history-table tbody tr:nth-child(even) {
        background-color: #f0f8ff;
    }

    .status-active {
        color: #10b981;
        font-weight: bold;
    }

    .status-ended {
        color: #6b7280;
        font-weight: bold;
    }

    .status-partial {
        color: #f59e0b;
        font-weight: bold;
    }

    .status-pending {
        color: #3b82f6;
        font-weight: bold;
    }

    .history-stats-section {
        margin-top: 20px;
        padding: 15px;
        background: linear-gradient(135deg, #87CEEB 0%, #5AB9D8 100%);
        border-radius: 10px;
        border: 2px solid #5AB9D8;
    }

    .history-stats-title {
        text-align: center;
        font-weight: bold;
        font-size: 18px;
        margin-bottom: 12px;
        color: #000;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
    }

    .stat-card {
        text-align: center;
        background: rgba(255, 255, 255, 0.3);
        padding: 10px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.5);
    }

    .stat-type {
        font-size: 12px;
        margin-bottom: 5px;
        color: #000;
        font-weight: bold;
    }

    .stat-numbers {
        display: flex;
        justify-content: space-around;
        margin-top: 5px;
    }

    .stat-item {
        text-align: center;
    }

    .stat-label {
        font-size: 10px;
        color: #000;
    }

    .stat-value {
        font-size: 18px;
        font-weight: bold;
        color: #000;
    }

    .history-no-data {
        text-align: center;
        padding: 60px 20px;
        color: #666;
        font-size: 18px;
        font-weight: bold;
    }
</style>

<div class="vacation-history-page">
    <div class="history-header">
        <h1>سجل الإجازات التفصيلي</h1>
    </div>

    <div class="info-balance-section">
        <div class="history-employee-info">
            <h3>بيانات الموظف</h3>
            <div class="info-row">
                <span class="info-label">الاسم:</span>
                <span class="info-value">${vacation.employeeName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">الوظيفة:</span>
                <span class="info-value">${vacation.position}</span>
            </div>
            <div class="info-row">
                <span class="info-label">جهة العمل:</span>
                <span class="info-value">${vacation.department}</span>
            </div>
        </div>

        <div class="balance-section">
            <h3>الرصيد الحالي</h3>
            <div class="balance-row">
                <span>إجازة اعتيادية:</span>
                <span>${toArabicNumerals(vacation.regularVacation || 0)} يوم</span>
            </div>
            <div class="balance-row">
                <span>إجازة عارضة:</span>
                <span>${toArabicNumerals(vacation.casualVacation || 0)} يوم</span>
            </div>
            <div class="balance-row">
                <span>إجازة مرضية:</span>
                <span>${toArabicNumerals(vacation.sickVacation || 0)} يوم</span>
            </div>
            <div class="balance-row">
                <span>مأمورية:</span>
                <span>${toArabicNumerals(vacation.missionVacation || 0)} يوم</span>
            </div>
            <div class="balance-row">
                <span>إذن:</span>
                <span>${toArabicNumerals(permissionCount || 0)} طلب</span>
            </div>
        </div>
    </div>

    ${employeeVacations && employeeVacations.length > 0 ? `
    <table class="history-table">
        <thead>
            <tr>
                <th style="width: 8%;">م</th>
                <th style="width: 15%;">النوع</th>
                <th style="width: ${employeeVacations.some(v => v.vacationType !== 'إذن') ? '12%' : '0%'}; ${employeeVacations.some(v => v.vacationType !== 'إذن') ? '' : 'display: none;'}">من</th>
                <th style="width: ${employeeVacations.some(v => v.vacationType !== 'إذن') ? '12%' : '0%'}; ${employeeVacations.some(v => v.vacationType !== 'إذن') ? '' : 'display: none;'}">إلى</th>
                <th style="width: 15%;">اليوم</th>
                <th style="width: 15%;">المدة</th>
                <th style="width: 15%;">الحالة</th>
                <th style="width: 20%;">السبب</th>
                <th style="width: ${employeeVacations.some(v => v.vacationType !== 'إذن') ? '8%' : '0%'}; ${employeeVacations.some(v => v.vacationType !== 'إذن') ? '' : 'display: none;'}">مرفق</th>
                <th style="width: ${employeeVacations.some(v => v.vacationType !== 'إذن') ? '12%' : '0%'}; ${employeeVacations.some(v => v.vacationType !== 'إذن') ? '' : 'display: none;'}">تاريخ التقديم</th>
            </tr>
        </thead>
        <tbody>
            ${employeeVacations.map((vac, index) => {
              const status = getVacationStatus(vac);
              const statusClass = (status === 'مستمرة الإجازة' || status === 'مستمرة المأمورية' || status === 'جاري الإذن') ? 'status-active' : 
                                 (status === 'تمت الإجازة' || status === 'تمت المأمورية' || status === 'تم الإذن') ? 'status-ended' : 
                                 status === 'تمت جزء من الإجازة' ? 'status-partial' : 'status-pending';
              
              // عرض تاريخ الانتهاء الفعلي إذا كانت الإجازة جزئية
              const endDateDisplay = (status === 'تمت جزء من الإجازة' && vac.actualEndDate) 
                ? `${toArabicNumerals(vac.actualEndDate)} (فعلي)`
                : toArabicNumerals(vac.endDate);
              
              const isPermission = vac.vacationType === 'إذن';
              const hideForPermission = isPermission ? 'display: none;' : '';
              
              // دالة لتحويل التاريخ إلى اسم اليوم بالعربية
              const getDayName = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                return days[date.getDay()];
              };
              
              const dayWithDate = isPermission 
                ? `${getDayName(vac.permissionDate || vac.startDate)} ${toArabicNumerals(vac.permissionDate || vac.startDate)}`
                : toArabicNumerals(vac.days);
              
              return `
            <tr>
                <td>${toArabicNumerals(index + 1)}</td>
                <td>${vac.vacationType}</td>
                <td style="${hideForPermission}">${toArabicNumerals(vac.startDate)}</td>
                <td style="${hideForPermission}">${endDateDisplay}</td>
                <td>${dayWithDate}</td>
                <td>${isPermission && vac.duration ? vac.duration : (isPermission ? '-' : '-')}</td>
                <td class="${statusClass}">${status}</td>
                <td>${vac.reason || '-'}</td>
                <td style="${hideForPermission}">${vac.attachmentBase64 ? '✓' : '-'}</td>
                <td style="${hideForPermission}">${toArabicNumerals(vac.requestDate)}</td>
            </tr>
            `;
            }).join('')}
        </tbody>
    </table>
    
    <div class="history-stats-section">
        <div class="history-stats-title">الإحصائيات التفصيلية</div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-type">اعتيادي</div>
                <div class="stat-numbers">
                    <div class="stat-item">
                        <div class="stat-label">عدد</div>
                        <div class="stat-value">${toArabicNumerals(regularVacations.length)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">أيام</div>
                        <div class="stat-value">${toArabicNumerals(regularDays)}</div>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-type">عارضة</div>
                <div class="stat-numbers">
                    <div class="stat-item">
                        <div class="stat-label">عدد</div>
                        <div class="stat-value">${toArabicNumerals(casualVacations.length)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">أيام</div>
                        <div class="stat-value">${toArabicNumerals(casualDays)}</div>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-type">مرضية</div>
                <div class="stat-numbers">
                    <div class="stat-item">
                        <div class="stat-label">عدد</div>
                        <div class="stat-value">${toArabicNumerals(sickVacations.length)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">أيام</div>
                        <div class="stat-value">${toArabicNumerals(sickDays)}</div>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-type">مأمورية</div>
                <div class="stat-numbers">
                    <div class="stat-item">
                        <div class="stat-label">عدد</div>
                        <div class="stat-value">${toArabicNumerals(missionVacations.length)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">أيام</div>
                        <div class="stat-value">${toArabicNumerals(missionDays)}</div>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-type">إذن</div>
                <div class="stat-numbers">
                    <div class="stat-item">
                        <div class="stat-label">عدد</div>
                        <div class="stat-value">${toArabicNumerals(permissionVacations.length)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">طلبات</div>
                        <div class="stat-value">${toArabicNumerals(permissionCount)}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    ` : `
    <div class="history-no-data">
        <p>لا توجد إجازات سابقة مسجلة</p>
    </div>
    `}
</div>
`;
};

// قالب طلب إذن
export const PermissionTemplate = (vacation, toArabicNumerals) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>طلب إذن</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 0;
            size: A4;
        }

        body {
            font-family: 'Arial', 'Traditional Arabic', sans-serif;
            padding: 20px;
            direction: rtl;
            position: relative;
            min-height: 100vh;
            margin: 0;
        }

        .background-wrapper {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            z-index: -1;
            pointer-events: none;
        }

        .background-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
        }

        @media print {
            @page {
                margin: 0;
            }

            body {
                padding: 20px;
            }

            .background-wrapper {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 297mm;
                max-height: 297mm;
                z-index: -1;
            }

            .background-wrapper img {
                width: 100%;
                height: 297mm;
                max-height: 297mm;
                object-fit: cover;
                object-position: center;
            }

            .container {
                page-break-inside: avoid;
                page-break-after: always;
            }
        }

        .container {
            max-width: 900px;
            margin: 60px auto 0;
            background-color: transparent;
            padding: 20px 40px;
            position: relative;
            z-index: 1;
        }

        .header {
            text-align: center;
            margin-bottom: 15px;
        }

        .header h1 {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            font-size: 26px;
            margin-bottom: 8px;
            box-shadow: 0 4px 6px rgba(139, 92, 246, 0.2);
        }

        .header p {
            color: #666;
            font-size: 14px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 25px;
        }

        .info-card {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            padding: 15px 20px;
            border-radius: 8px;
            border: 2px solid #8b5cf6;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .info-card label {
            display: block;
            color: #8b5cf6;
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 8px;
        }

        .info-card span {
            display: block;
            color: #333;
            font-size: 16px;
            font-weight: bold;
        }

        .time-section {
            background: linear-gradient(135deg, #f0e7ff 0%, #e9d8fd 100%);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            border: 2px solid #8b5cf6;
        }

        .time-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 15px;
        }

        .time-item {
            text-align: center;
            background: white;
            padding: 12px;
            border-radius: 8px;
        }

        .time-item label {
            display: block;
            color: #8b5cf6;
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 8px;
        }

        .time-item span {
            display: block;
            color: #333;
            font-size: 18px;
            font-weight: bold;
        }

        .reason-section {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 25px;
            border: 2px solid #8b5cf6;
        }

        .reason-section label {
            display: block;
            color: #8b5cf6;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 12px;
        }

        .reason-section p {
            color: #333;
            font-size: 15px;
            line-height: 1.8;
            min-height: 80px;
        }

        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
        }

        .signature-box {
            text-align: center;
            width: 45%;
        }

        .signature-box p {
            font-weight: bold;
            color: #333;
            margin-bottom: 60px;
        }

        .signature-line {
            border-top: 2px solid #333;
            margin-top: 10px;
            padding-top: 8px;
        }

        .signature-line span {
            color: #666;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="background-wrapper">
        <img src="${companyWatermarkBase64}" alt="Watermark">
    </div>

    <div class="container">
        <div class="header">
            <h1>📋 طلب إذن</h1>
            <p>نموذج طلب إذن لساعات محددة</p>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <label>اسم الموظف</label>
                <span>${vacation.employeeName || ''}</span>
            </div>
            <div class="info-card">
                <label>الوظيفة</label>
                <span>${vacation.position || ''}</span>
            </div>
            <div class="info-card">
                <label>القسم</label>
                <span>${vacation.department || ''}</span>
            </div>
            <div class="info-card">
                <label>تاريخ الإذن</label>
                <span>${toArabicNumerals(vacation.permissionDate || vacation.startDate || '')}</span>
            </div>
        </div>

        <div class="time-section">
            <h3 style="color: #8b5cf6; margin-bottom: 10px;">⏰ توقيت الإذن</h3>
            <div class="time-grid">
                <div class="time-item">
                    <label>من الساعة</label>
                    <span>${vacation.startTime || 'غير محدد'}</span>
                </div>
                <div class="time-item">
                    <label>إلى الساعة</label>
                    <span>${vacation.endTime || 'غير محدد'}</span>
                </div>
                <div class="time-item">
                    <label>المدة</label>
                    <span>${vacation.duration || 'غير محدد'}</span>
                </div>
            </div>
        </div>

        <div class="reason-section">
            <label>سبب طلب الإذن</label>
            <p>${vacation.reason || 'لا يوجد سبب محدد'}</p>
        </div>

        <div class="signatures">
            <div class="signature-box">
                <p>توقيع الموظف</p>
                <div class="signature-line">
                    <span>التاريخ: ${toArabicNumerals(vacation.requestDate || '')}</span>
                </div>
            </div>
            <div class="signature-box">
                <p>اعتماد الإدارة</p>
                <div class="signature-line">
                    <span>التاريخ: _______________</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;

// قالب صفحة الصورة المرفقة - صفحة ثانية (بدون معلومات)
export const AttachmentPageTemplate = (vacation, toArabicNumerals) => {
  if (!vacation.attachmentBase64) return '';
  
  return `
<div style="page-break-before: always; page-break-after: avoid;"></div>
<style>
    @media print {
        @page {
            margin: 0;
        }
        
        body {
            margin: 0;
            padding: 0;
        }
    }

    .attachment-page {
        font-family: 'Arial', 'Traditional Arabic', sans-serif;
        padding: 20px;
        direction: rtl;
        background: white;
        display: flex;
        justify-content: center;
        align-items: center;
        page-break-after: avoid;
    }

    .attachment-image {
        max-width: 100%;
        max-height: 90vh;
        width: auto;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        page-break-inside: avoid;
    }

    @media print {
        .attachment-page {
            padding: 15mm;
            height: auto;
        }
        
        .attachment-image {
            max-height: 260mm;
        }
    }
</style>

<div class="attachment-page">
    <img src="${vacation.attachmentBase64}" alt="مرفق الإجازة" class="attachment-image" />
</div>
`;
};
