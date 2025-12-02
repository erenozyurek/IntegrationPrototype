'use client';

import type { ProductFormData } from '../NewProductForm';

interface PricingInventoryStepProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function PricingInventoryStep({
  formData,
  updateFormData,
  onNext,
}: PricingInventoryStepProps) {
  const handleNext = () => {
    if (!formData.price || formData.price <= 0) {
      alert('Lütfen geçerli bir fiyat girin');
      return;
    }
    if (formData.stock_quantity < 0) {
      alert('Stok miktarı negatif olamaz');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Pricing Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fiyatlandırma</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Satış Fiyatı <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.price || ''}
              onChange={(e) => updateFormData({ price: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maliyet Fiyatı
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.cost_price || ''}
              onChange={(e) => updateFormData({ cost_price: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Para Birimi
            </label>
            <select
              value={formData.currency}
              onChange={(e) => updateFormData({ currency: e.target.value as any })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            >
              <option value="TRY">TRY (₺)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              KDV Oranı (%)
            </label>
            <input
              type="number"
              value={formData.vat_rate || 20}
              onChange={(e) => updateFormData({ vat_rate: parseFloat(e.target.value) || 20 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Inventory Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stok Bilgileri</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stok Miktarı <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.stock_quantity || 0}
              onChange={(e) => updateFormData({ stock_quantity: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barkod
            </label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => updateFormData({ barcode: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="8690000000000"
            />
          </div>
        </div>
      </div>

      {/* Dimensions Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ölçüler</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ağırlık (gram)
            </label>
            <input
              type="number"
              value={formData.weight_grams || ''}
              onChange={(e) => updateFormData({ weight_grams: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Uzunluk (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.length_cm || ''}
              onChange={(e) => updateFormData({ length_cm: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="0.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Genişlik (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.width_cm || ''}
              onChange={(e) => updateFormData({ width_cm: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="0.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yükseklik (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.height_cm || ''}
              onChange={(e) => updateFormData({ height_cm: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="0.0"
            />
          </div>
        </div>
      </div>

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
