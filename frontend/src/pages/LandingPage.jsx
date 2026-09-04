import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'


function SectionTitle({ tag, title, subtitle }) {
  return (
    <div className="text-center mb-12">
      {tag && (
        <span className="inline-block text-xs font-semibold tracking-widest
                         uppercase text-red-600 bg-red-50 px-4 py-1.5
                         rounded-full mb-3">
          {tag}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}

function FeatureCard({ icon, title, desc, accent }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100
                    hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                       text-2xl mb-4 ${accent}`}>
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  )
}

function StatCard({ number, label, icon }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-extrabold text-white drop-shadow">{number}</div>
      <div className="text-sm text-white/70 mt-1">{label}</div>
    </div>
  )
}

function StepCard({ num, icon, title, desc, isLast }) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center
                        justify-center text-lg font-extrabold shadow-lg flex-shrink-0">
          {icon}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gradient-to-b from-red-200 to-transparent mt-2" />
        )}
      </div>
      <div className="pb-8">
        <p className="text-xs font-semibold text-red-500 uppercase tracking-widest mb-0.5">
          Step {num}
        </p>
        <h4 className="text-base font-bold text-slate-800">{title}</h4>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function TechBadge({ name, color }) {
  return (
    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm
                      font-semibold border ${color}`}>
      {name}
    </span>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()

  // crossfade bg3 and bg4 every 5 seconds
  const BG_IMAGES = ['/bg3.jpeg', '/bg4.jpeg']
  const [bgIndex, setBgIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setBgIndex(p => (p + 1) % BG_IMAGES.length)
    }, 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* nav bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md
                      border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16
                        flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">❤️</span>
            <div>
              <p className="text-sm font-extrabold text-slate-800 leading-tight">
                HeartGuard AI
              </p>
              <p className="text-xs text-slate-400 leading-tight">
                DNN Classification System
              </p>
            </div>
          </div>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1 text-sm text-slate-600">
            {[
              ['#features',   'Features'],
              ['#how-it-works','How It Works'],
              ['#evaluation', 'Evaluation'],
              ['#tech',       'Technology'],
            ].map(([href, label]) => (
              <a key={href} href={href}
                 className="px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700
                       text-white font-semibold text-sm px-5 py-2.5 rounded-xl
                       shadow-sm hover:shadow-md transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Get Started
          </button>
        </div>
      </nav>


      {/* hero section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">

        {/* Crossfading background images */}
        {BG_IMAGES.map((src, i) => (
          <div
            key={src}
            aria-hidden="true"
            style={{
              position:           'absolute',
              inset:               0,
              backgroundImage:    `url(${src})`,
              backgroundSize:     'cover',
              backgroundPosition: 'center',
              backgroundRepeat:   'no-repeat',
              opacity:             i === bgIndex ? 1 : 0,
              transition:         'opacity 1.4s ease-in-out',
              zIndex:              0,
            }}
          />
        ))}

        {/* Dark overlay */}
        <div
          aria-hidden="true"
          style={{
            position:   'absolute',
            inset:       0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.15) 100%)',
            zIndex:      1,
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                        py-24 sm:py-32 w-full">
          <div className="max-w-3xl">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm
                            border border-white/20 text-white text-xs font-semibold
                            px-4 py-2 rounded-full mb-6 tracking-wide">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              Deep Neural Network · UCI Heart Disease Dataset · Academic Project
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white
                           leading-tight drop-shadow-lg">
              AI-Powered
              <span className="block text-red-400 mt-1">Heart Disease</span>
              <span className="block mt-1">Classification</span>
            </h1>

            {/* Sub-headline */}
            <p className="mt-6 text-lg text-white/80 leading-relaxed max-w-xl">
              A complete end-to-end intelligent system that uses a trained
              <strong className="text-white"> Deep Neural Network</strong> to
              assess cardiovascular risk from 13 clinical parameters — instantly,
              accurately, and educationally.
            </p>

            {/* Key points */}
            <div className="mt-6 flex flex-wrap gap-3">
              {[
                '🧠 4-Layer DNN Architecture',
                '📊 82% Test Accuracy',
                '📋 13 Clinical Features',
                '🔒 No Data Stored',
                '📄 PDF Report Export',
                '💬 AI Health Assistant',
              ].map(pt => (
                <span key={pt}
                      className="text-xs font-medium text-white/90 bg-white/10
                                 backdrop-blur-sm border border-white/20
                                 px-3 py-1.5 rounded-full">
                  {pt}
                </span>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/app')}
                className="group flex items-center justify-center gap-2
                           bg-red-600 hover:bg-red-500 text-white font-bold
                           text-base px-8 py-4 rounded-2xl shadow-xl
                           hover:shadow-red-500/40 transition-all duration-300
                           hover:scale-105"
              >
                <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform"
                     fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Get Started — Try It Free
              </button>
              <a
                href="#how-it-works"
                className="flex items-center justify-center gap-2
                           bg-white/10 hover:bg-white/20 backdrop-blur-sm
                           text-white font-semibold text-base px-8 py-4
                           rounded-2xl border border-white/25 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1
                           1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                See How It Works
              </a>
            </div>
          </div>
        </div>

        {/* Slide indicator dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10
                        flex items-center gap-2">
          {BG_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setBgIndex(i)}
              aria-label={`Background ${i + 1}`}
              style={{
                width:        i === bgIndex ? '28px' : '10px',
                height:       '10px',
                borderRadius: '5px',
                background:   i === bgIndex ? '#ef4444' : 'rgba(255,255,255,0.4)',
                border:       'none',
                cursor:       'pointer',
                transition:   'all 0.4s ease',
                padding:       0,
              }}
            />
          ))}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 right-8 z-10 hidden sm:flex flex-col
                        items-center gap-1 text-white/40">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </section>


      {/* stats bar */}
      <section className="bg-gradient-to-r from-red-700 via-red-600 to-red-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <StatCard number="82%"  label="Test Set Accuracy"        icon="🎯" />
            <StatCard number="0.91" label="ROC-AUC Score"            icon="📈" />
            <StatCard number="13"   label="Clinical Input Features"  icon="🩺" />
            <StatCard number="303"  label="Training Samples (UCI)"   icon="📋" />
          </div>
        </div>
      </section>


      {/* about section */}
      <section className="py-20 bg-white" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Left */}
            <div>
              <span className="text-xs font-semibold tracking-widest uppercase
                               text-red-600 bg-red-50 px-4 py-1.5 rounded-full">
                About the Project
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900
                             leading-tight">
                Early Detection Saves Lives
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Heart disease is the world's leading cause of death, claiming over
                <strong> 17.9 million lives</strong> annually (WHO). Early and accurate
                risk stratification gives clinicians and patients the critical window to
                act — before a cardiac event occurs.
              </p>
              <p className="mt-4 text-slate-600 leading-relaxed">
                HeartGuard AI is an <strong>academic end-to-end system</strong> built to
                demonstrate how Deep Neural Networks can be applied to structured clinical
                data. It accepts 13 standard patient parameters from the UCI Heart Disease
                dataset and classifies the likelihood of heart disease in real time.
              </p>
              <p className="mt-4 text-slate-600 leading-relaxed">
                The project covers the full ML engineering stack — data preprocessing,
                model training, REST API deployment, a responsive React frontend,
                prediction history persistence with SQLite, PDF report generation, and
                a context-aware AI health assistant.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {['Neural Networks', 'Deep Learning', 'FastAPI', 'React', 'SQLite', 'TensorFlow'].map(t => (
                  <span key={t}
                        className="bg-slate-100 text-slate-700 text-xs font-semibold
                                   px-3 py-1.5 rounded-lg">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — visual callout cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🎓', label: 'Academic', desc: 'Built for Neural Networks / Deep Learning coursework' },
                { icon: '🔬', label: 'Research-Grade', desc: 'UCI Cleveland Heart Disease dataset — a standard benchmark' },
                { icon: '⚡', label: 'Real-Time', desc: 'Predictions in under 200 ms over a local REST API' },
                { icon: '📱', label: 'Responsive', desc: 'Works on desktop, tablet, and mobile browsers' },
                { icon: '🔒', label: 'Privacy-First', desc: 'No patient data transmitted to external servers' },
                { icon: '📄', label: 'PDF Reports', desc: 'Download a professional prediction report instantly' },
              ].map(({ icon, label, desc }) => (
                <div key={label}
                     className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <span className="text-2xl">{icon}</span>
                  <p className="font-bold text-slate-800 text-sm mt-2">{label}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* features grid */}
      <section className="py-20 bg-slate-50" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            tag="Features"
            title="Everything You Need"
            subtitle="A fully featured web application demonstrating every layer of a production-grade AI system — from raw clinical data to actionable health insights."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🧠', accent: 'bg-purple-50',
                title: 'Deep Neural Network Prediction',
                desc:  'A 4-layer DNN (Dense → BatchNorm → ReLU → Dropout × 3) trained on the UCI Heart Disease dataset delivers binary classification with ~82% accuracy and 0.91 ROC-AUC.',
              },
              {
                icon: '📊', accent: 'bg-blue-50',
                title: 'Performance Dashboard',
                desc:  'Interactive charts showing Accuracy, Precision, Recall, F1-Score, and ROC-AUC. Visual DNN architecture diagram and full feature reference documentation.',
              },
              {
                icon: '📋', accent: 'bg-green-50',
                title: 'Persistent Prediction History',
                desc:  'Every prediction is automatically saved to a SQLite database. Filter, search, sort, and delete records. History survives page refresh and server restart.',
              },
              {
                icon: '📄', accent: 'bg-red-50',
                title: 'PDF Report Generation',
                desc:  'Download a professional PDF report per prediction — includes the result, probability gauge, all 13 patient parameters, model info, and medical disclaimer.',
              },
              {
                icon: '💬', accent: 'bg-amber-50',
                title: 'AI Health Assistant',
                desc:  'A context-aware chatbot powered by an in-browser knowledge engine. Ask about your risk, clinical values, diet, exercise, and more — all offline, no API keys.',
              },
              {
                icon: '🩺', accent: 'bg-teal-50',
                title: 'Clinical Parameter Form',
                desc:  'Patient-friendly input form with 14 fields (including patient name), real-time validation, human-readable dropdowns, and descriptive hints for each field.',
              },
            ].map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>


      {/* how it works */}
      <section className="py-20 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            tag="Workflow"
            title="How It Works"
            subtitle="From patient data entry to a risk prediction — the complete pipeline explained."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Steps */}
            <div className="space-y-0">
              {[
                {
                  num: 1, icon: '📝',
                  title: 'Enter Patient Data',
                  desc:  'Fill in the 13 UCI clinical features — age, sex, blood pressure, cholesterol, ECG results, and more — using the validated input form.',
                },
                {
                  num: 2, icon: '⚙️',
                  title: 'Preprocessing',
                  desc:  'The backend applies the same StandardScaler fitted on training data. Features are standardised to zero mean and unit variance — exactly as during model training, preventing any data leakage.',
                },
                {
                  num: 3, icon: '🧠',
                  title: 'DNN Inference',
                  desc:  'The preprocessed 13-feature vector passes through 4 layers of the trained Deep Neural Network. The sigmoid output layer returns a probability between 0 and 1.',
                },
                {
                  num: 4, icon: '📊',
                  title: 'Risk Classification',
                  desc:  'The probability is mapped to Low (0–34%), Moderate (35–64%), or High (65–100%) risk. The full result is displayed with a radial gauge, summary, and AI assistant.',
                },
                {
                  num: 5, icon: '💾',
                  title: 'Auto-Save to History',
                  desc:  'Every successful prediction is automatically persisted to SQLite — no manual action needed. Accessible from the History page with full filter, search, and delete controls.',
                },
                {
                  num: 6, icon: '📄',
                  title: 'Download PDF Report',
                  desc:  'Generate a professional PDF report containing the prediction result, probability gauge, all patient parameters, model information, and the mandatory medical disclaimer.',
                  isLast: true,
                },
              ].map((s, i, arr) => (
                <StepCard key={s.num} {...s} isLast={i === arr.length - 1} />
              ))}
            </div>

            {/* Architecture diagram */}
            <div className="bg-slate-900 rounded-2xl p-6 text-sm font-mono
                            text-green-400 shadow-xl sticky top-24">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-4">
                DNN Architecture
              </p>
              {[
                { label: 'Input Layer',       detail: '13 features  (scaled)', color: 'text-blue-400' },
                { label: 'Dense(128)',         detail: '1,792 params',          color: 'text-purple-400' },
                { label: '  BatchNorm + ReLU',detail: 'normalise + activate',  color: 'text-slate-400' },
                { label: '  Dropout(30%)',    detail: 'regularisation',        color: 'text-slate-500' },
                { label: 'Dense(64)',          detail: '8,256 params',          color: 'text-purple-400' },
                { label: '  BatchNorm + ReLU',detail: 'normalise + activate',  color: 'text-slate-400' },
                { label: '  Dropout(30%)',    detail: 'regularisation',        color: 'text-slate-500' },
                { label: 'Dense(32)',          detail: '2,080 params',          color: 'text-purple-400' },
                { label: '  BatchNorm + ReLU',detail: 'normalise + activate',  color: 'text-slate-400' },
                { label: '  Dropout(20%)',    detail: 'regularisation',        color: 'text-slate-500' },
                { label: 'Dense(1) + Sigmoid',detail: '33 params',             color: 'text-red-400' },
                { label: 'Output',             detail: 'P(heart disease) ∈ [0,1]', color: 'text-green-300' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center
                                        border-b border-slate-800 py-1.5">
                  <span className={row.color}>{row.label}</span>
                  <span className="text-slate-500 text-xs">{row.detail}</span>
                </div>
              ))}
              <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between text-xs">
                <span className="text-slate-400">Total trainable params:</span>
                <span className="text-green-400 font-bold">12,609</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* evaluation metrics */}
      <section className="py-20 bg-slate-50" id="evaluation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            tag="Model Evaluation"
            title="Rigorous Performance Testing"
            subtitle="The model is evaluated on a fully held-out test set that was never seen during training or validation — ensuring the reported metrics are unbiased."
          />

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
            {[
              { metric: 'Accuracy',  value: '82.2%', color: '#4C72B0', desc: 'Correct predictions overall' },
              { metric: 'Precision', value: '84.2%', color: '#55A868', desc: 'Of predicted disease cases' },
              { metric: 'Recall',    value: '76.2%', color: '#C44E52', desc: 'Of all actual disease cases' },
              { metric: 'F1-Score',  value: '80.0%', color: '#8172B2', desc: 'Precision-recall balance' },
              { metric: 'ROC-AUC',   value: '0.911', color: '#CCB974', desc: 'Class separation ability' },
            ].map(({ metric, value, color, desc }) => (
              <div key={metric}
                   className="bg-white rounded-2xl p-5 text-center shadow-sm
                              border border-slate-100 hover:shadow-md transition-shadow">
                <p className="text-3xl font-extrabold mt-1" style={{ color }}>{value}</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{metric}</p>
                <p className="text-xs text-slate-400 mt-1 leading-snug">{desc}</p>
              </div>
            ))}
          </div>

          {/* Confusion matrix explanation */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center
                               justify-center text-sm">📊</span>
              What Each Metric Means
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  term: 'Accuracy',
                  formula: '(TP + TN) / Total',
                  explain: 'The percentage of all predictions (both disease and no-disease) that the model got right. Limited when classes are imbalanced.',
                },
                {
                  term: 'Precision',
                  formula: 'TP / (TP + FP)',
                  explain: 'Of every patient the model flagged as having heart disease, how many actually do? High precision = fewer false alarms.',
                },
                {
                  term: 'Recall (Sensitivity)',
                  formula: 'TP / (TP + FN)',
                  explain: 'Of every real heart disease patient, how many did the model catch? High recall = fewer missed cases. Critical in medical screening.',
                },
                {
                  term: 'F1-Score',
                  formula: '2 × (P × R) / (P + R)',
                  explain: 'The harmonic mean of Precision and Recall. The go-to single metric when you need to balance both — useful with slightly imbalanced data.',
                },
                {
                  term: 'ROC-AUC',
                  formula: 'Area Under ROC Curve',
                  explain: 'Measures the model\'s ability to discriminate between the two classes at all thresholds. 0.5 = random; 1.0 = perfect. Our 0.91 is excellent for a small dataset.',
                },
                {
                  term: 'Confusion Matrix',
                  formula: 'TP / FP / FN / TN',
                  explain: 'The 2×2 breakdown of correct and incorrect predictions per class. Reveals exactly where the model succeeds or makes mistakes.',
                },
              ].map(({ term, formula, explain }) => (
                <div key={term} className="bg-slate-50 rounded-xl p-4">
                  <p className="font-bold text-slate-800 text-sm">{term}</p>
                  <code className="text-xs text-red-600 bg-red-50 px-2 py-0.5
                                   rounded mt-1 inline-block">
                    {formula}
                  </code>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{explain}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* technology stack */}
      <section className="py-20 bg-white" id="tech">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            tag="Technology"
            title="Built With Modern Tools"
            subtitle="Every component of the stack was chosen for reliability, educational clarity, and real-world applicability."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                category: 'Machine Learning',
                color:     'bg-purple-50 border-purple-100',
                icon:      '🧠',
                items: ['TensorFlow 2.21 / Keras', 'NumPy 1.26', 'Pandas 2.2', 'Scikit-learn 1.9', 'Matplotlib / Seaborn'],
              },
              {
                category: 'Backend',
                color:     'bg-blue-50 border-blue-100',
                icon:      '⚙️',
                items: ['FastAPI', 'Uvicorn (ASGI)', 'Pydantic v2', 'SQLite (stdlib)', 'Python 3.11'],
              },
              {
                category: 'Frontend',
                color:     'bg-teal-50 border-teal-100',
                icon:      '🎨',
                items: ['React 18', 'Vite 5', 'Tailwind CSS 3', 'Recharts', 'Axios', 'jsPDF'],
              },
              {
                category: 'Dataset',
                color:     'bg-amber-50 border-amber-100',
                icon:      '📋',
                items: ['UCI Heart Disease', 'Cleveland Clinic 1988', '303 patients', '13 features', 'Binary target (0/1)'],
              },
            ].map(({ category, color, icon, items }) => (
              <div key={category}
                   className={`rounded-2xl p-6 border ${color}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{icon}</span>
                  <h3 className="font-bold text-slate-800">{category}</h3>
                </div>
                <ul className="space-y-2">
                  {items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* advantages */}
      <section className="py-20 bg-slate-50" id="advantages">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            tag="Advantages"
            title="Why HeartGuard AI?"
            subtitle="What makes this project stand out as a deep learning demonstration."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🔁', title: 'End-to-End Pipeline',
                desc: 'From raw CSV data through preprocessing, model training, REST API, to a polished React UI — every layer is implemented and documented.',
              },
              {
                icon: '🚫', title: 'No Data Leakage',
                desc: 'StandardScaler is fitted exclusively on training data and serialised with pickle. The exact same scaler is loaded at inference time, preventing any contamination.',
              },
              {
                icon: '📈', title: 'Multiple Evaluation Metrics',
                desc: 'Accuracy alone is insufficient. The system reports Precision, Recall, F1-Score, ROC-AUC, and a full confusion matrix with TP/FP/TN/FN breakdown.',
              },
              {
                icon: '🛡️', title: 'Robust Regularisation',
                desc: 'Dropout layers (30%, 30%, 20%), BatchNormalization, class-weighted training, EarlyStopping, and ReduceLROnPlateau combine to minimise overfitting on the small dataset.',
              },
              {
                icon: '💾', title: 'Persistent History',
                desc: 'SQLite stores every prediction automatically. The history page provides full CRUD operations — view, filter, sort, delete individual records, or clear all.',
              },
              {
                icon: '📄', title: 'Professional PDF Reports',
                desc: 'Client-side jsPDF generates a complete report with patient name, all clinical values, risk visualisation, model metadata, and the mandatory medical disclaimer.',
              },
              {
                icon: '💬', title: 'Contextual AI Assistant',
                desc: '25-intent knowledge engine tailored to the patient\'s actual clinical values — no external API, fully offline. Explains risk factors, diet, exercise, and medication classes.',
              },
              {
                icon: '🎓', title: 'Viva-Ready Documentation',
                desc: 'The README includes 31 viva Q&As covering neural networks, backpropagation, activation functions, dropout, confusion matrices, and every other examinable topic.',
              },
              {
                icon: '⚡', title: 'Fast & Responsive',
                desc: 'Vite HMR for instant development feedback. FastAPI + uvicorn delivers sub-200ms inference. Tailwind CSS ensures pixel-perfect responsive layout on all screen sizes.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title}
                   className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100
                              hover:shadow-md hover:-translate-y-0.5 transition-all duration-300
                              flex gap-4">
                <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* medical disclaimer */}
      <section className="py-16 bg-amber-50 border-y border-amber-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-3xl">⚕️</span>
          <h2 className="mt-3 text-2xl font-bold text-amber-900">Medical Disclaimer</h2>
          <p className="mt-4 text-amber-800 leading-relaxed">
            HeartGuard AI is an <strong>academic and educational project</strong> developed
            to demonstrate Deep Neural Network concepts in a medical data context.
            It is <strong>NOT a medical device</strong>, has <strong>NOT been clinically
            validated</strong>, and <strong>MUST NOT</strong> be used to make real medical
            decisions. The model is trained on a small 1988 dataset (303 samples) and has
            ~82% accuracy — meaning it makes mistakes.
          </p>
          <p className="mt-3 text-amber-700 font-medium">
            Always consult a qualified and licensed cardiologist or physician for any
            cardiovascular health concerns. If you experience chest pain, shortness of
            breath, or other cardiac symptoms — call emergency services immediately.
          </p>
        </div>
      </section>


      {/* final call to action */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-4xl">❤️</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Ready to Try the System?
          </h2>
          <p className="mt-4 text-lg text-slate-400 leading-relaxed">
            Enter a patient's 13 clinical parameters and receive an instant
            Deep Neural Network risk assessment — complete with probability score,
            AI health guidance, and a downloadable PDF report.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/app')}
              className="group flex items-center justify-center gap-2
                         bg-red-600 hover:bg-red-500 text-white font-bold
                         text-base px-10 py-4 rounded-2xl shadow-xl
                         hover:shadow-red-500/30 transition-all duration-300
                         hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get Started Now
            </button>
            <a
              href="#features"
              className="flex items-center justify-center gap-2 bg-white/10
                         hover:bg-white/20 text-white font-semibold text-base
                         px-10 py-4 rounded-2xl border border-white/20
                         transition-all duration-300"
            >
              Explore Features
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            For educational &amp; research purposes only ·
            Not a medical diagnostic tool ·
            Academic project 2026
          </p>
        </div>
      </section>

    </div>
  )
}
