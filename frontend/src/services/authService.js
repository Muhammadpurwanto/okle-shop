import apiClient from './api';
import { setTokens, clearTokens } from '../utils/token';

export const authService = {
  /**
   * Login user dan simpan token otomatis
   */
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    const { access_token, refresh_token, user } = response.data.data;

    // Simpan token ke LocalStorage
    setTokens(access_token, refresh_token);

    return { user, accessToken: access_token, refreshToken: refresh_token };
  },

  /**
   * Registrasi user baru
   */
  async register(name, email, password, phone) {
    const response = await apiClient.post('/auth/register', {
      name,
      email,
      password,
      phone,
    });
    return response.data;
  },

  /**
   * Mengambil data profil user yang sedang login
   */
  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },

  /**
   * Logout user dari server dan hapus token lokal
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

    /**
   * Meminta link/token pemulihan kata sandi
   */
  async forgotPassword(email) {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Mengubah kata sandi dengan token pemulihan
   */
  async resetPassword(token, newPassword, confirmPassword) {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  },

  /**
   * Memperbarui nama dan nomor telepon profil user
   */
  async updateProfile(name, phone) {
    const response = await apiClient.put('/auth/profile', { name, phone });
    return response.data.data;
  },

  /**
   * Mengganti kata sandi dengan memvalidasi kata sandi lama
   */
  async changePassword(oldPassword, newPassword, confirmNewPassword) {
    const response = await apiClient.put('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    });
    return response.data;
  },
};

