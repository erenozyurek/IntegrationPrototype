/**
 * Hepsiburada Category Attributes API
 * GET /api/hb-category-attributes/[categoryId]
 * 
 * Retrieves all attributes for a specific category including:
 * - Mandatory fields
 * - Field IDs (like fields.00000MU)
 * - Allowed values for enum types
 */

import { NextRequest, NextResponse } from 'next/server';

// Hepsiburada API Configuration
const HB_CONFIG = {
  API_URL: 'https://mpop-sit.hepsiburada.com/product/api/categories',
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
  params: Promise<{ categoryId: string }> | { categoryId: string };
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
    
    const { categoryId } = params;
    
    if (!categoryId) {
      return NextResponse.json({
        success: false,
        message: '❌ categoryId parametresi gerekli',
        errors: ['categoryId URL parametresi olarak gönderilmelidir'],
      }, { status: 400 });
    }

    console.log('🔍 Hepsiburada Category Attributes Sorgusu');
    console.log('📋 Category ID:', categoryId);

    // Generate Basic Auth token
    const authToken = generateBasicAuth(HB_CONFIG.USERNAME, HB_CONFIG.PASSWORD);
    
    // Build API URL
    const apiUrl = `${HB_CONFIG.API_URL}/${categoryId}/attributes`;
    
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
    console.log('📄 Hepsiburada API Response (first 1000 chars):', responseText.substring(0, 1000));

    // Handle non-200 responses
    if (!response.ok) {
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
      } else if (response.status === 403) {
        errorMessages.push('🔒 ERİŞİM ENGELLENDİ (403 Forbidden)');
        errorMessages.push('Bu API\'ye erişim yetkiniz yok');
      } else if (response.status === 404) {
        errorMessages.push('❌ KATEGORİ BULUNAMADI (404 Not Found)');
        errorMessages.push(`Category ID: ${categoryId} bulunamadı veya attributes yok`);
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
        rawResponse: responseText.substring(0, 1000),
      }, { status: 500 });
    }

    console.log('✅ Hepsiburada Category Attributes başarılı');

    // Analyze attributes - Hepsiburada returns baseAttributes and categoryAttributes
    const baseAttributes = data.data?.baseAttributes || [];
    const categoryAttributes = data.data?.categoryAttributes || [];
    const attributes = [...baseAttributes, ...categoryAttributes];
    
    const mandatoryAttributes = attributes.filter((attr: any) => attr.mandatory === true);
    const optionalAttributes = attributes.filter((attr: any) => attr.mandatory !== true);
    const enumAttributes = attributes.filter((attr: any) => attr.type === 'Enum');
    
    const summary = {
      totalAttributes: attributes.length,
      mandatoryCount: mandatoryAttributes.length,
      optionalCount: optionalAttributes.length,
      enumCount: enumAttributes.length,
    };

    // Extract field mappings
    const fieldMappings: Record<string, any> = {};
    attributes.forEach((attr: any) => {
      fieldMappings[attr.name] = {
        id: attr.id,
        mandatory: attr.mandatory || false,
        type: attr.type,
        multiValue: attr.multiValue || false,
      };
    });

    return NextResponse.json({
      success: true,
      message: '✅ Kategori attributes başarıyla alındı',
      categoryId,
      summary,
      mandatoryAttributes,
      optionalAttributes,
      enumAttributes,
      fieldMappings,
      data: data,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Hepsiburada Category Attributes API hatası:', error);
    
    return NextResponse.json({
      success: false,
      message: '❌ Sunucu hatası',
      error: error.message || 'Bilinmeyen hata',
      errors: [
        'Category attributes sorgulanırken beklenmeyen bir hata oluştu',
        error.message || 'Detay yok',
      ],
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
