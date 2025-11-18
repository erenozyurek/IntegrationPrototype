import { NextResponse } from 'next/server';
import { trendyolClient } from '@/lib/integrations/trendyol/client';

export async function POST(req: Request) {
  try {
    const { productId, trendyolProduct, variants } = await req.json();

    if (!productId || !trendyolProduct) {
      return NextResponse.json(
        { error: 'Product ID and product data are required' },
        { status: 400 }
      );
    }

    console.log('🚀 Sending product to Trendyol:', productId);
    console.log('📦 Product data:', JSON.stringify(trendyolProduct, null, 2));
    console.log('🔀 Variants:', variants ? `${variants.length} variants` : 'No variants');

    // Prepare the request in Trendyol's expected format
    let items: any[] = [];

    if (variants && variants.length > 0) {
      // Multi-variant product: Create one item per variant with same productMainId
      items = variants.map((variant: any) => {
        // Merge regular attributes with variant-specific attributes
        const allAttributes = [
          ...(trendyolProduct.attributes || []),
          ...(variant.variantAttributes || []),
        ];

        return {
          barcode: variant.barcode,
          title: trendyolProduct.title,
          productMainId: trendyolProduct.productMainId || trendyolProduct.stockCode,
          brandId: trendyolProduct.brandId || 1791,
          categoryId: trendyolProduct.categoryId,
          quantity: variant.quantity,
          stockCode: variant.stockCode,
          dimensionalWeight: trendyolProduct.dimensionalWeight || 0,
          description: trendyolProduct.description || '',
          currencyType: trendyolProduct.currencyType || 'TRY',
          listPrice: variant.listPrice,
          salePrice: variant.salePrice,
          vatRate: trendyolProduct.vatRate || 20,
          cargoCompanyId: trendyolProduct.cargoCompanyId || 10,
          images: trendyolProduct.images || [],
          attributes: allAttributes,
        };
      });
    } else {
      // Single product: Create one item
      items = [
        {
          barcode: trendyolProduct.barcode,
          title: trendyolProduct.title,
          productMainId: trendyolProduct.productMainId || trendyolProduct.stockCode,
          brandId: trendyolProduct.brandId || 1791,
          categoryId: trendyolProduct.categoryId,
          quantity: trendyolProduct.quantity || 0,
          stockCode: trendyolProduct.stockCode || trendyolProduct.productMainId,
          dimensionalWeight: trendyolProduct.dimensionalWeight || 0,
          description: trendyolProduct.description || '',
          currencyType: trendyolProduct.currencyType || 'TRY',
          listPrice: trendyolProduct.listPrice,
          salePrice: trendyolProduct.salePrice,
          vatRate: trendyolProduct.vatRate || 20,
          cargoCompanyId: trendyolProduct.cargoCompanyId || 10,
          images: trendyolProduct.images || [],
          attributes: trendyolProduct.attributes || [],
        },
      ];
    }

    const trendyolRequest = { items };

    console.log(`📤 Formatted request for Trendyol (${items.length} items):`, JSON.stringify(trendyolRequest, null, 2));

    // Send to Trendyol
    const response = await trendyolClient.createProduct(trendyolRequest);

    console.log('✅ Trendyol response:', response);

    // Extract batchRequestId from response
    const batchRequestId = (response as any).batchRequestId;

    if (!batchRequestId) {
      console.error('❌ No batchRequestId in response:', response);
      return NextResponse.json(
        { error: 'Trendyol did not return a batch request ID' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      batchRequestId,
      message: 'Ürün Trendyol\'a gönderildi! Durum kontrol ediliyor...',
    });
  } catch (error: unknown) {
    console.error('❌ Send to Trendyol error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to send product to Trendyol',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
