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