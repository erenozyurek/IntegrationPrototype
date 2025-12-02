/**
 * Trendyol Brand Matching Service
 * Suggests best matching Trendyol brands based on product title
 * Similar to categoryMatcher.ts but for brands
 */

import { trendyolClient } from './client';

export interface TrendyolBrand {
  id: number;
  name: string;
}

export interface BrandMatch {
  brand: TrendyolBrand;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  matchType: 'exact' | 'partial' | 'fuzzy';
}

/**
 * Calculate similarity between two strings
 * Returns a score between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Word-based matching
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matchCount = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2) {
        matchCount += 2;
        break;
      } else if (word1.includes(word2) || word2.includes(word1)) {
        matchCount += 1;
        break;
      }
    }
  }
  
  const maxWords = Math.max(words1.length, words2.length) * 2;
  return matchCount / maxWords;
}

/**
 * Extract potential brand keywords from product title
 * Usually brands appear at the beginning of the title
 */
function extractBrandKeywords(title: string): string[] {
  // Common product descriptors to filter out
  const productDescriptors = new Set([
    'adet', 'paket', 'kutu', 'gram', 'ml', 'lt', 'kg', 'cm', 'mm',
    'set', 'takım', 'koli', 'çift', 'yeni', 'orjinal', 'original',
    'model', 'versiyon', 'seri', 'serisi', 've', 'için', 'ile',
    'kadın', 'erkek', 'çocuk', 'bebek', 'unisex',
    'siyah', 'beyaz', 'kırmızı', 'mavi', 'yeşil', 'sarı', 'pembe', 'mor',
    'büyük', 'küçük', 'orta', 'mini', 'maxi', 'xl', 'xxl', 's', 'm', 'l',
    'the', 'a', 'an', 'and', 'or', 'for', 'with', 'new', 'original',
  ]);
  
  // Split by common delimiters
  const words = title
    .replace(/[^\wğüşıöçĞÜŞİÖÇ\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length > 1 && 
      !productDescriptors.has(word.toLowerCase()) &&
      !/^\d+$/.test(word) // Not just numbers
    );
  
  // First 3 words are usually brand/product name
  const potentialBrands = words.slice(0, 3);
  
  // Also add combinations
  const combinations: string[] = [];
  if (words.length >= 2) {
    combinations.push(words.slice(0, 2).join(' '));
  }
  if (words.length >= 3) {
    combinations.push(words.slice(0, 3).join(' '));
  }
  
  return [...potentialBrands, ...combinations];
}

/**
 * Search for brands on Trendyol
 * Note: Trendyol brand search is CASE SENSITIVE!
 */
async function searchBrands(keyword: string): Promise<TrendyolBrand[]> {
  try {
    // Try exact case first
    const response1 = await trendyolClient.searchBrandByName(keyword) as { brands?: TrendyolBrand[] };
    const brands1 = response1?.brands || [];
    
    // Try lowercase
    const response2 = await trendyolClient.searchBrandByName(keyword.toLowerCase()) as { brands?: TrendyolBrand[] };
    const brands2 = response2?.brands || [];
    
    // Try uppercase first letter
    const titleCase = keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase();
    const response3 = await trendyolClient.searchBrandByName(titleCase) as { brands?: TrendyolBrand[] };
    const brands3 = response3?.brands || [];
    
    // Try all uppercase
    const response4 = await trendyolClient.searchBrandByName(keyword.toUpperCase()) as { brands?: TrendyolBrand[] };
    const brands4 = response4?.brands || [];
    
    // Merge and dedupe
    const allBrands = [...brands1, ...brands2, ...brands3, ...brands4];
    const uniqueBrands = allBrands.reduce((acc: TrendyolBrand[], brand) => {
      if (!acc.find(b => b.id === brand.id)) {
        acc.push(brand);
      }
      return acc;
    }, []);
    
    return uniqueBrands;
  } catch (error) {
    console.error(`❌ Brand search error for "${keyword}":`, error);
    return [];
  }
}

/**
 * Score a brand based on similarity to keywords
 */
function scoreBrand(brand: TrendyolBrand, keywords: string[]): { score: number; matchType: 'exact' | 'partial' | 'fuzzy' } {
  let maxScore = 0;
  let matchType: 'exact' | 'partial' | 'fuzzy' = 'fuzzy';
  
  const brandNameLower = brand.name.toLowerCase();
  
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    
    // Exact match (100 points)
    if (brandNameLower === keywordLower) {
      return { score: 100, matchType: 'exact' };
    }
    
    // Brand name contains keyword or vice versa (70-90 points)
    if (brandNameLower.includes(keywordLower)) {
      const score = 90 - (brandNameLower.length - keywordLower.length);
      if (score > maxScore) {
        maxScore = Math.max(70, score);
        matchType = 'partial';
      }
    } else if (keywordLower.includes(brandNameLower)) {
      const score = 80 - (keywordLower.length - brandNameLower.length);
      if (score > maxScore) {
        maxScore = Math.max(60, score);
        matchType = 'partial';
      }
    }
    
    // Similarity scoring (0-50 points)
    const similarity = calculateSimilarity(brand.name, keyword);
    const simScore = similarity * 50;
    if (simScore > maxScore) {
      maxScore = simScore;
      matchType = 'fuzzy';
    }
  }
  
  return { score: maxScore, matchType };
}

/**
 * Match product to Trendyol brands
 * Returns top N matching brands sorted by relevance
 */
export async function matchBrands(
  productTitle: string,
  topN: number = 5
): Promise<BrandMatch[]> {
  try {
    console.log('🔍 Starting brand matching for:', productTitle);
    
    // Extract potential brand keywords from title
    const keywords = extractBrandKeywords(productTitle);
    console.log('🔍 Extracted brand keywords:', keywords);
    
    if (keywords.length === 0) {
      console.log('⚠️ No brand keywords extracted');
      return [];
    }
    
    // Search for brands with each keyword
    const allBrands: TrendyolBrand[] = [];
    for (const keyword of keywords) {
      const foundBrands = await searchBrands(keyword);
      for (const brand of foundBrands) {
        if (!allBrands.find(b => b.id === brand.id)) {
          allBrands.push(brand);
        }
      }
    }
    
    console.log(`📦 Found ${allBrands.length} unique brands`);
    
    if (allBrands.length === 0) {
      return [];
    }
    
    // Score each brand
    const scoredBrands: BrandMatch[] = allBrands.map(brand => {
      const { score, matchType } = scoreBrand(brand, keywords);
      
      // Determine confidence level
      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (score >= 80) confidence = 'high';
      else if (score >= 50) confidence = 'medium';
      
      return {
        brand,
        score,
        confidence,
        matchType,
      };
    });
    
    // Sort by score and filter to top N
    const matches = scoredBrands
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
    
    console.log('✅ Top brand matches:', matches.map(m => ({
      name: m.brand.name,
      id: m.brand.id,
      score: m.score,
      confidence: m.confidence,
      matchType: m.matchType,
    })));
    
    return matches;
  } catch (error) {
    console.error('❌ Brand matching error:', error);
    throw error;
  }
}

/**
 * Get brand by ID
 */
export async function getBrandById(brandId: number): Promise<TrendyolBrand | null> {
  try {
    // Fetch brands and search
    const response = await trendyolClient.getBrands(0, 10000) as { brands?: TrendyolBrand[] };
    const brands = response?.brands || [];
    return brands.find((b: TrendyolBrand) => b.id === brandId) || null;
  } catch (error) {
    console.error('❌ Get brand error:', error);
    return null;
  }
}

/**
 * Search brands by exact name (case insensitive wrapper)
 */
export async function searchBrandByName(name: string): Promise<TrendyolBrand[]> {
  return searchBrands(name);
}
