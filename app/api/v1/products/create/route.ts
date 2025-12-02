import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Extract form data
    const {
      title,
      description,
      brand_id,
      master_sku,
      trendyol_category_id,
      attributes,
      variants,
      price,
      currency,
      vat_rate,
      stock_quantity,
      barcode,
      weight_grams,
      cargo_provider_id,
      images,
    } = body;

    // Prepare Trendyol product JSON format (exact format Trendyol API expects)
    const trendyolProduct = {
      barcode: barcode || master_sku,
      title,
      productMainId: master_sku,
      brandId: brand_id || 0, // Trendyol requires brandId
      categoryId: trendyol_category_id,
      quantity: stock_quantity || 0,
      stockCode: master_sku,
      dimensionalWeight: weight_grams ? weight_grams / 1000 : 0, // Convert to kg
      description,
      currencyType: currency || 'TRY',
      listPrice: price,
      salePrice: price,
      vatRate: vat_rate || 20,
      cargoCompanyId: cargo_provider_id || 1, // Default cargo company
      images: images?.map((img: { url: string }) => ({ url: img.url })) || [],
      attributes: attributes || [],
      // Include variants if they exist
      variants: variants || null,
    };

    // Save to temp_products table
    const { data: tempProduct, error: tempError } = await supabaseAdmin
      .from('temp_products')
      .insert({
        trendyol_product: trendyolProduct,
      })
      .select()
      .single();

    if (tempError) {
      console.error('Temp product insert error:', tempError);
      return NextResponse.json(
        { error: 'Failed to save product: ' + tempError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: tempProduct.id,
        trendyol_product: trendyolProduct,
      },
      message: 'Ürün başarıyla kaydedildi!',
    });
  } catch (error: unknown) {
    console.error('Create product API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
}
