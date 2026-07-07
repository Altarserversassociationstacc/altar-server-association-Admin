import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';
import { PulseLoader } from 'react-spinners';
import axios from 'axios';

// Strictly pull from environment configurations without local fallbacks
// .replace(/\/$/, '') removes any trailing slashes to prevent double-slash route errors
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const AdminSignup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // States to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Quick safeguard: warn the user if the environment variable is missing
    if (!API_BASE_URL) {
      setError('System Error: API environment variable is missing. Check hosting configuration.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    // Client-side payload pre-validation check
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/signup`, {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        setSuccess(response.data.message || 'Administrative registration complete.');
        
        // Wipe fields upon successful completion to maintain local security footprint
        setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
        
        setTimeout(() => navigate('/admin/login'), 2500);
      }
    } catch (err) {
      // Safely parse error strings from backend custom validation messages
      setError(err.response?.data?.message || 'Signup operation failed. ');
    } finally {
      setLoading(false);
    }
  };

  const renderInputField = (name, type, placeholder, Icon, required = true) => {
    const isPassword = name === 'password';
    const isConfirmPassword = name === 'confirmPassword';
    const isPasswordField = isPassword || isConfirmPassword;

    // Determine current input type based on visibility state
    let inputType = type;
    if (isPassword) inputType = showPassword ? 'text' : 'password';
    if (isConfirmPassword) inputType = showConfirmPassword ? 'text' : 'password';

    return (
      <div className="relative mb-5 group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:dark:text-[#d2b48c] transition-colors">
          <Icon size={16} />
        </div>
        
        <input
          type={inputType}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          required={required}
          placeholder={placeholder}
          // Added pr-10 if it's a password field to prevent text overlapping with the eye icon
          className={`w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block pl-10 p-3.5 placeholder-gray-400 transition-all outline-none ${isPasswordField ? 'pr-10' : ''}`}
        />
        
        {/* Toggle Eye Icon Button for Password Fields */}
        {isPasswordField && (
          <button
            type="button"
            onClick={() => isPassword ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors focus:outline-none"
          >
            {isPassword ? (
              showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />
            ) : (
              showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-white/5">
        
        {/* Header Branding Container */}
        <div className="p-8 text-center border-b border-gray-700 bg-gray-700/30">
          <h2 className="text-2xl font-bold tracking-tight text-blue-400 uppercase">Admin Signup</h2>
          <p className="text-gray-400 text-xs mt-2 font-medium">Provision a new administrative profile workspace</p>
        </div>

        <div className="p-8">
          {/* Feedback Blocks */}
          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center font-semibold tracking-wide animate-fadeIn">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-3.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-lg text-center font-semibold tracking-wide animate-fadeIn">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-1">
            {renderInputField('fullName', 'text', 'Full Name', FaUser)}
            {renderInputField('email', 'email', 'Email Address', FaEnvelope)}
            {/* The type 'password' here acts as the default, but our logic above will override it to 'text' when clicked */}
            {renderInputField('password', 'password', 'Password', FaLock)}
            {renderInputField('confirmPassword', 'password', 'Confirm Password', FaLock)}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider py-3.5 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <PulseLoader color="#ffffff" size={6} margin={2} />
              ) : (
                <>
                  Register
                  <FaArrowRight size={10} className="text-white/70" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-gray-400 text-xs font-medium tracking-wide">
            Already authenticated?{' '}
            <Link to="/admin/login" className="text-blue-400 hover:text-blue-300 font-bold hover:underline transition-colors ml-1">
              Login here
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminSignup;