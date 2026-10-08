package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"okle-shop/internal/handler"
	"okle-shop/internal/middleware"
	"okle-shop/internal/repository"
	"okle-shop/internal/service"
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
	_ = godotenv.Load("../.env")
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
		AppEnv:   os.Getenv("APP_ENV"),
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

	// 5. Inisialisasi Repository & Service
	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo)

	addressRepo := repository.NewAddressRepository(db)
	addressService := service.NewAddressService(addressRepo)

	// 6. Inisialisasi Handler
	healthHandler := handler.NewHealthHandler(db)
	authHandler := handler.NewAuthHandler(authService)
	addressHandler := handler.NewAddressHandler(addressService)

	// 7. Setup Routing API
	api := app.Group("/api/v1")
	api.Get("/health", healthHandler.Check)

		// Auth Group
	authGroup := api.Group("/auth")
	authGroup.Post("/register", authHandler.Register)
	authGroup.Post("/login", authHandler.Login)
	authGroup.Post("/refresh", authHandler.RefreshToken)
	authGroup.Post("/forgot-password", authHandler.ForgotPassword) // 🌟 Rute Lupa Password
	authGroup.Post("/reset-password", authHandler.ResetPassword)   // 🌟 Rute Reset Password
	// Rute Terproteksi Auth:
	authGroup.Get("/me", middleware.Protected(), authHandler.GetMe)
	authGroup.Put("/profile", middleware.Protected(), authHandler.UpdateProfile)                 // 🌟 Edit Profil
	authGroup.Put("/change-password", middleware.Protected(), authHandler.ChangePassword)       // 🌟 Ganti Password
	authGroup.Post("/logout", middleware.Protected(), authHandler.Logout)
	// Address Group (Wajib Login / Protected):
	addressGroup := api.Group("/addresses", middleware.Protected())
	addressGroup.Post("/", addressHandler.Create)
	addressGroup.Get("/", addressHandler.GetAll)
	addressGroup.Get("/:id", addressHandler.GetByID)
	addressGroup.Put("/:id", addressHandler.Update)
	addressGroup.Delete("/:id", addressHandler.Delete)
	addressGroup.Patch("/:id/default", addressHandler.SetDefault)

	// Rute Khusus Admin (Wajib Login DAN Wajib Role ADMIN):
	adminGroup := api.Group("/admin", middleware.Protected(), middleware.RequireRoles("ADMIN"))
	adminGroup.Get("/dashboard", func(c *fiber.Ctx) error {
		return response.Success(c, fiber.StatusOK, "Selamat datang di Panel Admin Rahasia Okle Shop!", fiber.Map{
			"total_revenue": 50000000,
			"total_orders":  120,
		})
	})

	// 6. Graceful Shutdown Listener
	port := os.Getenv("APP_PORT")
	if port == "" {
		log.Fatal("konfigurasi APP_PORT tidak valid atau belum diatur di .env")
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