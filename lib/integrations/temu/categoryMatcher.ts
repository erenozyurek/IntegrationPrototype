/**
 * Temu Category Matcher
 * Matches products to Temu categories using keyword-based matching
 * Supports Turkish to English translation for international matching
 */

import { temuCache } from './cache';
import type { TemuCategory } from './types';

export interface TemuMatchResult {
  category: TemuCategory;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  matchedKeywords: string[];
}

// Turkish to English translation dictionary
const TURKISH_TO_ENGLISH: Record<string, string[]> = {
  // CLOTHING
  'tisort': ['t-shirt', 'tshirt', 'tee', 'top'],
  'gomlek': ['shirt', 'blouse', 'button'],
  'pantolon': ['pants', 'trousers', 'bottoms'],
  'jean': ['jeans', 'denim'],
  'kot': ['jeans', 'denim'],
  'elbise': ['dress', 'gown', 'frock'],
  'etek': ['skirt'],
  'ceket': ['jacket', 'blazer', 'coat', 'outerwear'],
  'mont': ['jacket', 'coat', 'puffer', 'down', 'outerwear'],
  'kaban': ['coat', 'overcoat', 'outerwear'],
  'kazak': ['sweater', 'pullover', 'knit', 'knitwear'],
  'triko': ['knit', 'knitwear', 'sweater'],
  'hirka': ['cardigan', 'sweater'],
  'sort': ['shorts', 'short'],
  'sweatshirt': ['sweatshirt', 'hoodie', 'pullover'],
  'kapusonlu': ['hoodie', 'hooded'],
  'yelek': ['vest', 'gilet', 'waistcoat'],
  'bluz': ['blouse', 'top'],
  'tunik': ['tunic', 'top'],
  'body': ['bodysuit', 'body'],
  'tulum': ['jumpsuit', 'romper', 'overall'],
  'tayt': ['leggings', 'tights'],
  'esofman': ['tracksuit', 'sweatpants', 'joggers', 'athletic'],
  // UNDERWEAR
  'ic': ['underwear', 'inner', 'intimate'],
  'kulot': ['panties', 'underwear', 'briefs'],
  'slip': ['briefs', 'underwear'],
  'sutyen': ['bra', 'brassiere'],
  'bustiyer': ['bustier', 'bralette'],
  'boxer': ['boxer', 'boxers', 'underwear'],
  'atlet': ['undershirt', 'tank', 'singlet'],
  'fanila': ['undershirt', 'tank'],
  'corap': ['socks', 'stockings', 'hosiery'],
  'pijama': ['pajamas', 'pyjamas', 'sleepwear', 'nightwear'],
  'gecelik': ['nightgown', 'nightdress', 'sleepwear'],
  'sabahlik': ['robe', 'bathrobe', 'dressing gown'],
  // SHOES
  'ayakkabi': ['shoes', 'shoe', 'footwear'],
  'bot': ['boots', 'boot', 'bootie'],
  'cizme': ['boots', 'boot'],
  'sneaker': ['sneakers', 'sneaker', 'trainers'],
  'yuruyus': ['walking', 'hiking'],
  'sandalet': ['sandals', 'sandal'],
  'terlik': ['slippers', 'slides', 'flip flops'],
  'topuklu': ['heels', 'high heels', 'pumps'],
  'stiletto': ['stiletto', 'heels'],
  'babet': ['flats', 'ballet flats', 'ballerina'],
  'loafer': ['loafers', 'moccasins'],
  'mokasen': ['moccasins', 'loafers'],
  // BAGS & ACCESSORIES
  'canta': ['bag', 'bags', 'handbag', 'purse', 'tote'],
  'sirt': ['backpack', 'back'],
  'omuz': ['shoulder', 'crossbody'],
  'cuzdan': ['wallet', 'purse', 'billfold'],
  'kemer': ['belt', 'belts'],
  'sapka': ['hat', 'cap', 'beanie'],
  'bere': ['beanie', 'cap'],
  'kasket': ['cap', 'baseball cap'],
  'atki': ['scarf', 'scarves', 'muffler'],
  'sal': ['shawl', 'scarf', 'wrap'],
  'fular': ['scarf', 'silk scarf'],
  'eldiven': ['gloves', 'mittens'],
  'gozluk': ['glasses', 'eyewear', 'sunglasses'],
  'saat': ['watch', 'watches', 'timepiece', 'clock'],
  // JEWELRY
  'taki': ['jewelry', 'jewellery', 'accessories'],
  'kolye': ['necklace', 'pendant', 'chain'],
  'bileklik': ['bracelet', 'bangle', 'wristband'],
  'kupe': ['earrings', 'earring', 'studs'],
  'yuzuk': ['ring', 'rings'],
  'bros': ['brooch', 'pin'],
  'toka': ['clip', 'barrette', 'hairpin'],
  'altin': ['gold', 'golden'],
  'gumus': ['silver'],
  // ELECTRONICS
  'telefon': ['phone', 'smartphone', 'mobile', 'cell'],
  'tablet': ['tablet', 'ipad'],
  'bilgisayar': ['computer', 'laptop', 'pc', 'notebook'],
  'laptop': ['laptop', 'notebook'],
  'kulaklik': ['headphones', 'earphones', 'earbuds', 'headset'],
  'kablosuz': ['wireless', 'bluetooth'],
  'bluetooth': ['bluetooth', 'wireless'],
  'hoparl': ['speaker', 'speakers', 'audio'],
  'sarj': ['charger', 'charging', 'power'],
  'guc': ['power', 'battery'],
  'powerbank': ['power bank', 'portable charger'],
  'kilif': ['case', 'cover', 'protector'],
  'koruyucu': ['protector', 'protection', 'screen'],
  'ekran': ['screen', 'display'],
  'kablo': ['cable', 'cord', 'wire'],
  'usb': ['usb', 'cable'],
  'adaptor': ['adapter', 'adaptor'],
  'kamera': ['camera', 'webcam'],
  'oyun': ['gaming', 'game', 'games'],
  // HOME & LIVING
  'ev': ['home', 'house', 'household'],
  'mutfak': ['kitchen', 'cooking', 'cookware'],
  'pisirme': ['cooking', 'baking'],
  'tencere': ['pot', 'pots', 'cookware'],
  'tava': ['pan', 'frying pan', 'skillet'],
  'bicak': ['knife', 'knives', 'cutlery'],
  'tabak': ['plate', 'plates', 'dish', 'dinnerware'],
  'bardak': ['glass', 'cup', 'mug', 'tumbler'],
  'kupa': ['mug', 'cup'],
  'banyo': ['bathroom', 'bath'],
  'dus': ['shower', 'bath'],
  'havlu': ['towel', 'towels'],
  'yatak': ['bed', 'bedroom', 'bedding'],
  'yastik': ['pillow', 'pillows', 'cushion'],
  'kirlent': ['cushion', 'throw pillow'],
  'battaniye': ['blanket', 'throw'],
  'yorgan': ['duvet', 'comforter', 'quilt'],
  'carsaf': ['sheet', 'sheets', 'bedsheet'],
  'nevresim': ['duvet cover', 'bedding set'],
  'perde': ['curtain', 'curtains', 'drapes'],
  'hali': ['rug', 'carpet', 'mat'],
  'kilim': ['rug', 'carpet', 'kilim'],
  'paspas': ['mat', 'doormat', 'rug'],
  'lamba': ['lamp', 'light', 'lighting'],
  'aydinlatma': ['lighting', 'light', 'lamp'],
  'avize': ['chandelier', 'pendant light'],
  'dekorasyon': ['decoration', 'decor', 'decorative'],
  'sus': ['decorative', 'ornament', 'decor'],
  'vazo': ['vase', 'vases'],
  'cerceve': ['frame', 'picture frame'],
  'ayna': ['mirror', 'mirrors'],
  'duvar': ['wall', 'hanging'],
  'raf': ['shelf', 'shelving', 'storage'],
  'kutu': ['box', 'storage', 'container'],
  'sepet': ['basket', 'bin', 'hamper'],
  // BEAUTY & COSMETICS
  'makyaj': ['makeup', 'cosmetics', 'beauty'],
  'kozmetik': ['cosmetics', 'beauty', 'makeup'],
  'ruj': ['lipstick', 'lip'],
  'dudak': ['lip', 'lips'],
  'fondoten': ['foundation', 'base'],
  'kapatici': ['concealer', 'corrector'],
  'pudra': ['powder', 'face powder'],
  'allik': ['blush', 'blusher', 'cheek'],
  'far': ['eyeshadow', 'eye shadow'],
  'goz': ['eye', 'eyes'],
  'maskara': ['mascara'],
  'eyeliner': ['eyeliner', 'eye liner'],
  'kas': ['eyebrow', 'brow'],
  'oje': ['nail polish', 'nail'],
  'tirnak': ['nail', 'nails', 'manicure'],
  'parfum': ['perfume', 'fragrance', 'cologne'],
  'koku': ['fragrance', 'scent', 'perfume'],
  'cilt': ['skin', 'skincare', 'face'],
  'yuz': ['face', 'facial'],
  'temizleyici': ['cleanser', 'cleansing'],
  'tonik': ['toner', 'tonic'],
  'serum': ['serum'],
  'krem': ['cream', 'moisturizer', 'lotion'],
  'nemlendirici': ['moisturizer', 'hydrating'],
  'gunes': ['sun', 'sunscreen', 'spf', 'sunglasses'],
  'maske': ['mask', 'face mask'],
  'peeling': ['exfoliant', 'scrub', 'peeling'],
  'sac': ['hair', 'haircare'],
  'sampuan': ['shampoo'],
  'fon': ['blow dryer', 'hair dryer'],
  'duzlestirici': ['straightener', 'flat iron'],
  'masa': ['curling iron', 'curler'],
  'firca': ['brush', 'brushes'],
  'tarak': ['comb', 'brush'],
  // BABY & KIDS
  'bebek': ['baby', 'infant', 'newborn'],
  'cocuk': ['kids', 'children', 'child', 'toddler'],
  'kiz': ['girl', 'girls'],
  'yenidogan': ['newborn', 'infant'],
  'bez': ['diaper', 'cloth', 'diapers'],
  'biberon': ['bottle', 'baby bottle', 'feeding'],
  'emzik': ['pacifier', 'dummy', 'soother'],
  'mama': ['baby food', 'feeding'],
  'oyuncak': ['toy', 'toys', 'play'],
  'pelus': ['plush', 'stuffed', 'soft toy'],
  // SPORTS
  'spor': ['sports', 'sport', 'athletic', 'fitness', 'sneakers', 'running'],
  'fitness': ['fitness', 'gym', 'workout'],
  'yoga': ['yoga', 'pilates'],
  'kosu': ['running', 'jogging', 'run'],
  'bisiklet': ['bicycle', 'bike', 'cycling'],
  'kamp': ['camping', 'camp', 'outdoor'],
  'doga': ['outdoor', 'nature', 'hiking'],
  'yuzme': ['swimming', 'swim'],
  'mayo': ['swimsuit', 'swimwear', 'bathing suit'],
  'bikini': ['bikini', 'swimwear'],
  'kayak': ['ski', 'skiing', 'snow'],
  'tenis': ['tennis'],
  'futbol': ['soccer', 'football'],
  'basketbol': ['basketball'],
  // GENDER & AGE
  'kadin': ['women', 'woman', 'womens', 'ladies', 'female'],
  'bayan': ['women', 'ladies', 'female'],
  'erkek': ['men', 'man', 'mens', 'male', 'boy', 'boys'],
  'bay': ['men', 'male'],
  'unisex': ['unisex'],
  'genc': ['teen', 'youth', 'junior'],
  // MATERIALS
  'pamuk': ['cotton'],
  'pamuklu': ['cotton'],
  'polyester': ['polyester'],
  'ipek': ['silk', 'silky'],
  'keten': ['linen'],
  'yun': ['wool', 'woolen'],
  'kadife': ['velvet'],
  'saten': ['satin'],
  'sifon': ['chiffon'],
  'dantel': ['lace'],
  'deri': ['leather', 'faux leather'],
  'suet': ['suede'],
  'plastik': ['plastic'],
  'metal': ['metal', 'metallic'],
  'ahsap': ['wood', 'wooden'],
  'cam': ['glass'],
  'seramik': ['ceramic'],
  'porselen': ['porcelain'],
  // COLORS
  'siyah': ['black'],
  'beyaz': ['white'],
  'kirmizi': ['red'],
  'mavi': ['blue'],
  'yesil': ['green'],
  'sari': ['yellow'],
  'turuncu': ['orange'],
  'mor': ['purple'],
  'pembe': ['pink'],
  'gri': ['gray', 'grey'],
  'kahverengi': ['brown'],
  'bej': ['beige'],
  'lacivert': ['navy', 'navy blue'],
  'bordo': ['burgundy', 'maroon'],
};

// Normalize text for matching (handles Turkish characters)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Translate Turkish keywords to English
function translateToEnglish(turkishWord: string): string[] {
  const normalized = normalizeText(turkishWord);
  const translations: string[] = [normalized];
  
  for (const [turkish, englishWords] of Object.entries(TURKISH_TO_ENGLISH)) {
    if (normalized === turkish || normalized.includes(turkish) || turkish.includes(normalized)) {
      translations.push(...englishWords);
    }
  }
  
  return [...new Set(translations)];
}

// High-priority keywords for gender matching (must match for clothing/fashion categories)
const GENDER_KEYWORDS = new Set([
  'women', 'woman', 'womens', 'ladies', 'female',
  'men', 'man', 'mens', 'male',
  'boy', 'boys', 'girl', 'girls',
  'kids', 'children', 'child', 'baby', 'infant', 'toddler',
  'unisex',
]);

// Direct product type keywords (highest priority - the actual item type)
const PRODUCT_TYPE_KEYWORDS = new Set([
  // Clothing
  't-shirt', 'tshirt', 'shirt', 'blouse', 'top',
  'pants', 'trousers', 'jeans', 'shorts',
  'dress', 'skirt', 'gown',
  'jacket', 'coat', 'blazer', 'outerwear', 'puffer',
  'sweater', 'cardigan', 'hoodie', 'sweatshirt', 'pullover',
  'vest', 'gilet',
  'jumpsuit', 'romper', 'bodysuit',
  'leggings', 'tights', 'tracksuit', 'joggers',
  // Underwear
  'underwear', 'bra', 'panties', 'briefs', 'boxer', 'boxers',
  'pajamas', 'sleepwear', 'nightwear', 'robe',
  'socks', 'stockings',
  // Shoes
  'shoes', 'boots', 'sneakers', 'trainers', 'sandals', 'slippers',
  'heels', 'pumps', 'flats', 'loafers', 'moccasins',
  // Bags
  'bag', 'handbag', 'backpack', 'tote', 'purse', 'wallet',
  'crossbody', 'clutch', 'satchel',
  // Accessories
  'belt', 'hat', 'cap', 'beanie', 'scarf', 'gloves',
  'watch', 'sunglasses', 'glasses',
  // Jewelry
  'necklace', 'bracelet', 'earrings', 'ring', 'jewelry',
  // Electronics
  'phone', 'case', 'charger', 'cable', 'headphones', 'earbuds',
  'speaker', 'power bank',
  // Home
  'pillow', 'blanket', 'towel', 'rug', 'curtain', 'lamp',
  'mug', 'cup', 'plate', 'bowl',
  // Beauty
  'lipstick', 'mascara', 'foundation', 'perfume', 'cream', 'serum',
  'shampoo', 'brush',
  // Sports
  'swimsuit', 'bikini', 'swimwear',
]);

// Extract keywords with translations
function extractKeywords(productName: string, description?: string): { 
  original: string[]; 
  translated: string[];
  genderKeywords: string[];
  productTypeKeywords: string[];
} {
  const text = normalizeText((productName || '') + ' ' + (description || ''));
  const originalWords = text.split(' ').filter(word => word.length > 2);
  
  const translatedWords: string[] = [];
  const genderKeywords: string[] = [];
  const productTypeKeywords: string[] = [];
  
  for (const word of originalWords) {
    const translations = translateToEnglish(word);
    translatedWords.push(...translations);
    
    // Identify gender keywords
    for (const t of translations) {
      if (GENDER_KEYWORDS.has(t.toLowerCase())) {
        genderKeywords.push(t.toLowerCase());
      }
      if (PRODUCT_TYPE_KEYWORDS.has(t.toLowerCase())) {
        productTypeKeywords.push(t.toLowerCase());
      }
    }
  }
  
  return {
    original: originalWords,
    translated: [...new Set(translatedWords)],
    genderKeywords: [...new Set(genderKeywords)],
    productTypeKeywords: [...new Set(productTypeKeywords)],
  };
}

// Calculate match score with heavy weighting for gender and product type
function calculateMatchScore(
  keywords: { 
    original: string[]; 
    translated: string[];
    genderKeywords: string[];
    productTypeKeywords: string[];
  },
  categoryName: string,
  categoryPath?: string
): { score: number; matchedKeywords: string[]; genderMatch: boolean; productTypeMatch: boolean } {
  const normalizedCategoryName = normalizeText(categoryName);
  const normalizedCategoryPath = categoryPath ? normalizeText(categoryPath) : '';
  const fullCategoryText = normalizedCategoryName + ' ' + normalizedCategoryPath;
  
  const matchedKeywords: string[] = [];
  let score = 0;
  let genderMatch = false;
  let productTypeMatch = false;
  
  // HIGHEST PRIORITY: Check for gender match (25 points bonus)
  for (const gender of keywords.genderKeywords) {
    if (fullCategoryText.includes(gender)) {
      score += 25;
      genderMatch = true;
      matchedKeywords.push(`[GENDER:${gender}]`);
    }
  }
  
  // If product has gender keywords but category doesn't match, penalize heavily
  if (keywords.genderKeywords.length > 0 && !genderMatch) {
    // Check if it's a gendered category that doesn't match our gender
    const categoryHasGender = Array.from(GENDER_KEYWORDS).some(g => fullCategoryText.includes(g));
    if (categoryHasGender) {
      score -= 50; // Heavy penalty for wrong gender
    }
  }
  
  // HIGH PRIORITY: Check for product type match (20 points in name, 15 in path)
  for (const productType of keywords.productTypeKeywords) {
    if (normalizedCategoryName.includes(productType)) {
      score += 20;
      productTypeMatch = true;
      matchedKeywords.push(`[TYPE:${productType}]`);
    } else if (normalizedCategoryPath.includes(productType)) {
      score += 15;
      productTypeMatch = true;
      matchedKeywords.push(`[TYPE:${productType}]`);
    }
  }
  
  // Regular keyword matching
  for (const keyword of keywords.translated) {
    const normalizedKeyword = normalizeText(keyword);
    
    // Skip if already counted as gender or product type
    if (GENDER_KEYWORDS.has(normalizedKeyword) || PRODUCT_TYPE_KEYWORDS.has(normalizedKeyword)) {
      continue;
    }
    
    if (normalizedCategoryName.includes(normalizedKeyword) && normalizedKeyword.length > 3) {
      score += 10;
      matchedKeywords.push(keyword);
      continue;
    }
    
    if (normalizedCategoryPath.includes(normalizedKeyword) && normalizedKeyword.length > 3) {
      score += 5;
      matchedKeywords.push(keyword);
      continue;
    }
    
    if (fullCategoryText.includes(normalizedKeyword) && normalizedKeyword.length > 3) {
      score += 3;
      matchedKeywords.push(keyword);
    }
  }
  
  // Bonus for exact word match in category name
  const categoryWords = normalizedCategoryName.split(' ');
  for (const catWord of categoryWords) {
    if (catWord.length > 3) {
      // Extra bonus if it's a product type word
      if (keywords.productTypeKeywords.includes(catWord)) {
        score += 15;
      } else if (keywords.translated.some(k => normalizeText(k) === catWord)) {
        score += 8;
      }
    }
  }
  
  return { score, matchedKeywords: [...new Set(matchedKeywords)], genderMatch, productTypeMatch };
}

function getConfidence(score: number, keywordCount: number, genderMatch: boolean, productTypeMatch: boolean): 'high' | 'medium' | 'low' {
  // High confidence if both gender and product type match
  if (genderMatch && productTypeMatch && score >= 40) return 'high';
  if (productTypeMatch && score >= 35) return 'high';
  
  const normalizedScore = score / Math.max(keywordCount, 1);
  if (normalizedScore >= 10 || score >= 50) return 'high';
  if (normalizedScore >= 5 || score >= 25) return 'medium';
  return 'low';
}

export async function matchTemuCategory(
  productName: string,
  productDescription?: string,
  maxResults: number = 10
): Promise<TemuMatchResult[]> {
  const keywords = extractKeywords(productName, productDescription);
  
  if (keywords.original.length === 0) {
    console.log('[TemuMatcher] No keywords extracted');
    return [];
  }
  
  console.log('[TemuMatcher] Product:', productName);
  console.log('[TemuMatcher] Original:', keywords.original);
  console.log('[TemuMatcher] Translated:', keywords.translated.slice(0, 20));
  console.log('[TemuMatcher] Gender keywords:', keywords.genderKeywords);
  console.log('[TemuMatcher] Product type keywords:', keywords.productTypeKeywords);
  
  const allCategories = temuCache.getLeafCategories();
  
  if (allCategories.length === 0) {
    console.log('[TemuMatcher] No categories, fetching...');
    await temuCache.prefetchCategories();
    return matchTemuCategory(productName, productDescription, maxResults);
  }
  
  const results: TemuMatchResult[] = [];
  
  for (const category of allCategories) {
    const { score, matchedKeywords, genderMatch, productTypeMatch } = calculateMatchScore(
      keywords,
      category.catName,
      category.pathString || category.path?.join(' > ')
    );
    
    if (score > 0) {
      results.push({
        category,
        score,
        confidence: getConfidence(score, keywords.translated.length, genderMatch, productTypeMatch),
        matchedKeywords,
      });
    }
  }
  
  results.sort((a, b) => b.score - a.score);
  const topResults = results.slice(0, maxResults);
  
  console.log('[TemuMatcher] Top matches:', topResults.map(r => ({
    name: r.category.catName,
    score: r.score,
    confidence: r.confidence,
    keywords: r.matchedKeywords.slice(0, 5),
  })));
  
  return topResults;
}

export async function searchTemuCategories(
  query: string,
  maxResults: number = 20
): Promise<TemuCategory[]> {
  return temuCache.searchCategories(query, maxResults);
}

export function getTemuCategorySuggestions(productType: string): string[] {
  const normalized = normalizeText(productType);
  return translateToEnglish(normalized);
}

const temuCategoryMatcher = {
  matchTemuCategory,
  searchTemuCategories,
  getTemuCategorySuggestions,
};

export default temuCategoryMatcher;
