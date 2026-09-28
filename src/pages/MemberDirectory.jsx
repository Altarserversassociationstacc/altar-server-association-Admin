import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaUserCircle, FaInfoCircle, FaTimes, FaPhone, FaGraduationCap, FaChurch } from 'react-icons/fa';
import { PulseLoader } from 'react-spinners';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const getProfilePic = (pic) => {
  if (!pic) return null;
  if (pic.startsWith('http') || pic.startsWith('data:')) return pic;
  return `${API_BASE_URL}/uploads/${pic}`;
};

const Attribute = ({ label, value, fullWidth = false }) => (
  <div className={fullWidth ? "w-full text-left" : "text-left"}>
    <p className="text-[9px] text-[#8b4513] font-black uppercase tracking-widest mb-1">{label}</p>
    <p className="text-gray-300 text-xs font-serif leading-relaxed uppercase font-medium">
      {value || 'NOT SPECIFIED'}
    </p>
  </div>
);

const MemberDirectory = ({ initialFilter = 'all' }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setError(null);
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API_BASE_URL}/api/admin/students`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // ✅ Defensive check: Ensure we are always setting an array
        const responseData = res.data;
        if (Array.isArray(responseData)) {
          setStudents(responseData);
        } else if (responseData && Array.isArray(responseData.data)) {
          // Handle cases where API wraps data in an object like { data: [...] }
          setStudents(responseData.data);
        } else {
          setStudents([]);
          console.error("API did not return an array:", responseData);
        }
      } catch (err) {
        setError("Failed to load directory records. Please check your connection or permissions.");
        console.error("Directory fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleApproveMember = async (studentId) => {
    if (!window.confirm("Are you sure you want to approve this member account?")) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      await axios.put(`${API_BASE_URL}/api/admin/approve-student/${studentId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStudents(prev => Array.isArray(prev) ? prev.map(s => 
        s._id === studentId ? { ...s, isVerified: true } : s
      ) : []);
      
      setSelectedStudent(prev => 
        prev?._id === studentId ? { ...prev, isVerified: true } : prev
      );
      
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve member. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Defensive Array Check before filtering
  const safeStudents = Array.isArray(students) ? students : [];
  const filteredStudents = safeStudents.filter(s => {
    const matchesSearch = (s.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                          (s.regNo && s.regNo.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (initialFilter === 'pending') return matchesSearch && !s.isVerified;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      
      {/* Search & Header Module Card */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#111111] p-6 rounded-2xl border border-white/5 shadow-xl">
        <div className="relative w-full md:w-96">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
          <input 
            type="text"
            placeholder="Search by name or Reg No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs font-medium focus:border-[#8b4513] outline-none transition-all text-white"
          />
        </div>
        <div className="text-right w-full md:w-auto">
          <p className="text-[#d2b48c] text-[10px] font-bold uppercase tracking-widest">Registry Census</p>
          <h2 className="text-xl font-serif text-white">
            {filteredStudents.length} {initialFilter === 'pending' ? 'Pending' : 'Total'} Records
          </h2>
        </div>
      </div>

      {/* Directory Grid Collection */}
      {loading ? (
        <div className="py-32 text-center"><PulseLoader color="#d2b48c" size={12} /></div>
      ) : error ? (
        <div className="py-12 text-center text-red-400 bg-red-950/10 rounded-2xl border border-red-900/30">
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(student => (
            <button 
              key={student._id}
              onClick={() => setSelectedStudent(student)}
              type="button"
              className="w-full text-left bg-[#111111] border border-white/5 p-5 rounded-2xl hover:border-[#3d2b1f] transition-all cursor-pointer group shadow-lg focus:outline-none focus:ring-2 focus:ring-[#8b4513]"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                  {getProfilePic(student.profilePicture) ? (
                    <img src={getProfilePic(student.profilePicture)} alt={`${student.fullName}'s avatar`} className="w-full h-full object-cover animate-fadeIn" />
                  ) : (
                    <FaUserCircle className="text-gray-700 w-full h-full p-2" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-serif text-white group-hover:text-[#d2b48c] transition-colors truncate">{student.fullName}</h4>
                  <p className="text-[9px] text-gray-500 font-mono mt-0.5 truncate uppercase">{student.regNo || 'PENDING ALLOCATION'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[8px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded border ${student.isVerified ? 'bg-green-950/20 text-green-400 border-green-900/30' : 'bg-red-950/20 text-red-400 border-red-900/30'}`}>
                      {student.isVerified ? 'Verified' : 'Pending'}
                    </span>
                    <span className="text-[8px] text-gray-600 font-black uppercase tracking-wider">{student.currentLevel || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Full Details Comprehensive Dossier Modal */}
      {selectedStudent && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0a0a0a] border border-[#2a1b12] w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-scaleUp">
            
            <div className="shrink-0 p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#8b4513]/20 border border-[#8b4513]/50 flex items-center justify-center text-[#8b4513]">
                  <FaInfoCircle size={20} />
                </div>
                <div>
                  <h3 className="text-white font-serif text-lg">Member Dossier</h3>
                  <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-bold">Comprehensive Registry Profile</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedStudent(null)} 
                className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Close modal"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                
                <div className="md:col-span-1 flex flex-col items-center text-center space-y-6">
                  <div className="w-40 h-40 rounded-3xl border-2 border-[#8b4513]/40 overflow-hidden shadow-2xl bg-black/40 shrink-0">
                    {getProfilePic(selectedStudent.profilePicture) ? (
                      <img src={getProfilePic(selectedStudent.profilePicture)} alt="Full Portrait" className="w-full h-full object-cover" />
                    ) : (
                      <FaUserCircle className="text-gray-800 w-full h-full p-2" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif text-white tracking-tight">{selectedStudent.fullName}</h2>
                    <p className="text-xs text-[#8b4513] font-bold uppercase tracking-widest mt-1 font-mono">{selectedStudent.regNo || 'No ID Specified'}</p>
                  </div>
                  <div className="w-full pt-6 border-t border-white/5">
                     <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Analytical Standing</p>
                     <div className="bg-[#1a110b] border border-[#3d2b1f] p-4 rounded-2xl select-none">
                       <p className="text-2xl font-serif text-[#d2b48c] font-bold">{selectedStudent.activityMetrics?.overallPercent || 0}%</p>
                       <span className={`text-[10px] font-black uppercase tracking-widest block mt-1 ${selectedStudent.activityMetrics?.overallPercent >= 70 ? 'text-green-500' : 'text-yellow-600'}`}>
                         {selectedStudent.activityMetrics?.standing || 'Unrated'}
                       </span>
                     </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-10">
                  <section>
                    <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                      <FaGraduationCap className="text-[#8b4513]" size={14} /> Academic & Inducted Data
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                      <Attribute label="Department" value={selectedStudent.department} />
                      <Attribute label="Current Level" value={selectedStudent.currentLevel} />
                      <Attribute label="Year Inducted" value={selectedStudent.levelInducted} />
                      <Attribute label="Gender" value={selectedStudent.gender} />
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                      <FaPhone className="text-[#8b4513]" size={12} /> Contact & Vital Info
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                      <Attribute label="Phone Number" value={selectedStudent.phoneNumber} />
                      <Attribute label="Email Address" value={selectedStudent.email} />
                      <Attribute label="State of Origin" value={selectedStudent.stateOfOrigin} />
                      <Attribute label="Home Town" value={selectedStudent.homeTown} />
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                      <FaChurch className="text-[#8b4513]" size={12} /> Location & Ecclesiastical
                    </h4>
                    <div className="space-y-6">
                      <Attribute label="School Residence" value={selectedStudent.schoolResidentialAddress} fullWidth />
                      <Attribute label="Home Diocese" value={selectedStudent.homeDiocese} fullWidth />
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <div className="shrink-0 p-8 border-t border-white/5 bg-black/40 flex justify-end gap-4">
              {!selectedStudent.isVerified && (
                <button 
                  type="button"
                  onClick={() => handleApproveMember(selectedStudent._id)}
                  disabled={actionLoading}
                  className="bg-green-800 hover:bg-green-700 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {actionLoading ? "Processing..." : "Approve Member"}
                </button>
              )}
              <button 
                type="button" 
                onClick={() => setSelectedStudent(null)}
                className="bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDirectory;