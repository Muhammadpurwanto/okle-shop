# Dokumen Strategi Migrasi Database & GORM Model (Hari 6)
**Aplikasi:** Okle Shop (E-Commerce Platform)  
**Teknologi:** Golang 1.22+, GORM v1.25+, `gorm.Model` Bawaan  
**Status:** Disetujui (Hari 6 Selesai)  
**Terakhir Diperbarui:** 2026-09-29  

---

## 1. Konsep `gorm.Model` Bawaan

GORM menyediakan struct bawaan bernama **`gorm.Model`** yang dirancang untuk langsung di-embed (*embedded struct*) ke dalam setiap entitas model.

Definisi internal `gorm.Model` di dalam library GORM adalah:
```go
package gorm

import "time"

type Model struct {
    ID        uint           `gorm:"primarykey"`
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt DeletedAt      `gorm:"index"`
}
```

### Keuntungan Menggunakan `gorm.Model`:
1. **Lebih Ringkas & Standar:** Tidak perlu membuat file `base.go` terpisah. Cukup panggil `gorm.Model` di baris pertama setiap struct.
2. **Ekosistem GORM 100% Native:** Semua fitur otomatisasi GORM seperti *Soft Delete* (`DeletedAt`), pengisian otomatis waktu (`CreatedAt`, `UpdatedAt`), dan auto-increment ID langsung aktif secara alami.
3. **Foreign Key Konsisten:** Semua foreign key (seperti `user_id`, `product_id`, `category_id`) cukup menggunakan tipe **`uint`**.

---

## 2. Struktur Direktori Model di `backend/`

Karena menggunakan `gorm.Model`, kita tidak membutuhkan `base.go`. Struktur foldernya menjadi lebih ramping:

```text
backend/internal/model/
├── user.go        # User & Address entity
├── category.go    # Category entity
├── product.go     # Product, ProductImage, ProductVariant
├── cart.go        # Cart & CartItem
├── voucher.go     # Voucher entity
├── order.go       # Order & OrderItem
└── payment.go     # Payment entity
```

---

## 3. Acuan Kode / Script Implementasi

### 3.1 File `backend/internal/model/user.go`
```go
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
```

---

### 3.2 File `backend/internal/model/product.go`
```go
package model

import "gorm.io/gorm"

type Category struct {
	gorm.Model
	ParentID *uint     `gorm:"index" json:"parent_id,omitempty"`
	Name     string    `gorm:"type:varchar(100);not null" json:"name"`
	Slug     string    `gorm:"type:varchar(120);uniqueIndex;not null" json:"slug"`
	IconURL  string    `gorm:"type:varchar(255)" json:"icon_url"`
	Products []Product `gorm:"foreignKey:CategoryID;constraint:OnDelete:RESTRICT" json:"products,omitempty"`
}

type Product struct {
	gorm.Model
	CategoryID  uint             `gorm:"not null;index:idx_products_cat_active_created,priority:1" json:"category_id"`
	Category    Category         `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Name        string           `gorm:"type:varchar(200);not null" json:"name"`
	Slug        string           `gorm:"type:varchar(220);uniqueIndex;not null" json:"slug"`
	Description string           `gorm:"type:text" json:"description"`
	IsActive    bool             `gorm:"default:true;index:idx_products_cat_active_created,priority:2" json:"is_active"`
	Images      []ProductImage   `gorm:"foreignKey:ProductID;constraint:OnDelete:CASCADE" json:"images,omitempty"`
	Variants    []ProductVariant `gorm:"foreignKey:ProductID;constraint:OnDelete:CASCADE" json:"variants,omitempty"`
}

type ProductImage struct {
	gorm.Model
	ProductID uint   `gorm:"not null;index" json:"product_id"`
	ImageURL  string `gorm:"type:varchar(255);not null" json:"image_url"`
	IsPrimary bool   `gorm:"default:false" json:"is_primary"`
}

// ProductVariant mewakili varian 1-level (misal: "Merah", "Hitam", "Size XL")
type ProductVariant struct {
	gorm.Model
	ProductID   uint    `gorm:"not null;index:idx_variants_product_stock" json:"product_id"`
	VariantName string  `gorm:"type:varchar(50);not null" json:"variant_name"`
	SKU         string  `gorm:"type:varchar(50);uniqueIndex;not null" json:"sku"`
	Price       float64 `gorm:"type:decimal(12,2);not null" json:"price"`
	Stock       int     `gorm:"default:0;index:idx_variants_product_stock" json:"stock"`
	WeightGrams int     `gorm:"default:0" json:"weight_grams"`
}
```

---

### 3.3 File `backend/cmd/migrate/main.go` (Migration CLI Runner)

```go
package main

import (
	"log"
	"os"

	"okle-shop/internal/model"
	"okle-shop/pkg/database"

	"github.com/joho/godotenv"
)

func main() {
	// Muat konfigurasi env
	_ = godotenv.Load("../../.env")
	if err := godotenv.Load(); err != nil {
		_ = godotenv.Load(".env")
	}

	cfg := database.Config{
		Host:     os.Getenv("DB_HOST"),
		Port:     os.Getenv("DB_PORT"),
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASSWORD"),
		DBName:   os.Getenv("DB_NAME"),
		AppEnv:   "development",
	}

	db, err := database.InitMySQL(cfg)
	if err != nil {
		log.Fatalf("❌ Gagal terhubung ke database: %v", err)
	}

	log.Println("🚀 Memulai proses GORM AutoMigrate dengan gorm.Model...")

	// Sinkronisasi seluruh entitas ke MySQL
	err = db.AutoMigrate(
		&model.User{},
		&model.Address{},
		&model.Category{},
		&model.Product{},
		&model.ProductImage{},
		&model.ProductVariant{},
	)
	if err != nil {
		log.Fatalf("❌ GORM AutoMigrate gagal: %v", err)
	}

	log.Println("✅ GORM AutoMigrate BERHASIL! Seluruh tabel berbasis gorm.Model telah siap.")
}
```

---

## 4. Cara Menjalankan & Verifikasi

1. Pastikan Docker MySQL Anda menyala:
   ```powershell
   docker compose -f docker-compose.dev.yml --env-file .env up -d
   ```
2. Dari folder `backend/`, jalankan script migrasi Go:
   ```powershell
   go run cmd/migrate/main.go
   ```
3. Periksa langsung ke container MySQL lewat terminal:
   ```powershell
   docker exec -it okle_mysql_dev mysql -u okle_user -pokle_password123 okle_shop_dev -e "DESCRIBE users;"
   ```
   *Anda akan melihat kolom `id`, `created_at`, `updated_at`, dan `deleted_at` otomatis tercipta dari `gorm.Model`.*

---

## 5. Kesimpulan Hari 6 & Langkah Menuju Hari 7
- **Hari 6 (Model Entitas berbasis `gorm.Model` & CLI Migrasi): SELESAI ✅**
- **Hari 7 (Selanjutnya):** Backend Scaffolding: Setup Golang Fiber, Clean Architecture (`handler`, `service`, `repository`), Central Error Handler, Custom Recovery Middleware, CORS, dan Response Formatter.
