package utils

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// HashPassword mengenkripsi plain password menjadi hash bcrypt (Cost 10)
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("gagal mengenkripsi password: %w", err)
	}
	return string(bytes), nil
}

// CheckPasswordHash membandingkan plain password dengan hash yang tersimpan di DB
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}