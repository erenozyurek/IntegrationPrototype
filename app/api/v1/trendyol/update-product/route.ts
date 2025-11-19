import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { trendyolClient } from '@/lib/integrations/trendyol/client';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/v1/trendyol/update-product
 * Updates product in Trendyol and syncs to local database
 * 
 * Supports two types of updates:
 * 1. Price/Stock Update (fast) - Only updates quantity, prices
 * 2. Full Product Update - Updates all product information
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, barcode, updates } = body;

    console.log('📝 Update Product Request:', { productId, barcode, updates });

    if (!productId || !barcode) {
      return NextResponse.json(
        { error: 'productId and barcode are required' },
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

    // Check if product is approved in Trendyol
    if (product.trendyol_status !== 'approved') {
      return NextResponse.json(
        { 
          error: 'Product must be approved in Trendyol before updating',
          status: product.trendyol_status 
        },
        { status: 400 }
      );
    }

    // Determine update type
    // Only do price/stock update if ONLY price/stock fields are being updated
    const hasPriceStock = updates.quantity !== undefined || 
                          updates.listPrice !== undefined || 
                          updates.salePrice !== undefined;
    
    const hasOtherFields = updates.title !== undefined ||
                           updates.description !== undefined ||
                           updates.brandId !== undefined ||
                           updates.vatRate !== undefined ||
                           updates.images !== undefined ||
                           updates.dimensionalWeight !== undefined;
    
    const isPriceStockOnly = hasPriceStock && !hasOtherFields;

    console.log('🔍 Update type determination:', { 
      hasPriceStock, 
      hasOtherFields, 
      isPriceStockOnly,
      updateKeys: Object.keys(updates)
    });

    if (isPriceStockOnly) {
      // Fast price/stock update using Trendyol's updatePriceAndInventory API
      console.log('💰 Using PRICE/STOCK update endpoint');
      const priceStockUpdate = {
        items: [
          {
            barcode,
            quantity: updates.quantity ?? product.trendyol_product?.quantity ?? 0,
            salePrice: updates.salePrice ?? product.trendyol_product?.salePrice ?? 0,
            listPrice: updates.listPrice ?? product.trendyol_product?.listPrice ?? 0,
          },
        ],
      };

      console.log('Updating price/stock in Trendyol:', priceStockUpdate);

      try {
        // Call Trendyol API to update price and inventory
        const trendyolResponse = await trendyolClient.updatePriceAndInventory(priceStockUpdate.items) as { batchRequestId?: string };
        
        console.log('Trendyol price/stock update response:', trendyolResponse);
        
        // Update local database
        const { error: updateError } = await supabaseAdmin
          .from('temp_products')
          .update({
            trendyol_product: {
              ...product.trendyol_product,
              quantity: priceStockUpdate.items[0].quantity,
              salePrice: priceStockUpdate.items[0].salePrice,
              listPrice: priceStockUpdate.items[0].listPrice,
            },
            last_sync_at: new Date().toISOString(),
          })
          .eq('id', productId);

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        return NextResponse.json({
          success: true,
          message: 'Fiyat ve stok Trendyol\'da güncellendi',
          updateType: 'price-stock',
          batchRequestId: trendyolResponse.batchRequestId || null,
        });
      } catch (error) {
        console.error('Price/stock update error:', error);
        return NextResponse.json(
          { 
            error: 'Trendyol\'da fiyat/stok güncellenirken hata oluştu',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    } else {
      // Full product update using Trendyol's updateProduct API
      // Note: Some fields cannot be updated after approval (like barcode, productMainId)
      console.log('📦 Using FULL PRODUCT update endpoint');
      
      try {
        // Get brandId - use updated value if valid (> 0), otherwise use existing
        const brandId = (updates.brandId && updates.brandId > 0) 
          ? updates.brandId 
          : product.trendyol_product?.brandId;
        
        // Validate brandId
        if (!brandId || brandId <= 0) {
          return NextResponse.json(
            { 
              error: 'Geçersiz marka ID',
              details: `Marka ID ${brandId || 0} olamaz. Lütfen geçerli bir marka ID girin.`
            },
            { status: 400 }
          );
        }

        const fullUpdateData = {
          items: [
            {
              barcode,
              title: updates.title ?? product.trendyol_product?.title,
              productMainId: product.trendyol_product?.productMainId,
              brandId: brandId,
              categoryId: product.trendyol_product?.categoryId,
              stockCode: product.trendyol_product?.stockCode,
              dimensionalWeight: updates.dimensionalWeight ?? product.trendyol_product?.dimensionalWeight ?? 0,
              description: updates.description ?? product.trendyol_product?.description,
              currencyType: product.trendyol_product?.currencyType ?? 'TRY',
              vatRate: updates.vatRate ?? product.trendyol_product?.vatRate ?? 20,
              images: updates.images ?? product.trendyol_product?.images,
              attributes: product.trendyol_product?.attributes ?? [],
              cargoCompanyId: product.trendyol_product?.cargoCompanyId ?? 10,
            },
          ],
        };

        console.log('Updating full product in Trendyol:', fullUpdateData);

        const trendyolResponse = await trendyolClient.updateProduct(fullUpdateData) as { batchRequestId?: string };
        
        console.log('Trendyol product update response:', trendyolResponse);

        // Update local database
        const { error: updateError } = await supabaseAdmin
          .from('temp_products')
          .update({
            trendyol_product: {
              ...product.trendyol_product,
              ...fullUpdateData.items[0],
            },
            last_sync_at: new Date().toISOString(),
          })
          .eq('id', productId);

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        return NextResponse.json({
          success: true,
          message: 'Ürün bilgileri Trendyol\'da güncellendi',
          updateType: 'full-product',
          batchRequestId: trendyolResponse.batchRequestId || null,
        });
      } catch (error) {
        console.error('Full product update error:', error);
        return NextResponse.json(
          { 
            error: 'Trendyol\'da ürün güncellenirken hata oluştu',
            details: error instanceof Error ? error.message : 'Unknown error',
            hint: 'Bazı alanlar (barcode, productMainId) onaylı ürünlerde değiştirilemez.'
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
