/**
 * Trendyol Product Service
 * Helper functions to create and manage products on Trendyol
 */

import { trendyolClient } from './client';
import type { TrendyolProductItem, TrendyolProductRequest } from './types';

/**
 * Create a test product on Trendyol
 */
export async function createTestProduct() {
  try {
    console.log('📦 Test ürün oluşturuluyor...');

    // Test product data
    const testProduct: TrendyolProductItem = {
      barcode: 'test-barcode-' + Date.now(), // Unique barcode
      title: 'Test Ürün - Integration Prototype',
      productMainId: 'TEST-PROD-' + Date.now(), // Your internal product ID
      brandId: 1791, // Trendyol'da kayıtlı bir brand ID
      categoryId: 411, // Trendyol kategori ID
      quantity: 100,
      stockCode: 'STK-' + Date.now(),
      dimensionalWeight: 2,
      description: 'Bu bir test ürünüdür. Integration Prototype tarafından oluşturulmuştur.',
      currencyType: 'TRY',
      listPrice: 250.99, // Piyasa fiyatı
      salePrice: 120.99, // Satış fiyatı
      vatRate: 18, // KDV oranı (%)
      cargoCompanyId: 10, // Yurtiçi Kargo
      deliveryOption: {
        deliveryDuration: 1,
        fastDeliveryType: 'FAST_DELIVERY'
      },
      images: [
        {
          url: 'https://cdn.dsmcdn.com/ty1/product/media/images/prod/QC/20240101/12/example.jpg',
        },
      ],
      attributes: [
        {
          attributeId: 338,
          attributeValueId: 6980
        },
        {
          attributeId: 346,
          attributeValueId: 4290
        },
      ],
    };

    const productRequest: TrendyolProductRequest = {
      items: [testProduct],
    };

    console.log('📤 Trendyol\'a gönderiliyor:', JSON.stringify(productRequest, null, 2));

    const response = await trendyolClient.createProduct(productRequest);

    console.log('✅ Test ürün başarıyla oluşturuldu!');
    console.log('📋 Response:', response);

    return {
      success: true,
      data: response,
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
