import React from 'react';
import { ShoppingBag, CheckCircle, ArrowRight } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
        {/* Brand Icon */}
        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShoppingBag className="w-8 h-8" />
        </div>

        {/* Title & Description */}
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Okle Shop Frontend
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          React 18 + Vite + Tailwind CSS berhasil diinisialisasi dan siap digunakan.
        </p>

        {/* Status Indicators */}
        <div className="mt-6 space-y-2 text-left bg-slate-50 p-4 rounded-xl text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-brand-600" />
            <span>Vite Dev Server (HMR Aktif)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-brand-600" />
            <span>Tailwind CSS Utility Classes</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-brand-600" />
            <span>Lucide React Icons</span>
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full mt-6 bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group">
          <span>Menuju Hari 9 (Docker Dev & Air)</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

export default App;