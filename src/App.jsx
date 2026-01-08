import React from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Employees from './pages/Employees';
import VacationRequest from './pages/VacationRequest';
import VacationHistory from './pages/VacationHistory';
import MissionRequest from './pages/MissionRequest';
import SickLeaveRequest from './pages/SickLeaveRequest';
import PermissionRequest from './pages/PermissionRequest';

function AppContent() {
  const { isAuthenticated, currentUser, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>منظومة إدارة الإجازات</h1>
        <p>نظام متكامل لإدارة إجازات الموظفين</p>
        <div className="user-info">
          <span className="user-email">{currentUser?.email}</span>
          <button onClick={handleLogout} className="logout-button">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            تسجيل الخروج
          </button>
        </div>
      </div>
      
      <nav className="nav">
        <ul className="nav-links">
          <li>
            <Link to="/">الموظفين</Link>
          </li>
          <li>
            <Link to="/vacation-request">تقديم إجازة</Link>
          </li>
          <li>
            <Link to="/mission-request">💼 تقديم مأمورية</Link>
          </li>
          <li>
            <Link to="/sick-leave">🏥 تقديم مرضية</Link>
          </li>
          <li>
            <Link to="/permission-request">📋 تقديم إذن</Link>
          </li>
          <li>
            <Link to="/vacation-history">📊 السجلات</Link>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
        <Route path="/vacation-request" element={<ProtectedRoute><VacationRequest /></ProtectedRoute>} />
        <Route path="/mission-request" element={<ProtectedRoute><MissionRequest /></ProtectedRoute>} />
        <Route path="/sick-leave" element={<ProtectedRoute><SickLeaveRequest /></ProtectedRoute>} />
        <Route path="/permission-request" element={<ProtectedRoute><PermissionRequest /></ProtectedRoute>} />
        <Route path="/vacation-history" element={<ProtectedRoute><VacationHistory /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
