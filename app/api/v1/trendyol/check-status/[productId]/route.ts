import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { trendyolClient } from '@/lib/integrations/trendyol/client';

interface RouteParams {
  productId: string;
}

export async function GET(
  req: Request,
  context: { params: Promise<RouteParams> }
) {
  try {
    const { productId } = await context.params;

    // Fetch product from database
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('temp_products')
      .select('*')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product has been sent to Trendyol
    if (!product.batch_request_id) {
      return NextResponse.json({
        success: false,
        status: 'not_sent',
        message: 'Bu ürün henüz Trendyol\'a gönderilmemiş',
      });
    }

    console.log('🔍 Checking Trendyol status for batch:', product.batch_request_id);

    // Check batch status with Trendyol
    const batchResult = await trendyolClient.getBatchRequestResult(product.batch_request_id);

    console.log('📥 Batch status response:', JSON.stringify(batchResult, null, 2));

    // Parse the response
    const batchData = batchResult as {
      status?: string;
      items?: Array<{
        status?: string;
        failureReasons?: string[];
      }>;
    };

    let newStatus = product.trendyol_status || 'pending';
    let failureReasons: string[] = [];

    if (batchData.status === 'COMPLETED') {
      // Check individual item statuses
      const items = batchData.items || [];
      if (items.length > 0) {
        const firstItem = items[0];
        if (firstItem.status === 'SUCCESS') {
          newStatus = 'approved';
        } else if (firstItem.status === 'FAILED') {
          newStatus = 'failed';
          failureReasons = firstItem.failureReasons || [];
        }
      }
    } else if (batchData.status === 'PROCESSING') {
      newStatus = 'pending';
    }

    // Update product status in database
    const updateData: Record<string, unknown> = {
      trendyol_status: newStatus,
      last_sync_at: new Date().toISOString(),
    };

    if (failureReasons.length > 0) {
      updateData.failure_reasons = failureReasons;
    }

    const { error: updateError } = await supabaseAdmin
      .from('temp_products')
      .update(updateData)
      .eq('id', productId);

    if (updateError) {
      console.error('Failed to update product status:', updateError);
    }

    return NextResponse.json({
      success: newStatus === 'approved',
      status: newStatus,
      message: 
        newStatus === 'approved' ? 'Ürün Trendyol\'da onaylandı! 🎉' :
        newStatus === 'pending' ? 'Ürün hala Trendyol onayı bekliyor...' :
        newStatus === 'failed' ? 'Ürün Trendyol tarafından reddedildi' :
        'Durum bilinmiyor',
      failureReasons: failureReasons.length > 0 ? failureReasons : undefined,
      batchData,
    });

  } catch (error: unknown) {
    console.error('❌ Check status error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to check product status',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
