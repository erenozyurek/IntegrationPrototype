import { NextResponse } from 'next/server';
import { matchHepsiburadaCategories } from '@/lib/integrations/hepsiburada/categoryMatcher';
import type { HepsiburadaCategoryMatch } from '@/lib/integrations/hepsiburada/types';

// Server-side cache for match results
// This avoids re-computing matches for the same title/description
const matchCache = new Map<string, {
  matches: HepsiburadaCategoryMatch[];
  timestamp: number;
}>();

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
      console.log(`📦 [Hepsiburada Match] Using cached matches`);
      return NextResponse.json({ 
        success: true, 
        matches: cached.matches,
        count: cached.matches.length,
        cached: true,
      });
    }

    // Compute matches
    console.log(`🔄 [Hepsiburada Match] Computing matches for: ${title.substring(0, 50)}...`);
    const matches = await matchHepsiburadaCategories(title, description, topN);

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
    console.error('Hepsiburada category matching API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kategori eşleştirme başarısız' },
      { status: 500 }
    );
  }
}
