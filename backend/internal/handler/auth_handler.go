package handler

import (
	"okle-shop/internal/dto"
	"okle-shop/internal/service"
	"okle-shop/pkg/response"
	"okle-shop/pkg/validator"

	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Register menangani endpoint POST /api/v1/auth/register
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req dto.RegisterRequest

	// 1. Parsing JSON request body
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Format JSON tidak valid", nil)
	}

	// 2. Validasi input request
	if validationErrors := validator.ValidateStruct(req); len(validationErrors) > 0 {
		return response.Error(c, fiber.StatusBadRequest, "Validasi input gagal", validationErrors)
	}

	// 3. Panggil business service
	userResponse, err := h.authService.Register(req)
	if err != nil {
		// Jika error karena email duplikat
		if err.Error() == "email sudah terdaftar, gunakan email lain" {
			return response.Error(c, fiber.StatusConflict, err.Error(), nil)
		}
		// Error internal lainnya
		return response.Error(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	// 4. Kembalikan response sukses 201 Created
	return response.Success(c, fiber.StatusCreated, "Registrasi berhasil", userResponse)
}
// Login menangani endpoint POST /api/v1/auth/login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req dto.LoginRequest

	// 1. Parsing JSON request body
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Format JSON tidak valid", nil)
	}

	// 2. Validasi input request (email & password wajib diisi)
	if validationErrors := validator.ValidateStruct(req); len(validationErrors) > 0 {
		return response.Error(c, fiber.StatusBadRequest, "Validasi input gagal", validationErrors)
	}

	// 3. Panggil business service
	loginResponse, err := h.authService.Login(req)
	if err != nil {
		if err.Error() == "email atau password salah" {
			return response.Error(c, fiber.StatusUnauthorized, err.Error(), nil)
		}
		return response.Error(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	// 4. Kembalikan response sukses 200 OK beserta Token
	return response.Success(c, fiber.StatusOK, "Login berhasil", loginResponse)
}
// GetMe mengambil data profil pengguna yang sedang login saat ini (Protected Route)
func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return response.Error(c, fiber.StatusUnauthorized, "Identitas pengguna tidak valid", nil)
	}

	profile, err := h.authService.GetProfile(userID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Berhasil mengambil profil pengguna", profile)
}

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

// ForgotPassword menangani endpoint POST /api/v1/auth/forgot-password
func (h *AuthHandler) ForgotPassword(c *fiber.Ctx) error {
	var req dto.ForgotPasswordRequest

	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Format JSON tidak valid", nil)
	}

	if validationErrors := validator.ValidateStruct(req); len(validationErrors) > 0 {
		return response.Error(c, fiber.StatusBadRequest, "Validasi input gagal", validationErrors)
	}

	token, err := h.authService.ForgotPassword(req)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	// Mengembalikan reset_token (sangat berguna untuk pengujian lokal langsung di browser)
	return response.Success(c, fiber.StatusOK, "Jika email terdaftar, instruksi pemulihan telah dikirim", fiber.Map{
		"reset_token": token,
	})
}

// ResetPassword menangani endpoint POST /api/v1/auth/reset-password
func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	var req dto.ResetPasswordRequest

	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Format JSON tidak valid", nil)
	}

	if validationErrors := validator.ValidateStruct(req); len(validationErrors) > 0 {
		return response.Error(c, fiber.StatusBadRequest, "Validasi input gagal", validationErrors)
	}

	if err := h.authService.ResetPassword(req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru Anda.", nil)
}

// UpdateProfile menangani endpoint PUT /api/v1/auth/profile
func (h *AuthHandler) UpdateProfile(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return response.Error(c, fiber.StatusUnauthorized, "Sesi tidak valid", nil)
	}

	var req dto.UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Format JSON tidak valid", nil)
	}

	if validationErrors := validator.ValidateStruct(req); len(validationErrors) > 0 {
		return response.Error(c, fiber.StatusBadRequest, "Validasi input gagal", validationErrors)
	}

	updatedUser, err := h.authService.UpdateProfile(userID, req)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Profil berhasil diperbarui", updatedUser)
}

// ChangePassword menangani endpoint PUT /api/v1/auth/change-password
func (h *AuthHandler) ChangePassword(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return response.Error(c, fiber.StatusUnauthorized, "Sesi tidak valid", nil)
	}

	var req dto.ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Format JSON tidak valid", nil)
	}

	if validationErrors := validator.ValidateStruct(req); len(validationErrors) > 0 {
		return response.Error(c, fiber.StatusBadRequest, "Validasi input gagal", validationErrors)
	}

	if err := h.authService.ChangePassword(userID, req); err != nil {
		if err.Error() == "kata sandi saat ini tidak cocok" {
			return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
		}
		return response.Error(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Kata sandi berhasil diperbarui", nil)
}