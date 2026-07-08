import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaTachometerAlt, FaUsers, FaBell, FaSignOutAlt, FaBars, 
  FaTimes, FaChevronDown, FaUserCircle, FaCalendarAlt, 
  FaHourglassHalf, FaImages, FaUserEdit, FaUserLock, FaClipboardList, FaCreditCard,
  FaSun, FaMoon
} from 'react-icons/fa';
import { AdminExecutiveForm } from '../components/AdminExecutiveForm';
import { ExecutiveList } from '../components/ExecutiveList'; 
import AdminGalleryManager from '../components/AdminGalleryManager';
import AdminEvents from './AdminEvents';
import AdminAnnouncements from './AdminAnnouncements'; 
import AdminMeetingManager from './AdminMeetingManager';
import { AccountManager } from '../components/AccountManager';
import MemberDirectory from './MemberDirectory';
import MassSelection from '../components/MassSelection'; 
import AdminPaymentLedger from '../components/AdminPaymentLedger'; 
import { PulseLoader } from 'react-spinners';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Dashboard = () => {
  const token = localStorage.getItem('adminToken');
  const userString = localStorage.getItem('adminUser');
  
  // 🛡️ Safe Execution Profile Deserializer Guard
  const currentUser = useMemo(() => {
    try {
      return userString ? JSON.parse(userString) : null;
    } catch (e) {
      console.error("Malformed adminUser execution profile context string structure:", e);
      return null;
    }
  }, [userString]);

  // UI Reactive States
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isDragging, setIsDragging] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Analytical Matrix State
  const [dashboardStats, setDashboardStats] = useState({
    totalMembers: 0,
    activeBroadcasts: 0,
    upcomingEvents: 0,
    notifications: 0,
    pendingApprovals: 0
  });

  // Synchronize Dashboard Metrics Thread
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardStats(res.data);
      } catch (err) {
        console.error("Error synchronizing dashboard metrics data payload matrix:", err);
      }
    };

    if (token) fetchStats();
  }, [token]);

  // Window Resize Monitor Hook
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Workspace Splitter Drag Handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      let newWidth = e.clientX;
      if (newWidth < 220) newWidth = 220;
      if (newWidth > 400) newWidth = 400;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // View Transition Controller Optimization Thread
  const handleViewChange = useCallback((view) => {
    if (activeView === view) return;
    setIsViewLoading(true);
    setActiveView(view);
    const frameDelay = setTimeout(() => setIsViewLoading(false), 300);
    return () => clearTimeout(frameDelay);
  }, [activeView]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login';
  }, []);

  // 🔒 HARD SECURITY GATEWAY ACCESS VERIFIER
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // Analytics Dynamic Card Array Models
  const stats = [
    { id: 1, label: "Total Members", value: (dashboardStats?.totalMembers ?? 0).toLocaleString(), icon: <FaUsers />, color: "border-purple-600", iconColor: "text-purple-500", view: 'registeredMembers' },
    { id: 2, label: "Active Broadcasts", value: (dashboardStats?.activeBroadcasts ?? 0).toLocaleString(), icon: <FaBell />, color: "border-amber-600", iconColor: "text-amber-500", view: 'announcements' },
    { id: 3, label: "Upcoming Events", value: (dashboardStats?.upcomingEvents ?? 0).toLocaleString(), icon: <FaCalendarAlt />, color: "border-indigo-600", iconColor: "text-indigo-500", view: 'events' },
    { id: 4, label: "Notifications", value: (dashboardStats?.notifications ?? 0).toLocaleString(), icon: <FaBell />, color: "border-rose-600", iconColor: "text-rose-500", view: 'overview' },
    { id: 5, label: "Pending Approvals", value: (dashboardStats?.pendingApprovals ?? 0).toLocaleString(), icon: <FaHourglassHalf />, color: "border-emerald-600", iconColor: "text-emerald-500", view: 'pendingApprovals' },
  ];

  // Structural Header Workspace Title Context Mapping 
  const headerMeta = (() => {
    switch (activeView) {
      case 'massSelection': return { title: 'Sanctuary', desc: 'Configure liturgical team rosters' };
      case 'paymentLedger': return { title: 'Financial Ledger ', desc: 'Audit live transaction gateway logs' };
      case 'accountManager': return { title: 'Security', desc: 'Manage access levels' };
      case 'registeredMembers': return { title: 'Member Database ', desc: 'Review verified profile forms and records tracking' };
      default: return { title: 'Control Operations Panel', desc: 'Manage association content metrics, dashboard analytics, and leadership components' };
    }
  })();

  return (
    <div className={`flex flex-col h-[100dvh] w-screen max-w-full overflow-hidden font-sans select-none transition-colors duration-300 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-stone-100 text-stone-900'}`}>
      
      {/* 🧭 Top Frame Navigation Bar Component Layout */}
      <nav className={`h-16 flex items-center justify-between px-6 z-50 shrink-0 border-b transition-colors duration-300 ${isDarkMode ? 'bg-[#111111]/95 border-[#2a1b12]' : 'bg-white border-stone-200 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`transition-colors outline-none cursor-pointer ${isDarkMode ? 'text-[#d2b48c] hover:text-white' : 'text-stone-600 hover:text-stone-900'}`}>
            {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
          <div className="flex items-center gap-3">
            <span className={`font-serif text-xl tracking-widest font-bold uppercase transition-colors ${isDarkMode ? 'text-[#8b4513]' : 'text-stone-800'}`}>Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className={`text-[10px] font-bold uppercase tracking-widest leading-none transition-colors ${isDarkMode ? 'text-[#d2b48c]' : 'text-stone-500'}`}>Access Level 1</p>
            <p className={`text-xs font-serif mt-1 transition-colors ${isDarkMode ? 'text-white' : 'text-stone-800 font-bold'}`}>{currentUser?.fullName || 'Administrator'}</p>
          </div>

          {/* 🌓 Fluid Dynamic Layout Dark/Light Controller Switch */}
          <button 
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-zinc-800' : 'bg-stone-50 border-stone-200 text-indigo-600 hover:bg-stone-200 shadow-sm'
            }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <FaSun size={14} /> : <FaMoon size={14} />}
          </button>
          
          {/* User Operations Control Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 h-10 px-2 rounded-lg border transition-all outline-none cursor-pointer ${isDarkMode ? 'border-[#3d2b1f] bg-[#1a110b] hover:border-[#8b4513]' : 'border-stone-200 bg-stone-50 hover:border-stone-400'}`}
            >
              <FaUserCircle className={isDarkMode ? 'text-[#d2b48c]' : 'text-stone-600'} size={24} />
              <FaChevronDown className={`transition-transform duration-300 ${isDarkMode ? 'text-[#d2b48c]' : 'text-stone-600'} ${isDropdownOpen ? 'rotate-180' : ''}`} size={12} />
            </button>
            
            {isDropdownOpen && (
              <div 
                onMouseLeave={() => setIsDropdownOpen(false)}
                className={`absolute right-0 mt-3 w-48 backdrop-blur-xl border rounded-xl shadow-2xl overflow-hidden z-50 py-2 transition-all ${isDarkMode ? 'bg-[#111111]/95 border-[#2a1b12]' : 'bg-white border-stone-200'}`}
              >
           
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Primary Split Viewport Container Panel Frame */}
      <div className="flex flex-1 overflow-hidden relative w-full h-full">
        
        {/* 📑 Adjustable Flexible Dimension Navigation Control Sidebar Layer */}
        <aside 
          style={{ width: isSidebarOpen ? `${sidebarWidth}px` : '0px' }}
          className={`${isDragging ? 'transition-none' : 'transition-all duration-300'} absolute md:relative z-40 h-full flex flex-col shrink-0 shadow-2xl overflow-hidden ${isSidebarOpen ? 'border-r' : 'border-r-0'} ${isDarkMode ? 'bg-[#0a0a0a] border-[#2a1b12]' : 'bg-stone-50 border-stone-200'}`}
        >
          <div style={{ width: `${sidebarWidth}px` }} className="p-6 flex-1 overflow-y-auto shrink-0 space-y-6">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 transition-colors ${isDarkMode ? 'text-[#8b4513]' : 'text-stone-500'}`}>Core Management</p>
              <div className="space-y-1.5">
                {[
                  { view: 'overview', label: 'Dashboard', icon: <FaTachometerAlt size={13} /> },
                  { view: 'paymentLedger', label: 'Finance', icon: <FaCreditCard size={13} className="text-emerald-500" /> },
                  { view: 'accountManager', label: 'Account Management', icon: <FaUserLock size={13} /> },
                  { view: 'registeredMembers', label: 'Member Registration', icon: <FaUsers size={13} /> },
                  { view: 'massSelection', label: 'Mass Deployment', icon: <FaClipboardList size={13} /> }
                ].map((link) => (
                  <button 
                    type="button" key={link.view} onClick={() => handleViewChange(link.view)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all outline-none cursor-pointer border ${
                      activeView === link.view 
                        ? (isDarkMode ? 'bg-[#1a110b] border-[#3d2b1f] text-[#d2b48c] shadow-inner' : 'bg-white border-stone-300 text-stone-900 shadow-sm font-black') 
                        : (isDarkMode ? 'bg-transparent border-transparent text-gray-400 hover:bg-[#111111] hover:text-white' : 'bg-transparent border-transparent text-stone-600 hover:bg-stone-200 hover:text-stone-900')
                    }`}
                  >
                    {link.icon} {link.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 transition-colors ${isDarkMode ? 'text-[#8b4513]' : 'text-stone-500'}`}>Communications & Content</p>
              <div className="space-y-1.5">
                {[
                  { view: 'executives', label: 'Executives', icon: <FaUsers size={13} /> },
                  { view: 'announcements', label: 'Announcements', icon: <FaBell size={13} /> },
                  { view: 'events', label: 'Events', icon: <FaCalendarAlt size={13} /> },
                  { view: 'gallery', label: 'Gallery', icon: <FaImages size={13} /> },
                  { view: 'adminMeeting', label: 'Meeting', icon: <FaUserEdit size={13} /> }
                ].map((link) => (
                  <button 
                    type="button" key={link.view} onClick={() => handleViewChange(link.view)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all outline-none cursor-pointer border ${
                      activeView === link.view 
                        ? (isDarkMode ? 'bg-[#1a110b] border-[#3d2b1f] text-[#d2b48c] shadow-inner' : 'bg-white border-stone-300 text-stone-900 shadow-sm font-black') 
                        : (isDarkMode ? 'bg-transparent border-transparent text-gray-400 hover:bg-[#111111] hover:text-white' : 'bg-transparent border-transparent text-stone-600 hover:bg-stone-200 hover:text-stone-900')
                    }`}
                  >
                    {link.icon} {link.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className={`pt-4 border-t ${isDarkMode ? 'border-white/5' : 'border-stone-200'}`}>
              <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-red-900/10 text-red-500 transition-colors text-left group font-bold uppercase tracking-widest text-[11px] outline-none cursor-pointer">
                <FaSignOutAlt className="group-hover:text-red-400" size={13} /> Sign Out Panel
              </button>
            </div>
          </div>

          {/* User Workspace Width Resizer Drag Handle Splitter */}
          <div 
            onMouseDown={() => setIsDragging(true)}
            className={`hidden md:block absolute top-0 right-0 w-1 h-full cursor-col-resize transition-colors z-50 ${isDarkMode ? 'hover:bg-[#8b4513]' : 'hover:bg-stone-400'}`}
          >
            <div className={`w-full h-full ${isDragging ? (isDarkMode ? 'bg-[#8b4513]' : 'bg-stone-400') : 'bg-transparent'}`}></div>
          </div>
        </aside>

        {/* 💻 Primary Content Canvas Wrapper Workspace Layout */}
        <main className={`flex-1 overflow-y-auto w-full h-full p-6 md:p-12 relative transition-colors duration-300 ${isDarkMode ? 'bg-[#050505]' : 'bg-stone-100'}`}>
          <div className="max-w-6xl mx-auto relative z-10 h-full">
            
            <header className={`mb-10 pb-6 border-b ${isDarkMode ? 'border-[#2a1b12]' : 'border-stone-200'}`}>
              <h1 className={`text-2xl md:text-3xl font-serif tracking-tight uppercase transition-all duration-200 ${isDarkMode ? 'text-[#d2b48c]' : 'text-stone-800 font-bold'}`}>
                {activeView === 'overview' ? 'Operational Overview' : headerMeta.title}
              </h1>
              <p className={`text-xs mt-2 uppercase tracking-[0.15em] font-light ${isDarkMode ? 'text-gray-500' : 'text-stone-500'}`}>
                {headerMeta.desc}
              </p>
            </header>

            {isViewLoading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <PulseLoader color={isDarkMode ? "#8b4513" : "#4f46e5"} size={10} margin={4} speedMultiplier={0.7} />
                <p className={`text-[9px] mt-6 font-bold uppercase tracking-[0.3em] animate-pulse ${isDarkMode ? 'text-[#d2b48c]' : 'text-stone-600'}`}>Syncing Database Matrix...</p>
              </div>
            ) : (
              <div className="w-full">
                
                {/* 📊 Dashboard Core Statistical Analytics Counter Row Block Layout Grid */}
                {activeView === 'overview' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {stats.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => item.view && handleViewChange(item.view)}
                          className={`border-l-4 ${item.color} p-5 rounded-xl shadow-xl flex justify-between items-center hover:-translate-y-0.5 transition-all duration-300 group ${item.view ? 'cursor-pointer' : ''} ${
                            isDarkMode ? 'bg-[#111111] border-y-[#2a1b12] border-r-[#2a1b12]' : 'bg-white border-y-stone-200 border-r-stone-200 shadow-stone-200/40'
                          }`}
                        >
                          <div>
                            <p className={`text-[9px] uppercase tracking-widest font-bold mb-1 ${isDarkMode ? 'text-gray-500' : 'text-stone-400'}`}>{item.label}</p>
                            <h3 className={`font-serif text-2xl transition-colors ${isDarkMode ? 'text-white group-hover:text-[#d2b48c]' : 'text-stone-800 font-bold group-hover:text-[#8b4513]'}`}>{item.value}</h3>
                          </div>
                          <div className={`${item.iconColor} text-xl opacity-30 group-hover:opacity-100 transition-opacity`}>
                            {item.icon}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Content Panel Control Routing Configurations Context Injections */}
                {activeView === 'paymentLedger' && <AdminPaymentLedger />}
                {activeView === 'massSelection' && <MassSelection />} 
                {activeView === 'announcements' && <AdminAnnouncements />}
                {activeView === 'events' && <AdminEvents />}
                {activeView === 'gallery' && <AdminGalleryManager />}
                {activeView === 'adminMeeting' && <AdminMeetingManager />}
                {activeView === 'accountManager' && <AccountManager />}
                {activeView === 'registeredMembers' && <MemberDirectory initialFilter="all" />}
                {activeView === 'pendingApprovals' && <MemberDirectory initialFilter="pending" />}
                
                {activeView === 'executives' && (
                  <div className="space-y-8">
                    <AdminExecutiveForm /> 
                    <ExecutiveList /> 
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;