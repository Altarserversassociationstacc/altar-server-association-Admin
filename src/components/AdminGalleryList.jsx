import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrash, FaSync, FaImages, FaCalendarAlt, FaDownload } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';

export const AdminGalleryList = ({ refreshTrigger }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5001/api/gallery');
      setImages(res.data);
    } catch (err) {
      console.error("Gallery Fetch Error:", err);
      setError('Failed to load gallery history.');
    } finally {
      setTimeout(() => setLoading(false), 1200);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, [refreshTrigger]);

  // Helper to ensure images load correctly from the backend
  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:5001/${path.startsWith('/') ? path.slice(1) : path}`;
  };

  const handleDownload = async (imageUrl, title) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_') || 'sacred_memory'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this image from the archives?")) {
      try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(`http://localhost:5001/api/gallery/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setImages(images.filter(img => img._id !== id));
      } catch (err) {
        alert("Failed to delete image.");
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 bg-[#111111]/30 rounded-3xl border border-dashed border-[#2a1b12]">
      <ClipLoader color="#8b4513" size={40} />
      <p className="mt-4 text-gray-500 text-[10px] uppercase tracking-widest flex items-center gap-2"><FaSync className="animate-spin" /> Fetching Archives...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-4 border-b border-[#2a1b12] pb-4">
        <h3 className="text-xl font-serif text-[#d2b48c] flex items-center gap-3">
          <FaImages className="text-[#8b4513]" /> Gallery History
        </h3>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">{images.length} Captures</span>
      </header>

      {error && <p className="text-red-500 text-xs text-center">{error}</p>}

      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-2">
        {images.length > 0 ? (
          images.map((img) => (
            <div key={img._id} className="bg-[#111111] border border-[#2a1b12] rounded-2xl overflow-hidden group hover:border-[#8b4513]/40 transition-all flex flex-col">
              <div className="aspect-square relative overflow-hidden bg-black">
                <img src={getImageUrl(img.imageUrl)} alt={img.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                    <button 
                      onClick={() => handleDownload(getImageUrl(img.imageUrl), img.title)}
                      className="bg-black/60 hover:bg-[#8b4513]/80 text-white p-1.5 rounded-full backdrop-blur-md transition-all shadow-xl"
                    >
                      <FaDownload size={10} />
                    </button>
                    <button 
                      onClick={() => handleDelete(img._id)}
                      className="bg-black/60 hover:bg-red-900/80 text-white p-1.5 rounded-full backdrop-blur-md transition-all shadow-xl"
                    >
                      <FaTrash size={10} />
                    </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                    <span className="text-[#8b4513] text-[6px] font-bold uppercase tracking-widest bg-[#8b4513]/10 px-1 py-0.5 rounded border border-[#8b4513]/20">{img.category || 'Service'}</span>
                </div>
              </div>
              <div className="p-2">
                <h4 className="text-white font-serif text-[10px] mb-0.5 group-hover:text-[#d2b48c] transition-colors truncate leading-tight">{img.title}</h4>
                <div className="flex items-center gap-1 text-gray-600 text-[7px] uppercase tracking-tighter">
                    <FaCalendarAlt size={6} /> {new Date(img.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 border-2 border-dashed border-[#2a1b12] rounded-3xl">
            <p className="text-gray-600 text-xs uppercase tracking-widest">No pictures in history</p>
          </div>
        )}
      </div>
    </div>
  );
};