import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaCalendarAlt, FaCheckSquare, FaSquare, FaSearch, FaSyncAlt, 
  FaLayerGroup, FaUserLock, FaUsers, FaChartPie, FaFilter, FaHistory, FaCalendarPlus
} from 'react-icons/fa';
import { PulseLoader } from 'react-spinners';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const AdminMeetingManager = () => {
  const [students, setStudents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [activeLevelTab, setActiveLevelTab] = useState('100L');
  
  // ✅ UPDATED: Default semester matches the backend exactly
  const [semesterFilter, setSemesterFilter] = useState('Harmattan Semester');
  
  // Local form attributes matching your standard initial state configurations
  const [newMeetingForm, setNewMeetingForm] = useState({
    title: '',
    dateString: '', // Stores standard HTML layout format 'YYYY-MM-DD' locally
    day: 'Saturday',
    semester: 'Harmattan Semester' // ✅ UPDATED
  });

  const levels = ['100L', '200L', '300L', '400L', '500L'];

  useEffect(() => {
    fetchCoreData();
  }, []);

  // Hot-refresh data streams when semester filter changes to prevent state desync
  useEffect(() => {
    const latest = meetings.find(m => m.semester === semesterFilter);
    if (latest) {
      setSelectedMeetingId(latest._id);
    } else {
      setSelectedMeetingId('');
    }
  }, [semesterFilter, meetings]);

  const fetchCoreData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [studentsRes, meetingsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/students`, config),
        axios.get(`${API_BASE_URL}/api/admin/meetings-list`, config)
      ]);
      
      setStudents(studentsRes.data);
      setMeetings(meetingsRes.data);
      
      const latest = meetingsRes.data.find(m => m.semester === semesterFilter) || meetingsRes.data[0];
      if (latest) setSelectedMeetingId(latest._id);
    } catch (err) {
      console.error("Data synchronization error inside meeting lists:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🛠️ ROBUST FORMATTING UTILITY: Translates native date inputs into elegant ledger text strings
  const formatToLongDate = (dateVal, dayName) => {
    if (!dateVal) return '';
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const dateObj = new Date(dateVal);
    
    // Fallback gate check if parsing hits internal exceptions
    if (isNaN(dateObj.getTime())) return dateVal;
    
    const structuredDate = dateObj.toLocaleDateString('en-GB', options);
    return `${dayName}, ${structuredDate}`; // Produces exactly: "Saturday, 27 April 2026"
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!newMeetingForm.title.trim() || !newMeetingForm.dateString.trim()) return;
    setActionLoading(true);

    // Formats the picker input into your precise required long-form text right before transmitting
    const processedFullDate = formatToLongDate(newMeetingForm.dateString, newMeetingForm.day);

    const payload = {
      title: newMeetingForm.title.trim(),
      dateString: processedFullDate, // Verified full text data stream saves cleanly
      day: newMeetingForm.day,
      semester: newMeetingForm.semester
    };

    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${API_BASE_URL}/api/admin/meetings`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMeetings([res.data.meeting, ...meetings]);
      setSelectedMeetingId(res.data.meeting._id);
      setSemesterFilter(newMeetingForm.semester);
      
      setNewMeetingForm({ 
        title: '', 
        dateString: '', 
        day: 'Saturday', 
        semester: 'Harmattan Semester' // ✅ UPDATED reset state
      });
    } catch (err) {
      console.error("Failed to generate meeting matrix item:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAttendance = async (studentId) => {
    if (!selectedMeetingId) return;
    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const res = await axios.put(`${API_BASE_URL}/api/admin/meetings/${selectedMeetingId}/toggle-attendance`, {
        studentId
      }, config);
      
      setMeetings(meetings.map(m => m._id === selectedMeetingId ? res.data.meeting : m));
      
      const studentSync = await axios.get(`${API_BASE_URL}/api/admin/students`, config);
      setStudents(studentSync.data);
    } catch (err) {
      console.error("Toggle connection dropped:", err);
    }
  };

  const semesterMeetings = meetings.filter(m => m.semester === semesterFilter);
  const activeMeeting = meetings.find(m => m._id === selectedMeetingId);

  const processedFilteredStudents = students.filter(s => {
    const matchesLevel = (s.currentLevel || '100L') === activeLevelTab;
    const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.regNo && s.regNo.includes(searchQuery));
    return matchesLevel && matchesSearch;
  });

  const cohortTotal = processedFilteredStudents.length;
  const presentTotal = processedFilteredStudents.filter(s => activeMeeting?.attendanceList?.includes(s._id)).length;
  const dormantTotal = processedFilteredStudents.filter(s => s.accountStatus === 'Dormant').length;
  const netEligible = cohortTotal - dormantTotal;
  const attendanceYield = netEligible > 0 ? Math.round((presentTotal / netEligible) * 100) : 0;

  return (
    <div className="bg-[#041004] text-white p-6 md:p-10 rounded-3xl border border-white/10 shadow-2xl font-sans select-none animate-fadeIn">
      
      {/* Header View Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-8 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-green-900/20 border border-green-800 flex items-center justify-center text-green-500">
            <FaHistory size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-serif text-[#d2b48c] tracking-tight">Meeting Attendance Ledger</h2>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Executive Roll Call Portal</p>
          </div>
        </div>
        <button onClick={fetchCoreData} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black hover:bg-white/10 text-[#d2b48c] transition-all tracking-widest outline-none">
          <FaSyncAlt className={`mr-2 inline ${loading ? 'animate-spin' : ''}`} /> RELOAD ROSTER
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Hand Board: Multi-Field Creator */}
        <div className="space-y-8">
          <form onSubmit={handleCreateMeeting} className="bg-black/40 border border-white/10 p-6 rounded-3xl space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d2b48c] mb-2 flex items-center gap-2">
              <FaCalendarPlus className="text-green-600" /> New Registry Entry
            </h3>
            
            <input 
              type="text"
              placeholder="Event Title (e.g. Saturday General Meeting)"
              value={newMeetingForm.title}
              onChange={(e) => setNewMeetingForm({ ...newMeetingForm, title: e.target.value })}
              className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-xs focus:border-green-600 outline-none text-gray-200"
              required
            />

            {/* ✅ OPTIMIZED: Native Date Selector inputs guarantee validation accuracy */}
            <input 
              type="date"
              value={newMeetingForm.dateString}
              onChange={(e) => setNewMeetingForm({ ...newMeetingForm, dateString: e.target.value })}
              className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-xs focus:border-green-600 outline-none font-sans text-gray-400 focus:text-white cursor-pointer"
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <select 
                value={newMeetingForm.day}
                onChange={(e) => setNewMeetingForm({ ...newMeetingForm, day: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-green-500 focus:border-green-600 outline-none font-bold cursor-pointer"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                  <option key={d} value={d} className="bg-[#041004] text-white">{d}</option>
                ))}
              </select>

              {/* ✅ UPDATED: Form Dropdown for Semesters */}
              <select 
                value={newMeetingForm.semester}
                onChange={(e) => setNewMeetingForm({ ...newMeetingForm, semester: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-green-500 focus:border-green-600 outline-none font-bold cursor-pointer"
              >
                <option value="Harmattan Semester" className="bg-[#041004] text-white">Harmattan</option>
                <option value="Rain Semester" className="bg-[#041004] text-white">Rain</option>
              </select>
            </div>

            <button type="submit" disabled={actionLoading} className="w-full bg-gradient-to-r from-green-800 to-green-700 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md outline-none">
              {actionLoading ? <PulseLoader color="#fff" size={4} /> : 'INITIALIZE REGISTER'}
            </button>
          </form>

          {/* Historical History Slicers */}
          <div className="bg-black/40 border border-white/10 p-6 rounded-3xl space-y-6">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <FaFilter /> Display Semester
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-black/60 rounded-2xl border border-white/5">
              {/* ✅ UPDATED: Filter Buttons map over the new exact strings */}
              {['Harmattan Semester', 'Rain Semester'].map(sem => (
                <button
                  type="button"
                  key={sem}
                  onClick={() => setSemesterFilter(sem)}
                  className={`py-3 text-[9px] font-black uppercase rounded-xl transition-all outline-none ${semesterFilter === sem ? 'bg-[#d2b48c] text-black shadow-xl' : 'text-gray-600 hover:text-white'}`}
                >
                  {/* sem.split(' ')[0] elegantly outputs "HARMATTAN" or "RAIN" */}
                  {sem.split(' ')[0]} 
                </button>
              ))}
            </div>

            <div>
              <p className="text-[9px] font-bold text-gray-600 uppercase mb-2 ml-1">Select History Entry</p>
              <select
                value={selectedMeetingId}
                onChange={(e) => setSelectedMeetingId(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-xs font-bold text-[#d2b48c] focus:outline-none cursor-pointer"
              >
                {semesterMeetings.length > 0 ? semesterMeetings.map(m => (
                  <option key={m._id} value={m._id} className="bg-[#041004]">
                    {m.title} — {m.dateString || m.createdAt} ({m.semester})
                  </option>
                )) : <option disabled className="bg-[#041004]">No entries for this semester</option>}
              </select>
            </div>
          </div>
        </div>

        {/* Right Hand Grid: Excel Worksheet Area */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          
          {/* Level Segmentation Tabs */}
          <div className="flex bg-black/40 p-1.5 rounded-3xl gap-1.5 border border-white/5 shadow-inner">
            {levels.map(lvl => (
              <button
                type="button"
                key={lvl}
                onClick={() => setActiveLevelTab(lvl)}
                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all outline-none ${activeLevelTab === lvl ? 'bg-[#1a110b] text-[#d2b48c] border border-[#3d2b1f] shadow-2xl scale-[1.02]' : 'text-gray-600 hover:text-gray-400'}`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-5 text-gray-700"><FaSearch size={14} /></span>
            <input 
              type="text"
              placeholder={`Search across ${activeLevelTab} directory...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-3xl py-5 pl-14 pr-4 text-xs text-white focus:border-green-900 transition-all outline-none"
            />
          </div>

          {/* Active Ledger Summary Banner Readout */}
          {activeMeeting && (
            <div className="bg-[#111111] border border-[#2a1b12] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
              <div>
                <span className="text-[9px] text-[#8b4513] font-black uppercase tracking-wider block">Active Meeting Focus</span>
                <span className="text-sm font-serif text-[#d2b48c] font-bold uppercase">{activeMeeting.title}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider block">Log Date</span>
                <span className="text-xs font-mono text-gray-300">{activeMeeting.dateString}</span>
              </div>
            </div>
          )}

          {/* Core Grid Matrix View */}
          <div className="border border-white/10 rounded-3xl overflow-hidden bg-black/20 shadow-2xl max-h-[45vh] overflow-y-auto scrollbar-none">
            {loading ? (
              <div className="p-32 text-center"><PulseLoader color="#d2b48c" size={12} /></div>
            ) : (
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 z-20 shadow-2xl">
                  <tr className="border-b border-white/10 bg-[#061506] text-[9px] font-black text-gray-500 uppercase tracking-[0.25em]">
                    <th className="p-6">Member Enrollment</th>
                    <th className="p-6 text-center">Engagement</th>
                    <th className="p-6 text-center bg-white/5 w-48">Status Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[11px]">
                  {processedFilteredStudents.length === 0 ? (
                    <tr><td colSpan="3" className="p-20 text-center text-gray-700 italic font-bold">Directory slice is currently empty.</td></tr>
                  ) : processedFilteredStudents.map(student => {
                    const isPresent = activeMeeting?.attendanceList?.includes(student._id);
                    const isDormant = student.accountStatus === 'Dormant';

                    return (
                      <tr key={student._id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="p-6">
                          <div className="flex flex-col">
                            <span className="font-serif font-medium text-white text-[14px]">{student.fullName}</span>
                            <span className="text-[9px] text-gray-600 font-mono mt-1 tracking-tighter uppercase font-black">{student.regNo || 'PENDING-ID'}</span>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <span className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-tighter ${student.activityMetrics?.overallPercent >= 70 ? 'bg-green-950/20 text-green-500 border-green-900/30' : 'bg-red-950/20 text-red-500 border-red-900/30'}`}>
                            {student.activityMetrics?.standing || 'Unrated'}
                          </span>
                        </td>
                        <td className="p-6 text-center">
  {isDormant ? (
    // Locked State - Keeps it clean and unobtrusive
    <span className="text-[9px] font-black uppercase text-gray-700 bg-black/50 px-4 py-2 rounded-xl border border-white/5 cursor-not-allowed">
      LOCKED (IT)
    </span>
  ) : (
    // The Refined Functional Checkbox
    <button
      type="button"
      onClick={() => handleToggleAttendance(student._id)}
      className="group mx-auto flex items-center justify-center gap-3 w-32 py-2 rounded-xl outline-none transition-all cursor-pointer"
    >
      {/* The Checkbox Icon with Glow & Scale Effects */}
      <div className={`text-[22px] transition-all duration-200 ${
        isPresent 
          ? 'text-green-500 scale-110 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
          : 'text-gray-600 group-hover:text-gray-400'
      }`}>
        {isPresent ? <FaCheckSquare /> : <FaSquare />}
      </div>
      
      {/* The Text Label */}
      <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
        isPresent ? 'text-green-400' : 'text-gray-600 group-hover:text-gray-300'
      }`}>
        {isPresent ? 'Present' : 'Absent'}
      </span>
    </button>
  )}
</td>
                       
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Fractional Accountability Analytics Panels */}
          <div className="bg-[#080c08] border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-3xl animate-fadeIn">
            
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-inner">
                  <FaUsers size={24} />
               </div>
               <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-0.5">Live Roll Call</p>
                  <p className="text-2xl font-serif text-white flex items-baseline gap-1.5">
                    {presentTotal} <span className="text-gray-600 text-xs font-sans font-bold uppercase">out of</span> {netEligible} <span className="text-gray-400 text-xs font-sans font-medium">Present</span>
                  </p>
               </div>
            </div>

            <div className="flex-1 w-full max-w-xs">
               <div className="flex justify-between items-end mb-2 px-1">
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Yield Vector</p>
                  <p className={`text-sm font-black ${attendanceYield >= 70 ? 'text-green-400' : 'text-yellow-500'}`}>
                    {attendanceYield}%
                  </p>
               </div>
               <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${attendanceYield >= 70 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                    style={{ width: `${attendanceYield}%` }}
                  ></div>
               </div>
            </div>

            <div className="flex items-center gap-3 bg-black/40 px-4 py-3 rounded-xl border border-white/5 w-full md:w-auto justify-center">
               <div className="text-gray-500"><FaChartPie size={14} /></div>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                 Total Cohort Base: <span className="text-white font-serif font-normal text-sm ml-1">{cohortTotal}</span>
               </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminMeetingManager;