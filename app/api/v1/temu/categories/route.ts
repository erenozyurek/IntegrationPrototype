import { NextResponse } from 'next/server';
import { temuCache } from '@/lib/integrations/temu/cache';

/**
 * GET /api/v1/temu/categories
 * Get category tree and search categories
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search');
    const action = url.searchParams.get('action');

    // Prefetch categories to ensure cache is populated
    await temuCache.prefetchCategories();

    // Search mode
    if (search) {
      const results = temuCache.searchCategories(search, 30);
      return NextResponse.json({
        success: true,
        results: results.map(cat => ({
          catId: cat.catId,
          catName: cat.catName,
          displayName: cat.catName,
          pathString: cat.pathString || cat.path?.join(' > ') || cat.catName,
          path: cat.path,
          leaf: cat.leaf,
        })),
        count: results.length,
      });
    }

    // Get category tree
    if (action === 'tree') {
      const tree = temuCache.getCachedCategoryTree();
      console.log(`📦 [Temu Categories API] Returning tree with ${tree.length} root nodes`);
      return NextResponse.json({
        success: true,
        tree,
        count: tree.length,
      });
    }

    // Get all categories (flat list)
    if (action === 'all') {
      const categories = temuCache.getLeafCategories();
      return NextResponse.json({
        success: true,
        categories: categories.slice(0, 100), // Limit for performance
        totalCount: categories.length,
      });
    }

    // Default: return cache status and tree
    const tree = temuCache.getCachedCategoryTree();
    const categories = temuCache.getCachedCategories();
    
    return NextResponse.json({
      success: true,
      status: {
        categoriesCount: categories.length,
        treeCount: tree.length,
        isCacheValid: temuCache.isCategoriesCacheValid(),
      },
      tree,
    });
  } catch (error: unknown) {
    console.error('Temu categories API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kategori işlemi başarısız' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/temu/categories
 * Prefetch categories (can be called early to warm cache)
 */
export async function POST() {
  try {
    const startTime = Date.now();
    const categories = await temuCache.prefetchCategories();
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Categories prefetched successfully',
      count: categories.length,
      durationMs: duration,
      cached: duration < 100, // If very fast, it was cached
    });
  } catch (error: unknown) {
    console.error('Temu categories prefetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kategori önbellekleme başarısız' },
      { status: 500 }
    );
  }
}
