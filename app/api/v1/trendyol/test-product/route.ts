/**
 * Trendyol Test Product Creation API
 * POST /api/v1/trendyol/test-product
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTestProduct } from '@/lib/integrations/trendyol/service';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Trendyol test ürün API endpoint çağrıldı');

    // Create test product on Trendyol
    const result = await createTestProduct();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test ürün başarıyla Trendyol\'a gönderildi!',
        data: result.data,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'Test ürün gönderilirken hata oluştu',
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('❌ Test ürün API hatası:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Bilinmeyen hata',
      message: 'Trendyol API hatası',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Trendyol Test Product API - POST isteği ile test ürünü oluşturabilirsiniz',
    endpoint: '/api/v1/trendyol/test-product',
    method: 'POST',
  });
}
