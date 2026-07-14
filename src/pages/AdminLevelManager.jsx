import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaUserPlus, FaImage, FaCheckCircle, FaExclamationCircle, 
  FaUpload, FaTrash, FaEdit, FaTimesCircle 
} from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5001';

const LEVEL_OPTIONS = ['100-Level', '200-Level', '300-Level', '400-Level', '500-Level', 'Alumni'];

// Inline modern spinner component for professional loading states
const ButtonSpinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export const AdminLevelManager = () => {
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'photo'
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  
  // Lists & editing tracking states
  const [students, setStudents] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [editingId, setEditingId] = useState(null); 

  // Form 1 State: Add/Edit Student
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    imageUrl: '', 
    skills: '',
    state: '',
    homeOfResidence: '',
    email: '',
    phoneNumber: '',
    level: LEVEL_OPTIONS[0],
    academicYear: ''
  });

  // Form 2 State: Group Photo
  const [photoForm, setPhotoForm] = useState({
    levelName: LEVEL_OPTIONS[0],
    academicYear: '2026/2027',
    imageUrl: '', 
    caption: ''
  });

  // Fetch lists on load
  useEffect(() => {
    fetchStudents();
    fetchPhotos();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/levels/students`);
      const studentList = Array.isArray(res.data) 
        ? res.data 
        : res.data?.data || res.data?.students || [];
      setStudents(studentList);
    } catch (err) {
      console.error("Failed to fetch student list", err);
      setStudents([]);
    }
  };

  const fetchPhotos = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/levels/group-photo`);
      const photoList = Array.isArray(res.data) 
        ? res.data 
        : res.data?.data || res.data?.photos || [];
      setPhotos(photoList);
    } catch (err) {
      console.error("Failed to fetch group photos", err);
      setPhotos([]);
    }
  };

  const handleStudentChange = (e) => {
    setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    setPhotoForm({ ...photoForm, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e, formType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showStatus('error', 'Please upload a valid image file (PNG, JPG, JPEG).');
      return;
    }

    // Defensive check: Prevent local base64 crashes on massive raw files
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      showStatus('error', 'File size exceeds the 5MB limit. Please compress your image.');
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

  const resetStudentForm = () => {
    setStudentForm({
      fullName: '',
      imageUrl: '',
      skills: '',
      state: '',
      homeOfResidence: '',
      email: '',
      phoneNumber: '',
      level: LEVEL_OPTIONS[0],
      academicYear: ''
    });
    setEditingId(null);
  };

  const resetPhotoForm = () => {
    setPhotoForm({
      levelName: LEVEL_OPTIONS[0],
      academicYear: '',
      imageUrl: '',
      caption: ''
    });
    setEditingId(null);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    resetStudentForm();
    resetPhotoForm();
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!studentForm.imageUrl) {
      showStatus('error', 'Please upload a student avatar profile photograph.');
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`${API_BASE_URL}/api/levels/students/${editingId}`, studentForm);
        showStatus('success', 'Student record updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/api/levels/students`, studentForm);
        showStatus('success', `${studentForm.fullName} added successfully to ${studentForm.level}!`);
      }
      resetStudentForm();
      fetchStudents();
    } catch (err) {
      showStatus('error', err.response?.data?.message || 'Failed to save student.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSubmit = async (e) => {
    e.preventDefault();
    if (!photoForm.imageUrl) {
      showStatus('error', 'Please upload an official class assembly group photograph.');
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`${API_BASE_URL}/api/levels/group-photo/${editingId}`, photoForm);
        showStatus('success', 'Group photograph updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/api/levels/group-photo`, photoForm);
        showStatus('success', `Group photo saved for ${photoForm.levelName} (${photoForm.academicYear})!`);
      }
      resetPhotoForm();
      fetchPhotos();
    } catch (err) {
      showStatus('error', err.response?.data?.message || 'Failed to save group photo.');
    } finally {
      setLoading(false);
    }
  };

  const startEditStudent = (student) => {
    setEditingId(student._id || student.id);
    setStudentForm({
      fullName: student.fullName || '',
      imageUrl: student.imageUrl || '',
      skills: student.skills || '',
      state: student.state || '',
      homeOfResidence: student.homeOfResidence || '',
      email: student.email || '',
      phoneNumber: student.phoneNumber || '',
      level: student.level || LEVEL_OPTIONS[0],
      academicYear: student.academicYear || '2026/2027'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditPhoto = (photo) => {
    setEditingId(photo._id || photo.id);
    setPhotoForm({
      levelName: photo.levelName || LEVEL_OPTIONS[0],
      academicYear: photo.academicYear || '2026/2027',
      imageUrl: photo.imageUrl || '',
      caption: photo.caption || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this student record?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/levels/students/${id}`);
      showStatus('success', 'Student record deleted successfully.');
      fetchStudents();
      if (editingId === id) resetStudentForm();
    } catch (err) {
      showStatus('error', 'Could not delete student record.');
    }
  };

  const handleDeletePhoto = async (id) => {
    if (!window.confirm('Are you sure you want to remove this group picture?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/levels/group-photo/${id}`);
      showStatus('success', 'Group photograph deleted successfully.');
      fetchPhotos();
      if (editingId === id) resetPhotoForm();
    } catch (err) {
      showStatus('error', 'Could not delete group photograph.');
    }
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 space-y-6 font-sans max-w-7xl mx-auto px-4 py-6">
      
      {/* Dynamic Status Notifications */}
      {statusMsg.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium transition-all duration-300 shadow-sm animate-fadeIn ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
        }`}>
          {statusMsg.type === 'success' ? <FaCheckCircle className="shrink-0" size={18} /> : <FaExclamationCircle className="shrink-0" size={18} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Modern Horizontal Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800">
        <button
          type="button"
          disabled={loading}
          onClick={() => switchTab('student')}
          className={`flex items-center gap-2 py-4 px-6 font-semibold text-sm border-b-2 transition-all cursor-pointer disabled:opacity-50 ${
            activeTab === 'student'
              ? 'border-amber-700 text-amber-700 dark:border-amber-500 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <FaUserPlus /> Level
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => switchTab('photo')}
          className={`flex items-center gap-2 py-4 px-6 font-semibold text-sm border-b-2 transition-all cursor-pointer disabled:opacity-50 ${
            activeTab === 'photo'
              ? 'border-amber-700 text-amber-700 dark:border-amber-500 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <FaImage /> group Photo 
        </button>
      </div>

      {/* FORM 1: STUDENT ROSTER FORM */}
      {activeTab === 'student' && (
        <div className="space-y-10">
          <form onSubmit={handleStudentSubmit} className="bg-white dark:bg-[#121212] p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                {editingId ? 'Modify Student Directory Record' : 'Enroll New Student Profile'}
              </h2>
              {editingId && (
                <button 
                  type="button" 
                  disabled={loading}
                  onClick={resetStudentForm} 
                  className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors font-medium disabled:opacity-50 cursor-pointer"
                >
                  <FaTimesCircle /> Cancel Edit Mode
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Target Academic Level *</label>
                <select 
                  name="level" 
                  disabled={loading}
                  value={studentForm.level} 
                  onChange={handleStudentChange} 
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 outline-none text-slate-900 dark:text-white transition-all disabled:opacity-60"
                >
                  {LEVEL_OPTIONS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Academic Term Year *</label>
                <input 
                  type="text" 
                  name="academicYear" 
                  placeholder="e.g., 2026/2027" 
                  required 
                  disabled={loading}
                  value={studentForm.academicYear} 
                  onChange={handleStudentChange} 
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 outline-none font-mono text-slate-900 dark:text-white transition-all disabled:opacity-60" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Student Directory Photo *</label>
                {!studentForm.imageUrl ? (
                  <label className={`group flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-900 p-4 text-center transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-amber-700 dark:hover:border-amber-500 cursor-pointer'}`}>
                    <FaUpload className="text-xl text-slate-400 group-hover:text-amber-700 dark:group-hover:text-amber-400 mb-2 transition-colors" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Upload Portrait File</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">PNG, JPG up to 5MB</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      disabled={loading}
                      onChange={(e) => handleImageUpload(e, 'student')} 
                      className="hidden" 
                    />
                  </label>
                ) : (
                  <div className="relative h-48 w-full border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden group shadow-sm">
                    <img src={studentForm.imageUrl} alt="Student preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                      <button 
                        type="button" 
                        disabled={loading}
                        onClick={() => clearImage('student')} 
                        className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 h-fit">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Full Name *</label>
                  <input 
                    type="text" 
                    name="fullName" 
                    required 
                    disabled={loading}
                    placeholder="e.g. John Doe" 
                    value={studentForm.fullName} 
                    onChange={handleStudentChange} 
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 outline-none text-slate-900 dark:text-white transition-all disabled:opacity-60" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Core Tech Stack Skills</label>
                  <input 
                    type="text" 
                    name="skills" 
                    disabled={loading}
                    placeholder="React, Node.js, Express" 
                    value={studentForm.skills} 
                    onChange={handleStudentChange} 
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 outline-none text-slate-900 dark:text-white transition-all disabled:opacity-60" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">State of Origin *</label>
                  <input 
                    type="text" 
                    name="state" 
                    required 
                    disabled={loading}
                    placeholder="e.g., Lagos State" 
                    value={studentForm.state} 
                    onChange={handleStudentChange} 
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 outline-none text-slate-900 dark:text-white transition-all disabled:opacity-60" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Residential Home Address *</label>
                  <input 
                    type="text" 
                    name="homeOfResidence" 
                    required 
                    disabled={loading}
                    placeholder="Complete residential address" 
                    value={studentForm.homeOfResidence} 
                    onChange={handleStudentChange} 
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 outline-none text-slate-900 dark:text-white transition-all disabled:opacity-60" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Official Email Address *</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  disabled={loading}
                  placeholder="student@university.edu" 
                  value={studentForm.email} 
                  onChange={handleStudentChange} 
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 outline-none text-slate-900 dark:text-white transition-all disabled:opacity-60" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Contact Mobile Number *</label>
                <input 
                  type="tel" 
                  name="phoneNumber" 
                  required 
                  disabled={loading}
                  placeholder="+234 800 000 0000" 
                  value={studentForm.phoneNumber} 
                  onChange={handleStudentChange} 
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 outline-none font-mono text-slate-900 dark:text-white transition-all disabled:opacity-60" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-slate-950 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center"
            >
              {loading && <ButtonSpinner />}
              {loading ? 'Saving Changes...' : editingId ? 'Apply Profile Updates' : 'Publish Student Record'}
            </button>
          </form>

          {/* STUDENT HISTORY SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Compiled Student Directory</h3>
              <span className="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 font-semibold px-2.5 py-1 rounded-full">
                Total: {students.length}
              </span>
            </div>
            
            <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#161616] border-b border-slate-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-4 px-6">Profile</th>
                      <th className="py-4 px-6">Name</th>
                      <th className="py-4 px-6">Academic Year</th>
                      <th className="py-4 px-6">Contact & Communications</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-sm">
                    {!Array.isArray(students) || students.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-10 text-slate-400 dark:text-slate-500 font-medium">No student records compiled yet.</td>
                      </tr>
                    ) : (
                      students.map((student) => (
                        <tr key={student._id || student.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="py-4 px-6">
                            <img src={student.imageUrl} alt={student.fullName} className="w-11 h-11 rounded-full object-cover border border-slate-100 dark:border-zinc-800 shadow-sm" />
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-900 dark:text-white">{student.fullName}</div>
                            {student.skills && (
                              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 max-w-xs truncate">{student.skills}</div>
                            )}
                          </td>
                          <td className="py-4 px-6 text-xs">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md font-medium text-[10px] uppercase tracking-wide">
                                {student.level}
                              </span>
                              <span className="font-mono text-slate-400 dark:text-slate-500">{student.academicYear}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-xs space-y-0.5">
                            <div className="text-slate-600 dark:text-slate-300 font-medium">{student.email}</div>
                            <div className="text-slate-400 font-mono">{student.phoneNumber}</div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button 
                                type="button" 
                                disabled={loading}
                                onClick={() => startEditStudent(student)} 
                                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition-all cursor-pointer disabled:opacity-50" 
                                title="Modify Profile"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button 
                                type="button" 
                                disabled={loading}
                                onClick={() => handleDeleteStudent(student._id || student.id)} 
                                className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all cursor-pointer disabled:opacity-50" 
                                title="Remove Profile"
                              >
                                <FaTrash size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORM 2: GROUP PHOTO FORM */}
      {activeTab === 'photo' && (
        <div className="space-y-10">
          <form onSubmit={handlePhotoSubmit} className="bg-white dark:bg-[#121212] p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                {editingId ? 'Modify Assemble Class Portrait Details' : 'Publish Level Assembly Photograph'}
              </h2>
              {editingId && (
                <button 
                  type="button" 
                  disabled={loading}
                  onClick={resetPhotoForm} 
                  className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors font-medium disabled:opacity-50 cursor-pointer"
                >
                  <FaTimesCircle /> Cancel Edit Mode
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Class Section Level *</label>
                <select 
                  name="levelName" 
                  disabled={loading}
                  value={photoForm.levelName} 
                  onChange={handlePhotoChange} 
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 outline-none text-slate-900 dark:text-white transition-all disabled:opacity-60"
                >
                  {LEVEL_OPTIONS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Year of Class Group *</label>
                <input 
                  type="text" 
                  name="academicYear" 
                  placeholder="e.g., 2026/2027" 
                  required 
                  disabled={loading}
                  value={photoForm.academicYear} 
                  onChange={handlePhotoChange} 
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 outline-none font-mono text-slate-900 dark:text-white transition-all disabled:opacity-60" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Official Assemble Group Photograph *</label>
              {!photoForm.imageUrl ? (
                <label className={`group flex flex-col items-center justify-center h-60 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-900 p-6 text-center transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-amber-700 dark:hover:border-amber-500 cursor-pointer'}`}>
                  <FaUpload className="text-2xl text-slate-400 group-hover:text-amber-700 dark:group-hover:text-amber-400 mb-2 transition-colors" />
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Drag & drop your class assembly picture here</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">or click to browse local files</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    disabled={loading}
                    onChange={(e) => handleImageUpload(e, 'photo')} 
                    className="hidden" 
                  />
                </label>
              ) : (
                <div className="relative h-64 w-full border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden group shadow-sm">
                  <img src={photoForm.imageUrl} alt="Assembly group preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <button 
                      type="button" 
                      disabled={loading}
                      onClick={() => clearImage('photo')} 
                      className="p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Banner Caption / Context Narrative (Optional)</label>
              <textarea 
                name="caption" 
                rows="3" 
                disabled={loading}
                placeholder="Briefly describe this assembly group or noteworthy milestones..." 
                value={photoForm.caption} 
                onChange={handlePhotoChange} 
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 outline-none text-slate-900 dark:text-white transition-all disabled:opacity-60"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-slate-950 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center"
            >
              {loading && <ButtonSpinner />}
              {loading ? 'Processing Media File...' : editingId ? 'Update Official Group Photograph' : 'Set Official Class Assembly Photograph'}
            </button>
          </form>

          {/* PHOTOS HISTORY SECTION */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 px-2">Published Class Assembly Banner History</h3>
            
            {!Array.isArray(photos) || photos.length === 0 ? (
              <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500 shadow-sm font-medium">
                No group assembly photos recorded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos.map((photo) => (
                  <div key={photo._id || photo.id} className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-shadow">
                    <div className="relative h-48 w-full bg-slate-100 dark:bg-zinc-900">
                      <img src={photo.imageUrl} alt={`${photo.levelName} Banner`} className="w-full h-full object-cover" />
                      <div className="absolute bottom-3 left-3 bg-slate-950/80 text-white font-mono text-[10px] px-2.5 py-1 rounded-md backdrop-blur-xs font-semibold">
                        {photo.academicYear}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="font-bold text-base text-slate-950 dark:text-slate-100">{photo.levelName}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {photo.caption || 'No summary context descriptions provided.'}
                        </p>
                      </div>
                      <div className="flex items-center justify-end border-t border-slate-100 dark:border-zinc-800/80 pt-3 gap-3">
                        <button 
                          type="button" 
                          disabled={loading}
                          onClick={() => startEditPhoto(photo)} 
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs flex items-center gap-1 px-2 py-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-md transition-all cursor-pointer disabled:opacity-50 font-semibold"
                        >
                          <FaEdit size={13} /> Edit
                        </button>
                        <button 
                          type="button" 
                          disabled={loading}
                          onClick={() => handleDeletePhoto(photo._id || photo.id)} 
                          className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 text-xs flex items-center gap-1 px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md transition-all cursor-pointer disabled:opacity-50 font-semibold"
                        >
                          <FaTrash size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminLevelManager;