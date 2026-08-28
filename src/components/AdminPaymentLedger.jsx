import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FaCircleNotch, FaSearch, FaHistory, FaCheckCircle, 
  FaExclamationTriangle, FaDownload, FaWallet, FaTag,
  FaSlidersH, FaSave, FaGraduationCap, FaCalendarAlt, FaReceipt
} from 'react-icons/fa';

// ==========================================
// 📌 STANDARDIZED CONSTANTS
// ==========================================
const ACADEMIC_SESSIONS = ['2025/2026', '2026/2027', '2027/2028', '2028/2029', '2029/2030'];
const ACADEMIC_LEVELS = ['100L', '200L', '300L', '400L', '500L', '600L'];
const NARRATIONS = [
  'Sessional Dues', 
  'Sendforth levy and Appeal fund card', 
  'Donation', 
  'Other Clearance'
];

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

// ==========================================
// 💡 MODULAR SUB-COMPONENTS
// ==========================================

const MetricCard = ({ title, value, subtext, icon: Icon, variant = 'primary' }) => {
  const variantStyles = {
    primary: 'bg-emerald-950/30 text-emerald-500 border-emerald-900/20 text-emerald-400',
    secondary: 'bg-amber-950/30 text-amber-500 border-amber-900/20 text-amber-400',
    info: 'bg-blue-950/30 text-blue-500 border-blue-900/20 text-blue-400'
  };

  const currentStyle = variantStyles[variant] || variantStyles.primary;

  return (
    <div className="bg-[#0a0a0a] border border-[#1a110b] px-6 py-5 rounded-2xl flex items-center gap-5 shadow-lg transition-all duration-300 hover:border-[#3d2b1f]">
      <div className={`p-3 rounded-xl ${currentStyle.split(' ')[0]} ${currentStyle.split(' ')[1]}`}>
        <Icon size={20} aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">{title}</h3>
        <p className={`text-xl md:text-2xl font-mono font-bold mt-1 ${currentStyle.split(' ')[3]}`}>
          {value}
        </p>
        <p className="text-[10px] text-gray-600 mt-1">{subtext}</p>
      </div>
    </div>
  );
};

const FilterSelect = ({ icon: Icon, value, onChange, options, defaultLabel, ariaLabel }) => (
  <div className="relative flex items-center w-full">
    {Icon && <Icon className="absolute left-3 text-gray-600 pointer-events-none" size={12} aria-hidden="true" />}
    <select
      value={value}
      onChange={onChange}
      aria-label={ariaLabel || defaultLabel}
      className={`w-full bg-[#111111] border border-[#2a1b12] rounded-lg pr-8 py-2.5 text-xs text-gray-400 focus:outline-none focus:border-[#8b4513] focus-visible:ring-1 focus-visible:ring-[#8b4513]/30 cursor-pointer appearance-none transition-all ${Icon ? 'pl-8' : 'pl-3'}`}
    >
      <option value="all">{defaultLabel}</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    <div className="absolute right-3 pointer-events-none text-gray-600 text-[8px]" aria-hidden="true">▼</div>
  </div>
);

// ==========================================
// 🚀 MAIN LEDGER COMPONENT
// ==========================================

const AdminPaymentLedger = () => {
  const [ledger, setLedger] = useState([]);
  const [feeConfigs, setFeeConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    narration: 'all',
    level: 'all',
    session: 'all'
  });

  const [form, setForm] = useState({
    narration: NARRATIONS[0],
    targetLevel: '100L',
    academicYear: '2026/2027',
    amount: ''
  });
  
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // 🛡️ Normalized Auth Token Retrieval
  const getAuthHeaders = useCallback(() => {
    const rawToken = localStorage.getItem('adminToken') || 
                     localStorage.getItem('admintoken') || 
                     localStorage.getItem('token'); 
    
    if (!rawToken || rawToken === 'null' || rawToken === 'undefined') {
      return { 'Content-Type': 'application/json' };
    }

    const token = rawToken.replace(/^"|"$/g, '');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  // 🔄 Unified Sync Engine
  const fetchData = useCallback(async (signal = null) => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      console.error("Auth Token Missing. Halting sync stream.");
      setLoading(false);
      return;
    }

    const fetchOptions = { headers, ...(signal && { signal }) };

    try {
      const [ledgerRes, matrixRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/payment/history`, fetchOptions),
        fetch(`${API_BASE_URL}/api/payment/fee-matrix`, fetchOptions)
      ]);

      if (ledgerRes.status === 'fulfilled' && ledgerRes.value.ok) {
        const ledgerOutput = await ledgerRes.value.json();
        if (ledgerOutput.success) {
          setLedger(ledgerOutput.data.filter(item => item.status !== 'pending'));
        }
      }

      if (matrixRes.status === 'fulfilled' && matrixRes.value.ok) {
        const matrixOutput = await matrixRes.value.json();
        if (matrixOutput.success) {
          setFeeConfigs(matrixOutput.data);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Could not synchronize data matrices:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  // 📥 Filter Update Handler
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // ⚙️ Update Fee Matrix Handler
  const handleUpdateFeeMatrix = async (e) => {
    e.preventDefault();

    const numericAmount = Number(form.amount);
    if (!numericAmount || numericAmount <= 0) {
      return setFeedback({ type: 'error', message: 'Please declare a valid numeric currency valuation.' });
    }

    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      return setFeedback({ type: 'error', message: 'Session expired. Please log in again.' });
    }

    setIsUpdatingConfig(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/update-fee-matrix`, {
        method: 'POST',
        headers, 
        body: JSON.stringify({
          narration: form.narration,
          targetLevel: form.targetLevel,
          academicYear: form.academicYear,
          amount: numericAmount
        })
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        setFeedback({
          type: 'success',
          message: `${form.narration} (${form.targetLevel}) updated to ₦${numericAmount.toLocaleString()} successfully.`
        });
        setForm(prev => ({ ...prev, amount: '' }));
        fetchData();
      } else {
        throw new Error(data.message || 'Failed updating gateway matrix configuration.');
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Network link verification timeout.' });
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  // 🔍 Multi-Layer Memory Filter Engine
  const filteredLedger = useMemo(() => {
    return ledger.filter(item => {
      const query = filters.search.toLowerCase();
      const safeName = (item.studentName || '').toLowerCase();
      const safeRef = (item.reference || '').toLowerCase();
      
      const matchesSearch = safeName.includes(query) || safeRef.includes(query);
      const matchesStatus = filters.status === 'all' || item.status === filters.status;
      const matchesNarration = filters.narration === 'all' || (item.narration || '').toLowerCase() === filters.narration.toLowerCase();
      const matchesLevel = filters.level === 'all' || (item.targetLevel || '').toLowerCase() === filters.level.toLowerCase();
      const matchesSession = filters.session === 'all' || item.academicYear === filters.session;
      
      return matchesSearch && matchesStatus && matchesNarration && matchesLevel && matchesSession;
    });
  }, [ledger, filters]);

  // 📊 Financial Stats Engine (Base Revenue vs Paystack Fees vs Gross Charged)
  const stats = useMemo(() => {
    const successfulTxs = filteredLedger.filter(item => item.status === 'success');

    const netRevenue = successfulTxs.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalFees = successfulTxs.reduce((sum, item) => sum + (Number(item.paystackFee) || 0), 0);
    const grossCollected = successfulTxs.reduce((sum, item) => sum + (Number(item.totalPaid) || Number(item.amount) || 0), 0);

    return {
      netRevenue,
      totalFees,
      grossCollected,
      successCount: successfulTxs.length
    };
  }, [filteredLedger]);

  // 📥 Enterprise CSV Export
  const exportToCSV = () => {
    if (filteredLedger.length === 0) return;
    
    const headers = [
      "Date", "Student Name", "Reference", "Narration", 
      "Level", "Session", "Department Net (NGN)", 
      "Paystack Fee (NGN)", "Total Charged (NGN)", "Status"
    ];
    
    const escapeCSV = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

    const rows = filteredLedger.map(row => {
      const baseAmount = Number(row.amount) || 0;
      const fee = Number(row.paystackFee) || 0;
      const totalPaid = Number(row.totalPaid) || baseAmount;

      return [
        escapeCSV(new Date(row.createdAt || row.paidAt).toLocaleDateString()),
        escapeCSV(row.studentName),
        escapeCSV(row.reference),
        escapeCSV(row.narration),
        escapeCSV(row.targetLevel),
        escapeCSV(row.academicYear),
        escapeCSV(baseAmount.toFixed(2)),
        escapeCSV(fee.toFixed(2)),
        escapeCSV(totalPaid.toFixed(2)),
        escapeCSV(row.status)
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `audit_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <FaCircleNotch className="animate-spin text-[#d2b48c] mb-4" size={32} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d2b48c] animate-pulse">
          Syncing Ledger Matrix...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] text-gray-100 font-sans min-h-screen w-full p-4 md:p-6 transition-all">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER ZONE */}
        <header className="border-b border-[#2a1b12] pb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h2 className="text-2xl font-serif text-[#d2b48c] tracking-wide uppercase flex items-center gap-3">
                <FaHistory className="text-[#8b4513]" size={20} aria-hidden="true" /> 
                Payment & Fee Governance Ledger
              </h2>
              <p className="text-gray-500 text-xs mt-1">
                Real-time financial audits, rate configurations, and gateway charge settlements.
              </p>
            </div>
          </div>
        </header>

        {/* METRICS & CONFIGURATION WRAPPER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* RATE CONFIGURATION PANEL */}
          <section className="bg-[#0a0a0a] border border-[#3d2b1f] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <header className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#d2b48c] flex items-center gap-2">
                  <FaSlidersH className="text-[#8b4513]" size={12} aria-hidden="true" /> 
                  Fee Matrix Registry
                </h3>
              </header>
              
              <form onSubmit={handleUpdateFeeMatrix} className="space-y-3">
                <div>
                  <label htmlFor="narration" className="text-[9px] uppercase tracking-widest font-bold text-gray-500 block mb-1">
                    Target Account Narration
                  </label>
                  <select 
                    id="narration"
                    value={form.narration}
                    disabled={isUpdatingConfig}
                    onChange={(e) => setForm(prev => ({ ...prev, narration: e.target.value }))}
                    className="w-full bg-[#111111] border border-[#2a1b12] text-xs rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-[#8b4513] focus-visible:ring-1 focus-visible:ring-[#8b4513]/25 disabled:opacity-50"
                  >
                    {NARRATIONS.map(narr => (
                      <option key={narr} value={narr}>{narr}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="targetLevel" className="text-[9px] uppercase tracking-widest font-bold text-gray-500 block mb-1">
                      Academic Level
                    </label>
                    <select 
                      id="targetLevel"
                      value={form.targetLevel}
                      disabled={isUpdatingConfig}
                      onChange={(e) => setForm(prev => ({ ...prev, targetLevel: e.target.value }))}
                      className="w-full bg-[#111111] border border-[#2a1b12] text-xs rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-[#8b4513] disabled:opacity-50"
                    >
                      {ACADEMIC_LEVELS.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="academicYear" className="text-[9px] uppercase tracking-widest font-bold text-gray-500 block mb-1">
                      Session
                    </label>
                    <select 
                      id="academicYear"
                      value={form.academicYear}
                      disabled={isUpdatingConfig}
                      onChange={(e) => setForm(prev => ({ ...prev, academicYear: e.target.value }))}
                      className="w-full bg-[#111111] border border-[#2a1b12] text-xs rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-[#8b4513] disabled:opacity-50"
                    >
                      {ACADEMIC_SESSIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="amount" className="text-[9px] uppercase tracking-widest font-bold text-gray-500 block mb-1">
                    Base Department Fee (₦)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-gray-500" aria-hidden="true">₦</span>
                    <input 
                      id="amount"
                      type="number" 
                      required
                      min="1"
                      value={form.amount}
                      disabled={isUpdatingConfig}
                      placeholder="e.g. 100"
                      onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full bg-[#111111] border border-[#2a1b12] font-mono text-xs rounded-lg pl-7 pr-3 py-2 text-white focus:outline-none focus:border-[#8b4513] disabled:opacity-50"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isUpdatingConfig}
                  className="w-full bg-[#8b4513] hover:bg-[#a0522d] disabled:bg-[#3d2b1f] disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md focus:outline-none"
                >
                  {isUpdatingConfig ? (
                    <><FaCircleNotch className="animate-spin" size={10} /> Updating Rate Matrix...</>
                  ) : (
                    <><FaSave size={10} /> Save Fee Configuration</>
                  )}
                </button>
              </form>

              {feedback.message && (
                <div role="alert" className={`mt-3 p-3 rounded-lg text-[10px] tracking-wide border flex items-start gap-2 ${
                  feedback.type === 'success' 
                    ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
                    : 'bg-rose-950/20 border-rose-900/40 text-rose-400'
                }`}>
                  {feedback.type === 'success' ? (
                    <FaCheckCircle size={12} className="shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <FaExclamationTriangle size={12} className="shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}
            </div>

            {/* READ-ONLY MATRIX REGISTRY SUMMARY */}
            <div className="mt-4 border-t border-[#2a1b12] pt-3">
              <h4 className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Active Configured Rates
              </h4>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {feeConfigs.length === 0 ? (
                  <p className="text-gray-600 text-[10px] italic">No active rates configured.</p>
                ) : (
                  feeConfigs.map((config) => (
                    <div 
                      key={config._id || `${config.narration}-${config.targetLevel}`} 
                      className="flex justify-between items-center bg-[#111111] border border-[#1a110b] px-2.5 py-1.5 rounded-lg text-xs"
                    >
                      <div className="truncate pr-2">
                        <p className="text-gray-300 font-medium truncate">{config.narration}</p>
                        <p className="text-[8px] text-gray-500 font-mono">{config.targetLevel} | {config.academicYear}</p>
                      </div>
                      <span className="font-mono font-bold text-[#d2b48c] shrink-0">
                        ₦{Number(config.amount).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* DYNAMIC METRICS BOARDS */}
          <section className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 h-fit">
            <MetricCard 
              title="Department Net Revenue"
              value={`₦${stats.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtext={`${stats.successCount} Stored Base Payments`}
              icon={FaWallet}
              variant="primary"
            />
            <MetricCard 
              title="Gateway Fees Paid"
              value={`₦${stats.totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtext="Paystack Charges Absorbed/Passed"
              icon={FaReceipt}
              variant="info"
            />
            <MetricCard 
              title="Gross Capital Collected"
              value={`₦${stats.grossCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtext="Total Student Outflow"
              icon={FaWallet}
              variant="secondary"
            />
          </section>
        </div>

        {/* COMPREHENSIVE QUERY & ACTION BAR */}
        <section className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-[#0a0a0a] p-4 rounded-xl border border-[#1a110b]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 flex-1">
            <div className="relative w-full">
              <label htmlFor="search-ledger" className="sr-only">Search Student or Ref</label>
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={12} aria-hidden="true" />
              <input 
                id="search-ledger"
                type="text" 
                placeholder="Search Student or Ref..." 
                value={filters.search}
                className="w-full bg-[#111111] border border-[#2a1b12] rounded-lg pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8b4513] transition-colors"
                onChange={e => handleFilterChange('search', e.target.value)}
              />
            </div>

            <FilterSelect 
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              options={['success', 'failed']}
              defaultLabel="All Statuses"
              ariaLabel="Filter by status"
            />
            <FilterSelect 
              icon={FaTag}
              value={filters.narration}
              onChange={e => handleFilterChange('narration', e.target.value)}
              options={NARRATIONS}
              defaultLabel="All Narrations"
              ariaLabel="Filter by narration"
            />
            <FilterSelect 
              icon={FaGraduationCap}
              value={filters.level}
              onChange={e => handleFilterChange('level', e.target.value)}
              options={ACADEMIC_LEVELS}
              defaultLabel="All Academic Levels"
              ariaLabel="Filter by academic level"
            />
            <FilterSelect 
              icon={FaCalendarAlt}
              value={filters.session}
              onChange={e => handleFilterChange('session', e.target.value)}
              options={ACADEMIC_SESSIONS}
              defaultLabel="All Sessions"
              ariaLabel="Filter by session"
            />
          </div>

          <button 
            onClick={exportToCSV}
            disabled={filteredLedger.length === 0}
            className="flex items-center justify-center gap-2 bg-[#111111] hover:bg-[#1a110b] disabled:opacity-40 disabled:cursor-not-allowed border border-[#2a1b12] hover:border-[#8b4513] text-[#d2b48c] px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap self-stretch xl:self-auto shrink-0 focus:outline-none"
          >
            <FaDownload size={12} aria-hidden="true" /> Export Audit CSV
          </button>
        </section>

        {/* CENTRALIZED DATABASE VIEWPORTS */}
        <section className="bg-[#0a0a0a] border border-[#2a1b12] rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2a1b12] bg-[#111111] text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  <th scope="col" className="p-4 whitespace-nowrap">Student Identity</th>
                  <th scope="col" className="p-4 whitespace-nowrap">Reference ID</th>
                  <th scope="col" className="p-4 whitespace-nowrap">Narration Purpose</th>
                  <th scope="col" className="p-4 whitespace-nowrap">Academic Scope</th>
                  <th scope="col" className="p-4 whitespace-nowrap text-emerald-400">Department Base (₦)</th>
                  <th scope="col" className="p-4 whitespace-nowrap text-blue-400">Gateway Fee (₦)</th>
                  <th scope="col" className="p-4 whitespace-nowrap text-amber-400">Total Charged (₦)</th>
                  <th scope="col" className="p-4 text-center whitespace-nowrap">Gate Status</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-[#1a110b]">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-16 text-center text-gray-600 uppercase tracking-widest text-[10px] font-bold">
                      No matching financial records discovered in the matrix.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((row) => {
                    const baseAmount = Number(row.amount) || 0;
                    const fee = Number(row.paystackFee) || 0;
                    const totalPaid = Number(row.totalPaid) || baseAmount;

                    return (
                      <tr key={row._id || row.reference} className="hover:bg-[#111111] transition-colors group">
                        <td className="p-4">
                          <p className="font-sans font-bold text-gray-200 group-hover:text-[#d2b48c] transition-colors">
                            {row.studentName}
                          </p>
                          <p className="text-[9px] text-gray-600 mt-0.5 font-mono">
                            {new Date(row.createdAt || row.paidAt).toLocaleString()}
                          </p>
                        </td>
                        <td className="p-4 text-gray-500 font-mono text-[10px] tracking-wider">{row.reference}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-[#1a110b] text-[#d2b48c] border border-[#3d2b1f]">
                            <FaTag size={8} className="text-[#8b4513]" aria-hidden="true" />
                            {row.narration}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400 text-[11px]">
                          <span className="font-bold text-gray-300">{row.targetLevel || 'N/A'}</span> 
                          <span className="opacity-30 mx-2" aria-hidden="true">|</span> 
                          {row.academicYear || 'N/A'}
                        </td>
                        <td className="p-4 font-mono font-bold text-emerald-400 tracking-wide bg-emerald-950/5">
                          ₦{baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 font-mono font-bold text-blue-400 tracking-wide">
                          ₦{fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 font-mono font-bold text-amber-400 tracking-wide">
                          ₦{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-center">
                          {row.status === 'success' ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-950/20 border border-emerald-900/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-500 shadow-inner">
                              <FaCheckCircle size={10} aria-hidden="true" /> Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-rose-950/20 border border-rose-900/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-rose-500 shadow-inner">
                              <FaExclamationTriangle size={10} aria-hidden="true" /> Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
};

export default AdminPaymentLedger;