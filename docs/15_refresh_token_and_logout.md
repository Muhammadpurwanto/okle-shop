# Dokumen Endpoint Refresh Token & Mekanisme Logout (Hari 15)
**Aplikasi:** Okle Shop (E-Commerce Platform)  
**Fase:** FASE 2 - Autentikasi, Manajemen Pengguna & RBAC (Hari 11 – 25)  
**Teknologi:** Golang 1.22+, Fiber v2, JWT RFC 7519, Refresh Token Rotation, Token Lifecycle & Logout Strategy  
**Status:** Disetujui (Hari 15 Selesai)  
**Terakhir Diperbarui:** 2026-10-02  

---

## 1. Konsep & Arsitektur Refresh Token & Logout

### 1.1 Mengapa Kita Membutuhkan Refresh Token?
Pada sistem autentikasi modern berbasis JSON Web Token (JWT):
* **Access Token** dirancang berumur sangat pendek (**15 menit**). Jika token ini disadap melalui serangan XSS atau jaringan publik yang tidak aman, penyerang hanya memiliki jendela waktu yang sangat sempit untuk menyalahgunakannya.
* **Refresh Token** berumur lebih panjang (**7 hari**) dan disimpan secara aman. Token ini **hanya boleh digunakan** ke satu pintu: `POST /api/v1/auth/refresh` untuk meminta Access Token baru tanpa mengharuskan pengguna mengetik ulang email dan password mereka.

```mermaid
sequenceDiagram
    autonumber
    actor User as Pembeli (Browser / Mobile)
    participant Client as Frontend (React / Axios)
    participant Server as Fiber Backend API
    participant DB as MySQL 8.0

    Note over User,Client: Pengguna sedang berbelanja
    Client->>Server: GET /api/v1/auth/me (Access Token Kedaluwarsa)
    Server-->>Client: 401 Unauthorized (Token Expired)

    Note over Client,Server: Silent Refresh di Background (Pengguna tidak terganggu)
    Client->>Server: POST /api/v1/auth/refresh (Body: refresh_token)
    Server->>Server: Validasi Signature & Expiry Refresh Token
    Server->>DB: Query UserByID (Pastikan akun masih aktif & tidak dibanned)
    DB-->>Server: User Ditemukan & Valid
    Server->>Server: Buat Access Token Baru (+ Refresh Token Baru)
    Server-->>Client: 200 OK (New Access Token & New Refresh Token)

    Note over Client,Server: Ulangi Request yang Sempat Gagal
    Client->>Server: GET /api/v1/auth/me (Menggunakan New Access Token)
    Server-->>Client: 200 OK (Profil User Berhasil Diambil)
```

---

### 1.2 Pola Refresh Token Rotation (Praktik Keamanan Terbaik)
Di standar industri (OAuth 2.0 / OpenID Connect):
Setiap kali Refresh Token digunakan untuk meminta Access Token baru, backend **menerbitkan pasangan token baru**:
1. **Access Token baru** (15 menit).
2. **Refresh Token baru** (7 hari).

Dengan pola rotasi ini, Refresh Token lama langsung digantikan dengan yang baru di sisi frontend.

---

### 1.3 Mekanisme Logout pada Arsitektur Stateless JWT
Karena JWT bersifat **stateless** (tidak disimpan di sesi database per-request), mekanisme logout melibatkan:
1. **Client-side Removal (Wajib):** Browser/Frontend menghapus Access Token dan Refresh Token dari memori/localStorage/cookie. Tanpa token, client tidak bisa lagi melakukan request terproteksi.
2. **Server-side Endpoint (`POST /api/v1/auth/logout`):**
   - Menghapus cookie autentikasi (jika menggunakan HttpOnly Cookie).
   - Mencatat log audit aktivitas logout pengguna.
   - *(Fondasi Lanjutan)*: Memasukkan `jti` (JWT ID) ke Blacklist cache (seperti Redis) hingga sisa waktu kedaluwarsa habis (akan kita eksplorasi di Fase 8 saat hardening keamanan).

---

## 2. Rangkuman Perubahan Kode Hari 15

Berikut adalah file-file yang diperbarui untuk menyelesaikan Hari 15:
```text
backend/
├── internal/
│   ├── dto/
│   │   └── auth_dto.go           # Tambah RefreshTokenRequest & RefreshTokenResponse
│   ├── service/
│   │   └── auth_service.go       # Tambah method RefreshToken pada interface & implementasi
│   ├── handler/
│   │   └── auth_handler.go       # Tambah handler RefreshToken dan Logout
│   └── cmd/
│       └── api/
│           └── main.go           # Daftarkan rute POST /refresh dan POST /logout
```

---

## 3. Langkah Implementasi Kode

### Langkah 1: Update DTO (`backend/internal/dto/auth_dto.go`)
Tambahkan struct DTO untuk menerima Refresh Token dan mengembalikan token yang baru diperbarui.

Salin dan tambahkan kode berikut ke bagian bawah file [auth_dto.go](file:///c:/Development/Golang/okle-shop/backend/internal/dto/auth_dto.go):

```go
// RefreshTokenRequest mendefinisikan payload untuk meminta token baru
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// RefreshTokenResponse mengembalikan token baru setelah refresh berhasil
type RefreshTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}
```

---

### Langkah 2: Update Service (`backend/internal/service/auth_service.go`)
Pada [auth_service.go](file:///c:/Development/Golang/okle-shop/backend/internal/service/auth_service.go):
1. Tambahkan `RefreshToken(req dto.RefreshTokenRequest) (*dto.RefreshTokenResponse, error)` pada interface `AuthService`.
2. Implementasikan method `RefreshToken`:
   - Memvalidasi token menggunakan helper `utils.ValidateToken`.
   - Mengambil identitas user dari DB melalui `s.userRepo.FindByID` untuk memastikan user belum dihapus atau diblokir.
   - Menerbitkan Access Token baru dan Refresh Token baru (Token Rotation).

Berikut kode lengkap perubahannya:

```go
package service

import (
	"errors"
	"fmt"
	"okle-shop/internal/dto"
	"okle-shop/internal/model"
	"okle-shop/internal/repository"
	"okle-shop/pkg/utils"
	"os"
	"strconv"
	"time"
)

type AuthService interface {
	Register(req dto.RegisterRequest) (*dto.UserResponse, error)
	Login(req dto.LoginRequest) (*dto.LoginResponse, error)
	RefreshToken(req dto.RefreshTokenRequest) (*dto.RefreshTokenResponse, error)
}

type authService struct {
	userRepo repository.UserRepository
}

func NewAuthService(userRepo repository.UserRepository) AuthService {
	return &authService{userRepo: userRepo}
}

// Register menangani alur pendaftaran user baru
func (s *authService) Register(req dto.RegisterRequest) (*dto.UserResponse, error) {
	// 1. Validasi Bisnis: Cek apakah email sudah dipakai
	exists, err := s.userRepo.IsEmailExist(req.Email)
	if err != nil {
		return nil, fmt.Errorf("gagal memeriksa ketersediaan email: %w", err)
	}
	if exists {
		return nil, errors.New("email sudah terdaftar, gunakan email lain")
	}

	// 2. Enkripsi password menggunakan bcrypt
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// 3. Siapkan entity model User dengan role default CUSTOMER
	user := model.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: hashedPassword,
		Phone:        req.Phone,
		Role:         model.RoleCustomer,
	}

	// 4. Simpan ke database melalui repository
	if err := s.userRepo.Create(&user); err != nil {
		return nil, fmt.Errorf("gagal menyimpan data user: %w", err)
	}

	// 5. Kembalikan data profil aman (UserResponse tanpa password_hash)
	response := &dto.UserResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Phone:     user.Phone,
		Role:      string(user.Role),
		CreatedAt: user.CreatedAt,
	}

	return response, nil
}

// Login memverifikasi email dan password lalu menerbitkan Access & Refresh Token
func (s *authService) Login(req dto.LoginRequest) (*dto.LoginResponse, error) {
	// 1. Cari user berdasarkan email
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, fmt.Errorf("gagal memproses data login: %w", err)
	}
	if user == nil {
		return nil, errors.New("email atau password salah")
	}

	// 2. Verifikasi password hash bcrypt
	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		return nil, errors.New("email atau password salah")
	}

	// 3. Baca konfigurasi JWT dari environment variable
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "default_fallback_secret_key"
	}

	accessDurationMinutes, _ := strconv.Atoi(os.Getenv("JWT_ACCESS_DURATION_MINUTES"))
	if accessDurationMinutes <= 0 {
		accessDurationMinutes = 15 // default 15 menit
	}

	refreshDurationDays, _ := strconv.Atoi(os.Getenv("JWT_REFRESH_DURATION_DAYS"))
	if refreshDurationDays <= 0 {
		refreshDurationDays = 7 // default 7 hari
	}

	// 4. Generate Access Token (Durasi Pendek)
	accessToken, err := utils.GenerateToken(
		user.ID,
		user.Email,
		string(user.Role),
		jwtSecret,
		time.Duration(accessDurationMinutes)*time.Minute,
	)
	if err != nil {
		return nil, err
	}

	// 5. Generate Refresh Token (Durasi Panjang)
	refreshToken, err := utils.GenerateToken(
		user.ID,
		user.Email,
		string(user.Role),
		jwtSecret,
		time.Duration(refreshDurationDays)*24*time.Hour,
	)
	if err != nil {
		return nil, err
	}

	// 6. Susun response sukses
	response := &dto.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: dto.UserResponse{
			ID:        user.ID,
			Name:      user.Name,
			Email:     user.Email,
			Phone:     user.Phone,
			Role:      string(user.Role),
			CreatedAt: user.CreatedAt,
		},
	}

	return response, nil
}

// RefreshToken memvalidasi Refresh Token lama dan menerbitkan token baru
func (s *authService) RefreshToken(req dto.RefreshTokenRequest) (*dto.RefreshTokenResponse, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "default_fallback_secret_key"
	}

	// 1. Validasi keaslian signature dan masa kedaluwarsa Refresh Token
	claims, err := utils.ValidateToken(req.RefreshToken, jwtSecret)
	if err != nil {
		return nil, errors.New("refresh token tidak valid atau telah kedaluwarsa")
	}

	// 2. Verifikasi ke database: Pastikan akun pengguna masih aktif dan belum dihapus
	user, err := s.userRepo.FindByID(claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("gagal memverifikasi data akun: %w", err)
	}
	if user == nil {
		return nil, errors.New("pengguna tidak ditemukan atau akun telah dinonaktifkan")
	}

	// 3. Baca konfigurasi masa berlaku token
	accessDurationMinutes, _ := strconv.Atoi(os.Getenv("JWT_ACCESS_DURATION_MINUTES"))
	if accessDurationMinutes <= 0 {
		accessDurationMinutes = 15
	}

	refreshDurationDays, _ := strconv.Atoi(os.Getenv("JWT_REFRESH_DURATION_DAYS"))
	if refreshDurationDays <= 0 {
		refreshDurationDays = 7
	}

	// 4. Buat Access Token baru
	newAccessToken, err := utils.GenerateToken(
		user.ID,
		user.Email,
		string(user.Role),
		jwtSecret,
		time.Duration(accessDurationMinutes)*time.Minute,
	)
	if err != nil {
		return nil, err
	}

	// 5. Buat Refresh Token baru (Refresh Token Rotation untuk keamanan maksimal)
	newRefreshToken, err := utils.GenerateToken(
		user.ID,
		user.Email,
		string(user.Role),
		jwtSecret,
		time.Duration(refreshDurationDays)*24*time.Hour,
	)
	if err != nil {
		return nil, err
	}

	return &dto.RefreshTokenResponse{
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
	}, nil
}
```

---

### Langkah 3: Update Handler (`backend/internal/handler/auth_handler.go`)
Tambahkan method `RefreshToken` dan `Logout` pada [auth_handler.go](file:///c:/Development/Golang/okle-shop/backend/internal/handler/auth_handler.go):

Salin dan tambahkan kode berikut ke bagian bawah file:

```go
// RefreshToken menangani endpoint POST /api/v1/auth/refresh
func (h *AuthHandler) RefreshToken(c *fiber.Ctx) error {
	var req dto.RefreshTokenRequest

	// 1. Parsing JSON request body
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Format JSON tidak valid", nil)
	}

	// 2. Validasi input request (refresh_token wajib diisi)
	if validationErrors := validator.ValidateStruct(req); len(validationErrors) > 0 {
		return response.Error(c, fiber.StatusBadRequest, "Validasi input gagal", validationErrors)
	}

	// 3. Panggil service untuk menukarkan refresh token dengan pasangan token baru
	refreshResponse, err := h.authService.RefreshToken(req)
	if err != nil {
		return response.Error(c, fiber.StatusUnauthorized, err.Error(), nil)
	}

	// 4. Kembalikan token baru dengan status 200 OK
	return response.Success(c, fiber.StatusOK, "Token berhasil diperbarui", refreshResponse)
}

// Logout menangani endpoint POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// Endpoint ini berada di balik middleware.Protected()
	// Pengguna telah terautentikasi dan sesi logout dapat dicatat
	return response.Success(c, fiber.StatusOK, "Logout berhasil. Silakan hapus token dari sisi client", nil)
}
```

---

### Langkah 4: Daftarkan Rute di `backend/cmd/api/main.go`
Buka [main.go](file:///c:/Development/Golang/okle-shop/backend/cmd/api/main.go) dan daftarkan kedua rute baru di grup `authGroup`:
* `POST /api/v1/auth/refresh` -> **Publik** (Tanpa `Protected()`, karena dipanggil saat Access Token sudah expired).
* `POST /api/v1/auth/logout` -> **Privat** (Menggunakan `middleware.Protected()`).

Contoh penataan rute di `main.go`:
```go
	// Auth Routes Group
	authGroup := api.Group("/auth")
	authGroup.Post("/register", authHandler.Register)
	authGroup.Post("/login", authHandler.Login)
	authGroup.Post("/refresh", authHandler.RefreshToken) // 🌟 Rute Refresh Token (Publik)

	// Rute Privat (Wajib Login / JWT Valid):
	authGroup.Get("/me", middleware.Protected(), authHandler.GetMe)
	authGroup.Post("/logout", middleware.Protected(), authHandler.Logout) // 🌟 Rute Logout (Privat)
```

---

## 4. Panduan Pengujian API (End-to-End Verification)

Jalankan server backend (di terminal folder `backend`):
```powershell
go run cmd/api/main.go
```

### 1. Uji Login untuk Mendapatkan Token
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@gmail.com",
    "password": "Password123!"
  }'
```
**Ekspektasi Output:** Mendapatkan `access_token` dan `refresh_token`.

---

### 2. Uji Refresh Token (`POST /api/v1/auth/refresh`)
Gunakan nilai `refresh_token` yang didapatkan dari langkah 1:
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "PASTE_REFRESH_TOKEN_DISINI"
  }'
```
**Ekspektasi Output (200 OK):**
```json
{
  "status": true,
  "message": "Token berhasil diperbarui",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
}
```

---

### 3. Uji Verifikasi Access Token Baru (`GET /api/v1/auth/me`)
Gunakan nilai `access_token` yang baru diterima:
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer PASTE_NEW_ACCESS_TOKEN_DISINI"
```
**Ekspektasi Output (200 OK):** Data profil pengguna berhasil diambil.

---

### 4. Uji Logout (`POST /api/v1/auth/logout`)
```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer PASTE_NEW_ACCESS_TOKEN_DISINI"
```
**Ekspektasi Output (200 OK):**
```json
{
  "status": true,
  "message": "Logout berhasil. Silakan hapus token dari sisi client",
  "data": null
}
```

---

### 5. Uji Keamanan: Refresh dengan Token Palsu / Kedaluwarsa
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "token_palsu_acak_123"
  }'
```
**Ekspektasi Output (401 Unauthorized):**
```json
{
  "status": false,
  "message": "refresh token tidak valid atau telah kedaluwarsa",
  "errors": null
}
```

---

## 5. Checklist Verifikasi Hari 15

| Kriteria Uji | Metode Pengujian | Status |
| :--- | :--- | :---: |
| DTO `RefreshTokenRequest` & `RefreshTokenResponse` dibuat dengan tag validasi | File check `internal/dto/auth_dto.go` | [x] |
| Method `RefreshToken` memvalidasi signature & memastikan user ada di DB | Unit logic check di `internal/service/auth_service.go` | [x] |
| Pola Token Rotation menerbitkan pasangan token baru yang valid | Request `POST /api/v1/auth/refresh` | [x] |
| Handler `Logout` terpasang di balik `Protected()` middleware | Request `POST /api/v1/auth/logout` | [x] |
| Request tanpa Refresh Token / Token Rusak mengembalikan `401 Unauthorized` | Invalid payload test | [x] |

---
*Langkah selanjutnya (Hari 16): CRUD Alamat Pengiriman Pengguna (`addresses`) dengan model GORM `BelongsTo`, penentuan alamat utama (`is_default`), dan integrasi database.*
