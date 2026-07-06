import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaCalendarAlt, FaClock, FaUserCheck, FaUserShield, 
  FaCross, FaChessKing, FaBroadcastTower, FaHeading,
  FaLink, FaUnlink, FaUserFriends, FaUserAltSlash, 
  FaCheckCircle, FaTimesCircle, FaHistory, FaUserTag, FaCloudUploadAlt
} from 'react-icons/fa';
import { PulseLoader } from 'react-spinners';

// Target active local backend instance securely
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Structural map translating UI Display Labels back to explicit database schemas
const ROLE_MATRIX = [
  { apiKey: 'sacristan', uiLabel: 'Sacristan' },
  { apiKey: 'masterOfCeremonies', uiLabel: 'MC' },
  { apiKey: 'firstAcolyte', uiLabel: '1st Acolyte' },
  { apiKey: 'secondAcolyte', uiLabel: '2nd Acolyte' },
  { apiKey: 'crossBearer', uiLabel: 'Cross Bearer' },
  { apiKey: 'thurifer', uiLabel: 'Thurifer' },
  { apiKey: 'boatBearer', uiLabel: 'Boat Bearer' },
  { apiKey: 'firstAuxiliary', uiLabel: 'Auxiliary 1' },
  { apiKey: 'secondAuxiliary', uiLabel: 'Auxiliary 2' },
  { apiKey: 'mitreBearer', uiLabel: 'Mitre Bearer' },
  { apiKey: 'crosierBearer', uiLabel: 'Crosier Bearer' }
];

const INITIAL_FORM_STATE = {
  massTitle: '', assignmentDate: '', assignmentTime: '', serviceType: 'Sunday Mass', 
  semester: 'Harmattan Semester', institution: '',
  hasSecondAcolyte: true,
  sacristan: '', sacristanLevel: 'All Levels',
  masterOfCeremonies: '', masterOfCeremoniesLevel: 'All Levels',
  firstAcolyte: '', firstAcolyteLevel: 'All Levels',
  secondAcolyte: '', secondAcolyteLevel: 'All Levels',
  crossBearer: '', crossBearerLevel: 'All Levels',
  thurifer: '', thuriferLevel: 'All Levels',
  boatBearer: '', boatBearerLevel: 'All Levels',
  firstAuxiliary: '', firstAuxiliaryLevel: 'All Levels',
  secondAuxiliary: '', secondAuxiliaryLevel: 'All Levels',
  mitreBearer: '', mitreBearerLevel: 'All Levels',
  crosierBearer: '', crosierBearerLevel: 'All Levels'
};

const MassSelection = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBroadcastingAttendance, setIsBroadcastingAttendance] = useState({});
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [deployments, setDeployments] = useState([]);
  
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceSheet, setAttendanceSheet] = useState({});
  const [selectionForm, setSelectionForm] = useState(INITIAL_FORM_STATE);

  useEffect(() => {
    fetchDeploymentHistory();
  }, []);

  const fetchDeploymentHistory = async () => {
    try {
      setLoadingHistory(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token'); 
      const res = await axios.get(`${API_BASE_URL}/api/admin/assignments/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const structuralData = res.data.data || [];
        setDeployments(structuralData);
        
        const baseSheetState = {};
        structuralData.forEach(mass => {
          if (mass.attendance) {
            ROLE_MATRIX.forEach(({ apiKey, uiLabel }) => {
              if (mass.attendance[apiKey] !== undefined) {
                baseSheetState[`${mass._id}-${apiKey}`] = mass.attendance[apiKey];
              } else if (mass.attendance[uiLabel] !== undefined) {
                baseSheetState[`${mass._id}-${apiKey}`] = mass.attendance[uiLabel];
              }
            });
          }
        });
        setAttendanceSheet(baseSheetState);
      }
    } catch (err) {
      console.error("Ledger synchronization fault:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSelectionForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDeployForm = async (e) => {
    e.preventDefault();

    if (!selectionForm.massTitle.trim() || !selectionForm.assignmentDate || !selectionForm.assignmentTime) {
      alert("Deployment Error: Mass Title, Date, and Time are strictly required.");
      return;
    }

    setIsSubmitting(true);

    const isEveningMass = selectionForm.serviceType === 'Evening Mass';
    const isBishopMass = selectionForm.serviceType === 'Bishop Mass';

    // 🛡️ DATA STRUCTURING: We package the names and levels perfectly into the 'roles' object for the backend
    const structuredRoles = {
      sacristan: { name: selectionForm.sacristan.trim(), level: selectionForm.sacristanLevel },
      masterOfCeremonies: { name: selectionForm.masterOfCeremonies.trim(), level: selectionForm.masterOfCeremoniesLevel },
      firstAcolyte: { name: selectionForm.firstAcolyte.trim(), level: selectionForm.firstAcolyteLevel },
      secondAcolyte: selectionForm.hasSecondAcolyte ? { name: selectionForm.secondAcolyte.trim(), level: selectionForm.secondAcolyteLevel } : { name: '', level: 'All Levels' },
      crossBearer: { name: selectionForm.crossBearer.trim(), level: selectionForm.crossBearerLevel },
      thurifer: !isEveningMass ? { name: selectionForm.thurifer.trim(), level: selectionForm.thuriferLevel } : { name: '', level: 'All Levels' },
      boatBearer: !isEveningMass ? { name: selectionForm.boatBearer.trim(), level: selectionForm.boatBearerLevel } : { name: '', level: 'All Levels' },
      firstAuxiliary: !isEveningMass ? { name: selectionForm.firstAuxiliary.trim(), level: selectionForm.firstAuxiliaryLevel } : { name: '', level: 'All Levels' },
      secondAuxiliary: !isEveningMass ? { name: selectionForm.secondAuxiliary.trim(), level: selectionForm.secondAuxiliaryLevel } : { name: '', level: 'All Levels' },
      mitreBearer: isBishopMass ? { name: selectionForm.mitreBearer.trim(), level: selectionForm.mitreBearerLevel } : { name: '', level: 'All Levels' },
      crosierBearer: isBishopMass ? { name: selectionForm.crosierBearer.trim(), level: selectionForm.crosierBearerLevel } : { name: '', level: 'All Levels' }
    };

    const finalPayload = {
      massTitle: selectionForm.massTitle.trim(),
      assignmentDate: selectionForm.assignmentDate,
      assignmentTime: selectionForm.assignmentTime,
      serviceType: selectionForm.serviceType,
      semester: selectionForm.semester, // Ensures semester is saved!
      institution: selectionForm.institution.trim(),
      hasSecondAcolyte: selectionForm.hasSecondAcolyte,
      roles: structuredRoles // The structured Matrix
    };

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      if (!token) {
        alert("Authentication Error: You are not logged in as an admin. Please refresh and log in.");
        setIsSubmitting(false);
        return;
      }

      const res = await axios.post(`${API_BASE_URL}/api/admin/mass-assignments`, finalPayload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success) {
        alert("📊 Liturgical deployment roster broadcasted live successfully!");
        fetchDeploymentHistory(); 
        setSelectionForm(INITIAL_FORM_STATE); 
      }
    } catch (err) {
      console.error("Transmission error:", err);
      alert(`Deployment failure: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAttendance = (id, roleUiLabel) => {
    const key = `${id}-${roleUiLabel}`;
    setAttendanceSheet(prev => ({
      ...prev,
      [key]: prev[key] === 'Missed' ? 'Served' : 'Missed'
    }));
  };

  const handleBroadcastAttendance = async (massId) => {
    setIsBroadcastingAttendance(prev => ({ ...prev, [massId]: true }));
    
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      if (!token) {
        alert("Authentication Error: Please log in as an admin.");
        setIsBroadcastingAttendance(prev => ({ ...prev, [massId]: false }));
        return;
      }

      const targetMass = deployments.find(d => d._id === massId);
      const attendanceData = {};
      const explicitSemester = targetMass?.semester || selectionForm.semester;

      if (targetMass) {
        ROLE_MATRIX.forEach(({ apiKey }) => {
          // Backward compatibility check for name extraction
          const personName = targetMass.roles?.[apiKey]?.name || targetMass[apiKey];
          let passesCondition = true;
          
          if (targetMass.serviceType === 'Evening Mass') {
             if (['thurifer', 'boatBearer', 'firstAuxiliary', 'secondAuxiliary', 'mitreBearer', 'crosierBearer'].includes(apiKey)) passesCondition = false;
          } else if (targetMass.serviceType === 'Sunday Mass') {
             if (['mitreBearer', 'crosierBearer'].includes(apiKey)) passesCondition = false;
          }

          if (apiKey === 'secondAcolyte' && !targetMass.hasSecondAcolyte) passesCondition = false;

          if (personName && personName.trim() !== "" && passesCondition) {
            const compositeKey = `${massId}-${apiKey}`; 
            attendanceData[apiKey] = attendanceSheet[compositeKey] === 'Missed' ? 'Missed' : 'Served';
          }
        });
      }

      const optimizedPayload = {
        semester: explicitSemester,
        attendance: attendanceData
      };

      const res = await axios.put(
        `${API_BASE_URL}/api/admin/mass-assignments/${massId}/attendance`, 
        optimizedPayload, 
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (res.data.success) {
        alert("✅ Attendance updated successfully!");
        await fetchDeploymentHistory(); 
      }
    } catch (err) {
      console.error("Database update error:", err);
      alert(`Update failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsBroadcastingAttendance(prev => ({ ...prev, [massId]: false }));
    }
  };

  const filteredRecords = (deployments || []).filter(m => {
    if (!m.assignmentDate) return false;
    const safeDate = m.assignmentDate.includes('T') ? m.assignmentDate.split('T')[0] : m.assignmentDate;
    return safeDate === filterDate;
  });

  const isEveningMass = selectionForm.serviceType === 'Evening Mass';
  const isBishopMass = selectionForm.serviceType === 'Bishop Mass';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 animate-fadeIn text-white font-sans select-none pb-24">
      {/* SECTION 1: FULL DEPLOYMENT FORM */}
      <div className="bg-[#0a0a0a] border border-[#2a1b12] rounded-3xl p-6 md:p-10 shadow-2xl">
        <form onSubmit={handleDeployForm} className="space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <FaHeading className="text-[#d2b48c] text-xs" />
              <h3 className="text-xs font-black uppercase tracking-widest text-[#d2b48c]">1. Celebration Metadata</h3>
            </div>
            <div className="flex flex-col space-y-4">
              <InputField label="Mass / Celebration Title" value={selectionForm.massTitle} onChange={(v) => handleInputChange('massTitle', v)} placeholder="Enter Celebration Title (e.g. Easter Vigil)" required />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Academic Session Context</label>
                  <select value={selectionForm.semester} className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs outline-none cursor-pointer focus:border-green-600 text-white" onChange={(e) => handleInputChange('semester', e.target.value)}>
                    <option value="Harmattan Semester">Harmattan (1st Term)</option>
                    <option value="Rain Semester">Rain (2nd Term)</option>
                  </select>
                </div>
                <InputField label="Institution / Branch" value={selectionForm.institution} onChange={(v) => handleInputChange('institution', v)} placeholder="Enter institution" />
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Classification Schedule Type</label>
                <select value={selectionForm.serviceType} className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs outline-none cursor-pointer focus:border-green-600 text-white" onChange={(e) => handleInputChange('serviceType', e.target.value)}>
                  <option value="Sunday Mass">Standard Sunday Mass</option>
                  <option value="Bishop Mass">High Pontifical (Bishop) Mass</option>
                  <option value="Evening Mass">Evening Mass</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Calendar Target Date</label>
                  <input type="date" value={selectionForm.assignmentDate} className="bg-black border border-white/10 rounded-xl p-4 text-xs outline-none cursor-pointer focus:border-green-600 text-white" onChange={(e) => handleInputChange('assignmentDate', e.target.value)} required />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Execution Timestamp Time</label>
                  <input type="time" value={selectionForm.assignmentTime} className="bg-black border border-white/10 rounded-xl p-4 text-xs outline-none cursor-pointer focus:border-green-600 text-white" onChange={(e) => handleInputChange('assignmentTime', e.target.value)} required />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: LEADERSHIP & SACRISTY */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <FaUserCheck className="text-emerald-500 text-xs" />
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500">2. Leadership & Sacristy</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ServerInputField 
                label="Sacristan" nameValue={selectionForm.sacristan} levelValue={selectionForm.sacristanLevel} 
                onNameChange={(v) => handleInputChange('sacristan', v)} onLevelChange={(v) => handleInputChange('sacristanLevel', v)} placeholder="Sacristan Name" 
              />
              <ServerInputField 
                label="Master of Ceremony (MC / NC)" nameValue={selectionForm.masterOfCeremonies} levelValue={selectionForm.masterOfCeremoniesLevel} 
                onNameChange={(v) => handleInputChange('masterOfCeremonies', v)} onLevelChange={(v) => handleInputChange('masterOfCeremoniesLevel', v)} 
                placeholder="MC Name" color="text-emerald-400 font-bold" 
              />
            </div>
          </div>

          {/* SECTION 3: ACOLYTE CONNECTIVITY */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <FaUserShield className="text-blue-500 text-xs" />
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">3. Acolyte Connectivity</h3>
              </div>
              <button 
                type="button" onClick={() => handleInputChange('hasSecondAcolyte', !selectionForm.hasSecondAcolyte)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all outline-none ${selectionForm.hasSecondAcolyte ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-red-950/40 text-red-500 border border-red-900/30'}`}
              >
                {selectionForm.hasSecondAcolyte ? <><FaUserFriends /> Status: Paired</> : <><FaUserAltSlash /> Status: Solo</>}
              </button>
            </div>

            <div className="flex flex-col space-y-0 relative pt-2">
              <ServerInputField 
                label="First Acolyte (Lead Position)" nameValue={selectionForm.firstAcolyte} levelValue={selectionForm.firstAcolyteLevel} 
                onNameChange={(v) => handleInputChange('firstAcolyte', v)} onLevelChange={(v) => handleInputChange('firstAcolyteLevel', v)} placeholder="First Acolyte Name" 
              />
              {selectionForm.hasSecondAcolyte && (
                <>
                  <div className="flex justify-center h-10 relative">
                    <div className="w-[2px] bg-gradient-to-b from-blue-500 to-blue-900 opacity-40"></div>
                    <div className="absolute top-1/2 -translate-y-1/2 bg-[#0a0a0a] p-1.5 rounded-full border border-white/10">
                      <FaLink className="text-blue-500" size={10} />
                    </div>
                  </div>
                  <ServerInputField 
                    label="Second Acolyte (Connected Position)" nameValue={selectionForm.secondAcolyte} levelValue={selectionForm.secondAcolyteLevel} 
                    onNameChange={(v) => handleInputChange('secondAcolyte', v)} onLevelChange={(v) => handleInputChange('secondAcolyteLevel', v)} 
                    placeholder="2nd Acolyte Name" color="text-blue-400 font-medium" 
                  />
                </>
              )}
            </div>
          </div>

          {/* SECTION 4: PROCESSION APPARATUS */}
          <div className="space-y-4 pt-4 border-t border-white/5 animate-fadeIn">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <FaCross className="text-purple-500 text-xs" />
              <h3 className="text-xs font-black uppercase tracking-widest text-purple-500">4. Procession Apparatus</h3>
            </div>
            <div className={`grid ${isEveningMass ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-4`}>
              <ServerInputField 
                label="Cross Bearer" nameValue={selectionForm.crossBearer} levelValue={selectionForm.crossBearerLevel} 
                onNameChange={(v) => handleInputChange('crossBearer', v)} onLevelChange={(v) => handleInputChange('crossBearerLevel', v)} placeholder="Name" 
              />
              {!isEveningMass && (
                <>
                  <ServerInputField 
                    label="Thurifer (Incense)" nameValue={selectionForm.thurifer} levelValue={selectionForm.thuriferLevel} 
                    onNameChange={(v) => handleInputChange('thurifer', v)} onLevelChange={(v) => handleInputChange('thuriferLevel', v)} placeholder="Name" 
                  />
                  <ServerInputField 
                    label="Boat Bearer" nameValue={selectionForm.boatBearer} levelValue={selectionForm.boatBearerLevel} 
                    onNameChange={(v) => handleInputChange('boatBearer', v)} onLevelChange={(v) => handleInputChange('boatBearerLevel', v)} placeholder="Name" 
                  />
                </>
              )}
            </div>
          </div>

          {/* SECTION 5: AUXILIARY SERVANTS */}
          {!isEveningMass && (
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <FaUserTag className="text-amber-500 text-xs" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">5. Auxiliary Servants</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ServerInputField 
                  label="Auxiliary 1" nameValue={selectionForm.firstAuxiliary} levelValue={selectionForm.firstAuxiliaryLevel} 
                  onNameChange={(v) => handleInputChange('firstAuxiliary', v)} onLevelChange={(v) => handleInputChange('firstAuxiliaryLevel', v)} placeholder="Servant Name" 
                />
                <ServerInputField 
                  label="Auxiliary 2" nameValue={selectionForm.secondAuxiliary} levelValue={selectionForm.secondAuxiliaryLevel} 
                  onNameChange={(v) => handleInputChange('secondAuxiliary', v)} onLevelChange={(v) => handleInputChange('secondAuxiliaryLevel', v)} placeholder="Servant Name" 
                />
              </div>
            </div>
          )}

          {/* SECTION 6: PONTIFICAL HIGH REGALIA */}
          {isBishopMass && (
            <div className="space-y-4 pt-6 border-t border-yellow-600/30 bg-yellow-950/5 p-6 rounded-3xl animate-fadeIn">
              <div className="flex items-center gap-2 border-b border-yellow-600/20 pb-2">
                <FaChessKing className="text-yellow-500 text-xs" />
                <h3 className="text-xs font-black uppercase tracking-widest text-yellow-500">6. Pontifical High Regalia</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ServerInputField 
                  label="Mitre Bearer" nameValue={selectionForm.mitreBearer} levelValue={selectionForm.mitreBearerLevel} 
                  onNameChange={(v) => handleInputChange('mitreBearer', v)} onLevelChange={(v) => handleInputChange('mitreBearerLevel', v)} placeholder="Name" 
                />
                <ServerInputField 
                  label="Crosier Bearer" nameValue={selectionForm.crosierBearer} levelValue={selectionForm.crosierBearerLevel} 
                  onNameChange={(v) => handleInputChange('crosierBearer', v)} onLevelChange={(v) => handleInputChange('crosierBearerLevel', v)} placeholder="Name" 
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-gradient-to-r from-green-800 to-green-700 hover:from-green-700 hover:to-green-600 py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl transition-all flex items-center justify-center gap-3 outline-none active:scale-[0.99]"
          >
            {isSubmitting ? <PulseLoader color="#fff" size={6} /> : <><FaBroadcastTower size={16} /> Broadcast Deployment</>}
          </button>
        </form>
      </div>

      {/* SECTION 2: ATTENDANCE LEDGER */}
      <div className="w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#111111] p-6 rounded-3xl border border-[#2a1b12]">
          <div>
            <h3 className="text-xl font-serif text-[#d2b48c] uppercase tracking-tight">Searchable Attendance Ledger</h3>
            <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-1">Audit rosters by selecting a specific Date</p>
          </div>

          <div className="flex items-center gap-3 bg-black border border-white/10 p-2 rounded-2xl">
            <FaCalendarAlt className="text-[#d2b48c] ml-2" />
            <input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer p-2"
            />
          </div>
        </div>

        {loadingHistory ? (
          <div className="py-20 text-center"><PulseLoader color="#d2b48c" size={10} /></div>
        ) : filteredRecords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRecords.map((mass) => (
              <div key={mass._id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl space-y-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start border-b border-white/5 pb-3">
                    <div>
                      <h4 className="text-lg font-serif text-white tracking-tight">{mass.massTitle}</h4>
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-0.5">
                        {mass.serviceType} • {mass.semester}
                      </p>
                    </div>
                    <span className="text-[10px] bg-white/5 px-3 py-1 rounded-lg text-gray-400 font-mono border border-white/5">{mass.assignmentTime}</span>
                  </div>

                  <div className="space-y-2 mt-4">
                    {/* Backward Compatibility Map: Looks for mass.roles?.role?.name FIRST, falls back to mass.role */}
                    <AttendanceRow label="sacristan" name={mass.roles?.sacristan?.name || mass.sacristan} level={mass.roles?.sacristan?.level} id={mass._id} sheet={attendanceSheet} onToggle={toggleAttendance} color="text-gray-400" />
                    <AttendanceRow label="masterOfCeremonies" name={mass.roles?.masterOfCeremonies?.name || mass.masterOfCeremonies} level={mass.roles?.masterOfCeremonies?.level} id={mass._id} sheet={attendanceSheet} onToggle={toggleAttendance} color="text-emerald-400" />
                    <AttendanceRow label="firstAcolyte" name={mass.roles?.firstAcolyte?.name || mass.firstAcolyte} level={mass.roles?.firstAcolyte?.level} id={mass._id} sheet={attendanceSheet} onToggle={toggleAttendance} color="text-blue-400" />
                    
                    {mass.hasSecondAcolyte && (
                      <AttendanceRow label="secondAcolyte" name={mass.roles?.secondAcolyte?.name || mass.secondAcolyte} level={mass.roles?.secondAcolyte?.level} id={mass._id} sheet={attendanceSheet} onToggle={toggleAttendance} color="text-blue-400" />
                    )}
                    
                    <AttendanceRow label="crossBearer" name={mass.roles?.crossBearer?.name || mass.crossBearer} level={mass.roles?.crossBearer?.level} id={mass._id} sheet={attendanceSheet} onToggle={toggleAttendance} color="text-purple-400" />
                    
                    {mass.serviceType !== 'Evening Mass' && (
                      <>
                        <AttendanceRow label="thurifer" name={mass.roles?.thurifer?.name || mass.thurifer} level={mass.roles?.thurifer?.level} id={mass._id} sheet={attendanceSheet} onToggle={toggleAttendance} color="text-orange-400" />
                        <AttendanceRow label="boatBearer" name={mass.roles?.boatBearer?.name || mass.boatBearer} level={mass.roles?.boatBearer?.level} id={mass._id} sheet={attendanceSheet} onToggle={toggleAttendance} color="text-orange-400/70" />
                        <AttendanceRow label="firstAuxiliary" name={mass.roles?.firstAuxiliary?.name || mass.firstAuxiliary} level={mass.roles?.firstAuxiliary?.level} id={mass._id} sheet={attendanceSheet} onToggle={toggleAttendance} color="text-amber-500" />
                        <AttendanceRow label="secondAuxiliary" name={mass.roles?.secondAuxiliary?.name || mass.secondAuxiliary} level={mass.roles?.secondAuxiliary?.level} id={mass._id} sheet={attendanceSheet} onToggle={toggleAttendance} color="text-amber-500/70" />
                      </>
                    )}
                    
                    {mass.serviceType === 'Bishop Mass' && (
                      <>
                        <AttendanceRow label="mitreBearer" name={mass.roles?.mitreBearer?.name || mass.mitreBearer} level={mass.roles?.mitreBearer?.level} id={mass._id} sheet={attendanceSheet} onToggle={toggleAttendance} color="text-yellow-500" />
                        <AttendanceRow label="crosierBearer" name={mass.roles?.crosierBearer?.name || mass.crosierBearer} level={mass.roles?.crosierBearer?.level} id={mass._id} sheet={attendanceSheet} onToggle={toggleAttendance} color="text-yellow-500" />
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isBroadcastingAttendance[mass._id]}
                  onClick={() => handleBroadcastAttendance(mass._id)}
                  className="w-full mt-4 bg-gradient-to-r from-emerald-900 to-emerald-800 hover:from-emerald-800 hover:to-emerald-700 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-emerald-500/20"
                >
                  {isBroadcastingAttendance[mass._id] ? (
                    <PulseLoader color="#fff" size={4} />
                  ) : (
                    <><FaCloudUploadAlt size={14} /> Return Attendance</>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-black/20 rounded-3xl border border-dashed border-white/10">
            <FaHistory className="mx-auto text-gray-700 mb-4" size={30} />
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">No liturgical records found for {new Date(filterDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const InputField = ({ label, value, onChange, placeholder = "", type = "text", color = "text-white", required = false }) => (
  <div className="flex flex-col space-y-2 w-full">
    <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">{label}</label>
    <input type={type} value={value || ''} placeholder={placeholder} required={required} className={`bg-black border border-white/10 rounded-xl p-4 text-xs outline-none focus:border-green-600 transition-all ${color}`} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const ServerInputField = ({ label, nameValue, levelValue, onNameChange, onLevelChange, placeholder = "", color = "text-white" }) => (
  <div className="flex flex-col space-y-2 w-full">
    <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">{label}</label>
    <div className="flex gap-2">
      <input 
        type="text" 
        value={nameValue || ''} 
        placeholder={placeholder} 
        className={`w-2/3 bg-black border border-white/10 rounded-xl p-4 text-xs outline-none focus:border-green-600 transition-all ${color}`} 
        onChange={(e) => onNameChange(e.target.value)} 
      />
      <select 
        value={levelValue || 'All Levels'} 
        className="w-1/3 bg-black border border-white/10 rounded-xl p-4 text-xs outline-none cursor-pointer focus:border-green-600 text-white" 
        onChange={(e) => onLevelChange(e.target.value)}
      >
        <option value="All Levels">Level (All)</option>
        <option value="100L">100L</option>
        <option value="200L">200L</option>
        <option value="300L">300L</option>
        <option value="400L">400L</option>
        <option value="500L">500L</option>
        <option value="Grad">Graduate</option>
      </select>
    </div>
  </div>
);

const AttendanceRow = ({ label, name, level, id, sheet, onToggle, color }) => {
  if (!name || name.trim() === "") return null;
  
  const displayLabel = ROLE_MATRIX.find(r => r.apiKey === label)?.uiLabel || label;
  const statusKey = `${id}-${label}`;
  const currentStatus = sheet[statusKey];
  const served = currentStatus === undefined || currentStatus === 'Served';

  return (
    <div 
      onClick={() => onToggle(id, label)} 
      className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all select-none ${served ? 'border-green-900/50 bg-green-950/10 hover:border-green-500' : 'border-red-900/50 bg-red-950/10 hover:border-red-500'}`}
    >
      <div className="truncate max-w-[70%]">
        <p className={`text-[8px] uppercase font-black tracking-wider ${color}`}>{displayLabel}</p>
        <p className="text-xs font-bold text-white uppercase truncate mt-0.5">
          {name} {level && level !== 'All Levels' && <span className="text-[9px] text-gray-500 ml-1 lowercase">({level})</span>}
        </p>
      </div>
      
      {served ? (
        <span className="flex items-center gap-1 text-[9px] font-black text-green-400 uppercase bg-green-950/50 px-2 py-0.5 rounded border border-green-900/30">
          <FaCheckCircle size={10} /> Served
        </span>
      ) : (
        <span className="flex items-center gap-1 text-[9px] font-black text-red-400 uppercase bg-red-950/50 px-2 py-0.5 rounded border border-red-900/30">
          <FaTimesCircle size={10} /> Missed
        </span>
      )}
    </div>
  );
};

export default MassSelection;