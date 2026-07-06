import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import AdminSignup from './pages/AdminSignup';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import axios from 'axios';

// 📡 Global Axios interceptor for automated expired token session cleanups
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (import.meta.env.DEV) {
        console.warn("🚨 [ROUTER DIAGNOSTIC]: caught 401 Unauthorized. Purging storage.");
      }
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

/**
 * 🛡️ PROTECTED ROUTE GUARD
 * Intercepts unauthenticated clients and redirects safely to the login portal.
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
 * Clean shell layout container. Padding and margins have been removed so the 
 * internal Dashboard component can control its own edge-to-edge rendering.
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
        {/* ========================================== */}
        {/* PUBLIC ACCESSIBLE CHANNELS                 */}
        {/* ========================================== */}
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ========================================== */}
        {/* PROTECTED WORKSPACE ENTRIES                */}
        {/* ========================================== */}
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

        {/* ========================================== */}
        {/* CORE FALLBACK INTERCEPT ROUTING CONTROLS   */}
        {/* ========================================== */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;