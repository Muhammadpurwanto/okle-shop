package dto

import "time"

// CreateAddressRequest payload JSON untuk membuat alamat baru
type CreateAddressRequest struct {
	RecipientName string `json:"recipient_name" validate:"required,min=3,max=100"`
	PhoneNumber   string `json:"phone_number" validate:"required,min=10,max=15"`
	StreetAddress string `json:"street_address" validate:"required,min=5"`
	CityName      string `json:"city_name" validate:"required,max=100"`
	ProvinceName  string `json:"province_name" validate:"required,max=100"`
	PostalCode    string `json:"postal_code" validate:"required,min=5,max=10"`
	IsDefault     bool   `json:"is_default"`
}

// UpdateAddressRequest payload JSON untuk memperbarui alamat yang sudah ada
type UpdateAddressRequest struct {
	RecipientName string `json:"recipient_name" validate:"required,min=3,max=100"`
	PhoneNumber   string `json:"phone_number" validate:"required,min=10,max=15"`
	StreetAddress string `json:"street_address" validate:"required,min=5"`
	CityName      string `json:"city_name" validate:"required,max=100"`
	ProvinceName  string `json:"province_name" validate:"required,max=100"`
	PostalCode    string `json:"postal_code" validate:"required,min=5,max=10"`
	IsDefault     bool   `json:"is_default"`
}

// AddressResponse format data alamat yang dikembalikan ke client
type AddressResponse struct {
	ID            uint      `json:"id"`
	UserID        uint      `json:"user_id"`
	RecipientName string    `json:"recipient_name"`
	PhoneNumber   string    `json:"phone_number"`
	StreetAddress string    `json:"street_address"`
	CityName      string    `json:"city_name"`
	ProvinceName  string    `json:"province_name"`
	PostalCode    string    `json:"postal_code"`
	IsDefault     bool      `json:"is_default"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}