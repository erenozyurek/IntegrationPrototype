import { NextResponse } from 'next/server';
import { getChildren, isLeaf } from '@/lib/trendyolCache';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parentId = url.searchParams.get('parentId');

    const children = await getChildren(parentId);

    const mapped = children.map((c) => ({
      id: String(c.id),
      name: c.name,
      isLeaf: isLeaf(c),
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
