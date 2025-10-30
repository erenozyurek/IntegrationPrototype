import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Tüm kategorileri çek
    const { data: allCategories, error: allError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');

    if (allError) throw allError;

    // Sadece ana kategorileri çek (level = 0)
    const { data: rootCategories, error: rootError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('level', 0)
      .order('sort_order');

    if (rootError) throw rootError;

    return NextResponse.json({
      success: true,
      totalCategories: allCategories?.length || 0,
      rootCategories: rootCategories || [],
      allCategories: allCategories || [],
    });

  } catch (error: any) {
    console.error('Category test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: error 
      },
      { status: 500 }
    );
  }
}
