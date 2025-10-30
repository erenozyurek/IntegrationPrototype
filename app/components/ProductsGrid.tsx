'use client';

import { useState, useMemo, useRef, useEffect } from 'react';

interface Product {
  id: string;
  master_sku: string;
  title: string;
  description: string;
  brand: string;
  base_cost_price: number;
  status: string;
  created_at: string;
  category: string;
  category_slug: string;
  category_id: string;
  variant_id: string | null;
  sku: string;
  barcode: string;
  price: number;
  stock: number;
  variant_status: string;
  image_url: string | null;
  image_alt: string;
  total_variants: number;
  total_stock: number;
}

interface EditFormData {
  id: string;
  variant_id: string | null;
  title: string;
  description: string;
  base_cost_price: number;
  stock_quantity: number;
  status: string;
}

interface ProductStats {
  total_products: number;
  total_stock: number;
  active_products: number;
  draft_products: number;
  categories: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Variant {
  id: string;
  master_sku: string;
  barcode: string;
  cost_price: number;
  stock_quantity: number;
  status: string;
}

export default function ProductsGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    total_products: 0,
    total_stock: 0,
    active_products: 0,
    draft_products: 0,
    categories: [],
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>({
    id: '',
    variant_id: null,
    title: '',
    description: '',
    base_cost_price: 0,
    stock_quantity: 0,
    status: '',
  });
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch products and categories from API
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/products/list');
      const data = await response.json();

      if (data.success) {
        console.log('📦 Ürünler yüklendi:', data.products.length);
        console.log('🖼️ İlk ürün resmi:', data.products[0]?.image_url);
        console.log('📋 İlk ürün detayı:', data.products[0]);
        setProducts(data.products);
        setStats(data.stats);
      } else {
        setError(data.error || 'Ürünler yüklenemedi');
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Bilinmeyen hata';
      console.error('Ürünler yüklenirken hata:', err);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/categories/list');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Kategoriler yüklenirken hata:', err);
    }
  };

  const handleEditClick = async (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      id: product.id,
      variant_id: product.variant_id,
      title: product.title,
      description: product.description || '',
      base_cost_price: product.base_cost_price,
      stock_quantity: product.stock || 0,
      status: product.status,
    });
    setIsEditModalOpen(true);
    
    // Load variants
    await fetchVariants(product.id);
  };

  const fetchVariants = async (productId: string) => {
    try {
      setIsLoadingVariants(true);
      const response = await fetch(`/api/v1/products/${productId}/variants`);
      const data = await response.json();
      
      if (data.success) {
        setVariants(data.variants);
        // Select first variant by default if exists
        if (data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      }
    } catch (error) {
      console.error('Varyantlar yüklenirken hata:', error);
    } finally {
      setIsLoadingVariants(false);
    }
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingProduct(null);
    setVariants([]);
    setSelectedVariant(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'base_cost_price' || name === 'stock_quantity' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
    // Update form with selected variant data
    setEditForm(prev => ({
      ...prev,
      variant_id: variant.id,
      base_cost_price: variant.cost_price,
      stock_quantity: variant.stock_quantity,
    }));
  };

  const handleMainProductSelect = () => {
    setSelectedVariant(null);
    // Reset form to main product data
    if (editingProduct) {
      setEditForm({
        id: editingProduct.id,
        variant_id: null,
        title: editingProduct.title,
        description: editingProduct.description || '',
        base_cost_price: editingProduct.base_cost_price,
        stock_quantity: editingProduct.stock || 0,
        status: editingProduct.status,
      });
    }
  };

  const handleSaveVariant = async () => {
    if (!selectedVariant) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/variants/${selectedVariant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cost_price: editForm.base_cost_price,
          stock_quantity: editForm.stock_quantity,
          barcode: selectedVariant.barcode,
          status: selectedVariant.status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh variants
        await fetchVariants(editForm.id);
        alert('✅ Varyant başarıyla güncellendi!');
      } else {
        alert('❌ Hata: ' + data.error);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Bilinmeyen hata';
      console.error('Varyant güncelleme hatası:', error);
      alert('❌ Varyant güncellenirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Update product
      const productResponse = await fetch('/api/v1/products/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const productData = await productResponse.json();

      if (productData.success) {
        // Refresh products list
        await fetchProducts();
        handleCloseModal();
        alert('✅ Ürün başarıyla güncellendi!');
      } else {
        alert('❌ Hata: ' + productData.error);
      }
    } catch (error: unknown) {
      console.error('Güncelleme hatası:', error);
      alert('❌ Ürün güncellenirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditImageClick = () => {
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
      editFileInputRef.current.click();
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Dosya boyutu 5MB\'dan küçük olmalıdır');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Lütfen bir resim dosyası seçin');
        return;
      }

      setEditImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveEditImage = () => {
    setEditImagePreview(null);
    setEditImageFile(null);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  // Get unique category names for filter
  const categoryNames = useMemo(() => {
    return ['all', ...stats.categories];
  }, [stats.categories]);

  // Filter products based on selected category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') {
      return products;
    }
    return products.filter(p => p.category === selectedCategory);
  }, [selectedCategory, products]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Ürünler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">❌ Hata: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Ürünler</h2>
        <p className="text-gray-600">Tüm ürünlerinizi görüntüleyin ve yönetin</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600 mb-1">Toplam Ürün</p>
              <p className="text-3xl font-bold text-indigo-900">{stats.total_products}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Toplam Stok</p>
              <p className="text-3xl font-bold text-purple-900">{stats.total_stock}</p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 mb-1">Aktif Ürün</p>
              <p className="text-3xl font-bold text-emerald-900">{stats.active_products}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 mb-1">Kategoriler</p>
              <p className="text-3xl font-bold text-amber-900">{stats.categories.length}</p>
            </div>
            <div className="w-12 h-12 bg-amber-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center gap-4">
          <label htmlFor="category-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Kategori Filtrele:
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
          >
            <option value="all">Tüm Kategoriler ({stats.total_products})</option>
            {stats.categories.map((category) => (
              <option key={category} value={category}>
                {category} ({products.filter(p => p.category === category).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-xl font-medium text-gray-600 mb-2">Henüz ürün bulunmuyor</p>
          <p className="text-gray-500">Yeni ürün eklemek için Ürün Ekle sayfasına gidin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => handleEditClick(product)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-300 transition-all duration-300 overflow-hidden group cursor-pointer"
            >
              {/* Product Image */}
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6 relative overflow-hidden">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.image_alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-6xl">📦</div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {product.status === 'active' ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-200">
                      Aktif
                    </span>
                  ) : product.status === 'draft' ? (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                      Taslak
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full border border-red-200">
                      Pasif
                    </span>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5">
                {/* Category */}
                <p className="text-xs font-medium text-indigo-600 mb-2">{product.category}</p>
                
                {/* Product Name */}
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                  {product.title}
                </h3>
                
                {/* Brand */}
                {product.brand && (
                  <p className="text-sm text-gray-500 mb-3">{product.brand}</p>
                )}

                {/* Price & Stock */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Fiyat</p>
                    <p className="text-xl font-bold text-indigo-600">
                      {product.price.toFixed(2)} ₺
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Stok</p>
                    <p className={`text-xl font-bold ${product.total_stock > 10 ? 'text-green-600' : product.total_stock > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                      {product.total_stock}
                    </p>
                  </div>
                </div>

                {/* SKU & Variants */}
                <div className="border-t border-gray-100 pt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">SKU:</span>
                    <span className="font-mono font-medium text-gray-700">{product.sku}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Varyant:</span>
                    <span className="font-medium text-gray-700">{product.total_variants} adet</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(product);
                    }}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Düzenle
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(product);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-white bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Ürün Düzenle</h3>
                  <p className="text-sm text-gray-500">Ürün bilgilerini güncelleyin</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProduct} className="p-6">
              <div className="space-y-6">
                {/* Product Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Ürün Görseli
                  </label>
                  
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="hidden"
                  />

                  {!editImagePreview ? (
                    <div
                      onClick={handleEditImageClick}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-gray-50 hover:bg-indigo-50"
                    >
                      <div className="flex flex-col items-center">
                        {editingProduct?.image_url && (
                          <div className="mb-3">
                            <img src={editingProduct.image_url} alt={editingProduct.image_alt} className="w-24 h-24 object-cover rounded-lg" />
                            <p className="text-xs text-gray-500 mt-2">Mevcut görsel</p>
                          </div>
                        )}
                        <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium text-indigo-600">Yeni görsel yüklemek için tıklayın</span>
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF (Max. 5MB)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={editImagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{editImageFile?.name}</p>
                            <p className="text-xs text-gray-500">
                              {editImageFile && (editImageFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleEditImageClick}
                            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700"
                          >
                            Değiştir
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveEditImage}
                            className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium text-red-600"
                          >
                            Kaldır
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Name */}
                  <div className="md:col-span-2">
                    <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                      Ürün Adı <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="edit-title"
                      name="title"
                      value={editForm.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label htmlFor="edit-base_cost_price" className="block text-sm font-medium text-gray-700 mb-2">
                      Fiyat (₺) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="edit-base_cost_price"
                      name="base_cost_price"
                      value={editForm.base_cost_price}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label htmlFor="edit-stock_quantity" className="block text-sm font-medium text-gray-700 mb-2">
                      Stok Adedi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="edit-stock_quantity"
                      name="stock_quantity"
                      value={editForm.stock_quantity}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>

                  {/* Status */}
                  <div className="md:col-span-2">
                    <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-2">
                      Durum <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="edit-status"
                      name="status"
                      value={editForm.status}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white"
                    >
                      <option value="">Durum seçin</option>
                      <option value="active">Aktif</option>
                      <option value="draft">Taslak</option>
                      <option value="inactive">Pasif</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                      Açıklama
                    </label>
                    <textarea
                      id="edit-description"
                      name="description"
                      value={editForm.description}
                      onChange={(e) => {
                        const { name, value } = e.target;
                        setEditForm(prev => ({
                          ...prev,
                          [name]: value,
                        }));
                      }}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
                      placeholder="Ürün hakkında detaylı bilgi..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-200 hover:shadow-xl"
                  >
                    Değişiklikleri Kaydet
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
