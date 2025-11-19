import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { productId, status, batchRequestId, failureReasons } = await req.json();

    if (!productId || !status) {
      return NextResponse.json(
        { error: 'Product ID and status are required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      trendyol_status: status,
      last_sync_at: new Date().toISOString(),
    };

    if (batchRequestId) {
      updateData.batch_request_id = batchRequestId;
    }

    if (failureReasons && Array.isArray(failureReasons)) {
      updateData.failure_reasons = failureReasons;
    }

    const { data, error } = await supabaseAdmin
      .from('temp_products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Update status error:', error);
      return NextResponse.json(
        { error: 'Failed to update product status: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Product status updated successfully',
    });
  } catch (error: unknown) {
    console.error('Update status API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update status' },
      { status: 500 }
    );
  }
}
