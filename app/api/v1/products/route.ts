import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Form datadan gelen veriler
    const {
      // Products tablosu
      categoryId,
      masterSku,
      title,
      description,
      brand,
      color,
      manufacturer,
      baseCostPrice,
      warrantyMonths,
      productStatus,
      weightGrams,
      lengthCm,
      widthCm,
      heightCm,
      
      // Varyantlar array (yeni yapı)
      variants = [],
      
      // Marketplace data
      marketplaceData,
      
      // Attributes (kategori özellikleri)
      attributeValues,
      
      // Trendyol kategori mapping
      trendyolCategoryData,
    } = body;

    console.log('=== ÜRÜN KAYDETME İŞLEMI BAŞLIYOR ===');
    console.log('CategoryId:', categoryId);

    // ADIM 1: Category ID'yi UUID'ye çevir (electronics/clothing -> UUID)
    let categoryUUID = null;
    
    if (categoryId === 'electronics' || categoryId === 'clothing') {
      const categorySlug = categoryId === 'electronics' ? 'elektronik' : 'giyim';
      
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();

      if (categoryError || !categoryData) {
        return NextResponse.json(
          { error: `Kategori bulunamadı: ${categorySlug}. Lütfen önce kategorileri oluşturun (/api/v1/categories/seed)` },
          { status: 400 }
        );
      }

      categoryUUID = categoryData.id;
    } else {
      categoryUUID = categoryId; // Zaten UUID ise
    }

    console.log('Category UUID:', categoryUUID);

    // ADIM 2: PRODUCTS tablosuna kaydet
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        category_id: categoryUUID,
        master_sku: masterSku,
        title: title,
        description: description || null,
        brand: brand,
        manufacturer: manufacturer || null,
        base_cost_price: baseCostPrice || 0,
        status: productStatus || 'draft',
        has_variants: variants.length > 0, // Varyant varsa true
        warranty_months: warrantyMonths ? parseInt(warrantyMonths) : null,
        specifications: attributeValues || {}, // Kategori özellikleri JSONB'ye kaydet
      })
      .select()
      .single();

    if (productError) {
      console.error('Product insert error:', productError);
      return NextResponse.json(
        { error: `Ürün kaydedilemedi: ${productError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Product created:', productData.id);

    // ADIM 3: PRODUCT_VARIANTS tablosuna kaydet (birden fazla olabilir)
    const createdVariants = [];
    
    if (variants.length > 0) {
      // Birden fazla varyant
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        
        const { data: variantData, error: variantError } = await supabase
          .from('product_variants')
          .insert({
            product_id: productData.id,
            master_sku: variant.master_sku,
            barcode: variant.barcode,
            title: variant.title,
            cost_price: variant.cost_price || 0,
            weight_grams: weightGrams || null,
            length_cm: lengthCm || null,
            width_cm: widthCm || null,
            height_cm: heightCm || null,
            is_default: i === 0, // İlk varyant default
            status: variant.status || 'active',
            sort_order: i + 1,
            stock_quantity: variant.stock_quantity || 0,
          })
          .select()
          .single();

        if (variantError) {
          console.error('Variant insert error:', variantError);
          
          // Rollback: Product ve önceki varyantları sil
          await supabase.from('products').delete().eq('id', productData.id);
          
          return NextResponse.json(
            { error: `Varyant kaydedilemedi: ${variantError.message}` },
            { status: 500 }
          );
        }

        createdVariants.push(variantData);
        console.log(`✅ Variant ${i + 1} created:`, variantData.id);
        
        // Varyant attribute'larını kaydet (color, storage)
        if (variant.attributes) {
          for (const [attrKey, attrValue] of Object.entries(variant.attributes)) {
            if (attrValue) {
              // Attribute definition'ı bul veya oluştur
              const { data: attrDef } = await supabase
                .from('attribute_definitions')
                .upsert({
                  name: attrKey.charAt(0).toUpperCase() + attrKey.slice(1),
                  slug: attrKey,
                  type: 'select',
                  scope: 'variant',
                  is_variant_defining: true, // Renk ve depolama varyant tanımlayıcı
                  is_required: false,
                  is_filterable: true,
                }, { onConflict: 'slug' })
                .select()
                .single();

              if (attrDef) {
                await supabase.from('variant_attributes').insert({
                  product_variant_id: variantData.id,
                  attribute_definition_id: attrDef.id,
                  value: String(attrValue),
                  sort_order: 1,
                });
              }
            }
          }
        }
      }
    } else {
      // Varyant yoksa, tek default varyant oluştur
      const { data: defaultVariant, error: variantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: productData.id,
          master_sku: `${masterSku}-DEFAULT`,
          barcode: `869${Date.now().toString().slice(-10)}`,
          title: title,
          cost_price: baseCostPrice || 0,
          weight_grams: weightGrams || null,
          length_cm: lengthCm || null,
          width_cm: widthCm || null,
          height_cm: heightCm || null,
          is_default: true,
          status: 'active',
          sort_order: 1,
          stock_quantity: 0,
        })
        .select()
        .single();

      if (variantError) {
        console.error('Default variant insert error:', variantError);
        await supabase.from('products').delete().eq('id', productData.id);
        return NextResponse.json(
          { error: `Varsayılan varyant kaydedilemedi: ${variantError.message}` },
          { status: 500 }
        );
      }

      createdVariants.push(defaultVariant);
      console.log('✅ Default variant created:', defaultVariant.id);
    }

    // ADIM 4: MARKETPLACE_CATEGORY_MAPPINGS güncelle (eğer Trendyol kategorisi seçildiyse)
    if (trendyolCategoryData) {
      await supabase
        .from('marketplace_category_mappings')
        .upsert({
          category_id: categoryUUID,
          marketplace: 'TRENDYOL',
          marketplace_category_id: trendyolCategoryData.trendyolCategoryId,
          marketplace_category_name: trendyolCategoryData.trendyolCategoryName,
          marketplace_category_path: trendyolCategoryData.trendyolCategoryPath,
          required_attributes: marketplaceData || {},
          attribute_mappings: {},
          is_active: true,
        }, {
          onConflict: 'category_id,marketplace',
        });
      
      console.log('✅ Marketplace mapping saved');
    }

    // ADIM 5: Success response
    return NextResponse.json({
      success: true,
      message: `Ürün başarıyla kaydedildi! ${createdVariants.length} varyant oluşturuldu.`,
      data: {
        product: productData,
        variants: createdVariants,
        variantCount: createdVariants.length,
      },
    });

  } catch (error: any) {
    console.error('❌ Product creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Bilinmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
