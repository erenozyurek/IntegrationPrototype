import { NextResponse } from 'next/server';
import { trendyolClient } from '@/lib/integrations/trendyol/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const attributes = await trendyolClient.getCategoryAttributes(Number(categoryId));

    return NextResponse.json({
      success: true,
      categoryId: Number(categoryId),
      attributes,
    });
  } catch (error: unknown) {
    console.error('Get category attributes API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch category attributes' },
      { status: 500 }
    );
  }
}
