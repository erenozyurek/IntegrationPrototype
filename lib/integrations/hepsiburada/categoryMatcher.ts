/**
 * Hepsiburada Category Matching Service
 * Improved algorithm for better category matching based on product title and description
 */

import { hepsiburadaCache } from './cache';
import type { HepsiburadaCategory, HepsiburadaCategoryMatch } from './types';

/**
 * Turkish character normalization map
 */
const TURKISH_CHAR_MAP: Record<string, string> = {
  'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c',
  'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'İ': 'i', 'Ö': 'o', 'Ç': 'c',
};

/**
 * Normalize Turkish characters to ASCII
 */
function normalizeTurkish(text: string): string {
  return text.split('').map(char => TURKISH_CHAR_MAP[char] || char).join('');
}

/**
 * Common stop words to filter out (Turkish + English)
 */
const STOP_WORDS = new Set([
  // Turkish
  've', 'için', 'ile', 'de', 'da', 'ise', 'gibi', 'daha', 'çok', 'en', 'bir', 
  'bu', 'şu', 'olan', 'üzere', 'adet', 'set', 'takım', 'paket', 'tane',
  'yeni', 'orjinal', 'orijinal', 'original', 'ürün', 'urun', 'satis', 'satış',
  // English
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'new', 'original', 'sale', 'product', 'item', 'pcs', 'piece', 'set',
]);

/**
 * Category-specific keyword mappings for better matching
 * Maps product keywords to likely category keywords
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // Phones - IMPORTANT: exact product names
  'iphone': ['iphone', 'ios', 'apple', 'cep telefonu', 'telefon'],
  'samsung': ['android', 'galaxy', 'cep telefonu', 'telefon'],
  'xiaomi': ['android', 'redmi', 'poco', 'cep telefonu', 'telefon'],
  'huawei': ['android', 'cep telefonu', 'telefon'],
  'oppo': ['android', 'cep telefonu', 'telefon'],
  'android': ['android', 'cep telefonu', 'telefon'],
  'telefon': ['cep telefonu', 'smartphone', 'mobil', 'akıllı telefon'],
  
  // Computers
  'bilgisayar': ['laptop', 'notebook', 'pc', 'masaüstü', 'dizüstü', 'computer'],
  'laptop': ['notebook', 'dizüstü', 'bilgisayar'],
  'macbook': ['apple', 'laptop', 'notebook', 'bilgisayar'],
  
  // Tablets
  'tablet': ['ipad', 'tab', 'android tablet'],
  'ipad': ['tablet', 'apple', 'ios'],
  
  // Audio
  'kulaklık': ['earphone', 'headphone', 'bluetooth kulaklık', 'tws', 'airpods'],
  'airpods': ['kulaklık', 'bluetooth', 'tws', 'apple'],
  
  // Chargers/Power
  'şarj': ['charger', 'şarj cihazı', 'powerbank', 'adaptör', 'kablo'],
  'powerbank': ['şarj', 'taşınabilir', 'güç kaynağı'],
  
  // Fashion
  'elbise': ['dress', 'kadın elbise', 'gece elbisesi'],
  'tişört': ['t-shirt', 'tshirt', 'erkek tişört', 'kadın tişört'],
  'pantolon': ['pants', 'jean', 'kot', 'trousers'],
  'ayakkabı': ['shoes', 'sneaker', 'spor ayakkabı', 'bot', 'çizme'],
  'çanta': ['bag', 'handbag', 'sırt çantası', 'el çantası'],
  
  // Home & Living
  'mobilya': ['furniture', 'masa', 'sandalye', 'koltuk', 'dolap'],
  'mutfak': ['kitchen', 'tencere', 'tava', 'bıçak', 'tabak'],
  'dekorasyon': ['decor', 'süs', 'aksesuar', 'tablo', 'vazo'],
  'tekstil': ['textile', 'nevresim', 'havlu', 'perde', 'halı'],
  
  // Beauty & Personal Care
  'kozmetik': ['cosmetic', 'makyaj', 'makeup', 'ruj', 'fondöten'],
  'parfüm': ['perfume', 'koku', 'deodorant', 'edt', 'edp'],
  'cilt bakım': ['skincare', 'krem', 'serum', 'nemlendirici'],
  'saç bakım': ['haircare', 'şampuan', 'saç kremi', 'saç boyası'],
  
  // Sports & Outdoor
  'spor': ['sport', 'fitness', 'egzersiz', 'gym'],
  'outdoor': ['kamp', 'camping', 'doğa', 'yürüyüş'],
};

/**
 * Known brand names for better matching
 */
const BRAND_NAMES = new Set([
  'iphone', 'apple', 'samsung', 'xiaomi', 'huawei', 'oppo', 'vivo', 'realme',
  'oneplus', 'google', 'pixel', 'lg', 'sony', 'motorola', 'nokia', 'asus',
  'lenovo', 'hp', 'dell', 'acer', 'msi', 'macbook', 'imac', 'ipad', 'airpods',
  'galaxy', 'redmi', 'poco', 'honor', 'infinix', 'tecno',
  'nike', 'adidas', 'puma', 'reebok', 'converse', 'vans', 'new balance',
  'zara', 'mango', 'hm', 'lcwaikiki', 'koton', 'defacto', 'mavi', 'colins',
  'dyson', 'philips', 'bosch', 'siemens', 'arcelik', 'beko', 'vestel',
  'loreal', 'maybelline', 'mac', 'nyx', 'essence', 'avon', 'flormar',
]);

/**
 * Gender keywords - HIGHEST priority for fashion/clothing
 */
const GENDER_KEYWORDS: Record<string, string[]> = {
  // Female
  'kadin': ['kadin', 'kadinlar', 'bayan', 'bayanlar', 'women', 'woman', 'ladies', 'female'],
  'bayan': ['kadin', 'kadinlar', 'bayan', 'bayanlar', 'women', 'woman', 'ladies', 'female'],
  // Male
  'erkek': ['erkek', 'erkekler', 'bay', 'men', 'man', 'male', 'boys'],
  'bay': ['erkek', 'erkekler', 'bay', 'men', 'man', 'male'],
  // Kids
  'cocuk': ['cocuk', 'cocuklar', 'kids', 'children', 'child'],
  'bebek': ['bebek', 'bebekler', 'baby', 'infant', 'newborn'],
  'kiz': ['kiz', 'kiz cocuk', 'girl', 'girls'],
  'erkek cocuk': ['erkek cocuk', 'oglan', 'boy', 'boys'],
  // Unisex
  'unisex': ['unisex'],
};

/**
 * Product type keywords - HIGH priority (the actual item being sold)
 */
const PRODUCT_TYPE_KEYWORDS = new Set([
  // Clothing
  'tisort', 'tshirt', 't-shirt', 'gomlek', 'shirt', 'bluz', 'blouse',
  'pantolon', 'pants', 'jean', 'kot', 'jeans', 'sort', 'shorts',
  'elbise', 'dress', 'etek', 'skirt',
  'ceket', 'jacket', 'mont', 'coat', 'kaban', 'blazer', 'parka',
  'kazak', 'sweater', 'hirka', 'cardigan', 'triko', 'knitwear',
  'sweatshirt', 'hoodie', 'kapsonlu', 'yelek', 'vest',
  'tayt', 'leggings', 'esofman', 'tracksuit', 'jogger',
  'tulum', 'jumpsuit', 'body', 'bodysuit',
  // Underwear
  'ic camasir', 'underwear', 'kulot', 'panties', 'boxer', 'slip',
  'sutyen', 'bra', 'bustiyer', 'atlet', 'fanila',
  'pijama', 'pajamas', 'gecelik', 'nightgown',
  'corap', 'socks', 'caltidon',
  // Shoes
  'ayakkabi', 'shoes', 'bot', 'boots', 'cizme',
  'sneaker', 'spor ayakkabi', 'sandalet', 'sandals', 'terlik', 'slippers',
  'topuklu', 'heels', 'stiletto', 'babet', 'flats', 'loafer', 'mokasen',
  // Bags
  'canta', 'bag', 'el cantasi', 'handbag', 'sirt cantasi', 'backpack',
  'omuz cantasi', 'shoulder bag', 'cuzdan', 'wallet', 'clutch',
  // Accessories
  'kemer', 'belt', 'sapka', 'hat', 'bere', 'beanie', 'atki', 'scarf',
  'eldiven', 'gloves', 'gozluk', 'glasses', 'saat', 'watch',
  // Jewelry
  'taki', 'jewelry', 'kolye', 'necklace', 'bileklik', 'bracelet',
  'kupe', 'earring', 'yuzuk', 'ring',
  // Electronics
  'telefon', 'phone', 'tablet', 'bilgisayar', 'laptop', 'notebook',
  'kulaklik', 'headphones', 'airpods', 'hoparlor', 'speaker',
  'sarj', 'charger', 'powerbank', 'kilif', 'case', 'kablo', 'cable',
  // Home
  'yastik', 'pillow', 'yorgan', 'duvet', 'nevresim', 'bedding',
  'havlu', 'towel', 'perde', 'curtain', 'hali', 'carpet',
  'lamba', 'lamp', 'ayna', 'mirror',
  // Beauty
  'parfum', 'perfume', 'ruj', 'lipstick', 'fondoten', 'foundation',
  'maskara', 'mascara', 'krem', 'cream', 'serum', 'sampuan', 'shampoo',
]);

/**
 * Extract and clean keywords from text, identifying special keyword types
 */
function extractKeywords(text: string): {
  all: string[];
  brands: string[];
  genders: string[];
  productTypes: string[];
} {
  if (!text) return { all: [], brands: [], genders: [], productTypes: [] };
  
  // Normalize and clean
  const normalized = normalizeTurkish(text.toLowerCase());
  
  // Split into words, filter short words and stop words
  const words = normalized
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
  
  // Remove duplicates while preserving order
  const allKeywords = [...new Set(words)];
  
  // Identify special keyword types
  const brands: string[] = [];
  const genders: string[] = [];
  const productTypes: string[] = [];
  
  for (const word of allKeywords) {
    if (BRAND_NAMES.has(word)) {
      brands.push(word);
    }
    
    // Check gender keywords
    for (const [genderKey, synonyms] of Object.entries(GENDER_KEYWORDS)) {
      if (word === normalizeTurkish(genderKey) || synonyms.some(s => normalizeTurkish(s) === word)) {
        genders.push(word);
        break;
      }
    }
    
    if (PRODUCT_TYPE_KEYWORDS.has(word)) {
      productTypes.push(word);
    }
  }
  
  return {
    all: allKeywords,
    brands: [...new Set(brands)],
    genders: [...new Set(genders)],
    productTypes: [...new Set(productTypes)],
  };
}

/**
 * Calculate match score between product keywords and category
 * Enhanced with heavy weighting for gender and product type matches
 */
function calculateMatchScore(
  keywords: {
    all: string[];
    brands: string[];
    genders: string[];
    productTypes: string[];
  },
  category: HepsiburadaCategory,
  categoryPath: string[]
): { score: number; genderMatch: boolean; productTypeMatch: boolean } {
  let score = 0;
  
  const categoryName = normalizeTurkish((category.displayName || category.name).toLowerCase());
  const fullPathNormalized = normalizeTurkish(categoryPath.join(' ').toLowerCase());
  const categoryNameWords = categoryName.split(/\s+/);
  const fullCategoryText = categoryName + ' ' + fullPathNormalized;
  
  // Track match types
  let genderMatch = false;
  let productTypeMatch = false;
  let matchedBrands = 0;
  
  // === HIGHEST PRIORITY: GENDER MATCH (30 points) ===
  for (const gender of keywords.genders) {
    const genderNorm = normalizeTurkish(gender);
    
    // Check if any gender synonym matches the category
    const genderSynonyms = GENDER_KEYWORDS[gender] || [];
    const allGenderTerms = [genderNorm, ...genderSynonyms.map(s => normalizeTurkish(s))];
    
    for (const term of allGenderTerms) {
      if (fullCategoryText.includes(term)) {
        score += 30;
        genderMatch = true;
        break;
      }
    }
  }
  
  // PENALTY: If product has gender but category has WRONG gender (-60 points)
  if (keywords.genders.length > 0 && !genderMatch) {
    // Check if category is gendered (has any gender term)
    const categoryHasGender = Object.values(GENDER_KEYWORDS).flat().some(g => 
      fullCategoryText.includes(normalizeTurkish(g))
    );
    if (categoryHasGender) {
      score -= 60; // Heavy penalty for wrong gender
    }
  }
  
  // === HIGH PRIORITY: PRODUCT TYPE MATCH (25 points in name, 18 in path) ===
  for (const productType of keywords.productTypes) {
    const typeNorm = normalizeTurkish(productType);
    
    if (categoryNameWords.includes(typeNorm)) {
      score += 25;
      productTypeMatch = true;
    } else if (categoryName.includes(typeNorm)) {
      score += 22;
      productTypeMatch = true;
    } else if (fullPathNormalized.includes(typeNorm)) {
      score += 18;
      productTypeMatch = true;
    }
  }
  
  // === HIGH PRIORITY: BRAND MATCH (50 points in name, 35 in path) ===
  for (const brand of keywords.brands) {
    const brandNorm = normalizeTurkish(brand);
    
    if (categoryName.includes(brandNorm)) {
      score += 50;
      matchedBrands++;
    } else if (fullPathNormalized.includes(brandNorm)) {
      score += 35;
      matchedBrands++;
    }
  }
  
  // === REGULAR KEYWORD MATCHING ===
  for (const keyword of keywords.all) {
    const keywordNormalized = normalizeTurkish(keyword);
    
    // Skip if already counted as brand, gender, or product type
    if (keywords.brands.includes(keyword) || 
        keywords.genders.includes(keyword) || 
        keywords.productTypes.includes(keyword)) {
      continue;
    }
    
    // Exact word match in category name
    if (categoryNameWords.includes(keywordNormalized)) {
      score += 15;
      continue;
    }
    
    // Partial match in category name
    if (categoryName.includes(keywordNormalized) && keywordNormalized.length > 3) {
      score += 10;
      continue;
    }
    
    // Match in full category path
    if (fullPathNormalized.includes(keywordNormalized) && keywordNormalized.length > 3) {
      score += 6;
      continue;
    }
    
    // Check category keyword mappings (synonyms)
    for (const [mappedKey, synonyms] of Object.entries(CATEGORY_KEYWORDS)) {
      const mappedKeyNorm = normalizeTurkish(mappedKey);
      
      if (keywordNormalized === mappedKeyNorm || keywordNormalized.includes(mappedKeyNorm)) {
        for (const syn of synonyms) {
          const synNorm = normalizeTurkish(syn.toLowerCase());
          if (categoryName.includes(synNorm)) {
            score += 20;
            break;
          }
          if (fullPathNormalized.includes(synNorm)) {
            score += 12;
            break;
          }
        }
      }
    }
  }
  
  // === BONUSES ===
  // Bonus for matching gender + product type (strong match)
  if (genderMatch && productTypeMatch) {
    score += 25;
  }
  
  // Bonus for matching brand + product type
  if (matchedBrands >= 1 && productTypeMatch) {
    score += 20;
  }
  
  // Bonus for leaf categories (can directly list products)
  if (category.leaf && category.available) {
    score += 5;
  }
  
  // Penalize very generic/short category names
  if (categoryNameWords.length === 1 && score < 50) {
    score -= 5;
  }
  
  return { score: Math.max(0, score), genderMatch, productTypeMatch };
}

/**
 * Determine confidence level based on score with gender/productType awareness
 */
function getConfidence(
  score: number, 
  matchedKeywordCount: number,
  genderMatch: boolean,
  productTypeMatch: boolean
): 'high' | 'medium' | 'low' {
  // High confidence if gender + product type both match
  if (genderMatch && productTypeMatch && score >= 50) return 'high';
  if (productTypeMatch && score >= 45) return 'high';
  if (score >= 50 && matchedKeywordCount >= 2) return 'high';
  if (score >= 30 || matchedKeywordCount >= 1) return 'medium';
  return 'low';
}

/**
 * Match product to Hepsiburada categories
 * Returns top N matching categories sorted by relevance
 */
export async function matchHepsiburadaCategories(
  productTitle: string,
  productDescription?: string,
  topN: number = 10
): Promise<HepsiburadaCategoryMatch[]> {
  try {
    // Fetch ALL categories with caching (uses centralized cache)
    const categories = await hepsiburadaCache.prefetchCategories();
    
    console.log(`📦 [Hepsiburada] Using ${categories.length} leaf categories for matching`);
    
    // Extract keywords from product info (merging title and description)
    const titleKeywords = extractKeywords(productTitle);
    const descKeywords = productDescription ? extractKeywords(productDescription) : { all: [], brands: [], genders: [], productTypes: [] };
    
    // Merge keywords from title and description
    const mergedKeywords = {
      all: [...new Set([...titleKeywords.all, ...descKeywords.all])],
      brands: [...new Set([...titleKeywords.brands, ...descKeywords.brands])],
      genders: [...new Set([...titleKeywords.genders, ...descKeywords.genders])],
      productTypes: [...new Set([...titleKeywords.productTypes, ...descKeywords.productTypes])],
    };
    
    console.log('🔍 [Hepsiburada] Keywords:', mergedKeywords.all.slice(0, 15));
    console.log('🔍 [Hepsiburada] Genders:', mergedKeywords.genders);
    console.log('🔍 [Hepsiburada] Product Types:', mergedKeywords.productTypes);
    console.log('🔍 [Hepsiburada] Brands:', mergedKeywords.brands);
    
    // Score each category
    const scoredCategories: HepsiburadaCategoryMatch[] = categories.map((category: HepsiburadaCategory) => {
      const pathArray = category.paths || [category.name];
      const { score, genderMatch, productTypeMatch } = calculateMatchScore(mergedKeywords, category, pathArray);
      
      // Count how many keywords matched
      const categoryText = normalizeTurkish([
        category.displayName || category.name,
        ...pathArray
      ].join(' ').toLowerCase());
      
      const matchedKeywordCount = mergedKeywords.all.filter(kw => 
        categoryText.includes(normalizeTurkish(kw))
      ).length;
      
      return {
        category,
        score,
        path: pathArray,
        pathString: pathArray.join(' > '),
        isLeaf: category.leaf,
        confidence: getConfidence(score, matchedKeywordCount, genderMatch, productTypeMatch),
      };
    });
    
    // Sort by score (descending) and filter relevant results
    const matches = scoredCategories
      .filter(m => m.score > 5) // Minimum threshold
      .sort((a, b) => {
        // First by score
        if (b.score !== a.score) return b.score - a.score;
        // Then by confidence
        const confOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
        return confOrder[b.confidence] - confOrder[a.confidence];
      })
      .slice(0, topN);
    
    console.log('✅ [Hepsiburada] Top matches:', matches.slice(0, 5).map(m => ({
      name: m.category.name,
      score: m.score,
      confidence: m.confidence,
    })));
    
    return matches;
  } catch (error) {
    console.error('❌ [Hepsiburada] Category matching error:', error);
    throw error;
  }
}

/**
 * Search categories by keyword (for manual search)
 */
export async function searchHepsiburadaCategories(
  searchQuery: string,
  limit: number = 20
): Promise<HepsiburadaCategoryMatch[]> {
  try {
    // Use cached categories
    const categories = await hepsiburadaCache.prefetchCategories();
    
    const queryKeywords = extractKeywords(searchQuery);
    const queryNormalized = normalizeTurkish(searchQuery.toLowerCase());
    
    const results: HepsiburadaCategoryMatch[] = categories
      .map((category: HepsiburadaCategory) => {
        const pathArray = category.paths || [category.name];
        const categoryName = normalizeTurkish((category.displayName || category.name).toLowerCase());
        const fullPath = normalizeTurkish(pathArray.join(' ').toLowerCase());
        
        let score = 0;
        
        // Direct search match
        if (categoryName.includes(queryNormalized)) {
          score += 50;
        } else if (fullPath.includes(queryNormalized)) {
          score += 30;
        }
        
        // Keyword matches using extracted keywords
        for (const keyword of queryKeywords.all) {
          const kwNormalized = normalizeTurkish(keyword);
          if (categoryName.includes(kwNormalized)) score += 20;
          else if (fullPath.includes(kwNormalized)) score += 10;
        }
        
        // Boost for gender/product type matches in search
        for (const gender of queryKeywords.genders) {
          if (fullPath.includes(normalizeTurkish(gender))) score += 25;
        }
        for (const productType of queryKeywords.productTypes) {
          if (categoryName.includes(normalizeTurkish(productType))) score += 20;
        }
        
        return {
          category,
          score,
          path: pathArray,
          pathString: pathArray.join(' > '),
          isLeaf: category.leaf,
          confidence: (score >= 50 ? 'high' : score >= 20 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        };
      })
      .filter((m: HepsiburadaCategoryMatch) => m.score > 0)
      .sort((a: HepsiburadaCategoryMatch, b: HepsiburadaCategoryMatch) => b.score - a.score)
      .slice(0, limit);
    
    return results;
  } catch (error) {
    console.error('❌ [Hepsiburada] Category search error:', error);
    throw error;
  }
}

/**
 * Get category by ID
 */
export async function getHepsiburadaCategoryById(categoryId: number): Promise<HepsiburadaCategory | null> {
  try {
    // Use cached categories
    const category = hepsiburadaCache.getCategoryById(categoryId);
    if (category) return category;
    
    // If not in cache, fetch all categories first
    await hepsiburadaCache.prefetchCategories();
    return hepsiburadaCache.getCategoryById(categoryId);
  } catch (error) {
    console.error('❌ [Hepsiburada] Get category error:', error);
    return null;
  }
}
