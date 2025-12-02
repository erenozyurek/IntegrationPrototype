/**
 * Trendyol API Configuration
 * API Documentation: https://developers.trendyol.com/
 */

export const TRENDYOL_CONFIG = {
  // API Base URL - TRENDYOL TEST SUNUCUSU
  // Test/Stage: https://stageapigw.trendyol.com
  // Production: https://apigw.trendyol.com
  BASE_URL: 'https://stageapigw.trendyol.com', // TEST ORTAMI
  
  // Satıcı (Seller) Bilgileri - TEST (yeni verilen credentials)
  SELLER_ID: '944254',
  
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
    CREATE_PRODUCT: '/integration/product/sellers/{sellerId}/products',
    UPDATE_PRODUCT: '/integration/product/sellers/{sellerId}/products',
    DELETE_PRODUCT: '/integration/product/sellers/{sellerId}/products',
    GET_PRODUCT: '/integration/product/sellers/{sellerId}/products',
    UPDATE_PRICE_INVENTORY: '/integration/inventory/sellers/{sellerId}/products/price-and-inventory',
    GET_BATCH_REQUEST_RESULT: '/integration/product/sellers/{sellerId}/products/batch-requests/{batchRequestId}',
    
    // Kategori
    GET_CATEGORIES: '/integration/product/product-categories',
    GET_CATEGORY_ATTRIBUTES: '/integration/product/product-categories/{categoryId}/attributes',
    
    // Brand
    GET_BRANDS: '/integration/product/brands',
    GET_BRAND_BY_NAME: '/integration/product/brands/by-name',
    
    // Sipariş
    GET_ORDERS: '/integration/order/sellers/{sellerId}/orders',
    
    // Kargo
    UPDATE_SHIPMENT: '/integration/product/sellers/{sellerId}/shipment-providers',
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
