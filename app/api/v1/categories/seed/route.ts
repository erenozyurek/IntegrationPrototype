import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST() {
  try {
    // Kategori seed data
    const categories = [
      {
        name: 'Elektronik',
        slug: 'elektronik',
        parent_id: null,
        level: 0,
        path: '1',
        sort_order: 1,
        is_active: true,
      },
      {
        name: 'Giyim',
        slug: 'giyim',
        parent_id: null,
        level: 0,
        path: '2',
        sort_order: 2,
        is_active: true,
      },
    ];

    // Kategorileri ekle
    const { data, error } = await supabase
      .from('categories')
      .upsert(categories, { onConflict: 'slug' })
      .select();

    if (error) {
      console.error('Category seed error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Kategoriler başarıyla oluşturuldu',
      categories: data,
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
