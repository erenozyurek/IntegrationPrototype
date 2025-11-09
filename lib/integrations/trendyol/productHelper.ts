/**
 * Helper to create a product with proper category attributes
 * This demonstrates how to query category attributes and build a valid product
 */

import { trendyolClient } from './client';
import type { TrendyolProductItem, TrendyolProductRequest } from './types';

/**
 * Get required attributes for a category
 */
export async function getCategoryRequiredAttributes(categoryId: number) {
  try {
    const response = await trendyolClient.getCategoryAttributes(categoryId) as any;
    
    const categoryAttributes = response.categoryAttributes || [];
    const required = categoryAttributes.filter((attr: any) => attr.required === true);
    
    console.log(`📋 Category ${categoryId} has ${required.length} required attributes:`);
    required.forEach((attr: any) => {
      console.log(`  - ${attr.attribute.name} (ID: ${attr.attribute.id})`);
      if (!attr.allowCustom && attr.attributeValues?.length > 0) {
        console.log(`    Available values: ${attr.attributeValues.slice(0, 3).map((v: any) => v.name).join(', ')}...`);
      }
    });
    
    return {
      categoryId,
      categoryName: response.name,
      required,
      all: categoryAttributes,
    };
  } catch (error: any) {
    console.error('Error fetching category attributes:', error);
    throw error;
  }
}

/**
 * Create a product with automatically fetched category attributes
 * This is a REAL working example that queries the API first
 */
export async function createProductWithValidAttributes(categoryId: number = 1071) {
  try {
    console.log('📦 Fetching category attributes first...');
    
    // Step 1: Get category attributes
    const categoryData = await getCategoryRequiredAttributes(categoryId);
    
    // Step 2: Build attributes array with required fields
    const attributes: any[] = [];
    
    for (const reqAttr of categoryData.required) {
      const attrId = reqAttr.attribute.id;
      
      if (reqAttr.allowCustom) {
        // Use custom value
        attributes.push({
          attributeId: attrId,
          customAttributeValue: 'Test Value',
        });
      } else if (reqAttr.attributeValues && reqAttr.attributeValues.length > 0) {
        // Use first available value
        attributes.push({
          attributeId: attrId,
          attributeValueId: reqAttr.attributeValues[0].id,
        });
      }
    }
    
    console.log(`✅ Built ${attributes.length} required attributes`);
    
    // Step 3: Create product with valid attributes
    const productData: TrendyolProductItem = {
      barcode: 'auto-' + Date.now(),
      title: `Test Product - ${categoryData.categoryName}`,
      productMainId: 'AUTO-' + Date.now(),
      brandId: 1791,
      categoryId: categoryId,
      quantity: 50,
      stockCode: 'AUTO-STK-' + Date.now(),
      dimensionalWeight: 1,
      description: 'Automatically generated test product with proper category attributes.',
      currencyType: 'TRY',
      listPrice: 199.99,
      salePrice: 99.99,
      vatRate: 20,
      cargoCompanyId: 10,
      images: [
        {
          url: 'https://cdn.dsmcdn.com/ty1/product/media/images/prod/QC/20240101/12/example.jpg',
        },
      ],
      attributes: attributes,
    };
    
    const productRequest: TrendyolProductRequest = {
      items: [productData],
    };
    
    console.log('📤 Sending product to Trendyol...');
    const response = await trendyolClient.createProduct(productRequest);
    
    return {
      success: true,
      data: response,
      batchRequestId: (response as any).batchRequestId,
      message: 'Product created with automatically fetched attributes',
    };
  } catch (error: any) {
    console.error('❌ Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List common valid categories that are easier to test with
 */
export const COMMON_TEST_CATEGORIES = {
  TSHIRT: 1071,           // T-Shirt (usually simple)
  KITAP: 1000,            // Books (very simple)
  TELEFON_KILIFI: 1116,   // Phone cases
  CANTA: 1026,            // Bags
  SAC_BAKIM: 1487,        // Hair care products
};

/**
 * Get category info without creating product
 */
export async function inspectCategory(categoryId: number) {
  return getCategoryRequiredAttributes(categoryId);
}
