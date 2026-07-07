import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaArrowRight } from 'react-icons/fa';
import { PulseLoader } from 'react-spinners';
import axios from 'axios';

// 🌐 ENVIRONMENT CONTEXT GATEWAY
// Automatically defaults to local dev port, swaps dynamically on production deployment
// .replace(/\/$/, '') removes any trailing slashes to prevent double-slash route errors
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const sanitizedPayload = {
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
    };

    // Staging logs automatically suppressed in production logs workflows
    if (import.meta.env.DEV) {
      console.log("⚡ [LOGIN DIAGNOSTIC]: Form submitted. Payload prepared:", sanitizedPayload);
    }

    try {
      // ✅ Production Secure: Dynamically targets local or live servers via API URL configs
      // Because of the regex above, this will perfectly resolve to /api/admin/login without double slashes!
      const response = await axios.post(`${API_BASE_URL}/api/admin/login`, sanitizedPayload);
      
      if (response.data.success) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
        navigate('/admin/dashboard'); 
      }
    } catch (err) {
      // Gracefully captures backend system validations without breaking UI layout structures
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const renderInputField = (name, type, placeholder, Icon) => (
    <div className="relative mb-5 group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-400 transition-colors">
        <Icon size={16} />
      </div>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        required
        placeholder={placeholder}
        className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block pl-10 p-3.5 placeholder-gray-400 transition-all outline-none"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-white/5">
        
        <div className="p-8 text-center border-b border-gray-700 bg-gray-700/30">
          <h2 className="text-2xl font-bold tracking-tight text-blue-400 uppercase">Admin Login</h2>
          <p className="text-gray-400 text-xs mt-2 font-medium">Authenticate administrative session credentials</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center font-semibold tracking-wide">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-1">
            {renderInputField('email', 'email', 'Email Address', FaEnvelope)}
            {renderInputField('password', 'password', 'Password', FaLock)}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider py-3.5 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? <PulseLoader color="#ffffff" size={6} margin={2} /> : <>Secure Sign In <FaArrowRight size={10} /></>}
            </button>
          </form>

          <div className="mt-8 text-center text-gray-400 text-xs font-medium tracking-wide">
            Don't have an admin account?{' '}
            <Link to="/admin/signup" className="text-blue-400 hover:text-blue-300 font-bold hover:underline ml-1">Sign Up</Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;