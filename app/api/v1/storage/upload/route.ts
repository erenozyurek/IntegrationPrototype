import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const BUCKET_NAME = 'product_images_test';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const productId = formData.get('productId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];

    // Upload each file
    for (const file of files) {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}-${randomString}.${fileExt}`;
      const filePath = productId 
        ? `products/${productId}/${fileName}` 
        : `temp/${fileName}`;

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      message: `${uploadedUrls.length} file(s) uploaded successfully`,
    });
  } catch (error: unknown) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload files' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove images
export async function DELETE(req: Request) {
  try {
    const { url } = await req.json();

    console.log('Delete request received for URL:', url);

    if (!url) {
      console.error('No URL provided in request');
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    // Extract file path from URL - handle multiple formats
    let filePath = '';
    
    // Try to extract path after /storage/v1/object/public/{bucket}/
    const storageMatch = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
    if (storageMatch) {
      filePath = storageMatch[1];
    } else {
      // Try splitting by bucket name
      const urlParts = url.split(`${BUCKET_NAME}/`);
      if (urlParts.length >= 2) {
        filePath = urlParts[1];
      } else {
        console.error('Could not parse URL:', url);
        console.error('Expected bucket name:', BUCKET_NAME);
        return NextResponse.json(
          { error: `Invalid image URL format. Expected bucket: ${BUCKET_NAME}` },
          { status: 400 }
        );
      }
    }

    console.log('Attempting to delete file path:', filePath);

    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }

    console.log('File deleted successfully:', filePath);

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete image' },
      { status: 500 }
    );
  }
}
