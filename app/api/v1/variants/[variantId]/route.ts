import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function PUT(
  request: NextRequest,
  { params }: { params: { variantId: string } }
) {
  try {
    const variantId = params.variantId;
    const body = await request.json();
    const { cost_price, stock_quantity, status, barcode } = body;

    if (!variantId) {
      return NextResponse.json(
        { success: false, error: 'Varyant ID gerekli' },
        { status: 400 }
      );
    }

    // Update variant
    const updateData: any = {};
    
    if (cost_price !== undefined) updateData.cost_price = cost_price;
    if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity;
    if (status !== undefined) updateData.status = status;
    if (barcode !== undefined) updateData.barcode = barcode;
    
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('product_variants')
      .update(updateData)
      .eq('id', variantId)
      .select()
      .single();

    if (error) {
      console.error('Variant update error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Varyant başarıyla güncellendi',
      variant: data,
    });

  } catch (error: any) {
    console.error('Variant update API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
