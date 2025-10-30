import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Ürün ID gerekli' },
        { status: 400 }
      );
    }

    // Get all variants for this product
    const { data: variants, error } = await supabase
      .from('product_variants')
      .select('id, master_sku, barcode, cost_price, stock_quantity, status')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Variants fetch error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      variants: variants || [],
    });

  } catch (error: any) {
    console.error('Variants API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
