import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FaCircleNotch, FaSearch, FaHistory, FaCheckCircle, 
  FaExclamationTriangle, FaDownload, FaSave, 
  FaCalendarAlt, FaCheckSquare, FaSquare, FaLock,
  FaEdit, FaTrash, FaTimes, FaCoins, FaUserCheck, FaUserClock
} from 'react-icons/fa';

// 📌 STANDARDIZED CONSTANTS
const ACADEMIC_LEVELS = ['ALL', '100L', '200L', '300L', '400L', '500L'];
const ACADEMIC_YEARS = ['2026/2027', '2025/2026', '2024/2025', '2023/2024', '2005/2006'];
const SESSIONS = ['Harmattan', 'Rain'];
const ACTIVITIES = ['Meeting', 'Practice', 'Cloth Washing'];
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

const checkDuesStatus = (student, currentLevel, currentYear) => {
  if (!student) return false;

  // 1. Target the exact backend structure: sessionClearance array
  if (Array.isArray(student.sessionClearance)) {
    const targetLevel = currentLevel || student.currentLevel;
    const targetYear = currentYear;

    const hasValidClearance = student.sessionClearance.some(clearance => {
      if (!clearance) return false;

      // Check if status is "Unlocked"
      const status = String(clearance.paymentStatus || '').toUpperCase();
      const isUnlocked = ['UNLOCKED', 'PAID', 'SUCCESS', 'COMPLETED'].includes(status);

      // Match against the context passed by your manager component
      const yearMatches = targetYear ? clearance.academicYear === targetYear : false;
      const levelMatches = targetLevel ? clearance.level === targetLevel : false;

      // Returns true if it's unlocked for the correct academic year OR current level
      return isUnlocked && (yearMatches || levelMatches);
    });

    if (hasValidClearance) return true;
  }

  // 2. Fallbacks (in case the database schema differs for older students)
  if (student.hasPaidDues === true || student.duesPaid === true || student.isDuesPaid === true) {
    return true;
  }

  const accountStatus = String(student.paymentStatus || student.accountStatus || '').toUpperCase();
  if (['PAID', 'COMPLETED', 'SUCCESS'].includes(accountStatus)) {
    return true;
  }

  return false;
};

// 🛠️ BULLETPROOF DATE NORMALIZER (Fixes cross-browser "Invalid Date" parsing)
const normalizeToISODate = (dateVal) => {
  if (!dateVal) return '';
  try {
    let cleanVal = dateVal;
    // If it's standard long form text ("Monday, 20 July 2026"), extract the readable date fragment
    if (typeof dateVal === 'string' && dateVal.includes(',')) {
      cleanVal = dateVal.split(',')[1].trim();
    }
    const parsed = new Date(cleanVal);
    if (isNaN(parsed.getTime())) return '';
    
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return '';
  }
};

// ==========================================
// 💡 MODULAR SUB-COMPONENTS
// ==========================================
const FilterSelect = ({ icon: Icon, value, onChange, options, defaultLabel }) => (
  <div className="relative flex items-center w-full">
    {Icon && <Icon className="absolute left-3.5 text-gray-500 pointer-events-none" size={14} />}
    <select
      value={value}
      onChange={onChange}
      className={`w-full bg-[#111111] border border-[#2a1b12] rounded-xl pr-10 py-3 text-xs text-gray-200 focus:outline-none focus:border-[#8b4513] focus:ring-1 focus:ring-[#8b4513]/30 cursor-pointer appearance-none transition-all shadow-inner ${Icon ? 'pl-10' : 'pl-4'}`}
    >
      {defaultLabel && <option value="all">{defaultLabel}</option>}
      {options.map(opt => (
        <option key={opt} value={opt} className="bg-[#0a0a0a] text-gray-200 py-1">{opt}</option>
      ))}
    </select>
    <div className="absolute right-4 pointer-events-none text-gray-500 text-[10px]">▼</div>
  </div>
);

// ==========================================
// 🚀 MAIN ATTENDANCE COMPONENT
// ==========================================
const AdminMeetingManager = () => {
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // 🔍 Consolidated Filter State
  const [filters, setFilters] = useState({
    search: '',
    level: 'ALL',
    dateString: '',
    session: 'Harmattan',
    academicYear: '2025/2026'
  });

  // 🎛️ Creation Form State 
  const [form, setForm] = useState({
    title: ACTIVITIES[0],
    dateString: '',
    academicYear: ACADEMIC_YEARS[0],
    session: SESSIONS[0]
  });

  // ✏️ Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    _id: '',
    title: '',
    academicYear: '',
    session: ''
  });

  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // 🛡️ Auth Token Retrieval Utility
  const getAuthHeaders = useCallback(() => {
    let token = localStorage.getItem('adminToken') || 
                localStorage.getItem('admintoken') || 
                localStorage.getItem('token'); 
    
    if (!token || token === 'null' || token === 'undefined') {
      return { 'Content-Type': 'application/json' };
    }
    token = token.replace(/^"|"$/g, '');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  // Format to human-readable date strings for bulletproof matching
  const formatToLongDate = useCallback((dateVal) => {
    if (!dateVal) return '';
    const dateObj = new Date(dateVal);
    if (isNaN(dateObj.getTime())) return dateVal;
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const structuredDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${dayName}, ${structuredDate}`;
  }, []);

  // Safe ISO date extractor for HTML date input binding
  const extractISODate = useCallback((record) => {
    if (!record) return '';
    const val = record.eventDate || record.date || record.dateString;
    return normalizeToISODate(val);
  }, []);

  // 🔄 Fetch Roster & Attendance Logs
  const fetchData = useCallback(async (signal) => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      setLoading(false);
      return;
    }

    try {
      const [studentsRes, recordsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/students`, { headers, signal }),
        fetch(`${API_BASE_URL}/api/admin/meetings-list`, { headers, signal })
      ]);

      if (studentsRes.ok) {
        const studentData = await studentsRes.json();
        const safeStudents = Array.isArray(studentData) 
          ? studentData 
          : (studentData.students || studentData.data || studentData.users || []);
        setStudents(Array.isArray(safeStudents) ? safeStudents : []);
      } else {
        setStudents([]);
      }

      if (recordsRes.ok) {
        const recordsData = await recordsRes.json();
        const safeRecords = Array.isArray(recordsData) 
          ? recordsData 
          : (recordsData.meetings || recordsData.records || recordsData.data || []);
        setAttendanceRecords(Array.isArray(safeRecords) ? safeRecords : []);
      } else {
        setAttendanceRecords([]);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Could not sync attendance data matrices:", err);
        setStudents([]);
        setAttendanceRecords([]);
      }
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  // 🔄 Smart Date Sync: Auto-selects the first available record when switching Cohorts/Sessions
  useEffect(() => {
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) return;

    const targetYear = filters.academicYear;
    const targetSession = filters.session.toLowerCase();

    // Check if the current chosen date already matches an existing record in this new cohort selection
    const hasMatchingRecord = attendanceRecords.some(r => {
      if (!r) return false;
      const yearMatches = (r.academicYear === targetYear) || (r.year === targetYear);
      const recSession = (r.semester || r.session || '').toLowerCase();
      const sessionMatches = recSession.includes(targetSession);
      
      const rDate = normalizeToISODate(r.eventDate || r.date || r.dateString);
      const fDate = normalizeToISODate(filters.dateString);
      return yearMatches && sessionMatches && rDate === fDate && fDate !== '';
    });

    // If it doesn't match, find the first available record for this specific year/session to serve as default view
    if (!hasMatchingRecord) {
      const fallbackMatch = attendanceRecords.find(r => {
        if (!r) return false;
        const yearMatches = (r.academicYear === targetYear) || (r.year === targetYear);
        const recSession = (r.semester || r.session || '').toLowerCase();
        return yearMatches && recSession.includes(targetSession);
      });

      if (fallbackMatch) {
        const isoDate = extractISODate(fallbackMatch);
        if (isoDate) {
          setFilters(prev => ({ ...prev, dateString: isoDate }));
        }
      } else {
        setFilters(prev => ({ ...prev, dateString: '' }));
      }
    }
  }, [filters.session, filters.academicYear, attendanceRecords, extractISODate]);

  // 🔒 DERIVE ACTIVE RECORD
  const activeRecord = useMemo(() => {
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) return null;

    const targetDateISO = normalizeToISODate(filters.dateString);
    const targetYear = filters.academicYear;
    const targetSession = filters.session.toLowerCase();

    // 1. If user explicitly picked a date, search strictly for that exact date configuration
    if (targetDateISO) {
      return attendanceRecords.find(r => {
        if (!r) return false;
        const yearMatches = (r.academicYear === targetYear) || (r.year === targetYear);
        const recSession = (r.semester || r.session || '').toLowerCase();
        const sessionMatches = recSession.includes(targetSession);
        const recDateISO = normalizeToISODate(r.eventDate || r.date || r.dateString);
        
        return yearMatches && sessionMatches && recDateISO === targetDateISO;
      }) || null;
    }

    // 2. Fall back to tracking the first record matching only the cohort context if date parameter is unassigned
    return attendanceRecords.find(r => {
      if (!r) return false;
      const yearMatches = (r.academicYear === targetYear) || (r.year === targetYear);
      const recSession = (r.semester || r.session || '').toLowerCase();
      return yearMatches && recSession.includes(targetSession);
    }) || null;
  }, [attendanceRecords, filters.dateString, filters.academicYear, filters.session]);

  // 📡 Create Record Handler
  const handleCreateRecord = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!form.dateString) {
      return setFeedback({ type: 'error', message: 'Please select a valid log date.' });
    }

    const headers = getAuthHeaders();
    setActionLoading(true);

    const processedFullDate = formatToLongDate(form.dateString);
    const derivedDay = new Date(form.dateString).toLocaleDateString('en-US', { weekday: 'long' });
    const formattedSemester = form.session.includes('Semester') ? form.session : `${form.session} Semester`;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/meetings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: form.title,
          dateString: processedFullDate,
          eventDate: new Date(form.dateString),
          day: derivedDay,
          academicYear: form.academicYear,
          year: form.academicYear, 
          semester: formattedSemester, 
          session: form.session
        })
      });

      const data = await response.json();

      if (response.ok) {
        const newRecord = data.meeting || data.record || data;
        setAttendanceRecords(prev => Array.isArray(prev) ? [newRecord, ...prev] : [newRecord]);
        
        setFilters(prev => ({ 
          ...prev, 
          session: form.session,
          academicYear: form.academicYear,
          dateString: form.dateString
        }));
        
        setForm({ title: ACTIVITIES[0], dateString: '', academicYear: ACADEMIC_YEARS[0], session: SESSIONS[0] });
        setFeedback({ type: 'success', message: 'Attendance registry initialized successfully! Ready for marking.' });
      } else {
        throw new Error(data.message || 'Failed to initialize registry.');
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // 🗑️ Delete Record Handler
  const handleDeleteRecord = async () => {
    if (!activeRecord) return;
    if (!window.confirm(`Are you sure you want to delete the register for "${activeRecord.title}"? All marked attendance for this date will be permanently lost.`)) return;

    const headers = getAuthHeaders();
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/meetings/${activeRecord._id}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setAttendanceRecords(prev => Array.isArray(prev) ? prev.filter(r => r._id !== activeRecord._id) : []);
        setFeedback({ type: 'success', message: 'Register successfully deleted.' });
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete record.');
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert('An error occurred while deleting the record.');
    }
  };

  // ✏️ Open Edit Modal
  const openEditModal = () => {
    if (!activeRecord) return;
    const cleanSession = (activeRecord.semester || activeRecord.session || 'Harmattan').replace(' Semester', '');
    setEditForm({
      _id: activeRecord._id,
      title: activeRecord.title,
      academicYear: activeRecord.academicYear || ACADEMIC_YEARS[0],
      session: cleanSession
    });
    setIsEditModalOpen(true);
  };

  // 💾 Submit Edit Updates
  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    const formattedSemester = editForm.session.includes('Semester') ? editForm.session : `${editForm.session} Semester`;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/meetings/${editForm._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          title: editForm.title,
          academicYear: editForm.academicYear,
          semester: formattedSemester,
          session: editForm.session
        })
      });

      if (res.ok) {
        const updated = await res.json();
        const updatedRec = updated.meeting || updated.record || updated;
        setAttendanceRecords(prev => Array.isArray(prev) ? prev.map(r => r._id === updatedRec._id ? updatedRec : r) : [updatedRec]);
        setFilters(prev => ({ ...prev, session: editForm.session, academicYear: editForm.academicYear }));
        setIsEditModalOpen(false);
        setFeedback({ type: 'success', message: 'Register updated successfully!' });
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update record.');
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  // 🎯 Toggle Individual Member Attendance
  const handleToggleAttendance = async (studentId) => {
    if (!activeRecord) return;
    const headers = getAuthHeaders();

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/meetings/${activeRecord._id}/toggle-attendance`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ studentId })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedRec = data.meeting || data.record || data;
        setAttendanceRecords(prev => Array.isArray(prev) ? prev.map(r => r._id === activeRecord._id ? updatedRec : r) : [updatedRec]);
      }
    } catch (err) {
      console.error("Attendance synchronization failed:", err);
    }
  };

  // ⚡ Dynamic filter mapping matrix
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return students.filter(student => {
      if (!student || !student.fullName) return false;
      const matchesLevel = filters.level === 'ALL' || (student.currentLevel || '100L') === filters.level;
      const matchesSearch = student.fullName.toLowerCase().includes(filters.search.toLowerCase()) || 
                            (student.regNo && student.regNo.toLowerCase().includes(filters.search.toLowerCase()));
      return matchesLevel && matchesSearch;
    });
  }, [students, filters.level, filters.search]);

  // CSV Export utility
  const exportToCSV = () => {
    if (filteredStudents.length === 0 || !activeRecord) return;
    const headers = ["Student Name", "Registration Number", "Academic Level", "Dues Unlocked", "Date", "Session", "Presence State"];
    const escapeCSV = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

    const csvContent = [
      headers.join(","),
      ...filteredStudents.map(student => {
        const isPresent = activeRecord.attendanceList?.includes(student._id);
        const isDuesPaid = checkDuesStatus(student, student.currentLevel, activeRecord.academicYear);
        return [
          escapeCSV(student.fullName),
          escapeCSV(student.regNo || 'N/A'),
          escapeCSV(student.currentLevel || 'N/A'),
          escapeCSV(isDuesPaid ? "YES (Unlocked)" : "NO (Locked)"),
          escapeCSV(activeRecord.dateString || 'N/A'),
          escapeCSV(activeRecord.session || activeRecord.semester || 'N/A'),
          escapeCSV(isPresent ? "Present" : "Absent")
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_ledger_${filters.session}_${filters.academicYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <FaCircleNotch className="animate-spin text-[#d2b48c] mb-4" size={32} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d2b48c] animate-pulse">Syncing Payment Ledger & Attendance Matrix...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] text-gray-100 font-sans min-h-screen w-full p-4 md:p-6 transition-all relative">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* REGISTRY INITIALIZATION FORM */}
        <div className="bg-[#0a0a0a] border border-[#3d2b1f] rounded-2xl p-6 md:p-8 shadow-2xl max-w-2xl mx-auto">
          <div className="border-b border-[#2a1b12] pb-4 mb-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#d2b48c] flex items-center gap-2.5">
              <FaCalendarAlt className="text-[#8b4513]" size={14} /> Step 1: Initialize Meeting Register
            </h3>
          </div>
          <form onSubmit={handleCreateRecord} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2">1. Activity Title</label>
                <FilterSelect value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} options={ACTIVITIES} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2">2. Calendar Date</label>
                <input type="date" required value={form.dateString} onChange={(e) => setForm(prev => ({ ...prev, dateString: e.target.value }))} className="w-full bg-[#111111] border border-[#2a1b12] text-xs rounded-xl px-4 py-3 text-gray-200 focus:outline-none focus:border-[#8b4513] transition-all" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2">3. Academic Year</label>
                <FilterSelect value={form.academicYear} onChange={(e) => setForm(prev => ({ ...prev, academicYear: e.target.value }))} options={ACADEMIC_YEARS} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2">4. Academic Session</label>
                <FilterSelect value={form.session} onChange={(e) => setForm(prev => ({ ...prev, session: e.target.value }))} options={SESSIONS} />
              </div>
            </div>
            <button type="submit" disabled={actionLoading} className="w-full mt-4 bg-gradient-to-r from-[#8b4513] to-[#a0522d] hover:from-[#a0522d] hover:to-[#8b4513] text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg">
              {actionLoading ? <><FaCircleNotch className="animate-spin" size={14} /> Initializing...</> : <><FaSave size={14} /> Initialize Register & Start Marking</>}
            </button>
          </form>
          {feedback.message && (
            <div className={`mt-5 p-3.5 rounded-xl text-xs border flex items-center gap-2.5 ${feedback.type === 'success' ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' : 'bg-rose-950/30 border-rose-900/50 text-rose-400'}`}>
              {feedback.type === 'success' ? <FaCheckCircle className="text-emerald-500" /> : <FaExclamationTriangle className="text-rose-500" />}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>

        {/* WORKSPACE LEDGER & MARKING ZONE */}
        <div className="space-y-6">
          {/* 🎛️ TOP CONTROL FILTERS WORKSPACE */}
          <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-[#2a1b12] space-y-4 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest font-black text-gray-500 block">Search Student</label>
                <div className="relative">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                  <input 
                    type="text" 
                    placeholder="Name or Reg No..." 
                    value={filters.search}
                    onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full bg-[#111111] border border-[#2a1b12] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8b4513] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest font-black text-gray-500 block">Level Cohort</label>
                <FilterSelect 
                  value={filters.level} 
                  onChange={e => setFilters(prev => ({ ...prev, level: e.target.value }))} 
                  options={ACADEMIC_LEVELS} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest font-black text-gray-500 block">Date Record</label>
                <input 
                  type="date" 
                  value={filters.dateString}
                  onChange={e => setFilters(prev => ({ ...prev, dateString: e.target.value }))}
                  className="w-full bg-[#111111] border border-[#2a1b12] rounded-xl px-4 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-[#8b4513] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest font-black text-gray-500 block">Session Term</label>
                <FilterSelect 
                  value={filters.session} 
                  onChange={e => setFilters(prev => ({ ...prev, session: e.target.value }))} 
                  options={SESSIONS} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest font-black text-gray-500 block">Academic Year</label>
                <FilterSelect 
                  value={filters.academicYear} 
                  onChange={e => setFilters(prev => ({ ...prev, academicYear: e.target.value }))} 
                  options={ACADEMIC_YEARS} 
                />
              </div>

            </div>

            <div className="pt-2 flex justify-between items-center text-xs border-t border-[#1a110b]">
              <div className="text-gray-500 text-[11px]">
                Active Sheet: {activeRecord ? (
                  <span className="text-[#d2b48c] font-bold">{activeRecord.title} ({activeRecord.dateString}) — Unlocked for Marking</span>
                ) : (
                  <span className="text-rose-500 font-bold">⚠️ NO REGISTER FOR THIS SELECTED DATE. Please Initialize Above.</span>
                )}
              </div>
            </div>
          </div>

          {/* STUDENTS TABLE WITH DUES LOCKING MECHANICS */}
          <div className="bg-[#0a0a0a] border border-[#2a1b12] rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#2a1b12] bg-[#111111]/80 text-[10px] uppercase tracking-widest text-gray-400">
                    <th className="p-4 whitespace-nowrap">Enrollment & Dues Status</th>
                    <th className="p-4 text-center whitespace-nowrap w-64 bg-white/5">Status Toggle (Review & Mark)</th>
                    <th className="p-4 whitespace-nowrap">Date</th>
                    <th className="p-4 whitespace-nowrap">Session</th>
                    <th className="p-4 text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a110b]">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => {
                      const isPresent = activeRecord?.attendanceList?.includes(student._id);
                      
                      // 🔒 EVALUATE DUES STATUS FOR THIS STUDENT
                      const isDuesPaid = checkDuesStatus(student, student.currentLevel, activeRecord?.academicYear || filters.academicYear);
                      const isLocked = !activeRecord || !isDuesPaid;

                      return (
                        <tr key={student._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="font-bold text-gray-200">{student.fullName}</div>
                                <div className="text-[10px] text-gray-500">{student.regNo || 'No Reg Number'} • {student.currentLevel || '100L'}</div>
                              </div>
                              {/* 🪙 Dues Payment Badge */}
                              <div className="shrink-0">
                                {isDuesPaid ? (
                                  <span title="Session Dues Verified & Paid" className="inline-flex items-center gap-1 bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                    <FaCoins size={9} className="text-[#d2b48c]" /> Unlocked
                                  </span>
                                ) : (
                                  <span title="Session Dues Outstanding" className="inline-flex items-center gap-1 bg-amber-950/40 text-amber-400 border border-amber-800/50 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                    <FaLock size={8} className="text-amber-500" /> Dues Required
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center bg-white/5 border-x border-[#1a110b]">
                            <button
                              onClick={() => !isLocked && handleToggleAttendance(student._id)}
                              disabled={isLocked}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                                isLocked
                                  ? 'bg-gray-900/50 text-gray-600 cursor-not-allowed border border-gray-800/50'
                                  : isPresent
                                    ? 'bg-[#1a110b] border border-[#8b4513] text-[#d2b48c] shadow-[0_0_10px_rgba(139,69,19,0.2)]'
                                    : 'bg-[#111111] border border-[#2a1b12] text-gray-500 hover:border-gray-600'
                              }`}
                            >
                              {isLocked ? (
                                <><FaLock size={10} /> Locked</>
                              ) : isPresent ? (
                                <><FaCheckSquare size={12} /> Present</>
                              ) : (
                                <><FaSquare size={12} /> Absent</>
                              )}
                            </button>
                          </td>
                          <td className="p-4 text-gray-400">
                            {activeRecord ? activeRecord.dateString : '—'}
                          </td>
                          <td className="p-4 text-gray-400">
                            {activeRecord ? (activeRecord.session || activeRecord.semester) : '—'}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button className="text-gray-500 hover:text-[#d2b48c] transition-colors" title="View Student Ledger">
                                <FaUserClock size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        <FaUserCheck size={24} className="mx-auto mb-3 opacity-20" />
                        <p>No students found matching your filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* BOTTOM ACTION BAR (Edit/Delete Current Record) */}
          {activeRecord && (
            <div className="mt-4 flex justify-end gap-3">
              <button 
                onClick={openEditModal}
                className="flex items-center gap-2 px-4 py-2 bg-[#111111] text-gray-300 border border-[#2a1b12] hover:border-[#8b4513] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <FaEdit size={12} /> Edit Record
              </button>
              <button 
                onClick={handleDeleteRecord}
                className="flex items-center gap-2 px-4 py-2 bg-rose-950/20 text-rose-500 border border-rose-900/30 hover:bg-rose-950/40 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <FaTrash size={12} /> Delete Record
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ✏️ EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-[#3d2b1f] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[#2a1b12]">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#d2b48c] flex items-center gap-2">
                <FaEdit className="text-[#8b4513]" /> Edit Register Setup
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <FaTimes size={16} />
              </button>
            </div>
            <form onSubmit={handleUpdateRecord} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2">Activity Title</label>
                <input 
                  type="text" 
                  required 
                  value={editForm.title} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))} 
                  className="w-full bg-[#111111] border border-[#2a1b12] text-xs rounded-xl px-4 py-3 text-gray-200 focus:outline-none focus:border-[#8b4513] transition-all" 
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2">Academic Year</label>
                <FilterSelect 
                  value={editForm.academicYear} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, academicYear: e.target.value }))} 
                  options={ACADEMIC_YEARS} 
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2">Session</label>
                <FilterSelect 
                  value={editForm.session} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, session: e.target.value }))} 
                  options={SESSIONS} 
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-[#111111] text-gray-300 border border-[#2a1b12] hover:bg-[#1a1a1a] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-[#8b4513] to-[#a0522d] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-[#8b4513]/20 transition-all">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMeetingManager;