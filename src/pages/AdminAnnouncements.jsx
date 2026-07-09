import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBell, FaHeading, FaTag, FaAlignLeft, FaEnvelope, FaTrash, FaCalendarAlt, FaSync } from 'react-icons/fa';
import { PulseLoader } from 'react-spinners';

// Grab the environment variable and strip any accidental trailing slashes
const API_BASE_URL = (import.meta.env.VITE_API_URL|| 'http://localhost:5001').replace(/\/$/, '');

const AdminAnnouncements = () => {
  // Global form variables tracking configuration attributes dynamically
  const [formData, setFormData] = useState({
    title: '',
    category: 'General',
    content: '',
    sendAsEmail: false 
  });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const categories = ["General", "Liturgical", "Sanitation", "Meeting", "Urgent"];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // 📡 Secure Fetch Stream Ledger Array Configuration
  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const res = await axios.get(`${API_BASE_URL}/api/admin/announcements`, {
        headers: {
          Authorization: `Bearer ${token}` // ✅ FIXED: Appended token validation payload header parameters
        }
      });
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Error fetching announcements database collections:", err);
    } finally {
      setFetchLoading(false);
    }
  };

  // Smart state binding intercept handling regular string text inputs and checkboxes fluidly
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  // 📡 Secure Submission Dispatch Pipeline
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const token = localStorage.getItem('adminToken');
      
      // ✅ FIXED: Injected the required authorization perimeter header credentials pass
      await axios.post(`${API_BASE_URL}/api/admin/announcements`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setStatus({ type: 'success', message: 'Announcement broadcasted successfully!' });
      setFormData({ title: '', category: 'General', content: '', sendAsEmail: false });
      fetchAnnouncements(); 
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || 'Failed to send announcement.' });
    } finally {
      setLoading(false);
    }
  };

  // 📡 Secure Deletion Execution Module
  const handleDelete = async (id) => {
    const announcement = announcements.find(a => a._id === id);
    if (!window.confirm(`Are you sure you want to permanently delete "${announcement?.title}"?`)) return;
    
    setDeletingId(id);
    setStatus({ type: '', message: '' });

    try {
      const token = localStorage.getItem('adminToken');
      
      // ✅ FIXED: Connected secure context mapping around data purges execution route
      await axios.delete(`${API_BASE_URL}/api/admin/announcements/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      setStatus({ type: 'success', message: 'Broadcast record permanently dropped.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Operational failure during deletion.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-12 font-sans">
      
      {/* Dynamic Form Entry Container Card */}
      <div className="w-full max-w-xl bg-[#111111] border border-[#2a1b12] rounded-3xl p-8 shadow-2xl mx-auto">
        <header className="mb-10 text-center">
          <div className="w-16 h-16 bg-[#8b4513]/10 border border-[#8b4513]/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBell className="text-[#8b4513] text-2xl" />
          </div>
          <h2 className="text-3xl font-serif text-[#d2b48c] mb-2">The Clarion Call</h2>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-black">Broadcast Association Update</p>
        </header>

        {status.message && (
          <div className={`mb-8 p-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest text-center ${status.type === 'success' ? 'bg-green-900/20 border-green-900/50 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase text-[#8b4513] font-black ml-1 tracking-wider">Title</label>
            <div className="relative">
              <FaHeading className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={12} />
              <input required name="title" value={formData.title} onChange={handleChange} type="text" placeholder="e.g. Saturday Morning Wash" className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl py-4 pl-12 pr-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase text-[#8b4513] font-black ml-1 tracking-wider">Category</label>
            <div className="relative">
              <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={12} />
              <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl py-4 pl-12 pr-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none appearance-none cursor-pointer">
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase text-[#8b4513] font-black ml-1 tracking-wider">Message Content</label>
            <div className="relative">
              <FaAlignLeft className="absolute left-4 top-5 text-gray-600" size={12} />
              <textarea required name="content" value={formData.content} onChange={handleChange} rows="5" placeholder="Details of the update..." className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl py-4 pl-12 pr-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none transition-all resize-none shadow-inner" />
            </div>
          </div>

          <div className="p-4 bg-[#161616] border border-[#2a1b12] rounded-xl flex items-center justify-between transition-all hover:border-[#8b4513]/40">
            <div className="flex items-center gap-3">
              <FaEnvelope className={formData.sendAsEmail ? "text-[#8b4513] transition-colors" : "text-gray-600 transition-colors"} size={14} />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#d2b48c]">Email Broadcast Notification</span>
                <span className="text-[10px] text-gray-500">Dispatch this notification to vetted association accounts.</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input type="checkbox" name="sendAsEmail" checked={formData.sendAsEmail} onChange={handleChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-[#0f0f0f] border border-[#2a1b12] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-gray-600 peer-checked:after:bg-[#d2b48c] after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8b4513]/20 peer-checked:border-[#8b4513]"></div>
            </label>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-[#8b4513] to-[#5c4033] py-4 rounded-xl text-white font-bold uppercase tracking-widest text-xs shadow-lg hover:-translate-y-1 transition-all flex justify-center items-center gap-3 disabled:opacity-50">
            {loading ? <PulseLoader color="#ffffff" size={8} /> : "Broadcast Update"}
          </button>
        </form>
      </div>

      {/* Historical Ledger Record Index Panels */}
      <div className="max-w-4xl mx-auto">
        <h3 className="text-xl font-serif text-[#d2b48c] mb-8 border-b border-[#2a1b12] pb-4 flex items-center gap-3 select-none">
          <FaSync className={fetchLoading ? "animate-spin text-[#8b4513]" : "text-[#8b4513]"} size={14} /> 
          Announcement History
        </h3>
        
        {fetchLoading ? (
          <div className="text-center py-20"><PulseLoader color="#8b4513" size={10} /></div>
        ) : (
          <div className="flex flex-col gap-4">
            {announcements.map(announcement => (
              <div key={announcement._id} className="bg-[#111111] border border-[#2a1b12] p-6 rounded-2xl flex items-center justify-between group hover:border-[#3d2b1f] transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-[#8b4513] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-[#8b4513]/10 rounded border border-[#8b4513]/20">
                      {announcement.category}
                    </span>
                    <span className="text-gray-500 text-[9px] font-bold uppercase flex items-center gap-1">
                      <FaCalendarAlt size={8} /> {new Date(announcement.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-white font-serif text-lg group-hover:text-[#d2b48c] transition-colors truncate">{announcement.title}</h4>
                  <p className="text-gray-400 text-xs mt-1 italic font-light line-clamp-1">"{announcement.content}"</p>
                </div>
                
                <div className="ml-4 shrink-0">
                  <button 
                    disabled={deletingId === announcement._id}
                    onClick={() => handleDelete(announcement._id)} 
                    className={`transition-colors p-2 rounded-lg hover:bg-red-500/5 outline-none ${deletingId === announcement._id ? 'opacity-50' : 'text-gray-600 hover:text-red-500'}`}
                  >
                    {deletingId === announcement._id ? (
                      <PulseLoader size={3} color="#ef4444" margin={1} />
                    ) : (
                      <FaTrash size={13} />
                    )}
                  </button>
                </div>
              </div>
            ))}
            
            {announcements.length === 0 && (
              <p className="text-center text-gray-600 text-xs py-12 uppercase tracking-widest font-medium">No broadcast history found inside systems registers.</p>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminAnnouncements;