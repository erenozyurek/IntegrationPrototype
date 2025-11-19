'use client';

import { useState, useEffect } from 'react';
import type { ProductFormData } from '../NewProductForm';

interface AttributesStepProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface TrendyolAttribute {
  categoryId: number;
  attribute: {
    id: number;
    name: string;
  };
  required: boolean;
  allowCustom: boolean;
  varianter: boolean;
  slicer: boolean;
  attributeValues?: Array<{
    id: number;
    name: string;
  }>;
}

interface ProductVariant {
  id: string;
  combination: Record<number, { attributeId: number; attributeValueId: number; value: string }>;
  barcode: string;
  stockCode: string;
  quantity: number;
  listPrice: number;
  salePrice: number;
}

export default function AttributesStepV2({
  formData,
  updateFormData,
  onNext,
}: AttributesStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Separate variant and non-variant attributes
  const [variantAttributes, setVariantAttributes] = useState<TrendyolAttribute[]>([]);
  const [regularAttributes, setRegularAttributes] = useState<TrendyolAttribute[]>([]);
  
  // Selected values for variant attributes (multi-select)
  const [selectedVariantValues, setSelectedVariantValues] = useState<Record<number, number[]>>({});
  
  // Values for regular attributes
  const [regularFormValues, setRegularFormValues] = useState<Record<number, {attributeValueId?: number; customValue?: string}>>({});
  
  // Generated variants
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [showVariantManager, setShowVariantManager] = useState(false);

  useEffect(() => {
    if (formData.trendyol_category_id) {
      fetchAttributes();
    }
  }, [formData.trendyol_category_id]);

  const fetchAttributes = async () => {
    if (!formData.trendyol_category_id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/trendyol/attributes/${formData.trendyol_category_id}`);
      
      if (!response.ok) {
        throw new Error('Özellikler yüklenemedi');
      }

      const data = await response.json();
      const categoryAttributes = data.attributes?.categoryAttributes || [];

      // Separate variant and regular attributes
      const variantAttrs = categoryAttributes.filter((attr: TrendyolAttribute) => attr.varianter);
      const regularAttrs = categoryAttributes.filter((attr: TrendyolAttribute) => !attr.varianter);
      
      setVariantAttributes(variantAttrs);
      setRegularAttributes(regularAttrs);

      // Initialize regular form values with existing data
      const initialValues: Record<number, {attributeValueId?: number; customValue?: string}> = {};
      formData.attributes.forEach(attr => {
        if (!variantAttrs.find((va: TrendyolAttribute) => va.attribute.id === attr.attributeId)) {
          initialValues[attr.attributeId] = {
            attributeValueId: attr.attributeValueId,
            customValue: attr.customAttributeValue,
          };
        }
      });
      setRegularFormValues(initialValues);

    } catch (error) {
      console.error('Failed to fetch attributes:', error);
      alert('Kategori özellikleri yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVariantValue = (attributeId: number, valueId: number) => {
    setSelectedVariantValues(prev => {
      const current = prev[attributeId] || [];
      const isSelected = current.includes(valueId);
      
      return {
        ...prev,
        [attributeId]: isSelected 
          ? current.filter(id => id !== valueId)
          : [...current, valueId]
      };
    });
  };

  const generateVariants = () => {
    // Get all variant attribute combinations
    const attributeIds = Object.keys(selectedVariantValues).map(Number);
    
    if (attributeIds.length === 0) {
      alert('Lütfen en az bir varyant özelliği seçin');
      return;
    }

    // Check if all variant attributes have selected values
    for (const attrId of attributeIds) {
      if (selectedVariantValues[attrId].length === 0) {
        alert('Tüm varyant özellikleri için en az bir değer seçin');
        return;
      }
    }

    // Generate all combinations
    const combinations = generateCombinations(attributeIds, selectedVariantValues);
    
    // Create variant objects
    const newVariants: ProductVariant[] = combinations.map((combo, index) => {
      return {
        id: `variant-${Date.now()}-${index}`,
        combination: combo,
        barcode: '',
        stockCode: `${formData.master_sku || 'SKU'}-${index + 1}`,
        quantity: 0,
        listPrice: formData.price || 0,
        salePrice: formData.price || 0,
      };
    });

    setVariants(newVariants);
    setShowVariantManager(true);
  };

  const generateCombinations = (
    attributeIds: number[],
    selectedValues: Record<number, number[]>
  ): Record<number, { attributeId: number; attributeValueId: number; value: string }>[] => {
    if (attributeIds.length === 0) return [];
    
    const [firstAttrId, ...restAttrIds] = attributeIds;
    const firstValues = selectedValues[firstAttrId];
    
    if (restAttrIds.length === 0) {
      // Base case: only one attribute left
      return firstValues.map(valueId => {
        const attr = variantAttributes.find(a => a.attribute.id === firstAttrId);
        const value = attr?.attributeValues?.find(v => v.id === valueId);
        return {
          [firstAttrId]: {
            attributeId: firstAttrId,
            attributeValueId: valueId,
            value: value?.name || '',
          }
        };
      });
    }
    
    // Recursive case: combine first attribute with rest
    const restCombinations = generateCombinations(restAttrIds, selectedValues);
    const allCombinations: Record<number, { attributeId: number; attributeValueId: number; value: string }>[] = [];
    
    for (const valueId of firstValues) {
      const attr = variantAttributes.find(a => a.attribute.id === firstAttrId);
      const value = attr?.attributeValues?.find(v => v.id === valueId);
      
      for (const restCombo of restCombinations) {
        allCombinations.push({
          [firstAttrId]: {
            attributeId: firstAttrId,
            attributeValueId: valueId,
            value: value?.name || '',
          },
          ...restCombo
        });
      }
    }
    
    return allCombinations;
  };

  const updateVariant = (variantId: string, updates: Partial<ProductVariant>) => {
    setVariants(prev => prev.map(v => v.id === variantId ? { ...v, ...updates } : v));
  };

  const handleRegularAttributeChange = (attributeId: number, value: {attributeValueId?: number; customValue?: string}) => {
    setRegularFormValues(prev => ({
      ...prev,
      [attributeId]: value,
    }));

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[attributeId];
      return newErrors;
    });
  };

  const validate = () => {
    const newErrors: Record<number, string> = {};

    // Validate regular required attributes
    regularAttributes.forEach(attr => {
      if (attr.required) {
        const value = regularFormValues[attr.attribute.id];
        if (!value || (!value.attributeValueId && !value.customValue)) {
          newErrors[attr.attribute.id] = 'Bu alan zorunludur';
        }
      }
    });

    // Validate variant attributes (if variants exist)
    if (variantAttributes.length > 0) {
      variantAttributes.forEach(attr => {
        if (attr.required) {
          const selectedValues = selectedVariantValues[attr.attribute.id];
          if (!selectedValues || selectedValues.length === 0) {
            newErrors[attr.attribute.id] = 'En az bir değer seçmelisiniz';
          }
        }
      });

      // If there are variant attributes, variants must be generated
      if (variants.length === 0) {
        alert('Varyant özellikleri seçtiniz. Lütfen "Varyant Kombinasyonlarını Oluştur" butonuna tıklayın.');
        return false;
      }

      // Validate each variant
      for (const variant of variants) {
        if (!variant.barcode || variant.barcode.trim() === '') {
          alert('Tüm varyantlar için barkod girilmelidir');
          return false;
        }
        if (variant.quantity < 0) {
          alert('Stok miktarı negatif olamaz');
          return false;
        }
        if (variant.listPrice <= 0 || variant.salePrice <= 0) {
          alert('Fiyatlar 0\'dan büyük olmalıdır');
          return false;
        }
        if (variant.salePrice > variant.listPrice) {
          alert('İndirimli fiyat, liste fiyatından yüksek olamaz');
          return false;
        }
      }
    }

    // Show errors if any
    if (Object.keys(newErrors).length > 0) {
      alert('Lütfen tüm zorunlu alanları doldurun!');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) {
      return;
    }

    // Convert regular attributes to API format
    const regularAttributesArray = Object.entries(regularFormValues).map(([attrId, value]) => ({
      attributeId: Number(attrId),
      ...(value.attributeValueId ? { attributeValueId: value.attributeValueId } : {}),
      ...(value.customValue ? { customAttributeValue: value.customValue } : {}),
    }));

    updateFormData({ 
      attributes: regularAttributesArray,
      variants: variants.map(v => ({
        id: v.id,
        barcode: v.barcode,
        stockCode: v.stockCode,
        quantity: v.quantity,
        listPrice: v.listPrice,
        salePrice: v.salePrice,
        variantAttributes: Object.values(v.combination).map(attr => ({
          attributeId: attr.attributeId,
          attributeValueId: attr.attributeValueId,
        })),
      }))
    });
    
    onNext();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-600 font-medium">Kategori özellikleri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              📋 Varyant Yönetimi
            </h4>
            <p className="text-sm text-blue-700">
              {variantAttributes.length > 0 ? (
                <>Bu kategori <strong>{variantAttributes.length} adet varyant özelliği</strong> içeriyor. 
                Her varyant kombinasyonu için ayrı stok ve fiyat belirleyeceksiniz.</>
              ) : (
                <>Bu kategoride varyant özelliği bulunmuyor. Standart ürün özellikleri doldurun.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Variant Attributes */}
      {variantAttributes.length > 0 && !showVariantManager && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">V</span>
            Varyant Özellikleri
          </h3>
          <div className="space-y-6">
            {variantAttributes.map(attr => (
              <div key={attr.attribute.id} className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5">
                <label className="block text-sm font-bold text-purple-900 mb-3">
                  {attr.attribute.name} {attr.required && <span className="text-red-500">*</span>}
                  <span className="ml-2 text-xs font-normal text-purple-600">(Varyant belirleyici - çoklu seçim)</span>
                </label>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {attr.attributeValues?.map(value => {
                    const isSelected = selectedVariantValues[attr.attribute.id]?.includes(value.id);
                    return (
                      <button
                        key={value.id}
                        type="button"
                        onClick={() => toggleVariantValue(attr.attribute.id, value.id)}
                        className={`px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white border-2 border-purple-200 text-purple-700 hover:border-purple-400'
                        }`}
                      >
                        {value.name}
                        {isSelected && (
                          <svg className="w-4 h-4 inline-block ml-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                {errors[attr.attribute.id] && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors[attr.attribute.id]}</p>
                )}

                <div className="mt-3 text-sm text-purple-700">
                  <strong>{selectedVariantValues[attr.attribute.id]?.length || 0}</strong> değer seçildi
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={generateVariants}
            className="mt-6 w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            🔄 Varyant Kombinasyonlarını Oluştur
          </button>
        </div>
      )}

      {/* Variant Manager */}
      {showVariantManager && variants.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">{variants.length}</span>
              Oluşturulan Varyantlar
            </h3>
            <button
              onClick={() => {
                setShowVariantManager(false);
                setVariants([]);
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              ↺ Yeniden Oluştur
            </button>
          </div>

          <div className="space-y-4">
            {variants.map((variant, index) => {
              const variantName = Object.values(variant.combination).map(v => v.value).join(' - ');
              
              return (
                <div key={variant.id} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <h4 className="font-bold text-gray-900">{variantName}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Barkod <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={variant.barcode}
                        onChange={(e) => updateVariant(variant.id, { barcode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="Benzersiz barkod"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stok Kodu
                      </label>
                      <input
                        type="text"
                        value={variant.stockCode}
                        onChange={(e) => updateVariant(variant.id, { stockCode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="SKU"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stok Miktarı <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={variant.quantity}
                        onChange={(e) => updateVariant(variant.id, { quantity: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Liste Fiyatı (₺) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.listPrice}
                        onChange={(e) => updateVariant(variant.id, { listPrice: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        İndirimli Fiyat (₺) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.salePrice}
                        onChange={(e) => updateVariant(variant.id, { salePrice: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Regular Attributes */}
      {regularAttributes.length > 0 && (
        <div className="space-y-6">
          {/* Required Regular Attributes */}
          {regularAttributes.filter(a => a.required).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-red-500">*</span>
                Zorunlu Genel Özellikler
              </h3>
              <div className="space-y-4">
                {regularAttributes.filter(a => a.required).map(attr => (
                  <div key={attr.attribute.id} className={errors[attr.attribute.id] ? 'bg-red-50 p-4 rounded-lg' : ''}>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      {attr.attribute.name} <span className="text-red-500">*</span>
                    </label>

                    {attr.allowCustom && (!attr.attributeValues || attr.attributeValues.length === 0) ? (
                      <input
                        type="text"
                        value={regularFormValues[attr.attribute.id]?.customValue || ''}
                        onChange={(e) => handleRegularAttributeChange(attr.attribute.id, { customValue: e.target.value })}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                          errors[attr.attribute.id] ? 'border-red-500 bg-white' : 'border-gray-300'
                        }`}
                        placeholder={`${attr.attribute.name} girin`}
                      />
                    ) : (
                      <select
                        value={regularFormValues[attr.attribute.id]?.attributeValueId || ''}
                        onChange={(e) => handleRegularAttributeChange(attr.attribute.id, { attributeValueId: Number(e.target.value) })}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                          errors[attr.attribute.id] ? 'border-red-500 bg-white' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Seçin...</option>
                        {attr.attributeValues?.map(val => (
                          <option key={val.id} value={val.id}>
                            {val.name}
                          </option>
                        ))}
                      </select>
                    )}

                    {errors[attr.attribute.id] && (
                      <p className="mt-2 text-sm text-red-600 font-semibold">{errors[attr.attribute.id]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Regular Attributes */}
          {regularAttributes.filter(a => !a.required).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                İsteğe Bağlı Genel Özellikler
              </h3>
              <div className="space-y-4">
                {regularAttributes.filter(a => !a.required).map(attr => (
                  <div key={attr.attribute.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {attr.attribute.name}
                    </label>

                    {attr.allowCustom && (!attr.attributeValues || attr.attributeValues.length === 0) ? (
                      <input
                        type="text"
                        value={regularFormValues[attr.attribute.id]?.customValue || ''}
                        onChange={(e) => handleRegularAttributeChange(attr.attribute.id, { customValue: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        placeholder={`${attr.attribute.name} girin (opsiyonel)`}
                      />
                    ) : (
                      <select
                        value={regularFormValues[attr.attribute.id]?.attributeValueId || ''}
                        onChange={(e) => handleRegularAttributeChange(attr.attribute.id, { attributeValueId: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      >
                        <option value="">Seçin (opsiyonel)</option>
                        {attr.attributeValues?.map(val => (
                          <option key={val.id} value={val.id}>
                            {val.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      {(variantAttributes.length === 0 || showVariantManager) && (
        <div className="pt-6">
          <button
            onClick={handleNext}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Devam Et →
          </button>
        </div>
      )}
    </div>
  );
}
