import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaUpload, FaHeading, FaList, FaMapMarkerAlt, FaClock, FaTrash, FaEdit, FaTimes, FaSync } from 'react-icons/fa';
import { PulseLoader } from 'react-spinners';

const AdminEvents = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    narration: '',
    eventDate: '',
    time: '',
    location: '',
    image: null
  });
  const [events, setEvents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  // 🎯 Key helper state used to force clear HTML5 file field cache streams on submission
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const categories = ["All Events", "General", "General Meetings", "General Practice", "ASA Novena", "ASA Chaplaincy Cup", "Sendforth Events"];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setFetchLoading(true);
      const res = await axios.get('http://localhost:5001/api/events');
      setEvents(res.data);
    } catch (err) {
      console.error("❌ [History Sync Drop]:", err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'image') {
        if (formData[key] instanceof File) data.append(key, formData[key]);
      } else if (formData[key] !== undefined && formData[key] !== null) {
        data.append(key, formData[key]);
      }
    });

    try {
      const token = localStorage.getItem('adminToken');
      const config = {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' // Ensuring seamless binary streaming boundary mappings
        }
      };

      if (editingId) {
        await axios.put(`http://localhost:5001/api/events/${editingId}`, data, config);
        setStatus({ type: 'success', message: 'Event entry modified successfully!' });
      } else {
        await axios.post('http://localhost:5001/api/events', data, config);
        setStatus({ type: 'success', message: 'New event flyer and narration published to live archives!' });
      }
      
      // Reset form controls completely
      setFormData({ title: '', category: 'Workshops', description: '', narration: '', eventDate: '', time: '', location: '', image: null });
      setEditingId(null);
      setFileInputKey(Date.now()); // ✨ Instantly resets the file selector layout text cleanly!
      fetchEvents();
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || 'Transaction matrix failed to execute.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingId(event._id);
    setFormData({
      title: event.title || '',
      category: event.category || 'Workshops',
      description: event.description || '',
      narration: event.narration || '',
      eventDate: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '',
      time: event.time || '',
      location: event.location || '',
      image: null 
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will delete the flyer permanently from the cloud index registries.")) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`http://localhost:5001/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvents();
      setStatus({ type: 'success', message: 'Target event resource deleted successfully.' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Resource elimination operation failed.' });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', category: 'Workshops', description: '', narration: '', eventDate: '', time: '', location: '', image: null });
    setFileInputKey(Date.now());
  };

  return (
    <div className="space-y-12 animate-fadeIn text-white pb-16 selection:bg-[#8b4513]/30">
      {/* Form Section */}
      <div className="w-full max-w-3xl bg-[#111111] border border-[#2a1b12] rounded-[32px] p-8 md:p-12 shadow-2xl mx-auto relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-[#8b4513] rounded-full blur-[120px] opacity-5 pointer-events-none" />
        
        <header className="mb-10 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-serif text-[#d2b48c] mb-2 tracking-tight">
            {editingId ? "Modify Existing Event" : "Publish Guild Event"}
          </h2>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Event & Narration Management</p>
        </header>

        {status.message && (
          <div className={`mb-8 p-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest text-center animate-fadeIn ${status.type === 'success' ? 'bg-green-900/20 border-green-900/50 text-green-500' : 'bg-red-900/20 border-red-900/50 text-red-500'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Event Title</label>
              <div className="relative">
                <FaHeading className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <input required name="title" value={formData.title} onChange={handleChange} type="text" placeholder="e.g. Sanctuary Mastery 2026" className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl py-4 pl-12 pr-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Category</label>
              <div className="relative">
                <FaList className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl py-4 pl-12 pr-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none appearance-none cursor-pointer">
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Date</label>
              <input required name="eventDate" value={formData.eventDate} onChange={handleChange} type="date" className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl p-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none cursor-text" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Time</label>
              <div className="relative">
                <FaClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <input required name="time" value={formData.time} onChange={handleChange} type="text" placeholder="9:00 AM" className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl py-4 pl-12 pr-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Location</label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <input required name="location" value={formData.location} onChange={handleChange} type="text" placeholder="STACC Hall" className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl py-4 pl-12 pr-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Brief Description (Card Summary)</label>
            <textarea required name="description" value={formData.description} onChange={handleChange} rows="2" placeholder="Provide a summary text snippet for grid views..." className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl p-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none resize-none" />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Full Narration (Deep Operational Guidelines)</label>
            <textarea required name="narration" value={formData.narration} onChange={handleChange} rows="4" placeholder="Enter exhaustive parameters, agendas, and deep session notes here..." className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl p-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none resize-none" />
          </div>

          {/* Flyer Asset Element Frame Wrapper */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Event Flyer Asset</label>
            <div key={fileInputKey} className="relative group border-2 border-dashed border-[#2a1b12] hover:border-[#8b4513]/60 rounded-2xl p-8 text-center transition-all bg-[#0d0d0d] shadow-inner">
              <FaUpload className={`mx-auto mb-3 text-2xl group-hover:animate-bounce ${editingId ? 'text-gray-600' : 'text-[#8b4513]'}`} />
              <p className="text-gray-400 text-[10px] mb-2 uppercase tracking-widest font-bold">
                {editingId ? "Leave empty to retain asset link footprint" : "Upload Digital Media Flyer"}
              </p>
              <input 
                required={!editingId}
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
              {formData.image && <p className="text-[#8b4513] text-[9px] font-bold uppercase tracking-tight mt-1">{formData.image.name}</p>}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button disabled={loading} type="submit" className="flex-1 bg-gradient-to-r from-[#8b4513] to-[#5c4033] py-4 rounded-xl text-white font-bold uppercase tracking-widest text-xs shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex justify-center items-center gap-3 disabled:opacity-50">
              {loading ? <PulseLoader color="#ffffff" size={6} /> : editingId ? "Save Modifications" : "Publish Resource Block"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="px-5 bg-[#161616] border border-[#2a1b12] text-gray-500 rounded-xl hover:text-white hover:border-gray-700 transition-colors">
                <FaTimes />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Grid Table Ledger List Section */}
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-serif text-[#d2b48c] mb-6 border-b border-[#2a1b12] pb-4 flex items-center gap-3">
          <FaSync className={fetchLoading ? "animate-spin text-[#8b4513]" : "text-[#8b4513]"} /> Catalog Archive Inventory
        </h3>
        {fetchLoading ? (
          <div className="text-center py-16"><PulseLoader color="#8b4513" size={10} /></div>
        ) : (
          <div className="flex flex-col gap-4">
            {events.map(event => {
              const isPast = new Date(event.eventDate) < new Date();
              return (
                <div key={event._id} className="bg-[#111111] border border-[#2a1b12] p-5 rounded-2xl flex items-center justify-between group hover:border-[#3d2b1f] transition-all">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <span className="text-[#8b4513] text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 bg-[#8b4513]/10 rounded border border-[#8b4513]/20">
                        {event.category}
                      </span>
                      <span className={`text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 ${isPast ? 'text-gray-600' : 'text-green-500'}`}>
                        {isPast ? '• Archived' : '• Active'}
                      </span>
                      <span className="text-gray-500 text-[8px] font-bold uppercase tracking-tight">
                        {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="text-white font-serif text-sm group-hover:text-[#d2b48c] transition-colors truncate">{event.title}</h4>
                    <p className="text-gray-500 text-[11px] mt-0.5 italic font-light truncate">"{event.description || "No description entry metadata saved."}"</p>
                  </div>
                  <div className="flex items-center gap-4 text-gray-500 flex-shrink-0">
                    <button onClick={() => handleEdit(event)} className="hover:text-blue-500 transition-colors p-1"><FaEdit size={13} /></button>
                    <button onClick={() => handleDelete(event._id)} className="hover:text-red-500 transition-colors p-1"><FaTrash size={12} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEvents;