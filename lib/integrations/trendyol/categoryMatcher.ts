/**
 * Trendyol Category Matching Service
 * Suggests best matching Trendyol categories based on product title and description
 */

import { trendyolClient } from './client';
import type { TrendyolCategory } from './types';

/**
 * Calculate similarity between two strings (simple implementation)
 * Returns a score between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Contains check
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Word-based matching
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matchCount = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchCount++;
        break;
      }
    }
  }
  
  const maxWords = Math.max(words1.length, words2.length);
  return matchCount / maxWords;
}

/**
 * Extract keywords from product title and description
 */
function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    've', 'için', 'ile', 'de', 'da', 'ise', 'gibi', 'daha', 
    'çok', 'en', 'bir', 'bu', 'şu', 'o', 'olan', 'üzere',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^\wğüşıöçĞÜŞİÖÇ\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word));
  
  return Array.from(new Set(words));
}

/**
 * Score a category based on product info
 */
function scoreCategory(
  category: TrendyolCategory,
  productKeywords: string[],
  categoryPath: string[]
): number {
  let score = 0;
  
  // Check category name against keywords
  const categoryNameLower = category.name.toLowerCase();
  for (const keyword of productKeywords) {
    if (categoryNameLower.includes(keyword)) {
      score += 10;
    }
  }
  
  // Check full path for keyword matches
  const fullPath = categoryPath.join(' ').toLowerCase();
  for (const keyword of productKeywords) {
    if (fullPath.includes(keyword)) {
      score += 5;
    }
  }
  
  // Bonus for leaf categories (more specific)
  if (!category.subCategories || category.subCategories.length === 0) {
    score += 3;
  }
  
  // Similarity score
  const titleText = productKeywords.join(' ');
  score += calculateSimilarity(titleText, category.name) * 20;
  
  return score;
}

/**
 * Flatten category tree and build path info
 */
function flattenCategories(
  categories: TrendyolCategory[],
  parentPath: string[] = []
): Array<{ category: TrendyolCategory; path: string[] }> {
  const result: Array<{ category: TrendyolCategory; path: string[] }> = [];
  
  for (const category of categories) {
    const currentPath = [...parentPath, category.name];
    result.push({ category, path: currentPath });
    
    if (category.subCategories && category.subCategories.length > 0) {
      result.push(...flattenCategories(category.subCategories, currentPath));
    }
  }
  
  return result;
}

export interface CategoryMatch {
  category: TrendyolCategory;
  score: number;
  path: string[];
  pathString: string;
  isLeaf: boolean;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Match product to Trendyol categories
 * Returns top N matching categories sorted by relevance
 */
export async function matchCategories(
  productTitle: string,
  productDescription?: string,
  topN: number = 5
): Promise<CategoryMatch[]> {
  try {
    // Fetch all categories
    const categoriesResponse = await trendyolClient.getCategories() as any;
    const categories = categoriesResponse.categories || categoriesResponse || [];
    
    // Extract keywords from product info
    const titleKeywords = extractKeywords(productTitle);
    const descKeywords = productDescription ? extractKeywords(productDescription) : [];
    const allKeywords = [...titleKeywords, ...descKeywords];
    
    console.log('🔍 Extracted keywords:', allKeywords);
    
    // Flatten categories with path info
    const flatCategories = flattenCategories(categories);
    
    // Score each category
    const scoredCategories = flatCategories.map(({ category, path }) => {
      const score = scoreCategory(category, allKeywords, path);
      const isLeaf = !category.subCategories || category.subCategories.length === 0;
      
      // Determine confidence level
      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (score >= 30) confidence = 'high';
      else if (score >= 15) confidence = 'medium';
      
      return {
        category,
        score,
        path,
        pathString: path.join(' > '),
        isLeaf,
        confidence,
      };
    });
    
    // Sort by score and filter to top N
    const matches = scoredCategories
      .filter(m => m.score > 0) // Only categories with some relevance
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
    
    console.log('✅ Top matches:', matches.map(m => ({
      name: m.category.name,
      score: m.score,
      path: m.pathString,
      confidence: m.confidence,
    })));
    
    return matches;
  } catch (error) {
    console.error('❌ Category matching error:', error);
    throw error;
  }
}

/**
 * Get category by ID (for manual selection)
 */
export async function getCategoryById(categoryId: number): Promise<TrendyolCategory | null> {
  try {
    const categoriesResponse = await trendyolClient.getCategories() as any;
    const categories = categoriesResponse.categories || categoriesResponse || [];
    
    function findCategory(cats: TrendyolCategory[], id: number): TrendyolCategory | null {
      for (const cat of cats) {
        if (cat.id === id) return cat;
        if (cat.subCategories) {
          const found = findCategory(cat.subCategories, id);
          if (found) return found;
        }
      }
      return null;
    }
    
    return findCategory(categories, categoryId);
  } catch (error) {
    console.error('❌ Get category error:', error);
    return null;
  }
}
