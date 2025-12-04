/**
 * Hepsiburada Listing API Test Endpoint
 * POST /api/v1/hepsiburada/test-listing
 * 
 * This endpoint receives product data from the frontend and sends it to Hepsiburada's External Listing API
 */

import { NextRequest, NextResponse } from 'next/server';
import { HEPSIBURADA_CONFIG, generateHepsiburadaAuthToken } from '@/lib/integrations/hepsiburada/config';
import { HepsiburadaListingTestRequest, HepsiburadaListingTestResponse } from '@/lib/integrations/hepsiburada/types';

export async function POST(request: NextRequest) {
  try {
    const body: HepsiburadaListingTestRequest = await request.json();
    
    console.log('📦 Hepsiburada Listing API Test Request:', JSON.stringify(body, null, 2));

    // Get credentials from environment variables (ZORUNLU)
    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID || HEPSIBURADA_CONFIG.MERCHANT_ID;
    const username = process.env.HEPSIBURADA_USERNAME || HEPSIBURADA_CONFIG.USERNAME;
    const password = process.env.HEPSIBURADA_PASSWORD || HEPSIBURADA_CONFIG.PASSWORD;

    // Validate credentials
    if (!username || !password) {
      console.error('❌ API credentials missing!');
      return NextResponse.json({
        success: false,
        message: '❌ API kimlik bilgileri eksik',
        errors: [
          'HEPSIBURADA_USERNAME ve HEPSIBURADA_PASSWORD environment variable\'ları tanımlanmalıdır.',
          'Bu bilgileri Hepsiburada Satıcı Paneli > Entegrasyon ayarlarından alabilirsiniz.',
          '.env.local dosyasına ekleyin veya config.ts dosyasında tanımlayın.',
        ],
        timestamp: new Date().toISOString(),
      }, { status: 401 });
    }

    // Generate auth token (Standard 2-part format: username:password)
    // Trying: ServisAnahtarı:MerchantID
    const authToken = generateHepsiburadaAuthToken(username, password);
    
    console.log('🔐 Using credentials:', {
      merchantId,
      username: username.substring(0, 10) + '...',
      passwordLength: password.length,
      authFormat: 'username:password (2-part standard)',
      authTokenPreview: authToken.substring(0, 20) + '...',
    });

    // Prepare the endpoint URL
    const endpoint = HEPSIBURADA_CONFIG.ENDPOINTS.EXTERNAL_LISTING.replace('{merchantId}', merchantId);
    const url = `${HEPSIBURADA_CONFIG.LISTING_BASE_URL}${endpoint}`;

    console.log('🌐 Hepsiburada API URL:', url);
    console.log('🔐 Auth Token:', authToken.substring(0, 20) + '...');

    // Prepare the request payload
    const payload = body.products || body;

    // Send request to Hepsiburada API
    const hepsiburadaResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authToken}`,
        'User-Agent': HEPSIBURADA_CONFIG.HEADERS['User-Agent'],
      },
      body: JSON.stringify(payload),
    });

    console.log('📊 Hepsiburada API Status:', hepsiburadaResponse.status);
    console.log('📊 Hepsiburada API Headers:', Object.fromEntries(hepsiburadaResponse.headers.entries()));

    // Get response text first
    const responseText = await hepsiburadaResponse.text();
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

    if (hepsiburadaResponse.ok) {
      // Success response
      const response: HepsiburadaListingTestResponse = {
        success: true,
        message: '✅ Ürün başarıyla Hepsiburada API\'sine gönderildi!',
        apiResponse,
        timestamp,
        statusCode: hepsiburadaResponse.status,
      };

      console.log('✅ Success response:', response);
      return NextResponse.json(response, { status: 200 });
    } else {
      // Error response
      const errors: string[] = [];
      
      // Check for authentication errors
      if (hepsiburadaResponse.status === 401) {
        errors.push('🔐 KİMLİK DOĞRULAMA HATASI (401 Unauthorized)');
        errors.push('Username veya Password hatalı. Lütfen kontrol edin:');
        errors.push('1. .env.local dosyasındaki credentials doğru mu?');
        errors.push('2. Hepsiburada test credentials: Username=MerchantID, Password=SecretKey');
        errors.push('3. Development sunucusunu yeniden başlattınız mı?');
        errors.push('4. Terminal\'de credential log\'larını kontrol edin');
      }
      
      // Extract errors from response
      if (apiResponse.errors && Array.isArray(apiResponse.errors)) {
        apiResponse.errors.forEach((error: any) => {
          const errorMsg = `[${error.field || 'General'}] ${error.message || error}`;
          errors.push(errorMsg);
        });
      } else if (apiResponse.message) {
        errors.push(apiResponse.message);
      } else if (apiResponse.error) {
        errors.push(apiResponse.error);
      } else {
        errors.push(`HTTP ${hepsiburadaResponse.status}: ${hepsiburadaResponse.statusText}`);
      }

      const response: HepsiburadaListingTestResponse = {
        success: false,
        message: '❌ Hepsiburada API hatası',
        apiResponse,
        errors,
        timestamp,
        statusCode: hepsiburadaResponse.status,
      };

      console.log('❌ Error response:', response);
      return NextResponse.json(response, { status: 200 }); // Return 200 to frontend but with success: false
    }
  } catch (error: unknown) {
    console.error('❌ Internal API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    const response: HepsiburadaListingTestResponse = {
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
    message: 'Hepsiburada Listing API Test Endpoint',
    usage: {
      endpoint: '/api/v1/hepsiburada/test-listing',
      method: 'POST',
      description: 'Send product data to Hepsiburada External Listing API',
      examplePayload: [
        {
          categoryId: 18021982,
          merchant: '6fc6d90d-ee1d-4372-b3a6-264b1275e9ff',
          attributes: {
            merchantSku: 'SAMPLE-SKU-INT-0',
            VaryantGroupID: 'Hepsiburada0',
            Barcode: '1234567891234',
            UrunAdi: 'Test Ürün',
            UrunAciklamasi: 'Ürün açıklaması test...',
            Marka: 'Nike',
            GarantiSuresi: 24,
            kg: '1',
            tax_vat_rate: '5',
            price: '130,50',
            stock: '13',
            Image1: 'https://productimages.hepsiburada.net/s/27/552/10194862145586.jpg',
          },
        },
      ],
    },
  });
}
