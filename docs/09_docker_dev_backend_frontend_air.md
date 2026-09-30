# Dokumen Docker Development: Backend (Air Hot-Reload) & Frontend (Hari 9)
**Aplikasi:** Okle Shop (E-Commerce Platform)  
**Teknologi:** Docker Compose, Golang 1.22 (Air Watcher), React (Vite HMR), MySQL 8.0  
**Status:** Disetujui (Hari 9 Selesai)  
**Terakhir Diperbarui:** 2026-09-30  

---

## 1. Konsep & Arsitektur Lingkungan Pengembangan Lengkap

Di Hari 9, kita menyatukan ketiga pilar aplikasi (**Database MySQL**, **Backend Golang**, dan **Frontend React**) ke dalam satu ekosistem Docker yang terisolasi namun saling terhubung melalui **Bridge Network**.

```mermaid
graph TD
    UserBrowser[Browser Pengguna di Laptop] -->|Port 5173| FrontendContainer[Container: okle_frontend_dev<br/>Node.js 20 + Vite HMR]
    UserBrowser -->|Port 8000| BackendContainer[Container: okle_backend_dev<br/>Golang 1.22 + Air Live Reload]
    
    subgraph okle_network (Docker Bridge Network)
        BackendContainer -->|Host: mysql_db Port: 3306| DBContainer[Container: okle_mysql_dev<br/>MySQL 8.0 InnoDB]
    end

    subgraph Host Laptop Windows (Source Code)
        SourceGo[./backend] -. "Bind Mount Live" .-> BackendContainer
        SourceReact[./frontend] -. "Bind Mount Live" .-> FrontendContainer
    end
```

---

## 2. Mengapa Menggunakan "Air" untuk Golang?

Golang adalah bahasa terkompilasi (*compiled language*). Tanpa tool otomatisasi:
- Setiap kali Anda mengedit 1 baris kode `.go`, Anda terpaksa harus mematikan server, mengetik `go build`, lalu menyalakan server kembali. Ini sangat membuang waktu.
- **Solusinya: `Air` (`cosmtrek/air` atau `air-verse/air`)**:
  Air adalah *live reload utility* untuk Go. Air memantau file `.go` di dalam folder proyek Anda. Saat Anda menekan `Ctrl + S`, Air otomatis mengkompilasi ulang binary di memori dan me-restart server Go dalam waktu **kurang dari 1 detik**.

---

## 3. Trik Kritis Docker untuk Frontend Node.js: *Anonymous Volume*

Saat me-mount folder `./frontend` ke container Linux:
```yaml
volumes:
  - ./frontend:/app
  - /app/node_modules # <- ANONYMOUS VOLUME (SANGAT KRUSIAL!)
```
### Mengapa Baris `/app/node_modules` Wajib Ada?
* Folder `node_modules` di laptop Anda berisi binary dependensi yang dikompilasi untuk **Windows**.
* Sedangkan container Docker berjalan di atas sistem operasi **Linux**.
* Jika baris ini tidak dipasang, folder `node_modules` Windows Anda akan menimpa folder `node_modules` Linux di dalam container, yang mengakibatkan error: `exec format error` atau module tidak ditemukan.
* Dengan *Anonymous Volume*, Docker mengisolasi folder `node_modules` Linux agar tetap berada di dalam container.

---

## 4. Acuan Kode & Konfigurasi File

### 4.1 File `backend/Dockerfile.dev`
Buat file ini di dalam folder `backend/`:

```dockerfile
FROM golang:1.22-alpine

# Install git dan dependensi dasar untuk build
RUN apk add --no-cache git gcc musl-dev

# Install live-reload utility "Air"
RUN go install github.com/air-verse/air@latest

WORKDIR /app

# Copy dependensi module terlebih dahulu agar dicache Docker
COPY go.mod go.sum ./
RUN go mod download

# Salin seluruh source code
COPY . .

# Expose port API backend
EXPOSE 8000

# Jalankan Air saat container menyala
CMD ["air", "-c", ".air.toml"]
```

---

### 4.2 File `backend/.air.toml` (Konfigurasi Air)
Buat file ini di dalam folder `backend/` untuk mengatur watcher:

```toml
root = "."
tmp_dir = "tmp"

[build]
  cmd = "go build -o ./tmp/main ./cmd/api"
  bin = "./tmp/main"
  delay = 1000 # jeda 1 detik setelah save sebelum recompile
  exclude_dir = ["assets", "tmp", "vendor", "migrations"]
  include_ext = ["go", "tpl", "tmpl", "html"]
  exclude_regex = ["_test\\.go$"]
  stop_on_error = true
  log = "air.log"

[color]
  main = "magenta"
  watcher = "cyan"
  build = "yellow"
  runner = "green"

[misc]
  clean_on_exit = true
```

---

### 4.3 File `frontend/Dockerfile.dev`
Buat file ini di dalam folder `frontend/`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Salin package.json terlebih dahulu untuk efisiensi Docker cache
COPY package.json package-lock.json ./
RUN npm install

# Salin seluruh kode frontend
COPY . .

# Expose port dev Vite
EXPOSE 5173

# Jalankan Vite server dengan binding host 0.0.0.0 agar bisa diakses dari host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

---

### 4.4 Perbarui `docker-compose.dev.yml` (Root Proyek)
Satukan ketiga service (MySQL, Backend, Frontend) menjadi satu orkestrasi:

```yaml
version: '3.8'

services:
  # =============================================================
  # 1. Database MySQL 8.0
  # =============================================================
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
      - okle_mysql_data:/var/lib/mysql
      - ./backend/migrations/000001_init_schema.up.sql:/docker-entrypoint-initdb.d/01_init_schema.sql:ro
    networks:
      - okle_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${DB_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

  # =============================================================
  # 2. Backend Golang Fiber (dengan Air Hot-Reload)
  # =============================================================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: okle_backend_dev
    restart: unless-stopped
    ports:
      - "${APP_PORT:-8000}:8000"
    environment:
      APP_PORT: 8000
      # Perhatikan: Host database menggunakan nama service 'mysql_db', bukan localhost!
      DB_HOST: mysql_db
      DB_PORT: 3306
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      APP_ENV: development
    volumes:
      - ./backend:/app
    networks:
      - okle_network
    depends_on:
      mysql_db:
        condition: service_healthy

  # =============================================================
  # 3. Frontend React Vite (dengan Tailwind & HMR)
  # =============================================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: okle_frontend_dev
    restart: unless-stopped
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules # Lindungi dependensi Linux dari tindihan Windows
    networks:
      - okle_network
    depends_on:
      - backend

# ===============================================================
# Persistent Volumes & Network Definitions
# ===============================================================
volumes:
  okle_mysql_data:
    name: okle_mysql_data_dev

networks:
  okle_network:
    name: okle_dev_network
    driver: bridge
```

---

## 5. Cara Menjalankan & Verifikasi

1. **Jalankan seluruh sistem dari root workspace:**
   ```powershell
   docker compose -f docker-compose.dev.yml --env-file .env up --build
   ```
2. **Cek Status Container:**
   ```powershell
   docker compose -f docker-compose.dev.yml ps
   ```
   *Ketiga container (`okle_mysql_dev`, `okle_backend_dev`, dan `okle_frontend_dev`) harus berstatus `Up`.*
3. **Uji Endpoint Backend:**
   Buka `http://localhost:8000/api/v1/health` di browser. Respons harus `"status": "UP & HEALTHY"`.
4. **Uji Tampilan Frontend:**
   Buka `http://localhost:5173` di browser. Halaman Okle Shop Frontend harus tampil rapi.
5. **Uji Live-Reload (Hot Reloading):**
   - Edit teks pada file `backend/internal/handler/health_handler.go` ➔ Simpan (`Ctrl+S`). Terminal akan menampilkan log Air yang otomatis mengkompilasi ulang tanpa Anda menyentuh terminal!
   - Edit teks pada file `frontend/src/App.jsx` ➔ Simpan (`Ctrl+S`). Browser akan langsung terupdate seketika via Vite HMR!

---

## 6. Kesimpulan Hari 9 & Langkah Menuju Hari 10
- **Hari 9 (Docker Dev Stack: MySQL + Backend Air + Frontend Vite): SELESAI ✅**
- **Hari 10 (Penutupan Fase 1):** Setup CI Pipeline Pertama dengan GitHub Actions (`.github/workflows/ci.yml`) untuk verifikasi otomatis linter Go, unit test, dan build check frontend pada setiap Pull Request.
