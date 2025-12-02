import { NextResponse } from 'next/server';
import { matchTemuCategory } from '@/lib/integrations/temu/categoryMatcher';

// Match result format expected by CategorySelectionStepMulti
interface CategoryMatchResult {
  category: {
    categoryId: number;
    id: number;
    name: string;
    displayName: string;
    leaf: boolean;
    catType?: number;
  };
  pathString: string;
  score: number;
  confidence: string;
  matchedKeywords: string[];
}

// Cache structure
interface MatchCacheEntry {
  matches: CategoryMatchResult[];
  timestamp: number;
}

// Server-side cache for match results
const matchCache = new Map<string, MatchCacheEntry>();

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getCacheKey(title: string, description: string, topN: number): string {
  const normalizedTitle = (title || '').trim().toLowerCase();
  const normalizedDesc = (description || '').trim().toLowerCase().substring(0, 200);
  return `${normalizedTitle}:${normalizedDesc}:${topN}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, topN = 5 } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Ürün başlığı gereklidir' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = getCacheKey(title, description, topN);
    const cached = matchCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
      console.log(`📦 [Temu Match] Using cached matches`);
      return NextResponse.json({ 
        success: true, 
        matches: cached.matches,
        count: cached.matches.length,
        cached: true,
      });
    }

    // Compute matches
    console.log(`🔄 [Temu Match] Computing matches for: ${title.substring(0, 50)}...`);
    const matchResults = await matchTemuCategory(title, description, topN);

    // Transform to format expected by CategorySelectionStepMulti
    // The component expects: { category: { categoryId, name, ... }, pathString, score, ... }
    const matches = matchResults.map(result => ({
      category: {
        categoryId: result.category.catId,
        id: result.category.catId,
        name: result.category.catName,
        displayName: result.category.catName,
        leaf: result.category.leaf,
        catType: result.category.catType,
      },
      pathString: result.category.pathString || result.category.path?.join(' > ') || result.category.catName,
      score: result.score,
      confidence: result.confidence,
      matchedKeywords: result.matchedKeywords,
    }));

    // Cache results
    matchCache.set(cacheKey, {
      matches,
      timestamp: Date.now(),
    });
    
    // Clean old entries (keep cache size manageable)
    if (matchCache.size > 100) {
      const entries = Array.from(matchCache.entries());
      const now = Date.now();
      entries.forEach(([key, value]) => {
        if (now - value.timestamp > CACHE_TTL_MS) {
          matchCache.delete(key);
        }
      });
    }

    return NextResponse.json({
      success: true,
      matches,
      count: matches.length,
      cached: false,
    });
  } catch (error: unknown) {
    console.error('Temu category match error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kategori eşleştirme başarısız' },
      { status: 500 }
    );
  }
}
