package repository

import (
	"errors"
	"okle-shop/internal/model"

	"gorm.io/gorm"
)

type UserRepository interface {
	Create(user *model.User) error
	FindByEmail(email string) (*model.User, error)
	FindByID(id uint) (*model.User, error)
	IsEmailExist(email string) (bool, error)
	UpdatePassword(id uint, passwordHash string) error
	UpdateProfile(id uint, name string, phone string) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

// Create menyimpan data user baru ke database
func (r *userRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

// FindByEmail mencari user berdasarkan alamat email
func (r *userRepository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // user tidak ditemukan (bukan error sistem)
		}
		return nil, err
	}
	return &user, nil
}

// FindByID mencari user berdasarkan ID
func (r *userRepository) FindByID(id uint) (*model.User, error) {
	var user model.User
	err := r.db.Preload("Addresses").First(&user, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// IsEmailExist mengecek apakah email sudah terdaftar sebelumnya
func (r *userRepository) IsEmailExist(email string) (bool, error) {
	var count int64
	err := r.db.Model(&model.User{}).Where("email = ?", email).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// UpdatePassword memperbarui hash kata sandi pengguna
func (r *userRepository) UpdatePassword(id uint, passwordHash string) error {
	return r.db.Model(&model.User{}).Where("id = ?", id).Update("password_hash", passwordHash).Error
}

// UpdateProfile memperbarui nama dan nomor telepon user
func (r *userRepository) UpdateProfile(id uint, name string, phone string) error {
	return r.db.Model(&model.User{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":  name,
		"phone": phone,
	}).Error
}