import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id,
      variant_id,
      title, 
      description, 
      base_cost_price,
      stock_quantity,
      status
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Ürün ID gerekli' },
        { status: 400 }
      );
    }

    // Update product basic info
    const updateData: any = {
      title,
      description,
      base_cost_price,
      status,
      updated_at: new Date().toISOString(),
    };

    // Update product
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Product update error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Update stock and price for the variant if provided
    if (variant_id && (stock_quantity !== undefined || base_cost_price !== undefined)) {
      const variantUpdateData: any = {};
      
      if (stock_quantity !== undefined) {
        variantUpdateData.stock_quantity = stock_quantity;
      }
      
      if (base_cost_price !== undefined) {
        variantUpdateData.cost_price = base_cost_price;
      }

      const { error: variantError } = await supabase
        .from('product_variants')
        .update(variantUpdateData)
        .eq('id', variant_id);

      if (variantError) {
        console.error('Variant update error:', variantError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Ürün başarıyla güncellendi',
      product: data,
    });

  } catch (error: any) {
    console.error('Update API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
