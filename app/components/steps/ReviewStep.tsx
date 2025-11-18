'use client';

import type { ProductFormData } from '../NewProductForm';

interface ReviewStepProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ReviewStep({ formData }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Temel Bilgiler</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-600">Başlık:</dt>
              <dd className="font-medium text-gray-900">{formData.title}</dd>
            </div>
            <div>
              <dt className="text-gray-600">SKU:</dt>
              <dd className="font-medium text-gray-900">{formData.master_sku}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Durum:</dt>
              <dd className="font-medium text-gray-900 capitalize">{formData.product_condition}</dd>
            </div>
          </dl>
        </div>

        {/* Category */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Kategori</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-600">Trendyol Kategori:</dt>
              <dd className="font-medium text-gray-900">{formData.trendyol_category_name}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Yol:</dt>
              <dd className="text-xs text-gray-600">{formData.trendyol_category_path}</dd>
            </div>
          </dl>
        </div>

        {/* Pricing */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Fiyatlandırma</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-600">Satış Fiyatı:</dt>
              <dd className="font-medium text-gray-900">{formData.price} {formData.currency}</dd>
            </div>
            <div>
              <dt className="text-gray-600">KDV Oranı:</dt>
              <dd className="font-medium text-gray-900">%{formData.vat_rate}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Stok:</dt>
              <dd className="font-medium text-gray-900">{formData.stock_quantity} adet</dd>
            </div>
          </dl>
        </div>

        {/* Attributes */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Özellikler</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-600">Toplam Özellik:</dt>
              <dd className="font-medium text-gray-900">{formData.attributes.length} adet</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Description */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Açıklama</h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.description}</p>
      </div>

      {/* Images */}
      {formData.images.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Görseller ({formData.images.length})</h3>
          <div className="grid grid-cols-4 gap-2">
            {formData.images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image.url}
                  alt={`Product ${index + 1}`}
                  className="w-full h-24 object-cover rounded border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200?text=No+Image';
                  }}
                />
                {image.is_primary && (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-indigo-600 text-white text-xs rounded">
                    Ana
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-green-900 mb-1">
              ✅ Ürün Kaydetmeye Hazır
            </h4>
            <p className="text-sm text-green-700">
              Tüm bilgiler dolduruldu. "Kaydet" butonuna tıklayarak ürününüzü veritabanına ekleyebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
