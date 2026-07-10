import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrash, FaUserCircle } from 'react-icons/fa';
import { PulseLoader } from 'react-spinners';

// Grab the environment variable and strip any accidental trailing slashes
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const ExecutiveList = () => {
  const [executives, setExecutives] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExecutives = async (isMounted = true) => {
    try {
      setLoading(true);
      setError('');
      
      // ✅ UPDATED: Replaced hardcoded localhost with dynamic API_BASE_URL
      const response = await axios.get(`${API_BASE_URL}/api/executives?group=false`);
      
      if (isMounted) {
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          setExecutives(response.data.data);
        } else if (Array.isArray(response.data)) {
          setExecutives(response.data);
        } else {
          setExecutives([]);
        }
      }
    } catch (err) {
      console.error('Error fetching executives:', err);
      if (isMounted) setError('Failed to fetch individual executive archive files.');
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchExecutives(isMounted);
    return () => { isMounted = false; };
  }, []);

  const handleDelete = async (id) => {
    const safeExecutives = Array.isArray(executives) ? executives : [];
    const target = safeExecutives.find(ex => ex._id === id);
    
    if (!window.confirm(`Are you sure you want to delete ${target?.name || 'this executive'}? This will also delete their image from Cloudinary.`)) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      
      // ✅ UPDATED: Replaced hardcoded localhost with dynamic API_BASE_URL
      await axios.delete(`${API_BASE_URL}/api/executives/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setExecutives(prev => Array.isArray(prev) ? prev.filter((exec) => exec._id !== id) : []);
      alert('Executive record removed successfully!');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert('Session expired. Please log in again.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
        return;
      }
      setError(err.response?.data?.message || 'Failed to delete executive.');
      console.error('Error deleting executive:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <PulseLoader color="#8b4513" size={10} margin={4} />
        <p className="text-gray-400 text-xs uppercase tracking-widest font-bold ml-4">Loading individual records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-10 text-xs font-bold uppercase tracking-widest bg-red-950/10 border border-red-900/30 rounded-2xl p-4 max-w-md mx-auto">
        {error}
      </div>
    );
  }

  const targetExecutives = Array.isArray(executives) ? executives : [];

  return (
    <div className="bg-[#111111] border border-[#2a1b12] rounded-3xl p-8 shadow-2xl">
      <h3 className="text-xl font-bold text-[#d2b48c] mb-6 font-serif">All Individual Executives</h3>

      {targetExecutives.length === 0 ? (
        <p className="text-gray-400 text-center py-8 text-xs italic">No individual executives added yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#2a1b12]">
            <thead className="bg-[#161616]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-[#8b4513] uppercase tracking-widest">Image</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-[#8b4513] uppercase tracking-widest">Executive Name</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-[#8b4513] uppercase tracking-widest">Full Name</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-[#8b4513] uppercase tracking-widest">Position</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-[#8b4513] uppercase tracking-widest">Session</th>
                <th scope="col" className="px-6 py-3 text-right text-[10px] font-bold text-[#8b4513] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a1b12]">
              {targetExecutives.map((exec) => (
                <tr key={exec._id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {exec.imageUrl ? (
                      <img src={exec.imageUrl} alt={exec.name} className="w-10 h-10 rounded-xl object-cover border border-[#2a1b12]" />
                    ) : (
                      <FaUserCircle className="w-10 h-10 text-[#8b4513]/50" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-serif text-[#d2b48c]">{exec.executiveName || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{exec.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{exec.position}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{exec.sessionYear}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      type="button" 
                      onClick={() => handleDelete(exec._id)} 
                      className="text-gray-600 hover:text-red-500 transition-colors p-2"
                      title="Purge Executive Record"
                    >
                      <FaTrash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};