package service

import (
	"errors"
	"fmt"
	"okle-shop/internal/dto"
	"okle-shop/internal/model"
	"okle-shop/internal/repository"
	"okle-shop/pkg/utils"
	"os"
	"strconv"
	"time"
)

type AuthService interface {
	Register(req dto.RegisterRequest) (*dto.UserResponse, error)
	Login(req dto.LoginRequest) (*dto.LoginResponse, error)
	RefreshToken(req dto.RefreshTokenRequest) (*dto.RefreshTokenResponse, error)
	ForgotPassword(req dto.ForgotPasswordRequest) (string, error)
	ResetPassword(req dto.ResetPasswordRequest) error
	GetProfile(userID uint) (*dto.UserResponse, error)
	UpdateProfile(userID uint, req dto.UpdateProfileRequest) (*dto.UserResponse, error)
	ChangePassword(userID uint, req dto.ChangePasswordRequest) error
}

type authService struct {
	userRepo repository.UserRepository
}

func NewAuthService(userRepo repository.UserRepository) AuthService {
	return &authService{userRepo: userRepo}
}

// Register menangani alur pendaftaran user baru
func (s *authService) Register(req dto.RegisterRequest) (*dto.UserResponse, error) {
	// 1. Validasi Bisnis: Cek apakah email sudah dipakai
	exists, err := s.userRepo.IsEmailExist(req.Email)
	if err != nil {
		return nil, fmt.Errorf("gagal memeriksa ketersediaan email: %w", err)
	}
	if exists {
		return nil, errors.New("email sudah terdaftar, gunakan email lain")
	}

	// 2. Enkripsi password menggunakan bcrypt
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// 3. Siapkan entity model User dengan role default CUSTOMER
	user := model.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: hashedPassword,
		Phone:        req.Phone,
		Role:         model.RoleCustomer,
	}

	// 4. Simpan ke database melalui repository
	if err := s.userRepo.Create(&user); err != nil {
		return nil, fmt.Errorf("gagal menyimpan data user: %w", err)
	}

	// 5. Kembalikan data profil aman (UserResponse tanpa password_hash)
	response := &dto.UserResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Phone:     user.Phone,
		Role:      string(user.Role),
		CreatedAt: user.CreatedAt,
	}

	return response, nil
}

// Login memverifikasi email dan password lalu menerbitkan Access & Refresh Token
func (s *authService) Login(req dto.LoginRequest) (*dto.LoginResponse, error) {
	// 1. Cari user berdasarkan email
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, fmt.Errorf("gagal memproses data login: %w", err)
	}
	if user == nil {
		return nil, errors.New("email atau password salah")
	}

	// 2. Verifikasi password hash bcrypt
	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		return nil, errors.New("email atau password salah")
	}

	// 3. Baca konfigurasi JWT dari environment variable
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("konfigurasi JWT_SECRET tidak valid atau belum diatur di .env")
	}

	// 3. Baca konfigurasi masa berlaku token (Fail-Fast)
	accessMinutes, err := strconv.Atoi(os.Getenv("JWT_ACCESS_DURATION_MINUTES"))
	if err != nil || accessMinutes <= 0 {
		return nil, fmt.Errorf("konfigurasi JWT_ACCESS_DURATION_MINUTES tidak valid atau belum diatur di .env")
	}
	refreshDays, err := strconv.Atoi(os.Getenv("JWT_REFRESH_DURATION_DAYS"))
	if err != nil || refreshDays <= 0 {
		return nil, fmt.Errorf("konfigurasi JWT_REFRESH_DURATION_DAYS tidak valid atau belum diatur di .env")
	}

	// 4. Generate Access Token (Durasi Pendek)
	accessToken, err := utils.GenerateToken(
		user.ID,
		user.Email,
		string(user.Role),
		jwtSecret,
		time.Duration(accessMinutes)*time.Minute,
	)
	if err != nil {
		return nil, err
	}

	// 5. Generate Refresh Token (Durasi Panjang)
	refreshToken, err := utils.GenerateToken(
		user.ID,
		user.Email,
		string(user.Role),
		jwtSecret,
		time.Duration(refreshDays)*24*time.Hour,
	)
	if err != nil {
		return nil, err
	}

	// 6. Susun response sukses
	response := &dto.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: dto.UserResponse{
			ID:        user.ID,
			Name:      user.Name,
			Email:     user.Email,
			Phone:     user.Phone,
			Role:      string(user.Role),
			CreatedAt: user.CreatedAt,
		},
	}

	return response, nil
}

// RefreshToken memvalidasi Refresh Token lama dan menerbitkan token baru
func (s *authService) RefreshToken(req dto.RefreshTokenRequest) (*dto.RefreshTokenResponse, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "default_fallback_secret_key"
	}

	// 1. Validasi keaslian signature dan masa kedaluwarsa Refresh Token
	claims, err := utils.ValidateToken(req.RefreshToken, jwtSecret)
	if err != nil {
		return nil, errors.New("refresh token tidak valid atau telah kedaluwarsa")
	}

	// 2. Verifikasi ke database: Pastikan akun pengguna masih aktif dan belum dihapus
	user, err := s.userRepo.FindByID(claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("gagal memverifikasi data akun: %w", err)
	}
	if user == nil {
		return nil, errors.New("pengguna tidak ditemukan atau akun telah dinonaktifkan")
	}

	// 3. Baca konfigurasi masa berlaku token (Fail-Fast)
	accessMinutes, err := strconv.Atoi(os.Getenv("JWT_ACCESS_DURATION_MINUTES"))
	if err != nil || accessMinutes <= 0 {
		return nil, fmt.Errorf("konfigurasi JWT_ACCESS_DURATION_MINUTES tidak valid atau belum diatur di .env")
	}
	refreshDays, err := strconv.Atoi(os.Getenv("JWT_REFRESH_DURATION_DAYS"))
	if err != nil || refreshDays <= 0 {
		return nil, fmt.Errorf("konfigurasi JWT_REFRESH_DURATION_DAYS tidak valid atau belum diatur di .env")
	}

	// 4. Buat Access Token baru
	newAccessToken, err := utils.GenerateToken(
		user.ID,
		user.Email,
		string(user.Role),
		jwtSecret,
		time.Duration(accessMinutes)*time.Minute,
	)
	if err != nil {
		return nil, err
	}

	// 5. Buat Refresh Token baru (Refresh Token Rotation untuk keamanan maksimal)
	newRefreshToken, err := utils.GenerateToken(
		user.ID,
		user.Email,
		string(user.Role),
		jwtSecret,
		time.Duration(refreshDays)*24*time.Hour,
	)
	if err != nil {
		return nil, err
	}

	return &dto.RefreshTokenResponse{
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

// ForgotPassword membuat token reset berdurasi 15 menit
func (s *authService) ForgotPassword(req dto.ForgotPasswordRequest) (string, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return "", fmt.Errorf("konfigurasi JWT_SECRET belum diatur di .env")
	}

	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return "", fmt.Errorf("gagal memproses permintaan reset: %w", err)
	}

	// Prinsip OWASP: Jika user tidak ditemukan, jangan lempar error agar tidak membocorkan keberadaan email
	if user == nil {
		return "", nil
	}

	// Terbitkan token khusus reset password dengan masa berlaku 15 menit
	resetToken, err := utils.GenerateToken(
		user.ID,
		user.Email,
		"PASSWORD_RESET",
		jwtSecret,
		15*time.Minute,
	)
	if err != nil {
		return "", fmt.Errorf("gagal membuat token pemulihan: %w", err)
	}

	return resetToken, nil
}

// ResetPassword memverifikasi token dan mengubah password user
func (s *authService) ResetPassword(req dto.ResetPasswordRequest) error {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return fmt.Errorf("konfigurasi JWT_SECRET belum diatur di .env")
	}

	// 1. Validasi token JWT
	claims, err := utils.ValidateToken(req.Token, jwtSecret)
	if err != nil {
		return errors.New("token pemulihan tidak valid atau telah kedaluwarsa")
	}

	// 2. Pastikan role token benar-benar PASSWORD_RESET
	if claims.Role != "PASSWORD_RESET" {
		return errors.New("tipe token tidak sah untuk pemulihan kata sandi")
	}

	// 3. Hash password baru dengan bcrypt
	hashedPassword, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	// 4. Update di database
	if err := s.userRepo.UpdatePassword(claims.UserID, hashedPassword); err != nil {
		return fmt.Errorf("gagal memperbarui kata sandi: %w", err)
	}

	return nil
}
// GetProfile mengambil data profil lengkap dari database
func (s *authService) GetProfile(userID uint) (*dto.UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil profil: %w", err)
	}
	if user == nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}

	return &dto.UserResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Phone:     user.Phone,
		Role:      string(user.Role),
		CreatedAt: user.CreatedAt,
	}, nil
}

// UpdateProfile memperbarui data nama dan nomor telepon pengguna
func (s *authService) UpdateProfile(userID uint, req dto.UpdateProfileRequest) (*dto.UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, fmt.Errorf("gagal mencari pengguna: %w", err)
	}
	if user == nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}

	if err := s.userRepo.UpdateProfile(userID, req.Name, req.Phone); err != nil {
		return nil, fmt.Errorf("gagal memperbarui profil: %w", err)
	}

	return &dto.UserResponse{
		ID:        user.ID,
		Name:      req.Name,
		Email:     user.Email,
		Phone:     req.Phone,
		Role:      string(user.Role),
		CreatedAt: user.CreatedAt,
	}, nil
}

// ChangePassword memverifikasi kata sandi lama lalu memperbarui ke kata sandi baru
func (s *authService) ChangePassword(userID uint, req dto.ChangePasswordRequest) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return fmt.Errorf("gagal mencari data pengguna: %w", err)
	}
	if user == nil {
		return errors.New("pengguna tidak ditemukan")
	}

	// 1. Verifikasi kecocokan kata sandi lama dengan bcrypt
	if !utils.CheckPasswordHash(req.OldPassword, user.PasswordHash) {
		return errors.New("kata sandi saat ini tidak cocok")
	}

	// 2. Hash kata sandi baru
	newHash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	// 3. Simpan kata sandi baru ke database
	if err := s.userRepo.UpdatePassword(userID, newHash); err != nil {
		return fmt.Errorf("gagal memperbarui kata sandi: %w", err)
	}

	return nil
}