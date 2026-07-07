import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FaCircleNotch, FaSearch, FaHistory, FaCheckCircle, 
  FaExclamationTriangle, FaDownload, FaWallet, FaTag,
  FaSlidersH, FaSave
} from 'react-icons/fa';

const AdminPaymentLedger = () => {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // 🎛️ Admin Rate Configuration States
  const [configNarration, setConfigNarration] = useState('Sessional Dues');
  const [configAmount, setConfigAmount] = useState('');
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);
  const [configFeedback, setConfigFeedback] = useState({ type: '', message: '' });

  // FIXED: Standardized environment variable and stripped the trailing slash to prevent '//api' errors
  const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

  // 🛡️ Centralized & Sanitized Auth Headers Helper
  const getAuthHeaders = useCallback(() => {
    let token = localStorage.getItem('adminToken') || 
                localStorage.getItem('admintoken') || 
                localStorage.getItem('token'); 
    
    if (!token || token === 'null' || token === 'undefined') {
      return { 'Content-Type': 'application/json' };
    }

    token = token.replace(/^"|"$/g, '');

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  // 🔄 Fetch initial ledger histories
  useEffect(() => {
    const fetchLedger = async () => {
      const headers = getAuthHeaders();

      if (!headers.Authorization) {
        console.error("Authentication Error: No valid token found in LocalStorage.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/payment/history`, { headers });
        const output = await response.json();
        
        if (output.success) {
          // 🗑️ Filter out any 'pending' status records right at the source
          const cleanLedger = output.data.filter(item => item.status !== 'pending');
          setLedger(cleanLedger);
        } else {
          console.error("Ledger Fetch Error:", output.message);
        }
      } catch (err) {
        console.error("Could not fetch ledger logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLedger();
  }, [API_BASE_URL, getAuthHeaders]);

  // 📡 Submit handler to change base fees on the backend matrix
  const handleUpdateFeeMatrix = async (e) => {
    e.preventDefault();
    setConfigFeedback({ type: '', message: '' });

    const numericAmount = Number(configAmount);
    if (!numericAmount || numericAmount <= 0) {
      return setConfigFeedback({ type: 'error', message: 'Please declare a valid numeric currency valuation.' });
    }

    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      return setConfigFeedback({ type: 'error', message: 'Session expired. Please log in again.' });
    }

    setIsUpdatingConfig(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/update-fee-matrix`, {
        method: 'POST',
        headers, 
        body: JSON.stringify({
          narration: configNarration,
          amount: numericAmount
        })
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        setConfigFeedback({
          type: 'success',
          message: `${configNarration} adjusted to ₦${numericAmount.toLocaleString()} successfully.`
        });
        setConfigAmount(''); 
      } else {
        throw new Error(data.message || 'Failed updating authorization rules on gateway registry.');
      }
    } catch (err) {
      setConfigFeedback({ type: 'error', message: err.message || 'Network link verification timeout.' });
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  // 🔍 Dynamic Search & Filter Logic
  const filteredLedger = useMemo(() => {
    return ledger.filter(item => {
      const safeName = item.studentName || '';
      const safeRef = item.reference || '';
      
      const matchesSearch = safeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            safeRef.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [ledger, searchQuery, statusFilter]);

  // 📊 Live Revenue Analytics
  const stats = useMemo(() => {
    const successfulTxs = ledger.filter(item => item.status === 'success');
    return {
      totalRevenue: successfulTxs.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
      successCount: successfulTxs.length
    };
  }, [ledger]);

  // 📥 CSV Export Utility for Auditing
  const exportToCSV = () => {
    if (filteredLedger.length === 0) return;
    const headers = ["Date", "Student Name", "Reference", "Narration", "Level", "Session", "Amount", "Status"];
    
    const escapeCSV = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

    const csvContent = [
      headers.join(","),
      ...filteredLedger.map(row => {
        const date = new Date(row.createdAt || row.paidAt).toLocaleDateString();
        return [
          escapeCSV(date),
          escapeCSV(row.studentName),
          escapeCSV(row.reference),
          escapeCSV(row.narration),
          escapeCSV(row.targetLevel),
          escapeCSV(row.academicYear),
          escapeCSV(row.amount),
          escapeCSV(row.status)
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `payment_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); 
  };

  if (loading) {
    return (
      <div className="min-h-full bg-[#050505] flex flex-col items-center justify-center py-32 text-white">
        <FaCircleNotch className="animate-spin text-[#d2b48c] mb-4" size={32} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d2b48c]">Syncing Ledger Matrix...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] text-gray-100 font-sans w-full p-4 md:p-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8 border-b border-[#2a1b12] pb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-serif text-[#d2b48c] tracking-wide uppercase flex items-center gap-3">
                <FaHistory className="text-[#8b4513]" size={20} /> Financial Operations Ledger Matrix
              </h2>
              <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Audit real-time transactional metrics and distribute baseline dynamic variables</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            <div className="bg-[#0a0a0a] border border-[#3d2b1f] rounded-2xl p-5 shadow-xl lg:col-span-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#d2b48c] mb-4 flex items-center gap-2">
                <FaSlidersH className="text-[#8b4513]" size={12} /> Fee Rate Registry Injector
              </h3>
              
              <form onSubmit={handleUpdateFeeMatrix} className="space-y-4">
                <div>
                  <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500 block mb-1">Target Account Narration</label>
                  <select 
                    value={configNarration}
                    disabled={isUpdatingConfig}
                    onChange={(e) => setConfigNarration(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2a1b12] text-xs rounded-lg px-3 py-2.5 text-gray-300 focus:outline-none focus:border-[#8b4513]"
                  >
                    <option value="Sessional Dues">Sessional Dues</option>
                    <option value="Other Clearance">Other Clearance</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500 block mb-1">Enforced Value Amount (₦)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-gray-500">₦</span>
                    <input 
                      type="number" required
                      value={configAmount}
                      disabled={isUpdatingConfig}
                      placeholder="e.g. 5000"
                      onChange={(e) => setConfigAmount(e.target.value)}
                      className="w-full bg-[#111111] border border-[#2a1b12] font-mono text-xs rounded-lg pl-7 pr-3 py-2.5 text-white focus:outline-none focus:border-[#8b4513]"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isUpdatingConfig}
                  className="w-full bg-[#8b4513] hover:bg-[#a0522d] disabled:bg-[#3d2b1f] text-white py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer outline-none shadow-md"
                >
                  {isUpdatingConfig ? (
                    <><FaCircleNotch className="animate-spin" size={10} /> Broad Casting...</>
                  ) : (
                    <><FaSave size={10} /> Sync New Rate To Frontend</>
                  )}
                </button>
              </form>

              {configFeedback.message && (
                <div className={`mt-3 p-3 rounded-lg text-[10px] tracking-wide border flex items-start gap-2 ${
                  configFeedback.type === 'success' 
                    ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
                    : 'bg-rose-950/20 border-rose-900/40 text-rose-400'
                }`}>
                  {configFeedback.type === 'success' ? <FaCheckCircle size={12} className="shrink-0 mt-0.5" /> : <FaExclamationTriangle size={12} className="shrink-0 mt-0.5" />}
                  <span>{configFeedback.message}</span>
                </div>
              )}
            </div>

            {/* LIVE REVENUE ANALYTICS CARDS */}
            <div className="lg:col-span-2 flex h-fit">
              <div className="w-full bg-[#0a0a0a] border border-[#1a110b] px-6 py-5 rounded-2xl flex items-center gap-5 shadow-lg">
                <div className="bg-emerald-950/30 p-3 rounded-xl"><FaWallet className="text-emerald-500" size={20} /></div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Total Aggregated Revenue</p>
                  <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">₦{stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{stats.successCount} Successful Settlements</p>
                </div>
              </div>
            </div>

          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0a0a0a] p-4 rounded-xl border border-[#1a110b]">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative w-full sm:w-72 shadow-inner">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                <input 
                  type="text" placeholder="Search by Student or Reference..." value={searchQuery}
                  className="w-full bg-[#111111] border border-[#2a1b12] rounded-lg pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8b4513] transition-colors"
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <select 
                value={statusFilter}
                className="bg-[#111111] border border-[#2a1b12] rounded-lg px-4 py-2.5 text-xs text-gray-400 focus:outline-none focus:border-[#8b4513] cursor-pointer outline-none"
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Transactions</option>
                <option value="success">Successful Only</option>
                <option value="failed">Failed Transactions</option>
              </select>
            </div>

            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-[#111111] hover:bg-[#1a110b] border border-[#2a1b12] hover:border-[#8b4513] text-[#d2b48c] px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer outline-none"
            >
              <FaDownload size={12} /> Export CSV
            </button>
          </div>
        </header>

        <div className="bg-[#0a0a0a] border border-[#2a1b12] rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2a1b12] bg-[#111111] text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  <th className="p-4 whitespace-nowrap">Student Identity</th>
                  <th className="p-4 whitespace-nowrap">Reference ID</th>
                  <th className="p-4 whitespace-nowrap">Narration Purpose</th>
                  <th className="p-4 whitespace-nowrap">Academic Scope</th>
                  <th className="p-4 whitespace-nowrap">Amount (₦)</th>
                  <th className="p-4 text-center whitespace-nowrap">Gate Status</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-[#1a110b]">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-gray-600 uppercase tracking-widest text-[10px] font-bold">
                      No matching financial records discovered in the matrix.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((row) => (
                    <tr key={row._id || row.reference} className="hover:bg-[#111111] transition-colors group">
                      <td className="p-4">
                        <p className="font-sans font-bold text-gray-200 group-hover:text-[#d2b48c] transition-colors">{row.studentName}</p>
                        <p className="text-[9px] text-gray-600 mt-0.5 font-mono">
                          {new Date(row.createdAt || row.paidAt).toLocaleString()}
                        </p>
                      </td>
                      <td className="p-4 text-gray-500 font-mono text-[10px] tracking-wider">{row.reference}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                          ['Sessional Dues', 'Other Clearance'].includes(row.narration) 
                            ? 'bg-[#1a110b] text-[#d2b48c] border border-[#3d2b1f]' 
                            : 'bg-[#111111] text-gray-400 border border-[#2a1b12]'
                        }`}>
                          <FaTag size={8} className={['Sessional Dues', 'Other Clearance'].includes(row.narration) ? 'text-[#8b4513]' : 'text-gray-600'} />
                          {row.narration}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-[11px]">
                        <span className="font-bold text-gray-300">{row.targetLevel}</span> <span className="opacity-50 mx-1">|</span> {row.academicYear}
                      </td>
                      <td className="p-4 font-mono font-bold text-white tracking-wide">
                        {Number(row.amount).toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        {row.status === 'success' ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-950/20 border border-emerald-900/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-500 shadow-inner">
                            <FaCheckCircle size={10} /> Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-rose-950/20 border border-rose-900/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-rose-500 shadow-inner">
                            <FaExclamationTriangle size={10} /> Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPaymentLedger;