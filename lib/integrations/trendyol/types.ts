/**
 * Trendyol Product Type Definitions
 */

export interface TrendyolProductImage {
  url: string;
}

export interface TrendyolProductAttribute {
  attributeId: number;
  attributeValueId?: number;
  customAttributeValue?: string;
}

export interface TrendyolDeliveryOption {
  deliveryDuration: number;
  fastDeliveryType?: string;
}

export interface TrendyolProductItem {
  barcode: string;
  title: string;
  productMainId: string;
  brandId: number;
  categoryId: number;
  quantity: number;
  stockCode: string;
  dimensionalWeight?: number;
  description: string;
  currencyType: 'TRY' | 'USD' | 'EUR';
  listPrice: number;
  salePrice: number;
  vatRate: number;
  cargoCompanyId: number;
  lotNumber?: string;
  deliveryOption?: TrendyolDeliveryOption;
  images: TrendyolProductImage[];
  attributes: TrendyolProductAttribute[];
  shipmentAddressId?: number;
  returningAddressId?: number;
}

export interface TrendyolProductRequest {
  items: TrendyolProductItem[];
}

export interface TrendyolPriceAndInventoryItem {
  barcode: string;
  quantity: number;
  salePrice: number;
  listPrice: number;
}

export interface TrendyolCategory {
  id: number;
  name: string;
  parentId?: number;
  subCategories?: TrendyolCategory[];
}

export interface TrendyolBrand {
  id: number;
  name: string;
  path?: string;
}

export interface TrendyolCategoryAttribute {
  attribute: {
    id: number;
    name: string;
  };
  attributeValues: Array<{
    id: number;
    name: string;
  }>;
  required: boolean;
  allowCustom: boolean;
  varianter: boolean;
  slicer: boolean;
}

export interface TrendyolProductResponse {
  batchRequestId: string;
  items: Array<{
    barcode: string;
    productCode?: string;
    failureReasons?: string[];
  }>;
}
