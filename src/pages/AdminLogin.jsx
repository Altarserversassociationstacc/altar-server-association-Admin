import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';
import { PulseLoader } from 'react-spinners';
import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const sanitizedPayload = {
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/login`, sanitizedPayload);

      if (response.data.success) {
        // Backend returns the admin details inside response.data.data
        const adminData = response.data.data;

        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(adminData));

        if (adminData?.mustChangePassword) {
          navigate('/admin/change-credentials');
        } else {
          navigate('/admin/dashboard');
        }
      }
    } catch (err) {
      console.error("❌ [LOGIN ERROR]:", err.response?.data || err.message);
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-[#110c08] rounded-2xl overflow-hidden border border-[#2a2015] shadow-2xl pb-8">
        
        {/* Header Section */}
        <div className="p-8 pb-4 text-center">
          <h2 className="text-3xl font-serif font-bold tracking-tight text-white mb-2">Login</h2>
          <p className="text-[#c19a6b] text-[10px] font-bold tracking-[0.2em] uppercase">
            Welcome Back, Administrator
          </p>
        </div>

        {/* Form Section */}
        <div className="px-8 pt-4">
          {error && (
            <div className="mb-6 p-3.5 bg-red-900/30 border border-red-800 text-red-200 text-xs rounded-lg text-center font-semibold tracking-wide">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5 border-b border-[#2a2015] pb-8">
            
            {/* Email Field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#c19a6b]">
                <FaEnvelope size={16} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="off"
                placeholder="Email Address"
                className="w-full bg-[#eff4fa] text-gray-900 font-medium text-sm rounded-xl block pl-11 p-4 placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#7c4327]"
              />
            </div>

            {/* Password Field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#c19a6b]">
                <FaLock size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="Password"
                className="w-full bg-[#eff4fa] text-gray-900 font-medium text-sm rounded-xl block pl-11 pr-12 p-4 placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#7c4327]"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#c19a6b] hover:text-[#9a764d] transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-1">
              <button type="button" className="text-[#8c94a3] hover:text-white text-xs font-medium transition-colors">
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full mt-2 bg-[#7c4327] hover:bg-[#63341e] text-white text-xs font-bold uppercase tracking-widest py-4 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              {loading ? <PulseLoader color="#ffffff" size={6} margin={2} /> : <>LOGIN <FaArrowRight size={12} /></>}
            </button>
          </form>

          {/* Footer Area */}
          <div className="mt-6 text-center">
            <p className="text-[#8c94a3] text-[11px] font-medium tracking-wide">
              Secure Administrative Node
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;