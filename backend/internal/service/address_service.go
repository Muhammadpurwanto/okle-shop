package service

import (
	"errors"
	"fmt"
	"okle-shop/internal/dto"
	"okle-shop/internal/model"
	"okle-shop/internal/repository"
)

type AddressService interface {
	Create(userID uint, req dto.CreateAddressRequest) (*dto.AddressResponse, error)
	GetAllByUserID(userID uint) ([]dto.AddressResponse, error)
	GetByID(id uint, userID uint) (*dto.AddressResponse, error)
	Update(id uint, userID uint, req dto.UpdateAddressRequest) (*dto.AddressResponse, error)
	Delete(id uint, userID uint) error
	SetDefault(id uint, userID uint) error
}

type addressService struct {
	addressRepo repository.AddressRepository
}

func NewAddressService(addressRepo repository.AddressRepository) AddressService {
	return &addressService{addressRepo: addressRepo}
}

// Create memproses pembuatan alamat baru dan langsung mengembalikan DTO
func (s *addressService) Create(userID uint, req dto.CreateAddressRequest) (*dto.AddressResponse, error) {
	// Cek jumlah alamat saat ini
	count, err := s.addressRepo.CountByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("gagal memeriksa jumlah alamat: %w", err)
	}

	// Aturan Bisnis: Jika ini alamat pertama, otomatis wajib menjadi is_default = true
	isDefault := req.IsDefault
	if count == 0 {
		isDefault = true
	}

	address := model.Address{
		UserID:        userID,
		RecipientName: req.RecipientName,
		PhoneNumber:   req.PhoneNumber,
		StreetAddress: req.StreetAddress,
		CityName:      req.CityName,
		ProvinceName:  req.ProvinceName,
		PostalCode:    req.PostalCode,
		IsDefault:     isDefault,
	}

	if err := s.addressRepo.Create(&address); err != nil {
		return nil, fmt.Errorf("gagal menyimpan alamat: %w", err)
	}

	return &dto.AddressResponse{
		ID:            address.ID,
		UserID:        address.UserID,
		RecipientName: address.RecipientName,
		PhoneNumber:   address.PhoneNumber,
		StreetAddress: address.StreetAddress,
		CityName:      address.CityName,
		ProvinceName:  address.ProvinceName,
		PostalCode:    address.PostalCode,
		IsDefault:     address.IsDefault,
		CreatedAt:     address.CreatedAt,
		UpdatedAt:     address.UpdatedAt,
	}, nil
}

// GetAllByUserID mengambil seluruh alamat milik pengguna yang sedang login
func (s *addressService) GetAllByUserID(userID uint) ([]dto.AddressResponse, error) {
	addresses, err := s.addressRepo.FindByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil daftar alamat: %w", err)
	}

	response := make([]dto.AddressResponse, len(addresses))
	for i, addr := range addresses {
		response[i] = dto.AddressResponse{
			ID:            addr.ID,
			UserID:        addr.UserID,
			RecipientName: addr.RecipientName,
			PhoneNumber:   addr.PhoneNumber,
			StreetAddress: addr.StreetAddress,
			CityName:      addr.CityName,
			ProvinceName:  addr.ProvinceName,
			PostalCode:    addr.PostalCode,
			IsDefault:     addr.IsDefault,
			CreatedAt:     addr.CreatedAt,
			UpdatedAt:     addr.UpdatedAt,
		}
	}

	return response, nil
}

// GetByID mengambil detail alamat spesifik milik pengguna (Aman dari IDOR)
func (s *addressService) GetByID(id uint, userID uint) (*dto.AddressResponse, error) {
	address, err := s.addressRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil alamat: %w", err)
	}
	if address == nil {
		return nil, errors.New("alamat tidak ditemukan")
	}

	return &dto.AddressResponse{
		ID:            address.ID,
		UserID:        address.UserID,
		RecipientName: address.RecipientName,
		PhoneNumber:   address.PhoneNumber,
		StreetAddress: address.StreetAddress,
		CityName:      address.CityName,
		ProvinceName:  address.ProvinceName,
		PostalCode:    address.PostalCode,
		IsDefault:     address.IsDefault,
		CreatedAt:     address.CreatedAt,
		UpdatedAt:     address.UpdatedAt,
	}, nil
}

// Update memperbarui data alamat
func (s *addressService) Update(id uint, userID uint, req dto.UpdateAddressRequest) (*dto.AddressResponse, error) {
	address, err := s.addressRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		return nil, fmt.Errorf("gagal mencari alamat: %w", err)
	}
	if address == nil {
		return nil, errors.New("alamat tidak ditemukan")
	}

	// Jika alamat ini satu-satunya alamat user, paksa is_default tetap true
	count, _ := s.addressRepo.CountByUserID(userID)
	isDefault := req.IsDefault
	if count <= 1 {
		isDefault = true
	}

	address.RecipientName = req.RecipientName
	address.PhoneNumber = req.PhoneNumber
	address.StreetAddress = req.StreetAddress
	address.CityName = req.CityName
	address.ProvinceName = req.ProvinceName
	address.PostalCode = req.PostalCode
	address.IsDefault = isDefault

	if err := s.addressRepo.Update(address); err != nil {
		return nil, fmt.Errorf("gagal memperbarui alamat: %w", err)
	}

	return &dto.AddressResponse{
		ID:            address.ID,
		UserID:        address.UserID,
		RecipientName: address.RecipientName,
		PhoneNumber:   address.PhoneNumber,
		StreetAddress: address.StreetAddress,
		CityName:      address.CityName,
		ProvinceName:  address.ProvinceName,
		PostalCode:    address.PostalCode,
		IsDefault:     address.IsDefault,
		CreatedAt:     address.CreatedAt,
		UpdatedAt:     address.UpdatedAt,
	}, nil
}

// Delete menghapus alamat
func (s *addressService) Delete(id uint, userID uint) error {
	address, err := s.addressRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		return fmt.Errorf("gagal memeriksa alamat: %w", err)
	}
	if address == nil {
		return errors.New("alamat tidak ditemukan")
	}

	if err := s.addressRepo.Delete(id, userID); err != nil {
		return fmt.Errorf("gagal menghapus alamat: %w", err)
	}

	return nil
}

// SetDefault menetapkan alamat sebagai alamat utama
func (s *addressService) SetDefault(id uint, userID uint) error {
	address, err := s.addressRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		return fmt.Errorf("gagal memeriksa alamat: %w", err)
	}
	if address == nil {
		return errors.New("alamat tidak ditemukan")
	}

	if err := s.addressRepo.SetDefault(id, userID); err != nil {
		return fmt.Errorf("gagal menetapkan alamat utama: %w", err)
	}

	return nil
}