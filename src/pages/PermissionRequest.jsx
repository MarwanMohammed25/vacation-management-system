import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, push, onValue } from 'firebase/database';
import { isDateValid } from '../utils/dateUtils';
import { VACATION_TYPES, MESSAGES } from '../constants';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

function PermissionRequest() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    position: '',
    department: '',
    vacationType: VACATION_TYPES.PERMISSION,
    permissionDate: '',
    startTime: '',
    endTime: '',
    duration: '',
    reason: '',
    requestDate: new Date().toISOString().split('T')[0],
    customRequestDate: false
  });

  useEffect(() => {
    const employeesRef = ref(database, 'employees');
    
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

    return () => {
      unsubscribeEmployees();
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

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (end <= start) return 'وقت غير صحيح';
    
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0 && minutes > 0) {
      return `${hours} ساعة و ${minutes} دقيقة`;
    } else if (hours > 0) {
      return `${hours} ساعة`;
    } else {
      return `${minutes} دقيقة`;
    }
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      const startTime = name === 'startTime' ? value : prev.startTime;
      const endTime = name === 'endTime' ? value : prev.endTime;
      newData.duration = calculateDuration(startTime, endTime);
      return newData;
    });
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

      if (formData.duration === 'وقت غير صحيح' || !formData.duration) {
        setToast({ message: 'الرجاء إدخال أوقات صحيحة', type: 'error' });
        return;
      }

      const vacationsRef = ref(database, 'vacations');
      const permissionData = {
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        position: formData.position,
        department: formData.department,
        vacationType: formData.vacationType,
        permissionDate: formData.permissionDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: formData.duration,
        reason: formData.reason,
        requestDate: formData.requestDate,
        createdAt: new Date().toISOString(),
        // للتوافق مع نظام الإجازات
        startDate: formData.permissionDate,
        endDate: formData.permissionDate,
        days: 0 // الإذن لا يحسب بالأيام
      };
      
      await push(vacationsRef, permissionData);

      setToast({ message: 'تم تقديم طلب الإذن بنجاح', type: 'success' });
      
      setFormData({
        employeeId: '',
        employeeName: '',
        position: '',
        department: '',
        vacationType: VACATION_TYPES.PERMISSION,
        permissionDate: '',
        startTime: '',
        endTime: '',
        duration: '',
        reason: '',
        requestDate: new Date().toISOString().split('T')[0],
        customRequestDate: false
      });
    } catch (error) {
      console.error('Error submitting permission:', error);
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
          📋 تقديم طلب إذن
        </h2>
      
        <div style={{ 
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          padding: '20px',
          borderRadius: '12px',
          color: 'white',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>الإذن</h3>
          <p style={{ margin: 0, fontSize: '18px', opacity: 0.9 }}>
            لا يحتسب من رصيد الإجازات - إذن لساعات محددة
          </p>
        </div>

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
              <label>اليوم *</label>
              <input
                type="date"
                name="permissionDate"
                value={formData.permissionDate}
                onChange={(e) => setFormData(prev => ({ ...prev, permissionDate: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>من الساعة *</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleTimeChange}
                required
              />
            </div>

            <div className="form-group">
              <label>إلى الساعة *</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleTimeChange}
                required
              />
            </div>

            <div className="form-group">
              <label>المدة</label>
              <input
                type="text"
                value={formData.duration}
                disabled
                style={{ 
                  background: '#f3f4f6', 
                  fontWeight: 'bold', 
                  fontSize: '16px',
                  color: formData.duration === 'وقت غير صحيح' ? '#dc2626' : '#059669'
                }}
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
            <label>سبب طلب الإذن (اختياري)</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              rows="4"
              placeholder="اكتب سبب طلب الإذن..."
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}
            disabled={submitting}
          >
            {submitting ? MESSAGES.LOADING.SUBMITTING : '📋 تقديم طلب الإذن'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PermissionRequest;
