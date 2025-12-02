'use client';

import { useState, useEffect } from 'react';
import type { ProductFormData } from '../NewProductForm';

interface BrandSelectionStepProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface TrendyolBrand {
  id: number;
  name: string;
}

interface BrandMatch {
  brand: TrendyolBrand;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  matchType: 'exact' | 'partial' | 'fuzzy';
}

// Static list of Trendyol cargo providers
// Source: Trendyol API Documentation
const CARGO_PROVIDERS = [
  { id: 17, name: 'Trendyol Express', recommended: true },
  { id: 4, name: 'Yurtiçi Kargo', recommended: true },
  { id: 7, name: 'Aras Kargo', recommended: false },
  { id: 9, name: 'Sürat Kargo', recommended: false },
  { id: 10, name: 'DHL', recommended: false },
  { id: 19, name: 'PTT Kargo', recommended: false },
  { id: 6, name: 'Horoz Lojistik', recommended: false },
  { id: 20, name: 'CEVA Lojistik', recommended: false },
  { id: 30, name: 'Borusan Lojistik', recommended: false },
  { id: 38, name: 'Kolay Gelsin', recommended: false },
];

export default function BrandSelectionStep({
  formData,
  updateFormData,
  onNext,
  onBack,
}: BrandSelectionStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<BrandMatch[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandMatch | null>(null);
  const [selectedCargoProvider, setSelectedCargoProvider] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TrendyolBrand[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [error, setError] = useState('');

  // Run brand matching on mount
  useEffect(() => {
    matchBrands();
    // Set default cargo provider if already selected
    if (formData.cargo_provider_id) {
      setSelectedCargoProvider(parseInt(formData.cargo_provider_id));
    } else {
      // Default to Trendyol Express
      setSelectedCargoProvider(17);
      updateFormData({ cargo_provider_id: '17' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matchBrands = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/trendyol/match-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          topN: 5,
        }),
      });

      if (!response.ok) {
        throw new Error('Marka eşleştirme başarısız oldu');
      }

      const data = await response.json();
      setMatches(data.matches || []);

      // Auto-select if there's a high-confidence match
      if (data.matches && data.matches.length > 0) {
        const bestMatch = data.matches[0];
        if (bestMatch.confidence === 'high') {
          handleSelectBrand(bestMatch);
        }
      }
    } catch (err) {
      console.error('Brand matching error:', err);
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch('/api/v1/trendyol/match-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery: searchQuery.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Marka arama başarısız oldu');
      }

      const data = await response.json();
      setSearchResults(data.brands || []);
    } catch (err) {
      console.error('Brand search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBrand = (match: BrandMatch) => {
    setSelectedBrand(match);
    updateFormData({
      brand_id: match.brand.id.toString(),
    });
  };

  const handleSelectSearchResult = (brand: TrendyolBrand) => {
    const match: BrandMatch = {
      brand,
      score: 100,
      confidence: 'high',
      matchType: 'exact',
    };
    setSelectedBrand(match);
    updateFormData({
      brand_id: brand.id.toString(),
    });
    setShowManualSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSelectCargoProvider = (providerId: number) => {
    setSelectedCargoProvider(providerId);
    updateFormData({
      cargo_provider_id: providerId.toString(),
    });
  };

  const handleNext = () => {
    if (!selectedBrand) {
      setError('Lütfen bir marka seçin');
      return;
    }

    if (!selectedCargoProvider) {
      setError('Lütfen bir kargo firması seçin');
      return;
    }

    onNext();
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
            Yüksek Eşleşme
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
            Orta Eşleşme
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
            Düşük Eşleşme
          </span>
        );
      default:
        return null;
    }
  };

  const getMatchTypeBadge = (matchType: string) => {
    switch (matchType) {
      case 'exact':
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
            Tam Eşleşme
          </span>
        );
      case 'partial':
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
            Kısmi Eşleşme
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
        <p className="text-gray-600 font-medium">Markalar eşleştiriliyor...</p>
        <p className="text-sm text-gray-500 mt-2">Ürününüz için en uygun Trendyol markaları bulunuyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h3 className="font-medium text-indigo-900 mb-2">
          🏷️ Marka ve Kargo Seçimi
        </h3>
        <p className="text-sm text-indigo-700">
          Ürün başlığınıza göre en uygun Trendyol markaları aşağıda listelendi.
          Ayrıca ürün gönderimi için kullanacağınız kargo firmasını seçin.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Brand Selection Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Marka Seçimi</h4>
          <button
            onClick={() => setShowManualSearch(!showManualSearch)}
            className="text-sm text-indigo-600 hover:text-indigo-800 transition"
          >
            {showManualSearch ? 'Önerileri Göster' : 'Manuel Arama'}
          </button>
        </div>

        {/* Manual Search */}
        {showManualSearch && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Marka adı yazın..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300"
              >
                {isSearching ? 'Arıyor...' : 'Ara'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => handleSelectSearchResult(brand)}
                    className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition"
                  >
                    <span className="font-medium">{brand.name}</span>
                    <span className="text-xs text-gray-500 ml-2">ID: {brand.id}</span>
                  </button>
                ))}
              </div>
            )}

            {isSearching && (
              <div className="text-center py-4">
                <span className="text-gray-500">Aranıyor...</span>
              </div>
            )}

            {!isSearching && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-4">
                <span className="text-gray-500">Sonuç bulunamadı</span>
              </div>
            )}
          </div>
        )}

        {/* Brand Matches */}
        {!showManualSearch && (
          <>
            {matches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">Uygun marka bulunamadı</p>
                <p className="text-sm mt-1">Manuel arama yaparak marka seçebilirsiniz</p>
                <button
                  onClick={() => setShowManualSearch(true)}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Manuel Arama Yap
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {matches.map((match, index) => (
                  <button
                    key={match.brand.id}
                    onClick={() => handleSelectBrand(match)}
                    className={`w-full text-left p-4 border-2 rounded-lg transition ${
                      selectedBrand?.brand.id === match.brand.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-gray-400">
                          #{index + 1}
                        </span>
                        <div>
                          <h5 className="font-semibold text-gray-900">{match.brand.name}</h5>
                          <p className="text-xs text-gray-500">ID: {match.brand.id}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getConfidenceBadge(match.confidence)}
                        {getMatchTypeBadge(match.matchType)}
                        <span className="text-xs text-gray-500">Skor: {match.score.toFixed(0)}</span>
                      </div>
                    </div>
                    {selectedBrand?.brand.id === match.brand.id && (
                      <div className="mt-2 pt-2 border-t border-indigo-200 flex items-center gap-2 text-sm text-indigo-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Seçildi</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Selected Brand Info */}
      {selectedBrand && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-green-900">
                ✅ Marka Seçildi
              </h4>
              <p className="text-sm text-green-700">
                <strong>{selectedBrand.brand.name}</strong> (ID: {selectedBrand.brand.id})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cargo Provider Selection */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-900">🚚 Kargo Firması Seçimi</h4>
        
        <div className="grid grid-cols-2 gap-2">
          {CARGO_PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleSelectCargoProvider(provider.id)}
              className={`p-3 border-2 rounded-lg text-left transition ${
                selectedCargoProvider === provider.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{provider.name}</span>
                {provider.recommended && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                    Önerilen
                  </span>
                )}
              </div>
              {selectedCargoProvider === provider.id && (
                <div className="mt-1 flex items-center gap-1 text-xs text-indigo-700">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Seçildi</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Cargo Info */}
      {selectedCargoProvider && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                📦 Kargo Firması Seçildi
              </h4>
              <p className="text-sm text-blue-700">
                <strong>{CARGO_PROVIDERS.find(p => p.id === selectedCargoProvider)?.name}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4 pt-6">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          ← Geri
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedBrand || !selectedCargoProvider}
          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {selectedBrand && selectedCargoProvider
            ? 'Devam Et →'
            : 'Önce marka ve kargo seçin'}
        </button>
      </div>
    </div>
  );
}
