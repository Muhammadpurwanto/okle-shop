// Kunci penyimpanan di LocalStorage
const ACCESS_TOKEN_KEY = 'okle_access_token';
const REFRESH_TOKEN_KEY = 'okle_refresh_token';

/**
 * Mengambil Access Token dari storage
 */
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Mengambil Refresh Token dari storage
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Menyimpan pasangan Access Token dan Refresh Token
 */
export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

/**
 * Menghapus semua token saat logout
 */
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Memeriksa apakah user memiliki access token
 */
export const hasAccessToken = () => {
  return Boolean(getAccessToken());
};