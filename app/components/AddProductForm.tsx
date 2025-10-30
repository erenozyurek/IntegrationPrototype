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
    productBarcode: '', // Ürün barkodu (genel)
    title: '', // title
    description: '', // description
    brand: '', // brand
    color: '', // Renk - genel ürün özelliği
    baseCostPrice: '', // base_cost_price
    productStatus: 'draft', // status: draft|active|inactive
    stockQuantity: '', // Genel stok miktarı
    
    // Temel boyut/ağırlık bilgileri (tek varyant yoksa)
    weightGrams: '', // weight_grams
    lengthCm: '', // length_cm
    widthCm: '', // width_cm
    heightCm: '', // height_cm
  });

  // Varyant listesi - Renk, Beden, Depolama, Stok ve Fiyat
  const [variants, setVariants] = useState<Array<{
    id: string; // Frontend için unique id
    variantSku: string; // master_sku (otomatik generate veya manuel)
    barcode: string; // barcode (otomatik generate veya manuel)
    color: string; // Renk
    size: string; // Beden (S, M, L, XL vb.)
    storage: string; // Depolama (128GB, 256GB vb.)
    stockQuantity: string; // Stok miktarı
    costPrice: string; // Satış fiyatı
    status: 'active' | 'inactive' | 'out_of_stock';
  }>>([]);

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

  // NOT: Teknik özellikler sadece Trendyol kategorisi seçildiğinde yüklenecek
  // (handleTrendyolCategorySelect içinde)

  const [trendyolCategoryData, setTrendyolCategoryData] = useState<{
    trendyolCategoryId: string;
    trendyolCategoryName: string;
    trendyolCategoryPath: string;
  } | null>(null);

  const [showTrendyolSelector, setShowTrendyolSelector] = useState(false);
  
  // Kategori özelliklerini tutacak state
  const [categoryAttributes, setCategoryAttributes] = useState<any[]>([]);
  const [attributeValues, setAttributeValues] = useState<{ [key: string]: string }>({});

  // Debug: categoryAttributes değişimini izle
  useEffect(() => {
    console.log('📊 categoryAttributes güncellendi:', categoryAttributes.length, 'özellik');
    console.log('📋 Özellikler:', categoryAttributes);
  }, [categoryAttributes]);

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
      // Varyantları hazırla - title, master_sku, barcode ekle
      const preparedVariants = variants.map((variant) => ({
        master_sku: variant.variantSku,
        barcode: variant.barcode,
        title: `${formData.title} - ${[variant.color, variant.size, variant.storage].filter(Boolean).join(' ')}`, // Otomatik title
        cost_price: parseFloat(variant.costPrice) || 0,
        stock_quantity: parseInt(variant.stockQuantity) || 0,
        status: variant.status,
        // Varyant için özel attribute'lar
        attributes: {
          color: variant.color,
          size: variant.size,
          storage: variant.storage,
        }
      }));

      // Payload hazırla
      const payload = {
        // Products tablosu (VERİTABANI KOLONLARI)
        categoryId: formData.categoryId,
        masterSku: formData.masterSku,
        title: formData.title,
        description: formData.description,
        brand: formData.brand,
        color: formData.color,
        baseCostPrice: parseFloat(formData.baseCostPrice) || 0,
        productStatus: formData.productStatus,
        weightGrams: parseFloat(formData.weightGrams) || null,
        lengthCm: parseFloat(formData.lengthCm) || null,
        widthCm: parseFloat(formData.widthCm) || null,
        heightCm: parseFloat(formData.heightCm) || null,
        
        // Varyantlar array (hazırlanmış)
        variants: preparedVariants,
        
        // Attributes (product_attributes tablosu - kategori özellikleri)
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
      console.log('🖼️ imageFiles.length:', imageFiles.length);
      console.log('🆔 result.data?.product?.id:', result.data?.product?.id);
      
      // Resim yükleme (eğer resim varsa)
      if (imageFiles.length > 0 && result.data?.product?.id) {
        console.log('📸 Resimler yükleniyor...');
        
        try {
          const formData = new FormData();
          imageFiles.forEach(file => {
            formData.append('files', file);
          });

          const uploadResponse = await fetch('/api/v1/upload/image', {
            method: 'PUT', // Çoklu yükleme için PUT
            body: formData,
          });

          const uploadResult = await uploadResponse.json();

          if (uploadResult.success && uploadResult.files && uploadResult.files.length > 0) {
            console.log('✅ Resimler yüklendi:', uploadResult.files);
            // Resimleri product_images tablosuna kaydet
            // Resimleri product_images tablosuna kaydet
            const productId = result.data.product.id;
            const variantId = result.data.variants?.[0]?.id; // İlk varyant
            
            console.log('📦 Product ID:', productId);
            console.log('🏷️ Variant ID:', variantId);
            console.log('📸 Toplam resim:', uploadResult.files.length);
            
            for (let i = 0; i < uploadResult.files.length; i++) {
              const file = uploadResult.files[i];
              
              console.log('💾 Resim kaydediliyor:', {
                product_id: productId,
                variant_id: variantId,
                url: file.url,
                path: file.path,
                is_primary: i === 0,
                sort_order: i,
              });
              
              const { data: insertedImage, error: imageError } = await supabase
                .from('product_images')
                .insert({
                  product_id: productId,
                  variant_id: variantId,
                  url: file.url,
                  is_primary: i === 0, // İlk resim primary
                  sort_order: i,
                })
                .select();

              if (imageError) {
                console.error('❌ Resim kaydedilemedi:', imageError);
                console.error('Hata detayı:', JSON.stringify(imageError, null, 2));
              } else {
                console.log('✅ Resim kaydedildi:', insertedImage);
              }
            }
            
            console.log('✅ Tüm resimler veritabanına kaydedildi!');
          }
        } catch (uploadError) {
          console.error('❌ Resim yükleme hatası:', uploadError);
          // Resim hatası ürün kaydını engellemesin
        }
      }
      
      setSubmitSuccess(true);
      
      // Form'u resetle
      setFormData({
        categoryId: '',
        categorySlug: '',
        masterSku: '',
        productBarcode: '',
        title: '',
        description: '',
        brand: '',
        color: '',
        baseCostPrice: '',
        productStatus: 'draft',
        stockQuantity: '',
        weightGrams: '',
        lengthCm: '',
        widthCm: '',
        heightCm: '',
      });
      
      setVariants([]);
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
    console.log('🔍 Trendyol Kategori Seçildi:', data);
    setTrendyolCategoryData(data);
    setShowTrendyolSelector(false);
    
    // Cep Telefonu seçildiğinde teknik özellikleri yükle
    if (data.trendyolCategoryId === '3') { // Cep Telefonu
      console.log('✅ Cep Telefonu - Teknik özellikler yükleniyor...');
      const mockAttributes = [
        // Kamera Özellikleri
        { id: 'front_camera', name: 'Ön Kamera Çözünürlüğü', required: true, type: 'select', options: ['5 - 8 MP', '8 - 13 MP', '13 - 20 MP', '20 - 40 MP', '40 - 60 MP'], category: 'Kamera' },
        { id: 'camera_resolution', name: 'Kamera Çözünürlüğü', required: true, type: 'text', placeholder: 'örn. 50 MP + 8 MP + 2 MP', category: 'Kamera' },
        
        // Donanım Özellikleri
        { id: 'ram', name: 'RAM Kapasitesi', required: true, type: 'select', options: ['2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB'], category: 'Donanım' },
        { id: 'storage', name: 'Dahili Hafıza', required: true, type: 'select', options: ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'], category: 'Donanım' },
        
        // Batarya
        { id: 'battery_capacity', name: 'Batarya Kapasitesi (mAh)', required: true, type: 'text', placeholder: 'örn. 5000', category: 'Batarya' },
        
        // Bağlantı
        { id: 'network', name: 'Mobil Bağlantı Hızı', required: true, type: 'select', options: ['3G', '4G', '4.5G', '5G'], category: 'Bağlantı' },
        
        // Garanti
        { id: 'warranty', name: 'Garanti Tipi', required: true, type: 'select', options: ['Xiaomi Türkiye Garantili', 'Apple Türkiye Garantili', 'Samsung Türkiye Garantili', 'Resmi İthalatçı Garantili', 'Distribütör Garantili'], category: 'Garanti' },
        
        // Ek Özellikler
        { id: 'headphone_jack', name: 'Kulaklık Girişi', required: false, type: 'select', options: ['3.5 mm', 'USB-C', 'Lightning', 'Yok'], category: 'Diğer' },
        { id: 'face_recognition', name: 'Yüz Tanıma', required: false, type: 'select', options: ['Var', 'Yok'], category: 'Diğer' },
      ];
      setCategoryAttributes(mockAttributes);
      console.log('✅ Teknik özellikler yüklendi! Toplam:', mockAttributes.length, 'özellik');
    } else if (data.trendyolCategoryId === '7') { // Erkek T-Shirt (örnek)
      console.log('✅ Erkek T-Shirt - Teknik özellikler yükleniyor...');
      const mockAttributes = [
        { id: 'size', name: 'Beden', required: true, type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'], category: 'Beden' },
        { id: 'fabric', name: 'Kumaş Tipi', required: true, type: 'select', options: ['%100 Pamuk', '%50 Pamuk %50 Polyester', 'Viskon', 'Modal', 'Polyester'], category: 'Kumaş' },
        { id: 'pattern', name: 'Desen', required: false, type: 'select', options: ['Düz', 'Çizgili', 'Desenli', 'Yazı Baskılı', 'Kareli'], category: 'Görünüm' },
      ];
      setCategoryAttributes(mockAttributes);
      console.log('✅ Teknik özellikler yüklendi! Toplam:', mockAttributes.length, 'özellik');
    } else {
      console.log('⚠️ Bu kategori için henüz teknik özellik tanımlanmamış:', data.trendyolCategoryName);
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
        {/* 1. TEMEL BİLGİLER */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span>1. TEMEL BİLGİLER</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PRODUCTS TABLOSU ALANLARI */}
            
            {/* 1. KATEGORİ - İLK SIRA */}
            <div className="md:col-span-2">
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={(e) => {
                  const selectedCategory = categories.find(cat => cat.id === e.target.value);
                  const newSlug = selectedCategory?.slug || '';
                  console.log('📦 Kategori seçildi:', selectedCategory?.name, '| Slug:', newSlug);
                  setFormData({
                    ...formData,
                    categoryId: e.target.value,
                    categorySlug: newSlug,
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

            {/* TRENDYOL KATEGORİ EŞLEŞTİRME - KATEGORİ SEÇİLDİKTEN SONRA */}
            {formData.categoryId && (
              <div className="md:col-span-2 mt-4 pt-4 border-t border-indigo-100">
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-indigo-900">🔗 Trendyol Kategori Eşleştirme</h4>
                    <button
                      type="button"
                      onClick={() => setShowTrendyolSelector(!showTrendyolSelector)}
                      className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      {showTrendyolSelector ? 'Gizle' : 'Eşleştir'}
                    </button>
                  </div>
                  {trendyolCategoryData && (
                    <div className="text-xs text-indigo-700 bg-white rounded p-2">
                      <strong>Seçili:</strong> {trendyolCategoryData.trendyolCategoryName}
                    </div>
                  )}
                </div>
                
                {showTrendyolSelector && (
                  <div className="mt-4">
                    <TrendyolCategorySelector
                      aseraiCategoryId={formData.categorySlug}
                      onCategorySelect={handleTrendyolCategorySelect}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. ÜRÜN ÖZELLİKLERİ */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <span>2. ÜRÜN ÖZELLİKLERİ</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ÜRÜN ADI */}
            <div className="md:col-span-2">
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                placeholder={
                  (formData.categorySlug === 'electronics' || formData.categorySlug === 'elektronik')
                    ? 'örn. iPhone 15 Pro'
                    : (formData.categorySlug === 'clothing' || formData.categorySlug === 'giyim')
                    ? 'örn. Erkek Tişört Slim Fit'
                    : 'Ürün adını girin'
                }
              />
            </div>

            {/* MARKA */}
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
              >
                <option value="">Marka seçin</option>
                {(formData.categorySlug === 'electronics' || formData.categorySlug === 'elektronik') ? (
                  <>
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Xiaomi">Xiaomi</option>
                    <option value="Huawei">Huawei</option>
                    <option value="Oppo">Oppo</option>
                    <option value="Realme">Realme</option>
                    <option value="OnePlus">OnePlus</option>
                  </>
                ) : (formData.categorySlug === 'clothing' || formData.categorySlug === 'giyim') ? (
                  <>
                    <option value="Koton">Koton</option>
                    <option value="Defacto">Defacto</option>
                    <option value="LC Waikiki">LC Waikiki</option>
                    <option value="Mavi">Mavi</option>
                    <option value="Bershka">Bershka</option>
                    <option value="Pull & Bear">Pull & Bear</option>
                    <option value="Zara">Zara</option>
                    <option value="H&M">H&M</option>
                    <option value="Adidas">Adidas</option>
                    <option value="Nike">Nike</option>
                    <option value="Puma">Puma</option>
                  </>
                ) : (
                  <option value="Diğer">Diğer</option>
                )}
              </select>
            </div>

            {/* RENK */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                Renk
              </label>
              <input
                type="text"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                placeholder="örn. Mavi, Kırmızı, Siyah"
              />
              <p className="text-xs text-gray-500 mt-1">Temel ürün rengi (opsiyonel)</p>
            </div>

            {/* ANA ÜRÜN SKU */}
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                placeholder="örn. PROD-2025-001"
              />
            </div>

            {/* ÜRÜN BARKODU */}
            <div>
              <label htmlFor="productBarcode" className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Barkodu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="productBarcode"
                name="productBarcode"
                value={formData.productBarcode}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none font-mono"
                placeholder="örn. 8691234567890"
                maxLength={13}
              />
              <p className="text-xs text-gray-500 mt-1">13 haneli barkod numarası</p>
            </div>

            {/* AÇIKLAMA */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Açıklaması
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none resize-none"
                placeholder="Ürün detaylarını buraya yazın..."
              />
            </div>

            {/* ÜRÜN DURUMU */}
            <div className="md:col-span-2">
              <label htmlFor="productStatus" className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Durumu <span className="text-red-500">*</span>
              </label>
              <select
                id="productStatus"
                name="productStatus"
                value={formData.productStatus}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
              >
                <option value="draft">Taslak</option>
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2.2. ÜRÜN STOK BİLGİSİ (Kategori bazlı - Kamera, RAM, Depolama vb.) */}
        {categoryAttributes.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <span>2.2. ÜRÜN ÖZELLİKLERİ</span>
              <span className="text-sm font-normal text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full">
                {trendyolCategoryData?.trendyolCategoryName 
                  ? `📱 ${trendyolCategoryData.trendyolCategoryName} Özellikleri`
                  : formData.categorySlug === 'electronics' ? '📱 Elektronik Ürün Özellikleri' 
                  : formData.categorySlug === 'clothing' ? '👕 Giyim Özellikleri' 
                  : 'Kategori özellikleri'}
              </span>
            </h3>
            
            {/* Kategorilere göre gruplandırılmış özellikler */}
            {(() => {
              const categories = Array.from(new Set(categoryAttributes.map((attr: any) => attr.category || 'Genel')));
              return categories.map((category) => {
                const categoryAttrs = categoryAttributes.filter((attr: any) => (attr.category || 'Genel') === category);
                return (
                  <div key={category} className="mb-6 last:mb-0">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-cyan-500 rounded-full"></span>
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryAttrs.map((attr: any) => (
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
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
                              placeholder={attr.placeholder}
                            />
                          ) : (
                            <select
                              id={attr.id}
                              value={attributeValues[attr.id] || ''}
                              onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                              required={attr.required}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none bg-white"
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
                  </div>
                );
              });
            })()}

            {/* Girilen özelliklerin özeti */}
            <div className="mt-6 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
              <h4 className="text-sm font-semibold text-cyan-900 mb-2">📋 Girilen Teknik Özellikler:</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(attributeValues).filter(([_, value]) => value).map(([key, value]) => {
                  const attr = categoryAttributes.find(a => a.id === key);
                  return (
                    <div key={key} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-cyan-600">•</span>
                      <span><span className="font-medium">{attr?.name}:</span> {value}</span>
                    </div>
                  );
                })}
                {Object.keys(attributeValues).filter(key => attributeValues[key]).length === 0 && (
                  <p className="text-sm text-gray-500 italic col-span-2">Henüz teknik özellik girilmedi</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. FİYATLANDIRMA */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span>3. FİYATLANDIRMA</span>
          </h3>

          <p className="text-sm text-gray-600 mb-4">
            Temel maliyet fiyatı. Her varyant için farklı satış fiyatı, varyant tablosunda belirlenir.
          </p>
          
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                placeholder="250.99"
              />
              <p className="text-xs text-gray-500 mt-1">Ana ürün maliyet fiyatı - varyantlar için temel referans</p>
            </div>
          </div>
        </div>

        {/* 4. STOK VE BOYUTLAR */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span>4. STOK VE BOYUTLAR</span>
          </h3>

          <p className="text-sm text-gray-600 mb-6">
            Genel ürün stok miktarı ve boyutları. Varyantlar için farklı değerler gerekiyorsa, varyant tablosunda belirtin.
          </p>

          {/* Stok Miktarı */}
          <div className="mb-6">
            <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-2">
              📦 Stok Miktarı
            </label>
            <input
              type="number"
              id="stockQuantity"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              min="0"
              className="w-full md:w-1/2 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="örn. 100"
            />
            <p className="text-xs text-gray-500 mt-1">Genel stok miktarı. Varyantlar varsa her varyant için ayrı stok girin.</p>
          </div>

          {/* Boyut Bilgileri */}
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
            Ürün Boyutları
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="weightGrams" className="block text-sm font-medium text-gray-700 mb-2">
                Ağırlık (gram)
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="örn. 0.8"
              />
            </div>
          </div>
        </div>

        {/* 5. VARYANTLAR (Opsiyonel - Farklı renk ve depolama kombinasyonları) */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-orange-200">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <span>5. VARYANTLAR</span>
              <span className="text-sm font-normal text-orange-600">
                {(formData.categorySlug === 'electronics' || formData.categorySlug === 'elektronik') ? '(Renk & Depolama)' : 
                 (formData.categorySlug === 'clothing' || formData.categorySlug === 'giyim') ? '(Renk & Beden)' : 
                 '(Farklı Seçenekler)'}
              </span>
              <span className="text-sm font-normal text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                {variants.length} varyant
              </span>
            </h3>
            <button
              type="button"
              onClick={() => {
                const timestamp = Date.now();
                const variantNumber = variants.length + 1;
                const newVariant = {
                  id: `variant-${timestamp}`,
                  variantSku: `${formData.masterSku || 'VAR'}-${variantNumber}`,
                  barcode: `869${timestamp.toString().slice(-10)}`, // 13 haneli barkod
                  color: '',
                  size: '',
                  storage: '',
                  stockQuantity: '',
                  costPrice: '',
                  status: 'active' as const,
                };
                setVariants([...variants, newVariant]);
              }}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Varyant Ekle
            </button>
          </div>

          {variants.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-orange-200">
              <svg className="w-16 h-16 mx-auto text-orange-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <p className="text-gray-500 mb-2">Henüz varyant eklenmedi</p>
              <p className="text-sm text-gray-400">
                {(formData.categorySlug === 'electronics' || formData.categorySlug === 'elektronik')
                  ? 'Aynı ürünün farklı renk ve depolama seçenekleri için "Yeni Varyant Ekle" butonuna tıklayın'
                  : 'Aynı ürünün farklı renk ve beden seçenekleri için "Yeni Varyant Ekle" butonuna tıklayın'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                💡 {(formData.categorySlug === 'electronics' || formData.categorySlug === 'elektronik') ? 'Örnek: Mavi 256GB, Siyah 512GB, Gümüş 128GB' : 'Örnek: Kırmızı L, Mavi XL, Beyaz M'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg border border-orange-200">
              <table className="w-full min-w-max">
                <thead className="bg-gradient-to-r from-orange-100 to-amber-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Barkod</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Renk</th>
                    {/* DEBUG: categorySlug = {formData.categorySlug} */}
                    {(formData.categorySlug === 'clothing' || formData.categorySlug === 'giyim') && (
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Beden</th>
                    )}
                    {(formData.categorySlug === 'electronics' || formData.categorySlug === 'elektronik') && (
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Depolama</th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Stok</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Fiyat (₺)</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Durum</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100">
                  {variants.map((variant, index) => (
                    <tr key={variant.id} className="hover:bg-orange-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={variant.variantSku}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[index].variantSku = e.target.value;
                            setVariants(updated);
                          }}
                          className="w-32 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                          placeholder="VAR-001"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={variant.barcode}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[index].barcode = e.target.value;
                            setVariants(updated);
                          }}
                          className="w-36 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                          placeholder="8691234567890"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={variant.color}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[index].color = e.target.value;
                            setVariants(updated);
                          }}
                          className="w-24 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Mavi"
                        />
                      </td>
                      {(formData.categorySlug === 'clothing' || formData.categorySlug === 'giyim') && (
                        <td className="px-4 py-3">
                          <select
                            value={variant.size}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[index].size = e.target.value;
                              setVariants(updated);
                            }}
                            className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                          >
                            <option value="">-</option>
                            <option value="XS">XS</option>
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="XXL">XXL</option>
                            <option value="3XL">3XL</option>
                          </select>
                        </td>
                      )}
                      {(formData.categorySlug === 'electronics' || formData.categorySlug === 'elektronik') && (
                        <td className="px-4 py-3">
                          <select
                            value={variant.storage}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[index].storage = e.target.value;
                              setVariants(updated);
                            }}
                            className="w-24 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                          >
                            <option value="">-</option>
                            <option value="64GB">64GB</option>
                            <option value="128GB">128GB</option>
                            <option value="256GB">256GB</option>
                            <option value="512GB">512GB</option>
                            <option value="1TB">1TB</option>
                          </select>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={variant.stockQuantity}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[index].stockQuantity = e.target.value;
                            setVariants(updated);
                          }}
                          className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="100"
                          min="0"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={variant.costPrice}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[index].costPrice = e.target.value;
                            setVariants(updated);
                          }}
                          className="w-28 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="29999.99"
                          step="0.01"
                          min="0"
                          required
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={variant.status}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[index].status = e.target.value as 'active' | 'inactive' | 'out_of_stock';
                            setVariants(updated);
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        >
                          <option value="active">Aktif</option>
                          <option value="inactive">Pasif</option>
                          <option value="out_of_stock">Stokta Yok</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setVariants(variants.filter((_, i) => i !== index));
                          }}
                          className="inline-flex items-center justify-center p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all"
                          title="Bu varyantı sil"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {variants.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <strong>💡 Varyantlar:</strong> Her varyant aynı ürünün farklı kombinasyonunu temsil eder. 
                    {(formData.categorySlug === 'electronics' || formData.categorySlug === 'elektronik') && <span> Elektronik ürünler için <strong>renk</strong> ve <strong>depolama</strong> seçenekleri.</span>}
                    {(formData.categorySlug === 'clothing' || formData.categorySlug === 'giyim') && <span> Giyim ürünleri için <strong>renk</strong> ve <strong>beden</strong> seçenekleri.</span>}
                    {' '}Teknik özellikler tüm varyantlar için aynıdır.
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div className="text-sm text-amber-800">
                    <strong>🏷️ SKU & Barkod:</strong> Yeni varyant eklendiğinde otomatik olarak üretilir. Gerekirse manuel düzenleyebilirsiniz. Her varyant için <strong>benzersiz</strong> olmalıdır.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 6. GÖRSEL */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span>6. GÖRSEL</span>
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
