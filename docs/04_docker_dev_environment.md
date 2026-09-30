# Dokumen Setup Lingkungan Docker Development (Hari 4)
**Aplikasi:** Okle Shop (E-Commerce Platform)  
**Database:** MySQL 8.0 (InnoDB)  
**Interaksi Database:** Terminal / CLI (Tanpa GUI/Adminer)  
**Status:** Disetujui (Hari 4 Selesai)  
**Terakhir Diperbarui:** 2026-09-28  

---

## 1. Konsep & Arsitektur Lingkungan Development

Tujuan Hari 4 adalah mengisolasi database MySQL ke dalam container Docker agar lingkungan kerja konsisten, terisolasi, dan tidak mengotori sistem operasi lokal.

```mermaid
graph LR
    subgraph Host Komputer Anda
        A[Terminal / PowerShell] -- "docker exec -it" --> B[MySQL CLI Client]
        ENV[.env file] -- "Injeksi Kredensial" --> C[Docker Compose]
    end

    subgraph Docker Engine (okle_network)
        C --> D[Container: okle_mysql_dev]
        D -- "Mount :ro" --> E["Init SQL (/docker-entrypoint-initdb.d)"]
        D -- "Persistensi Data" --> F[("Named Volume: okle_mysql_data_dev")]
    end
```

---

## 2. Acuan Konfigurasi File

### 2.1 File `.env` & `.env.example` (Root Directory)
Digunakan untuk menyimpan variabel konfigurasi database tanpa melakukan hardcode di dalam skrip compose.

```ini
# ==========================================
# Konfigurasi Database MySQL (Local Docker)
# ==========================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=okle_shop_dev
DB_USER=okle_user
DB_PASSWORD=okle_password123
DB_ROOT_PASSWORD=root_secret_password
```

> [!IMPORTANT]
> Pastikan `.env` telah tercatat di dalam `.gitignore` agar password rahasia tidak terunggah ke repositori Git publik. Gunakan `.env.example` sebagai template untuk tim.

---

### 2.2 File `docker-compose.dev.yml` (Root Directory)
Konfigurasi service tunggal `mysql_db` yang ramping (tanpa Adminer/GUI), dilengkapi volume persistensi, otomasi DDL migrasi, dan healthcheck.

```yaml
version: '3.8'

services:
  # -------------------------------------------------------------
  # Service Database: MySQL 8.0
  # -------------------------------------------------------------
  mysql_db:
    image: mysql:8.0
    container_name: okle_mysql_dev
    restart: unless-stopped
    command: 
      - --default-authentication-plugin=mysql_native_password
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports:
      - "${DB_PORT}:3306"
    volumes:
      # Volume 1: Data persistensi biner database
      - okle_mysql_data:/var/lib/mysql
      # Volume 2: Eksekusi otomatis DDL Hari 3 saat database baru pertama kali dibuat
      - ./backend/migrations/000001_init_schema.up.sql:/docker-entrypoint-initdb.d/01_init_schema.sql:ro
    networks:
      - okle_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${DB_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

# ---------------------------------------------------------------
# Named Volume & Bridge Network
# ---------------------------------------------------------------
volumes:
  okle_mysql_data:
    name: okle_mysql_data_dev

networks:
  okle_network:
    name: okle_dev_network
    driver: bridge
```

---

## 3. Panduan Interaksi Database via Terminal

Karena kita tidak menggunakan GUI (Adminer), seluruh inspeksi, query, dan debugging database dilakukan langsung melalui terminal.

### 3.1 Masuk ke MySQL Interactive Shell (REPL)

**Masuk sebagai user aplikasi:**
```bash
docker exec -it okle_mysql_dev mysql -u okle_user -p okle_shop_dev
```
*(Masukkan password dari `.env`: `okle_password123`)*

**Masuk sebagai root:**
```bash
docker exec -it okle_mysql_dev mysql -u root -p
```
*(Masukkan password root dari `.env`: `root_secret_password`)*

---

### 3.2 Menjalankan Query Cepat Langsung dari Terminal (Non-Interactive)

Anda tidak perlu selalu masuk ke dalam shell MySQL. Cukup gunakan flag `-e`:

**Melihat daftar tabel:**
```bash
docker exec -it okle_mysql_dev mysql -u okle_user -pokle_password123 okle_shop_dev -e "SHOW TABLES;"
```

**Melihat struktur tabel produk:**
```bash
docker exec -it okle_mysql_dev mysql -u okle_user -pokle_password123 okle_shop_dev -e "DESCRIBE products;"
```

**Melihat daftar indeks pada tabel orders:**
```bash
docker exec -it okle_mysql_dev mysql -u okle_user -pokle_password123 okle_shop_dev -e "SHOW INDEX FROM orders;"
```

---

### 3.3 Menjalankan File SQL Manual dari Host

Jika di kemudian hari Anda ingin mengeksekusi file SQL manual tanpa masuk container:
```bash
docker exec -i okle_mysql_dev mysql -u okle_user -pokle_password123 okle_shop_dev < path/to/script.sql
```

---

## 4. Perintah Operasional Docker

| Perintah | Deskripsi Fungsi |
| :--- | :--- |
| `docker compose -f docker-compose.dev.yml --env-file .env up -d` | Menyalakan container di latar belakang (*detached mode*). |
| `docker compose -f docker-compose.dev.yml ps` | Memeriksa status kesehatan container (`healthy`). |
| `docker logs -f okle_mysql_dev` | Melihat log output MySQL secara langsung. |
| `docker compose -f docker-compose.dev.yml down` | Menghentikan container (**data di volume tetap aman**). |
| `docker compose -f docker-compose.dev.yml down -v` | **Reset Total:** Menghentikan container dan **menghapus volume persistensi**. |

---

## 5. Checklist Verifikasi Hari 4

1. Jalankan `docker compose -f docker-compose.dev.yml --env-file .env up -d`.
2. Pastikan `docker compose -f docker-compose.dev.yml ps` berstatus `(healthy)`.
3. Jalankan perintah terminal:
   ```bash
   docker exec -it okle_mysql_dev mysql -u okle_user -pokle_password123 okle_shop_dev -e "SHOW TABLES;"
   ```
   *Pastikan seluruh 11 tabel (`users`, `categories`, `products`, `orders`, dll) muncul di output.*
4. Uji persistensi:
   - Matikan dengan `docker compose -f docker-compose.dev.yml down`.
   - Nyalakan kembali dengan `up -d`.
   - Jalankan kembali perintah `SHOW TABLES;` untuk memastikan tabel tidak hilang.

---

## 6. Kesimpulan Hari 4 & Langkah Menuju Hari 5
- **Hari 4 (Setup Docker MySQL & Terminal Access): SELESAI ✅**
- **Hari 5 (Selanjutnya):** Inisialisasi GORM v1.25+, konfigurasi Database Connection Pool di Golang, dan strategi migrasi otomatis vs terprogram.
