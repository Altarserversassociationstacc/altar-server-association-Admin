import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PulseLoader } from 'react-spinners';

// Grab the environment variable and strip any accidental trailing slashes (just like AccountManager)
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const AnnouncementList = ({ refreshTrigger }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('adminToken');
        
        // 🔒 SECURE SHIELD HANDSHAKE: Passes token credentials to clear backend 'protect' middleware
        // Updated to use the dynamic API_BASE_URL instead of localhost
        const response = await axios.get(`${API_BASE_URL}/api/admin/announcements`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setAnnouncements(response.data);
      } catch (err) {
        console.error(" Roster compile intercepted:", err);
        setError(err.response?.data?.message || 'Failed to sync announcement registry.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [refreshTrigger]); // Fires cleanly whenever manager bumps the state count key

  if (loading) {
    return (
      <div className="py-12 text-center space-y-3">
        <PulseLoader color="#d2b48c" size={8} margin={2} />
        <p className="text-gray-500 text-2xs uppercase tracking-widest">Recompiling Broadcast Registry...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-[#2a1b12] rounded-xl p-6 shadow-2xl">
      <h3 className="font-serif text-md text-[#d2b48c] uppercase tracking-wider mb-4 border-b border-[#2a1b12] pb-2">Active Broadcast Ledger</h3>
      {error && <div className="p-3 mb-4 bg-red-900/20 text-red-400 text-xs rounded-lg font-bold">{error}</div>}
      
      {announcements.length === 0 ? (
        <p className="text-gray-500 text-xs font-serif italic text-center py-6">No published broadcasts found inside system cluster nodes.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <div key={item._id} className="p-4 bg-[#0a0a0a] border border-[#2a1b12] rounded-lg">
              <p className="text-gray-200 text-xs leading-relaxed">{item.content}</p>
              <span className="text-[9px] text-gray-500 font-mono block mt-2">{new Date(item.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
