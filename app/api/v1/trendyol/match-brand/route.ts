import { NextResponse } from 'next/server';
import { matchBrands, searchBrandByName } from '@/lib/integrations/trendyol/brandMatcher';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, searchQuery, topN = 5 } = body;

    // If searchQuery is provided, do a direct search
    if (searchQuery) {
      const brands = await searchBrandByName(searchQuery);
      return NextResponse.json({
        success: true,
        brands,
        count: brands.length,
      });
    }

    // Otherwise, match brands based on title
    if (!title) {
      return NextResponse.json(
        { error: 'Ürün başlığı gereklidir' },
        { status: 400 }
      );
    }

    const matches = await matchBrands(title, topN);

    return NextResponse.json({
      success: true,
      matches,
      count: matches.length,
    });
  } catch (error: unknown) {
    console.error('Brand matching API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Marka eşleştirme başarısız' },
      { status: 500 }
    );
  }
}
