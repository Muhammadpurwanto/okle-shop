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

---

## 🚀 Memulai Proyek
Ikuti petunjuk tahapan pada [Fase 1 di ROADMAP_100_HARI.md](file:///c:/Development/Golang/okle-shop/ROADMAP_100_HARI.md#fase-1-perencanaan-setup-gorm-lingkungan-docker--ci-dasar-hari-1--10) untuk inisialisasi lingkungan Docker, backend, frontend, dan pipeline CI/CD.
