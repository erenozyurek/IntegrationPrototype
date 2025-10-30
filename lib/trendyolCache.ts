type TrendyolCategory = {
  id: number;
  name: string;
  parentId?: number | null;
  subCategories?: TrendyolCategory[];
};

let cachedTree: TrendyolCategory[] | null = null;
let cachedAt: number | null = null;
const TTL = 12 * 60 * 60 * 1000; // 12 hours

const TRENDYOL_URL = process.env.NEXT_PUBLIC_TRENDYOL_CATEGORY_URL || 'https://apigw.trendyol.com/integration/product/product-categories';

async function fetchTreeFromTrendyol(): Promise<TrendyolCategory[]> {
  const res = await fetch(TRENDYOL_URL);
  if (!res.ok) throw new Error('Failed to fetch Trendyol category tree');
  const data = await res.json();
  return data;
}

export async function ensureCache(): Promise<TrendyolCategory[]> {
  const now = Date.now();
  if (!cachedTree || !cachedAt || now - cachedAt > TTL) {
    try {
      const tree = await fetchTreeFromTrendyol();
      cachedTree = tree;
      cachedAt = Date.now();
    } catch (err) {
      // If fetch fails but we have stale cache, keep serving stale cache
      if (!cachedTree) throw err;
    }
  }
  return cachedTree ?? [];
}

function findNodeById(list: TrendyolCategory[], id: number): TrendyolCategory | null {
  for (const node of list) {
    if (node.id === id) return node;
    if (node.subCategories && node.subCategories.length) {
      const found = findNodeById(node.subCategories, id);
      if (found) return found;
    }
  }
  return null;
}

export async function getRootCategories(): Promise<TrendyolCategory[]> {
  const tree = await ensureCache();
  return tree;
}

export async function getChildren(parentId?: string | null): Promise<TrendyolCategory[]> {
  const tree = await ensureCache();
  if (!parentId && parentId !== '0') return tree;
  const pid = Number(parentId);
  const node = findNodeById(tree, pid);
  if (!node) return [];
  return node.subCategories ?? [];
}

export function clearCache() {
  cachedTree = null;
  cachedAt = null;
}

export function isLeaf(node: TrendyolCategory) {
  return !node.subCategories || node.subCategories.length === 0;
}

// Trendyol Category Attributes Types
export type TrendyolAttributeValue = {
  id: number;
  name: string;
};

export type TrendyolCategoryAttribute = {
  categoryId: number;
  attribute: {
    id: number;
    name: string;
  };
  required: boolean;
  allowCustom: boolean;
  varianter: boolean;
  slicer: boolean;
  attributeValues?: TrendyolAttributeValue[];
};

export type TrendyolCategoryAttributesResponse = {
  id: number;
  name: string;
  displayName: string;
  categoryAttributes: TrendyolCategoryAttribute[];
};

const TRENDYOL_ATTRIBUTES_URL = process.env.NEXT_PUBLIC_TRENDYOL_ATTRIBUTES_URL || 'https://apigw.trendyol.com/integration/product/product-categories';

export async function getCategoryAttributes(categoryId: string): Promise<TrendyolCategoryAttributesResponse> {
  const url = `${TRENDYOL_ATTRIBUTES_URL}/${categoryId}/attributes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch attributes for category ${categoryId}`);
  const data = await res.json();
  return data;
}

export default {
  ensureCache,
  getRootCategories,
  getChildren,
  clearCache,
  isLeaf,
  getCategoryAttributes,
};
