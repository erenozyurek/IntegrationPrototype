import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    // Dosya validasyonu
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Dosya boyutu 5MB\'dan büyük olamaz' },
        { status: 400 }
      );
    }

    // Dosya tipi kontrolü
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Desteklenmeyen dosya formatı. Sadece JPEG, PNG, WebP ve GIF kabul edilir.' },
        { status: 400 }
      );
    }

    // Benzersiz dosya adı oluştur
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    // Dosyayı buffer'a çevir
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Supabase Storage'a yükle
    const { data, error } = await supabaseAdmin.storage
      .from('product_images_test')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Public URL'i al
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('product_images_test')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      message: 'Dosya başarıyla yüklendi',
      url: publicUrl,
      path: filePath,
      fileName: fileName,
      fileSize: file.size,
      fileType: file.type
    });

  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Dosya yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Çoklu dosya yükleme için
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    const maxFiles = 10;
    if (files.length > maxFiles) {
      return NextResponse.json(
        { success: false, error: `En fazla ${maxFiles} dosya yüklenebilir` },
        { status: 400 }
      );
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        // Dosya validasyonu
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          errors.push({ fileName: file.name, error: 'Dosya boyutu 5MB\'dan büyük' });
          continue;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          errors.push({ fileName: file.name, error: 'Desteklenmeyen dosya formatı' });
          continue;
        }

        // Benzersiz dosya adı
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        // Dosyayı yükle
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data, error } = await supabaseAdmin.storage
          .from('product_images_test')
          .upload(filePath, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          errors.push({ fileName: file.name, error: error.message });
          continue;
        }

        // Public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('product_images_test')
          .getPublicUrl(filePath);

        uploadedFiles.push({
          originalName: file.name,
          fileName: fileName,
          url: publicUrl,
          path: filePath,
          size: file.size,
          type: file.type
        });

      } catch (err: any) {
        errors.push({ fileName: file.name, error: err.message });
      }
    }

    return NextResponse.json({
      success: uploadedFiles.length > 0,
      message: `${uploadedFiles.length} dosya başarıyla yüklendi`,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
      total: files.length,
      uploaded: uploadedFiles.length,
      failed: errors.length
    });

  } catch (error: any) {
    console.error('Multi-upload API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
