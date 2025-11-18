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

export default function AttributesStep({
  formData,
  updateFormData,
  onNext,
}: AttributesStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [attributes, setAttributes] = useState<TrendyolAttribute[]>([]);
  const [formValues, setFormValues] = useState<Record<number, {attributeValueId?: number; customValue?: string}>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

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
      setAttributes(categoryAttributes);

      // Initialize form values with existing data
      const initialValues: Record<number, {attributeValueId?: number; customValue?: string}> = {};
      formData.attributes.forEach(attr => {
        initialValues[attr.attributeId] = {
          attributeValueId: attr.attributeValueId,
          customValue: attr.customAttributeValue,
        };
      });
      setFormValues(initialValues);
    } catch (error) {
      console.error('Failed to fetch attributes:', error);
      alert('Kategori özellikleri yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (attributeId: number, value: {attributeValueId?: number; customValue?: string}) => {
    setFormValues(prev => ({
      ...prev,
      [attributeId]: value,
    }));

    // Clear error for this attribute
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[attributeId];
      return newErrors;
    });
  };

  const validate = () => {
    const newErrors: Record<number, string> = {};

    attributes.forEach(attr => {
      if (attr.required) {
        const value = formValues[attr.attribute.id];
        if (!value || (!value.attributeValueId && !value.customValue)) {
          newErrors[attr.attribute.id] = 'Bu alan zorunludur';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) {
      alert('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    // Convert form values to API format
    const attributesArray = Object.entries(formValues).map(([attrId, value]) => ({
      attributeId: Number(attrId),
      ...(value.attributeValueId ? { attributeValueId: value.attributeValueId } : {}),
      ...(value.customValue ? { customAttributeValue: value.customValue } : {}),
    }));

    updateFormData({ attributes: attributesArray });
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

  if (attributes.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-600 font-medium mb-2">Bu kategori için özellik bulunamadı</p>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Devam Et →
        </button>
      </div>
    );
  }

  const requiredAttributes = attributes.filter(attr => attr.required);
  const optionalAttributes = attributes.filter(attr => !attr.required);

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
              📋 Kategori Özellikleri
            </h4>
            <p className="text-sm text-blue-700">
              <strong>{formData.trendyol_category_name}</strong> kategorisi için toplam {attributes.length} özellik bulundu.
              {requiredAttributes.length > 0 && ` ${requiredAttributes.length} tanesi zorunludur.`}
            </p>
          </div>
        </div>
      </div>

      {/* Required Attributes */}
      {requiredAttributes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Zorunlu Özellikler <span className="text-red-500">*</span>
          </h3>
          <div className="space-y-4">
            {requiredAttributes.map(attr => (
              <div key={attr.attribute.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {attr.attribute.name} <span className="text-red-500">*</span>
                  {attr.varianter && (
                    <span className="ml-2 text-xs text-purple-600 font-normal">(Varyant Belirleyici)</span>
                  )}
                </label>

                {attr.allowCustom && (!attr.attributeValues || attr.attributeValues.length === 0) ? (
                  // Custom text input
                  <input
                    type="text"
                    value={formValues[attr.attribute.id]?.customValue || ''}
                    onChange={(e) => handleValueChange(attr.attribute.id, { customValue: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                      errors[attr.attribute.id] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={`${attr.attribute.name} girin`}
                  />
                ) : (
                  // Select dropdown
                  <select
                    value={formValues[attr.attribute.id]?.attributeValueId || ''}
                    onChange={(e) => handleValueChange(attr.attribute.id, { attributeValueId: Number(e.target.value) })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                      errors[attr.attribute.id] ? 'border-red-500' : 'border-gray-300'
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
                  <p className="mt-1 text-sm text-red-600">{errors[attr.attribute.id]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Attributes */}
      {optionalAttributes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            İsteğe Bağlı Özellikler
          </h3>
          <div className="space-y-4">
            {optionalAttributes.map(attr => (
              <div key={attr.attribute.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {attr.attribute.name}
                  {attr.varianter && (
                    <span className="ml-2 text-xs text-purple-600 font-normal">(Varyant Belirleyici)</span>
                  )}
                </label>

                {attr.allowCustom && (!attr.attributeValues || attr.attributeValues.length === 0) ? (
                  <input
                    type="text"
                    value={formValues[attr.attribute.id]?.customValue || ''}
                    onChange={(e) => handleValueChange(attr.attribute.id, { customValue: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder={`${attr.attribute.name} girin (opsiyonel)`}
                  />
                ) : (
                  <select
                    value={formValues[attr.attribute.id]?.attributeValueId || ''}
                    onChange={(e) => handleValueChange(attr.attribute.id, { attributeValueId: Number(e.target.value) })}
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

      {/* Navigation */}
      <div className="pt-6">
        <button
          onClick={handleNext}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Devam Et →
        </button>
      </div>
    </div>
  );
}
