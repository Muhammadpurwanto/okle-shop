package repository

import (
	"errors"
	"okle-shop/internal/model"

	"gorm.io/gorm"
)

type AddressRepository interface {
	Create(address *model.Address) error
	FindByUserID(userID uint) ([]model.Address, error)
	FindByIDAndUserID(id uint, userID uint) (*model.Address, error)
	Update(address *model.Address) error
	Delete(id uint, userID uint) error
	SetDefault(id uint, userID uint) error
	CountByUserID(userID uint) (int64, error)
	UnsetOtherDefaults(userID uint, tx *gorm.DB) error
	FindLatestByUserID(userID uint) (*model.Address, error)
}

type addressRepository struct {
	db *gorm.DB
}

func NewAddressRepository(db *gorm.DB) AddressRepository {
	return &addressRepository{db: db}
}

// Create menyimpan alamat baru ke database
func (r *addressRepository) Create(address *model.Address) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Jika alamat baru ditandai sebagai default, reset alamat lainnya
		if address.IsDefault {
			if err := r.UnsetOtherDefaults(address.UserID, tx); err != nil {
				return err
			}
		}
		return tx.Create(address).Error
	})
}

// FindByUserID mengambil semua alamat milik pengguna (yang default diletakkan paling atas)
func (r *addressRepository) FindByUserID(userID uint) ([]model.Address, error) {
	var addresses []model.Address
	err := r.db.Where("user_id = ?", userID).
		Order("is_default DESC, id DESC").
		Find(&addresses).Error
	return addresses, err
}

// FindByIDAndUserID mengambil alamat spesifik milik pengguna (mencegah IDOR)
func (r *addressRepository) FindByIDAndUserID(id uint, userID uint) (*model.Address, error) {
	var address model.Address
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&address).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &address, nil
}

// Update memperbarui data alamat dengan proteksi transaksi default
func (r *addressRepository) Update(address *model.Address) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if address.IsDefault {
			if err := r.UnsetOtherDefaults(address.UserID, tx); err != nil {
				return err
			}
		}
		return tx.Save(address).Error
	})
}

// Delete menghapus alamat dan jika alamat default dihapus, alihkan ke alamat tersisa
func (r *addressRepository) Delete(id uint, userID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 1. Ambil data alamat yang akan dihapus
		var address model.Address
		if err := tx.Where("id = ? AND user_id = ?", id, userID).First(&address).Error; err != nil {
			return err
		}

		// 2. Hapus alamat
		if err := tx.Delete(&address).Error; err != nil {
			return err
		}

		// 3. Jika alamat yang dihapus adalah default, pilih salah satu yang tersisa
		if address.IsDefault {
			var remaining model.Address
			err := tx.Where("user_id = ?", userID).Order("id DESC").First(&remaining).Error
			if err == nil {
				remaining.IsDefault = true
				if err := tx.Save(&remaining).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}

// SetDefault mengubah alamat tertentu menjadi alamat utama
func (r *addressRepository) SetDefault(id uint, userID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 1. Reset semua alamat user menjadi non-default
		if err := r.UnsetOtherDefaults(userID, tx); err != nil {
			return err
		}

		// 2. Jadikan alamat terpilih sebagai default
		res := tx.Model(&model.Address{}).
			Where("id = ? AND user_id = ?", id, userID).
			Update("is_default", true)

		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}

		return nil
	})
}

// CountByUserID menghitung jumlah alamat yang dimiliki seorang user
func (r *addressRepository) CountByUserID(userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&model.Address{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}

// UnsetOtherDefaults mereset semua alamat user menjadi is_default = false
func (r *addressRepository) UnsetOtherDefaults(userID uint, tx *gorm.DB) error {
	db := r.db
	if tx != nil {
		db = tx
	}
	return db.Model(&model.Address{}).
		Where("user_id = ?", userID).
		Update("is_default", false).Error
}

// FindLatestByUserID mengambil alamat terakhir milik user
func (r *addressRepository) FindLatestByUserID(userID uint) (*model.Address, error) {
	var address model.Address
	err := r.db.Where("user_id = ?", userID).Order("id DESC").First(&address).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &address, nil
}