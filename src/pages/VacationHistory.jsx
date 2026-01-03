import React, { useState, useEffect, useRef } from 'react';
import { database } from '../firebase';
import { ref, onValue, remove, update } from 'firebase/database';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { VACATION_ICONS, MESSAGES } from '../constants';
import { toArabicNumerals } from '../utils/dateUtils';
import { RegularVacationTemplate, CasualVacationTemplate, VacationHistoryTemplate, AttachmentPageTemplate } from '../templates/printTemplates';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

function VacationHistory() {
  const [vacations, setVacations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filterType, setFilterType] = useState('الكل');
  const [selectedVacation, setSelectedVacation] = useState(null);
  const [editingVacation, setEditingVacation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const printRef = useRef();

  // Debug: رصد تغييرات editingVacation
  useEffect(() => {
    console.log('✅ editingVacation state changed:', editingVacation);
  }, [editingVacation]);

  useEffect(() => {
    const vacationsRef = ref(database, 'vacations');
    const employeesRef = ref(database, 'employees');
    
    const unsubscribeVacations = onValue(vacationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const vacationsList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setVacations(vacationsList);
      } else {
        setVacations([]);
      }
      setLoading(false);
    });

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
    });

    return () => {
      unsubscribeVacations();
      unsubscribeEmployees();
    };
  }, []);

  const filteredVacations = vacations.filter(vacation => {
    const typeMatch = filterType === 'الكل' || vacation.vacationType === filterType;
    return typeMatch;
  });

  const handlePrint = async (vacation) => {
    setSelectedVacation(vacation);
    setTimeout(async () => {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`إجازة_${vacation.employeeName}_${vacation.requestDate}.pdf`);
      
      setSelectedVacation(null);
    }, 100);
  };

  const handleSaveVacation = async (vacation) => {
    try {
      // الحصول على بيانات الموظف
      const employee = employees.find(emp => emp.id === vacation.employeeId);
      
      // الحصول على جميع إجازات الموظف
      const employeeVacations = vacations
        .filter(v => v.employeeId === vacation.employeeId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
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
        // للاعتيادي والعارضة: السجل التفصيلي + الصورة فقط (بدون النموذج الرسمي)
        exportDiv.innerHTML = historyTemplate + attachmentTemplate;
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
            allowTaint: true
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
          
          setToast({ message: 'تم حفظ النموذج بنجاح', type: 'success' });
        } catch (error) {
          console.error('Error converting to PDF:', error);
          document.body.removeChild(exportDiv);
          setToast({ message: 'حدث خطأ أثناء حفظ النموذج', type: 'error' });
        }
      }, 500);
    } catch (error) {
      console.error('Error saving vacation:', error);
      setToast({ message: 'حدث خطأ أثناء حفظ النموذج', type: 'error' });
    }
  };

  const handleEditVacation = (vacation) => {
    console.log('🔧 Clicked Edit button for vacation:', vacation);
    // إنشاء نسخة من الإجازة للتعديل مع التأكد من وجود كل القيم
    const editData = {
      id: vacation.id,
      employeeId: vacation.employeeId,
      employeeName: vacation.employeeName,
      position: vacation.position,
      department: vacation.department,
      vacationType: vacation.vacationType,
      startDate: vacation.startDate,
      endDate: vacation.endDate,
      days: vacation.days,
      reason: vacation.reason || '',
      coveringEmployee: vacation.coveringEmployee || '',
      requestDate: vacation.requestDate
    };
    console.log('📝 Setting editingVacation to:', editData);
    setEditingVacation(editData);
  };

  const handleEditDateChange = (field, value) => {
    setEditingVacation(prev => {
      const updated = { ...prev, [field]: value };
      
      // حساب الأيام تلقائياً عند تغيير التواريخ
      if (field === 'startDate' || field === 'endDate') {
        const start = new Date(field === 'startDate' ? value : prev.startDate);
        const end = new Date(field === 'endDate' ? value : prev.endDate);
        
        if (start && end && end >= start) {
          const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
          updated.days = days;
        }
      }
      
      return updated;
    });
  };

  const handleExportAsImage = async (vacation) => {
    try {
      // الحصول على بيانات الموظف
      const employee = employees.find(emp => emp.id === vacation.employeeId);
      
      // الحصول على جميع إجازات الموظف
      const employeeVacations = vacations
        .filter(v => v.employeeId === vacation.employeeId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
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
      
      // قالب سجل الإجازات (السجل التفصيلي فقط بدون النموذج)
      const historyTemplate = VacationHistoryTemplate(vacationWithBalance, toArabicNumerals, employeeVacations);
      
      // قالب صفحة الصورة (إن وجدت)
      const attachmentTemplate = vacation.attachmentBase64 
        ? AttachmentPageTemplate(vacation, toArabicNumerals)
        : '';
      
      // دمج السجل + الصورة فقط (بدون النموذج الرسمي)
      exportDiv.innerHTML = historyTemplate + attachmentTemplate;
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
            link.download = `سجل_إجازة_${vacation.employeeName}_${vacation.requestDate}.png`;
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

  const handleUpdateVacation = async () => {
    if (!editingVacation) return;
    
    try {
      // التحقق من صحة التواريخ
      const startDate = new Date(editingVacation.startDate);
      const endDate = new Date(editingVacation.endDate);
      
      if (endDate < startDate) {
        setToast({ message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية', type: 'error' });
        return;
      }
      
      // العثور على الإجازة الأصلية والموظف
      const originalVacation = vacations.find(v => v.id === editingVacation.id);
      const employee = employees.find(emp => emp.id === editingVacation.employeeId);
      
      if (!employee || !originalVacation) {
        setToast({ message: 'حدث خطأ: لم يتم العثور على البيانات', type: 'error' });
        return;
      }
      
      const employeeRef = ref(database, `employees/${editingVacation.employeeId}`);
      const typeChanged = originalVacation.vacationType !== editingVacation.vacationType;
      const daysChanged = originalVacation.days !== editingVacation.days;
      
      // حالة 1: تم تغيير نوع الإجازة
      if (typeChanged) {
        // إرجاع أيام الإجازة القديمة إلى الرصيد (إن كانت اعتيادي أو عارضة)
        if (originalVacation.vacationType === 'اعتيادي') {
          await update(employeeRef, {
            regularVacation: employee.regularVacation + originalVacation.days
          });
        } else if (originalVacation.vacationType === 'عارضة') {
          await update(employeeRef, {
            casualVacation: employee.casualVacation + originalVacation.days
          });
        }
        
        // خصم أيام الإجازة الجديدة من الرصيد (إن كانت اعتيادي أو عارضة)
        if (editingVacation.vacationType === 'اعتيادي') {
          const newBalance = (employee.regularVacation + (originalVacation.vacationType === 'اعتيادي' ? originalVacation.days : 0)) - editingVacation.days;
          
          if (newBalance < 0) {
            setToast({ 
              message: `رصيد الإجازة الاعتيادية غير كافٍ. الرصيد المتاح بعد الإرجاع: ${employee.regularVacation + (originalVacation.vacationType === 'اعتيادي' ? originalVacation.days : 0)} يوم`, 
              type: 'error' 
            });
            return;
          }
          
          await update(employeeRef, {
            regularVacation: newBalance
          });
        } else if (editingVacation.vacationType === 'عارضة') {
          const newBalance = (employee.casualVacation + (originalVacation.vacationType === 'عارضة' ? originalVacation.days : 0)) - editingVacation.days;
          
          if (newBalance < 0) {
            setToast({ 
              message: `رصيد الإجازة العارضة غير كافٍ. الرصيد المتاح بعد الإرجاع: ${employee.casualVacation + (originalVacation.vacationType === 'عارضة' ? originalVacation.days : 0)} يوم`, 
              type: 'error' 
            });
            return;
          }
          
          await update(employeeRef, {
            casualVacation: newBalance
          });
        }
        // المأمورية والمرضية لا تحتاج تحديث أرصدة
      }
      // حالة 2: لم يتغير النوع لكن تغيرت الأيام
      else if (daysChanged) {
        const daysDifference = editingVacation.days - originalVacation.days;
        
        if (editingVacation.vacationType === 'اعتيادي') {
          const newBalance = employee.regularVacation - daysDifference;
          
          if (newBalance < 0) {
            setToast({ 
              message: `رصيد الإجازة الاعتيادية غير كافٍ. الرصيد المتاح: ${employee.regularVacation} يوم`, 
              type: 'error' 
            });
            return;
          }
          
          await update(employeeRef, {
            regularVacation: newBalance
          });
        } else if (editingVacation.vacationType === 'عارضة') {
          const newBalance = employee.casualVacation - daysDifference;
          
          if (newBalance < 0) {
            setToast({ 
              message: `رصيد الإجازة العارضة غير كافٍ. الرصيد المتاح: ${employee.casualVacation} يوم`, 
              type: 'error' 
            });
            return;
          }
          
          await update(employeeRef, {
            casualVacation: newBalance
          });
        }
        // المأمورية والمرضية لا تحتاج تحديث أرصدة
      }
      
      // تحديث بيانات الإجازة
      const vacationRef = ref(database, `vacations/${editingVacation.id}`);
      await update(vacationRef, {
        startDate: editingVacation.startDate,
        endDate: editingVacation.endDate,
        days: editingVacation.days,
        reason: editingVacation.reason,
        coveringEmployee: editingVacation.coveringEmployee,
        vacationType: editingVacation.vacationType
      });
      
      setEditingVacation(null);
      setToast({ message: 'تم تحديث الإجازة بنجاح', type: 'success' });
    } catch (error) {
      console.error('Error updating vacation:', error);
      setToast({ message: 'حدث خطأ أثناء تحديث الإجازة', type: 'error' });
    }
  };

  const handleDeleteVacation = async (vacation) => {
    if (window.confirm(MESSAGES.ERROR.DELETE_VACATION_CONFIRM)) {
      try {
        // حذف الإجازة
        const vacationRef = ref(database, `vacations/${vacation.id}`);
        await remove(vacationRef);
        
        // استعادة رصيد الإجازة للموظف - فقط للاعتيادي والعارضة
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

  const getVacationTypeIcon = (type) => {
    return VACATION_ICONS[type] || '📄';
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
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>سجل الإجازات</h2>
        
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
            <label>تصفية حسب النوع</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="الكل">الكل</option>
              <option value="اعتيادي">اعتيادي</option>
              <option value="عارضة">عارضة</option>
              <option value="مأمورية">مأمورية</option>
              <option value="مرضية">مرضية</option>
            </select>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '20px' 
        }}>
          {filteredVacations.length === 0 ? (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              padding: '40px',
              color: '#9ca3af'
            }}>
              <p style={{ fontSize: '18px' }}>لا توجد إجازات مسجلة</p>
            </div>
          ) : (
            filteredVacations.map(vacation => (
              <div 
                key={vacation.id} 
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <h3 style={{ color: '#374151', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{getVacationTypeIcon(vacation.vacationType)}</span>
                    {vacation.employeeName}
                  </h3>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: '#6b7280', marginBottom: '8px' }}>
                    <strong>الوظيفة:</strong> {vacation.position}
                  </p>
                  <p style={{ color: '#6b7280', marginBottom: '8px' }}>
                    <strong>القسم:</strong> {vacation.department}
                  </p>
                  <p style={{ color: '#6b7280', marginBottom: '8px' }}>
                    <strong>نوع الإجازة:</strong> {vacation.vacationType}
                  </p>
                  <p style={{ color: '#6b7280', marginBottom: '8px' }}>
                    <strong>من:</strong> {vacation.startDate} <strong>إلى:</strong> {vacation.endDate}
                  </p>
                  <p style={{ 
                    color: '#667eea', 
                    fontWeight: 'bold', 
                    fontSize: '16px',
                    marginBottom: '8px'
                  }}>
                    <strong>المدة:</strong> {vacation.days} يوم
                  </p>
                  <p style={{ color: '#6b7280', marginBottom: '8px' }}>
                    <strong>السبب:</strong> {vacation.reason}
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '13px' }}>
                    <strong>تاريخ التقديم:</strong> {vacation.requestDate}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSaveVacation(vacation)}
                    style={{ flex: 1 }}
                  >
                    💾 حفظ النموذج
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleExportAsImage(vacation)}
                    style={{ flex: 1, backgroundColor: '#10b981' }}
                  >
                    🖼️ صورة
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEditVacation(vacation)}
                    style={{ flex: 1, backgroundColor: '#f59e0b' }}
                  >
                    ✏️ تعديل النموذج
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteVacation(vacation)}
                    style={{ flex: 1 }}
                  >
                    🗑️ حذف
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Print Template - Hidden */}
      {selectedVacation && (
        <div 
          ref={printRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '210mm',
            minHeight: '297mm',
            background: 'white',
            padding: '20mm',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          {/* Header with Company Logo */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '30px',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'url("ورقة الشركة.png")',
              backgroundSize: 'contain',
              backgroundPosition: 'center top',
              backgroundRepeat: 'no-repeat',
              opacity: 0.1,
              zIndex: 0
            }}></div>
            <h1 style={{ 
              fontSize: '28px', 
              color: '#333', 
              marginBottom: '10px',
              position: 'relative',
              zIndex: 1
            }}>
              طلب إجازة
            </h1>
            <div style={{ 
              height: '3px', 
              background: 'linear-gradient(to right, #667eea, #764ba2)',
              width: '200px',
              margin: '0 auto',
              position: 'relative',
              zIndex: 1
            }}></div>
          </div>

          {/* Vacation Type Specific Template */}
          {selectedVacation.vacationType === 'اعتيادي' ? (
            // Regular Vacation Template
            <div style={{ fontSize: '16px', lineHeight: '2' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #333', background: '#f5f5f5', fontWeight: 'bold', width: '30%' }}>
                      الاسم:
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #333' }}>
                      {selectedVacation.employeeName}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #333', background: '#f5f5f5', fontWeight: 'bold' }}>
                      الوظيفة:
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #333' }}>
                      {selectedVacation.position}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #333', background: '#f5f5f5', fontWeight: 'bold' }}>
                      القسم:
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #333' }}>
                      {selectedVacation.department}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #333', background: '#f5f5f5', fontWeight: 'bold' }}>
                      نوع الإجازة:
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #333', fontWeight: 'bold', color: '#667eea' }}>
                      إجازة اعتيادية
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #333', background: '#f5f5f5', fontWeight: 'bold' }}>
                      من تاريخ:
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #333' }}>
                      {selectedVacation.startDate}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #333', background: '#f5f5f5', fontWeight: 'bold' }}>
                      إلى تاريخ:
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #333' }}>
                      {selectedVacation.endDate}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #333', background: '#f5f5f5', fontWeight: 'bold' }}>
                      عدد الأيام:
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #333', fontWeight: 'bold', fontSize: '18px' }}>
                      {selectedVacation.days} يوم
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #333', background: '#f5f5f5', fontWeight: 'bold', verticalAlign: 'top' }}>
                      السبب:
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #333' }}>
                      {selectedVacation.reason}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #333', background: '#f5f5f5', fontWeight: 'bold' }}>
                      تاريخ التقديم:
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #333' }}>
                      {selectedVacation.requestDate}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ marginBottom: '60px', fontWeight: 'bold' }}>توقيع الموظف</p>
                  <div style={{ borderTop: '2px solid #333', width: '200px' }}></div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ marginBottom: '60px', fontWeight: 'bold' }}>توقيع المدير المباشر</p>
                  <div style={{ borderTop: '2px solid #333', width: '200px' }}></div>
                </div>
              </div>
            </div>
          ) : (
            // Casual/Other Vacation Template
            <div style={{ fontSize: '16px', lineHeight: '2' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #333', background: '#f5f5f5', fontWeight: 'bold', width: '30%' }}>
                      الاسم:
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #333' }}>
                      {selectedVacation.employeeName}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #333', background: '#f5f5f5', fontWeight: 'bold' }}>
                      الوظيفة:
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #333' }}>
                      {selectedVacation.position}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #333', background: '#f5f5f5', fontWeight: 'bold' }}>
                      القسم:
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #333' }}>
                      {selectedVacation.department}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #333', background: '#f5f5f5', fontWeight: 'bold' }}>
                      نوع الإجازة:
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #333', fontWeight: 'bold', color: '#667eea' }}>
                      {selectedVacation.vacationType}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #333', background: '#f5f5f5', fontWeight: 'bold' }}>
                      التاريخ:
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #333' }}>
                      {selectedVacation.startDate} - {selectedVacation.endDate}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #333', background: '#f5f5f5', fontWeight: 'bold' }}>
                      المدة:
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #333', fontWeight: 'bold', fontSize: '18px' }}>
                      {selectedVacation.days} يوم
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #333', background: '#f5f5f5', fontWeight: 'bold', verticalAlign: 'top' }}>
                      السبب:
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #333', minHeight: '100px' }}>
                      {selectedVacation.reason}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ marginBottom: '60px', fontWeight: 'bold' }}>توقيع الموظف</p>
                  <div style={{ borderTop: '2px solid #333', width: '200px' }}></div>
                  <p style={{ marginTop: '10px', fontSize: '14px' }}>التاريخ: {selectedVacation.requestDate}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ marginBottom: '60px', fontWeight: 'bold' }}>اعتماد الإدارة</p>
                  <div style={{ borderTop: '2px solid #333', width: '200px' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ 
            marginTop: '50px', 
            textAlign: 'center', 
            fontSize: '12px', 
            color: '#666',
            borderTop: '1px solid #ccc',
            paddingTop: '20px'
          }}>
            <p>هذا المستند رسمي ولا يُعتد به إلا بعد التوقيع والاعتماد</p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingVacation && (
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
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setEditingVacation(null)}
        >
          <div 
            className="card"
            style={{
              maxWidth: '600px',
              width: '100%',
              margin: 0,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '20px', color: '#374151' }}>تعديل الإجازة</h2>
            
            <div className="form-group">
              <label>نوع الإجازة</label>
              <select
                value={editingVacation.vacationType}
                onChange={(e) => setEditingVacation({
                  ...editingVacation,
                  vacationType: e.target.value
                })}
              >
                <option value="اعتيادي">اعتيادي</option>
                <option value="عارضة">عارضة</option>
                <option value="مأمورية">مأمورية</option>
                <option value="مرضية">مرضية</option>
              </select>
            </div>

            <div className="form-group">
              <label>من التاريخ</label>
              <input
                type="date"
                value={editingVacation.startDate || ''}
                onChange={(e) => handleEditDateChange('startDate', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>إلى التاريخ</label>
              <input
                type="date"
                value={editingVacation.endDate || ''}
                onChange={(e) => handleEditDateChange('endDate', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>عدد الأيام</label>
              <input
                type="number"
                value={editingVacation.days || 1}
                onChange={(e) => setEditingVacation({
                  ...editingVacation,
                  days: Number(e.target.value)
                })}
                min="1"
              />
            </div>

            <div className="form-group">
              <label>السبب</label>
              <textarea
                value={editingVacation.reason || ''}
                onChange={(e) => setEditingVacation({
                  ...editingVacation,
                  reason: e.target.value
                })}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>الموظف البديل</label>
              <input
                type="text"
                value={editingVacation.coveringEmployee || ''}
                onChange={(e) => setEditingVacation({
                  ...editingVacation,
                  coveringEmployee: e.target.value
                })}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                onClick={handleUpdateVacation}
                style={{ flex: 1 }}
              >
                ✓ حفظ التعديلات
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setEditingVacation(null)}
                style={{ flex: 1, background: '#9ca3af' }}
              >
                ✕ إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VacationHistory;
