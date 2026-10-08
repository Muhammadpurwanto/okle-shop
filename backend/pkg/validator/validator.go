package validator

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

type ValidationErrorResponse struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidateStruct memeriksa validasi struct dan mengembalikan daftar pesan error
func ValidateStruct(s interface{}) []ValidationErrorResponse {
	var errs []ValidationErrorResponse

	err := validate.Struct(s)
	if err != nil {
		for _, err := range err.(validator.ValidationErrors) {
			field := strings.ToLower(err.Field())
			var msg string

			switch err.Tag() {
			case "required":
				msg = fmt.Sprintf("%s wajib diisi", field)
			case "email":
				msg = fmt.Sprintf("%s harus berupa format email yang valid", field)
			case "min":
				msg = fmt.Sprintf("%s minimal harus %s karakter", field, err.Param())
			case "max":
				msg = fmt.Sprintf("%s maksimal %s karakter", field, err.Param())
			default:
				msg = fmt.Sprintf("%s tidak valid", field)
			}

			errs = append(errs, ValidationErrorResponse{
				Field:   field,
				Message: msg,
			})
		}
	}

	return errs
}