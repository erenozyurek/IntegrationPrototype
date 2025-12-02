import { NextResponse } from 'next/server';
import { hepsiburadaCache } from '@/lib/integrations/hepsiburada/cache';

interface RouteParams {
  params: Promise<{ categoryId: string }>;
}

/**
 * GET /api/v1/hepsiburada/categories/[categoryId]/attributes
 * Get attributes for a specific category
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { categoryId } = await params;
    const categoryIdNum = parseInt(categoryId, 10);

    console.log(`🔍 [API] Hepsiburada attributes request for category: ${categoryId} (parsed: ${categoryIdNum})`);

    if (isNaN(categoryIdNum)) {
      return NextResponse.json(
        { error: 'Geçersiz kategori ID' },
        { status: 400 }
      );
    }

    // Fetch attributes (uses cache internally)
    const attributes = await hepsiburadaCache.prefetchAttributes(categoryIdNum);

    console.log(`✅ [API] Returning ${attributes.length} attributes for category ${categoryIdNum}`);

    return NextResponse.json({
      success: true,
      categoryId: categoryIdNum,
      attributes,
      count: attributes.length,
    });
  } catch (error: unknown) {
    console.error('Hepsiburada attributes API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Özellikler alınamadı' },
      { status: 500 }
    );
  }
}
