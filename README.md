# Okle Shop - E-Commerce Platform

Aplikasi e-commerce modern berskala produksi yang dibangun dengan:
- **Backend**: Golang & Fiber
- **ORM / Data Access**: GORM v1.25+
- **Database**: MySQL 8.0+
- **Frontend**: React (Vite) & Tailwind CSS
- **Containerization**: Docker & Docker Compose
- **CI/CD Automation**: GitHub Actions (Lint, Test, Docker Build & Push, Auto-Deploy)

---

## 📖 Roadmap & Rencana Pengerjaan
Dokumentasi lengkap jadwal tahapan pengerjaan selama 100 hari dapat dilihat di:
👉 **[ROADMAP_100_HARI.md](file:///c:/Development/Golang/okle-shop/ROADMAP_100_HARI.md)**

---

## 📂 Dokumentasi Tahapan (Sprints & Days)
- **Hari 1:** [01_functional_requirements.md](file:///c:/Development/Golang/okle-shop/docs/01_functional_requirements.md) — Analisis kebutuhan, aktor pengguna, varian 1-level, dan penyimpanan AWS S3.
- **Hari 2:** [02_database_erd.md](file:///c:/Development/Golang/okle-shop/docs/02_database_erd.md) — Diagram ERD relasional, spesifikasi kamus data, snapshotting order, dan integritas foreign key.
- **Hari 3:** [03_database_schema_indexing.md](file:///c:/Development/Golang/okle-shop/docs/03_database_schema_indexing.md) — Skema DDL lengkap MySQL, strategi indeks komposit B-Tree, FULLTEXT search, dan file migrasi up/down.
- **Hari 4:** [04_docker_dev_environment.md](file:///c:/Development/Golang/okle-shop/docs/04_docker_dev_environment.md) — Setup container MySQL 8.0, volume persistensi, otomasi inisialisasi DDL, dan panduan query via terminal CLI.
- **Hari 5:** [05_gorm_setup_connection_pooling.md](file:///c:/Development/Golang/okle-shop/docs/05_gorm_setup_connection_pooling.md) — Konfigurasi GORM v1.25+, arsitektur Connection Pooling (MaxOpen, MaxIdle, MaxLifetime), format DSN, dan logger query.
- **Hari 6:** [06_database_migration_and_base_models.md](file:///c:/Development/Golang/okle-shop/docs/06_database_migration_and_base_models.md) — Custom BaseModel (uint64 BIGINT), definisi entitas GORM (User, Product, Variant 1-level), dan runner migrasi terprogram (cmd/migrate/main.go).
- **Hari 7:** [07_backend_scaffolding_and_clean_architecture.md](file:///c:/Development/Golang/okle-shop/docs/07_backend_scaffolding_and_clean_architecture.md) — Setup Golang Fiber, Clean Architecture (Handler, Service, Repository), Central Error Handler, Middlewares (Recover, Logger, CORS), dan Graceful Shutdown.
- **Hari 8:** [08_frontend_scaffolding_react_vite_tailwind.md](file:///c:/Development/Golang/okle-shop/docs/08_frontend_scaffolding_react_vite_tailwind.md) — Setup project Frontend React dengan Vite, instalasi Tailwind CSS v3, Lucide Icons, struktur direktori frontend, dan verifikasi App.jsx.
- **Hari 9:** [09_docker_dev_backend_frontend_air.md](file:///c:/Development/Golang/okle-shop/docs/09_docker_dev_backend_frontend_air.md) — Orkestrasi Docker Compose penuh (MySQL + Backend Go dengan Air live-reload + Frontend Vite HMR) dan trik anonymous volume.
- **Hari 10:** [10_ci_pipeline_github_actions.md](file:///c:/Development/Golang/okle-shop/docs/10_ci_pipeline_github_actions.md) — Otomasi CI Pipeline dengan GitHub Actions (Go test, vet, race detector, & Vite build) dan penutupan Fase 1.
- **Hari 11:** [11_user_model_and_auth_dto.md](file:///c:/Development/Golang/okle-shop/docs/11_user_model_and_auth_dto.md) — Pembuka Fase 2: Pola DTO (RegisterRequest, LoginRequest, UserResponse), integrasi go-playground validator, dan interface UserRepository GORM.
- **Hari 12:** [12_user_registration_service_and_endpoint.md](file:///c:/Development/Golang/okle-shop/docs/12_user_registration_service_and_endpoint.md) — Registrasi User: Hashing password aman dengan bcrypt, AuthService, AuthHandler, dan endpoint API POST /api/v1/auth/register.
- **Hari 13:** [13_jwt_authentication_and_login.md](file:///c:/Development/Golang/okle-shop/docs/13_jwt_authentication_and_login.md) — Sistem Login & JWT (RFC 7519): Arsitektur Dual-Token (Access 15m + Refresh 7d), helper generator/validator, dan endpoint API POST /api/v1/auth/login.
- **Hari 14:** [14_jwt_middleware_and_rbac.md](file:///c:/Development/Golang/okle-shop/docs/14_jwt_middleware_and_rbac.md) — Middleware Autentikasi JWT (Protected), Role-Based Access Control / RBAC (Customer vs Admin), status HTTP 401 vs 403, dan endpoint terproteksi /me & /admin/dashboard.
- **Hari 15:** [15_refresh_token_and_logout.md](file:///c:/Development/Golang/okle-shop/docs/15_refresh_token_and_logout.md) — Endpoint Refresh Token (Refresh Token Rotation), verifikasi akun aktif, dan endpoint Logout (revokasi token) di Fiber.
- **Hari 16:** [16_user_address_crud.md](file:///c:/Development/Golang/okle-shop/docs/16_user_address_crud.md) — CRUD Manajemen Alamat Pengiriman Pengguna (addresses): relasi BelongsTo, rotasi status is_default via transaksi GORM, dan proteksi IDOR.
- **Hari 17:** [17_frontend_axios_interceptors_auth.md](file:///c:/Development/Golang/okle-shop/docs/17_frontend_axios_interceptors_auth.md) — Konfigurasi Frontend Axios Instance: Request & Response Interceptors, Silent Refresh 401, pencegahan race condition via Mutex Queue, dan demo UI interaktif.
- **Hari 18:** [18_frontend_state_management_zustand.md](file:///c:/Development/Golang/okle-shop/docs/18_frontend_state_management_zustand.md) — State Management Global menggunakan Zustand: useAuthStore, persist middleware LocalStorage, dan reaktivitas multi-komponen tanpa prop drilling.
- **Hari 19:** [19_frontend_login_and_register_pages.md](file:///c:/Development/Golang/okle-shop/docs/19_frontend_login_and_register_pages.md) — Halaman Register & Login interaktif dengan React Router DOM, validasi form sisi klien, intip kata sandi (show/hide), dan auto-redirect.
- **Hari 20:** [20_frontend_forgot_and_reset_password.md](file:///c:/Development/Golang/okle-shop/docs/20_frontend_forgot_and_reset_password.md) — Fitur Lupa Password & Reset Password end-to-end: Token JWT 15 menit, proteksi OWASP User Enumeration, hashing Bcrypt, dan halaman Frontend interaktif.
- **Hari 21:** [21_frontend_protected_route_and_rbac.md](file:///c:/Development/Golang/okle-shop/docs/21_frontend_protected_route_and_rbac.md) — Komponen ProtectedRoute & RBAC Guard: Pembatasan akses halaman member dan admin, penanganan 401 & 403 Forbidden, dan intent-redirect.
- **Hari 22:** [22_frontend_user_profile_and_password_change.md](file:///c:/Development/Golang/okle-shop/docs/22_frontend_user_profile_and_password_change.md) — Halaman Profil Pengguna: Form Edit Profil & Ganti Kata Sandi, verifikasi Bcrypt sandi lama, sinkronisasi state global Zustand, dan rute terproteksi.
- **Hari 23:** [23_frontend_user_address_management.md](file:///c:/Development/Golang/okle-shop/docs/23_frontend_user_address_management.md) — Halaman Manajemen Buku Alamat: Integrasi CRUD Alamat Pengiriman, Modal Tambah & Ubah Alamat, penetapan Alamat Utama (is_default), dan pencegahan IDOR.
- **Hari 24:** [24_integration_and_e2e_testing_auth_lifecycle.md](file:///c:/Development/Golang/okle-shop/docs/24_integration_and_e2e_testing_auth_lifecycle.md) — Integrasi & Pengujian Menyeluruh Alur Auth & User Lifecycle: Skrip Otomasi E2E PowerShell (13 langkah pengujian), intent-redirect, RBAC guard, dan sinkronisasi reaktif Zustand.
- **Hari 25:** [25_auth_security_validation_and_hardening.md](file:///c:/Development/Golang/okle-shop/docs/25_auth_security_validation_and_hardening.md) — **Penutup Fase 2**: Validasi Keamanan Autentikasi (HttpOnly Cookies vs Bearer Token), Security Headers (Fiber Helmet OWASP), Rate Limiting pencegah Brute-Force, dan skrip audit keamanan.

---

## 🚀 Memulai Proyek
Ikuti petunjuk tahapan pada [Fase 1 di ROADMAP_100_HARI.md](file:///c:/Development/Golang/okle-shop/ROADMAP_100_HARI.md#fase-1-perencanaan-setup-gorm-lingkungan-docker--ci-dasar-hari-1--10) untuk inisialisasi lingkungan Docker, backend, frontend, dan pipeline CI/CD.
