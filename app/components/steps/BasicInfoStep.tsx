'use client';

import { useState, useEffect } from 'react';
import type { ProductFormData } from '../NewProductForm';

interface BasicInfoStepProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function BasicInfoStep({
  formData,
  updateFormData,
  onNext,
}: BasicInfoStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-generate SKU from title
  useEffect(() => {
    if (formData.title && !formData.master_sku) {
      const sku = 'SKU-' + formData.title
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 10) + '-' + Date.now().toString().slice(-6);
      updateFormData({ master_sku: sku });
    }
  }, [formData.title]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.trim().length < 3) {
      newErrors.title = 'Ürün başlığı en az 3 karakter olmalıdır';
    }

    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'Ürün açıklaması en az 10 karakter olmalıdır';
    }

    if (!formData.master_sku) {
      newErrors.master_sku = 'SKU alanı zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ürün Başlığı <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Örn: Samsung Galaxy S24 Ultra 256GB Cep Telefonu"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Bu başlık kategori eşleştirmesi için kullanılacaktır
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ürün Açıklaması <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={6}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Ürününüzü detaylı bir şekilde açıklayın. Bu bilgi kategori önerisi için kullanılacaktır."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Short Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kısa Açıklama
        </label>
        <textarea
          value={formData.short_description}
          onChange={(e) => updateFormData({ short_description: e.target.value })}
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          placeholder="Ürününüz için kısa bir özet (opsiyonel)"
        />
      </div>

      {/* SKU */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SKU (Stok Kodu) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.master_sku}
          onChange={(e) => updateFormData({ master_sku: e.target.value })}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
            errors.master_sku ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="SKU-EXAMPLE-123456"
        />
        {errors.master_sku && (
          <p className="mt-1 text-sm text-red-600">{errors.master_sku}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Otomatik oluşturuldu, dilersen değiştirebilirsin
        </p>
      </div>

      {/* Product Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ürün Durumu <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'new', label: 'Yeni', desc: 'Hiç kullanılmamış' },
            { value: 'refurbished', label: 'Yenilenmiş', desc: 'Restore edilmiş' },
            { value: 'used', label: 'İkinci El', desc: 'Kullanılmış' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateFormData({ product_condition: option.value as any })}
              className={`p-4 border-2 rounded-lg text-left transition ${
                formData.product_condition === option.value
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">{option.label}</div>
              <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              📌 Sonraki Adım: Kategori Eşleştirme
            </h4>
            <p className="text-sm text-blue-700">
              Girdiğiniz ürün başlığı ve açıklaması kullanılarak, size en uygun Trendyol kategorileri önerilecektir.
            </p>
          </div>
        </div>
      </div>

      {/* Continue Button */}
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
