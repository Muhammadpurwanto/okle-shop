package handler

import (
	"okle-shop/pkg/response"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type HealthHandler struct {
	db *gorm.DB
}

func NewHealthHandler(db *gorm.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

func (h *HealthHandler) Check(c *fiber.Ctx) error {
	// Cek koneksi ping database
	sqlDB, err := h.db.DB()
	if err != nil || sqlDB.Ping() != nil {
		return response.Error(c, fiber.StatusServiceUnavailable, "Database MySQL tidak terhubung", nil)
	}

	data := fiber.Map{
		"app_name": "Okle Shop API",
		"status":   "UP & HEALTHY",
		"database": "CONNECTED",
	}

	return response.Success(c, fiber.StatusOK, "Sistem berjalan normal", data)
}