import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const METRIC_COLORS = {
  accuracy:  '#4C72B0',
  precision: '#55A868',
  recall:    '#C44E52',
  f1:        '#8172B2',
  roc_auc:   '#CCB974',
}

const METRIC_LABELS = {
  accuracy:  'Accuracy',
  precision: 'Precision',
  recall:    'Recall',
  f1:        'F1-Score',
  roc_auc:   'ROC-AUC',
}

const METRIC_DESCRIPTIONS = {
  accuracy:  'Overall percentage of correct predictions on unseen test data.',
  precision: 'Of all patients predicted as having disease, how many actually do.',
  recall:    'Of all actual disease cases, how many the model correctly identified.',
  f1:        'Harmonic mean of Precision and Recall — balanced performance measure.',
  roc_auc:   "Area Under ROC Curve — model's ability to distinguish the two classes.",
}

export default function MetricsCard({ metrics, loading, error }) {
  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="h-48 bg-slate-100 rounded" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card border-amber-200 bg-amber-50">
        <p className="text-sm text-amber-700">
          Metrics not available. Run{' '}
          <code className="bg-amber-100 px-1 rounded">
            python training/evaluate.py
          </code>{' '}
          after training to generate them.
        </p>
      </div>
    )
  }

  if (!metrics) return null

  const chartData = Object.entries(METRIC_LABELS).map(([key, label]) => ({
    name:  label,
    value: metrics[key] ?? 0,
    key,
  }))

  return (
    <div className="card space-y-6">
      <h2 className="section-title">Model Performance — Test Set</h2>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                 tick={{ fontSize: 11 }} />
          <Tooltip formatter={v => `${(v * 100).toFixed(2)}%`} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map(d => (
              <Cell key={d.key} fill={METRIC_COLORS[d.key] ?? '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(METRIC_LABELS).map(([key, label]) => (
          <div key={key}
               className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: METRIC_COLORS[key] }}>
              {metrics[key] !== undefined
                ? `${(metrics[key] * 100).toFixed(1)}%`
                : '–'}
            </p>
            <p className="text-xs text-slate-400 mt-1 leading-snug hidden sm:block">
              {METRIC_DESCRIPTIONS[key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
