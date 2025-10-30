'use client';

import { useState, useRef, useEffect } from 'react';
import TrendyolCategorySelector from './TrendyolCategorySelector';
import { supabase } from '@/lib/supabaseClient';

export default function AddProductForm() {
  // Veritabanından kategorileri çek
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [formData, setFormData] = useState({
    // PRODUCTS tablosu alanları (VERİTABANI KOLONLARI)
    categoryId: '', // category_id (UUID)
    categorySlug: '', // Frontend'de kullanmak için (electronics/clothing)
    masterSku: '', // master_sku
    title: '', // title
    description: '', // description
    brand: '', // brand
    baseCostPrice: '', // base_cost_price
    productStatus: 'draft', // status: draft|active|inactive
    
    // PRODUCT_VARIANTS tablosu alanları (VERİTABANI KOLONLARI)
    variantSku: '', // master_sku (varyant için)
    barcode: '', // barcode
    costPrice: '', // cost_price (satış fiyatı)
    weightGrams: '', // weight_grams
    lengthCm: '', // length_cm
    widthCm: '', // width_cm
    heightCm: '', // height_cm
    variantStatus: 'active', // status: active|inactive|out_of_stock
    stockQuantity: '', // stock_quantity
  });

  // Kategorileri yükle
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug')
          .eq('level', 0) // Sadece ana kategoriler (Elektronik, Giyim)
          .order('sort_order');

        if (error) throw error;
        
        setCategories(data || []);
      } catch (error) {
        console.error('Kategoriler yüklenemedi:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const [trendyolCategoryData, setTrendyolCategoryData] = useState<{
    trendyolCategoryId: string;
    trendyolCategoryName: string;
    trendyolCategoryPath: string;
  } | null>(null);

  const [showTrendyolSelector, setShowTrendyolSelector] = useState(false);
  
  // Kategori özelliklerini tutacak state
  const [categoryAttributes, setCategoryAttributes] = useState<any[]>([]);
  const [attributeValues, setAttributeValues] = useState<{ [key: string]: string }>({});

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    console.log('=== FORM GÖNDERİLİYOR ===');
    console.log('Form Data:', formData);
    console.log('Attribute Values:', attributeValues);
    console.log('Trendyol Category:', trendyolCategoryData);
    console.log('Images:', imageFiles.length);

    try {
      // Payload hazırla
      const payload = {
        // Products tablosu (VERİTABANI KOLONLARI)
        categoryId: formData.categoryId,
        masterSku: formData.masterSku,
        title: formData.title,
        description: formData.description,
        brand: formData.brand,
        baseCostPrice: formData.baseCostPrice,
        productStatus: formData.productStatus,
        
        // Product_variants tablosu (VERİTABANI KOLONLARI)
        variantSku: formData.variantSku,
        barcode: formData.barcode,
        costPrice: formData.costPrice,
        weightGrams: formData.weightGrams,
        lengthCm: formData.lengthCm,
        widthCm: formData.widthCm,
        heightCm: formData.heightCm,
        variantStatus: formData.variantStatus,
        stockQuantity: formData.stockQuantity,
        
        // Attributes (variant_attributes tablosu)
        attributeValues: attributeValues,
        
        // Trendyol kategori mapping
        trendyolCategoryData: trendyolCategoryData,
      };

      console.log('=== API İSTEĞİ GÖNDERİLİYOR ===');
      const response = await fetch('/api/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ürün kaydedilemedi');
      }

      console.log('✅ ÜRÜN BAŞARIYLA KAYDEDİLDİ:', result);
      
      setSubmitSuccess(true);
      
      // Form'u resetle
      setFormData({
        categoryId: '',
        categorySlug: '',
        masterSku: '',
        title: '',
        description: '',
        brand: '',
        baseCostPrice: '',
        productStatus: 'draft',
        variantSku: '',
        barcode: '',
        costPrice: '',
        weightGrams: '',
        lengthCm: '',
        widthCm: '',
        heightCm: '',
        variantStatus: 'active',
        stockQuantity: '',
      });
      
      setAttributeValues({});
      setTrendyolCategoryData(null);
      setCategoryAttributes([]);
      setSelectedImages([]);
      setImageFiles([]);
      
      // 3 saniye sonra success mesajını kaldır
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);

    } catch (error: any) {
      console.error('❌ HATA:', error);
      setSubmitError(error.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrendyolCategorySelect = async (data: {
    trendyolCategoryId: string;
    trendyolCategoryName: string;
    trendyolCategoryPath: string;
  }) => {
    setTrendyolCategoryData(data);
    setShowTrendyolSelector(false);
    
    // Kategori özellikleri için mock data (Cep Telefonu örneği)
    // Gerçek uygulamada API'den çekilecek
    if (data.trendyolCategoryId === '3') { // Cep Telefonu
      const mockAttributes = [
        { id: 'front_camera', name: 'Ön Kamera Çözünürlüğü', required: true, type: 'text', placeholder: 'örn. 13 MP' },
        { id: 'warranty', name: 'Garanti Tipi', required: true, type: 'select', options: ['Xiaomi Türkiye Garantili', 'Apple Türkiye Garantili', 'Samsung Türkiye Garantili', 'Resmi İthalatçı Garantili'] },
        { id: 'storage', name: 'Dahili Hafıza', required: true, type: 'select', options: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'] },
        { id: 'ram', name: 'RAM Kapasitesi', required: true, type: 'select', options: ['4 GB', '6 GB', '8 GB', '12 GB', '16 GB'] },
        { id: 'battery', name: 'Pil Gücü (mAh)', required: true, type: 'text', placeholder: 'örn. 5000' },
        { id: 'network', name: 'Mobil Bağlantı Hızı', required: true, type: 'select', options: ['3G', '4G', '4.5G', '5G'] },
        { id: 'headphone_jack', name: 'Kulaklık Girişi', required: false, type: 'select', options: ['3.5 mm', 'USB-C', 'Yok'] },
        { id: 'face_recognition', name: 'Yüz Tanıma', required: false, type: 'select', options: ['Var', 'Yok'] },
      ];
      setCategoryAttributes(mockAttributes);
      setAttributeValues({});
    } else if (data.trendyolCategoryId === '7') { // Erkek T-Shirt
      const mockAttributes = [
        { id: 'size', name: 'Beden', required: true, type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
        { id: 'color', name: 'Renk', required: true, type: 'text', placeholder: 'örn. Beyaz' },
        { id: 'fabric', name: 'Kumaş Tipi', required: true, type: 'select', options: ['%100 Pamuk', '%50 Pamuk %50 Polyester', 'Viskon', 'Modal'] },
        { id: 'pattern', name: 'Desen', required: false, type: 'select', options: ['Düz', 'Çizgili', 'Desenli', 'Yazı Baskılı'] },
      ];
      setCategoryAttributes(mockAttributes);
      setAttributeValues({});
    } else {
      setCategoryAttributes([]);
      setAttributeValues({});
    }
  };

  const handleAttributeChange = (attributeId: string, value: string) => {
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: value
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset the input to allow selecting the same file again
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      
      // Validate each file
      for (const file of newFiles) {
        // Check file size (5MB = 5 * 1024 * 1024 bytes)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} dosyası 5MB'dan büyük`);
          continue;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} bir resim dosyası değil`);
          continue;
        }

        // Add to files array
        setImageFiles(prev => [...prev, file]);
        
        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      
      // Validate and add each file
      for (const file of newFiles) {
        // Check file size
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} dosyası 5MB'dan büyük`);
          continue;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} bir resim dosyası değil`);
          continue;
        }

        // Add to files array
        setImageFiles(prev => [...prev, file]);
        
        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Yeni Ürün Ekle</h2>
        <p className="text-gray-600">Ürün bilgilerini girerek yeni bir ürün ekleyin</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Temel Bilgiler
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PRODUCTS TABLOSU ALANLARI */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="örn. iPhone 15 Pro"
              />
            </div>

            <div>
              <label htmlFor="masterSku" className="block text-sm font-medium text-gray-700 mb-2">
                Ana Ürün SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="masterSku"
                name="masterSku"
                value={formData.masterSku}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="örn. PROD-2025-001"
              />
            </div>

            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                Marka <span className="text-red-500">*</span>
              </label>
              <select
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white"
              >
                <option value="">Marka seçin</option>
                <option value="Apple">Apple</option>
                <option value="Samsung">Samsung</option>
                <option value="Xiaomi">Xiaomi</option>
              </select>
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={(e) => {
                  const selectedCategory = categories.find(cat => cat.id === e.target.value);
                  setFormData({
                    ...formData,
                    categoryId: e.target.value,
                    categorySlug: selectedCategory?.slug || '',
                  });
                }}
                required
                disabled={isLoadingCategories}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {isLoadingCategories ? 'Kategoriler yükleniyor...' : 'Kategori seçin'}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && !isLoadingCategories && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ Kategoriler bulunamadı. Lütfen önce kategorileri oluşturun.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="productStatus" className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Durumu <span className="text-red-500">*</span>
              </label>
              <select
                id="productStatus"
                name="productStatus"
                value={formData.productStatus}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white"
              >
                <option value="draft">Taslak</option>
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>
            </div>

            {/* PRODUCT_VARIANTS TABLOSU ALANLARI */}
            <div className="md:col-span-2 border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Varyant Bilgileri</h4>
            </div>

            <div>
              <label htmlFor="variantSku" className="block text-sm font-medium text-gray-700 mb-2">
                Varyant SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="variantSku"
                name="variantSku"
                value={formData.variantSku}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="örn. VAR-2025-001"
              />
            </div>

            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                Barkod (GTIN/EAN) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="örn. 8690123456789"
              />
            </div>

            <div>
              <label htmlFor="variantStatus" className="block text-sm font-medium text-gray-700 mb-2">
                Varyant Durumu <span className="text-red-500">*</span>
              </label>
              <select
                id="variantStatus"
                name="variantStatus"
                value={formData.variantStatus}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
                <option value="out_of_stock">Stokta Yok</option>
              </select>
            </div>
          </div>
        </div>

        {/* Fiyatlandırma Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Fiyatlandırma
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="baseCostPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Temel Maliyet Fiyatı (₺) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="baseCostPrice"
                name="baseCostPrice"
                value={formData.baseCostPrice}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="250.99"
              />
              <p className="text-xs text-gray-500 mt-1">Ana ürün maliyet fiyatı (products.base_cost_price)</p>
            </div>

            <div>
              <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Varyant Satış Fiyatı (₺) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="costPrice"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="120.99"
              />
              <p className="text-xs text-gray-500 mt-1">Varyant satış fiyatı (product_variants.cost_price)</p>
            </div>
          </div>
        </div>

        {/* Stok & Boyutlar Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            Stok & Boyutlar
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                Stok Miktarı <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="stockQuantity"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="100"
              />
            </div>

            <div>
              <label htmlFor="weightGrams" className="block text-sm font-medium text-gray-700 mb-2">
                Ağırlık (gram) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="weightGrams"
                name="weightGrams"
                value={formData.weightGrams}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="örn. 500"
              />
            </div>

            <div>
              <label htmlFor="lengthCm" className="block text-sm font-medium text-gray-700 mb-2">
                Uzunluk (cm)
              </label>
              <input
                type="number"
                id="lengthCm"
                name="lengthCm"
                value={formData.lengthCm}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="örn. 15.5"
              />
            </div>

            <div>
              <label htmlFor="widthCm" className="block text-sm font-medium text-gray-700 mb-2">
                Genişlik (cm)
              </label>
              <input
                type="number"
                id="widthCm"
                name="widthCm"
                value={formData.widthCm}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="örn. 7.5"
              />
            </div>

            <div>
              <label htmlFor="heightCm" className="block text-sm font-medium text-gray-700 mb-2">
                Yükseklik (cm)
              </label>
              <input
                type="number"
                id="heightCm"
                name="heightCm"
                value={formData.heightCm}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="örn. 0.8"
              />
            </div>
          </div>
        </div>

        {/* Trendyol Category Mapping Section */}
        {formData.categoryId && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              Trendyol Kategori Eşleştirme
            </h3>

            {!showTrendyolSelector && !trendyolCategoryData && (
              <button
                type="button"
                onClick={() => setShowTrendyolSelector(true)}
                className="w-full px-4 py-3 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-orange-600 font-medium"
              >
                + Trendyol Kategorisi Seç
              </button>
            )}

            {trendyolCategoryData && !showTrendyolSelector && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {trendyolCategoryData.trendyolCategoryName}
                    </p>
                    <p className="text-xs text-gray-600">
                      {trendyolCategoryData.trendyolCategoryPath}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTrendyolCategoryData(null);
                      setShowTrendyolSelector(true);
                    }}
                    className="text-sm text-orange-600 hover:underline"
                  >
                    Değiştir
                  </button>
                </div>
              </div>
            )}

            {showTrendyolSelector && (
              <div className="border border-gray-200 rounded-lg p-4">
                <TrendyolCategorySelector
                  aseraiCategoryId={formData.categorySlug || formData.categoryId}
                  onCategorySelect={handleTrendyolCategorySelect}
                />
              </div>
            )}
          </div>
        )}

        {/* Kategori Özellikleri Section */}
        {categoryAttributes.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              Ürün Özellikleri
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({trendyolCategoryData?.trendyolCategoryName})
              </span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categoryAttributes.map((attr) => (
                <div key={attr.id}>
                  <label htmlFor={attr.id} className="block text-sm font-medium text-gray-700 mb-2">
                    {attr.name} {attr.required && <span className="text-red-500">*</span>}
                  </label>
                  
                  {attr.type === 'text' ? (
                    <input
                      type="text"
                      id={attr.id}
                      value={attributeValues[attr.id] || ''}
                      onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                      required={attr.required}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                      placeholder={attr.placeholder}
                    />
                  ) : (
                    <select
                      id={attr.id}
                      value={attributeValues[attr.id] || ''}
                      onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                      required={attr.required}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white"
                    >
                      <option value="">Seçiniz</option>
                      {attr.options.map((option: string) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            {/* Girilen özelliklerin özeti */}
            <div className="mt-6 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
              <h4 className="text-sm font-semibold text-cyan-900 mb-2">Girilen Özellikler:</h4>
              <div className="space-y-1">
                {Object.entries(attributeValues).filter(([_, value]) => value).map(([key, value]) => {
                  const attr = categoryAttributes.find(a => a.id === key);
                  return (
                    <div key={key} className="text-sm text-gray-700">
                      <span className="font-medium">{attr?.name}:</span> {value}
                    </div>
                  );
                })}
                {Object.keys(attributeValues).filter(key => attributeValues[key]).length === 0 && (
                  <p className="text-sm text-gray-500 italic">Henüz özellik girilmedi</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Description Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            Açıklama
          </h3>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Ürün Açıklaması
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
              placeholder="Ürün hakkında detaylı bilgi girin..."
            />
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            Görsel
          </h3>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />

          {selectedImages.length === 0 ? (
            <div
              onClick={handleImageClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-gray-50 hover:bg-indigo-50"
            >
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium text-indigo-600">Dosya yüklemek için tıklayın</span> veya sürükleyip bırakın
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF (Max. 5MB) - Birden fazla resim seçebilirsiniz</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Grid Preview */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50 aspect-square">
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Remove button overlay */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {/* Image info badge */}
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {index + 1}/{selectedImages.length}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add more images button */}
              <button
                type="button"
                onClick={handleImageClick}
                className="w-full px-4 py-3 border-2 border-dashed border-indigo-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-indigo-600 font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Daha Fazla Resim Ekle
              </button>

              {/* Images summary */}
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedImages.length} resim yüklendi
                      </p>
                      <p className="text-xs text-gray-500">
                        Toplam: {(imageFiles.reduce((acc, file) => acc + file.size, 0) / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImages([]);
                      setImageFiles([]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium text-red-600"
                  >
                    Tümünü Kaldır
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Success/Error Messages */}
        {submitSuccess && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-green-900 mb-1">Ürün başarıyla kaydedildi!</h4>
              <p className="text-sm text-green-700">Ürün veritabanına başarıyla eklendi. Form temizlendi, yeni ürün ekleyebilirsiniz.</p>
            </div>
          </div>
        )}

        {submitError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-red-900 mb-1">Hata oluştu</h4>
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-lg font-medium shadow-lg transition-all flex items-center gap-2 ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:shadow-xl'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Kaydediliyor...
              </>
            ) : (
              'Ürünü Kaydet'
            )}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              if (confirm('Formu temizlemek istediğinize emin misiniz?')) {
                window.location.reload();
              }
            }}
            className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}
