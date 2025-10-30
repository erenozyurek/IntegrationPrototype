import supabase from './supabaseClient';

export async function mapCategory(params: {
  aseraiCategoryId: string;
  marketplace: string; // e.g. 'TRENDYOL'
  marketplaceCategoryId: string;
  marketplaceCategoryName: string;
  marketplaceCategoryPath: string;
  attributes?: any; // Store the full attributes JSON
}) {
  const { aseraiCategoryId, marketplace, marketplaceCategoryId, marketplaceCategoryName, marketplaceCategoryPath, attributes } = params;

  // upsert into marketplace_category_mappings
  const payload: any = {
    aserai_category_id: aseraiCategoryId,
    marketplace,
    marketplace_category_id: marketplaceCategoryId,
    marketplace_category_name: marketplaceCategoryName,
    marketplace_category_path: marketplaceCategoryPath,
    updated_at: new Date().toISOString(),
  };

  // Add attributes if provided
  if (attributes) {
    payload.attributes = attributes;
  }

  const { data, error } = await supabase
    .from('marketplace_category_mappings')
    .upsert(payload, { onConflict: 'aserai_category_id,marketplace' });

  if (error) throw error;
  return data;
}

export default mapCategory;
