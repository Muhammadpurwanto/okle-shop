import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShieldCheck, Package, ShoppingCart, DollarSign, Users, ArrowLeft, LogOut } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Topbar Admin */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-100">Okle Shop - Panel Admin</h1>
            <p className="text-xs text-slate-400">Area Terproteksi Khusus Role ADMINISTRATOR</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-200">{user?.name} ({user?.email})</p>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
              SUPERADMIN
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-600/30 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </header>

      {/* Konten Dashboard */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Ringkasan Operasional Toko</h2>
            <p className="text-xs text-slate-400 mt-1">Data penjualan dan manajemen inventaris produk</p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Lihat Tampilan Pembeli
          </Link>
        </div>

        {/* Kartu Metrik Toko */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-400">Total Pendapatan</p>
            <p className="text-xl font-bold text-white">Rp 50.000.000</p>
          </div>

          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-400">Pesanan Masuk</p>
            <p className="text-xl font-bold text-white">128 Pesanan</p>
          </div>

          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-400">Katalog Produk</p>
            <p className="text-xl font-bold text-white">64 Item Aktif</p>
          </div>

          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-400">Pelanggan Terdaftar</p>
            <p className="text-xl font-bold text-white">1.042 Member</p>
          </div>
        </div>
      </main>
    </div>
  );
}