/**
 * Hepsiburada Cache Service
 * Centralized caching for categories, attributes with prefetching support
 * 
 * NOTE: Categories and attributes are fetched from PRODUCTION URL
 * because the test environment has incomplete/empty data.
 */

import { hepsiburadaClient } from './client';
import type { 
  HepsiburadaCategory, 
  HepsiburadaCategoryAttribute 
} from './types';

// Cache TTL constants
const CATEGORY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour for categories
const ATTRIBUTE_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes for attributes

/**
 * Category tree node for hierarchical display
 */
export interface CategoryTreeNode {
  categoryId: number;
  name: string;
  displayName: string;
  path: string[];
  pathString: string;
  leaf: boolean;
  available: boolean;
  children: CategoryTreeNode[];
}

/**
 * Cache state interface
 */
interface CacheState {
  categories: {
    data: HepsiburadaCategory[];
    timestamp: number;
    loading: boolean;
    error: Error | null;
  };
  categoryTree: {
    data: CategoryTreeNode[];
    timestamp: number;
  };
  attributes: Map<number, {
    data: HepsiburadaCategoryAttribute[];
    timestamp: number;
    loading: boolean;
    error: Error | null;
  }>;
}

/**
 * Singleton cache instance
 */
class HepsiburadaCache {
  private state: CacheState = {
    categories: {
      data: [],
      timestamp: 0,
      loading: false,
      error: null,
    },
    categoryTree: {
      data: [],
      timestamp: 0,
    },
    attributes: new Map(),
  };

  // Event listeners for cache updates
  private listeners: Map<string, Set<() => void>> = new Map();

  /**
   * Subscribe to cache updates
   */
  subscribe(event: 'categories' | 'attributes', callback: () => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Notify listeners of cache update
   */
  private notify(event: 'categories' | 'attributes') {
    this.listeners.get(event)?.forEach(callback => callback());
  }

  /**
   * Check if categories cache is valid
   */
  isCategoriesCacheValid(): boolean {
    const { data, timestamp } = this.state.categories;
    return data.length > 0 && (Date.now() - timestamp) < CATEGORY_CACHE_TTL_MS;
  }

  /**
   * Check if attributes cache is valid for a category
   */
  isAttributesCacheValid(categoryId: number): boolean {
    const cached = this.state.attributes.get(categoryId);
    if (!cached) return false;
    return cached.data.length > 0 && (Date.now() - cached.timestamp) < ATTRIBUTE_CACHE_TTL_MS;
  }

  /**
   * Get cached categories (returns empty array if not cached)
   */
  getCachedCategories(): HepsiburadaCategory[] {
    return this.state.categories.data;
  }

  /**
   * Get cached category tree
   */
  getCachedCategoryTree(): CategoryTreeNode[] {
    return this.state.categoryTree.data;
  }

  /**
   * Get cached attributes for a category
   */
  getCachedAttributes(categoryId: number): HepsiburadaCategoryAttribute[] | null {
    const cached = this.state.attributes.get(categoryId);
    if (!cached || !this.isAttributesCacheValid(categoryId)) return null;
    return cached.data;
  }

  /**
   * Check if categories are currently loading
   */
  isCategoriesLoading(): boolean {
    return this.state.categories.loading;
  }

  /**
   * Check if attributes are loading for a category
   */
  isAttributesLoading(categoryId: number): boolean {
    return this.state.attributes.get(categoryId)?.loading || false;
  }

  /**
   * Prefetch all categories (call this when form loads)
   * Returns immediately if already cached or loading
   */
  async prefetchCategories(): Promise<HepsiburadaCategory[]> {
    // Return cached if valid
    if (this.isCategoriesCacheValid()) {
      console.log(`📦 [Hepsiburada Cache] Using cached categories (${this.state.categories.data.length})`);
      return this.state.categories.data;
    }

    // Return if already loading (wait for it)
    if (this.state.categories.loading) {
      console.log('📦 [Hepsiburada Cache] Categories already loading, waiting...');
      return new Promise((resolve) => {
        const unsubscribe = this.subscribe('categories', () => {
          unsubscribe();
          resolve(this.state.categories.data);
        });
      });
    }

    // Start loading
    this.state.categories.loading = true;
    this.state.categories.error = null;

    try {
      console.log('📦 [Hepsiburada Cache] Fetching ALL categories from API...');
      
      let allCategories: HepsiburadaCategory[] = [];
      let page = 0;
      let isLast = false;

      while (!isLast) {
        const response = await hepsiburadaClient.getCategories(page, 1000, true, true);
        const data = response.data || [];
        allCategories = allCategories.concat(data);
        isLast = response.last || data.length === 0;
        console.log(`  Page ${page}: ${data.length} categories (Total: ${allCategories.length})`);
        page++;
      }

      // Update cache
      this.state.categories = {
        data: allCategories,
        timestamp: Date.now(),
        loading: false,
        error: null,
      };

      // Build category tree
      this.buildCategoryTree(allCategories);

      console.log(`✅ [Hepsiburada Cache] Cached ${allCategories.length} categories`);
      this.notify('categories');
      
      return allCategories;
    } catch (error) {
      this.state.categories.loading = false;
      this.state.categories.error = error instanceof Error ? error : new Error(String(error));
      console.error('❌ [Hepsiburada Cache] Failed to fetch categories:', error);
      throw error;
    }
  }

  /**
   * Build category tree from flat list
   */
  private buildCategoryTree(categories: HepsiburadaCategory[]): void {
    // Group categories by their path depth and parent path
    const pathMap = new Map<string, CategoryTreeNode>();
    const rootNodes: CategoryTreeNode[] = [];

    // First, create all nodes
    for (const cat of categories) {
      const path = cat.paths || [cat.name];
      const pathString = path.join(' > ');
      
      const node: CategoryTreeNode = {
        categoryId: cat.categoryId,
        name: cat.name,
        displayName: cat.displayName || cat.name,
        path,
        pathString,
        leaf: cat.leaf,
        available: cat.available,
        children: [],
      };

      pathMap.set(pathString, node);
    }

    // Build tree structure based on paths
    // Group by top-level category
    const topLevelGroups = new Map<string, CategoryTreeNode[]>();
    
    for (const [, node] of pathMap) {
      const topLevel = node.path[0];
      if (!topLevelGroups.has(topLevel)) {
        topLevelGroups.set(topLevel, []);
      }
      topLevelGroups.get(topLevel)!.push(node);
    }

    // Create tree nodes for each top-level category
    for (const [topLevel, nodes] of topLevelGroups) {
      const topNode: CategoryTreeNode = {
        categoryId: 0, // Virtual node
        name: topLevel,
        displayName: topLevel,
        path: [topLevel],
        pathString: topLevel,
        leaf: false,
        available: true,
        children: [],
      };

      // Group by second level
      const secondLevelGroups = new Map<string, CategoryTreeNode[]>();
      
      for (const node of nodes) {
        if (node.path.length >= 2) {
          const secondLevel = node.path[1];
          const key = `${topLevel} > ${secondLevel}`;
          if (!secondLevelGroups.has(key)) {
            secondLevelGroups.set(key, []);
          }
          secondLevelGroups.get(key)!.push(node);
        }
      }

      // Create second-level nodes
      for (const [key, secondNodes] of secondLevelGroups) {
        const secondLevel = key.split(' > ')[1];
        const secondNode: CategoryTreeNode = {
          categoryId: 0,
          name: secondLevel,
          displayName: secondLevel,
          path: [topLevel, secondLevel],
          pathString: key,
          leaf: false,
          available: true,
          children: secondNodes.filter(n => n.leaf), // Only leaf nodes as children
        };

        if (secondNode.children.length > 0) {
          topNode.children.push(secondNode);
        }
      }

      if (topNode.children.length > 0) {
        rootNodes.push(topNode);
      }
    }

    // Sort alphabetically
    rootNodes.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    rootNodes.forEach(node => {
      node.children.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      node.children.forEach(child => {
        child.children.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      });
    });

    this.state.categoryTree = {
      data: rootNodes,
      timestamp: Date.now(),
    };

    console.log(`📦 [Hepsiburada Cache] Built category tree with ${rootNodes.length} top-level categories`);
  }

  /**
   * Prefetch attributes for a category (call this when category is selected)
   */
  async prefetchAttributes(categoryId: number): Promise<HepsiburadaCategoryAttribute[]> {
    // Return cached if valid
    if (this.isAttributesCacheValid(categoryId)) {
      console.log(`📦 [Hepsiburada Cache] Using cached attributes for category ${categoryId}`);
      return this.state.attributes.get(categoryId)!.data;
    }

    // Return if already loading (wait for it)
    const existing = this.state.attributes.get(categoryId);
    if (existing?.loading) {
      console.log(`📦 [Hepsiburada Cache] Attributes already loading for ${categoryId}, waiting...`);
      return new Promise((resolve) => {
        const unsubscribe = this.subscribe('attributes', () => {
          const cached = this.state.attributes.get(categoryId);
          if (cached && !cached.loading) {
            unsubscribe();
            resolve(cached.data);
          }
        });
      });
    }

    // Start loading
    this.state.attributes.set(categoryId, {
      data: [],
      timestamp: 0,
      loading: true,
      error: null,
    });

    try {
      console.log(`📦 [Hepsiburada Cache] Fetching attributes for category ${categoryId}...`);
      
      const response = await hepsiburadaClient.getCategoryAttributes(categoryId);
      
      // API returns { baseAttributes: [], attributes: [] }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = response.data as any;
      
      console.log(`📦 [Hepsiburada Cache] Raw API response for category ${categoryId}:`, {
        hasBaseAttributes: !!data?.baseAttributes,
        baseAttributeCount: data?.baseAttributes?.length || 0,
        hasAttributes: !!data?.attributes,
        attributeCount: data?.attributes?.length || 0,
        baseAttributeIds: data?.baseAttributes?.map((a: HepsiburadaCategoryAttribute) => a.id) || [],
        attributeIds: data?.attributes?.map((a: HepsiburadaCategoryAttribute) => a.id) || [],
      });
      
      // Combine baseAttributes and attributes, filter out non-product attributes
      // Base attributes like merchantSku, Barcode, Images are handled separately
      const productBaseAttrs = ['Marka', 'GarantiSuresi', 'tax_vat_rate', 'kg'];
      const baseAttrs = (data?.baseAttributes || []).filter(
        (attr: HepsiburadaCategoryAttribute) => productBaseAttrs.includes(attr.id)
      );
      const categoryAttrs = data?.attributes || [];
      
      // Combine and deduplicate
      const allAttributes: HepsiburadaCategoryAttribute[] = [...baseAttrs, ...categoryAttrs];
      
      // Fetch values for enum type attributes
      const processedAttrs = await Promise.all(
        allAttributes.map(async (attr) => {
          const processedAttr: HepsiburadaCategoryAttribute = {
            ...attr,
            displayName: attr.name || attr.displayName || attr.id,
          };
          
          // Fetch values for enum types
          if (attr.type === 'enum') {
            try {
              const values = await hepsiburadaClient.getAttributeValues(categoryId, attr.id);
              
              // If we got valid values, set them and use list type
              if (values && values.length > 0) {
                processedAttr.values = values.map(v => ({
                  id: v.id,
                  name: v.value,
                }));
                // Convert type for UI compatibility
                processedAttr.type = attr.multiValue ? 'multiList' as const : 'list' as const;
              } else {
                // No values available - convert to text input
                console.log(`⚠️ [Hepsiburada Cache] Attribute ${attr.id} has no values, converting to text input`);
                processedAttr.type = 'text' as const;
                processedAttr.values = [];
              }
            } catch (err) {
              // Failed to fetch values - convert to text input
              console.warn(`⚠️ Could not fetch values for attribute ${attr.id}, converting to text:`, err);
              processedAttr.type = 'text' as const;
              processedAttr.values = [];
            }
          }
          
          return processedAttr;
        })
      );

      this.state.attributes.set(categoryId, {
        data: processedAttrs,
        timestamp: Date.now(),
        loading: false,
        error: null,
      });

      console.log(`✅ [Hepsiburada Cache] Cached ${processedAttrs.length} attributes for category ${categoryId}`);
      this.notify('attributes');
      
      return processedAttrs;
    } catch (error) {
      this.state.attributes.set(categoryId, {
        data: [],
        timestamp: 0,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      console.error(`❌ [Hepsiburada Cache] Failed to fetch attributes for ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Search categories by keyword
   */
  searchCategories(query: string, limit: number = 50): HepsiburadaCategory[] {
    if (!this.isCategoriesCacheValid()) {
      return [];
    }

    const queryLower = query.toLowerCase().trim();
    if (!queryLower) return [];

    // Normalize Turkish characters
    const normalize = (text: string) => {
      return text
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
    };

    const queryNorm = normalize(queryLower);

    // Score and filter categories
    const scored = this.state.categories.data
      .filter(cat => cat.leaf && cat.available)
      .map(cat => {
        const nameNorm = normalize(cat.displayName || cat.name);
        const pathNorm = normalize((cat.paths || []).join(' '));
        
        let score = 0;
        if (nameNorm.includes(queryNorm)) score += 50;
        if (pathNorm.includes(queryNorm)) score += 25;
        
        // Bonus for exact word match
        const words = queryNorm.split(/\s+/);
        for (const word of words) {
          if (nameNorm.split(/\s+/).includes(word)) score += 20;
        }

        return { category: cat, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(item => item.category);
  }

  /**
   * Get category by ID
   */
  getCategoryById(categoryId: number): HepsiburadaCategory | null {
    return this.state.categories.data.find(cat => cat.categoryId === categoryId) || null;
  }

  /**
   * Clear all cache (for testing or forced refresh)
   */
  clearCache(): void {
    this.state = {
      categories: { data: [], timestamp: 0, loading: false, error: null },
      categoryTree: { data: [], timestamp: 0 },
      attributes: new Map(),
    };
    console.log('🗑️ [Hepsiburada Cache] Cache cleared');
  }

  /**
   * Get cache status for debugging
   */
  getStatus(): {
    categoriesCount: number;
    categoriesCached: boolean;
    categoriesLoading: boolean;
    treeNodesCount: number;
    attributesCachedFor: number[];
  } {
    return {
      categoriesCount: this.state.categories.data.length,
      categoriesCached: this.isCategoriesCacheValid(),
      categoriesLoading: this.state.categories.loading,
      treeNodesCount: this.state.categoryTree.data.length,
      attributesCachedFor: Array.from(this.state.attributes.keys()).filter(
        id => this.isAttributesCacheValid(id)
      ),
    };
  }
}

// Export singleton instance
export const hepsiburadaCache = new HepsiburadaCache();

// Export prefetch functions for convenience
export const prefetchHepsiburadaCategories = () => hepsiburadaCache.prefetchCategories();
export const prefetchHepsiburadaAttributes = (categoryId: number) => hepsiburadaCache.prefetchAttributes(categoryId);
