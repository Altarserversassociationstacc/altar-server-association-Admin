import React, { useState } from 'react';
import axios from 'axios';
import { FaImages, FaHeading, FaTag, FaUpload } from 'react-icons/fa';
import { PulseLoader } from 'react-spinners';

export const AdminGalleryForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      
      const data = new FormData();
      data.append('title', formData.title);
      data.append('image', imageFile);

      await axios.post('http://localhost:5001/api/gallery', data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('Memory added to gallery successfully!');
      setFormData({ title: '' });
      setImageFile(null);
      e.target.reset(); // Reset file input
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload to gallery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-[#2a1b12] rounded-3xl p-6 shadow-2xl">
      <header className="mb-6 text-center">
        <div className="w-12 h-12 bg-[#8b4513]/10 border border-[#8b4513]/30 rounded-full flex items-center justify-center mx-auto mb-3">
          <FaImages className="text-[#8b4513] text-xl" />
        </div>
        <h2 className="text-2xl font-serif text-[#d2b48c] mb-1 tracking-tight">Gallery Archives</h2>
        <p className="text-gray-500 text-[9px] uppercase tracking-widest font-bold">Documenting our Sacred Service</p>
      </header>

      {error && (
        <div className="mb-6 p-3 bg-red-900/20 border border-red-900/50 text-red-500 text-[9px] font-bold uppercase tracking-widest rounded-xl text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[9px] uppercase text-[#8b4513] font-bold ml-1">Moment Title</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-600 group-focus-within:text-[#8b4513] transition-colors">
              <FaHeading size={12} />
            </div>
            <input required name="title" value={formData.title} onChange={handleChange} type="text" placeholder="e.g. Christmas Eve Vigil" className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl py-3 pl-10 pr-4 text-sm text-[#d2b48c] focus:border-[#8b4513] outline-none transition-all shadow-inner" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] uppercase text-[#8b4513] font-bold ml-1">Upload Server Image</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-600 group-focus-within:text-[#8b4513] transition-colors">
              <FaUpload size={12} />
            </div>
            <input required onChange={handleFileChange} type="file" accept="image/*" className="w-full bg-[#161616] border border-[#2a1b12] rounded-xl py-3 pl-10 pr-4 text-sm text-gray-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-[#8b4513]/10 file:text-[#d2b48c] hover:file:bg-[#8b4513]/20 transition-all cursor-pointer" />
          </div>
        </div>

        <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-[#8b4513] to-[#5c4033] py-3.5 rounded-xl text-white font-bold uppercase tracking-widest text-[10px] shadow-lg hover:-translate-y-0.5 transition-all flex justify-center items-center gap-3 disabled:opacity-50 mt-4">
          {loading ? <PulseLoader color="#ffffff" size={6} /> : "Add to Gallery"}
        </button>
      </form>
    </div>
  );
};