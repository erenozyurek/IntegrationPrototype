import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    // Fetch all temp products (table only has id and trendyol_product columns)
    const { data: tempProducts, error } = await supabaseAdmin
      .from('temp_products')
      .select('*');

    if (error) {
      console.error('Temp products fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products: ' + error.message },
        { status: 500 }
      );
    }

    // Transform data for display
    const products = tempProducts?.map((item) => {
      const trendyolProduct = item.trendyol_product;
      
      return {
        id: item.id,
        title: trendyolProduct.title || 'Untitled Product',
        description: trendyolProduct.description || '',
        master_sku: trendyolProduct.productMainId || trendyolProduct.stockCode || '',
        barcode: trendyolProduct.barcode || '',
        price: trendyolProduct.listPrice || 0,
        salePrice: trendyolProduct.salePrice || 0,
        stock: trendyolProduct.quantity || 0,
        categoryId: trendyolProduct.categoryId || 0,
        brandId: trendyolProduct.brandId || 0,
        currency: trendyolProduct.currencyType || 'TRY',
        vatRate: trendyolProduct.vatRate || 0,
        images: trendyolProduct.images || [],
        attributes: trendyolProduct.attributes || [],
        created_at: new Date().toISOString(), // Use current date as fallback
        updated_at: new Date().toISOString(),
      };
    }) || [];

    // Calculate stats
    const stats = {
      total_products: products.length,
      total_stock: products.reduce((sum, p) => sum + (p.stock || 0), 0),
      average_price: products.length > 0 
        ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length 
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: products,
      stats,
    });
  } catch (error: unknown) {
    console.error('Temp products list API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
