package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	AppEnv   string // "development" atau "production"
}

// InitMySQL menginisialisasi koneksi GORM dengan Connection Pool dan Logger
func InitMySQL(cfg Config) (*gorm.DB, error) {
	// 1. Susun string DSN
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.User,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.DBName,
	)

	// 2. Tentukan Level Logger GORM
	var gormLogLevel logger.LogLevel
	if cfg.AppEnv == "production" {
		gormLogLevel = logger.Error
	} else {
		gormLogLevel = logger.Info // Mencetak seluruh query SQL dan waktu eksekusi di terminal
	}

	gormLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             200 * time.Millisecond, // Peringatan jika query > 200ms
			LogLevel:                  gormLogLevel,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	// 3. Buka Koneksi GORM
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: gormLogger,
		// Menyiapkan statement cache untuk kecepatan query berulang
		PrepareStmt: true,
	})
	if err != nil {
		return nil, fmt.Errorf("gagal membuka koneksi database: %w", err)
	}

	// 4. Konfigurasi Connection Pool pada underlying sql.DB
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil generic database object: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)
	sqlDB.SetConnMaxIdleTime(15 * time.Minute)

	// 5. Tes Ping untuk memastikan database benar-benar hidup
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("database tidak merespons ping: %w", err)
	}

	log.Println("✅ Berhasil terhubung ke database MySQL dengan GORM Connection Pool")
	return db, nil
}