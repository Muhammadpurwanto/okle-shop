# Dokumen Middleware Autentikasi JWT & Role-Based Access Control / RBAC (Hari 14)
**Aplikasi:** Okle Shop (E-Commerce Platform)  
**Fase:** FASE 2 - Autentikasi, Manajemen Pengguna & RBAC (Hari 11 – 25)  
**Teknologi:** Golang 1.22+, Fiber v2 Middlewares, JWT Claims Extraction, RBAC (Customer vs Admin)  
**Status:** Disetujui (Hari 14 Selesai)  
**Terakhir Diperbarui:** 2026-10-02  

---

## 1. Konsep & Arsitektur Satpam Rute (Middleware Pipeline)

Di Hari 14, kita membangun **"Pintu Gerbang Pengamanan"** untuk melindungi rute-rute privat aplikasi. Tidak semua orang boleh mengakses setiap endpoint:

```mermaid
graph LR
    Client[Browser / Client] -->|Header: Authorization Bearer token| M1[1. JWTMiddleware]
    
    subgraph Gatekeeper
        M1 -->|Token Tidak Ada / Expired| E401[401 Unauthorized ❌]
        M1 -->|Token Valid: Simpan ke c.Locals| M2[2. RoleMiddleware RBAC]
        M2 -->|Bukan ADMIN| E403[403 Forbidden ❌]
        M2 -->|Role Sesuai| H[3. Protected Handler ✅]
    end

    H --> Response[Response Data Privat]
```

### Perbedaan Status Kode HTTP yang Sangat Penting:
* **`401 Unauthorized` (Belum Login / Token Basi):**  
  Terjadi saat pengunjung mencoba mengakses halaman akun tanpa membawa token, atau tokennya sudah kedaluwarsa (> 15 menit).
* **`403 Forbidden` (Sudah Login, tapi Dilarang Masuk):**  
  Terjadi saat seorang **CUSTOMER biasa** mencoba mengakses halaman khusus **ADMIN** (seperti mengubah stok toko atau melihat omset harian). Tokennya sah, tetapi jabatannya tidak memiliki izin.

---

## 2. Struktur Direktori Middleware di `backend/`

Letakkan file-file middleware di dalam folder `backend/internal/middleware/`:
```text
backend/internal/middleware/
├── auth_middleware.go   # Memvalidasi JWT & ekstrak user_id ke c.Locals
└── role_middleware.go   # Membatasi akses berdasarkan peran (RBAC)
```

---

## 3. Acuan Kode & Konfigurasi File

### 3.1 Middleware JWT: `backend/internal/middleware/auth_middleware.go`
Middleware ini bertugas membaca header `Authorization`, memvalidasi token, dan menitipkan data pengguna ke dalam `c.Locals`:

```go
package middleware

import (
	"os"
	"strings"

	"okle-shop/pkg/response"
	"okle-shop/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

// Protected adalah middleware untuk memeriksa validitas Access Token JWT
func Protected() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. Ambil header Authorization
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return response.Error(c, fiber.StatusUnauthorized, "Akses ditolak: header Authorization tidak ditemukan", nil)
		}

		// 2. Format header wajib: "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return response.Error(c, fiber.StatusUnauthorized, "Format token tidak valid. Gunakan format 'Bearer <token>'", nil)
		}

		tokenString := parts[1]

		// 3. Baca kunci rahasia JWT
		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			jwtSecret = "default_fallback_secret_key"
		}

		// 4. Validasi keaslian signature dan waktu kedaluwarsa token
		claims, err := utils.ValidateToken(tokenString, jwtSecret)
		if err != nil {
			return response.Error(c, fiber.StatusUnauthorized, "Akses ditolak: token tidak valid atau telah kedaluwarsa", nil)
		}

		// 5. Titipkan identitas user ke dalam Context Fiber (c.Locals)
		// Agar handler selanjutnya bisa langsung mengetahui siapa yang sedang login!
		c.Locals("user_id", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("role", claims.Role)

		// Lanjutkan ke handler berikutnya
		return c.Next()
	}
}
```

---

### 3.2 Middleware RBAC: `backend/internal/middleware/role_middleware.go`
Middleware untuk memeriksa apakah peran user cocok dengan peran yang diizinkan:

```go
package middleware

import (
	"okle-shop/pkg/response"

	"github.com/gofiber/fiber/v2"
)

// RequireRoles membatasi akses endpoint hanya untuk role tertentu (misal: "ADMIN")
func RequireRoles(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Ambil role yang sebelumnya sudah disimpan oleh Protected middleware
		userRole, ok := c.Locals("role").(string)
		if !ok || userRole == "" {
			return response.Error(c, fiber.StatusUnauthorized, "Sesi login tidak teridentifikasi", nil)
		}

		// Periksa apakah role user ada di dalam daftar role yang diizinkan
		isAllowed := false
		for _, role := range allowedRoles {
			if userRole == role {
				isAllowed = true
				break
			}
		}

		// Jika role tidak cocok, tolak dengan 403 Forbidden!
		if !isAllowed {
			return response.Error(c, fiber.StatusForbidden, "Akses terlarang: Anda tidak memiliki hak akses untuk fitur ini", nil)
		}

		return c.Next()
	}
}
```

---

### 3.3 Handler Pengujian Profil (`GetMe`): `backend/internal/handler/auth_handler.go`
Buka file `auth_handler.go` dan tambahkan fungsi `GetMe` untuk mengambil data user yang sedang login:

```go
// Tambahkan di dalam auth_handler.go:

// GetMe mengambil data profil pengguna yang sedang login saat ini (Protected Route)
func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	// Ambil user_id dari c.Locals yang dititipkan oleh Protected middleware
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return response.Error(c, fiber.StatusUnauthorized, "Identitas pengguna tidak valid", nil)
	}

	// Panggil service atau repository untuk mengambil data user
	// (Untuk pengujian cepat, kita bisa langsung mengembalikan data context)
	email := c.Locals("email").(string)
	role := c.Locals("role").(string)

	data := fiber.Map{
		"user_id": userID,
		"email":   email,
		"role":    role,
	}

	return response.Success(c, fiber.StatusOK, "Berhasil mengambil profil pengguna", data)
}
```

---

### 3.4 Daftarkan Rute Terproteksi di `backend/cmd/api/main.go`
Perbarui konfigurasi rute di `main.go` untuk menerapkan middleware:

```go
// Tambahkan import middleware di atas main.go:
// "okle-shop/internal/middleware"

// Di dalam func main():

// Auth Routes Group
authGroup := api.Group("/auth")
authGroup.Post("/register", authHandler.Register)
authGroup.Post("/login", authHandler.Login)

// Rute Privat (Wajib Login / JWT Valid):
authGroup.Get("/me", middleware.Protected(), authHandler.GetMe)

// Rute Khusus Admin (Wajib Login DAN Wajib Role ADMIN):
adminGroup := api.Group("/admin", middleware.Protected(), middleware.RequireRoles("ADMIN"))
adminGroup.Get("/dashboard", func(c *fiber.Ctx) error {
	return response.Success(c, fiber.StatusOK, "Selamat datang di Panel Admin Rahasia Okle Shop!", fiber.Map{
		"total_revenue": 50000000,
		"total_orders":  120,
	})
})
```

---

## 4. Cara Pengujian & Verifikasi Tingkat Keamanan

Nyalakan server (`go run cmd/api/main.go`), lalu lakukan 4 skenario uji coba berikut:

### Test 1: Coba Akses Rute Privat TANPA Token (HTTP 401 Unauthorized)
```powershell
curl -X GET http://localhost:8000/api/v1/auth/me
```
*Hasil:* Respon `401 Unauthorized` dengan pesan `"Akses ditolak: header Authorization tidak ditemukan"`.

---

### Test 2: Akses Rute Privat DENGAN Token (HTTP 200 OK)
1. Salin `access_token` hasil login Hari 13.
2. Kirim request dengan header `Authorization`:
```powershell
curl -X GET http://localhost:8000/api/v1/auth/me `
  -H "Authorization: Bearer MASUKKAN_ACCESS_TOKEN_ANDA_DI_SINI"
```
*Hasil:* Respon `200 OK` memuat `user_id`, `email`, dan `role: "CUSTOMER"`.

---

### Test 3: Akun CUSTOMER Mencoba Masuk ke Panel Admin (HTTP 403 Forbidden)
Gunakan token akun Customer biasa di atas untuk mencoba mengakses dashboard admin:
```powershell
curl -X GET http://localhost:8000/api/v1/admin/dashboard `
  -H "Authorization: Bearer MASUKKAN_ACCESS_TOKEN_CUSTOMER"
```
*Hasil:* **`403 Forbidden`** dengan pesan: `"Akses terlarang: Anda tidak memiliki hak akses untuk fitur ini"`.  
*(Sistem RBAC berhasil memblokir user biasa!)*

---

### Test 4: Masuk ke Panel Admin Menggunakan Akun ADMIN (HTTP 200 OK)
1. Ubah role user Anda di database menjadi `ADMIN`:
   ```powershell
   docker exec -it okle_mysql_dev mysql -u okle_user -pokle_password123 okle_shop_dev -e "UPDATE users SET role = 'ADMIN' WHERE id = 1;"
   ```
2. Login kembali via `POST /api/v1/auth/login` untuk mendapatkan token baru dengan role `ADMIN`.
3. Akses kembali endpoint admin dengan token baru:
   ```powershell
   curl -X GET http://localhost:8000/api/v1/admin/dashboard `
     -H "Authorization: Bearer MASUKKAN_ACCESS_TOKEN_ADMIN_BARU"
   ```
*Hasil:* **`200 OK`**! Dashboard admin rahasia berhasil terbuka!

---

## 5. Kesimpulan Hari 14 & Langkah Menuju Hari 15
- **Hari 14 (Middleware JWT Auth & RBAC): SELESAI ✅**
- **Hari 15 (Selanjutnya):** Endpoint Refresh Token (`POST /api/v1/auth/refresh`) dan Endpoint Logout untuk revokasi token sesi.
