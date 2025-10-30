import { NextResponse } from 'next/server';
import mapCategory from '@/lib/mapCategory';
import { getCategoryAttributes } from '@/lib/trendyolCache';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { aseraiCategoryId, marketplaceCategoryId, marketplaceCategoryName, marketplaceCategoryPath } = body;

    if (!aseraiCategoryId || !marketplaceCategoryId || !marketplaceCategoryName || !marketplaceCategoryPath) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch category attributes from Trendyol
    let attributes = null;
    try {
      attributes = await getCategoryAttributes(marketplaceCategoryId);
    } catch (err) {
      console.error('Failed to fetch Trendyol attributes:', err);
      // Continue even if attributes fetch fails
    }

    await mapCategory({
      aseraiCategoryId,
      marketplace: 'TRENDYOL',
      marketplaceCategoryId,
      marketplaceCategoryName,
      marketplaceCategoryPath,
      attributes,
    });

    return NextResponse.json({ success: true, attributes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
