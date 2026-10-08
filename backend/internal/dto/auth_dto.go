package dto

import "time"

// RegisterRequest mendefinisikan payload JSON yang diterima saat user registrasi
type RegisterRequest struct {
	Name     string `json:"name" validate:"required,min=3,max=100"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,max=100"`
	Phone    string `json:"phone" validate:"omitempty,min=10,max=15"`
}

// LoginRequest mendefinisikan payload JSON saat login
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// UserResponse adalah format aman data profil user yang dikembalikan ke Frontend
// (Tidak pernah membocorkan password_hash)
type UserResponse struct {
	ID        uint      `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

// LoginResponse mengembalikan token JWT dan profil user
type LoginResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         UserResponse `json:"user"`
}

// RefreshTokenRequest mendefinisikan payload untuk meminta token baru
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// RefreshTokenResponse mengembalikan token baru setelah refresh berhasil
type RefreshTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// ForgotPasswordRequest payload untuk meminta link pemulihan kata sandi
type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// ResetPasswordRequest payload untuk mengubah kata sandi menggunakan token
type ResetPasswordRequest struct {
	Token           string `json:"token" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8,max=100"`
	ConfirmPassword string `json:"confirm_password" validate:"required,eqfield=NewPassword"`
}

// UpdateProfileRequest payload untuk memperbarui data diri
type UpdateProfileRequest struct {
	Name  string `json:"name" validate:"required,min=3,max=100"`
	Phone string `json:"phone" validate:"required,min=10,max=15"`
}

// ChangePasswordRequest payload untuk mengganti kata sandi
type ChangePasswordRequest struct {
	OldPassword        string `json:"old_password" validate:"required"`
	NewPassword        string `json:"new_password" validate:"required,min=8,max=100"`
	ConfirmNewPassword string `json:"confirm_new_password" validate:"required,eqfield=NewPassword"`
}