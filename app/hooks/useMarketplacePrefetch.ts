'use client';

import { useEffect, useRef } from 'react';

/**
 * Prefetch Hepsiburada categories when the form loads
 * This reduces visible loading time by warming the cache early
 */
export function useHepsiburadaPrefetch(enabled: boolean = true) {
  const prefetchedRef = useRef(false);

  useEffect(() => {
    if (!enabled || prefetchedRef.current) return;

    const prefetch = async () => {
      try {
        console.log('🚀 [Prefetch] Starting Hepsiburada category prefetch...');
        const response = await fetch('/api/v1/hepsiburada/categories', {
          method: 'POST', // POST triggers prefetch
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ [Prefetch] Hepsiburada categories cached: ${data.count} categories in ${data.durationMs}ms`);
        }
        
        prefetchedRef.current = true;
      } catch (error) {
        console.error('❌ [Prefetch] Failed to prefetch Hepsiburada categories:', error);
      }
    };

    // Start prefetch after a short delay to not block initial render
    const timer = setTimeout(prefetch, 100);
    return () => clearTimeout(timer);
  }, [enabled]);
}

/**
 * Prefetch Hepsiburada attributes for a category
 * Call this when a category is selected
 */
export async function prefetchHepsiburadaAttributes(categoryId: number): Promise<void> {
  try {
    console.log(`🚀 [Prefetch] Fetching attributes for category ${categoryId}...`);
    const response = await fetch(`/api/v1/hepsiburada/categories/${categoryId}/attributes`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ [Prefetch] Cached ${data.count} attributes for category ${categoryId}`);
    }
  } catch (error) {
    console.error(`❌ [Prefetch] Failed to prefetch attributes for category ${categoryId}:`, error);
  }
}

/**
 * Combined prefetch hook for all marketplaces
 * Prefetches data for enabled marketplaces
 */
export function useMarketplacePrefetch(marketplaces: string[]) {
  const prefetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const prefetchForMarketplace = async (marketplace: string) => {
      if (prefetchedRef.current.has(marketplace)) return;
      prefetchedRef.current.add(marketplace);

      switch (marketplace) {
        case 'hepsiburada':
          try {
            console.log('🚀 [Prefetch] Starting Hepsiburada prefetch...');
            const response = await fetch('/api/v1/hepsiburada/categories', { method: 'POST' });
            if (response.ok) {
              const data = await response.json();
              console.log(`✅ [Prefetch] Hepsiburada: ${data.count} categories cached`);
            }
          } catch (error) {
            console.error('❌ [Prefetch] Hepsiburada failed:', error);
          }
          break;

        case 'trendyol':
          // Trendyol prefetch can be added here if needed
          console.log('🚀 [Prefetch] Trendyol prefetch (placeholder)');
          break;

        // Add other marketplaces as needed
      }
    };

    // Prefetch for each selected marketplace
    marketplaces.forEach(prefetchForMarketplace);
  }, [marketplaces]);
}
