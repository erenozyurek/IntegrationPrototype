import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Ürünleri kategori, varyant ve görselleriyle birlikte çek
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        master_sku,
        title,
        description,
        brand,
        base_cost_price,
        status,
        created_at,
        category:categories(id, name, slug),
        variants:product_variants(
          id,
          master_sku,
          barcode,
          cost_price,
          stock_quantity,
          status,
          images:product_images(
            id,
            url,
            is_primary,
            sort_order
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Products fetch error:', error);
      throw error;
    }

    console.log('🔍 API - Ham ürün verisi (ilk ürün):', JSON.stringify(products?.[0], null, 2));
    console.log('🔍 API - İlk ürünün varyantları:', products?.[0]?.variants);
    console.log('🔍 API - İlk varyantın resimleri:', products?.[0]?.variants?.[0]?.images);

    // Transform data for frontend
    const transformedProducts = await Promise.all(products?.map(async (product) => {
      // İlk varyantı al (ana varyant olarak kullan)
      const primaryVariant = product.variants?.[0];
      
      // Resimleri product_id ile direkt çek (variant üzerinden gelmiyorsa)
      let primaryImage = primaryVariant?.images?.find((img: any) => img.is_primary) 
        || primaryVariant?.images?.[0];
      
      // Eğer variant'tan resim gelmemişse, doğrudan product_id ile çek
      if (!primaryImage) {
        const { data: images } = await supabase
          .from('product_images')
          .select('id, url, is_primary, sort_order')
          .eq('product_id', product.id)
          .order('sort_order', { ascending: true })
          .limit(1);
        
        if (images && images.length > 0) {
          primaryImage = images[0];
        }
        console.log(`🖼️ Product ${product.id} için direkt sorgu sonucu:`, primaryImage);
      }

      return {
        id: product.id,
        master_sku: product.master_sku,
        title: product.title,
        description: product.description,
        brand: product.brand,
        base_cost_price: product.base_cost_price,
        status: product.status,
        created_at: product.created_at,
        
        // Category info
        category: (product.category as any)?.name || 'Kategori Yok',
        category_slug: (product.category as any)?.slug || '',
        category_id: (product.category as any)?.id || null,
        
        // Variant info (first variant)
        variant_id: primaryVariant?.id || null,
        sku: primaryVariant?.master_sku || product.master_sku,
        barcode: primaryVariant?.barcode || '',
        price: primaryVariant?.cost_price || product.base_cost_price || 0,
        stock: primaryVariant?.stock_quantity || 0,
        variant_status: primaryVariant?.status || product.status,
        
        // Image info
        image_url: primaryImage?.url || null,
        image_alt: product.title,
        
        // Totals
        total_variants: product.variants?.length || 0,
        total_stock: product.variants?.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0) || 0,
      };
    }) || []);

    // İstatistikler
    const stats = {
      total_products: transformedProducts.length,
      total_stock: transformedProducts.reduce((sum, p) => sum + p.total_stock, 0),
      active_products: transformedProducts.filter(p => p.status === 'active').length,
      draft_products: transformedProducts.filter(p => p.status === 'draft').length,
      categories: [...new Set(transformedProducts.map(p => p.category))],
    };

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      stats,
    });

  } catch (error: any) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: error 
      },
      { status: 500 }
    );
  }
}
