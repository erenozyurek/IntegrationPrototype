/**
 * Hepsiburada API Configuration
 * API Documentation: https://developers.hepsiburada.com/
 * 
 * Hepsiburada uses MPOP (Marketplace Operations Portal) API
 * Authentication: Basic Auth with username:password
 */

export const HEPSIBURADA_CONFIG = {
  // API Base URL
  // Production: https://mpop.hepsiburada.com
  // Test/Stage: https://mpop-sit.hepsiburada.com
  BASE_URL: 'https://mpop-sit.hepsiburada.com', // TEST ORTAMI for product operations
  
  // Production URL for categories/attributes (test environment has incomplete data)
  PRODUCTION_URL: 'https://mpop.hepsiburada.com',
  
  // Satıcı (Merchant) Bilgileri - TEST
  // Bu bilgiler kullanıcı tarafından sağlanacak
  MERCHANT_ID: '3f95e71f-c39e-4266-9eb4-c154807e87f7', // Merchant ID will be provided
  USERNAME: '3f95e71f-c39e-4266-9eb4-c154807e87f7', // API Username (often same as merchantId)
  PASSWORD: 'd8rCXfXqWJW2', // API Password
  
  // Base64 encoded credentials (username:password)
  AUTH_TOKEN: '', // Will be generated from above credentials
  
  // API Endpoints
  ENDPOINTS: {
    // Kategori Servisleri (use PRODUCTION_URL for these)
    GET_CATEGORIES: '/product/api/categories/get-all-categories',
    GET_CATEGORY_ATTRIBUTES: '/product/api/categories/{categoryId}/attributes',
    GET_ATTRIBUTE_VALUES: '/product/api/categories/{categoryId}/attribute/{attributeId}/values',
    
    // Ürün Servisleri
    CREATE_PRODUCT: '/product/api/products/import',
    UPDATE_PRODUCT: '/product/api/products/update',
    DELETE_PRODUCT: '/listing/api/listings/delete',
    GET_PRODUCTS: '/listing/api/listings',
    
    // Listeleme (Listing) Servisleri
    CREATE_LISTING: '/listing/api/listings',
    UPDATE_LISTING: '/listing/api/listings',
    GET_LISTING_STATUS: '/listing/api/listings/status',
    
    // Stok ve Fiyat
    UPDATE_INVENTORY: '/listing/api/listings/stock-update',
    UPDATE_PRICE: '/listing/api/listings/price-update',
    
    // Sipariş Servisleri
    GET_ORDERS: '/order/api/orders',
    UPDATE_ORDER_STATUS: '/order/api/orders/{orderId}',
    
    // Kargo
    GET_CARGO_COMPANIES: '/product/api/cargo-companies',
  },
  
  // Request Headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'aserai_dev', // Developer Username - ZORUNLU
  },
} as const;

/**
 * Generate Base64 auth token for Hepsiburada
 * Format: username:password (NOT merchantId:username:password)
 */
export function generateHepsiburadaAuthToken(
  username: string,
  password: string
): string {
  const credentials = `${username}:${password}`;
  // In browser/node environment
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(credentials).toString('base64');
  }
  // Fallback for browser
  return btoa(credentials);
}

/**
 * Hepsiburada Product Status
 */
export enum HepsiburadaProductStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITING_FOR_APPROVAL = 'WAITING_FOR_APPROVAL',
  DRAFT = 'DRAFT',
}

/**
 * Hepsiburada Listing Status
 */
export enum HepsiburadaListingStatus {
  ACTIVE = 'Active',
  PASSIVE = 'Passive',
  SUSPENDED = 'Suspended',
  WAITING_FOR_LISTING = 'WaitingForListing',
  ERROR = 'Error',
}
