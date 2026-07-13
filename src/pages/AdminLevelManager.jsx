import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaUserPlus, FaImage, FaCheckCircle, FaExclamationCircle, 
  FaUpload, FaTrash, FaEdit, FaTimesCircle // <-- Added FaEdit and FaTimesCircle
} from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5001';

const LEVEL_OPTIONS = ['100-Level', '200-Level', '300-Level', '400-Level', '500-Level', 'Alumni'];

export const AdminLevelManager = () => {
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'photo'
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  
  // History lists & editing tracking states
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
    academicYear: '2026/2027'
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
      setStudents(res.data || []);
    } catch (err) {
      console.error("Failed to fetch student list", err);
    }
  };

  const fetchPhotos = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/levels/group-photo`);
      setPhotos(res.data || []);
    } catch (err) {
      console.error("Failed to fetch group photos", err);
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
      academicYear: '2026/2027'
    });
    setEditingId(null);
  };

  const resetPhotoForm = () => {
    setPhotoForm({
      levelName: LEVEL_OPTIONS[0],
      academicYear: '2026/2027',
      imageUrl: '',
      caption: ''
    });
    setEditingId(null);
  };

  // Submit Student Roster Form (Handles POST and PUT)
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

  // Submit Group Photo Form (Handles POST and PUT)
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

  // Action Triggers for History Lists
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
          onClick={() => { setActiveTab('student'); setEditingId(null); }}
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
          onClick={() => { setActiveTab('photo'); setEditingId(null); }}
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
        <div className="space-y-12">
          <form onSubmit={handleStudentSubmit} className="bg-white dark:bg-[#111111] p-8 rounded-[2rem] border border-[#e6d5c3] dark:border-[#2a1b12] shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-serif font-bold text-[#8b4513] dark:text-[#d2b48c]">
                {editingId ? 'Edit Student Details' : 'Register New Student Profile'}
              </h2>
              {editingId && (
                <button type="button" onClick={resetStudentForm} className="text-xs flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors">
                  <FaTimesCircle /> Cancel Editing
                </button>
              )}
            </div>

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

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 h-fit">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Full Name *</label>
                  <input type="text" name="fullName" required placeholder="John Doe" value={studentForm.fullName} onChange={handleStudentChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-xl p-3 text-sm focus:border-[#8b4513] outline-none text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Skills (Comma-separated)</label>
                  <input type="text" name="skills" placeholder="React, Node.js" value={studentForm.skills} onChange={handleStudentChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-xl p-3 text-sm focus:border-[#8b4513] outline-none text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">State of Origin *</label>
                  <input type="text" name="state" required placeholder="e.g., Lagos State" value={studentForm.state} onChange={handleStudentChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-xl p-3 text-sm focus:border-[#8b4513] outline-none text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Home of Residence *</label>
                  <input type="text" name="homeOfResidence" required placeholder="Full home address" value={studentForm.homeOfResidence} onChange={handleStudentChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-xl p-3 text-sm focus:border-[#8b4513] outline-none text-gray-900 dark:text-white" />
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
              {loading ? 'Saving Record...' : editingId ? 'Update Student Record' : 'Publish Student Record'}
            </button>
          </form>

          {/* 📋 STUDENT HISTORY SECTION */}
          <div className="space-y-4">
            <h3 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-200 px-2">Registered Students History</h3>
            <div className="bg-white dark:bg-[#111111] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-[2rem] overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[#161616] border-b border-[#e6d5c3] dark:border-[#2a1b12] text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      <th className="py-4 px-6">Avatar</th>
                      <th className="py-4 px-6">Name</th>
                      <th className="py-4 px-6">Level / Year</th>
                      <th className="py-4 px-6">Email / Phone</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#1d140e] text-sm">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-400 font-medium">No student records compiled yet.</td>
                      </tr>
                    ) : (
                      students.map((student) => (
                        <tr key={student._id || student.id} className="hover:bg-gray-50/50 dark:hover:bg-[#161616]/30 transition-colors">
                          <td className="py-4 px-6">
                            <img src={student.imageUrl} alt={student.fullName} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-800" />
                          </td>
                          <td className="py-4 px-6 font-semibold">{student.fullName}</td>
                          <td className="py-4 px-6 text-xs">
                            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-md font-medium mr-2">{student.level}</span>
                            <span className="font-mono text-gray-500">{student.academicYear}</span>
                          </td>
                          <td className="py-4 px-6 text-xs space-y-0.5">
                            <div className="text-gray-600 dark:text-gray-300">{student.email}</div>
                            <div className="text-gray-400 font-mono">{student.phoneNumber}</div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-4">
                              <button type="button" onClick={() => startEditStudent(student)} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 p-1 cursor-pointer transition-colors" title="Edit Record">
                                <FaEdit size={16} />
                              </button>
                              <button type="button" onClick={() => handleDeleteStudent(student._id || student.id)} className="text-red-600 hover:text-red-700 dark:text-red-400 p-1 cursor-pointer transition-colors" title="Delete Record">
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
        <div className="space-y-12">
          <form onSubmit={handlePhotoSubmit} className="bg-white dark:bg-[#111111] p-8 rounded-[2rem] border border-[#e6d5c3] dark:border-[#2a1b12] shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-serif font-bold text-[#8b4513] dark:text-[#d2b48c]">
                {editingId ? 'Edit Group Portrait Info' : 'Upload Level Group Photograph'}
              </h2>
              {editingId && (
                <button type="button" onClick={resetPhotoForm} className="text-xs flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors">
                  <FaTimesCircle /> Cancel Editing
                </button>
              )}
            </div>

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
              {loading ? 'Uploading Photograph...' : editingId ? 'Update Official Group Photograph' : 'Set Official Group Photograph'}
            </button>
          </form>

          {/* 📋 PHOTOS HISTORY SECTION */}
          <div className="space-y-4">
            <h3 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-200 px-2">Assembly Banner Gallery History</h3>
            {photos.length === 0 ? (
              <div className="bg-white dark:bg-[#111111] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-[2rem] p-12 text-center text-gray-400 shadow-md font-medium">
                No group assembly photos recorded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos.map((photo) => (
                  <div key={photo._id || photo.id} className="bg-white dark:bg-[#111111] border border-[#e6d5c3] dark:border-[#2a1b12] rounded-[2rem] overflow-hidden shadow-md flex flex-col group hover:shadow-lg transition-shadow">
                    <div className="relative h-44 w-full bg-gray-100 dark:bg-zinc-900">
                      <img src={photo.imageUrl} alt={`${photo.levelName} Banner`} className="w-full h-full object-cover" />
                      <div className="absolute bottom-3 left-3 bg-black/70 text-white font-mono text-[10px] px-2 py-0.5 rounded backdrop-blur-xs">
                        {photo.academicYear}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="font-serif font-bold text-base text-[#8b4513] dark:text-[#d2b48c]">{photo.levelName}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {photo.caption || 'No description provided.'}
                        </p>
                      </div>
                      <div className="flex items-center justify-end border-t border-gray-100 dark:border-zinc-800 pt-3 gap-4">
                        <button type="button" onClick={() => startEditPhoto(photo)} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm flex items-center gap-1 transition-colors cursor-pointer" title="Edit Picture Meta">
                          <FaEdit size={14} /> <span className="text-xs font-semibold">Edit</span>
                        </button>
                        <button type="button" onClick={() => handleDeletePhoto(photo._id || photo.id)} className="text-red-600 hover:text-red-700 dark:text-red-400 text-sm flex items-center gap-1 transition-colors cursor-pointer" title="Remove Picture">
                          <FaTrash size={13} /> <span className="text-xs font-semibold">Delete</span>
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