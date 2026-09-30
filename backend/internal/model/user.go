package model

import "gorm.io/gorm"

type UserRole string

const (
	RoleCustomer UserRole = "CUSTOMER"
	RoleAdmin    UserRole = "ADMIN"
)

type User struct {
	gorm.Model
	Name         string    `gorm:"type:varchar(100);not null" json:"name"`
	Email        string    `gorm:"type:varchar(150);uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"type:varchar(255);not null" json:"-"` // tidak pernah di-serialize ke JSON
	Phone        string    `gorm:"type:varchar(20)" json:"phone"`
	Role         UserRole  `gorm:"type:enum('CUSTOMER','ADMIN');default:'CUSTOMER';not null" json:"role"`
	Addresses    []Address `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"addresses,omitempty"`
}

type Address struct {
	gorm.Model
	UserID        uint   `gorm:"not null;index:idx_addresses_user_default" json:"user_id"`
	RecipientName string `gorm:"type:varchar(100);not null" json:"recipient_name"`
	PhoneNumber   string `gorm:"type:varchar(20);not null" json:"phone_number"`
	StreetAddress string `gorm:"type:text;not null" json:"street_address"`
	CityName      string `gorm:"type:varchar(100);not null" json:"city_name"`
	ProvinceName  string `gorm:"type:varchar(100);not null" json:"province_name"`
	PostalCode    string `gorm:"type:varchar(10);not null" json:"postal_code"`
	IsDefault     bool   `gorm:"default:false;index:idx_addresses_user_default" json:"is_default"`
}