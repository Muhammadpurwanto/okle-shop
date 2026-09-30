package response

import (
	"errors"
	"log"

	"github.com/gofiber/fiber/v2"
)

// CustomErrorHandler menangani seluruh unhandled error di Fiber secara terpusat
func CustomErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Terjadi kesalahan internal pada server"

	var e *fiber.Error
	if errors.As(err, &e) {
		code = e.Code
		message = e.Message
	} else {
		log.Printf("🔥 [UNHANDLED ERROR] %v\n", err)
	}

	return Error(c, code, message, nil)
}