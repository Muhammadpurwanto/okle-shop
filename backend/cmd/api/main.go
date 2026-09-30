package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"okle-shop/internal/handler"
	"okle-shop/pkg/database"
	"okle-shop/pkg/response"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
)

func main() {
	// 1. Muat environment variable
	_ = godotenv.Load("../../.env")
	if err := godotenv.Load(); err != nil {
		_ = godotenv.Load(".env")
	}

	// 2. Inisialisasi Database MySQL
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
		log.Fatalf("❌ Database connection failed: %v", err)
	}

	// 3. Inisialisasi Fiber App dengan Custom Error Handler
	app := fiber.New(fiber.Config{
		ErrorHandler: response.CustomErrorHandler,
		AppName:      "Okle Shop API v1",
	})

	// 4. Pasang Global Middlewares
	app.Use(recover.New()) // Mencegah crash jika terjadi panic
	app.Use(logger.New(logger.Config{
		Format:     "[${time}] ${status} - ${latency} | ${method} ${path}\n",
		TimeFormat: "15:04:05",
		TimeZone:   "Local",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173, http://localhost:3000",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
	}))

	// 5. Setup Routing
	api := app.Group("/api/v1")
	healthHandler := handler.NewHealthHandler(db)
	api.Get("/health", healthHandler.Check)

	// 6. Graceful Shutdown Listener
	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8000"
	}

	go func() {
		addr := fmt.Sprintf(":%s", port)
		log.Printf("🚀 Server Okle Shop berjalan di http://localhost%s\n", addr)
		if err := app.Listen(addr); err != nil {
			log.Printf("Server stopped: %v\n", err)
		}
	}()

	// Menunggu sinyal interrupt (Ctrl+C atau kill)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("⏳ Mematikan server secara tertib (graceful shutdown)...")
	_ = app.ShutdownWithTimeout(5 * time.Second)
	log.Println("👋 Server berhasil berhenti dengan aman.")
}