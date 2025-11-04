/**
 * Trendyol API Configuration
 * API Documentation: https://developers.trendyol.com/
 */

export const TRENDYOL_CONFIG = {
  // API Base URL - TRENDYOL TEST SUNUCUSU
  // Test: https://sandbox-api.trendyol.com/sapigw (veya başka test URL)
  // Production: https://api.trendyol.com/sapigw
  BASE_URL: 'https://api.trendyol.com/sapigw', // Eğer test URL farklıysa buraya yazın
  
  // Satıcı (Supplier) Bilgileri - ASERAI TEST SUNUCUSU
  SUPPLIER_ID: '2738',
  
  // Entegrasyon Bilgileri - ASERAI TEST SUNUCUSU (TEST)
  // Trendyol tarafından sağlanan test sunucusu credentials
  INTEGRATION_REFERENCE: 'f23ce6f0-1eed-4477-87fb-78dcf972021a',
  API_KEY: 'CfcS3iAgDihGSTI574IU',
  API_SECRET: 'kgRhcFMhLdvSGbn4nCe5',
  
  // Base64 encoded credentials (API_KEY:API_SECRET)
  // Token: CfcS3iAgDihGSTI574IU:kgRhcFMhLdvSGbn4nCe5
  AUTH_TOKEN: 'Q2ZjUzNpQWdEaWhHU1RJNTc0SVU6a2dSaGNGTWhMZHZTR2JuNG5DZTU=',
  
  // API Endpoints
  ENDPOINTS: {
    // Ürün Entegrasyonu
    CREATE_PRODUCT: '/suppliers/{supplierId}/v2/products',
    UPDATE_PRODUCT: '/suppliers/{supplierId}/v2/products',
    GET_PRODUCT: '/suppliers/{supplierId}/products',
    UPDATE_PRICE_INVENTORY: '/suppliers/{supplierId}/products/price-and-inventory',
    
    // Kategori
    GET_CATEGORIES: '/product-categories',
    GET_CATEGORY_ATTRIBUTES: '/product-categories/{categoryId}/attributes',
    
    // Brand
    GET_BRANDS: '/brands',
    GET_BRAND_BY_NAME: '/brands/by-name',
    
    // Sipariş
    GET_ORDERS: '/suppliers/{supplierId}/orders',
    
    // Kargo
    UPDATE_SHIPMENT: '/suppliers/{supplierId}/shipment-providers',
  },
  
  // Request Headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'IntegrationPrototype/1.0',
  },
} as const;

/**
 * Trendyol Product Status
 */
export enum TrendyolProductStatus {
  ACTIVE = 'ACTIVE',
  PASSIVE = 'PASSIVE',
  DRAFT = 'DRAFT',
}

/**
 * Trendyol Cargo Company Codes
 */
export enum TrendyolCargoCompany {
  YURTICI_KARGO = 'Yurtiçi Kargo',
  ARAS_KARGO = 'Aras Kargo',
  MNG_KARGO = 'MNG Kargo',
  SURAT_KARGO = 'Sürat Kargo',
  PTT_KARGO = 'PTT Kargo',
  HB_KARGO = 'Hepsijet',
  UPS = 'UPS',
}

/**
 * Trendyol Delivery Type
 */
export enum TrendyolDeliveryType {
  DAYS_2 = 'Days_2',
  DAYS_3 = 'Days_3',
  DAYS_5 = 'Days_5',
  DAYS_7 = 'Days_7',
}
