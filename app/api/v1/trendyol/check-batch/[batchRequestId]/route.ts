import { NextResponse } from 'next/server';
import { trendyolClient } from '@/lib/integrations/trendyol/client';

interface BatchRequestParams {
  batchRequestId: string;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<BatchRequestParams> }
) {
  try {
    const { batchRequestId } = await params;

    console.log('🔍 Checking batch status:', batchRequestId);

    const response = await trendyolClient.getBatchRequestResult(batchRequestId);

    console.log('📥 Batch status response:', JSON.stringify(response, null, 2));

    const batchData = response as {
      batchRequestId: string;
      items: Array<{
        requestItem: unknown;
        status: string;
        failureReasons: Array<{ message: string }>;
      }>;
      status?: string;
      creationDate?: number;
      lastModifiedDate?: number;
      sourceType?: string;
      itemCount?: number;
      failedItemCount?: number;
    };

    // Check if batch processing is complete
    const isCompleted = batchData.status === 'COMPLETED' || batchData.items?.length > 0;
    
    if (!isCompleted) {
      return NextResponse.json({
        success: false,
        status: 'PROCESSING',
        message: 'Ürün hala işleniyor. Lütfen birkaç saniye bekleyin...',
        data: batchData,
      });
    }

    // Check each item's status
    const results = batchData.items.map((item) => {
      const isSuccess = item.status === 'SUCCESS';
      const failureMessages = item.failureReasons?.map((r) => r.message) || [];

      return {
        status: item.status,
        success: isSuccess,
        failureReasons: failureMessages,
      };
    });

    const hasFailures = results.some((r) => !r.success);

    if (hasFailures) {
      const allErrors = results
        .filter((r) => !r.success)
        .flatMap((r) => r.failureReasons)
        .join(', ');

      return NextResponse.json({
        success: false,
        status: 'FAILED',
        message: 'Ürün gönderilemedi',
        errors: allErrors,
        data: batchData,
      });
    }

    return NextResponse.json({
      success: true,
      status: 'SUCCESS',
      message: 'Ürün başarıyla Trendyol\'a gönderildi! Onay bekliyor...',
      data: batchData,
    });
  } catch (error: unknown) {
    console.error('❌ Batch status check error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to check batch status',
      },
      { status: 500 }
    );
  }
}
