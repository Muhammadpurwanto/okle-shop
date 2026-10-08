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
       * Memperbarui data profil di server & sinkronkan state global
       */
      updateProfile: async (name, phone) => {
        set({ isLoading: true, error: null });
        try {
          const updatedUser = await authService.updateProfile(name, phone);
          set((state) => ({
            user: { ...state.user, ...updatedUser },
            isLoading: false,
          }));
          return updatedUser;
        } catch (err) {
          const errMsg = err.response?.data?.message || err.message || 'Gagal memperbarui profil';
          set({ isLoading: false, error: errMsg });
          throw new Error(errMsg);
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