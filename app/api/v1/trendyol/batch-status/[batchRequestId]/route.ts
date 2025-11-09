/**
 * Trendyol Batch Status Check API
 * GET /api/v1/trendyol/batch-status/[batchRequestId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkBatchStatus } from '@/lib/integrations/trendyol/service';

type RouteContext = {
  params: Promise<{ batchRequestId: string }> | { batchRequestId: string };
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Handle both Promise and direct params for Next.js compatibility
    const params = context.params instanceof Promise 
      ? await context.params 
      : context.params;
    
    const { batchRequestId } = params;
    
    if (!batchRequestId) {
      return NextResponse.json({
        success: false,
        error: 'batchRequestId parametresi gerekli',
      }, { status: 400 });
    }

    console.log('🔍 Batch durumu sorgulanıyor:', batchRequestId);

    // Check batch status
    const result = await checkBatchStatus(batchRequestId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Batch durumu başarıyla alındı',
        data: result.data,
        status: result.status,
        itemCount: result.itemCount,
        failedItemCount: result.failedItemCount,
        items: result.items,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'Batch durumu alınırken hata oluştu',
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('❌ Batch status API hatası:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Bilinmeyen hata',
      message: 'Trendyol API hatası',
    }, { status: 500 });
  }
}
