import apiClient from './api';

export const addressService = {
  /**
   * Mengambil semua daftar alamat pengiriman milik pengguna login
   */
  async getAddresses() {
    const response = await apiClient.get('/addresses');
    return response.data.data || [];
  },

  /**
   * Mengambil detail satu alamat berdasarkan ID
   */
  async getAddressById(id) {
    const response = await apiClient.get(`/addresses/${id}`);
    return response.data.data;
  },

  /**
   * Menambahkan alamat pengiriman baru
   */
  async createAddress(addressData) {
    const response = await apiClient.post('/addresses', addressData);
    return response.data.data;
  },

  /**
   * Memperbarui alamat pengiriman yang sudah ada
   */
  async updateAddress(id, addressData) {
    const response = await apiClient.put(`/addresses/${id}`, addressData);
    return response.data.data;
  },

  /**
   * Menghapus alamat pengiriman berdasarkan ID
   */
  async deleteAddress(id) {
    const response = await apiClient.delete(`/addresses/${id}`);
    return response.data;
  },

  /**
   * Menetapkan suatu alamat menjadi Alamat Utama (is_default = true)
   */
  async setDefaultAddress(id) {
    const response = await apiClient.patch(`/addresses/${id}/default`);
    return response.data;
  },
};