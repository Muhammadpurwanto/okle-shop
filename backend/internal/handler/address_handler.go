package handler

import (
	"strconv"

	"okle-shop/internal/dto"
	"okle-shop/internal/service"
	"okle-shop/pkg/response"
	"okle-shop/pkg/validator"

	"github.com/gofiber/fiber/v2"
)

type AddressHandler struct {
	addressService service.AddressService
}

func NewAddressHandler(addressService service.AddressService) *AddressHandler {
	return &AddressHandler{addressService: addressService}
}

// Create menangani endpoint POST /api/v1/addresses
func (h *AddressHandler) Create(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return response.Error(c, fiber.StatusUnauthorized, "Sesi tidak valid", nil)
	}

	var req dto.CreateAddressRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Format JSON tidak valid", nil)
	}

	if validationErrors := validator.ValidateStruct(req); len(validationErrors) > 0 {
		return response.Error(c, fiber.StatusBadRequest, "Validasi input gagal", validationErrors)
	}

	res, err := h.addressService.Create(userID, req)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusCreated, "Alamat berhasil ditambahkan", res)
}

// GetAll menangani endpoint GET /api/v1/addresses
func (h *AddressHandler) GetAll(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return response.Error(c, fiber.StatusUnauthorized, "Sesi tidak valid", nil)
	}

	res, err := h.addressService.GetAllByUserID(userID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Berhasil mengambil daftar alamat", res)
}

// GetByID menangani endpoint GET /api/v1/addresses/:id
func (h *AddressHandler) GetByID(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return response.Error(c, fiber.StatusUnauthorized, "Sesi tidak valid", nil)
	}

	addressID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "ID alamat tidak valid", nil)
	}

	res, err := h.addressService.GetByID(uint(addressID), userID)
	if err != nil {
		if err.Error() == "alamat tidak ditemukan" {
			return response.Error(c, fiber.StatusNotFound, err.Error(), nil)
		}
		return response.Error(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Berhasil mengambil data alamat", res)
}

// Update menangani endpoint PUT /api/v1/addresses/:id
func (h *AddressHandler) Update(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return response.Error(c, fiber.StatusUnauthorized, "Sesi tidak valid", nil)
	}

	addressID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "ID alamat tidak valid", nil)
	}

	var req dto.UpdateAddressRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Format JSON tidak valid", nil)
	}

	if validationErrors := validator.ValidateStruct(req); len(validationErrors) > 0 {
		return response.Error(c, fiber.StatusBadRequest, "Validasi input gagal", validationErrors)
	}

	res, err := h.addressService.Update(uint(addressID), userID, req)
	if err != nil {
		if err.Error() == "alamat tidak ditemukan" {
			return response.Error(c, fiber.StatusNotFound, err.Error(), nil)
		}
		return response.Error(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Alamat berhasil diperbarui", res)
}

// Delete menangani endpoint DELETE /api/v1/addresses/:id
func (h *AddressHandler) Delete(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return response.Error(c, fiber.StatusUnauthorized, "Sesi tidak valid", nil)
	}

	addressID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "ID alamat tidak valid", nil)
	}

	if err := h.addressService.Delete(uint(addressID), userID); err != nil {
		if err.Error() == "alamat tidak ditemukan" {
			return response.Error(c, fiber.StatusNotFound, err.Error(), nil)
		}
		return response.Error(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Alamat berhasil dihapus", nil)
}

// SetDefault menangani endpoint PATCH /api/v1/addresses/:id/default
func (h *AddressHandler) SetDefault(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return response.Error(c, fiber.StatusUnauthorized, "Sesi tidak valid", nil)
	}

	addressID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "ID alamat tidak valid", nil)
	}

	if err := h.addressService.SetDefault(uint(addressID), userID); err != nil {
		if err.Error() == "alamat tidak ditemukan" {
			return response.Error(c, fiber.StatusNotFound, err.Error(), nil)
		}
		return response.Error(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Alamat utama berhasil diperbarui", nil)
}