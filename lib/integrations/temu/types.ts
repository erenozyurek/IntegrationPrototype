/**
 * Temu Product API Types
 * Based on official Temu OpenAPI documentation
 */

// ============================================
// API Response Wrapper
// ============================================
export interface TemuApiResponse<T> {
  success: boolean;
  errorCode?: number;
  errorMsg?: string;
  result?: T;
}

// ============================================
// Category Types (bg.local.goods.cats.get)
// ============================================
export interface TemuCategory {
  catId: number;          // Category ID
  catName: string;        // Category name
  parentId: number;       // Parent category ID (0 = root) - Temu uses parentId
  parentCatId?: number;   // Alias for compatibility
  leaf: boolean;          // Whether this is a leaf category
  catType?: number;       // 0 = Apparel, 1 = Non-Apparel
  level?: number;         // Category level (1, 2, 3, etc.)
  availableStatus?: number;
  secondHandCategory?: boolean;
  expandCatType?: number;
  children?: TemuCategory[];
  // Added by client for hierarchical display
  path?: string[];
  pathString?: string;
}

export interface TemuCategoryListResult {
  goodsCatsList: TemuCategory[];  // Actual Temu field name
  catList?: TemuCategory[];       // Alias for compatibility
}

// ============================================
// Category Template Types (bg.local.goods.template.get)
// ============================================
export interface TemuTemplateResult {
  catId: number;
  catType: number;           // 0 = Apparel, 1 = Non-Apparel
  propertyList: TemuTemplateProperty[];  // All attributes including variants
  sizeSpecId?: number;       // Size attribute spec ID if applicable
}

export interface TemuTemplateProperty {
  propertyId: number;        // Property ID
  propertyName: string;      // Property display name
  required: boolean;         // Whether required
  isSale: boolean;           // true = variant attribute, false = normal attribute
  inputType: number;         // 1=dropdown, 2=text input, 3=multi-select, etc.
  maxLength?: number;        // Maximum input length
  valueList?: TemuPropertyValue[];  // Available values for dropdown/multi-select
  templatePropertyId?: number;
  propertyType?: number;
}

export interface TemuPropertyValue {
  valueId: number;
  valueName: string;
  valueExtendInfo?: string;
}

// ============================================
// Custom Spec ID Types (bg.local.goods.spec.id.get)
// ============================================
export interface TemuSpecIdRequest {
  parentSpecId: number;      // Parent specification ID
  specValue: string;         // Custom specification value
}

export interface TemuSpecIdResult {
  specId: number;            // Generated specification ID
  specValue: string;         // The specification value
}

// ============================================
// Shipping Template Types (bg.freight.template.list.query)
// ============================================
export interface TemuShippingTemplate {
  costTemplateId: number;
  costTemplateName: string;
  templateType?: number;
  defaultTemplate?: boolean;
}

export interface TemuShippingTemplateListResult {
  templateList: TemuShippingTemplate[];
}

// ============================================
// Brand Types (temu.local.goods.brand.trademark.V2.get)
// ============================================
export interface TemuBrand {
  brandId: number;
  brandName: string;
  brandStatus?: number;
}

export interface TemuBrandListResult {
  brandList: TemuBrand[];
}

// ============================================
// Image Upload Types (bg.local.goods.image.upload)
// ============================================
export interface TemuImageUploadResult {
  url: string;               // Uploaded image URL
  width?: number;
  height?: number;
}

// ============================================
// Product Types (bg.local.goods.add)
// ============================================

// Main product request structure
export interface TemuProductRequest {
  goodsBasic: TemuGoodsBasic;
  goodsGallery: TemuGoodsGallery;
  goodsProperty?: TemuGoodsProperty;
  skuList: TemuSkuInfo[];
  certificationInfo?: TemuCertificationInfo;
  taxCodeInfo?: TemuTaxCodeInfo;
}

// Basic product information
export interface TemuGoodsBasic {
  goodsName: string;         // Product name (max 120 chars for non-apparel)
  catId: number;             // Leaf category ID
  costTemplateId: number;    // Shipping template ID
  brandId?: number;          // Brand ID (optional)
  goodsDescription?: string; // Product description
  modelKey?: string;         // Model/style key
}

// Product images and videos
export interface TemuGoodsGallery {
  mainImageUrl: string;      // Main image URL
  carouselImageUrls?: string[];  // Additional carousel images
  videoUrl?: string;         // Product video URL
  detailImageUrls?: string[]; // Detail/description images
}

// Product attributes (non-variant)
export interface TemuGoodsProperty {
  propertyList: TemuProductProperty[];
}

export interface TemuProductProperty {
  templatePropertyId: number;  // From template
  propertyId: number;          // Property ID
  propertyValueId?: number;    // Selected value ID for dropdown
  propertyValueText?: string;  // Text value for input type
}

// SKU/Variant information
export interface TemuSkuInfo {
  extCode?: string;          // External SKU code
  skuPrice: number;          // Price in cents
  skuStock: number;          // Available stock
  specIdList: number[];      // Variant specification IDs
  skuMainImageUrl?: string;  // SKU-specific main image
  skuCarouselImageUrls?: string[]; // SKU-specific carousel images
  skuWeight?: number;        // Weight in grams
  skuLength?: number;        // Length in cm
  skuWidth?: number;         // Width in cm  
  skuHeight?: number;        // Height in cm
  barCode?: string;          // Barcode
}

// Certification information
export interface TemuCertificationInfo {
  certificationType?: number;
  certificationNumber?: string;
  certificationImageUrls?: string[];
}

// Tax code information
export interface TemuTaxCodeInfo {
  taxCode?: string;
  hsCode?: string;
}

// Product creation response
export interface TemuProductCreateResult {
  goodsSn: string;           // Temu product SN
  productId?: number;        // Product ID
}

// ============================================
// Compliance Check Types (bg.local.goods.compliance.property.check)
// ============================================
export interface TemuComplianceCheckRequest {
  catId: number;
  propertyList: TemuProductProperty[];
}

export interface TemuComplianceCheckResult {
  success: boolean;
  errorList?: TemuComplianceError[];
}

export interface TemuComplianceError {
  propertyId: number;
  propertyName: string;
  errorMessage: string;
}

// ============================================
// Size Element Types (bg.local.goods.size.element.get)
// ============================================
export interface TemuSizeElement {
  elementId: number;
  elementName: string;
  required: boolean;
  unit?: string;
}

export interface TemuSizeElementResult {
  sizeElementList: TemuSizeElement[];
}

// ============================================
// Legacy/Compatibility Types (for existing code)
// ============================================
export interface TemuCategoryAttribute {
  id: number;
  name: string;
  required: boolean;
  multipleSelection: boolean;
  isSale: boolean;           // true = variant, false = normal
  inputType: number;
  values?: TemuAttributeValue[];
}

export interface TemuAttributeValue {
  id: number;
  name: string;
}

// Mapped from TemuTemplateProperty for UI
export function mapTemplatePropertyToAttribute(prop: TemuTemplateProperty): TemuCategoryAttribute {
  return {
    id: prop.propertyId,
    name: prop.propertyName,
    required: prop.required,
    multipleSelection: prop.inputType === 3,
    isSale: prop.isSale,
    inputType: prop.inputType,
    values: prop.valueList?.map(v => ({
      id: v.valueId,
      name: v.valueName
    }))
  };
}

// ============================================
// Product Payload Types (for internal use)
// ============================================
export interface TemuProduct {
  id?: string;
  title: string;
  description: string;
  categoryId: number;
  categoryName?: string;
  brandId?: number;
  brandName?: string;
  mainImage: string;
  images: string[];
  attributes: Record<string, string | number | (string | number)[]>;
  variants: TemuProductVariant[];
  shippingTemplateId: number;
}

export interface TemuProductVariant {
  sku: string;
  price: number;           // In cents
  stock: number;
  specIds: number[];
  mainImage?: string;
  images?: string[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  barcode?: string;
}

// ============================================
// Cache Types
// ============================================
export interface TemuCacheData {
  categories: TemuCategory[];
  lastUpdated: number;
}

export interface TemuAttributeCacheData {
  categoryId: number;
  attributes: TemuCategoryAttribute[];
  catType: number;
  lastUpdated: number;
}

// ============================================
// Category Match Types (for matching UI)
// ============================================
export interface TemuCategoryMatch {
  categoryId: number;
  categoryName: string;
  categoryPath: string;
  matchScore: number;
  leaf: boolean;
  catType?: number;
}
