/**
 * Trendyol Auto Product Creation API
 * POST /api/v1/trendyol/auto-product
 * 
 * This endpoint automatically fetches category attributes and creates a valid product
 */

import { NextRequest, NextResponse } from 'next/server';
import { createProductWithValidAttributes, inspectCategory, COMMON_TEST_CATEGORIES } from '@/lib/integrations/trendyol/productHelper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const categoryId = body.categoryId || COMMON_TEST_CATEGORIES.TSHIRT; // Default to T-shirt category

    console.log(`🚀 Auto-creating product for category: ${categoryId}`);

    // Create product with auto-fetched attributes
    const result = await createProductWithValidAttributes(categoryId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Product created with valid attributes!',
        data: result.data,
        batchRequestId: result.batchRequestId,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'Failed to create product',
      }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('❌ Auto product API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: errorMessage,
      message: 'Trendyol API error',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (categoryId) {
      // Inspect a specific category
      const info = await inspectCategory(parseInt(categoryId));
      return NextResponse.json({
        success: true,
        data: info,
      });
    } else {
      // Return available test categories
      return NextResponse.json({
        success: true,
        message: 'Auto Product Creator - Fetches category attributes automatically',
        usage: {
          post: {
            endpoint: '/api/v1/trendyol/auto-product',
            body: {
              categoryId: 1071,
            },
            description: 'Creates a product with auto-fetched category attributes',
          },
          get: {
            endpoint: '/api/v1/trendyol/auto-product?categoryId=1071',
            description: 'Inspect category requirements without creating product',
          },
        },
        commonCategories: COMMON_TEST_CATEGORIES,
      });
    }
  } catch (error: unknown) {
    console.error('❌ Auto product GET error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
