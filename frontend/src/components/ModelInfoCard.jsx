const ARCHITECTURE = [
  { name: 'Input Layer',     detail: '13 features (scaled)',         color: 'bg-blue-100 text-blue-700' },
  { name: 'Dense(128) + BN', detail: 'ReLU activation',             color: 'bg-indigo-100 text-indigo-700' },
  { name: 'Dropout(30%)',    detail: 'Regularisation',              color: 'bg-slate-100 text-slate-600' },
  { name: 'Dense(64) + BN',  detail: 'ReLU activation',             color: 'bg-indigo-100 text-indigo-700' },
  { name: 'Dropout(30%)',    detail: 'Regularisation',              color: 'bg-slate-100 text-slate-600' },
  { name: 'Dense(32) + BN',  detail: 'ReLU activation',             color: 'bg-indigo-100 text-indigo-700' },
  { name: 'Dropout(20%)',    detail: 'Regularisation',              color: 'bg-slate-100 text-slate-600' },
  { name: 'Output Dense(1)', detail: 'Sigmoid — probability [0, 1]', color: 'bg-red-100 text-red-700' },
]

const DATASET_INFO = [
  { label: 'Dataset',   value: 'UCI Heart Disease (Cleveland)' },
  { label: 'Samples',   value: '303 patients' },
  { label: 'Features',  value: '13 clinical features' },
  { label: 'Target',    value: 'Binary (0 = No Disease, 1 = Disease)' },
  { label: 'Split',     value: '70% Train / 15% Val / 15% Test' },
  { label: 'Scaling',   value: 'StandardScaler (fit on train only)' },
  { label: 'Optimizer', value: 'Adam (lr=0.001)' },
  { label: 'Loss',      value: 'Binary Cross-Entropy' },
]

export default function ModelInfoCard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <div className="card">
        <h2 className="section-title">DNN Architecture</h2>
        <div className="space-y-2">
          {ARCHITECTURE.map((layer, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg
                               min-w-[160px] text-center ${layer.color}`}>
                {layer.name}
              </span>
              <span className="text-xs text-slate-500">{layer.detail}</span>
              {i < ARCHITECTURE.length - 1 && (
                <span className="text-slate-300 ml-auto">↓</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Total parameters: ~11,000 | Trainable: ~11,000
        </p>
      </div>

      <div className="card">
        <h2 className="section-title">Dataset &amp; Training Configuration</h2>
        <div className="space-y-2">
          {DATASET_INFO.map(({ label, value }) => (
            <div key={label}
                 className="flex justify-between items-start gap-4 py-2
                            border-b border-slate-50 last:border-0">
              <span className="text-xs font-medium text-slate-500 flex-shrink-0 w-28">
                {label}
              </span>
              <span className="text-xs text-slate-700 text-right">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-blue-50 rounded-xl p-3">
          <p className="text-xs text-blue-700 font-medium mb-1">
            Key DNN Concepts Demonstrated
          </p>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• Forward propagation through dense layers</li>
            <li>• Backpropagation with Adam optimiser</li>
            <li>• Dropout prevents overfitting (regularisation)</li>
            <li>• Batch Normalisation stabilises training</li>
            <li>• Early Stopping restores best model weights</li>
            <li>• Class weights handle mild class imbalance</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
