'use client';

import { useState, useEffect } from 'react';

import type { ProductFormData } from '../NewProductForm';

interface MarketplaceSelectionStepProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Available marketplace configurations
const MARKETPLACES = [
  {
    id: 'trendyol',
    name: 'Trendyol',
    logo: '🟠',
    description: "Türkiye'nin en büyük e-ticaret platformu",
    color: 'orange',
    enabled: true,
  },
  {
    id: 'hepsiburada',
    name: 'Hepsiburada',
    logo: '🟡',
    description: "Türkiye'nin lider online alışveriş sitesi",
    color: 'yellow',
    enabled: true,
  },
  {
    id: 'temu',
    name: 'Temu',
    logo: '🔶',
    description: 'Global e-ticaret platformu',
    color: 'orange',
    enabled: true,
  },
  {
    id: 'n11',
    name: 'N11',
    logo: '🟣',
    description: 'N11 pazaryeri entegrasyonu',
    color: 'purple',
    enabled: false, // Coming soon
  },
  {
    id: 'amazon',
    name: 'Amazon TR',
    logo: '📦',
    description: 'Amazon Türkiye pazaryeri',
    color: 'blue',
    enabled: false, // Coming soon
  },
  {
    id: 'ciceksepeti',
    name: 'Çiçeksepeti',
    logo: '🌸',
    description: 'Çiçeksepeti pazaryeri',
    color: 'pink',
    enabled: false, // Coming soon
  },
];

export type MarketplaceId = 'trendyol' | 'hepsiburada' | 'temu' | 'n11' | 'amazon' | 'ciceksepeti';

export default function MarketplaceSelectionStep({
  formData,
  updateFormData,
  onNext,
}: MarketplaceSelectionStepProps) {
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<MarketplaceId[]>(
    formData.selected_marketplaces || []
  );
  const [error, setError] = useState('');

  // Sync local state to parent formData when selection changes
  useEffect(() => {
    // Only update if the values are different to avoid infinite loops
    const currentSelection = formData.selected_marketplaces || [];
    const isDifferent = 
      selectedMarketplaces.length !== currentSelection.length ||
      selectedMarketplaces.some((id, index) => id !== currentSelection[index]);
    
    if (isDifferent) {
      updateFormData({ selected_marketplaces: selectedMarketplaces });
    }
  }, [selectedMarketplaces, formData.selected_marketplaces, updateFormData]);

  const toggleMarketplace = (marketplaceId: MarketplaceId) => {
    const marketplace = MARKETPLACES.find(m => m.id === marketplaceId);
    if (!marketplace?.enabled) return;

    setError('');
    
    setSelectedMarketplaces(prev => 
      prev.includes(marketplaceId)
        ? prev.filter(id => id !== marketplaceId)
        : [...prev, marketplaceId]
    );
  };

  const handleSelectAll = () => {
    const enabledMarketplaces = MARKETPLACES
      .filter(m => m.enabled)
      .map(m => m.id as MarketplaceId);
    
    setSelectedMarketplaces(enabledMarketplaces);
    setError('');
  };

  const handleClearAll = () => {
    setSelectedMarketplaces([]);
  };

  const handleNext = () => {
    if (selectedMarketplaces.length === 0) {
      setError('Lütfen en az bir pazaryeri seçin');
      return;
    }
    onNext();
  };

  const getMarketplaceColor = (marketplaceId: string, isSelected: boolean) => {
    if (!isSelected) return 'border-gray-200 hover:border-gray-300 bg-white';
    
    switch (marketplaceId) {
      case 'trendyol':
        return 'border-orange-500 bg-orange-50';
      case 'hepsiburada':
        return 'border-yellow-500 bg-yellow-50';
      case 'n11':
        return 'border-purple-500 bg-purple-50';
      case 'amazon':
        return 'border-blue-500 bg-blue-50';
      case 'ciceksepeti':
        return 'border-pink-500 bg-pink-50';
      default:
        return 'border-indigo-500 bg-indigo-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🛒</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              Pazaryeri Seçimi
            </h3>
            <p className="text-sm text-gray-600">
              Ürünü hangi pazaryerlerinde satmak istediğinizi seçin. 
              Seçtiğiniz her platform için kategori, marka ve özellik eşleştirmesi yapılacaktır.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Mevcut Pazaryerleri</h4>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="text-sm px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
          >
            Tümünü Seç
          </button>
          <button
            onClick={handleClearAll}
            className="text-sm px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Marketplace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MARKETPLACES.map((marketplace) => {
          const isSelected = selectedMarketplaces.includes(marketplace.id as MarketplaceId);
          const isDisabled = !marketplace.enabled;
          
          return (
            <button
              key={marketplace.id}
              onClick={() => toggleMarketplace(marketplace.id as MarketplaceId)}
              disabled={isDisabled}
              className={`relative text-left p-5 border-2 rounded-xl transition-all duration-200 ${
                isDisabled 
                  ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' 
                  : getMarketplaceColor(marketplace.id, isSelected)
              }`}
            >
              {/* Coming Soon Badge */}
              {isDisabled && (
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                    Yakında
                  </span>
                </div>
              )}
              
              {/* Selection Indicator */}
              {isSelected && !isDisabled && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <span className="text-3xl">{marketplace.logo}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-gray-900 text-lg">{marketplace.name}</h5>
                  <p className="text-sm text-gray-500 truncate">{marketplace.description}</p>
                </div>
              </div>

              {/* Checkbox Visual */}
              {!isDisabled && (
                <div className="mt-4 flex items-center gap-2">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                    isSelected 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">
                    {isSelected ? 'Seçildi' : 'Seçmek için tıklayın'}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedMarketplaces.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-green-900">
                {selectedMarketplaces.length} pazaryeri seçildi
              </h4>
              <p className="text-xs text-green-700">
                {selectedMarketplaces.map(id => 
                  MARKETPLACES.find(m => m.id === id)?.name
                ).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="pt-6">
        <button
          onClick={handleNext}
          disabled={selectedMarketplaces.length === 0}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {selectedMarketplaces.length > 0 ? (
            <>
              Devam Et
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          ) : (
            'Önce bir pazaryeri seçin'
          )}
        </button>
      </div>
    </div>
  );
}
