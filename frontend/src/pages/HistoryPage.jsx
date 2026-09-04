import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getHistory, deleteHistoryEntry, clearAllHistory } from '../services/api'
import { generatePredictionReport } from '../utils/generateReport'

const RISK_STYLE = {
  Low:      { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  Moderate: { badge: 'bg-amber-100   text-amber-700',   dot: 'bg-amber-400',   bar: 'bg-amber-400'   },
  High:     { badge: 'bg-red-100     text-red-700',     dot: 'bg-red-500',     bar: 'bg-red-500'     },
}

const FEATURE_META = {
  age:      { label: 'Age',                    unit: 'yrs',    map: null },
  sex:      { label: 'Sex',                    unit: '',       map: { 0: 'Female', 1: 'Male' } },
  cp:       { label: 'Chest Pain Type',        unit: '',       map: { 0: 'Typical Angina', 1: 'Atypical Angina', 2: 'Non-Anginal', 3: 'Asymptomatic' } },
  trestbps: { label: 'Resting BP',             unit: 'mm Hg', map: null },
  chol:     { label: 'Cholesterol',            unit: 'mg/dl', map: null },
  fbs:      { label: 'Fasting Blood Sugar',    unit: '',       map: { 0: '≤120 mg/dl', 1: '>120 mg/dl' } },
  restecg:  { label: 'Resting ECG',            unit: '',       map: { 0: 'Normal', 1: 'ST-T Abnormality', 2: 'LV Hypertrophy' } },
  thalach:  { label: 'Max Heart Rate',         unit: 'bpm',   map: null },
  exang:    { label: 'Exercise Angina',        unit: '',       map: { 0: 'No', 1: 'Yes' } },
  oldpeak:  { label: 'ST Depression',          unit: '',       map: null },
  slope:    { label: 'ST Slope',               unit: '',       map: { 0: 'Upsloping', 1: 'Flat', 2: 'Downsloping' } },
  ca:       { label: 'Major Vessels',          unit: '',       map: null },
  thal:     { label: 'Thalassemia',            unit: '',       map: { 0: 'Normal', 1: 'Fixed Defect', 2: 'Reversible Defect', 3: 'Unknown' } },
}

function fmtFeature(key, val) {
  const meta = FEATURE_META[key]
  if (!meta) return val
  if (meta.map && meta.map[val] !== undefined) return meta.map[val]
  return meta.unit ? `${val} ${meta.unit}` : val
}

function fmtTimestamp(iso) {
  try {
    const d = new Date(iso)
    return {
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    }
  } catch {
    return { date: '—', time: '—' }
  }
}

function StatCard({ label, value, color }) {
  return (
    <div className="card py-4 flex flex-col items-center gap-1 flex-1 min-w-[120px]">
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-slate-500 text-center">{label}</p>
    </div>
  )
}

function ProbBar({ value, riskLevel }) {
  const pct  = Math.round(value * 100)
  const cfg  = RISK_STYLE[riskLevel] ?? RISK_STYLE.Moderate
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-8 text-right">{pct}%</span>
    </div>
  )
}

function RiskBadge({ level }) {
  const cfg = RISK_STYLE[level] ?? RISK_STYLE.Moderate
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
                      text-xs font-semibold ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {level}
    </span>
  )
}

function DetailModal({ record, onClose }) {
  if (!record) return null
  const [downloading, setDownloading] = useState(false)
  const { date, time } = fmtTimestamp(record.timestamp)
  const pct = Math.round(record.probability * 100)

  function handleDownload() {
    setDownloading(true)
    try {
      generatePredictionReport({
        result:      record,
        patientData: record,
        recordId:    record.id,
        timestamp:   record.timestamp,
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog" aria-modal="true" aria-labelledby="detail-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl
                      max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-slate-100
                        px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div>
            <p id="detail-modal-title"
               className="text-base font-bold text-slate-800">
              Prediction #{record.id}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{date} at {time}</p>
          </div>
          {/* Download + Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5
                         bg-slate-800 hover:bg-slate-700 text-white rounded-lg
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download PDF Report"
            >
              {downloading ? (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2
                           0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              )}
              {downloading ? 'Generating…' : 'PDF Report'}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Result card */}
          <div className={`rounded-xl p-4 border-2 flex items-center justify-between gap-4
            ${record.risk_level === 'High'     ? 'bg-red-50 border-red-200'     :
              record.risk_level === 'Moderate' ? 'bg-amber-50 border-amber-200' :
                                                 'bg-emerald-50 border-emerald-200'}`}>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                DNN Result
              </p>
              <p className="text-lg font-bold text-slate-800">{record.prediction}</p>
              <p className="text-sm text-slate-500 mt-1">
                Probability: <span className="font-semibold text-slate-700">{pct}%</span>
              </p>
            </div>
            <RiskBadge level={record.risk_level} />
          </div>

          {/* Patient features grid */}
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-3">Patient Clinical Parameters</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.keys(FEATURE_META).map(key => (
                <div key={key}
                     className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                  <p className="text-xs text-slate-400">{FEATURE_META[key].label}</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">
                    {fmtFeature(key, record[key])}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              <span className="font-semibold">Disclaimer: </span>
              {record.disclaimer}
            </p>
          </div>

          {/* Download button (bottom — for convenience) */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center justify-center gap-2 w-full
                       bg-slate-800 hover:bg-slate-700 text-white font-semibold
                       py-3 px-6 rounded-xl transition-colors text-sm
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating PDF…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2
                           2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Download PDF Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function ClearConfirmModal({ onConfirm, onCancel, count }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center
                           justify-center text-lg font-bold flex-shrink-0">!</span>
          <div>
            <p className="font-bold text-slate-800">Clear All History?</p>
            <p className="text-sm text-slate-500 mt-0.5">
              This will permanently delete all {count} prediction record{count !== 1 ? 's' : ''}.
              This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold
                       py-2.5 px-4 rounded-xl transition-colors text-sm"
          >
            Yes, Clear All
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const [records, setRecords]   = useState([])
  const [stats,   setStats]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState(null)

  const [search,      setSearch]      = useState('')
  const [filterRisk,  setFilterRisk]  = useState('All')
  const [sortKey,     setSortKey]     = useState('date_desc')
  const [detailRecord, setDetailRecord] = useState(null)
  const [deletingId,   setDeletingId]   = useState(null)   // id currently being deleted
  const [showClearModal, setShowClearModal] = useState(false)
  const [actionLoading, setActionLoading]   = useState(false)
  const [actionMsg,     setActionMsg]       = useState(null)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getHistory()
      setRecords(data.records ?? [])
      setStats(data.stats ?? null)
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        setError('Cannot reach the backend. Make sure FastAPI is running on http://localhost:8000.')
      } else {
        setError(err.response?.data?.detail ?? 'Failed to load prediction history.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  // Auto-clear action message after 3 s
  useEffect(() => {
    if (!actionMsg) return
    const t = setTimeout(() => setActionMsg(null), 3000)
    return () => clearTimeout(t)
  }, [actionMsg])

  const displayed = useMemo(() => {
    let out = [...records]

    // Filter by risk level
    if (filterRisk !== 'All') {
      out = out.filter(r => r.risk_level === filterRisk)
    }

    // Search: matches prediction label, risk_level, or date string
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      out = out.filter(r =>
        r.prediction.toLowerCase().includes(q) ||
        r.risk_level.toLowerCase().includes(q)  ||
        fmtTimestamp(r.timestamp).date.toLowerCase().includes(q)
      )
    }

    // Sort
    out.sort((a, b) => {
      switch (sortKey) {
        case 'date_desc': return new Date(b.timestamp) - new Date(a.timestamp)
        case 'date_asc':  return new Date(a.timestamp) - new Date(b.timestamp)
        case 'prob_desc': return b.probability - a.probability
        case 'prob_asc':  return a.probability - b.probability
        default:          return 0
      }
    })

    return out
  }, [records, filterRisk, search, sortKey])

  async function handleDelete(id) {
    setDeletingId(id)
    setActionLoading(true)
    try {
      await deleteHistoryEntry(id)
      setRecords(prev => prev.filter(r => r.id !== id))
      setStats(prev => prev ? { ...prev, total: prev.total - 1 } : prev)
      if (detailRecord?.id === id) setDetailRecord(null)
      setActionMsg({ type: 'success', text: `Record #${id} deleted.` })
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.detail ?? 'Delete failed.' })
    } finally {
      setDeletingId(null)
      setActionLoading(false)
    }
  }

  async function handleClearAll() {
    setShowClearModal(false)
    setActionLoading(true)
    try {
      const res = await clearAllHistory()
      setRecords([])
      setStats({ total: 0, low_risk: 0, moderate_risk: 0, high_risk: 0, avg_probability: 0 })
      setDetailRecord(null)
      setActionMsg({ type: 'success', text: res.message })
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.detail ?? 'Clear failed.' })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Prediction History</h1>
          <p className="text-sm text-slate-500 mt-1">
            Every prediction you make is automatically saved here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11
                       11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          {records.length > 0 && (
            <button
              onClick={() => setShowClearModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl
                         bg-red-50 text-red-600 hover:bg-red-100 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5
                         7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All
            </button>
          )}
        </div>
      </div>

      
      {actionMsg && (
        <div className={`rounded-xl px-5 py-3 flex items-center gap-3 text-sm font-medium
          ${actionMsg.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-red-50 border border-red-200 text-red-700'}`}>
          <span>{actionMsg.type === 'success' ? '✓' : '✕'}</span>
          {actionMsg.text}
        </div>
      )}

      
      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="flex gap-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex-1 h-20 bg-slate-100 rounded-2xl" />
            ))}
          </div>
          <div className="h-12 bg-slate-100 rounded-2xl" />
          {[1,2,3].map(i => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      )}

      
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
          <span className="text-red-500 text-xl flex-shrink-0">⚠</span>
          <div>
            <p className="font-semibold text-red-700">Could not load history</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button onClick={loadHistory} className="mt-3 text-xs text-red-500 underline
                                                     hover:text-red-700">
              Try again
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          
          {stats && (
            <div className="flex flex-wrap gap-3">
              <StatCard label="Total Predictions" value={stats.total}            color="#64748b" />
              <StatCard label="Low Risk"          value={stats.low_risk}         color="#10b981" />
              <StatCard label="Moderate Risk"     value={stats.moderate_risk}    color="#f59e0b" />
              <StatCard label="High Risk"         value={stats.high_risk}        color="#ef4444" />
              <StatCard
                label="Avg. Probability"
                value={`${Math.round((stats.avg_probability ?? 0) * 100)}%`}
                color="#6366f1"
              />
            </div>
          )}

          
          {records.length === 0 && (
            <div className="card flex flex-col items-center justify-center py-20 gap-5">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center
                              justify-center text-4xl">
                📋
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-700">No prediction history yet</p>
                <p className="text-sm text-slate-400 mt-1 max-w-xs">
                  Every time you run a prediction it will appear here automatically.
                </p>
              </div>
              <Link to="/" className="btn-primary">
                Go to Predict Page
              </Link>
            </div>
          )}

          
          {records.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">

              {/* Search */}
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                     fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by result, risk level or date…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-field pl-10"
                />
              </div>

              {/* Filter by risk */}
              <select
                value={filterRisk}
                onChange={e => setFilterRisk(e.target.value)}
                className="input-field sm:w-44"
              >
                <option value="All">All Risk Levels</option>
                <option value="Low">Low Risk</option>
                <option value="Moderate">Moderate Risk</option>
                <option value="High">High Risk</option>
              </select>

              {/* Sort */}
              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value)}
                className="input-field sm:w-52"
              >
                <option value="date_desc">Date — Newest First</option>
                <option value="date_asc">Date — Oldest First</option>
                <option value="prob_desc">Probability — High to Low</option>
                <option value="prob_asc">Probability — Low to High</option>
              </select>
            </div>
          )}

          
          {records.length > 0 && (
            <p className="text-xs text-slate-400">
              Showing {displayed.length} of {records.length} record{records.length !== 1 ? 's' : ''}
              {filterRisk !== 'All' && ` · Filtered: ${filterRisk} Risk`}
              {search.trim()       && ` · Search: "${search.trim()}"`}
            </p>
          )}

          
          {records.length > 0 && displayed.length === 0 && (
            <div className="card flex flex-col items-center py-14 gap-3 text-center">
              <span className="text-3xl">🔍</span>
              <p className="font-semibold text-slate-600">No matching records</p>
              <p className="text-sm text-slate-400">
                Try a different search term or remove the filter.
              </p>
              <button
                onClick={() => { setSearch(''); setFilterRisk('All') }}
                className="btn-secondary mt-1 text-sm"
              >
                Clear Search &amp; Filter
              </button>
            </div>
          )}

          
          {displayed.length > 0 && (
            <div className="space-y-2">
              {displayed.map(record => {
                const { date, time } = fmtTimestamp(record.timestamp)
                const isDeleting     = deletingId === record.id

                return (
                  <div
                    key={record.id}
                    className={`card py-4 flex flex-col sm:flex-row sm:items-center gap-4
                                hover:border-slate-200 hover:shadow-md transition-all cursor-pointer
                                ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
                    onClick={() => setDetailRecord(record)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setDetailRecord(record)}
                    aria-label={`View details for prediction #${record.id}`}
                  >
                    {/* Left: ID + date/time */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="w-9 h-9 bg-slate-100 rounded-xl flex items-center
                                       justify-center text-xs font-bold text-slate-500">
                        #{record.id}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{date}</p>
                        <p className="text-xs text-slate-400">{time}</p>
                      </div>
                    </div>

                    {/* Middle: prediction label + prob bar */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {record.prediction}
                      </p>
                      <div className="mt-1.5 max-w-xs">
                        <ProbBar value={record.probability} riskLevel={record.risk_level} />
                      </div>
                    </div>

                    {/* Right: badge + download + delete */}
                    <div className="flex items-center gap-2 flex-shrink-0"
                         onClick={e => e.stopPropagation()}>
                      <RiskBadge level={record.risk_level} />
                      {/* Download PDF */}
                      <button
                        onClick={() => generatePredictionReport({
                          result:      record,
                          patientData: record,
                          recordId:    record.id,
                          timestamp:   record.timestamp,
                        })}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700
                                   hover:bg-slate-100 transition-colors"
                        title={`Download PDF for record #${record.id}`}
                        aria-label={`Download PDF for record #${record.id}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2
                                   2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(record.id)}
                        disabled={actionLoading}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500
                                   hover:bg-red-50 transition-colors disabled:opacity-40"
                        title={`Delete record #${record.id}`}
                        aria-label={`Delete record #${record.id}`}
                      >
                        {isDeleting ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10"
                                    stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor"
                                  d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                               stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2
                                     0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0
                                     00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      
      {detailRecord && (
        <DetailModal
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
        />
      )}

      
      {showClearModal && (
        <ClearConfirmModal
          count={records.length}
          onConfirm={handleClearAll}
          onCancel={() => setShowClearModal(false)}
        />
      )}
    </div>
  )
}
