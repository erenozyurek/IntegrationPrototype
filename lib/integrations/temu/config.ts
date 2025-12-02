/**
 * Temu API Configuration
 * API Documentation: Temu Partner Platform
 * 
 * Temu uses Open API with signature-based authentication
 * Authentication: App Key + App Secret + Access Token
 */

import crypto from 'crypto';

export const TEMU_CONFIG = {
  // API Base URL
  // Production: https://openapi.temu.com
  // Sandbox: https://openapi-sandbox.temu.com (if available)
  BASE_URL: "https://openapi-b-eu.temu.com/openapi/router",
  
  // API Credentials - These should be set in environment variables
  APP_KEY: 'f860e759073f9d1e5c8bbeb7baac1dbf',
  APP_SECRET: '121eac72693c6e587f7e15ce4721b42da5df2def',
  ACCESS_TOKEN: 'eplq26kq0lebfnzyr19u7lekgnnexnratu6gjusoqfl3rdfjdfbbshhrvho',

  // API Version
  API_VERSION: '1.0',
  
  // API Endpoints from Temu documentation
  ENDPOINTS: {
    // Category Services
    GET_CATEGORIES: 'bg.local.goods.cats.get',  // Get complete category tree
    GET_CATEGORY_TEMPLATE: 'bg.local.goods.template.get',  // Get attributes/variants for category
    GET_CATEGORY_RECOMMEND: 'bg.local.goods.category.recommend',  // Recommend category based on product info
    
    // Variant/Specification Services
    GET_SPEC_ID: 'bg.local.goods.spec.id.get',  // Generate custom variant specification IDs
    GET_SIZE_ELEMENTS: 'bg.local.goods.size.element.get',  // Get size chart requirements
    
    // Image/Media Upload
    UPLOAD_IMAGE: 'bg.local.goods.image.upload',  // Upload product images
    GET_GALLERY_SIGNATURE: 'bg.local.goods.gallery.signature.get',  // Upload videos/files/images signature
    
    // Validation Services
    CHECK_COMPLIANCE_PROPERTY: 'bg.local.goods.compliance.property.check',  // Check product compliance
    CHECK_ILLEGAL_VOCABULARY: 'temu.local.goods.illegal.vocabulary.check',  // Check for violations
    CHECK_OUT_SN: 'bg.local.goods.out.sn.check',  // Check external product code duplication
    CHECK_SKU_OUT_SN: 'bg.local.goods.sku.out.sn.check',  // Check SKU code duplication
    
    // Reference Data Services
    GET_TAX_CODE: 'bg.local.goods.tax.code.get',  // Get product tax code
    GET_FREIGHT_TEMPLATES: 'bg.freight.template.list.query',  // Get shipping templates
    GET_BRAND_TRADEMARK: 'temu.local.goods.brand.trademark.V2.get',  // Get seller brand info
    GET_NET_CONTENT_UNITS: 'temu.local.goods.sku.net.content.unit.query',  // Get SKU net content units
    
    // Compliance Services
    GET_COMPLIANCE_RULES: 'bg.local.goods.compliance.rules.get',  // Get compliance requirements
    GET_COMPLIANCE_EXTRA_TEMPLATE: 'bg.local.goods.compliance.extra.template.get',  // Extra compliance templates
    GET_COMPLIANCE_INFO_FILL_LIST: 'bg.local.goods.compliance.info.fill.list.query',  // Compliance info fill list
    
    // Product Management
    ADD_PRODUCT: 'bg.local.goods.add',  // Create new product
    UPDATE_PRODUCT: 'bg.local.goods.edit',  // Update product (assumed endpoint)
    GET_PRODUCTS: 'bg.local.goods.list.get',  // Get products list (assumed endpoint)
    GET_PRODUCT_DETAIL: 'bg.local.goods.detail.get',  // Get product detail (assumed endpoint)
  },
  
  // Request Headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Category types (from documentation)
  CATEGORY_TYPES: {
    APPAREL: 0,      // Clothing - requires 3:4 aspect ratio images
    NON_APPAREL: 1,  // Non-clothing - requires 1:1 aspect ratio images
  },
  
  // Image Requirements
  IMAGE_REQUIREMENTS: {
    APPAREL: {
      ASPECT_RATIO: '3:4',
      MIN_WIDTH: 1340,
      MIN_HEIGHT: 1785,
      MAX_SIZE_MB: 3,
      FORMATS: ['jpeg', 'jpg', 'png'],
    },
    NON_APPAREL: {
      ASPECT_RATIO: '1:1',
      MIN_WIDTH: 800,
      MIN_HEIGHT: 800,
      MAX_SIZE_MB: 3,
      FORMATS: ['jpeg', 'jpg', 'png'],
    },
    DETAIL: {
      ASPECT_RATIO_MIN: '1:3',
      MIN_WIDTH: 480,
      MIN_HEIGHT: 480,
      MAX_SIZE_MB: 3,
      MAX_COUNT: 49,
      FORMATS: ['jpeg', 'jpg', 'png'],
    },
  },
  
  // Video Requirements
  VIDEO_REQUIREMENTS: {
    CAROUSEL: {
      MAX_DURATION_SEC: 60,
      MIN_RESOLUTION: '720P',
      MAX_SIZE_MB: 100,
      MAX_COUNT: 1,
      FORMATS: ['wmv', 'avi', '3gp', 'mov', 'mp4', 'flv', 'rmvb', 'mkv', 'm4v', 'x-flv'],
    },
    DETAIL: {
      MAX_DURATION_SEC: 180,
      MIN_RESOLUTION: '720P',
      MAX_SIZE_MB: 300,
      ASPECT_RATIOS: ['1:1', '4:3', '16:9'],
      FORMATS: ['wmv', 'avi', '3gp', 'mov', 'mp4', 'flv', 'rmvb', 'mkv', 'm4v', 'x-flv'],
    },
  },
  
  // Fulfillment Types
  FULFILLMENT_TYPES: {
    SELF_FULFILLMENT: 1,
  },
  
  // SKU Classification Types
  SKU_CLASSIFICATION: {
    SINGLE_PRODUCT: 1,
    COMBINATION: 2,
    MIXED: 3,
  },
} as const;

/**
 * Generate signature for Temu API requests
 * Format: MD5(app_secret + key1value1key2value2... + app_secret)
 * Keys sorted by ASCII (alphabetically), all concatenated seamlessly
 */
export function generateTemuSignature(
  params: Record<string, unknown>,
  appSecret: string
): string {
  // Sort parameters alphabetically by key (ASCII order)
  const sortedKeys = Object.keys(params).sort();
  
  // Build the string: key1value1key2value2...
  // Values that are objects/arrays should be JSON stringified
  const paramString = sortedKeys
    .map(key => {
      const value = params[key];
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return `${key}${valueStr}`;
    })
    .join('');
  
  // Temu format: app_secret + params + app_secret
  const signString = appSecret + paramString + appSecret;
  
  console.log('🔐 Sign string (first 300 chars):', signString.substring(0, 300));
  
  // MD5 hash, uppercase
  const signature = crypto.createHash('md5').update(signString).digest('hex').toUpperCase();
  console.log('🔐 Generated signature:', signature);
  
  return signature;
}

/**
 * Build complete request body for Temu API
 * Includes all common parameters + request parameters + sign
 */
export function buildTemuRequestParams(
  method: string,
  additionalParams: Record<string, unknown> = {}
): Record<string, unknown> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  // Build all parameters (common + request params) EXCEPT sign
  const allParams: Record<string, unknown> = {
    type: method,                        // API method name
    app_key: TEMU_CONFIG.APP_KEY,
    timestamp,
    access_token: TEMU_CONFIG.ACCESS_TOKEN,
    data_type: 'JSON',
    ...additionalParams,                 // Request-specific parameters
  };
  
  // Generate signature from all params
  const sign = generateTemuSignature(allParams, TEMU_CONFIG.APP_SECRET);
  
  // Return complete request body with sign
  return {
    ...allParams,
    sign,
  };
}

export default TEMU_CONFIG;
