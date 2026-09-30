package main

import (
	"log"
	"okle-shop/pkg/database"

	"github.com/joho/godotenv"
	"os"
)

func main() {
	// Muat file .env dari root
	_ = godotenv.Load("../../.env")

	cfg := database.Config{
		Host:     os.Getenv("DB_HOST"), // localhost jika dijalankan dari laptop
		Port:     os.Getenv("DB_PORT"), // 3306
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASSWORD"),
		DBName:   os.Getenv("DB_NAME"),
		AppEnv:   "development",
	}

	db, err := database.InitMySQL(cfg)
	if err != nil {
		log.Fatalf("❌ Koneksi Gagal: %v", err)
	}

	// Coba query sederhana
	var result int
	db.Raw("SELECT 1").Scan(&result)
	log.Printf("🎉 Uji Query Berhasil! Nilai: %d", result)
}