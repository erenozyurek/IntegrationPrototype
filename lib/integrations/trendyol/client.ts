/**
 * Trendyol API Client
 * Handles all Trendyol API requests with proper authentication
 */

import { TRENDYOL_CONFIG } from './config';

export class TrendyolApiClient {
  private baseUrl: string;
  private supplierId: string;
  private authToken: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = TRENDYOL_CONFIG.BASE_URL;
    this.supplierId = TRENDYOL_CONFIG.SUPPLIER_ID;
    this.authToken = TRENDYOL_CONFIG.AUTH_TOKEN;
    this.headers = {
      ...TRENDYOL_CONFIG.HEADERS,
      'Authorization': `Basic ${this.authToken}`,
    };
  }

  /**
   * Make authenticated request to Trendyol API
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    // Replace supplierId placeholder in endpoint
    const url = `${this.baseUrl}${endpoint.replace('{supplierId}', this.supplierId)}`;

    const options: RequestInit = {
      method,
      headers: this.headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    try {
      console.log(`🔄 Trendyol API Request: ${method} ${url}`);
      console.log('📤 Headers:', JSON.stringify(this.headers, null, 2));
      if (body) {
        console.log('📤 Body:', JSON.stringify(body, null, 2));
      }
      
      const response = await fetch(url, options);
      
      // Get response as text first to handle non-JSON responses
      const responseText = await response.text();
      console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
      console.log(`📥 Response Text (first 500 chars):`, responseText.substring(0, 500));

      // Try to parse as JSON
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Response is not valid JSON:', responseText.substring(0, 1000));
        throw new Error(`Invalid JSON response from Trendyol API. Status: ${response.status}. Response: ${responseText.substring(0, 200)}`);
      }

      if (!response.ok) {
        console.error('❌ Trendyol API Error:', {
          status: response.status,
          statusText: response.statusText,
          data,
        });
        throw new Error(`Trendyol API Error: ${response.status} - ${JSON.stringify(data)}`);
      }

      console.log('✅ Trendyol API Success:', data);
      return data as T;
    } catch (error) {
      console.error('❌ Trendyol API Request Failed:', error);
      throw error;
    }
  }

  /**
   * Get product categories
   */
  async getCategories() {
    return this.makeRequest(TRENDYOL_CONFIG.ENDPOINTS.GET_CATEGORIES);
  }

  /**
   * Get category attributes
   */
  async getCategoryAttributes(categoryId: number) {
    const endpoint = TRENDYOL_CONFIG.ENDPOINTS.GET_CATEGORY_ATTRIBUTES.replace(
      '{categoryId}',
      categoryId.toString()
    );
    return this.makeRequest(endpoint);
  }

  /**
   * Get brands
   */
  async getBrands(page: number = 0, size: number = 100) {
    return this.makeRequest(`${TRENDYOL_CONFIG.ENDPOINTS.GET_BRANDS}?page=${page}&size=${size}`);
  }

  /**
   * Search brand by name
   */
  async searchBrandByName(brandName: string) {
    return this.makeRequest(`${TRENDYOL_CONFIG.ENDPOINTS.GET_BRAND_BY_NAME}?name=${encodeURIComponent(brandName)}`);
  }

  /**
   * Create product on Trendyol
   */
  async createProduct(productData: any) {
    return this.makeRequest(
      TRENDYOL_CONFIG.ENDPOINTS.CREATE_PRODUCT,
      'POST',
      productData
    );
  }

  /**
   * Update product on Trendyol
   */
  async updateProduct(productData: any) {
    return this.makeRequest(
      TRENDYOL_CONFIG.ENDPOINTS.UPDATE_PRODUCT,
      'PUT',
      productData
    );
  }

  /**
   * Update product price and inventory
   */
  async updatePriceAndInventory(items: any[]) {
    return this.makeRequest(
      TRENDYOL_CONFIG.ENDPOINTS.UPDATE_PRICE_INVENTORY,
      'POST',
      { items }
    );
  }

  /**
   * Get products
   */
  async getProducts(params?: {
    page?: number;
    size?: number;
    approved?: boolean;
    archived?: boolean;
    barcode?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.set('page', params.page.toString());
    if (params?.size !== undefined) queryParams.set('size', params.size.toString());
    if (params?.approved !== undefined) queryParams.set('approved', params.approved.toString());
    if (params?.archived !== undefined) queryParams.set('archived', params.archived.toString());
    if (params?.barcode) queryParams.set('barcode', params.barcode);

    const query = queryParams.toString();
    const endpoint = `${TRENDYOL_CONFIG.ENDPOINTS.GET_PRODUCT}${query ? '?' + query : ''}`;
    
    return this.makeRequest(endpoint);
  }

  /**
   * Get orders
   */
  async getOrders(params?: {
    page?: number;
    size?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.set('page', params.page.toString());
    if (params?.size !== undefined) queryParams.set('size', params.size.toString());
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.status) queryParams.set('status', params.status);

    const query = queryParams.toString();
    const endpoint = `${TRENDYOL_CONFIG.ENDPOINTS.GET_ORDERS}${query ? '?' + query : ''}`;
    
    return this.makeRequest(endpoint);
  }
}

// Export singleton instance
export const trendyolClient = new TrendyolApiClient();
