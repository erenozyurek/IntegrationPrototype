import { NextResponse } from 'next/server';
import { matchCategories } from '@/lib/integrations/trendyol/categoryMatcher';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, topN = 5 } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Product title is required' },
        { status: 400 }
      );
    }

    const matches = await matchCategories(title, description, topN);

    return NextResponse.json({ 
      success: true, 
      matches,
      count: matches.length 
    });
  } catch (error: unknown) {
    console.error('Category matching API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to match categories' },
      { status: 500 }
    );
  }
}
