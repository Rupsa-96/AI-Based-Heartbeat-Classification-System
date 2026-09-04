import { useEffect, useState } from 'react'
import MetricsCard from '../components/MetricsCard'
import ModelInfoCard from '../components/ModelInfoCard'
import { getMetrics, getHealth } from '../services/api'

const FEATURES_GUIDE = [
  { name: 'age',      type: 'Numerical',   desc: 'Age in years. Older age increases heart disease risk.' },
  { name: 'sex',      type: 'Binary',      desc: '0=Female, 1=Male. Males have higher baseline risk.' },
  { name: 'cp',       type: 'Categorical', desc: 'Chest pain type (0–3). Asymptomatic (3) is often most serious.' },
  { name: 'trestbps', type: 'Numerical',   desc: 'Resting blood pressure in mm Hg. Hypertension indicator.' },
  { name: 'chol',     type: 'Numerical',   desc: 'Serum cholesterol in mg/dl. High cholesterol is a risk factor.' },
  { name: 'fbs',      type: 'Binary',      desc: 'Fasting blood sugar > 120 mg/dl. Indicates possible diabetes.' },
  { name: 'restecg',  type: 'Categorical', desc: 'Resting ECG result. Abnormalities suggest cardiac issues.' },
  { name: 'thalach',  type: 'Numerical',   desc: 'Max heart rate achieved. Lower values often indicate disease.' },
  { name: 'exang',    type: 'Binary',      desc: 'Exercise-induced angina — strong indicator of heart disease.' },
  { name: 'oldpeak',  type: 'Numerical',   desc: 'ST depression during exercise. Higher = more concerning.' },
  { name: 'slope',    type: 'Categorical', desc: 'Slope of ST segment. Downsloping is associated with disease.' },
  { name: 'ca',       type: 'Ordinal',     desc: 'Number of major vessels. More blocked vessels = higher risk.' },
  { name: 'thal',     type: 'Categorical', desc: 'Thalassemia type. Reversible defect strongly predicts disease.' },
]

const TYPE_COLORS = {
  Numerical:   'bg-blue-100 text-blue-700',
  Binary:      'bg-green-100 text-green-700',
  Categorical: 'bg-purple-100 text-purple-700',
  Ordinal:     'bg-orange-100 text-orange-700',
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [health,  setHealth]  = useState(null)

  useEffect(() => {
    Promise.allSettled([getMetrics(), getHealth()]).then(([mRes, hRes]) => {
      if (mRes.status === 'fulfilled') {
        setMetrics(mRes.value.metrics)
      } else {
        setError('Metrics not yet available.')
      }
      if (hRes.status === 'fulfilled') {
        setHealth(hRes.value)
      }
      setLoading(false)
    })
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Model Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Performance metrics, architecture details, and feature documentation.
        </p>
      </div>

      {health && (
        <div className={`rounded-xl px-5 py-3 flex items-center gap-3 text-sm font-medium
          ${health.model_loaded
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-amber-50 border border-amber-200 text-amber-700'
          }`}>
          <span>{health.model_loaded ? '✓' : '!'}</span>
          <span>{health.message}</span>
        </div>
      )}

      <MetricsCard metrics={metrics} loading={loading} error={error} />

      <ModelInfoCard />

      <div className="card">
        <h2 className="section-title">Input Feature Reference</h2>
        <p className="text-sm text-slate-500 mb-4">
          Each of the 13 UCI Heart Disease features and its clinical significance.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-xs font-semibold
                               text-slate-500 uppercase tracking-wide">Feature</th>
                <th className="text-left py-2 px-3 text-xs font-semibold
                               text-slate-500 uppercase tracking-wide">Type</th>
                <th className="text-left py-2 px-3 text-xs font-semibold
                               text-slate-500 uppercase tracking-wide">Description</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES_GUIDE.map(({ name, type, desc }) => (
                <tr key={name}
                    className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3">
                    <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono">
                      {name}
                    </code>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                     ${TYPE_COLORS[type]}`}>
                      {type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">Academic Disclaimer</p>
        <p className="text-sm text-amber-700 leading-relaxed">
          This system is developed as an academic project to demonstrate Deep Neural
          Network concepts applied to medical data classification. The model is trained
          on the UCI Heart Disease (Cleveland) dataset — a small, decades-old dataset.
          Results should NOT be used for clinical decision-making. Always consult a
          qualified cardiologist for medical advice.
        </p>
      </div>
    </div>
  )
}
