import { NextResponse } from 'next/server';
import { hepsiburadaCache } from '@/lib/integrations/hepsiburada/cache';

/**
 * GET /api/v1/hepsiburada/categories
 * Get category tree and search categories
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search');
    const action = url.searchParams.get('action');

    // Prefetch categories to ensure cache is populated
    await hepsiburadaCache.prefetchCategories();

    // Search mode
    if (search) {
      const results = hepsiburadaCache.searchCategories(search, 30);
      return NextResponse.json({
        success: true,
        results: results.map(cat => ({
          categoryId: cat.categoryId,
          name: cat.name,
          displayName: cat.displayName,
          pathString: (cat.paths || [cat.name]).join(' > '),
          paths: cat.paths,
          leaf: cat.leaf,
        })),
        count: results.length,
      });
    }

    // Get category tree
    if (action === 'tree') {
      const tree = hepsiburadaCache.getCachedCategoryTree();
      return NextResponse.json({
        success: true,
        tree,
        count: tree.length,
      });
    }

    // Get all categories (flat list)
    if (action === 'all') {
      const categories = hepsiburadaCache.getCachedCategories();
      return NextResponse.json({
        success: true,
        categories: categories.slice(0, 100), // Limit for performance
        totalCount: categories.length,
      });
    }

    // Default: return cache status and tree
    const status = hepsiburadaCache.getStatus();
    const tree = hepsiburadaCache.getCachedCategoryTree();
    
    return NextResponse.json({
      success: true,
      status,
      tree,
    });
  } catch (error: unknown) {
    console.error('Hepsiburada categories API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kategori işlemi başarısız' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/hepsiburada/categories
 * Prefetch categories (can be called early to warm cache)
 */
export async function POST() {
  try {
    const startTime = Date.now();
    const categories = await hepsiburadaCache.prefetchCategories();
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Categories prefetched successfully',
      count: categories.length,
      durationMs: duration,
      cached: duration < 100, // If very fast, it was cached
    });
  } catch (error: unknown) {
    console.error('Hepsiburada categories prefetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kategori önbellekleme başarısız' },
      { status: 500 }
    );
  }
}
