import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import '../styles/Login.css';
import loginLogoBase64 from '/login-logo-base64.txt?raw';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const companyLogo = `data:image/png;base64,${loginLogoBase64.trim()}`;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // سيتم التوجيه تلقائياً عند نجاح تسجيل الدخول
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      
      // رسائل خطأ مخصصة بالعربية
      switch (error.code) {
        case 'auth/invalid-email':
          setError('البريد الإلكتروني غير صحيح');
          break;
        case 'auth/user-disabled':
          setError('تم تعطيل هذا الحساب');
          break;
        case 'auth/user-not-found':
          setError('المستخدم غير موجود');
          break;
        case 'auth/wrong-password':
          setError('كلمة المرور غير صحيحة');
          break;
        case 'auth/invalid-credential':
          setError('بيانات الدخول غير صحيحة');
          break;
        case 'auth/too-many-requests':
          setError('محاولات كثيرة جداً. يرجى المحاولة لاحقاً');
          break;
        default:
          setError('حدث خطأ أثناء تسجيل الدخول');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="company-logo">
            <img src={companyLogo} alt="شعار الشركة" />
          </div>
          <h1>نظام إدارة الإجازات</h1>
          <p className="company-name">التعمير لإدارة المرافق</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="أدخل البريد الإلكتروني"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">كلمة المرور</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                جاري تسجيل الدخول...
              </>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="help-text">
            في حالة وجود مشكلة في تسجيل الدخول، يرجى التواصل مع قسم تقنية المعلومات
          </p>
        </div>
      </div>
    </div>
  );
}
