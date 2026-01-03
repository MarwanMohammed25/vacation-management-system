import React, { useState, useEffect, useRef } from 'react';
import { database } from '../firebase';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { toArabicNumerals } from '../utils/dateUtils';
import { DEFAULT_VACATION_DAYS, MESSAGES } from '../constants';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { RegularVacationTemplate, CasualVacationTemplate, VacationHistoryTemplate, AttachmentPageTemplate } from '../templates/printTemplates';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: '',
    regularVacation: DEFAULT_VACATION_DAYS.REGULAR,
    casualVacation: DEFAULT_VACATION_DAYS.CASUAL,
  });
  const [editingId, setEditingId] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    const employeesRef = ref(database, 'employees');
    const vacationsRef = ref(database, 'vacations');
    
    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const employeesList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setEmployees(employeesList);
      } else {
        setEmployees([]);
      }
      setLoading(false);
    });

    const unsubscribeVacations = onValue(vacationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const vacationsList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setVacations(vacationsList);
      } else {
        setVacations([]);
      }
    });

    return () => {
      unsubscribeEmployees();
      unsubscribeVacations();
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('💾 Submitting form:', { formData, editingId });
    
    try {
      if (editingId) {
        console.log('🔄 Updating employee with ID:', editingId);
        const employeeRef = ref(database, `employees/${editingId}`);
        update(employeeRef, formData);
        setToast({ message: MESSAGES.SUCCESS.EMPLOYEE_UPDATED, type: 'success' });
        setEditingId(null);
      } else {
        console.log('➕ Adding new employee');
        const employeesRef = ref(database, 'employees');
        push(employeesRef, formData);
        setToast({ message: MESSAGES.SUCCESS.EMPLOYEE_ADDED, type: 'success' });
      }
      
      setFormData({
        name: '',
        position: '',
        department: '',
        regularVacation: DEFAULT_VACATION_DAYS.REGULAR,
        casualVacation: DEFAULT_VACATION_DAYS.CASUAL,
      });
    } catch (error) {
      console.error('❌ Error saving employee:', error);
      setToast({ message: MESSAGES.ERROR.GENERIC_ERROR, type: 'error' });
    }
  };

  const handleEdit = (employee) => {
    console.log('🔧 Editing employee:', employee);
    const editData = {
      name: employee.name,
      position: employee.position,
      department: employee.department,
      regularVacation: employee.regularVacation,
      casualVacation: employee.casualVacation,
    };
    console.log('📝 Setting form data to:', editData);
    setFormData(editData);
    setEditingId(employee.id);
    console.log('✅ Editing ID set to:', employee.id);
    
    // التمرير إلى الفورم
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm(MESSAGES.ERROR.DELETE_EMPLOYEE_CONFIRM)) {
      try {
        // حذف الموظف
        const employeeRef = ref(database, `employees/${id}`);
        await remove(employeeRef);
        
        // حذف جميع إجازات الموظف
        const employeeVacations = vacations.filter(v => v.employeeId === id);
        for (const vacation of employeeVacations) {
          const vacationRef = ref(database, `vacations/${vacation.id}`);
          await remove(vacationRef);
        }
        
        setToast({ message: MESSAGES.SUCCESS.EMPLOYEE_DELETED, type: 'success' });
      } catch (error) {
        console.error('Error deleting employee:', error);
        setToast({ message: MESSAGES.ERROR.GENERIC_ERROR, type: 'error' });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'regularVacation' || name === 'casualVacation' ? Number(value) : value
    }));
  };

  const getEmployeeVacations = (employeeId) => {
    return vacations.filter(v => v.employeeId === employeeId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const handleViewVacations = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleDeleteVacation = async (vacation) => {
    if (window.confirm(MESSAGES.ERROR.DELETE_VACATION_CONFIRM)) {
      try {
        // حذف الإجازة
        const vacationRef = ref(database, `vacations/${vacation.id}`);
        await remove(vacationRef);
        
        // استعادة رصيد الإجازة للموظف - فقط للاعتيادي والعارضة
        // المأمورية والمرضية لا تستخدم الأرصدة
        const employee = employees.find(emp => emp.id === vacation.employeeId);
        if (employee) {
          const employeeRef = ref(database, `employees/${vacation.employeeId}`);
          
          if (vacation.vacationType === 'اعتيادي') {
            await update(employeeRef, {
              regularVacation: employee.regularVacation + vacation.days
            });
          } else if (vacation.vacationType === 'عارضة') {
            await update(employeeRef, {
              casualVacation: employee.casualVacation + vacation.days
            });
          }
          // المأمورية والمرضية لا تحتاج استعادة أرصدة
        }
        
        setToast({ message: MESSAGES.SUCCESS.VACATION_DELETED, type: 'success' });
      } catch (error) {
        console.error('Error deleting vacation:', error);
        setToast({ message: MESSAGES.ERROR.GENERIC_ERROR, type: 'error' });
      }
    }
  };

  const handlePrintVacation = async (vacation) => {
    try {
      // الحصول على بيانات الموظف الحالية
      const employee = employees.find(emp => emp.id === vacation.employeeId);
      
      // الحصول على جميع إجازات الموظف
      const employeeVacations = getEmployeeVacations(vacation.employeeId);
      
      // حساب أيام الإجازات المرضية والمأمورية المستخدمة
      const sickDaysUsed = employeeVacations
        .filter(v => v.vacationType === 'مرضية')
        .reduce((sum, v) => sum + v.days, 0);
      
      const missionDaysUsed = employeeVacations
        .filter(v => v.vacationType === 'مأمورية')
        .reduce((sum, v) => sum + v.days, 0);
      
      // إضافة الرصيد الحالي لبيانات الإجازة
      const vacationWithBalance = {
        ...vacation,
        regularVacation: employee?.regularVacation || 0,
        casualVacation: employee?.casualVacation || 0,
        sickVacation: sickDaysUsed,
        missionVacation: missionDaysUsed
      };
      
      // إنشاء iframe مخفي للطباعة
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      
      document.body.appendChild(printFrame);
      
      let combinedTemplate;
      
      // كل أنواع الإجازات تطبع مع السجل التفصيلي
      let mainTemplate = '';
      
      // الحصول على الصفحة الأولى (صفحة الإجازة) إن وجدت
      if (vacation.vacationType === 'اعتيادي') {
        mainTemplate = RegularVacationTemplate(vacation, toArabicNumerals);
      } else if (vacation.vacationType === 'عارضة') {
        mainTemplate = CasualVacationTemplate(vacation, toArabicNumerals);
      } else if (vacation.vacationType === 'مأمورية' || vacation.vacationType === 'مرضية') {
        // للمأمورية والمرضية: السجل مباشرة بدون صفحة أولى
        mainTemplate = '';
      }
      
      // قالب سجل الإجازات (يتم إضافته لكل الأنواع)
      const historyTemplate = VacationHistoryTemplate(vacationWithBalance, toArabicNumerals, employeeVacations, false);
      
      // قالب صفحة الصورة (إن وجدت فقط)
      const attachmentTemplate = vacation.attachmentBase64 
        ? AttachmentPageTemplate(vacation, toArabicNumerals)
        : '';
      
      // دمج كل الأجزاء
      if (mainTemplate) {
        // للاعتيادي والعارضة: صفحة الإجازة + السجل + الصورة (إن وجدت)
        // السجل التفصيلي سيضيف page-break تلقائياً
        combinedTemplate = mainTemplate.replace('</body>', historyTemplate + attachmentTemplate + '</body>');
      } else {
        // للمأمورية والمرضية: السجل + الصورة (إن وجدت فقط)
        combinedTemplate = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>سجل الإجازات</title>
</head>
<body>
    ${historyTemplate}
    ${attachmentTemplate}
</body>
</html>
        `;
      }
      
      // كتابة المحتوى في الإطار
      const doc = printFrame.contentWindow.document;
      doc.open();
      doc.write(combinedTemplate);
      doc.close();
      
      // الطباعة بعد تحميل المحتوى
      printFrame.contentWindow.onload = function() {
        setTimeout(() => {
          printFrame.contentWindow.print();
          // حذف الإطار بعد الطباعة
          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 100);
        }, 250);
      };
    } catch (error) {
      console.error('Error printing vacation:', error);
      setToast({ message: 'حدث خطأ أثناء الطباعة', type: 'error' });
    }
  };

  const handleExportAsImage = async (vacation) => {
    try {
      // الحصول على بيانات الموظف الحالية
      const employee = employees.find(emp => emp.id === vacation.employeeId);
      
      // الحصول على جميع إجازات الموظف
      const employeeVacations = getEmployeeVacations(vacation.employeeId);
      
      // حساب أيام الإجازات المرضية والمأمورية المستخدمة
      const sickDaysUsed = employeeVacations
        .filter(v => v.vacationType === 'مرضية')
        .reduce((sum, v) => sum + v.days, 0);
      
      const missionDaysUsed = employeeVacations
        .filter(v => v.vacationType === 'مأمورية')
        .reduce((sum, v) => sum + v.days, 0);
      
      // إضافة الرصيد الحالي لبيانات الإجازة
      const vacationWithBalance = {
        ...vacation,
        regularVacation: employee?.regularVacation || 0,
        casualVacation: employee?.casualVacation || 0,
        sickVacation: sickDaysUsed,
        missionVacation: missionDaysUsed
      };
      
      // إنشاء div مخفي لتحضير المحتوى
      const exportDiv = document.createElement('div');
      exportDiv.style.position = 'fixed';
      exportDiv.style.left = '-10000px';
      exportDiv.style.top = '-10000px';
      exportDiv.style.width = '210mm';
      exportDiv.style.height = 'auto';
      exportDiv.style.background = 'white';
      exportDiv.style.zIndex = '-1000';
      
      // كل أنواع الإجازات مع السجل التفصيلي
      let mainTemplate = '';
      
      // الحصول على الصفحة الأولى (صفحة الإجازة) إن وجدت
      if (vacation.vacationType === 'اعتيادي') {
        mainTemplate = RegularVacationTemplate(vacation, toArabicNumerals);
      } else if (vacation.vacationType === 'عارضة') {
        mainTemplate = CasualVacationTemplate(vacation, toArabicNumerals);
      } else if (vacation.vacationType === 'مأمورية' || vacation.vacationType === 'مرضية') {
        // للمأمورية والمرضية: السجل مباشرة بدون صفحة أولى
        mainTemplate = '';
      }
      
      // قالب سجل الإجازات (يتم إضافته لكل الأنواع)
      const historyTemplate = VacationHistoryTemplate(vacationWithBalance, toArabicNumerals, employeeVacations);
      
      // قالب صفحة الصورة (إن وجدت)
      const attachmentTemplate = vacation.attachmentBase64 
        ? AttachmentPageTemplate(vacation, toArabicNumerals)
        : '';
      
      // دمج كل الأجزاء
      if (mainTemplate) {
        // للاعتيادي والعارضة: صورة فقط بدون السجل التفصيلي
        exportDiv.innerHTML = mainTemplate + attachmentTemplate;
      } else {
        // للمأمورية والمرضية: السجل + الصورة مباشرة
        exportDiv.innerHTML = historyTemplate + attachmentTemplate;
      }
      document.body.appendChild(exportDiv);
      
      // تحويل إلى صورة بعد تحميل المحتوى
      setTimeout(async () => {
        try {
          const canvas = await html2canvas(exportDiv, {
            scale: 2,
            logging: false,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true
          });
          
          // تحويل الـ canvas إلى blob وتنزيل الصورة
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `إجازة_${vacation.employeeName}_${vacation.requestDate}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            // حذف الـ div المؤقت
            document.body.removeChild(exportDiv);
            
            setToast({ message: 'تم تصدير الصورة بنجاح', type: 'success' });
          });
        } catch (error) {
          console.error('Error converting to image:', error);
          document.body.removeChild(exportDiv);
          setToast({ message: 'حدث خطأ أثناء تصدير الصورة', type: 'error' });
        }
      }, 500);
    } catch (error) {
      console.error('Error exporting as image:', error);
      setToast({ message: 'حدث خطأ أثناء تصدير الصورة', type: 'error' });
    }
  };

  const handleExportAsPDF = async (vacation) => {
    try {
      // الحصول على بيانات الموظف الحالية
      const employee = employees.find(emp => emp.id === vacation.employeeId);
      
      // الحصول على جميع إجازات الموظف
      const employeeVacations = getEmployeeVacations(vacation.employeeId);
      
      // حساب أيام الإجازات المرضية والمأمورية المستخدمة
      const sickDaysUsed = employeeVacations
        .filter(v => v.vacationType === 'مرضية')
        .reduce((sum, v) => sum + v.days, 0);
      
      const missionDaysUsed = employeeVacations
        .filter(v => v.vacationType === 'مأمورية')
        .reduce((sum, v) => sum + v.days, 0);
      
      // إضافة الرصيد الحالي لبيانات الإجازة
      const vacationWithBalance = {
        ...vacation,
        regularVacation: employee?.regularVacation || 0,
        casualVacation: employee?.casualVacation || 0,
        sickVacation: sickDaysUsed,
        missionVacation: missionDaysUsed
      };
      
      // إنشاء div مخفي لتحضير المحتوى
      const exportDiv = document.createElement('div');
      exportDiv.style.position = 'fixed';
      exportDiv.style.left = '-10000px';
      exportDiv.style.top = '-10000px';
      exportDiv.style.width = '210mm';
      exportDiv.style.height = 'auto';
      exportDiv.style.background = 'white';
      exportDiv.style.zIndex = '-1000';
      
      // كل أنواع الإجازات مع السجل التفصيلي - طبق الأصل من الطباعة
      let mainTemplate = '';
      
      // الحصول على الصفحة الأولى (صفحة الإجازة) إن وجدت
      if (vacation.vacationType === 'اعتيادي') {
        mainTemplate = RegularVacationTemplate(vacation, toArabicNumerals);
      } else if (vacation.vacationType === 'عارضة') {
        mainTemplate = CasualVacationTemplate(vacation, toArabicNumerals);
      } else if (vacation.vacationType === 'مأمورية' || vacation.vacationType === 'مرضية') {
        // للمأمورية والمرضية: السجل مباشرة بدون صفحة أولى
        mainTemplate = '';
      }
      
      // قالب سجل الإجازات (يتم إضافته لكل الأنواع)
      const historyTemplate = VacationHistoryTemplate(vacationWithBalance, toArabicNumerals, employeeVacations);
      
      // قالب صفحة الصورة (إن وجدت)
      const attachmentTemplate = AttachmentPageTemplate(vacation, toArabicNumerals);
      
      // دمج كل الأجزاء - طبق الأصل من الطباعة
      if (mainTemplate) {
        // للاعتيادي والعارضة: صفحة الإجازة + (page-break) + السجل + الصورة
        const pageBreakDiv = '<div style="page-break-before: always; margin: 0; padding: 0;"></div>';
        exportDiv.innerHTML = mainTemplate + pageBreakDiv + historyTemplate + attachmentTemplate;
      } else {
        // للمأمورية والمرضية: السجل + الصورة مباشرة
        exportDiv.innerHTML = historyTemplate + attachmentTemplate;
      }
      document.body.appendChild(exportDiv);
      
      // تحويل إلى PDF بعد تحميل المحتوى
      setTimeout(async () => {
        try {
          const canvas = await html2canvas(exportDiv, {
            scale: 2,
            logging: false,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            imageTimeout: 0
          });
          
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgWidth = 210;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // إضافة الصور إلى PDF
          let yPosition = 0;
          let pageHeight = 297;
          
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          
          // إذا كانت الصورة أطول من صفحة واحدة، إضافة صفحات إضافية
          let remainingHeight = imgHeight - pageHeight;
          while (remainingHeight > 0) {
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, -pageHeight - yPosition, imgWidth, imgHeight);
            yPosition += pageHeight;
            remainingHeight -= pageHeight;
          }
          
          // حفظ الـ PDF
          pdf.save(`إجازة_${vacation.employeeName}_${vacation.requestDate}.pdf`);
          
          // حذف الـ div المؤقت
          document.body.removeChild(exportDiv);
          
          setToast({ message: 'تم حفظ PDF بنجاح', type: 'success' });
        } catch (error) {
          console.error('Error converting to PDF:', error);
          document.body.removeChild(exportDiv);
          setToast({ message: 'حدث خطأ أثناء حفظ PDF', type: 'error' });
        }
      }, 500);
    } catch (error) {
      console.error('Error exporting as PDF:', error);
      setToast({ message: 'حدث خطأ أثناء حفظ PDF', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="card">
        <LoadingSpinner message={MESSAGES.LOADING.FETCHING_DATA} />
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="card">
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>
          {editingId ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div className="form-group">
              <label>الاسم</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>الوظيفة</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>القسم</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>رصيد الإجازة الاعتيادية</label>
              <input
                type="number"
                name="regularVacation"
                value={formData.regularVacation}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>رصيد الإجازة العارضة</label>
              <input
                type="number"
                name="casualVacation"
                value={formData.casualVacation}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'تحديث' : 'إضافة'}
            </button>
            {editingId && (
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: '',
                    position: '',
                    department: '',
                    regularVacation: DEFAULT_VACATION_DAYS.REGULAR,
                    casualVacation: DEFAULT_VACATION_DAYS.CASUAL,
                  });
                }}
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>قائمة الموظفين</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الوظيفة</th>
                <th>القسم</th>
                <th>إجازة اعتيادية</th>
                <th>إجازة عارضة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                employees.map(employee => (
                  <tr key={employee.id}>
                    <td>{employee.name}</td>
                    <td>{employee.position}</td>
                    <td>{employee.department}</td>
                    <td>{employee.regularVacation} يوم</td>
                    <td>{employee.casualVacation} يوم</td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button 
                          className="btn btn-success"
                          onClick={() => handleViewVacations(employee)}
                          style={{ padding: '5px 15px', fontSize: '14px' }}
                        >
                          الإجازات ({getEmployeeVacations(employee.id).length})
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleEdit(employee)}
                          style={{ padding: '5px 15px', fontSize: '14px' }}
                        >
                          تعديل
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleDelete(employee.id)}
                          style={{ padding: '5px 15px', fontSize: '14px' }}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Vacations Modal */}
      {selectedEmployee && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setSelectedEmployee(null)}
        >
          <div 
            className="card"
            style={{
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              margin: 0
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#374151', margin: 0 }}>
                إجازات الموظف: {selectedEmployee.name}
              </h2>
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedEmployee(null)}
                style={{ padding: '8px 16px' }}
              >
                إغلاق
              </button>
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#f3f4f6', borderRadius: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                <div>
                  <strong>الوظيفة:</strong> {selectedEmployee.position}
                </div>
                <div>
                  <strong>القسم:</strong> {selectedEmployee.department}
                </div>
                <div style={{ color: '#667eea' }}>
                  <strong>إجازة اعتيادية:</strong> {selectedEmployee.regularVacation} يوم
                </div>
                <div style={{ color: '#10b981' }}>
                  <strong>إجازة عارضة:</strong> {selectedEmployee.casualVacation} يوم
                </div>
              </div>
            </div>

            {getEmployeeVacations(selectedEmployee.id).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                <p style={{ fontSize: '18px' }}>لا توجد إجازات مسجلة لهذا الموظف</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>نوع الإجازة</th>
                      <th>من</th>
                      <th>إلى</th>
                      <th>الأيام</th>
                      <th>السبب</th>
                      <th>تاريخ التقديم</th>
                      <th>مرفق</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getEmployeeVacations(selectedEmployee.id).map(vacation => (
                      <tr key={vacation.id}>
                        <td style={{ fontWeight: 'bold' }}>{vacation.vacationType}</td>
                        <td>{vacation.startDate}</td>
                        <td>{vacation.endDate}</td>
                        <td style={{ fontWeight: 'bold', color: '#667eea' }}>{vacation.days} يوم</td>
                        <td>{vacation.reason}</td>
                        <td>{vacation.requestDate}</td>
                        <td>
                          {vacation.attachmentBase64 ? (
                            <a 
                              href={vacation.attachmentBase64}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ 
                                color: '#10b981',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                              title={vacation.attachmentName || 'عرض الصورة'}
                            >
                              🖼️ عرض
                            </a>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>-</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            <button 
                              className="btn btn-primary"
                              onClick={() => handlePrintVacation(vacation)}
                              style={{ padding: '5px 10px', fontSize: '14px' }}
                            >
                              🖨️ طباعة
                            </button>

                            <button 
                              className="btn btn-danger"
                              onClick={() => handleDeleteVacation(vacation)}
                              style={{ padding: '5px 10px', fontSize: '14px' }}
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary Statistics */}
            {getEmployeeVacations(selectedEmployee.id).length > 0 && (
              <div style={{ 
                marginTop: '20px', 
                padding: '15px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '10px',
                color: 'white'
              }}>
                <h3 style={{ marginBottom: '15px' }}>إحصائيات الإجازات</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                  <div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>إجمالي الإجازات</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {getEmployeeVacations(selectedEmployee.id).length}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>إجمالي الأيام</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {getEmployeeVacations(selectedEmployee.id).reduce((sum, v) => sum + v.days, 0)} يوم
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;
