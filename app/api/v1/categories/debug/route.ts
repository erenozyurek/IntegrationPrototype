import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // 1. Tüm kategorileri getir
    const { data: allCategories, error: allError } = await supabase
      .from('categories')
      .select('*')
      .order('path');

    if (allError) {
      console.error('All categories error:', allError);
    }

    // 2. Level 0 kategorileri getir (Ana kategoriler)
    const { data: rootCategories, error: rootError } = await supabase
      .from('categories')
      .select('id, name, slug, level')
      .eq('level', 0)
      .order('sort_order');

    if (rootError) {
      console.error('Root categories error:', rootError);
    }

    // 3. Kategorileri hiyerarşik yapıya çevir
    const buildTree = (items: any[]) => {
      const map = new Map();
      const roots: any[] = [];

      items.forEach(item => {
        map.set(item.id, { ...item, children: [] });
      });

      items.forEach(item => {
        const node = map.get(item.id);
        if (item.parent_id === null) {
          roots.push(node);
        } else {
          const parent = map.get(item.parent_id);
          if (parent) {
            parent.children.push(node);
          }
        }
      });

      return roots;
    };

    const tree = allCategories ? buildTree(allCategories) : [];

    return NextResponse.json({
      success: true,
      stats: {
        total: allCategories?.length || 0,
        rootLevel: rootCategories?.length || 0,
      },
      allCategories: allCategories || [],
      rootCategories: rootCategories || [],
      tree,
    });

  } catch (error: any) {
    console.error('Category debug error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}
