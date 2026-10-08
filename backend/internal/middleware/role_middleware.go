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