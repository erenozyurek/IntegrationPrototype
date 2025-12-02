'use client';

import { useState, useEffect } from 'react';
import type { ProductFormData, MarketplaceId } from '../NewProductForm';

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

interface MarketplaceBrandState {
  isLoading: boolean;
  matches: BrandMatch[];
  selectedBrand: BrandMatch | null;
  manualBrandName: string;
  error: string;
}

// Static list of Trendyol cargo providers
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

// Marketplace configurations
const MARKETPLACE_CONFIG: Record<string, { 
  name: string; 
  logo: string; 
  color: string; 
  hasBrandApi: boolean;
  brandApiEndpoint?: string;
}> = {
  trendyol: {
    name: 'Trendyol',
    logo: '🟠',
    color: 'orange',
    hasBrandApi: true,
    brandApiEndpoint: '/api/v1/trendyol/match-brand',
  },
  hepsiburada: {
    name: 'Hepsiburada',
    logo: '🟡',
    color: 'yellow',
    hasBrandApi: false, // Hepsiburada uses brand name as text, not ID
  },
};

export default function BrandSelectionStepMulti({
  formData,
  updateFormData,
  onNext,
  onBack,
}: BrandSelectionStepProps) {
  const selectedMarketplaces = formData.selected_marketplaces || [];
  
  // State for each marketplace
  const [marketplaceStates, setMarketplaceStates] = useState<Record<MarketplaceId, MarketplaceBrandState>>({
    trendyol: { isLoading: false, matches: [], selectedBrand: null, manualBrandName: '', error: '' },
    hepsiburada: { isLoading: false, matches: [], selectedBrand: null, manualBrandName: '', error: '' },
    n11: { isLoading: false, matches: [], selectedBrand: null, manualBrandName: '', error: '' },
    amazon: { isLoading: false, matches: [], selectedBrand: null, manualBrandName: '', error: '' },
    ciceksepeti: { isLoading: false, matches: [], selectedBrand: null, manualBrandName: '', error: '' },
    temu: { isLoading: false, matches: [], selectedBrand: null, manualBrandName: '', error: '' },
  });
  
  const [activeTab, setActiveTab] = useState<MarketplaceId>(selectedMarketplaces[0] || 'trendyol');
  const [selectedCargoProvider, setSelectedCargoProvider] = useState<number | null>(null);
  const [globalError, setGlobalError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TrendyolBrand[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualSearch, setShowManualSearch] = useState(false);

  // Run brand matching for Trendyol on mount
  useEffect(() => {
    if (selectedMarketplaces.includes('trendyol')) {
      matchBrands('trendyol');
    }
    
    // Set default cargo provider
    if (formData.cargo_provider_id) {
      setSelectedCargoProvider(parseInt(formData.cargo_provider_id));
    } else {
      setSelectedCargoProvider(17);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Sync cargo provider to parent when it changes
  useEffect(() => {
    if (selectedCargoProvider && formData.cargo_provider_id !== selectedCargoProvider.toString()) {
      updateFormData({ cargo_provider_id: selectedCargoProvider.toString() });
    }
  }, [selectedCargoProvider, formData.cargo_provider_id, updateFormData]);

  const matchBrands = async (marketplaceId: MarketplaceId) => {
    const config = MARKETPLACE_CONFIG[marketplaceId];
    if (!config?.hasBrandApi || !config.brandApiEndpoint) return;

    setMarketplaceStates(prev => ({
      ...prev,
      [marketplaceId]: { ...prev[marketplaceId], isLoading: true, error: '' },
    }));

    try {
      const response = await fetch(config.brandApiEndpoint, {
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
      const matches = data.matches || [];

      // Auto-select if there's a high-confidence match
      let selectedBrand: BrandMatch | null = null;
      if (matches.length > 0 && matches[0].confidence === 'high') {
        selectedBrand = matches[0];
        handleSelectBrand(marketplaceId, matches[0]);
      }

      setMarketplaceStates(prev => ({
        ...prev,
        [marketplaceId]: { 
          ...prev[marketplaceId], 
          isLoading: false, 
          matches,
          selectedBrand: selectedBrand || prev[marketplaceId].selectedBrand,
        },
      }));
    } catch (err) {
      console.error(`${marketplaceId} brand matching error:`, err);
      setMarketplaceStates(prev => ({
        ...prev,
        [marketplaceId]: { 
          ...prev[marketplaceId], 
          isLoading: false, 
          error: err instanceof Error ? err.message : 'Bir hata oluştu',
        },
      }));
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

  const handleSelectBrand = (marketplaceId: MarketplaceId, match: BrandMatch) => {
    setMarketplaceStates(prev => ({
      ...prev,
      [marketplaceId]: { ...prev[marketplaceId], selectedBrand: match },
    }));

    if (marketplaceId === 'trendyol') {
      updateFormData({
        brand_id: match.brand.id.toString(),
        trendyol_brand_id: match.brand.id,
        trendyol_brand_name: match.brand.name,
      });
    }
  };

  const handleSelectSearchResult = (brand: TrendyolBrand) => {
    const match: BrandMatch = {
      brand,
      score: 100,
      confidence: 'high',
      matchType: 'exact',
    };
    handleSelectBrand('trendyol', match);
    setShowManualSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleHepsiburadaBrandChange = (brandName: string) => {
    setMarketplaceStates(prev => ({
      ...prev,
      hepsiburada: { ...prev.hepsiburada, manualBrandName: brandName },
    }));
    updateFormData({ hepsiburada_brand_name: brandName });
  };

  const handleSelectCargoProvider = (providerId: number) => {
    setSelectedCargoProvider(providerId);
    updateFormData({ cargo_provider_id: providerId.toString() });
  };

  const handleNext = () => {
    const errors: string[] = [];
    
    if (selectedMarketplaces.includes('trendyol')) {
      const trendyolState = marketplaceStates.trendyol;
      if (!trendyolState.selectedBrand) {
        errors.push('Trendyol için marka seçin');
      }
    }
    
    if (selectedMarketplaces.includes('hepsiburada')) {
      const hbState = marketplaceStates.hepsiburada;
      if (!hbState.manualBrandName.trim()) {
        errors.push('Hepsiburada için marka adı girin');
      }
    }
    
    if (!selectedCargoProvider) {
      errors.push('Kargo firması seçin');
    }

    if (errors.length > 0) {
      setGlobalError(errors.join(', '));
      return;
    }

    setGlobalError('');
    onNext();
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Yüksek Eşleşme</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Orta Eşleşme</span>;
      case 'low':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Düşük Eşleşme</span>;
      default:
        return null;
    }
  };

  const getTabColor = (marketplaceId: string, isActive: boolean) => {
    if (!isActive) return 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    switch (marketplaceId) {
      case 'trendyol': return 'border-orange-500 text-orange-600';
      case 'hepsiburada': return 'border-yellow-500 text-yellow-600';
      default: return 'border-indigo-500 text-indigo-600';
    }
  };

  const renderTrendyolBrands = () => {
    const state = marketplaceStates.trendyol;

    if (state.isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-orange-600 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p className="text-gray-600">Markalar eşleştiriliyor...</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Toggle Manual Search */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowManualSearch(!showManualSearch)}
            className="text-sm text-indigo-600 hover:text-indigo-800 transition"
          >
            {showManualSearch ? 'Önerileri Göster' : 'Manuel Arama'}
          </button>
        </div>

        {/* Manual Search */}
        {showManualSearch ? (
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
              <div className="max-h-48 overflow-y-auto space-y-2">
                {searchResults.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => handleSelectSearchResult(brand)}
                    className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-orange-300 transition"
                  >
                    <span className="font-medium">{brand.name}</span>
                    <span className="text-xs text-gray-500 ml-2">ID: {brand.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {state.matches.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>Uygun marka bulunamadı</p>
                <button
                  onClick={() => setShowManualSearch(true)}
                  className="mt-2 text-indigo-600 hover:text-indigo-800"
                >
                  Manuel Arama Yap
                </button>
              </div>
            ) : (
              state.matches.map((match, index) => (
                <button
                  key={match.brand.id}
                  onClick={() => handleSelectBrand('trendyol', match)}
                  className={`w-full text-left p-4 border-2 rounded-lg transition ${
                    state.selectedBrand?.brand.id === match.brand.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-gray-400">#{index + 1}</span>
                      <div>
                        <h5 className="font-semibold text-gray-900">{match.brand.name}</h5>
                        <p className="text-xs text-gray-500">ID: {match.brand.id}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getConfidenceBadge(match.confidence)}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Selected Brand */}
        {state.selectedBrand && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              ✅ <strong>{state.selectedBrand.brand.name}</strong> seçildi
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderHepsiburadaBrand = () => {
    const state = marketplaceStates.hepsiburada;

    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            💡 Hepsiburada&apos;da marka adını metin olarak girmeniz gerekmektedir. 
            Trendyol&apos;dan farklı olarak marka ID&apos;si kullanılmaz.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marka Adı
          </label>
          <input
            type="text"
            value={state.manualBrandName}
            onChange={(e) => handleHepsiburadaBrandChange(e.target.value)}
            placeholder="Örn: Nike, Adidas, Samsung..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          />
        </div>

        {state.manualBrandName && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              ✅ Marka: <strong>{state.manualBrandName}</strong>
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderBrandContent = (marketplaceId: MarketplaceId) => {
    if (marketplaceId === 'trendyol') return renderTrendyolBrands();
    if (marketplaceId === 'hepsiburada') return renderHepsiburadaBrand();
    return <p className="text-gray-500 py-8 text-center">Bu pazaryeri henüz desteklenmiyor</p>;
  };

  // Filter to only show marketplaces that need brand selection
  const relevantMarketplaces = selectedMarketplaces.filter(id => MARKETPLACE_CONFIG[id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🏷️</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              Marka ve Kargo Seçimi
            </h3>
            <p className="text-sm text-gray-600">
              Her pazaryeri için marka bilgisini girin ve kargo firmanızı seçin.
            </p>
          </div>
        </div>
      </div>

      {globalError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{globalError}</p>
        </div>
      )}

      {/* Marketplace Tabs for Brands */}
      {relevantMarketplaces.length > 0 && (
        <>
          <h4 className="font-medium text-gray-900">Marka Seçimi</h4>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4">
              {relevantMarketplaces.map(marketplaceId => {
                const config = MARKETPLACE_CONFIG[marketplaceId];
                if (!config) return null;

                const state = marketplaceStates[marketplaceId];
                const isActive = activeTab === marketplaceId;
                const hasSelection = state.selectedBrand || state.manualBrandName;

                return (
                  <button
                    key={marketplaceId}
                    onClick={() => setActiveTab(marketplaceId)}
                    className={`group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm transition ${
                      getTabColor(marketplaceId, isActive)
                    }`}
                  >
                    <span className="mr-2">{config.logo}</span>
                    {config.name}
                    {hasSelection && (
                      <svg className="w-4 h-4 ml-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Brand Content */}
          <div className="min-h-[200px]">
            {renderBrandContent(activeTab)}
          </div>
        </>
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
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 pt-6">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          ← Geri
        </button>
        <button
          onClick={handleNext}
          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          Devam Et →
        </button>
      </div>
    </div>
  );
}
