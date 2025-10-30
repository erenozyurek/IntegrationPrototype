import { NextResponse } from 'next/server';
import { getCategoryAttributes } from '@/lib/trendyolCache';

export async function GET(req: Request, { params }: { params: { categoryId: string } }) {
  try {
    const { categoryId } = params;
    
    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const attributes = await getCategoryAttributes(categoryId);
    return NextResponse.json(attributes);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
