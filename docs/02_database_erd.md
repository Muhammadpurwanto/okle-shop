# Dokumen Perancangan Database & ERD (Hari 2)
**Aplikasi:** Okle Shop (E-Commerce Platform)  
**Database Engine:** MySQL 8.0+ (InnoDB)  
**ORM Support:** GORM v1.25+  
**Status:** Disetujui (Hari 2 Selesai)  
**Terakhir Diperbarui:** 2026-09-27  

---

## 1. Visualisasi Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ ADDRESSES : "has many"
    USERS ||--o| CARTS : "has one"
    USERS ||--o{ ORDERS : "places"
    
    CATEGORIES ||--o{ CATEGORIES : "sub-category of (parent_id)"
    CATEGORIES ||--o{ PRODUCTS : "contains"
    
    PRODUCTS ||--o{ PRODUCT_IMAGES : "has many (S3 URLs)"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "has many (1-level)"
    
    CARTS ||--o{ CART_ITEMS : "contains"
    PRODUCT_VARIANTS ||--o{ CART_ITEMS : "referenced in"
    
    VOUCHERS ||--o{ ORDERS : "applied to"
    
    ORDERS ||--|{ ORDER_ITEMS : "consists of"
    ORDERS ||--o| PAYMENTS : "has one"
    PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : "purchased as"

    USERS {
        bigint id PK
        string name "VARCHAR(100)"
        string email UK "VARCHAR(150)"
        string password_hash "VARCHAR(255)"
        string phone "VARCHAR(20)"
        enum role "ENUM('CUSTOMER', 'ADMIN')"
        datetime created_at
        datetime updated_at
        datetime deleted_at "Soft Delete"
    }

    ADDRESSES {
        bigint id PK
        bigint user_id FK
        string recipient_name "VARCHAR(100)"
        string phone_number "VARCHAR(20)"
        text street_address "TEXT"
        string city_name "VARCHAR(100)"
        string province_name "VARCHAR(100)"
        string postal_code "VARCHAR(10)"
        boolean is_default "TINYINT(1)"
        datetime created_at
        datetime updated_at
    }

    CATEGORIES {
        bigint id PK
        bigint parent_id FK "nullable"
        string name "VARCHAR(100)"
        string slug UK "VARCHAR(120)"
        string icon_url "VARCHAR(255) S3 URL"
        datetime created_at
        datetime updated_at
        datetime deleted_at "Soft Delete"
    }

    PRODUCTS {
        bigint id PK
        bigint category_id FK
        string name "VARCHAR(200)"
        string slug UK "VARCHAR(220)"
        text description "TEXT"
        boolean is_active "TINYINT(1) DEFAULT 1"
        datetime created_at
        datetime updated_at
        datetime deleted_at "Soft Delete"
    }

    PRODUCT_IMAGES {
        bigint id PK
        bigint product_id FK
        string image_url "VARCHAR(255) S3 URL"
        boolean is_primary "TINYINT(1) DEFAULT 0"
        datetime created_at
    }

    PRODUCT_VARIANTS {
        bigint id PK
        bigint product_id FK
        string variant_name "VARCHAR(50) misal: Merah / XL"
        string sku UK "VARCHAR(50)"
        decimal price "DECIMAL(12,2)"
        int stock "INT DEFAULT 0"
        int weight_grams "INT DEFAULT 0"
        datetime created_at
        datetime updated_at
        datetime deleted_at "Soft Delete"
    }

    CARTS {
        bigint id PK
        bigint user_id FK "UNIQUE"
        datetime created_at
        datetime updated_at
    }

    CART_ITEMS {
        bigint id PK
        bigint cart_id FK
        bigint product_variant_id FK
        int quantity "INT DEFAULT 1"
        datetime created_at
        datetime updated_at
    }

    VOUCHERS {
        bigint id PK
        string code UK "VARCHAR(50)"
        enum discount_type "ENUM('PERCENTAGE', 'FIXED')"
        decimal discount_amount "DECIMAL(12,2)"
        decimal min_purchase "DECIMAL(12,2) DEFAULT 0"
        decimal max_discount "DECIMAL(12,2) DEFAULT 0"
        int quota "INT DEFAULT 0"
        int used_count "INT DEFAULT 0"
        datetime start_date
        datetime end_date
        boolean is_active "TINYINT(1) DEFAULT 1"
        datetime created_at
        datetime updated_at
    }

    ORDERS {
        bigint id PK
        string order_number UK "VARCHAR(50) INV-YYYYMMDD-XXXX"
        bigint user_id FK
        bigint voucher_id FK "nullable"
        text shipping_address_snapshot "TEXT / JSON Alamat"
        string courier_name "VARCHAR(50) misal: JNE"
        string courier_service "VARCHAR(50) misal: REG"
        decimal total_product_price "DECIMAL(12,2)"
        decimal total_shipping_cost "DECIMAL(12,2)"
        decimal discount_amount "DECIMAL(12,2) DEFAULT 0"
        decimal grand_total "DECIMAL(12,2)"
        enum status "ENUM('UNPAID','PAID','PROCESSING','SHIPPED','COMPLETED','CANCELLED')"
        string tracking_number "VARCHAR(100) Nomor Resi"
        text customer_notes "TEXT"
        datetime expired_at
        datetime created_at
        datetime updated_at
    }

    ORDER_ITEMS {
        bigint id PK
        bigint order_id FK
        bigint product_variant_id FK "nullable on variant delete"
        string product_name_snapshot "VARCHAR(200)"
        string variant_name_snapshot "VARCHAR(50)"
        decimal price_snapshot "DECIMAL(12,2)"
        int quantity "INT"
        int weight_grams_snapshot "INT"
        decimal subtotal "DECIMAL(12,2)"
        datetime created_at
    }

    PAYMENTS {
        bigint id PK
        bigint order_id FK "UNIQUE"
        string payment_method "VARCHAR(50) misal: VA_BCA, QRIS"
        string gateway_provider "VARCHAR(50) default: MIDTRANS"
        string transaction_id UK "VARCHAR(100) ID dari Midtrans"
        enum status "ENUM('PENDING','SETTLEMENT','EXPIRE','FAILURE')"
        string snap_token "VARCHAR(255)"
        string payment_url "VARCHAR(255)"
        datetime paid_at
        text raw_response "TEXT JSON Webhook Response"
        datetime created_at
        datetime updated_at
    }
```

---

## 2. Rincian Spesifikasi Tabel & Kamus Data

### 2.1 Modul Pengguna & Alamat
1. **`users`**
   - Menyimpan kredensial otentikasi dan profil dasar.
   - Kolom `role`: `CUSTOMER` untuk pembeli umum, `ADMIN` untuk pengelola toko.
   - Kolom `deleted_at`: Memanfaatkan fitur GORM soft-delete agar akun yang ditutup tidak merusak riwayat transaksi terdahulu.
2. **`addresses`**
   - Menyimpan daftar alamat tujuan pengiriman milik user.
   - 1 user dapat memiliki banyak alamat, dengan flag `is_default = 1` sebagai alamat pengiriman bawaan.

### 2.2 Modul Katalog Produk (1-Level Variant & AWS S3)
3. **`categories`**
   - Mendukung hierarki bertingkat sederhana lewat `parent_id` (opsional / *nullable*).
   - Ikon/gambar kategori disimpan dalam bentuk URL AWS S3 (`icon_url`).
4. **`products`**
   - Entitas induk produk yang memegang nama produk, slug unik (SEO friendly), dan deskripsi umum.
5. **`product_images`**
   - Relasi *1-to-many* dari produk. Menyimpan URL publik AWS S3.
   - Kolom `is_primary = 1` menandai gambar utama yang tampil pada kartu produk di halaman katalog/home.
6. **`product_variants`**
   - **Varian 1-Level:** Setiap entitas memiliki `variant_name` (contoh: "Merah", "Hitam", "Size L", dll).
   - Memegang inventori riil: `stock`, `price`, dan `weight_grams` (digunakan langsung untuk kalkulasi ongkir ekspedisi).
   - `sku` bersifat unik di seluruh katalog toko.

### 2.3 Modul Keranjang & Promosi
7. **`carts` & `cart_items`**
   - Setiap user memiliki tepat 1 entitas `cart` yang aktif.
   - `cart_items` merujuk langsung ke `product_variant_id`. Jika stok varian berkurang di masa mendatang, keranjang akan memvalidasi ulang saat dibuka.
8. **`vouchers`**
   - Mendukung diskon berupa persentase (`PERCENTAGE`) dengan plafon maksimal (`max_discount`), atau potongan tetap (`FIXED`).
   - Dilengkapi `quota` dan `used_count` untuk mengontrol batas penggunaan kupon.

### 2.4 Modul Transaksi & Pembayaran (Data Integrity Critical)
9. **`orders`**
   - `order_number`: Identifier unik untuk tagihan dan pencarian customer (format: `INV-YYYYMMDD-XXXX`).
   - `shipping_address_snapshot`: Menyimpan teks atau JSON lengkap nama penerima, no telp, dan alamat lengkap saat checkout berlangsung.
   - Status pemesanan:
     ```text
     UNPAID -> PAID -> PROCESSING -> SHIPPED -> COMPLETED
        |                                |
        +--------> CANCELLED <-----------+
     ```
10. **`order_items`**
    - **Snapshotting Wajib:** Menyimpan `product_name_snapshot`, `variant_name_snapshot`, dan `price_snapshot`. Perubahan harga produk oleh admin di masa depan tidak akan memengaruhi laporan keuangan pesanan lama.
11. **`payments`**
    - Menyimpan interaksi dengan Payment Gateway (Midtrans).
    - `snap_token` & `payment_url` digunakan frontend React untuk memunculkan modal pembayaran Snap.
    - `transaction_id` dari gateway disimpan unik untuk mencegah double callback (idempotency).

---

## 3. Aturan Relasi Foreign Key & Integritas Data

| Tabel Asal | Kolom FK | Tabel Target | On Delete Action | Rasional / Alasan Bisnis |
| :--- | :--- | :--- | :--- | :--- |
| `addresses` | `user_id` | `users(id)` | `CASCADE` | Jika akun dihapus permanen, hapus buku alamatnya. |
| `products` | `category_id` | `categories(id)` | `RESTRICT` | Kategori tidak boleh dihapus jika masih ada produk aktif di dalamnya. |
| `product_variants` | `product_id` | `products(id)` | `CASCADE` | Menghapus produk induk akan menghapus variannya. |
| `product_images` | `product_id` | `products(id)` | `CASCADE` | Menghapus produk induk akan menghapus daftar referensi fotonya. |
| `cart_items` | `cart_id` | `carts(id)` | `CASCADE` | Membersihkan keranjang saat cart direset. |
| `cart_items` | `product_variant_id`| `product_variants(id)`| `CASCADE` | Jika varian dihapus, otomatis hilang dari keranjang user. |
| **`orders`** | **`user_id`** | `users(id)` | **`RESTRICT`** | **Pesanan historis tidak boleh terhapus demi rekam jejak audit & finansial.** |
| **`order_items`**| **`order_id`** | `orders(id)` | **`RESTRICT`** | Rincian pesanan historis tidak boleh hilang. |
| `payments` | `order_id` | `orders(id)` | `RESTRICT` | Data pembayaran terikat erat dengan nomor order. |

---

## 4. Presisi Angka & Tipe Data Keuangan

> [!IMPORTANT]
> **Hindari Tipe `FLOAT` atau `DOUBLE` untuk Finansial!**  
> Semua kolom nilai uang (`price`, `discount_amount`, `total_product_price`, `total_shipping_cost`, `grand_total`) wajib didefinisikan sebagai **`DECIMAL(12,2)`**. Tipe ini menjamin presisi hingga 12 digit total (hingga 999 milyar) dengan 2 angka di belakang koma tanpa resiko pembulatan biner.

---

## 5. Kesimpulan Hari 2 & Langkah Menuju Hari 3
- **Hari 2 (Perancangan ERD & Relasi Database): SELESAI ✅**
- **Hari 3 (Selanjutnya):** Finalisasi skema database MySQL:
  - Pembuatan skrip DDL migrasi awal (`000001_init_schema.up.sql`).
  - Penentuan indeks performa pencarian (`INDEX`, `FULLTEXT INDEX`, composite index).
  - Skrip pengembalian migrasi (`000001_init_schema.down.sql`).
