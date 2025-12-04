/**
 * Hepsiburada Product Import API Route
 * POST /api/hb-import
 * 
 * IMPORTANT: This API requires multipart/form-data with a JSON file (not raw JSON body)
 * The JSON data must be uploaded as a file parameter named "file" with filename "integrator.json"
 */

import { NextRequest, NextResponse } from 'next/server';

// Hepsiburada API Configuration
const HB_CONFIG = {
  API_URL: 'https://mpop-sit.hepsiburada.com/product/api/products/import?version=1',
  USERNAME: '3f95e71f-c39e-4266-9eb4-c154807e87f7', // Merchant ID (Username)
  PASSWORD: 'd8rCXfXqWJW2', // Secret Key
  USER_AGENT: 'aserai_dev',
  FILE_NAME: 'integrator.json',
};

// Generate Basic Auth token
function generateBasicAuth(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  return Buffer.from(credentials).toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    // Get JSON data from frontend
    const body = await request.json();
    
    console.log('📦 Hepsiburada Product Import Request (will be uploaded as file)');
    console.log('📄 JSON Data:', JSON.stringify(body, null, 2));

    // Generate Basic Auth token
    const authToken = generateBasicAuth(HB_CONFIG.USERNAME, HB_CONFIG.PASSWORD);
    
    console.log('🔐 Using credentials:', {
      username: HB_CONFIG.USERNAME.substring(0, 5) + '...',
      password: HB_CONFIG.PASSWORD.substring(0, 5) + '...',
      userAgent: HB_CONFIG.USER_AGENT,
    });

    // Create FormData and append JSON as file
    const formData = new FormData();
    
    // Convert JSON to Blob (simulating a file)
    const jsonString = JSON.stringify(body);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Append as file with filename "integrator.json"
    formData.append('file', blob, HB_CONFIG.FILE_NAME);
    
    console.log('📤 FormData created with file:', HB_CONFIG.FILE_NAME);
    console.log('📊 File size:', blob.size, 'bytes');

    // Send request to Hepsiburada API
    // IMPORTANT: Do NOT set Content-Type header manually - fetch will add it with boundary
    const hbResponse = await fetch(HB_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'User-Agent': HB_CONFIG.USER_AGENT,
        // Content-Type will be set automatically by fetch with multipart boundary
      },
      body: formData,
    });

    console.log('📊 Hepsiburada API Status:', hbResponse.status);
    console.log('📊 Hepsiburada API Headers:', Object.fromEntries(hbResponse.headers.entries()));

    // Get response text first
    const responseText = await hbResponse.text();
    console.log('📄 Hepsiburada API Response Text:', responseText);

    // Try to parse as JSON
    let apiResponse: any;
    try {
      apiResponse = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      apiResponse = { rawResponse: responseText };
    }

    // Prepare response
    const timestamp = new Date().toISOString();

    if (hbResponse.ok) {
      // Success response
      const response = {
        success: true,
        message: '✅ Ürün başarıyla Hepsiburada\'ya yüklendi (multipart/form-data)!',
        statusCode: hbResponse.status,
        data: apiResponse,
        timestamp,
      };

      console.log('✅ Success response:', response);
      return NextResponse.json(response, { status: 200 });
    } else {
      // Error response
      const errors: string[] = [];
      
      // Check for authentication/authorization errors
      if (hbResponse.status === 401) {
        errors.push('🔐 KİMLİK DOĞRULAMA HATASI (401 Unauthorized)');
        errors.push('Servis anahtarı veya secret key hatalı olabilir');
      } else if (hbResponse.status === 403) {
        errors.push('🔒 ERİŞİM ENGELLENDİ (403 Forbidden)');
        errors.push('Authentication bilgileri doğru ama yetki yok veya API endpoint hatalı');
        errors.push('Test ortamı için doğru endpoint kullanıldığından emin olun');
      }
      
      // Extract errors from response
      if (apiResponse.errors && Array.isArray(apiResponse.errors)) {
        apiResponse.errors.forEach((error: any) => {
          const errorMsg = `[${error.field || 'Genel'}] ${error.message || error}`;
          errors.push(errorMsg);
        });
      } else if (apiResponse.message) {
        errors.push(apiResponse.message);
      } else if (apiResponse.error) {
        errors.push(apiResponse.error);
      } else if (errors.length === 0) {
        errors.push(`HTTP ${hbResponse.status}: ${hbResponse.statusText}`);
      }

      const response = {
        success: false,
        message: '❌ Hepsiburada API hatası',
        statusCode: hbResponse.status,
        data: apiResponse,
        errors,
        timestamp,
      };

      console.log('❌ Error response:', response);
      return NextResponse.json(response, { status: 200 }); // Return 200 to frontend but with success: false
    }
  } catch (error: unknown) {
    console.error('❌ Internal API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    
    const response = {
      success: false,
      message: '❌ İç sunucu hatası',
      errors: [errorMessage],
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Hepsiburada Product Import API (multipart/form-data)',
    usage: {
      endpoint: '/api/hb-import',
      method: 'POST',
      description: 'Hepsiburada\'ya ürün gönderir (JSON dosyası olarak yüklenir)',
      format: 'multipart/form-data with file parameter',
      config: {
        apiUrl: HB_CONFIG.API_URL,
        username: HB_CONFIG.USERNAME.substring(0, 5) + '...',
        userAgent: HB_CONFIG.USER_AGENT,
        fileName: HB_CONFIG.FILE_NAME,
      },
    },
  });
}
