/**
 * Hepsiburada Type Definitions
 */

/**
 * Hepsiburada Category
 * Based on API response from /product/api/categories/get-all-categories
 */
export interface HepsiburadaCategory {
  categoryId: number;
  name: string;
  displayName?: string;
  parentCategoryId?: number;
  paths?: string[]; // API returns array like ["Ana Kategori", "Alt Kategori", "Yaprak"]
  leaf: boolean;
  status: string; // "ACTIVE" veya "PASSIVE"
  available: boolean;
  type?: string; // "HB"
  sortId?: string;
  productTypes?: Array<{ name: string; productTypeId: number }>;
  merge?: boolean;
  subCategories?: HepsiburadaCategory[];
}

/**
 * Hepsiburada Category Attribute (from API)
 */
export interface HepsiburadaCategoryAttribute {
  id: string;
  name: string;
  displayName?: string;
  type: 'string' | 'integer' | 'enum' | 'boolean' | 'video' | 'text' | 'numeric' | 'list' | 'multiList';
  mandatory: boolean;
  multiValue: boolean;
  allowCustomValue?: boolean;
  varianter?: boolean;
  values?: HepsiburadaAttributeValue[];
}

/**
 * Hepsiburada Category Attributes Response
 */
export interface HepsiburadaCategoryAttributesData {
  baseAttributes: HepsiburadaCategoryAttribute[];
  attributes: HepsiburadaCategoryAttribute[];
}

/**
 * Hepsiburada Attribute Value
 */
export interface HepsiburadaAttributeValue {
  id: string;
  name: string;
  displayName?: string;
}

/**
 * Hepsiburada Product (for import)
 */
export interface HepsiburadaProduct {
  merchantSku: string;
  barcode: string;
  productName: string;
  categoryId: number;
  brandName?: string;
  description?: string;
  price: number;
  vat: number;
  stock: number;
  images: HepsiburadaProductImage[];
  attributes: HepsiburadaProductAttribute[];
  deliveryDuration?: number;
  cargoCompanyId?: string;
}

/**
 * Hepsiburada Product Image
 */
export interface HepsiburadaProductImage {
  url: string;
  order: number;
}

/**
 * Hepsiburada Product Attribute
 */
export interface HepsiburadaProductAttribute {
  attributeId: string;
  attributeName: string;
  attributeValue: string;
  attributeValueId?: string;
}

/**
 * Hepsiburada Listing
 */
export interface HepsiburadaListing {
  listingId: string;
  merchantSku: string;
  hbSku?: string;
  barcode?: string;
  productName: string;
  price: number;
  availableStock: number;
  dispatchTime?: number;
  cargoCompanyId?: string;
  status: string;
  isBuyboxWinner?: boolean;
  isSalable?: boolean;
}

/**
 * Hepsiburada API Response wrapper
 * Includes pagination fields for paginated endpoints
 */
export interface HepsiburadaApiResponse<T> {
  success: boolean;
  code?: number;
  version?: number;
  data?: T;
  errors?: HepsiburadaApiError[];
  message?: string;
  trackingId?: string;
  // Pagination fields
  totalElements?: number;
  totalPages?: number;
  number?: number; // Current page number
  numberOfElements?: number;
  first?: boolean;
  last?: boolean;
}

/**
 * Hepsiburada API Error
 */
export interface HepsiburadaApiError {
  code: string;
  message: string;
  field?: string;
}

/**
 * Hepsiburada Category Match (for matching algorithm)
 */
export interface HepsiburadaCategoryMatch {
  category: HepsiburadaCategory;
  score: number;
  path: string[];
  pathString: string;
  isLeaf: boolean;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Hepsiburada Order
 */
export interface HepsiburadaOrder {
  orderId: string;
  orderNumber: string;
  customerId: string;
  orderDate: string;
  totalPrice: number;
  status: string;
  items: HepsiburadaOrderItem[];
  shippingAddress: HepsiburadaAddress;
  billingAddress: HepsiburadaAddress;
}

/**
 * Hepsiburada Order Item
 */
export interface HepsiburadaOrderItem {
  lineItemId: string;
  merchantSku: string;
  hbSku?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
}

/**
 * Hepsiburada Address
 */
export interface HepsiburadaAddress {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  postalCode?: string;
  country: string;
}

/**
 * Hepsiburada Cargo Company
 */
export interface HepsiburadaCargoCompany {
  id: string;
  name: string;
  displayName: string;
}

/**
 * Hepsiburada Listing API Types (for API Tester)
 */
export interface HepsiburadaListingProductAttributes {
  merchantSku: string;
  VaryantGroupID: string;
  Barcode: string;
  UrunAdi: string;
  UrunAciklamasi: string;
  Marka: string;
  GarantiSuresi: number;
  kg: string;
  tax_vat_rate: string;
  price: string;
  stock: string;
  Image1: string;
  Image2?: string;
  Image3?: string;
  Image4?: string;
  Image5?: string;
  Video1?: string;
  renk_variant_property?: string;
  ebatlar_variant_property?: string;
  [key: string]: string | number | undefined; // For dynamic attributes
}

export interface HepsiburadaListingProduct {
  categoryId: number;
  merchant: string;
  attributes: HepsiburadaListingProductAttributes;
}

export interface HepsiburadaListingTestRequest {
  products: HepsiburadaListingProduct[];
  merchantId?: string;
}

export interface HepsiburadaListingTestResponse {
  success: boolean;
  message: string;
  apiResponse?: any;
  errors?: string[];
  timestamp: string;
  statusCode?: number;
}
