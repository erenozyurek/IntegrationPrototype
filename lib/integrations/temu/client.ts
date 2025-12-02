/**
 * Temu API Client
 * Handles all Temu API requests with proper authentication and signature
 */

import { TEMU_CONFIG, buildTemuRequestParams } from './config';
import type { 
  TemuCategory, 
  TemuCategoryAttribute,
  TemuApiResponse,
  TemuCategoryListResult,
  TemuTemplateResult,
  TemuBrandListResult,
  TemuProduct,
  TemuProductRequest,
  TemuProductCreateResult,
  TemuShippingTemplateListResult,
  TemuSpecIdRequest,
  TemuSpecIdResult,
  TemuImageUploadResult,
} from './types';

export class TemuApiClient {
  private baseUrl: string;
  private appKey: string;
  private appSecret: string;
  private accessToken: string;

  constructor(
    appKey?: string,
    appSecret?: string,
    accessToken?: string
  ) {
    this.baseUrl = TEMU_CONFIG.BASE_URL;
    this.appKey = appKey || TEMU_CONFIG.APP_KEY;
    this.appSecret = appSecret || TEMU_CONFIG.APP_SECRET;
    this.accessToken = accessToken || TEMU_CONFIG.ACCESS_TOKEN;
  }

  /**
   * Update credentials dynamically
   */
  updateCredentials(appKey: string, appSecret: string, accessToken: string) {
    this.appKey = appKey;
    this.appSecret = appSecret;
    this.accessToken = accessToken;
  }

  /**
   * Make authenticated request to Temu API
   */
  private async makeRequest<T>(
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<TemuApiResponse<T>> {
    const requestParams = buildTemuRequestParams(method, params);
    
    // Use base URL directly (already includes /openapi/router)
    const url = this.baseUrl;
    
    try {
      console.log(`🔄 Temu API Request: ${method}`);
      console.log(`📤 URL: ${url}`);
      console.log('📤 Params:', JSON.stringify(requestParams, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestParams),
      });

      const responseText = await response.text();
      console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
      console.log(`📥 Response (first 500 chars):`, responseText.substring(0, 500));

      // Try to parse as JSON
      let data: TemuApiResponse<T>;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('❌ Response is not valid JSON:', responseText.substring(0, 1000));
        throw new Error(`Invalid JSON response from Temu API. Status: ${response.status}`);
      }

      // Check for API errors - Temu uses snake_case in responses
      const errorCode = data.errorCode || (data as unknown as { error_code?: number }).error_code;
      const errorMsg = data.errorMsg || (data as unknown as { error_msg?: string }).error_msg;
      
      // Temu error codes: 1000000 = SUCCESS, 2000000+ = errors
      // Only treat as error if code >= 2000000
      if (errorCode && errorCode >= 2000000) {
        console.error('❌ Temu API Error:', {
          errorCode,
          errorMsg,
        });
        throw new Error(`Temu API Error: ${errorCode} - ${errorMsg || 'Unknown error'}`);
      }

      // Log success
      if (errorCode === 1000000) {
        console.log('✅ Temu API Success (code: 1000000)');
      } else {
        console.log('✅ Temu API Success');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Temu API Request Failed:', error);
      throw error;
    }
  }

  // ============================================
  // Category Methods (bg.local.goods.cats.get)
  // ============================================

  /**
   * Get categories by parent ID
   * @param parentCatId - Parent category ID (0 for root categories)
   */
  async getCategories(parentCatId: number = 0): Promise<TemuApiResponse<TemuCategoryListResult>> {
    const response = await this.makeRequest<TemuCategoryListResult>(
      TEMU_CONFIG.ENDPOINTS.GET_CATEGORIES,
      { parentCatId }
    );
    
    // Log the response structure to debug
    const hasCategories = !!(response.result as unknown as Record<string, unknown>)?.goodsCatsList;
    console.log(`📦 getCategories(${parentCatId}) response: ${hasCategories ? 'has goodsCatsList' : 'no goodsCatsList'}`);
    
    return response;
  }

  /**
   * Get all categories with parallel fetching for speed
   * Uses breadth-first approach with concurrent requests
   */
  async getAllCategories(): Promise<TemuCategory[]> {
    const allCategories: TemuCategory[] = [];
    const categoryMap = new Map<number, TemuCategory>();
    let fetchCount = 0;
    const MAX_FETCHES = 500; // Increased to fetch more categories
    const CONCURRENT_REQUESTS = 10; // Fetch 10 levels in parallel for speed
    
    console.log('📦 Starting optimized category fetch...');
    const startTime = Date.now();
    
    // First, get root categories
    const rootResponse = await this.getCategories(0);
    fetchCount++;
    
    const result = rootResponse.result as Record<string, unknown> | undefined;
    const rootCategories = (result?.goodsCatsList || []) as TemuCategory[];
    
    console.log(`📦 Found ${rootCategories.length} root categories`);
    
    // Add root categories (parentId = 0 for root)
    for (const cat of rootCategories) {
      const enrichedCat = {
        ...cat,
        parentId: cat.parentId ?? 0,
        parentCatId: cat.parentId ?? 0, // Alias for compatibility
        path: [cat.catName],
        pathString: cat.catName
      };
      allCategories.push(enrichedCat);
      categoryMap.set(cat.catId, enrichedCat);
    }
    
    // Queue of parent IDs to fetch children for
    const parentsToFetch = rootCategories.filter(c => !c.leaf).map(c => c.catId);
    
    // Breadth-first fetch with parallel requests
    while (parentsToFetch.length > 0 && fetchCount < MAX_FETCHES) {
      // Take a batch of parents to fetch in parallel
      const batch = parentsToFetch.splice(0, CONCURRENT_REQUESTS);
      
      console.log(`📦 Fetching ${batch.length} category levels in parallel (total fetches: ${fetchCount})...`);
      
      // Fetch all in parallel
      const responses = await Promise.all(
        batch.map(parentId => this.getCategories(parentId).catch(err => {
          console.warn(`⚠️ Failed to fetch children for ${parentId}:`, err.message);
          return null;
        }))
      );
      
      fetchCount += batch.length;
      
      // Process responses
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        const parentId = batch[i];
        
        if (!response) continue;
        
        const res = response.result as Record<string, unknown> | undefined;
        const children = (res?.goodsCatsList || []) as TemuCategory[];
        
        const parent = categoryMap.get(parentId);
        const parentPath = parent?.path || [];
        
        for (const cat of children) {
          const categoryPath = [...parentPath, cat.catName];
          const enrichedCat = {
            ...cat,
            parentId: cat.parentId ?? parentId,
            parentCatId: cat.parentId ?? parentId, // Alias for compatibility
            path: categoryPath,
            pathString: categoryPath.join(' > ')
          };
          allCategories.push(enrichedCat);
          categoryMap.set(cat.catId, enrichedCat);
          
          // Add non-leaf categories to fetch queue
          if (!cat.leaf) {
            parentsToFetch.push(cat.catId);
          }
        }
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Fetched ${allCategories.length} total categories in ${duration}s (${fetchCount} API calls)`);
    
    return allCategories;
  }

  /**
   * Get only leaf categories (can be used for product assignment)
   */
  async getLeafCategories(): Promise<TemuCategory[]> {
    const allCategories = await this.getAllCategories();
    return allCategories.filter(cat => cat.leaf);
  }

  // ============================================
  // Template/Attribute Methods (bg.local.goods.template.get)
  // ============================================

  /**
   * Get category template (attributes and variant specs)
   * @param catId - Category ID
   */
  async getCategoryTemplate(catId: number): Promise<TemuApiResponse<TemuTemplateResult>> {
    return this.makeRequest<TemuTemplateResult>(
      TEMU_CONFIG.ENDPOINTS.GET_CATEGORY_TEMPLATE,
      { catId }
    );
  }

  /**
   * Get category attributes formatted for UI
   * Maps template properties to a simpler attribute format
   */
  async getCategoryAttributes(catId: number): Promise<TemuApiResponse<TemuCategoryAttribute[]>> {
    const templateResponse = await this.getCategoryTemplate(catId);
    
    if (!templateResponse.success || !templateResponse.result) {
      return {
        success: false,
        errorCode: templateResponse.errorCode,
        errorMsg: templateResponse.errorMsg,
        result: []
      };
    }

    const { mapTemplatePropertyToAttribute: mapFn } = await import('./types');
    const attributes = templateResponse.result.propertyList.map(mapFn);
    
    return {
      success: true,
      result: attributes
    };
  }

  /**
   * Get variant attributes only (isSale = true)
   */
  async getVariantAttributes(catId: number): Promise<TemuCategoryAttribute[]> {
    const response = await this.getCategoryAttributes(catId);
    if (!response.success || !response.result) return [];
    return response.result.filter(attr => attr.isSale);
  }

  /**
   * Get normal attributes only (isSale = false)
   */
  async getNormalAttributes(catId: number): Promise<TemuCategoryAttribute[]> {
    const response = await this.getCategoryAttributes(catId);
    if (!response.success || !response.result) return [];
    return response.result.filter(attr => !attr.isSale);
  }

  // ============================================
  // Custom Spec ID Methods (bg.local.goods.spec.id.get)
  // ============================================

  /**
   * Generate custom specification IDs for variant values
   */
  async generateSpecId(parentSpecId: number, specValue: string): Promise<TemuApiResponse<TemuSpecIdResult>> {
    return this.makeRequest<TemuSpecIdResult>(
      TEMU_CONFIG.ENDPOINTS.GET_SPEC_ID,
      { parentSpecId, specValue }
    );
  }

  /**
   * Generate multiple spec IDs in batch
   */
  async generateSpecIds(specs: TemuSpecIdRequest[]): Promise<TemuSpecIdResult[]> {
    const results: TemuSpecIdResult[] = [];
    for (const spec of specs) {
      const response = await this.generateSpecId(spec.parentSpecId, spec.specValue);
      if (response.success && response.result) {
        results.push(response.result);
      }
    }
    return results;
  }

  // ============================================
  // Size Element Methods (bg.local.goods.size.element.get)
  // ============================================

  /**
   * Get size elements for size chart
   */
  async getSizeElements(catId: number): Promise<TemuApiResponse<{ sizeElementList: Array<{ elementId: number; elementName: string; required: boolean; unit?: string }> }>> {
    return this.makeRequest(
      TEMU_CONFIG.ENDPOINTS.GET_SIZE_ELEMENTS,
      { catId }
    );
  }

  // ============================================
  // Brand Methods (temu.local.goods.brand.trademark.V2.get)
  // ============================================

  /**
   * Get brands (search by keyword)
   */
  async getBrands(keyword?: string): Promise<TemuApiResponse<TemuBrandListResult>> {
    return this.makeRequest<TemuBrandListResult>(
      TEMU_CONFIG.ENDPOINTS.GET_BRAND_TRADEMARK,
      keyword ? { keyword } : {}
    );
  }

  // ============================================
  // Shipping Template Methods (bg.freight.template.list.query)
  // ============================================

  /**
   * Get shipping/freight templates
   */
  async getShippingTemplates(): Promise<TemuApiResponse<TemuShippingTemplateListResult>> {
    return this.makeRequest<TemuShippingTemplateListResult>(
      TEMU_CONFIG.ENDPOINTS.GET_FREIGHT_TEMPLATES
    );
  }

  // ============================================
  // Image Upload Methods (bg.local.goods.image.upload)
  // ============================================

  /**
   * Upload an image to Temu
   * @param imageUrl - Source image URL or base64 data
   */
  async uploadImage(imageUrl: string): Promise<TemuApiResponse<TemuImageUploadResult>> {
    return this.makeRequest<TemuImageUploadResult>(
      TEMU_CONFIG.ENDPOINTS.UPLOAD_IMAGE,
      { imageUrl }
    );
  }

  /**
   * Upload multiple images
   */
  async uploadImages(imageUrls: string[]): Promise<string[]> {
    const uploadedUrls: string[] = [];
    for (const url of imageUrls) {
      const response = await this.uploadImage(url);
      if (response.success && response.result?.url) {
        uploadedUrls.push(response.result.url);
      }
    }
    return uploadedUrls;
  }

  // ============================================
  // Product Methods (bg.local.goods.add, etc.)
  // ============================================

  /**
   * Create a new product
   */
  async createProduct(product: TemuProductRequest): Promise<TemuApiResponse<TemuProductCreateResult>> {
    return this.makeRequest<TemuProductCreateResult>(
      TEMU_CONFIG.ENDPOINTS.ADD_PRODUCT,
      product as unknown as Record<string, unknown>
    );
  }

  /**
   * Update an existing product
   */
  async updateProduct(goodsSn: string, product: Partial<TemuProductRequest>): Promise<TemuApiResponse<{ goodsSn: string }>> {
    return this.makeRequest(
      TEMU_CONFIG.ENDPOINTS.UPDATE_PRODUCT,
      { goodsSn, ...product }
    );
  }

  /**
   * Get product list
   */
  async getProducts(params?: {
    page?: number;
    pageSize?: number;
    status?: number;
  }): Promise<TemuApiResponse<{ goodsList: TemuProduct[]; total: number }>> {
    return this.makeRequest(
      TEMU_CONFIG.ENDPOINTS.GET_PRODUCTS,
      {
        page: params?.page || 1,
        pageSize: params?.pageSize || 50,
        ...(params?.status !== undefined && { status: params.status }),
      }
    );
  }

  /**
   * Get product detail by goodsSn
   */
  async getProductDetail(goodsSn: string): Promise<TemuApiResponse<TemuProduct>> {
    return this.makeRequest(
      TEMU_CONFIG.ENDPOINTS.GET_PRODUCT_DETAIL,
      { goodsSn }
    );
  }

  // ============================================
  // Compliance Check Methods (bg.local.goods.compliance.property.check)
  // ============================================

  /**
   * Check product compliance before submission
   */
  async checkCompliance(catId: number, propertyList: Array<{ templatePropertyId: number; propertyId: number; propertyValueId?: number; propertyValueText?: string }>) {
    return this.makeRequest(
      TEMU_CONFIG.ENDPOINTS.CHECK_COMPLIANCE_PROPERTY,
      { catId, propertyList }
    );
  }
}

// Export singleton instance
export const temuClient = new TemuApiClient();
