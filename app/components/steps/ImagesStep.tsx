'use client';

import { useState } from 'react';
import type { ProductFormData } from '../NewProductForm';

interface ImagesStepProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ImagesStep({
  formData,
  updateFormData,
  onNext,
}: ImagesStepProps) {
  const [uploadUrl, setUploadUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      Array.from(files).forEach((file) => {
        uploadFormData.append('files', file);
      });
      // Add a temporary product ID or use 'temp'
      uploadFormData.append('productId', 'temp');

      const response = await fetch('/api/v1/storage/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Add uploaded images to the form
      const newImages = result.urls.map((url: string, idx: number) => ({
        url,
        is_primary: formData.images.length === 0 && idx === 0,
        sort_order: formData.images.length + idx,
      }));

      updateFormData({
        images: [...formData.images, ...newImages],
      });

      alert(`${result.urls.length} görsel başarıyla yüklendi!`);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Görsel yüklenirken hata oluştu');
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleAddImage = () => {
    if (!uploadUrl.trim()) {
      alert('Lütfen bir görsel URL\'si girin');
      return;
    }

    const newImage = {
      url: uploadUrl,
      is_primary: formData.images.length === 0, // First image is primary
      sort_order: formData.images.length,
    };

    updateFormData({
      images: [...formData.images, newImage],
    });

    setUploadUrl('');
  };

  const handleRemoveImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    // Re-index sort_order
    const reindexed = newImages.map((img, i) => ({
      ...img,
      sort_order: i,
      is_primary: i === 0 ? true : img.is_primary && i === 0,
    }));

    updateFormData({ images: reindexed });
  };

  const handleSetPrimary = (index: number) => {
    const newImages = formData.images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));

    updateFormData({ images: newImages });
  };

  const handleNext = () => {
    if (formData.images.length === 0) {
      const confirm = window.confirm('Görsel eklemeden devam etmek istiyor musunuz?');
      if (!confirm) return;
    }
    onNext();
  };

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
              📸 Ürün Görselleri
            </h4>
            <p className="text-sm text-blue-700">
              Ürününüzün görsellerini ekleyin. İlk eklenen görsel otomatik olarak ana görsel olur.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Görsel Yükle (Supabase Storage)
        </label>
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all bg-gray-50">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-3"></div>
                <p className="text-sm text-gray-600 font-medium">Görseller yükleniyor...</p>
              </>
            ) : (
              <>
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-gray-700 font-semibold">
                  <span className="text-indigo-600">Dosya seçmek için tıklayın</span> veya sürükleyin
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, JPEG, GIF (Max. 5MB)</p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/png,image/jpeg,image/jpg,image/gif"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Or URL Input */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">veya</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Görsel URL Ekle
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={uploadUrl}
            onChange={(e) => setUploadUrl(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="https://example.com/image.jpg"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddImage();
              }
            }}
          />
          <button
            onClick={handleAddImage}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Ekle
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Harici bir görsel URL&apos;si varsa buradan ekleyebilirsiniz
        </p>
      </div>

      {/* Images List */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Eklenen Görseller ({formData.images.length})
        </h3>

        {formData.images.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500">Henüz görsel eklenmedi</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {formData.images.map((image, index) => (
              <div
                key={index}
                className="relative group border-2 rounded-lg overflow-hidden"
                style={{ borderColor: image.is_primary ? '#4f46e5' : '#e5e7eb' }}
              >
                <img
                  src={image.url}
                  alt={`Product ${index + 1}`}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
                  }}
                />
                
                {image.is_primary && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded">
                    Ana Görsel
                  </div>
                )}

                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
                  {!image.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(index)}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white text-gray-700 rounded text-sm font-medium hover:bg-gray-100 transition"
                    >
                      Ana Yap
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
