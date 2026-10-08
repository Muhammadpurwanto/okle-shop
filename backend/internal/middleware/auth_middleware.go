package middleware

import (
	"fmt"
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
			return fmt.Errorf("konfigurasi JWT_SECRET tidak valid atau belum diatur di .env")
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