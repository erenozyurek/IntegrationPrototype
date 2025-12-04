/**
 * Hepsiburada Product Tracking Status API
 * GET /api/hb-tracking/[trackingId]
 * 
 * Ürün Durumu Sorgulama - Tracking ID ile gönderilen ürünlerin durumunu kontrol eder
 */

import { NextRequest, NextResponse } from 'next/server';

// Hepsiburada API Configuration
const HB_CONFIG = {
  API_URL: 'https://mpop-sit.hepsiburada.com/product/api/products/status',
  USERNAME: '3f95e71f-c39e-4266-9eb4-c154807e87f7', // Merchant ID (Username)
  PASSWORD: 'd8rCXfXqWJW2', // Secret Key
  USER_AGENT: 'aserai_dev',
};

// Generate Basic Auth token
function generateBasicAuth(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  return Buffer.from(credentials).toString('base64');
}

type RouteContext = {
  params: Promise<{ trackingId: string }> | { trackingId: string };
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Handle both Promise and direct params for Next.js compatibility
    const params = context.params instanceof Promise 
      ? await context.params 
      : context.params;
    
    const { trackingId } = params;
    
    if (!trackingId) {
      return NextResponse.json({
        success: false,
        message: '❌ trackingId parametresi gerekli',
        errors: ['trackingId URL parametresi olarak gönderilmelidir'],
      }, { status: 400 });
    }

    // Parse query parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '0';
    const size = searchParams.get('size') || '20';

    console.log('🔍 Hepsiburada Tracking Status Sorgusu');
    console.log('📋 Tracking ID:', trackingId);
    console.log('📄 Page:', page, 'Size:', size);

    // Generate Basic Auth token
    const authToken = generateBasicAuth(HB_CONFIG.USERNAME, HB_CONFIG.PASSWORD);
    
    // Build API URL with tracking ID and pagination
    const apiUrl = `${HB_CONFIG.API_URL}/${trackingId}?page=${page}&size=${size}`;
    
    console.log('🌐 API URL:', apiUrl);

    // Make request to Hepsiburada API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'User-Agent': HB_CONFIG.USER_AGENT,
        'Accept': 'application/json',
      },
    });

    console.log('📡 Hepsiburada API Response Status:', response.status);

    // Get response text first
    const responseText = await response.text();
    console.log('📄 Hepsiburada API Response Text:', responseText);

    // Handle non-200 responses
    if (!response.ok) {
      // Try to parse as JSON
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }

      const errorMessages = [];
      
      if (response.status === 401) {
        errorMessages.push('🔒 KİMLİK DOĞRULAMA HATASI (401 Unauthorized)');
        errorMessages.push('Username veya Password hatalı');
        errorMessages.push('Environment variables kontrol edin');
      } else if (response.status === 403) {
        errorMessages.push('🔒 ERİŞİM ENGELLENDİ (403 Forbidden)');
        errorMessages.push('Authentication bilgileri doğru ama yetki yok');
        errorMessages.push('Test hesabınızın bu API\'ye erişimi var mı kontrol edin');
      } else if (response.status === 404) {
        errorMessages.push('❌ TRACKING ID BULUNAMADI (404 Not Found)');
        errorMessages.push('Girilen tracking ID geçersiz veya bulunamadı');
        errorMessages.push(`Tracking ID: ${trackingId}`);
      } else {
        errorMessages.push(`❌ API HATASI (${response.status})`);
      }

      errorMessages.push(errorData.message || responseText);

      return NextResponse.json({
        success: false,
        message: '❌ Hepsiburada API hatası',
        statusCode: response.status,
        data: errorData,
        errors: errorMessages,
        timestamp: new Date().toISOString(),
      }, { status: response.status });
    }

    // Parse successful response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('❌ JSON parse hatası:', error);
      return NextResponse.json({
        success: false,
        message: '❌ Response parse edilemedi',
        errors: ['API response geçerli bir JSON değil'],
        rawResponse: responseText,
      }, { status: 500 });
    }

    console.log('✅ Hepsiburada Tracking Status başarılı');

    // Extract useful information
    const summary = {
      totalElements: data.totalElements || 0,
      totalPages: data.totalPages || 0,
      currentPage: data.number || 0,
      itemsInPage: data.numberOfElements || 0,
      isFirstPage: data.first || false,
      isLastPage: data.last || false,
    };

    // Analyze product statuses
    const statusCounts: Record<string, number> = {};
    const products = data.data || [];
    
    products.forEach((product: any) => {
      const status = product.productStatus || 'UNKNOWN';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      message: '✅ Tracking durumu başarıyla alındı',
      trackingId,
      summary,
      statusCounts,
      data: data,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Hepsiburada Tracking Status API hatası:', error);
    
    return NextResponse.json({
      success: false,
      message: '❌ Sunucu hatası',
      error: error.message || 'Bilinmeyen hata',
      errors: [
        'Tracking status sorgulanırken beklenmeyen bir hata oluştu',
        error.message || 'Detay yok',
      ],
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
