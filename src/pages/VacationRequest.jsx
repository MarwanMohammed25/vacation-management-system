import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, push, onValue, update } from 'firebase/database';
import { calculateDays, isDateValid, isOverlapping } from '../utils/dateUtils';
import { VACATION_TYPES, DEFAULT_VACATION_DAYS, MESSAGES } from '../constants';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

function VacationRequest() {
  const [employees, setEmployees] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    position: '',
    department: '',
    vacationType: VACATION_TYPES.REGULAR,
    startDate: '',
    endDate: '',
    days: 1,
    reason: '',
    coveringEmployee: '',
    requestDate: new Date().toISOString().split('T')[0]
  });

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

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (employee) {
      setFormData(prev => ({
        ...prev,
        employeeId: employeeId,
        employeeName: employee.name,
        position: employee.position,
        department: employee.department
      }));
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'startDate' || name === 'endDate') {
        const startDate = name === 'startDate' ? value : prev.startDate;
        const endDate = name === 'endDate' ? value : prev.endDate;
        newData.days = calculateDays(startDate, endDate);
      }
      return newData;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // التحقق من حجم الملف (أقصى 2MB للصور)
      if (file.size > 2 * 1024 * 1024) {
        setToast({ message: 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت', type: 'error' });
        return;
      }
      
      // تحويل الصورة إلى Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          attachment: reader.result, // Base64 string
          attachmentName: file.name
        }));
      };
      reader.onerror = () => {
        setToast({ message: 'حدث خطأ أثناء قراءة الصورة', type: 'error' });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setFormData(prev => ({
      ...prev,
      attachment: null,
      attachmentName: ''
    }));
  };

  const checkVacationOverlap = (employeeId, startDate, endDate) => {
    const employeeVacations = vacations.filter(v => v.employeeId === employeeId);
    
    for (const vacation of employeeVacations) {
      if (isOverlapping(startDate, endDate, vacation.startDate, vacation.endDate)) {
        return true;
      }
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      const employee = employees.find(emp => emp.id === formData.employeeId);
      if (!employee) {
        setToast({ message: MESSAGES.ERROR.SELECT_EMPLOYEE, type: 'error' });
        return;
      }

      // التحقق من صحة التواريخ
      if (!isDateValid(formData.startDate)) {
        setToast({ message: MESSAGES.ERROR.PAST_DATE, type: 'error' });
        return;
      }

      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        setToast({ message: MESSAGES.ERROR.INVALID_DATES, type: 'error' });
        return;
      }

      // التحقق من تداخل الإجازات
      if (checkVacationOverlap(formData.employeeId, formData.startDate, formData.endDate)) {
        setToast({ message: MESSAGES.ERROR.OVERLAPPING_VACATION, type: 'error' });
        return;
      }

      // التحقق من رصيد الإجازات - فقط للاعتيادي والعارضة
      // المأمورية والمرضية لا تعتمد على الأرصدة
      if (formData.vacationType === VACATION_TYPES.REGULAR) {
        if (employee.regularVacation < formData.days) {
          setToast({ 
            message: `${MESSAGES.ERROR.INSUFFICIENT_BALANCE} ${employee.regularVacation} يوم`, 
            type: 'error' 
          });
          return;
        }
      } else if (formData.vacationType === VACATION_TYPES.CASUAL) {
        if (employee.casualVacation < formData.days) {
          setToast({ 
            message: `${MESSAGES.ERROR.INSUFFICIENT_BALANCE} ${employee.casualVacation} يوم`, 
            type: 'error' 
          });
          return;
        }
      }
      // المأمورية والمرضية لا تحتاج تحقق من رصيد

      // حفظ طلب الإجازة
      const vacationsRef = ref(database, 'vacations');
      const vacationData = {
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        position: formData.position,
        department: formData.department,
        vacationType: formData.vacationType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days: formData.days,
        reason: formData.reason,
        coveringEmployee: formData.coveringEmployee,
        requestDate: formData.requestDate,
        createdAt: new Date().toISOString()
      };
      
      // إضافة الصورة إن وجدت (Base64)
      if (formData.attachment) {
        vacationData.attachmentBase64 = formData.attachment;
        vacationData.attachmentName = formData.attachmentName;
      }
      
      await push(vacationsRef, vacationData);

      // تحديث رصيد الإجازات - فقط للاعتيادي والعارضة
      // المأمورية والمرضية لا تؤثر على الأرصدة
      const employeeRef = ref(database, `employees/${formData.employeeId}`);
      if (formData.vacationType === VACATION_TYPES.REGULAR) {
        await update(employeeRef, {
          regularVacation: employee.regularVacation - formData.days
        });
      } else if (formData.vacationType === VACATION_TYPES.CASUAL) {
        await update(employeeRef, {
          casualVacation: employee.casualVacation - formData.days
        });
      }
      // المأمورية والمرضية لا تحتاج تحديث أرصدة

      setToast({ message: MESSAGES.SUCCESS.VACATION_SUBMITTED, type: 'success' });
      
      // إعادة تعيين النموذج
      setFormData({
        employeeId: '',
        employeeName: '',
        position: '',
        department: '',
        vacationType: VACATION_TYPES.REGULAR,
        startDate: '',
        endDate: '',
        days: 1,
        reason: '',
        coveringEmployee: '',
        requestDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error submitting vacation:', error);
      setToast({ message: MESSAGES.ERROR.GENERIC_ERROR, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEmployee = employees.find(emp => emp.id === formData.employeeId);

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
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>تقديم طلب إجازة</h2>
      
      {selectedEmployee && (
        <div className="vacation-balance">
          <div className="balance-card">
            <h3>الإجازة الاعتيادية</h3>
            <div className="number">{selectedEmployee.regularVacation}</div>
            <p>يوم متبقي</p>
          </div>
          <div className="balance-card">
            <h3>الإجازة العارضة</h3>
            <div className="number">{selectedEmployee.casualVacation}</div>
            <p>يوم متبقي</p>
          </div>
          <div className="balance-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <h3>المأمورية</h3>
            <div className="number">∞</div>
            <p>غير محدود</p>
          </div>
          <div className="balance-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <h3>الإجازة المرضية</h3>
            <div className="number">∞</div>
            <p>غير محدود</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div className="form-group">
            <label>الموظف *</label>
            <select
              value={formData.employeeId}
              onChange={handleEmployeeChange}
              required
            >
              <option value="">اختر الموظف</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.position}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>القسم</label>
            <input
              type="text"
              value={formData.department}
              disabled
              style={{ background: '#f3f4f6' }}
            />
          </div>

          <div className="form-group">
            <label>نوع الإجازة *</label>
            <select
              value={formData.vacationType}
              onChange={(e) => setFormData(prev => ({ ...prev, vacationType: e.target.value }))}
              required
            >
              <option value={VACATION_TYPES.REGULAR}>{VACATION_TYPES.REGULAR}</option>
              <option value={VACATION_TYPES.CASUAL}>{VACATION_TYPES.CASUAL}</option>
              <option value={VACATION_TYPES.MISSION}>{VACATION_TYPES.MISSION}</option>
              <option value={VACATION_TYPES.SICK}>{VACATION_TYPES.SICK}</option>
            </select>
          </div>

          <div className="form-group">
            <label>تاريخ البدء *</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleDateChange}
              required
            />
          </div>

          <div className="form-group">
            <label>تاريخ الانتهاء *</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleDateChange}
              min={formData.startDate}
              required
            />
          </div>

          <div className="form-group">
            <label>عدد الأيام</label>
            <input
              type="number"
              value={formData.days}
              disabled
              style={{ background: '#f3f4f6', fontWeight: 'bold', fontSize: '18px' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label>سبب الإجازة (اختياري)</label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
            rows="4"
            placeholder="اكتب سبب طلب الإجازة..."
          />
        </div>

        {formData.vacationType === VACATION_TYPES.REGULAR && (
          <div className="form-group">
            <label>أتعهد أنا (اسم من سيقوم بالعمل أثناء الإجازة) - اختياري</label>
            <input
              type="text"
              value={formData.coveringEmployee}
              onChange={(e) => setFormData(prev => ({ ...prev, coveringEmployee: e.target.value }))}
              placeholder="اكتب اسم الموظف الذي سيقوم بالعمل أثناء الإجازة..."
            />
          </div>
        )}

        {(formData.vacationType === VACATION_TYPES.SICK || formData.vacationType === VACATION_TYPES.MISSION) && (
          <div className="form-group">
            <label>إرفاق صورة (اختياري) - JPG, PNG</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {!formData.attachment ? (
                <>
                  <input
                    type="file"
                    id="attachment"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <label 
                    htmlFor="attachment" 
                    className="btn btn-secondary"
                    style={{ cursor: 'pointer', margin: 0 }}
                  >
                    🖼️ اختر صورة
                  </label>
                </>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  padding: '10px',
                  background: '#f0f8ff',
                  borderRadius: '8px',
                  border: '2px solid #5AB9D8',
                  flex: 1
                }}>
                  <span style={{ flex: 1, color: '#0066cc', fontWeight: 'bold' }}>🖼️ {formData.attachmentName}</span>
                  <button 
                    type="button"
                    onClick={removeAttachment}
                    className="btn btn-danger"
                    style={{ padding: '5px 15px' }}
                  >
                    حذف
                  </button>
                </div>
              )}
            </div>
            <small style={{ color: '#6b7280', marginTop: '5px', display: 'block' }}>
              الحد الأقصى لحجم الصورة: 2 ميجابايت (صيغ مقبولة: JPG, PNG)
            </small>
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%' }}
          disabled={submitting}
        >
          {submitting ? MESSAGES.LOADING.SUBMITTING : 'تقديم طلب الإجازة'}
        </button>
      </form>
      </div>
    </div>
  );
}

export default VacationRequest;
