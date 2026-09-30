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