/**
 * Hepsiburada API Client
 * Handles all Hepsiburada API requests with proper authentication
 */

import { HEPSIBURADA_CONFIG, generateHepsiburadaAuthToken } from './config';
import type { 
  HepsiburadaCategory, 
  HepsiburadaCategoryAttribute,
  HepsiburadaApiResponse,
  HepsiburadaListing,
  HepsiburadaCargoCompany
} from './types';

export class HepsiburadaApiClient {
  private baseUrl: string;
  private productionUrl: string; // For categories/attributes (test env has incomplete data)
  private merchantId: string;
  private username: string;
  private password: string;
  private authToken: string;
  private headers: Record<string, string>;

  constructor(
    merchantId?: string,
    username?: string,
    password?: string
  ) {
    this.baseUrl = HEPSIBURADA_CONFIG.BASE_URL;
    this.productionUrl = HEPSIBURADA_CONFIG.PRODUCTION_URL;
    this.merchantId = merchantId || HEPSIBURADA_CONFIG.MERCHANT_ID;
    this.username = username || HEPSIBURADA_CONFIG.USERNAME;
    this.password = password || HEPSIBURADA_CONFIG.PASSWORD;
    
    // Generate auth token (username:password format)
    this.authToken = this.username && this.password
      ? generateHepsiburadaAuthToken(this.username, this.password)
      : HEPSIBURADA_CONFIG.AUTH_TOKEN;

    this.headers = {
      ...HEPSIBURADA_CONFIG.HEADERS,
      'Authorization': `Basic ${this.authToken}`,
    };
  }

  /**
   * Update credentials dynamically
   */
  updateCredentials(merchantId: string, username: string, password: string) {
    this.merchantId = merchantId;
    this.username = username;
    this.password = password;
    this.authToken = generateHepsiburadaAuthToken(username, password);
    this.headers['Authorization'] = `Basic ${this.authToken}`;
  }

  /**
   * Make authenticated request to Hepsiburada API
   * @param useProduction - Use production URL (for categories/attributes)
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown,
    useProduction: boolean = false
  ): Promise<T> {
    const baseUrl = useProduction ? this.productionUrl : this.baseUrl;
    const url = `${baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: this.headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    try {
      console.log(`🔄 Hepsiburada API Request: ${method} ${url}${useProduction ? ' [PRODUCTION]' : ''}`);
      if (body) {
        console.log('📤 Body:', JSON.stringify(body, null, 2));
      }

      const response = await fetch(url, options);
      const responseText = await response.text();
      
      console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
      console.log(`📥 Response Text (first 500 chars):`, responseText.substring(0, 500));

      // Try to parse as JSON
      let data: T;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('❌ Response is not valid JSON:', responseText.substring(0, 1000));
        throw new Error(`Invalid JSON response from Hepsiburada API. Status: ${response.status}`);
      }

      if (!response.ok) {
        console.error('❌ Hepsiburada API Error:', {
          status: response.status,
          statusText: response.statusText,
          data,
        });
        throw new Error(`Hepsiburada API Error: ${response.status} - ${JSON.stringify(data)}`);
      }

      console.log('✅ Hepsiburada API Success');
      return data;
    } catch (error) {
      console.error('❌ Hepsiburada API Request Failed:', error);
      throw error;
    }
  }

  /**
   * Get all product categories with pagination
   * Fetches only leaf categories that are available for product creation
   * NOTE: Using test environment - production requires separate credentials
   * @param page - Page number (0-indexed)
   * @param size - Page size (max 2000)
   * @param leafOnly - Only return leaf categories (default: true)
   * @param availableOnly - Only return available categories (default: true)
   */
  async getCategories(
    page: number = 0, 
    size: number = 1000,
    leafOnly: boolean = true,
    availableOnly: boolean = true
  ): Promise<HepsiburadaApiResponse<HepsiburadaCategory[]>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      leaf: leafOnly.toString(),
      available: availableOnly.toString(),
    });
    const endpoint = `${HEPSIBURADA_CONFIG.ENDPOINTS.GET_CATEGORIES}?${params.toString()}`;
    // Use test environment (production requires different credentials)
    return this.makeRequest(endpoint, 'GET', undefined, false);
  }

  /**
   * Get all categories (fetches all pages)
   */
  async getAllCategories(): Promise<HepsiburadaCategory[]> {
    const allCategories: HepsiburadaCategory[] = [];
    let page = 0;
    let hasMore = true;
    
    while (hasMore) {
      const response = await this.getCategories(page, 1000);
      if (response.data && response.data.length > 0) {
        allCategories.push(...response.data);
        page++;
        // Check if this was the last page
        hasMore = !response.last;
      } else {
        hasMore = false;
      }
    }
    
    return allCategories;
  }

  /**
   * Get category attributes
   * NOTE: Using test environment - production requires separate credentials
   */
  async getCategoryAttributes(categoryId: number): Promise<HepsiburadaApiResponse<HepsiburadaCategoryAttribute[]>> {
    const endpoint = HEPSIBURADA_CONFIG.ENDPOINTS.GET_CATEGORY_ATTRIBUTES.replace(
      '{categoryId}',
      categoryId.toString()
    );
    // Use test environment (production requires different credentials)
    return this.makeRequest(endpoint, 'GET', undefined, false);
  }

  /**
   * Get attribute values for enum type attributes
   * NOTE: Using test environment - production requires separate credentials
   */
  async getAttributeValues(
    categoryId: number, 
    attributeId: string
  ): Promise<Array<{ id: string; value: string }>> {
    const endpoint = HEPSIBURADA_CONFIG.ENDPOINTS.GET_ATTRIBUTE_VALUES
      .replace('{categoryId}', categoryId.toString())
      .replace('{attributeId}', attributeId);
    
    // Use test environment (production requires different credentials)
    return this.makeRequest(endpoint, 'GET', undefined, false);
  }

  /**
   * Import products (create new catalog items)
   */
  async importProducts(products: unknown[]): Promise<HepsiburadaApiResponse<{ trackingId: string }>> {
    return this.makeRequest(
      HEPSIBURADA_CONFIG.ENDPOINTS.CREATE_PRODUCT,
      'POST',
      { products }
    );
  }

  /**
   * Create or update listings
   */
  async createListings(listings: unknown[]): Promise<HepsiburadaApiResponse<{ trackingId: string }>> {
    return this.makeRequest(
      HEPSIBURADA_CONFIG.ENDPOINTS.CREATE_LISTING,
      'POST',
      { listings }
    );
  }

  /**
   * Get listings
   */
  async getListings(params?: {
    page?: number;
    size?: number;
    merchantSku?: string;
  }): Promise<HepsiburadaApiResponse<HepsiburadaListing[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.set('page', params.page.toString());
    if (params?.size !== undefined) queryParams.set('size', params.size.toString());
    if (params?.merchantSku) queryParams.set('merchantSku', params.merchantSku);

    const query = queryParams.toString();
    const endpoint = `${HEPSIBURADA_CONFIG.ENDPOINTS.GET_PRODUCTS}${query ? '?' + query : ''}`;

    return this.makeRequest(endpoint);
  }

  /**
   * Update stock
   */
  async updateStock(items: Array<{ merchantSku: string; stock: number }>) {
    return this.makeRequest(
      HEPSIBURADA_CONFIG.ENDPOINTS.UPDATE_INVENTORY,
      'POST',
      { items }
    );
  }

  /**
   * Update price
   */
  async updatePrice(items: Array<{ merchantSku: string; price: number }>) {
    return this.makeRequest(
      HEPSIBURADA_CONFIG.ENDPOINTS.UPDATE_PRICE,
      'POST',
      { items }
    );
  }

  /**
   * Get cargo companies
   */
  async getCargoCompanies(): Promise<HepsiburadaApiResponse<HepsiburadaCargoCompany[]>> {
    return this.makeRequest(HEPSIBURADA_CONFIG.ENDPOINTS.GET_CARGO_COMPANIES);
  }

  /**
   * Delete listing
   */
  async deleteListings(merchantSkus: string[]) {
    return this.makeRequest(
      HEPSIBURADA_CONFIG.ENDPOINTS.DELETE_PRODUCT,
      'DELETE',
      { items: merchantSkus.map(sku => ({ merchantSku: sku })) }
    );
  }

  /**
   * Get orders
   */
  async getOrders(params?: {
    page?: number;
    size?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.set('page', params.page.toString());
    if (params?.size !== undefined) queryParams.set('size', params.size.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);

    const query = queryParams.toString();
    const endpoint = `${HEPSIBURADA_CONFIG.ENDPOINTS.GET_ORDERS}${query ? '?' + query : ''}`;

    return this.makeRequest(endpoint);
  }
}

// Export singleton instance (without credentials - they'll be set later)
export const hepsiburadaClient = new HepsiburadaApiClient();
