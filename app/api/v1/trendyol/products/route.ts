/**
 * Trendyol Products API
 * GET /api/v1/trendyol/products - Get products from Trendyol
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/integrations/trendyol/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 0;
    const size = searchParams.get('size') ? parseInt(searchParams.get('size')!) : 50;
    const approved = searchParams.get('approved') === 'true';

    console.log(`🔍 Trendyol ürünleri getiriliyor - Page: ${page}, Size: ${size}`);

    const result = await getProducts({ page, size, approved });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('❌ Trendyol products API hatası:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
