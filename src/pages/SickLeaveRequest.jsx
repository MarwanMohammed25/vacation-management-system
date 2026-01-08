import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, push, onValue } from 'firebase/database';
import { calculateDays, isDateValid, isOverlapping } from '../utils/dateUtils';
import { VACATION_TYPES, MESSAGES } from '../constants';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

function SickLeaveRequest() {
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
    vacationType: VACATION_TYPES.SICK,
    startDate: '',
    endDate: '',
    days: 1,
    reason: '',
    diagnosis: '',
    hospital: '',
    requestDate: new Date().toISOString().split('T')[0],
    customRequestDate: false
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
      if (file.size > 2 * 1024 * 1024) {
        setToast({ message: 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت', type: 'error' });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          attachment: reader.result,
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

      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        setToast({ message: MESSAGES.ERROR.INVALID_DATES, type: 'error' });
        return;
      }

      if (checkVacationOverlap(formData.employeeId, formData.startDate, formData.endDate)) {
        setToast({ message: MESSAGES.ERROR.OVERLAPPING_VACATION, type: 'error' });
        return;
      }

      // التحقق من الرصيد المتاح للإجازة المرضية
      const currentSickBalance = employee.sickVacation || 0;
      if (currentSickBalance < formData.days) {
        setToast({ 
          message: `رصيد الإجازة المرضية غير كافٍ. الرصيد المتاح: ${currentSickBalance} يوم`, 
          type: 'error' 
        });
        return;
      }

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
        diagnosis: formData.diagnosis,
        hospital: formData.hospital,
        requestDate: formData.requestDate,
        createdAt: new Date().toISOString()
      };
      
      if (formData.attachment) {
        vacationData.attachmentBase64 = formData.attachment;
        vacationData.attachmentName = formData.attachmentName;
      }
      
      await push(vacationsRef, vacationData);

      // خصم الأيام من رصيد الإجازة المرضية
      const employeeRef = ref(database, `employees/${formData.employeeId}`);
      const { update } = await import('firebase/database');
      await update(employeeRef, {
        sickVacation: currentSickBalance - formData.days
      });

      setToast({ message: 'تم تقديم طلب الإجازة المرضية بنجاح', type: 'success' });
      
      setFormData({
        employeeId: '',
        employeeName: '',
        position: '',
        department: '',
        vacationType: VACATION_TYPES.SICK,
        startDate: '',
        endDate: '',
        days: 1,
        reason: '',
        diagnosis: '',
        hospital: '',
        requestDate: new Date().toISOString().split('T')[0],
        customRequestDate: false
      });
    } catch (error) {
      console.error('Error submitting sick leave:', error);
      setToast({ message: MESSAGES.ERROR.GENERIC_ERROR, type: 'error' });
    } finally {
      setSubmitting(false);
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
        <h2 style={{ marginBottom: '20px', color: '#374151', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🏥 تقديم طلب إجازة مرضية
        </h2>
      
        {formData.employeeId && (
          <div style={{ 
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            padding: '20px',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>رصيد الإجازة المرضية</h3>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>
              {employees.find(emp => emp.id === formData.employeeId)?.sickVacation || 0} يوم
            </p>
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
              <label>الوظيفة</label>
              <input
                type="text"
                value={formData.position}
                disabled
                style={{ background: '#f3f4f6' }}
              />
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

            <div className="form-group">
              <label>تاريخ التحرير *</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="date"
                  value={formData.requestDate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    requestDate: e.target.value,
                    customRequestDate: true 
                  }))}
                  required
                  style={{ flex: 1 }}
                />
                {formData.customRequestDate && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      requestDate: new Date().toISOString().split('T')[0],
                      customRequestDate: false
                    }))}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}
                    title="العودة للتاريخ التلقائي (اليوم)"
                  >
                    🔄 تلقائي
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>التشخيص الطبي (اختياري)</label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="مثال: التهاب الجهاز التنفسي"
            />
          </div>

          <div className="form-group">
            <label>المستشفى أو العيادة</label>
            <input
              type="text"
              value={formData.hospital}
              onChange={(e) => setFormData(prev => ({ ...prev, hospital: e.target.value }))}
              placeholder="مثال: مستشفى الكرامة التعليمي"
            />
          </div>

          <div className="form-group">
            <label>ملاحظات إضافية (اختياري)</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              rows="3"
              placeholder="أي ملاحظات إضافية..."
            />
          </div>

          <div className="form-group">
            <label>إرفاق صورة التقرير الطبي * - JPG, PNG</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {!formData.attachment ? (
                <>
                  <input
                    type="file"
                    id="attachment"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileChange}
                    required
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
              الحد الأقصى لحجم الصورة: 2 ميجابايت
            </small>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
            disabled={submitting}
          >
            {submitting ? MESSAGES.LOADING.SUBMITTING : '🏥 تقديم طلب الإجازة المرضية'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SickLeaveRequest;
