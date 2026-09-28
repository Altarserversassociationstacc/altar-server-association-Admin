import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import { PulseLoader } from 'react-spinners';
import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

const ChangeCredentials = () => {
  const [formData, setFormData] = useState({ newEmail: '', newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (formData.newPassword.length < 6) {
      return setError('New password must be at least 6 characters long.');
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/change-credentials`,
        {
          newEmail: formData.newEmail.toLowerCase().trim(),
          newPassword: formData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        localStorage.setItem('adminUser', JSON.stringify(response.data.data));
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update credentials. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-white/5">
        
        <div className="p-8 text-center border-b border-gray-700 bg-gray-700/30">
          <h2 className="text-xl font-bold tracking-tight text-amber-400 uppercase">First-Time Setup</h2>
          <p className="text-gray-400 text-xs mt-2 font-medium">Replace default credentials to complete activation</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center font-semibold">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-amber-400">
                <FaEnvelope size={16} />
              </div>
              <input
                type="email"
                name="newEmail"
                value={formData.newEmail}
                onChange={handleChange}
                required
                placeholder="New Official Email"
                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-amber-500 block pl-10 p-3.5 outline-none"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-amber-400">
                <FaLock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                placeholder="New Personal Password"
                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-amber-500 block pl-10 pr-10 p-3.5 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-amber-400 cursor-pointer focus:outline-none"
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-amber-400">
                <FaKey size={16} />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm New Password"
                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-amber-500 block pl-10 pr-10 p-3.5 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-amber-400 cursor-pointer focus:outline-none"
              >
                {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full mt-6 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider py-3.5 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer"
            >
              {loading ? <PulseLoader color="#ffffff" size={6} margin={2} /> : 'Save Credentials & Proceed'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ChangeCredentials;