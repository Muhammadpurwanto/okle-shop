import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShoppingBag, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Tentukan tujuan redirect: Kembali ke halaman yang tadi dicegat, atau ke '/' jika tidak ada
  const from = location.state?.from?.pathname || '/';

  // Jika pengguna sudah login, langsung alihkan ke beranda
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true }); // 🌟 Alihkan ke tujuan awal!
    }
    clearError();
  }, [isAuthenticated, navigate, from, clearError]);

  // Validasi lokal sebelum kirim ke server
  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Format email tidak valid';
    }

    if (!password) {
      errors.password = 'Kata sandi wajib diisi';
    } else if (password.length < 8) {
      errors.password = 'Kata sandi minimal 8 karakter';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(email, password);
      navigate(from, { replace: true }); // 🌟 Alihkan ke tujuan awal!
    } catch {
      // Ditangani useAuthStore
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
          <h1 className="text-xl font-bold text-white">Selamat Datang Kembali</h1>
          <p className="text-xs text-slate-400">Masuk ke akun Anda untuk melanjutkan belanja</p>
        </div>

        {/* Alert Error dari Backend */}
        {error && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Email */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Alamat Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                }}
                placeholder="nama@email.com"
                className={`w-full bg-slate-900/80 border ${
                  formErrors.email ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition`}
              />
            </div>
            {formErrors.email && <p className="text-rose-400 text-[11px] mt-1">{formErrors.email}</p>}
          </div>

          {/* Input Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-slate-300">Kata Sandi</label>
              <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                Lupa sandi?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                }}
                placeholder="Minimal 8 karakter"
                className={`w-full bg-slate-900/80 border ${
                  formErrors.password ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formErrors.password && <p className="text-rose-400 text-[11px] mt-1">{formErrors.password}</p>}
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                Memproses...
              </span>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Masuk ke Akun
              </>
            )}
          </button>
        </form>

        {/* Link Daftar */}
        <p className="text-center text-xs text-slate-400">
          Belum punya akun?{' '}
          <Link to="/register" className="text-indigo-400 font-semibold hover:text-indigo-300 transition">
            Daftar sekarang
          </Link>
        </p>

      </div>
    </div>
  );
}