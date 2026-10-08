import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function ForbiddenPage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md rounded-2xl border border-rose-800/40 p-8 text-center shadow-2xl space-y-6">
        
        {/* Ikon Peringatan 403 */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
          <ShieldAlert className="w-9 h-9" />
        </div>

        {/* Teks Penjelasan */}
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-rose-400 tracking-widest uppercase">
            Error 403: Forbidden
          </span>
          <h1 className="text-2xl font-bold text-white">Akses Halaman Dibatasi</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Akun Anda saat ini memiliki peran{' '}
            <span className="text-indigo-400 font-semibold font-mono">{user?.role || 'GUEST'}</span>. Halaman yang Anda tuju membutuhkan hak akses tingkat Administrator.
          </p>
        </div>

        {/* Tombol Aksi */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/30"
          >
            <Home className="w-4 h-4" /> Kembali ke Beranda
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition border border-slate-600"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>

      </div>
    </div>
  );
}