import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { addressService } from '../services/addressService';
import { 
  MapPin, Plus, Edit2, Trash2, CheckCircle2, 
  AlertCircle, ArrowLeft, Phone, User, X, Check, Loader2 
} from 'lucide-react';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State Modal Form (Tambah / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // State Form Fields
  const [formData, setFormData] = useState({
    recipient_name: '',
    phone_number: '',
    street_address: '',
    city_name: '',
    province_name: '',
    postal_code: '',
    is_default: false,
  });

  // State Modal Konfirmasi Hapus
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Ambil data alamat saat komponen dimuat
  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Gagal memuat buku alamat');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const showSuccessNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Buka Modal Tambah Alamat
  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedAddressId(null);
    setFormError('');
    setFormData({
      recipient_name: '',
      phone_number: '',
      street_address: '',
      city_name: '',
      province_name: '',
      postal_code: '',
      // Jika belum ada alamat sama sekali, otomatis default = true
      is_default: addresses.length === 0,
    });
    setIsModalOpen(true);
  };

  // Buka Modal Ubah Alamat
  const handleOpenEditModal = (addr) => {
    setModalMode('edit');
    setSelectedAddressId(addr.id);
    setFormError('');
    setFormData({
      recipient_name: addr.recipient_name,
      phone_number: addr.phone_number,
      street_address: addr.street_address,
      city_name: addr.city_name,
      province_name: addr.province_name,
      postal_code: addr.postal_code,
      is_default: addr.is_default,
    });
    setIsModalOpen(true);
  };

  // Handler Submit Form Tambah / Ubah
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.recipient_name.trim() || formData.recipient_name.length < 3) {
      setFormError('Nama penerima minimal 3 karakter');
      return;
    }
    if (!formData.phone_number.trim() || !/^[0-9]{10,15}$/.test(formData.phone_number)) {
      setFormError('Nomor telepon harus berupa 10 - 15 digit angka');
      return;
    }
    if (!formData.street_address.trim() || formData.street_address.length < 5) {
      setFormError('Alamat lengkap minimal 5 karakter');
      return;
    }
    if (!formData.city_name.trim()) {
      setFormError('Kota/Kabupaten wajib diisi');
      return;
    }
    if (!formData.province_name.trim()) {
      setFormError('Provinsi wajib diisi');
      return;
    }
    if (!formData.postal_code.trim() || formData.postal_code.length < 5) {
      setFormError('Kode pos minimal 5 karakter');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');

      if (modalMode === 'add') {
        await addressService.createAddress(formData);
        showSuccessNotification('Alamat baru berhasil ditambahkan!');
      } else {
        await addressService.updateAddress(selectedAddressId, formData);
        showSuccessNotification('Alamat berhasil diperbarui!');
      }

      setIsModalOpen(false);
      await fetchAddresses();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Gagal menyimpan alamat');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handler Jadikan Alamat Utama
  const handleSetDefault = async (id) => {
    try {
      await addressService.setDefaultAddress(id);
      showSuccessNotification('Alamat utama berhasil diperbarui!');
      await fetchAddresses();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Gagal menetapkan alamat utama');
    }
  };

  // Buka Modal Konfirmasi Hapus
  const handleOpenDeleteModal = (addr) => {
    setAddressToDelete(addr);
    setIsDeleteModalOpen(true);
  };

  // Eksekusi Hapus Alamat
  const handleConfirmDelete = async () => {
    if (!addressToDelete) return;
    try {
      setDeleteSubmitting(true);
      await addressService.deleteAddress(addressToDelete.id);
      setIsDeleteModalOpen(false);
      setAddressToDelete(null);
      showSuccessNotification('Alamat berhasil dihapus!');
      await fetchAddresses();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Gagal menghapus alamat');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Bar Navigasi Atas */}
        <div className="flex items-center justify-between">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Profil
          </Link>
          <button
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" /> Tambah Alamat Baru
          </button>
        </div>

        {/* Judul & Deskripsi Halaman */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700/80 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
              <MapPin className="w-6 h-6 text-indigo-400" /> Buku Alamat Pengiriman
            </h1>
            <p className="text-xs text-slate-400">
              Kelola alamat tujuan pengiriman untuk mempermudah proses checkout pesanan belanja Anda
            </p>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-300 font-mono self-start sm:self-auto">
            Total: {addresses.length} Alamat
          </span>
        </div>

        {/* Notifikasi Banner Sukses */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Notifikasi Banner Error */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((n) => (
              <div key={n} className="bg-slate-800 rounded-2xl border border-slate-700/80 p-6 animate-pulse space-y-4">
                <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                <div className="h-3 bg-slate-700 rounded w-full"></div>
                <div className="h-8 bg-slate-700 rounded-xl w-1/2"></div>
              </div>
            ))}
          </div>
        ) : addresses.length === 0 ? (
          /* Tampilan Kosong (Empty State) */
          <div className="bg-slate-800 rounded-2xl border border-dashed border-slate-700 p-12 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <MapPin className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Belum Ada Alamat Tersimpan</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Tambahkan alamat rumah, kantor, atau tujuan pengiriman pertama Anda untuk mulai berbelanja di Okle Shop.
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl text-xs inline-flex items-center gap-2 transition shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" /> Tambah Alamat Pertama
            </button>
          </div>
        ) : (
          /* Grid Kartu Alamat */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`rounded-2xl p-6 transition flex flex-col justify-between relative shadow-xl ${
                  addr.is_default
                    ? 'bg-slate-800 border-2 border-indigo-500/80 shadow-indigo-500/10'
                    : 'bg-slate-800 border border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {/* Header Kartu: Nama & Badge Alamat Utama */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white">{addr.recipient_name}</span>
                        {addr.is_default && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Utama
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> {addr.phone_number}
                      </p>
                    </div>
                  </div>

                  {/* Isi Alamat */}
                  <div className="space-y-1.5 py-2 text-xs border-t border-slate-700/60 mt-2">
                    <p className="text-slate-200 leading-relaxed font-medium">
                      {addr.street_address}
                    </p>
                    <p className="text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      {addr.city_name}, {addr.province_name} {addr.postal_code}
                    </p>
                  </div>
                </div>

                {/* Footer Kartu: Tombol Aksi */}
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-700/60 text-xs">
                  <div>
                    {!addr.is_default ? (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Jadikan Utama
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">Alamat default saat checkout</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleOpenEditModal(addr)}
                      className="text-slate-300 hover:text-white transition flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Ubah
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(addr)}
                      className="text-rose-400 hover:text-rose-300 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* ============================================================= */}
      {/* MODAL FORM: TAMBAH / UBAH ALAMAT                             */}
      {/* ============================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-fadeIn">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/80">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-400" />
                {modalMode === 'add' ? 'Tambah Alamat Pengiriman' : 'Ubah Alamat Pengiriman'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Form Banner */}
            {formError && (
              <div className="mx-6 mt-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Body Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {/* Nama Penerima */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Nama Penerima</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                    required
                  />
                </div>
              </div>

              {/* Nomor Handphone */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Nomor Handphone / WhatsApp</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="081234567890"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                    required
                  />
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Alamat Lengkap</label>
                <textarea
                  value={formData.street_address}
                  onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                  placeholder="Nama jalan, nomor rumah, RT/RW, blok, atau patokan terdekat"
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                  required
                />
              </div>

              {/* Kota & Provinsi (2 Kolom) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Kota / Kabupaten</label>
                  <input
                    type="text"
                    value={formData.city_name}
                    onChange={(e) => setFormData({ ...formData, city_name: e.target.value })}
                    placeholder="Contoh: Jakarta Selatan"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Provinsi</label>
                  <input
                    type="text"
                    value={formData.province_name}
                    onChange={(e) => setFormData({ ...formData, province_name: e.target.value })}
                    placeholder="Contoh: DKI Jakarta"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                    required
                  />
                </div>
              </div>

              {/* Kode Pos */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Kode Pos</label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="Contoh: 12430"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                  required
                />
              </div>

              {/* Checkbox Jadikan Alamat Utama */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="is_default_checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500"
                />
                <label htmlFor="is_default_checkbox" className="text-xs text-slate-300 cursor-pointer">
                  Jadikan sebagai alamat utama
                </label>
              </div>

              {/* Tombol Aksi Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Alamat'
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL KONFIRMASI HAPUS ALAMAT                                */}
      {/* ============================================================= */}
      {isDeleteModalOpen && addressToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Hapus Alamat?</h3>
              <p className="text-xs text-slate-400">
                Apakah Anda yakin ingin menghapus alamat untuk penerima{' '}
                <span className="font-semibold text-slate-200">"{addressToDelete.recipient_name}"</span>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-500 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {deleteSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  'Ya, Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}