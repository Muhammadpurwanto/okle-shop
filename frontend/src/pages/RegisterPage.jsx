import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShoppingBag, User, Mail, Phone, Lock, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
    clearError();
  }, [isAuthenticated, navigate, clearError]);

  const validate = () => {
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      errors.name = 'Nama lengkap minimal 3 karakter';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Format email tidak valid';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Nomor telepon wajib diisi';
    } else if (!/^[0-9]{10,15}$/.test(formData.phone)) {
      errors.phone = 'Nomor telepon harus berupa 10 - 15 digit angka';
    }

    if (!formData.password) {
      errors.password = 'Kata sandi wajib diisi';
    } else if (formData.password.length < 8) {
      errors.password = 'Kata sandi minimal 8 karakter';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Konfirmasi kata sandi tidak cocok';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register(formData.name, formData.email, formData.password, formData.phone);
      setSuccessMessage('Registrasi berhasil! Mengalihkan ke halaman masuk...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch {
      // Error backend otomatis ditangani oleh useAuthStore
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
          <h1 className="text-xl font-bold text-white">Buat Akun Pembeli Baru</h1>
          <p className="text-xs text-slate-400">Daftar sekarang untuk mulai berbelanja di Okle Shop</p>
        </div>

        {/* Alert Sukses */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Alert Error dari Backend */}
        {error && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Registrasi */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nama Lengkap</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Budi Santoso"
                className={`w-full bg-slate-900/80 border ${
                  formErrors.name ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition`}
              />
            </div>
            {formErrors.name && <p className="text-rose-400 text-[11px] mt-1">{formErrors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Alamat Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="budi@email.com"
                className={`w-full bg-slate-900/80 border ${
                  formErrors.email ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition`}
              />
            </div>
            {formErrors.email && <p className="text-rose-400 text-[11px] mt-1">{formErrors.email}</p>}
          </div>

          {/* Nomor HP */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nomor Handphone / WhatsApp</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="081234567890"
                className={`w-full bg-slate-900/80 border ${
                  formErrors.phone ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition`}
              />
            </div>
            {formErrors.phone && <p className="text-rose-400 text-[11px] mt-1">{formErrors.phone}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
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

          {/* Konfirmasi Password */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Ulangi Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Ketik ulang kata sandi di atas"
                className={`w-full bg-slate-900/80 border ${
                  formErrors.confirmPassword ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition`}
              />
            </div>
            {formErrors.confirmPassword && (
              <p className="text-rose-400 text-[11px] mt-1">{formErrors.confirmPassword}</p>
            )}
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                Mendaftarkan Akun...
              </span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Daftar Akun Sekarang
              </>
            )}
          </button>
        </form>

        {/* Link Masuk */}
        <p className="text-center text-xs text-slate-400">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition">
            Masuk di sini
          </Link>
        </p>

      </div>
    </div>
  );
}