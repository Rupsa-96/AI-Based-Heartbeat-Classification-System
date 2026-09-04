import { useState, useEffect } from 'react'
import PatientForm from '../components/PatientForm'
import PredictionResult from '../components/PredictionResult'
import { predictHeartDisease } from '../services/api'

export default function HomePage() {
  const [result,      setResult]      = useState(null)
  const [patientData, setPatientData] = useState(null)
  const [patientName, setPatientName] = useState('')
  const [isLoading,   setIsLoading]   = useState(false)
  const [error,       setError]       = useState(null)

  const BG_IMAGES = ['/bg1.jpeg', '/bg2.jpeg']
  const [bgIndex, setBgIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex(prev => (prev + 1) % BG_IMAGES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  async function handleSubmit(payload, name) {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await predictHeartDisease(payload)
      setResult(data)
      setPatientData(payload)
      setPatientName(name ?? '')
      
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({
          behavior: 'smooth', block: 'start'
        })
      }, 100)
    } catch (err) {
      if (err.response) {
        const detail = err.response.data?.detail ?? 'Prediction failed.'
        setError(`Server error: ${detail}`)
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        setError(
          'Cannot reach the backend server. ' +
          'Make sure FastAPI is running on http://localhost:8000.'
        )
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setPatientData(null)
    setPatientName('')
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* hero */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl"
           style={{ minHeight: '220px' }}>

        {/* ── Background image layers — one fades out while the other fades in ── */}
        {BG_IMAGES.map((src, i) => (
          <div
            key={src}
            aria-hidden="true"
            style={{
              position:   'absolute',
              inset:       0,
              backgroundImage:    `url(${src})`,
              backgroundSize:     'cover',
              backgroundPosition: 'center',
              backgroundRepeat:   'no-repeat',
              opacity:     i === bgIndex ? 1 : 0,
              transition:  'opacity 1.2s ease-in-out',
              zIndex:      0,
            }}
          />
        ))}

        {/* ── Dark overlay so text stays readable over any image ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.10) 100%)',
            zIndex: 1,
          }}
        />

        {/* ── Content sits above both layers ── */}
        <div className="relative z-10 px-8 py-10 text-white">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">❤️</span>
              <span className="text-sm font-medium bg-white/20 backdrop-blur-sm
                               px-3 py-1 rounded-full border border-white/20">
                Deep Neural Network · Academic Project
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight drop-shadow-md">
              Heart Disease Classification
            </h1>
            <p className="mt-3 text-white/85 text-base leading-relaxed drop-shadow">
              Enter patient clinical parameters to receive a risk assessment from our
              trained Deep Neural Network model. Built on the UCI Heart Disease dataset.
            </p>
            <p className="mt-4 text-xs text-white/70 bg-black/30 backdrop-blur-sm
                          px-4 py-2 rounded-xl inline-block border border-white/10">
              Educational &amp; Research Use Only — Not a Medical Diagnostic Tool
            </p>
          </div>

          {/* ── Slide-indicator dots ── */}
          <div className="absolute bottom-4 right-5 flex items-center gap-1.5">
            {BG_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setBgIndex(i)}
                aria-label={`Show background ${i + 1}`}
                style={{
                  width:      i === bgIndex ? '20px' : '8px',
                  height:     '8px',
                  borderRadius: '4px',
                  background: i === bgIndex ? '#ffffff' : 'rgba(255,255,255,0.4)',
                  border:     'none',
                  cursor:     'pointer',
                  transition: 'all 0.4s ease',
                  padding:    0,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* patient form */}
      {!result && (
        <div className="card">
          <h2 className="section-title flex items-center gap-2">
            <span className="w-7 h-7 bg-red-100 text-red-600 rounded-lg flex
                             items-center justify-center text-sm font-bold">1</span>
            Enter Patient Clinical Parameters
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Fill in all 13 features from the patient's clinical assessment.
            All fields are required.
          </p>
          <PatientForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      )}

      {/* error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex
                        items-start gap-3">
          <span className="text-red-500 text-xl flex-shrink-0">⚠</span>
          <div>
            <p className="text-sm font-semibold text-red-700">Prediction Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-3 text-xs text-red-500 underline hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* prediction result */}
      {result && (
        <div id="result-section" className="space-y-4">
          <h2 className="section-title flex items-center gap-2">
            <span className="w-7 h-7 bg-red-100 text-red-600 rounded-lg flex
                             items-center justify-center text-sm font-bold">2</span>
            Prediction Result
          </h2>
          <PredictionResult
            result={result}
            patientData={patientData}
            patientName={patientName}
            onReset={handleReset}
          />
        </div>
      )}

      {/* how it works */}
      <div className="card bg-slate-50">
        <h2 className="section-title">How the Model Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            {
              step: '01',
              title: 'Input Features',
              desc: '13 clinical parameters are collected from the patient form.',
            },
            {
              step: '02',
              title: 'Preprocessing',
              desc: 'Features are scaled using the same StandardScaler fitted during training.',
            },
            {
              step: '03',
              title: 'DNN Inference',
              desc: 'The 4-layer Deep Neural Network performs forward propagation to compute a probability.',
            },
            {
              step: '04',
              title: 'Risk Output',
              desc: 'Probability is mapped to Low / Moderate / High risk and returned with a disclaimer.',
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-white rounded-xl p-4 border border-slate-100">
              <span className="text-2xl font-bold text-red-100">{step}</span>
              <p className="font-semibold text-slate-700 mt-2 text-sm">{title}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
