import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * ProtectedRoute membatasi akses halaman berdasarkan status login dan role pengguna.
 * @param {Array<string>} allowedRoles - Daftar role yang diizinkan (misal: ['ADMIN'] atau ['CUSTOMER', 'ADMIN'])
 */
export default function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // 1. Tampilkan loading spinner jika status auth masih di-rehydrate
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-mono">Memverifikasi hak akses...</p>
        </div>
      </div>
    );
  }

  // 2. KONDISI 401 UNAUTHORIZED: Pengguna belum login
  // Alihkan ke /login dan titipkan lokasi asal agar bisa kembali setelah login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. KONDISI 403 FORBIDDEN: Pengguna sudah login, tetapi rolenya tidak diizinkan
  // Contoh: Pengguna dengan role 'CUSTOMER' mencoba membuka rute 'ADMIN'
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  // 4. AKSES DIIZINKAN: Render halaman anak (Outlet)
  return <Outlet />;
}