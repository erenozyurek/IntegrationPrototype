/**
 * Temu Cache Service
 * Centralized caching for categories, attributes with prefetching support
 * Same pattern as Hepsiburada cache
 */

import { temuClient } from './client';
import type { 
  TemuCategory, 
  TemuCategoryAttribute
} from './types';

// Cache TTL constants
const CATEGORY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour for categories
const ATTRIBUTE_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes for attributes

/**
 * Category tree node for hierarchical display
 */
export interface TemuCategoryTreeNode {
  catId: number;
  name: string;
  path: string[];
  pathString: string;
  leaf: boolean;
  children: TemuCategoryTreeNode[];
}

/**
 * Cache state interface
 */
interface CacheState {
  categories: {
    data: TemuCategory[];
    timestamp: number;
    loading: boolean;
    error: Error | null;
  };
  categoryTree: {
    data: TemuCategoryTreeNode[];
    timestamp: number;
  };
  attributes: Map<number, {
    data: TemuCategoryAttribute[];
    timestamp: number;
    loading: boolean;
    error: Error | null;
  }>;
}

/**
 * Singleton cache instance
 */
class TemuCache {
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
  isAttributesCacheValid(catId: number): boolean {
    const cached = this.state.attributes.get(catId);
    if (!cached) return false;
    return cached.data.length > 0 && (Date.now() - cached.timestamp) < ATTRIBUTE_CACHE_TTL_MS;
  }

  /**
   * Get cached categories
   */
  getCachedCategories(): TemuCategory[] {
    return this.state.categories.data;
  }

  /**
   * Get cached category tree
   */
  getCachedCategoryTree(): TemuCategoryTreeNode[] {
    return this.state.categoryTree.data;
  }

  /**
   * Get cached attributes for a category
   */
  getCachedAttributes(catId: number): TemuCategoryAttribute[] | null {
    const cached = this.state.attributes.get(catId);
    if (!cached || !this.isAttributesCacheValid(catId)) return null;
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
  isAttributesLoading(catId: number): boolean {
    return this.state.attributes.get(catId)?.loading || false;
  }

  /**
   * Prefetch all categories
   */
  async prefetchCategories(): Promise<TemuCategory[]> {
    // Return cached if valid
    if (this.isCategoriesCacheValid()) {
      console.log(`📦 [Temu Cache] Using cached categories (${this.state.categories.data.length})`);
      return this.state.categories.data;
    }

    // Return if already loading
    if (this.state.categories.loading) {
      console.log('📦 [Temu Cache] Categories already loading, waiting...');
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
      console.log('📦 [Temu Cache] Fetching ALL categories from API...');
      
      const allCategories = await temuClient.getAllCategories();

      // Update cache
      this.state.categories = {
        data: allCategories,
        timestamp: Date.now(),
        loading: false,
        error: null,
      };

      // Build category tree
      this.buildCategoryTree(allCategories);

      console.log(`✅ [Temu Cache] Cached ${allCategories.length} categories`);
      this.notify('categories');
      
      return allCategories;
    } catch (error) {
      this.state.categories.loading = false;
      this.state.categories.error = error instanceof Error ? error : new Error(String(error));
      console.error('❌ [Temu Cache] Failed to fetch categories:', error);
      throw error;
    }
  }

  /**
   * Build category tree from flat list
   */
  private buildCategoryTree(categories: TemuCategory[]): void {
    const rootNodes: TemuCategoryTreeNode[] = [];
    const nodeMap = new Map<number, TemuCategoryTreeNode>();
    
    // First pass: create all nodes
    for (const cat of categories) {
      const node: TemuCategoryTreeNode = {
        catId: cat.catId,
        name: cat.catName,
        path: cat.path || [cat.catName],
        pathString: cat.pathString || cat.catName,
        leaf: cat.leaf,
        children: [],
      };
      nodeMap.set(cat.catId, node);
    }
    
    // Second pass: build tree structure
    // Temu uses parentId, but we may have also stored it as parentCatId for compatibility
    for (const cat of categories) {
      const node = nodeMap.get(cat.catId);
      if (!node) continue;
      
      const parentId = cat.parentId ?? cat.parentCatId ?? 0;
      
      if (parentId === 0) {
        rootNodes.push(node);
      } else {
        const parent = nodeMap.get(parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          // Parent not found - this might be a root node with non-zero parentId
          // Add to root to avoid orphaned nodes
          console.warn(`⚠️ [Temu Cache] Parent ${parentId} not found for category ${cat.catId} (${cat.catName}), adding to root`);
          rootNodes.push(node);
        }
      }
    }
    
    // Sort alphabetically
    const sortNodes = (nodes: TemuCategoryTreeNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      nodes.forEach(node => sortNodes(node.children));
    };
    sortNodes(rootNodes);

    this.state.categoryTree = {
      data: rootNodes,
      timestamp: Date.now(),
    };

    console.log(`📦 [Temu Cache] Built category tree with ${rootNodes.length} root categories`);
  }

  /**
   * Prefetch attributes for a category
   */
  async prefetchAttributes(catId: number): Promise<TemuCategoryAttribute[]> {
    // Return cached if valid
    if (this.isAttributesCacheValid(catId)) {
      console.log(`📦 [Temu Cache] Using cached attributes for category ${catId}`);
      return this.state.attributes.get(catId)!.data;
    }

    // Return if already loading
    const existing = this.state.attributes.get(catId);
    if (existing?.loading) {
      console.log(`📦 [Temu Cache] Attributes already loading for ${catId}, waiting...`);
      return new Promise((resolve) => {
        const unsubscribe = this.subscribe('attributes', () => {
          const cached = this.state.attributes.get(catId);
          if (cached && !cached.loading) {
            unsubscribe();
            resolve(cached.data);
          }
        });
      });
    }

    // Start loading
    this.state.attributes.set(catId, {
      data: [],
      timestamp: 0,
      loading: true,
      error: null,
    });

    try {
      console.log(`📦 [Temu Cache] Fetching attributes for category ${catId}...`);
      
      const response = await temuClient.getCategoryAttributes(catId);
      const attributes = response.result || [];

      console.log(`📦 [Temu Cache] Raw API response for category ${catId}:`, {
        attributeCount: attributes.length,
        attributeNames: attributes.map((a: TemuCategoryAttribute) => a.name),
      });

      this.state.attributes.set(catId, {
        data: attributes,
        timestamp: Date.now(),
        loading: false,
        error: null,
      });

      console.log(`✅ [Temu Cache] Cached ${attributes.length} attributes for category ${catId}`);
      this.notify('attributes');
      
      return attributes;
    } catch (error) {
      this.state.attributes.set(catId, {
        data: [],
        timestamp: 0,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      console.error(`❌ [Temu Cache] Failed to fetch attributes for ${catId}:`, error);
      throw error;
    }
  }

  /**
   * Search categories by keyword
   */
  searchCategories(query: string, limit: number = 50): TemuCategory[] {
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
      .filter(cat => cat.leaf)
      .map(cat => {
        const nameNorm = normalize(cat.catName);
        const pathNorm = normalize((cat.path || []).join(' '));
        
        let score = 0;
        if (nameNorm.includes(queryNorm)) score += 50;
        if (pathNorm.includes(queryNorm)) score += 25;
        
        // Bonus for exact word match
        const words = queryNorm.split(/\s+/);
        for (const word of words) {
          if (nameNorm.includes(word)) score += 10;
          if (pathNorm.includes(word)) score += 5;
        }
        
        return { category: cat, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.category);

    return scored;
  }

  /**
   * Get leaf categories only
   */
  getLeafCategories(): TemuCategory[] {
    return this.state.categories.data.filter(cat => cat.leaf);
  }

  /**
   * Find category by ID
   */
  findCategoryById(catId: number): TemuCategory | undefined {
    return this.state.categories.data.find(cat => cat.catId === catId);
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.state = {
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
    console.log('🗑️ [Temu Cache] All caches cleared');
  }
}

// Export the class for type reference
export { TemuCache };

// Export singleton instance
export const temuCache = new TemuCache();
