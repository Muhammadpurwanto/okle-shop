# Dokumen Setup State Management Global dengan Zustand (Hari 18)
**Aplikasi:** Okle Shop (E-Commerce Platform)  
**Fase:** FASE 2 - Autentikasi, Manajemen Pengguna & RBAC (Hari 11 – 25)  
**Teknologi:** React 18/19, Zustand v5, Persist Middleware, Global Store, Reaktif State Management  
**Status:** Disetujui (Hari 18)  
**Terakhir Diperbarui:** 2026-10-04  

---

## 1. Konsep & Arsitektur State Management di React

### 1.1 Local State vs Global State
* **Local State (`useState`):** Hanya hidup di dalam satu komponen saja. Jika komponen lain (misalnya Navbar di pojok atas) ingin tahu apakah pengguna sudah login atau siapa namanya, data harus dioper lewat *props* secara berantai (*Prop Drilling*). Ini membuat kode berantakan dan sulit dirawat.
* **Global State (Store):** Data disimpan di satu wadah terpusat di luar pohon komponen. Komponen mana pun (Navbar, Sidebar, Halaman Keranjang, Halaman Profil, Tombol Beli) dapat langsung membaca atau mengubah data tersebut secara independen tanpa perlu oper-operan props.

```mermaid
graph TD
    subgraph Global Store [Zustand: useAuthStore]
        User["user: { id, name, role }"]
        Auth["isAuthenticated: true/false"]
        Actions["login(), logout(), fetchProfile()"]
    end

    Navbar["Navbar (Komponen A)"] -->|Baca user & role| Global Store
    ProfileCard["Profile Card (Komponen B)"] -->|Baca data profil| Global Store
    CartBadge["Keranjang (Komponen C)"] -->|Cek status login| Global Store
    LoginForm["Form Login (Komponen D)"] -->|Panggil action login()| Global Store
```

---

### 1.2 Mengapa Kita Memilih Zustand?

| Kriteria | React Context API | Redux Toolkit | **Zustand (Pilihan Kita)** |
| :--- | :--- | :--- | :--- |
| **Ukuran Bundle** | Bawaan React | Berat (~15 KB) | **Sangat Ringan (~1.2 KB)** |
| **Boilerplate** | Sedang | Sangat Banyak (Reducer, Slice, Action) | **Hampir Nol (Sangat Simpel & Clean)** |
| **Performa Re-render** | Semua anak komponen ikut re-render | Baik (via Selector) | **Sangat Cepat & Presisi (Atomic Selector)** |
| **Wrapper `<Provider>`** | Wajib membungkus `<App />` | Wajib membungkus `<Provider>` | **Tidak Butuh Provider Sama Sekali!** |
| **Auto-Save LocalStorage** | Perlu koding manual | Butuh Redux-Persist | **Bawaan Resmi (`persist` middleware)** |

---

## 2. Struktur File Hari 18 di `frontend/`

```text
frontend/
├── package.json               # Tambah dependensi "zustand"
└── src/
    ├── store/
    │   └── authStore.js       # Store Zustand untuk status login & profil user
    └── App.jsx                # Komponen pengujian reaktivitas antar-komponen
```

---

## 3. Langkah Implementasi Kode

---

### Langkah 1: Instalasi Library Zustand
Buka terminal Anda di direktori `frontend` dan jalankan perintah:

```powershell
cd C:\Development\Golang\okle-shop\frontend
npm install zustand
```

---

### Langkah 2: Buat Auth Store (`frontend/src/store/authStore.js`)
Buat folder baru bernama `store` di dalam `frontend/src/`, lalu buat file `authStore.js`:

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/authService';
import { clearTokens, hasAccessToken } from '../utils/token';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // =========================================================================
      // STATE (Data Reaktif)
      // =========================================================================
      user: null,             // Objek profil: { id, name, email, phone, role }
      isAuthenticated: false, // Flag status apakah pengguna sedang login
      isLoading: false,       // Loading spinner saat proses API
      error: null,            // Pesan error jika gagal

      // =========================================================================
      // ACTIONS (Fungsi Pengubah State)
      // =========================================================================

      /**
       * Login user, simpan token, dan perbarui state global
       */
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.login(email, password);
          set({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return result.user;
        } catch (err) {
          const errMsg = err.response?.data?.message || err.message || 'Gagal login';
          set({ isLoading: false, error: errMsg });
          throw new Error(errMsg);
        }
      },

      /**
       * Registrasi user baru
       */
      register: async (name, email, password, phone) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.register(name, email, password, phone);
          set({ isLoading: false, error: null });
          return res;
        } catch (err) {
          const errMsg = err.response?.data?.message || err.message || 'Gagal registrasi';
          set({ isLoading: false, error: errMsg });
          throw new Error(errMsg);
        }
      },

      /**
       * Logout user, hapus token di storage, dan reset state ke awal
       */
      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch (err) {
          console.warn('Logout error:', err.message);
        } finally {
          clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      /**
       * Mengambil ulang profil user dari backend (/auth/me)
       */
      fetchProfile: async () => {
        if (!hasAccessToken()) {
          set({ user: null, isAuthenticated: false });
          return null;
        }

        set({ isLoading: true, error: null });
        try {
          const profile = await authService.getMe();
          set({
            user: profile,
            isAuthenticated: true,
            isLoading: false,
          });
          return profile;
        } catch (err) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: err.response?.data?.message || err.message,
          });
          throw err;
        }
      },

      /**
       * Reset pesan error
       */
      clearError: () => set({ error: null }),
    }),
    {
      name: 'okle_auth_storage', // Nama kunci di LocalStorage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }), // Hanya simpan user & isAuthenticated ke storage (isLoading & error tidak perlu)
    }
  )
);
```

---

### Langkah 3: Update `frontend/src/App.jsx` untuk Menguji Reaktivitas Zustand
Buka [frontend/src/App.jsx](file:///c:/Development/Golang/okle-shop/frontend/src/App.jsx) dan perbarui kodenya. Di sini kita membuat dua komponen terpisah:
1. **`<NavbarDemo />`**: Komponen header atas yang langsung membaca `useAuthStore` untuk menampilkan nama user dan badge Role.
2. **`<MainContent />`**: Komponen isi yang memicu login, fetch profile, dan logout.

Perhatikan bahwa **tidak ada satu pun props yang dioper-oper antar-komponen**, namun ketika login berhasil, Navbar dan Konten langsung ter-update secara instan!

```jsx
import { useState } from 'react';
import { useAuthStore } from './store/authStore';
import apiClient from './services/api';
import { setTokens, getRefreshToken } from './utils/token';
import { ShieldCheck, LogIn, LogOut, User, RefreshCw, Database, Sparkles, CheckCircle2, UserCheck } from 'lucide-react';

// =========================================================================
// 1. KOMPONEN NAVBAR (Membaca State Global Mandiri Tanpa Props!)
// =========================================================================
function NavbarDemo() {
  const { user, isAuthenticated, logout, isLoading } = useAuthStore();

  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 rounded-2xl flex justify-between items-center shadow-lg">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-7 h-7 text-indigo-400" />
        <span className="font-bold text-lg text-slate-100">Okle Shop</span>
        <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
          Zustand Store
        </span>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-200">{user.name || user.email}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                user.role === 'ADMIN'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              disabled={isLoading}
              className="p-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-lg text-xs font-medium transition flex items-center gap-1 border border-rose-600/30"
            >
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-slate-500 animate-pulse"></span>
            Mode Tamu (Guest)
          </div>
        )}
      </div>
    </nav>
  );
}

// =========================================================================
// 2. KOMPONEN UTAMA (Playground Pengujian State Zustand)
// =========================================================================
export default function App() {
  const { user, isAuthenticated, isLoading, error, login, logout, fetchProfile, clearError } = useAuthStore();

  const [email, setEmail] = useState('customer@gmail.com');
  const [password, setPassword] = useState('Password123!');
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [{ id: Date.now(), time: timestamp, message, type }, ...prev]);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();
    try {
      const loggedUser = await login(email, password);
      addLog(`🎉 Login Berhasil via Zustand! Nama: ${loggedUser.name} (${loggedUser.role})`, 'success');
    } catch (err) {
      addLog(`❌ Gagal Login: ${err.message}`, 'error');
    }
  };

  const handleFetchProfile = async () => {
    try {
      const res = await fetchProfile();
      addLog(`👤 Sinkronisasi Profil Berhasil: ID ${res.user_id || res.id} (${res.email})`, 'success');
    } catch (err) {
      addLog(`❌ Gagal Ambil Profil: ${err.message}`, 'error');
    }
  };

  const handleCheckHealth = async () => {
    try {
      const res = await apiClient.get('/health');
      addLog(`✅ Server OK: ${res.data.message}`, 'success');
    } catch (err) {
      addLog(`❌ Server Error: ${err.message}`, 'error');
    }
  };

  const handleSimulateExpired = () => {
    setTokens('token_palsu_basi_123', getRefreshToken());
    addLog('⚠️ Token dirusak! Coba klik tombol "Sinkronkan Profil" untuk membuktikan Interceptor + Zustand tetap sinkron.', 'warning');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navbar yang membaca Global State */}
        <NavbarDemo />

        {/* Banner Info */}
        <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-800 p-6 rounded-2xl border border-indigo-700/30 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Hari 18: Pengujian State Management Global (Zustand)
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Data login di-maintain secara otomatis oleh Zustand & persist middleware di LocalStorage.
            </p>
          </div>
          <button
            onClick={handleCheckHealth}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" /> Ping API
          </button>
        </div>

        {/* Konten Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Kolom Kiri: Form & Aksi */}
          <div className="space-y-6">
            
            {/* Form Login Zustand */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-md">
              <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <LogIn className="w-4 h-4 text-indigo-400" /> Form Login (Action Zustand)
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email Akun</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50"
                  >
                    {isLoading ? 'Memproses...' : 'Login Sekarang'}
                  </button>
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={logout}
                      className="px-4 py-2 bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 rounded-lg text-sm font-medium transition"
                    >
                      Logout
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Aksi Trigger Zustand */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-md space-y-3">
              <h2 className="text-base font-semibold text-slate-200">Aksi Store Zustand</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleFetchProfile}
                  disabled={!isAuthenticated || isLoading}
                  className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition disabled:opacity-40"
                >
                  <UserCheck className="w-4 h-4 text-sky-400" />
                  Sinkronkan Profil
                </button>
                <button
                  onClick={handleSimulateExpired}
                  disabled={!isAuthenticated}
                  className="p-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition disabled:opacity-40"
                >
                  <RefreshCw className="w-4 h-4" />
                  Simulasi Token Expired
                </button>
              </div>
            </div>

          </div>

          {/* Kolom Kanan: Tampilan Live State & Activity Log */}
          <div className="space-y-6">
            
            {/* Tampilan Live State Zustand */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-md">
              <h2 className="text-base font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Live Global State (`useAuthStore`)
              </h2>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
                <p>
                  <span className="text-slate-500">isAuthenticated:</span>{' '}
                  <span className={isAuthenticated ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                    {String(isAuthenticated)}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">isLoading:</span>{' '}
                  <span className="text-sky-300">{String(isLoading)}</span>
                </p>
                <div>
                  <span className="text-slate-500">user:</span>
                  <pre className="text-indigo-300 mt-1 overflow-x-auto">
                    {user ? JSON.stringify(user, null, 2) : 'null (Belum Login)'}
                  </pre>
                </div>
              </div>
            </div>

            {/* Log Aktivitas */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-md">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-semibold text-slate-200">Log Aktivitas</h2>
                <button onClick={() => setLogs([])} className="text-xs text-slate-400 hover:text-slate-200">
                  Bersihkan
                </button>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 h-48 overflow-y-auto space-y-2 font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-slate-600 text-center py-6">Belum ada aktivitas.</p>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2 rounded border flex items-start gap-2 ${
                        log.type === 'error'
                          ? 'bg-rose-950/30 border-rose-800 text-rose-300'
                          : log.type === 'success'
                          ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                          : log.type === 'warning'
                          ? 'bg-amber-950/30 border-amber-800 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="text-slate-500 text-[10px]">[{log.time}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
```

---

## 4. Panduan Menjalankan & Menguji State Zustand

### 1. Jalankan Backend Go (Terminal 1)
```powershell
cd C:\Development\Golang\okle-shop\backend
go run cmd/api/main.go
```

### 2. Jalankan Frontend React (Terminal 2)
```powershell
cd C:\Development\Golang\okle-shop\frontend
npm run dev
```
Buka browser di `http://localhost:5173/`.

### 3. Skenario Uji Coba:
1. **Uji Reaktivitas Multi-Komponen:**
   - Klik **"Login Sekarang"**.
   - Perhatikan komponen **Navbar di atas** seketika menampilkan nama user dan badge Role (`CUSTOMER` / `ADMIN`), dan kotak **Live Global State** langsung terisi. Ini membuktikan kedua komponen berbagi data yang sama tanpa passing props!
2. **Uji Persistensi (F5 / Refresh Browser):**
   - Tekan tombol **F5** pada keyboard Anda untuk merefresh halaman browser.
   - **Hasil:** Pengguna **tetap login!** Berkat middleware `persist`, data pengguna tidak hilang saat browser dimuat ulang (*no flash of unauthenticated state*).
3. **Uji Logout Global:**
   - Klik tombol **"Keluar"** di Navbar atas.
   - Seketika seluruh komponen di halaman kembali ke mode **Tamu (Guest)** secara tersinkronisasi.

---

## 5. Checklist Verifikasi Hari 18

| Kriteria Uji | Komponen | Status |
| :--- | :--- | :---: |
| Library `zustand` terinstal di `package.json` | `frontend/package.json` | [x] |
| Auth Store dibuat dengan state `user`, `isAuthenticated`, dan action `login`, `logout` | `frontend/src/store/authStore.js` | [x] |
| Persistensi state ke LocalStorage aktif via middleware `persist` | `okle_auth_storage` di LocalStorage | [x] |
| Reaktivitas antar-komponen tanpa prop drilling terbukti | `<NavbarDemo />` dan `<MainContent />` di `App.jsx` | [x] |
| Data user bertahan saat browser di-refresh (F5) | Browser reload test | [x] |

---
*Langkah selanjutnya (Hari 19): Halaman Register & Login interaktif dengan navigasi React Router DOM dan validasi form modern.*
