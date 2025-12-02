import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { trendyolClient } from '@/lib/integrations/trendyol/client';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/v1/trendyol/delete-product
 * Deletes product from local database and optionally from Trendyol
 * 
 * Note: Trendyol product deletion is typically done through their seller panel
 * This endpoint focuses on local database cleanup
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, deleteFromTrendyol = false } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    // Fetch product from database
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('temp_products')
      .select('*')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: 'Product not found in database' },
        { status: 404 }
      );
    }

    let deletedFromTrendyol = false;
    let trendyolBatchRequestId: string | null = null;

    // Try to delete from Trendyol if product is approved or pending
    if (deleteFromTrendyol && (product.trendyol_status === 'approved' || product.trendyol_status === 'pending')) {
      try {
        const barcode = product.trendyol_product?.barcode || product.barcode;
        
        console.log(`Attempting to delete product from Trendyol with barcode: ${barcode}`);
        
        const trendyolResponse = await trendyolClient.deleteProducts([barcode]) as { batchRequestId?: string };
        
        if (trendyolResponse?.batchRequestId) {
          deletedFromTrendyol = true;
          trendyolBatchRequestId = trendyolResponse.batchRequestId;
          console.log(`Trendyol delete request sent. Batch ID: ${trendyolBatchRequestId}`);
        }
      } catch (error) {
        console.error('Failed to delete from Trendyol:', error);
        // Continue with local deletion even if Trendyol deletion fails
      }
    }

    // Delete images from Supabase Storage
    let imagesDeleted = 0;
    if (product.trendyol_product?.images && Array.isArray(product.trendyol_product.images)) {
      for (const image of product.trendyol_product.images) {
        if (image.url) {
          try {
            // Extract path from URL
            const urlParts = image.url.split('/product_images_test/');
            if (urlParts.length === 2) {
              const imagePath = urlParts[1].split('?')[0]; // Remove query params
              
              const { error: deleteError } = await supabaseAdmin.storage
                .from('product_images_test')
                .remove([imagePath]);

              if (deleteError) {
                console.error(`Failed to delete image ${imagePath}:`, deleteError);
              } else {
                console.log(`Deleted image: ${imagePath}`);
                imagesDeleted++;
              }
            }
          } catch (error) {
            console.error('Error deleting image:', error);
          }
        }
      }
    }

    // Delete from local database
    const { error: deleteError } = await supabaseAdmin
      .from('temp_products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      throw new Error(`Failed to delete from database: ${deleteError.message}`);
    }

    // Build response message
    let message = 'Ürün veritabanından silindi';
    if (deletedFromTrendyol) {
      message += ' ve Trendyol\'dan silme işlemi başlatıldı';
    } else if (product.trendyol_status === 'approved') {
      message += '. Trendyol\'dan silinme işlemi başarısız oldu, lütfen satıcı panelinden kontrol edin';
    }

    return NextResponse.json({
      success: true,
      message,
      deletedFromDatabase: true,
      deletedFromTrendyol,
      batchRequestId: trendyolBatchRequestId,
      imagesDeleted,
      needsManualCheck: deletedFromTrendyol && trendyolBatchRequestId !== null,
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
