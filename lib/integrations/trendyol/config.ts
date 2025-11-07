/**
 * Trendyol API Configuration
 * API Documentation: https://developers.trendyol.com/
 */

export const TRENDYOL_CONFIG = {
  // API Base URL - TRENDYOL TEST SUNUCUSU
  // Test/Stage: https://stageapigw.trendyol.com/sapigw
  // Production: https://api.trendyol.com/sapigw
  BASE_URL: 'https://stageapigw.trendyol.com/sapigw', // TEST ORTAMI
  
  // Satıcı (Supplier) Bilgileri - TEST (yeni verilen credentials)
  SUPPLIER_ID: '944254',
  
  // Entegrasyon Bilgileri - Test hesabı (kullanıcı tarafından verildi)
  INTEGRATION_REFERENCE: '36f07439-e79d-46a5-8f90-34dd1f00806c',
  API_KEY: 'D4MHXiH51nAizADyCw5h',
  API_SECRET: 'AyjDEMoVdMMgYVzS4Xi2',
  
  // Base64 encoded credentials (API_KEY:API_SECRET)
  // Token: D4MHXiH51nAizADyCw5h:AyjDEMoVdMMgYVzS4Xi2
  AUTH_TOKEN: 'RDRNSFhpSDUxbkFpekFEeUN3NWg6QXlqREVNb1ZkTU1nWVZ6UzRYaTI=',
  
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
