import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5001' 
  : 'https://your-backend-app.onrender.com'; // 👈 PASTE YOUR REAL RENDER URL HERE

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

export default api;