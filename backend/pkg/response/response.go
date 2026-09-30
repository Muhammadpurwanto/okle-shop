package response

import "github.com/gofiber/fiber/v2"

type ApiResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Errors  interface{} `json:"errors,omitempty"`
}

// Success mengirim response JSON sukses dengan data
func Success(c *fiber.Ctx, statusCode int, message string, data interface{}) error {
	return c.Status(statusCode).JSON(ApiResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Error mengirim response JSON error
func Error(c *fiber.Ctx, statusCode int, message string, errors interface{}) error {
	return c.Status(statusCode).JSON(ApiResponse{
		Success: false,
		Message: message,
		Errors:  errors,
	})
}