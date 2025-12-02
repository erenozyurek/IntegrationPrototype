'use client';

import { useState, useEffect } from 'react';

interface TrendyolProductVariant {
  id: string;
  barcode: string;
  stockCode: string;
  quantity: number;
  listPrice: number;
  salePrice: number;
  variantAttributes: Array<{
    attributeId: number;
    attributeValueId: number;
  }>;
}

interface TrendyolProduct {
  id: string;
  title: string;
  description: string;
  master_sku: string;
  barcode: string;
  price: number;
  salePrice: number;
  stock: number;
  categoryId: number;
  brandId: number;
  cargoCompanyId: number;
  currency: string;
  vatRate: number;
  images: { url: string }[];
  attributes: unknown[];
  variants?: TrendyolProductVariant[];
  trendyol_status?: 'not_sent' | 'pending' | 'approved' | 'failed';
  batch_request_id?: string | null;
  failure_reasons?: string[] | null;
  last_sync_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface EditProductModalEnhancedProps {
  product: TrendyolProduct;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProduct: TrendyolProduct) => void;
}

export default function EditProductModalEnhanced({ 
  product, 
  isOpen, 
  onClose, 
  onSave 
}: EditProductModalEnhancedProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'images' | 'attributes'>('basic');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    brandId: 0,
    vatRate: 20,
    listPrice: 0,
    salePrice: 0,
    stock: 0,
  });
  const [images, setImages] = useState<{ url: string }[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title,
        description: product.description,
        brandId: product.brandId,
        vatRate: product.vatRate,
        listPrice: product.price,
        salePrice: product.salePrice,
        stock: product.stock,
      });
      setImages(product.images || []);
    }
  }, [product]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadFormData = new FormData();
      Array.from(files).forEach((file) => {
        uploadFormData.append('files', file);
      });
      uploadFormData.append('productId', product.id);

      const response = await fetch('/api/v1/storage/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      const newImages = result.urls.map((url: string) => ({ url }));
      setImages((prev) => [...prev, ...newImages]);
    } catch (error) {
      console.error('Image upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageToRemove = images[index];
    
    try {
      const response = await fetch('/api/v1/storage/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageToRemove.url }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      setImages((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Image delete error:', error);
      alert('Failed to delete image');
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      alert('Ürün adı zorunludur');
      return;
    }
    if (formData.listPrice <= 0 || formData.salePrice <= 0) {
      alert('Fiyatlar 0\'dan büyük olmalıdır');
      return;
    }
    if (formData.salePrice > formData.listPrice) {
      alert('İndirimli fiyat, liste fiyatından yüksek olamaz');
      return;
    }
    if (images.length === 0) {
      alert('En az bir ürün görseli ekleyin');
      return;
    }

    setIsSaving(true);
    try {
      // Update local database
      const response = await fetch('/api/v1/temp-products/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          trendyol_product: {
            title: formData.title,
            description: formData.description,
            productMainId: product.master_sku,
            barcode: product.barcode,
            stockCode: product.master_sku,
            brandId: formData.brandId,
            categoryId: product.categoryId,
            quantity: formData.stock,
            dimensionalWeight: 0,
            currencyType: product.currency,
            listPrice: formData.listPrice,
            salePrice: formData.salePrice,
            vatRate: formData.vatRate,
            cargoCompanyId: product.cargoCompanyId || 17, // Preserve or default to Trendyol Express
            images: images,
            attributes: product.attributes,
            variants: product.variants || null,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Update failed');
      }

      // If product is already approved in Trendyol, update there too
      if (product.trendyol_status === 'approved') {
        try {
          // Build updates object, only include brandId if it's valid
          const updates: Record<string, any> = {
            // Price/Stock update
            quantity: formData.stock,
            salePrice: formData.salePrice,
            listPrice: formData.listPrice,
            // Full product fields
            title: formData.title,
            description: formData.description,
            vatRate: formData.vatRate,
            images: images,
          };

          // Only include brandId if it's valid (greater than 0)
          if (formData.brandId && formData.brandId > 0) {
            updates.brandId = formData.brandId;
          }

          const updateResponse = await fetch('/api/v1/trendyol/update-product', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: product.id,
              barcode: product.barcode,
              updates,
            }),
          });

          const updateResult = await updateResponse.json();

          if (!updateResponse.ok) {
            console.error('Trendyol update error:', updateResult);
            alert(`Trendyol güncellemesi başarısız: ${updateResult.error}\n\nYerel veritabanı güncellendi ancak Trendyol'a senkronize edilemedi.`);
          } else {
            console.log('Trendyol update success:', updateResult);
            if (updateResult.batchRequestId) {
              alert(`Ürün güncellendi!\n\nBatch ID: ${updateResult.batchRequestId}\n\nDurum kontrolü için "Durum" butonuna tıklayın.`);
            }
          }
        } catch (error) {
          console.error('Trendyol update request failed:', error);
          alert('Trendyol güncellenemedi ancak yerel veritabanı güncellendi.');
        }
      }

      const updatedProduct = {
        ...product,
        title: formData.title,
        description: formData.description,
        brandId: formData.brandId,
        vatRate: formData.vatRate,
        price: formData.listPrice,
        salePrice: formData.salePrice,
        stock: formData.stock,
        images: images,
        cargoCompanyId: product.cargoCompanyId, // Preserve cargoCompanyId
      };

      onSave(updatedProduct);
      
      // Only show success alert if Trendyol update wasn't needed or wasn't called
      if (product.trendyol_status !== 'approved') {
        alert('Ürün başarıyla güncellendi!');
      }
      
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      alert(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Ürünü Düzenle</h2>
              <p className="text-sm text-blue-100 mt-1">SKU: {product.master_sku}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex-shrink-0">
          <div className="flex gap-1 px-6">
            {[
              { id: 'basic', label: 'Temel Bilgiler', icon: '📝' },
              { id: 'pricing', label: 'Fiyat & Stok', icon: '💰' },
              { id: 'images', label: 'Görseller', icon: '🖼️' },
              { id: 'attributes', label: 'Özellikler', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ürün Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Ürün adı girin"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Açıklama <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                  placeholder="Ürün açıklaması girin (detaylı olması önerilir)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length} karakter
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Marka ID
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: Number(e.target.value) })}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition ${
                      formData.brandId <= 0 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                  />
                  {formData.brandId <= 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Marka ID 0 olamaz. Lütfen geçerli bir marka ID girin.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    KDV Oranı (%)
                  </label>
                  <input
                    type="number"
                    value={formData.vatRate}
                    onChange={(e) => setFormData({ ...formData, vatRate: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-700 mb-2">Değiştirilemeyen Bilgiler</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">SKU:</span>
                    <p className="font-mono text-gray-900">{product.master_sku}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Barkod:</span>
                    <p className="font-mono text-gray-900">{product.barcode}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Kategori ID:</span>
                    <p className="font-mono text-gray-900">{product.categoryId}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Para Birimi:</span>
                    <p className="font-mono text-gray-900">{product.currency}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Liste Fiyatı (₺) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.listPrice}
                    onChange={(e) => setFormData({ ...formData, listPrice: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-lg font-semibold"
                  />
                  <p className="text-xs text-gray-500 mt-1">Piyasa satış fiyatı</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    İndirimli Fiyat (₺) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-lg font-semibold text-green-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">Müşterinin ödeyeceği fiyat</p>
                </div>
              </div>

              {formData.listPrice > 0 && formData.salePrice > 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">İndirim Oranı:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      %{Math.round(((formData.listPrice - formData.salePrice) / formData.listPrice) * 100)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-blue-700">
                    Tasarruf: {(formData.listPrice - formData.salePrice).toFixed(2)} ₺
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stok Miktarı <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-lg font-semibold"
                />
                <p className="text-xs text-gray-500 mt-1">Mevcut stok adedi</p>
              </div>

              {formData.stock < 5 && formData.stock > 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-sm text-yellow-800">
                      <strong>Düşük Stok Uyarısı!</strong> Stok miktarı 5&apos;in altında.
                    </div>
                  </div>
                </div>
              )}

              {formData.stock === 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-red-800">
                      <strong>Stokta Yok!</strong> Ürün satışa kapalı olacak.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <strong>Görsel Gereksinimleri:</strong> En az 1, en fazla 8 görsel. Minimum 500x500px, JPG veya PNG format. İlk görsel ürün ana görseli olacaktır.
                  </div>
                </div>
              </div>

              {/* Image Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={image.url}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover rounded-xl border-2 border-gray-200"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Görseli Sil"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                          ANA GÖRSEL
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <div>
                <label className="block">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImages || images.length >= 8}
                  />
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    uploadingImages || images.length >= 8
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      : 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100'
                  }`}>
                    {uploadingImages ? (
                      <div className="flex flex-col items-center gap-3">
                        <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-blue-600 font-medium">Görseller yükleniyor...</p>
                      </div>
                    ) : images.length >= 8 ? (
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-600 font-medium">Maksimum 8 görsel eklenebilir</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p className="text-blue-600 font-medium">Görsel Ekle</p>
                        <p className="text-sm text-gray-500">Tıklayın veya sürükleyin</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Attributes Tab */}
          {activeTab === 'attributes' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <strong>Not:</strong> Kategori ve özellik değişiklikleri şu anda desteklenmiyor. Özellik düzenlemesi için ürünü yeniden oluşturmanız gerekebilir.
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Mevcut Özellikler</h3>
                {product.attributes && Array.isArray(product.attributes) && product.attributes.length > 0 ? (
                  <div className="space-y-3">
                    {product.attributes.map((attr: unknown, index: number) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <pre className="text-xs text-gray-600 overflow-x-auto">
                          {JSON.stringify(attr, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Özellik bulunmuyor</p>
                )}
              </div>

              {product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Varyantlar</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Bu ürünün {product.variants.length} adet varyantı var.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      Varyant düzenlemesi şu anda desteklenmiyor.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3 justify-end flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Kaydediliyor...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Kaydet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
