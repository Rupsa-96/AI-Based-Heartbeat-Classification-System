import { useState } from 'react'

const INITIAL_STATE = {
  patientName: '',   // display-only — never sent to the model
  age: '',
  sex: '',
  cp: '',
  trestbps: '',
  chol: '',
  fbs: '',
  restecg: '',
  thalach: '',
  exang: '',
  oldpeak: '',
  slope: '',
  ca: '',
  thal: '',
}

const FIELDS = [
  {
    key: 'age',
    label: 'Age',
    type: 'number',
    placeholder: 'e.g. 55',
    min: 1, max: 120,
    hint: 'Patient age in years',
  },
  {
    key: 'sex',
    label: 'Sex',
    type: 'select',
    options: [
      { label: 'Female', value: 0 },
      { label: 'Male',   value: 1 },
    ],
    hint: 'Biological sex',
  },
  {
    key: 'cp',
    label: 'Chest Pain Type',
    type: 'select',
    options: [
      { label: 'Typical Angina',    value: 0 },
      { label: 'Atypical Angina',   value: 1 },
      { label: 'Non-Anginal Pain',  value: 2 },
      { label: 'Asymptomatic',      value: 3 },
    ],
    hint: 'Type of chest pain experienced',
  },
  {
    key: 'trestbps',
    label: 'Resting Blood Pressure',
    type: 'number',
    placeholder: 'e.g. 120',
    min: 50, max: 250,
    unit: 'mm Hg',
    hint: 'Measured on hospital admission',
  },
  {
    key: 'chol',
    label: 'Serum Cholesterol',
    type: 'number',
    placeholder: 'e.g. 200',
    min: 50, max: 700,
    unit: 'mg/dl',
    hint: 'Total serum cholesterol level',
  },
  {
    key: 'fbs',
    label: 'Fasting Blood Sugar > 120 mg/dl',
    type: 'select',
    options: [
      { label: 'No (≤ 120 mg/dl)',  value: 0 },
      { label: 'Yes (> 120 mg/dl)', value: 1 },
    ],
    hint: 'Elevated fasting blood sugar may indicate diabetes',
  },
  {
    key: 'restecg',
    label: 'Resting ECG Result',
    type: 'select',
    options: [
      { label: 'Normal',                          value: 0 },
      { label: 'ST-T Wave Abnormality',           value: 1 },
      { label: 'Left Ventricular Hypertrophy',    value: 2 },
    ],
    hint: 'Resting electrocardiographic results',
  },
  {
    key: 'thalach',
    label: 'Maximum Heart Rate Achieved',
    type: 'number',
    placeholder: 'e.g. 150',
    min: 60, max: 250,
    unit: 'bpm',
    hint: 'Peak heart rate during exercise test',
  },
  {
    key: 'exang',
    label: 'Exercise-Induced Angina',
    type: 'select',
    options: [
      { label: 'No',  value: 0 },
      { label: 'Yes', value: 1 },
    ],
    hint: 'Chest pain triggered by physical exertion',
  },
  {
    key: 'oldpeak',
    label: 'ST Depression (Oldpeak)',
    type: 'number',
    placeholder: 'e.g. 1.2',
    min: 0, max: 10, step: 0.1,
    hint: 'ST depression induced by exercise relative to rest',
  },
  {
    key: 'slope',
    label: 'Slope of Peak Exercise ST Segment',
    type: 'select',
    options: [
      { label: 'Upsloping',    value: 0 },
      { label: 'Flat',         value: 1 },
      { label: 'Downsloping',  value: 2 },
    ],
    hint: 'Shape of ST segment at peak exercise',
  },
  {
    key: 'ca',
    label: 'Major Vessels Coloured by Fluoroscopy',
    type: 'select',
    options: [
      { label: '0', value: 0 },
      { label: '1', value: 1 },
      { label: '2', value: 2 },
      { label: '3', value: 3 },
      { label: '4', value: 4 },
    ],
    hint: 'Number of major coronary vessels (0–4)',
  },
  {
    key: 'thal',
    label: 'Thalassemia',
    type: 'select',
    options: [
      { label: 'Normal',           value: 0 },
      { label: 'Fixed Defect',     value: 1 },
      { label: 'Reversible Defect',value: 2 },
      { label: 'Unknown',          value: 3 },
    ],
    hint: 'Blood disorder affecting haemoglobin',
  },
]

export default function PatientForm({ onSubmit, isLoading }) {
  const [values, setValues]   = useState(INITIAL_STATE)
  const [errors, setErrors]   = useState({})
  const [touched, setTouched] = useState({})

  // ---- Validation ----
  function validate(vals) {
    const errs = {}

    // Patient name — required, letters/spaces/hyphens only, 2–60 chars
    const name = (vals.patientName ?? '').trim()
    if (!name) {
      errs.patientName = 'Patient name is required.'
    } else if (name.length < 2) {
      errs.patientName = 'Name must be at least 2 characters.'
    } else if (name.length > 60) {
      errs.patientName = 'Name must be 60 characters or fewer.'
    } else if (!/^[a-zA-Z\s\-'.]+$/.test(name)) {
      errs.patientName = 'Name may only contain letters, spaces, hyphens, or apostrophes.'
    }

    // Clinical fields
    FIELDS.forEach(({ key, min, max }) => {
      const v = vals[key]
      if (v === '' || v === null || v === undefined) {
        errs[key] = 'This field is required.'
      } else if (min !== undefined && parseFloat(v) < min) {
        errs[key] = `Minimum value is ${min}.`
      } else if (max !== undefined && parseFloat(v) > max) {
        errs[key] = `Maximum value is ${max}.`
      }
    })
    return errs
  }

  function handleChange(key, value) {
    const updated = { ...values, [key]: value }
    setValues(updated)
    if (touched[key]) {
      const errs = validate(updated)
      setErrors(errs)
    }
  }

  function handleBlur(key) {
    setTouched(prev => ({ ...prev, [key]: true }))
    const errs = validate(values)
    setErrors(errs)
  }

  function handleSubmit(e) {
    e.preventDefault()
    // Mark name + all clinical fields as touched
    const allTouched = { patientName: true, ...Object.fromEntries(FIELDS.map(f => [f.key, true])) }
    setTouched(allTouched)
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    // Build numeric payload — only the 13 model features (name is NOT sent to the API)
    const payload = Object.fromEntries(
      FIELDS.map(({ key }) => [key, parseFloat(values[key])])
    )
    // Pass name separately so parent can display it
    onSubmit(payload, values.patientName.trim())
  }

  function handleReset() {
    setValues(INITIAL_STATE)
    setErrors({})
    setTouched({})
  }

  const isValid =
    Object.keys(validate(values)).length === 0 &&
    values.patientName.trim() !== '' &&
    FIELDS.every(({ key }) => values[key] !== '')

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* ── Patient Name — full width, rendered first ── */}
      <div className="mb-6">
        <label htmlFor="patientName" className="label">
          Patient Name
          <span className="ml-1 text-red-500 text-xs font-normal">*</span>
        </label>
        <div className="relative max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0
                       00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </span>
          <input
            id="patientName"
            type="text"
            placeholder="e.g. Ravi Sharma"
            value={values.patientName}
            onChange={e => handleChange('patientName', e.target.value)}
            onBlur={() => handleBlur('patientName')}
            maxLength={60}
            autoComplete="off"
            className={`input-field pl-10 ${
              touched.patientName && errors.patientName
                ? 'border-red-400 focus:ring-red-400'
                : touched.patientName && !errors.patientName
                ? 'border-emerald-400 focus:ring-emerald-400'
                : ''
            }`}
          />
          {/* Green tick when valid */}
          {touched.patientName && !errors.patientName && values.patientName.trim() && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 text-sm">
              ✓
            </span>
          )}
        </div>
        {touched.patientName && errors.patientName ? (
          <p className="mt-1 text-xs text-red-500">{errors.patientName}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-400">
            Full name of the patient (used for display and report only — not sent to the model)
          </p>
        )}
      </div>

      {/* ── 13 clinical feature fields ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label htmlFor={field.key} className="label">
              {field.label}
              {field.unit && (
                <span className="ml-1 text-xs text-slate-400 font-normal">
                  ({field.unit})
                </span>
              )}
            </label>

            {field.type === 'select' ? (
              <select
                id={field.key}
                value={values[field.key]}
                onChange={e => handleChange(field.key, e.target.value)}
                onBlur={() => handleBlur(field.key)}
                className={`input-field ${
                  touched[field.key] && errors[field.key]
                    ? 'border-red-400 focus:ring-red-400'
                    : ''
                }`}
              >
                <option value="">— Select —</option>
                {field.options.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.key}
                type="number"
                min={field.min}
                max={field.max}
                step={field.step ?? 1}
                placeholder={field.placeholder}
                value={values[field.key]}
                onChange={e => handleChange(field.key, e.target.value)}
                onBlur={() => handleBlur(field.key)}
                className={`input-field ${
                  touched[field.key] && errors[field.key]
                    ? 'border-red-400 focus:ring-red-400'
                    : ''
                }`}
              />
            )}

            {touched[field.key] && errors[field.key] ? (
              <p className="mt-1 text-xs text-red-500">{errors[field.key]}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">{field.hint}</p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analysing…
            </>
          ) : (
            'Predict Heart Disease Risk'
          )}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="btn-secondary w-full sm:w-auto"
        >
          Reset Form
        </button>
      </div>

      {!isValid && Object.keys(touched).length > 0 && (
        <p className="mt-3 text-xs text-amber-600">
          Please fill in all fields with valid values before submitting.
        </p>
      )}
    </form>
  )
}
