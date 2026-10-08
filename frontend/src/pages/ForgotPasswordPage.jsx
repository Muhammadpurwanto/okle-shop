import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { ShoppingBag, Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await authService.forgotPassword(email);
      setIsSubmitted(true);
      if (res.data?.reset_token) {
        setResetToken(res.data.reset_token);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Gagal mengirim permintaan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 p-8 shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl text-indigo-400">
            <ShoppingBag className="w-7 h-7 text-indigo-500" />
            <span>Okle Shop</span>
          </Link>
          <h1 className="text-xl font-bold text-white">Lupa Kata Sandi?</h1>
          <p className="text-xs text-slate-400">
            Masukkan alamat email yang terdaftar untuk menerima tautan pemulihan
          </p>
        </div>

        {/* Alert Error */}
        {error && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* State Setelah Berhasil Submit */}
        {isSubmitted ? (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200">Permintaan Pemulihan Dikirim!</p>
                <p className="text-[11px] text-emerald-300/80 mt-1">
                  Jika email terdaftar, instruksi pemulihan telah disiapkan. Token berlaku selama 15 menit.
                </p>
              </div>
            </div>

            {/* Tombol Pintas Pengujian Lokal */}
            {resetToken && (
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700 space-y-3">
                <span className="text-[11px] text-amber-400 font-mono block">
                  🛠️ Mode Pengujian Lokal: Tautan Reset Siap Digunakan
                </span>
                <Link
                  to={`/reset-password?token=${resetToken}`}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
                >
                  <KeyRound className="w-4 h-4" /> Buka Halaman Reset Sandi
                </Link>
              </div>
            )}

            <Link
              to="/login"
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Halaman Masuk
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Alamat Email Terdaftar</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  Mengirim Permintaan...
                </span>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Kirim Tautan Pemulihan
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition">
                <ArrowLeft className="w-3.5 h-3.5" /> Ingat kata sandi? Masuk di sini
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}