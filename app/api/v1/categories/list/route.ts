import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name', { ascending: true });

    if (error) {
      console.error('Categories fetch error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      categories: categories || [],
    });

  } catch (error: any) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
