import React, { useState } from 'react';
import axios from 'axios';
import { 
  FaUserPlus, FaImage, FaCheckCircle, FaExclamationCircle, 
  FaUpload, FaTrash // <-- Added upload and trash icons
} from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5001';

const LEVEL_OPTIONS = ['100-Level', '200-Level', '300-Level', '400-Level', '500-Level', 'Alumni'];

export const AdminLevelManager = () => {
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'photo'
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // Form 1 State: Add Student
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    imageUrl: '', // Will hold the uploaded image base64 data string
    skills: '',
    state: '',
    homeOfResidence: '',
    email: '',
    phoneNumber: '',
    level: LEVEL_OPTIONS[0],
    academicYear: '2026/2027'
  });

  // Form 2 State: Group Photo
  const [photoForm, setPhotoForm] = useState({
    levelName: LEVEL_OPTIONS[0],
    academicYear: '2026/2027',
    imageUrl: '', // Will hold the uploaded image base64 data string
    caption: ''
  });

  const handleStudentChange = (e) => {
    setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    setPhotoForm({ ...photoForm, [e.target.name]: e.target.value });
  };

  // 📷 Shared File processing framework to parse files to Data URLs
  const handleImageUpload = (e, formType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Guard configuration verifying image payload dimensions/type boundaries
    if (!file.type.startsWith('image/')) {
      showStatus('error', 'Please upload a valid image file (PNG, JPG, JPEG).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (formType === 'student') {
        setStudentForm(prev => ({ ...prev, imageUrl: reader.result }));
      } else {
        setPhotoForm(prev => ({ ...prev, imageUrl: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const clearImage = (formType) => {
    if (formType === 'student') {
      setStudentForm(prev => ({ ...prev, imageUrl: '' }));
    } else {
      setPhotoForm(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const showStatus = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 5000);
  };

  // Submit Student Roster Form
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!studentForm.imageUrl) {
      showStatus('error', 'Please upload a student avatar profile photograph.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/levels/students`, studentForm);
      showStatus('success', `${studentForm.fullName} added successfully to ${studentForm.level}!`);
      setStudentForm({
        ...studentForm,
        fullName: '',
        imageUrl: '',
        skills: '',
        state: '',
        homeOfResidence: '',
        email: '',
        phoneNumber: ''
      });
    } catch (err) {
      showStatus('error', err.response?.data?.message || 'Failed to add student.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Group Photo Form
  const handlePhotoSubmit = async (e) => {
    e.preventDefault();
    if (!photoForm.imageUrl) {
      showStatus('error', 'Please upload an official class assembly group photograph.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/levels/group-photo`, photoForm);
      showStatus('success', `Group photo saved for ${photoForm.levelName} (${photoForm.academicYear})!`);
      setPhotoForm({ ...photoForm, imageUrl: '', caption: '' });
    } catch (err) {
      showStatus('error', err.response?.data?.message || 'Failed to save group photo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-gray-900 dark:text-white space-y-8 font-sans">
      
      {/* Status Notification Alert */}
      {statusMsg.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${
          statusMsg.type === 'success' 
            ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' 
            : 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
        }`}>
          {statusMsg.type === 'success' ? <FaCheckCircle size={18} /> : <FaExclamationCircle size={18} />}
          {statusMsg.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-[#e6d5c3] dark:border-[#2a1b12]">
        <button
          type="button"
          onClick={() => setActiveTab('student')}
          className={`flex items-center gap-2 py-4 px-6 font-serif font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'student'
              ? 'border-[#8b4513] text-[#8b4513] dark:text-[#d2b48c]'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
          }`}
        >
          <FaUserPlus /> Add Student Record
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('photo')}
          className={`flex items-center gap-2 py-4 px-6 font-serif font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'photo'
              ? 'border-[#8b4513] text-[#8b4513] dark:text-[#d2b48c]'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
          }`}
        >
          <FaImage /> Update Group Picture
        </button>
      </div>

      {/* FORM 1: STUDENT ROSTER FORM */}
      {activeTab === 'student' && (
        <form onSubmit={handleStudentSubmit} className="bg-white dark:bg-[#111111] p-8 rounded-[2rem] border border-[#e6d5c3] dark:border-[#2a1b12] shadow-xl space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8b4513] mb-2">Target Level *</label>
              <select name="level" value={studentForm.level} onChange={handleStudentChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-xl p-3 text-sm focus:border-[#8b4513] outline-none text-gray-900 dark:text-white">
                {LEVEL_OPTIONS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8b4513] mb-2">Academic Year *</label>
              <input type="text" name="academicYear" placeholder="e.g., 2026/2027" required value={studentForm.academicYear} onChange={handleStudentChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-xl p-3 text-sm focus:border-[#8b4513] outline-none font-mono text-gray-900 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 🔳 INTERACTIVE DRAG & DROP STUDENT AVATAR UPLOAD BOX CONTAINER */}
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Student Portrait *</label>
              
              {!studentForm.imageUrl ? (
                <label className="group flex flex-col items-center justify-center h-48 border-2 border-dashed border-[#e6d5c3] dark:border-[#2a1b12] hover:border-[#8b4513] dark:hover:border-[#d2b48c] rounded-2xl cursor-pointer bg-gray-50 dark:bg-[#1a1a1a] p-4 text-center transition-all">
                  <FaUpload className="text-xl text-gray-400 group-hover:text-[#8b4513] dark:group-hover:text-[#d2b48c] mb-2 transition-colors" />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Upload Image File</span>
                  <span className="text-[10px] text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'student')} className="hidden" />
                </label>
              ) : (
                <div className="relative h-48 w-full border border-[#e6d5c3] dark:border-[#2a1b12] rounded-2xl overflow-hidden group">
                  <img src={studentForm.imageUrl} alt="Student preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <button type="button" onClick={() => clearImage('student')} className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors cursor-pointer">
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Main Text Content Sub-grid Fields */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 h-fit">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Full Name *</label>
                <input type="text" name="fullName" required placeholder="John Doe" value={studentForm.fullName} onChange={handleStudentChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-xl p-3 text-sm focus:border-[#8b4513] outline-none text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Skills (Comma-separated)</label>
                <input type="text" name="skills" placeholder="React, Node.js, Liturgical Guidance" value={studentForm.skills} onChange={handleStudentChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-xl p-3 text-sm focus:border-[#8b4513] outline-none text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">State of Residence/Origin *</label>
                <input type="text" name="state" required placeholder="e.g., Lagos State" value={studentForm.state} onChange={handleStudentChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-xl p-3 text-sm focus:border-[#8b4513] outline-none text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Home of Residence *</label>
                <input type="text" name="homeOfResidence" required placeholder="Full home address or city area" value={studentForm.homeOfResidence} onChange={handleStudentChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-xl p-3 text-sm focus:border-[#8b4513] outline-none text-gray-900 dark:text-white" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Email Address *</label>
              <input type="email" name="email" required placeholder="student@example.com" value={studentForm.email} onChange={handleStudentChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-xl p-3 text-sm focus:border-[#8b4513] outline-none text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Phone Number *</label>
              <input type="tel" name="phoneNumber" required placeholder="+234 800 000 0000" value={studentForm.phoneNumber} onChange={handleStudentChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-xl p-3 text-sm focus:border-[#8b4513] outline-none font-mono text-gray-900 dark:text-white" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#8b4513] hover:bg-[#a0522d] text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 cursor-pointer">
            {loading ? 'Saving Record...' : 'Publish Student Record'}
          </button>
        </form>
      )}

      {/* FORM 2: GROUP PHOTO FORM */}
      {activeTab === 'photo' && (
        <form onSubmit={handlePhotoSubmit} className="bg-white dark:bg-[#111111] p-8 rounded-[2rem] border border-[#e6d5c3] dark:border-[#2a1b12] shadow-xl space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8b4513] mb-2">Name of the Level *</label>
              <select name="levelName" value={photoForm.levelName} onChange={handlePhotoChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-xl p-3 text-sm focus:border-[#8b4513] outline-none text-gray-900 dark:text-white">
                {LEVEL_OPTIONS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8b4513] mb-2">Year of the Level *</label>
              <input type="text" name="academicYear" placeholder="e.g., 2026/2027" required value={photoForm.academicYear} onChange={handlePhotoChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-xl p-3 text-sm focus:border-[#8b4513] outline-none font-mono text-gray-900 dark:text-white" />
            </div>
          </div>

          {/* 🔳 INTERACTIVE DRAG & DROP WIDE CLASS PHOTOGRAPH DROPZONE */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Group Picture Photograph *</label>
            
            {!photoForm.imageUrl ? (
              <label className="group flex flex-col items-center justify-center h-64 border-2 border-dashed border-[#e6d5c3] dark:border-[#2a1b12] hover:border-[#8b4513] dark:hover:border-[#d2b48c] rounded-2xl cursor-pointer bg-gray-50 dark:bg-[#1a1a1a] p-6 text-center transition-all">
                <FaUpload className="text-2xl text-gray-400 group-hover:text-[#8b4513] dark:group-hover:text-[#d2b48c] mb-3 transition-colors" />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Drag & drop your class assembly picture here</span>
                <span className="text-xs text-gray-400 mt-1">or click to browse local storage directory</span>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'photo')} className="hidden" />
              </label>
            ) : (
              <div className="relative h-64 w-full border border-[#e6d5c3] dark:border-[#2a1b12] rounded-2xl overflow-hidden group shadow-md">
                <img src={photoForm.imageUrl} alt="Assembly group preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                  <button type="button" onClick={() => clearImage('photo')} className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xl transition-colors cursor-pointer">
                    <FaTrash size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Banner Caption / Description (Optional)</label>
            <textarea name="caption" rows="3" placeholder="A brief narrative description of the assembly..." value={photoForm.caption} onChange={handlePhotoChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-xl p-3 text-sm focus:border-[#8b4513] outline-none text-gray-900 dark:text-white"></textarea>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#8b4513] hover:bg-[#a0522d] text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 cursor-pointer">
            {loading ? 'Uploading Photograph...' : 'Set Official Group Photograph'}
          </button>
        </form>
      )}

    </div>
  );
};

export default AdminLevelManager;