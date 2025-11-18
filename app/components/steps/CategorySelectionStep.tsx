'use client';

import { useState, useEffect } from 'react';
import type { ProductFormData } from '../NewProductForm';

interface CategorySelectionStepProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface CategoryMatch {
  category: {
    id: number;
    name: string;
    parentId?: number;
  };
  score: number;
  path: string[];
  pathString: string;
  isLeaf: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export default function CategorySelectionStep({
  formData,
  updateFormData,
  onNext,
}: CategorySelectionStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<CategoryMatch | null>(null);
  const [error, setError] = useState('');

  // Run category matching on mount
  useEffect(() => {
    matchCategories();
  }, []);

  const matchCategories = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/v1/trendyol/match-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          topN: 5,
        }),
      });

      if (!response.ok) {
        throw new Error('Kategori eşleştirme başarısız oldu');
      }

      const data = await response.json();
      setMatches(data.matches || []);

      // Auto-select if there's a high-confidence match
      if (data.matches && data.matches.length > 0 && data.matches[0].confidence === 'high') {
        handleSelectCategory(data.matches[0]);
      }
    } catch (err) {
      console.error('Category matching error:', err);
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCategory = (match: CategoryMatch) => {
    setSelectedMatch(match);
    updateFormData({
      trendyol_category_id: match.category.id,
      trendyol_category_name: match.category.name,
      trendyol_category_path: match.pathString,
    });
  };

  const handleNext = () => {
    if (!selectedMatch) {
      setError('Lütfen bir kategori seçin');
      return;
    }

    if (!selectedMatch.isLeaf) {
      setError('Lütfen alt kategorisi olmayan bir kategori seçin');
      return;
    }

    onNext();
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
            Yüksek Güven
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
            Orta Güven
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
            Düşük Güven
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-600 font-medium">Kategoriler eşleştiriliyor...</p>
        <p className="text-sm text-gray-500 mt-2">Ürününüz için en uygun Trendyol kategorileri bulunuyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h3 className="font-medium text-indigo-900 mb-2">
          🎯 Otomatik Kategori Eşleştirme
        </h3>
        <p className="text-sm text-indigo-700">
          Ürün başlığınıza ve açıklamanıza göre en uygun Trendyol kategorileri aşağıda listelendi.
          Seçtiğiniz kategoriye özel zorunlu özellikler bir sonraki adımda otomatik yüklenecektir.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Category Matches */}
      {matches.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">Uygun kategori bulunamadı</p>
          <p className="text-sm mt-2">Lütfen ürün başlığını ve açıklamasını kontrol edin</p>
          <button
            onClick={matchCategories}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Tekrar Dene
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match, index) => (
            <button
              key={match.category.id}
              onClick={() => handleSelectCategory(match)}
              className={`w-full text-left p-4 border-2 rounded-lg transition ${
                selectedMatch?.category.id === match.category.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-semibold text-gray-900">
                      #{index + 1}
                    </span>
                    <h4 className="font-semibold text-gray-900">
                      {match.category.name}
                    </h4>
                    {!match.isLeaf && (
                      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                        ⚠️ Alt kategori var
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {match.pathString}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getConfidenceBadge(match.confidence)}
                  <div className="text-xs text-gray-500">
                    Skor: {match.score.toFixed(1)}
                  </div>
                </div>
              </div>

              {selectedMatch?.category.id === match.category.id && (
                <div className="mt-3 pt-3 border-t border-indigo-200">
                  <div className="flex items-center gap-2 text-sm text-indigo-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Seçildi</span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Selected Category Info */}
      {selectedMatch && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-green-900 mb-1">
                ✅ Kategori Seçildi
              </h4>
              <p className="text-sm text-green-700">
                <strong>{selectedMatch.category.name}</strong>
              </p>
              <p className="text-xs text-green-600 mt-1">
                Yol: {selectedMatch.pathString}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="pt-6">
        <button
          onClick={handleNext}
          disabled={!selectedMatch || !selectedMatch.isLeaf}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {selectedMatch
            ? selectedMatch.isLeaf
              ? 'Devam Et →'
              : 'Alt kategori olmayan bir kategori seçin'
            : 'Önce bir kategori seçin'}
        </button>
      </div>
    </div>
  );
}
