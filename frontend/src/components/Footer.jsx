export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 text-center md:text-left">
            <span className="font-semibold text-slate-500">HeartGuard AI</span>
            {' '}— Heart Disease Classification Using Deep Neural Network
          </p>
          <p className="text-xs text-slate-400 text-center">
            Academic project · Neural Networks / Deep Learning · 2026
          </p>
          <p className="text-xs text-amber-600 font-medium text-center md:text-right max-w-xs">
            For educational &amp; research purposes only — not a medical diagnostic tool.
          </p>
        </div>
      </div>
    </footer>
  )
}
