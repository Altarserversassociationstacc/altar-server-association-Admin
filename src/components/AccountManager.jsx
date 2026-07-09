import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaUserLock, FaUserCheck, FaUserSlash, FaSearch, 
  FaSyncAlt, FaUserGraduate, FaTrashAlt, FaExclamationTriangle
} from 'react-icons/fa';
import { PulseLoader } from 'react-spinners';

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

export const AccountManager = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const levels = ['All', '100L', '200L', '300L', '400L', '500L'];

  useEffect(() => {
    fetchStudentProfiles();
  }, []);

  const fetchStudentProfiles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/api/admin/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (err) {
      console.error("Failed to fetch student directory:", err);
      setStatusMessage({ type: 'error', text: 'Failed to synchronize member directory.' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (studentId, targetStatus) => {
    setActionLoading(studentId);
    setStatusMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_BASE_URL}/api/admin/update-student-status/${studentId}`, 
        { accountStatus: targetStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStudents(prev => prev.map(student => 
        student._id === studentId ? { ...student, accountStatus: targetStatus } : student
      ));
      setStatusMessage({ type: 'success', text: `Account successfully set to ${targetStatus}.` });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Status update failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  // 🗑️ PERMANENT DELETION LOGIC
  const handleDeleteMember = async (studentId, studentName) => {
    const confirmPhrase = `DELETE ${studentName.toUpperCase()}`;
    const userInput = window.prompt(`CRITICAL ACTION: This will permanently purge this member's attendance, rating, and profile data.\n\nType "${confirmPhrase}" to confirm deletion:`);

    if (userInput !== confirmPhrase) {
      setStatusMessage({ type: 'error', text: 'Deletion aborted. Confirmation phrase did not match.' });
      return;
    }

    setActionLoading(studentId);
    setStatusMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_BASE_URL}/api/admin/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStudents(prev => prev.filter(student => student._id !== studentId));
      setStatusMessage({ type: 'success', text: 'Member record successfully purged from registry.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Deletion request rejected by server.' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (student.regNo && student.regNo.includes(searchQuery));
    const matchesLevel = levelFilter === 'All' || student.currentLevel === levelFilter;
    return matchesSearch && matchesLevel;
  });

  if (loading) return <div className="py-32 text-center"><PulseLoader color="#d2b48c" size={12} /></div>;

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Search & Filter Bar */}
      <div className="bg-[#111111] border border-[#2a1b12] p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={12} />
          <input 
            type="text"
            placeholder="Search records to manage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-[#2a1b12] rounded-xl py-3 pl-12 pr-4 text-xs font-medium focus:border-[#8b4513] text-white outline-none"
          />
        </div>
        <div className="flex bg-black p-1 border border-[#2a1b12] rounded-xl">
          {levels.map(lvl => (
            <button key={lvl} onClick={() => setLevelFilter(lvl)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${levelFilter === lvl ? 'bg-[#1a110b] text-[#d2b48c] border border-[#3d2b1f]' : 'text-gray-500 hover:text-white'}`}>{lvl}</button>
          ))}
        </div>
      </div>

      {statusMessage.text && (
        <div className={`p-4 rounded-xl text-center text-xs font-bold border max-w-xl mx-auto ${statusMessage.type === 'success' ? 'bg-green-950/20 border-green-900/30 text-green-400' : 'bg-red-950/20 border-red-900/30 text-red-400'}`}>
          {statusMessage.text}
        </div>
      )}

      {/* Roster List */}
      <div className="bg-[#111111] border border-[#2a1b12] rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#2a1b12] flex justify-between items-center bg-[#161616]/40">
          <div>
            <h3 className="font-serif text-lg text-[#d2b48c] uppercase tracking-wider">Account Lifecycle Dashboard</h3>
            <p className="text-gray-500 text-2xs uppercase tracking-widest mt-0.5">Control Access Levels and Registry Records</p>
          </div>
          <button onClick={fetchStudentProfiles} className="text-gray-500 hover:text-white"><FaSyncAlt size={12} /></button>
        </div>

        <div className="divide-y divide-[#2a1b12]">
          {filteredStudents.map(student => {
            const isSuspended = student.accountStatus === 'Suspended' || student.accountStatus === 'Locked';
            const isDormant = student.accountStatus === 'Dormant';

            return (
              <div key={student._id} className="p-6 bg-[#0d0d0d]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#1a110b]/10 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`h-11 w-11 rounded-xl border flex items-center justify-center ${isSuspended ? 'bg-red-950/10 border-red-900/30 text-red-400' : isDormant ? 'bg-yellow-950/10 border-yellow-900/30 text-yellow-500' : 'bg-green-950/10 border-green-900/30 text-green-400'}`}><FaUserLock size={16} /></div>
                  <div>
                    <h4 className="text-white text-sm font-medium font-serif group-hover:text-[#d2b48c] transition-colors">{student.fullName}</h4>
                    <p className="text-gray-500 text-2xs font-mono mt-0.5 uppercase tracking-wide">{student.regNo || 'PENDING'} • {student.currentLevel || '100L'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {actionLoading === student._id ? (
                    <div className="px-6"><PulseLoader color="#d2b48c" size={4} /></div>
                  ) : (
                    <>
                      {/* 🗑️ THE DELETE BUTTON */}
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(student._id, student.fullName)}
                        title="Permanently Purge Record"
                        className="p-2.5 rounded-xl border border-red-900/40 bg-red-950/20 text-red-500 hover:bg-red-600 hover:text-white font-bold uppercase transition-all flex items-center gap-1.5"
                      >
                        <FaTrashAlt size={12} />
                        <span className="text-[9px] font-black uppercase tracking-wider hidden md:inline">Delete</span>
                      </button>

                      <button type="button" onClick={() => handleStatusUpdate(student._id, isDormant ? 'Active' : 'Dormant')} className={`p-2.5 rounded-xl border text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${isDormant ? 'bg-green-950/20 border-green-900/30 text-green-400' : 'bg-white/5 border-white/10 text-yellow-500 hover:bg-yellow-900/10'}`}><FaUserGraduate size={12} /> <span className="text-[9px] font-black uppercase tracking-wider hidden md:inline">{isDormant ? 'Activate' : 'Dormant'}</span></button>
                      <button type="button" onClick={() => handleStatusUpdate(student._id, isSuspended ? 'Active' : 'Locked')} className={`p-2.5 rounded-xl border text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${isSuspended ? 'bg-green-950/20 border-green-900/30 text-green-400' : 'bg-white/5 border-white/10 text-red-400 hover:bg-red-900/10'}`}>{isSuspended ? <FaUserCheck size={12} /> : <FaUserSlash size={12} />} <span className="text-[9px] font-black uppercase tracking-wider hidden md:inline">{isSuspended ? 'Unlock' : 'Lock Account'}</span></button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AccountManager;