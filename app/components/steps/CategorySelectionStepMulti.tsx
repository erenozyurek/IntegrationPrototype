'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ProductFormData, MarketplaceId } from '../NewProductForm';
import HepsiburadaCategoryBrowser from '../HepsiburadaCategoryBrowser';
import TemuCategoryBrowser from '../TemuCategoryBrowser';
import type { CategoryTreeNode } from '@/lib/integrations/hepsiburada/cache';
import type { TemuCategoryTreeNode } from '@/lib/integrations/temu/cache';

interface CategorySelectionStepProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface CategoryMatch {
  category: {
    id: number;
    categoryId?: number;
    name: string;
    displayName?: string;
  };
  score: number;
  path: string[];
  pathString: string;
  isLeaf: boolean;
  confidence: 'high' | 'medium' | 'low';
}

interface MarketplaceCategoryState {
  isLoading: boolean;
  matches: CategoryMatch[];
  selectedCategoryId: number | null;
  selectedCategoryName: string;
  selectedCategoryPath: string;
  error: string;
  showManualBrowser: boolean;
  categoryTree: CategoryTreeNode[];
  temuCategoryTree: TemuCategoryTreeNode[];
  isTreeLoading: boolean;
}

// Cache for category matches - persists across component mounts
// Key format: `${marketplaceId}:${title}:${description}`
const categoryMatchCache = new Map<string, {
  matches: CategoryMatch[];
  selectedCategoryId: number | null;
  selectedCategoryName: string;
  selectedCategoryPath: string;
  timestamp: number;
}>();

const MATCH_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Generate cache key from product info
 */
function getCacheKey(marketplaceId: string, title: string, description: string): string {
  // Normalize the text for consistent caching
  const normalizedTitle = (title || '').trim().toLowerCase();
  const normalizedDesc = (description || '').trim().toLowerCase().substring(0, 200); // Limit description length
  return `${marketplaceId}:${normalizedTitle}:${normalizedDesc}`;
}

/**
 * Check if cached matches are still valid
 */
function isCacheValid(timestamp: number): boolean {
  return (Date.now() - timestamp) < MATCH_CACHE_TTL_MS;
}

// Marketplace configurations
const MARKETPLACE_CONFIG: Record<string, { 
  name: string; 
  logo: string; 
  bgColor: string;
  borderColor: string;
  apiEndpoint: string;
  searchEndpoint?: string;
}> = {
  trendyol: {
    name: 'Trendyol',
    logo: '🟠',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    apiEndpoint: '/api/v1/trendyol/match-category',
  },
  hepsiburada: {
    name: 'Hepsiburada',
    logo: '🟡',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    apiEndpoint: '/api/v1/hepsiburada/match-category',
  },
  temu: {
    name: 'Temu',
    logo: '🔶',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    apiEndpoint: '/api/v1/temu/match-category',
  },
};

export default function CategorySelectionStep({
  formData,
  updateFormData,
  onNext,
  onBack,
}: CategorySelectionStepProps) {
  const selectedMarketplaces = formData.selected_marketplaces || [];
  
  // Track which title/description we've fetched for to detect changes
  const lastFetchedForRef = useRef<Record<string, string>>({});
  
  // State for each marketplace
  const [marketplaceStates, setMarketplaceStates] = useState<Record<MarketplaceId, MarketplaceCategoryState>>(() => {
    const initial: Record<MarketplaceId, MarketplaceCategoryState> = {} as Record<MarketplaceId, MarketplaceCategoryState>;
    (['trendyol', 'hepsiburada', 'temu', 'n11', 'amazon', 'ciceksepeti'] as MarketplaceId[]).forEach(id => {
      initial[id] = { 
        isLoading: false, 
        matches: [], 
        selectedCategoryId: null,
        selectedCategoryName: '',
        selectedCategoryPath: '',
        error: '',
        showManualBrowser: false,
        categoryTree: [],
        temuCategoryTree: [],
        isTreeLoading: false,
      };
    });
    return initial;
  });

  // Fetch categories for selected marketplaces on mount
  useEffect(() => {
    selectedMarketplaces.forEach(marketplaceId => {
      if (MARKETPLACE_CONFIG[marketplaceId]) {
        fetchCategories(marketplaceId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async (marketplaceId: MarketplaceId, forceRefresh: boolean = false) => {
    const config = MARKETPLACE_CONFIG[marketplaceId];
    if (!config) return;

    const cacheKey = getCacheKey(marketplaceId, formData.title, formData.description);
    
    // Check if we already have cached results for this title/description
    if (!forceRefresh) {
      const cached = categoryMatchCache.get(cacheKey);
      if (cached && isCacheValid(cached.timestamp)) {
        console.log(`📦 [Cache] Using cached matches for ${marketplaceId}`);
        
        setMarketplaceStates(prev => ({
          ...prev,
          [marketplaceId]: { 
            ...prev[marketplaceId], 
            isLoading: false, 
            matches: cached.matches,
            selectedCategoryId: cached.selectedCategoryId,
            selectedCategoryName: cached.selectedCategoryName,
            selectedCategoryPath: cached.selectedCategoryPath,
          },
        }));
        
        // Also update form data if we have a selection
        if (cached.selectedCategoryId) {
          if (marketplaceId === 'trendyol') {
            updateFormData({
              trendyol_category_id: cached.selectedCategoryId,
              trendyol_category_name: cached.selectedCategoryName,
              trendyol_category_path: cached.selectedCategoryPath,
            });
          } else if (marketplaceId === 'hepsiburada') {
            updateFormData({
              hepsiburada_category_id: cached.selectedCategoryId,
              hepsiburada_category_name: cached.selectedCategoryName,
              hepsiburada_category_path: cached.selectedCategoryPath,
            });
          } else if (marketplaceId === 'temu') {
            updateFormData({
              temu_category_id: cached.selectedCategoryId,
              temu_category_name: cached.selectedCategoryName,
              temu_category_path: cached.selectedCategoryPath,
            });
          }
        }
        
        lastFetchedForRef.current[marketplaceId] = cacheKey;
        return;
      }
    }

    setMarketplaceStates(prev => ({
      ...prev,
      [marketplaceId]: { ...prev[marketplaceId], isLoading: true, error: '' },
    }));

    try {
      console.log(`🔄 [API] Fetching category matches for ${marketplaceId}...`);
      
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          topN: 10,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `${config.name} kategori eşleştirme başarısız`);
      }

      const data = await response.json();
      const matches: CategoryMatch[] = data.matches || [];

      // Auto-select the best match (first one with highest score)
      let selectedCategoryId: number | null = null;
      let selectedCategoryName = '';
      let selectedCategoryPath = '';
      
      if (matches.length > 0) {
        const bestMatch = matches[0];
        selectedCategoryId = bestMatch.category.categoryId || bestMatch.category.id;
        selectedCategoryName = bestMatch.category.displayName || bestMatch.category.name;
        selectedCategoryPath = bestMatch.pathString;
        handleCategoryChange(marketplaceId, bestMatch);
      }

      // Cache the results
      categoryMatchCache.set(cacheKey, {
        matches,
        selectedCategoryId,
        selectedCategoryName,
        selectedCategoryPath,
        timestamp: Date.now(),
      });
      
      lastFetchedForRef.current[marketplaceId] = cacheKey;
      console.log(`✅ [Cache] Cached ${matches.length} matches for ${marketplaceId}`);

      setMarketplaceStates(prev => ({
        ...prev,
        [marketplaceId]: { 
          ...prev[marketplaceId], 
          isLoading: false, 
          matches,
          selectedCategoryId,
          selectedCategoryName,
          selectedCategoryPath,
        },
      }));
    } catch (err) {
      console.error(`${marketplaceId} category matching error:`, err);
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

  const handleCategoryChange = (marketplaceId: MarketplaceId, match: CategoryMatch) => {
    const categoryId = match.category.categoryId || match.category.id;
    const categoryName = match.category.displayName || match.category.name;
    
    setMarketplaceStates(prev => ({
      ...prev,
      [marketplaceId]: { 
        ...prev[marketplaceId], 
        selectedCategoryId: categoryId,
        selectedCategoryName: categoryName,
        selectedCategoryPath: match.pathString,
      },
    }));

    // Update cache with new selection
    const cacheKey = getCacheKey(marketplaceId, formData.title, formData.description);
    const cached = categoryMatchCache.get(cacheKey);
    if (cached) {
      categoryMatchCache.set(cacheKey, {
        ...cached,
        selectedCategoryId: categoryId,
        selectedCategoryName: categoryName,
        selectedCategoryPath: match.pathString,
      });
    }

    // Update form data and prefetch attributes
    if (marketplaceId === 'trendyol') {
      updateFormData({
        trendyol_category_id: categoryId,
        trendyol_category_name: categoryName,
        trendyol_category_path: match.pathString,
      });
    } else if (marketplaceId === 'hepsiburada') {
      console.log('🎯 [CategorySelection] Hepsiburada category selected:', {
        categoryId,
        categoryName,
        pathString: match.pathString,
        matchScore: match.score,
        matchConfidence: match.confidence,
      });
      updateFormData({
        hepsiburada_category_id: categoryId,
        hepsiburada_category_name: categoryName,
        hepsiburada_category_path: match.pathString,
      });
      // Note: Attributes will be fetched when user moves to the next step (AttributesStep)
      // No prefetch here to avoid fetching for auto-selected categories
    } else if (marketplaceId === 'temu') {
      console.log('🎯 [CategorySelection] Temu category selected:', {
        categoryId,
        categoryName,
        pathString: match.pathString,
        matchScore: match.score,
        matchConfidence: match.confidence,
      });
      updateFormData({
        temu_category_id: categoryId,
        temu_category_name: categoryName,
        temu_category_path: match.pathString,
      });
      // Note: Attributes will be fetched when user moves to the next step (AttributesStep)
    }
  };

  // Fetch category tree for manual browsing
  const fetchCategoryTree = useCallback(async (marketplaceId: MarketplaceId) => {
    if (marketplaceId !== 'hepsiburada' && marketplaceId !== 'temu') return;

    setMarketplaceStates(prev => ({
      ...prev,
      [marketplaceId]: { ...prev[marketplaceId], isTreeLoading: true },
    }));

    try {
      const apiUrl = marketplaceId === 'temu' 
        ? '/api/v1/temu/categories?action=tree'
        : '/api/v1/hepsiburada/categories?action=tree';
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch category tree');
      
      const data = await response.json();
      
      if (marketplaceId === 'temu') {
        setMarketplaceStates(prev => ({
          ...prev,
          [marketplaceId]: { 
            ...prev[marketplaceId], 
            temuCategoryTree: data.tree || [],
            isTreeLoading: false,
          },
        }));
      } else {
        setMarketplaceStates(prev => ({
          ...prev,
          [marketplaceId]: { 
            ...prev[marketplaceId], 
            categoryTree: data.tree || [],
            isTreeLoading: false,
          },
        }));
      }
    } catch (error) {
      console.error('Failed to fetch category tree:', error);
      setMarketplaceStates(prev => ({
        ...prev,
        [marketplaceId]: { ...prev[marketplaceId], isTreeLoading: false },
      }));
    }
  }, []);

  // Toggle manual browser
  const toggleManualBrowser = (marketplaceId: MarketplaceId) => {
    const state = marketplaceStates[marketplaceId];
    const showBrowser = !state.showManualBrowser;
    
    setMarketplaceStates(prev => ({
      ...prev,
      [marketplaceId]: { ...prev[marketplaceId], showManualBrowser: showBrowser },
    }));

    // Fetch tree if opening browser and not loaded
    const treeToCheck = marketplaceId === 'temu' ? state.temuCategoryTree : state.categoryTree;
    if (showBrowser && treeToCheck.length === 0) {
      fetchCategoryTree(marketplaceId);
    }
  };

  // Handle manual category selection from browser
  const handleManualCategorySelect = (marketplaceId: MarketplaceId, category: { id: number; name: string; path: string }) => {
    const match: CategoryMatch = {
      category: {
        id: category.id,
        categoryId: category.id,
        name: category.name,
        displayName: category.name,
      },
      score: 100,
      path: category.path.split(' > '),
      pathString: category.path,
      isLeaf: true,
      confidence: 'high',
    };
    
    handleCategoryChange(marketplaceId, match);
    
    // Close the browser after selection
    setMarketplaceStates(prev => ({
      ...prev,
      [marketplaceId]: { ...prev[marketplaceId], showManualBrowser: false },
    }));
  };

  // Search categories in Hepsiburada
  const searchHepsiburadaCategories = useCallback(async (query: string) => {
    const response = await fetch(`/api/v1/hepsiburada/categories?search=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    const data = await response.json();
    return data.results || [];
  }, []);

  // Search categories in Temu
  const searchTemuCategories = useCallback(async (query: string) => {
    const response = await fetch(`/api/v1/temu/categories?search=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    const data = await response.json();
    return data.results || [];
  }, []);

  const handleDropdownChange = (marketplaceId: MarketplaceId, categoryId: number) => {
    const state = marketplaceStates[marketplaceId];
    const match = state.matches.find(m => 
      (m.category.categoryId || m.category.id) === categoryId
    );
    if (match) {
      handleCategoryChange(marketplaceId, match);
    }
  };

  const canProceed = selectedMarketplaces.every(marketplaceId => {
    if (!MARKETPLACE_CONFIG[marketplaceId]) return true;
    const state = marketplaceStates[marketplaceId];
    return state.selectedCategoryId !== null && !state.isLoading;
  });

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">✓ Yüksek</span>;
      case 'medium':
        return <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">Orta</span>;
      case 'low':
        return <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">Düşük</span>;
      default:
        return null;
    }
  };

  const renderMarketplaceSection = (marketplaceId: MarketplaceId) => {
    const config = MARKETPLACE_CONFIG[marketplaceId];
    if (!config) return null;

    const state = marketplaceStates[marketplaceId];
    const selectedMatch = state.matches.find(m => 
      (m.category.categoryId || m.category.id) === state.selectedCategoryId
    );
    const isHepsiburada = marketplaceId === 'hepsiburada';
    const isTemu = marketplaceId === 'temu';
    const hasManualBrowser = isHepsiburada || isTemu;

    return (
      <div 
        key={marketplaceId}
        className={`p-5 rounded-xl border-2 ${config.bgColor} ${config.borderColor}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{config.logo}</span>
          <h3 className="font-semibold text-gray-900">{config.name}</h3>
          {state.selectedCategoryId && (
            <span className="ml-auto text-green-600 flex items-center gap-1 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Seçildi
            </span>
          )}
        </div>

        {/* Loading State */}
        {state.isLoading && (
          <div className="flex items-center gap-3 py-4 text-gray-600">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span>Kategoriler eşleştiriliyor...</span>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-red-700">{state.error}</p>
            </div>
            <button
              onClick={() => fetchCategories(marketplaceId)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {/* Category Dropdown */}
        {!state.isLoading && !state.error && state.matches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Kategori Seçin
              </label>
              {hasManualBrowser && (
                <button
                  onClick={() => toggleManualBrowser(marketplaceId)}
                  className={`text-sm ${isTemu ? 'text-orange-600 hover:text-orange-700' : 'text-amber-600 hover:text-amber-700'} font-medium flex items-center gap-1`}
                >
                  {state.showManualBrowser ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Kapat
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Manuel Seç
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Manual Browser (Hepsiburada) */}
            {isHepsiburada && state.showManualBrowser && (
              <div className="mb-4">
                <HepsiburadaCategoryBrowser
                  categoryTree={state.categoryTree}
                  onSelect={(cat) => handleManualCategorySelect(marketplaceId, cat)}
                  onSearch={searchHepsiburadaCategories}
                  selectedCategoryId={state.selectedCategoryId}
                  isLoading={state.isTreeLoading}
                  marketplaceName={config.name}
                />
              </div>
            )}

            {/* Manual Browser (Temu) */}
            {isTemu && state.showManualBrowser && (
              <div className="mb-4">
                <TemuCategoryBrowser
                  categoryTree={state.temuCategoryTree}
                  onSelect={(cat) => handleManualCategorySelect(marketplaceId, cat)}
                  onSearch={searchTemuCategories}
                  selectedCategoryId={state.selectedCategoryId}
                  isLoading={state.isTreeLoading}
                  marketplaceName={config.name}
                />
              </div>
            )}

            {/* Dropdown (hidden when manual browser is open) */}
            {!state.showManualBrowser && (
              <select
                value={state.selectedCategoryId || ''}
                onChange={(e) => handleDropdownChange(marketplaceId, Number(e.target.value))}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              >
                <option value="" disabled>Kategori seçin...</option>
                {state.matches.map((match, index) => {
                  const categoryId = match.category.categoryId || match.category.id;
                  const categoryName = match.category.displayName || match.category.name;
                  return (
                    <option key={categoryId} value={categoryId}>
                      {index === 0 ? '⭐ ' : ''}{categoryName} ({match.score} puan)
                    </option>
                  );
                })}
              </select>
            )}

            {/* Selected Category Details */}
            {(selectedMatch || state.selectedCategoryName) && !state.showManualBrowser && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mt-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedMatch?.category.displayName || selectedMatch?.category.name || state.selectedCategoryName}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedMatch?.pathString || state.selectedCategoryPath}
                    </p>
                  </div>
                  {selectedMatch && getConfidenceBadge(selectedMatch.confidence)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Matches - Show manual browser option for Hepsiburada and Temu */}
        {!state.isLoading && !state.error && state.matches.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <p className="font-medium">Uygun kategori bulunamadı</p>
            <p className="text-sm mt-1">Ürün başlığını kontrol edin veya manuel seçin</p>
            <div className="flex gap-2 justify-center mt-3">
              <button
                onClick={() => fetchCategories(marketplaceId)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Tekrar Dene
              </button>
              {hasManualBrowser && (
                <button
                  onClick={() => toggleManualBrowser(marketplaceId)}
                  className={`px-4 py-2 ${isTemu ? 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200' : 'bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200'} border rounded-lg text-sm transition`}
                >
                  Manuel Seç
                </button>
              )}
            </div>
            
            {/* Show manual browser here too (Hepsiburada) */}
            {isHepsiburada && state.showManualBrowser && (
              <div className="mt-4 text-left">
                <HepsiburadaCategoryBrowser
                  categoryTree={state.categoryTree}
                  onSelect={(cat) => handleManualCategorySelect(marketplaceId, cat)}
                  onSearch={searchHepsiburadaCategories}
                  selectedCategoryId={state.selectedCategoryId}
                  isLoading={state.isTreeLoading}
                  marketplaceName={config.name}
                />
              </div>
            )}

            {/* Show manual browser here too (Temu) */}
            {isTemu && state.showManualBrowser && (
              <div className="mt-4 text-left">
                <TemuCategoryBrowser
                  categoryTree={state.temuCategoryTree}
                  onSelect={(cat) => handleManualCategorySelect(marketplaceId, cat)}
                  onSearch={searchTemuCategories}
                  selectedCategoryId={state.selectedCategoryId}
                  isLoading={state.isTreeLoading}
                  marketplaceName={config.name}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🏷️</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              Kategori Seçimi
            </h3>
            <p className="text-sm text-gray-600">
              Ürün bilgilerinize göre en uygun kategorileri eşleştirdik. 
              Her pazaryeri için doğru kategoriyi seçin veya değiştirin.
            </p>
          </div>
        </div>
      </div>

      {/* Product Info Summary */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">Ürün:</span>{' '}
          {formData.title || 'Başlık girilmedi'}
        </p>
      </div>

      {/* Marketplace Sections */}
      <div className="space-y-4">
        {selectedMarketplaces.map(marketplaceId => 
          renderMarketplaceSection(marketplaceId)
        )}
      </div>

      {/* No Marketplaces Selected */}
      {selectedMarketplaces.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Pazaryeri seçilmedi. Lütfen geri dönüp pazaryeri seçin.</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4 pt-6">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          ← Geri
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Devam Et →
        </button>
      </div>
    </div>
  );
}
