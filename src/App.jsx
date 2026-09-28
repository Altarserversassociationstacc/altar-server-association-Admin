import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import ChangeCredentials from './pages/ChangeCredentials';
import Dashboard from './pages/Dashboard';
import axios from 'axios';

// 📡 Global Axios interceptor for automated expired token session cleanups
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // DO NOT refresh or redirect if the request came from the login endpoint itself
    const isLoginEndpoint = error.config?.url?.includes('/api/admin/login');

    if (error.response && error.response.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

/**
 * 🛡️ PROTECTED ROUTE GUARD
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * 📋 ADMINISTRATIVE CORE LAYOUT
 */
const AdminLayout = ({ children }) => {
  return (
    <div className="w-screen h-[100dvh] overflow-hidden bg-[#050505]">
      {children}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTE */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* PROTECTED ROUTES */}
        <Route 
          path="/admin/change-credentials" 
          element={
            <ProtectedRoute>
              <ChangeCredentials />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />

        {/* FALLBACK ROUTING */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;