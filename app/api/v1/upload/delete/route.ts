import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, paths } = body;

    // Tek dosya silme
    if (path) {
      const { error } = await supabaseAdmin.storage
        .from('product_images_test')
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: 'Dosya başarıyla silindi',
        path
      });
    }

    // Çoklu dosya silme
    if (paths && Array.isArray(paths)) {
      const { error } = await supabaseAdmin.storage
        .from('product_images_test')
        .remove(paths);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: `${paths.length} dosya başarıyla silindi`,
        paths
      });
    }

    return NextResponse.json(
      { success: false, error: 'Path veya paths parametresi gerekli' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
