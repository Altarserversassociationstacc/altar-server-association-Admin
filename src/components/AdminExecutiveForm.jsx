import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaUserTie, FaImage, FaTrash, FaSync, FaCalendarAlt, FaUser, FaEdit, FaTimes, FaChevronDown, FaFolderOpen } from 'react-icons/fa';
import { PulseLoader } from 'react-spinners';

export const AdminExecutiveForm = () => {
  const initialFormState = {
    sessionYear: '2023/2024', 
    name: '',
    executiveName: '',
    position: '',
    bio: '',
    department: 'Computer Science', 
    email: '',
    phoneNumber: '',
    isGroupPhoto: false
  };

  const sessionOptions = [
    '2021/2022',
    '2022/2023',
    '2023/2024',
    '2024/2025',
    '2025/2026'
  ];

  const [formData, setFormData] = useState(initialFormState);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [executives, setExecutives] = useState([]); // Base state initialized as clean array
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editId, setEditId] = useState(null); 
  const [status, setStatus] = useState({ type: '', message: '' });

  const formRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    fetchExecutives(isMounted);
    return () => { isMounted = false; };
  }, []);

  const fetchExecutives = async (isMounted = true) => {
    setFetchLoading(true);
    try {
      const res = await axios.get('http://localhost:5001/api/executives');
      
      if (isMounted) {
        // Drill down inside the production success envelope data wrapper safely
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setExecutives(res.data.data);
        } else if (Array.isArray(res.data)) {
          // Fallback handle for raw array variations
          setExecutives(res.data);
        } else {
          setExecutives([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch archive:", err);
      if (isMounted) setExecutives([]);
    } finally {
      if (isMounted) setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file)); 
    }
  };

  const handleEdit = (exec) => {
    if (!exec) return;
    setEditId(exec._id);
    setFormData({
      sessionYear: exec.sessionYear || '2023/2024',
      executiveName: exec.executiveName || '',
      name: exec.name || '',
      position: exec.position || '',
      bio: exec.bio || '',
      department: exec.department || 'Computer Science',
      email: exec.email || '',
      phoneNumber: exec.phoneNumber || '',
      isGroupPhoto: exec.isGroupPhoto || false
    });
    setImage(null); 
    setPreview(exec.imageUrl || null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setFormData(initialFormState);
    setImage(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setStatus({ type: 'error', message: 'Session expired. Please log in again.' });
        setLoading(false);
        return;
      }

      if (!image && !editId) {
        setStatus({ type: 'error', message: 'A portrait photo file is strictly required.' });
        setLoading(false);
        return;
      }

      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      
      if (image) {
        data.append('image', image);
      }

      if (editId) {
        await axios.put(`http://localhost:5001/api/executives/${editId}`, data, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setStatus({ type: 'success', message: 'Leadership record updated successfully.' });
      } else {
        await axios.post('http://localhost:5001/api/executives', data, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setStatus({ type: 'success', message: formData.isGroupPhoto ? 'Group photo synced!' : 'Executive registered!' });
      }

      cancelEdit();
      fetchExecutives();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Operation failed during upload.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // Defensively ensure executives state matches array layout format before checking properties
    const safeExecutives = Array.isArray(executives) ? executives : [];
    const target = safeExecutives.find(ex => ex._id === id);
    if (!window.confirm(`Are you sure you want to delete ${target?.isGroupPhoto ? 'this group photo' : target?.name}?`)) return;

    setDeletingId(id);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`http://localhost:5001/api/executives/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExecutives(prev => Array.isArray(prev) ? prev.filter(ex => ex._id !== id) : []);
      setStatus({ type: 'success', message: 'Record removed successfully.' });
      if (editId === id) cancelEdit(); 
    } catch (err) {
      setStatus({ type: 'error', message: 'Delete operation failed.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-12 text-white">
      <div ref={formRef} className="w-full max-w-2xl bg-[#111111] border border-[#2a1b12] rounded-3xl p-8 shadow-2xl mx-auto">
        <header className="mb-10 text-center relative">
          {editId && (
            <button 
              type="button"
              onClick={cancelEdit}
              className="absolute right-0 top-0 flex items-center gap-1 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/30 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full transition-colors"
            >
              <FaTimes /> Cancel Edit
            </button>
          )}
          <div className="w-16 h-16 bg-[#8b4513]/10 border border-[#8b4513]/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUserTie className="text-[#8b4513] text-2xl" />
          </div>
          <h2 className="text-3xl font-serif text-[#d2b48c] mb-2 tracking-tight">
            {editId ? "Update Profile" : "Guild Leadership"}
          </h2>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">
            {editId ? "Modify existing ledger data attributes" : "Manage Executives"}
          </p>
        </header>

        {status.message && (
          <div className={`mb-8 p-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest text-center ${status.type === 'success' ? 'bg-green-900/20 border-green-900/50 text-green-500' : 'bg-red-900/20 border-red-900/50 text-red-500'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 bg-[#161616] border border-[#2a1b12] rounded-xl flex items-center justify-between transition-all hover:border-[#8b4513]/40">
            <div className="flex items-center gap-3">
              <FaImage className={formData.isGroupPhoto ? "text-[#8b4513]" : "text-gray-600"} />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#d2b48c]">Session Group Photo</span>
                <span className="text-[10px] text-gray-500">Toggle to upload the main group landing page view.</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="isGroupPhoto" checked={formData.isGroupPhoto} onChange={handleChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-[#0f0f0f] border border-[#2a1b12] rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-gray-600 peer-checked:after:bg-[#d2b48c] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8b4513]/20 peer-checked:border-[#8b4513]"></div>
            </label>
          </div>
           
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Executive Name</label>
              <div className="relative">
                <FaUserTie className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <input required name="executiveName" value={formData.executiveName} onChange={handleChange} type="text" placeholder={formData.isGroupPhoto ? "e.g. St. Thomas Aquinas Council" : "e.g. Master Makuo"} className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl py-4 pl-12 pr-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Session Year</label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                <select 
                  required 
                  name="sessionYear" 
                  value={formData.sessionYear} 
                  onChange={handleChange} 
                  className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl py-4 pl-12 pr-10 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none appearance-none cursor-pointer"
                >
                  {sessionOptions.map(year => (
                    <option key={year} value={year} className="bg-[#111111]">{year}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none text-[10px]" />
              </div>
            </div>
          </div>

          {!formData.isGroupPhoto && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Full Name</label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input required name="name" value={formData.name} onChange={handleChange} type="text" placeholder="Egwuonwu Makuo" className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl py-4 pl-12 pr-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Position</label>
                  <input required name="position" value={formData.position} onChange={handleChange} type="text" placeholder="Sec Gen" className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl py-4 px-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Department</label>
                  <input required name="department" value={formData.department} onChange={handleChange} type="text" className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl py-4 px-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Bio Profile</label>
                <textarea required name="bio" value={formData.bio} onChange={handleChange} rows="4" placeholder="Enter the executive's full bio here..." className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl p-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none resize-none shadow-inner transition-all" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Email</label>
                  <input required name="email" value={formData.email} onChange={handleChange} type="email" placeholder="vitalismakuochukwu@gmail.com" className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl py-4 px-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Phone Number</label>
                  <input required name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} type="tel" placeholder="07026139914" className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl py-4 px-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none" />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-[10px] uppercase text-[#8b4513] font-bold ml-1">Image Asset</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer group">
                <div className="w-full h-24 bg-[#161616] border-2 border-dashed border-[#2a1b12] group-hover:border-[#8b4513]/50 rounded-2xl flex flex-col items-center justify-center transition-all">
                  <span className="text-[10px] uppercase text-gray-500 font-bold">
                    {editId ? "Update Portrait (Optional)" : "Select Portrait Asset"}
                  </span>
                </div>
                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </label>
              {preview && (
                <div className="w-24 h-24 rounded-2xl border border-[#2a1b12] overflow-hidden">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-[#8b4513] to-[#5c4033] py-4 rounded-xl text-white font-bold uppercase tracking-widest text-xs shadow-lg transition-all flex justify-center items-center gap-3 disabled:opacity-50">
            {loading ? (
              <PulseLoader color="#ffffff" size={8} />
            ) : editId ? (
              "Save Modifications"
            ) : (
              "Publish to Archive"
            )}
          </button>
        </form>
      </div>

      {/* Archive Grid Ledger */}
      <div className="max-w-4xl mx-auto">
        <h3 className="text-xl font-serif text-[#d2b48c] mb-6 border-b border-[#2a1b12] pb-4 flex items-center gap-3">
          <FaSync className={fetchLoading ? "animate-spin text-[#8b4513]" : "text-[#8b4513]"} /> Leadership Archive
        </h3>
        {fetchLoading ? (
          <div className="text-center py-10"><PulseLoader color="#8b4513" /></div>
        ) : Array.isArray(executives) && executives.length > 0 ? (
          <div className="flex flex-col gap-4">
            {executives.map(ex => (
              <div key={ex._id} className="bg-[#111111] border border-[#2a1b12] p-4 rounded-2xl flex items-center justify-between group hover:border-[#3d2b1f] transition-all">
                <div className="flex items-center gap-4">
                  <img src={ex.imageUrl} alt="Profile" className="w-12 h-12 rounded-lg object-cover border border-[#2a1b12]" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border text-[#8b4513] bg-[#8b4513]/10 border-[#8b4513]/20">
                        {ex.isGroupPhoto ? 'Session Portrait' : ex.position}
                      </span>
                      <span className="text-gray-500 text-[8px] font-medium uppercase tracking-tighter">{ex.sessionYear}</span>
                    </div>
                    <h4 className="text-white font-serif text-sm group-hover:text-[#d2b48c] transition-colors">
                      {ex.isGroupPhoto 
                        ? (ex.executiveName || 'Official Group Photo') 
                        : (ex.executiveName ? `${ex.executiveName} (${ex.name})` : ex.name)
                      }
                    </h4>
                  </div>
                </div>
                
                {/* Control Actions Row */}
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => handleEdit(ex)} 
                    className="bg-blue-500 hover:bg-blue-700 text-white text-xs p-2 rounded-full shadow-lg transition-all"
                    title="Edit Executive"
                  >
                    <FaEdit size={13} />
                  </button>
                  <button 
                    type="button"
                    disabled={deletingId === ex._id} 
                    onClick={() => handleDelete(ex._id)} 
                    className="bg-red-500 hover:bg-red-700 text-white text-xs p-2 rounded-full shadow-lg transition-all"
                    title="Delete Entry"
                  >
                    {deletingId === ex._id ? <PulseLoader size={2} color="#ffffff" /> : <FaTrash size={12} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full py-16 bg-[#111111]/40 border border-dashed border-[#2a1b12] rounded-2xl flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-full bg-[#8b4513]/10 border border-[#8b4513]/20 flex items-center justify-center text-[#8b4513] mb-3">
              <FaFolderOpen size={18} />
            </div>
            <h4 className="text-sm font-serif text-[#d2b48c] mb-1">No Ledger Records Loaded</h4>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
              The administrative ledger records are empty. Initialise profiles above to seed the archive.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};