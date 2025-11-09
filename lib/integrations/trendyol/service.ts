/**
 * Trendyol Product Service
 * Helper functions to create and manage products on Trendyol
 */

import { trendyolClient } from './client';
import type { TrendyolProductItem, TrendyolProductRequest } from './types';

/**
 * Create a test product on Trendyol with auto-fetched category attributes
 * This function automatically queries the category to get required attributes
 */
export async function createTestProduct() {
  try {
    console.log('📦 Test ürün oluşturuluyor...');
    
    // Step 1: Fetch all categories to find a valid leaf category
    console.log('🔍 Mevcut kategoriler sorgulanıyor...');
    const categoriesResponse = await trendyolClient.getCategories() as any;
    const categories = categoriesResponse.categories || categoriesResponse;
    
    // Find a leaf category (one without subCategories)
    let leafCategory = null;
    
    function findLeafCategory(cats: any[]): any {
      for (const cat of cats) {
        if (!cat.subCategories || cat.subCategories.length === 0) {
          return cat;
        }
        if (cat.subCategories && cat.subCategories.length > 0) {
          const leaf = findLeafCategory(cat.subCategories);
          if (leaf) return leaf;
        }
      }
      return null;
    }
    
    leafCategory = findLeafCategory(categories);
    
    if (!leafCategory) {
      throw new Error('Geçerli bir leaf kategori bulunamadı');
    }
    
    const categoryId = leafCategory.id;
    const categoryName = leafCategory.name;
    
    console.log(`✅ Seçilen kategori: ${categoryName} (ID: ${categoryId})`);
    
    // Step 2: Fetch category attributes
    console.log(`🔍 Kategori ${categoryId} için zorunlu özellikler alınıyor...`);
    const categoryResponse = await trendyolClient.getCategoryAttributes(categoryId) as any;
    const categoryAttributes = categoryResponse.categoryAttributes || [];
    const requiredAttributes = categoryAttributes.filter((attr: any) => attr.required === true);
    
    console.log(`✅ ${requiredAttributes.length} zorunlu özellik bulundu`);
    
    // Step 2: Build attributes array with all required fields
    const attributes: any[] = [];
    
    for (const reqAttr of requiredAttributes) {
      const attrId = reqAttr.attribute.id;
      const attrName = reqAttr.attribute.name;
      
      if (reqAttr.allowCustom) {
        // Use custom value for attributes that allow it
        attributes.push({
          attributeId: attrId,
          customAttributeValue: 'Test Value',
        });
        console.log(`  ✓ ${attrName} (ID: ${attrId}) - Custom value: "Test Value"`);
      } else if (reqAttr.attributeValues && reqAttr.attributeValues.length > 0) {
        // Use first available value for predefined attributes
        const firstValue = reqAttr.attributeValues[0];
        attributes.push({
          attributeId: attrId,
          attributeValueId: firstValue.id,
        });
        console.log(`  ✓ ${attrName} (ID: ${attrId}) - Value: "${firstValue.name}" (ID: ${firstValue.id})`);
      }
    }
    
    console.log(`📋 Toplam ${attributes.length} özellik eklendi`);

    // Step 3: Create product with valid attributes
    const testProduct: TrendyolProductItem = {
      barcode: 'auto-test-' + Date.now(), // Unique barcode
      title: `Test ${categoryName} - Integration Prototype`,
      productMainId: 'AUTO-TEST-' + Date.now(), // Your internal product ID
      brandId: 1791, // Test brand ID
      categoryId: categoryId,
      quantity: 50,
      stockCode: 'AUTO-STK-' + Date.now(),
      dimensionalWeight: 1,
      description: `Test ürünü: ${categoryName}. Otomatik kategori özellik kontrolü ile oluşturulmuştur.`,
      currencyType: 'TRY',
      listPrice: 199.99, // Piyasa fiyatı
      salePrice: 99.99, // Satış fiyatı
      vatRate: 20, // KDV oranı (%)
      cargoCompanyId: 10, // Yurtiçi Kargo
      images: [
        {
          url: 'https://cdn.dsmcdn.com/ty1/product/media/images/prod/QC/20240101/12/example.jpg',
        },
      ],
      attributes: attributes, // Auto-generated attributes
    };

    const productRequest: TrendyolProductRequest = {
      items: [testProduct],
    };

    console.log('📤 Trendyol\'a gönderiliyor:', JSON.stringify(productRequest, null, 2));

    const response = await trendyolClient.createProduct(productRequest);

    console.log('✅ Ürün isteği gönderildi!');
    console.log('📋 Response:', response);

    // Check if we got a batchRequestId
    if (response && (response as any).batchRequestId) {
      const batchRequestId = (response as any).batchRequestId;
      console.log('🔍 Batch Request ID:', batchRequestId);
      console.log('⏳ Ürün işleme kuyruğuna alındı. Batch durumunu kontrol edebilirsiniz.');
      
      return {
        success: true,
        data: response,
        batchRequestId,
        message: 'Ürün başarıyla gönderildi! Trendyol tarafından işlenmeyi bekliyor. Batch ID: ' + batchRequestId,
      };
    }

    return {
      success: true,
      data: response,
      message: 'Ürün başarıyla gönderildi!',
    };
  } catch (error: any) {
    console.error('❌ Test ürün oluşturma hatası:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check batch request status
 */
export async function checkBatchStatus(batchRequestId: string) {
  try {
    console.log(`� Batch durumu kontrol ediliyor: ${batchRequestId}`);
    const response = await trendyolClient.getBatchRequestResult(batchRequestId);
    console.log('✅ Batch durumu alındı:', JSON.stringify(response, null, 2));
    
    const batchData = response as any;
    return {
      success: true,
      data: batchData,
      status: batchData.status,
      itemCount: batchData.itemCount,
      failedItemCount: batchData.failedItemCount,
      items: batchData.items,
    };
  } catch (error: any) {
    console.error('❌ Batch durumu kontrol hatası:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update product price and inventory
 */
export async function updateProductPriceAndInventory(
  barcode: string,
  quantity: number,
  salePrice: number,
  listPrice: number
) {
  try {
    console.log(`📦 Ürün güncelleniyor - Barkod: ${barcode}`);

    const items = [
      {
        barcode,
        quantity,
        salePrice,
        listPrice,
      },
    ];

    const response = await trendyolClient.updatePriceAndInventory(items);

    console.log('✅ Ürün fiyat ve stok bilgisi güncellendi!');
    return {
      success: true,
      data: response,
    };
  } catch (error: any) {
    console.error('❌ Ürün güncelleme hatası:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get available brands from Trendyol
 */
export async function searchBrand(brandName: string) {
  try {
    console.log(`🔍 Marka aranıyor: ${brandName}`);
    const response = await trendyolClient.searchBrandByName(brandName);
    console.log('✅ Marka bulundu:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Marka arama hatası:', error);
    return null;
  }
}

/**
 * Get category attributes (required for product creation)
 */
export async function getCategoryAttributes(categoryId: number) {
  try {
    console.log(`🔍 Kategori özellikleri alınıyor: ${categoryId}`);
    const response = await trendyolClient.getCategoryAttributes(categoryId);
    console.log('✅ Kategori özellikleri alındı:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Kategori özellikleri alma hatası:', error);
    return null;
  }
}

/**
 * Get products from Trendyol
 */
export async function getProducts(params?: {
  page?: number;
  size?: number;
  approved?: boolean;
}) {
  try {
    console.log('🔍 Ürünler getiriliyor...');
    const response = await trendyolClient.getProducts(params);
    console.log('✅ Ürünler getirildi:', response);
    return {
      success: true,
      data: response,
    };
  } catch (error: any) {
    console.error('❌ Ürünler getirme hatası:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
