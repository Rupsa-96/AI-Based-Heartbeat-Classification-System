import { useState } from 'react'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { generatePredictionReport } from '../utils/generateReport'
import HealthChatbot from './HealthChatbot'

const RISK_CONFIG = {
  Low: {
    bg:      'bg-emerald-50',
    border:  'border-emerald-200',
    badge:   'bg-emerald-100 text-emerald-700',
    icon:    '✓',
    iconBg:  'bg-emerald-100 text-emerald-600',
    color:   '#10b981',
  },
  Moderate: {
    bg:      'bg-amber-50',
    border:  'border-amber-200',
    badge:   'bg-amber-100 text-amber-700',
    icon:    '!',
    iconBg:  'bg-amber-100 text-amber-600',
    color:   '#f59e0b',
  },
  High: {
    bg:      'bg-red-50',
    border:  'border-red-200',
    badge:   'bg-red-100 text-red-700',
    icon:    '⚠',
    iconBg:  'bg-red-100 text-red-600',
    color:   '#ef4444',
  },
}


const FEATURE_LABELS = {
  age:      'Age',
  sex:      'Sex',
  cp:       'Chest Pain Type',
  trestbps: 'Resting BP (mm Hg)',
  chol:     'Cholesterol (mg/dl)',
  fbs:      'Fasting Blood Sugar > 120',
  restecg:  'Resting ECG',
  thalach:  'Max Heart Rate (bpm)',
  exang:    'Exercise Angina',
  oldpeak:  'ST Depression',
  slope:    'ST Slope',
  ca:       'Vessels (Fluoroscopy)',
  thal:     'Thalassemia',
}

function formatValue(key, val) {
  const map = {
    sex:     { 0: 'Female', 1: 'Male' },
    fbs:     { 0: 'No', 1: 'Yes' },
    exang:   { 0: 'No', 1: 'Yes' },
    cp:      { 0: 'Typical Angina', 1: 'Atypical Angina', 2: 'Non-Anginal', 3: 'Asymptomatic' },
    restecg: { 0: 'Normal', 1: 'ST-T Abnormality', 2: 'LV Hypertrophy' },
    slope:   { 0: 'Upsloping', 1: 'Flat', 2: 'Downsloping' },
    thal:    { 0: 'Normal', 1: 'Fixed Defect', 2: 'Reversible Defect', 3: 'Unknown' },
  }
  if (map[key]) return map[key][val] ?? val
  return val
}

export default function PredictionResult({ result, patientData, patientName, onReset }) {
  if (!result) return null

  const [downloading, setDownloading] = useState(false)

  const cfg = RISK_CONFIG[result.risk_level] ?? RISK_CONFIG.Moderate
  const pct = Math.round(result.probability * 100)

  // Radial gauge data
  const gaugeData = [{ value: pct, fill: cfg.color }]

  async function handleDownload() {
    setDownloading(true)
    try {
      generatePredictionReport({ result, patientData, patientName })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-6 space-y-6`}>

      {/* ---- Top: prediction label + badge ---- */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className={`w-12 h-12 rounded-full flex items-center justify-center
                            text-xl font-bold flex-shrink-0 ${cfg.iconBg}`}>
            {cfg.icon}
          </span>
          <div>
            {patientName && (
              <p className="text-xs font-semibold text-slate-500 mb-0.5">
                👤 {patientName}
              </p>
            )}
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              DNN Prediction
            </p>
            <p className="text-xl font-bold text-slate-800 leading-tight mt-0.5">
              {result.prediction}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${cfg.badge}`}>
          {result.risk_level} Risk
        </span>
      </div>

      {/* ---- Probability gauge ---- */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="70%"
              outerRadius="100%"
              data={gaugeData}
              startAngle={180}
              endAngle={-180 + (360 * pct / 100)}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                background={{ fill: '#e2e8f0' }}
                dataKey="value"
                angleAxisId={0}
                cornerRadius={8}
              />
              {/* Centre label */}
            </RadialBarChart>
          </ResponsiveContainer>
          {/* Overlay percentage */}
          <div className="-mt-24 flex flex-col items-center pointer-events-none">
            <span className="text-4xl font-bold" style={{ color: cfg.color }}>
              {pct}%
            </span>
            <span className="text-xs text-slate-500 font-medium">Probability</span>
          </div>
          <div className="mt-10" />
        </div>

        <div className="flex-1 space-y-3 text-sm">
          <p className="text-slate-600">
            The model estimates a{' '}
            <span className="font-semibold" style={{ color: cfg.color }}>
              {pct}% probability
            </span>{' '}
            of heart disease based on the entered clinical parameters.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-3">
            {[
              { label: 'Low Risk',      range: '0 – 34%',   active: result.risk_level === 'Low'      },
              { label: 'Moderate Risk', range: '35 – 64%',  active: result.risk_level === 'Moderate' },
              { label: 'High Risk',     range: '65 – 100%', active: result.risk_level === 'High'     },
            ].map(({ label, range, active }) => (
              <div
                key={label}
                className={`rounded-xl p-3 text-center border transition-all
                  ${active ? 'border-current shadow-sm' : 'border-slate-200 opacity-50'}`}
                style={active ? { borderColor: cfg.color, backgroundColor: `${cfg.color}11` } : {}}
              >
                <p className="text-xs font-semibold text-slate-700">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{range}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Patient input summary ---- */}
      {patientData && (
        <div>
          <p className="text-sm font-semibold text-slate-600 mb-3">
            Patient Input Summary
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {/* Name card — always first */}
            {patientName && (
              <div className="bg-white rounded-xl px-3 py-2 border border-slate-200
                              col-span-2 sm:col-span-3 lg:col-span-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <p className="text-xs text-slate-400">Patient Name</p>
                  <p className="text-sm font-bold text-slate-800">{patientName}</p>
                </div>
              </div>
            )}
            {/* Clinical feature cards */}
            {Object.entries(patientData).map(([key, val]) => (
              <div key={key}
                   className="bg-white rounded-xl px-3 py-2 border border-slate-100">
                <p className="text-xs text-slate-400">{FEATURE_LABELS[key] ?? key}</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {formatValue(key, val)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Disclaimer ---- */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">Medical Disclaimer: </span>
          {result.disclaimer}
        </p>
      </div>

      {/* ---- Actions: Reset + Download ---- */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <button onClick={onReset} className="btn-secondary w-full sm:w-auto">
          Predict Another Patient
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center justify-center gap-2 w-full sm:w-auto
                     bg-slate-800 hover:bg-slate-700 active:bg-slate-900
                     text-white font-semibold py-3 px-6 rounded-xl
                     transition-colors duration-200 disabled:opacity-50
                     disabled:cursor-not-allowed text-sm"
        >
          {downloading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating PDF…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0
                         012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Download PDF Report
            </>
          )}
        </button>
      </div>

      {/* ---- Heart Health AI Assistant ---- */}
      <HealthChatbot result={result} patientData={patientData} />

    </div>
  )
}
