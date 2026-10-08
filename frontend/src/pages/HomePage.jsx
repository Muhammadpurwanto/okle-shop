import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShoppingBag, User, LogOut, LogIn, UserPlus, MapPin, Package, Shield } from 'lucide-react';

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* 1. Header / Navbar */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-indigo-400 hover:text-indigo-300 transition">
            <ShoppingBag className="w-6 h-6 text-indigo-500" />
            <span>Okle Shop</span>
          </Link>

          {/* Navigasi Kanan */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/profile"
              className="text-right hidden sm:block hover:opacity-80 transition"
            >
              <p className="text-sm font-semibold text-slate-200">{user.name || user.email}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                user.role === 'ADMIN'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {user.role}
              </span>
            </Link>
            <Link
              to="/profile"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" /> Profil
            </Link>
            <Link
              to="/addresses"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Alamat
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-600/30 transition"
            >
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-12">
        <section className="text-center space-y-4 py-8">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            E-Commerce Berskala Produksi
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Belanja Nyaman, Aman, & Cepat di <span className="text-indigo-400">Okle Shop</span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base">
            Dibangun dengan arsitektur modern: Golang Fiber di backend dan React Vite di frontend dengan proteksi JWT Dual-Token.
          </p>
        </section>

        {/* 3. Kartu Menu / Fitur */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">Status Akun</h2>
            <p className="text-xs text-slate-400">
              {isAuthenticated && user
                ? `Login sebagai ${user.name} (${user.email}) dengan hak akses ${user.role}.`
                : 'Anda saat ini berada dalam sesi Tamu (Guest). Masuk untuk mulai berbelanja.'}
            </p>
          </div>

          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">Buku Alamat</h2>
            <p className="text-xs text-slate-400">
              Kelola alamat pengiriman pesanan Anda dengan sistem pemilihan alamat utama otomatis (Hari 16).
            </p>
          </div>

          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">Keamanan Terverifikasi</h2>
            <p className="text-xs text-slate-400">
              Didukung Axios Interceptors dengan Silent Token Refresh & rotasi sesi otomatis (Hari 17 & 18).
            </p>
          </div>
        </section>
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        &copy; 2026 Okle Shop. Dibangun secara bertahap selama 100 Hari.
      </footer>
    </div>
  );
}