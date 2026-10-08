import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../utils/token';

// 1. Ambil Base URL dari .env (Fail-Safe jika env belum diset)
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 2. Buat instance Axios khusus aplikasi Okle Shop
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Batas waktu 10 detik
});

// Variabel untuk mengelola antrean request saat sedang silent refresh (Mutex Pattern)
let isRefreshing = false;
let failedQueue = [];

// Fungsi untuk memproses seluruh antrean setelah refresh token selesai
const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

// =========================================================================
// 3. REQUEST INTERCEPTOR: Otomatis sisipkan Authorization Bearer Token
// =========================================================================
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =========================================================================
// 4. RESPONSE INTERCEPTOR: Tangani 401 dan Silent Refresh Otomatis
// =========================================================================
apiClient.interceptors.response.use(
  (response) => {
    // Jika respons sukses (2xx), langsung kembalikan data
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Jika error bukan dari server (misal network error)
    if (!error.response) {
      return Promise.reject(error);
    }

    // Periksa apakah error adalah 401 (Unauthorized) dan bukan request login/refresh itu sendiri
    const isUnauthorized = error.response.status === 401;
    const isAuthRoute = originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh');

    if (isUnauthorized && !isAuthRoute && !originalRequest._retry) {
      // Jika saat ini sedang ada proses refresh yang berjalan, masukkan request ini ke antrean!
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Tandai request ini sudah pernah dicoba ulang agar tidak looping tak terbatas
      originalRequest._retry = true;
      isRefreshing = true;

      const currentRefreshToken = getRefreshToken();

      // Jika tidak ada Refresh Token di storage, langsung logout
      if (!currentRefreshToken) {
        clearTokens();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        // Panggil endpoint refresh menggunakan axios biasa (bukan apiClient agar tidak kena interceptor)
        const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: currentRefreshToken,
        });

        const { access_token, refresh_token } = refreshResponse.data.data;

        // Simpan pasangan token yang baru (Token Rotation)
        setTokens(access_token, refresh_token);

        // Pasang token baru di request yang pertama kali gagal
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Jalankan semua request lain yang sempat mengantre
        processQueue(null, access_token);

        // Ulangi request original
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Jika refresh token juga ditolak (misal sudah lewat 7 hari atau dibatalkan)
        processQueue(refreshError, null);
        clearTokens();

        // Redirect pengguna ke halaman login jika di lingkungan browser
        if (typeof window !== 'undefined') {
          console.warn('Sesi login telah berakhir. Silakan login kembali.');
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;