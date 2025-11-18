import { supabaseAdmin } from './supabaseAdmin';

const BUCKET_NAME = 'product_images_test';

/**
 * Upload an image to Supabase Storage
 * @param file - File object to upload
 * @param path - Optional path within the bucket (e.g., 'products/product-123')
 * @returns Public URL of the uploaded image
 */
export async function uploadImage(file: File, path?: string): Promise<string> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    // Upload file
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Upload multiple images
 * @param files - Array of File objects
 * @param path - Optional path within the bucket
 * @returns Array of public URLs
 */
export async function uploadMultipleImages(
  files: File[],
  path?: string
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadImage(file, path));
  return Promise.all(uploadPromises);
}

/**
 * Delete an image from Supabase Storage
 * @param url - Public URL of the image to delete
 * @returns Success boolean
 */
export async function deleteImage(url: string): Promise<boolean> {
  try {
    // Extract file path from URL
    const urlParts = url.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) {
      throw new Error('Invalid image URL');
    }
    const filePath = urlParts[1];

    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

/**
 * Delete multiple images
 * @param urls - Array of public URLs to delete
 * @returns Success boolean
 */
export async function deleteMultipleImages(urls: string[]): Promise<boolean> {
  try {
    const deletePromises = urls.map((url) => deleteImage(url));
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    return false;
  }
}

/**
 * Get public URL for an existing file
 * @param path - File path in the bucket
 * @returns Public URL
 */
export function getPublicUrl(path: string): string {
  const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * List all files in a directory
 * @param path - Directory path in the bucket
 * @returns Array of file objects
 */
export async function listFiles(path?: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .list(path, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('List files error:', error);
    throw error;
  }

  return data;
}
